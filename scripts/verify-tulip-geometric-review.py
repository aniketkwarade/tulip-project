"""Recompute the experimental geometric catalogue values independently with Decimal."""

import json
from decimal import Decimal, localcontext, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "artifacts/tulip-consequence-rule-audit-2026-09-27"
ledger = json.loads((OUT / "review-ledger.json").read_text())
source = json.loads((ROOT / "artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json").read_text())
nodes = {node["nodeId"]: node for node in ledger["nodes"]}


def d(value):
    return Decimal(str(value))


with localcontext() as context:
    context.prec = 50
    third = d(1) / d(3)
    nine = (d(3) / d(4)) ** third

    def component(axes):
        levels = [d(axes[key]) for key in ("severity", "reach", "persistence")]
        if min(levels) == 0 and max(levels) > 0:
            return None
        index = (levels[0] * levels[1] * levels[2] / d(64)) ** third if min(levels) > 0 else d(0)
        if index <= d("0.75"):
            return d(1) + d(8) * index
        if index <= nine:
            return d(7) + d(2) * (index - d("0.75")) / (nine - d("0.75"))
        return d(9) + (index - nine) / (d(1) - nine)

    checked = failed = 0
    for item in source["issues"]:
        row = nodes[item["nodeId"]]
        scores = [component(item["candidate"]["components"][domain]["central"])
                  for domain in item["candidate"]["applicableDomains"]]
        if None in scores:
            assert row["conditionalGeometricValue"] is None, item["nodeId"]
            failed += 1
            continue
        raw = sum(scores, d(0)) / len(scores)
        shown = float(raw.quantize(d("0.1"), rounding=ROUND_HALF_UP))
        assert shown == row["conditionalGeometricValue"], item["nodeId"]
        checked += 1

    assert checked == 352 and failed == 2
    assert len(ledger["responses"]) == 27
    assert sum(len(node["domainReviews"]) for node in ledger["nodes"]) == 518
    result = {"status": "passed", "independentlyRecomputed": checked,
              "correctlyRejectedCentral": failed, "responsesExcluded": 27,
              "precision": "Python Decimal, 50 digits; separate cube-root, benchmark-map and rounding implementation",
              "limitation": "Arithmetic agreement does not validate the source-to-outcome mappings or the chosen ordinal scale."}
    (OUT / "geometric-verification.json").write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result))
