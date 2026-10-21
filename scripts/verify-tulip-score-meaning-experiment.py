"""Independently reproduce the experiment from raw axes with exact decimal arithmetic."""
import hashlib
import json
from decimal import Decimal, localcontext, ROUND_HALF_UP
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts/tulip-score-meaning-test-2026-09-27"
report = json.loads((OUT / "results.json").read_text())
catalogue = json.loads((ROOT / report["inputs"]["catalogue"]["path"]).read_text())
anchors = json.loads((ROOT / report["inputs"]["anchors"]["path"]).read_text())
D = Decimal
AXES = ("severity", "reach", "persistence")
variants = [v["id"] for v in report["variants"]]


def index(vector):
    return D(sum(vector if isinstance(vector, list) else (vector[k] for k in AXES))) / D(12)


def convert(value, variant):
    if variant == "linear":
        return D(1) + D(9) * value
    if variant.startswith("power"):
        return D(1) + D(9) * (value ** (D(6) / D(5)))
    # Independently interpolate the six declared knots instead of using the JS branches.
    knots = [(D(0), D(1))] + [
        (index(a["humanReference"]["legacyAxes"]), D(a["targetScore"]))
        for a in anchors["anchors"]
    ] + [(D(1), D(10))]
    for (xa, ya), (xb, yb) in zip(knots, knots[1:]):
        if xa <= value <= xb:
            return ya + (yb - ya) * (value - xa) / (xb - xa)
    raise AssertionError("Outside defined mapping")


def combine(values, variant, human_weight=D("0.5")):
    if len(values) == 1:
        return convert(next(iter(values.values())), variant)
    if variant.endswith("domains"):
        return human_weight * convert(values["human"], variant) + (1 - human_weight) * convert(values["ecosystem"], variant)
    return convert(human_weight * values["human"] + (1 - human_weight) * values["ecosystem"], variant)


def one_decimal(value):
    # Decimal intermediate values can lie infinitesimally either side of an exact half.
    return (value + D("1e-35")).quantize(D("0.1"), rounding=ROUND_HALF_UP)


maximum_difference = D(0)
comparisons = 0


def check(expected, supplied):
    global maximum_difference, comparisons
    delta = abs(expected - D(str(supplied)))
    assert delta < D("1e-10"), (expected, supplied)
    maximum_difference = max(maximum_difference, delta)
    comparisons += 1


with localcontext() as ctx:
    ctx.prec = 45
    for source in report["inputs"].values():
        assert hashlib.sha256((ROOT / source["path"]).read_bytes()).hexdigest() == source["sha256"]
    output_rows = {row["nodeId"]: row for row in report["rows"]}
    raw_values = {v: [] for v in variants}
    displayed_values = {v: [] for v in variants}
    range_counts = {v: 0 for v in variants}
    for issue in catalogue["issues"]:
        candidate = issue["candidate"]
        for variant in variants:
            actual = output_rows[issue["nodeId"]]["results"][variant]
            results = {}
            for estimate in ("lower", "central", "upper"):
                values = {domain: index(candidate["components"][domain][estimate]) for domain in candidate["applicableDomains"]}
                results[estimate] = combine(values, variant)
            check(results["central"], actual["raw"])
            check(one_decimal(results["central"]), actual["displayed"])
            check(one_decimal(results["lower"]), actual["lower"])
            check(one_decimal(results["upper"]), actual["upper"])
            check(results["upper"] - results["lower"], actual["rawRangeWidth"])
            raw_values[variant].append(results["central"])
            displayed_values[variant].append(one_decimal(results["central"]))
            range_counts[variant] += int(one_decimal(results["upper"]) - one_decimal(results["lower"]) > D(3))
            central_values = {domain: index(candidate["components"][domain]["central"]) for domain in candidate["applicableDomains"]}
            weight_changes = [abs(combine(central_values, variant, D(w)) - results["central"]) for w in ("0.3", "0.7")]
            check(max(weight_changes), actual["weightMaximumChange"])
            axis_changes = []
            for domain in candidate["applicableDomains"]:
                for axis in AXES:
                    for direction in (-1, 1):
                        if not 0 <= candidate["components"][domain]["central"][axis] + direction <= 4:
                            continue
                        perturbed = dict(central_values)
                        perturbed[domain] += D(direction) / D(12)
                        axis_changes.append(abs(combine(perturbed, variant) - results["central"]))
            check(max(axis_changes), actual["oneAxisMaximumChange"])

    for row, anchor in zip(report["anchorResults"], anchors["anchors"]):
        values = {domain: index(anchor[f"{domain}Reference"]["legacyAxes"]) for domain in ("human", "ecosystem")}
        for variant in variants:
            value = combine(values, variant)
            check(value, row["results"][variant]["raw"])
            check(abs(value - D(anchor["targetScore"])), row["results"][variant]["absoluteError"])

    by_target = {a["targetScore"]: a for a in anchors["anchors"]}
    for pair in report["mixedPairs"]:
        values = {
            "human": index(by_target[pair["humanTarget"]]["humanReference"]["legacyAxes"]),
            "ecosystem": index(by_target[pair["ecosystemTarget"]]["ecosystemReference"]["legacyAxes"]),
        }
        for variant in variants:
            check(combine(values, variant), pair["results"][variant]["raw"])

    for variant in variants:
        summary = report["catalogueSummary"][variant]
        values = displayed_values[variant]
        assert len(set(values)) == summary["distinctDisplayedScores"]
        assert sum(value >= 6 for value in values) == summary["atLeastSix"]
        assert range_counts[variant] == summary["rangesWiderThanThree"]
        ordered = sorted(values)
        check((ordered[176] + ordered[177]) / D(2), summary["median"])
        reversals = splits = 0
        for i in range(len(values)):
            for j in range(i + 1, len(values)):
                before = raw_values["linear"][i] - raw_values["linear"][j]
                after = raw_values[variant][i] - raw_values[variant][j]
                if abs(before) < D("1e-30") and abs(after) > D("1e-30"):
                    splits += 1
                elif abs(before) > D("1e-30") and abs(after) > D("1e-30") and before * after < 0:
                    reversals += 1
        assert reversals == summary["strictRankReversals"], (variant, reversals)
        assert splits == summary["tiedPairsSplit"], (variant, splits)

    for stress in report["stressCases"]:
        # Recover the rational twelfth behind a JSON decimal index.
        values = {key: D(round(value * 12)) / D(12) for key, value in stress["indices"].items()}
        for variant in variants:
            check(combine(values, variant), stress["results"][variant]["raw"])

    summary = {
        "status": "passed",
        "implementation": "Python standard-library Decimal at 45-digit precision, with knot interpolation independent of the JS branch formula",
        "inputHashesMatched": len(report["inputs"]),
        "numericalComparisons": comparisons,
        "maximumAbsoluteDifference": str(maximum_difference),
        "catalogueIssues": len(catalogue["issues"]),
        "variants": len(variants),
        "rankPairsPerVariant": len(catalogue["issues"]) * (len(catalogue["issues"]) - 1) // 2,
        "limitations": "A second arithmetic implementation is not independent scientific validation of the benchmarks or source-to-axis mappings.",
    }
    (OUT / "verification.json").write_text(json.dumps(summary, indent=2) + "\n")
    print(json.dumps(summary, indent=2))
