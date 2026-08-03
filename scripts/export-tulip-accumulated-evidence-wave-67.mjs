import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/gao-road-stream-crossing-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.combined_barrier_culverts_identified_and_estimated, anchors.barrier_culverts),
  human_economic_burden: n(impact.combined_estimated_restoration_cost_usd, anchors.restoration_cost_usd),
  persistence: n(impact.conservative_persistence_years, anchors.backlog_duration_years),
  extent: n(impact.represented_us_state_count, anchors.represented_us_states)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('road_stream_crossing_barriers: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'road_stream_crossing_barriers',
  method: 'impact_fallback',
  as_of: snapshot.metric_contract.observation_date,
  components,
  raw_inputs: {
    biophysical_burden: {
      combined_culverts_on_fish_bearing_streams: impact.combined_culverts_on_fish_bearing_streams,
      combined_culverts_assessed_for_fish_passage: impact.combined_culverts_assessed_for_fish_passage,
      combined_barrier_culverts_identified: impact.combined_barrier_culverts_identified,
      combined_additional_barrier_culverts_estimated: impact.combined_additional_barrier_culverts_estimated,
      combined_barrier_culverts_identified_and_estimated: impact.combined_barrier_culverts_identified_and_estimated,
      normalization_anchors_barrier_culverts: anchors.barrier_culverts
    },
    human_economic_burden: {
      blm_estimated_restoration_cost_usd: impact.blm.estimated_restoration_cost_usd,
      forest_service_estimated_restoration_cost_usd: impact.forest_service.estimated_restoration_cost_usd,
      combined_estimated_restoration_cost_usd: impact.combined_estimated_restoration_cost_usd,
      normalization_anchors_usd: anchors.restoration_cost_usd,
      boundary: 'Agency-estimated passage-restoration cost; not a valuation of all ecological or road-safety harm.'
    },
    persistence: {
      blm_estimated_backlog_clearance_years: impact.blm.estimated_backlog_clearance_years,
      forest_service_estimated_backlog_clearance_years_lower_bound: impact.forest_service.estimated_backlog_clearance_years_lower_bound,
      scored_conservative_persistence_years: impact.conservative_persistence_years,
      normalization_anchors_years: anchors.backlog_duration_years
    },
    extent: {
      represented_us_states: impact.represented_us_states,
      represented_us_state_count: impact.represented_us_state_count,
      directly_assessed_country_count: impact.directly_assessed_country_count,
      normalization_anchors_states: anchors.represented_us_states
    },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, report_number: snapshot.sources[0].report_number, source_locators: snapshot.sources[0].source_locators }
  },
  transformations: [
    { type: 'assessed_and_estimated_barrier_accounting', formula: 'Add BLM and Forest Service identified barrier culverts to their separately labeled additional estimates; never classify the remaining unassessed inventory as barriers or clean crossings.' },
    { type: 'agency_cost_sum', formula: 'Add the two source-reported agency restoration-cost estimates without inflation adjustment or conversion to ecological damage.' },
    { type: 'conservative_backlog_duration', formula: 'Use the shorter 25-year BLM clearance estimate; retain the Forest Service estimate of more than 100 years as unscored context.' },
    { type: 'bounded_extent', formula: 'Normalize the two directly assessed states; the federal-land inventory is not expanded to national or global coverage.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Inventory and cost assessment dated ${snapshot.metric_contract.observation_date}; GAO report published ${snapshot.sources[0].publication_date}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'GAO quantifies assessed and separately estimated fish-passage barrier culverts, restoration cost, multi-decade backlog duration and bounded two-state extent under the exact road-stream crossing contract.',
    higher_priority_failures: ['The assessment is historical and covers federal lands in two U.S. states rather than a current global crossing inventory.', 'No method-comparable 20-year annual or 60-month passage-impairment series supports a current-data score.']
  }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`road_stream_crossing_barriers: receipt verification failed: ${verification.errors.join('; ')}`);

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_67_gao_fish_passage_barrier_culverts', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-67.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-67.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
