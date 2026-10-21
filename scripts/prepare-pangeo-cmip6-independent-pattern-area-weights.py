#!/usr/bin/env python3
"""Build exact 971-region polygon weights for admitted CMIP6 grids."""

from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path

import geopandas as gpd
import numpy as np
from shapely.geometry import box


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
GRID_INVENTORY_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-grid-inventory.json"
CROSSWALK_PATH = CALIBRATION_DIR / "europe-temperature-mortality-regional-boundary-crosswalk.json"
OUTPUT_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-area-weights.json"
REPORT_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-area-weights-report.md"
WEIGHTS_ROOT = ROOT / "tmp/tulip-independent-pattern/cmip6-regional-area-weights"
VERSION = "tulip_pangeo_cmip6_independent_pattern_area_weights_2026_09_26_v1"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def normalized_longitude(value: float) -> float:
    return (value + 180.0) % 360.0 - 180.0


def longitude_cell(center: float, bounds: np.ndarray) -> tuple[float, float]:
    center_normalized = normalized_longitude(float(center))
    offsets = [normalized_longitude(float(bound) - float(center)) for bound in bounds]
    low = center_normalized + min(offsets)
    high = center_normalized + max(offsets)
    if not 0 < high - low <= 180:
        raise RuntimeError(f"Invalid longitude cell around {center}: {bounds.tolist()}")
    return low, high


def candidate_cells(geometry: dict, region_bounds: tuple[float, float, float, float]) -> gpd.GeoDataFrame:
    path = ROOT / geometry["path"]
    with np.load(path) as arrays:
        lat = arrays["lat"].copy()
        lon = arrays["lon"].copy()
        lat_bounds = arrays["lat_bounds"].copy()
        lon_bounds = arrays["lon_bounds"].copy()
    minx, miny, maxx, maxy = region_bounds
    records = []
    nlon = len(lon)
    for latitude_index, bounds in enumerate(lat_bounds):
        low_lat = float(min(bounds))
        high_lat = float(max(bounds))
        if high_lat < miny or low_lat > maxy:
            continue
        for longitude_index, longitude in enumerate(lon):
            low_lon, high_lon = longitude_cell(float(longitude), lon_bounds[longitude_index])
            if high_lon < minx or low_lon > maxx:
                continue
            records.append({
                "cellIndex": latitude_index * nlon + longitude_index,
                "latitudeIndex": latitude_index,
                "longitudeIndex": longitude_index,
                "geometry": box(low_lon, low_lat, high_lon, high_lat),
            })
    if not records:
        raise RuntimeError(f"Grid {geometry['digest']} has no cells near the response regions")
    return gpd.GeoDataFrame(records, geometry="geometry", crs="EPSG:4326")


def unique_temporary_path(path: Path) -> Path:
    return path.with_name(f".{path.name}.{os.getpid()}.tmp.npz")


def build_grid_weights(geometry: dict, regions: gpd.GeoDataFrame) -> dict:
    cells = candidate_cells(geometry, tuple(float(value) for value in regions.total_bounds))
    intersections = gpd.overlay(
        cells[["cellIndex", "latitudeIndex", "longitudeIndex", "geometry"]],
        regions[["regionIndex", "regionId", "geometry"]],
        how="intersection",
        keep_geom_type=False,
    )
    intersections = intersections[~intersections.geometry.is_empty].copy()
    intersections = intersections[intersections.geometry.geom_type.isin(["Polygon", "MultiPolygon"])].copy()
    intersections["areaSquareMetres"] = intersections.to_crs("EPSG:6933").geometry.area
    intersections = intersections[intersections["areaSquareMetres"] > 0]
    grouped = (
        intersections.groupby(["cellIndex", "regionIndex"], as_index=False)["areaSquareMetres"]
        .sum()
        .sort_values(["cellIndex", "regionIndex"])
        .reset_index(drop=True)
    )
    region_coverage = grouped.groupby("regionIndex").agg(
        cells=("cellIndex", "nunique"),
        areaSquareMetres=("areaSquareMetres", "sum"),
    )
    missing = sorted(set(regions["regionIndex"]) - set(region_coverage.index))
    if missing:
        raise RuntimeError(f"Grid {geometry['digest']} leaves regions without weights: {missing[:20]}")
    unique_cells = grouped["cellIndex"].drop_duplicates().to_numpy(dtype=np.int64)
    counts = grouped.groupby("cellIndex", sort=True).size().to_numpy(dtype=np.int64)
    offsets = np.concatenate((np.array([0], dtype=np.int64), np.cumsum(counts, dtype=np.int64)))
    region_indices = grouped["regionIndex"].to_numpy(dtype=np.int32)
    areas = grouped["areaSquareMetres"].to_numpy(dtype=np.float64)
    region_ids = regions["regionId"].astype(str).to_numpy(dtype="U16")
    logical = hashlib.sha256(b"".join([
        geometry["digest"].encode(),
        unique_cells.tobytes(),
        offsets.tobytes(),
        region_indices.tobytes(),
        areas.tobytes(),
        "\n".join(region_ids.tolist()).encode(),
    ])).hexdigest()
    output = WEIGHTS_ROOT / f"{geometry['digest']}.npz"
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = unique_temporary_path(output)
    try:
        np.savez_compressed(
            temporary,
            cell_indices=unique_cells,
            offsets=offsets,
            region_indices=region_indices,
            areas_square_metres=areas,
            region_ids=region_ids,
        )
        os.replace(temporary, output)
    finally:
        temporary.unlink(missing_ok=True)
    cell_counts = region_coverage["cells"].astype(int)
    return {
        "gridGeometryDigest": geometry["digest"],
        "gridShape": geometry["shape"],
        "candidateGridCells": len(cells),
        "weightedGridCells": len(unique_cells),
        "cellRegionIntersections": len(grouped),
        "regions": len(regions),
        "regionsWithoutWeights": len(missing),
        "regionCellCounts": {
            "minimum": int(cell_counts.min()),
            "median": int(cell_counts.median()),
            "maximum": int(cell_counts.max()),
        },
        "totalIntersectionAreaSquareMetres": float(areas.sum()),
        "output": {
            "path": str(output.relative_to(ROOT)),
            "bytes": output.stat().st_size,
            "sha256": file_sha256(output),
            "logicalSha256": logical,
            "arrays": {
                "cellIndices": len(unique_cells),
                "offsets": len(offsets),
                "regionIndices": len(region_indices),
                "areasSquareMetres": len(areas),
                "regionIds": len(region_ids),
            },
        },
    }


def build() -> dict:
    inventory = json.loads(GRID_INVENTORY_PATH.read_text())
    inventory_without_digest = dict(inventory)
    inventory_digest = inventory_without_digest.pop("digest")
    if canonical_digest(inventory_without_digest) != inventory_digest:
        raise RuntimeError("Grid inventory digest changed")
    crosswalk = json.loads(CROSSWALK_PATH.read_text())
    regions = gpd.read_file(ROOT / crosswalk["geometryOutput"]["path"]).to_crs("EPSG:4326")
    regions = regions.sort_values("regionId").reset_index(drop=True)
    regions["regionIndex"] = np.arange(len(regions), dtype=np.int32)
    if len(regions) != 971 or regions["regionId"].duplicated().any():
        raise RuntimeError("Regional boundary universe is not 971 unique identifiers")
    weights = []
    for index, geometry in enumerate(inventory["geometries"], start=1):
        print(f"grid {index}/{len(inventory['geometries'])} {geometry['shape']}: building exact polygon weights", flush=True)
        weights.append(build_grid_weights(geometry, regions))
    weights.sort(key=lambda row: row["gridGeometryDigest"])
    weight_by_grid = {row["gridGeometryDigest"]: row for row in weights}
    records = []
    for record in inventory["records"]:
        if record["status"] != "exact_grid_geometry_ready":
            records.append({
                "canonicalModel": record["canonicalModel"],
                "member": record["member"],
                "status": "regional_weights_unavailable",
                "reason": record["status"],
            })
            continue
        weights_record = weight_by_grid[record["gridGeometryDigest"]]
        records.append({
            "canonicalModel": record["canonicalModel"],
            "member": record["member"],
            "status": "exact_971_region_area_weights_ready",
            "gridGeometryDigest": record["gridGeometryDigest"],
            "weightsLogicalSha256": weights_record["output"]["logicalSha256"],
        })
    ready = [row for row in records if row["status"] == "exact_971_region_area_weights_ready"]
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "all_admitted_grid_area_weights_complete",
        "productionRatingsEnabled": 0,
        "purpose": "Precompute exact cell-to-region intersection areas for every admitted monthly CMIP6 grid and all 971 fixed mortality-panel regions.",
        "inputs": {
            "gridInventory": str(GRID_INVENTORY_PATH.relative_to(ROOT)),
            "gridInventoryDigest": inventory["digest"],
            "regionalBoundaryCrosswalk": str(CROSSWALK_PATH.relative_to(ROOT)),
            "regionalBoundaryCrosswalkDigest": crosswalk["digest"],
            "geometrySha256": crosswalk["geometryOutput"]["sha256"],
        },
        "method": {
            "cellGeometry": "Use the checksum-pinned published coordinate bounds for each admitted grid; unwrap longitude bounds around each published cell centre.",
            "intersection": "Exact polygon intersection with the same 971 fixed official GISCO region geometries used by ERA5-Land.",
            "area": "Intersection geometry area in EPSG:6933 global equal-area projection.",
            "normalization": "At each time step, normalize only over finite intersecting cell area within each region.",
        },
        "counts": {
            "identitiesExpected": len(records),
            "modelWeightsReady": len(ready),
            "modelWeightsUnavailable": len(records) - len(ready),
            "uniqueGridWeightSets": len(weights),
            "regionsPerWeightSet": len(regions),
            "regionsWithoutWeights": sum(row["regionsWithoutWeights"] for row in weights),
        },
        "weights": weights,
        "records": sorted(records, key=lambda row: (row["canonicalModel"], row["member"])),
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Read monthly historical and SSP2-4.5 temperature for the 22 admitted model routes, calculate the two predeclared seasonal definitions and fit the same full and split-period regressions.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write(payload: dict) -> None:
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    counts = payload["counts"]
    REPORT_PATH.write_text(
        "# Pangeo CMIP6 independent-pattern regional area weights\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"All {counts['uniqueGridWeightSets']} admitted published grids have exact polygon-intersection weights for every one of the {counts['regionsPerWeightSet']} fixed mortality-panel regions. "
        f"The weights support {counts['modelWeightsReady']} model votes; {counts['modelWeightsUnavailable']} retain their earlier route or geometry exclusion.\n\n"
        "These are temperature-aggregation inputs only. They change zero TULIP axes and zero scores.\n"
    )


def main() -> None:
    payload = build()
    write(payload)
    print(json.dumps({"output": str(OUTPUT_PATH.relative_to(ROOT)), "status": payload["status"], "counts": payload["counts"], "digest": payload["digest"]}, indent=2))


if __name__ == "__main__":
    main()
