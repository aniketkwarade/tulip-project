#!/usr/bin/env python3
"""Validate NASA NEX exact-week regional-temperature checkpoints."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
MANIFEST_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-regional-temperature-execution.json"
CALENDAR_COMPATIBILITY_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-calendar-compatibility.json"
CHECKPOINT_ROOT = ROOT / "tmp/tulip-independent-pattern/nasa-nex-regional-temperature-checkpoints"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def verified_json(path: Path) -> dict:
    payload = json.loads(path.read_text())
    content = dict(payload)
    digest = content.pop("digest")
    assert canonical_digest(content) == digest
    return payload


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def main() -> None:
    manifest = verified_json(MANIFEST_PATH)
    assert manifest["productionRatingsEnabled"] == 0
    assert manifest["status"] in {
        "partial_resumable_exact_week_regional_temperature_execution",
        "complete_all_exact_week_regional_temperature_series",
    }
    counts = manifest["counts"]
    compatibility = verified_json(CALENDAR_COMPATIBILITY_PATH)
    assert manifest["inputs"]["calendarCompatibilityDigest"] == compatibility["digest"]
    assert compatibility["counts"]["candidateAnnualCheckpoints"] == 2409
    assert compatibility["counts"]["admittedAnnualCheckpoints"] == 2190
    assert compatibility["counts"]["admittedCanonicalModels"] == 29
    assert compatibility["counts"]["admittedInstitutions"] == 21
    assert {row["model"] for row in compatibility["exclusions"]} == {
        "HadGEM3-GC31-LL", "KACE-1-0-G", "UKESM1-0-LL"
    }
    assert all(row["calendar"] == "360_day" and row["returnedDays"] == 95 for row in compatibility["exclusions"])
    assert counts["annualCheckpointsExpected"] == 2190
    assert counts["independentModelVotesExpected"] == 29
    assert counts["regionsPerCheckpoint"] == 971
    assert counts["annualCheckpointsComplete"] + counts["annualCheckpointsRemaining"] == 2190
    assert len(manifest["remainingCheckpointKeys"]) == counts["annualCheckpointsRemaining"]
    assert counts["completedRegionYearRows"] == counts["annualCheckpointsComplete"] * 971

    # Workers write checkpoints atomically before rebuilding the shared manifest.
    # Validate the manifest's frozen view and ignore any newer checkpoint whose
    # key is still listed as remaining in that view.
    all_checkpoint_paths = sorted(CHECKPOINT_ROOT.glob("*.json"))
    remaining_keys = set(manifest["remainingCheckpointKeys"])
    checkpoint_paths = [path for path in all_checkpoint_paths if path.stem not in remaining_keys]
    assert len(checkpoint_paths) == counts["annualCheckpointsComplete"]
    total_response_bytes = 0
    identities = set()
    for checkpoint_path in checkpoint_paths:
        checkpoint = verified_json(checkpoint_path)
        assert checkpoint["productionRatingsEnabled"] == 0
        assert checkpoint["status"] == "complete_exact_week_model_member_year_checkpoint"
        identity = checkpoint["identity"]
        key = (identity["model"], identity["member"], identity["year"])
        assert key not in identities
        identities.add(key)
        assert canonical_digest(identity) == checkpoint["identityDigest"]
        assert identity["experiment"] == ("historical" if identity["year"] <= 2014 else "ssp245")
        assert 1950 <= identity["year"] <= 2022
        assert checkpoint["method"]["isoWeeks"] == [22, 35]
        assert checkpoint["method"]["days"] == 98
        assert checkpoint["method"]["minimumFiniteAdmittedAreaFraction"] == 0.99
        coverage = checkpoint["coverage"]
        assert coverage["regions"] == 971
        assert coverage["minimumFiniteAdmittedAreaFraction"] >= 0.99
        assert -100 < coverage["minimumAnnualMeanC"] < 60
        assert -100 < coverage["maximumAnnualMeanC"] < 60
        assert coverage["minimumAnnualMeanC"] < coverage["maximumAnnualMeanC"]
        assert len(checkpoint["tiles"]) == 6
        assert {tile["name"] for tile in checkpoint["tiles"]} == {
            "europe", "north_atlantic", "macaronesia", "caribbean", "south_america", "indian_ocean"
        }
        assert sum(tile["bytes"] for tile in checkpoint["tiles"]) == coverage["responseBytes"]
        for tile in checkpoint["tiles"]:
            assert tile["bytes"] > 0
            assert len(tile["logicalDataSha256"]) == 64
            assert tile["timeCount"] == 98
            assert tile["finiteAssignedValues"] <= tile["assignedValues"]
            assert 180 < tile["minimumTemperatureK"] < 330
            assert 180 < tile["maximumTemperatureK"] < 330
        total_response_bytes += coverage["responseBytes"]

        output = checkpoint["output"]
        path = ROOT / output["path"]
        assert path.stat().st_size == output["bytes"]
        assert file_sha256(path) == output["sha256"]
        with np.load(path) as arrays:
            region_ids = arrays["region_ids"]
            annual = arrays["annual_exact_week_mean_c"]
            assert len(region_ids) == len(annual) == output["rows"] == 971
            assert len(set(region_ids.tolist())) == 971
            assert np.all(np.isfinite(annual)) and np.all((annual > -100) & (annual < 60))
            logical = hashlib.sha256(b"".join([region_ids.tobytes(), annual.tobytes()])).hexdigest()
            assert logical == output["logicalSha256"]
        assert checkpoint["decision"] == {"axesAdmitted": 0, "scoresChanged": 0}

    assert total_response_bytes == counts["responseBytesDownloadedForCompletedCheckpoints"]
    assert manifest["decision"]["axesAdmitted"] == 0
    assert manifest["decision"]["scoresChanged"] == 0
    if counts["annualCheckpointsRemaining"]:
        assert manifest["status"] == "partial_resumable_exact_week_regional_temperature_execution"
    else:
        assert manifest["status"] == "complete_all_exact_week_regional_temperature_series"
        assert counts["independentModelVotesComplete"] == 29
    print(
        "NASA NEX exact-week regional execution passed: "
        f"{counts['annualCheckpointsComplete']:,}/{counts['annualCheckpointsExpected']:,} annual checkpoints "
        f"and {counts['completedRegionYearRows']:,} regional means validate with zero score effects."
    )


if __name__ == "__main__":
    main()
