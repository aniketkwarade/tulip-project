import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildTulipUrgencyReceipt,
  normalizeWithAnchors,
  qualifiesForImpactFallback,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-urban-tree-cover-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const cover = snapshot.assessment.global_cover_change;
const persistence = snapshot.assessment.persistence_context;
const human = snapshot.assessment.human_economic_burden;
const extent = snapshot.assessment.global_extent;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(cover.approximate_study_period_loss_hectares, [0, 50000, 150000, 300000]),
  human_economic_burden: n(human.annual_estimated_benefit_loss_usd_2018, [0, 10000000, 100000000, 1000000000]),
  persistence: n(persistence.tree_cover_loss_converted_to_impervious_pct, [0, 10, 25, 50]),
  extent: n(extent.continents_with_net_tree_cover_loss, [0, 1, 3, 6])
};

if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) {
  throw new Error('urban_tree_canopy_loss: accumulated-impact gate failed');
}

const receipt = buildTulipUrgencyReceipt({
  node_id: 'urban_tree_canopy_loss',
  method: 'impact_fallback',
  as_of: String(cover.end_year),
  components,
  raw_inputs: {
    biophysical_burden: {
      urban_tree_cover_start_pct: cover.urban_tree_cover_start_pct,
      urban_tree_cover_end_pct: cover.urban_tree_cover_end_pct,
      annual_tree_cover_loss_hectares: cover.annual_tree_cover_loss_hectares,
      approximate_study_period_loss_hectares: cover.approximate_study_period_loss_hectares,
      statistically_significant_global_decline: cover.statistically_significant_global_decline,
      normalization_anchors_hectares: [0, 50000, 150000, 300000]
    },
    human_economic_burden: {
      bounded_geography: human.bounded_geography,
      annual_tree_loss_count: human.annual_tree_loss_count,
      annual_estimated_benefit_loss_usd_2018: human.annual_estimated_benefit_loss_usd_2018,
      normalization_anchors_usd_2018: [0, 10000000, 100000000, 1000000000],
      scoring_boundary: human.scoring_boundary
    },
    persistence: {
      tree_cover_loss_converted_to_impervious_pct: persistence.tree_cover_loss_converted_to_impervious_pct,
      global_annual_impervious_cover_gain_hectares: persistence.global_annual_impervious_cover_gain_hectares,
      normalization_anchors_pct: [0, 10, 25, 50],
      scoring_boundary: persistence.scoring_boundary
    },
    extent: {
      inhabited_continents_assessed: extent.inhabited_continents_assessed,
      continents_with_net_tree_cover_loss: extent.continents_with_net_tree_cover_loss,
      continents_with_net_tree_cover_loss_names: extent.continents_with_net_tree_cover_loss_names,
      normalization_anchors_continents: [0, 1, 3, 6]
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at
    }
  },
  transformations: [
    {
      type: 'observed_global_tree_cover_loss_normalization',
      formula: 'Multiply the source-reported annual urban tree-cover loss by the approximately five-year observation period, then normalize the resulting bounded accumulated area.'
    },
    {
      type: 'bounded_economic_burden_normalization',
      formula: 'Normalize the independently estimated annual value of lost urban-tree benefits in the United States; retain its national boundary and do not extrapolate it globally.'
    },
    {
      type: 'impervious_conversion_persistence_normalization',
      formula: 'Normalize the observed share of global urban tree-cover loss converted to impervious cover; do not classify the remaining loss as irreversible.'
    },
    {
      type: 'inhabited_continent_extent_normalization',
      formula: 'Normalize the five inhabited continents with net urban tree-cover loss out of the six assessed.'
    },
    {
      type: 'impact_composite',
      formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1–10 with 1 + 9 × composite and round to one decimal.'
    }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Global paired-image observations end in ${cover.end_year}; peer-reviewed global synthesis published in 2020, with bounded United States economic-burden evidence published in 2018 and reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'Peer-reviewed studies quantify a statistically significant global accumulated urban tree-cover loss, a bounded annual economic-service loss, observed conversion to impervious cover and loss across five inhabited continents.',
    higher_priority_failures: ['Only two global cover endpoints are available, ending in 2017; the record cannot satisfy the historical-distribution or current momentum requirements for current_data.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for urban_tree_canopy_loss.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_50_global_urban_tree_cover_loss',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-50.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-50.json',
  promoted_node_count: registry.promoted_node_count,
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
