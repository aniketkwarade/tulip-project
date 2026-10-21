#!/usr/bin/env python3
"""Reproduce a current-period factual-minus-counterfactual thaw-depth screen."""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
import requests
import xarray as xr


ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / "tmp" / "tulip-isimip-permafrost"
OUTPUT = ROOT / "artifacts" / "tulip-calibration-2026-09-22" / "permafrost-thaw-counterfactual-reference-snapshot.json"

FILES = {
    "observed_climate": {
        "dataset": "lpjml5-7-10-fire_20crv3-era5_obsclim_histsoc_default_thawdepth_global_annual",
        "filename": "lpjml5-7-10-fire_20crv3-era5_obsclim_histsoc_default_thawdepth_global_annual_1901_2021.nc",
        "url": "https://files.isimip.org/ISIMIP3a/OutputData/biomes/LPJmL5-7-10-fire/20crv3-era5/historical/lpjml5-7-10-fire_20crv3-era5_obsclim_histsoc_default_thawdepth_global_annual_1901_2021.nc",
        "sha512": "0223a11d3faa5311ad7ed18d24791ad0a12974f56de7aa5e637e39c16075472b1fab13d54e9a2377d71e417b0bb4058a9e63a4c2e8f3fd1724b7ecad637c69c8",
        "size": 10_486_317,
    },
    "counterfactual_climate": {
        "dataset": "lpjml5-7-10-fire_20crv3-era5_counterclim_histsoc_default_thawdepth_global_annual",
        "filename": "lpjml5-7-10-fire_20crv3-era5_counterclim_histsoc_default_thawdepth_global_annual_1901_2021.nc",
        "url": "https://files.isimip.org/ISIMIP3a/OutputData/biomes/LPJmL5-7-10-fire/20crv3-era5/historical/lpjml5-7-10-fire_20crv3-era5_counterclim_histsoc_default_thawdepth_global_annual_1901_2021.nc",
        "sha512": "1dbc273a9b2a793234701f4ee19e76c1741d17a85b2e427649e98b79683e7c78d8eaea344a63f76a5ae856f0b4778a907fc3a41a067ca03f2ce358ae4f0104ab",
        "size": 10_705_100,
    },
    "classic_observed_climate": {
        "dataset": "classic_gswp3-w5e5_obsclim_histsoc_default_thawdepth_global_annual",
        "filename": "classic_gswp3-w5e5_obsclim_histsoc_default_thawdepth_global_annual_1901_2019.nc",
        "url": "https://files.isimip.org/ISIMIP3a/OutputData/biomes/CLASSIC/gswp3-w5e5/historical/classic_gswp3-w5e5_obsclim_histsoc_default_thawdepth_global_annual_1901_2019.nc",
        "sha512": "29c1207f82035f34ef5510df116a50ef95f5d0e8700a1d5f55cb45cf848efa4938034c7cd2c4bb05a46f42a7a141e66fe09750952c21988dc2dcbb16f0f64d4e",
        "size": 2_588_047,
    },
    "classic_counterfactual_climate": {
        "dataset": "classic_gswp3-w5e5_counterclim_histsoc_default_thawdepth_global_annual",
        "filename": "classic_gswp3-w5e5_counterclim_histsoc_default_thawdepth_global_annual_1901_2019.nc",
        "url": "https://files.isimip.org/ISIMIP3a/OutputData/biomes/CLASSIC/gswp3-w5e5/historical/classic_gswp3-w5e5_counterclim_histsoc_default_thawdepth_global_annual_1901_2019.nc",
        "sha512": "2ed6e2df986f6e4bb73d8636a2ef9a964e4dc9cc0d25f3a888aa6eb3b148e01198d92ffa5fd5542e6e802a2ca144966f50426946d69a07b4fd9b8bcd0303b796",
        "size": 2_615_747,
    },
}


def file_hash(path: Path, algorithm: str) -> str:
    digest = hashlib.new(algorithm)
    with path.open("rb") as source:
        while chunk := source.read(1024 * 1024):
            digest.update(chunk)
    return digest.hexdigest()


def obtain_file(metadata: dict) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    path = CACHE / metadata["filename"]
    if path.exists() and path.stat().st_size == metadata["size"] and file_hash(path, "sha512") == metadata["sha512"]:
        return path
    temporary = path.with_suffix(path.suffix + ".part")
    with requests.get(
        metadata["url"],
        headers={"User-Agent": "TULIP-calibration/1.0"},
        timeout=120,
        stream=True,
    ) as response, temporary.open("wb") as target:
        response.raise_for_status()
        for chunk in response.iter_content(1024 * 1024):
            if chunk:
                target.write(chunk)
    if temporary.stat().st_size != metadata["size"]:
        raise RuntimeError(f"Size mismatch for {metadata['filename']}")
    if file_hash(temporary, "sha512") != metadata["sha512"]:
        raise RuntimeError(f"SHA-512 mismatch for {metadata['filename']}")
    temporary.replace(path)
    return path


def weighted_quantile(values: np.ndarray, weights: np.ndarray, quantile: float) -> float:
    values = values.ravel()
    weights = weights.ravel()
    valid = np.isfinite(values) & np.isfinite(weights) & (weights > 0)
    values = values[valid]
    weights = weights[valid]
    order = np.argsort(values)
    values = values[order]
    weights = weights[order]
    index = np.searchsorted(np.cumsum(weights), quantile * weights.sum(), side="left")
    return float(values[min(index, values.size - 1)])


def rounded(value: float) -> float:
    return round(float(value), 9)


def analyse(
    latitude_floor: float,
    observed: xr.DataArray,
    counterfactual: xr.DataArray,
    current_start: int = 1991,
    current_end: int = 2020,
    represented_soil_bottom_m: float = 13.0,
) -> dict:
    baseline_observed = observed.sel(time=slice(1901, 1930)).mean("time")
    baseline_counterfactual = counterfactual.sel(time=slice(1901, 1930)).mean("time")
    current_observed = observed.sel(time=slice(current_start, current_end)).mean("time")
    current_counterfactual = counterfactual.sel(time=slice(current_start, current_end)).mean("time")

    # LPJmL reports 13 m when annual thaw reaches the bottom of its represented soil column.
    # The domain is fixed from the early counterfactual run so later warming cannot redefine it.
    domain = (
        (counterfactual.lat >= latitude_floor)
        & (baseline_counterfactual > 0)
        & (baseline_counterfactual < represented_soil_bottom_m - 0.001)
    )
    difference_in_differences = (
        (current_observed - baseline_observed)
        - (current_counterfactual - baseline_counterfactual)
    ).where(domain)
    weights = (xr.ones_like(difference_in_differences) * np.cos(np.deg2rad(difference_in_differences.lat))).where(
        difference_in_differences.notnull()
    )
    total_weight = float(weights.sum())

    def weighted_share(mask: xr.DataArray) -> float:
        return float(weights.where(mask).sum() / total_weight)

    return {
        "latitudeFloorDegreesNorth": latitude_floor,
        "comparisonPeriod": {"start": current_start, "end": current_end},
        "representedSoilBottomM": represented_soil_bottom_m,
        "representedGridCells": int(difference_in_differences.notnull().sum()),
        "areaWeightedAdditionalThawDepthM": {
            "mean": rounded((difference_in_differences * weights).sum() / total_weight),
            "p05": rounded(weighted_quantile(difference_in_differences.values, weights.values, 0.05)),
            "p25": rounded(weighted_quantile(difference_in_differences.values, weights.values, 0.25)),
            "median": rounded(weighted_quantile(difference_in_differences.values, weights.values, 0.50)),
            "p75": rounded(weighted_quantile(difference_in_differences.values, weights.values, 0.75)),
            "p95": rounded(weighted_quantile(difference_in_differences.values, weights.values, 0.95)),
        },
        "areaWeightedShare": {
            "positive": rounded(weighted_share(difference_in_differences > 0)),
            "above005m": rounded(weighted_share(difference_in_differences > 0.05)),
            "above010m": rounded(weighted_share(difference_in_differences > 0.10)),
            "above025m": rounded(weighted_share(difference_in_differences > 0.25)),
            "above050m": rounded(weighted_share(difference_in_differences > 0.50)),
            "above100m": rounded(weighted_share(difference_in_differences > 1.00)),
            "factualAtModelBottomWhenCounterfactualIsNot": rounded(
                weighted_share(
                    (current_observed >= represented_soil_bottom_m - 0.001)
                    & (current_counterfactual < represented_soil_bottom_m - 0.001)
                )
            ),
        },
    }


paths = {key: obtain_file(value) for key, value in FILES.items()}
observed_dataset = xr.open_dataset(paths["observed_climate"], decode_times=False)
counterfactual_dataset = xr.open_dataset(paths["counterfactual_climate"], decode_times=False)

for dataset in (observed_dataset, counterfactual_dataset):
    if dataset["thawdepth"].attrs.get("units") != "m":
        raise RuntimeError("Expected thaw depth in metres")
    if dataset.sizes != {"time": 121, "lat": 360, "lon": 720}:
        raise RuntimeError(f"Unexpected dataset dimensions: {dataset.sizes}")

np.testing.assert_allclose(observed_dataset.lat.values, counterfactual_dataset.lat.values)
np.testing.assert_allclose(observed_dataset.lon.values, counterfactual_dataset.lon.values)
np.testing.assert_allclose(observed_dataset.time.values, counterfactual_dataset.time.values)
years = 1901 + np.rint(observed_dataset.time.values / 365).astype(int)
if years.tolist() != list(range(1901, 2022)):
    raise RuntimeError("Expected one record per year from 1901 through 2021")

observed = observed_dataset["thawdepth"].assign_coords(time=years)
counterfactual = counterfactual_dataset["thawdepth"].assign_coords(time=years)
primary = analyse(45, observed, counterfactual)
sensitivities = [analyse(latitude, observed, counterfactual) for latitude in (50, 60)]

classic_observed_dataset = xr.open_dataset(paths["classic_observed_climate"], decode_times=False)
classic_counterfactual_dataset = xr.open_dataset(paths["classic_counterfactual_climate"], decode_times=False)
for dataset in (classic_observed_dataset, classic_counterfactual_dataset):
    if dataset["thawdepth"].attrs.get("units") != "m":
        raise RuntimeError("Expected CLASSIC thaw depth in metres")
    if dataset.sizes != {"time": 119, "lat": 360, "lon": 720}:
        raise RuntimeError(f"Unexpected CLASSIC dataset dimensions: {dataset.sizes}")
np.testing.assert_allclose(classic_observed_dataset.lat.values, classic_counterfactual_dataset.lat.values)
np.testing.assert_allclose(classic_observed_dataset.lon.values, classic_counterfactual_dataset.lon.values)
np.testing.assert_allclose(classic_observed_dataset.time.values, classic_counterfactual_dataset.time.values)
classic_years = 1901 + np.rint(classic_observed_dataset.time.values).astype(int)
if classic_years.tolist() != list(range(1901, 2020)):
    raise RuntimeError("Expected one CLASSIC record per year from 1901 through 2019")
classic_observed = classic_observed_dataset["thawdepth"].assign_coords(time=classic_years)
classic_counterfactual = classic_counterfactual_dataset["thawdepth"].assign_coords(time=classic_years)
model_sensitivity = [
    {
        "model": "LPJmL5-7-10-fire",
        "climateForcing": "20CRv3-ERA5",
        "result": analyse(45, observed, counterfactual, 1981, 2010, 13.0),
    },
    {
        "model": "CLASSIC",
        "climateForcing": "GSWP3-W5E5",
        "result": analyse(45, classic_observed, classic_counterfactual, 1981, 2010, 61.4),
    },
]

payload = {
    "version": "tulip_isimip_permafrost_thaw_counterfactual_2026_09_24_v1",
    "preparedOn": "2026-09-24",
    "status": "physical_counterfactual_validated_not_terminal_harm",
    "productionRatingsEnabled": 0,
    "nodeId": "permafrost_thaw",
    "source": {
        "repository": "ISIMIP3a",
        "model": "LPJmL5-7-10-fire",
        "climateForcing": "20CRv3-ERA5",
        "socialForcing": "histsoc",
        "sensitivityScenario": "default",
        "variable": "Annual maximum thaw depth",
        "unit": "m",
        "doi": "https://doi.org/10.48364/ISIMIP.398165.11",
        "protocol": "https://protocol.isimip.org/",
        "files": FILES,
    },
    "method": {
        "baseline": {"start": 1901, "end": 1930, "purpose": "Fixed early-period model baseline."},
        "currentNormal": {"start": 1991, "end": 2020, "purpose": "Most recent completed WMO standard normal represented by both files."},
        "equation": "[(obsclim 1991–2020) − (obsclim 1901–1930)] − [(counterclim 1991–2020) − (counterclim 1901–1930)]",
        "primaryDomain": "Grid cells at or north of 45°N with early-counterfactual annual maximum thaw depth above 0 m and below the LPJmL 13 m represented-soil boundary.",
        "weighting": "Cell values are weighted by cosine of latitude. Reported shares refer to the represented model domain, not an observed global permafrost-area census.",
    },
    "primaryResult": primary,
    "latitudeSensitivity": sensitivities,
    "modelSensitivity1981To2010": {
        "comparisonNormal": {"start": 1981, "end": 2010},
        "reason": "Use a complete WMO standard normal represented by both independent land-surface model pairs.",
        "models": model_sensitivity,
        "interpretation": "Both models attribute deeper annual maximum thaw to the factual climate, but their magnitude differs materially. Direction is robust in this two-model screen; magnitude is model dependent and is not a probability interval.",
    },
    "interpretation": {
        "plainEnglish": f"Within the model's fixed northern thaw domain, the typical grid cell shows about {primary['areaWeightedAdditionalThawDepthM']['median'] * 100:.1f} cm of additional annual maximum thaw by 1991–2020 in the factual climate change run compared with the detrended-climate counterfactual, after subtracting the early-period model difference.",
        "causalUse": "The matched runs strengthen the physical attribution that long-term climate change deepened seasonal thaw in the represented northern domain.",
        "tulipUse": "Admit as physical attribution evidence for Permafrost Thaw only. Do not convert metres or modeled-area shares directly into TULIP human or ecosystem severity, reach or persistence.",
    },
    "limitations": [
        "The primary current-normal estimate is one land-surface model and one climate forcing. A second model agrees on direction for 1981–2010 but differs materially in magnitude; two models do not constitute a probability distribution.",
        "Annual maximum thaw depth is not thermokarst area, subsidence, carbon release, biodiversity loss, infrastructure damage or a count of people harmed.",
        "The 13 m value is the bottom of the LPJmL represented soil column. Reaching it is not proof that all deeper permafrost disappeared.",
        "The 45°N domain rule is declared for this audit and tested at 50°N and 60°N; it is not a universal scientific threshold for permafrost.",
        "A physical counterfactual cannot close TULIP terminal-consequence or recovery-time axes without compatible endpoint evidence.",
    ],
    "ratingDecision": {
        "candidate": {"value": 5.9, "grade": "C", "range": {"lower": 3.6, "upper": 8.1}, "confidence": "C"},
        "change": "none",
        "reason": "The new evidence improves attribution of the physical state but supplies none of the six terminal human and ecosystem consequence axes that remain bounded.",
    },
}

digest_input = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
payload["digest"] = hashlib.sha256(digest_input).hexdigest()
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(payload, indent=2) + "\n")
print(json.dumps({"output": str(OUTPUT), "status": payload["status"], "primaryResult": primary, "digest": payload["digest"]}, indent=2))
