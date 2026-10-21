#!/usr/bin/env python3
"""Cross-check the Italian heat-endpoint temperature pattern with open ARCO ERA5.

This is an independent fallback validation for the blocked CDS ERA5-Land route.
It does not replace the predeclared ERA5-Land reconstruction or enable scores.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
import os
from pathlib import Path

import certifi
import geopandas as gpd
import numpy as np
import pandas as pd
import xarray as xr
from shapely.geometry import box


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
PLAN_PATH = CALIBRATION_DIR / "internal-europe-heat-regional-pattern-ingestion.json"
OUTPUT_PATH = CALIBRATION_DIR / "internal-europe-heat-arco-era5-crosscheck.json"
STORE = "gs://gcp-public-data-arco-era5/ar/1959-2022-6h-240x121_equiangular_with_poles_conservative.zarr"
STORE_DOCUMENTATION = "https://github.com/google-research/arco-era5"
YEARS = tuple(range(2015, 2022))
TRAINING_YEARS = tuple(range(2015, 2019))
VALIDATION_YEARS = tuple(range(2019, 2022))


def digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def load_reconstruction_module():
    path = ROOT / "scripts/reconstruct-europe-heat-regional-pattern.py"
    spec = importlib.util.spec_from_file_location("tulip_regional_pattern", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def round_metrics(metrics: dict) -> dict:
    return {key: round(value, 7) if isinstance(value, float) else value for key, value in metrics.items()}


def anomaly_metrics(observed: pd.DataFrame, reconstructed: pd.DataFrame) -> dict:
    columns = ["location", "year", "woy", "temp"]
    merged = observed[columns].merge(reconstructed[columns], on=["location", "year", "woy"], suffixes=("_observed", "_reconstructed"))
    for field in ("observed", "reconstructed"):
        training = merged[merged.year.isin(TRAINING_YEARS)].groupby(["location", "woy"])[f"temp_{field}"].mean()
        merged[f"anomaly_{field}"] = [row[f"temp_{field}"] - training.loc[(row.location, row.woy)] for _, row in merged.iterrows()]
    validation = merged[merged.year.isin(VALIDATION_YEARS)]
    errors = validation.anomaly_reconstructed - validation.anomaly_observed
    return round_metrics({
        "trainingYears": list(TRAINING_YEARS),
        "validationYears": list(VALIDATION_YEARS),
        "matchedRows": len(validation),
        "matchedRegions": validation.location.nunique(),
        "overallBiasC": float(errors.mean()),
        "medianAbsoluteErrorC": float(errors.abs().median()),
        "p95AbsoluteErrorC": float(errors.abs().quantile(0.95)),
        "maximumAbsoluteErrorC": float(errors.abs().max()),
        "pearsonCorrelation": float(np.corrcoef(validation.anomaly_observed, validation.anomaly_reconstructed)[0, 1]),
    })


def area_intersection_weights(helper, grid, regions) -> np.ndarray:
    latitudes = grid.latitudes
    longitudes = helper.normalized_longitudes(grid.longitudes)
    latitude_edges = helper.cell_edges(latitudes)
    longitude_edges = helper.cell_edges(longitudes)
    cells = []
    cell_ids = []
    for lat_index in range(len(latitudes)):
        south, north = sorted((latitude_edges[lat_index], latitude_edges[lat_index + 1]))
        for lon_index in range(len(longitudes)):
            west, east = sorted((longitude_edges[lon_index], longitude_edges[lon_index + 1]))
            cells.append(box(west, south, east, north))
            cell_ids.append(lat_index * len(longitudes) + lon_index)
    cell_frame = gpd.GeoDataFrame({"cell": cell_ids}, geometry=cells, crs="EPSG:4326")
    intersections = gpd.overlay(cell_frame, regions[["location", "geometry"]], how="intersection", keep_geom_type=False)
    intersections = intersections[~intersections.geometry.is_empty].to_crs("EPSG:3035")
    intersections["area"] = intersections.geometry.area
    region_index = {location: index for index, location in enumerate(regions.location)}
    weights = np.zeros((len(regions), len(latitudes) * len(longitudes)), dtype=np.float64)
    for row in intersections.itertuples():
        weights[region_index[row.location], row.cell] += row.area
    if np.any(weights.sum(axis=1) == 0):
        raise RuntimeError("Area-intersection weighting leaves at least one region without grid coverage")
    return weights


def main() -> None:
    os.environ.setdefault("SSL_CERT_FILE", certifi.where())
    helper = load_reconstruction_module()
    plan = json.loads(PLAN_PATH.read_text())
    regions = helper.prepare_regions(plan)
    region_ids = regions.location.tolist()
    dataset = xr.open_zarr(STORE, chunks=None, storage_options={"token": "anon"})
    temperature = dataset["2m_temperature"]
    latitude = temperature.latitude.sel(latitude=slice(34.5, 49.5)).values.astype(float)
    longitude = temperature.longitude.sel(longitude=slice(4.5, 19.5)).values.astype(float)
    grid = helper.GridDefinition(latitude, longitude)
    weights = area_intersection_weights(helper, grid, regions)
    frames = []
    raw_checks = []

    for year in YEARS:
        selection = temperature.sel(
            time=slice(f"{year}-05-25", f"{year}-09-07T23:59:59"),
            latitude=slice(34.5, 49.5),
            longitude=slice(4.5, 19.5),
        ).transpose("time", "latitude", "longitude")
        values = np.asarray(selection.values, dtype=float)
        if np.nanmedian(values) > 100:
            values -= 273.15
        regional = helper.apply_weights(values.reshape(values.shape[0], -1), weights)
        time = pd.to_datetime(np.asarray(selection.time.values))
        frame = pd.DataFrame(regional, columns=region_ids)
        frame.insert(0, "date", time)
        long = frame.melt(id_vars="date", var_name="location", value_name="temp")
        iso = long.date.dt.isocalendar()
        long["year"] = iso.year.astype(int)
        long["woy"] = iso.week.astype(int)
        frames.append(long.groupby(["location", "year", "woy"], as_index=False).temp.mean())
        raw_checks.append({
            "year": year,
            "timeSteps": int(values.shape[0]),
            "firstTimestamp": str(time.min()),
            "lastTimestamp": str(time.max()),
            "finiteFraction": round(float(np.isfinite(values).mean()), 9),
        })

    reconstructed = pd.concat(frames, ignore_index=True)
    reconstructed = reconstructed[(reconstructed.woy >= 22) & (reconstructed.woy <= 35)]
    public_path = ROOT / plan["sourceSummary"]["publicWeeklyTemperatures"]["localPath"]
    public = pd.read_csv(public_path)
    public = public[(public.woy >= 22) & (public.woy <= 35)][["location", "year", "woy", "temp"]]
    absolute = round_metrics(helper.comparison_metrics(public, reconstructed))
    anomalies = anomaly_metrics(public, reconstructed)
    criteria = plan["acceptanceCriteria"]["publicSampleComparison"]
    absolute_passes = helper.criteria_pass(absolute, criteria)

    payload = {
        "version": "tulip_europe_heat_arco_era5_crosscheck_2026_09_24_v1",
        "generatedOn": "2026-09-24",
        "status": "fallback_not_admitted_resolution_and_agreement_insufficient",
        "productionRatingsEnabled": 0,
        "purpose": "Test whether an openly accessible independent ERA5 rendering can support the regional-pattern step while the preferred ERA5-Land retrieval remains blocked by source-account licence acceptance.",
        "source": {
            "id": "google_arco_era5_1959_2022_6hour_240x121",
            "publisher": "Google Research; source data from ECMWF ERA5",
            "store": STORE,
            "documentation": STORE_DOCUMENTATION,
            "access": "anonymous public Google Cloud Storage",
            "temporalResolution": "6-hourly",
            "spatialGrid": "240 by 121 conservative equiangular grid with poles",
            "period": {"start": 1959, "end": 2021, "boundaryNote": "The store name says 1959-2022, but its decoded time coordinate ends on 2021-12-31; TULIP uses the decoded coordinate and does not invent 2022 values."},
            "variable": "2m_temperature",
        },
        "method": {
            "regionBoundary": plan["inputAudit"]["regionJoin"],
            "spatialAggregation": "area intersection",
            "validationYears": list(YEARS),
            "weeks": [22, 35],
            "absoluteComparison": "Direct comparison with the checksum-pinned public Italian region-week temperatures.",
            "anomalyComparison": "For each region and ISO week, subtract the 2015-2019 mean in each dataset and evaluate held-out 2020-2022 anomalies. This removes static elevation and grid-resolution bias; it is a declared cross-check, not the original reconstruction gate.",
        },
        "rawChecks": raw_checks,
        "results": {
            "absoluteTemperatures": absolute,
            "heldOutWeeklyAnomalies": anomalies,
            "passesPredeclaredAbsoluteReconstructionCriteria": absolute_passes,
        },
        "decision": {
            "admissionStatus": "rejected_for_source_removal_endpoint_attribution",
            "admittedUse": "Independent sensitivity check on the temporal regional pattern used by the source-removal heat endpoint.",
            "prohibitedUses": [
                "Do not substitute this coarse 6-hourly ERA5 product for the predeclared ERA5-Land daily reconstruction.",
                "Do not use absolute-temperature agreement to claim validation if held-out anomaly agreement fails.",
                "Do not enable or change a TULIP rating from this cross-check alone.",
                "Do not treat the Google rendering as an independent climate model; it is another rendering of ECMWF ERA5.",
            ],
            "nextGate": "Use the result to decide whether open reanalysis can constrain regional pattern uncertainty. Full 823-region endpoint coverage, propagated physical and epidemiological uncertainty and an independently reproduced endpoint remain required.",
            "finding": "The coarse public rendering reaches all 103 Italian regions but does not reproduce the public regional weekly temperatures closely enough. It is retained as a failed fallback and cannot validate the source-removal endpoint.",
        },
    }
    payload["digest"] = digest({"source": payload["source"], "method": payload["method"], "rawChecks": raw_checks, "results": payload["results"], "decision": payload["decision"]})
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    print(json.dumps({"output": str(OUTPUT_PATH.relative_to(ROOT)), "absolute": absolute, "anomalies": anomalies, "digest": payload["digest"]}, indent=2))


if __name__ == "__main__":
    main()
