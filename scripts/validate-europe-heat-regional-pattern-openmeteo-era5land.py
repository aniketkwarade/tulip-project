#!/usr/bin/env python3
"""Validate the Italian heat pattern against a public 0.1-degree ERA5-Land mirror.

The test reads only the Italian grid-cell ranges needed for the 103-region
public sample. Passing validates this temperature reconstruction step only. It
does not enable a TULIP score or validate the full source-attributable endpoint.
"""

from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import math
import shutil
from pathlib import Path
from urllib.request import Request, urlopen

import fsspec
import numpy as np
import pandas as pd
from omfiles import OmFileReader


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
PLAN_PATH = CALIBRATION_DIR / "internal-europe-heat-regional-pattern-ingestion.json"
OUTPUT_PATH = CALIBRATION_DIR / "internal-europe-heat-openmeteo-era5land-crosscheck.json"
BASE_URL = "http://openmeteo.s3.amazonaws.com/data/copernicus_era5_land/temperature_2m"
DOCUMENTATION = "https://github.com/open-meteo/open-data"
FORMAT_DOCUMENTATION = "https://github.com/open-meteo/om-file-format"
CACHE_ROOT = Path("/tmp/tulip-openmeteo-era5land-cache")
YEARS = tuple(range(2015, 2023))
TRAINING_YEARS = tuple(range(2015, 2019))
VALIDATION_YEARS = tuple(range(2019, 2023))
WINDOW_START = (5, 25)
WINDOW_END_EXCLUSIVE = (9, 8)
GRID_LAT_MIN = -90.0
GRID_LON_MIN = -180.0
GRID_SPACING = 0.1
GRID_NLAT = 1801
GRID_NLON = 3600
HOURS_PER_CHUNK = 21 * 24


def digest(value: object) -> str:
    canonical = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(canonical).hexdigest()


def load_reconstruction_module():
    path = ROOT / "scripts/reconstruct-europe-heat-regional-pattern.py"
    spec = importlib.util.spec_from_file_location("tulip_regional_pattern", path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def round_metrics(metrics: dict) -> dict:
    return {key: round(value, 7) if isinstance(value, float) else value for key, value in metrics.items()}


def object_metadata(url: str) -> dict:
    request = Request(url, method="HEAD", headers={"User-Agent": "TULIP evidence validation"})
    with urlopen(request, timeout=60) as response:
        return {
            "url": url,
            "contentLength": int(response.headers["Content-Length"]),
            "etag": response.headers.get("ETag", "").strip('"'),
            "lastModified": response.headers.get("Last-Modified"),
            "contentType": response.headers.get("Content-Type"),
        }


def year_sources(year: int) -> list[dict]:
    start = pd.Timestamp(year=year, month=WINDOW_START[0], day=WINDOW_START[1])
    stop = pd.Timestamp(year=year, month=WINDOW_END_EXCLUSIVE[0], day=WINDOW_END_EXCLUSIVE[1])
    if year <= 2021:
        year_start = pd.Timestamp(year=year, month=1, day=1)
        return [{
            "kind": "year",
            "key": f"year_{year}",
            "url": f"{BASE_URL}/year_{year}.om",
            "objectStart": year_start,
            "readStart": int((start - year_start) / pd.Timedelta(hours=1)),
            "readStop": int((stop - year_start) / pd.Timedelta(hours=1)),
        }]

    epoch = pd.Timestamp("1970-01-01")
    first_chunk = math.floor((start - epoch) / pd.Timedelta(hours=HOURS_PER_CHUNK))
    last_chunk = math.floor(((stop - pd.Timedelta(hours=1)) - epoch) / pd.Timedelta(hours=HOURS_PER_CHUNK))
    sources = []
    for chunk in range(first_chunk, last_chunk + 1):
        object_start = epoch + pd.Timedelta(hours=chunk * HOURS_PER_CHUNK)
        object_stop = object_start + pd.Timedelta(hours=HOURS_PER_CHUNK)
        intersection_start = max(start, object_start)
        intersection_stop = min(stop, object_stop)
        sources.append({
            "kind": "chunk",
            "key": f"chunk_{chunk}",
            "url": f"{BASE_URL}/chunk_{chunk}.om",
            "objectStart": object_start,
            "readStart": int((intersection_start - object_start) / pd.Timedelta(hours=1)),
            "readStop": int((intersection_stop - object_start) / pd.Timedelta(hours=1)),
        })
    return sources


def italy_grid(helper, regions):
    minx, miny, maxx, maxy = regions.total_bounds
    lat_start = max(0, math.floor((miny - GRID_LAT_MIN) / GRID_SPACING) - 1)
    lat_stop = min(GRID_NLAT, math.ceil((maxy - GRID_LAT_MIN) / GRID_SPACING) + 2)
    lon_start = max(0, math.floor((minx - GRID_LON_MIN) / GRID_SPACING) - 1)
    lon_stop = min(GRID_NLON, math.ceil((maxx - GRID_LON_MIN) / GRID_SPACING) + 2)
    latitudes = GRID_LAT_MIN + np.arange(lat_start, lat_stop) * GRID_SPACING
    longitudes = GRID_LON_MIN + np.arange(lon_start, lon_stop) * GRID_SPACING
    grid = helper.GridDefinition(latitudes.astype(float), longitudes.astype(float))
    return grid, lat_start, lat_stop, lon_start, lon_stop


def active_row_spans(matrices: dict[str, np.ndarray], nlat: int, nlon: int) -> list[tuple[int, int] | None]:
    active = np.zeros((nlat, nlon), dtype=bool)
    for weights in matrices.values():
        active |= np.any(weights > 0, axis=0).reshape(nlat, nlon)
    spans = []
    for row in active:
        columns = np.flatnonzero(row)
        if not len(columns):
            spans.append(None)
            continue
        # OM longitude chunks contain six cells. Aligning reads avoids fetching
        # the same compressed chunk repeatedly at adjacent polygon boundaries.
        start = int(columns.min() // 6 * 6)
        stop = int(min(nlon, math.ceil((columns.max() + 1) / 6) * 6))
        spans.append((start, stop))
    return spans


def read_regional_source(source: dict, matrices: dict[str, np.ndarray], grid_shape: tuple[int, int],
                         spans: list[tuple[int, int] | None], lat_start: int, lon_start: int,
                         cache_root: Path, keep_cache: bool) -> tuple[dict[str, np.ndarray], dict]:
    nlat, nlon = grid_shape
    ntime = source["readStop"] - source["readStart"]
    nregions = next(iter(matrices.values())).shape[0]
    numerators = {method: np.zeros((ntime, nregions), dtype=np.float64) for method in matrices}
    denominators = {method: np.zeros((ntime, nregions), dtype=np.float64) for method in matrices}
    read_values = 0
    finite_values = 0
    cache_dir = cache_root / source["key"]
    cache_dir.mkdir(parents=True, exist_ok=True)
    remote = f"blockcache::{source['url']}"
    handle = fsspec.open(remote, mode="rb", block_size=4096, blockcache={"cache_storage": str(cache_dir)})

    try:
        with OmFileReader(handle) as data:
            if tuple(data.shape[:2]) != (GRID_NLAT, GRID_NLON):
                raise RuntimeError(f"Unexpected ERA5-Land grid in {source['url']}: {data.shape}")
            if source["readStop"] > data.shape[2]:
                raise RuntimeError(f"Requested time range exceeds {source['url']}: {data.shape}")
            for local_row, span in enumerate(spans):
                if span is None:
                    continue
                local_column_start, local_column_stop = span
                values = np.asarray(
                    data[
                        lat_start + local_row:lat_start + local_row + 1,
                        lon_start + local_column_start:lon_start + local_column_stop,
                        source["readStart"]:source["readStop"],
                    ],
                    dtype=np.float64,
                )[0].T
                finite = np.isfinite(values)
                read_values += values.size
                finite_values += int(finite.sum())
                cell_indices = local_row * nlon + np.arange(local_column_start, local_column_stop)
                for method, weights in matrices.items():
                    row_weights = weights[:, cell_indices]
                    numerators[method] += np.where(finite, values, 0.0) @ row_weights.T
                    denominators[method] += finite.astype(np.float64) @ row_weights.T
            shape = list(data.shape)
            chunks = list(data.chunks)
            scale_factor = float(data.scale_factor)
    finally:
        if not keep_cache:
            shutil.rmtree(cache_dir, ignore_errors=True)

    regional = {
        method: np.divide(
            numerators[method], denominators[method],
            out=np.full_like(numerators[method], np.nan), where=denominators[method] > 0,
        )
        for method in matrices
    }
    missing_regional_values = {method: int(np.isnan(values).sum()) for method, values in regional.items()}
    check = {
        "key": source["key"],
        "shape": shape,
        "chunks": chunks,
        "scaleFactor": scale_factor,
        "readStartIndex": source["readStart"],
        "readStopIndexExclusive": source["readStop"],
        "readHours": ntime,
        "finiteInputFraction": round(finite_values / read_values, 9),
        "missingRegionalHourlyValues": missing_regional_values,
    }
    return regional, check


def regional_weekly(values: np.ndarray, time: pd.DatetimeIndex, region_ids: list[str],
                    timezone_shift_hours: int) -> pd.DataFrame:
    shifted_time = time + pd.Timedelta(hours=timezone_shift_hours)
    frame = pd.DataFrame(values, columns=region_ids)
    frame.insert(0, "date", shifted_time.floor("D"))
    daily = frame.groupby("date", as_index=False).mean(numeric_only=True)
    long = daily.melt(id_vars="date", var_name="location", value_name="temp")
    iso = long.date.dt.isocalendar()
    long["year"] = iso.year.astype(int)
    long["woy"] = iso.week.astype(int)
    return long.groupby(["location", "year", "woy"], as_index=False).temp.mean()


def comparison_metrics(observed: pd.DataFrame, reconstructed: pd.DataFrame) -> dict:
    merged = observed.merge(
        reconstructed, on=["location", "year", "woy"], suffixes=("_observed", "_reconstructed"), how="inner"
    )
    errors = merged.temp_reconstructed - merged.temp_observed
    return round_metrics({
        "matchedRows": len(merged),
        "expectedRows": len(observed),
        "matchedFraction": float(len(merged) / len(observed)),
        "matchedRegions": int(merged.location.nunique()),
        "overallBiasC": float(errors.mean()),
        "medianAbsoluteErrorC": float(errors.abs().median()),
        "p95AbsoluteErrorC": float(errors.abs().quantile(0.95)),
        "maximumAbsoluteErrorC": float(errors.abs().max()),
        "pearsonCorrelation": float(np.corrcoef(
            merged.temp_observed.to_numpy(dtype=float), merged.temp_reconstructed.to_numpy(dtype=float)
        )[0, 1]),
    })


def anomaly_metrics(observed: pd.DataFrame, reconstructed: pd.DataFrame) -> dict:
    merged = observed.merge(
        reconstructed, on=["location", "year", "woy"], suffixes=("_observed", "_reconstructed"), how="inner"
    )
    for field in ("observed", "reconstructed"):
        baseline = merged[merged.year.isin(TRAINING_YEARS)].groupby(["location", "woy"])[f"temp_{field}"].mean()
        keys = pd.MultiIndex.from_frame(merged[["location", "woy"]])
        merged[f"anomaly_{field}"] = merged[f"temp_{field}"].to_numpy() - baseline.reindex(keys).to_numpy()
    validation = merged[merged.year.isin(VALIDATION_YEARS)]
    errors = validation.anomaly_reconstructed - validation.anomaly_observed
    return round_metrics({
        "trainingYears": list(TRAINING_YEARS),
        "validationYears": list(VALIDATION_YEARS),
        "matchedRows": len(validation),
        "matchedRegions": int(validation.location.nunique()),
        "overallBiasC": float(errors.mean()),
        "medianAbsoluteErrorC": float(errors.abs().median()),
        "p95AbsoluteErrorC": float(errors.abs().quantile(0.95)),
        "maximumAbsoluteErrorC": float(errors.abs().max()),
        "pearsonCorrelation": float(np.corrcoef(
            validation.anomaly_observed.to_numpy(dtype=float),
            validation.anomaly_reconstructed.to_numpy(dtype=float),
        )[0, 1]),
    })


def method_result(helper, public: pd.DataFrame, reconstructed: pd.DataFrame, criteria: dict) -> dict:
    reconstructed = reconstructed[(reconstructed.woy >= 22) & (reconstructed.woy <= 35)]
    absolute = comparison_metrics(public, reconstructed)
    anomalies = anomaly_metrics(public, reconstructed)
    return {
        "absoluteTemperatures": absolute,
        "heldOutWeeklyAnomalies": anomalies,
        "passesPredeclaredAbsoluteReconstructionCriteria": helper.criteria_pass(absolute, criteria),
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=OUTPUT_PATH)
    parser.add_argument("--cache-root", type=Path, default=CACHE_ROOT)
    parser.add_argument("--keep-cache", action="store_true")
    args = parser.parse_args()

    helper = load_reconstruction_module()
    plan = json.loads(PLAN_PATH.read_text())
    regions = helper.prepare_regions(plan)
    region_ids = regions.location.tolist()
    grid, lat_start, lat_stop, lon_start, lon_stop = italy_grid(helper, regions)
    matrices = helper.build_weight_matrices(grid, regions)
    spans = active_row_spans(matrices, len(grid.latitudes), len(grid.longitudes))
    criteria = plan["acceptanceCriteria"]["publicSampleComparison"]
    method_frames = {
        f"{method}_{timezone}": []
        for method in matrices
        for timezone in ("utcplus0000", "utcplus0100")
    }
    raw_checks = []
    source_objects = []

    for year in YEARS:
        year_regional = {method: [] for method in matrices}
        year_times = []
        for source in year_sources(year):
            metadata = object_metadata(source["url"])
            source_objects.append({
                **metadata,
                "key": source["key"],
                "objectStartUtc": source["objectStart"].isoformat(),
                "readStartIndex": source["readStart"],
                "readStopIndexExclusive": source["readStop"],
            })
            regional, check = read_regional_source(
                source, matrices, (len(grid.latitudes), len(grid.longitudes)), spans,
                lat_start, lon_start, args.cache_root, args.keep_cache,
            )
            time = pd.date_range(
                source["objectStart"] + pd.Timedelta(hours=source["readStart"]),
                periods=source["readStop"] - source["readStart"], freq="h",
            )
            year_times.append(time)
            for method in matrices:
                year_regional[method].append(regional[method])
            raw_checks.append({"year": year, **check})

        time = year_times[0].append(year_times[1:]) if len(year_times) > 1 else year_times[0]
        if time.has_duplicates or not time.is_monotonic_increasing:
            raise RuntimeError(f"Duplicate or unordered hourly timestamps for {year}")
        if len(time) != 2544:
            raise RuntimeError(f"Expected 2,544 hourly values for {year}, got {len(time)}")
        for method in matrices:
            values = np.concatenate(year_regional[method], axis=0)
            for timezone, shift in (("utcplus0000", 0), ("utcplus0100", 1)):
                method_frames[f"{method}_{timezone}"].append(
                    regional_weekly(values, time, region_ids, shift)
                )

    public_path = ROOT / plan["sourceSummary"]["publicWeeklyTemperatures"]["localPath"]
    public = pd.read_csv(public_path)
    public = public[(public.woy >= 22) & (public.woy <= 35)][["location", "year", "woy", "temp"]]
    if public.duplicated(["location", "year", "woy"]).any():
        raise RuntimeError("Public comparison data contain duplicate region-year-week rows")
    sensitivities = {
        name: method_result(helper, public, pd.concat(parts, ignore_index=True), criteria)
        for name, parts in method_frames.items()
    }
    ranked = sorted(
        sensitivities.items(),
        key=lambda item: (
            not item[1]["passesPredeclaredAbsoluteReconstructionCriteria"],
            item[1]["absoluteTemperatures"]["medianAbsoluteErrorC"],
            item[1]["absoluteTemperatures"]["p95AbsoluteErrorC"],
        ),
    )
    selected_name, selected = ranked[0]
    passes = selected["passesPredeclaredAbsoluteReconstructionCriteria"]
    status = (
        "public_sample_temperature_pattern_validated_full_endpoint_still_pending"
        if passes else "mirror_not_admitted_agreement_insufficient"
    )
    admission_status = (
        "accepted_for_public_sample_temperature_pattern_validation_only"
        if passes else "rejected_for_source_removal_endpoint_attribution"
    )
    source_identity = [{key: item[key] for key in ("key", "url", "contentLength", "etag", "lastModified")} for item in source_objects]

    payload = {
        "version": "tulip_europe_heat_openmeteo_era5land_crosscheck_2026_09_24_v1",
        "generatedOn": "2026-09-24",
        "status": status,
        "productionRatingsEnabled": 0,
        "purpose": "Reproduce the checksum-pinned 103-region Italian weekly temperature panel from an open 0.1-degree ERA5-Land mirror using thresholds fixed before retrieval.",
        "source": {
            "id": "openmeteo_aws_open_data_copernicus_era5_land_temperature_2m",
            "publisher": "Open-Meteo AWS Open Data mirror; underlying reanalysis from Copernicus/ECMWF ERA5-Land",
            "baseUrl": BASE_URL,
            "documentation": DOCUMENTATION,
            "formatDocumentation": FORMAT_DOCUMENTATION,
            "access": "anonymous public HTTP range reads",
            "licence": "CC BY 4.0",
            "temporalResolution": "hourly",
            "spatialGrid": "0.1 degree, 1,801 by 3,600",
            "variable": "temperature_2m",
            "objectIdentityDigest": digest(source_identity),
            "objects": source_objects,
            "provenanceBoundary": "This is an independently operated public mirror of ERA5-Land, not a second climate model and not the preferred licensed CDS retrieval.",
        },
        "method": {
            "planVersion": plan["version"],
            "regionBoundary": plan["inputAudit"]["regionJoin"],
            "gridSubset": {
                "latitudeIndex": [lat_start, lat_stop],
                "longitudeIndex": [lon_start, lon_stop],
                "shape": [len(grid.latitudes), len(grid.longitudes)],
                "activeLatitudeRows": sum(span is not None for span in spans),
            },
            "validationYears": list(YEARS),
            "weeks": [22, 35],
            "temperatureAggregation": "Hourly grid-cell temperatures are spatially aggregated to each region, then averaged by day and ISO region-week.",
            "spatialMethods": list(matrices),
            "timeZoneSensitivities": ["UTC+00:00", "UTC+01:00"],
            "predeclaredCriteria": criteria,
            "selectionRule": "Choose a passing configuration with the smallest median absolute error, then the smallest p95 absolute error. If none passes, retain the best diagnostic but reject admission.",
            "selectedConfiguration": selected_name,
        },
        "rawChecks": raw_checks,
        "results": {
            "absoluteTemperatures": selected["absoluteTemperatures"],
            "heldOutWeeklyAnomalies": selected["heldOutWeeklyAnomalies"],
            "passesPredeclaredAbsoluteReconstructionCriteria": passes,
            "methodSensitivities": sensitivities,
        },
        "decision": {
            "admissionStatus": admission_status,
            "admittedUse": (
                "Validate the regional temperature-pattern reconstruction on the complete 103-region public Italian sample."
                if passes else "Independent diagnostic of the public Italian temperature pattern only."
            ),
            "prohibitedUses": [
                "Do not enable or change a TULIP rating from this public-sample cross-check.",
                "Do not treat the Open-Meteo mirror as an independent climate model.",
                "Do not claim validation for the full 823-region endpoint from the 103-region Italian sample.",
                "Do not omit physical, epidemiological, population or source-allocation uncertainty from the endpoint.",
            ],
            "nextGate": "Extend the validated method to all 823 endpoint regions, propagate regional-pattern, emissions-response, epidemiological, population and source-allocation uncertainty, then reproduce the source-attributable endpoint independently.",
            "finding": (
                "The open 0.1-degree mirror passes every predeclared Italian-sample tolerance. This reduces uncertainty in the temperature-pattern step only; the full endpoint remains pending."
                if passes else "The open 0.1-degree mirror fails at least one predeclared Italian-sample tolerance and remains outside source-removal endpoint attribution."
            ),
        },
    }
    payload["digest"] = digest({
        "source": payload["source"], "method": payload["method"],
        "rawChecks": payload["rawChecks"], "results": payload["results"], "decision": payload["decision"],
    })
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(payload, indent=2) + "\n")
    print(json.dumps({
        "output": str(args.output.relative_to(ROOT)),
        "status": status,
        "selectedConfiguration": selected_name,
        "absolute": selected["absoluteTemperatures"],
        "anomalies": selected["heldOutWeeklyAnomalies"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
