"""Challenge consequence-source grain and parsing, including real export quirks."""
import csv
import importlib.util
import io
import json
import unittest
from pathlib import Path

SCRIPT = Path(__file__).with_name("extract-tulip-soga-air-burden.py")
SPEC = importlib.util.spec_from_file_location("soga_extract", SCRIPT)
EXTRACT = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(EXTRACT)
TEXT = (EXTRACT.SOURCE / "joint-air-global-dalys.csv").read_text(encoding="utf-8-sig")


def changed_row(field, value):
    rows = list(csv.reader(io.StringIO(TEXT)))
    headers = [EXTRACT.literal_cell(cell) for cell in rows[0]]
    row = next(row for row in rows[1:] if row[0] == "1129018")
    row[headers.index(field)] = '="' + value + '"'
    output = io.StringIO()
    csv.writer(output).writerows(rows)
    return output.getvalue()


class SoGASourceReview(unittest.TestCase):
    def test_selected_annual_outcome_not_historical_sum(self):
        rows, footer = EXTRACT.extract_rows(TEXT)
        self.assertEqual(rows[-1], {"year": 2023, "rowId": "1129018",
                                  "lower": 194000000, "central": 232500000, "upper": 264100000})
        self.assertEqual(len(rows), 14)
        self.assertIn("Global Burden of Disease Study 2021", footer)
        self.assertNotEqual(sum(row["central"] for row in rows), rows[-1]["central"])

    def test_refuse_rates_age_standardized_subgroups_and_different_risks(self):
        for field, value in [("Metric", "rate"), ("Measure", "death"),
                             ("Age Group Name", "Age-standardized"), ("Sex", "Female"),
                             ("Name", "Europe"), ("Pollutant", "pm25"),
                             ("REI Name", "Ambient ozone pollution"), ("Cause Name", "COPD")]:
            with self.subTest(field=field), self.assertRaises(AssertionError):
                EXTRACT.extract_rows(changed_row(field, value))

    def test_refuse_inverted_uncertainty_and_negative_harm(self):
        for field, value in [("Burden Lower", "250000000"),
                             ("Burden Upper", "200000000"), ("Burden Mean", "-1")]:
            with self.subTest(field=field), self.assertRaises(AssertionError):
                EXTRACT.extract_rows(changed_row(field, value))

    def test_refuse_duplicate_year(self):
        line = next(line for line in TEXT.splitlines() if line.startswith("1129018,"))
        with self.assertRaises(AssertionError):
            EXTRACT.extract_rows(TEXT + "\n" + line + "\n")

    def test_refuse_year_transfer(self):
        with self.assertRaises(AssertionError):
            EXTRACT.extract_rows(changed_row("Year", "2026"))

    def test_never_evaluate_spreadsheet_formulas(self):
        self.assertEqual(EXTRACT.literal_cell('="Global"'), "Global")
        for value in ['=1+1', '=HYPERLINK("https://example.org")', '="Global"&"elsewhere"']:
            with self.subTest(value=value):
                # A concatenation can look like a literal at the outer edges;
                # decoding it as opaque text still cannot execute it.
                try:
                    decoded = EXTRACT.literal_cell(value)
                except ValueError:
                    continue
                self.assertNotEqual(decoded, "Global")

    def test_candidate_preserves_source_conflict_and_admission_gaps(self):
        report = json.loads((EXTRACT.OUT / "soga-air-health-source-candidate.json").read_text())
        self.assertEqual(report["provenance"]["modelVersionResolution"],
                         "unresolved_publisher_metadata_conflict")
        self.assertFalse(report["publicReady"])
        self.assertFalse(report["wholeNodeAdmitted"])
        self.assertEqual(report["overlapAudit"]["marginalSumDiagnosticOnly"], 237203600)
        self.assertEqual(report["overlapAudit"]["differenceDiagnosticOnly"], 4703600)
        self.assertGreaterEqual(len(report["remainingAdmissionGaps"]), 5)


if __name__ == "__main__":
    unittest.main()
