"""Reproduce captured allocation arithmetic from pinned JSON, without JS imports."""
from decimal import Decimal, localcontext
from hashlib import sha256
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / "artifacts/tulip-consequence-rule-audit-2026-09-27"


def read(name):
    raw = (DIRECTORY / name).read_bytes()
    return raw, json.loads(raw, parse_float=Decimal)


fixture_bytes, fixture = read("synthetic-modeled-allocation-fixture.json")
before_bytes, before = read("modeled-allocation-v1-challenge.json")
_, after = read("modeled-allocation-binding-audit.json")
parent_bytes, parent = read("who-joint-air-pollution-dalys-2021-report.json")
baseline_bytes, baseline = read("who-joint-air-counterfactual-definition.json")
assert after["syntheticFixtureArtifactSha256"] == sha256(fixture_bytes).hexdigest()
assert after["beforeArtifactSha256"] == sha256(before_bytes).hexdigest()
assert fixture["parentSourceArtifactSha256"] == sha256(parent_bytes).hexdigest()
assert fixture["parentCounterfactualArtifactSha256"] == sha256(baseline_bytes).hexdigest()
assert fixture["parentCounterfactualId"] == baseline["id"]
assert fixture["parentCounterfactualVersion"] == baseline["version"]
assert fixture["synthetic"] is True and fixture["publicReady"] is False
assert fixture["assessmentPeriod"] == str(parent["scope"]["year"])
assert fixture["reportingPeriodBasis"] == parent["scope"]["reportingPeriodBasis"]

positions = ("lower", "central", "upper")
quantity_keys = {"lower": "lower95", "central": "central", "upper": "upper95"}
reading = after["registeredFixtureReading"]
with localcontext() as context:
    context.prec = 60
    for position in positions:
        case = fixture["jointCases"][position]
        source_quantity = Decimal(parent["modeledDalys"][quantity_keys[position]])
        assert Decimal(case["parentDalys"]) == source_quantity
        fraction = Decimal(case["burdenFraction"])
        assert Decimal(0) <= fraction <= Decimal(1)
        assert Decimal(reading["burden"][position]) == source_quantity * fraction
        assert Decimal(before["cases"][0]["result"]["burden"][position]) == source_quantity * fraction
    # Reproduce the four stored v1 readings, including the intentionally
    # changed parent in one case. Reproduction does not validate that input.
    old_products = 0
    for case in before["cases"]:
        assert case["result"]["status"] == "modeled_endpoint_candidate"
        for position in positions:
            entered = case["input"]["allocationObservation"]["jointCases"][position]
            assert Decimal(case["result"]["burden"][position]) == (
                Decimal(entered["parentDalys"]) * Decimal(entered["burdenFraction"]))
            old_products += 1

assert len(after["rejectedCallerOverrides"]) == len(before["cases"]) == 4
for case in after["rejectedCallerOverrides"]:
    assert case["afterBurden"] is None
    assert case["afterStatus"] == "needs_consequence_conversion"
    assert "packet_allocation_or_parent_overrides_forbidden" in case["reasons"]
assert reading["evidenceStatus"] == "synthetic_mechanics_fixture"
assert reading["publicReady"] is False and reading["score"] is None
assert reading["boundsMeaning"] == "invented_matched_cases_not_a_probability_interval"
assert after["realRegisteredAllocations"] == 0
assert after["numericalWholeNodeAdmissions"] == 0
assert after["publicScoresChanged"] is False
assert after["defaultRegistryResult"]["burden"] is None
print(json.dumps({"status": "passed", "independent_decimal_products": old_products + 3,
                  "pinned_artifacts": 4, "refused_caller_overrides": 4,
                  "real_models_approved": 0, "whole_node_admissions": 0}, indent=2))
