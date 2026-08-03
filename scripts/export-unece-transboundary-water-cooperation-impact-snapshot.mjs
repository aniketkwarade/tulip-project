import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/unece-transboundary-water-cooperation-impact-snapshot.json');
const snapshot = {
  version: 'unece_unesco_sdg_6_5_2_2024_global_snapshot_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'unece_progress_on_transboundary_water_cooperation_sdg_6_5_2',
    name: 'UNECE-UNESCO Progress on Transboundary Water Cooperation 2024',
    publishers: ['United Nations Economic Commission for Europe', 'UNESCO', 'UN-Water'],
    report_year: 2024,
    monitoring_year: 2023,
    report_url: 'https://unece.org/info/Environment-Policy/pub/395013',
    monitoring_url: 'https://unece.org/environmental-policy/third-reporting-exercise-202324-sdg-indicator-652',
    press_release_url: 'https://unece.org/media/press/395038'
  },
  ingestion_job_id: 'export_unece_transboundary_water_cooperation_impact_snapshot',
  metric_contract_ids: ['transboundary_water_cooperation_coverage_gap'],
  contract_bindings: [
    { node_id: 'basin_treaty_breakdown', metric_id: 'transboundary_water_cooperation_coverage_gap', measurement_role: 'global_assessment_operational_arrangement_gap_primary' }
  ],
  cadence: 'Refresh with each UNECE-UNESCO SDG indicator 6.5.2 reporting cycle.',
  provenance: 'Reviewed official 2023 monitoring-cycle results published in 2024. Country counts, the global indicator average and transboundary-water share are retained as separate reported quantities.',
  uncertainty: 'National reports vary in completeness, aquifer delineation and interpretation of operationality. The coverage gap measures absent or incomplete operational arrangements; it does not prove treaty breach, conflict or service failure.',
  failure_behavior: 'Retain the last reviewed cycle and mark stale; never convert non-reporting countries to zero, infer conflict from a cooperation gap, or treat basin-area coverage as population exposure.',
  assessment: {
    monitoring_year: 2023,
    publication_year: 2024,
    countries_sharing_transboundary_waters: 153,
    countries_reporting: 129,
    reporting_share_pct: 84,
    countries_with_at_least_90_pct_operational_coverage: 43,
    countries_with_full_operational_coverage: 26,
    global_indicator_average_pct: 59,
    global_operational_coverage_gap_pct: 41,
    global_freshwater_crossing_borders_pct: 60,
    baseline_reporting_year: 2017,
    persistence_years: 6,
    un_member_state_denominator: 193,
    geography_boundary: 'UN Member States sharing transboundary rivers, lakes or aquifers',
    source_locators: [
      'UNECE-UNESCO 2024 report and third reporting exercise: 129 of 153 countries reported; 43 had at least 90% operational coverage and 26 had full coverage.',
      'UNECE official 2024 Water Convention findings: global SDG 6.5.2 average was 59%.',
      'UNECE report foreword: about 60% of global freshwater crosses international borders.'
    ]
  }
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, metric_contract_ids: snapshot.metric_contract_ids }, null, 2));
