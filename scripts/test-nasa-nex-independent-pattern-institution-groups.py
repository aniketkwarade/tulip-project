#!/usr/bin/env python3
"""Validate frozen NASA exact-week institution grouping."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
PATH = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-institution-groups.json"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def main() -> None:
    payload = json.loads(PATH.read_text())
    digest = payload.pop("digest")
    assert canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    assert payload["status"] == "complete_frozen_one_institution_one_vote_groups"
    assert payload["counts"] == {
        "canonicalModels": 32,
        "institutions": 23,
        "singleModelInstitutions": 14,
        "multiModelInstitutions": 9,
        "maximumModelsPerInstitution": 2,
    }
    records = payload["records"]
    groups = payload["groups"]
    assert len(records) == 32 and len(groups) == 23
    assert len({row["canonicalModel"] for row in records}) == 32
    assert len({(row["canonicalModel"], row["member"]) for row in records}) == 32
    assert all(row["institutionId"] and row["nasaCatalogueEntries"] for row in records)
    flattened = [model for group in groups for model in group["canonicalModels"]]
    assert len(flattened) == len(set(flattened)) == 32
    assert set(flattened) == {row["canonicalModel"] for row in records}
    for group in groups:
        assert group["modelCount"] == len(group["canonicalModels"])
        assert 1 <= group["modelCount"] <= 2
        expected = sorted(row["canonicalModel"] for row in records if row["institutionId"] == group["institutionId"])
        assert group["canonicalModels"] == expected
    gfdl = next(row for row in records if row["canonicalModel"] == "GFDL-CM4")
    assert gfdl["nasaCatalogueEntries"] == ["GFDL-CM4", "GFDL-CM4_gr2"]
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    print("NASA NEX institution groups passed: 32 canonical models map to 23 frozen institution votes with zero score effects.")


if __name__ == "__main__":
    main()
