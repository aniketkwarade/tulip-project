import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/fao-unccd-global-dryland-degradation-impact-snapshot.json');
const snapshot = {
  version: 'fao_unccd_global_dryland_degradation_impact_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'fao_unccd_global_dryland_degradation_impact',
    name: 'FAO and UNCCD Global Dryland Degradation Assessments',
    publishers: ['Food and Agriculture Organization of the United Nations', 'United Nations Convention to Combat Desertification'],
    url: 'https://www.fao.org/4/y5738e/y5738e06.htm',
    supporting_urls: [
      'https://catalogue.unccd.int/UNCCD_DLDD_SDS_Land_Human_Health_7_April_2021.pdf',
      'https://www.fao.org/interactive/dryland-assessment/en/'
    ]
  },
  ingestion_job_id: 'export_fao_unccd_global_dryland_degradation_impact_snapshot',
  metric_contract_ids: ['dryland_land_degradation_extent_and_condition'],
  contract_bindings: [{
    node_id: 'desertification_frontiers',
    metric_contract_id: 'dryland_land_degradation_extent_and_condition',
    measurement_role: 'global_accumulated_desertification_area_human_burden_annual_recurrence_and_extent'
  }],
  cadence: 'Annual review of FAO and UNCCD global dryland and desertification assessments.',
  provenance: 'Official FAO synthesis of GLASOD/UNEP dryland desertification estimates and official UNCCD land-and-health synthesis. Values are retained with their source year, direct-versus-at-risk distinction, dryland boundary and stated uncertainty.',
  uncertainty: 'The global desertification-area and annual-rate estimates synthesize older UNEP and GLASOD assessments whose definitions, baselines, remote-sensing coverage and soil/vegetation criteria differ. The affected-population figures are global order-of-magnitude estimates, not a household census. Climate variability and degradation are not interchangeable, and the figures should not be interpreted as a current annual monitoring series.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale. Reject changed dryland definitions, units, direct-versus-at-risk population labels, annual-rate boundaries or source locators. Never infer current-data trends, convert drought alone into persistent degradation, fill unreported uncertainty with zero or distribute global estimates uniformly.',
  assessment: {
    assessment_as_of: 2021,
    global_desertification_area_billion_hectares: 1.14,
    global_desertification_area_source_year: 1998,
    desertification_annual_rate_million_hectares_per_year: 5.8,
    desertification_annual_rate_source_year: 1991,
    people_directly_affected_million: 200,
    people_at_risk_million: 1000,
    countries_affected_minimum: 100,
    reference_country_count: 193,
    affected_country_share_normalized: 0.518135,
    global_dryland_area_billion_hectares: 6.1,
    global_dryland_land_share_pct: 41.3,
    global_dryland_population_billion: 2.1,
    annual_land_becoming_unproductive_from_desertification_and_drought_million_hectares: 12,
    annual_grain_production_loss_from_desertification_and_drought_million_tonnes: 20,
    geographic_scope: 'Drylands across all inhabited continents and more than 100 countries',
    measurement_boundary: 'Accumulated-impact assessment for dryland degradation/desertification; not a current land-productivity panel or a forecast.',
    source_locators: {
      biophysical_burden: 'FAO Carbon sequestration in dryland soils, desertification extent section and GLASOD Table 4: 1.14 billion hectares affected.',
      persistence: 'FAO Carbon sequestration in dryland soils, Table 5: approximately 5.8 million hectares per year desertification rate in mid-latitude drylands.',
      human_burden: 'FAO synthesis: approximately 200 million people directly affected and more than 1 billion at risk; UNCCD 2021 synthesis independently states livelihoods of more than 1 billion people in about 100 countries are threatened.',
      extent: 'FAO synthesis: desertification affects more than 100 countries on all continents; FAO Global Dryland Assessment: 6.1 billion hectares of drylands; UNCCD: drylands cover 41.3 percent of land and are home to 2.1 billion people.'
    }
  },
  excluded_from_scoring: [
    '1 billion people at risk, retained as context rather than added to 200 million directly affected',
    '12 million hectares and 20 million tonnes annual desertification-and-drought figures, retained as independent context rather than substituted for the desertification-only rate',
    'global land-degradation costs that are not dryland-specific',
    'current trend, attribution or local uniformity inference',
    'missing uncertainty as zero'
  ]
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output: OUTPUT_PATH,
  degraded_dryland_area_billion_hectares: snapshot.assessment.global_desertification_area_billion_hectares,
  people_directly_affected_million: snapshot.assessment.people_directly_affected_million,
  annual_desertification_rate_million_hectares: snapshot.assessment.desertification_annual_rate_million_hectares_per_year
}, null, 2));
