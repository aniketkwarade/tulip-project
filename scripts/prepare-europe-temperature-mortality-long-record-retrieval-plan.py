#!/usr/bin/env python3
"""Plan sparse ERA5-Land reads for the 971-region 1950–2022 pattern.

This script is network-free. It converts the fixed regional polygons into the
native Open-Meteo OM spatial chunk keys that must be read for the predeclared
summer window. The output prevents a global bounding-box read caused by
overseas territories and records the expected transfer range before execution.
"""

from __future__ import annotations

import hashlib
import json
import math
from collections import Counter, defaultdict
from pathlib import Path

import geopandas as gpd
from shapely.geometry import GeometryCollection, MultiPolygon, Polygon


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
CROSSWALK_PATH = CALIBRATION_DIR / "europe-temperature-mortality-regional-boundary-crosswalk.json"
VALIDATION_PATH = CALIBRATION_DIR / "internal-europe-heat-openmeteo-era5land-crosscheck.json"
OUTPUT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-retrieval-plan.json"
REPORT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-retrieval-plan-report.md"

GRID_LAT_MIN = -90.0
GRID_LON_MIN = -180.0
GRID_SPACING = 0.1
GRID_NLAT = 1801
GRID_NLON = 3600
LON_CELLS_PER_CHUNK = 6
HOURS_PER_TIME_CHUNK = 21 * 24
SUMMER_START = (5, 25)
SUMMER_STOP_EXCLUSIVE = (9, 8)
YEARS = tuple(range(1950, 2023))


def canonical_digest(value: object) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def polygon_parts(geometry):
    if isinstance(geometry, Polygon):
        yield geometry
    elif isinstance(geometry, MultiPolygon):
        yield from geometry.geoms
    elif isinstance(geometry, GeometryCollection):
        for part in geometry.geoms:
            yield from polygon_parts(part)
    else:
        raise RuntimeError(f"Unsupported geometry type: {geometry.geom_type}")


def clamped_index(value: float, origin: float, size: int) -> int:
    return max(0, min(size - 1, value))


def component_spatial_chunks(component) -> tuple[range, range]:
    minx, miny, maxx, maxy = component.bounds
    half = GRID_SPACING / 2
    lat_first = clamped_index(math.ceil((miny - half - GRID_LAT_MIN) / GRID_SPACING), 0, GRID_NLAT)
    lat_last = clamped_index(math.floor((maxy + half - GRID_LAT_MIN) / GRID_SPACING), 0, GRID_NLAT)
    lon_first = clamped_index(math.ceil((minx - half - GRID_LON_MIN) / GRID_SPACING), 0, GRID_NLON)
    lon_last = clamped_index(math.floor((maxx + half - GRID_LON_MIN) / GRID_SPACING), 0, GRID_NLON)
    return range(lat_first, lat_last + 1), range(lon_first // LON_CELLS_PER_CHUNK, lon_last // LON_CELLS_PER_CHUNK + 1)


def contiguous_runs(values: set[int]) -> list[list[int]]:
    if not values:
        return []
    ordered = sorted(values)
    runs = []
    start = previous = ordered[0]
    for value in ordered[1:]:
        if value == previous + 1:
            previous = value
            continue
        runs.append([start, previous + 1])
        start = previous = value
    runs.append([start, previous + 1])
    return runs


def summer_time_chunks(year: int) -> int:
    import pandas as pd

    start = pd.Timestamp(year=year, month=SUMMER_START[0], day=SUMMER_START[1])
    stop = pd.Timestamp(year=year, month=SUMMER_STOP_EXCLUSIVE[0], day=SUMMER_STOP_EXCLUSIVE[1])
    year_start = pd.Timestamp(year=year, month=1, day=1)
    first = int((start - year_start) / pd.Timedelta(hours=1)) // HOURS_PER_TIME_CHUNK
    last = int(((stop - pd.Timedelta(hours=1)) - year_start) / pd.Timedelta(hours=1)) // HOURS_PER_TIME_CHUNK
    return last - first + 1


def human_bytes(value: int) -> str:
    units = ("B", "KiB", "MiB", "GiB", "TiB")
    current = float(value)
    for unit in units:
        if current < 1024 or unit == units[-1]:
            return f"{current:.2f} {unit}"
        current /= 1024
    raise AssertionError("unreachable")


def main() -> None:
    crosswalk = json.loads(CROSSWALK_PATH.read_text())
    validation = json.loads(VALIDATION_PATH.read_text())
    if crosswalk["coverage"]["resolvedRegions"] != 971:
        raise RuntimeError("Regional crosswalk is incomplete")
    if validation["method"]["selectedConfiguration"] != "area_intersection_utcplus0000":
        raise RuntimeError("Validated spatial and timezone configuration changed")

    geometry_path = ROOT / crosswalk["geometryOutput"]["path"]
    regions = gpd.read_file(geometry_path).to_crs("EPSG:4326")
    if len(regions) != 971 or regions["regionId"].nunique() != 971:
        raise RuntimeError("Expected 971 unique crosswalk geometries")

    chunks_by_lat: dict[int, set[int]] = defaultdict(set)
    region_chunk_counts = {}
    component_count = 0
    for row in regions.itertuples():
        region_chunks = set()
        for component in polygon_parts(row.geometry):
            component_count += 1
            latitudes, longitude_chunks = component_spatial_chunks(component)
            for latitude in latitudes:
                for longitude_chunk in longitude_chunks:
                    key = (latitude, longitude_chunk)
                    region_chunks.add(key)
                    chunks_by_lat[latitude].add(longitude_chunk)
        region_chunk_counts[row.regionId] = len(region_chunks)

    row_runs = []
    spatial_chunk_keys = 0
    run_count = 0
    for latitude in sorted(chunks_by_lat):
        runs = contiguous_runs(chunks_by_lat[latitude])
        row_runs.append({"latitudeIndex": latitude, "longitudeChunkRuns": runs})
        spatial_chunk_keys += sum(stop - start for start, stop in runs)
        run_count += len(runs)

    time_chunks_by_year = {str(year): summer_time_chunks(year) for year in YEARS}
    total_time_chunks = sum(time_chunks_by_year.values())
    total_range_chunks = spatial_chunk_keys * total_time_chunks
    lower_bytes = total_range_chunks * 1024
    upper_bytes = total_range_chunks * 4096

    full_bounds = regions.total_bounds.tolist()
    full_lat_cells = math.ceil((full_bounds[3] - full_bounds[1]) / GRID_SPACING) + 3
    full_lon_cells = math.ceil((full_bounds[2] - full_bounds[0]) / GRID_SPACING) + 3
    full_bbox_spatial_chunks = full_lat_cells * math.ceil(full_lon_cells / LON_CELLS_PER_CHUNK)
    avoided_spatial_chunks = full_bbox_spatial_chunks - spatial_chunk_keys
    region_chunk_values = list(region_chunk_counts.values())
    payload = {
        "version": "tulip_europe_temperature_mortality_long_record_retrieval_plan_2026_09_26_v1",
        "preparedOn": "2026-09-26",
        "status": "complete_sparse_long_record_read_plan_execution_pending",
        "productionRatingsEnabled": 0,
        "purpose": "Predeclare sparse Open-Meteo ERA5-Land range reads for the 971-region 1950–2022 summer temperature pattern before transferring the multi-year data.",
        "inputs": {
            "regionalBoundaryCrosswalkVersion": crosswalk["version"],
            "regionalBoundaryCrosswalkDigest": crosswalk["digest"],
            "geometrySha256": crosswalk["geometryOutput"]["sha256"],
            "validationVersion": validation["version"],
            "validationDigest": validation["digest"],
            "selectedConfiguration": validation["method"]["selectedConfiguration"],
            "sourceBaseUrl": validation["source"]["baseUrl"],
            "sourceDocumentation": validation["source"]["documentation"],
            "formatDocumentation": validation["source"]["formatDocumentation"],
        },
        "grid": {
            "latitudeMinimum": GRID_LAT_MIN,
            "longitudeMinimum": GRID_LON_MIN,
            "spacingDegrees": GRID_SPACING,
            "shape": [GRID_NLAT, GRID_NLON],
            "chunks": [1, LON_CELLS_PER_CHUNK, HOURS_PER_TIME_CHUNK],
        },
        "scope": {
            "regions": len(regions),
            "polygonComponents": component_count,
            "years": [YEARS[0], YEARS[-1]],
            "yearCount": len(YEARS),
            "summerReadWindow": {"start": "May 25", "stopExclusive": "September 8"},
            "spatialMethod": "area intersection",
            "timezone": "UTC+00:00",
        },
        "sparsePlan": {
            "activeLatitudeRows": len(chunks_by_lat),
            "longitudeRunCount": run_count,
            "spatialChunkKeys": spatial_chunk_keys,
            "timeChunksByYear": time_chunks_by_year,
            "totalTimeChunks": total_time_chunks,
            "totalRangeChunks": total_range_chunks,
            "estimatedTransferBytes": {
                "lowerAtOneKiBPerChunk": lower_bytes,
                "upperAtFourKiBPerChunk": upper_bytes,
                "lowerHuman": human_bytes(lower_bytes),
                "upperHuman": human_bytes(upper_bytes),
                "basis": "Open-Meteo documents typical compressed OM chunks as 1–4 KiB. This is a planning range, not a measured transfer total.",
            },
            "fullBoundingBox": {
                "bounds": full_bounds,
                "spatialChunkKeys": full_bbox_spatial_chunks,
                "avoidedSpatialChunkKeys": avoided_spatial_chunks,
                "avoidedFraction": round(avoided_spatial_chunks / full_bbox_spatial_chunks, 9),
            },
            "regionSpatialChunkCounts": {
                "minimum": min(region_chunk_values),
                "median": sorted(region_chunk_values)[len(region_chunk_values) // 2],
                "maximum": max(region_chunk_values),
            },
            "rowRuns": row_runs,
        },
        "executionRules": [
            "Read only the predeclared sparse latitude-row and longitude-chunk runs; never expand to the panel-wide bounding box.",
            "Use the validated area-intersection UTC+00:00 configuration for every region and year.",
            "Checksum or record the ETag, content length and last-modified value of every remote OM object before using its values.",
            "Treat missing hours, regions or years as a failed run; never fill them with zero or silently interpolate them.",
            "Persist annual regional summer means so the expensive range read does not need to be repeated for each source history.",
        ],
        "decision": {
            "status": "retrieval_plan_admitted_execution_not_yet_run",
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Execute the sparse 1950–2022 ERA5-Land read, verify all 70,883 region-year summer means, fit and split-period challenge the regional pattern, then compare it with an independent model or author output before endpoint use.",
        },
    }
    payload["digest"] = canonical_digest({
        "inputs": payload["inputs"],
        "grid": payload["grid"],
        "scope": payload["scope"],
        "sparsePlan": payload["sparsePlan"],
        "executionRules": payload["executionRules"],
        "decision": payload["decision"],
    })
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    REPORT_PATH.write_text(
        "# European mortality-panel long-record retrieval plan\n\n"
        "Status: **sparse 1950–2022 ERA5-Land read plan complete; execution pending**.\n\n"
        f"The 971-region geometry contains {component_count:,} polygon components, including overseas territories. A single bounding box would require {full_bbox_spatial_chunks:,} spatial OM chunk keys per time chunk. "
        f"The component-aware plan needs {spatial_chunk_keys:,}, avoiding {payload['sparsePlan']['fullBoundingBox']['avoidedFraction']:.1%} of those spatial reads.\n\n"
        f"Across 73 summers, the plan contains {total_range_chunks:,} compressed range chunks. Using Open-Meteo's documented typical 1–4 KiB chunk size gives a planning transfer range of {human_bytes(lower_bytes)} to {human_bytes(upper_bytes)}. "
        "The measured total will be recorded during execution.\n\n"
        "This artifact changes zero TULIP axes and zero scores. The next gate is execution, exact 70,883 region-year coverage, split-period stability testing and comparison with an independent pattern.\n"
    )
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "status": payload["status"],
        "spatialChunkKeys": spatial_chunk_keys,
        "totalRangeChunks": total_range_chunks,
        "estimatedTransfer": payload["sparsePlan"]["estimatedTransferBytes"],
        "avoidedFraction": payload["sparsePlan"]["fullBoundingBox"]["avoidedFraction"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
