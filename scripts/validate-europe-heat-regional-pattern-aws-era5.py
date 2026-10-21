#!/usr/bin/env python3
"""Validate the public Italian heat pattern against open 0.25-degree ERA5.

The acceptance thresholds are inherited unchanged from the predeclared regional-
pattern plan. Passing validates only the 103-region public sample; it never
enables a TULIP score or substitutes for full endpoint and uncertainty work.
"""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

import geopandas as gpd
import icechunk
import numpy as np
import pandas as pd
import xarray as xr
from shapely.geometry import box


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
PLAN_PATH = CALIBRATION_DIR / "internal-europe-heat-regional-pattern-ingestion.json"
COARSE_PATH = CALIBRATION_DIR / "internal-europe-heat-arco-era5-crosscheck.json"
OUTPUT_PATH = CALIBRATION_DIR / "internal-europe-heat-aws-era5-crosscheck.json"
BUCKET = "earthmover-icechunk-era5"
PREFIX = "icechunkV2"
REGION = "us-east-1"
SNAPSHOT_ID = "ZFKDHBCTBVHVXM3BQFV0"
GROUP = "single/temporal"
DATASET_DOCUMENTATION = "https://registry.opendata.aws/earthmover-era5/"
YEARS = tuple(range(2015, 2023))
TRAINING_YEARS = tuple(range(2015, 2019))
VALIDATION_YEARS = tuple(range(2019, 2023))


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
    merged = observed[columns].merge(
        reconstructed[columns], on=["location", "year", "woy"], suffixes=("_observed", "_reconstructed")
    )
    for field in ("observed", "reconstructed"):
        training = merged[merged.year.isin(TRAINING_YEARS)].groupby(["location", "woy"])[f"temp_{field}"].mean()
        merged[f"anomaly_{field}"] = [
            row[f"temp_{field}"] - training.loc[(row.location, row.woy)] for _, row in merged.iterrows()
        ]
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


def regional_weekly(values: np.ndarray, time: pd.DatetimeIndex, weights: np.ndarray,
                    region_ids: list[str], timezone_shift_hours: int) -> pd.DataFrame:
    """Match the study's hourly -> daily regional mean -> ISO week sequence."""
    regional = helper_apply_weights(values.reshape(values.shape[0], -1), weights)
    shifted_time = time + pd.Timedelta(hours=timezone_shift_hours)
    frame = pd.DataFrame(regional, columns=region_ids)
    frame.insert(0, "date", shifted_time.floor("D"))
    daily = frame.groupby("date", as_index=False).mean(numeric_only=True)
    long = daily.melt(id_vars="date", var_name="location", value_name="temp")
    iso = long.date.dt.isocalendar()
    long["year"] = iso.year.astype(int)
    long["woy"] = iso.week.astype(int)
    return long.groupby(["location", "year", "woy"], as_index=False).temp.mean()


def helper_apply_weights(values: np.ndarray, weights: np.ndarray) -> np.ndarray:
    finite = np.isfinite(values)
    numerator = np.where(finite, values, 0.0) @ weights.T
    denominator = finite.astype(float) @ weights.T
    return np.divide(numerator, denominator, out=np.full_like(numerator, np.nan), where=denominator > 0)


def method_result(helper, public: pd.DataFrame, reconstructed: pd.DataFrame, criteria: dict) -> dict:
    reconstructed = reconstructed[(reconstructed.woy >= 22) & (reconstructed.woy <= 35)]
    absolute = round_metrics(helper.comparison_metrics(public, reconstructed))
    anomalies = anomaly_metrics(public, reconstructed)
    return {
        "absoluteTemperatures": absolute,
        "heldOutWeeklyAnomalies": anomalies,
        "passesPredeclaredAbsoluteReconstructionCriteria": helper.criteria_pass(absolute, criteria),
    }


def main() -> None:
    helper = load_reconstruction_module()
    plan = json.loads(PLAN_PATH.read_text())
    coarse = json.loads(COARSE_PATH.read_text())
    regions = helper.prepare_regions(plan)
    region_ids = regions.location.tolist()

    storage = icechunk.s3_storage(bucket=BUCKET, prefix=PREFIX, region=REGION, anonymous=True)
    repository = icechunk.Repository.open(storage)
    session = repository.readonly_session(snapshot_id=SNAPSHOT_ID)
    dataset = xr.open_zarr(session.store, group=GROUP, consolidated=False, chunks=None)
    temperature = dataset["t2m"]
    latitude = temperature.latitude.sel(latitude=slice(49.5, 34.5)).values.astype(float)
    longitude = temperature.longitude.sel(longitude=slice(4.5, 19.5)).values.astype(float)
    grid = helper.GridDefinition(latitude, longitude)
    area_weights = area_intersection_weights(helper, grid, regions)
    land_fraction = np.asarray(
        dataset["lsm"].sel(latitude=slice(49.5, 34.5), longitude=slice(4.5, 19.5)).values,
        dtype=float,
    ).reshape(-1)
    land_fraction_weights = area_weights * np.clip(land_fraction, 0.0, 1.0)[None, :]
    if np.any(land_fraction_weights.sum(axis=1) == 0):
        raise RuntimeError("Land-fraction weighting leaves at least one region without grid coverage")
    method_frames = {
        "area_intersection_utcplus0000": [],
        "area_intersection_utcplus0100": [],
        "land_fraction_area_utcplus0000": [],
        "land_fraction_area_utcplus0100": [],
    }
    raw_checks = []

    for year in YEARS:
        selection = temperature.sel(
            valid_time=slice(f"{year}-05-25", f"{year}-09-07T23:59:59"),
            latitude=slice(49.5, 34.5),
            longitude=slice(4.5, 19.5),
        ).transpose("valid_time", "latitude", "longitude")
        values = np.asarray(selection.values, dtype=float)
        if np.nanmedian(values) > 100:
            values -= 273.15
        time = pd.to_datetime(np.asarray(selection.valid_time.values))
        method_frames["area_intersection_utcplus0000"].append(
            regional_weekly(values, time, area_weights, region_ids, 0)
        )
        method_frames["area_intersection_utcplus0100"].append(
            regional_weekly(values, time, area_weights, region_ids, 1)
        )
        method_frames["land_fraction_area_utcplus0000"].append(
            regional_weekly(values, time, land_fraction_weights, region_ids, 0)
        )
        method_frames["land_fraction_area_utcplus0100"].append(
            regional_weekly(values, time, land_fraction_weights, region_ids, 1)
        )
        raw_checks.append({
            "year": year,
            "timeSteps": int(values.shape[0]),
            "firstTimestamp": str(time.min()),
            "lastTimestamp": str(time.max()),
            "finiteFraction": round(float(np.isfinite(values).mean()), 9),
        })

    public_path = ROOT / plan["sourceSummary"]["publicWeeklyTemperatures"]["localPath"]
    public = pd.read_csv(public_path)
    public = public[(public.woy >= 22) & (public.woy <= 35)][["location", "year", "woy", "temp"]]
    criteria = plan["acceptanceCriteria"]["publicSampleComparison"]
    sensitivity_methods = {
        name: method_result(helper, public, pd.concat(parts, ignore_index=True), criteria)
        for name, parts in method_frames.items()
    }
    primary_method = "area_intersection_utcplus0000"
    primary = sensitivity_methods[primary_method]
    absolute = primary["absoluteTemperatures"]
    anomalies = primary["heldOutWeeklyAnomalies"]
    absolute_passes = primary["passesPredeclaredAbsoluteReconstructionCriteria"]
    admission_status = (
        "accepted_for_public_sample_temperature_pattern_validation_only"
        if absolute_passes else "rejected_for_source_removal_endpoint_attribution"
    )
    status = (
        "public_sample_temperature_pattern_validated_full_endpoint_still_pending"
        if absolute_passes else "fallback_not_admitted_agreement_insufficient"
    )

    coarse_absolute = coarse["results"]["absoluteTemperatures"]
    coarse_anomalies = coarse["results"]["heldOutWeeklyAnomalies"]
    comparison = {
        "absoluteMedianErrorReductionC": round(coarse_absolute["medianAbsoluteErrorC"] - absolute["medianAbsoluteErrorC"], 7),
        "absoluteP95ErrorReductionC": round(coarse_absolute["p95AbsoluteErrorC"] - absolute["p95AbsoluteErrorC"], 7),
        "anomalyMedianErrorReductionC": round(coarse_anomalies["medianAbsoluteErrorC"] - anomalies["medianAbsoluteErrorC"], 7),
        "anomalyP95ErrorReductionC": round(coarse_anomalies["p95AbsoluteErrorC"] - anomalies["p95AbsoluteErrorC"], 7),
    }

    payload = {
        "version": "tulip_europe_heat_aws_era5_crosscheck_2026_09_24_v1",
        "generatedOn": "2026-09-24",
        "status": status,
        "productionRatingsEnabled": 0,
        "purpose": "Test an anonymously accessible 0.25-degree ERA5 time-series rendering against the complete public Italian regional-temperature sample using thresholds fixed before this retrieval.",
        "source": {
            "id": "earthmover_aws_icechunk_era5_0p25_hourly",
            "publisher": "Earthmover on the AWS Open Data Sponsorship Program; source data from ECMWF ERA5",
            "bucket": f"s3://{BUCKET}/{PREFIX}",
            "region": REGION,
            "icechunkSnapshotId": SNAPSHOT_ID,
            "group": GROUP,
            "documentation": DATASET_DOCUMENTATION,
            "access": "anonymous public AWS S3",
            "license": "CC BY 4.0",
            "temporalResolution": "hourly",
            "spatialGrid": "0.25 degree, 721 by 1440",
            "period": {"start": 1940, "retrievedStop": str(pd.to_datetime(dataset.valid_time.values[-1]))},
            "variable": "t2m",
            "chunking": {key: int(value) for key, value in zip(temperature.dims, temperature.encoding["chunks"])},
        },
        "method": {
            "regionBoundary": plan["inputAudit"]["regionJoin"],
            "spatialAggregation": "area intersection",
            "validationYears": list(YEARS),
            "weeks": [22, 35],
            "temperatureAggregation": "Hourly regional means aggregated first to daily means and then to ISO region-week means, matching the published sequence.",
            "absoluteComparison": "Direct comparison with all checksum-pinned public Italian region-week temperatures from 2015 through 2022.",
            "anomalyComparison": "For each region and ISO week, subtract the 2015–2018 mean in each dataset and evaluate held-out 2019–2022 anomalies.",
            "predeclaredCriteria": criteria,
            "primaryMethod": primary_method,
            "diagnosticSensitivityBoundary": "UTC+1 is a predeclared timezone sensitivity. Land-fraction weighting is a post-result diagnostic for the ERA5-versus-ERA5-Land mismatch and cannot qualify this fallback for admission.",
        },
        "rawChecks": raw_checks,
        "results": {
            "absoluteTemperatures": absolute,
            "heldOutWeeklyAnomalies": anomalies,
            "passesPredeclaredAbsoluteReconstructionCriteria": absolute_passes,
            "methodSensitivities": sensitivity_methods,
            "improvementVersusCoarseOpenFallback": comparison,
        },
        "decision": {
            "admissionStatus": admission_status,
            "admittedUse": (
                "Validate the regional temperature-pattern reconstruction on the complete 103-region public Italian sample."
                if absolute_passes else "Independent sensitivity check on the regional pattern only."
            ),
            "prohibitedUses": [
                "Do not enable or change a TULIP rating from this public-sample cross-check.",
                "Do not treat the AWS rendering as an independent climate model; it is a redistribution of ECMWF ERA5.",
                "Do not claim validation for the full 823-region endpoint from the 103-region Italian sample.",
                "Do not omit physical, epidemiological or population uncertainty from the source-removal endpoint.",
            ],
            "nextGate": "Extend the validated method to all 823 endpoint regions, propagate regional-pattern, emissions-response, epidemiological and population uncertainty, then reproduce the source-attributable endpoint independently.",
            "finding": (
                "The public 0.25-degree rendering passes every predeclared Italian-sample reconstruction tolerance. It may validate that temperature-pattern step only; the complete European endpoint and uncertainty gates remain open."
                if absolute_passes else "The higher-resolution public rendering improves the coarse fallback but still fails at least one predeclared Italian-sample reconstruction tolerance, so it remains outside source-removal endpoint attribution."
            ),
        },
    }
    payload["digest"] = digest({
        "source": payload["source"], "method": payload["method"], "rawChecks": raw_checks,
        "results": payload["results"], "decision": payload["decision"],
    })
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)), "status": status,
        "absolute": absolute, "anomalies": anomalies, "comparison": comparison,
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
