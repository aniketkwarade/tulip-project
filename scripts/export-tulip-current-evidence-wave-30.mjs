import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-groundwater-level-trends-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'groundwater_depletion',
  method: 'current_data',
  as_of: String(a.publication_year),
  components: {
    magnitude: round(normalizeWithAnchors(a.aquifer_systems_deepening_over_0_1_m_per_year_pct, [0, 10, 25, 50], 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(a.aquifer_systems_deepening_over_0_5_m_per_year_pct, [0, 2, 8, 20], 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(a.accelerated_decline_share_pct, [a.random_acceleration_null_share_pct, 20, 30, 50], 'higher_is_worse')),
    extent: round(a.global_groundwater_withdrawal_coverage_pct_approx / 100)
  },
  raw_inputs: {
    magnitude: { aquifer_systems_deepening_over_0_1_m_per_year: a.aquifer_systems_deepening_over_0_1_m_per_year, denominator: a.aquifer_systems_total, published_share_pct: a.aquifer_systems_deepening_over_0_1_m_per_year_pct, anchors_pct: [0, 10, 25, 50] },
    threshold: { aquifer_systems_deepening_over_0_5_m_per_year: a.aquifer_systems_deepening_over_0_5_m_per_year, denominator: a.aquifer_systems_total, published_share_pct: a.aquifer_systems_deepening_over_0_5_m_per_year_pct, analysis_threshold_m_per_year: 0.5, anchors_pct: [0, 2, 8, 20] },
    momentum: { accelerated_decline_share_pct: a.accelerated_decline_share_pct, comparison_aquifer_systems: a.long_history_aquifer_systems, null_expectation_pct: a.random_acceleration_null_share_pct, anchors_pct: [a.random_acceleration_null_share_pct, 20, 30, 50], counterevidence: { decelerated_pct: a.decelerated_decline_share_pct, reversed_pct: a.reversed_decline_share_pct, continued_rise_pct: a.continued_rise_share_pct } },
    extent: { global_groundwater_withdrawal_coverage_pct_approx: a.global_groundwater_withdrawal_coverage_pct_approx, countries_count_lower_bound: a.countries_count_lower_bound, normalized_value: round(a.global_groundwater_withdrawal_coverage_pct_approx / 100), boundary: 'Withdrawal coverage, not aquifer-count, land-area or population coverage.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'published_aquifer_prevalence', formula: 'Normalize the published share of aquifer systems above the study-defined 0.1 m/year decline bin.' },
    { type: 'rapid_decline_prevalence', formula: 'Normalize the published share above 0.5 m/year; retain level-change units and do not infer storage volume.' },
    { type: 'long_history_acceleration', formula: 'Normalize the published acceleration share against the study null expectation, retaining the 542-system comparison denominator and recovery counterevidence.' },
    { type: 'withdrawal_weighted_scope', formula: 'Use the study-reported approximate share of global withdrawals represented by countries in scope; do not relabel it as complete world coverage.' }
  ],
  source_ids: ['global_in_situ_groundwater_level_trends_study'],
  uncertainty: snapshot.uncertainty,
  freshness: `Primary global in-situ groundwater trend study published ${a.publication_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The global in-situ synthesis directly supplies current decline prevalence, a documented rapid-decline bin, multi-decadal acceleration and withdrawal-weighted global extent; all four current components are observation-derived.',
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for groundwater_depletion.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_30_global_groundwater_trends', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'global_in_situ_groundwater_level_trends_study', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-30.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-30.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
