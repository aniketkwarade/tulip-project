#!/usr/bin/env python3
"""Execute resumable NASA NEX exact-week regional-temperature checkpoints."""

from __future__ import annotations

import argparse
import contextlib
from datetime import date
import fcntl
import hashlib
import json
import os
from pathlib import Path
import time

import numpy as np
import requests

from lib.netcdf3 import Dataset


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
INVENTORY_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-inventory.json"
WEIGHTS_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-area-weights.json"
MASK_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-land-mask.json"
PLAN_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-regional-retrieval-plan.json"
CALENDAR_COMPATIBILITY_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-calendar-compatibility.json"
OUTPUT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-regional-temperature-execution.json"
REPORT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-regional-temperature-execution-report.md"
CHECKPOINT_ROOT = ROOT / "tmp/tulip-independent-pattern/nasa-nex-regional-temperature-checkpoints"
SERIES_ROOT = ROOT / "tmp/tulip-independent-pattern/nasa-nex-regional-temperature-series"
DOWNLOAD_ROOT = ROOT / "tmp/tulip-independent-pattern/nasa-nex-regional-temperature-downloads"
MANIFEST_LOCK_PATH = CHECKPOINT_ROOT / ".manifest.lock"
NCSS_ROOT = "https://ds.nccs.nasa.gov/thredds/ncss/grid"
VERSION = "tulip_nasa_nex_gddp_cmip6_independent_pattern_regional_temperature_execution_2026_09_26_v1"

GRID_NLAT = 600
GRID_NLON = 1440
GRID_LAT_FIRST = -59.875
GRID_LON_FIRST = 0.125
GRID_SPACING = 0.25
EXPECTED_REGIONS = 971
EXPECTED_DAYS = 98
MIN_FINITE_AREA_FRACTION = 0.99


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def verified_json(path: Path) -> dict:
    payload = json.loads(path.read_text())
    content = dict(payload)
    digest = content.pop("digest", None)
    if not digest or canonical_digest(content) != digest:
        raise RuntimeError(f"Digest failed for {path.relative_to(ROOT)}")
    return payload


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def atomic_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(f".{path.name}.{os.getpid()}.{time.time_ns()}.tmp")
    try:
        temporary.write_text(json.dumps(payload, indent=2) + "\n")
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


@contextlib.contextmanager
def exclusive_lock(path: Path, *, nonblocking: bool = False):
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+") as handle:
        flags = fcntl.LOCK_EX | (fcntl.LOCK_NB if nonblocking else 0)
        try:
            fcntl.flock(handle.fileno(), flags)
        except BlockingIOError:
            yield False
            return
        try:
            yield True
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def safe_name(value: str) -> str:
    return value.replace("/", "_").replace(" ", "_")


def checkpoint_key(record: dict) -> str:
    return f"{safe_name(record['model'])}__{safe_name(record['member'])}__{record['year']}"


def checkpoint_path(record: dict) -> Path:
    return CHECKPOINT_ROOT / f"{checkpoint_key(record)}.json"


def series_path(record: dict) -> Path:
    return SERIES_ROOT / f"{checkpoint_key(record)}.npz"


def record_identity(record: dict, inputs: dict) -> dict:
    return {
        "model": record["model"],
        "canonicalModel": record["canonicalModel"],
        "member": record["member"],
        "experiment": record["experiment"],
        "year": record["year"],
        "sourceFile": record["sourceFile"],
        "inventoryDigest": inputs["inventory"]["digest"],
        "areaWeightsDigest": inputs["weights"]["digest"],
        "landMaskDigest": inputs["mask"]["digest"],
        "retrievalPlanDigest": inputs["plan"]["digest"],
    }


def record_identity_digest(record: dict, inputs: dict) -> str:
    return canonical_digest(record_identity(record, inputs))


def selected_records(inventory: dict) -> list[dict]:
    records = []
    for model in inventory["models"]:
        if not model["eligible"]:
            continue
        for member in model["members"]:
            if not member["eligible"]:
                continue
            for experiment in ("historical", "ssp245"):
                for source in member[experiment]["files"]:
                    records.append({
                        "model": model["model"],
                        "canonicalModel": model["canonicalModel"],
                        "member": member["member"],
                        "experiment": experiment,
                        "year": int(source["year"]),
                        "sourceFile": source,
                    })
    records.sort(key=lambda row: (row["model"], row["member"], row["year"]))
    return records


def admitted_records(inventory: dict, calendar_compatibility: dict) -> list[dict]:
    """Apply the frozen exact-ISO-week calendar gate to inventory records."""
    excluded = {
        (row["model"], row["member"])
        for row in calendar_compatibility["exclusions"]
    }
    records = [
        record for record in selected_records(inventory)
        if (record["model"], record["member"]) not in excluded
    ]
    expected = calendar_compatibility["counts"]["admittedAnnualCheckpoints"]
    if len(records) != expected:
        raise RuntimeError(
            f"NASA calendar-compatible record count is {len(records)}, expected {expected}"
        )
    return records


def cell_coordinates(cell_index: int) -> tuple[float, float]:
    latitude_index, longitude_index = divmod(cell_index, GRID_NLON)
    latitude = GRID_LAT_FIRST + latitude_index * GRID_SPACING
    longitude = GRID_LON_FIRST + longitude_index * GRID_SPACING
    if longitude > 180:
        longitude -= 360
    return latitude, longitude


def tile_name(latitude: float, longitude: float) -> str:
    if longitude < -58 and latitude >= 10:
        return "caribbean"
    if longitude < -45 and latitude < 10:
        return "south_america"
    if longitude >= 35 and latitude < 0:
        return "indian_ocean"
    if longitude < -12 and latitude < 34:
        return "macaronesia"
    if longitude < -12 and latitude >= 34:
        return "north_atlantic"
    return "europe"


def load_arrays(inputs: dict) -> dict:
    weights_output = inputs["weights"]["weightsOutput"]
    weights_file = ROOT / weights_output["path"]
    if file_sha256(weights_file) != weights_output["sha256"]:
        raise RuntimeError("NASA regional weight file checksum changed")
    with np.load(weights_file) as arrays:
        cell_indices = arrays["cell_indices"].astype(np.int64, copy=True)
        offsets = arrays["offsets"].astype(np.int64, copy=True)
        region_indices = arrays["region_indices"].astype(np.int32, copy=True)
        areas = arrays["areas_square_metres"].astype(np.float64, copy=True)
        region_ids = arrays["region_ids"].astype("U16", copy=True)
    mask_output = inputs["mask"]["maskOutput"]
    mask_file = ROOT / mask_output["path"]
    if file_sha256(mask_file) != mask_output["sha256"]:
        raise RuntimeError("NASA regional land-mask file checksum changed")
    with np.load(mask_file) as arrays:
        mask_cells = arrays["cell_indices"].astype(np.int64, copy=True)
        finite_source_mask = arrays["finite_source_mask"].astype(bool, copy=True)
        admitted_area = arrays["admitted_area_square_metres"].astype(np.float64, copy=True)
        mask_region_ids = arrays["region_ids"].astype("U16", copy=True)
    if not np.array_equal(cell_indices, mask_cells) or not np.array_equal(region_ids, mask_region_ids):
        raise RuntimeError("NASA weights and source mask use different fixed arrays")
    if len(region_ids) != EXPECTED_REGIONS or len(set(region_ids.tolist())) != EXPECTED_REGIONS:
        raise RuntimeError("NASA fixed regional universe is not 971 unique identifiers")
    if len(offsets) != len(cell_indices) + 1 or offsets[0] != 0 or offsets[-1] != len(region_indices):
        raise RuntimeError("NASA regional weight offsets are inconsistent")
    if len(region_indices) != len(areas) or np.any(areas <= 0) or np.any(admitted_area <= 0):
        raise RuntimeError("NASA regional weights or admitted source-mask areas are invalid")
    tile_positions: dict[str, list[int]] = {tile["name"]: [] for tile in inputs["plan"]["tiles"]}
    for position in np.flatnonzero(finite_source_mask):
        latitude, longitude = cell_coordinates(int(cell_indices[position]))
        tile_positions[tile_name(latitude, longitude)].append(int(position))
    plan_tiles = {tile["name"]: tile for tile in inputs["plan"]["tiles"]}
    for name, positions in tile_positions.items():
        cells = np.asarray(sorted(cell_indices[positions].tolist()), dtype=np.int64)
        tile = plan_tiles[name]
        if len(positions) != tile["assignedFiniteWeightedCells"]:
            raise RuntimeError(f"NASA retrieval tile {name} cell count changed")
        if hashlib.sha256(cells.tobytes()).hexdigest() != tile["assignedCellIndicesSha256"]:
            raise RuntimeError(f"NASA retrieval tile {name} cell identity changed")
    return {
        "cellIndices": cell_indices,
        "offsets": offsets,
        "regionIndices": region_indices,
        "areas": areas,
        "regionIds": region_ids,
        "finiteSourceMask": finite_source_mask,
        "admittedArea": admitted_area,
        "tilePositions": tile_positions,
    }


def logical_tile_digest(dataset: Dataset) -> str:
    digest = hashlib.sha256()
    for name in ("lon", "lat", "time", "tas"):
        values = dataset.read(name, decode=False)
        digest.update(json.dumps({
            "name": name,
            "shape": list(values.shape),
            "dtype": values.dtype.str,
        }, sort_keys=True, separators=(",", ":")).encode())
        digest.update(values.tobytes(order="C"))
    return digest.hexdigest()


def download_tile(session: requests.Session, record: dict, tile: dict, path: Path) -> dict:
    start = date.fromisocalendar(record["year"], 22, 1)
    end = date.fromisocalendar(record["year"], 35, 7)
    if (end - start).days + 1 != EXPECTED_DAYS:
        raise RuntimeError(f"ISO-week window for {record['year']} is not 98 days")
    params = {
        "var": "tas",
        "north": str(tile["northCenter"]),
        "south": str(tile["southCenter"]),
        "west": str(tile["westCenter"]),
        "east": str(tile["eastCenter"]),
        "horizStride": "1",
        "time_start": f"{start.isoformat()}T12:00:00Z",
        "time_end": f"{end.isoformat()}T12:00:00Z",
        "accept": "netcdf3",
        "addLatLon": "true",
    }
    url = f"{NCSS_ROOT}/{record['sourceFile']['urlPath']}"
    last_error: Exception | None = None
    for attempt in range(4):
        temporary = path.with_name(f".{path.name}.{os.getpid()}.{time.time_ns()}.tmp")
        try:
            with session.get(url, params=params, timeout=300, stream=True) as response:
                response.raise_for_status()
                metadata = {
                    "url": response.url,
                    "contentType": response.headers.get("Content-Type"),
                    "contentLengthHeader": int(response.headers["Content-Length"]) if response.headers.get("Content-Length") else None,
                }
                with temporary.open("wb") as handle:
                    for chunk in response.iter_content(1024 * 1024):
                        handle.write(chunk)
            os.replace(temporary, path)
            metadata["bytes"] = path.stat().st_size
            return metadata
        except Exception as error:  # pragma: no cover - network failure branch
            last_error = error
            temporary.unlink(missing_ok=True)
            if attempt + 1 < 4:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Unable to download {record['model']} {record['year']} {tile['name']}: {last_error}")


def decode_tile(path: Path, tile: dict, positions: list[int], arrays: dict) -> tuple[np.ndarray, dict]:
    with Dataset(path) as dataset:
        latitude = dataset.read("lat")
        longitude = dataset.read("lon")
        time_values = dataset.read("time")
        temperature = dataset.read("tas")
        logical_digest = logical_tile_digest(dataset)
        time_attributes = dict(dataset.variables["time"].attributes)
    expected_shape = (EXPECTED_DAYS, tile["latitudeCount"], tile["longitudeCount"])
    if temperature.shape != expected_shape:
        raise RuntimeError(f"NASA tile {tile['name']} shape {temperature.shape} differs from {expected_shape}")
    if len(time_values) != EXPECTED_DAYS or not np.allclose(np.diff(time_values), 1.0):
        raise RuntimeError(f"NASA tile {tile['name']} does not contain 98 consecutive daily values")
    latitude_indices = np.rint((latitude - GRID_LAT_FIRST) / GRID_SPACING).astype(np.int64)
    longitude_native = np.mod(longitude, 360.0)
    longitude_indices = np.rint((longitude_native - GRID_LON_FIRST) / GRID_SPACING).astype(np.int64) % GRID_NLON
    if not np.allclose(GRID_LAT_FIRST + latitude_indices * GRID_SPACING, latitude, atol=1e-6):
        raise RuntimeError(f"NASA tile {tile['name']} latitude coordinates changed")
    expected_longitude = GRID_LON_FIRST + longitude_indices * GRID_SPACING
    if not np.allclose(np.mod(expected_longitude, 360.0), longitude_native, atol=1e-6):
        raise RuntimeError(f"NASA tile {tile['name']} longitude coordinates changed")
    local_cells = (
        latitude_indices[:, None] * GRID_NLON + longitude_indices[None, :]
    ).reshape(-1)
    lookup = {int(cell): index for index, cell in enumerate(local_cells.tolist())}
    assigned_cells = arrays["cellIndices"][positions]
    try:
        local_positions = np.asarray([lookup[int(cell)] for cell in assigned_cells], dtype=np.int64)
    except KeyError as error:
        raise RuntimeError(f"NASA tile {tile['name']} omitted an assigned weighted cell {error}") from error
    candidate = temperature.reshape(EXPECTED_DAYS, -1)[:, local_positions]
    return candidate, {
        "logicalDataSha256": logical_digest,
        "latitudeCount": len(latitude),
        "longitudeCount": len(longitude),
        "timeCount": len(time_values),
        "timeUnits": time_attributes.get("units"),
        "minimumTemperatureK": float(np.nanmin(candidate)),
        "maximumTemperatureK": float(np.nanmax(candidate)),
        "finiteAssignedValues": int(np.isfinite(candidate).sum()),
        "assignedValues": int(candidate.size),
    }


def accumulate_tile(
    numerators: np.ndarray,
    denominators: np.ndarray,
    candidate: np.ndarray,
    positions: list[int],
    arrays: dict,
) -> None:
    offsets = arrays["offsets"]
    intersections = np.concatenate([
        np.arange(offsets[position], offsets[position + 1], dtype=np.int64)
        for position in positions
    ])
    local_repeats = np.repeat(
        np.arange(len(positions), dtype=np.int64),
        [offsets[position + 1] - offsets[position] for position in positions],
    )
    expanded = candidate[:, local_repeats]
    region_indices = arrays["regionIndices"][intersections]
    areas = arrays["areas"][intersections]
    for day_index in range(EXPECTED_DAYS):
        finite = np.isfinite(expanded[day_index])
        denominators[day_index] += np.bincount(
            region_indices[finite],
            weights=areas[finite],
            minlength=EXPECTED_REGIONS,
        )
        numerators[day_index] += np.bincount(
            region_indices[finite],
            weights=areas[finite] * expanded[day_index, finite],
            minlength=EXPECTED_REGIONS,
        )


def execute_record(record: dict, inputs: dict, arrays: dict) -> dict:
    identity_digest = record_identity_digest(record, inputs)
    checkpoint = checkpoint_path(record)
    if checkpoint.exists():
        existing = verified_json(checkpoint)
        if existing["identityDigest"] != identity_digest:
            raise RuntimeError(f"Existing checkpoint identity changed: {checkpoint.relative_to(ROOT)}")
        return existing

    lock_path = checkpoint.with_suffix(".lock")
    with exclusive_lock(lock_path, nonblocking=True) as acquired:
        if not acquired:
            raise RuntimeError(f"Checkpoint is already running: {checkpoint_key(record)}")
        if checkpoint.exists():
            return verified_json(checkpoint)
        download_directory = DOWNLOAD_ROOT / checkpoint_key(record)
        download_directory.mkdir(parents=True, exist_ok=True)
        numerators = np.zeros((EXPECTED_DAYS, EXPECTED_REGIONS), dtype=np.float64)
        denominators = np.zeros((EXPECTED_DAYS, EXPECTED_REGIONS), dtype=np.float64)
        tile_records = []
        with requests.Session() as session:
            session.headers["User-Agent"] = "TULIP-NASA-exact-week-regional-executor/1.0"
            for tile in inputs["plan"]["tiles"]:
                name = tile["name"]
                path = download_directory / f"{name}.nc"
                source = download_tile(session, record, tile, path)
                candidate, decoded = decode_tile(path, tile, arrays["tilePositions"][name], arrays)
                accumulate_tile(
                    numerators,
                    denominators,
                    candidate,
                    arrays["tilePositions"][name],
                    arrays,
                )
                tile_records.append({"name": name, **source, **decoded})
                path.unlink(missing_ok=True)
                print(
                    f"{record['model']} {record['member']} {record['year']}: "
                    f"completed tile {name} ({source['bytes']:,} bytes)",
                    flush=True,
                )
        try:
            download_directory.rmdir()
        except OSError:
            pass

        coverage = denominators / arrays["admittedArea"][None, :]
        minimum_coverage = float(np.min(coverage))
        if minimum_coverage < MIN_FINITE_AREA_FRACTION:
            day_index, region_index = np.unravel_index(np.argmin(coverage), coverage.shape)
            raise RuntimeError(
                f"{record['model']} {record['year']} retains {minimum_coverage:.6f} of frozen "
                f"source-mask area for {arrays['regionIds'][region_index]} on day {day_index + 1}; "
                f"required {MIN_FINITE_AREA_FRACTION:.2f}"
            )
        daily_kelvin = numerators / denominators
        if not np.all(np.isfinite(daily_kelvin)) or np.any((daily_kelvin < 180) | (daily_kelvin > 330)):
            raise RuntimeError(f"{record['model']} {record['year']} produced implausible regional temperatures")
        annual_celsius = np.mean(daily_kelvin, axis=0) - 273.15

        series = series_path(record)
        series.parent.mkdir(parents=True, exist_ok=True)
        temporary = series.with_name(f".{series.name}.{os.getpid()}.{time.time_ns()}.tmp.npz")
        logical_sha256 = hashlib.sha256(b"".join([
            arrays["regionIds"].tobytes(), annual_celsius.tobytes(),
        ])).hexdigest()
        try:
            np.savez_compressed(
                temporary,
                region_ids=arrays["regionIds"],
                annual_exact_week_mean_c=annual_celsius,
            )
            os.replace(temporary, series)
        finally:
            temporary.unlink(missing_ok=True)
        payload = {
            "version": VERSION,
            "status": "complete_exact_week_model_member_year_checkpoint",
            "productionRatingsEnabled": 0,
            "identity": record_identity(record, inputs),
            "identityDigest": identity_digest,
            "method": {
                "isoWeeks": [22, 35],
                "days": EXPECTED_DAYS,
                "dailyTemperatureIdentity": "NASA tas daily midpoint, verified as (tasmin + tasmax) / 2.",
                "minimumFiniteAdmittedAreaFraction": MIN_FINITE_AREA_FRACTION,
            },
            "coverage": {
                "regions": EXPECTED_REGIONS,
                "minimumFiniteAdmittedAreaFraction": minimum_coverage,
                "minimumAnnualMeanC": float(np.min(annual_celsius)),
                "maximumAnnualMeanC": float(np.max(annual_celsius)),
                "responseBytes": sum(tile["bytes"] for tile in tile_records),
            },
            "tiles": tile_records,
            "output": {
                "path": str(series.relative_to(ROOT)),
                "bytes": series.stat().st_size,
                "sha256": file_sha256(series),
                "logicalSha256": logical_sha256,
                "rows": EXPECTED_REGIONS,
            },
            "decision": {"axesAdmitted": 0, "scoresChanged": 0},
        }
        payload["digest"] = canonical_digest(payload)
        atomic_json(checkpoint, payload)
        return payload


def checkpoint_is_valid(record: dict, inputs: dict) -> dict | None:
    path = checkpoint_path(record)
    if not path.exists():
        return None
    payload = verified_json(path)
    if payload["identityDigest"] != record_identity_digest(record, inputs):
        raise RuntimeError(f"Checkpoint identity changed: {path.relative_to(ROOT)}")
    output = payload["output"]
    series = ROOT / output["path"]
    if not series.exists() or series.stat().st_size != output["bytes"] or file_sha256(series) != output["sha256"]:
        raise RuntimeError(f"Checkpoint output failed validation: {series.relative_to(ROOT)}")
    return payload


def rebuild_manifest(inputs: dict, records: list[dict]) -> dict:
    complete = []
    remaining = []
    response_bytes = 0
    for record in records:
        checkpoint = checkpoint_is_valid(record, inputs)
        if checkpoint is None:
            remaining.append(record)
        else:
            complete.append(record)
            response_bytes += checkpoint["coverage"]["responseBytes"]
    by_vote: dict[str, list[dict]] = {}
    for record in records:
        by_vote.setdefault(record["canonicalModel"], []).append(record)
    complete_keys = {(row["model"], row["member"], row["year"]) for row in complete}
    complete_votes = [
        model for model, values in by_vote.items()
        if all((row["model"], row["member"], row["year"]) in complete_keys for row in values)
    ]
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "complete_all_exact_week_regional_temperature_series" if not remaining else "partial_resumable_exact_week_regional_temperature_execution",
        "productionRatingsEnabled": 0,
        "purpose": "Execute the frozen NASA NEX exact-week independent regional-temperature challenge without admitting a TULIP axis or score.",
        "inputs": {
            "inventoryDigest": inputs["inventory"]["digest"],
            "areaWeightsDigest": inputs["weights"]["digest"],
            "landMaskDigest": inputs["mask"]["digest"],
            "retrievalPlanDigest": inputs["plan"]["digest"],
            "calendarCompatibilityDigest": inputs["calendarCompatibility"]["digest"],
        },
        "counts": {
            "annualCheckpointsExpected": len(records),
            "annualCheckpointsComplete": len(complete),
            "annualCheckpointsRemaining": len(remaining),
            "independentModelVotesExpected": len(by_vote),
            "independentModelVotesComplete": len(complete_votes),
            "regionsPerCheckpoint": EXPECTED_REGIONS,
            "completedRegionYearRows": len(complete) * EXPECTED_REGIONS,
            "responseBytesDownloadedForCompletedCheckpoints": response_bytes,
        },
        "completeIndependentModelVotes": sorted(complete_votes),
        "remainingCheckpointKeys": [checkpoint_key(row) for row in remaining],
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Complete every annual checkpoint, average members and grid variants within canonical models, fit the frozen exact-week patterns and apply the predeclared agreement tests.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write_manifest(payload: dict) -> None:
    atomic_json(OUTPUT_PATH, payload)
    counts = payload["counts"]
    REPORT_PATH.write_text(
        "# NASA NEX exact-week regional-temperature execution\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"{counts['annualCheckpointsComplete']:,} of {counts['annualCheckpointsExpected']:,} atomic model/member/year checkpoints are complete, "
        f"covering {counts['completedRegionYearRows']:,} regional annual means. "
        f"{counts['independentModelVotesComplete']} of {counts['independentModelVotesExpected']} independent model votes have their full 1950–2022 route.\n\n"
        "This ingestion changes zero TULIP axes and zero scores. Partial coverage cannot enter the comparison.\n"
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--model")
    parser.add_argument("--member")
    parser.add_argument("--year", type=int)
    parser.add_argument("--max-checkpoints", type=int, default=1)
    parser.add_argument("--refresh-only", action="store_true")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    if args.max_checkpoints < 1:
        raise RuntimeError("--max-checkpoints must be positive")
    inputs = {
        "inventory": verified_json(INVENTORY_PATH),
        "weights": verified_json(WEIGHTS_PATH),
        "mask": verified_json(MASK_PATH),
        "plan": verified_json(PLAN_PATH),
        "calendarCompatibility": verified_json(CALENDAR_COMPATIBILITY_PATH),
    }
    candidate_records = selected_records(inputs["inventory"])
    if len(candidate_records) != inputs["plan"]["counts"]["annualFiles"]:
        raise RuntimeError("NASA inventory and retrieval plan contain different annual-file counts")
    records = admitted_records(inputs["inventory"], inputs["calendarCompatibility"])
    arrays = load_arrays(inputs)
    candidates = [
        record for record in records
        if (args.model is None or record["model"] == args.model)
        and (args.member is None or record["member"] == args.member)
        and (args.year is None or record["year"] == args.year)
        and checkpoint_is_valid(record, inputs) is None
    ]
    if not args.refresh_only:
        for record in candidates[:args.max_checkpoints]:
            print(f"{record['model']} {record['member']} {record['year']}: reading NASA NEX exact-week tiles", flush=True)
            execute_record(record, inputs, arrays)
    with exclusive_lock(MANIFEST_LOCK_PATH) as acquired:
        if not acquired:
            raise RuntimeError("Unable to acquire NASA manifest lock")
        manifest = rebuild_manifest(inputs, records)
        write_manifest(manifest)
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "status": manifest["status"],
        "counts": manifest["counts"],
        "digest": manifest["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
