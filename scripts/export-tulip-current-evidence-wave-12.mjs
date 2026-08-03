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
const SNAPSHOT_PATH = 'public/heat-health-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

const vectorRecords = snapshot.records.filter(record =>
  record.node_id === 'vector_borne_disease_expansion' &&
  record.geography_type === 'global' &&
  Number.isFinite(record.observation_year) &&
  Number.isFinite(record.value)
);
const groupKey = record => record.vector_species
  ? `dengue:${record.vector_species}`
  : `malaria:${record.parasite}`;
const grouped = new Map();
for (const record of vectorRecords) {
  const key = groupKey(record);
  const records = grouped.get(key) ?? [];
  records.push(record);
  grouped.set(key, records);
}

const series = [...grouped.entries()].map(([key, unsorted]) => {
  const records = unsorted.sort((left, right) => left.observation_year - right.observation_year);
  if (records.length < 20) throw new Error(`${key} has only ${records.length} annual observations.`);
  const baselineRecords = records.filter(record => record.observation_year >= 1951 && record.observation_year <= 1960);
  if (baselineRecords.length !== 10) throw new Error(`${key} is missing part of the fixed 1951–1960 baseline.`);
  const baseline = mean(baselineRecords.map(record => record.value));
  const values = records.map(record => record.value);
  const magnitudeValues = values.map(value => value - baseline);
  const changes = values.slice(1).map((value, index) => value - values[index]);
  const latest = records.at(-1);
  const magnitudeAnchors = strictAnchors(magnitudeValues);
  const thresholdAnchors = strictAnchors(values);
  const momentumAnchors = strictAnchors(changes);
  return {
    key,
    disease: latest.disease,
    vector_species: latest.vector_species ?? null,
    parasite: latest.parasite ?? null,
    unit: latest.unit,
    source_locator: latest.source_locator,
    first_year: records[0].observation_year,
    latest_year: latest.observation_year,
    observations: records.length,
    baseline,
    latest: latest.value,
    latest_change: changes.at(-1),
    magnitude_anchors: magnitudeAnchors,
    threshold_anchors: thresholdAnchors,
    momentum_anchors: momentumAnchors,
    magnitude_component: normalizeWithAnchors(latest.value - baseline, magnitudeAnchors, 'higher_is_worse'),
    threshold_component: normalizeWithAnchors(latest.value, thresholdAnchors, 'higher_is_worse'),
    momentum_component: normalizeWithAnchors(changes.at(-1), momentumAnchors, 'higher_is_worse')
  };
}).sort((left, right) => left.key.localeCompare(right.key));

if (series.length !== 4) throw new Error(`Expected four disease/vector time series; found ${series.length}.`);
const latestYear = Math.min(...series.map(item => item.latest_year));
const receipt = buildTulipUrgencyReceipt({
  node_id: 'vector_borne_disease_expansion',
  method: 'current_data',
  as_of: String(latestYear),
  components: {
    magnitude: round(mean(series.map(item => item.magnitude_component))),
    threshold: round(mean(series.map(item => item.threshold_component))),
    momentum: round(mean(series.map(item => item.momentum_component))),
    extent: 1
  },
  raw_inputs: {
    magnitude: {
      aggregation: 'equal mean of four disease/vector-specific normalized departures from a fixed 1951–1960 baseline',
      series: series.map(item => ({
        key: item.key,
        unit: item.unit,
        baseline_1951_1960_mean: round(item.baseline),
        latest_value: round(item.latest),
        latest_departure: round(item.latest - item.baseline),
        anchors: item.magnitude_anchors.map(value => round(value)),
        normalized_value: round(item.magnitude_component)
      }))
    },
    threshold: {
      threshold_basis: 'historical_distribution_fallback_per_disease_vector_series',
      aggregation: 'equal mean after unit-specific normalization',
      series: series.map(item => ({
        key: item.key,
        latest_value: round(item.latest),
        unit: item.unit,
        anchors: item.threshold_anchors.map(value => round(value)),
        normalized_value: round(item.threshold_component)
      }))
    },
    momentum: {
      aggregation: 'equal mean of disease/vector-specific normalized annual changes',
      series: series.map(item => ({
        key: item.key,
        latest_annual_change: round(item.latest_change),
        unit: `${item.unit} per year`,
        annual_change_observations: item.observations - 1,
        anchors: item.momentum_anchors.map(value => round(value)),
        normalized_value: round(item.momentum_component)
      }))
    },
    extent: {
      geography: 'World',
      normalized_value: 1,
      definition: 'The retained source-native time series are the Lancet Countdown global aggregates for both dengue vector species and both malaria parasites.'
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      updated_at: snapshot.updated_at,
      source_release: snapshot.request.source_release,
      series_count: series.length,
      annual_observations_per_series: series.map(item => ({ key: item.key, count: item.observations })),
      source_locators: [...new Set(series.map(item => item.source_locator))]
    }
  },
  transformations: [
    {
      type: 'disease_specific_unit_preserving_normalization',
      formula: 'Normalize each dengue basic-reproduction-number series and each malaria suitable-season series separately before equal aggregation; never combine raw values with different units.'
    },
    {
      type: 'fixed_baseline_departure',
      formula: 'Subtract each series 1951–1960 mean from every annual value for the magnitude component.'
    },
    {
      type: 'historical_distribution_normalization',
      formula: 'Within each complete 1951–2024 series, map baseline departure, current level and annual change through median / p75 / p90 / p97.5 anchors; higher climate suitability is worse.'
    }
  ],
  source_ids: ['lancet_countdown_data_explorer'],
  uncertainty: `${snapshot.uncertainty} These indicators measure climate suitability, not observed infections or attributable cases, and omit immunity, intervention coverage, mobility and health-system access; they are therefore interpreted only within the node's climate-driven expansion boundary.`,
  freshness: `Lancet Countdown 2025 release with complete global series through ${latestYear}; snapshot refreshed ${snapshot.updated_at}.`,
  selection_reason: {
    selected_method_passed: `The source supplies four unit-preserved global annual climate-suitability series with ${series[0].observations} observations each, current magnitude, a fixed baseline, historical threshold position, momentum and global aggregation. Higher dengue R0 or longer malaria-suitable seasons are source-consistently worse for this node.`,
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for vector_borne_disease_expansion.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_12_lancet_vector_climate_suitability',
  generated_at: new Date().toISOString(),
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-12.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-12.json',
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
