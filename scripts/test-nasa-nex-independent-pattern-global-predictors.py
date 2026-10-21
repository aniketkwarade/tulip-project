#!/usr/bin/env python3
"""Validate the exact-member NASA challenge global-predictor inventory."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path
import tempfile
import zipfile


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/prepare-nasa-nex-independent-pattern-global-predictors.py"
ARTIFACT = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-global-predictors.json"


def load_module():
    spec = importlib.util.spec_from_file_location("global_predictors", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def synthetic_mag(first: int, last: int) -> bytes:
    rows = [f"{year} {286.0 + (year - first) * 0.01:.6f} {280.0 + (year - first) * 0.02:.6f}" for year in range(first, last + 1)]
    return (
        "&THISFILE_SPECIFICATIONS\n"
        f"    THISFILE_DATACOLUMNS = 2\n    THISFILE_DATAROWS = {len(rows)}\n/\n\n"
        "YEARS WORLD LAND\n" + "\n".join(rows) + "\n"
    ).encode()


def unit_checks(module) -> None:
    parsed = module.parse_mag(synthetic_mag(1850, 2022), "synthetic.MAG")
    assert parsed["firstYear"] == 1850 and parsed["lastYear"] == 2022
    predictor = module.predictor_from_mag(parsed)
    assert predictor["eligible"]
    assert predictor["analysisYearCount"] == 73
    baseline = sum(286.0 + (year - 1850) * 0.01 for year in range(1850, 1901)) / 51
    trailing_1950 = sum(286.0 + (year - 1850) * 0.01 for year in range(1947, 1951)) / 4
    assert abs(predictor["predictors"][0]["fourYearTrailingGlobalAnomalyC"] - (trailing_1950 - baseline)) < 1e-9
    incomplete = module.predictor_from_mag(module.parse_mag(synthetic_mag(2015, 2022), "short.MAG"))
    assert not incomplete["eligible"] and 1850 in incomplete["missingYears"]
    assert module.path_identity("x/Model/ssp245/r1i1p1f1/Amon/tas/gn/v1/example.MAG") == ("Model", "r1i1p1f1")


def artifact_checks(module) -> None:
    payload = json.loads(ARTIFACT.read_text())
    digest = payload.pop("digest")
    assert module.canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    metadata = payload["sources"]["recordMetadata"]
    assert metadata["recordId"] == 6_386_979
    assert metadata["fileEntries"] >= 1_000
    assert metadata["expectedBundle"]["bytes"] == module.EXPECTED_BUNDLE_SIZE
    assert metadata["expectedBundle"]["md5"] == module.EXPECTED_BUNDLE_MD5
    assert payload["counts"]["selectedCatalogueEntries"] == 33
    assert payload["counts"]["selectedIndependentIdentities"] == 32
    assert payload["counts"]["completeExactMemberPredictors"] + payload["counts"]["incompleteExactMemberPredictors"] == 32
    assert payload["counts"]["predictorYearRows"] == payload["counts"]["completeExactMemberPredictors"] * 73
    identities = {(row["canonicalModel"], row["member"]) for row in payload["records"]}
    assert len(identities) == len(payload["records"]) == 32
    for record in payload["records"]:
        if record["status"] == "complete_exact_member_predictor":
            assert len(record["predictors"]) == 73
            assert [row["year"] for row in record["predictors"]] == list(range(1950, 2023))
            assert record["baseline1850To1900Kelvin"] is not None
            assert record["eligibleCandidateCount"] == 1
        else:
            assert record["predictors"] == []
            assert record["baseline1850To1900Kelvin"] is None
        for candidate in record["candidates"]:
            assert candidate["bytes"] > 0
            assert len(candidate["sourceMd5"]) == 32
            assert len(candidate["contentSha256"]) == 64
    gfdl = next(row for row in payload["records"] if row["canonicalModel"] == "GFDL-CM4")
    assert gfdl["nasaCatalogueEntries"] == ["GFDL-CM4", "GFDL-CM4_gr2"]
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0


def main() -> None:
    module = load_module()
    unit_checks(module)
    artifact_checks(module)
    print("NASA NEX global-predictor inventory passed: parser arithmetic, exact-member admission, immutable-record file integrity, canonical model votes and zero-score boundary verified.")


if __name__ == "__main__":
    main()
