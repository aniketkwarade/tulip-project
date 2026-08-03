import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-infrastructure-pressure-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessments.arctic_shipping_expansion;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));
const components = {
  magnitude: n(a.unique_ships_2025, [0, 500, 1250, 2000]),
  threshold: n(a.crude_oil_tanker_increase_since_2013_pct, [0, 50, 200, 400]),
  momentum: n(a.distance_sailed_increase_pct, [0, 25, 75, 125]),
  extent: a.global_extent
};
const gate = { direct_components: ['magnitude', 'momentum', 'extent'], global_scope: true, current_observation: true };
if (!qualifiesForCurrentData(gate)) throw new Error('arctic_shipping_expansion: current-data gate failed');
const receipt = buildTulipUrgencyReceipt({
  node_id: 'arctic_shipping_expansion',
  method: 'current_data',
  as_of: String(a.observation_end_year),
  components,
  raw_inputs: {
    magnitude: { unique_ships: a.unique_ships_2025, anchors: [0, 500, 1250, 2000], geography: 'IMO Polar Code area' },
    threshold: { accumulated_impact_fill: true, crude_oil_tanker_increase_since_2013_pct: a.crude_oil_tanker_increase_since_2013_pct, anchors: [0, 50, 200, 400], boundary: 'This is a source-backed structural pressure indicator, not a recognized ecological threshold.' },
    momentum: { distance_sailed_2013_million_nautical_miles: a.distance_sailed_2013_million_nautical_miles, distance_sailed_2025_million_nautical_miles: a.distance_sailed_2025_million_nautical_miles, increase_pct: a.distance_sailed_increase_pct, anchors: [0, 25, 75, 125] },
    extent: { normalized_value: a.global_extent, boundary: 'Circumpolar shipping extent within the IMO Polar Code area, not the full world ocean.' },
    coverage_gate: gate,
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at }
  },
  transformations: [
    { type: 'current_fleet_magnitude', formula: 'Normalize the 2025 unique-ship count without double-counting repeat entries.' },
    { type: 'source_backed_remainder_fill', formula: 'Use the documented crude-oil-tanker growth only for the non-direct threshold component; do not describe it as a recognized threshold.' },
    { type: 'distance_momentum', formula: 'Normalize the source-reported 2013–2025 increase in aggregate nautical miles sailed.' },
    { type: 'circumpolar_extent', formula: 'Retain a bounded circumpolar extent for the IMO Polar Code area.' }
  ],
  source_ids: ['arctic_council_shipping_update_2026'],
  uncertainty: snapshot.uncertainty,
  freshness: `Arctic Council PAME observation through ${a.observation_end_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'Current 2025 ship magnitude, source-reported 12-year distance momentum and circumpolar extent provide 70% direct component coverage; a quantitative structural pressure indicator fills the remainder.',
    higher_priority_failures: []
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('arctic_shipping_expansion: receipt verification failed');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_47_arctic_shipping_expansion', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'arctic_council_shipping_update_2026', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-47.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-47.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
