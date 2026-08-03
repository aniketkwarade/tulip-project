import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/ocha-humanitarian-history-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const rows = snapshot.annual_summaries;
const baseline = rows.filter(row => row.observation_year >= 2000 && row.observation_year <= 2019);
if (baseline.length !== 20) throw new Error('OCHA response-capacity baseline must have 20 complete annual observations.');
const historicalAnchors = historicalDistributionAnchors(baseline.map(row => row.reported_funding_shortfall_pct_complete_panel), 'annual');
if (!historicalAnchors) throw new Error('OCHA historical-distribution coverage gate failed.');
const latest = rows.at(-1);
const prior = rows.at(-2);
const momentumPp = latest.reported_funding_shortfall_pct_complete_panel - prior.reported_funding_shortfall_pct_complete_panel;
const unMemberStates = 193;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'emergency_response_overload',
  method: 'current_data',
  as_of: String(latest.observation_year),
  components: {
    magnitude: round(normalizeWithAnchors(latest.reported_funding_shortfall_pct_complete_panel, [0, 25, 50, 75], 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.reported_funding_shortfall_pct_complete_panel, historicalAnchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(momentumPp, [0, 5, 10, 20], 'higher_is_worse')),
    extent: round(latest.countries_or_territories_in_funding_panel / unMemberStates)
  },
  raw_inputs: {
    magnitude: { reported_funding_shortfall_pct_complete_panel: latest.reported_funding_shortfall_pct_complete_panel, reported_requirement_usd_context: latest.reported_requirement_usd_complete_panel, reported_funding_usd_context: latest.reported_funding_usd_complete_panel, anchors_pct: [0, 25, 50, 75] },
    threshold: { latest_shortfall_pct: latest.reported_funding_shortfall_pct_complete_panel, baseline_years: [2000, 2019], complete_annual_observations: baseline.length, historical_distribution_anchors_pct: historicalAnchors.map(value => round(value, 6)), percentiles: ['median', '75th', '90th', '97.5th'] },
    momentum: { latest_year: latest.observation_year, prior_year: prior.observation_year, latest_shortfall_pct: latest.reported_funding_shortfall_pct_complete_panel, prior_shortfall_pct: prior.reported_funding_shortfall_pct_complete_panel, deterioration_percentage_points: round(momentumPp, 6), anchors_percentage_points: [0, 5, 10, 20] },
    extent: { countries_or_territories_in_funding_panel: latest.countries_or_territories_in_funding_panel, denominator_un_member_states: unMemberStates, normalized_value: round(latest.countries_or_territories_in_funding_panel / unMemberStates), boundary: 'HPC/FTS plan-panel coverage, not every national or local emergency system.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, measurement_boundary: snapshot.measurement_boundary }
  },
  transformations: [
    { type: 'complete_plan_panel_shortfall', formula: 'Use only OCHA plan IDs with an explicit grouped FTS funding result; plans absent from that result remain missing rather than zero-funded.' },
    { type: 'historical_shortfall_distribution', formula: 'Normalize 2025 against median, 75th, 90th and 97.5th percentiles from exactly 20 complete annual panels, 2000-2019.' },
    { type: 'year_over_year_gap_deterioration', formula: 'Subtract the 2024 shortfall percentage from 2025; do not compare nominal dollar gaps across years.' },
    { type: 'bounded_humanitarian_extent', formula: 'Divide countries or territories represented in the complete funding panel by 193 UN Member States; do not infer conditions outside the OCHA plan universe.' }
  ],
  source_ids: ['ocha_humanitarian_programme_cycle_public_api'],
  uncertainty: snapshot.uncertainty,
  freshness: `Official OCHA HPC/FTS global history through completed plan year ${latest.observation_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'OCHA supplies a 26-year global plan-panel history, current reported response-resource shortfall, a valid 20-year historical distribution, year-over-year deterioration and explicit country coverage. It is scored only as humanitarian response-capacity pressure.',
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for emergency_response_overload.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_32_ocha_emergency_response_capacity', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'ocha_humanitarian_programme_cycle_public_api', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-32.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-32.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
