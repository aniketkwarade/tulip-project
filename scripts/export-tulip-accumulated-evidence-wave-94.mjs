import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/tripa-palm-oil-clearance-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.verified_burned_tripa_peat_forest_hectares_approximate, anchors.verified_burned_forest_hectares),
  human_economic_burden: n(impact.final_environmental_liability_idr_billions, anchors.adjudicated_liability_idr_billions),
  persistence: n(impact.repeated_burning_span_years_derived, anchors.repeated_burning_span_years),
  extent: n(impact.affected_license_share_percent_derived, anchors.affected_license_share_percent)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('palm_oil_canopy_clearance: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'palm_oil_canopy_clearance', method: 'impact_fallback', as_of: '2017', components,
  raw_inputs: {
    biophysical_burden: { verified_burned_tripa_peat_forest_hectares_approximate: impact.verified_burned_tripa_peat_forest_hectares_approximate, normalization_anchors_hectares: anchors.verified_burned_forest_hectares },
    human_economic_burden: { final_environmental_liability_idr_billions: impact.final_environmental_liability_idr_billions, normalization_anchors_idr_billions: anchors.adjudicated_liability_idr_billions },
    persistence: { first_documented_burn_year: impact.first_documented_burn_year, last_documented_burn_year: impact.last_documented_burn_year, repeated_burning_span_years_derived: impact.repeated_burning_span_years_derived, normalization_anchors_years: anchors.repeated_burning_span_years },
    extent: { oil_palm_business_license_hectares_approximate: impact.oil_palm_business_license_hectares_approximate, affected_license_share_percent_derived: impact.affected_license_share_percent_derived, normalization_anchors_percent: anchors.affected_license_share_percent },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'adjudicated_oil_palm_clearance_boundary', formula: 'Normalize the approximately 1,000 verified burned forest hectares inside the named 1,605-hectare oil-palm license; do not substitute generic concession tree-cover loss.' },
    { type: 'court_ordered_response_burden', formula: 'Normalize the final Rp366-billion environmental compensation and restoration liability without converting currency or assuming collection.' },
    { type: 'documented_recurrence_span', formula: 'Calculate 2012 - 2009 = 3 years across the documented repeated-burning period.' },
    { type: 'affected_license_share', formula: 'Calculate 1,000 / 1,605 × 100 = 62.305296 percent for the bounded license; do not extrapolate beyond it.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Final 2015 civil appeal and 2017 judicial-review record reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Final court and ministry records provide verified burned forest area, an oil-palm license boundary, repeated-event duration and adjudicated compensation/restoration liability.', higher_priority_failures: ['This is a single adjudicated concession rather than a global current observation.', 'No comparable 20-year global annual series with verified prior forest, plantation establishment and causal attribution is available for historical percentile normalization.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`palm_oil_canopy_clearance: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_94_tripa_palm_oil_clearance', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-94.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-94.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
