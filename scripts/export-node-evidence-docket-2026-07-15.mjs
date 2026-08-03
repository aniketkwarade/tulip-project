import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const intakePath = path.join(ROOT, 'docs', 'source-intake-pack-2026-07-15.json');
const attachmentsPath = path.join(ROOT, 'public', 'node-source-attachments.json');
const outputJsonPath = path.join(ROOT, 'docs', 'node-evidence-docket-2026-07-15.json');
const outputMdPath = path.join(ROOT, 'docs', 'node-evidence-docket-2026-07-15.md');

const NODE_SOURCE_PLAN = {
  aerosol_cooling_loss: {
    priority: 'high',
    target_outcome: 'upgrade anchor grounding and replace family-only aerosol logic with explicit forcing evidence',
    sources: [1, 2, 42],
    next_action: 'attach_reasoning_bundle'
  },
  grid_peak_load_stress: {
    priority: 'high',
    target_outcome: 'strengthen grid reliability and heat-load mechanism support',
    sources: [3, 4, 84, 85],
    next_action: 'attach_reasoning_bundle'
  },
  cooling_water_competition: {
    priority: 'high',
    target_outcome: 'add direct industrial cooling and thermoelectric water-use support',
    sources: [4, 5, 6],
    next_action: 'snapshot_or_reasoning_mix'
  },
  critical_infrastructure_fragility: {
    priority: 'high',
    target_outcome: 'ground infrastructure-failure pathways in climate resilience assessments',
    sources: [3, 7, 8],
    next_action: 'attach_reasoning_bundle'
  },
  adaptation_capital_shortfall: {
    priority: 'high',
    target_outcome: 'ground adaptation-finance gap with dated official assessments',
    sources: [9, 10],
    next_action: 'attach_reasoning_bundle'
  },
  insurance_retreat: {
    priority: 'high',
    target_outcome: 'replace generic retreat framing with regulator and market evidence',
    sources: [11, 12],
    next_action: 'attach_reasoning_bundle'
  },
  mortgage_market_exposure: {
    priority: 'high',
    target_outcome: 'strengthen housing-finance climate-risk mechanisms',
    sources: [13, 14],
    next_action: 'attach_reasoning_bundle'
  },
  shipping_lane_disruption: {
    priority: 'high',
    target_outcome: 'ground maritime chokepoint and climate-disruption claims',
    sources: [15, 16],
    next_action: 'attach_reasoning_bundle'
  },
  road_freight_diesel_lock_in: {
    priority: 'high',
    target_outcome: 'ground heavy-duty diesel dependence and electrification barriers',
    sources: [17, 18],
    next_action: 'operational_plus_reasoning'
  },
  food_import_exposure: {
    priority: 'high',
    target_outcome: 'ground trade-linked food vulnerability in FAO evidence',
    sources: [19, 20],
    next_action: 'attach_reasoning_bundle'
  },
  crop_yield_volatility: {
    priority: 'high',
    target_outcome: 'ground crop-yield instability in IPCC and observational crop studies',
    sources: [21, 22],
    next_action: 'attach_reasoning_bundle'
  },
  farm_heat_stress: {
    priority: 'high',
    target_outcome: 'upgrade farm labor and agricultural heat-stress support',
    sources: [23, 24],
    next_action: 'operational_plus_reasoning'
  },
  vector_borne_disease_expansion: {
    priority: 'high',
    target_outcome: 'ground disease range and transmission risk in health evidence',
    sources: [25, 33],
    next_action: 'attach_reasoning_bundle'
  },
  public_health_heat_burden: {
    priority: 'high',
    target_outcome: 'strengthen heat-health burden with health indicators and public-health assessments',
    sources: [24, 27, 28],
    next_action: 'operational_plus_reasoning'
  },
  disaster_recovery_inequality: {
    priority: 'high',
    target_outcome: 'ground unequal disaster recovery outcomes in public accountability sources',
    sources: [29, 30],
    next_action: 'attach_reasoning_bundle'
  },
  relocation_governance_capacity: {
    priority: 'high',
    target_outcome: 'ground planned relocation and internal migration governance claims',
    sources: [31, 32],
    next_action: 'attach_reasoning_bundle'
  },
  conflict_risk_escalation: {
    priority: 'high',
    target_outcome: 'replace generic conflict framing with careful risk-multiplier evidence',
    sources: [34],
    next_action: 'attach_reasoning_bundle'
  },
  basin_treaty_breakdown: {
    priority: 'high',
    target_outcome: 'ground transboundary water treaty strain and allocation conflict',
    sources: [35, 36],
    next_action: 'attach_reasoning_bundle'
  },
  freshwater_ecosystem_collapse: {
    priority: 'high',
    target_outcome: 'strengthen freshwater ecosystem decline with IPCC and UNEP ecosystem evidence',
    sources: [37, 38],
    next_action: 'attach_reasoning_bundle'
  },
  soil_moisture_collapse: {
    priority: 'high',
    target_outcome: 'promote true soil-moisture observational support',
    sources: [39, 40, 41],
    next_action: 'snapshot_candidate_requires_auth_review'
  },
  drought_persistence: {
    priority: 'high',
    target_outcome: 'strengthen drought persistence with observatory and soil-moisture evidence',
    sources: [39, 40, 41, 42],
    next_action: 'snapshot_candidate_requires_auth_review'
  },
  drinking_water_treatment_stress: {
    priority: 'high',
    target_outcome: 'ground water-treatment burden in utility resilience and HAB evidence',
    sources: [43, 44],
    next_action: 'operational_plus_reasoning'
  },
  desalination_dependence: {
    priority: 'medium',
    target_outcome: 'ground desalination dependence in water-scarcity infrastructure evidence',
    sources: [45, 46],
    next_action: 'attach_reasoning_bundle'
  },
  coastal_hypoxia: {
    priority: 'high',
    target_outcome: 'strengthen low-oxygen coastal-state reasoning',
    sources: [47, 48],
    next_action: 'attach_reasoning_bundle'
  },
  marine_fisheries_collapse: {
    priority: 'high',
    target_outcome: 'ground fishery decline and protein dependency in fisheries assessments',
    sources: [49, 50],
    next_action: 'attach_reasoning_bundle'
  },
  reef_structural_collapse: {
    priority: 'high',
    target_outcome: 'add structural reef-growth and bleaching intelligence',
    sources: [51, 52],
    next_action: 'operational_plus_reasoning'
  },
  mangrove_buffer_loss: {
    priority: 'high',
    target_outcome: 'promote mangrove protection from generic coastal support to direct evidence',
    sources: [53, 54],
    next_action: 'operational_plus_reasoning'
  },
  oceanic_carbon_sink_saturation: {
    priority: 'high',
    target_outcome: 'add direct ocean carbon sink support instead of indirect ocean-state spillover',
    sources: [55, 56],
    next_action: 'operational_plus_reasoning'
  },
  ice_sheet_mass_loss: {
    priority: 'high',
    target_outcome: 'replace generic cryosphere support with direct mass-balance evidence',
    sources: [57, 58],
    next_action: 'operational_plus_reasoning'
  },
  sea_ice_season_loss: {
    priority: 'high',
    target_outcome: 'strengthen seasonal sea-ice decline with direct Arctic monitoring',
    sources: [59, 60],
    next_action: 'operational_plus_reasoning'
  },
  permafrost_thaw: {
    priority: 'high',
    target_outcome: 'strengthen permafrost thaw with direct network support and polar assessment reasoning',
    sources: [61, 62],
    next_action: 'operational_plus_reasoning'
  },
  monsoon_volatility: {
    priority: 'high',
    target_outcome: 'replace broad climate forcing spillover with monsoon-specific evidence',
    sources: [63, 64],
    next_action: 'attach_reasoning_bundle'
  },
  el_nino: {
    priority: 'medium',
    target_outcome: 'add direct ENSO monitoring support',
    sources: [66, 67],
    next_action: 'operational_plus_context'
  },
  la_nina: {
    priority: 'medium',
    target_outcome: 'add direct La Niña monitoring and teleconnection support',
    sources: [66, 68],
    next_action: 'operational_plus_reasoning'
  },
  forest_fragmentation: {
    priority: 'high',
    target_outcome: 'upgrade fragmentation from generic forest loss to biodiversity-aware evidence',
    sources: [69, 70],
    next_action: 'operational_plus_reasoning'
  },
  pollinator_service_decline: {
    priority: 'high',
    target_outcome: 'ground pollinator decline and crop-service risk',
    sources: [71, 72],
    next_action: 'attach_reasoning_bundle'
  },
  peatland_degradation: {
    priority: 'high',
    target_outcome: 'ground peat degradation in global peatland and wetlands accounting evidence',
    sources: [73, 74],
    next_action: 'attach_reasoning_bundle'
  },
  wildfire_regime_shift: {
    priority: 'high',
    target_outcome: 'add direct fire-detection and fire-regime support',
    sources: [75],
    next_action: 'auth_gated_snapshot_candidate'
  },
  fast_fashion: {
    priority: 'medium',
    target_outcome: 'strengthen apparel-system burden with direct textile evidence',
    sources: [76, 77],
    next_action: 'attach_reasoning_bundle'
  },
  thermal_inversion_events: {
    priority: 'medium',
    target_outcome: 'ground inversion dynamics and pollution trapping',
    sources: [78, 79],
    next_action: 'attach_reasoning_bundle'
  },
  nitrous_oxide: {
    priority: 'high',
    target_outcome: 'promote N2O from generic chemistry node to benchmarked atmospheric support',
    sources: [80, 81],
    next_action: 'operational_plus_reasoning'
  },
  cold_chain_failure_risk: {
    priority: 'medium',
    target_outcome: 'ground cold-chain vulnerability in food and medical logistics sources',
    sources: [82, 83],
    next_action: 'attach_reasoning_bundle'
  },
  transmission_buildout_lag: {
    priority: 'high',
    target_outcome: 'ground transmission delay and queue stress in official grid studies',
    sources: [84, 85],
    next_action: 'attach_reasoning_bundle'
  },
  semiconductor_fabrication_footprint: {
    priority: 'high',
    target_outcome: 'ground fab water, power, and materials burden in direct sector evidence',
    sources: [86, 87],
    next_action: 'attach_reasoning_bundle'
  }
};

const sourceRegistry = JSON.parse(await fs.readFile(intakePath, 'utf8'));
const attachments = JSON.parse(await fs.readFile(attachmentsPath, 'utf8'));

const sourceById = new Map(sourceRegistry.entries.map(entry => [entry.id, entry]));

function currentBundlesForNode(nodeId) {
  return attachments.rules
    .filter(rule => (rule.node_ids || []).includes(nodeId))
    .flatMap(rule => rule.bundle_ids || []);
}

const entries = Object.entries(NODE_SOURCE_PLAN).map(([node_id, plan]) => {
  const recommended_sources = plan.sources
    .map(id => sourceById.get(id))
    .filter(Boolean)
    .map(source => ({
      id: source.id,
      source: source.source,
      intake_disposition: source.intake_disposition,
      priority_group: source.priority_group,
      usable_surface: source.usable_surface,
      access_notes: source.access_notes,
      best_tulip_use: source.best_tulip_use,
      reasoning_families: source.reasoning_families
    }));

  return {
    node_id,
    priority: plan.priority,
    target_outcome: plan.target_outcome,
    next_action: plan.next_action,
    current_bundle_ids: currentBundlesForNode(node_id),
    recommended_sources
  };
});

const docket = {
  generated_at: new Date().toISOString(),
  generated_from: [
    path.relative(ROOT, intakePath),
    path.relative(ROOT, attachmentsPath)
  ],
  summary: {
    total_nodes: entries.length,
    high_priority_nodes: entries.filter(entry => entry.priority === 'high').length,
    medium_priority_nodes: entries.filter(entry => entry.priority === 'medium').length,
    nodes_with_no_current_bundles: entries.filter(entry => entry.current_bundle_ids.length === 0).length
  },
  entries
};

await fs.writeFile(outputJsonPath, `${JSON.stringify(docket, null, 2)}\n`, 'utf8');

const markdown = [
  '# Node Evidence Docket',
  '',
  'Generated: 2026-07-15',
  '',
  'Purpose: map the new source pack onto weak or under-supported TULIP nodes.',
  '',
  `- Total targeted nodes: ${docket.summary.total_nodes}`,
  `- High priority nodes: ${docket.summary.high_priority_nodes}`,
  `- Medium priority nodes: ${docket.summary.medium_priority_nodes}`,
  `- Nodes with no current attachment bundles: ${docket.summary.nodes_with_no_current_bundles}`,
  '',
  '## Priority Nodes',
  ''
];

for (const entry of entries) {
  markdown.push(`### \`${entry.node_id}\``);
  markdown.push(`- Priority: ${entry.priority}`);
  markdown.push(`- Target outcome: ${entry.target_outcome}`);
  markdown.push(`- Next action: ${entry.next_action}`);
  markdown.push(`- Current bundles: ${entry.current_bundle_ids.length ? entry.current_bundle_ids.map(id => `\`${id}\``).join(', ') : 'none'}`);
  markdown.push('- Recommended sources:');
  for (const source of entry.recommended_sources) {
    markdown.push(`  - [${source.source}] via intake id ${source.id} (${source.intake_disposition})`);
  }
  markdown.push('');
}

await fs.writeFile(outputMdPath, `${markdown.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  json: path.relative(ROOT, outputJsonPath),
  markdown: path.relative(ROOT, outputMdPath),
  total_nodes: docket.summary.total_nodes
}, null, 2));
