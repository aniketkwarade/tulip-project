#!/usr/bin/env python3
"""Separate Decimal reproduction of experimental arithmetic, not science review."""
from decimal import Decimal, localcontext
from pathlib import Path
import hashlib
import json


ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / "artifacts/tulip-consequence-calibration-v1-2026-09-28"


def read(path):
    return json.loads(path.read_text())


def number(value):
    return Decimal(str(value))


def check_near(actual, expected, tolerance="0.000000001"):
    assert abs(number(actual) - expected) < Decimal(tolerance), (actual, str(expected))


def mapped(quantity, points, offset=1):
    quantity, offset = number(quantity), number(offset)
    assert quantity >= 0 and offset > 0
    if quantity >= number(points[-1]["burden"]):
        return Decimal(10)
    for low, high in zip(points, points[1:]):
        if quantity > number(high["burden"]):
            continue
        low_log = (number(low["burden"]) + offset).ln()
        high_log = (number(high["burden"]) + offset).ln()
        share = ((quantity + offset).ln() - low_log) / (high_log - low_log)
        return number(low["score"]) + share * number(high["score"] - low["score"])
    raise AssertionError("unmapped nonnegative quantity")


def main():
    policy = read(ROOT / "src/tulip-consequence-policy-v1.json")
    candidate = read(DIRECTORY / "candidate-check.json")
    catalogue = read(DIRECTORY / "catalogue-assessments.json")
    pinned_health = read(ROOT / "artifacts/tulip-calibration-closeout-2026-09-28/health-benchmark-source-check.json")
    hashes = {}
    for relative, expected in candidate["inputs"].items():
        actual = hashlib.sha256((ROOT / relative).read_bytes()).hexdigest()
        assert actual == expected, relative
        hashes[relative] = actual
    for relative, expected in catalogue["inputs"].items():
        assert hashlib.sha256((ROOT / relative).read_bytes()).hexdigest() == expected, relative
    assert candidate["policyVersion"] == policy["version"] == catalogue["methodVersion"]
    assert policy["weights"] == {"human": 0.5, "ecosystem": 0.5}
    assert policy["human"]["referenceSha256"] == pinned_health["inputs"][
        "artifacts/tulip-consequence-rule-audit-2026-09-27/who-ghe2021-daly-global.xlsx"]
    assert policy["human"]["points"][-1]["burden"] == pinned_health["selectedBenchmarks"][-1]["burden"]
    assert not any(policy["admission"][key] for key in (
        "scientificCalibrationApproved", "wholeNodeNumericalRatingsApproved", "publicReady"))
    for item in candidate["anchorCases"]:
        result = item["result"]
        h = mapped(item["humanQuantity"], policy["human"]["points"])
        n = mapped(item["ecosystemQuantity"], policy["ecosystem"]["points"])
        check_near(result["components"]["human"]["mapped"]["central"], h)
        check_near(result["components"]["ecosystem"]["mapped"]["central"], n)
        check_near(result["unrounded"], (h + n) / 2)
        assert result["value"] is None and result["publicReady"] is False
    for item in candidate["sensitivityCases"]:
        for trial in item["bridgeReadings"]:
            hq = number(item["health"]) + number(trial["functionBridgeFactor"]) * number(item["functionYears"])
            score = (mapped(hq, policy["human"]["points"]) + mapped(item["natureKm2"], policy["ecosystem"]["points"])) / 2
            check_near(trial["unrounded"], score)
    for item in candidate["naturePolicyChallenges"]:
        q = number(item["areaKm2"]) * sum(map(number, item["losses"])) / 6
        check_near(item["quantity"], q)
        check_near(item["component"], mapped(q, policy["ecosystem"]["points"]))
        for trial in item["reweightEachClassTwice"]:
            weighted = sum(number(loss) * (2 if index == trial["classIndex"] else 1)
                           for index, loss in enumerate(item["losses"]))
            changed = number(item["areaKm2"]) * weighted / 7
            check_near(trial["quantity"], changed)
            check_near(trial["component"], mapped(changed, policy["ecosystem"]["points"]))
    joint = candidate["jointSourceCaseControl"]["result"]
    for key, hq, nq in (("lower", 945000, 7500), ("central", 1050000, 10000), ("upper", 1155000, 12500)):
        check_near(joint["components"]["human"]["quantities"][key], number(hq))
        check_near(joint["components"]["ecosystem"]["quantities"][key], number(nq))
        score = (mapped(hq, policy["human"]["points"]) + mapped(nq, policy["ecosystem"]["points"])) / 2
        check_near(joint["unrounded"] if key == "central" else joint["range"][key], score)
    # Source-inspired coefficient check. This is not a Bangladesh reproduction.
    check_near(4200, number(36500000) * number(policy["human"]["displacementPrototype"]["reductionInFunction"]) / 365)
    radius = number(policy["ecosystem"]["outerReference"]["radiusKm"])
    pi = Decimal("3.14159265358979323846264338327950288419716939937510582097494459")
    spherical_surface = 4 * pi * radius * radius
    assert abs(spherical_surface - number(policy["ecosystem"]["points"][-1]["burden"])) / spherical_surface < Decimal("0.001")

    records = catalogue["records"]
    assert len(records) == len({item["nodeId"] for item in records}) == 381
    issues = [item for item in records if item["nodeKind"] == "issue"]
    responses = [item for item in records if item["nodeKind"] == "response"]
    assert len(issues) == 354 and len(responses) == 27
    assert all(item["value"] is None and item["experimentalValue"] is None and not item["publicReady"] for item in records)
    assert all(set(item["components"]) == {"human", "ecosystem"} for item in issues)
    assert all(item["status"] == "outside_danger_scoring" for item in responses)
    public = read(ROOT / "public/tulip-assessments.json")["records"]
    assert all(item["currentPublicValueRetained"] == public[item["nodeId"]]["value"] for item in issues)
    assert sum(component["positionWasPreviouslyOutsideDraftScope"] for item in issues for component in item["components"].values()) == 190
    assert sum(component["uncertaintyCorrection"].startswith("incoherent") for item in issues for component in item["components"].values()) == 132
    assert sum(any(component["uncertaintyCorrection"].startswith("incoherent") for component in item["components"].values()) for item in issues) == 110
    assert sum(item["centralWaterRepair"] is not None for item in issues) == 2
    assert len(catalogue["originalTwenty"]) == 20
    report = {
        "version": "tulip_consequence_candidate_decimal_reproduction_2026_09_28_v1",
        "status": "separate_arithmetic_and_catalogue_reproduction_passed_not_scientific_calibration",
        "precisionDigits": 60,
        "inputs": hashes,
        "checks": {"anchorControls": len(candidate["anchorCases"]), "bridgeSensitivityReadings": 9,
                   "natureTradeoffCases": 4, "classReweightingReadings": 24,
                   "matchedCaseEnvelopeReadings": 3, "catalogueRecords": len(records)},
        "sphericalEarthSurfaceKm2": str(spherical_surface),
        "wholeNodeReplacementRatings": 0,
        "publicScoresChanged": 0,
        "scientificIndependentReview": False,
        "limitation": "Arithmetic reproduced by another implementation. All complete composite cases are synthetic; wellbeing and ecological exchange rates and real causal profiles remain unvalidated.",
    }
    (DIRECTORY / "decimal-reproduction.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"status": report["status"], **report["checks"]}, indent=2))


if __name__ == "__main__":
    with localcontext() as context:
        context.prec = 60
        main()
