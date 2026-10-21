#!/usr/bin/env python3
"""Freeze the tiled NASA NEX exact-week regional retrieval plan."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
INVENTORY_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-inventory.json"
WEIGHTS_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-area-weights.json"
MASK_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-land-mask.json"
OUTPUT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-regional-retrieval-plan.json"
REPORT_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-regional-retrieval-plan-report.md"
VERSION = "tulip_nasa_nex_gddp_cmip6_independent_pattern_regional_retrieval_plan_2026_09_26_v1"

LATITUDE_FIRST_CENTER = -59.875
LONGITUDE_FIRST_CENTER = 0.125
SPACING_DEGREES = 0.25
LONGITUDE_COUNT = 1440
EXACT_WEEK_DAYS = 98


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def verified_json(path: Path) -> dict:
    payload = json.loads(path.read_text())
    content = dict(payload)
    digest = content.pop("digest")
    if canonical_digest(content) != digest:
        raise RuntimeError(f"Digest changed for {path.relative_to(ROOT)}")
    return payload


def coordinates(cell_index: int) -> tuple[int, int, float, float]:
    latitude_index, longitude_index = divmod(cell_index, LONGITUDE_COUNT)
    latitude = LATITUDE_FIRST_CENTER + latitude_index * SPACING_DEGREES
    longitude = LONGITUDE_FIRST_CENTER + longitude_index * SPACING_DEGREES
    if longitude > 180:
        longitude -= 360
    return latitude_index, longitude_index, latitude, longitude


def tile_name(latitude: float, longitude: float) -> str:
    # Disjoint geographic windows keep the large European request compact and
    # retain the overseas mortality-panel regions without a near-global box.
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


def build() -> dict:
    inventory = verified_json(INVENTORY_PATH)
    weights = verified_json(WEIGHTS_PATH)
    mask = verified_json(MASK_PATH)
    with np.load(ROOT / weights["weightsOutput"]["path"]) as arrays:
        weighted_cells = arrays["cell_indices"].copy()
    with np.load(ROOT / mask["maskOutput"]["path"]) as arrays:
        mask_cells = arrays["cell_indices"].copy()
        finite_source_mask = arrays["finite_source_mask"].copy()
    if not np.array_equal(weighted_cells, mask_cells):
        raise RuntimeError("NASA weights and frozen source mask use different cell arrays")
    admitted_cells = weighted_cells[finite_source_mask]

    groups: dict[str, list[tuple[int, int, int, float, float]]] = {}
    for cell_index in admitted_cells.tolist():
        latitude_index, longitude_index, latitude, longitude = coordinates(int(cell_index))
        groups.setdefault(tile_name(latitude, longitude), []).append(
            (int(cell_index), latitude_index, longitude_index, latitude, longitude)
        )
    expected_names = {
        "europe", "north_atlantic", "macaronesia", "caribbean", "south_america", "indian_ocean"
    }
    if set(groups) != expected_names:
        raise RuntimeError(f"Unexpected NASA retrieval tile universe: {sorted(groups)}")

    tiles = []
    assigned: list[int] = []
    for name in sorted(groups):
        records = groups[name]
        assigned.extend(row[0] for row in records)
        assigned_cell_indices = np.asarray(sorted(row[0] for row in records), dtype=np.int64)
        latitude_indices = [row[1] for row in records]
        # Use normalized longitudes to calculate a compact box. None of the
        # fixed zones crosses the antimeridian.
        normalized_longitude_indices = [round((row[4] + 179.875) / SPACING_DEGREES) for row in records]
        minimum_latitude_index = min(latitude_indices)
        maximum_latitude_index = max(latitude_indices)
        minimum_normalized_longitude_index = min(normalized_longitude_indices)
        maximum_normalized_longitude_index = max(normalized_longitude_indices)
        latitude_count = maximum_latitude_index - minimum_latitude_index + 1
        longitude_count = maximum_normalized_longitude_index - minimum_normalized_longitude_index + 1
        grid_cells = latitude_count * longitude_count
        tiles.append({
            "name": name,
            "southCenter": min(row[3] for row in records),
            "northCenter": max(row[3] for row in records),
            "westCenter": min(row[4] for row in records),
            "eastCenter": max(row[4] for row in records),
            "latitudeCount": latitude_count,
            "longitudeCount": longitude_count,
            "gridCellsPerDay": grid_cells,
            "assignedFiniteWeightedCells": len(records),
            "assignedCellIndicesSha256": hashlib.sha256(assigned_cell_indices.tobytes()).hexdigest(),
            "rawFloatBytesPerAnnualRequest": grid_cells * EXACT_WEEK_DAYS * 4,
        })
    if len(assigned) != len(set(assigned)) or sorted(assigned) != sorted(admitted_cells.tolist()):
        raise RuntimeError("NASA retrieval tiles do not partition every admitted cell exactly once")

    selected_files = inventory["counts"]["selectedFiles"]
    requests = selected_files * len(tiles)
    grid_cells_per_file = sum(tile["gridCellsPerDay"] for tile in tiles)
    estimated_raw_float_bytes = sum(tile["rawFloatBytesPerAnnualRequest"] for tile in tiles) * selected_files
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": "complete_frozen_exact_week_regional_retrieval_plan",
        "productionRatingsEnabled": 0,
        "purpose": "Freeze a compact, resumable NASA NEX retrieval layout before exact-week regional temperatures are compared with the monthly ensemble or ERA5-Land.",
        "inputs": {
            "inventory": str(INVENTORY_PATH.relative_to(ROOT)),
            "inventoryDigest": inventory["digest"],
            "areaWeights": str(WEIGHTS_PATH.relative_to(ROOT)),
            "areaWeightsDigest": weights["digest"],
            "landMask": str(MASK_PATH.relative_to(ROOT)),
            "landMaskDigest": mask["digest"],
        },
        "method": {
            "time": "Request the 98 Gregorian dates from ISO week 22 Monday through ISO week 35 Sunday separately for every 1950–2022 annual file.",
            "space": "Partition every finite weighted source cell exactly once among six disjoint geographic groups, then request the smallest source-grid-aligned bounding box around each group.",
            "coverage": "Aggregate all six tiles before checking each region-day. Require at least 99% of the frozen admitted source-mask area and reject partial or incompatible model masks.",
            "checkpoint": "Persist one atomic model/member/year regional result after all six tiles pass. Resume without repeating completed annual checkpoints; delete raw NetCDF subsets after each successful checkpoint.",
            "modelVote": "Average eligible members and NASA grid variants within each canonical source model before the one-model-one-vote analysis. GFDL-CM4 and GFDL-CM4_gr2 therefore remain one vote.",
        },
        "tiles": tiles,
        "counts": {
            "catalogueEntries": inventory["counts"]["eligibleModels"],
            "independentModelVotes": inventory["counts"]["independentModelVotes"],
            "annualFiles": selected_files,
            "daysPerAnnualFile": EXACT_WEEK_DAYS,
            "tilesPerAnnualFile": len(tiles),
            "requests": requests,
            "admittedFiniteWeightedCells": len(admitted_cells),
            "gridCellsRequestedPerAnnualFile": grid_cells_per_file,
            "modelFileDays": selected_files * EXACT_WEEK_DAYS,
        },
        "transferEstimate": {
            "rawFloatBytes": estimated_raw_float_bytes,
            "rawFloatGigabytesDecimal": estimated_raw_float_bytes / 1_000_000_000,
            "boundary": "Planning estimate for temperature float payload only. NetCDF coordinates and headers add overhead; HTTP transfer may differ. Runtime records actual response bytes.",
        },
        "decision": {
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": "Execute and validate all 2,409 annual checkpoints, aggregate them into 32 independent model votes, and apply the frozen exact-week comparison tests.",
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write(payload: dict) -> None:
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    counts = payload["counts"]
    transfer = payload["transferEstimate"]
    REPORT_PATH.write_text(
        "# NASA NEX exact-week regional retrieval plan\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"Six fixed geographic tiles partition all {counts['admittedFiniteWeightedCells']:,} finite weighted grid cells. "
        f"The resumable execution contains {counts['annualFiles']:,} annual checkpoints and {counts['requests']:,} tile requests across {counts['independentModelVotes']} independent model votes. "
        f"The raw temperature-float planning estimate is {transfer['rawFloatGigabytesDecimal']:.2f} GB before NetCDF overhead.\n\n"
        "This is an ingestion plan only. It changes zero TULIP axes and zero scores.\n"
    )


def main() -> None:
    payload = build()
    write(payload)
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "status": payload["status"],
        "counts": payload["counts"],
        "transferEstimate": payload["transferEstimate"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
