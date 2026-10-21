#!/usr/bin/env python3
"""Reproduce source-native historical model references; never export ratings."""
from collections import defaultdict
from decimal import Decimal, localcontext
from pathlib import Path
import hashlib
import json
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / "artifacts/tulip-calibration-completion-2026-09-28"
WORKBOOK = DIRECTORY / "industrial-health-source/41598_2023_38075_MOESM2_ESM.xlsx"
EXPECTED = "a7f081e214c1a32f884cef0c2dca7ade5d2c392b74bb328f251d63f3c431d044"
SOURCE = "https://www.nature.com/articles/s41598-023-38075-z"
NS = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
DIRECT = ["HEALTH_IMPACTS_PM2.5_DALY_PER_YEAR", "HEALTH_IMPACTS_SO2_DALY_PER_YEAR",
          "HEALTH_IMPACTS_NOX_DALY_PER_YEAR", "HEALTH_IMPACTS_NH3_DALY_PER_YEAR"]


def column(ref):
    value = 0
    for letter in ref:
        if not letter.isalpha():
            break
        value = value * 26 + ord(letter) - ord("A") + 1
    return value - 1


def mapped(amount, points):
    if amount >= Decimal(str(points[-1]["burden"])):
        return Decimal(10)
    for low, high in zip(points, points[1:]):
        lower, upper = Decimal(str(low["burden"])), Decimal(str(high["burden"]))
        if amount > upper:
            continue
        share = ((amount + 1).ln() - (lower + 1).ln()) / ((upper + 1).ln() - (lower + 1).ln())
        return Decimal(low["score"]) + share * Decimal(high["score"] - low["score"])
    raise AssertionError("unmapped quantity")


def main():
    digest = hashlib.sha256(WORKBOOK.read_bytes()).hexdigest()
    assert digest == EXPECTED
    with zipfile.ZipFile(WORKBOOK) as archive:
        strings = ["".join(si.itertext()) for si in ET.fromstring(archive.read("xl/sharedStrings.xml"))]
        sheet = ET.fromstring(archive.read("xl/worksheets/sheet25.xml"))
    rows = {}
    for row in sheet.findall("s:sheetData/s:row", NS):
        values = {}
        for cell in row.findall("s:c", NS):
            v = cell.find("s:v", NS)
            if v is None or v.text is None:
                continue
            values[column(cell.attrib["r"])] = strings[int(v.text)] if cell.attrib.get("t") == "s" else Decimal(v.text)
        rows[int(row.attrib["r"])] = values
    header = rows[4]
    source_rows, groups, seen = [], defaultdict(list), set()
    for row_number, cells in rows.items():
        if row_number < 5 or not cells.get(0):
            continue
        row = {name: cells.get(index) for index, name in header.items()}
        key = (row["EMISSION_SOURCE"], row["SOURCE_SUBCATEGORY"])
        assert key not in seen, key
        seen.add(key)
        for field in DIRECT + ["HEALTH_IMPACTS_CO2_DALY_PER_YEAR"]:
            assert isinstance(row[field], Decimal) and row[field].is_finite() and row[field] >= 0, (row_number, field)
        item = {
            "sourceRow": row_number, "sourceCategory": key[0], "sourceSubcategory": key[1],
            "directPmHealthDalysPerYearExact": str(sum(row[field] for field in DIRECT)),
            "byPollutantExact": {field: str(row[field]) for field in DIRECT},
            "co2HealthDalysPerYearExcludedExact": str(row["HEALTH_IMPACTS_CO2_DALY_PER_YEAR"]),
        }
        source_rows.append(item)
        groups[key[0]].append(item)
    assert len(source_rows) == 26
    assert set(groups) == {"Coal power plants", "Gas power plants", "Oil power plants", "Steel mills", "Oil refineries", "Cement plants"}
    policy = json.loads((ROOT / "src/tulip-consequence-policy-v1.json").read_text())
    points = policy["human"]["points"]
    references = []
    for name, records in groups.items():
        total = sum(Decimal(row["directPmHealthDalysPerYearExact"]) for row in records)
        references.append({
            "sourceCategory": name, "sourceRows": [row["sourceRow"] for row in records],
            "quantityExact": str(total), "unit": "DALY_per_year",
            "byPollutantExact": {field: str(sum(Decimal(row["byPollutantExact"][field]) for row in records)) for field in DIRECT},
            "sourceYear": 2016,
            "reportedAccounting": "site_specific_model_characterization_of_annual_emissions",
            "quantityRole": "historical_model_health_magnitude_reference_not_current_whole_node_burden",
            "modelBasis": "PM fate and effect characterization; not a reproduced full node-removal counterfactual",
            "benchmarkDiagnosticExact": str(mapped(total, points)),
            "wholeHumanCoverage": False, "wholeNatureCoverage": False,
            "replacementValue": None, "publicReady": False,
        })
    cement = next(row for row in references if row["sourceCategory"] == "Cement plants")
    old = json.loads((ROOT / "artifacts/tulip-calibration-2026-09-22/cement-concrete-consequence-reference-snapshot.json").read_text())
    assert abs(Decimal(cement["quantityExact"]) - Decimal(str(old["evidence"]["directHumanHealth"]["directNonCo2DalyPerYear"]))) < Decimal("0.000001")
    report = {
        "version": "tulip_industrial_health_reference_reproduction_2026_09_28_v1",
        "status": "six_historical_health_magnitude_references_reproduced_no_node_ratings_admitted",
        "sourceUrl": SOURCE,
        "sourceDataUrl": "https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41598-023-38075-z/MediaObjects/41598_2023_38075_MOESM2_ESM.xlsx",
        "locator": "Supplementary table 24, sheet named 24, worksheet member sheet25.xml, rows 5–30, columns I–L; CO2 column H excluded",
        "workbookPath": str(WORKBOOK.relative_to(ROOT)), "workbookSha256": digest,
        "policyVersion": policy["version"],
        "policySha256": hashlib.sha256((ROOT / "src/tulip-consequence-policy-v1.json").read_bytes()).hexdigest(),
        "summary": {"sourceRows": len(source_rows), "referenceCategories": len(references),
                    "blankHealthCellsTreatedAsZero": 0, "duplicateSourceCategoryRows": 0,
                    "completedReplacementRatings": 0, "publicScoreChanges": 0},
        "sourceRows": source_rows, "references": references,
        "obsoleteRequirementsRemoved": [
            "A DALY endpoint does not need a harmed-person count to calculate its health magnitude.",
            "Years already incorporated in a DALY endpoint must not be multiplied by a separate persistence score.",
            "Fatal/nonfatal decomposition is informative but not required merely to map a supported combined DALY amount.",
        ],
        "remainingRequirements": [
            "Justify the latest available compatible assessment period and disclose the 2016 source year and lag; a later-period estimate requires a supported model update, not relabeling.",
            "Source-specific review of accounting timebase and marginal versus full-removal attribution before comparison with current burden.",
            "Coverage of the actual node boundary, including omitted human outcomes and their overlap.",
            "A separate supported nature assessment under the selected ecological calibration.",
        ],
        "limitations": [
            "These are historical model references. Numerical mapping alone does not establish current causal harm or a calibrated node score.",
            "CO2 impact columns are deliberately excluded because their pathways and time accounting differ; none is added to direct PM health loss.",
            "Point values do not supply uncertainty intervals; no artificial interval or probability distribution is manufactured.",
        ], "publicReady": False,
    }
    (DIRECTORY / "industrial-health-references.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"status": report["status"], **report["summary"]}, indent=2))


if __name__ == "__main__":
    with localcontext() as context:
        context.prec = 60
        main()
