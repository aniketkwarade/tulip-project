import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const outDir = resolve(root, 'artifacts/tulip-calibration-2026-09-22');
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const [audit, catalogue, registry] = await Promise.all([
  json('artifacts/tulip-calibration-2026-09-22/internal-catalogue-audit-pass-2.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json'),
  json('public/tulip-assessments.json'),
]);

const classifications = {
  reservoir_storage_instability: ['affected_share_reach', 'Use only as a reservoir-system reach proxy after confirming the assessed-reservoir denominator; it is not loss magnitude within one affected ecosystem.'],
  watershed_forest_loss: ['trend_rate', 'Treat as cumulative or annualized forest-cover change. Convert to current affected share only with a matching forest-area denominator; do not use it as local condition severity.'],
  irrigation_water_inefficiency: ['pressure_or_physical_state', 'Treat withdrawal loss as a water-use efficiency or pressure measure. It needs a receptor-specific ecological consequence before entering ecosystem severity or reach.'],
  antarctic_bottom_water_decline: ['pressure_or_physical_state', 'Treat water-mass decline as a physical ocean-state change. It needs measured biological or ecosystem-function consequences before entering ecosystem severity.'],
  marine_food_web_simplification: ['affected_share_reach', 'Treat the threatened share of assessed species as an assessed-species reach proxy, subject to taxonomic and assessment-coverage limits.'],
  harmful_algal_blooms: ['affected_share_reach', 'Treat the share of events with mass mortality as event-distribution evidence. Event share does not measure the severity inside each affected ecosystem.'],
  biodiversity_intactness_loss: ['condition_magnitude', 'This is a candidate severity input because it measures average native-species abundance relative to a reference condition. It still requires a source-specific review of model uncertainty and the ecological denominator.'],
  species_range_compression: ['affected_share_reach', 'Treat the threatened share of assessed species as a coverage proxy, not the amount of range lost within an affected species.'],
  insect_biomass_decline: ['proxy_mismatch', 'The threatened-species percentage does not measure insect biomass decline. Remove it from this node unless a source establishes a direct compatible link.'],
  urban_tree_canopy_loss: ['transition_fate', 'The share of lost canopy converted to impervious cover describes the fate and likely persistence of lost area. It does not measure condition severity across the remaining urban forest.'],
  cold_chain_failure_risk: ['human_or_service_outcome', 'Food-production loss is a material or food-system outcome. It may inform human severity or reach with a compatible denominator, but it is not ecosystem-condition loss.'],
  adaptation_capital_shortfall: ['trend_rate', 'A decline in adaptation momentum is a finance or implementation trend. It cannot set ecosystem severity without a demonstrated receptor consequence.'],
  pollinator_colony_collapse: ['human_or_service_outcome', 'Fruit-production loss is an ecosystem-service and food-production outcome. Keep it separate from pollinator population or colony-condition severity.'],
  cattle_grazing_overcompaction: ['condition_magnitude', 'This is a candidate severity input because it measures infiltration-function loss under the assessed high-density treatment. Representativeness and the affected-soil denominator still require review.'],
  phytoplankton_decline: ['trend_rate', 'A production decline per decade is a rate. Establish a reference-period cumulative condition change before considering severity, and keep affected distribution separate.'],
  ice_albedo_feedback_loops: ['trend_rate', 'Snow-cover decline per decade is a physical trend and spatial-state measure. It is not a percentage of ecosystem function lost.'],
  groundwater_depletion_wells: ['affected_share_reach', 'The share of systems with accelerating decline may inform affected-system reach. It is not the magnitude of ecological damage within each system.'],
  peatland_degradations: ['affected_share_reach', 'The drained-or-degraded share is an affected-habitat reach measure. Local peatland condition loss and recovery must be assessed separately.'],
  kelp_forest_collapse: ['affected_share_reach', 'The share of ecoregions showing decline is a distribution proxy. It does not measure the severity of decline within affected kelp forests.'],
  trophic_cascade_collapses: ['proxy_mismatch', 'The threatened-species percentage does not measure trophic-cascade disruption. Remove it unless the source supplies a direct cascade endpoint.'],
  genetic_diversity_bottlenecks: ['proxy_mismatch', 'The threatened-species percentage does not measure within-population genetic diversity or bottleneck severity. Remove it from this axis.'],
  riverine_habitat_fragmentation: ['affected_share_reach', 'The share of long rivers that are not free-flowing is a river-network reach measure. It is not the condition loss within every fragmented reach.'],
  seagrass_meadow_decline: ['trend_rate', 'Annual habitat-loss rate is a trend. Derive a current-window affected share against a matching seagrass baseline before using it for reach; do not map the rate directly to severity.'],
  dam_and_diversion_infrastructure: ['affected_share_reach', 'The share of long rivers that are not free-flowing is a network reach proxy. Dam-specific ecological severity requires receptor evidence.'],
};

const reviewedPercentages = {
  reservoir_storage_instability: 53,
  watershed_forest_loss: 0.1144,
  irrigation_water_inefficiency: 40,
  antarctic_bottom_water_decline: 30,
  marine_food_web_simplification: 25,
  harmful_algal_blooms: 7,
  biodiversity_intactness_loss: 20,
  species_range_compression: 25,
  insect_biomass_decline: 25,
  urban_tree_canopy_loss: 32,
  cold_chain_failure_risk: 12,
  adaptation_capital_shortfall: 7.142857,
  pollinator_colony_collapse: 7.1,
  cattle_grazing_overcompaction: 82.45614,
  phytoplankton_decline: 14.3,
  ice_albedo_feedback_loops: 13.4,
  groundwater_depletion_wells: 30,
  peatland_degradations: 12,
  kelp_forest_collapse: 38,
  trophic_cascade_collapses: 25,
  genetic_diversity_bottlenecks: 25,
  riverine_habitat_fragmentation: 63,
  seagrass_meadow_decline: 7,
  dam_and_diversion_infrastructure: 63,
};

function numericFacts(value, path = '', output = []) {
  if (typeof value === 'number' && Number.isFinite(value)) output.push({ path, value });
  else if (Array.isArray(value)) value.forEach((item, index) => numericFacts(item, `${path}[${index}]`, output));
  else if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) numericFacts(item, path ? `${path}.${key}` : key, output);
  }
  return output;
}

const byId = new Map(catalogue.issues.map(row => [row.nodeId, row]));
const appliedNonSeverityReviews = new Set([
  'cold_chain_failure_risk',
  'dam_and_diversion_infrastructure',
  'groundwater_depletion_wells',
  'harmful_algal_blooms',
  'ice_albedo_feedback_loops',
  'marine_food_web_simplification',
  'peatland_degradations',
  'phytoplankton_decline',
  'reservoir_storage_instability',
  'riverine_habitat_fragmentation',
  'species_range_compression',
  'watershed_forest_loss',
]);
const flaggedIds = audit.nodes
  .filter(row => row.calibrationFlags.includes('ecosystem_percentage_held_for_semantic_review'))
  .map(row => row.nodeId)
  .sort();
const stillHeldIds = Object.entries(classifications)
  .filter(([nodeId, [semanticClass]]) => !['condition_magnitude', 'proxy_mismatch'].includes(semanticClass) && !appliedNonSeverityReviews.has(nodeId))
  .map(([nodeId]) => nodeId)
  .sort();
assert.deepEqual(stillHeldIds, flaggedIds, 'The audit queue must retain only classifications that have not yet been applied');

assert.deepEqual(Object.keys(reviewedPercentages).sort(), Object.keys(classifications).sort());
const rows = Object.keys(classifications).sort().map(nodeId => {
  const row = byId.get(nodeId);
  const scoredDimension = row.candidate.decisionTrace.axisBasis.ecosystem ? 'ecosystem' : 'human';
  const basis = row.candidate.decisionTrace.axisBasis[scoredDimension].severity.basis;
  const percentage = reviewedPercentages[nodeId];
  const matchingFacts = (registry.records[nodeId].evidenceAudit.observations ?? []).flatMap((observation, index) => (
    numericFacts(observation.value, `observations[${index}].${observation.role}`)
      .filter(fact => Math.abs(fact.value - percentage) < 1e-7)
      .map(fact => ({ ...fact, role: observation.role }))
  ));
  assert(matchingFacts.length, `${nodeId}: source fact not found for ${percentage}%`);
  const [semanticClass, scoringDisposition] = classifications[nodeId];
  return {
    nodeId,
    name: row.name,
    grade: row.result.grade.letter,
    value: row.result.value,
    confidence: row.result.confidence,
    percentage,
    semanticClass,
    scoredDimension,
    matchingFacts,
    currentSeverityBasis: basis,
    scoringDisposition,
    status: appliedNonSeverityReviews.has(nodeId)
      ? 'source_specific_nonseverity_review_applied'
      : semanticClass === 'condition_magnitude'
      ? 'source_specific_severity_review_applied'
      : semanticClass === 'proxy_mismatch'
        ? 'incompatible_proxy_removed_from_severity_trace'
        : 'route_to_nonseverity_evidence_role',
  };
});

const classCounts = Object.fromEntries([...new Set(rows.map(row => row.semanticClass))].sort().map(semanticClass => [
  semanticClass,
  rows.filter(row => row.semanticClass === semanticClass).length,
]));
const summary = {
  reviewedPercentages: rows.length,
  classCounts,
  conditionMagnitudeCandidates: rows.filter(row => row.semanticClass === 'condition_magnitude').length,
  incompatibleProxies: rows.filter(row => row.semanticClass === 'proxy_mismatch').length,
  nonSeverityRoutes: rows.filter(row => !['condition_magnitude', 'proxy_mismatch'].includes(row.semanticClass)).length,
  sourceSpecificNonSeverityReviewsApplied: rows.filter(row => row.status === 'source_specific_nonseverity_review_applied').length,
};
const digest = createHash('sha256').update(JSON.stringify({ summary, rows })).digest('hex');
const output = {
  version: 'tulip_internal_ecosystem_percentage_semantics_2026_09_23_v2',
  generatedOn: '2026-09-23',
  status: 'internal_semantic_review_complete_scoring_follow_up_queued',
  productionRatingsEnabled: 0,
  rules: [
    'Severity requires condition or function loss within an affected receptor.',
    'Reach requires an affected share with a compatible population, habitat, ecosystem or system denominator.',
    'A trend rate must first be converted to a current-window state against a declared reference.',
    'A pressure or physical state requires a receptor link before it becomes terminal harm.',
    'Human, material and ecosystem-service outcomes do not automatically measure ecosystem condition.',
    'A proxy that does not measure the named node is removed rather than reinterpreted.',
  ],
  summary,
  rows,
  digest,
};

const report = `# TULIP ecosystem-percentage semantic review\n\nThis review classifies every percentage that the generic catalogue pass previously could have mistaken for exact ecosystem severity. No public rating is enabled by this artifact.\n\n## Result\n\n- Percentages reviewed: **${summary.reviewedPercentages}**.\n- Direct condition-magnitude candidates requiring source-specific adjudication: **${summary.conditionMagnitudeCandidates}**.\n- Incompatible proxies to remove from the axis: **${summary.incompatibleProxies}**.\n- Measurements routed to reach, trend, pressure, service outcome or transition evidence: **${summary.nonSeverityRoutes}** (${summary.sourceSpecificNonSeverityReviewsApplied} already applied in a source-specific rating review).\n- Classes: ${Object.entries(classCounts).map(([key, count]) => `${key} ${count}`).join(', ')}.\n\n## Decisions\n\n${rows.map(row => `- **${row.name} (${row.percentage}%) — ${row.semanticClass.replaceAll('_', ' ')}.** ${row.scoringDisposition}`).join('\n')}\n`;

const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csv = [[
  'Node ID', 'Node', 'Grade', 'Value', 'Confidence', 'Percentage', 'Semantic class', 'Status', 'Matching fact paths', 'Scoring disposition',
], ...rows.map(row => [
  row.nodeId, row.name, row.grade, row.value, row.confidence, row.percentage, row.semanticClass,
  row.status, row.matchingFacts.map(fact => fact.path).join('; '), row.scoringDisposition,
])].map(columns => columns.map(csvCell).join(',')).join('\n') + '\n';

await Promise.all([
  writeFile(resolve(outDir, 'internal-ecosystem-percentage-semantics.json'), JSON.stringify(output, null, 2) + '\n'),
  writeFile(resolve(outDir, 'internal-ecosystem-percentage-semantics.csv'), csv),
  writeFile(resolve(outDir, 'internal-ecosystem-percentage-semantics-report.md'), report),
]);

console.log(JSON.stringify({ summary, digest }, null, 2));
