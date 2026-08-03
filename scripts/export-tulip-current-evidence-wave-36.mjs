import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/ipcc-aerosol-cooling-loss-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const series = a.values;
const latest = series.at(-1);
const peak = series.reduce((lowest, point) => point.aerosol_erf_w_m2 < lowest.aerosol_erf_w_m2 ? point : lowest);
const postPeak = series.filter(point => point.year > peak.year).map(point => ({ ...point, cooling_loss_w_m2: point.aerosol_erf_w_m2 - peak.aerosol_erf_w_m2 }));
const latestLoss = postPeak.at(-1).cooling_loss_w_m2;
const lossHistory = postPeak.slice(0, -1);
const round = (value, digits = 6) => Number(value.toFixed(digits));

function linearSlope(points) {
  const meanX = points.reduce((sum, point) => sum + point.year, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.aerosol_erf_w_m2, 0) / points.length;
  const numerator = points.reduce((sum, point) => sum + (point.year - meanX) * (point.aerosol_erf_w_m2 - meanY), 0);
  const denominator = points.reduce((sum, point) => sum + (point.year - meanX) ** 2, 0);
  return numerator / denominator;
}

if (series.length !== 30 || peak.year !== a.assessed_maximum_cooling_year || latest.year !== a.latest_year) throw new Error('IPCC aerosol-ERF source-data gate failed.');
for (const point of series) {
  if (Math.abs(point.aerosol_erf_w_m2 - point.erfari_w_m2 - point.erfaci_w_m2) > 1e-12) throw new Error(`Aerosol forcing components do not reconcile in ${point.year}.`);
}

const lossAnchors = historicalDistributionAnchors(lossHistory.map(point => point.cooling_loss_w_m2), 'annual');
const lossFractionHistory = lossHistory.map(point => point.cooling_loss_w_m2 / Math.abs(peak.aerosol_erf_w_m2));
const lossFractionAnchors = historicalDistributionAnchors(lossFractionHistory, 'annual');
const rollingDecadalSlopes = [];
for (let index = 0; index <= series.length - 10; index += 1) {
  const window = series.slice(index, index + 10);
  rollingDecadalSlopes.push({ start_year: window[0].year, end_year: window.at(-1).year, change_w_m2_per_decade: linearSlope(window) * 10 });
}
const currentDecadalSlope = rollingDecadalSlopes.at(-1).change_w_m2_per_decade;
const momentumAnchors = historicalDistributionAnchors(rollingDecadalSlopes.slice(0, -1).map(point => point.change_w_m2_per_decade), 'annual');
if (!lossAnchors || !lossFractionAnchors || !momentumAnchors) throw new Error('IPCC aerosol historical-distribution gate failed.');

const components = {
  magnitude: round(normalizeWithAnchors(latestLoss, lossAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latestLoss / Math.abs(peak.aerosol_erf_w_m2), lossFractionAnchors, 'higher_is_worse')),
  momentum: round(normalizeWithAnchors(currentDecadalSlope, momentumAnchors, 'higher_is_worse')),
  extent: a.global_extent_normalized
};
const gate = {
  direct_components: ['magnitude', 'threshold', 'momentum', 'extent'],
  global_scope: true,
  current_observation: true
};
if (!qualifiesForCurrentData(gate)) throw new Error('aerosol_cooling_loss did not pass the current-data coverage gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'aerosol_cooling_loss',
  method: 'current_data',
  as_of: String(latest.year),
  components,
  raw_inputs: {
    magnitude: { maximum_cooling_year: peak.year, maximum_cooling_erf_w_m2: peak.aerosol_erf_w_m2, latest_year: latest.year, latest_total_aerosol_erf_w_m2: latest.aerosol_erf_w_m2, cooling_loss_w_m2: round(latestLoss), complete_prior_post_peak_annual_observations: lossHistory.length, historical_distribution_anchors_w_m2: lossAnchors.map(value => round(value)), percentiles: ['median', '75th', '90th', '97.5th'] },
    threshold: { cooling_loss_fraction_of_maximum: round(latestLoss / Math.abs(peak.aerosol_erf_w_m2)), complete_prior_post_peak_annual_observations: lossFractionHistory.length, historical_distribution_anchors_fraction: lossFractionAnchors.map(value => round(value)), boundary: 'No recognized physical danger threshold exists; the required historical-distribution fallback measures the fraction of the assessed maximum cooling mask already lost.' },
    momentum: { window_years: 10, current_window: [series.at(-10).year, latest.year], current_linear_change_w_m2_per_decade: round(currentDecadalSlope), complete_prior_rolling_windows: rollingDecadalSlopes.length - 1, historical_distribution_anchors_w_m2_per_decade: momentumAnchors.map(value => round(value)), direction: 'A more positive trend is worse because aerosol ERF is becoming less negative.' },
    extent: { geographic_scope: a.geographic_scope, normalized_value: a.global_extent_normalized },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_file_sha256: snapshot.source.source_file_sha256, source_complete_annual_observations: a.source_complete_annual_observations, retained_complete_annual_observations: a.retained_complete_annual_observations, latest_ipcc_assessed_range_w_m2: a.latest_ipcc_assessed_range_w_m2, excluded_from_scoring: snapshot.excluded_from_scoring },
    coverage_gate: gate
  },
  transformations: [
    { type: 'cooling_loss_from_assessed_maximum', formula: 'Subtract the most negative assessed annual aerosol ERF from the latest value; a positive difference is cooling-mask loss.' },
    { type: 'post_peak_historical_distribution', formula: 'Normalize the latest absolute loss and the loss fraction through median, 75th, 90th and 97.5th percentiles of 27 complete prior post-peak annual values.' },
    { type: 'rolling_decadal_momentum_distribution', formula: 'Calculate ordinary-least-squares change for each complete 10-year 1990-2019 window and normalize the 2010-2019 change through 20 prior windows.' },
    { type: 'global_mean_extent', formula: 'Use the IPCC global-mean effective-radiative-forcing boundary; do not infer regional uniformity.' }
  ],
  source_ids: ['ipcc_ar6_global_aerosol_erf_time_series'],
  uncertainty: snapshot.uncertainty,
  freshness: `AR6 annual forcing series through ${latest.year}; IPCC physical-science assessment release cadence; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The IPCC AR6 Chapter 7 authors’ checksum-bound global annual series directly supplies total anthropogenic aerosol ERF, a 27-year post-maximum loss history and 20 prior decadal momentum windows. Magnitude, threshold fallback, momentum and global extent therefore provide 100% current-component coverage.',
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for aerosol_cooling_loss.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_36_ipcc_aerosol_cooling_loss', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'ipcc_ar6_global_aerosol_erf_time_series', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-36.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-36.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
