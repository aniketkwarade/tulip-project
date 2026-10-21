"""Reproduce figure-summary quantities without calling them current harm."""
from pathlib import Path
import hashlib
import json
import statistics
import openpyxl

OUT = Path(__file__).resolve().parents[1] / "artifacts/tulip-consequence-rule-audit-2026-09-27"
metadata = json.loads((OUT / "meltwater-source/retrieval.json").read_text())
path = OUT / "meltwater-source/source-data.xlsx"
assert hashlib.sha256(path.read_bytes()).hexdigest() == metadata["workbookSha256"]
sheet = openpyxl.load_workbook(path, read_only=True, data_only=True)["Fig-3"]
rows = []
for values in sheet.iter_rows(min_row=4, max_row=34, values_only=True):
    year, per_with, per_without, season_with, season_without = values[:5]
    assert isinstance(year, int)
    assert all(isinstance(v, int) and v >= 0 for v in [per_with, per_without, season_with, season_without])
    rows.append({"year": year, "perennialWith": per_with, "perennialWithout": per_without,
                 "seasonalOnlyWith": season_with, "seasonalOnlyWithout": season_without,
                 "totalWith": per_with + season_with, "totalWithout": per_without + season_without,
                 "bufferedCount": per_without + season_without - per_with - season_with,
                 "perennialReduction": per_without - per_with,
                 "seasonalOnlyReduction": season_without - season_with})
assert [row["year"] for row in rows] == list(range(1990, 2021))
periods = []
for start in [1990, 2000, 2010]:
    values = [row["bufferedCount"] for row in rows if start <= row["year"] < start + 10]
    periods.append({"startYear": start, "endYear": start + 9, "annualRows": len(values),
                    "meanBufferedPopulation": statistics.mean(values),
                    "interannualPopulationStandardDeviation": statistics.pstdev(values),
                    "uncertaintyMeaning": "Interannual variability, not a confidence interval or assessment bound"})
assert round(periods[0]["meanBufferedPopulation"] / 1e6, 1) == 12.3
assert round(periods[0]["interannualPopulationStandardDeviation"] / 1e6, 1) == 3.3
assert round(periods[2]["meanBufferedPopulation"] / 1e6, 1) == 18.8
assert round(periods[2]["interannualPopulationStandardDeviation"] / 1e6, 1) == 4.5
report = {
    "version": "tulip_regional_meltwater_source_audit_2026_09_27_v1",
    "source": metadata, "rows": rows, "periodChecks": periods, "sourceRowsReproduced": 31,
    "annualClassOverlapAssumption": "The notebook defines perennial and seasonal-only classes as mutually exclusive. Sums reproduce the published union-population summary under that rule; they do not verify actual city-level uniqueness.",
    "seasonalClassDeclineWarning": "Every annual seasonal-only difference is negative: some people may move from perennial to seasonal-only scarcity with meltwater. Inspect the union rather than interpreting seasonal-class growth as additional harm.",
    "seasonalOnlyReductionNegativeYears": sum(row["seasonalOnlyReduction"] < 0 for row in rows),
    "actualCatchmentReclassification": False, "currentHarmQuantity": None,
    "publicReady": False, "wholeNodeAdmitted": False,
    "reason": "Historical, regional modeled avoidance benefit combines snow and glacier melt. It is not a present global glacier-attributable harm estimate; class-method and missing-input issues also remain unresolved.",
}
(OUT / "regional-meltwater-source-audit.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps({"rows": len(rows), "periodChecks": periods,
                  "negativeSeasonalClassDifferenceYears": report["seasonalOnlyReductionNegativeYears"],
                  "currentHarmQuantity": None}, indent=2))
