#!/usr/bin/env python3
"""Summarize Yang et al. (2026) 0-100 cm tidal-wetland SOC maps.

The raw 90 m GeoTIFFs are large and are intentionally not committed. The
Zenodo description says ``0000_ra_parayear_mosaic.7z`` contains both periods,
but the checksum-pinned archive contains only the 2014 lower, mean and upper
maps. Reconstruct each total-depth map by adding the corresponding 0-30,
30-60 and 60-100 cm rasters from the three depth archives. Name those six
outputs as listed in ``EXPECTED_FILES``, then run:

    python3 scripts/analyze-tidal-wetland-carbon-density-maps.py \
      /path/to/extracted/files /path/to/summary.json

The script requires numpy and rasterio. It uses the union of the two mapped
wetland extents as the geographic denominator and weights geographic pixels by
their spherical surface area. It keeps mean-estimate decline separate from the
much stricter non-overlapping-prediction-limit result.
"""

from __future__ import annotations

import hashlib
import json
import math
import sys
from pathlib import Path

import numpy as np
import rasterio


EXPECTED_FILES = {
    "earlier_lower": "0000_2014_LL.tif",
    "earlier_mean": "0000_2014_mean.tif",
    "earlier_upper": "0000_2014_UL.tif",
    "later_lower": "0000_2020_LL.tif",
    "later_mean": "0000_2020_mean.tif",
    "later_upper": "0000_2020_UL.tif",
}
EARTH_RADIUS_METRES = 6_371_008.8
LOSS_BIN_EDGES = np.linspace(0.0, 1.0, 1001)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def round_number(value: float, digits: int = 6) -> float:
    return round(float(value), digits)


def weighted_quantile_from_histogram(histogram: np.ndarray, quantile: float) -> float | None:
    total = float(histogram.sum())
    if total <= 0:
        return None
    target = total * quantile
    index = int(np.searchsorted(np.cumsum(histogram), target, side="left"))
    index = min(index, len(LOSS_BIN_EDGES) - 2)
    return round_number((LOSS_BIN_EDGES[index] + LOSS_BIN_EDGES[index + 1]) / 2 * 100)


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: analyze-tidal-wetland-carbon-density-maps.py EXTRACTED_DIR OUTPUT_JSON")

    source_dir = Path(sys.argv[1]).resolve()
    output_path = Path(sys.argv[2]).resolve()
    paths = {key: source_dir / name for key, name in EXPECTED_FILES.items()}
    missing = [str(path) for path in paths.values() if not path.is_file()]
    if missing:
        raise SystemExit(f"missing expected GeoTIFFs: {missing}")

    datasets = {key: rasterio.open(path) for key, path in paths.items()}
    try:
        reference = datasets["earlier_mean"]
        for key, dataset in datasets.items():
            if (dataset.width, dataset.height, dataset.transform, dataset.crs) != (
                reference.width,
                reference.height,
                reference.transform,
                reference.crs,
            ):
                raise RuntimeError(f"grid mismatch for {key}")
        if reference.crs is None or not reference.crs.is_geographic:
            raise RuntimeError(f"expected a geographic grid, found {reference.crs}")
        transform = reference.transform
        if not math.isclose(transform.b, 0.0) or not math.isclose(transform.d, 0.0):
            raise RuntimeError("rotated rasters are not supported")

        area = {
            "earlier": 0.0,
            "later": 0.0,
            "union": 0.0,
            "common": 0.0,
            "earlier_only": 0.0,
            "later_only": 0.0,
            "robust_decline": 0.0,
            "mean_decline": 0.0,
            "plausible_decline": 0.0,
        }
        central_hist = np.zeros(len(LOSS_BIN_EDGES) - 1, dtype=np.float64)
        robust_hist = np.zeros_like(central_hist)
        plausible_hist = np.zeros_like(central_hist)
        central_loss_area_product = 0.0
        robust_loss_area_product = 0.0
        plausible_loss_area_product = 0.0
        stock_megagrams = {"earlier": 0.0, "later": 0.0}

        lon_width_radians = math.radians(abs(transform.a))
        for _, window in reference.block_windows(1):
            arrays = {key: dataset.read(1, window=window, masked=True) for key, dataset in datasets.items()}
            earlier_valid = ~np.ma.getmaskarray(arrays["earlier_mean"])
            later_valid = ~np.ma.getmaskarray(arrays["later_mean"])
            union = earlier_valid | later_valid
            common = earlier_valid & later_valid
            earlier_only = earlier_valid & ~later_valid
            later_only = later_valid & ~earlier_valid

            row_indices = np.arange(window.row_off, window.row_off + window.height, dtype=np.float64)
            north = transform.f + row_indices * transform.e
            south = north + transform.e
            row_area = (
                EARTH_RADIUS_METRES**2
                * lon_width_radians
                * np.abs(np.sin(np.radians(north)) - np.sin(np.radians(south)))
            )
            weights = np.broadcast_to(row_area[:, None], (window.height, window.width))

            area["earlier"] += float(weights[earlier_valid].sum())
            area["later"] += float(weights[later_valid].sum())
            area["union"] += float(weights[union].sum())
            area["common"] += float(weights[common].sum())
            area["earlier_only"] += float(weights[earlier_only].sum())
            area["later_only"] += float(weights[later_only].sum())

            earlier_mean = arrays["earlier_mean"].filled(np.nan)
            later_mean = arrays["later_mean"].filled(np.nan)
            earlier_lower = arrays["earlier_lower"].filled(np.nan)
            earlier_upper = arrays["earlier_upper"].filled(np.nan)
            later_lower = arrays["later_lower"].filled(np.nan)
            later_upper = arrays["later_upper"].filled(np.nan)

            stock_megagrams["earlier"] += float(np.sum(earlier_mean[earlier_valid] * weights[earlier_valid] / 10_000))
            stock_megagrams["later"] += float(np.sum(later_mean[later_valid] * weights[later_valid] / 10_000))

            usable_mean = common & np.isfinite(earlier_mean) & np.isfinite(later_mean) & (earlier_mean > 0)
            usable_robust = common & np.isfinite(earlier_lower) & np.isfinite(later_upper) & (earlier_lower > 0)
            usable_plausible = common & np.isfinite(earlier_upper) & np.isfinite(later_lower) & (earlier_upper > 0)

            mean_decline = usable_mean & (later_mean < earlier_mean)
            robust_decline = usable_robust & (later_upper < earlier_lower)
            plausible_decline = usable_plausible & (later_lower < earlier_upper)

            # A 2014 wetland pixel absent in 2020 is a mapped extent loss. Treat
            # it as 100% loss of the mapped carbon-storage function, while
            # retaining it separately so map-classification uncertainty remains visible.
            for key, mask in (
                ("mean_decline", mean_decline | earlier_only),
                ("robust_decline", robust_decline | earlier_only),
                ("plausible_decline", plausible_decline | earlier_only),
            ):
                area[key] += float(weights[mask].sum())

            def add_loss(mask: np.ndarray, numerator: np.ndarray, denominator: np.ndarray, histogram: np.ndarray) -> float:
                losses = np.clip((denominator[mask] - numerator[mask]) / denominator[mask], 0.0, 1.0)
                loss_weights = weights[mask]
                histogram += np.histogram(losses, bins=LOSS_BIN_EDGES, weights=loss_weights)[0]
                return float(np.sum(losses * loss_weights))

            central_loss_area_product += add_loss(mean_decline, later_mean, earlier_mean, central_hist)
            robust_loss_area_product += add_loss(robust_decline, later_upper, earlier_lower, robust_hist)
            plausible_loss_area_product += add_loss(plausible_decline, later_lower, earlier_upper, plausible_hist)
            if earlier_only.any():
                lost_area = float(weights[earlier_only].sum())
                central_hist[-1] += lost_area
                robust_hist[-1] += lost_area
                plausible_hist[-1] += lost_area
                central_loss_area_product += lost_area
                robust_loss_area_product += lost_area
                plausible_loss_area_product += lost_area

        if area["union"] <= 0:
            raise RuntimeError("the union wetland area is empty")

        def loss_summary(key: str, histogram: np.ndarray, loss_area_product: float) -> dict:
            affected_area = area[key]
            return {
                "areaSquareKilometres": round_number(affected_area / 1_000_000),
                "shareOfUnionWetlandAreaPercent": round_number(affected_area / area["union"] * 100),
                "areaWeightedMeanLossWithinAffectedPercent": (
                    round_number(loss_area_product / affected_area * 100) if affected_area > 0 else None
                ),
                "areaWeightedMedianLossWithinAffectedPercent": weighted_quantile_from_histogram(histogram, 0.5),
                "lossBandAreaSharesWithinAffectedPercent": {
                    "under10": round_number(histogram[:100].sum() / affected_area * 100) if affected_area else None,
                    "10toUnder30": round_number(histogram[100:300].sum() / affected_area * 100) if affected_area else None,
                    "30toUnder70": round_number(histogram[300:700].sum() / affected_area * 100) if affected_area else None,
                    "70orMore": round_number(histogram[700:].sum() / affected_area * 100) if affected_area else None,
                },
            }

        payload = {
            "version": "tulip_tidal_wetland_soc_map_analysis_2026_09_24_v1",
            "source": {
                "record": "https://zenodo.org/records/19434201",
                "archive": "0000_ra_parayear_mosaic.7z",
                "archiveMd5": "c660ec62f655aacd004ed7156acbacd1",
                "files": {key: {"name": path.name, "sha256": sha256(path)} for key, path in paths.items()},
            },
            "grid": {
                "crs": str(reference.crs),
                "width": reference.width,
                "height": reference.height,
                "transform": list(reference.transform)[:6],
                "pixelAreaMethod": "spherical_area_by_latitude_row",
            },
            "denominator": {
                "definition": "union of mapped 2009-2014 and 2015-2020 tidal-wetland extents",
                "unionAreaSquareKilometres": round_number(area["union"] / 1_000_000),
                "earlierAreaSquareKilometres": round_number(area["earlier"] / 1_000_000),
                "laterAreaSquareKilometres": round_number(area["later"] / 1_000_000),
                "commonAreaSquareKilometres": round_number(area["common"] / 1_000_000),
                "earlierOnlyAreaSquareKilometres": round_number(area["earlier_only"] / 1_000_000),
                "laterOnlyAreaSquareKilometres": round_number(area["later_only"] / 1_000_000),
            },
            "sourceReproduction": {
                "earlierStockPetagramsFromRaster": round_number(stock_megagrams["earlier"] / 1_000_000_000),
                "laterStockPetagramsFromRaster": round_number(stock_megagrams["later"] / 1_000_000_000),
                "paperEarlierStockPetagrams": 8.80,
                "paperLaterStockPetagrams": 8.27,
                "paperEarlierAreaSquareKilometres": 348_884.9,
                "paperLaterAreaSquareKilometres": 345_934.9,
            },
            "decline": {
                "robustNonOverlappingPredictionLimits": loss_summary("robust_decline", robust_hist, robust_loss_area_product),
                "meanEstimate": loss_summary("mean_decline", central_hist, central_loss_area_product),
                "plausibleOverlappingPredictionLimits": loss_summary("plausible_decline", plausible_hist, plausible_loss_area_product),
            },
            "interpretationBoundaries": [
                "The mean map is the source's primary result; lower and upper maps are marginal 5th and 95th percentile prediction limits, not a prediction interval for the difference between periods.",
                "Non-overlap of period-specific prediction limits is a conservative robustness screen, not a formal significance test.",
                "Mapped extent loss can include wetland-classification error; the source reports 86.44% classification accuracy for the extent product.",
                "The source's spatial-block cross-validation reports overall R2 0.46 and LCCC 0.65, so modeled pixel change is not equivalent to direct repeated field observation.",
                "Seagrass meadows are outside the source map because no compatible global temporal extent dataset was available.",
            ],
        }
        payload["digest"] = hashlib.sha256(
            json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
        ).hexdigest()
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json.dumps(payload, indent=2) + "\n")
        print(json.dumps({"output": str(output_path), "digest": payload["digest"], "decline": payload["decline"]}, indent=2))
    finally:
        for dataset in datasets.values():
            dataset.close()


if __name__ == "__main__":
    main()
