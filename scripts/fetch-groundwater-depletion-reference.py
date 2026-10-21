#!/usr/bin/env python3
import hashlib
import html
import io
import json
import re
import ssl
import urllib.request
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'artifacts' / 'tulip-calibration-2026-09-22' / 'groundwater-depletion-reference-snapshot.json'
CHECKED_ON = '2026-09-23'
USER_AGENT = 'LostPlanet-TULIP/1.0 (+groundwater-depletion-evidence-ingestion)'

ARTICLE_URL = 'https://www.nature.com/articles/s41586-023-06879-8'
DATA_API_URL = 'https://zenodo.org/api/records/10003697'
TABLES_URL = 'https://zenodo.org/api/records/10003697/files/Jasechko_et_al_2024_SupplementaryTables.zip/content'
EXPECTED_TABLES = {
    'bytes': 498_675,
    'md5': '718f0f059ab3daacae8db4df99cd7b2b',
    'sha256': '925443016dca53999bf05acdaa0a7a2a4921b5fc2c157017016f1da8d18f394b',
}

SYSTEM_CA_BUNDLE = Path('/etc/ssl/cert.pem')
TLS_CONTEXT = ssl.create_default_context(cafile=str(SYSTEM_CA_BUNDLE)) if SYSTEM_CA_BUNDLE.exists() else ssl.create_default_context()


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    with urllib.request.urlopen(request, timeout=180, context=TLS_CONTEXT) as response:
        return response.read()


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def compact_page_text(value):
    text = value.decode('utf-8', errors='replace')
    text = re.sub(r'<script[\s\S]*?</script>|<style[\s\S]*?</style>', ' ', text, flags=re.I)
    text = re.sub(r'<[^>]+>', ' ', text)
    return re.sub(r'\s+', ' ', html.unescape(text)).strip()


def claim(text, pattern, name):
    match = re.search(pattern, text, flags=re.I)
    if not match:
        raise AssertionError(f'{name} is missing')
    value = match.group(0)
    return {'text': value, 'bytes': len(value.encode()), 'sha256': sha256(value.encode())}


def column_index(reference):
    letters = re.match(r'[A-Z]+', reference).group(0)
    value = 0
    for letter in letters:
        value = value * 26 + ord(letter) - 64
    return value - 1


def xlsx_rows(blob):
    with zipfile.ZipFile(io.BytesIO(blob)) as archive:
        shared = []
        if 'xl/sharedStrings.xml' in archive.namelist():
            root = ET.fromstring(archive.read('xl/sharedStrings.xml'))
            for item in root.findall('.//{*}si'):
                shared.append(''.join(node.text or '' for node in item.findall('.//{*}t')))
        sheet = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))
        rows = []
        for row in sheet.findall('.//{*}row'):
            values = {}
            for cell in row.findall('{*}c'):
                index = column_index(cell.attrib['r'])
                kind = cell.attrib.get('t')
                value_node = cell.find('{*}v')
                if value_node is None:
                    inline = cell.find('.//{*}t')
                    value = inline.text if inline is not None else None
                elif kind == 's':
                    value = shared[int(value_node.text)]
                elif kind == 'b':
                    value = value_node.text == '1'
                else:
                    raw = value_node.text
                    try:
                        value = float(raw)
                        if value.is_integer():
                            value = int(value)
                    except (TypeError, ValueError):
                        value = raw
                values[index] = value
            if values:
                result = [None] * (max(values) + 1)
                for index, value in values.items():
                    result[index] = value
                rows.append(result)
        return rows


article = fetch(ARTICLE_URL)
article_text = compact_page_text(article)
metadata = json.loads(fetch(DATA_API_URL))
tables_zip = fetch(TABLES_URL)

assert len(tables_zip) == EXPECTED_TABLES['bytes']
assert hashlib.md5(tables_zip).hexdigest() == EXPECTED_TABLES['md5']
assert sha256(tables_zip) == EXPECTED_TABLES['sha256']
assert metadata['id'] == 10_003_697
assert metadata['metadata']['license']['id'] == 'cc-by-4.0'

verified_claims = {
    'studyCoverage': claim(article_text, r'Here we analyse in situ groundwater-level trends for 170,000 monitoring wells and 1,693 aquifer systems in countries that encompass approximately 75% of global groundwater withdrawals', 'study coverage claim'),
    'aquiferDeclines': claim(article_text, r'Groundwater levels became deeper over time at rates exceeding 0\.1 m year −1 in 36% of the aquifer systems \(617 of 1,693\) and exceeding 0\.5 m year −1 in 12% \(210\) of them', 'aquifer decline claim'),
    'longTermComparison': claim(article_text, r'in half \(49%\) of the 542 aquifer systems in our analysis, groundwater-level declines have decelerated[\s\S]{0,260}?continued to rise \(purple in Fig\. 3 ; 13%\)', 'long-term comparison claim'),
    'consequenceBoundary': claim(article_text, r'Groundwater depletion can threaten ecosystems and economies[\s\S]{0,520}?wells run dry', 'consequence boundary claim'),
}

with zipfile.ZipFile(io.BytesIO(tables_zip)) as outer:
    table04 = xlsx_rows(outer.read('Supplementary_Table_04.xlsx'))
    table06 = xlsx_rows(outer.read('Supplementary_Table_06.xlsx'))
    table16 = xlsx_rows(outer.read('Supplementary_Table_16.xlsx'))

assert table04[1][2] == 169_717
assert len(table16) - 1 == 1_693
rounded_slopes = [float(row[4]) for row in table16[1:] if len(row) > 4 and row[4] is not None]
assert len(rounded_slopes) == 1_693
rounded_counts = {
    'deeperThanPointOneMPerYear': sum(value > 0.1 for value in rounded_slopes),
    'deeperThanPointFiveMPerYear': sum(value > 0.5 for value in rounded_slopes),
    'shallowerThanMinusPointOneMPerYear': sum(value < -0.1 for value in rounded_slopes),
    'shallowerThanMinusPointFiveMPerYear': sum(value < -0.5 for value in rounded_slopes),
}
assert rounded_counts == {
    'deeperThanPointOneMPerYear': 608,
    'deeperThanPointFiveMPerYear': 209,
    'shallowerThanMinusPointOneMPerYear': 94,
    'shallowerThanMinusPointFiveMPerYear': 13,
}

long_term_rows = []
for row in table06[1:]:
    parsed = re.search(r'n=(\d+) aquifer systems \(([\d.]+)% of aquifer systems\)', str(row[1]))
    assert parsed
    long_term_rows.append({'category': row[0], 'aquiferSystems': int(parsed.group(1)), 'percent': float(parsed.group(2))})
assert sum(row['aquiferSystems'] for row in long_term_rows) == 542

snapshot = {
    'version': 'tulip_groundwater_depletion_reference_2026_09_23_v1',
    'generatedOn': CHECKED_ON,
    'status': 'aquifer_trends_reproduced_with_coverage_boundary',
    'productionRatingsEnabled': 0,
    'purpose': 'Replace a generic groundwater-depletion trace with reproduced aquifer trends while preventing study coverage, monitoring wells, withdrawal share and aquifer counts from becoming human or ecosystem harm.',
    'sources': {
        'article': {
            'id': 'jasechko_global_groundwater_levels_2024',
            'publisher': 'Nature',
            'title': 'Rapid groundwater decline and some cases of recovery in aquifers globally',
            'publicationDate': '2024-01-24',
            'doi': 'https://doi.org/10.1038/s41586-023-06879-8',
            'url': ARTICLE_URL,
            'retrievedOn': CHECKED_ON,
            'verifiedClaims': list(verified_claims.values()),
        },
        'openData': {
            'id': 'jasechko_global_groundwater_supplementary_tables_2023',
            'publisher': 'Zenodo',
            'title': metadata['metadata']['title'],
            'publicationDate': metadata['metadata']['publication_date'],
            'doi': metadata['doi_url'],
            'url': DATA_API_URL,
            'license': metadata['metadata']['license']['id'],
            'fetchedArchive': {'bytes': len(tables_zip), 'md5': hashlib.md5(tables_zip).hexdigest(), 'sha256': sha256(tables_zip)},
        },
    },
    'currentWindow': {
        'start': 2000,
        'end': 2022,
        'coverageStatus': 'partial',
        'summaryMethod': 'period_prevalence',
        'coverageNote': 'The current aquifer trends use monitoring records spanning at least eight years within 2000–2022. The 2024 publication year is not relabelled as the observation year.',
    },
    'endpoints': {
        'studyBoundary': {
            'monitoringWells': 169_717,
            'aquiferSystems': 1_693,
            'countriesMoreThan': 40,
            'studyCountryShareOfGlobalGroundwaterWithdrawalsPercentApproximate': 75,
            'interpretation': 'The 75% value describes groundwater withdrawals in covered countries. It is neither the share of aquifers depleted nor the share of ecosystems or people harmed.',
        },
        'aquiferCondition': {
            'aquiferSystemsDeeperThanPointOneMPerYear': 617,
            'shareDeeperThanPointOneMPerYearPercent': 36,
            'aquiferSystemsDeeperThanPointFiveMPerYear': 210,
            'shareDeeperThanPointFiveMPerYearPercent': 12,
            'roundedSupplementaryTableCounts': rounded_counts,
            'roundingNote': 'The archived table publishes median slopes rounded to two decimals, yielding 608 and 209 strict-threshold rows. The paper reports 617 and 210 from unrounded analysis; TULIP retains the published counts and records the reproducible rounding difference.',
            'interpretation': 'These are aquifer-level physical trends in the sampled systems. Aquifer count and decline rate do not directly measure terminal human harm or ecosystem collapse.',
        },
        'longTermDirection': {
            'aquiferSystemsCompared': 542,
            'categories': long_term_rows,
            'acceleratingDeclinePercent': 30.1,
            'deceleratingDeclinePercent': 19.7,
            'reversedFromDeclineToRisePercent': 15.9,
            'continuedRisePercent': 12.7,
            'interpretation': 'Decline is widespread but not universal or automatically irreversible. The recovery cases prevent observation length or the word depletion from setting permanent persistence by itself.',
        },
        'compatibleCurrentHarmedPersonCount': None,
        'compatibleCurrentEcosystemConditionLossPercent': None,
        'compatibleCurrentEcosystemDistributionAffectedPercent': None,
        'compatibleCurrentRecoveryDuration': None,
    },
    'tulipUse': {
        'admitted': [
            'Use the 2000–2022 aquifer-level trends as direct evidence of groundwater physical condition.',
            'Use the 36% and 12% shares only as prevalence within the sampled aquifer systems, with sample and denominator limitations explicit.',
            'Use the 542-system comparison to show acceleration, deceleration and reversals without treating every system as following one direction.',
            'Use documented recovery cases to bound persistence rather than assuming that all groundwater decline is permanent.',
        ],
        'prohibited': [
            'Do not treat countries representing 75% of global groundwater withdrawals as 75% of ecosystems affected.',
            'Do not treat monitoring-well count, aquifer-system count or country coverage as harmed-person reach.',
            'Do not treat the 30% of long-record aquifers with accelerating decline as 30% ecosystem-condition loss.',
            'Do not treat groundwater-level decline rate as movement toward ecosystem collapse without a source-matched ecological response.',
            'Do not treat wells running dry, subsidence or streamflow depletion as current global outcomes without compatible observed counts.',
            'Do not use the 22-year observation window as the duration of human or ecosystem consequences.',
        ],
        'currentCatalogueRecommendation': {
            'nodeId': 'groundwater_depletion_wells',
            'rating': 'C 5.1',
            'uncertainty': 'B 2.9 to D 7.8',
            'confidence': 'C',
            'domain': 'human and ecosystem',
            'reason': 'The open data establish widespread aquifer decline and mixed long-term directions, but the former D rating incorrectly used the 75% withdrawal-coverage statistic as ecosystem reach. Direct harmed-person, ecosystem-condition and recovery endpoints remain incomplete.',
        },
    },
    'unresolvedForTulip': [
        'Join dry-well, water-service, subsidence and agricultural-loss records to the same depleted aquifer systems without counting potential pathways as realized outcomes.',
        'Join groundwater-dependent ecosystem condition and streamflow response to the same aquifer trends with an ecosystem-distribution denominator.',
        'Measure recovery time for human and ecological consequences rather than using the monitoring interval or hydrologic trend alone.',
        'Quantify how representative the 1,693 sampled systems are of global aquifer area, groundwater-dependent ecosystems and exposed populations; withdrawal share is not a substitute.',
    ],
}

digest_payload = {key: snapshot[key] for key in ('sources', 'currentWindow', 'endpoints', 'tulipUse', 'unresolvedForTulip')}
snapshot['snapshotDigest'] = sha256(json.dumps(digest_payload, separators=(',', ':'), ensure_ascii=False).encode())
OUTPUT.parent.mkdir(parents=True, exist_ok=True)
OUTPUT.write_text(json.dumps(snapshot, indent=2, ensure_ascii=False) + '\n')
print(json.dumps({
    'output': str(OUTPUT),
    'status': snapshot['status'],
    'aquiferSystems': snapshot['endpoints']['studyBoundary']['aquiferSystems'],
    'withdrawalCoverageMisuseRemoved': snapshot['endpoints']['studyBoundary']['studyCountryShareOfGlobalGroundwaterWithdrawalsPercentApproximate'],
    'digest': snapshot['snapshotDigest'],
}, indent=2))
