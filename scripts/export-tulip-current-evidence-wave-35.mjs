import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-ocean-stratification-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const series = a.annual_series.values;
const latest = series.at(-1);
const history = series.slice(0, -1);
const round = (value, digits = 6) => Number(value.toFixed(digits));

function linearSlope(points) {
  const meanX = points.reduce((sum, point) => sum + point.year, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.n2_anomaly_1e_minus_7_s_minus_2, 0) / points.length;
  const numerator = points.reduce((sum, point) => sum + (point.year - meanX) * (point.n2_anomaly_1e_minus_7_s_minus_2 - meanY), 0);
  const denominator = points.reduce((sum, point) => sum + (point.year - meanX) ** 2, 0);
  return numerator / denominator;
}

if (series.length !== 59 || latest.year !== 2018) throw new Error('Ocean-stratification annual source-data gate failed.');
const anomalyAnchors = historicalDistributionAnchors(history.map(point => point.n2_anomaly_1e_minus_7_s_minus_2), 'annual');
const rollingDecadalSlopes = [];
for (let index = 0; index <= series.length - 10; index += 1) {
  const window = series.slice(index, index + 10);
  rollingDecadalSlopes.push({ end_year: window.at(-1).year, value: linearSlope(window) * 10 });
}
const currentDecadalSlope = rollingDecadalSlopes.at(-1).value;
const momentumAnchors = historicalDistributionAnchors(rollingDecadalSlopes.slice(0, -1).map(point => point.value), 'annual');
if (!anomalyAnchors || !momentumAnchors) throw new Error('Ocean-stratification historical-distribution gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'thermal_stratification_intensification',
  method: 'current_data',
  as_of: String(latest.year),
  components: {
    magnitude: round(normalizeWithAnchors(latest.n2_anomaly_1e_minus_7_s_minus_2, anomalyAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(a.annual_series.latest_p5_uncertainty, anomalyAnchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(currentDecadalSlope, momentumAnchors, 'higher_is_worse')),
    extent: a.global_extent_normalized
  },
  raw_inputs: {
    magnitude: { latest_year: latest.year, latest_global_n2_anomaly_1e_minus_7_s_minus_2: latest.n2_anomaly_1e_minus_7_s_minus_2, historical_period: [history[0].year, history.at(-1).year], complete_historical_annual_observations: history.length, historical_distribution_anchors: anomalyAnchors.map(value => round(value, 6)), percentiles: ['median', '75th', '90th', '97.5th'] },
    threshold: { latest_p5_uncertainty_1e_minus_7_s_minus_2: a.annual_series.latest_p5_uncertainty, latest_point_estimate: latest.n2_anomaly_1e_minus_7_s_minus_2, latest_p95_uncertainty_1e_minus_7_s_minus_2: a.annual_series.latest_p95_uncertainty, historical_distribution_anchors: anomalyAnchors.map(value => round(value, 6)), boundary: 'The conservative 5th-percentile source uncertainty endpoint is compared with the same historical annual distribution.' },
    momentum: { window_years: 10, current_window: [series.at(-10).year, latest.year], current_decadal_linear_change_1e_minus_7_s_minus_2: round(currentDecadalSlope, 6), complete_prior_rolling_windows: rollingDecadalSlopes.length - 1, historical_distribution_anchors: momentumAnchors.map(value => round(value, 6)), updated_review_context: a.updated_review },
    extent: { geographic_scope: a.geographic_scope, normalized_value: a.global_extent_normalized, boundary: 'Global mean 0-2,000 m series; no local or basin inference.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, workbook_url: a.annual_series.workbook_url, workbook_sha256: a.annual_series.workbook_sha256, workbook_sheet: a.annual_series.workbook_sheet, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'historical_distribution_current_magnitude', formula: 'Normalize the 2018 global annual N-squared anomaly through the median, 75th, 90th and 97.5th percentiles of 58 complete prior annual source values.' },
    { type: 'uncertainty_conservative_threshold_position', formula: 'Normalize the source 5th-percentile 2018 uncertainty endpoint through the same historical distribution.' },
    { type: 'rolling_decadal_momentum_distribution', formula: 'Calculate ordinary-least-squares change for every complete 10-year source window, express each as change per decade, and normalize the latest window through the prior-window distribution.' },
    { type: 'global_mean_extent', formula: 'Use the source-declared global ocean aggregation; preserve the depth and spatial-mean boundary.' }
  ],
  source_ids: ['global_ocean_stratification_observation_assessment'],
  uncertainty: snapshot.uncertainty,
  freshness: `Checksum-bound annual series through ${latest.year}; peer-reviewed three-dataset review confirms observed increases through ${a.updated_review.observation_end_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The official source-data workbook supplies 59 complete global annual observations, source uncertainty bounds and 50 rolling decadal windows. A 2025 peer-reviewed review independently confirms positive global 0-200 m and 0-2,000 m trends through 2024.',
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for thermal_stratification_intensification.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_35_global_ocean_stratification', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'global_ocean_stratification_observation_assessment', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-35.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-35.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
