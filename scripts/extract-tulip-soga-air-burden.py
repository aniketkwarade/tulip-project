"""Extract the captured official SoGA export without evaluating spreadsheet cells.

This supplies candidate consequence evidence, not a public scoring input. The
publisher's conflicting edition metadata is retained as an admission failure.
"""
import csv
import hashlib
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "artifacts/tulip-consequence-rule-audit-2026-09-27"
SOURCE = OUT / "soga-2025-source"
EXPECTED = {
    "joint-air-global-dalys.csv": "24366529768811e7b1df124aa8b72946374eff920cc49c8de614a1d356511c31",
    "joint-air-global-dalys-chart.json": "921635405c6a06a3ab3d5dc874af5415e728f44fe8589178c8cb587b1e33f190",
    "joint-air-global-deaths-chart.json": "06cb0d65370a4ac961d614bc0a58e37e07c68733aaf3610077dd07a33bafd5d5",
    "pm25-global-dalys-chart.json": "f6f042ad183daa0c58a1bb92608a656f1a329e3769275ddfda6c8f9c9d9ea832",
    "hap-global-dalys-chart.json": "2f381f903858412811619d96bee333e089e16caed753121b9198101c61d4f073",
    "ozone-global-dalys-chart.json": "667791a3a8c739a867351a864594c5b585f4aaa3f7cf2f94003489bdeb7815a7",
    "no2-global-dalys-chart.json": "0425bc92c61b60ae600e639ecc5807e8a5d915c727a9c61a08aa93d38d459b29",
}


def literal_cell(value):
    # The official exporter wraps text in ="literal". Never execute a formula.
    if value.startswith('="') and value.endswith('"'):
        return value[2:-1]
    if value.startswith("="):
        raise ValueError("Unrecognized formula-shaped source cell")
    return value


def extract_rows(text):
    raw = list(csv.DictReader(io.StringIO(text.lstrip("\ufeff"))))
    decoded = [{literal_cell(k): literal_cell(v) for k, v in row.items()}
               for row in raw]
    rows, footers = [], []
    for row in decoded:
        if not row["Year"]:
            footers.append(row)
            continue
        assert row["Year"].isdigit(), "Unrecognized year"
        for key, expected in {
            "Type": "global", "Region": "global", "Name": "Global",
            "Country": "Global", "Measure": "daly", "Metric": "number",
            "Sex": "Both", "Age Group Name": "All Ages",
            "REI Name": "Air pollution", "Cause Name": "All causes",
            "Pollutant": "airpoll",
        }.items():
            assert row[key] == expected, (key, row[key])
        quantity = {}
        for key, field in [("Burden Lower", "lower"), ("Burden Mean", "central"),
                           ("Burden Upper", "upper")]:
            assert row[key].isdigit(), (key, row[key])
            quantity[field] = int(row[key])
        assert 0 <= quantity["lower"] <= quantity["central"] <= quantity["upper"]
        rows.append({"year": int(row["Year"]), "rowId": row["Burden Id"], **quantity})
    years = [row["year"] for row in rows]
    assert len(years) == len(set(years)), "Duplicate annual outcome"
    assert years == list(range(2010, 2024)), "Captured annual coverage changed"
    citations = [row["Country"] for row in footers if row["Type"] == "citation"]
    assert len(citations) == 1, "Expected one preserved publisher citation"
    return rows, citations[0]


def chart_rows(name):
    data = json.loads((SOURCE / name).read_text())
    assert len(data) == 1 and data[0]["name"] == "Global"
    points = data[0]["data"]
    assert len(points) == len({point[0] for point in points})
    return dict(points)


def main():
    for filename, digest in EXPECTED.items():
        assert hashlib.sha256((SOURCE / filename).read_bytes()).hexdigest() == digest, filename
    rows, citation = extract_rows((SOURCE / "joint-air-global-dalys.csv").read_text(encoding="utf-8-sig"))
    assert {row["year"]: row["central"] for row in rows} == chart_rows("joint-air-global-dalys-chart.json")
    current = next(row for row in rows if row["year"] == 2023)
    metadata = json.loads((SOURCE / "retrieval.json").read_text())
    assert metadata["siteClaimedModel"] == "Global Burden of Disease Study 2023"
    assert "Global Burden of Disease Study 2021" in citation
    marginals = {pollutant: chart_rows(pollutant + "-global-dalys-chart.json")[2023]
                 for pollutant in ["pm25", "hap", "ozone", "no2"]}
    marginal_sum = sum(marginals.values())
    assert marginal_sum != current["central"]
    data_url = (metadata["publishedApiBase"] +
                "burdens/global/find.csv?pollutant=airpoll&type=global&measure=daly&metric=number&names=Global")
    report = {
        "version": "soga_air_health_source_candidate_2026_09_27_v1",
        "nodeId": "air_pollution_health_burden",
        "endpointId": "soga_modeled_air_pollution_attributable_dalys_2023",
        "status": "source_candidate_with_provenance_and_scope_gaps",
        "publicReady": False,
        "sourceUrl": "https://www.stateofglobalair.org/data",
        "sourceDataUrl": data_url,
        "sourceVersion": "soga_2025_public_export_retrieved_2026_09_27",
        "sourceLocator": "CSV Burden Id 1129018; Global; Both; All Ages; All causes; DALY; Number; 2023",
        "sourceArtifactSha256": EXPECTED["joint-air-global-dalys.csv"],
        "inputArtifacts": EXPECTED,
        "scope": {
            "domain": "human", "geography": "global", "year": 2023,
            "sex": "both", "age": "all_ages", "cause": "all_model_included_causes",
            "outcomeKind": "attributable_dalys", "unit": "DALY",
            "reportingPeriodBasis": "single_calendar_year_estimate",
            "normalization": "absolute_total", "route": "published_causal_health_model",
            "counterfactual": "GBD theoretical minimum risk exposure levels; risk-specific details still require source binding",
        },
        "modeledDalys": {key: current[key] for key in ["lower", "central", "upper"]},
        "boundsMeaning": "Publisher model uncertainty limits; SoGA and GBD methodology describe 95% uncertainty intervals, not a distribution manufactured by TULIP",
        "precision": "Values exactly as exported; Burden Mean equals Burden Mean Rounded. Unrounded model draws and an authoritative rounding rule are unavailable in this export.",
        "annualSeries": rows,
        "provenance": {
            "siteClaimedModel": metadata["siteClaimedModel"],
            "clientClaimedEdition": metadata["clientClaimedEdition"],
            "clientClaimedDataYear": metadata["clientClaimedDataYear"],
            "exportFooterCitation": citation,
            "modelVersionResolution": "unresolved_publisher_metadata_conflict",
        },
        "overlapAudit": {
            "use": "Use the parent-risk row once; do not add pollutant marginals or attributable deaths",
            "marginalDalys2023": marginals,
            "marginalSumDiagnosticOnly": marginal_sum,
            "parentRiskDalys2023": current["central"],
            "differenceDiagnosticOnly": marginal_sum - current["central"],
            "decision": "Parent row differs from marginal sum; this alone does not verify the provider's joint-risk formula or identify the included risk set",
        },
        "corroboration": {
            "reportUrl": "https://www.stateofglobalair.org/sites/default/files/documents/2025-10/soga-2025-report.pdf",
            "locator": "Printed and PDF page 5; visually checked",
            "reportedDalysApproximation": 232000000,
            "deathsChart2023": chart_rows("joint-air-global-deaths-chart.json")[2023],
            "reportDeathApproximation": 7900000,
            "interpretation": "Close approximate agreement; not an exact independent reconstruction or a resolution of the contradictory CSV model citation",
            "gbdMethodPaperUrl": "https://ir.library.osaka-u.ac.jp/repo/ouka/all/103533/Lancet_406_10513_1873.pdf",
            "gbdMethodPaperSha256": "c1328b64459fa2b02a1384199b48a163ddadae8fa529795feb4bbefbbf595e70",
            "gbdMethodLocator": "PDF pages 8–9: mediation-adjusted attributable fractions, burden multiplication, uncertainty propagation; page 16: air-pollution risk hierarchy includes nitrogen dioxide",
        },
        "remainingAdmissionGaps": [
            "Resolve GBD 2023 website versus GBD 2021 CSV-footer identity without silently rewriting either source claim",
            "Bind the precise included pollutant–outcome set, risk-specific counterfactuals and parent-risk joint aggregation specification",
            "Match that modeled scope to the catalogue's broader particles/gases/combustion-by-products and relationships; establish whether any omitted outcome is material",
            "Approve the common human-health anchors and cross-model DALY comparability; the current anchors remain TULIP policy candidates",
            "Complete genuinely separate internal source/scope adjudication; two code implementations are only extraction and arithmetic checks",
        ],
        "completedGap": "Global 2023 parent-risk fatal-plus-nonfatal DALY row with reported bounds has been located, captured and checked against the chart",
        "wholeNodeAdmitted": False,
        "publicScoresChanged": False,
    }
    path = OUT / "soga-air-health-source-candidate.json"
    path.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"sourceRows": len(rows), "modeledDalys": report["modeledDalys"],
                      "provenanceConflictRetained": True, "wholeNodeAdmitted": False}, indent=2))


if __name__ == "__main__":
    main()
