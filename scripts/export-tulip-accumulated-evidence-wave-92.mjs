import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/peru-jellyfish-bycatch-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.jellyfish_catch_share_threshold_percent_scored, anchors.jellyfish_catch_share_percent),
  human_economic_burden: n(impact.bounded_loss_usd_more_than, anchors.bounded_loss_usd),
  persistence: n(impact.observed_fishing_day_count, anchors.event_days),
  extent: n(impact.rejected_catch_event_count, anchors.rejected_event_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('jellyfish_swarm_surges: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'jellyfish_swarm_surges', method: 'impact_fallback', as_of: '2008/09', components,
  raw_inputs: {
    biophysical_burden: { jellyfish_catch_share_threshold_percent: impact.jellyfish_catch_share_threshold_percent_scored, share_of_hauls_above_threshold_percent: impact.hauls_above_30_percent_jellyfish_catch_share_percent, normalization_anchors_percent: anchors.jellyfish_catch_share_percent },
    human_economic_burden: { bounded_loss_usd_more_than: impact.bounded_loss_usd_more_than, rejected_catch_mass_tonnes: impact.rejected_catch_mass_tonnes, normalization_anchors_usd: anchors.bounded_loss_usd },
    persistence: { observed_fishing_day_count: impact.observed_fishing_day_count, normalization_anchors_days: anchors.event_days },
    extent: { rejected_catch_event_count: impact.rejected_catch_event_count, processing_plant_rejection_threshold_percent: impact.processing_plant_rejection_threshold_percent, normalization_anchors_events: anchors.rejected_event_count },
    unscored_context: { hauls_above_10_percent_jellyfish_catch_share_percent: impact.hauls_above_10_percent_jellyfish_catch_share_percent, seasonal_loss_extrapolation_usd: impact.seasonal_loss_extrapolation_usd_unscored, national_annual_loss_extrapolation_usd: impact.national_annual_loss_extrapolation_usd_unscored },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'observer_based_relative_biomass', formula: 'Normalize the documented greater-than-30-percent jellyfish share of catch weight; retain that this occurred in 5 percent of hauls and do not convert it to water-column density.' },
    { type: 'bounded_realized_loss', formula: 'Normalize the source-reported lower-bound US$200,000 loss over the observed 35 fishing days; exclude seasonal and national extrapolations.' },
    { type: 'event_duration_and_operational_extent', formula: 'Normalize 35 observed fishing days and 13 catch-rejection events; retain the 387-tonne discard as unconverted burden context.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical southern-Peru 2008/09 fishery episode reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Fishery-observer catch composition, a documented processing threshold, rejected events and discarded mass directly connect a quantified jellyfish load to realized operational and economic burden.', higher_priority_failures: ['The observation covers one regional fishery rather than a global aggregation.', 'The evidence does not supply 20 complete annual observations, 60 monthly observations or a recognized ecological threshold for a current-data score.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`jellyfish_swarm_surges: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_92_peru_jellyfish_bycatch', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-92.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-92.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
