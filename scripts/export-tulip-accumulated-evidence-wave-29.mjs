import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/unep-unwater-freshwater-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

function build({ nodeId, components, rawInputs, transformations, passed, failures }) {
  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(a.assessment_year),
    components,
    raw_inputs: {
      ...rawInputs,
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        source_locators: a.source_locators,
        excluded_from_scoring: snapshot.excluded_from_scoring
      }
    },
    transformations,
    source_ids: ['unep_un_water_progress_on_water_related_ecosystems_2024'],
    uncertainty: snapshot.uncertainty,
    freshness: `UNEP and UN-Water SDG 6.6.1 assessment ${a.assessment_year}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: { selected_method_passed: passed, higher_priority_failures: failures }
  });
}

const receipts = [
  build({
    nodeId: 'surface_water_inflow_deficit',
    components: {
      biophysical_burden: round(normalizeWithAnchors(a.reduced_flow_basin_count_increase_multiple_vs_15_years_earlier, [1, 2, 4, 8], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(a.people_in_reduced_flow_basins_million, [0, 10, 50, 250], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(a.reduced_flow_comparison_years, [0, 5, 10, 20], 'higher_is_worse')),
      extent: round(a.river_basins_with_significantly_decreased_flow / a.total_river_basins_assessed)
    },
    rawInputs: {
      biophysical_burden: { affected_basins: a.river_basins_with_significantly_decreased_flow, increase_multiple: a.reduced_flow_basin_count_increase_multiple_vs_15_years_earlier, anchors_multiple: [1, 2, 4, 8], boundary: 'Significantly decreased-flow basin inventory; no cause or storage response is assigned.' },
      human_economic_burden: { people_in_affected_basins_million: a.people_in_reduced_flow_basins_million, anchors_million_people: [0, 10, 50, 250], boundary: 'Resident exposure, not a count of measured household shortages or economic losses.' },
      persistence: { comparison_years: a.reduced_flow_comparison_years, anchors_years: [0, 5, 10, 20] },
      extent: { affected_basins: a.river_basins_with_significantly_decreased_flow, assessed_basins: a.total_river_basins_assessed, normalized_value: round(a.river_basins_with_significantly_decreased_flow / a.total_river_basins_assessed) }
    },
    transformations: [
      { type: 'source_reported_basin_growth_ratio', formula: 'Normalize the source-reported fivefold increase in significantly decreased-flow basins.' },
      { type: 'fixed_population_range', formula: 'Normalize resident population in affected basins without relabeling exposure as shortage.' },
      { type: 'assessed_basin_extent', formula: 'Divide affected basins by assessed basins; do not treat unassessed basins as unaffected.' }
    ],
    passed: 'UN-Water quantifies the accumulated global reduced-inflow basin inventory, exposed population, 15-year comparison and assessed-basin extent.',
    failures: ['The USGS operational source is station- and US-bounded and cannot provide a current global aggregation.', 'The global assessment does not provide a complete 20-year annual observation panel, so it remains accumulated impact.']
  }),
  build({
    nodeId: 'surface_water_storage_instability',
    components: {
      biophysical_burden: round(normalizeWithAnchors(a.surface_water_basins_with_receding_permanent_water, [0, 100, 250, 500], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(a.people_in_receding_surface_water_basins_million, [0, 10, 50, 250], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(a.permanent_water_evidence_span_years, [0, 5, 15, 25], 'higher_is_worse')),
      extent: round(a.surface_water_basins_with_receding_permanent_water / a.total_surface_water_basins_assessed)
    },
    rawInputs: {
      biophysical_burden: { receding_permanent_water_basins: a.surface_water_basins_with_receding_permanent_water, anchors_basin_count: [0, 100, 250, 500], boundary: 'Basins with source-identified permanent surface-water loss; basin count is not converted to lost area or volume.' },
      human_economic_burden: { people_in_receding_water_basins_million: a.people_in_receding_surface_water_basins_million, anchors_million_people: [0, 10, 50, 250], boundary: 'Resident exposure, not realized household or economic loss.' },
      persistence: { baseline_period: `${a.permanent_water_baseline_start_year}-${a.permanent_water_baseline_end_year}`, observation_period: `${a.permanent_water_observation_start_year}-${a.permanent_water_observation_end_year}`, evidence_span_years: a.permanent_water_evidence_span_years, anchors_years: [0, 5, 15, 25] },
      extent: { affected_basins: a.surface_water_basins_with_receding_permanent_water, assessed_basins: a.total_surface_water_basins_assessed, normalized_value: round(a.surface_water_basins_with_receding_permanent_water / a.total_surface_water_basins_assessed) }
    },
    transformations: [
      { type: 'bounded_permanent_water_loss_inventory', formula: 'Normalize the affected-basin count without converting basin count to area or volume.' },
      { type: 'fixed_population_range', formula: 'Normalize resident population in affected basins without treating exposure as shortage.' },
      { type: 'source_period_span', formula: 'Retain the 2000-2019 reference and 2017-2021 observation periods as a 21-year evidence span.' },
      { type: 'assessed_basin_extent', formula: 'Divide affected basins by assessed basins; do not fill unassessed basins with zero.' }
    ],
    passed: 'UN-Water quantifies permanent surface-water recession in 364 basins, exposed population, a fixed satellite comparison boundary and global assessed-basin extent.',
    failures: ['No current global annual storage panel supplies magnitude plus threshold or momentum.', 'The assessment reports basin recession rather than a comparable annual global storage series, so it remains accumulated impact.']
  })
];

for (const item of receipts) {
  const verification = verifyTulipUrgencyReceipt(item);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${item.node_id}: ${verification.errors.join('; ')}`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_29_unep_unwater_surface_water',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'unep_un_water_progress_on_water_related_ecosystems_2024',
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-29.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-29.json', promoted_node_count: receipts.length, receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
