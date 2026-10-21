#!/usr/bin/env python3
"""Offline tests for the regional-pattern promotion gate."""

from __future__ import annotations

import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts/analyze-europe-temperature-mortality-pattern-promotion.py"
OUTPUT = ROOT / "artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-pattern-promotion-decision.json"


def load_module():
    spec = importlib.util.spec_from_file_location("pattern_promotion", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def view(passed: bool = True) -> dict:
    tests = {
        name: {"value": 1.0 if name != "medianAbsoluteSlopeDifference" else 0.0, "threshold": 0.5, "passed": passed}
        for name in (
            "sameSlopeSignFraction",
            "spatialSpearmanCorrelation",
            "era5SlopeInsideQ05Q95Fraction",
            "medianAbsoluteSlopeDifference",
            "eligibleVotesPerRegion",
        )
    }
    return {"passed": passed, "tests": tests}


def fixtures() -> tuple[dict, dict, dict]:
    era = {
        "status": "complete_long_record_pattern_stability_challenge_independent_comparison_pending",
        "digest": "era-digest",
        "diagnostics": {"responseRegions": 971},
        "regions": [{"region": f"r-{index}"} for index in range(971)],
    }
    monthly_views = {
        season: {weighting: view() for weighting in ("oneModelOneVote", "oneInstitutionOneVote")}
        for season in ("jja", "isoWeek2235MonthlyApproximation")
    }
    monthly = {
        "status": "complete_monthly_independent_pattern_ensemble",
        "digest": "monthly-digest",
        "counts": {"models": 22, "institutions": 17, "regions": 971, "years": 73, "seasonDefinitions": 2, "modelRegionFits": 42_724},
        "comparison": {
            "status": "monthly_independent_pattern_tests_complete_exact_week_challenge_pending",
            "monthlyTestsPassed": True,
            "era5PatternDigest": "era-digest",
            "views": monthly_views,
        },
    }
    exact_views = {weighting: view() for weighting in ("oneModelOneVote", "oneInstitutionOneVote")}
    exact = {
        "status": "complete_exact_week_independent_pattern_ensemble",
        "digest": "exact-digest",
        "counts": {"models": 29, "institutions": 21, "regions": 971, "years": 73, "modelRegionFits": 28_159},
        "comparison": {
            "status": "exact_week_independent_pattern_tests_complete",
            "exactWeekTestsPassed": True,
            "era5PatternDigest": "era-digest",
            "views": exact_views,
        },
    }
    return era, monthly, exact


def main() -> None:
    module = load_module()
    era, monthly, exact = fixtures()
    promoted = module.decide(era, monthly, exact)
    assert promoted["decision"]["patternInputAdmittedToMatchedEndpoint"] is True
    assert promoted["counts"] == {
        "regions": 971,
        "monthlyModels": 22,
        "monthlyInstitutions": 17,
        "exactWeekModels": 29,
        "exactWeekInstitutions": 21,
        "frozenTests": 30,
        "passedTests": 30,
        "failedTests": 0,
    }
    monthly["comparison"]["views"]["jja"]["oneModelOneVote"] = view(False)
    monthly["comparison"]["monthlyTestsPassed"] = False
    rejected = module.decide(era, monthly, exact)
    assert rejected["decision"]["patternInputAdmittedToMatchedEndpoint"] is False
    assert rejected["counts"]["failedTests"] == 5
    assert rejected["decision"]["selectedCentralPattern"] is None

    message = "complete promotion artifact pending"
    if OUTPUT.exists():
        payload = json.loads(OUTPUT.read_text())
        digest = payload.pop("digest")
        assert module.canonical_digest(payload) == digest
        assert payload["productionRatingsEnabled"] == 0
        assert payload["counts"]["frozenTests"] == 30
        assert payload["decision"]["axesAdmitted"] == 0
        assert payload["decision"]["scoresChanged"] == 0
        message = "complete promotion artifact validated"
    print(f"Regional-pattern promotion gate passed: all frozen test families are enforced; {message}.")


if __name__ == "__main__":
    main()
