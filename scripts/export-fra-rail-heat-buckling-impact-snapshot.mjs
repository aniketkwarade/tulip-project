import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const snapshot = {
  version: 'fra_form54_t109_rail_heat_buckling_1975_2025_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'dot_fra_form54_rail_equipment_accidents',
      name: 'Rail Equipment Accident/Incident Data (Form 54)',
      publisher: 'U.S. Department of Transportation, Federal Railroad Administration',
      url: 'https://data.transportation.gov/Railroads/Rail-Equipment-Accident-Incident-Data-Form-54-/85tf-25kj',
      api_url: 'https://data.transportation.gov/resource/85tf-25kj.json',
      data_last_updated: '2026-07-27',
      query: 'accidentcausecode = T109; ordered by date; selected identity, date, state, damage, casualty and temperature fields',
      query_result_sha256: '0f2db0ad3803e256dcf5d87b2e2dbcbe040c1f3f2810d3386d80068bdfa267fd'
    },
    {
      id: 'fra_train_accident_cause_codes_t109',
      name: 'FRA Train Accident Cause Codes — T109',
      publisher: 'Federal Railroad Administration',
      url: 'https://railroads.dot.gov/forms-guides-publications/guides/train-accident-cause-codes',
      definition: 'Track alignment irregular (buckled/sunkink)'
    },
    {
      id: 'fra_safety_advisory_2023_07_weather_rail',
      name: 'FRA Safety Advisory 2023-07',
      publisher: 'Federal Railroad Administration',
      url: 'https://www.federalregister.gov/d/2023-25924',
      validation: 'FRA reported 49 T109 incidents from January 2021 through July 2023, including 40 mainline derailments, and tied the code to buckled/sun-kink track under severe heat.'
    }
  ],
  metric_contract: {
    node_id: 'rail_heat_buckling',
    metric_id: 'rail_heat_restriction_and_buckle_events',
    unit: 'reportable T109 accidents/incidents, nominal U.S. dollars damage, deaths and injuries',
    geography: 'United States FRA-reportable railroad network',
    cadence: 'event records aggregated over complete calendar years',
    cause_code: 'T109',
    cause_definition: 'Track alignment irregular (buckled/sunkink)',
    failure_boundary: 'T109 is an official buckled/sun-kink cause code, but the database does not establish that ambient heat was the sole cause of every record. Reportability thresholds and revisions vary over the 51-year period.'
  },
  extraction: {
    raw_api_rows: 2419,
    exact_duplicate_rows_removed: 21,
    distinct_rows_after_exact_deduplication: 2398,
    first_record_date: '1975-01-20',
    last_record_date: '2026-05-27',
    incomplete_year_excluded_from_accumulated_totals: 2026,
    incomplete_2026_rows: 4,
    deduplication_rule: 'Remove only byte-equivalent selected-field API rows. Retain reused railroad accident numbers when dates or other fields differ.'
  },
  accumulated_impact_through_2025: {
    start_year: 1975,
    end_year: 2025,
    complete_calendar_years: 51,
    t109_report_count: 2394,
    nominal_reported_damage_usd: 527571375,
    total_persons_killed: 18,
    total_persons_injured: 742,
    states_with_records: 50,
    directly_assessed_countries: ['United States'],
    directly_assessed_country_count: 1
  },
  recent_complete_years: [
    { year: 2021, reports: 21, damage_usd: 56298948, killed: 6, injured: 166, states: 14 },
    { year: 2022, reports: 20, damage_usd: 11924111, killed: 0, injured: 1, states: 15 },
    { year: 2023, reports: 22, damage_usd: 9688285, killed: 0, injured: 0, states: 13 },
    { year: 2024, reports: 12, damage_usd: 11361429, killed: 0, injured: 0, states: 10 },
    { year: 2025, reports: 17, damage_usd: 11199490, killed: 0, injured: 0, states: 13 }
  ],
  source_backed_normalization_anchors: {
    t109_reports: [0, 49, 500, 2394],
    nominal_damage_usd: [0, 11199490, 56298948, 527571375],
    observed_duration_years: [0, 12, 25, 51],
    directly_assessed_country_count: [0, 1, 10, 50]
  },
  uncertainty: 'Form 54 includes reportable rail-equipment accidents above the applicable annual damage threshold, so minor buckles and operational heat restrictions without a reportable accident are absent. The T109 code includes buckled/sun-kink alignment but does not prove ambient heat was the sole cause of each record. Damage is nominal and not inflation-adjusted. Twenty-one exact duplicate selected-field rows were removed; distinct rows sharing an accident number were retained. The assessment covers one country and is not extrapolated globally.'
};

await fs.writeFile(path.join(ROOT, 'public/fra-rail-heat-buckling-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/fra-rail-heat-buckling-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact_through_2025 }, null, 2));
