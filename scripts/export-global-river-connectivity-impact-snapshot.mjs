import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/global-river-connectivity-impact-snapshot.json');
const snapshot = {
  version: 'global_free_flowing_rivers_assessment_2019_snapshot_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'global_free_flowing_rivers_assessment_2019',
    name: 'Mapping the world’s free-flowing rivers',
    publisher: 'Nature',
    assessment_year: 2019,
    pubmed_url: 'https://pubmed.ncbi.nlm.nih.gov/31068722/',
    study_url: 'https://www.nature.com/articles/s41586-019-1111-9',
    institutional_summary_url: 'https://fish.uw.edu/2019/05/few-of-the-worlds-longest-rivers-still-flow-uninterrupted-into-the-ocean/'
  },
  ingestion_job_id: 'export_global_river_connectivity_impact_snapshot',
  metric_contract_ids: ['global_long_river_connectivity_loss'],
  contract_bindings: [
    { node_id: 'riverine_habitat_fragmentation', metric_id: 'global_long_river_connectivity_loss', measurement_role: 'global_river_connectivity_assessment_primary' },
    { node_id: 'dam_and_diversion_infrastructure', metric_id: 'global_long_river_connectivity_loss', measurement_role: 'global_river_connectivity_assessment_primary' }
  ],
  cadence: 'Refresh when a method-comparable global free-flowing-river assessment is published.',
  provenance: 'Reviewed primary global assessment values. The inland-fisheries population is retained only as exposed service scope from the institutional study summary, not as harm attributed to every barrier.',
  uncertainty: 'Barrier inventories, river-network resolution, Connectivity Status Index thresholds, natural barriers, flow regulation and tributary treatment affect classification. Long-river results do not represent every stream.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale; never infer barrier counts, local passability, focal-species loss or household harm from the global long-river share.',
  assessment: {
    assessment_year: 2019,
    global_river_network_million_km: 12,
    rivers_over_1000km_free_flowing_pct: 37,
    rivers_over_1000km_not_free_flowing_pct: 63,
    long_rivers_flowing_uninterrupted_to_ocean_pct: 23,
    estimated_global_dam_count_million: 2.8,
    inland_fisheries_population_service_scope_million: 158,
    leading_anthropogenic_fragmentation_classes: ['dams', 'reservoirs', 'upstream and downstream flow regulation'],
    persistence_years_to_2026: 7,
    geography_boundary: 'Twelve million kilometres of the global river network, with reported long-river statistics for rivers longer than 1,000 kilometres',
    source_locators: [
      'Primary assessment abstract: 37% of rivers longer than 1,000 km remain free-flowing and 23% flow uninterrupted to the ocean.',
      'Primary assessment: dams, reservoirs and associated regulation are leading contributors to connectivity loss.',
      'University of Washington institutional summary: 2.8 million dams and inland fisheries supporting 158 million people.'
    ]
  }
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, metric_contract_ids: snapshot.metric_contract_ids }, null, 2));
