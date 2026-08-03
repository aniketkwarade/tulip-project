import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildTulipUrgencyReceipt,
  historicalDistributionAnchors,
  normalizeWithAnchors,
  qualifiesForCurrentData,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/ucdp-global-conflict-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const annual = snapshot.records.slice().sort((left, right) => left.year - right.year);
const latest = annual.at(-1);
const prior = annual.slice(0, -1);
const changes = annual.slice(1).map((record, index) => record.battle_deaths_best - annual[index].battle_deaths_best);
const magnitudeAnchors = historicalDistributionAnchors(prior.map(record => record.battle_deaths_best), 'annual');
const momentumAnchors = historicalDistributionAnchors(changes.slice(0, -1), 'annual');
const extentAnchors = historicalDistributionAnchors(prior.map(record => record.unique_battle_locations), 'annual');
if (annual.length < 20 || !magnitudeAnchors || !momentumAnchors || !extentAnchors) {
  throw new Error('UCDP conflict historical-distribution gate failed.');
}
const round = value => Number(value.toFixed(6));
const latestChange = changes.at(-1);
const components = {
  magnitude: round(normalizeWithAnchors(latest.battle_deaths_best, magnitudeAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.battle_deaths_best, magnitudeAnchors, 'higher_is_worse')),
  momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
  extent: round(normalizeWithAnchors(latest.unique_battle_locations, extentAnchors, 'higher_is_worse'))
};
const gate = {
  direct_components: ['magnitude', 'threshold', 'momentum', 'extent'],
  global_scope: true,
  current_observation: true
};
if (!qualifiesForCurrentData(gate)) throw new Error('conflict_risk_escalation did not pass the current-data gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'conflict_risk_escalation',
  method: 'current_data',
  as_of: String(latest.year),
  components,
  raw_inputs: {
    magnitude: {
      latest_year: latest.year,
      latest_battle_deaths_best: latest.battle_deaths_best,
      latest_battle_deaths_low: latest.battle_deaths_low,
      latest_battle_deaths_high: latest.battle_deaths_high,
      historical_distribution_anchors_best_estimate: magnitudeAnchors.map(round),
      direction: 'higher_is_worse'
    },
    threshold: {
      basis: 'historical_distribution_fallback_no_recognized_global_battle_death_threshold',
      anchors_best_estimate: magnitudeAnchors.map(round),
      complete_prior_annual_observations: prior.length
    },
    momentum: {
      prior_year: annual.at(-2).year,
      prior_battle_deaths_best: annual.at(-2).battle_deaths_best,
      latest_annual_change_best_estimate: latestChange,
      historical_change_anchors: momentumAnchors.map(round)
    },
    extent: {
      latest_unique_battle_locations: latest.unique_battle_locations,
      latest_conflict_rows: latest.conflict_rows,
      historical_location_count_anchors: extentAnchors.map(round),
      geography: 'Global UCDP conflict-level aggregation'
    },
    coverage_gate: gate,
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      archive_sha256: snapshot.source.archive_sha256,
      csv_sha256: snapshot.source.csv_sha256,
      annual_observations: annual.length
    }
  },
  transformations: [
    {
      type: 'source_native_global_aggregation',
      formula: 'For each year, sum UCDP conflict-level best estimates once; retain low and high totals as uncertainty metadata; never add estimate bands together.'
    },
    {
      type: 'historical_distribution_magnitude_and_threshold',
      formula: 'Map the latest best-estimate total through prior annual median, p75, p90 and p97.5 anchors because no recognized global battle-death threshold exists.'
    },
    {
      type: 'annual_change_momentum',
      formula: 'Subtract the prior complete year best estimate and normalize the latest annual change against preceding complete annual changes.'
    },
    {
      type: 'global_conflict_extent',
      formula: 'Deduplicate source-native battle locations within each year and normalize the latest location count against the prior annual distribution.'
    }
  ],
  source_ids: ['ucdp_battle_related_deaths_25_1'],
  uncertainty: snapshot.uncertainty,
  freshness: `UCDP version 25.1 covers 1989–${latest.year}; reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `UCDP supplies ${annual.length} complete global annual observations of state-based battle deaths and conflict extent, including latest magnitude, historical position and annual momentum.`,
    higher_priority_failures: []
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('conflict_risk_escalation receipt verification failed.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_49_ucdp_global_battle_related_deaths',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: snapshot.source.id,
  promoted_node_count: 1,
  receipts: [receipt]
};
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-49.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-49.json',
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components }
}, null, 2));
