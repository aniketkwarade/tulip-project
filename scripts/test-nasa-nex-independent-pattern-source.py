#!/usr/bin/env python3
"""Validate the NASA NEX independent-pattern source probe artifact."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-source-probe.json"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def main() -> None:
    payload = json.loads(PATH.read_text())
    digest = payload.pop("digest")
    assert canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    assert payload["status"] == "daily_exact_week_independent_model_route_reachable_temperature_identity_resolved"
    assert payload["catalogue"]["modelCount"] == 35
    assert len(payload["catalogue"]["models"]) == len(set(payload["catalogue"]["models"])) == 35
    assert payload["probe"]["isoWeeks"] == [22, 35]
    assert payload["probe"]["expectedDays"] == 98
    assert payload["probe"]["temperatureShape"] == [98, 153, 281]
    assert payload["probe"]["dimensions"] == {"lon": 281, "time": 98, "lat": 153}
    assert payload["probe"]["finiteTemperatureCells"] > 2_000_000
    assert payload["probe"]["missingTemperatureCells"] > 0
    assert 250 < payload["probe"]["minimumTemperatureK"] < 280
    assert 300 < payload["probe"]["maximumTemperatureK"] < 330
    assert payload["probe"]["fileBytes"] == payload["sources"]["probeObject"]["contentLength"]
    assert len(payload["probe"]["fileSha256"]) == 64
    assert len(payload["probe"]["logicalDataSha256"]) == 64
    assert payload["probe"]["variableAttributes"]["standard_name"] == "air_temperature"
    assert "time: maximum" in payload["probe"]["variableAttributes"]["cell_methods"]
    assert "request-time translation timestamp" in payload["metadataReview"]["identityBoundary"]
    assert payload["metadataReview"]["status"] == "resolved_as_daily_midpoint_with_metadata_defect_recorded"
    identity = payload["metadataReview"]["temperatureIdentityProbe"]
    assert identity["passed"] is True
    assert identity["formula"] == "tas = (tasmin + tasmax) / 2"
    assert identity["shape"] == [98, 5, 5]
    assert identity["comparableCells"] == 2_450
    assert identity["maximumAbsoluteMidpointDifferenceK"] <= identity["acceptanceToleranceK"]
    assert identity["meanAbsoluteTasToTasmaxDifferenceK"] > 1
    assert set(identity["sources"]) == {"tas", "tasmin", "tasmax"}
    assert all(len(row["logicalDataSha256"]) == 64 for row in identity["sources"].values())
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    print("NASA NEX independent-pattern source probe passed: 35-model catalogue, exact-week subset, NetCDF integrity, daily-midpoint identity and zero-score boundary validated.")


if __name__ == "__main__":
    main()
