"""Audit the pinned HeatCRD SQLite export before deriving historical references.

The export's base-table keys disagree with its self-contained materialized
queries. Never reconstruct observations by joining those base tables. This
script checks the query records against each other and quarantines ambiguous
measurement grain. The resulting pairs describe sampled historical cover
change, not heatwave attribution, ecosystem-wide harm, or TULIP scores.
"""
import argparse
from collections import Counter, defaultdict
from datetime import date
import hashlib
import json
import math
from pathlib import Path
import sqlite3

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'artifacts/tulip-consequence-rule-audit-2026-09-27'
SOURCE_SHA256 = 'f03e2a8e4483aa3b03d5d491137ba07e85f949f576b78f377080a05e6d91f676'
SOURCE_MD5 = '76b119df5e880c243033f5d102ae1366'
SOURCE_SIZE = 82321408
SOURCE_DOI = 'https://doi.org/10.6084/m9.figshare.25488724.v1'
VERSION = 'heatcrd_historical_cover_reference_audit_2026_09_27_v1'

CHECKS = {
    'baseForeignKeyViolations': 'SELECT "table", parent, count(*) count FROM pragma_foreign_key_check GROUP BY "table", parent ORDER BY "table", parent',
    'querySampleDuplicateKeys': 'SELECT Sample_ID, count(*) count FROM Query_2_All_Samples GROUP BY Sample_ID HAVING count(*) <> 1',
    'querySiteDuplicateKeys': 'SELECT Site_ID, count(*) count FROM Query_1_All_Sites GROUP BY Site_ID HAVING count(*) <> 1',
    'queryCoverOrphans': 'SELECT count(*) count FROM Query_3_All_Cover c LEFT JOIN Query_2_All_Samples s USING(Sample_ID) WHERE s.Sample_ID IS NULL',
    'querySampleFieldMismatches': '''SELECT count(*) count FROM Query_3_All_Cover c
        JOIN Query_2_All_Samples s USING(Sample_ID)
        WHERE c.Site_ID IS NOT s.Site_ID OR c.Latitude_Degrees IS NOT s.Latitude_Degrees
        OR c.Longitude_Degrees IS NOT s.Longitude_Degrees OR c.Date_Year IS NOT s.Date_Year
        OR c.Date_Month IS NOT s.Date_Month OR c.Date_Day IS NOT s.Date_Day
        OR c.Depth IS NOT s.Depth OR c.Citation IS NOT s.Citation''',
    'querySiteFieldMismatches': '''SELECT count(*) count FROM Query_2_All_Samples c
        LEFT JOIN Query_1_All_Sites s USING(Site_ID)
        WHERE s.Site_ID IS NULL OR c.Latitude_Degrees IS NOT s.Latitude_Degrees
        OR c.Longitude_Degrees IS NOT s.Longitude_Degrees OR c.Citation IS NOT s.Citation''',
    'baseSampleQueryFieldMismatches': '''SELECT count(*) count FROM Sample_Event_tbl s
        JOIN Query_2_All_Samples q USING(Sample_ID)
        WHERE s.Site_ID IS NOT q.Site_ID OR s.Date_Year IS NOT q.Date_Year''',
    'baseSiteQueryCoordinateMismatches': '''SELECT count(*) count FROM Site_Description_tbl s
        JOIN Query_1_All_Sites q USING(Site_ID)
        WHERE s.Latitude_Degrees IS NOT q.Latitude_Degrees
        OR s.Longitude_Degrees IS NOT q.Longitude_Degrees''',
}
OBSERVATION_QUERY = '''SELECT rowid AS sourceRow, Sample_ID, Site_ID,
    Latitude_Degrees, Longitude_Degrees, Country_Name, Ecoregion_Name,
    Citation, Date_Year, Date_Month, Date_Day, Depth, Estimated_Resolution,
    Percent_Hard_Coral_Cover, Site_Comments, Sample_Comments
    FROM Query_3_All_Cover ORDER BY rowid'''


def finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def integer_between(value, lower, upper):
    return finite(value) and value == int(value) and lower <= value <= upper


def grain(row):
    return (row['Site_ID'], row['Date_Year'], row['Date_Month'], row['Date_Day'], row['Depth'])


def observation(row):
    return {
        'sourceRow': row['sourceRow'], 'sampleId': row['Sample_ID'],
        'year': int(row['Date_Year']), 'month': int(row['Date_Month']),
        'day': int(row['Date_Day']) if row['Date_Day'] is not None else None,
        'coverPercent': row['Percent_Hard_Coral_Cover'],
        'sampleComments': row['Sample_Comments'],
    }


def derive_pairs(rows):
    by_id = Counter(row['Sample_ID'] for row in rows)
    by_grain = Counter(grain(row) for row in rows)
    groups, exclusion_counts, excluded = defaultdict(list), Counter(), []
    for row in rows:
        reasons = []
        if by_id[row['Sample_ID']] != 1:
            reasons.append('ambiguous_sample_id')
        if by_grain[grain(row)] != 1:
            reasons.append('ambiguous_site_date_depth_grain')
        if row['Estimated_Resolution'] != '10s of meters':
            reasons.append('coordinate_precision_outside_pair_route')
        if not finite(row['Depth']) or row['Depth'] < 0:
            reasons.append('missing_or_invalid_depth')
        if not integer_between(row['Date_Year'], 1900, 2020):
            reasons.append('invalid_year')
        if not integer_between(row['Date_Month'], 1, 12):
            reasons.append('missing_or_invalid_month')
        if row['Date_Day'] is not None and not integer_between(row['Date_Day'], 1, 31):
            reasons.append('invalid_day')
        elif all(integer_between(row[field], lower, upper) for field, lower, upper in
                 [('Date_Year', 1900, 2020), ('Date_Month', 1, 12), ('Date_Day', 1, 31)]):
            try:
                date(int(row['Date_Year']), int(row['Date_Month']), int(row['Date_Day']))
            except ValueError:
                reasons.append('invalid_calendar_date')
        if not finite(row['Latitude_Degrees']) or not -90 <= row['Latitude_Degrees'] <= 90 \
                or not finite(row['Longitude_Degrees']) or not -180 <= row['Longitude_Degrees'] <= 180:
            reasons.append('invalid_coordinates')
        if not finite(row['Percent_Hard_Coral_Cover']) or not 0 <= row['Percent_Hard_Coral_Cover'] <= 100:
            reasons.append('invalid_cover')
        if not isinstance(row['Citation'], str) or not row['Citation'].strip():
            reasons.append('missing_source_citation')
        if reasons:
            exclusion_counts.update(reasons)
            excluded.append({'sourceRow': row['sourceRow'], 'sampleId': row['Sample_ID'], 'reasons': reasons})
            continue
        # Preserve depth, season and original-study boundaries. These are
        # necessary matching fields, not proof of a comparable field method.
        groups[(row['Site_ID'], row['Depth'], row['Date_Month'], row['Citation'])].append(row)
    pairs = []
    same_year_skips = 0
    for key in sorted(groups):
        group = sorted(groups[key], key=lambda row: (row['Date_Year'], row['Date_Day'] or 0, row['Sample_ID']))
        for before, after in zip(group, group[1:]):
            if before['Date_Year'] >= after['Date_Year']:
                same_year_skips += 1
                continue
            if any(before[field] != after[field] for field in
                   ('Latitude_Degrees', 'Longitude_Degrees', 'Country_Name', 'Ecoregion_Name')):
                raise ValueError('Paired geography changes within a stored site')
            first, last = before['Percent_Hard_Coral_Cover'], after['Percent_Hard_Coral_Cover']
            signed = last - first
            pairs.append({
                'caseId': f'heatcrd_v1_samples_{before["Sample_ID"]}_{after["Sample_ID"]}',
                'siteId': before['Site_ID'], 'latitude': before['Latitude_Degrees'],
                'longitude': before['Longitude_Degrees'], 'depthMeters': before['Depth'],
                'country': before['Country_Name'], 'ecoregion': before['Ecoregion_Name'],
                'originalSourceCitation': before['Citation'], 'siteComments': before['Site_Comments'],
                'before': observation(before), 'after': observation(after),
                'signedCoverChangePercentagePoints': signed,
                'positiveObservedCoverLossPercentagePoints': max(0, -signed),
                'signedRelativeCoverChangePercent': signed / first * 100 if first > 0 else None,
                'positiveObservedRelativeCoverLossPercent': max(0, -signed / first * 100) if first > 0 else None,
            })
    return pairs, excluded, exclusion_counts, same_year_skips


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('database', type=Path)
    parser.add_argument('metadata', type=Path)
    parser.add_argument('--output-dir', type=Path, default=OUT)
    args = parser.parse_args()
    data, metadata = args.database.read_bytes(), json.loads(args.metadata.read_text())
    if len(data) != SOURCE_SIZE or hashlib.sha256(data).hexdigest() != SOURCE_SHA256:
        raise ValueError('Pinned source bytes changed or download is incomplete')
    if hashlib.md5(data).hexdigest() != SOURCE_MD5:
        raise ValueError('Source MD5 differs from published file metadata')
    if metadata.get('id') != 25488724 or metadata.get('version') != 1:
        raise ValueError('Expected the publisher-linked version 1')
    source_file = metadata['files'][0]
    if source_file['id'] != 45312364 or source_file['size'] != SOURCE_SIZE or source_file['computed_md5'] != SOURCE_MD5:
        raise ValueError('Published source-file metadata changed')
    conn = sqlite3.connect(args.database.resolve().as_uri() + '?mode=ro', uri=True)
    conn.row_factory = sqlite3.Row
    integrity = [row[0] for row in conn.execute('PRAGMA integrity_check')]
    if integrity != ['ok']:
        raise ValueError(f'SQLite file integrity failed: {integrity}')
    checks = {name: {'sql': sql, 'rows': [dict(row) for row in conn.execute(sql)]} for name, sql in CHECKS.items()}
    for name in ('querySampleDuplicateKeys', 'querySiteDuplicateKeys'):
        if checks[name]['rows']:
            raise ValueError(f'Materialized query key ambiguity: {name}')
    for name in ('queryCoverOrphans', 'querySampleFieldMismatches', 'querySiteFieldMismatches'):
        if checks[name]['rows'][0]['count'] != 0:
            raise ValueError(f'Materialized query lineage conflict: {name}')
    rows = [dict(row) for row in conn.execute(OBSERVATION_QUERY)]
    pairs, excluded, exclusions, same_year_skips = derive_pairs(rows)
    duplicate_ids = {key: count for key, count in Counter(row['Sample_ID'] for row in rows).items() if count > 1}
    table_counts = {name: conn.execute(f'SELECT count(*) FROM "{name}"').fetchone()[0] for name in
                    ('Sample_Event_tbl', 'Site_Description_tbl', 'Cover_tbl', 'Query_1_All_Sites', 'Query_2_All_Samples', 'Query_3_All_Cover')}
    source = {'doi': SOURCE_DOI, 'paper': 'https://doi.org/10.1038/s41597-024-03221-3',
              'version': 1, 'fileId': 45312364, 'downloadUrl': source_file['download_url'],
              'sha256': SOURCE_SHA256, 'publishedMd5': SOURCE_MD5, 'sizeBytes': SOURCE_SIZE,
              'publishedDate': metadata['published_date'], 'license': metadata['license']['name'],
              'observationTable': 'Query_3_All_Cover'}
    limitations = [
        'The base-table foreign keys and matching IDs cannot reconstruct trustworthy observation joins in this export; cause of the mismatch is unverified.',
        'The accepted materialized query fields agree with the other query snapshots; that agreement is internal consistency, not an independent ecological validation.',
        'Pairs match stored site, depth, calendar month and citation. Survey-method comparability, precise survey footprint and interpolation/imputation must be checked in the original study.',
        'The records end in 2020. They cannot establish current 2026 condition, persistence or recovery.',
        'Changes are observational. Prior cover is not a present no-node counterfactual, and all declines are not automatically attributable to marine heatwaves or climate change.',
        'Cover percentages are reef-substrate occupancy, not bleaching, mortality, a complete ecosystem-condition measure or an area-weighted global loss.',
        'Area weights, source-compatible uncertainty, species/community change and ecosystem-collapse thresholds are unresolved. No probability distributions or TULIP ratings are inferred.',
    ]
    summary = {'tableCounts': table_counts, 'observationRows': len(rows),
               'distinctSampleIds': len(set(row['Sample_ID'] for row in rows)),
               'baseForeignKeyViolationCount': sum(row['count'] for row in checks['baseForeignKeyViolations']['rows']),
               'duplicateSampleIdCount': len(duplicate_ids), 'duplicateSampleAffectedRows': sum(duplicate_ids.values()),
               'ambiguousSiteDateDepthAffectedRows': sum(exclusions[key] for key in ['ambiguous_site_date_depth_grain']),
               'pairRouteExcludedRows': len(excluded), 'pairRouteEligibleRows': len(rows) - len(excluded),
               'exclusionsByReason': dict(sorted(exclusions.items())), 'sameYearAdjacentComparisonsSkipped': same_year_skips,
               'historicalMatchedPairs': len(pairs), 'pairedSites': len(set(pair['siteId'] for pair in pairs)),
               'observedPeriod': {'startYear': int(min(row['Date_Year'] for row in rows)), 'endYear': int(max(row['Date_Year'] for row in rows))},
               'declinePairs': sum(pair['signedCoverChangePercentagePoints'] < 0 for pair in pairs),
               'gainPairs': sum(pair['signedCoverChangePercentagePoints'] > 0 for pair in pairs),
               'unchangedPairs': sum(pair['signedCoverChangePercentagePoints'] == 0 for pair in pairs),
               'undefinedRelativeChangePairs': sum(pair['signedRelativeCoverChangePercent'] is None for pair in pairs)}
    pool = {'version': VERSION, 'source': source,
            'coverage': 'sampled_historical_matched_cover_change_references',
            'pairPolicy': 'consecutive_stored_observations_within_same_site_depth_calendar_month_and_citation_across_different_years',
            'endpoint': 'live_hard_coral_cover_change', 'unit': 'percentage_points_reef_substrate_cover',
            'summary': summary, 'limitations': limitations, 'cases': pairs,
            'currentNodeAssessmentsCompleted': 0, 'nodeAttributableFraction': None,
            'attributableDamagedAreaKm2': None, 'score': None, 'publicReady': False}
    args.output_dir.mkdir(parents=True, exist_ok=True)
    pool_bytes = (json.dumps(pool, indent=2, ensure_ascii=False) + '\n').encode()
    pool_name = 'heatcrd-historical-cover-reference-pairs.json'
    (args.output_dir / pool_name).write_bytes(pool_bytes)
    audit = {'version': VERSION, 'source': source, 'sqliteFileIntegrity': integrity,
             'rawRelationalJoinAdmission': 'rejected', 'materializedQueries': 'internally_consistent_reference_only',
             'summary': summary, 'checks': checks, 'observationSql': OBSERVATION_QUERY,
             'ambiguousSampleIds': duplicate_ids, 'excludedObservations': excluded,
             'pairArtifact': {'filename': pool_name, 'sha256': hashlib.sha256(pool_bytes).hexdigest()},
             'limitations': limitations, 'score': None, 'publicReady': False}
    (args.output_dir / 'heatcrd-calibration-input-quality-audit.json').write_text(json.dumps(audit, indent=2, ensure_ascii=False) + '\n')
    (args.output_dir / 'heatcrd-v1-published-metadata.json').write_text(json.dumps(metadata, indent=2, ensure_ascii=False) + '\n')
    print(json.dumps({'status': 'historical_reference_pool_only', 'summary': summary, 'score': None}, indent=2))


if __name__ == '__main__':
    main()
