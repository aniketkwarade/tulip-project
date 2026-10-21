#!/usr/bin/env python3
"""Validate the frozen NASA NEX model/member/file inventory."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-inventory.json"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def main() -> None:
    payload = json.loads(PATH.read_text())
    digest = payload.pop("digest")
    assert canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    assert payload["counts"]["catalogueModels"] == 35
    assert payload["counts"]["eligibleModels"] + payload["counts"]["excludedModels"] == 35
    assert payload["counts"]["eligibleModels"] == 33
    assert payload["counts"]["independentModelVotes"] == 32
    assert len(payload["models"]) == len({row["model"] for row in payload["models"]}) == 35
    assert payload["selection"]["requiredYearsPerMember"] == 73
    eligible_members = 0
    files = 0
    model_votes = set()
    for model in payload["models"]:
        assert model["canonicalModel"]
        assert model["eligible"] == bool(model["eligibleMembers"])
        if model["eligible"]:
            model_votes.add(model["canonicalModel"])
        for member in model["members"]:
            if not member["eligible"]:
                continue
            eligible_members += 1
            historical = member["historical"]
            ssp245 = member["ssp245"]
            assert historical["missingYears"] == [] and historical["duplicateYears"] == {}
            assert ssp245["missingYears"] == [] and ssp245["duplicateYears"] == {}
            assert [row["year"] for row in historical["files"]] == list(range(1950, 2015))
            assert [row["year"] for row in ssp245["files"]] == list(range(2015, 2023))
            files += len(historical["files"]) + len(ssp245["files"])
    assert eligible_members == payload["counts"]["eligibleMembers"]
    assert files == payload["counts"]["selectedFiles"]
    assert len(model_votes) == payload["counts"]["independentModelVotes"]
    assert payload["selection"]["modelVoteAliases"] == {"GFDL-CM4_gr2": "GFDL-CM4"}
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    print(f"NASA NEX independent-pattern inventory passed: {payload['counts']['eligibleModels']} eligible catalogue entries, {payload['counts']['independentModelVotes']} independent model votes, {eligible_members} members and {files:,} annual files frozen before comparison.")


if __name__ == "__main__":
    main()
