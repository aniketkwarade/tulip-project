import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/acaps-humanitarian-access-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const record = snapshot.records[0];
const round = (value, digits = 6) => Number(value.toFixed(digits));
const UN_MEMBER_STATE_COUNT = 193;

if (!record || snapshot.record_count !== 1) throw new Error('Expected one reconciled ACAPS global distribution record.');
if (record.source_reported_deteriorated_country_count + record.source_reported_improved_country_count + record.source_reported_stable_country_count !== record.assessed_country_count_derived_from_trend_categories) throw new Error('ACAPS trend-category country counts do not reconcile.');
const netDeteriorationShare = (record.source_reported_deteriorated_country_count - record.source_reported_improved_country_count) / record.assessed_country_count_derived_from_trend_categories;
const highExtremeShare = record.source_reported_high_to_extreme_country_count / record.assessed_country_count_derived_from_trend_categories;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'humanitarian_access_constraints',
  method: 'current_data',
  as_of: record.observation_date,
  components: {
    magnitude: round(normalizeWithAnchors(record.source_reported_high_to_extreme_country_count, [0, 10, 25, 50], 'higher_is_worse')),
    threshold: round(highExtremeShare),
    momentum: round(normalizeWithAnchors(netDeteriorationShare, [0, 0.05, 0.10, 0.25], 'higher_is_worse')),
    extent: round(record.assessed_country_count_derived_from_trend_categories / UN_MEMBER_STATE_COUNT)
  },
  raw_inputs: {
    magnitude: {
      high_to_extreme_country_count: record.source_reported_high_to_extreme_country_count,
      high_to_extreme_country_share_pct_source_reported: record.source_reported_high_to_extreme_country_share_pct,
      anchors_country_count: [0, 10, 25, 50],
      boundary: 'Countries in the ACAPS crisis-affected assessment panel, not people or incidents.'
    },
    threshold: {
      source_threshold: record.high_to_extreme_threshold,
      countries_meeting_threshold: record.source_reported_high_to_extreme_country_count,
      assessed_country_count: record.assessed_country_count_derived_from_trend_categories,
      exact_share: round(highExtremeShare),
      source_rounded_share_pct: record.source_reported_high_to_extreme_country_share_pct
    },
    momentum: {
      deteriorated_country_count: record.source_reported_deteriorated_country_count,
      improved_country_count: record.source_reported_improved_country_count,
      stable_country_count: record.source_reported_stable_country_count,
      net_deterioration_country_count: record.source_reported_deteriorated_country_count - record.source_reported_improved_country_count,
      net_deterioration_share: round(netDeteriorationShare),
      anchors_share: [0, 0.05, 0.10, 0.25],
      boundary: 'Net panel direction during the assessment period; not an annual rate or causal trend.'
    },
    extent: {
      assessed_crisis_affected_country_count: record.assessed_country_count_derived_from_trend_categories,
      un_member_state_reference_count: UN_MEMBER_STATE_COUNT,
      confirmed_assessment_extent_lower_bound: round(record.assessed_country_count_derived_from_trend_categories / UN_MEMBER_STATE_COUNT),
      missing_data_rule: 'Unassessed countries are outside the numerator and are not classified as unconstrained.'
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      observation_period_start: record.observation_period_start,
      observation_period_end: record.observation_period_end,
      source_locator: record.source_locator
    }
  },
  transformations: [
    { type: 'recognized_severity_threshold_count', formula: 'Normalize the source-reported number of countries at ACAPS overall access score 3-5 through named country-count anchors.' },
    { type: 'threshold_exceedance_share', formula: 'Divide countries at the recognized high-to-extreme threshold by the reconciled assessment-panel denominator.' },
    { type: 'net_panel_direction', formula: 'Subtract improved-country count from deteriorated-country count and divide by the assessed panel; stable countries remain in the denominator.' },
    { type: 'confirmed_country_extent_lower_bound', formula: 'Divide the assessed crisis-affected country panel by 193 UN member states without classifying unassessed countries.' }
  ],
  source_ids: ['acaps_humanitarian_access'],
  uncertainty: snapshot.uncertainty,
  freshness: `ACAPS assessment period ${record.observation_period_start} to ${record.observation_period_end}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `ACAPS supplies a current ${record.assessed_country_count_derived_from_trend_categories}-country crisis panel, a recognized score 3-5 high-to-extreme threshold, ${record.source_reported_high_to_extreme_country_count} threshold-exceeding countries, and reconciled deteriorated, improved and stable counts.`,
    higher_priority_failures: []
  }
});

const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`Receipt verification failed for humanitarian_access_constraints: ${verification.errors.join('; ')}`);
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_21_acaps_humanitarian_access',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'acaps_humanitarian_access',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-21.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-21.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
