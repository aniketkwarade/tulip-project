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
const SNAPSHOT_PATH = 'public/climate-trace-land-emissions-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictMonthlyAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'monthly');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} monthly observations.`);
  const scale = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = scale * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function monthNumber(value) {
  const [year, month] = value.split('-').map(Number);
  return year * 12 + month - 1;
}

function buildReceipt(nodeId) {
  const records = snapshot.records
    .filter(record => record.node_id === nodeId && Number.isFinite(record.value))
    .sort((left, right) => left.observation_month.localeCompare(right.observation_month));
  if (records.length < 60) throw new Error(`${nodeId} has only ${records.length} complete monthly observations.`);
  for (let index = 1; index < records.length; index += 1) {
    if (monthNumber(records[index].observation_month) !== monthNumber(records[index - 1].observation_month) + 1) {
      throw new Error(`${nodeId} has a monthly gap before ${records[index].observation_month}.`);
    }
  }

  const trailingTwelve = records.slice(11).map((record, index) => ({
    end_month: record.observation_month,
    value: records.slice(index, index + 12).reduce((sum, item) => sum + item.value, 0),
    source_locator: record.source_locator
  }));
  if (trailingTwelve.length < 60) throw new Error(`${nodeId} has only ${trailingTwelve.length} complete trailing-12-month observations.`);
  const values = trailingTwelve.map(point => point.value);
  const changes = values.slice(1).map((value, index) => value - values[index]);
  const reference = trailingTwelve[0];
  const latest = trailingTwelve.at(-1);
  const latestMonthlyRecord = records.at(-1);
  const magnitudeAnchors = strictMonthlyAnchors(values.map(value => value - reference.value));
  const thresholdAnchors = strictMonthlyAnchors(values);
  const momentumAnchors = strictMonthlyAnchors(changes);
  const latestChange = changes.at(-1);

  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'current_data',
    as_of: latest.end_month,
    components: {
      magnitude: round(normalizeWithAnchors(latest.value - reference.value, magnitudeAnchors, 'higher_is_worse')),
      threshold: round(normalizeWithAnchors(latest.value, thresholdAnchors, 'higher_is_worse')),
      momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
      extent: 1
    },
    raw_inputs: {
      magnitude: {
        latest_trailing_12_month_co2_tonnes: round(latest.value, 2),
        reference_trailing_period_end: reference.end_month,
        reference_trailing_12_month_co2_tonnes: round(reference.value, 2),
        latest_change_against_reference_tonnes: round(latest.value - reference.value, 2),
        source_monthly_observations: records.length,
        complete_trailing_12_month_observations: trailingTwelve.length,
        anchors: magnitudeAnchors.map(value => round(value, 2)),
        source_locator: latest.source_locator
      },
      threshold: {
        latest_trailing_12_month_co2_tonnes: round(latest.value, 2),
        threshold_basis: 'historical_distribution_fallback',
        anchors: thresholdAnchors.map(value => round(value, 2)),
        source_locator: latest.source_locator
      },
      momentum: {
        latest_month_over_month_change_in_trailing_12_month_co2_tonnes: round(latestChange, 2),
        complete_monthly_change_observations: changes.length,
        anchors: momentumAnchors.map(value => round(value, 2)),
        source_locator: latest.source_locator
      },
      extent: {
        geography: latestMonthlyRecord.geography,
        normalized_value: 1,
        definition: 'Climate TRACE returns the source-reported Global aggregate when no location filter is supplied.',
        source_locator: latest.source_locator
      },
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        temporal_boundary: snapshot.temporal_boundary,
        source_subsectors: latestMonthlyRecord.source_subsectors,
        source_history_start: records[0].observation_month,
        source_history_end: latestMonthlyRecord.observation_month
      }
    },
    transformations: [
      {
        type: 'complete_trailing_12_month_sum',
        formula: 'For every complete source month after the first eleven, sum that month and the preceding eleven global monthly CO2 observations; do not annualize partial years.'
      },
      {
        type: 'fixed_reference_magnitude',
        formula: `Subtract the first complete trailing-12-month total ending ${reference.end_month} from every retained trailing total.`
      },
      {
        type: 'historical_distribution_normalization',
        formula: `Map trailing-12-month magnitude, level and month-over-month change through median / p75 / p90 / p97.5 anchors from ${trailingTwelve.length} complete monthly rolling observations.`
      }
    ],
    source_ids: ['climate_trace_global_emissions_api'],
    uncertainty: snapshot.uncertainty,
    freshness: `Climate TRACE complete-calendar-year global monthly history through ${latestMonthlyRecord.observation_month}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `The exact node-bound Climate TRACE categories supply ${records.length} complete global monthly observations and ${trailingTwelve.length} complete trailing-12-month values, exceeding the 60-month historical gate for magnitude, threshold, momentum and extent.`,
      higher_priority_failures: []
    }
  });
}

const receipts = ['deforestation_co2_release', 'land_use_fire_co2'].map(buildReceipt);
for (const receipt of receipts) {
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`Receipt verification failed for ${receipt.node_id}.`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_15_climate_trace_land_co2',
  generated_at: new Date().toISOString(),
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-15.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-15.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }))
}, null, 2));
