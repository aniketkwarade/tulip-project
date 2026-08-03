import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/newtok-riparian-erosion-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.average_bank_retreat_metres_per_year_derived, anchors.bank_retreat_metres_per_year),
  human_economic_burden: n(impact.village_population_reported_2003, anchors.community_population_affected),
  persistence: n(impact.documented_observation_span_years, anchors.documented_observation_span_years),
  extent: n(impact.critical_infrastructure_types_already_lost_count, anchors.critical_infrastructure_types_lost)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('riparian_zone_erosion: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'riparian_zone_erosion', method: 'impact_fallback', as_of: String(impact.latest_repeat_distance_observation_year), components,
  raw_inputs: {
    biophysical_burden: { average_bank_retreat_feet_per_year_in_front_of_village: impact.average_bank_retreat_feet_per_year_in_front_of_village, average_bank_retreat_metres_per_year_derived: impact.average_bank_retreat_metres_per_year_derived, cumulative_land_loss_feet_more_than_1954_2001: impact.cumulative_land_loss_feet_more_than_1954_2001, cumulative_land_loss_metres_more_than_derived: impact.cumulative_land_loss_metres_more_than_derived, normalization_anchors_metres_per_year: anchors.bank_retreat_metres_per_year },
    human_economic_burden: { village_population_reported_2003: impact.village_population_reported_2003, failed_sandbag_wall_cost_usd_1987_unscored: impact.failed_sandbag_wall_cost_usd_1987, normalization_anchors_people: anchors.community_population_affected },
    persistence: { observation_start_year: impact.observation_start_year, latest_repeat_distance_observation_year: impact.latest_repeat_distance_observation_year, documented_observation_span_years: impact.documented_observation_span_years, normalization_anchors_years: anchors.documented_observation_span_years },
    extent: { critical_infrastructure_types_already_lost_count: impact.critical_infrastructure_types_already_lost_count, critical_infrastructure_types_already_lost: impact.critical_infrastructure_types_already_lost, normalization_anchors_asset_types: anchors.critical_infrastructure_types_lost },
    unscored_context: { projected_relocation_cost_usd_min: impact.projected_relocation_cost_usd_min_unscored, projected_relocation_cost_usd_max: impact.projected_relocation_cost_usd_max_unscored },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'named_reach_unit_conversion', formula: 'Convert the mapped 68 ft/year retreat directly in front of Newtok to 20.7264 m/year; do not use the faster upstream rate.' },
    { type: 'community_wide_realized_burden', formula: 'Normalize the period-specific 321-person village population; retain the failed USD 750,000 wall as unscored actual expenditure and exclude projected relocation costs.' },
    { type: 'repeat_observation_span', formula: 'Normalize the 68-year span from the 1954 shoreline baseline to the 2022 repeat distance observations without treating it as a constant-rate series.' },
    { type: 'realized_infrastructure_extent', formula: 'Normalize three explicitly named infrastructure types already claimed by erosion; threatened water infrastructure is not counted.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Long-running Newtok riverbank record reviewed through ${impact.latest_repeat_distance_observation_year}; agency records reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Repeat mapped shorelines quantify the named Ninglick River bank retreat alongside community-wide exposure, multi-decade persistence and realized infrastructure loss.', higher_priority_failures: ['The evidence is a bounded Alaska riverbank and community record rather than a current global riparian-erosion aggregation.', 'No globally comparable current bank-retreat series supplies magnitude, threshold or momentum and exposed-reach coverage.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`riparian_zone_erosion: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_86_newtok_riparian_erosion', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-86.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-86.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
