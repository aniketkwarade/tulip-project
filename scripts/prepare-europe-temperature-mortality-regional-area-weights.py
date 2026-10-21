#!/usr/bin/env python3
"""Build sparse area-intersection weights for the 971-region ERA5-Land run."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import geopandas as gpd
import numpy as np
import pandas as pd
from shapely.geometry import box


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
CROSSWALK_PATH = CALIBRATION_DIR / "europe-temperature-mortality-regional-boundary-crosswalk.json"
PLAN_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-retrieval-plan.json"
OUTPUT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-regional-area-weights.json"
REPORT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-regional-area-weights-report.md"
WEIGHTS_PATH = ROOT / "tmp/tulip-regional-pattern/europe-temperature-mortality-971-area-weights.npz"

GRID_LAT_MIN = -90.0
GRID_LON_MIN = -180.0
GRID_SPACING = 0.1
GRID_NLON = 3600
LON_CELLS_PER_CHUNK = 6


def file_sha256(path: Path) -> str:
    value = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            value.update(chunk)
    return value.hexdigest()


def canonical_digest(value: object) -> str:
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def active_cells(row_runs: list[dict]) -> gpd.GeoDataFrame:
    records = []
    half = GRID_SPACING / 2
    for row in row_runs:
        latitude_index = int(row["latitudeIndex"])
        latitude = GRID_LAT_MIN + latitude_index * GRID_SPACING
        for chunk_start, chunk_stop in row["longitudeChunkRuns"]:
            for longitude_chunk in range(int(chunk_start), int(chunk_stop)):
                for longitude_index in range(longitude_chunk * LON_CELLS_PER_CHUNK, (longitude_chunk + 1) * LON_CELLS_PER_CHUNK):
                    longitude = GRID_LON_MIN + longitude_index * GRID_SPACING
                    records.append({
                        "cellIndex": latitude_index * GRID_NLON + longitude_index,
                        "latitudeIndex": latitude_index,
                        "longitudeIndex": longitude_index,
                        "longitudeChunk": longitude_chunk,
                        "geometry": box(longitude - half, latitude - half, longitude + half, latitude + half),
                    })
    return gpd.GeoDataFrame(records, geometry="geometry", crs="EPSG:4326")


def main() -> None:
    crosswalk = json.loads(CROSSWALK_PATH.read_text())
    plan = json.loads(PLAN_PATH.read_text())
    if plan["inputs"]["regionalBoundaryCrosswalkDigest"] != crosswalk["digest"]:
        raise RuntimeError("Retrieval plan does not match the regional crosswalk")
    if plan["inputs"]["selectedConfiguration"] != "area_intersection_utcplus0000":
        raise RuntimeError("Area weights require the validated area-intersection configuration")

    regions = gpd.read_file(ROOT / crosswalk["geometryOutput"]["path"]).to_crs("EPSG:4326")
    regions = regions.sort_values("regionId").reset_index(drop=True)
    regions["regionIndex"] = np.arange(len(regions), dtype=np.int32)
    cells = active_cells(plan["sparsePlan"]["rowRuns"])
    if cells["cellIndex"].duplicated().any():
        raise RuntimeError("Sparse retrieval plan produced duplicate grid cells")

    intersections = gpd.overlay(
        cells[["cellIndex", "latitudeIndex", "longitudeIndex", "longitudeChunk", "geometry"]],
        regions[["regionIndex", "regionId", "geometry"]],
        how="intersection",
        keep_geom_type=False,
    )
    intersections = intersections[~intersections.geometry.is_empty].copy()
    intersections = intersections[intersections.geometry.geom_type.isin(["Polygon", "MultiPolygon"])].copy()
    # EPSG:6933 is a global equal-area projection, so overseas regions and
    # continental Europe use one area basis without latitude distortion.
    intersections["areaSquareMetres"] = intersections.to_crs("EPSG:6933").geometry.area
    intersections = intersections[intersections["areaSquareMetres"] > 0]
    grouped = intersections.groupby(["cellIndex", "regionIndex"], as_index=False)["areaSquareMetres"].sum()
    grouped = grouped.sort_values(["cellIndex", "regionIndex"]).reset_index(drop=True)

    region_coverage = grouped.groupby("regionIndex").agg(
        cells=("cellIndex", "nunique"),
        areaSquareMetres=("areaSquareMetres", "sum"),
    )
    missing_region_indices = sorted(set(regions["regionIndex"]) - set(region_coverage.index))
    if missing_region_indices:
        raise RuntimeError(f"Regions without non-zero area weights: {missing_region_indices}")

    unique_cells = grouped["cellIndex"].drop_duplicates().to_numpy(dtype=np.int64)
    first_positions = grouped.groupby("cellIndex", sort=True).size().to_numpy(dtype=np.int64)
    offsets = np.concatenate((np.array([0], dtype=np.int64), np.cumsum(first_positions, dtype=np.int64)))
    region_indices = grouped["regionIndex"].to_numpy(dtype=np.int32)
    areas = grouped["areaSquareMetres"].to_numpy(dtype=np.float64)
    region_ids = regions["regionId"].astype(str).to_numpy(dtype="U16")
    if offsets[-1] != len(region_indices) or len(region_indices) != len(areas):
        raise RuntimeError("Sparse area-weight arrays are inconsistent")

    WEIGHTS_PATH.parent.mkdir(parents=True, exist_ok=True)
    np.savez_compressed(
        WEIGHTS_PATH,
        cell_indices=unique_cells,
        offsets=offsets,
        region_indices=region_indices,
        areas_square_metres=areas,
        region_ids=region_ids,
    )
    logical_sha256 = hashlib.sha256(b"".join([
        unique_cells.tobytes(), offsets.tobytes(), region_indices.tobytes(), areas.tobytes(),
        "\n".join(region_ids.tolist()).encode(),
    ])).hexdigest()

    cell_counts = region_coverage["cells"].astype(int)
    payload = {
        "version": "tulip_europe_temperature_mortality_regional_area_weights_2026_09_26_v1",
        "preparedOn": "2026-09-26",
        "status": "complete_sparse_area_intersection_weights_for_all_response_regions",
        "productionRatingsEnabled": 0,
        "purpose": "Precompute the sparse 0.1-degree ERA5-Land cell-to-region intersection areas needed by the 1950–2022 long-record run.",
        "inputs": {
            "regionalBoundaryCrosswalkVersion": crosswalk["version"],
            "regionalBoundaryCrosswalkDigest": crosswalk["digest"],
            "retrievalPlanVersion": plan["version"],
            "retrievalPlanDigest": plan["digest"],
            "selectedConfiguration": plan["inputs"]["selectedConfiguration"],
        },
        "method": {
            "grid": "ERA5-Land 0.1-degree cell boxes centered on the Open-Meteo grid coordinates.",
            "intersection": "Exact polygon intersection within every sparse spatial chunk declared by the retrieval plan.",
            "area": "Intersection geometry area in EPSG:6933 global equal-area projection.",
            "normalization": "For each timestamp and region, divide the sum of finite cell temperature times intersection area by the finite-cell intersection-area sum.",
        },
        "coverage": {
            "regions": len(regions),
            "candidateGridCells": len(cells),
            "weightedGridCells": len(unique_cells),
            "cellRegionIntersections": len(grouped),
            "regionsWithoutWeights": len(missing_region_indices),
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
                "cellIndices": len(unique_cells),
                "offsets": len(offsets),
                "regionIndices": len(region_indices),
                "areasSquareMetres": len(areas),
                "regionIds": len(region_ids),
            },
        },
        "decision": {
            "status": "admitted_as_temperature_aggregation_input_only",
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Execute the sparse 1950–2022 ERA5-Land range read with these fixed weights, verify 70,883 region-year summer means, and challenge the fitted regional pattern before endpoint use.",
        },
    }
    payload["digest"] = canonical_digest({
        "inputs": payload["inputs"],
        "method": payload["method"],
        "coverage": payload["coverage"],
        "weightsOutput": payload["weightsOutput"],
        "decision": payload["decision"],
    })
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    REPORT_PATH.write_text(
        "# European mortality-panel regional area weights\n\n"
        "Status: **sparse area-intersection weights complete for all 971 response regions**.\n\n"
        f"The retrieval plan contains {len(cells):,} candidate 0.1-degree cells. {len(unique_cells):,} cells have non-zero overlap with at least one panel region, producing {len(grouped):,} cell-region weights. "
        f"Every region has weights; the per-region cell count ranges from {int(cell_counts.min()):,} to {int(cell_counts.max()):,}, with a median of {int(cell_counts.median()):,}.\n\n"
        "The weights are aggregation inputs only. They do not measure harm reach and change zero TULIP axes and zero scores. The next gate is the sparse 1950–2022 temperature read and long-record stability challenge.\n"
    )
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "weights": str(WEIGHTS_PATH.relative_to(ROOT)),
        "status": payload["status"],
        "coverage": payload["coverage"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
