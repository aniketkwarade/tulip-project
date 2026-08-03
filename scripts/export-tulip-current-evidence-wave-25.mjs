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

const records = snapshot.records
  .filter(record => record.node_id === 'hydropower_reliability_decline'
    && record.metric_id === 'hydropower_availability_and_generation_shortfall'
    && record.geography === 'World'
    && record.unit === 'TWh'
    && Number.isFinite(record.value))
  .sort((left, right) => left.observation_year - right.observation_year);
if (records.length < 20) throw new Error(`Only ${records.length} complete annual global hydropower observations are available.`);

const meanYear = records.reduce((sum, record) => sum + record.observation_year, 0) / records.length;
const meanGeneration = records.reduce((sum, record) => sum + record.value, 0) / records.length;
const slope = records.reduce((sum, record) => sum + (record.observation_year - meanYear) * (record.value - meanGeneration), 0)
  / records.reduce((sum, record) => sum + (record.observation_year - meanYear) ** 2, 0);
const intercept = meanGeneration - slope * meanYear;
const annual = records.map(record => {
  const expected = intercept + slope * record.observation_year;
  return {
    ...record,
    expected_generation_twh: expected,
    shortfall_pct: (expected - record.value) / expected * 100
  };
});
const shortfalls = annual.map(point => point.shortfall_pct);
const changes = shortfalls.slice(1).map((value, index) => value - shortfalls[index]);
const magnitudeBaseline = historicalDistributionAnchors(shortfalls, 'annual')[0];
const magnitudeValues = shortfalls.map(value => value - magnitudeBaseline);
const magnitudeAnchors = strictAnchors(magnitudeValues);
const thresholdAnchors = strictAnchors(shortfalls);
const momentumAnchors = strictAnchors(changes);
const latest = annual.at(-1);
const latestChange = changes.at(-1);

const receipt = buildTulipUrgencyReceipt({
  node_id: 'hydropower_reliability_decline',
  method: 'current_data',
  as_of: String(latest.observation_year),
  components: {
    magnitude: round(normalizeWithAnchors(latest.shortfall_pct - magnitudeBaseline, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.shortfall_pct, thresholdAnchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
    extent: 1
  },
  raw_inputs: {
    magnitude: {
      latest_generation_twh: latest.value,
      fitted_expected_generation_twh: round(latest.expected_generation_twh),
      latest_shortfall_pct: round(latest.shortfall_pct),
      historical_median_shortfall_baseline_pct: round(magnitudeBaseline),
      excess_shortfall_over_baseline_percentage_points: round(latest.shortfall_pct - magnitudeBaseline),
      complete_annual_observations: annual.length,
      anchors_percentage_points: magnitudeAnchors.map(value => round(value)),
      source_locator: latest.source_locator
    },
    threshold: {
      latest_shortfall_pct: round(latest.shortfall_pct),
      threshold_basis: 'historical_distribution_fallback',
      anchors_pct: thresholdAnchors.map(value => round(value)),
      source_locator: latest.source_locator
    },
    momentum: {
      latest_year_over_year_shortfall_change_percentage_points: round(latestChange),
      annual_change_observations: changes.length,
      anchors_percentage_points: momentumAnchors.map(value => round(value)),
      source_locator: latest.source_locator
    },
    extent: {
      geography: 'World',
      normalized_value: 1,
      definition: 'Ember source-reported World hydropower generation; no country rows are summed.',
      source_locator: latest.source_locator
    },
    expectation_model: {
      type: 'ordinary_least_squares_linear_generation_trend',
      start_year: records[0].observation_year,
      end_year: latest.observation_year,
      slope_twh_per_year: round(slope),
      intercept_twh: round(intercept),
      boundary: 'Expected output is a transparent historical trend, not installed capacity, climate-normal generation or a causal hydrological attribution.'
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      source_last_modified: snapshot.source.source_last_modified
    }
  },
  transformations: [
    { type: 'source_reported_world_hydropower_generation', formula: 'Retain Ember Area=World / Electricity generation / Fuel / Hydro / TWh annual rows without country aggregation.' },
    { type: 'transparent_expected_output', formula: 'Fit one OLS line to the complete retained global generation history and express annual below-trend output as percent of fitted output.' },
    { type: 'historical_distribution_normalization', formula: 'Map shortfall magnitude, shortfall position and annual worsening through median / p75 / p90 / p97.5 anchors from the complete series.' }
  ],
  source_ids: ['ember_global_electricity_data'],
  uncertainty: `${snapshot.uncertainty} The linear expected-output counterfactual does not isolate hydrology, capacity additions, outages, dispatch, curtailment or electricity demand.`,
  freshness: `Annual Ember Yearly Electricity Data through ${latest.observation_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `Ember supplies ${records.length} complete annual source-reported World hydropower generation observations; a transparent trend residual supplies current shortfall magnitude, historical position and momentum at global scope.`,
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for hydropower_reliability_decline.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_25_ember_global_hydropower_shortfall',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'ember_global_electricity_data',
  promoted_node_count: 1,
  receipts: [receipt]
};
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-25.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-25.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
