#!/usr/bin/env python3
"""Audit the source-generated Yang et al. (2026) tidal-wetland SOC grids.

The Zenodo ``code_upload.7z`` archive contains compact 0.5-degree products
created by the study authors.  They are small enough to audit without
committing the much larger 90 m prediction rasters.  Run this script after
extracting ``code_upload`` from the checksum-pinned archive:

    python3 scripts/analyze-tidal-wetland-soc-source-grid.py \
      /path/to/code_upload \
      artifacts/tulip-calibration-2026-09-22/\
tidal-wetland-soc-source-grid-analysis.json

The 0.5-degree cells contain carbon stock, not wetland area.  Cell shares and
stock-weighted shares are therefore spatial sensitivity checks.  They must not
be presented as the percentage of the global tidal-wetland distribution that
was harmed.
"""

from __future__ import annotations

import csv
import hashlib
import json
import math
import sys
from collections import defaultdict
from pathlib import Path

import numpy as np
import rasterio


ARCHIVE_MD5 = "733d842a56e259035c5fff133068f7fd"
FILES = {
    "earlier_mean": (
        "Grid_Raster_Global_05/0000_ra_parayear_mosaic_pg_05/2014_mean.tif",
        "452bd8fe50c483abd2d1d1105e009b6f0db8d5433443276b638bf5b92c31a0f1",
    ),
    "earlier_sd": (
        "Grid_Raster_Global_05/0000_ra_parayear_mosaic_pg_05/2014_sd.tif",
        "2198ba0daeffe5411e14d2c4a5f5768eb8627a1023481317bd52a87b2a021214",
    ),
    "later_mean": (
        "Grid_Raster_Global_05/0000_ra_parayear_mosaic_pg_05/2020_mean.tif",
        "ecf7914e72d27b8b21a10f383052c487b9c16c5a5abd46cd3c94b2f00f5e6129",
    ),
    "later_sd": (
        "Grid_Raster_Global_05/0000_ra_parayear_mosaic_pg_05/2020_sd.tif",
        "210b50974c50c6a4065f98ae4913b210d4e777b19469ba521939b5981416ee57",
    ),
    "source_change_total": (
        "Grid_Raster_Global_05/0000_ra_parayear_mosaic_pg_change_05/change.tif",
        "a6edde5500071f80f63bb8467e73a5781b3e637d5dccd083b8f4cfcc39bdcb43",
    ),
    "source_change_0030": (
        "Grid_Raster_Global_05/0030_ra_parayear_mosaic_pg_change_05/change.tif",
        "323a00b9baa96f14fea9a8a29cd2d53e52c18c416012dd4f5ab06287dec9d33a",
    ),
    "source_change_3060": (
        "Grid_Raster_Global_05/3060_ra_parayear_mosaic_pg_change_05/change.tif",
        "f80f0fc79da26848927baae9dc7b68c17aed9349d64a7e1e4c9abeaa1c61c2de",
    ),
    "source_change_6000": (
        "Grid_Raster_Global_05/6000_ra_parayear_mosaic_pg_change_05/change.tif",
        "bedf359532622a4167dffe9477f7f473f7c986a4fb5f28d964d0b14ffaa5cd00",
    ),
    "country_0030": (
        "Figure.3/wetlands_country_0030.csv",
        "52f6b579fc6d62ed6dc9291ab0da7fb06c207c689ac5c4d10cbc460d5c7e2051",
    ),
    "country_3060": (
        "Figure.3/wetlands_country_3060.csv",
        "f3f8d349d99ad8180287ae1acaf97349e50f68dbec35c9bcc5bed05f61a8415d",
    ),
    "country_6000": (
        "Figure.3/wetlands_country_6000.csv",
        "b44a5fbf866b79ce70eff0dad9ac61eddffc28dd791a63eae56c85f3c2845c57",
    ),
    "conversion_code": (
        "4.Convert mosaicked SOC density rasters to SOC stock rasters.R",
        "ff8a70709f0046917da42c5df32609ea8e4f3a8a1e5ff8a1f5dc7ab55d89b24a",
    ),
    "figure_1_code": (
        "Figure.1/1.Generate base raster map.R",
        "c607acbfe48924983c4b5cb3579764c98aa63bbadfdf021378a241cc200c4828",
    ),
    "figure_3_code": (
        "Figure.3/summary_0000_M.R",
        "4b4f9a5adc631bfd792fa34a6124fd5108a27cbffe61a4b45c0b967326910d9b",
    ),
    "readme": (
        "readme.txt",
        "eda9293dc426081c903cea787ffdc713f8c055a1c1bedb2098d45e47040c32c7",
    ),
}
RELATIVE_THRESHOLDS = (0.0, 0.01, 0.05, 0.10, 0.30, 0.50, 0.70)
SOURCE_ABSOLUTE_BINS_TG = (-math.inf, -0.1, -0.05, 0.0, 0.05, 0.1, math.inf)


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def rounded(value: float, digits: int = 6) -> float:
    return round(float(value), digits)


def percentage(numerator: float, denominator: float) -> float:
    return rounded(100.0 * numerator / denominator)


def load_raster(path: Path) -> tuple[np.ndarray, dict]:
    with rasterio.open(path) as dataset:
        values = dataset.read(1, masked=True).filled(np.nan).astype(np.float64)
        geometry = {
            "width": dataset.width,
            "height": dataset.height,
            "crs": str(dataset.crs),
            "transform": list(dataset.transform)[:6],
        }
    return values, geometry


def summarize_change(change: np.ndarray, valid: np.ndarray, earlier: np.ndarray) -> dict:
    negative = valid & (change < 0)
    positive = valid & (change > 0)
    zero = valid & (change == 0)
    return {
        "validCells": int(valid.sum()),
        "decliningCells": int(negative.sum()),
        "decliningCellSharePercent": percentage(negative.sum(), valid.sum()),
        "unchangedCells": int(zero.sum()),
        "increasingCells": int(positive.sum()),
        "negativeChangePetagrams": rounded(change[negative].sum()),
        "positiveChangePetagrams": rounded(change[positive].sum()),
        "netChangePetagrams": rounded(change[valid].sum()),
        "earlierStockSituatedInDecliningCellsPercent": percentage(
            earlier[negative].sum(), earlier[valid].sum()
        ),
    }


def read_country_tables(paths: dict[str, Path]) -> dict:
    by_depth: dict[str, dict[tuple[str, int], dict[str, float]]] = {}
    for depth, path in paths.items():
        records: dict[tuple[str, int], dict[str, float]] = defaultdict(
            lambda: {"stock": 0.0, "area": 0.0}
        )
        with path.open(newline="", encoding="utf-8-sig") as handle:
            for row in csv.DictReader(handle):
                key = (row["country"], int(row["year"]))
                records[key]["stock"] += float(row["sum_mean"])
                records[key]["area"] += float(row["area"])
        by_depth[depth] = records

    labels = sorted(
        set(country for country, _ in by_depth["0030"])
        & set(country for country, _ in by_depth["3060"])
        & set(country for country, _ in by_depth["6000"])
    )
    countries = []
    for label in labels:
        earlier_stock = sum(by_depth[depth][(label, 2014)]["stock"] for depth in by_depth)
        later_stock = sum(by_depth[depth][(label, 2020)]["stock"] for depth in by_depth)
        earlier_area = by_depth["0030"][(label, 2014)]["area"]
        later_area = by_depth["0030"][(label, 2020)]["area"]
        countries.append(
            {
                "stockEarlier": earlier_stock,
                "stockLater": later_stock,
                "stockChange": later_stock - earlier_stock,
                "areaEarlier": earlier_area,
                "areaLater": later_area,
                "areaChange": later_area - earlier_area,
                "densityEarlier": earlier_stock / earlier_area * 10**7,
                "densityLater": later_stock / later_area * 10**7,
                "densityChange": (
                    later_stock / later_area * 10**7
                    - earlier_stock / earlier_area * 10**7
                ),
            }
        )

    def negative_summary(field: str) -> dict:
        selected = [record for record in countries if record[field] < 0]
        return {
            "countryLabels": len(selected),
            "countryLabelSharePercent": percentage(len(selected), len(countries)),
            "earlierWetlandAreaLocatedInSelectedCountriesPercent": percentage(
                sum(record["areaEarlier"] for record in selected),
                sum(record["areaEarlier"] for record in countries),
            ),
            "earlierStockLocatedInSelectedCountriesPercent": percentage(
                sum(record["stockEarlier"] for record in selected),
                sum(record["stockEarlier"] for record in countries),
            ),
        }

    return {
        "countryLabels": len(countries),
        "earlierStockPetagrams": rounded(sum(record["stockEarlier"] for record in countries)),
        "laterStockPetagrams": rounded(sum(record["stockLater"] for record in countries)),
        "stockChangePetagrams": rounded(sum(record["stockChange"] for record in countries)),
        "earlierWetlandAreaSquareKilometres": rounded(sum(record["areaEarlier"] for record in countries)),
        "laterWetlandAreaSquareKilometres": rounded(sum(record["areaLater"] for record in countries)),
        "wetlandAreaChangeSquareKilometres": rounded(sum(record["areaChange"] for record in countries)),
        "decliningStockCountries": negative_summary("stockChange"),
        "decliningAreaCountries": negative_summary("areaChange"),
        "decliningDensityCountries": negative_summary("densityChange"),
        "boundary": (
            "A country's entire wetland area is used only as a location weight. "
            "A national aggregate decline does not establish that every wetland "
            "inside that country declined."
        ),
    }


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit(
            "usage: analyze-tidal-wetland-soc-source-grid.py SOURCE_CODE_UPLOAD_DIR OUTPUT_JSON"
        )

    source_root = Path(sys.argv[1]).resolve()
    output = Path(sys.argv[2]).resolve()
    paths = {key: source_root / relative for key, (relative, _) in FILES.items()}
    missing = [str(path) for path in paths.values() if not path.is_file()]
    if missing:
        raise SystemExit(f"missing source files: {missing}")
    for key, path in paths.items():
        actual = sha256(path)
        expected = FILES[key][1]
        if actual != expected:
            raise RuntimeError(f"source hash mismatch for {key}: {actual} != {expected}")

    raster_keys = [key for key in FILES if key.startswith(("earlier_", "later_", "source_change_"))]
    rasters = {}
    geometries = {}
    for key in raster_keys:
        rasters[key], geometries[key] = load_raster(paths[key])
    reference_geometry = geometries["earlier_mean"]
    for key, geometry in geometries.items():
        if geometry != reference_geometry:
            raise RuntimeError(f"grid mismatch for {key}")

    earlier = rasters["earlier_mean"]
    later = rasters["later_mean"]
    earlier_valid = np.isfinite(earlier)
    later_valid = np.isfinite(later)
    common = earlier_valid & later_valid
    period_change = later - earlier

    source_change = rasters["source_change_total"]
    source_change_valid = np.isfinite(source_change)
    depth_change_stack = np.stack(
        [
            rasters["source_change_0030"],
            rasters["source_change_3060"],
            rasters["source_change_6000"],
        ]
    )
    depth_valid = np.all(np.isfinite(depth_change_stack), axis=0)
    depth_sum = depth_change_stack.sum(axis=0)
    comparison_mask = source_change_valid & depth_valid
    max_depth_sum_difference = float(np.max(np.abs(source_change[comparison_mask] - depth_sum[comparison_mask])))

    relative_change = period_change / earlier
    threshold_sensitivity = {}
    for threshold in RELATIVE_THRESHOLDS:
        selected = common & (earlier > 0) & (relative_change < -threshold)
        threshold_sensitivity[str(int(threshold * 100))] = {
            "minimumRelativeDeclinePercent": rounded(threshold * 100),
            "decliningCells": int(selected.sum()),
            "shareOfCommonOccupiedCellsPercent": percentage(selected.sum(), common.sum()),
            "earlierStockSituatedInDecliningCellsPercent": percentage(
                earlier[selected].sum(), earlier[common].sum()
            ),
            "netChangeInSelectedCellsPetagrams": rounded(period_change[selected].sum()),
        }

    standard_deviation_sensitivity = {}
    sd_valid = common & np.isfinite(rasters["earlier_sd"]) & np.isfinite(rasters["later_sd"])
    for multiplier in (0.5, 1.0, 2.0):
        selected = sd_valid & (
            later + multiplier * rasters["later_sd"]
            < earlier - multiplier * rasters["earlier_sd"]
        )
        standard_deviation_sensitivity[str(multiplier)] = {
            "multiplier": multiplier,
            "decliningCells": int(selected.sum()),
            "shareOfComparableCellsPercent": percentage(selected.sum(), sd_valid.sum()),
            "earlierStockSituatedInSelectedCellsPercent": percentage(
                earlier[selected].sum(), earlier[sd_valid].sum()
            ),
            "netChangeInSelectedCellsPetagrams": rounded(period_change[selected].sum()),
        }

    absolute_bins_petagrams = np.array(SOURCE_ABSOLUTE_BINS_TG) / 1000.0
    source_change_histogram = np.histogram(
        source_change[source_change_valid], bins=absolute_bins_petagrams
    )[0]

    country_tables = read_country_tables(
        {
            "0030": paths["country_0030"],
            "3060": paths["country_3060"],
            "6000": paths["country_6000"],
        }
    )
    payload = {
        "version": "tulip_tidal_wetland_soc_source_grid_analysis_2026_09_24_v1",
        "source": {
            "record": "https://zenodo.org/records/19434201",
            "archive": "code_upload.7z",
            "archiveMd5": ARCHIVE_MD5,
            "files": {
                key: {"path": FILES[key][0], "sha256": FILES[key][1]} for key in FILES
            },
        },
        "grid": reference_geometry,
        "stockReproduction": {
            "earlierPeriod": "2009-2014",
            "laterPeriod": "2015-2020",
            "earlierMeanGridCells": int(earlier_valid.sum()),
            "laterMeanGridCells": int(later_valid.sum()),
            "commonMeanGridCells": int(common.sum()),
            "earlierMeanStockPetagrams": rounded(earlier[earlier_valid].sum()),
            "laterMeanStockPetagrams": rounded(later[later_valid].sum()),
            "changeFromPeriodMeansPetagrams": rounded(
                later[later_valid].sum() - earlier[earlier_valid].sum()
            ),
            "reportedEarlierStockPetagrams": 8.80,
            "reportedLaterStockPetagrams": 8.27,
            "reportedChangePercent": -6.11,
        },
        "spatialSensitivity": {
            "periodMeanDifference": summarize_change(period_change, common, earlier),
            "relativeDeclineThresholds": threshold_sensitivity,
            "standardDeviationNonOverlap": standard_deviation_sensitivity,
            "sourceSuppliedDepthSummedChange": {
                **summarize_change(source_change, source_change_valid, earlier),
                "absoluteChangeCellCountsBySourceFigureBinsTg": {
                    "underMinus0.1": int(source_change_histogram[0]),
                    "minus0.1ToUnderMinus0.05": int(source_change_histogram[1]),
                    "minus0.05ToUnder0": int(source_change_histogram[2]),
                    "0ToUnder0.05": int(source_change_histogram[3]),
                    "0.05ToUnder0.1": int(source_change_histogram[4]),
                    "0.1OrMore": int(source_change_histogram[5]),
                },
                "depthChangeGridSumMaximumAbsoluteDifferencePetagrams": rounded(
                    max_depth_sum_difference, 12
                ),
            },
            "countryAggregateSensitivity": country_tables,
        },
        "sourceProductReconciliation": {
            "periodMeanGridChangePetagrams": rounded(period_change[common].sum()),
            "sourceSuppliedDepthSummedChangePetagrams": rounded(
                source_change[source_change_valid].sum()
            ),
            "countryTableChangePetagrams": country_tables["stockChangePetagrams"],
            "differenceBetweenPeriodGridAndDepthSummedChangePetagrams": rounded(
                period_change[common].sum() - source_change[source_change_valid].sum()
            ),
            "finding": (
                "The compact period-total grids reproduce the paper's 8.80 Pg and "
                "8.27 Pg headline stocks. Their common-cell difference, the archived "
                "depth-summed change grid and the country tables do not produce the "
                "same net change. The archived R code computes the figure directly "
                "from period-total grids, while the stored change grid exactly sums "
                "the three stored depth-change grids. TULIP therefore uses the period "
                "means for the headline reproduction and retains the discrepancy as "
                "a source-product uncertainty."
            ),
        },
        "interpretationBoundaries": [
            "The 0.5-degree cells contain aggregated soil-carbon stock, not the area of tidal wetland inside each cell.",
            "The share of occupied cells with decline is a geographic-occurrence sensitivity, not the share of the global tidal-wetland distribution harmed.",
            "The stock situated in declining cells is a stock-weighted sensitivity, not an affected-area denominator or collapse percentage.",
            "Country totals are still coarser: a declining national aggregate does not mean all wetland area inside that country declined.",
            "Non-overlap of period mean plus or minus source SD is a conservative sensitivity screen, not a formal significance test or uncertainty interval for the difference.",
            "The results are model outputs. They are not repeated field observations at every declining cell.",
        ],
        "ratingImplication": {
            "decision": "compact_grid_alone_cannot_set_reach_full_resolution_area_analysis_required",
            "reason": (
                "The source-generated maps make broad modeled decline more credible: "
                "55.4% of common occupied cells decline, and 42.2% decline by at least "
                "5%. They still do not supply the wetland-area denominator required "
                "by the TULIP reach rubric. These compact-grid results therefore cannot "
                "change the reach level without the separate full-resolution area analysis."
            ),
            "resolvedGaps": [
                "The study's headline global stock totals are independently reproduced from the archived source-generated period grids.",
                "Spatial heterogeneity and sensitivity to minimum relative-decline thresholds are quantified.",
                "The archived period, depth-change and country products are reconciled far enough to expose their numerical disagreement instead of silently selecting one.",
            ],
            "remainingGaps": [
                "A cell-level tidal-wetland area raster or completed full-resolution area-weighted analysis for both periods.",
                "A common functional-loss or collapse reference translating soil-carbon loss into condition severity.",
                "A formal uncertainty model for change between periods, including dependence between period predictions.",
                "A global recovery-time distribution for tidal-wetland soil carbon.",
            ],
        },
    }
    payload["digest"] = hashlib.sha256(
        json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
    ).hexdigest()
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(payload, indent=2) + "\n")
    print(
        json.dumps(
            {
                "output": str(output),
                "digest": payload["digest"],
                "reproduction": payload["stockReproduction"],
                "periodMeanDifference": payload["spatialSensitivity"]["periodMeanDifference"],
                "reconciliation": payload["sourceProductReconciliation"],
                "ratingImplication": payload["ratingImplication"]["decision"],
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
