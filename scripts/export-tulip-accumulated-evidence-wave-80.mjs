import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/cape-may-coastal-groundwater-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.maximum_groundwater_level_decline_feet, anchors.groundwater_level_decline_feet),
  human_economic_burden: n(impact.total_supply_wells_closed_conservative_lower_bound, anchors.abandoned_supply_well_count),
  persistence: n(impact.elapsed_intrusion_years, anchors.elapsed_intrusion_years),
  extent: n(impact.named_affected_community_count, anchors.named_affected_community_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('coastal_groundwater_withdrawal: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'coastal_groundwater_withdrawal', method: 'impact_fallback', as_of: impact.assessment_end_date, components,
  raw_inputs: {
    biophysical_burden: { maximum_groundwater_level_decline_feet: impact.maximum_groundwater_level_decline_feet, affected_freshwater_aquifer_count: impact.affected_freshwater_aquifer_count, normalization_anchors_feet: anchors.groundwater_level_decline_feet, boundary: 'Maximum USGS pumping-linked head decline; not a uniform county or aquifer value.' },
    human_economic_burden: { public_and_industrial_supply_wells_closed_at_least: impact.public_and_industrial_supply_wells_closed_at_least, domestic_supply_wells_closed_more_than: impact.domestic_supply_wells_closed_more_than, total_supply_wells_closed_conservative_lower_bound: impact.total_supply_wells_closed_conservative_lower_bound, normalization_anchors_wells: anchors.abandoned_supply_well_count },
    persistence: { intrusion_start_year_about: impact.intrusion_start_year_about, assessment_end_year: impact.assessment_end_year, elapsed_intrusion_years: impact.elapsed_intrusion_years, normalization_anchors_years: anchors.elapsed_intrusion_years },
    extent: { named_affected_communities: impact.named_affected_communities, named_affected_community_count: impact.named_affected_community_count, represented_county: impact.represented_county, represented_state: impact.represented_state, normalization_anchors_communities: anchors.named_affected_community_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'withdrawal_linked_head_decline', formula: 'Normalize the USGS maximum 100-foot groundwater-level decline within the named coastal aquifer system; retain five affected aquifers as unscored context.' },
    { type: 'conservative_abandoned_well_lower_bound', formula: 'Add at least 20 public and industrial wells to a conservative numeric value of 100 for more than 100 domestic wells, yielding a lower bound of 120 rather than an exact total.' },
    { type: 'historical_intrusion_duration', formula: 'Calculate 112 elapsed years from the approximate 1890 onset to the 2002 detailed assessment endpoint; do not imply intrusion ended in 2002.' },
    { type: 'bounded_community_extent', formula: 'Normalize five communities explicitly named by USGS and do not extrapolate the county record to other coasts.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical Cape May intrusion assessed through ${impact.assessment_end_date}; USGS records reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'USGS directly quantifies withdrawal-linked hydraulic decline, abandoned public/industrial/domestic supply wells, century-scale intrusion and the named affected coastal communities.', higher_priority_failures: ['The detailed record is one historical county aquifer system, not a current global coastal-groundwater withdrawal aggregation.', 'No globally method-comparable current series supplies paired pumping, hydraulic head and salinity response plus threshold or momentum coverage under the contract.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`coastal_groundwater_withdrawal: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_80_cape_may_coastal_groundwater_withdrawal', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-80.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-80.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
