#!/usr/bin/env python3
"""Validate the frozen NASA NEX exact-week regional retrieval plan."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-regional-retrieval-plan.json"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def main() -> None:
    payload = json.loads(PATH.read_text())
    digest = payload.pop("digest")
    assert canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    assert payload["status"] == "complete_frozen_exact_week_regional_retrieval_plan"
    counts = payload["counts"]
    assert counts == {
        "catalogueEntries": 33,
        "independentModelVotes": 32,
        "annualFiles": 2409,
        "daysPerAnnualFile": 98,
        "tilesPerAnnualFile": 6,
        "requests": 14454,
        "admittedFiniteWeightedCells": 11842,
        "gridCellsRequestedPerAnnualFile": 28730,
        "modelFileDays": 236082,
    }
    tiles = payload["tiles"]
    assert len(tiles) == counts["tilesPerAnnualFile"]
    assert {tile["name"] for tile in tiles} == {
        "europe", "north_atlantic", "macaronesia", "caribbean", "south_america", "indian_ocean"
    }
    assert sum(tile["assignedFiniteWeightedCells"] for tile in tiles) == counts["admittedFiniteWeightedCells"]
    assert sum(tile["gridCellsPerDay"] for tile in tiles) == counts["gridCellsRequestedPerAnnualFile"]
    for tile in tiles:
        assert tile["latitudeCount"] > 0 and tile["longitudeCount"] > 0
        assert tile["gridCellsPerDay"] == tile["latitudeCount"] * tile["longitudeCount"]
        assert tile["rawFloatBytesPerAnnualRequest"] == tile["gridCellsPerDay"] * 98 * 4
        assert tile["assignedFiniteWeightedCells"] <= tile["gridCellsPerDay"]
        assert len(tile["assignedCellIndicesSha256"]) == 64
    transfer = payload["transferEstimate"]
    assert transfer["rawFloatBytes"] == counts["annualFiles"] * counts["daysPerAnnualFile"] * counts["gridCellsRequestedPerAnnualFile"] * 4
    assert 27 < transfer["rawFloatGigabytesDecimal"] < 28
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    print(
        "NASA NEX regional retrieval plan passed: "
        f"{counts['annualFiles']:,} annual checkpoints, {counts['requests']:,} tile requests and "
        f"{transfer['rawFloatGigabytesDecimal']:.2f} GB raw-float planning volume with zero score effects."
    )


if __name__ == "__main__":
    main()
