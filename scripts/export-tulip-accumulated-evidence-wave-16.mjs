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
  node_id: 'supply_chain_port_bottlenecks',
  method: 'impact_fallback',
  as_of: String(a.latest_report_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.vessel_ton_mile_growth_2024_pct, [0, 2, 5, 10], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.scfi_october_2024_above_pre_pandemic_average_pct, [0, 25, 75, 150], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(a.persistence_years, [0, 1, 2, 5], 'higher_is_worse')),
    extent: round(a.seaborne_share_of_world_trade_volume_pct / 100)
  },
  raw_inputs: {
    biophysical_burden: { vessel_ton_mile_growth_2023_pct: a.vessel_ton_mile_growth_due_to_longer_routes_2023_pct, vessel_ton_mile_growth_2024_pct: a.vessel_ton_mile_growth_2024_pct, maritime_trade_volume_growth_2024_pct: a.maritime_trade_volume_growth_2024_pct, ton_mile_growth_multiple_vs_trade_volume_growth_2024: a.ton_mile_growth_multiple_vs_trade_volume_growth_2024, anchors_pct: [0, 2, 5, 10], boundary: 'Network transport work caused by longer routes; not cargo loss or port dwell time.' },
    human_economic_burden: { scfi_october_2024_above_pre_pandemic_average_pct: a.scfi_october_2024_above_pre_pandemic_average_pct, scfi_october_2024_vs_2023_average_multiple_lower_bound: a.scfi_october_2024_vs_2023_average_multiple_lower_bound, anchors_pct: [0, 25, 75, 150], boundary: 'Shanghai Containerized Freight Index comparison; not every global shipping contract.' },
    persistence: { disruption_start_year: a.disruption_start_year, latest_report_year: a.latest_report_year, persistence_years: a.persistence_years, port_congestion_status: a.port_congestion_status, anchors_years: [0, 1, 2, 5] },
    extent: { seaborne_share_of_world_trade_volume_pct: a.seaborne_share_of_world_trade_volume_pct, normalized_value: round(a.seaborne_share_of_world_trade_volume_pct / 100), boundary: 'World merchandise-trade volume exposure, not the share delayed.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'network_transport_work_burden', formula: 'Normalize source-reported 2024 ton-mile growth through a fixed transport-work range; retain trade-volume growth separately.' },
    { type: 'observed_freight_cost_burden', formula: 'Normalize the observed October 2024 SCFI premium over its pre-pandemic average; do not score projected consumer prices.' },
    { type: 'report_confirmed_persistence', formula: 'Use the 2023-to-2025 interval documented across consecutive UNCTAD reviews.' },
    { type: 'seaborne_trade_extent', formula: 'Use the source-reported minimum 80-percent share of world trade volume carried by sea as exposure, not realized delay.' }
  ],
  source_ids: ['unctad_review_of_maritime_transport_2024'],
  uncertainty: snapshot.uncertainty,
  freshness: `UNCTAD Review of Maritime Transport ${a.latest_report_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNCTAD quantifies disruption-related global transport-work growth, observed freight-rate burden, multi-year persistence and the seaborne share of world-trade exposure.',
    higher_priority_failures: ['No recognized global port-bottleneck threshold or complete 20-year harmonized congestion series supports current-data normalization. Port calls cannot be converted to dwell time without port-level observations.']
  }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`Receipt verification failed for supply_chain_port_bottlenecks: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_16_unctad_maritime_bottlenecks', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'unctad_review_of_maritime_transport_2024', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-16.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-16.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
