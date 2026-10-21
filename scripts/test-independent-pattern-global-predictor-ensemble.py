#!/usr/bin/env python3
"""Validate the merged exact-member global-predictor ensemble."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/build-independent-pattern-global-predictor-ensemble.py"
ARTIFACT = ROOT / "artifacts/tulip-calibration-2026-09-22/independent-pattern-global-predictor-ensemble.json"


def load_module():
    spec = importlib.util.spec_from_file_location("predictor_ensemble", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def main() -> None:
    module = load_module()
    figure = module.verified_payload(module.FIGURE_PATH)
    pangeo = module.verified_payload(module.PANGEO_PATH)
    rebuilt = module.build(figure, pangeo)
    payload = json.loads(ARTIFACT.read_text()) if ARTIFACT.exists() else rebuilt
    digest = payload.pop("digest")
    assert module.canonical_digest(payload) == digest
    payload["digest"] = digest
    assert payload == rebuilt
    counts = payload["counts"]
    assert counts["expectedIndependentIdentities"] == 32
    assert counts["completeIndependentPredictors"] + counts["remainingIndependentPredictors"] == 32
    assert counts["immutableFigureDataPredictors"] == 17
    assert counts["pangeoExecutedPredictors"] == pangeo["counts"]["pangeoPredictorsComplete"]
    assert counts["predictorYearRows"] == counts["completeIndependentPredictors"] * 73
    assert len(payload["records"]) == counts["completeIndependentPredictors"]
    assert len({(row["canonicalModel"], row["member"]) for row in payload["records"]}) == len(payload["records"])
    for record in payload["records"]:
        assert [row["year"] for row in record["predictors"]] == list(range(1950, 2023))
    assert payload["decision"]["axesAdmitted"] == 0
    assert payload["decision"]["scoresChanged"] == 0
    print(f"Independent global-predictor ensemble passed: {counts['completeIndependentPredictors']} of 32 exact-member predictors merge without duplicates or substitution and with zero score effects.")


if __name__ == "__main__":
    main()
