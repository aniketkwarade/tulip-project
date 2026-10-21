#!/usr/bin/env python3
"""Validate the resumable CMIP6 regional-temperature executor and outputs."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/execute-pangeo-cmip6-independent-pattern-regional-temperatures.py"
ARTIFACT = ROOT / "artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-independent-pattern-regional-temperature-execution.json"


def load_module():
    spec = importlib.util.spec_from_file_location("regional_executor", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    module = load_module()
    for year in module.YEARS:
        weights = module.iso_window_month_day_weights(year)
        assert tuple(weights) == module.SEASON_MONTHS
        assert sum(weights.values()) == 98
        assert weights[6] == 30 and weights[7] == 31
        assert 1 <= weights[5] <= 8 and 29 <= weights[8] <= 31 and 0 <= weights[9] <= 5

    region_indices = np.arange(module.EXPECTED_REGIONS, dtype=np.int32)
    synthetic_weights = {
        "repeatedCellPositions": np.arange(module.EXPECTED_REGIONS, dtype=np.int64),
        "regionIndices": region_indices,
        "areas": np.ones(module.EXPECTED_REGIONS),
        "totalRegionArea": np.ones(module.EXPECTED_REGIONS),
    }
    values = np.linspace(250.0, 300.0, module.EXPECTED_REGIONS)
    aggregated, coverage = module.aggregate_candidate_values(values, synthetic_weights)
    assert np.array_equal(aggregated, values)
    assert np.array_equal(coverage, np.ones(module.EXPECTED_REGIONS))

    if not ARTIFACT.exists():
        print("CMIP6 regional-temperature executor passed offline method tests; no execution manifest exists yet.")
        return
    payload = json.loads(ARTIFACT.read_text())
    digest = payload.pop("digest")
    assert module.canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    counts = payload["counts"]
    assert counts["modelsExpected"] == len(payload["records"]) == 22
    assert counts["modelsComplete"] + counts["modelsRemaining"] == 22
    assert counts["regionsPerModel"] == module.EXPECTED_REGIONS
    assert counts["yearsPerModel"] == len(module.YEARS)
    assert counts["seasonDefinitions"] == 2
    assert counts["completedRegionYearRowsAcrossBothDefinitions"] == (
        counts["modelsComplete"] * module.EXPECTED_REGIONS * len(module.YEARS) * 2
    )
    complete = 0
    identities = set()
    for record in payload["records"]:
        identity = (record["canonicalModel"], record["member"])
        assert identity not in identities
        identities.add(identity)
        if record["status"] != "complete_exact_member_regional_temperature_series":
            assert record["status"] == "regional_temperature_series_pending"
            continue
        complete += 1
        checkpoint_path = ROOT / record["checkpoint"]
        checkpoint = json.loads(checkpoint_path.read_text())
        checkpoint_digest = checkpoint.pop("digest")
        assert checkpoint_digest == record["checkpointDigest"]
        assert module.canonical_digest(checkpoint) == checkpoint_digest
        checkpoint["digest"] = checkpoint_digest
        assert checkpoint["inputs"] == payload["inputs"]
        assert checkpoint["identity"]["canonicalModel"] == record["canonicalModel"]
        assert checkpoint["identity"]["member"] == record["member"]
        assert checkpoint["coverage"]["minimumRegionMonthFiniteAreaFraction"] >= module.MIN_FINITE_AREA_FRACTION
        output = checkpoint["seriesOutput"]
        path = ROOT / output["path"]
        assert path.stat().st_size == output["bytes"]
        assert file_sha256(path) == output["sha256"]
        assert module.validate_series_output(checkpoint)
    assert complete == counts["modelsComplete"]
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    print(
        "CMIP6 regional-temperature execution passed: "
        f"{complete}/22 exact model checkpoints and both frozen seasonal definitions validate with zero score effects."
    )


if __name__ == "__main__":
    main()
