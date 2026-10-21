"""Independent arithmetic check of the experimental catalogue projection."""

import hashlib
import json
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AUDIT = ROOT / "artifacts/tulip-consequence-rule-audit-2026-09-27/results.json"
SOURCE = ROOT / "artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json"
RULES = ROOT / "src/tulip-consequence-scoring.js"

audit = json.loads(AUDIT.read_text())
source = json.loads(SOURCE.read_text())
assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == audit["inputs"]["reviewedCandidates"]["sha256"]
assert hashlib.sha256(RULES.read_bytes()).hexdigest() == audit["inputs"]["rules"]["sha256"]


def d(value):
    return Decimal(str(value))


def convert(axes):
    index = (d(axes["severity"]) * d("0.5") + d(axes["reach"]) * d("0.25")
             + d(axes["persistence"]) * d("0.25")) / 4
    if index <= d("0.75"):
        return 1 + 8 * index
    if index <= d("0.9375"):
        return 7 + (index - d("0.75")) * d(32) / 3
    return 9 + (index - d("0.9375")) * 16


def display(value):
    return float(value.quantize(d("0.1"), rounding=ROUND_HALF_UP))


rows = {row["nodeId"]: row for row in audit["records"]}
assert len(rows) == len(source["issues"]) == 354
verified = rejected = 0
for item in source["issues"]:
    row = rows[item["nodeId"]]
    domains = item["candidate"]["applicableDomains"]
    axes = [item["candidate"]["components"][domain]["central"] for domain in domains]
    incoherent = any(0 in set(component.values()) and any(level > 0 for level in component.values())
                     for component in axes)
    if incoherent:
        assert row["conditionalValue"] is None
        rejected += 1
        continue
    raw = sum((convert(component) for component in axes), d(0)) / len(axes)
    assert abs(d(row["conditionalRaw"]) - raw) < d("0.00000000001"), item["nodeId"]
    assert row["conditionalValue"] == display(raw), item["nodeId"]
    verified += 1

assert verified == audit["summary"]["catalogue"]["conditionallyScorable"] == 352
assert rejected == audit["summary"]["catalogue"]["requiringConsequenceEvidence"] == 2
assert len(source["responses"]) == audit["summary"]["catalogue"]["responses"] == 27
result = {"status": "passed", "independentlyRecomputed": verified,
          "correctlyRejected": rejected, "responsesExcluded": 27,
          "independentArithmetic": "Python Decimal; separately implemented weights, map, rounding and zero-rejection"}
(AUDIT.parent / "verification.json").write_text(json.dumps(result, indent=2) + "\n")
print(json.dumps(result))
