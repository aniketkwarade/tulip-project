"""Bind edition-specific scope facts and preserve unclassified source limits.

This audits a data input; it does not make the negative limit a harm magnitude,
assume a zero effect, reconstruct a joint risk estimate or approve a rating.
"""
import csv
import hashlib
import importlib.util
import io
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/tulip-consequence-rule-audit-2026-09-27'
SOURCE = OUT / 'soga-2025-source'
spec = importlib.util.spec_from_file_location('soga_parent_extract', ROOT / 'scripts/extract-tulip-soga-air-burden.py')
parent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parent)


def extract_no2_rows(text):
    rows, citations = [], []
    for raw in csv.DictReader(io.StringIO(text.lstrip('\ufeff'))):
        row = {parent.literal_cell(key): parent.literal_cell(value) for key, value in raw.items()}
        if not row['Year']:
            if row['Type'] == 'citation':
                citations.append(row['Country'])
            continue
        for key, expected in {'Type': 'global', 'Country': 'Global', 'Name': 'Global',
                'Year': row['Year'], 'Measure': 'daly', 'Metric': 'number', 'Sex': 'Both',
                'Age Group Name': 'All Ages', 'REI Name': 'Nitrogen dioxide pollution',
                'Cause Name': 'All causes', 'Pollutant': 'no2'}.items():
            assert row[key] == expected, (key, row[key])
        assert row['Year'].isdigit()
        quantities = {}
        for field, label in [('Burden Lower', 'lower'), ('Burden Mean', 'central'), ('Burden Upper', 'upper')]:
            assert re.fullmatch(r'-?\d+', row[field]), (field, row[field])
            quantities[label] = int(row[field])
        assert quantities['lower'] <= quantities['central'] <= quantities['upper']
        rows.append({'year': int(row['Year']), 'rowId': row['Burden Id'], **quantities})
    years = [row['year'] for row in rows]
    assert years == list(range(1990, 2024)) and len(set(years)) == len(years)
    assert len(citations) == 1
    return rows, citations[0]


def main():
    capture = json.loads((SOURCE / 'outcome-scope-retrieval.json').read_text())
    for item in capture['sources']:
        assert hashlib.sha256((SOURCE / item['file']).read_bytes()).hexdigest() == item['sha256']
    rows, citation = extract_no2_rows((SOURCE / 'no2-global-dalys.csv').read_text(encoding='utf-8-sig'))
    current = next(row for row in rows if row['year'] == 2023)
    assert current == {'year': 2023, 'rowId': '678572', 'lower': -250000, 'central': 232600, 'upper': 956000}
    assert {row['year']: row['central'] for row in rows} == parent.chart_rows('no2-global-dalys-chart.json')
    assert 'Global Burden of Disease Study 2021' in citation
    country_metadata = json.loads((SOURCE / 'country-metadata.json').read_text())
    assert len(country_metadata) == 204
    assert {'country': 'United States of America', 'iso3': 'USA'} in country_metadata
    cause_bars = json.loads((SOURCE / 'usa-parent-cause-dalys-chart.json').read_text())
    assert len(cause_bars) == 5
    assert all(set(row) == {'causeName', 'pctAirpol', 'pctNonAirpol'} for row in cause_bars)
    assert all(row['pctAirpol'] + row['pctNonAirpol'] == 100 for row in cause_bars)
    # Source-supported mortality-display classes, visually read from Figure 18.
    # They are not a complete machine-readable DALY risk/outcome model table.
    displayed = ['neonatal_disorders', 'lower_respiratory_infections', 'type_2_diabetes',
        'lung_cancer', 'dementia', 'stroke', 'copd', 'ischemic_heart_disease']
    profile = {
        'version': 'soga_2025_edition_outcome_profile_2026_09_27_v1',
        'nodeId': 'air_pollution_health_burden',
        'reviewKind': 'edition_specific_source_scope_audit_not_whole_node_approval',
        'inputs': capture['sources'], 'reportReference': capture['report'],
        'publishedModelIdentity': {'edition': 'SoGA 2025', 'reportClaimedModel': 'GBD 2023',
            'reportLocators': ['PDF page 7', 'PDF page 35'],
            'csvFooterCitation': citation, 'footerConflictResolved': False},
        'mortalityDisplayOutcomeClasses': [{'id': name, 'displayedPollutants': ['ambient_pm25', 'household_solid_fuel_pollution'],
            'locator': 'PDF page 28, Figure 18',
            'scope': 'Mortality display classes; no individual DALY quantity or exact model cause ID inferred'} for name in displayed],
        'ozoneReportedScope': {'outcome': 'COPD', 'locator': 'PDF page 31'},
        'no2ReportedScope': {'outcome': 'Childhood asthma DALYs; no total NO2 mortality estimate',
            'locators': ['PDF page 22', 'PDF page 32'],
            'reportExampleAgeRange': [5, 14],
            'reportExampleDalys': {'lower': 8000, 'central': 138600, 'upper': 571000},
            'capturedAllAgesRow': current,
            'capturedAnnualSeries': rows,
            'ageScopesInterchangeable': False,
            'rawNegativeLimitRetained': True,
            'negativeLimitInterpretation': 'Unclassified reported model limit. Do not infer protection, zero harm or the reason for the negative limit from its sign alone.',
            'approvedHarmConversion': None, 'score': None},
        'countryCauseBarAudit': {'country': 'USA', 'rows': cause_bars,
            'explicitYearPresent': False, 'explicitAgeDenominatorPresent': False,
            'globalRiskOutcomeSpecification': False,
            'decision': 'Do not use rounded country cause bars as the global absolute DALY source or treat omitted outcomes as zero.'},
        'genericWebMethodologyAudit': {'url': 'https://www.stateofglobalair.org/data/estimate-burden',
            'linkedRiskPaper': 'https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(20)30752-2/fulltext',
            'currentEditionOutcomeSpecification': False,
            'decision': 'Useful background, but does not list dementia and NO2 outcomes present in the 2025 report.'},
        'remaining': ['Bind the exact joint parent DALY risk/outcome set and risk-specific counterfactuals to its CSV row',
            'Resolve the publisher model-citation conflict without rewriting the source',
            'Explain the signed NO2 limits before any harms-only conversion',
            'Adjudicate household exposure and omitted pollutants/outcomes against the declared node boundary',
            'Approve calibration and combined-score meaning; no source-scope audit supplies that choice'],
        'wholeNodeAdmitted': False, 'publicReady': False, 'publicScoresChanged': False,
    }
    (OUT / 'soga-edition-outcome-profile.json').write_text(json.dumps(profile, indent=2) + '\n')
    print(json.dumps({'mortalityDisplayClasses': len(displayed), 'no2GlobalRow': current,
        'reportChildAgeScope': [5, 14], 'globalScopeFromCountryBarsApproved': False,
        'wholeNodeAdmitted': False, 'publicScoresChanged': False}, indent=2))


if __name__ == '__main__':
    main()
