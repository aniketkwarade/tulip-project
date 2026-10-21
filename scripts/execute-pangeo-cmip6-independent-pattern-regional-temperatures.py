#!/usr/bin/env python3
"""Execute the frozen monthly CMIP6 regional-temperature comparison inputs.

Each exact model/member is checkpointed independently. This calculation is an
independent pattern diagnostic and cannot directly change a TULIP axis or score.
"""

from __future__ import annotations

import argparse
import contextlib
import fcntl
import gc
import hashlib
import importlib.util
import json
import os
import time
import weakref
from datetime import date, timedelta
from pathlib import Path

import numpy as np
import s3fs


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
ROUTES_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-routes.json"
GRID_INVENTORY_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-grid-inventory.json"
AREA_WEIGHTS_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-area-weights.json"
PREDICTORS_PATH = CALIBRATION_DIR / "independent-pattern-global-predictor-ensemble.json"
HELPER_PATH = ROOT / "scripts/execute-pangeo-cmip6-global-predictors.py"
OUTPUT_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-regional-temperature-execution.json"
REPORT_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-regional-temperature-execution-report.md"
CHECKPOINT_ROOT = ROOT / "tmp/tulip-independent-pattern/pangeo-regional-temperature-checkpoints"
SERIES_ROOT = ROOT / "tmp/tulip-independent-pattern/pangeo-regional-temperature-series"
MANIFEST_LOCK_PATH = CHECKPOINT_ROOT / ".manifest.lock"

VERSION = "tulip_pangeo_cmip6_independent_pattern_regional_temperature_execution_2026_09_26_v1"
YEARS = tuple(range(1950, 2023))
HISTORICAL_YEARS = tuple(range(1950, 2015))
SCENARIO_YEARS = tuple(range(2015, 2023))
SEASON_MONTHS = (5, 6, 7, 8, 9)
JJA_MONTHS = (6, 7, 8)
EXPECTED_REGIONS = 971
MIN_FINITE_AREA_FRACTION = 0.99


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def unique_temporary_path(path: Path, suffix: str = ".tmp") -> Path:
    return path.with_name(f".{path.name}.{os.getpid()}.{time.time_ns()}{suffix}")


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


@contextlib.contextmanager
def model_lock(model: str):
    path = CHECKPOINT_ROOT / f".{safe_model_name(model)}.lock"
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+") as handle:
        try:
            fcntl.flock(handle.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            yield False
            return
        try:
            yield True
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def load_helper():
    spec = importlib.util.spec_from_file_location("pangeo_global_helper", HELPER_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def close_s3_filesystem(filesystem: s3fs.S3FileSystem) -> None:
    """Run s3fs's registered close callback while its event loop is alive."""
    matched = False
    for finalizer in list(weakref.finalize._registry):
        snapshot = finalizer.peek()
        if snapshot is not None and snapshot[0] is filesystem:
            finalizer()
            matched = True
    creator = getattr(filesystem, "_s3creator", None)
    if not matched and creator is not None:
        filesystem.close_session(filesystem.loop, creator)


def close_zarr_group(group) -> None:
    """Close the asynchronous S3 clone created by Zarr's FsspecStore."""
    if group is None:
        return
    store = group.store
    filesystem = getattr(store, "fs", None)
    creator = getattr(filesystem, "_s3creator", None)
    client = getattr(filesystem, "_s3", None)
    if creator is not None and client is not None:
        http_session = getattr(getattr(client, "_endpoint", None), "http_session", None)
        sessions = list(getattr(http_session, "_sessions", {}).values())
        if sessions:
            owner_loop = sessions[0]._loop
            filesystem.close_session(owner_loop, creator)
    store.close()


def verified_json(path: Path) -> dict:
    payload = json.loads(path.read_text())
    without_digest = dict(payload)
    digest = without_digest.pop("digest", None)
    if not digest or canonical_digest(without_digest) != digest:
        raise RuntimeError(f"Digest failed for {path.relative_to(ROOT)}")
    return payload


def iso_window_month_day_weights(year: int) -> dict[int, int]:
    start = date.fromisocalendar(year, 22, 1)
    end = date.fromisocalendar(year, 35, 7)
    weights = {month: 0 for month in SEASON_MONTHS}
    current = start
    while current <= end:
        if current.year != year or current.month not in weights:
            raise RuntimeError(f"ISO-week summer window escaped May–September for {year}: {current}")
        weights[current.month] += 1
        current += timedelta(days=1)
    if sum(weights.values()) != 98:
        raise RuntimeError(f"ISO-week summer window is not 98 days for {year}")
    return weights


def model_identity(route: dict, grid_record: dict, weights_record: dict) -> dict:
    return {
        "canonicalModel": route["canonicalModel"],
        "member": route["member"],
        "institutionId": route["historical"]["institutionId"],
        "historicalZstore": route["historical"]["zstore"],
        "ssp245Zstore": route["ssp245"]["zstore"],
        "gridGeometryDigest": grid_record["gridGeometryDigest"],
        "weightsLogicalSha256": weights_record["weightsLogicalSha256"],
    }


def model_digest(route: dict, grid_record: dict, weights_record: dict) -> str:
    return canonical_digest(model_identity(route, grid_record, weights_record))


def safe_model_name(model: str) -> str:
    return model.replace("/", "_")


def checkpoint_path(model: str) -> Path:
    return CHECKPOINT_ROOT / f"{safe_model_name(model)}.json"


def series_path(model: str) -> Path:
    return SERIES_ROOT / f"{safe_model_name(model)}.npz"


def load_weight_arrays(weight_set: dict, expected_shape: tuple[int, int]) -> dict:
    if tuple(weight_set["gridShape"]) != expected_shape:
        raise RuntimeError("Regional weight grid shape does not match the frozen model grid")
    path = ROOT / weight_set["output"]["path"]
    if path.stat().st_size != weight_set["output"]["bytes"] or file_sha256(path) != weight_set["output"]["sha256"]:
        raise RuntimeError("Regional weight file failed byte or checksum validation")
    with np.load(path) as arrays:
        cell_indices = arrays["cell_indices"].astype(np.int64, copy=True)
        offsets = arrays["offsets"].astype(np.int64, copy=True)
        region_indices = arrays["region_indices"].astype(np.int32, copy=True)
        areas = arrays["areas_square_metres"].astype(np.float64, copy=True)
        region_ids = arrays["region_ids"].astype("U16", copy=True)
    if len(region_ids) != EXPECTED_REGIONS or len(set(region_ids.tolist())) != EXPECTED_REGIONS:
        raise RuntimeError("Regional weight file does not contain 971 unique region identifiers")
    if len(offsets) != len(cell_indices) + 1 or offsets[0] != 0 or offsets[-1] != len(region_indices):
        raise RuntimeError("Regional weight offsets are inconsistent")
    if len(region_indices) != len(areas) or np.any(areas <= 0) or not np.all(np.isfinite(areas)):
        raise RuntimeError("Regional weight intersections are invalid")
    if np.any(cell_indices < 0) or np.any(cell_indices >= expected_shape[0] * expected_shape[1]):
        raise RuntimeError("Regional weight cell index is outside the frozen grid")
    repeated_cell_positions = np.repeat(np.arange(len(cell_indices), dtype=np.int64), np.diff(offsets))
    total_region_area = np.bincount(region_indices, weights=areas, minlength=EXPECTED_REGIONS)
    if np.any(total_region_area <= 0):
        raise RuntimeError("Regional weight file leaves a region without intersected area")
    return {
        "cellIndices": cell_indices,
        "regionIndices": region_indices,
        "areas": areas,
        "regionIds": region_ids,
        "repeatedCellPositions": repeated_cell_positions,
        "totalRegionArea": total_region_area,
    }


def aggregate_candidate_values(candidate_values: np.ndarray, weights: dict) -> tuple[np.ndarray, np.ndarray]:
    expanded = candidate_values[weights["repeatedCellPositions"]]
    finite = np.isfinite(expanded)
    denominators = np.bincount(
        weights["regionIndices"][finite],
        weights=weights["areas"][finite],
        minlength=EXPECTED_REGIONS,
    )
    numerators = np.bincount(
        weights["regionIndices"][finite],
        weights=weights["areas"][finite] * expanded[finite],
        minlength=EXPECTED_REGIONS,
    )
    coverage = denominators / weights["totalRegionArea"]
    output = np.full(EXPECTED_REGIONS, np.nan, dtype=np.float64)
    nonzero = denominators > 0
    output[nonzero] = numerators[nonzero] / denominators[nonzero]
    return output, coverage


def seasonal_region_means(group, weights: dict, first_year: int, last_year: int, helper, label: str) -> tuple[dict[int, dict], dict]:
    tas = group["tas"]
    dimensions = helper.array_dimensions(tas)
    if dimensions != ["time", "lat", "lon"]:
        raise RuntimeError(f"Expected [time, lat, lon] for {label}, received {dimensions}")
    spatial_shape = tuple(tas.shape[1:])
    maximum_cell = spatial_shape[0] * spatial_shape[1]
    if np.any(weights["cellIndices"] >= maximum_cell):
        raise RuntimeError(f"Weight index exceeds the {label} grid")
    years, durations = helper.decoded_years_and_durations(group)
    time_array = group["time"]
    units = time_array.attrs.get("units")
    calendar = time_array.attrs.get("calendar", "standard")
    dates = helper.cftime.num2date(
        np.asarray(time_array[:]), units=units, calendar=calendar, only_use_cftime_datetimes=True
    )
    months = np.asarray([item.month for item in dates], dtype=np.int8)
    selected = np.flatnonzero(
        (years >= first_year) & (years <= last_year) & np.isin(months, np.asarray(SEASON_MONTHS))
    )
    expected_rows = (last_year - first_year + 1) * len(SEASON_MONTHS)
    if len(selected) != expected_rows:
        raise RuntimeError(f"{label} has {len(selected)} selected monthly rows; expected {expected_rows}")
    keys = [(int(years[index]), int(months[index])) for index in selected]
    if len(set(keys)) != expected_rows:
        raise RuntimeError(f"{label} contains duplicate selected year-month rows")

    monthly: dict[tuple[int, int], np.ndarray] = {}
    minimum_coverage = 1.0
    time_chunk = int(tas.chunks[0])
    chunk_ids = sorted(set(int(index // time_chunk) for index in selected))
    for position, chunk_id in enumerate(chunk_ids, start=1):
        indices = selected[(selected // time_chunk) == chunk_id]
        values = helper.decode_cf_values(
            tas,
            (indices,) + (slice(None),) * (tas.ndim - 1),
        )
        candidate = values.reshape(len(indices), -1)[:, weights["cellIndices"]]
        for row, time_index in enumerate(indices):
            regional, coverage = aggregate_candidate_values(candidate[row], weights)
            minimum_coverage = min(minimum_coverage, float(np.min(coverage)))
            if np.any(coverage < MIN_FINITE_AREA_FRACTION):
                worst = int(np.argmin(coverage))
                raise RuntimeError(
                    f"{label} {int(years[time_index])}-{int(months[time_index]):02d} finite area "
                    f"{coverage[worst]:.6f} is below {MIN_FINITE_AREA_FRACTION:.2f} for "
                    f"{weights['regionIds'][worst]}"
                )
            if not np.all(np.isfinite(regional)) or np.any((regional < 180.0) | (regional > 330.0)):
                raise RuntimeError(f"{label} produced implausible regional temperature values")
            monthly[(int(years[time_index]), int(months[time_index]))] = regional
        print(
            f"{label}: processed native time chunk {position}/{len(chunk_ids)} "
            f"({len(monthly)}/{expected_rows} selected months)",
            flush=True,
        )

    seasonal: dict[int, dict] = {}
    for year in range(first_year, last_year + 1):
        if any((year, month) not in monthly for month in SEASON_MONTHS):
            raise RuntimeError(f"{label} misses a May–September month in {year}")
        jja_values = np.stack([monthly[(year, month)] for month in JJA_MONTHS])
        jja_time_indices = [selected[keys.index((year, month))] for month in JJA_MONTHS]
        jja_durations = durations[np.asarray(jja_time_indices)]
        jja = np.average(jja_values, axis=0, weights=jja_durations)
        overlap = iso_window_month_day_weights(year)
        approximation_values = np.stack([monthly[(year, month)] for month in SEASON_MONTHS])
        approximation_weights = np.asarray([overlap[month] for month in SEASON_MONTHS], dtype=np.float64)
        approximation = np.average(approximation_values, axis=0, weights=approximation_weights)
        seasonal[year] = {"jja": jja, "isoApproximation": approximation}
    return seasonal, {
        "firstYear": first_year,
        "lastYear": last_year,
        "years": last_year - first_year + 1,
        "selectedMonthlyRows": expected_rows,
        "nativeTimeChunksRead": len(chunk_ids),
        "minimumRegionMonthFiniteAreaFraction": minimum_coverage,
        "timeCalendar": calendar,
        "timeUnits": units,
    }


def logical_series_digest(identity_digest: str, years: np.ndarray, region_ids: np.ndarray,
                          jja: np.ndarray, approximation: np.ndarray) -> str:
    return hashlib.sha256(b"".join([
        identity_digest.encode(),
        np.asarray(years, dtype="<i2").tobytes(),
        "\n".join(region_ids.tolist()).encode(),
        np.asarray(jja, dtype="<f8").tobytes(),
        np.asarray(approximation, dtype="<f8").tobytes(),
    ])).hexdigest()


def write_series(path: Path, identity_digest: str, region_ids: np.ndarray,
                 seasonal: dict[int, dict]) -> dict:
    years = np.asarray(YEARS, dtype=np.int16)
    jja = np.stack([seasonal[year]["jja"] for year in YEARS]).astype(np.float64)
    approximation = np.stack([seasonal[year]["isoApproximation"] for year in YEARS]).astype(np.float64)
    if jja.shape != (len(YEARS), EXPECTED_REGIONS) or approximation.shape != jja.shape:
        raise RuntimeError("Regional seasonal output has an unexpected shape")
    logical = logical_series_digest(identity_digest, years, region_ids, jja, approximation)
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = unique_temporary_path(path, ".tmp.npz")
    try:
        np.savez_compressed(
            temporary,
            years=years,
            region_ids=region_ids,
            jja_mean_kelvin=jja,
            iso_week_22_35_monthly_approximation_mean_kelvin=approximation,
        )
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)
    return {
        "path": str(path.relative_to(ROOT)),
        "bytes": path.stat().st_size,
        "sha256": file_sha256(path),
        "logicalSha256": logical,
        "arrays": {
            "years": len(years),
            "regionIds": len(region_ids),
            "jjaMeanKelvin": list(jja.shape),
            "isoWeek2235MonthlyApproximationMeanKelvin": list(approximation.shape),
        },
    }


def predictor_check(record: dict) -> dict:
    years = [int(row["year"]) for row in record["predictors"]]
    values = np.asarray([float(row["fourYearTrailingGlobalAnomalyC"]) for row in record["predictors"]])
    if years != list(YEARS) or not np.all(np.isfinite(values)) or np.ptp(values) <= 0:
        raise RuntimeError(f"Global predictor failed for {record['canonicalModel']}")
    return {
        "source": record["source"],
        "years": len(years),
        "firstYear": years[0],
        "lastYear": years[-1],
        "minimumC": float(values.min()),
        "maximumC": float(values.max()),
    }


def execute_model(route: dict, grid_record: dict, weights_record: dict, weight_set: dict,
                  predictor: dict, input_digests: dict, helper) -> dict:
    identity = model_identity(route, grid_record, weights_record)
    identity_digest = canonical_digest(identity)
    weights = load_weight_arrays(weight_set, tuple(grid_record["gridShape"]))
    if weights_record["weightsLogicalSha256"] != weight_set["output"]["logicalSha256"]:
        raise RuntimeError("Model-to-grid weight identity mismatch")
    predictor_summary = predictor_check(predictor)
    fs = s3fs.S3FileSystem(
        anon=True,
        skip_instance_cache=True,
        config_kwargs={
            "connect_timeout": 30,
            "read_timeout": 90,
            "retries": {"max_attempts": 5, "mode": "standard"},
        },
    )
    historical = scenario = None
    try:
        historical = helper.open_group(fs, route["historical"]["zstore"])
        if tuple(historical["tas"].shape[1:]) != tuple(grid_record["gridShape"]):
            raise RuntimeError("Historical temperature grid differs from the frozen geometry")
        historical_seasonal, historical_check = seasonal_region_means(
            historical, weights, HISTORICAL_YEARS[0], HISTORICAL_YEARS[-1], helper,
            f"{route['canonicalModel']} historical",
        )
        close_zarr_group(historical)
        historical = None
        gc.collect()
        scenario = helper.open_group(fs, route["ssp245"]["zstore"])
        if tuple(scenario["tas"].shape[1:]) != tuple(grid_record["gridShape"]):
            raise RuntimeError("SSP2-4.5 temperature grid differs from the frozen geometry")
        scenario_seasonal, scenario_check = seasonal_region_means(
            scenario, weights, SCENARIO_YEARS[0], SCENARIO_YEARS[-1], helper,
            f"{route['canonicalModel']} SSP2-4.5",
        )
    finally:
        close_zarr_group(historical)
        close_zarr_group(scenario)
        historical = scenario = None
        gc.collect()
        close_s3_filesystem(fs)
        del fs
        gc.collect()
    seasonal = {**historical_seasonal, **scenario_seasonal}
    if set(seasonal) != set(YEARS):
        raise RuntimeError("Combined regional series does not cover exactly 1950–2022")
    series_output = write_series(
        series_path(route["canonicalModel"]), identity_digest, weights["regionIds"], seasonal
    )
    payload = {
        "version": VERSION,
        "status": "complete_exact_member_regional_temperature_series",
        "productionRatingsEnabled": 0,
        "inputs": input_digests,
        "identity": identity,
        "identityDigest": identity_digest,
        "predictorCheck": predictor_summary,
        "historicalCheck": historical_check,
        "scenarioCheck": scenario_check,
        "coverage": {
            "years": len(YEARS),
            "regions": EXPECTED_REGIONS,
            "regionYearsPerSeasonDefinition": len(YEARS) * EXPECTED_REGIONS,
            "seasonDefinitions": 2,
            "minimumRegionMonthFiniteAreaFraction": min(
                historical_check["minimumRegionMonthFiniteAreaFraction"],
                scenario_check["minimumRegionMonthFiniteAreaFraction"],
            ),
        },
        "seriesOutput": series_output,
        "decision": {"axesAdmitted": 0, "scoresChanged": 0},
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def validate_series_output(checkpoint: dict) -> bool:
    try:
        output = checkpoint["seriesOutput"]
        path = ROOT / output["path"]
        if path.stat().st_size != output["bytes"] or file_sha256(path) != output["sha256"]:
            return False
        with np.load(path) as arrays:
            years = arrays["years"]
            region_ids = arrays["region_ids"]
            jja = arrays["jja_mean_kelvin"]
            approximation = arrays["iso_week_22_35_monthly_approximation_mean_kelvin"]
            if years.tolist() != list(YEARS) or len(region_ids) != EXPECTED_REGIONS:
                return False
            if jja.shape != (len(YEARS), EXPECTED_REGIONS) or approximation.shape != jja.shape:
                return False
            if not np.all(np.isfinite(jja)) or not np.all(np.isfinite(approximation)):
                return False
            logical = logical_series_digest(checkpoint["identityDigest"], years, region_ids, jja, approximation)
            return logical == output["logicalSha256"]
    except (KeyError, OSError, ValueError):
        return False


def load_checkpoint(route: dict, grid_record: dict, weights_record: dict, input_digests: dict) -> dict | None:
    path = checkpoint_path(route["canonicalModel"])
    if not path.exists():
        return None
    try:
        payload = json.loads(path.read_text())
        without_digest = dict(payload)
        digest = without_digest.pop("digest")
        if canonical_digest(without_digest) != digest:
            return None
        if payload["inputs"] != input_digests:
            return None
        if payload["identityDigest"] != model_digest(route, grid_record, weights_record):
            return None
        if payload["status"] != "complete_exact_member_regional_temperature_series":
            return None
        return payload if validate_series_output(payload) else None
    except (KeyError, TypeError, ValueError, json.JSONDecodeError, OSError):
        return None


def write_manifest(expected: list[dict], completed: list[dict], input_digests: dict) -> dict:
    completed_by_model = {row["identity"]["canonicalModel"]: row for row in completed}
    remaining = [row["route"]["canonicalModel"] for row in expected if row["route"]["canonicalModel"] not in completed_by_model]
    records = []
    for item in expected:
        model = item["route"]["canonicalModel"]
        checkpoint = completed_by_model.get(model)
        records.append({
            "canonicalModel": model,
            "member": item["route"]["member"],
            "institutionId": item["route"]["historical"]["institutionId"],
            "status": "complete_exact_member_regional_temperature_series" if checkpoint else "regional_temperature_series_pending",
            "checkpoint": str(checkpoint_path(model).relative_to(ROOT)) if checkpoint else None,
            "checkpointDigest": checkpoint["digest"] if checkpoint else None,
            "seriesOutput": checkpoint["seriesOutput"] if checkpoint else None,
            "minimumRegionMonthFiniteAreaFraction": checkpoint["coverage"]["minimumRegionMonthFiniteAreaFraction"] if checkpoint else None,
        })
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "complete_all_admitted_regional_temperature_series" if not remaining else "partial_resumable_regional_temperature_series",
        "productionRatingsEnabled": 0,
        "purpose": "Calculate JJA and a day-overlap-weighted monthly approximation of ISO weeks 22–35 for every admitted exact model/member and all 971 fixed regions.",
        "inputs": input_digests,
        "method": {
            "years": [YEARS[0], YEARS[-1]],
            "historicalYears": [HISTORICAL_YEARS[0], HISTORICAL_YEARS[-1]],
            "ssp245Years": [SCENARIO_YEARS[0], SCENARIO_YEARS[-1]],
            "jja": "Regional monthly tas for June, July and August weighted by the model's published monthly time-bound duration.",
            "isoWeekApproximation": "Regional May–September monthly tas weighted by the number of Gregorian days from each month that overlap ISO weeks 22–35 in that year; weights total 98 days.",
            "finiteAreaRule": f"Every region-month must retain at least {MIN_FINITE_AREA_FRACTION:.0%} of its exact intersected area; values are normalized over finite area only.",
            "modelVote": "One exact preselected model/member per model vote; exclusions remain explicit and are never filled by another member.",
        },
        "counts": {
            "modelsExpected": len(expected),
            "modelsComplete": len(completed),
            "modelsRemaining": len(remaining),
            "regionsPerModel": EXPECTED_REGIONS,
            "yearsPerModel": len(YEARS),
            "seasonDefinitions": 2,
            "regionYearRowsPerSeasonDefinition": len(expected) * EXPECTED_REGIONS * len(YEARS),
            "completedRegionYearRowsAcrossBothDefinitions": len(completed) * EXPECTED_REGIONS * len(YEARS) * 2,
        },
        "remainingModels": remaining,
        "records": records,
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Complete all 22 model checkpoints, fit the full and split-period regional slopes, and apply the predeclared model- and institution-weighted comparison tests against complete ERA5-Land results.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    atomic_json(OUTPUT_PATH, payload)
    REPORT_PATH.write_text(
        "# Pangeo CMIP6 independent-pattern regional temperatures\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"{len(completed)} of {len(expected)} admitted exact model/member routes have complete 1950–2022 "
        f"JJA and ISO-week monthly-approximation series for all {EXPECTED_REGIONS} fixed regions. "
        f"{len(remaining)} model routes remain.\n\n"
        "This diagnostic changes zero TULIP axes and zero scores.\n"
    )
    return payload


def build_expected(routes: dict, grids: dict, area_weights: dict, predictors: dict) -> tuple[list[dict], dict]:
    grid_by_model = {row["canonicalModel"]: row for row in grids["records"]}
    weight_record_by_model = {row["canonicalModel"]: row for row in area_weights["records"]}
    weight_set_by_grid = {row["gridGeometryDigest"]: row for row in area_weights["weights"]}
    predictor_by_model = {row["canonicalModel"]: row for row in predictors["records"]}
    expected = []
    for route in routes["routes"]:
        model = route["canonicalModel"]
        weight_record = weight_record_by_model.get(model)
        if not weight_record or weight_record["status"] != "exact_971_region_area_weights_ready":
            continue
        grid_record = grid_by_model[model]
        if grid_record["status"] != "exact_grid_geometry_ready":
            raise RuntimeError(f"Area-ready model lacks admitted grid geometry: {model}")
        predictor = predictor_by_model.get(model)
        if predictor is None or predictor["member"] != route["member"]:
            raise RuntimeError(f"Area-ready model lacks its exact global predictor: {model}")
        weight_set = weight_set_by_grid[weight_record["gridGeometryDigest"]]
        expected.append({
            "route": route,
            "gridRecord": grid_record,
            "weightsRecord": weight_record,
            "weightSet": weight_set,
            "predictor": predictor,
        })
    expected.sort(key=lambda row: row["route"]["canonicalModel"])
    if len(expected) != area_weights["counts"]["modelWeightsReady"] or len(expected) != 22:
        raise RuntimeError(f"Expected 22 admitted model routes, received {len(expected)}")
    input_digests = {
        "routesDigest": routes["digest"],
        "gridInventoryDigest": grids["digest"],
        "areaWeightsDigest": area_weights["digest"],
        "globalPredictorEnsembleDigest": predictors["digest"],
    }
    return expected, input_digests


def select_models(args, expected: list[dict]) -> list[dict]:
    by_name = {row["route"]["canonicalModel"]: row for row in expected}
    if args.model:
        unknown = sorted(set(args.model) - set(by_name))
        if unknown:
            raise RuntimeError(f"Unknown or unadmitted model(s): {unknown}")
        selected = [by_name[name] for name in args.model]
    else:
        selected = expected
    if args.max_new_models is not None:
        selected = selected[:args.max_new_models]
    return selected


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model", action="append", help="Exact admitted canonical model; may be repeated")
    parser.add_argument("--max-new-models", type=int)
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    routes = verified_json(ROUTES_PATH)
    grids = verified_json(GRID_INVENTORY_PATH)
    area_weights = verified_json(AREA_WEIGHTS_PATH)
    predictors = verified_json(PREDICTORS_PATH)
    expected, input_digests = build_expected(routes, grids, area_weights, predictors)
    selected = select_models(args, expected)
    if args.dry_run:
        print(json.dumps({
            "models": [row["route"]["canonicalModel"] for row in selected],
            "modelsExpected": len(expected),
            "networkReadsPerformed": False,
            "inputDigests": input_digests,
        }, indent=2))
        return

    helper = load_helper()
    CHECKPOINT_ROOT.mkdir(parents=True, exist_ok=True)
    for item in selected:
        route = item["route"]
        with model_lock(route["canonicalModel"]) as acquired:
            if not acquired:
                print(f"{route['canonicalModel']}: another process owns the model checkpoint", flush=True)
                continue
            existing = None if args.force else load_checkpoint(
                route, item["gridRecord"], item["weightsRecord"], input_digests
            )
            if existing:
                print(f"{route['canonicalModel']}: verified existing regional checkpoint", flush=True)
                continue
            print(f"{route['canonicalModel']}: reading exact monthly regional temperatures", flush=True)
            checkpoint = execute_model(
                route, item["gridRecord"], item["weightsRecord"], item["weightSet"],
                item["predictor"], input_digests, helper,
            )
            atomic_json(checkpoint_path(route["canonicalModel"]), checkpoint)
            print(
                f"{route['canonicalModel']}: wrote {checkpoint['coverage']['regionYearsPerSeasonDefinition']:,} "
                "region-years per seasonal definition",
                flush=True,
            )
    with manifest_lock():
        completed = []
        for item in expected:
            checkpoint = load_checkpoint(
                item["route"], item["gridRecord"], item["weightsRecord"], input_digests
            )
            if checkpoint is not None:
                completed.append(checkpoint)
        payload = write_manifest(expected, completed, input_digests)
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "status": payload["status"],
        **payload["counts"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
