"""Verify the selected rule against the retained two-policy source experiment.

The ecological damage examples are synthetic. Passing this check verifies
policy arithmetic and provenance, not a common ecological harm unit.
"""
import hashlib
import json
import math
from decimal import Decimal, localcontext
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIR = ROOT / "artifacts/tulip-consequence-rule-audit-2026-09-27"


def D(value):
    return Decimal(str(value))


def near(actual, expected):
    # Decimal recomputation is compared with several chained JS binary64
    # operations. Bound the allowed arithmetic difference by eight ULPs at the
    # result magnitude, with a tiny absolute floor for fractions near zero.
    tolerance = max(Decimal("1e-15"), D(math.ulp(float(expected))) * 8)
    assert abs(D(actual) - expected) <= tolerance, (actual, str(expected), str(tolerance))


def main():
    source_bytes = (DIR / "nature-aggregation-policy-analysis.json").read_bytes()
    source = json.loads(source_bytes)
    report = json.loads((DIR / "nature-area-policy-selection-analysis.json").read_text())
    decision = json.loads((ROOT / "docs/tulip-calibration/nature-aggregation-selection.json").read_text())
    assert report["sourceAnalysisSha256"] == hashlib.sha256(source_bytes).hexdigest()
    assert report["sourceExtentReferences"] == source["sourceExtentReferences"]
    assert report["selectedPolicyId"] == decision["selectedExperimentPolicyId"] == "area_two_family_emphasis"
    assert report["decisionVersion"] == decision["version"]
    assert report["natureScore"] is None and report["publicReady"] is False
    assert report["globalNatureCalibrationPassed"] is False
    old_by_id = {case["id"]: case for case in source["cases"]}
    assert len(old_by_id) == len(report["selectedResults"]) == 5
    with localcontext() as ctx:
        ctx.prec = 50
        areas = {key: D(ref["mappedExtentKm2"]) for key, ref in source["sourceExtentReferences"].items()}
        total_area = sum(areas.values())
        near(report["fixedCompatibleGroupAreaKm2"], total_area)
        for case in report["selectedResults"]:
            original = old_by_id[case["id"]]
            assert case["type"] == original["type"]
            assert case["affectedShare"] == original["extent"]
            assert case["degradationFraction"] == original["severity"]
            loss = areas[case["type"]] * D(case["affectedShare"]) * D(case["degradationFraction"])
            near(case["lossEquivalentAreaKm2"], loss)
            near(case["index"], loss / total_area)
            near(case["equalFamilyAlternativeIndex"], D("0.5") * loss / areas[case["type"]])
        for case in report["sameLossAcrossFamilies"]:
            loss = D(case["comparableLossKm2"])
            near(case["areaIndex"], loss / total_area)
            near(case["equalFamilyIndex"], D("0.5") * loss / areas[case["type"]])
        near(report["equalFamilyPerAreaMangrovePremiumRelativeToReef"], areas["mapped_coral_reef"] / areas["mapped_mangrove"])
        children = sum(D(value) for value in report["refinement"]["childLossesKm2"])
        assert children == D(report["refinement"]["originalLossKm2"])
    print(json.dumps({"status": "passed", "existing_cases": 5, "cross_family_equal_amount_cases": 2,
        "subtype_refinement_invariant": True, "selected_principle": decision["selectedPrinciple"],
        "numerical_nature_scores_admitted": 0}, indent=2))


if __name__ == "__main__":
    main()
