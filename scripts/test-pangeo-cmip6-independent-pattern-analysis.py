#!/usr/bin/env python3
"""Offline method and persisted-output tests for CMIP6 pattern analysis."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/analyze-pangeo-cmip6-independent-pattern.py"
ARTIFACT = ROOT / "artifacts/tulip-calibration-2026-09-22/pangeo-cmip6-independent-pattern-analysis.json"


def load_module():
    spec = importlib.util.spec_from_file_location("pattern_analysis", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def main() -> None:
    module = load_module()
    predictor = np.arange(20, dtype=np.float64)
    outcomes = np.stack((2.0 + 3.0 * predictor, -4.0 + 0.5 * predictor), axis=1)
    fit = module.fit_matrix(predictor, outcomes)
    assert np.allclose(fit["slope"], [3.0, 0.5])
    assert np.allclose(fit["intercept"], [2.0, -4.0])
    assert np.allclose(fit["rSquared"], 1.0)
    tied = np.asarray([10.0, 20.0, 20.0, 40.0])
    assert np.allclose(module.average_ranks(tied), [1.0, 2.5, 2.5, 4.0])
    assert np.isclose(module.spearman(tied, tied), 1.0)
    slopes = np.arange(4 * 3, dtype=np.float64).reshape(4, 3)
    institutions = np.asarray(["A", "A", "B", "C"])
    ensemble = module.ensemble_summary(slopes, institutions)
    assert ensemble["institutionVotes"].shape == (3, 3)
    assert np.allclose(ensemble["institutionVotes"][0], slopes[:2].mean(axis=0))

    if not ARTIFACT.exists():
        print("CMIP6 independent-pattern analysis passed offline regression, rank and weighting tests; no complete analysis exists yet.")
        return
    payload = json.loads(ARTIFACT.read_text())
    digest = payload.pop("digest")
    assert module.canonical_digest(payload) == digest
    assert payload["productionRatingsEnabled"] == 0
    assert payload["status"] == "complete_monthly_independent_pattern_ensemble"
    counts = payload["counts"]
    assert counts["models"] == 22 and counts["regions"] == 971 and counts["years"] == 73
    assert counts["seasonDefinitions"] == 2 and counts["modelRegionFits"] == 42_724
    path = ROOT / payload["arrayOutput"]["path"]
    assert path.stat().st_size == payload["arrayOutput"]["bytes"]
    assert module.file_sha256(path) == payload["arrayOutput"]["sha256"]
    with np.load(path) as arrays:
        persisted = {name: arrays[name].copy() for name in arrays.files}
    assert module.analysis_logical_digest(persisted) == payload["arrayOutput"]["logicalSha256"]
    assert persisted["full_slopes"].shape == (2, 22, 971)
    assert persisted["early_slopes"].shape == persisted["late_slopes"].shape == persisted["full_slopes"].shape
    assert np.all(np.isfinite(persisted["full_slopes"]))
    assert payload["decision"]["axesAdmitted"] == 0 and payload["decision"]["scoresChanged"] == 0
    print("CMIP6 independent-pattern analysis passed: 42,724 exact fits, both ensemble weightings and persisted arrays validate with zero score effects.")


if __name__ == "__main__":
    main()
