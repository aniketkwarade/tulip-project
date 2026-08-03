import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/noaa-ratpac-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const annual = snapshot.records
  .filter(record => record.metric_id === 'lower_stratospheric_temperature_anomaly' && Number.isFinite(record.temperature_anomaly_deg_c))
  .map(record => ({ year: record.observation_year, value: record.temperature_anomaly_deg_c, source_locator: record.source_locator, pressure_levels_hpa: record.component_pressure_levels_hpa }))
  .sort((left, right) => left.year - right.year);
const latest = annual.at(-1);
const history = annual.slice(0, -1);
const coolingMagnitudes = annual.map(point => -point.value);
const annualCoolingChanges = annual.slice(1).map((point, index) => annual[index].value - point.value);
const magnitudeAnchors = historicalDistributionAnchors(coolingMagnitudes.slice(0, -1), 'annual');
const inverseTemperatureAnchors = historicalDistributionAnchors(history.map(point => -point.value), 'annual');
const thresholdAnchors = inverseTemperatureAnchors?.map(value => -value);
const momentumAnchors = historicalDistributionAnchors(annualCoolingChanges.slice(0, -1), 'annual');
const round = (value, digits = 6) => Number(value.toFixed(digits));

if (history.length < 20 || !magnitudeAnchors || !thresholdAnchors || !momentumAnchors || latest.year !== new Date().getUTCFullYear() - 1) {
  throw new Error('RATPAC lower-stratosphere historical-distribution gate failed.');
}

const latestCoolingChange = annualCoolingChanges.at(-1);
const components = {
  magnitude: round(normalizeWithAnchors(-latest.value, magnitudeAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.value, thresholdAnchors, 'lower_is_worse')),
  momentum: round(normalizeWithAnchors(latestCoolingChange, momentumAnchors, 'higher_is_worse')),
  extent: 1
};
const gate = { direct_components: ['magnitude', 'threshold', 'momentum', 'extent'], global_scope: true, current_observation: true };
if (!qualifiesForCurrentData(gate)) throw new Error('stratospheric_cooling did not pass the current-data coverage gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'stratospheric_cooling',
  method: 'current_data',
  as_of: String(latest.year),
  components,
  raw_inputs: {
    magnitude: { latest_complete_year: latest.year, latest_global_100_70_50_hpa_mean_anomaly_deg_c: latest.value, latest_cooling_magnitude_deg_c: round(-latest.value), complete_prior_annual_observations: history.length, historical_distribution_anchors_cooling_deg_c: magnitudeAnchors.map(value => round(value)) },
    threshold: { latest_global_100_70_50_hpa_mean_anomaly_deg_c: latest.value, threshold_basis: 'historical_distribution_fallback', direction: 'lower_is_worse', historical_distribution_anchors_anomaly_deg_c_in_worsening_order: thresholdAnchors.map(value => round(value)) },
    momentum: { latest_year_over_year_additional_cooling_deg_c: round(latestCoolingChange), complete_prior_annual_change_observations: annualCoolingChanges.length - 1, historical_distribution_anchors_additional_cooling_deg_c: momentumAnchors.map(value => round(value)) },
    extent: { normalized_value: 1, geography: 'Globe', definition: 'NOAA RATPAC source-native global large-area aggregate.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, component_pressure_levels_hpa: latest.pressure_levels_hpa, complete_annual_observations: annual.length },
    coverage_gate: gate
  },
  transformations: [
    { type: 'lower_stratosphere_layer_aggregation', formula: 'Arithmetic mean of source-native NOAA RATPAC global annual anomalies at 100, 70 and 50 hPa; require all three pressure levels for each retained year.' },
    { type: 'cooling_direction', formula: 'Negate the temperature anomaly for magnitude and calculate previous-year minus current-year anomaly for momentum, so stronger or accelerating cooling maps upward.' },
    { type: 'historical_distribution_normalization', formula: 'Map current cooling magnitude, source anomaly in reverse direction and annual additional cooling through prior complete-year median / p75 / p90 / p97.5 distributions.' },
    { type: 'global_extent', formula: 'Use only the NOAA RATPAC Globe rows; do not infer local stratospheric conditions.' }
  ],
  source_ids: ['noaa_ratpac'],
  uncertainty: `${snapshot.uncertainty} The three-pressure-level arithmetic mean is a transparent contract-bound layer indicator, not a NOAA-published lower-stratosphere product.`,
  freshness: `NOAA RATPAC complete global annual pressure-level observations through ${latest.year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: `NOAA RATPAC supplies ${annual.length} complete annual global observations through ${latest.year} at all three declared lower-stratosphere levels, directly supporting magnitude, historical position, momentum and global extent.`, higher_priority_failures: [] }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for stratospheric_cooling.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_41_noaa_ratpac_lower_stratosphere', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'noaa_ratpac', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-41.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-41.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
