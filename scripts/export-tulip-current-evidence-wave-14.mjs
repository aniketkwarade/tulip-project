import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildTulipUrgencyReceipt,
  historicalDistributionAnchors,
  normalizeWithAnchors,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/ember-global-power-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const scale = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = scale * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function buildReceipt(nodeId) {
  const records = snapshot.records
    .filter(record => record.node_id === nodeId && Number.isFinite(record.value))
    .sort((left, right) => left.observation_year - right.observation_year);
  if (records.length < 20) throw new Error(`${nodeId} has only ${records.length} complete annual observations.`);
  if (new Set(records.map(record => record.unit)).size !== 1) throw new Error(`${nodeId} changes units within its retained history.`);

  const values = records.map(record => record.value);
  const changes = values.slice(1).map((value, index) => value - values[index]);
  if (changes.length < 20) throw new Error(`${nodeId} has only ${changes.length} annual changes.`);
  const reference = records[0];
  const latest = records.at(-1);
  const magnitudeAnchors = strictAnchors(values.map(value => value - reference.value));
  const thresholdAnchors = strictAnchors(values);
  const momentumAnchors = strictAnchors(changes);
  const latestChange = changes.at(-1);
  const isShare = latest.unit === '%';

  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'current_data',
    as_of: String(latest.observation_year),
    components: {
      magnitude: round(normalizeWithAnchors(latest.value - reference.value, magnitudeAnchors, 'higher_is_worse')),
      threshold: round(normalizeWithAnchors(latest.value, thresholdAnchors, 'higher_is_worse')),
      momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
      extent: 1
    },
    raw_inputs: {
      magnitude: {
        latest_value: latest.value,
        unit: latest.unit,
        reference_year: reference.observation_year,
        reference_value: reference.value,
        latest_change_against_reference: round(latest.value - reference.value),
        complete_annual_observations: records.length,
        anchors: magnitudeAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      threshold: {
        latest_value: latest.value,
        unit: latest.unit,
        threshold_basis: 'historical_distribution_fallback',
        anchors: thresholdAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      momentum: {
        latest_year_over_year_change: round(latestChange),
        unit: `${latest.unit}/year`,
        annual_change_observations: changes.length,
        anchors: momentumAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      extent: {
        geography: latest.geography,
        normalized_value: 1,
        definition: 'The retained observation is Ember’s source-reported World aggregate, rather than a partial country panel.',
        source_locator: latest.source_locator
      },
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        source_last_modified: snapshot.source?.source_last_modified,
        retained_history_start: reference.observation_year,
        retained_history_end: latest.observation_year,
        retained_history_record_count: records.length
      }
    },
    transformations: [
      {
        type: 'source_reported_world_series',
        formula: `Retain Ember Area=World rows for the exact ${latest.category} / ${latest.subcategory} / ${latest.variable} / ${latest.unit} variable without country reaggregation.`
      },
      {
        type: 'fixed_reference_magnitude',
        formula: `Subtract the ${reference.observation_year} source value from every annual value, then normalize the latest difference through the complete retained distribution.`
      },
      {
        type: 'historical_distribution_threshold_fallback',
        formula: `Map the latest ${isShare ? 'generation share' : 'power-sector emissions'} through median / p75 / p90 / p97.5 anchors from ${reference.observation_year}–${latest.observation_year}.`
      },
      {
        type: 'year_over_year_momentum',
        formula: 'Map the latest annual change through the distribution of complete annual changes.'
      }
    ],
    source_ids: ['ember_global_electricity_data'],
    uncertainty: snapshot.uncertainty,
    freshness: `Annual Ember Yearly Electricity Data release through ${latest.observation_year}; source file last modified ${snapshot.source?.source_last_modified}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `The exact source-reported World variable supplies ${records.length} complete annual observations, current magnitude, historical position, momentum and global extent.`,
      higher_priority_failures: []
    }
  });
}

const targetNodeIds = ['coal_power_co2_output', 'gas_power_co2_output', 'gas_power_dependence'];
const receipts = targetNodeIds.map(buildReceipt);
for (const receipt of receipts) {
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`Receipt verification failed for ${receipt.node_id}.`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_14_ember_world_power',
  generated_at: new Date().toISOString(),
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-14.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-14.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }))
}, null, 2));
