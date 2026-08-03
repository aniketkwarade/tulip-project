import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/unep-adaptation-finance-gap-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const r = snapshot.records[0];
const round = (value, digits = 6) => Number(value.toFixed(digits));
const lowerGapShare = r.finance_gap_lower_billion_usd_per_year / r.modelled_need_billion_usd_per_year;
const lowerNeedMultiple = r.modelled_need_billion_usd_per_year / r.international_public_flow_billion_usd_per_year;
const flowDeclinePct = Math.abs(Math.min(0, r.observed_flow_change_pct));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'adaptation_capital_shortfall',
  method: 'current_data',
  as_of: String(r.flow_observation_year),
  components: {
    magnitude: round(normalizeWithAnchors(lowerGapShare, [0, 0.33, 0.67, 0.9], 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(lowerNeedMultiple, [1, 2, 5, 12], 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(flowDeclinePct, [0, 2.5, 5, 10], 'higher_is_worse')),
    extent: 1
  },
  raw_inputs: {
    magnitude: { observed_international_public_flow_billion_2023_usd: r.international_public_flow_billion_usd_per_year, modelled_2035_need_billion_2023_usd: r.modelled_need_billion_usd_per_year, lower_finance_gap_billion_2023_usd: r.finance_gap_lower_billion_usd_per_year, lower_gap_share: round(lowerGapShare), anchors_share: [0, 0.33, 0.67, 0.9], boundary: 'Observed 2023 international public flow compared with UNEP modelled 2035 annual need; domestic and private finance excluded.' },
    threshold: { lower_need_to_current_flow_multiple: round(lowerNeedMultiple), source_reported_range_times_current_flow: [12, 14], anchors_multiple: [1, 2, 5, 12], target_status: r.source_locator.target_status },
    momentum: { current_flow_billion_2023_usd: r.international_public_flow_billion_usd_per_year, previous_flow_billion_2023_usd: r.previous_international_public_flow_billion_usd_per_year, current_year: r.flow_observation_year, previous_year: r.previous_flow_observation_year, observed_flow_change_pct: r.observed_flow_change_pct, decline_magnitude_pct: round(flowDeclinePct), anchors_decline_pct: [0, 2.5, 5, 10] },
    extent: { geography: r.geography, normalized_value: 1, boundary: 'Aggregate developing-country assessment, not uniform country-level availability or total global adaptation spending.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locator: r.source_locator }
  },
  transformations: [
    { type: 'observed_flow_to_assessed_need_gap', formula: 'Divide the lower source-reported finance gap by the lower modelled annual need, retaining observation year, need horizon and price year.' },
    { type: 'need_multiple_threshold_position', formula: 'Divide the lower assessed need by observed international public flow and normalize against fixed versioned multiples; this is an assessed financing threshold, not a statistical percentile.' },
    { type: 'observed_flow_momentum', formula: 'Calculate the absolute percentage decline from source-reported 2022 to 2023 international public adaptation-finance flow.' }
  ],
  source_ids: ['unep_adaptation_gap_report_2025'],
  uncertainty: `${snapshot.uncertainty} Current international public flows exclude domestic public and private adaptation spending; the need horizon is 2035 while the flow observation is 2023.`,
  freshness: `UNEP Adaptation Gap Report 2025 using ${r.flow_observation_year} finance flow; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNEP supplies an observed current international public flow, a directly matched assessed need range, observed year-over-year momentum, target status and an aggregate developing-country scope; all current-data component weight is populated.',
    higher_priority_failures: []
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for adaptation_capital_shortfall.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_26_unep_adaptation_finance_gap', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'unep_adaptation_gap_report_2025', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-26.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-26.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
