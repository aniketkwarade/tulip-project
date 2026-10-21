"""Independent Decimal arithmetic over exported fixed-source calibration cases.

This verifies the JS calculator's math and input bindings, not the scientific
meaning of the synthetic nature examples or whole-node source completeness.
"""
import json
from decimal import Decimal, ROUND_HALF_UP, localcontext
from pathlib import Path

REPORT = Path(__file__).resolve().parents[1] / "artifacts/tulip-consequence-rule-audit-2026-09-27/benchmark-score-kernel-report.json"


def number(value):
    return Decimal(str(value))


def map_quantity(quantity, calibration):
    value = number(quantity)
    points = calibration["points"]
    if value >= number(points[-1]["burden"]):
        return Decimal(10)
    offset = number(calibration["logOffset"])
    for low, high in zip(points, points[1:]):
        if value > number(high["burden"]):
            continue
        low_log = (1 + number(low["burden"]) / offset).ln()
        high_log = (1 + number(high["burden"]) / offset).ln()
        share = ((1 + value / offset).ln() - low_log) / (high_log - low_log)
        return number(low["score"]) + share * (number(high["score"]) - number(low["score"]))
    raise AssertionError("No anchor interval found")


def near(actual, expected):
    assert abs(number(actual) - expected) <= Decimal("1e-11"), (actual, str(expected))


def main():
    report = json.loads(REPORT.read_text())
    assert report["numericalWholeNodeAdmissions"] == 0
    assert report["publicScoresChanged"] is False
    computed = rejected = component_checks = 0
    with localcontext() as ctx:
        ctx.prec = 60
        for case in report["cases"]:
            packet, result = case["packet"], case["result"]
            assert result["value"] is None and result["publicReady"] is False
            if result["status"] not in ("experimental_fixed_domain_composite", "experimental_domain_endpoint"):
                assert result["experimentalValue"] is None
                assert result["experimentalEndpointValue"] is None
                rejected += 1
                continue
            endpoint_only = result["status"] == "experimental_domain_endpoint"
            positions = {key: [] for key in ("central", "lower", "upper")}
            for domain, reference in packet["components"].items():
                row = report["observations"][reference["observationId"]]
                calibration = report["policy"]["calibrations"][reference["calibrationId"]]
                assert packet["nodeId"] in row["nodeIds"]
                assert row["domain"] == domain == calibration["domain"]
                assert reference["calibrationVersion"] == calibration["version"]
                assert reference["sourceVersion"] == row["sourceVersion"]
                assert reference["sourceArtifactSha256"] == row["artifactSha256"]
                for field in ("assessmentPeriod", "geography", "counterfactualId"):
                    assert row[field] == packet[field]
                assert row["consequenceBasis"] == "current_attributable_consequence"
                conversion = number(calibration["inputUnits"][row["unit"]])
                for position in positions:
                    quantity = number(row[position]) * conversion
                    expected = map_quantity(quantity, calibration)
                    near(result["components"][domain]["quantities"][position], quantity)
                    near(result["components"][domain]["unrounded"][position], expected)
                    positions[position].append(expected)
                    component_checks += 1
                assert result["components"][domain]["artifactSha256"] == row["artifactSha256"]
            if len(positions["central"]) == 1:
                assert endpoint_only
                excluded = set(("human", "ecosystem")) - set(packet["components"])
                assert len(excluded) == 1
                for domain in excluded:
                    assert report["exclusions"][packet["nodeId"]][domain]["reviewEvidenceId"]
                    assert report["exclusions"][packet["nodeId"]][domain]["scope"] == "endpoint_only"
                combined = {key: values[0] for key, values in positions.items()}
            else:
                assert not endpoint_only
                assert len(positions["central"]) == 2
                combined = {key: sum(values) / 2 for key, values in positions.items()}
            near(result["unrounded"], combined["central"])
            expected_display = combined["central"].quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)
            if endpoint_only:
                assert result["experimentalValue"] is None
                near(result["experimentalEndpointValue"], expected_display)
            else:
                assert result["experimentalEndpointValue"] is None
                near(result["experimentalValue"], expected_display)
            near(result["range"]["lower"], combined["lower"])
            near(result["range"]["upper"], combined["upper"])
            assert result["range"]["kind"] == ("reported_component_bounds_not_composite" if endpoint_only
                else "propagated_component_envelope_not_joint_confidence_interval")
            assert display_range_contains(result, combined)
            computed += 1
    assert computed == 38 and rejected == 2
    print(json.dumps({"status": "passed", "computed_cases": computed,
        "rejection_cases": rejected, "independent_component_checks": component_checks,
        "whole_node_scores_admitted": 0}, indent=2))


def display_range_contains(result, combined):
    shown = result["displayRange"]
    assert shown["kind"] == result["range"]["kind"]
    assert shown["rounding"] == "outward_to_one_decimal"
    return (number(shown["lower"]) <= combined["lower"] + Decimal("1e-11")
        and number(shown["upper"]) >= combined["upper"] - Decimal("1e-11")
        and number(shown["lower"]) <= number(result["experimentalEndpointValue"]
            if result["status"] == "experimental_domain_endpoint" else result["experimentalValue"]) <= number(shown["upper"]))


if __name__ == "__main__":
    main()
