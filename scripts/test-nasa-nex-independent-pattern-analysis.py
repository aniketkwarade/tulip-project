#!/usr/bin/env python3
"""Offline tests for the NASA exact-week independent-pattern analyzer."""

from __future__ import annotations

import hashlib
import importlib.util
import json
from pathlib import Path

import numpy as np


ROOT = Path(__file__).resolve().parents[1]
ANALYZER_PATH = ROOT / "scripts/analyze-nasa-nex-independent-pattern.py"
MONTHLY_PATH = ROOT / "scripts/analyze-pangeo-cmip6-independent-pattern.py"
OUTPUT_PATH = ROOT / "artifacts/tulip-calibration-2026-09-22/nasa-nex-gddp-cmip6-independent-pattern-analysis.json"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def file_sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load(path: Path, name: str):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def main() -> None:
    analyzer = load(ANALYZER_PATH, "nasa_analysis_test")
    helper = load(MONTHLY_PATH, "monthly_analysis_test")
    try:
        analyzer.analyze(
            {"execution": {"status": "partial_resumable_exact_week_regional_temperature_execution"}},
            None,
            None,
        )
    except RuntimeError as error:
        assert "requires all 2,190 admitted annual checkpoints" in str(error)
    else:
        raise AssertionError("Partial exact-week execution unexpectedly entered analysis")
    years = np.arange(1950, 2023, dtype=np.float64)
    predictor = (years - years.mean()) / 50
    regional_slopes = np.linspace(0.5, 2.5, 971)
    outcomes = 12 + predictor[:, None] * regional_slopes[None, :]
    fit = helper.fit_matrix(predictor, outcomes)
    assert np.allclose(fit["slope"], regional_slopes, atol=1e-12)
    assert np.allclose(fit["rSquared"], 1.0, atol=1e-12)

    exact = regional_slopes
    monthly = exact + np.linspace(-0.05, 0.05, 971)
    comparison = analyzer.resolution_comparison(
        exact, exact - 0.2, exact + 0.2,
        monthly, monthly - 0.2, monthly + 0.2,
        helper,
    )
    assert comparison["sameSlopeSignFraction"] == 1.0
    assert comparison["spatialSpearmanCorrelation"] > 0.999
    assert comparison["medianAbsoluteSlopeDifference"] < 0.03
    assert comparison["exactWeekMedianInsideMonthlyQ05Q95Fraction"] == 1.0
    assert comparison["monthlyMedianInsideExactWeekQ05Q95Fraction"] == 1.0

    model_slopes = np.stack([exact + index * 0.01 for index in range(29)])
    institutions = np.asarray(
        [f"institution-{index // 2}" if index < 16 else f"institution-{index}" for index in range(29)],
        dtype="U32",
    )
    assert len(np.unique(institutions)) == 21
    ensemble = helper.ensemble_summary(model_slopes, institutions)
    assert ensemble["modelMedian"].shape == (971,)
    assert ensemble["institutionVotes"].shape == (21, 971)
    assert np.all(ensemble["modelQ05"] <= ensemble["modelMedian"])
    assert np.all(ensemble["modelMedian"] <= ensemble["modelQ95"])

    artifact_message = "complete artifact pending"
    if OUTPUT_PATH.exists():
        payload = json.loads(OUTPUT_PATH.read_text())
        digest = payload.pop("digest")
        assert canonical_digest(payload) == digest
        assert payload["productionRatingsEnabled"] == 0
        assert payload["status"] == "complete_exact_week_independent_pattern_ensemble"
        assert payload["counts"] == {
            "models": 29,
            "institutions": 21,
            "regions": 971,
            "years": 73,
            "modelRegionFits": 28159,
        }
        assert len(payload["contributors"]) == 29
        output = payload["arrayOutput"]
        path = ROOT / output["path"]
        assert path.stat().st_size == output["bytes"]
        assert file_sha256(path) == output["sha256"]
        with np.load(path) as source:
            arrays = {name: source[name].copy() for name in source.files}
        assert analyzer.analysis_logical_digest(arrays) == output["logicalSha256"]
        assert arrays["models"].shape == arrays["institutions"].shape == (29,)
        assert arrays["years"].tolist() == list(range(1950, 2023))
        assert arrays["region_ids"].shape == (971,)
        assert len(set(arrays["region_ids"].tolist())) == 971
        for name in (
            "full_slopes", "full_r_squared", "full_slope_standard_error",
            "early_slopes", "late_slopes", "split_absolute_slope_difference", "split_opposite_signs",
        ):
            assert arrays[name].shape == (29, 971)
        for name in (
            "modelMedian", "modelQ05", "modelQ95", "institutionMedian", "institutionQ05", "institutionQ95",
        ):
            assert arrays[name].shape == (971,)
            assert np.all(np.isfinite(arrays[name]))
        assert np.all(arrays["modelQ05"] <= arrays["modelMedian"])
        assert np.all(arrays["modelMedian"] <= arrays["modelQ95"])
        assert np.all(arrays["institutionQ05"] <= arrays["institutionMedian"])
        assert np.all(arrays["institutionMedian"] <= arrays["institutionQ95"])
        assert payload["decision"]["axesAdmitted"] == 0
        assert payload["decision"]["scoresChanged"] == 0
        artifact_message = "complete artifact validated"
    print(
        "NASA NEX exact-week analysis passed: regression, resolution comparison and both frozen "
        f"weighting views validate offline; {artifact_message}."
    )


if __name__ == "__main__":
    main()
