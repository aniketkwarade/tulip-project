#!/usr/bin/env python3
"""Combine the frozen monthly and exact-week pattern tests into one handoff gate."""

from __future__ import annotations

import hashlib
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CALIBRATION_DIR = ROOT / "artifacts/tulip-calibration-2026-09-22"
ERA5_PATH = CALIBRATION_DIR / "europe-temperature-mortality-long-record-pattern-analysis.json"
MONTHLY_PATH = CALIBRATION_DIR / "pangeo-cmip6-independent-pattern-analysis.json"
EXACT_WEEK_PATH = CALIBRATION_DIR / "nasa-nex-gddp-cmip6-independent-pattern-analysis.json"
OUTPUT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-pattern-promotion-decision.json"
REPORT_PATH = CALIBRATION_DIR / "europe-temperature-mortality-pattern-promotion-decision-report.md"
VERSION = "tulip_europe_temperature_mortality_pattern_promotion_2026_09_26_v1"


def canonical_digest(value: object) -> str:
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def verified_json(path: Path) -> dict:
    payload = json.loads(path.read_text())
    content = dict(payload)
    digest = content.pop("digest", None)
    if not digest or canonical_digest(content) != digest:
        raise RuntimeError(f"Digest failed for {path.relative_to(ROOT)}")
    return payload


def validated_view_tests(source: str, views: dict) -> list[dict]:
    rows = []
    for season, weightings in views.items():
        for weighting, view in weightings.items():
            tests = view.get("tests")
            if not isinstance(tests, dict) or len(tests) != 5:
                raise RuntimeError(f"{source} {season} {weighting} does not contain five frozen tests")
            calculated_pass = all(isinstance(item.get("passed"), bool) and item["passed"] for item in tests.values())
            if view.get("passed") is not calculated_pass:
                raise RuntimeError(f"{source} {season} {weighting} pass flag does not match its tests")
            for name, result in tests.items():
                rows.append({
                    "source": source,
                    "season": season,
                    "weighting": weighting,
                    "test": name,
                    "value": result["value"],
                    "threshold": result["threshold"],
                    "passed": result["passed"],
                })
    return rows


def decide(era5: dict, monthly: dict, exact_week: dict) -> dict:
    if era5.get("status") != "complete_long_record_pattern_stability_challenge_independent_comparison_pending":
        raise RuntimeError("ERA5-Land long-record pattern is incomplete")
    if era5.get("diagnostics", {}).get("responseRegions") != 971 or len(era5.get("regions", [])) != 971:
        raise RuntimeError("ERA5-Land pattern does not contain the fixed 971-region universe")

    monthly_comparison = monthly.get("comparison", {})
    if monthly.get("status") != "complete_monthly_independent_pattern_ensemble" or monthly_comparison.get("status") != "monthly_independent_pattern_tests_complete_exact_week_challenge_pending":
        raise RuntimeError("Monthly independent-pattern comparison is incomplete")
    if monthly.get("counts") != {
        "models": 22,
        "institutions": 17,
        "regions": 971,
        "years": 73,
        "seasonDefinitions": 2,
        "modelRegionFits": 42_724,
    }:
        raise RuntimeError("Monthly independent-pattern universe changed")

    exact_comparison = exact_week.get("comparison", {})
    if exact_week.get("status") != "complete_exact_week_independent_pattern_ensemble" or exact_comparison.get("status") != "exact_week_independent_pattern_tests_complete":
        raise RuntimeError("Exact-week independent-pattern comparison is incomplete")
    if exact_week.get("counts") != {
        "models": 29,
        "institutions": 21,
        "regions": 971,
        "years": 73,
        "modelRegionFits": 28_159,
    }:
        raise RuntimeError("Exact-week independent-pattern universe changed")
    if monthly_comparison.get("era5PatternDigest") != era5["digest"] or exact_comparison.get("era5PatternDigest") != era5["digest"]:
        raise RuntimeError("Independent comparisons do not reference the same ERA5-Land pattern")

    monthly_tests = validated_view_tests("monthly", monthly_comparison.get("views", {}))
    exact_tests = validated_view_tests("exact_week", {"isoWeek22To35": exact_comparison.get("views", {})})
    if len(monthly_tests) != 20 or len(exact_tests) != 10:
        raise RuntimeError("Frozen comparison-test count changed")
    monthly_passed = all(row["passed"] for row in monthly_tests)
    exact_passed = all(row["passed"] for row in exact_tests)
    if monthly_comparison.get("monthlyTestsPassed") is not monthly_passed:
        raise RuntimeError("Monthly aggregate pass flag does not match the frozen tests")
    if exact_comparison.get("exactWeekTestsPassed") is not exact_passed:
        raise RuntimeError("Exact-week aggregate pass flag does not match the frozen tests")

    tests = monthly_tests + exact_tests
    failed = [row for row in tests if not row["passed"]]
    promoted = not failed
    payload = {
        "version": VERSION,
        "preparedOn": "2026-09-26",
        "status": (
            "regional_pattern_promoted_to_matched_endpoint_input"
            if promoted else "regional_pattern_rejected_for_source_removal_endpoint"
        ),
        "productionRatingsEnabled": 0,
        "purpose": "Apply every frozen independent-pattern test before the ERA5-Land regional slopes can enter a source-removal mortality endpoint.",
        "inputs": {
            "era5PatternDigest": era5["digest"],
            "monthlyIndependentPatternDigest": monthly["digest"],
            "exactWeekIndependentPatternDigest": exact_week["digest"],
        },
        "counts": {
            "regions": 971,
            "monthlyModels": 22,
            "monthlyInstitutions": 17,
            "exactWeekModels": 29,
            "exactWeekInstitutions": 21,
            "frozenTests": len(tests),
            "passedTests": sum(row["passed"] for row in tests),
            "failedTests": len(failed),
        },
        "tests": tests,
        "failedTests": failed,
        "decision": {
            "patternInputAdmittedToMatchedEndpoint": promoted,
            "selectedCentralPattern": (
                "ERA5-Land 1950–2022 full-period region-specific slopes for ISO weeks 22–35"
                if promoted else None
            ),
            "axesAdmitted": 0,
            "scoresChanged": 0,
            "nextGate": (
                "Propagate each compatible annual source-removal GMST history through the admitted regional slopes and all 100 fixed mortality bootstrap fits; retain physical and epidemiological uncertainty separately."
                if promoted else
                "Do not propagate the ERA5-Land slopes into source attribution. Inspect the failed predeclared tests and retain the existing family-calibrated candidates."
            ),
        },
    }
    payload["digest"] = canonical_digest(payload)
    return payload


def write_outputs(payload: dict) -> None:
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n")
    counts = payload["counts"]
    promoted = payload["decision"]["patternInputAdmittedToMatchedEndpoint"]
    REPORT_PATH.write_text(
        "# European temperature–mortality pattern promotion decision\n\n"
        f"Status: **{payload['status'].replace('_', ' ')}**.\n\n"
        f"All {counts['frozenTests']} frozen comparisons are complete: {counts['passedTests']} passed and "
        f"{counts['failedTests']} failed. Pattern admission to the matched endpoint is **{str(promoted).lower()}**.\n\n"
        "This gate changes zero TULIP axes and zero scores. It only controls whether the regional pattern may enter the matched mortality calculation.\n"
    )


def main() -> None:
    payload = decide(verified_json(ERA5_PATH), verified_json(MONTHLY_PATH), verified_json(EXACT_WEEK_PATH))
    write_outputs(payload)
    print(json.dumps({
        "output": str(OUTPUT_PATH.relative_to(ROOT)),
        "status": payload["status"],
        "counts": payload["counts"],
        "patternPromoted": payload["decision"]["patternInputAdmittedToMatchedEndpoint"],
        "digest": payload["digest"],
    }, indent=2))


if __name__ == "__main__":
    main()
