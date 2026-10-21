"""Keep historical coral-cover and community observations distinct.

The pinned source is a site-level mean export, not a census of colonies or
mapped habitat. Category changes are descriptive, not mortality or harm units.
Pair by explicit site/state keys, never by source row order.
"""
import argparse
from collections import Counter
import csv
import hashlib
import json
import math
from pathlib import Path
import shutil
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/tulip-consequence-rule-audit-2026-09-27'
VERSION = 'coral_community_consequence_reference_2026_09_27_v1'
PINS = {
    'covers': ('8de693d861763b7e4edc8161ef344d4d9ad83634adf383ebb2e1e7e46b0aacb4',
               '365dbc5f52bd2e8bce5ea55b141fb300', 'https://ndownloader.figshare.com/files/41370429'),
    'covariates': ('f8e530bae34b293d4b0a62f042504b314d55672c75fdbe9be370d3b73597a232',
                   '5819cfe66a1f6c7c4146e1ad3682d929', 'https://ndownloader.figshare.com/files/41370426'),
    'table2': ('b7a441e1c8caf878057ba02c7f47652ac37bd37dc7e71ec74182f7134521d34b',
               '7fc5baf82659579c1fa9d835e9d0249c', 'https://ndownloader.figshare.com/files/49183941'),
}


def number(value):
    value = float(value)
    if not math.isfinite(value):
        raise ValueError('Non-finite source measurement')
    return value


def index_rows(rows):
    indexed = {}
    for row in rows:
        key = (row['site_code'], row['pre_post'])
        if not key[0] or key[1] not in ('Pre', 'Post') or key in indexed:
            raise ValueError('Missing, invalid or duplicate site/state key')
        indexed[key] = row
    return indexed


def derive_references(cover_rows, covariate_rows, categories):
    if len(categories) != len(set(categories)) or not categories:
        raise ValueError('Unique category columns required')
    covers, covariates = index_rows(cover_rows), index_rows(covariate_rows)
    if covers.keys() != covariates.keys():
        raise ValueError('Cover/covariate key sets differ')
    sites = sorted({key[0] for key in covers})
    cases = []
    for site in sites:
        if any((site, state) not in covers for state in ('Pre', 'Post')):
            raise ValueError('Paired Pre/Post states required')
        a, b = (covariates[(site, state)] for state in ('Pre', 'Post'))
        for field in ('latitude', 'longitude', 'cluster', 'Year_Pre', 'Year_Post', 'interval'):
            if number(a[field]) != number(b[field]):
                raise ValueError('Paired covariate identity differs: ' + field)
        latitude, longitude = number(a['latitude']), number(a['longitude'])
        if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
            raise ValueError('Invalid source coordinates')
        cluster = number(a['cluster'])
        if cluster != int(cluster) or not 1 <= cluster <= 7:
            raise ValueError('Invalid source cluster')
        pre_year, post_year = number(a['Year_Pre']), number(a['Year_Post'])
        if not (2010 <= pre_year < 2016 <= post_year <= 2019.9):
            raise ValueError('Mean source years outside study window or out of order')
        depth_a, depth_b = number(a['depth']), number(b['depth'])
        if min(depth_a, depth_b) < 0:
            raise ValueError('Invalid source depth')
        vector = []
        for category in categories:
            pre = number(covers[(site, 'Pre')][category])
            post = number(covers[(site, 'Post')][category])
            if not (0 <= pre <= 100 and 0 <= post <= 100):
                raise ValueError('Category cover outside percent range')
            vector.append({'categoryId': category, 'preCoverPct': pre,
                           'postCoverPct': post, 'differencePp': post - pre})
        pre_total = math.fsum(v['preCoverPct'] for v in vector)
        post_total = math.fsum(v['postCoverPct'] for v in vector)
        if max(pre_total, post_total) > 100 + 1e-8:
            raise ValueError('Category totals exceed substrate percent range')
        declining = math.fsum(max(0, -v['differencePp']) for v in vector)
        increasing = math.fsum(max(0, v['differencePp']) for v in vector)
        net = post_total - pre_total
        if not math.isclose(net, increasing - declining, abs_tol=1e-8):
            raise ValueError('Incompatible additive category arithmetic')
        cases.append({
            'referenceId': 'mellin_2016_heatwave_' + site, 'siteCode': site,
            'latitude': latitude, 'longitude': longitude, 'cluster': int(cluster),
            'sourceGrain': 'site_state_mean_category_cover',
            'sourceUnit': 'percent_surveyed_substrate',
            'preMeanSurveyYear': pre_year, 'postMeanSurveyYear': post_year,
            'preMeanDepthM': depth_a, 'postMeanDepthM': depth_b,
            'depthReview': 'same_reported_mean' if depth_a == depth_b else 'different_reported_means',
            'preTotalCoralCoverPct': pre_total, 'postTotalCoralCoverPct': post_total,
            'netTotalCoverDifferencePp': net,
            'decliningCategoryCoverDifferenceSumPp': declining,
            'increasingCategoryCoverDifferenceSumPp': increasing,
            'categoryVector': vector,
            'mappedDamagedAreaKm2': None, 'nodeAttributableFraction': None,
            'ecologicalHarmSeverity': None, 'score': None,
        })
    return cases


def workbook_rows(path):
    ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    with zipfile.ZipFile(path) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            for item in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('s:si', ns):
                shared.append(''.join(t.text or '' for t in item.findall('.//s:t', ns)))
        result = []
        for row in ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//s:row', ns):
            values = {}
            for cell in row.findall('s:c', ns):
                column = ''.join(c for c in cell.attrib['r'] if c.isalpha())
                v = cell.find('s:v', ns)
                if v is not None:
                    values[column] = shared[int(v.text)] if cell.get('t') == 's' else float(v.text)
                elif cell.get('t') == 'inlineStr':
                    values[column] = ''.join(t.text or '' for t in cell.findall('.//s:t', ns))
            result.append((int(row.attrib['r']), values))
        return result


def audit_table(path, cover_rows, covariate_rows, categories):
    covariates = index_rows(covariate_rows)
    observations, unresolved = [], []
    source_keys = set()
    for row_id, row in workbook_rows(path):
        if row_id == 1 or 'A' not in row:
            continue
        source_category = row['A']
        # Explicit formatting-only map; no taxon inference or category merging.
        category = source_category.replace(' ', '.').replace('Foliose/Plate', 'Foliose.Plate')
        cluster = int(row['B'])
        if (category, cluster) in source_keys:
            raise ValueError('Duplicate supplement category/cluster key')
        source_keys.add((category, cluster))
        if category not in categories:
            unresolved.append({'sourceRow': row_id, 'reason': 'unmapped_category', 'sourceCategory': source_category})
            continue
        if not all(isinstance(row.get(k), float) for k in ('C', 'D', 'E')):
            unresolved.append({'sourceRow': row_id, 'reason': 'non_numeric_source_state',
                               'sourceCategory': source_category, 'pre': row.get('C'), 'post': row.get('D')})
            continue
        means, present_means, counts = [], [], []
        for state in ('Pre', 'Post'):
            values = [number(r[category]) for r in cover_rows if r['pre_post'] == state
                      and int(number(covariates[(r['site_code'], state)]['cluster'])) == cluster]
            if not values:
                raise ValueError('Supplement cluster/state absent from raw export')
            means.append(math.fsum(values) / len(values))
            present = [v for v in values if v > 0]
            present_means.append(math.fsum(present) / len(present) if present else None)
            counts.append(len(values))
        observations.append({'sourceRow': row_id, 'sourceCategory': source_category,
                             'categoryId': category, 'cluster': cluster,
                             'supplementPreMeanPct': row['C'], 'supplementPostMeanPct': row['D'],
                             'supplementDifferencePp': row['E'],
                             'rawExportAllSiteMeansPct': means,
                             'rawExportPresentOnlyMeansPct': present_means, 'rawExportSiteCounts': counts,
                             'allSiteMeanMatch': all(math.isclose(x, y, abs_tol=1e-7)
                                                     for x, y in zip((row['C'], row['D']), means)),
                             'supplementArithmeticMatches': math.isclose(row['D'] - row['C'], row['E'], abs_tol=1e-7)})
    return {'numericRows': len(observations), 'unresolvedRows': unresolved,
            'allSiteMeanMatches': sum(r['allSiteMeanMatch'] for r in observations),
            'supplementArithmeticMismatches': sum(not r['supplementArithmeticMatches'] for r in observations),
            'decision': 'supplement_export_or_aggregation_difference_unresolved_do_not_pool',
            'rows': observations}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--covers', type=Path, required=True)
    parser.add_argument('--covariates', type=Path, required=True)
    parser.add_argument('--table2', type=Path, required=True)
    parser.add_argument('--out', type=Path, default=OUT)
    args = parser.parse_args()
    sources = {}
    for kind, (sha256, md5, url) in PINS.items():
        path = getattr(args, kind)
        data = path.read_bytes()
        if hashlib.sha256(data).hexdigest() != sha256 or hashlib.md5(data).hexdigest() != md5:
            raise ValueError('Source artifact differs from frozen version: ' + kind)
        sources[kind] = {'sha256': sha256, 'md5': md5, 'downloadUrl': url, 'sizeBytes': len(data)}
    with args.covers.open(encoding='utf-8-sig', newline='') as f:
        reader = csv.DictReader(f)
        categories = reader.fieldnames[2:]
        covers = list(reader)
    with args.covariates.open(encoding='utf-8-sig', newline='') as f:
        covariates = list(csv.DictReader(f))
    cases = derive_references(covers, covariates, categories)
    table = audit_table(args.table2, covers, covariates, categories)
    summary = {
        'sourceCoverRows': len(covers), 'sourceCovariateRows': len(covariates),
        'coralCategoryColumns': len(categories), 'pairedSites': len(cases),
        'depthMeanChanges': sum(c['depthReview'] == 'different_reported_means' for c in cases),
        'netCoverDeclines': sum(c['netTotalCoverDifferencePp'] < -1e-8 for c in cases),
        'netCoverIncreases': sum(c['netTotalCoverDifferencePp'] > 1e-8 for c in cases),
        'unchangedNetCoverWithCategoryChanges': sum(abs(c['netTotalCoverDifferencePp']) <= 1e-8
                                                   and c['decliningCategoryCoverDifferenceSumPp'] > 1e-8 for c in cases),
        'bothIncreasingAndDecliningCategories': sum(c['decliningCategoryCoverDifferenceSumPp'] > 1e-8
                                                   and c['increasingCategoryCoverDifferenceSumPp'] > 1e-8 for c in cases),
        'completedWholeNodeAssessments': 0,
    }
    report = {'version': VERSION, 'status': 'historical_descriptive_reference_vectors',
              'paperDoi': 'https://doi.org/10.1098/rspb.2024.1538',
              'datasetDoi': 'https://doi.org/10.25909/23584173.v1',
              'supplementDoi': 'https://doi.org/10.6084/m9.figshare.27019623.v1',
              'sources': sources, 'summary': summary, 'supplementAudit': table, 'cases': cases,
              'limitations': [
                  'Historical site-state means, not mapped habitat area or current global condition.',
                  'Survey-year means are not exact dates or demonstrated harm duration.',
                  'Equal mean depth does not prove identical transects; changed depth can confound comparison.',
                  'Category decrease/increase sums are changes of category means, not gross colony mortality.',
                  'Composition change needs ecological interpretation; it is not automatically degradation.',
                  'Total cover and its category components share measurements and must not be added as independent harms.',
                  'No matched node-free counterfactual, paired uncertainty or calibrated nature severity is established.',
                  'The supplement mean discrepancy is unresolved; do not silently replace or pool it with raw-export means.',
              ]}
    args.out.mkdir(parents=True, exist_ok=True)
    for kind in PINS:
        target = args.out / ('mellin-community-' + kind + ('.xlsx' if kind == 'table2' else '.csv'))
        if getattr(args, kind).resolve() != target.resolve():
            shutil.copyfile(getattr(args, kind), target)
    (args.out / 'coral-community-consequence-reference-audit.json').write_text(json.dumps(report, indent=2) + '\n')
    print(json.dumps({'summary': summary, 'supplementNumericRows': table['numericRows'],
                      'supplementAllSiteMeanMatches': table['allSiteMeanMatches'],
                      'supplementUnresolvedRows': table['unresolvedRows']}))


if __name__ == '__main__':
    main()
