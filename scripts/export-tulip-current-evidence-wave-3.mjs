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
const SNAPSHOT_PATH = 'public/edgar-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));

const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function annualSlopes(points) {
  const slopes = [];
  for (let index = 1; index < points.length; index += 1) {
    const elapsed = points[index].year - points[index - 1].year;
    if (elapsed > 0) slopes.push((points[index].value - points[index - 1].value) / elapsed);
  }
  return slopes;
}

function buildReceipt(nodeId) {
  const records = snapshot.global_time_series
    .filter(record => record.node_id === nodeId && Number.isFinite(record.emission_gg_substance))
    .sort((left, right) => left.observation_year - right.observation_year);
  if (records.length < 20) throw new Error(`${nodeId} has only ${records.length} complete annual observations.`);

  const points = records.map(record => ({
    year: record.observation_year,
    value: record.emission_gg_substance,
    extent: record.countries_or_territories_reporting
  }));
  const reference = points[0].value;
  const magnitudeValues = points.map(point => point.value - reference);
  const values = points.map(point => point.value);
  const slopes = annualSlopes(points);
  if (slopes.length < 20) throw new Error(`${nodeId} has only ${slopes.length} complete year-over-year changes.`);

  const magnitudeAnchors = strictAnchors(magnitudeValues);
  const thresholdAnchors = strictAnchors(values);
  const momentumAnchors = strictAnchors(slopes);
  const latest = points.at(-1);
  const latestRecord = records.at(-1);
  const latestSlope = slopes.at(-1);
  const maximumExtent = Math.max(...points.map(point => point.extent));
  const extent = maximumExtent > 0 ? latest.extent / maximumExtent : 0;
  const components = {
    magnitude: round(normalizeWithAnchors(latest.value - reference, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.value, thresholdAnchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(latestSlope, momentumAnchors, 'higher_is_worse')),
    extent: round(extent)
  };

  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'current_data',
    as_of: String(latest.year),
    components,
    raw_inputs: {
      magnitude: {
        latest_value_gg_substance_per_year: round(latest.value),
        reference_year: points[0].year,
        reference_value_gg_substance_per_year: round(reference),
        value_against_reference_gg_substance_per_year: round(latest.value - reference),
        observation_count: points.length,
        anchors: magnitudeAnchors.map(value => round(value)),
        source_locator: latestRecord.source_locator
      },
      threshold: {
        latest_value_gg_substance_per_year: round(latest.value),
        threshold_basis: 'historical_distribution_fallback',
        observation_count: points.length,
        anchors: thresholdAnchors.map(value => round(value)),
        source_locator: latestRecord.source_locator
      },
      momentum: {
        latest_year_over_year_change_gg_substance: round(latestSlope),
        annual_change_observations: slopes.length,
        anchors: momentumAnchors.map(value => round(value)),
        source_locator: latestRecord.source_locator
      },
      extent: {
        latest_countries_or_territories_reporting: latest.extent,
        maximum_countries_or_territories_reporting: maximumExtent,
        normalized_value: round(extent),
        definition: 'Share of the maximum country-or-territory coverage present in the retained EDGAR global history.',
        source_locator: latestRecord.source_locator
      },
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        release: snapshot.source?.release,
        source_record_count: snapshot.record_count,
        retained_global_history_record_count: records.length
      }
    },
    transformations: [
      {
        type: 'global_country_sector_sum',
        formula: 'Sum source-reported EDGAR country and territory rows for the exact node-bound IPCC category and year.'
      },
      {
        type: 'magnitude_against_1970_reference',
        formula: 'Latest global emission minus the 1970 global emission, normalized through the retained annual distribution.'
      },
      {
        type: 'historical_distribution_threshold_fallback',
        formula: 'Latest global emission mapped through median / p75 / p90 / p97.5 anchors from 1970–2024.'
      },
      {
        type: 'year_over_year_momentum',
        formula: 'Latest annual change mapped through the distribution of complete annual changes.'
      },
      {
        type: 'global_reporting_extent',
        formula: 'Latest reporting-country count divided by maximum count in the retained history.'
      }
    ],
    source_ids: ['edgar_global_emissions_database'],
    uncertainty: snapshot.uncertainty,
    freshness: `Annual EDGAR 2025 GHG release through 2024; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `The exact node-bound EDGAR category supplies ${points.length} complete annual global observations, magnitude, historical position, momentum, and quantified global reporting extent.`,
      higher_priority_failures: []
    }
  });
}

const targetNodeIds = [...new Set(snapshot.global_time_series.map(record => record.node_id))].sort();
const receipts = targetNodeIds.map(buildReceipt);
for (const receipt of receipts) {
  const verification = verifyTulipUrgencyReceipt(receipt);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${receipt.node_id}`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_3_edgar_global_histories',
  generated_at: new Date().toISOString(),
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-3.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-3.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }))
}, null, 2));
