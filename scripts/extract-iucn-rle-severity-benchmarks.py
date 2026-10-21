"""Reproduce worked indicator examples; never assign TULIP scores.

Run with a Python runtime containing pypdf. The PDF is cached outside source
control; the explicit path argument must refer to the checksum-pinned source.
"""
import argparse
import hashlib
import json
import re
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
SOURCE_SHA256 = '59474024a60a14674422d93c84f0683c03a6e4bbdac49592c1a7a0c9f1e0d372'
SOURCE_URL = 'https://portals.iucn.org/library/sites/library/files/documents/2024-021-En.pdf'
OUTPUT = ROOT / 'artifacts/tulip-consequence-rule-audit-2026-09-27/iucn-rle-relative-severity-benchmarks.json'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('pdf', type=Path)
    args = parser.parse_args()
    digest = hashlib.sha256(args.pdf.read_bytes()).hexdigest()
    if digest != SOURCE_SHA256:
        raise ValueError(f'IUCN source PDF changed: {digest}')
    reader = PdfReader(args.pdf)
    table = reader.pages[110].extract_text()
    bounded = reader.pages[111].extract_text()
    aggregation = reader.pages[114].extract_text()
    expected_rows = {
        'Initial value': [219.5, 667.9, 790.3],
        'Present value': [149.8, 320.9, 338.2],
        'Observed decline': [69.7, 347.0, 452.1],
        'Maximum decline': [219.5, 667.9, 790.3],
        'Relative severity': [31.8, 51.9, 57.2],
    }
    for label, expected in expected_rows.items():
        row = re.search(rf'^[ \t]*{re.escape(label)}[ \t]+(\d[^\n]+)', table, re.MULTILINE)
        if not row:
            raise ValueError(f'Missing IUCN table row: {label}')
        values = [float(value) for value in re.findall(r'\d+\.\d+', row.group(1))]
        if values != expected:
            raise ValueError(f'Changed IUCN row {label}: {values}')
    if not all(phrase in bounded for phrase in ['conditional formula', 'OD', 'MD']):
        raise ValueError('Bounded severity method locator changed')
    if not all(value in aggregation for value in ['46.97', '51.27', '85 %']):
        raise ValueError('Aggregation example locator changed')
    cases = []
    for i, site in enumerate(['A', 'B', 'C']):
        initial = expected_rows['Initial value'][i]
        present = expected_rows['Present value'][i]
        calculated = (initial - present) / initial
        reported = expected_rows['Relative severity'][i]
        cases.append({
            'site': site, 'referenceValue': initial, 'observedValue': present,
            'collapseValue': 0, 'harmfulDirection': 'decrease',
            'reportedRelativeSeverityPercent': reported,
            'calculatedRelativeSeverityFraction': calculated,
            'calculatedSeverityRoundedPercent': round(calculated * 100, 1),
            'reportedMinusCalculatedPercentagePoints': reported - calculated * 100,
            'matchesReportedAtOneDecimal': round(calculated * 100, 1) == reported,
            'unit': 'standing_stock_source_table_units_unspecified',
            'role': 'published_historical_indicator_arithmetic_only',
        })
    report = {
        'version': 'iucn_rle_severity_benchmarks_2026_09_27_v1',
        'sourceVersion': 'iucn_rle_guidelines_version_2_0_2024',
        'sourceUrl': SOURCE_URL, 'sourceArtifactSha256': digest,
        'sourceLocator': 'Section 7.3.4, printed pages 97–98 (PDF pages 111–112); Box 17, printed page 101 (PDF page 115).',
        'status': 'source_checked_indicator_examples_not_current_node_assessments',
        'indicator': 'mean standing stock of juvenile finfish in three regions of the Indian Sundarbans; guidelines cite Sievers et al. (2020)',
        'cases': cases,
        'aggregationExample': {
            'basis': 'illustrative_weights_applied_to_report_rounded_severity_percentages',
            'equalWeightsReportedMeanPercent': 46.97,
            'alternativeIllustrativeWeights': [0.15, 0.40, 0.45],
            'alternativeWeightsReportedMeanPercent': 51.27,
            'extentAtOrAbove50PercentSeverityPercent': 85,
        },
        'limits': [
            'The worked table does not specify the initial/current observation years or physical unit; it is not a current attributable TULIP endpoint.',
            'The zero collapse threshold is specific to this worked indicator; it is not a general threshold for coral cover or ecosystem function.',
            'The alternative spatial weights are illustrative, not verified areas of the three regions.',
            'Site B calculates to 52.0% from the printed inputs, whereas the table reports 51.9%. The reason for this small discrepancy is not documented; both are preserved rather than silently corrected.',
            'The bounded formula does not establish node attribution, persistence, whole-ecosystem condition or trade-offs between ecosystem types.',
        ],
        'score': None, 'publicReady': False,
    }
    OUTPUT.write_text(json.dumps(report, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'status': report['status'], 'sourceCases': len(cases),
        'printedArithmeticDiscrepancies': sum(not item['matchesReportedAtOneDecimal'] for item in cases),
        'score': None}))


if __name__ == '__main__':
    main()
