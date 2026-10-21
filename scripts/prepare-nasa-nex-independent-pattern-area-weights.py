#!/usr/bin/env python3
"""Build exact NASA NEX 0.25-degree weights for the 971 fixed regions."""

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
INVENTORY_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-inventory.json"
PROBE_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-source-probe.json"
CROSSWALK_PATH = CALIBRATION_DIR / "europe-temperature-mortality-regional-boundary-crosswalk.json"
OUTPUT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-area-weights.json"
REPORT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-area-weights-report.md"
WEIGHTS_PATH = ROOT / "tmp/tulip-independent-pattern/nasa-nex-regional-area-weights.npz"
VERSION = "tulip_nasa_nex_gddp_cmip6_independent_pattern_area_weights_2026_09_26_v1"

LATITUDE_COUNT = 600
LONGITUDE_COUNT = 1440
SPACING_DEGREES = 0.25
LATITUDE_FIRST_CENTER = -59.875
LONGITUDE_FIRST_CENTER = 0.125


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def verified_json(path: Path) -> dict:
    payload = json.loads(path.read_text())
    content = dict(payload)
    digest = content.pop("digest")
    if canonical_digest(content) != digest:
        raise RuntimeError(f"Digest changed for {path.relative_to(ROOT)}")
    return payload


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def candidate_cells(region_bounds: tuple[float, float, float, float]) -> gpd.GeoDataFrame:
    minx, miny, maxx, maxy = region_bounds
    records = []
    half = SPACING_DEGREES / 2
    # Iterate in the familiar -180..180 longitude frame while retaining the
    # source file's 0..360 column index in cellIndex.
    normalized_longitude_centers = -179.875 + SPACING_DEGREES * np.arange(LONGITUDE_COUNT)
    latitude_centers = LATITUDE_FIRST_CENTER + SPACING_DEGREES * np.arange(LATITUDE_COUNT)
    for latitude_index, latitude in enumerate(latitude_centers):
        low_latitude = float(latitude - half)
        high_latitude = float(latitude + half)
        if high_latitude < miny or low_latitude > maxy:
            continue
        for normalized_index, longitude in enumerate(normalized_longitude_centers):
            low_longitude = float(longitude - half)
            high_longitude = float(longitude + half)
            if high_longitude < minx or low_longitude > maxx:
                continue
            source_longitude_index = (normalized_index + LONGITUDE_COUNT // 2) % LONGITUDE_COUNT
            records.append({
                "cellIndex": latitude_index * LONGITUDE_COUNT + source_longitude_index,
                "latitudeIndex": latitude_index,
                "longitudeIndex": source_longitude_index,
                "geometry": box(low_longitude, low_latitude, high_longitude, high_latitude),
            })
    if not records:
        raise RuntimeError("NASA NEX grid has no cells near the fixed response regions")
    return gpd.GeoDataFrame(records, geometry="geometry", crs="EPSG:4326")


def build() -> dict:
    inventory = verified_json(INVENTORY_PATH)
    probe = verified_json(PROBE_PATH)
    crosswalk = json.loads(CROSSWALK_PATH.read_text())
    if probe["probe"]["temperatureShape"][0] != 98:
        raise RuntimeError("NASA source probe no longer provides the exact 98-day window")
    if probe["metadataReview"]["status"] != "resolved_as_daily_midpoint_with_metadata_defect_recorded":
        raise RuntimeError("NASA daily-temperature identity is unresolved")
    if inventory["counts"]["independentModelVotes"] != 32:
        raise RuntimeError("NASA inventory no longer contains the frozen 32 model votes")

    regions = gpd.read_file(ROOT / crosswalk["geometryOutput"]["path"]).to_crs("EPSG:4326")
    regions = regions.sort_values("regionId").reset_index(drop=True)
    regions["regionIndex"] = np.arange(len(regions), dtype=np.int32)
    if len(regions) != 971 or regions["regionId"].duplicated().any():
        raise RuntimeError("Regional boundary universe is not 971 unique identifiers")

    cells = candidate_cells(tuple(float(value) for value in regions.total_bounds))
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
    coverage = grouped.groupby("regionIndex").agg(
        cells=("cellIndex", "nunique"),
        areaSquareMetres=("areaSquareMetres", "sum"),
    )
    missing = sorted(set(regions["regionIndex"]) - set(coverage.index))
    if missing:
        raise RuntimeError(f"NASA grid leaves response regions without weights: {missing[:20]}")

    cell_indices = grouped["cellIndex"].drop_duplicates().to_numpy(dtype=np.int64)
    counts = grouped.groupby("cellIndex", sort=True).size().to_numpy(dtype=np.int64)
    offsets = np.concatenate((np.array([0], dtype=np.int64), np.cumsum(counts, dtype=np.int64)))
    region_indices = grouped["regionIndex"].to_numpy(dtype=np.int32)
    areas = grouped["areaSquareMetres"].to_numpy(dtype=np.float64)
    region_ids = regions["regionId"].astype(str).to_numpy(dtype="U16")
    logical_sha256 = hashlib.sha256(b"".join([
        cell_indices.tobytes(),
        offsets.tobytes(),
        region_indices.tobytes(),
        areas.tobytes(),
        "\n".join(region_ids.tolist()).encode(),
    ])).hexdigest()

    WEIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    temporary = WEIGHTS_PATH.with_name(f".{WEIGHTS_PATH.name}.{os.getpid()}.tmp.npz")
    try:
        np.savez_compressed(
            temporary,
            cell_indices=cell_indices,
            offsets=offsets,
            region_indices=region_indices,
            areas_square_metres=areas,
            region_ids=region_ids,
        )
        os.replace(temporary, WEIGHTS_PATH)
    finally:
        temporary.unlink(missing_ok=True)

    cell_counts = coverage["cells"].astype(int)
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "complete_exact_nasa_grid_area_weights_for_all_response_regions",
        "productionRatingsEnabled": 0,
        "purpose": "Precompute exact NASA NEX cell-to-region intersection areas for the exact-week independent regional-pattern challenge.",
        "inputs": {
            "inventory": str(INVENTORY_PATH.relative_to(ROOT)),
            "inventoryDigest": inventory["digest"],
            "sourceProbe": str(PROBE_PATH.relative_to(ROOT)),
            "sourceProbeDigest": probe["digest"],
            "regionalBoundaryCrosswalk": str(CROSSWALK_PATH.relative_to(ROOT)),
            "regionalBoundaryCrosswalkDigest": crosswalk["digest"],
            "geometrySha256": crosswalk["geometryOutput"]["sha256"],
        },
        "grid": {
            "shape": [LATITUDE_COUNT, LONGITUDE_COUNT],
            "spacingDegrees": SPACING_DEGREES,
            "latitudeFirstCenter": LATITUDE_FIRST_CENTER,
            "latitudeLastCenter": 89.875,
            "longitudeFirstCenter": LONGITUDE_FIRST_CENTER,
            "longitudeLastCenter": 359.875,
            "coordinateEvidence": "Verified from a full-grid one-day NCCS NetCDF3 subset before weight construction.",
        },
        "method": {
            "cellGeometry": "Fixed 0.25-degree boxes around the verified NASA NEX latitude and longitude centres, with source columns retained in the native 0..360 order.",
            "intersection": "Exact polygon intersection with the same 971 fixed official GISCO region geometries used by ERA5-Land and the monthly CMIP6 ensemble.",
            "area": "Intersection geometry area in EPSG:6933 global equal-area projection.",
            "normalization": "For each day and region, normalize only over finite intersected cell area; require at least 99% of the region's exact intersected grid area.",
        },
        "counts": {
            "independentModelVotes": inventory["counts"]["independentModelVotes"],
            "regions": len(regions),
            "candidateGridCells": len(cells),
            "weightedGridCells": len(cell_indices),
            "cellRegionIntersections": len(grouped),
            "regionsWithoutWeights": len(missing),
            "regionCellCounts": {
                "minimum": int(cell_counts.min()),
                "median": int(cell_counts.median()),
                "maximum": int(cell_counts.max()),
            },
            "totalIntersectionAreaSquareMetres": float(areas.sum()),
        },
        "weightsOutput": {
            "path": str(WEIGHTS_PATH.relative_to(ROOT)),
            "bytes": WEIGHTS_PATH.stat().st_size,
            "sha256": file_sha256(WEIGHTS_PATH),
            "logicalSha256": logical_sha256,
            "arrays": {
                "cellIndices": len(cell_indices),
                "offsets": len(offsets),
                "regionIndices": len(region_indices),
                "areasSquareMetres": len(areas),
                "regionIds": len(region_ids),
            },
        },
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Execute the frozen 1950–2022 exact ISO-week daily-temperature routes, average multiple members and grid variants within each canonical model, then compare the 32 one-model-one-vote results with the completed monthly ensemble and ERA5-Land.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write(payload: dict) -> None:
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    counts = payload["counts"]
    REPORT_PATH.write_text(
        "# NASA NEX exact-week regional area weights\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"The verified 0.25-degree NASA grid has exact polygon-intersection weights for all {counts['regions']} fixed mortality-panel regions. "
        f"{counts['weightedGridCells']:,} grid cells produce {counts['cellRegionIntersections']:,} non-zero cell-region weights, with no uncovered region. "
        f"The single weight set supports all {counts['independentModelVotes']} frozen independent model votes.\n\n"
        "These weights are temperature-aggregation inputs only. They change zero TULIP axes and zero scores.\n"
    )


def main() -> None:
    payload = build()
    write(payload)
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "weights": payload["weightsOutput"]["path"],
        "status": payload["status"],
        "counts": payload["counts"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
