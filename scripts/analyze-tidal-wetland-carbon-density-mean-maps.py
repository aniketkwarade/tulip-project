#!/usr/bin/env python3
"""Reproduce global tidal-wetland SOC stock and mapped decline from mean maps.

Yang et al. (2026) publish separate 0–30, 30–60 and 60–100 cm mean-density
GeoTIFFs for 2009–2014 (named 2014) and 2015–2020 (named 2020). The period
rasters have aligned 0.0009-degree pixels but slightly different outer bounds.
This script places them on their geographic union grid, sums the three depths,
weights every pixel by spherical surface area and reports the share of mapped
wetland area with any, 5%, 10%, 30%, 50% and 70% decline.

Only the source's mean maps are used. The result is therefore a central map
estimate, not a significance test and not proof of field-observed change at
every declining pixel. The source's lower and upper prediction maps remain
necessary for a conservative uncertainty screen.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
import rasterio
from affine import Affine
from rasterio.windows import Window


LAYERS = ("0030", "3060", "6000")
PERIODS = ("2014", "2020")
EARTH_RADIUS_METRES = 6_371_008.8
# The source GeoTIFFs are scanline-compressed and almost 400,000 columns wide.
# Reading 64 contiguous rows amortizes GDAL call overhead while keeping the six
# concurrently decoded depth/period arrays within a practical memory bound.
CHUNK_ROWS = 64
DECLINE_THRESHOLDS = (0.0, 0.05, 0.10, 0.30, 0.50, 0.70)
ARCHIVE_MD5 = {
    "0030": "e6311d771c3ac1e56ef1a84141b4ead3",
    "3060": "60d87d27f7c909c7d7d7220bbd761179",
    "6000": "fc74268fd405ac0dc6ee56ea63d1fa32",
}


def round_number(value: float, digits: int = 6) -> float:
    return round(float(value), digits)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(4 * 1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def source_path(root: Path, layer: str, period: str) -> Path:
    return root / layer / f"{layer}_ra_parayear_mosaic" / f"{period}_mean.tif"


def aligned_offset(transform: Affine, union_transform: Affine) -> tuple[int, int]:
    column = round((transform.c - union_transform.c) / union_transform.a)
    row = round((transform.f - union_transform.f) / union_transform.e)
    expected_c = union_transform.c + column * union_transform.a
    expected_f = union_transform.f + row * union_transform.e
    if not math.isclose(transform.c, expected_c, abs_tol=1e-8):
        raise RuntimeError(f"column grid is not aligned: {transform.c} versus {expected_c}")
    if not math.isclose(transform.f, expected_f, abs_tol=1e-8):
        raise RuntimeError(f"row grid is not aligned: {transform.f} versus {expected_f}")
    return row, column


def read_period_totals(
    datasets: dict[tuple[str, str], rasterio.DatasetReader],
    union_row_start: int,
    union_row_count: int,
    union_width: int,
    offsets: dict[str, tuple[int, int]],
    executor: ThreadPoolExecutor,
) -> dict[str, np.ndarray]:
    totals = {period: np.full((union_row_count, union_width), np.nan, dtype=np.float32) for period in PERIODS}
    metadata = {}
    futures = {}
    for period in PERIODS:
        reference = datasets[(period, LAYERS[0])]
        row_offset, column_offset = offsets[period]
        source_start = max(0, union_row_start - row_offset)
        source_end = min(reference.height, union_row_start + union_row_count - row_offset)
        if source_start >= source_end:
            continue
        destination_start = source_start + row_offset - union_row_start
        destination_end = destination_start + source_end - source_start
        window = Window(0, source_start, reference.width, source_end - source_start)
        metadata[period] = (destination_start, destination_end, column_offset, reference.width)
        for layer in LAYERS:
            futures[(period, layer)] = executor.submit(
                datasets[(period, layer)].read,
                1,
                window=window,
                masked=False,
            )
    for period, (destination_start, destination_end, column_offset, width) in metadata.items():
        combined = np.zeros((destination_end - destination_start, width), dtype=np.float32)
        valid = np.ones_like(combined, dtype=bool)
        for layer in LAYERS:
            values = futures[(period, layer)].result()
            finite = np.isfinite(values)
            valid &= finite
            combined += np.where(finite, values, 0.0)
        combined[~valid] = np.nan
        totals[period][destination_start:destination_end, column_offset:column_offset + width] = combined
    return totals


def area_for_mask(mask: np.ndarray, row_area: np.ndarray) -> float:
    return float(np.sum(mask.sum(axis=1, dtype=np.int64) * row_area))


def severity_level(loss_percent: float) -> int:
    if loss_percent <= 0:
        return 0
    if loss_percent < 10:
        return 1
    if loss_percent < 30:
        return 2
    if loss_percent < 70:
        return 3
    return 4


def reach_level(affected_share_percent: float) -> int:
    if affected_share_percent <= 0:
        return 0
    if affected_share_percent < 1:
        return 1
    if affected_share_percent < 10:
        return 2
    if affected_share_percent < 50:
        return 3
    return 4


def tulip_value(severity: int, reach: int, persistence: int) -> float:
    return round_number(1 + 9 * ((severity / 4 + reach / 4 + persistence / 4) / 3), 1)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: analyze-tidal-wetland-carbon-density-mean-maps.py EXTRACTED_ROOT OUTPUT_JSON")

    root = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    paths = {(period, layer): source_path(root, layer, period) for period in PERIODS for layer in LAYERS}
    missing = [str(path) for path in paths.values() if not path.is_file()]
    if missing:
        raise SystemExit(f"missing mean GeoTIFFs: {missing}")

    datasets = {key: rasterio.open(path) for key, path in paths.items()}
    try:
        for period in PERIODS:
            reference = datasets[(period, LAYERS[0])]
            for layer in LAYERS[1:]:
                candidate = datasets[(period, layer)]
                if (candidate.width, candidate.height, candidate.transform, candidate.crs) != (
                    reference.width,
                    reference.height,
                    reference.transform,
                    reference.crs,
                ):
                    raise RuntimeError(f"depth-layer grid mismatch for {period} {layer}")
        references = {period: datasets[(period, LAYERS[0])] for period in PERIODS}
        if references["2014"].crs != references["2020"].crs or not references["2014"].crs.is_geographic:
            raise RuntimeError("period rasters must share a geographic CRS")
        xres = references["2014"].transform.a
        yres = references["2014"].transform.e
        if not math.isclose(xres, references["2020"].transform.a, abs_tol=1e-12):
            raise RuntimeError("period x resolutions differ")
        if not math.isclose(yres, references["2020"].transform.e, abs_tol=1e-12):
            raise RuntimeError("period y resolutions differ")

        left = min(dataset.bounds.left for dataset in references.values())
        top = max(dataset.bounds.top for dataset in references.values())
        right = max(dataset.bounds.right for dataset in references.values())
        bottom = min(dataset.bounds.bottom for dataset in references.values())
        union_width = round((right - left) / xres)
        union_height = round((top - bottom) / abs(yres))
        union_transform = Affine(xres, 0.0, left, 0.0, yres, top)
        offsets = {period: aligned_offset(dataset.transform, union_transform) for period, dataset in references.items()}

        areas = {"2014": 0.0, "2020": 0.0, "union": 0.0, "common": 0.0, "2014_only": 0.0, "2020_only": 0.0}
        stocks_megagrams = {"2014": 0.0, "2020": 0.0}
        decline_area = {threshold: 0.0 for threshold in DECLINE_THRESHOLDS}
        increase_area = {threshold: 0.0 for threshold in DECLINE_THRESHOLDS}
        decline_loss_area_product = {threshold: 0.0 for threshold in DECLINE_THRESHOLDS}

        longitude_width_radians = math.radians(abs(xres))
        read_executor = ThreadPoolExecutor(max_workers=6, thread_name_prefix="tidal-wetland-raster")
        for row_start in range(0, union_height, CHUNK_ROWS):
            if row_start % 4096 == 0:
                print(
                    json.dumps({"rowsProcessed": row_start, "rowsTotal": union_height}),
                    file=sys.stderr,
                    flush=True,
                )
            row_count = min(CHUNK_ROWS, union_height - row_start)
            totals = read_period_totals(
                datasets,
                row_start,
                row_count,
                union_width,
                offsets,
                read_executor,
            )

            earlier = totals["2014"]
            later = totals["2020"]
            earlier_valid = np.isfinite(earlier)
            later_valid = np.isfinite(later)
            common = earlier_valid & later_valid
            earlier_only = earlier_valid & ~later_valid
            later_only = later_valid & ~earlier_valid
            union = earlier_valid | later_valid

            rows = np.arange(row_start, row_start + row_count, dtype=np.float64)
            north = top + rows * yres
            south = north + yres
            row_area = (
                EARTH_RADIUS_METRES**2
                * longitude_width_radians
                * np.abs(np.sin(np.radians(north)) - np.sin(np.radians(south)))
            )

            for period, valid in (("2014", earlier_valid), ("2020", later_valid)):
                areas[period] += area_for_mask(valid, row_area)
                row_density_sum = np.nansum(totals[period], axis=1, dtype=np.float64)
                stocks_megagrams[period] += float(np.sum(row_density_sum * row_area / 10_000.0))
            areas["union"] += area_for_mask(union, row_area)
            areas["common"] += area_for_mask(common, row_area)
            earlier_only_area = area_for_mask(earlier_only, row_area)
            later_only_area = area_for_mask(later_only, row_area)
            areas["2014_only"] += earlier_only_area
            areas["2020_only"] += later_only_area

            usable = common & (earlier > 0.0)
            usable_rows, _ = np.nonzero(usable)
            earlier_values = earlier[usable].astype(np.float64, copy=False)
            later_values = later[usable].astype(np.float64, copy=False)
            relative_change = (later_values - earlier_values) / earlier_values
            pixel_area = row_area[usable_rows]
            for threshold in DECLINE_THRESHOLDS:
                declining = relative_change < -threshold
                increasing = relative_change > threshold
                decline_area[threshold] += float(np.sum(pixel_area[declining])) + earlier_only_area
                increase_area[threshold] += float(np.sum(pixel_area[increasing])) + later_only_area
                decline_loss_area_product[threshold] += float(
                    np.sum(np.clip(-relative_change[declining], 0.0, 1.0) * pixel_area[declining])
                ) + earlier_only_area
        read_executor.shutdown()

        union_area = areas["union"]
        if union_area <= 0:
            raise RuntimeError("mapped wetland union is empty")

        def threshold_summary(threshold: float) -> dict:
            affected = decline_area[threshold]
            increased = increase_area[threshold]
            # Period-only pixels are sensitive to extent classification and
            # alignment.  Remove them for the primary comparable-pixel result;
            # retain the inclusive result separately as an upper sensitivity.
            common_affected = max(0.0, affected - areas["2014_only"])
            common_increased = max(0.0, increased - areas["2020_only"])
            common_loss_product = max(
                0.0,
                decline_loss_area_product[threshold] - areas["2014_only"],
            )
            common_loss_percent = (
                common_loss_product / common_affected * 100.0 if common_affected else 0.0
            )
            common_share_percent = common_affected / union_area * 100.0
            severity = severity_level(common_loss_percent)
            reach = reach_level(common_share_percent)
            persistence = 3
            return {
                "minimumRelativeDeclinePercent": threshold * 100.0,
                "commonMappedExtentOnly": {
                    "decliningAreaSquareKilometres": round_number(common_affected / 1_000_000.0),
                    "shareOfUnionMappedWetlandAreaDecliningPercent": round_number(common_share_percent),
                    "shareOfCommonMappedWetlandAreaDecliningPercent": round_number(
                        common_affected / areas["common"] * 100.0
                    ),
                    "areaWeightedMeanLossWithinDecliningAreaPercent": round_number(
                        common_loss_percent
                    ),
                    "increasingAreaSquareKilometres": round_number(common_increased / 1_000_000.0),
                    "shareOfUnionMappedWetlandAreaIncreasingPercent": round_number(
                        common_increased / union_area * 100.0
                    ),
                    "tulipAxisSensitivity": {
                        "severity": severity,
                        "reach": reach,
                        "persistence": persistence,
                        "value": tulip_value(severity, reach, persistence),
                        "note": (
                            "This applies the TULIP carbon-storage-function loss and mapped-distribution "
                            "anchors to the source mean-map sensitivity. It is not a formal uncertainty result."
                        ),
                    },
                },
                "includingMappedExtentChangeAssumption": {
                "decliningAreaSquareKilometres": round_number(affected / 1_000_000.0),
                "shareOfUnionMappedWetlandAreaDecliningPercent": round_number(affected / union_area * 100.0),
                "areaWeightedMeanLossWithinDecliningAreaPercent": (
                    round_number(decline_loss_area_product[threshold] / affected * 100.0) if affected else None
                ),
                "increasingAreaSquareKilometres": round_number(increased / 1_000_000.0),
                "shareOfUnionMappedWetlandAreaIncreasingPercent": round_number(increased / union_area * 100.0),
                    "note": (
                        "Treats 2014-only mapped pixels as complete loss and 2020-only pixels as gain. "
                        "Classification churn makes this an upper spatial sensitivity."
                    ),
                },
            }

        files = {
            f"{period}_{layer}": {
                "name": str(paths[(period, layer)].relative_to(root)),
                "bytes": paths[(period, layer)].stat().st_size,
                "sha256": sha256(paths[(period, layer)]),
            }
            for period in PERIODS
            for layer in LAYERS
        }
        payload = {
            "version": "tulip_tidal_wetland_soc_mean_map_analysis_2026_09_24_v1",
            "source": {
                "record": "https://zenodo.org/records/19434201",
                "archiveMd5": ARCHIVE_MD5,
                "files": files,
            },
            "grid": {
                "crs": str(references["2014"].crs),
                "pixelResolutionDegrees": [xres, abs(yres)],
                "unionWidth": union_width,
                "unionHeight": union_height,
                "unionTransform": list(union_transform)[:6],
                "periodOffsets": {period: {"row": offsets[period][0], "column": offsets[period][1]} for period in PERIODS},
                "pixelAreaMethod": "spherical_area_by_latitude_row",
            },
            "denominator": {
                "definition": "union of mapped 2009–2014 and 2015–2020 tidal-wetland pixels in the source mean maps",
                "unionAreaSquareKilometres": round_number(areas["union"] / 1_000_000.0),
                "earlierAreaSquareKilometres": round_number(areas["2014"] / 1_000_000.0),
                "laterAreaSquareKilometres": round_number(areas["2020"] / 1_000_000.0),
                "commonAreaSquareKilometres": round_number(areas["common"] / 1_000_000.0),
                "earlierOnlyAreaSquareKilometres": round_number(areas["2014_only"] / 1_000_000.0),
                "laterOnlyAreaSquareKilometres": round_number(areas["2020_only"] / 1_000_000.0),
                "periodOnlyClassificationChurnSquareKilometres": round_number(
                    (areas["2014_only"] + areas["2020_only"]) / 1_000_000.0
                ),
                "periodOnlyClassificationChurnShareOfUnionPercent": round_number(
                    (areas["2014_only"] + areas["2020_only"]) / areas["union"] * 100.0
                ),
            },
            "sourceReproduction": {
                "earlierStockPetagramsFromDepthRasters": round_number(stocks_megagrams["2014"] / 1_000_000_000.0),
                "laterStockPetagramsFromDepthRasters": round_number(stocks_megagrams["2020"] / 1_000_000_000.0),
                "paperEarlierStockPetagrams": 8.80,
                "paperLaterStockPetagrams": 8.27,
                "paperEarlierAreaSquareKilometres": 348_884.9,
                "paperLaterAreaSquareKilometres": 345_934.9,
            },
            "mappedChange": {str(int(threshold * 100)): threshold_summary(threshold) for threshold in DECLINE_THRESHOLDS},
            "ratingImplication": {
                "candidate": {
                    "value": 7.0,
                    "grade": "D",
                    "lower": 4.0,
                    "upper": 10.0,
                    "confidence": "B",
                    "ecosystemAxes": {
                        "severity": {"lower": 1, "central": 2, "upper": 4},
                        "reach": {"lower": 1, "central": 3, "upper": 4},
                        "persistence": {"lower": 2, "central": 3, "upper": 4},
                    },
                },
                "reason": (
                    "Across the common mapped extent, every tested minimum-decline threshold from 0% "
                    "through 70% maps to D 7.0 after the paired severity and reach levels are combined "
                    "with the existing multi-decade persistence level. The mean maps therefore support "
                    "central reach level 3. Wide bounds remain because the calculation has no formal "
                    "change uncertainty and period-only mapped pixels are classification-sensitive."
                ),
            },
            "interpretationBoundaries": [
                "This analysis uses modelled mean soil-carbon density, not repeated field measurements at every pixel.",
                "Any negative mean change can include very small model differences; the 5%, 10%, 30%, 50% and 70% thresholds show how reach changes when materiality is tightened.",
                "The mapped-area denominator covers mangroves, salt marshes and tidal flats between 60° north and south; seagrass is excluded by the source.",
                "A 2014 mapped pixel absent in 2020 is treated as complete loss of mapped carbon-storage function, while a new 2020 pixel is treated as gain. Source classification accuracy and map change uncertainty still apply.",
                "The primary TULIP axis sensitivity uses only pixels mapped in both periods. Period-only pixels remain a separate upper sensitivity because the two maps show substantial classification churn despite a small net area change.",
                "The source reports 86.44% wetland classification accuracy, spatial-block cross-validation R² 0.46 and LCCC 0.65. Mean-map decline is not a formal significance test.",
                "The source's lower and upper prediction maps are required to determine whether period-specific prediction limits overlap; they were not used here.",
            ],
        }
        payload["digest"] = hashlib.sha256(
            json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf8")
        ).hexdigest()
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(json.dumps(payload, indent=2) + "\n")
        print(json.dumps({"output": str(output), "digest": payload["digest"], "sourceReproduction": payload["sourceReproduction"], "mappedChange": payload["mappedChange"]}, indent=2))
    finally:
        for dataset in datasets.values():
            dataset.close()


if __name__ == "__main__":
    main()
