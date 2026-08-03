import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/unctad-maritime-bottleneck-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'shipping',
  method: 'current_data',
  as_of: String(a.latest_report_year),
  components: {
    magnitude: round(normalizeWithAnchors(a.shipping_carbon_emissions_growth_2024_pct, [0, 1, 3, 6], 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(a.active_fleet_conventional_fuel_share_pct_lower_bound, [0, 33, 67, 100], 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(a.vessel_ton_mile_growth_2024_pct, [0, 2, 4, 8], 'higher_is_worse')),
    extent: a.seaborne_share_of_world_trade_volume_pct / 100
  },
  raw_inputs: {
    magnitude: { shipping_carbon_emissions_growth_2024_pct: a.shipping_carbon_emissions_growth_2024_pct, comparison_year: 2023, anchors_pct: [0, 1, 3, 6], attribution_boundary: 'UNCTAD estimate driven by rerouting and increased speeds; not a fuel-ledger total.' },
    threshold: { active_fleet_conventional_fuel_share_pct_lower_bound: a.active_fleet_conventional_fuel_share_pct_lower_bound, world_fleet_vessels: a.world_fleet_vessels_january_2025, world_fleet_deadweight_tonnage_billion: a.world_fleet_deadweight_tonnage_billion_january_2025, anchors_pct: [0, 33, 67, 100], transition_reference: 'UNCTAD/IMO net-zero course requires transition away from conventional fuels; this component measures present fleet distance from a zero-conventional-fuel endpoint.' },
    momentum: { vessel_ton_mile_growth_2024_pct: a.vessel_ton_mile_growth_2024_pct, maritime_trade_volume_growth_2024_pct_context: a.maritime_trade_volume_growth_2024_pct, anchors_pct: [0, 2, 4, 8] },
    extent: { seaborne_share_of_world_trade_volume_pct: a.seaborne_share_of_world_trade_volume_pct, normalized_value: a.seaborne_share_of_world_trade_volume_pct / 100, boundary: 'Share of international merchandise trade volume, not share of all economic activity.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators }
  },
  transformations: [
    { type: 'current_emissions_change', formula: 'Normalize the UNCTAD estimated year-over-year shipping carbon-emissions increase through fixed percentage anchors.' },
    { type: 'fleet_transition_distance', formula: 'Normalize the lower-bound conventional-fuel share of the active global fleet against a zero-conventional-fuel transition endpoint.' },
    { type: 'activity_momentum', formula: 'Normalize current global vessel ton-mile growth; retain maritime trade-volume growth separately as context.' }
  ],
  source_ids: ['unctad_review_of_maritime_transport_2024'],
  uncertainty: `${snapshot.uncertainty} Carbon-emissions growth is an UNCTAD estimate rather than a reconciled global fuel ledger; conventional-fuel share is reported as a lower bound.`,
  freshness: `UNCTAD Review of Maritime Transport ${a.latest_report_year}, using 2024 activity and emissions; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNCTAD supplies current global shipping emissions change, active-fleet fuel-transition position, ton-mile momentum and a global trade-volume exposure share.',
    higher_priority_failures: []
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for shipping.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_29_unctad_global_shipping', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'unctad_review_of_maritime_transport_2024', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-29.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-29.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
