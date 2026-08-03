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
const SNAPSHOT_PATH = 'public/temperature-benchmarks.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function slope(points, field) {
  const meanYear = points.reduce((sum, point) => sum + point.year, 0) / points.length;
  const meanValue = points.reduce((sum, point) => sum + point[field], 0) / points.length;
  const denominator = points.reduce((sum, point) => sum + (point.year - meanYear) ** 2, 0);
  return points.reduce((sum, point) => sum + (point.year - meanYear) * (point[field] - meanValue), 0) / denominator;
}

const sourceRecords = snapshot.giss_zonal_annual?.records ?? [];
const windowYears = 30;
const ratios = [];
for (let index = windowYears - 1; index < sourceRecords.length; index += 1) {
  const window = sourceRecords.slice(index - windowYears + 1, index + 1);
  const globalTrend = slope(window, 'global_anomaly_c');
  const arcticTrend = slope(window, 'arctic_64n_90n_anomaly_c');
  if (window.at(-1).year < 1979 || globalTrend <= 0.005) continue;
  ratios.push({
    year: window.at(-1).year,
    window_start_year: window[0].year,
    global_trend_c_per_decade: globalTrend * 10,
    arctic_trend_c_per_decade: arcticTrend * 10,
    value: arcticTrend / globalTrend
  });
}
if (ratios.length < 20) throw new Error(`Only ${ratios.length} complete rolling Arctic-amplification observations are available.`);

const values = ratios.map(point => point.value);
const magnitudeValues = values.map(value => value - 1);
const changes = ratios.slice(1).map((point, index) => point.value - ratios[index].value);
const magnitudeAnchors = strictAnchors(magnitudeValues);
const thresholdAnchors = strictAnchors(values);
const momentumAnchors = strictAnchors(changes);
const latest = ratios.at(-1);
const latestChange = changes.at(-1);
const arcticAreaShare = (1 - Math.sin(64 * Math.PI / 180)) / 2;
const sourceUrl = snapshot.giss_zonal_annual.download_url;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'arctic_amplification_rates',
  method: 'current_data',
  as_of: String(latest.year),
  components: {
    magnitude: round(normalizeWithAnchors(latest.value - 1, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.value, thresholdAnchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
    extent: round(arcticAreaShare)
  },
  raw_inputs: {
    magnitude: {
      latest_30_year_arctic_to_global_warming_ratio: round(latest.value),
      no_amplification_reference_ratio: 1,
      excess_ratio_above_reference: round(latest.value - 1),
      complete_rolling_annual_observations: ratios.length,
      anchors: magnitudeAnchors.map(value => round(value)),
      source_locator: sourceUrl
    },
    threshold: {
      latest_30_year_arctic_to_global_warming_ratio: round(latest.value),
      latest_arctic_trend_c_per_decade: round(latest.arctic_trend_c_per_decade),
      latest_global_trend_c_per_decade: round(latest.global_trend_c_per_decade),
      threshold_basis: 'historical_distribution_fallback',
      anchors: thresholdAnchors.map(value => round(value)),
      source_locator: sourceUrl
    },
    momentum: {
      latest_year_over_year_change_in_rolling_ratio: round(latestChange),
      annual_change_observations: changes.length,
      anchors: momentumAnchors.map(value => round(value)),
      source_locator: sourceUrl
    },
    extent: {
      arctic_band: '64N-90N',
      earth_surface_area_share: round(arcticAreaShare),
      normalized_value: round(arcticAreaShare),
      formula: '(1 - sin(64 degrees)) / 2 for the spherical cap north of 64N',
      source_locator: sourceUrl
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      updated_at: snapshot.updated_at,
      baseline_period: snapshot.giss_zonal_annual.baseline_period,
      source_history_start: sourceRecords[0].year,
      source_history_end: sourceRecords.at(-1).year,
      trend_window_start: latest.window_start_year,
      trend_window_end: latest.year
    }
  },
  transformations: [
    {
      type: 'rolling_arctic_amplification_ratio',
      formula: '30-year OLS trend of NASA GISS 64N-90N annual anomaly divided by the matching 30-year OLS trend of the NASA GISS global annual anomaly.'
    },
    {
      type: 'stable_positive_global_trend_gate',
      formula: 'Retain windows ending in 1979 or later with a global trend above 0.005 C/year; do not divide by zero or unstable near-zero trends.'
    },
    {
      type: 'historical_distribution_normalization',
      formula: 'Map the amplification ratio, excess above the no-amplification ratio of 1 and its annual change through median / p75 / p90 / p97.5 anchors.'
    }
  ],
  source_ids: ['nasa_giss_surface_temperature_analysis'],
  uncertainty: 'NASA GISS anomaly uncertainty, sparse early Arctic coverage, interpolation, baseline choice and the 30-year window affect the ratio. The ratio describes differential warming and does not attribute every Arctic impact to amplification.',
  freshness: `NASA GISS zonal annual series through ${latest.year}; snapshot refreshed ${snapshot.updated_at}.`,
  selection_reason: {
    selected_method_passed: `NASA GISS supplies a complete, common-method global and 64N-90N annual history; ${ratios.length} stable 30-year ratios quantify current amplification magnitude, historical position, momentum and the exact observed surface-area extent.`,
    higher_priority_failures: []
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for arctic_amplification_rates.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_9_nasa_giss_arctic_amplification',
  generated_at: new Date().toISOString(),
  promoted_node_count: 1,
  receipts: [receipt]
};
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-9.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-9.json',
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
