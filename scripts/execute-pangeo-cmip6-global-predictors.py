#!/usr/bin/env python3
"""Execute exact-member CMIP6 global-temperature predictors from frozen routes.

The output is an independent calibration input. It never changes a TULIP axis
or score. Each model is checkpointed atomically so interrupted cloud reads can
be resumed without silently substituting another model, member, grid or area
method.
"""

from __future__ import annotations

import argparse
import contextlib
import fcntl
import gc
import hashlib
import json
import math
import os
import time
from pathlib import Path

import cftime
import numpy as np
import s3fs
import xarray as xr
import zarr


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
ROUTES_PATH = CALIBRATION_DIR / "pangeo-cmip6-global-predictor-routes.json"
UPSTREAM_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-global-predictors.json"
OUTPUT_PATH = CALIBRATION_DIR / "pangeo-cmip6-global-predictor-execution.json"
REPORT_PATH = CALIBRATION_DIR / "pangeo-cmip6-global-predictor-execution-report.md"
CHECKPOINT_ROOT = ROOT / "tmp/tulip-independent-pattern/pangeo-global-predictor-checkpoints"
MANIFEST_LOCK_PATH = CHECKPOINT_ROOT / ".manifest.lock"
CROSSCHECK_PATH = ROOT / "tmp/tulip-independent-pattern/ipcc-ar6-figure-3-4-panel-a.nc"
FIGURE_FILE_CACHE = ROOT / "tmp/tulip-independent-pattern/global-predictor-files"

VERSION = "tulip_pangeo_cmip6_global_predictor_execution_2026_09_26_v1"
BASELINE_YEARS = tuple(range(1850, 1901))
ANALYSIS_YEARS = tuple(range(1950, 2023))
REQUIRED_YEARS = tuple(range(1850, 2023))


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def unique_temporary_path(path: Path) -> Path:
    return path.with_name(f".{path.name}.{os.getpid()}.{time.time_ns()}.tmp")


def atomic_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = unique_temporary_path(path)
    try:
        temporary.write_text(json.dumps(payload, indent=2) + "\n")
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


@contextlib.contextmanager
def manifest_lock(path: Path = MANIFEST_LOCK_PATH):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def route_identity(route: dict) -> dict:
    return {
        "canonicalModel": route["canonicalModel"],
        "member": route["member"],
        "historicalZstore": route["historical"]["zstore"],
        "ssp245Zstore": route["ssp245"]["zstore"],
        "areaMethod": route["areaMethod"],
        "areaZstore": route["areacella"]["zstore"] if route.get("areacella") else None,
    }


def route_digest(route: dict) -> str:
    return canonical_digest(route_identity(route))


def checkpoint_path(model: str) -> Path:
    safe = model.replace("/", "_")
    return CHECKPOINT_ROOT / f"{safe}.json"


def open_group(fs: s3fs.S3FileSystem, zstore: str):
    if not zstore.startswith("s3://cmip6-pds/"):
        raise RuntimeError(f"Unapproved CMIP6 store: {zstore}")
    mapper = s3fs.S3Map(root=zstore.removeprefix("s3://"), s3=fs, check=False)
    return zarr.open_consolidated(store=mapper, mode="r")


def array_dimensions(array) -> list[str]:
    dimensions = list(array.attrs.get("_ARRAY_DIMENSIONS", []))
    if len(dimensions) != array.ndim:
        raise RuntimeError(f"Missing or invalid _ARRAY_DIMENSIONS for {array.path}")
    return dimensions


def decode_cf_values(array, selection=slice(None)) -> np.ndarray:
    raw = np.asarray(array[selection])
    values = raw.astype(np.float64, copy=False)
    invalid = ~np.isfinite(values)
    fill_values = [getattr(array, "fill_value", None), array.attrs.get("_FillValue"), array.attrs.get("missing_value")]
    for fill in fill_values:
        if fill is not None and np.isscalar(fill):
            invalid |= raw == fill
    scale = float(array.attrs.get("scale_factor", 1.0))
    offset = float(array.attrs.get("add_offset", 0.0))
    values = values * scale + offset
    values[invalid] = np.nan
    return values


def spherical_areas_from_bounds(group, spatial_dims: list[str], spatial_shape: tuple[int, ...]) -> tuple[np.ndarray, dict]:
    if spatial_dims != ["lat", "lon"] or len(spatial_shape) != 2:
        raise RuntimeError(f"Coordinate-bound areas require [lat, lon], got {spatial_dims}")
    lat_name = group["lat"].attrs.get("bounds")
    lon_name = group["lon"].attrs.get("bounds")
    if not lat_name or not lon_name or lat_name not in group or lon_name not in group:
        raise RuntimeError("Latitude or longitude bounds are absent")
    lat_bounds = decode_cf_values(group[lat_name])
    lon_bounds = decode_cf_values(group[lon_name])
    if lat_bounds.shape != (spatial_shape[0], 2) or lon_bounds.shape != (spatial_shape[1], 2):
        raise RuntimeError("Coordinate bounds do not match the temperature grid")
    lat_low = np.clip(np.minimum(lat_bounds[:, 0], lat_bounds[:, 1]), -90.0, 90.0)
    lat_high = np.clip(np.maximum(lat_bounds[:, 0], lat_bounds[:, 1]), -90.0, 90.0)
    lat_factor = np.abs(np.sin(np.deg2rad(lat_high)) - np.sin(np.deg2rad(lat_low)))
    lon_width = np.abs(lon_bounds[:, 1] - lon_bounds[:, 0])
    lon_width = np.where(lon_width > 180.0, 360.0 - lon_width, lon_width)
    lon_factor = np.deg2rad(lon_width)
    weights = lat_factor[:, None] * lon_factor[None, :]
    coverage = float(weights.sum())
    if not np.all(np.isfinite(weights)) or np.any(weights <= 0) or not math.isclose(coverage, 4 * math.pi, rel_tol=5e-3):
        raise RuntimeError(f"Invalid spherical area coverage: {coverage}")
    return weights, {
        "method": "spherical_area_from_coordinate_bounds",
        "latBoundsVariable": lat_name,
        "lonBoundsVariable": lon_name,
        "normalizedSphereArea": coverage,
    }


def exact_area_weights(fs: s3fs.S3FileSystem, route: dict, spatial_dims: list[str], spatial_shape: tuple[int, ...]) -> tuple[np.ndarray, dict]:
    group = open_group(fs, route["areacella"]["zstore"])
    if "areacella" not in group:
        raise RuntimeError("Frozen areacella store has no areacella array")
    area = group["areacella"]
    dimensions = array_dimensions(area)
    values = decode_cf_values(area)
    if dimensions != spatial_dims:
        if set(dimensions) != set(spatial_dims):
            raise RuntimeError(f"areacella dimensions {dimensions} do not match tas {spatial_dims}")
        values = np.transpose(values, [dimensions.index(dim) for dim in spatial_dims])
        dimensions = spatial_dims
    if values.shape != spatial_shape:
        raise RuntimeError(f"areacella shape {values.shape} does not match tas {spatial_shape}")
    if not np.all(np.isfinite(values)) or np.any(values <= 0):
        raise RuntimeError("areacella contains missing or non-positive areas")
    total = float(values.sum())
    if not 4.5e14 < total < 5.7e14:
        raise RuntimeError(f"Implausible global areacella sum: {total}")
    return values, {
        "method": "exact_areacella",
        "dimensions": dimensions,
        "units": area.attrs.get("units"),
        "globalAreaSquareMetres": total,
    }


def decoded_years_and_durations(group) -> tuple[np.ndarray, np.ndarray]:
    time_array = group["time"]
    units = time_array.attrs.get("units")
    calendar = time_array.attrs.get("calendar", "standard")
    if not units:
        raise RuntimeError("Time units are absent")
    dates = cftime.num2date(np.asarray(time_array[:]), units=units, calendar=calendar, only_use_cftime_datetimes=True)
    years = np.asarray([date.year for date in dates], dtype=np.int32)
    months = np.asarray([date.month for date in dates], dtype=np.int8)
    bounds_name = time_array.attrs.get("bounds")
    if not bounds_name or bounds_name not in group:
        raise RuntimeError("Monthly time bounds are absent")
    bounds = decode_cf_values(group[bounds_name])
    if bounds.shape != (len(years), 2):
        raise RuntimeError("Monthly time bounds do not match the time coordinate")
    durations = bounds[:, 1] - bounds[:, 0]
    if not np.all(np.isfinite(durations)) or np.any(durations <= 0):
        raise RuntimeError("Monthly time bounds contain invalid durations")
    for year in np.unique(years):
        selected = months[years == year]
        if len(selected) != 12 or sorted(selected.tolist()) != list(range(1, 13)):
            raise RuntimeError(f"Incomplete monthly calendar year {year}")
    return years, durations


def monthly_global_means(tas, weights: np.ndarray, stop: int | None = None, progress_label: str | None = None) -> tuple[np.ndarray, float]:
    if array_dimensions(tas)[0] != "time":
        raise RuntimeError("Temperature time dimension is not first")
    stop = tas.shape[0] if stop is None else stop
    chunk = int(tas.chunks[0])
    means = np.empty(stop, dtype=np.float64)
    minimum_coverage = 1.0
    total_weight = float(weights.sum())
    for start in range(0, stop, chunk):
        end = min(stop, start + chunk)
        values = decode_cf_values(tas, (slice(start, end),) + (slice(None),) * weights.ndim)
        finite = np.isfinite(values)
        denominators = np.where(finite, weights, 0.0).sum(axis=tuple(range(1, values.ndim)))
        numerators = np.where(finite, values * weights, 0.0).sum(axis=tuple(range(1, values.ndim)))
        coverage = denominators / total_weight
        minimum_coverage = min(minimum_coverage, float(coverage.min()))
        if np.any(coverage < 0.99):
            raise RuntimeError(f"Temperature grid coverage below 99% in rows {start}:{end}")
        means[start:end] = numerators / denominators
        if progress_label:
            print(f"{progress_label}: processed monthly rows {start + 1:,}–{end:,}/{stop:,}", flush=True)
    if not np.all(np.isfinite(means)) or np.any((means < 180.0) | (means > 330.0)):
        raise RuntimeError("Implausible monthly global temperature")
    return means, minimum_coverage


def annual_means(group, weights: np.ndarray, first_year: int, last_year: int, progress_label: str | None = None) -> tuple[dict[int, float], dict]:
    years, durations = decoded_years_and_durations(group)
    selected_stop = int(np.flatnonzero(years <= last_year)[-1]) + 1
    monthly, minimum_coverage = monthly_global_means(group["tas"], weights, selected_stop, progress_label)
    output: dict[int, float] = {}
    for year in range(first_year, last_year + 1):
        selected = np.flatnonzero(years[:selected_stop] == year)
        if len(selected) != 12:
            raise RuntimeError(f"Missing monthly data for {year}")
        output[year] = float(np.average(monthly[selected], weights=durations[selected]))
    return output, {
        "firstYear": first_year,
        "lastYear": last_year,
        "yearCount": len(output),
        "minimumMonthlyFiniteAreaFraction": minimum_coverage,
        "timeCalendar": group["time"].attrs.get("calendar", "standard"),
        "timeUnits": group["time"].attrs.get("units"),
    }


def build_predictors(annual: dict[int, float]) -> tuple[float, list[dict]]:
    missing = sorted(set(REQUIRED_YEARS) - set(annual))
    if missing:
        raise RuntimeError(f"Annual global-temperature series misses years: {missing[:10]}")
    baseline = float(np.mean([annual[year] for year in BASELINE_YEARS]))
    predictors = []
    for year in ANALYSIS_YEARS:
        trailing = float(np.mean([annual[item] for item in range(year - 3, year + 1)]))
        predictors.append({
            "year": year,
            "fourYearTrailingGlobalAnomalyC": round(trailing - baseline, 9),
        })
    return baseline, predictors


def crosscheck_figure(model: str, annual: dict[int, float], baseline: float) -> dict | None:
    if not CROSSCHECK_PATH.exists():
        return None
    with xr.open_dataset(CROSSCHECK_PATH, decode_times=False) as dataset:
        names = [value.decode() if isinstance(value, bytes) else str(value) for value in dataset["model"].values]
        if model not in names:
            return {"status": "model_absent_from_figure_data"}
        row = np.asarray(dataset["tas"].values[names.index(model)], dtype=np.float64)
        years = np.rint(np.asarray(dataset["time"].values, dtype=np.float64)).astype(int)
    common = [year for year, value in zip(years, row, strict=True) if 1850 <= year <= 2020 and np.isfinite(value)]
    expected = np.asarray([annual[year] - baseline for year in common])
    observed = np.asarray([row[np.flatnonzero(years == year)[0]] for year in common])
    delta = expected - observed
    return {
        "status": "compared_against_ipcc_ar6_figure_3_4_panel_a",
        "yearsCompared": len(common),
        "meanAbsoluteDifferenceC": float(np.mean(np.abs(delta))),
        "maximumAbsoluteDifferenceC": float(np.max(np.abs(delta))),
        "pearsonCorrelation": float(np.corrcoef(expected, observed)[0, 1]),
    }


def scenario_file_crosscheck(model: str, annual: dict[int, float]) -> dict:
    upstream = json.loads(UPSTREAM_PATH.read_text())
    record = next((row for row in upstream["records"] if row["canonicalModel"] == model), None)
    if record is None or len(record["candidates"]) != 1:
        return {"status": "one_frozen_exact_member_scenario_file_not_available"}
    candidate = record["candidates"][0]
    cache_path = FIGURE_FILE_CACHE / f"{hashlib.sha256(candidate['path'].encode()).hexdigest()}.MAG"
    if not cache_path.exists() or cache_path.stat().st_size != candidate["bytes"] or file_sha256(cache_path) != candidate["contentSha256"]:
        return {"status": "frozen_exact_member_scenario_file_not_cached_or_checksum_failed"}
    lines = cache_path.read_text().splitlines()
    header_index = next((index for index, line in enumerate(lines) if line.lstrip().startswith("YEARS ")), None)
    if header_index is None:
        raise RuntimeError(f"WORLD header missing from {candidate['path']}")
    columns = lines[header_index].split()
    if "WORLD" not in columns:
        raise RuntimeError(f"WORLD column missing from {candidate['path']}")
    world_index = columns.index("WORLD")
    series = {}
    for line in lines[header_index + 1:]:
        values = line.split()
        if not values:
            continue
        try:
            year = int(values[0])
        except ValueError:
            continue
        if len(values) != len(columns):
            raise RuntimeError(f"Malformed WORLD row for {year} in {candidate['path']}")
        series[year] = float(values[world_index])
    common = [year for year in range(2015, 2023) if year in series]
    if not common:
        return {"status": "frozen_exact_member_file_has_no_2015_2022_overlap"}
    executed = np.asarray([annual[year] for year in common])
    frozen = np.asarray([series[year] for year in common])
    delta = executed - frozen
    return {
        "status": "compared_against_frozen_exact_member_scenario_file",
        "sourcePath": candidate["path"],
        "sourceContentSha256": candidate["contentSha256"],
        "yearsCompared": len(common),
        "meanAbsoluteDifferenceC": float(np.mean(np.abs(delta))),
        "maximumAbsoluteDifferenceC": float(np.max(np.abs(delta))),
        "meanDifferenceC": float(np.mean(delta)),
        "pearsonCorrelation": float(np.corrcoef(executed, frozen)[0, 1]) if len(common) >= 2 else None,
    }


def execute_model(route: dict, routes_digest: str) -> dict:
    fs = s3fs.S3FileSystem(
        anon=True,
        skip_instance_cache=True,
        config_kwargs={
            "connect_timeout": 30,
            "read_timeout": 90,
            "retries": {"max_attempts": 5, "mode": "standard"},
        },
    )
    historical = scenario = tas = None
    try:
        historical = open_group(fs, route["historical"]["zstore"])
        tas = historical["tas"]
        dimensions = array_dimensions(tas)
        spatial_dims = dimensions[1:]
        spatial_shape = tuple(tas.shape[1:])
        if route["areaMethod"] == "exact_areacella":
            weights, area_check = exact_area_weights(fs, route, spatial_dims, spatial_shape)
        elif route["areaMethod"] == "spherical_area_from_coordinate_bounds":
            weights, area_check = spherical_areas_from_bounds(historical, spatial_dims, spatial_shape)
        else:
            raise RuntimeError(f"Unsupported area method: {route['areaMethod']}")
        historical_annual, historical_check = annual_means(
            historical, weights, 1850, 2014, f"{route['canonicalModel']} historical"
        )
        scenario = open_group(fs, route["ssp245"]["zstore"])
        scenario_dimensions = array_dimensions(scenario["tas"])
        if scenario_dimensions[1:] != spatial_dims or tuple(scenario["tas"].shape[1:]) != spatial_shape:
            raise RuntimeError("Historical and SSP2-4.5 temperature grids differ")
        scenario_annual, scenario_check = annual_means(
            scenario, weights, 2015, 2022, f"{route['canonicalModel']} SSP2-4.5"
        )
    finally:
        # S3Map retains the filesystem through each Zarr group. Drop those
        # references together so s3fs's own finalizer can close its aiohttp
        # session before interpreter shutdown.
        historical = scenario = tas = None
        del fs
        gc.collect()
    annual = {**historical_annual, **scenario_annual}
    baseline, predictors = build_predictors(annual)
    annual_rows = [{"year": year, "globalMeanKelvin": round(annual[year], 9)} for year in REQUIRED_YEARS]
    payload = {
        "version": VERSION,
        "status": "complete_exact_member_pangeo_predictor",
        "productionRatingsEnabled": 0,
        "routesDigest": routes_digest,
        "routeDigest": route_digest(route),
        "identity": route_identity(route),
        "areaCheck": area_check,
        "historicalCheck": historical_check,
        "scenarioCheck": scenario_check,
        "baseline1850To1900Kelvin": round(baseline, 9),
        "annualGlobalMeanKelvin": annual_rows,
        "predictors": predictors,
        "figureDataCrosscheck": crosscheck_figure(route["canonicalModel"], annual, baseline),
        "scenarioFileCrosscheck": scenario_file_crosscheck(route["canonicalModel"], annual),
        "decision": {"axesAdmitted": 0, "scoresChanged": 0},
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def load_checkpoint(route: dict, routes_digest: str) -> dict | None:
    path = checkpoint_path(route["canonicalModel"])
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text())
        digest = payload.pop("digest")
        if canonical_digest(payload) != digest:
            return None
        payload["digest"] = digest
        if payload["routesDigest"] != routes_digest or payload["routeDigest"] != route_digest(route):
            return None
        if len(payload["annualGlobalMeanKelvin"]) != len(REQUIRED_YEARS) or len(payload["predictors"]) != len(ANALYSIS_YEARS):
            return None
        return payload
    except (KeyError, TypeError, ValueError, json.JSONDecodeError):
        return None


def enrich_checkpoint(checkpoint: dict) -> dict:
    if "scenarioFileCrosscheck" in checkpoint:
        return checkpoint
    annual = {int(row["year"]): float(row["globalMeanKelvin"]) for row in checkpoint["annualGlobalMeanKelvin"]}
    enriched = dict(checkpoint)
    enriched.pop("digest", None)
    enriched["scenarioFileCrosscheck"] = scenario_file_crosscheck(
        checkpoint["identity"]["canonicalModel"], annual
    )
    enriched["digest"] = canonical_digest(enriched)
    atomic_json(checkpoint_path(checkpoint["identity"]["canonicalModel"]), enriched)
    return enriched


def write_manifest(routes_payload: dict, checkpoints: list[dict]) -> dict:
    completed = sorted(checkpoints, key=lambda row: row["identity"]["canonicalModel"])
    completed_names = {row["identity"]["canonicalModel"] for row in completed}
    expected_names = {row["canonicalModel"] for row in routes_payload["routes"]}
    remaining = sorted(expected_names - completed_names)
    upstream = json.loads(UPSTREAM_PATH.read_text())
    complete_upstream = upstream["counts"]["completeExactMemberPredictors"]
    figure_checks = [
        row["figureDataCrosscheck"] for row in completed
        if row.get("figureDataCrosscheck", {}).get("status") == "compared_against_ipcc_ar6_figure_3_4_panel_a"
    ]
    scenario_checks = [
        row["scenarioFileCrosscheck"] for row in completed
        if row.get("scenarioFileCrosscheck", {}).get("status") == "compared_against_frozen_exact_member_scenario_file"
    ]
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "complete_all_exact_member_global_predictors" if not remaining else "partial_resumable_exact_member_global_predictors",
        "productionRatingsEnabled": 0,
        "purpose": "Calculate exact-member model-global predictors for identities absent or incomplete in the frozen IPCC figure-data record.",
        "sources": {
            "routes": str(ROUTES_PATH.relative_to(ROOT)),
            "routesDigest": routes_payload["digest"],
            "upstreamGlobalPredictors": str(UPSTREAM_PATH.relative_to(ROOT)),
            "upstreamGlobalPredictorsDigest": upstream["digest"],
            "figureDataCrosscheck": ({
                "path": str(CROSSCHECK_PATH.relative_to(ROOT)),
                "bytes": CROSSCHECK_PATH.stat().st_size,
                "sha256": file_sha256(CROSSCHECK_PATH),
            } if CROSSCHECK_PATH.exists() else None),
        },
        "method": {
            "historicalYears": [1850, 2014],
            "ssp245Years": [2015, 2022],
            "baselineYears": [1850, 1900],
            "predictor": "Four-year trailing annual area-weighted global tas mean minus the model's 1850–1900 mean.",
            "annualAggregation": "Monthly tas weighted by published monthly time-bound duration.",
            "areaRule": "Use exact-member same-grid areacella when frozen; otherwise derive spherical area from the same store's latitude and longitude bounds.",
        },
        "counts": {
            "routesExpected": len(expected_names),
            "pangeoPredictorsComplete": len(completed),
            "pangeoPredictorsRemaining": len(remaining),
            "combinedIndependentPredictorsComplete": complete_upstream + len(completed),
            "combinedIndependentPredictorsExpected": upstream["counts"]["selectedIndependentIdentities"],
            "predictorYearRows": len(completed) * len(ANALYSIS_YEARS),
        },
        "diagnostics": {
            "ipccFigureSeriesCompared": len(figure_checks),
            "ipccFigureMinimumCorrelation": min((row["pearsonCorrelation"] for row in figure_checks), default=None),
            "ipccFigureMedianMeanAbsoluteDifferenceC": float(np.median([row["meanAbsoluteDifferenceC"] for row in figure_checks])) if figure_checks else None,
            "exactScenarioFilesCompared": len(scenario_checks),
            "exactScenarioMinimumCorrelation": min((row["pearsonCorrelation"] for row in scenario_checks), default=None),
            "exactScenarioMaximumMeanAbsoluteDifferenceC": max((row["meanAbsoluteDifferenceC"] for row in scenario_checks), default=None),
            "exactScenarioFilesUnavailable": len(completed) - len(scenario_checks),
        },
        "remainingModels": remaining,
        "records": completed,
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Complete every exact-member predictor, finish the ERA5-Land record, execute the frozen independent-pattern comparison, and propagate it through the same mortality fits.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    atomic_json(OUTPUT_PATH, payload)
    if scenario_checks:
        scenario_summary = (
            f"{payload['diagnostics']['exactScenarioFilesCompared']} routes have an immutable exact-member SSP2-4.5 overlap check; "
            f"their minimum correlation is {payload['diagnostics']['exactScenarioMinimumCorrelation']:.6f} and maximum mean absolute difference is "
            f"{payload['diagnostics']['exactScenarioMaximumMeanAbsoluteDifferenceC']:.6f} °C. "
        )
    else:
        scenario_summary = "No completed route has a cached immutable exact-member SSP2-4.5 overlap file. "
    report = (
        "# Pangeo CMIP6 global-predictor execution\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"{len(completed)} of {len(expected_names)} frozen Pangeo routes have complete exact-member predictors. "
        f"Together with the {complete_upstream} predictors from the immutable IPCC figure-data record, "
        f"{payload['counts']['combinedIndependentPredictorsComplete']} of "
        f"{payload['counts']['combinedIndependentPredictorsExpected']} independent identities are complete.\n\n"
        + scenario_summary
        + "The separately processed IPCC figure series remains a continuous diagnostic.\n\n"
        "The calculation changes zero TULIP axes and zero scores.\n"
    )
    REPORT_PATH.write_text(report)
    return payload


def parse_models(args, routes: list[dict]) -> list[dict]:
    by_name = {route["canonicalModel"]: route for route in routes}
    if args.model:
        unknown = sorted(set(args.model) - set(by_name))
        if unknown:
            raise RuntimeError(f"Unknown frozen model(s): {unknown}")
        selected = [by_name[name] for name in args.model]
    else:
        selected = routes
    if args.max_new_models is not None:
        selected = selected[:args.max_new_models]
    return selected


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", action="append", help="Exact canonical model; may be repeated")
    parser.add_argument("--max-new-models", type=int)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    routes_payload = json.loads(ROUTES_PATH.read_text())
    routes_without_digest = dict(routes_payload)
    digest = routes_without_digest.pop("digest")
    if canonical_digest(routes_without_digest) != digest:
        raise RuntimeError("Frozen Pangeo route inventory digest changed")
    ready = [route for route in routes_payload["routes"] if route["status"] == "exact_historical_and_ssp245_routes_ready"]
    selected = parse_models(args, ready)
    if args.dry_run:
        print(json.dumps({"models": [row["canonicalModel"] for row in selected], "networkReadsPerformed": False}, indent=2))
        return
    CHECKPOINT_ROOT.mkdir(parents=True, exist_ok=True)
    for route in selected:
        existing = None if args.force else load_checkpoint(route, digest)
        if existing:
            existing = enrich_checkpoint(existing)
            print(f"{route['canonicalModel']}: verified existing checkpoint", flush=True)
            continue
        print(f"{route['canonicalModel']}: reading exact historical and SSP2-4.5 stores", flush=True)
        checkpoint = execute_model(route, digest)
        atomic_json(checkpoint_path(route["canonicalModel"]), checkpoint)
        print(f"{route['canonicalModel']}: wrote {len(checkpoint['predictors'])} predictor years", flush=True)
    with manifest_lock():
        checkpoints = [item for route in ready if (item := load_checkpoint(route, digest)) is not None]
        payload = write_manifest(routes_payload, checkpoints)
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "status": payload["status"],
        **payload["counts"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
