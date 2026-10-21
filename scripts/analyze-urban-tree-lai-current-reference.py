#!/usr/bin/env python3
"""Reproduce the 0.5-degree urban-tree LAI checks used by TULIP.

Install scripts/requirements-tulip-regional-pattern.txt, then run:
  python scripts/analyze-urban-tree-lai-current-reference.py \
    --archive /path/to/global_0.5.tar.gz --output /path/to/analysis.json

The calculation intentionally does not turn modeled grid coverage into urban
tree area, ecosystem reach, or human exposure. Cosine-latitude weighting only
keeps larger high-latitude grid cells from dominating the diagnostic mean.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import tarfile
import tempfile
import warnings
from pathlib import Path

import netCDF4
import numpy as np


EXPECTED_ARCHIVE_MD5 = "e85a098e09eedb86ebd9cce949dd3cd6"
EXPECTED_ARCHIVE_BYTES = 51_370_376
YEARS = np.arange(2000, 2023)


def digest(path: Path, algorithm: str) -> str:
    hasher = hashlib.new(algorithm)
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest()


def rounded(value: float, places: int = 6) -> float:
    return round(float(value), places)


def annual_lai(path: Path) -> tuple[np.ndarray, np.ndarray]:
    with netCDF4.Dataset(path) as dataset:
        latitudes = np.asarray(dataset.variables["lat"][:], dtype=float)
        values = np.ma.filled(dataset.variables["URBAN_TREE_LAI"][:], np.nan).astype(float)
    # Cells outside the modeled urban-tree mask contain twelve missing months.
    # Their all-NaN annual means are expected and remain missing in later masks.
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", category=RuntimeWarning)
        annual = np.nanmean(values, axis=0)
    return latitudes, annual


def period_diagnostic(stack: np.ndarray, years: np.ndarray, start_year: int, weights: np.ndarray, common: np.ndarray) -> dict:
    start_index = int(np.where(years == start_year)[0][0])
    subset = stack[start_index:]
    subset_years = years[start_index:]
    x = subset_years - subset_years.mean()
    slopes = np.nansum((subset - subset.mean(axis=0)) * x[:, None, None], axis=0) / np.sum(x * x)
    start = stack[start_index]
    end = stack[-1]
    weighted_start = np.nansum(start * weights * common) / np.nansum(weights * common)
    weighted_end = np.nansum(end * weights * common) / np.nansum(weights * common)
    valid_weights = weights[common]
    lower_end_state = (end - start)[common] < 0
    negative_slope = slopes[common] < 0
    weighted_slope = np.nansum(slopes * weights * common) / np.nansum(weights * common)
    return {
        "startYear": start_year,
        "endYear": int(years[-1]),
        "weightedAnnualMeanStart": rounded(weighted_start),
        "weightedAnnualMeanEnd": rounded(weighted_end),
        "weightedMeanChangePercent": rounded((weighted_end / weighted_start - 1) * 100, 3),
        "weightedLinearTrendPercentPerDecadeRelativeToStart": rounded(weighted_slope / weighted_start * 1000, 3),
        "areaWeightedCommonGridShareWithLowerEndStatePercent": rounded(valid_weights[lower_end_state].sum() / valid_weights.sum() * 100, 2),
        "areaWeightedCommonGridShareWithNegativeLinearSlopePercent": rounded(valid_weights[negative_slope].sum() / valid_weights.sum() * 100, 2),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--archive", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()

    archive = args.archive.resolve()
    if archive.stat().st_size != EXPECTED_ARCHIVE_BYTES:
        raise RuntimeError(f"Unexpected archive size: {archive.stat().st_size}")
    archive_md5 = digest(archive, "md5")
    if archive_md5 != EXPECTED_ARCHIVE_MD5:
        raise RuntimeError(f"Unexpected archive MD5: {archive_md5}")

    arrays: list[np.ndarray] = []
    latitudes: np.ndarray | None = None
    with tempfile.TemporaryDirectory(prefix="tulip-urban-tree-lai-") as temporary:
        directory = Path(temporary)
        with tarfile.open(archive, "r:gz") as bundle:
            members = [member for member in bundle.getmembers() if re.fullmatch(r"Global_UrbanTree_LAI_0\.5deg_\d{4}\.nc", member.name)]
            if len(members) != len(YEARS):
                raise RuntimeError(f"Expected {len(YEARS)} annual files, found {len(members)}")
            bundle.extractall(directory, members=members, filter="data")
        for year in YEARS:
            path = directory / f"Global_UrbanTree_LAI_0.5deg_{year}.nc"
            current_latitudes, annual = annual_lai(path)
            if latitudes is None:
                latitudes = current_latitudes
            elif not np.array_equal(latitudes, current_latitudes):
                raise RuntimeError(f"Latitude grid changed in {year}")
            arrays.append(annual)

    stack = np.stack(arrays)
    common = np.all(np.isfinite(stack), axis=0)
    union = np.any(np.isfinite(stack), axis=0)
    if latitudes is None:
        raise RuntimeError("No latitude grid found")
    weights = np.broadcast_to(np.cos(np.deg2rad(latitudes))[:, None], stack[0].shape)
    annual_weighted_means = [
        np.nansum(stack[index] * weights * common) / np.nansum(weights * common)
        for index in range(len(YEARS))
    ]

    result = {
        "version": "tulip_urban_tree_lai_analysis_2026_09_24_v1",
        "archive": {
            "bytes": archive.stat().st_size,
            "md5": archive_md5,
            "zenodoRecord": 14709655,
            "file": "global_0.5.tar.gz",
        },
        "grid": {
            "resolutionDegrees": 0.5,
            "annualFiles": len(arrays),
            "unionValidGridCells": int(union.sum()),
            "commonValidGridCells": int(common.sum()),
        },
        "method": {
            "annualStatistic": "Unweighted mean of the twelve monthly LAI values within each modeled grid cell.",
            "globalDiagnostic": "Cosine-latitude-weighted mean over grid cells valid in every year from 2000 through 2022.",
            "boundary": "This is a geographic-grid diagnostic of modeled urban-tree leaf area, not an urban-area-weighted canopy-cover change, affected ecosystem share, harmed-person count, or recovery estimate.",
        },
        "annualWeightedMeans": [
            {"year": int(year), "lai": rounded(value)}
            for year, value in zip(YEARS, annual_weighted_means, strict=True)
        ],
        "periodDiagnostics": {
            "fullRecord": period_diagnostic(stack, YEARS, 2000, weights, common),
            "sinceDirectCanopyStudyEnd": period_diagnostic(stack, YEARS, 2017, weights, common),
        },
        "interpretationBoundary": "The positive full-record change and negative 2017–2022 change show baseline sensitivity and non-monotonic leaf-area variation. Neither sign is converted into canopy-loss severity or reach without a compatible canopy-area denominator.",
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
