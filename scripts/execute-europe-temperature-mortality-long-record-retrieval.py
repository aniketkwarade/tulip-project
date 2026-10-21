#!/usr/bin/env python3
"""Execute the sparse 1950–2022 ERA5-Land regional-temperature read.

The executor is deliberately resumable and bounded. It reads one summer at a
time from the public Open-Meteo ERA5-Land mirror, reduces the hourly grid to
971 annual regional summer means, writes an atomic year checkpoint, and then
removes that year's block cache. No TULIP axis or score is changed here.
"""

from __future__ import annotations

import argparse
import asyncio
import contextlib
import csv
import fcntl
import hashlib
import json
import math
import os
import shutil
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.request import Request, urlopen

import fsspec
import numpy as np
import pandas as pd
from omfiles import OmFileReader, OmFileReaderAsync


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
PLAN_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-retrieval-plan.json"
AREA_WEIGHTS_PATH = CALIBRATION_DIR / "europe-temperature-mortality-regional-area-weights.json"
OUTPUT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-retrieval.json"
REPORT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-retrieval-report.md"
CHECKPOINT_ROOT = ROOT / "tmp/tulip-regional-pattern/era5-land-long-record-years"
COMBINED_CSV_PATH = ROOT / "tmp/tulip-regional-pattern/europe-temperature-mortality-annual-summer-means.csv"
CACHE_ROOT = ROOT / "tmp/tulip-regional-pattern/era5-land-range-cache"
MANIFEST_LOCK_PATH = CHECKPOINT_ROOT / ".manifest.lock"

VERSION = "tulip_europe_temperature_mortality_long_record_retrieval_2026_09_26_v1"
GRID_NLAT = 1801
GRID_NLON = 3600
HOURS_PER_OM_TIME_CHUNK = 21 * 24
EXPECTED_SUMMER_WEEKS = tuple(range(22, 36))
EXPECTED_SUMMER_HOURS = 14 * 7 * 24
SOURCE_BLOCK_SIZE = 5 * 1024 * 1024
OPENMETEO_HTTP_PREFIX = "http://openmeteo.s3.amazonaws.com/"
OPENMETEO_S3_PREFIX = "s3://openmeteo/"
TRANSPORT_DIRECT_S3 = "direct_s3"
TRANSPORT_BLOCKCACHE_S3 = "anonymous_s3_blockcache"
TRANSPORT_BLOCKCACHE_HTTP = "http_blockcache"
DEFAULT_DIRECT_READ_CONCURRENCY = 4
DIRECT_READ_BATCH_MULTIPLIER = 4


def canonical_digest(value: object) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def file_sha256(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def atomic_text(path: Path, value: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = unique_temporary_path(path)
    try:
        temporary.write_text(value)
        os.replace(temporary, path)
    finally:
        temporary.unlink(missing_ok=True)


def unique_temporary_path(path: Path) -> Path:
    """Return a same-directory temporary path safe across worker processes."""
    return path.with_name(f".{path.name}.{os.getpid()}.{time.time_ns()}.tmp")


@contextlib.contextmanager
def manifest_lock(path: Path = MANIFEST_LOCK_PATH):
    """Serialize combined-manifest rebuilds after parallel year checkpoints."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("a+") as handle:
        fcntl.flock(handle.fileno(), fcntl.LOCK_EX)
        try:
            yield
        finally:
            fcntl.flock(handle.fileno(), fcntl.LOCK_UN)


def allocated_bytes(path: Path) -> int:
    total = 0
    if not path.exists():
        return 0
    for item in path.rglob("*"):
        if item.is_file():
            stat = item.stat()
            total += getattr(stat, "st_blocks", 0) * 512 or stat.st_size
    return total


def object_metadata(url: str, attempts: int = 4) -> dict:
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            request = Request(url, method="HEAD", headers={"User-Agent": "TULIP evidence ingestion"})
            with urlopen(request, timeout=90) as response:
                return {
                    "url": url,
                    "contentLength": int(response.headers["Content-Length"]),
                    "etag": response.headers.get("ETag", "").strip('"'),
                    "lastModified": response.headers.get("Last-Modified"),
                    "contentType": response.headers.get("Content-Type"),
                }
        except Exception as error:  # pragma: no cover - network branch
            last_error = error
            if attempt + 1 < attempts:
                time.sleep(2 ** attempt)
    raise RuntimeError(f"Unable to read source metadata for {url}: {last_error}")


def source_open_file(url: str, cache_storage: Path):
    """Open the public object through S3 while preserving the HTTP identity.

    The HTTP range reader can surface an aiohttp ``ClientPayloadError`` as a
    non-bytes cache value after an incomplete response.  Anonymous S3 reads
    address the same immutable public object and fail at the transport boundary
    instead of passing an exception object to the OM decoder.
    """
    if not url.startswith(OPENMETEO_HTTP_PREFIX):
        raise RuntimeError(f"Unsupported long-record source host: {url}")
    s3_url = OPENMETEO_S3_PREFIX + url.removeprefix(OPENMETEO_HTTP_PREFIX)
    return fsspec.open(
        f"blockcache::{s3_url}",
        mode="rb",
        block_size=SOURCE_BLOCK_SIZE,
        blockcache={"cache_storage": str(cache_storage)},
        s3={
            "anon": True,
            "default_block_size": SOURCE_BLOCK_SIZE,
            "config_kwargs": {
                "connect_timeout": 30,
                "read_timeout": 90,
                "retries": {"max_attempts": 5, "mode": "standard"},
            },
        },
    )


def source_open_http_file(url: str, cache_storage: Path):
    """Open the public HTTP object with resumable fixed-size range caching."""
    if not url.startswith(OPENMETEO_HTTP_PREFIX):
        raise RuntimeError(f"Unsupported long-record source host: {url}")
    return fsspec.open(
        f"blockcache::{url}",
        mode="rb",
        block_size=SOURCE_BLOCK_SIZE,
        blockcache={"cache_storage": str(cache_storage)},
    )


def direct_s3_filesystem():
    """Return the anonymous S3 filesystem used for exact compressed ranges."""
    return fsspec.filesystem(
        "s3",
        anon=True,
        config_kwargs={
            "connect_timeout": 30,
            "read_timeout": 90,
            "retries": {"max_attempts": 5, "mode": "standard"},
        },
    )


def direct_s3_async_filesystem():
    """Return an event-loop-native S3 filesystem for bounded parallel reads."""
    return fsspec.filesystem(
        "s3",
        anon=True,
        asynchronous=True,
        config_kwargs={
            "connect_timeout": 30,
            "read_timeout": 90,
            "retries": {"max_attempts": 5, "mode": "standard"},
        },
    )


@contextlib.contextmanager
def source_reader(url: str, cache_storage: Path, transport: str, direct_filesystem=None):
    """Open one immutable OM object through the selected byte-range transport."""
    if not url.startswith(OPENMETEO_HTTP_PREFIX):
        raise RuntimeError(f"Unsupported long-record source host: {url}")
    if transport == TRANSPORT_DIRECT_S3:
        filesystem = direct_filesystem or direct_s3_filesystem()
        path = "openmeteo/" + url.removeprefix(OPENMETEO_HTTP_PREFIX)
        with OmFileReader.from_fsspec(filesystem, path) as data:
            yield data
        return
    if transport == TRANSPORT_BLOCKCACHE_S3:
        handle = source_open_file(url, cache_storage)
        with OmFileReader(handle) as data:
            yield data
        return
    if transport == TRANSPORT_BLOCKCACHE_HTTP:
        handle = source_open_http_file(url, cache_storage)
        with OmFileReader(handle) as data:
            yield data
        return
    raise RuntimeError(f"Unsupported ERA5-Land transport: {transport}")


def summer_window(year: int) -> tuple[pd.Timestamp, pd.Timestamp]:
    """Return the exact ISO-week 22–35 interval, with an exclusive end.

    A fixed May 25 lower bound drops May 24 in calendar years where ISO week
    22 begins on that date (1976 and 2004 in this record). Constructing the
    boundary from the ISO calendar preserves the same fourteen complete weeks
    for every year and prevents a transport retry from masking a time-window
    error.
    """
    start = pd.Timestamp.fromisocalendar(year, EXPECTED_SUMMER_WEEKS[0], 1)
    stop = pd.Timestamp.fromisocalendar(year, EXPECTED_SUMMER_WEEKS[-1] + 1, 1)
    return start, stop


def year_sources(year: int, base_url: str) -> list[dict]:
    start, stop = summer_window(year)
    if year <= 2021:
        object_start = pd.Timestamp(year=year, month=1, day=1)
        return [{
            "kind": "year",
            "key": f"year_{year}",
            "url": f"{base_url}/year_{year}.om",
            "objectStart": object_start,
            "readStart": int((start - object_start) / pd.Timedelta(hours=1)),
            "readStop": int((stop - object_start) / pd.Timedelta(hours=1)),
        }]

    epoch = pd.Timestamp("1970-01-01")
    first_chunk = math.floor((start - epoch) / pd.Timedelta(hours=HOURS_PER_OM_TIME_CHUNK))
    last_chunk = math.floor(((stop - pd.Timedelta(hours=1)) - epoch) / pd.Timedelta(hours=HOURS_PER_OM_TIME_CHUNK))
    sources = []
    for chunk in range(first_chunk, last_chunk + 1):
        object_start = epoch + pd.Timedelta(hours=chunk * HOURS_PER_OM_TIME_CHUNK)
        object_stop = object_start + pd.Timedelta(hours=HOURS_PER_OM_TIME_CHUNK)
        intersection_start = max(start, object_start)
        intersection_stop = min(stop, object_stop)
        sources.append({
            "kind": "chunk",
            "key": f"chunk_{chunk}",
            "url": f"{base_url}/chunk_{chunk}.om",
            "objectStart": object_start,
            "readStart": int((intersection_start - object_start) / pd.Timedelta(hours=1)),
            "readStop": int((intersection_stop - object_start) / pd.Timedelta(hours=1)),
        })
    return sources


def source_selected_slice(source: dict, year: int) -> tuple[int, int, int]:
    read_hours = source["readStop"] - source["readStart"]
    timestamps = pd.date_range(
        source["objectStart"] + pd.Timedelta(hours=source["readStart"]),
        periods=read_hours,
        freq="h",
    )
    iso = timestamps.isocalendar()
    selected = np.asarray((iso.year == year) & iso.week.isin(EXPECTED_SUMMER_WEEKS), dtype=bool)
    positions = np.flatnonzero(selected)
    if not len(positions):
        return source["readStart"], source["readStart"], 0
    if not np.all(np.diff(positions) == 1):
        raise RuntimeError(f"Selected summer hours are not contiguous for {source['key']}")
    start = source["readStart"] + int(positions[0])
    stop = source["readStart"] + int(positions[-1]) + 1
    return start, stop, int(len(positions))


@dataclass(frozen=True)
class SparseWeights:
    cell_indices: np.ndarray
    offsets: np.ndarray
    region_indices: np.ndarray
    areas: np.ndarray
    region_ids: np.ndarray


def load_weights(metadata: dict) -> SparseWeights:
    weights_path = ROOT / metadata["weightsOutput"]["path"]
    if file_sha256(weights_path) != metadata["weightsOutput"]["sha256"]:
        raise RuntimeError("Regional area-weight file checksum changed")
    arrays = np.load(weights_path)
    weights = SparseWeights(
        cell_indices=arrays["cell_indices"],
        offsets=arrays["offsets"],
        region_indices=arrays["region_indices"],
        areas=arrays["areas_square_metres"],
        region_ids=arrays["region_ids"],
    )
    logical = hashlib.sha256(b"".join([
        weights.cell_indices.tobytes(),
        weights.offsets.tobytes(),
        weights.region_indices.tobytes(),
        weights.areas.tobytes(),
        "\n".join(weights.region_ids.tolist()).encode(),
    ])).hexdigest()
    if logical != metadata["weightsOutput"]["logicalSha256"]:
        raise RuntimeError("Regional area-weight logical checksum changed")
    return weights


def weighted_row_runs(plan: dict, cell_indices: np.ndarray) -> list[tuple[int, int, int]]:
    active_chunks: dict[int, set[int]] = {}
    for cell_index in cell_indices:
        latitude_index, longitude_index = divmod(int(cell_index), GRID_NLON)
        active_chunks.setdefault(latitude_index, set()).add(longitude_index // 6)

    declared = {
        (int(row["latitudeIndex"]), chunk)
        for row in plan["sparsePlan"]["rowRuns"]
        for start, stop in row["longitudeChunkRuns"]
        for chunk in range(int(start), int(stop))
    }
    runs = []
    for latitude_index in sorted(active_chunks):
        chunks = sorted(active_chunks[latitude_index])
        if any((latitude_index, chunk) not in declared for chunk in chunks):
            raise RuntimeError("Area weights request a spatial chunk outside the declared plan")
        start = previous = chunks[0]
        for chunk in chunks[1:]:
            if chunk != previous + 1:
                runs.append((latitude_index, start * 6, (previous + 1) * 6))
                start = chunk
            previous = chunk
        runs.append((latitude_index, start * 6, (previous + 1) * 6))
    return runs


def positions_for_run(cell_indices: np.ndarray, latitude_index: int, lon_start: int, lon_stop: int) -> tuple[np.ndarray, np.ndarray]:
    globals_in_run = latitude_index * GRID_NLON + np.arange(lon_start, lon_stop, dtype=np.int64)
    positions = np.searchsorted(cell_indices, globals_in_run)
    valid = (positions < len(cell_indices)) & (cell_indices[np.minimum(positions, len(cell_indices) - 1)] == globals_in_run)
    return np.flatnonzero(valid), positions[valid]


def aggregate_cell_means(cell_means: np.ndarray, weights: SparseWeights) -> tuple[np.ndarray, np.ndarray]:
    finite_cells = np.isfinite(cell_means)
    mapping_counts = np.diff(weights.offsets)
    repeated_means = np.repeat(cell_means, mapping_counts)
    repeated_finite = np.repeat(finite_cells, mapping_counts)
    valid_regions = weights.region_indices[repeated_finite]
    valid_areas = weights.areas[repeated_finite]
    numerators = np.bincount(
        valid_regions,
        weights=repeated_means[repeated_finite] * valid_areas,
        minlength=len(weights.region_ids),
    )
    denominators = np.bincount(valid_regions, weights=valid_areas, minlength=len(weights.region_ids))
    regional = np.divide(
        numerators,
        denominators,
        out=np.full(len(weights.region_ids), np.nan, dtype=np.float64),
        where=denominators > 0,
    )
    return regional, denominators


async def consume_direct_s3_source(
    source: dict,
    selected_start: int,
    selected_stop: int,
    runs: list[tuple[int, int, int]],
    weights: SparseWeights,
    cell_sums: np.ndarray,
    cell_counts: np.ndarray,
    year: int,
    concurrency: int,
) -> dict:
    """Read one remote OM source with bounded request concurrency.

    Each row-run writes to a disjoint set of weighted cells. Results are
    applied in declared run order after every bounded batch, preserving the
    same arithmetic and progress semantics as the synchronous reader without
    retaining a whole year's decoded values in memory.
    """
    if concurrency < 1:
        raise ValueError("Direct-read concurrency must be at least one")
    url = source["url"]
    if not url.startswith(OPENMETEO_HTTP_PREFIX):
        raise RuntimeError(f"Unsupported long-record source host: {url}")
    path = "openmeteo/" + url.removeprefix(OPENMETEO_HTTP_PREFIX)
    filesystem = direct_s3_async_filesystem()
    data = await OmFileReaderAsync.from_fsspec(filesystem, path)
    try:
        if tuple(data.shape[:2]) != (GRID_NLAT, GRID_NLON):
            raise RuntimeError(f"Unexpected ERA5-Land grid in {url}: {data.shape}")
        if selected_stop > data.shape[2]:
            raise RuntimeError(f"Requested time range exceeds {url}: {data.shape}")

        semaphore = asyncio.Semaphore(concurrency)

        async def read_run(run_number: int, run: tuple[int, int, int]):
            latitude_index, lon_start, lon_stop = run
            local_columns, cell_positions = positions_for_run(
                weights.cell_indices, latitude_index, lon_start, lon_stop
            )
            if not len(cell_positions):
                return run_number, cell_positions, np.empty((0, 0), dtype=np.float64)
            async with semaphore:
                decoded = await data.read_array((
                    slice(latitude_index, latitude_index + 1),
                    slice(lon_start, lon_stop),
                    slice(selected_start, selected_stop),
                ))
            values = np.asarray(decoded, dtype=np.float64)[0, local_columns, :]
            return run_number, cell_positions, values

        read_values = 0
        finite_values = 0
        batch_size = concurrency * DIRECT_READ_BATCH_MULTIPLIER
        numbered_runs = list(enumerate(runs, start=1))
        for batch_start in range(0, len(numbered_runs), batch_size):
            batch = numbered_runs[batch_start:batch_start + batch_size]
            results = await asyncio.gather(*[
                read_run(run_number, run) for run_number, run in batch
            ])
            for run_number, cell_positions, values in results:
                if not len(cell_positions):
                    continue
                finite = np.isfinite(values)
                read_values += values.size
                finite_values += int(finite.sum())
                cell_sums[cell_positions] += np.where(finite, values, 0.0).sum(axis=1)
                cell_counts[cell_positions] += finite.sum(axis=1).astype(np.int32)
                if run_number % 50 == 0:
                    print(
                        f"{year} {source['key']}: processed {run_number:,}/{len(runs):,} sparse row-runs",
                        flush=True,
                    )

        return {
            "readValues": read_values,
            "finiteValues": finite_values,
            "shape": list(data.shape),
            "chunks": list(data.chunks),
            "scaleFactor": float(data.scale_factor),
            "readConcurrency": concurrency,
        }
    finally:
        data.close()
        session = getattr(filesystem, "_s3", None)
        if session is not None:
            await session.__aexit__(None, None, None)


def execute_year(year: int, plan: dict, weights: SparseWeights, runs: list[tuple[int, int, int]],
                 cache_root: Path, keep_cache: bool,
                 transport: str = TRANSPORT_BLOCKCACHE_HTTP,
                 direct_read_concurrency: int = DEFAULT_DIRECT_READ_CONCURRENCY) -> tuple[list[dict], dict]:
    sources = year_sources(year, plan["inputs"]["sourceBaseUrl"])
    cell_sums = np.zeros(len(weights.cell_indices), dtype=np.float64)
    cell_counts = np.zeros(len(weights.cell_indices), dtype=np.int32)
    source_checks = []
    expected_selected_hours = 0
    year_cache = cache_root / str(year)
    year_cache.mkdir(parents=True, exist_ok=True)
    direct_filesystem = None

    try:
        for source in sources:
            metadata = object_metadata(source["url"])
            selected_start, selected_stop, selected_hours = source_selected_slice(source, year)
            expected_selected_hours += selected_hours
            if selected_hours == 0:
                continue
            source_cache = year_cache / source["key"] / transport
            source_cache.mkdir(parents=True, exist_ok=True)
            read_values = 0
            finite_values = 0
            if transport == TRANSPORT_DIRECT_S3:
                result = asyncio.run(consume_direct_s3_source(
                    source,
                    selected_start,
                    selected_stop,
                    runs,
                    weights,
                    cell_sums,
                    cell_counts,
                    year,
                    direct_read_concurrency,
                ))
                read_values = result["readValues"]
                finite_values = result["finiteValues"]
                shape = result["shape"]
                chunks = result["chunks"]
                scale_factor = result["scaleFactor"]
                read_concurrency = result["readConcurrency"]
            else:
                read_concurrency = 1
                with source_reader(source["url"], source_cache, transport, direct_filesystem) as data:
                    if tuple(data.shape[:2]) != (GRID_NLAT, GRID_NLON):
                        raise RuntimeError(f"Unexpected ERA5-Land grid in {source['url']}: {data.shape}")
                    if selected_stop > data.shape[2]:
                        raise RuntimeError(f"Requested time range exceeds {source['url']}: {data.shape}")
                    for run_number, (latitude_index, lon_start, lon_stop) in enumerate(runs, start=1):
                        local_columns, cell_positions = positions_for_run(
                            weights.cell_indices, latitude_index, lon_start, lon_stop
                        )
                        if not len(cell_positions):
                            continue
                        values = np.asarray(
                            data[
                                latitude_index:latitude_index + 1,
                                lon_start:lon_stop,
                                selected_start:selected_stop,
                            ],
                            dtype=np.float64,
                        )[0, local_columns, :]
                        finite = np.isfinite(values)
                        read_values += values.size
                        finite_values += int(finite.sum())
                        cell_sums[cell_positions] += np.where(finite, values, 0.0).sum(axis=1)
                        cell_counts[cell_positions] += finite.sum(axis=1).astype(np.int32)
                        if run_number % 50 == 0:
                            print(
                                f"{year} {source['key']}: processed {run_number:,}/{len(runs):,} sparse row-runs",
                                flush=True,
                            )
                    shape = list(data.shape)
                    chunks = list(data.chunks)
                    scale_factor = float(data.scale_factor)
            source_checks.append({
                **metadata,
                "key": source["key"],
                "transport": transport,
                "readConcurrency": read_concurrency,
                "objectStartUtc": source["objectStart"].isoformat(),
                "selectedStartIndex": selected_start,
                "selectedStopIndexExclusive": selected_stop,
                "selectedHours": selected_hours,
                "shape": shape,
                "chunks": chunks,
                "scaleFactor": scale_factor,
                "requestedCellValues": read_values,
                "finiteCellValues": finite_values,
                "finiteFraction": round(finite_values / read_values, 9),
            })

        if expected_selected_hours != EXPECTED_SUMMER_HOURS:
            raise RuntimeError(
                f"Expected {EXPECTED_SUMMER_HOURS} selected summer hours for {year}, got {expected_selected_hours}"
            )
        partial_cells = (cell_counts > 0) & (cell_counts != EXPECTED_SUMMER_HOURS)
        if np.any(partial_cells):
            examples = weights.cell_indices[partial_cells][:10].tolist()
            raise RuntimeError(f"Time-varying missing values in weighted cells for {year}: {examples}")
        cell_means = np.divide(
            cell_sums,
            cell_counts,
            out=np.full(len(cell_sums), np.nan, dtype=np.float64),
            where=cell_counts > 0,
        )
        regional, denominators = aggregate_cell_means(cell_means, weights)
        if not np.all(np.isfinite(regional)):
            missing = weights.region_ids[~np.isfinite(regional)].tolist()
            raise RuntimeError(f"Regions without finite ERA5-Land values in {year}: {missing}")
        if np.any((regional < -90) | (regional > 70)):
            raise RuntimeError(f"Implausible decoded regional temperatures for {year}")

        rows = [
            {"region_id": str(region_id), "year": year, "summer_mean_c": float(value)}
            for region_id, value in zip(weights.region_ids, regional, strict=True)
        ]
        check = {
            "year": year,
            "regions": len(rows),
            "selectedIsoWeeks": [EXPECTED_SUMMER_WEEKS[0], EXPECTED_SUMMER_WEEKS[-1]],
            "selectedHours": expected_selected_hours,
            "finiteWeightedCells": int(np.count_nonzero(cell_counts)),
            "allMissingWeightedCells": int(np.count_nonzero(cell_counts == 0)),
            "partiallyMissingWeightedCells": int(np.count_nonzero(partial_cells)),
            "regionsWithoutFiniteValues": int(np.count_nonzero(~np.isfinite(regional))),
            "minimumRegionalSummerMeanC": float(regional.min()),
            "maximumRegionalSummerMeanC": float(regional.max()),
            "minimumFiniteRegionAreaSquareMetres": float(denominators.min()),
            "sourceObjects": source_checks,
            "sourceIdentityDigest": canonical_digest([
                {key: source[key] for key in ("key", "url", "contentLength", "etag", "lastModified")}
                for source in source_checks
            ]),
            "cacheAllocatedBytesBeforeCleanup": allocated_bytes(year_cache),
        }
        return rows, check
    finally:
        # A failed ranged read can leave an incomplete or corrupt cached block.
        # Never feed that block into a retry; successful checkpoints already
        # preserve the reduced regional result and its immutable source IDs.
        if not keep_cache:
            shutil.rmtree(year_cache, ignore_errors=True)


def checkpoint_paths(year: int, root: Path) -> tuple[Path, Path]:
    return root / f"{year}.csv", root / f"{year}.json"


def write_checkpoint(year: int, rows: list[dict], check: dict, plan: dict, area_weights: dict,
                     checkpoint_root: Path) -> dict:
    csv_path, json_path = checkpoint_paths(year, checkpoint_root)
    csv_path.parent.mkdir(parents=True, exist_ok=True)
    temporary = unique_temporary_path(csv_path)
    try:
        with temporary.open("w", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=["region_id", "year", "summer_mean_c"])
            writer.writeheader()
            for row in rows:
                writer.writerow({**row, "summer_mean_c": f"{row['summer_mean_c']:.9f}"})
        os.replace(temporary, csv_path)
    finally:
        temporary.unlink(missing_ok=True)
    payload = {
        "version": VERSION,
        "status": "complete_single_year_checkpoint",
        "year": year,
        "inputs": {
            "retrievalPlanVersion": plan["version"],
            "retrievalPlanDigest": plan["digest"],
            "areaWeightsVersion": area_weights["version"],
            "areaWeightsDigest": area_weights["digest"],
        },
        "check": check,
        "output": {
            "path": str(csv_path.relative_to(ROOT)),
            "rows": len(rows),
            "bytes": csv_path.stat().st_size,
            "sha256": file_sha256(csv_path),
        },
        "decision": {"axesAdmitted": 0, "scoresChanged": 0},
    }
    payload["digest"] = canonical_digest(payload)
    atomic_text(json_path, json.dumps(payload, indent=2) + "\n")
    return payload


def load_checkpoint(year: int, plan: dict, area_weights: dict, checkpoint_root: Path) -> dict | None:
    csv_path, json_path = checkpoint_paths(year, checkpoint_root)
    if not csv_path.exists() or not json_path.exists():
        return None
    try:
        payload = json.loads(json_path.read_text())
    except (json.JSONDecodeError, OSError):
        return None
    payload_without_digest = dict(payload)
    stored_digest = payload_without_digest.pop("digest", None)
    if not stored_digest or canonical_digest(payload_without_digest) != stored_digest:
        return None
    expected_inputs = {
        "retrievalPlanVersion": plan["version"],
        "retrievalPlanDigest": plan["digest"],
        "areaWeightsVersion": area_weights["version"],
        "areaWeightsDigest": area_weights["digest"],
    }
    if payload.get("version") != VERSION or payload.get("status") != "complete_single_year_checkpoint":
        return None
    if payload.get("inputs") != expected_inputs:
        return None
    output = payload.get("output", {})
    expected_path = str(csv_path.relative_to(ROOT))
    if payload.get("year") != year or output.get("rows") != 971 or output.get("path") != expected_path:
        return None
    if output.get("bytes") != csv_path.stat().st_size or output.get("sha256") != file_sha256(csv_path):
        return None
    check = payload.get("check", {})
    expected_cells = area_weights.get("weightsOutput", {}).get("arrays", {}).get("cellIndices")
    if (
        check.get("year") != year
        or check.get("regions") != 971
        or check.get("selectedHours") != EXPECTED_SUMMER_HOURS
        or check.get("partiallyMissingWeightedCells") != 0
        or check.get("regionsWithoutFiniteValues") != 0
        or not isinstance(check.get("finiteWeightedCells"), int)
        or not isinstance(check.get("allMissingWeightedCells"), int)
        or (
            expected_cells is not None
            and check["finiteWeightedCells"] + check["allMissingWeightedCells"] != expected_cells
        )
    ):
        return None
    minimum = check.get("minimumRegionalSummerMeanC")
    maximum = check.get("maximumRegionalSummerMeanC")
    if not all(isinstance(value, (int, float)) and math.isfinite(value) for value in (minimum, maximum)):
        return None
    if not (-90 < minimum < maximum < 70):
        return None
    source_objects = check.get("sourceObjects")
    if not isinstance(source_objects, list) or not source_objects:
        return None
    if any(not source.get("etag") or not isinstance(source.get("contentLength"), int) or source["contentLength"] <= 0 for source in source_objects):
        return None
    if payload.get("decision") != {"axesAdmitted": 0, "scoresChanged": 0}:
        return None
    return payload


def combine_checkpoints(years: Iterable[int], checkpoint_root: Path, output_path: Path) -> tuple[int, str]:
    records = []
    for year in sorted(years):
        csv_path, _ = checkpoint_paths(year, checkpoint_root)
        with csv_path.open(newline="") as handle:
            year_rows = list(csv.DictReader(handle))
        if len(year_rows) != 971:
            raise RuntimeError(f"Checkpoint {year} has {len(year_rows)} rows")
        records.extend(year_rows)
    temporary = unique_temporary_path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        with temporary.open("w", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=["region_id", "year", "summer_mean_c"])
            writer.writeheader()
            writer.writerows(records)
        os.replace(temporary, output_path)
    finally:
        temporary.unlink(missing_ok=True)
    return len(records), file_sha256(output_path)


def write_manifest(plan: dict, area_weights: dict, requested_years: list[int], checkpoints: list[dict],
                   combined_path: Path) -> dict:
    completed_years = sorted(checkpoint["year"] for checkpoint in checkpoints)
    complete = completed_years == list(range(1950, 2023))
    combined_rows, combined_sha256 = combine_checkpoints(completed_years, CHECKPOINT_ROOT, combined_path)
    source_objects = sum((checkpoint["check"]["sourceObjects"] for checkpoint in checkpoints), [])
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": (
            "complete_all_70883_region_year_summer_means_execution_validation_pending"
            if complete else "partial_resumable_long_record_retrieval"
        ),
        "productionRatingsEnabled": 0,
        "purpose": "Execute the predeclared sparse 1950–2022 ERA5-Land read and persist annual regional summer means without admitting a TULIP axis or score.",
        "inputs": {
            "retrievalPlanVersion": plan["version"],
            "retrievalPlanDigest": plan["digest"],
            "areaWeightsVersion": area_weights["version"],
            "areaWeightsDigest": area_weights["digest"],
            "selectedConfiguration": plan["inputs"]["selectedConfiguration"],
        },
        "execution": {
            "requestedYears": requested_years,
            "completedYears": completed_years,
            "completedYearCount": len(completed_years),
            "remainingYears": [year for year in range(1950, 2023) if year not in completed_years],
            "regionsPerYear": 971,
            "regionYearRows": combined_rows,
            "expectedRegionYearRows": 70_883,
            "summerIsoWeeks": [EXPECTED_SUMMER_WEEKS[0], EXPECTED_SUMMER_WEEKS[-1]],
            "hoursPerRegionYear": EXPECTED_SUMMER_HOURS,
            "sourceObjectCount": len(source_objects),
            "sourceIdentityDigest": canonical_digest([
                {key: source[key] for key in ("key", "url", "contentLength", "etag", "lastModified")}
                for source in source_objects
            ]),
            "cacheAllocatedBytesObserved": sum(
                checkpoint["check"]["cacheAllocatedBytesBeforeCleanup"] for checkpoint in checkpoints
            ),
        },
        "output": {
            "path": str(combined_path.relative_to(ROOT)),
            "rows": combined_rows,
            "sha256": combined_sha256,
            "yearCheckpointDirectory": str(CHECKPOINT_ROOT.relative_to(ROOT)),
        },
        "yearChecks": [checkpoint["check"] for checkpoint in checkpoints],
        "decision": {
            "status": "temperature_ingestion_complete_validation_pending" if complete else "ingestion_in_progress",
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": (
                "Verify all 70,883 region-year means, fit and split-period challenge the regional pattern, and compare it with an independent model or author output."
                if complete else "Resume the remaining annual ERA5-Land checkpoints; partial coverage cannot enter a TULIP axis or score."
            ),
        },
    }
    payload["digest"] = canonical_digest(payload)
    atomic_text(OUTPUT_PATH, json.dumps(payload, indent=2) + "\n")
    atomic_text(
        REPORT_PATH,
        "# European mortality-panel long-record ERA5-Land retrieval\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"Completed {len(completed_years)} of 73 summers and {combined_rows:,} of 70,883 region-year means. "
        "Each completed year is an atomic checkpoint, so interrupted runs resume without repeating finished summers. "
        "The reader keeps only regional annual means and deletes successful per-year caches.\n\n"
        "This ingestion changes zero TULIP axes and zero scores. Partial coverage cannot enter the scoring model.\n",
    )
    return payload


def parse_years(args: argparse.Namespace) -> list[int]:
    if args.year:
        years = sorted(set(args.year))
    else:
        years = list(range(args.start_year, args.end_year + 1))
    if any(year < 1950 or year > 2022 for year in years):
        raise SystemExit("Years must fall between 1950 and 2022")
    if args.max_new_years is not None:
        years = years[:args.max_new_years]
    return years


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, action="append", help="Specific year; may be repeated")
    parser.add_argument("--start-year", type=int, default=1950)
    parser.add_argument("--end-year", type=int, default=2022)
    parser.add_argument("--max-new-years", type=int)
    parser.add_argument("--cache-root", type=Path, default=CACHE_ROOT)
    parser.add_argument("--keep-cache", action="store_true")
    parser.add_argument(
        "--transport",
        choices=[TRANSPORT_BLOCKCACHE_HTTP, TRANSPORT_DIRECT_S3, TRANSPORT_BLOCKCACHE_S3],
        default=TRANSPORT_BLOCKCACHE_HTTP,
        help="Byte-range reader. HTTP block caching is primary; direct and cached S3 remain fallbacks.",
    )
    parser.add_argument(
        "--direct-read-concurrency",
        type=int,
        default=DEFAULT_DIRECT_READ_CONCURRENCY,
        help="Maximum concurrent OM range reads inside one direct-S3 year worker.",
    )
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    if args.direct_read_concurrency < 1:
        raise SystemExit("--direct-read-concurrency must be at least one")

    plan = json.loads(PLAN_PATH.read_text())
    area_weights = json.loads(AREA_WEIGHTS_PATH.read_text())
    if area_weights["inputs"]["retrievalPlanDigest"] != plan["digest"]:
        raise RuntimeError("Area weights do not match the retrieval plan")
    weights = load_weights(area_weights)
    runs = weighted_row_runs(plan, weights.cell_indices)
    requested_years = parse_years(args)
    if args.dry_run:
        print(json.dumps({
            "version": VERSION,
            "requestedYears": requested_years,
            "regions": len(weights.region_ids),
            "weightedCells": len(weights.cell_indices),
            "rowRuns": len(runs),
            "hoursPerYear": EXPECTED_SUMMER_HOURS,
            "directReadConcurrency": args.direct_read_concurrency,
            "noNetworkReadsPerformed": True,
        }, indent=2))
        return

    CHECKPOINT_ROOT.mkdir(parents=True, exist_ok=True)
    for year in requested_years:
        existing = None if args.force else load_checkpoint(year, plan, area_weights, CHECKPOINT_ROOT)
        if existing:
            print(f"{year}: verified existing checkpoint", flush=True)
            continue
        print(f"{year}: reading ERA5-Land", flush=True)
        rows, check = execute_year(
            year,
            plan,
            weights,
            runs,
            args.cache_root,
            args.keep_cache,
            args.transport,
            args.direct_read_concurrency,
        )
        checkpoint = write_checkpoint(year, rows, check, plan, area_weights, CHECKPOINT_ROOT)
        print(
            f"{year}: wrote {checkpoint['output']['rows']} regions; "
            f"{check['finiteWeightedCells']} finite cells; "
            f"cache footprint {check['cacheAllocatedBytesBeforeCleanup']:,} bytes",
            flush=True,
        )

    with manifest_lock():
        completed = []
        for year in range(1950, 2023):
            checkpoint = load_checkpoint(year, plan, area_weights, CHECKPOINT_ROOT)
            if checkpoint:
                completed.append(checkpoint)
        payload = write_manifest(plan, area_weights, requested_years, completed, COMBINED_CSV_PATH)
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "status": payload["status"],
        "completedYears": payload["execution"]["completedYearCount"],
        "regionYearRows": payload["execution"]["regionYearRows"],
        "remainingYears": len(payload["execution"]["remainingYears"]),
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
