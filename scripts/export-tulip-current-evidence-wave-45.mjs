import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EDGAR_PATH = 'public/edgar-snapshot.json';
const ICAO_PATH = 'public/icao-global-aviation-impact-snapshot.json';
const [edgar, icao] = await Promise.all([EDGAR_PATH, ICAO_PATH].map(async file => JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'))));
const series = edgar.global_time_series.filter(row => row.metric_id === 'carbon_pathway_aviation_jet_fuel_co2').sort((left, right) => left.observation_year - right.observation_year);
if (series.length < 20) throw new Error(`EDGAR aviation annual coverage gate failed: ${series.length} observations.`);
const baseline = series.find(row => row.observation_year === 1990);
const latest = series.at(-1);
const previous = series.at(-2);
if (!baseline || !latest || !previous) throw new Error('EDGAR aviation baseline or latest observations are missing.');
const prior = series.slice(0, -1);
const anomalies = series.map(row => ({ year: row.observation_year, value: row.emission_gg_substance - baseline.emission_gg_substance }));
const changes = series.slice(1).map((row, index) => ({ year: row.observation_year, value: row.emission_gg_substance - series[index].emission_gg_substance }));
const magnitudeAnchors = historicalDistributionAnchors(anomalies.slice(0, -1).map(row => row.value), 'annual');
const thresholdAnchors = historicalDistributionAnchors(prior.map(row => row.emission_gg_substance), 'annual');
const momentumAnchors = historicalDistributionAnchors(changes.slice(0, -1).map(row => row.value), 'annual');
if (!magnitudeAnchors || !thresholdAnchors || !momentumAnchors) throw new Error('EDGAR aviation historical anchors failed the annual-observation gate.');
const round = (value, digits = 6) => Number(value.toFixed(digits));
const latestAnomaly = anomalies.at(-1).value;
const latestChange = changes.at(-1).value;
const components = {
  magnitude: round(normalizeWithAnchors(latestAnomaly, magnitudeAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.emission_gg_substance, thresholdAnchors, 'higher_is_worse')),
  momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
  extent: round(icao.assessment.reported_global_coverage_pct / 100)
};
const gate = { direct_components: ['magnitude', 'threshold', 'momentum', 'extent'], global_scope: true, current_observation: true };
if (!qualifiesForCurrentData(gate)) throw new Error('aviation did not pass the current-data coverage gate.');
const receipt = buildTulipUrgencyReceipt({
  node_id: 'aviation', method: 'current_data', as_of: String(latest.observation_year), components,
  raw_inputs: {
    magnitude: { baseline_year: baseline.observation_year, baseline_gg_co2: baseline.emission_gg_substance, latest_year: latest.observation_year, latest_gg_co2: latest.emission_gg_substance, anomaly_gg_co2: latestAnomaly, anchors_gg_co2: magnitudeAnchors.map(value => round(value)), complete_annual_observations: series.length },
    threshold: { basis: 'historical_distribution_no_recognized_global_aviation_co2_threshold', latest_gg_co2: latest.emission_gg_substance, anchors_gg_co2: thresholdAnchors.map(value => round(value)), prior_annual_observations: prior.length },
    momentum: { prior_year: previous.observation_year, latest_year: latest.observation_year, annual_change_gg_co2: latestChange, anchors_gg_co2_change: momentumAnchors.map(value => round(value)), prior_annual_changes: changes.length - 1 },
    extent: { icao_reported_global_coverage_pct: icao.assessment.reported_global_coverage_pct, normalized_value: round(icao.assessment.reported_global_coverage_pct / 100) },
    source_snapshots: [{ path: EDGAR_PATH, version: edgar.version, captured_at: edgar.captured_at }, { path: ICAO_PATH, version: icao.version, captured_at: icao.captured_at }],
    coverage_gate: gate
  },
  transformations: [
    { type: 'fixed_1990_baseline_anomaly', formula: 'Subtract EDGAR 1990 global civil-aviation fossil CO2 from every annual value.' },
    { type: 'historical_distribution_magnitude', formula: 'Map the latest anomaly through prior annual median, p75, p90 and p97.5 anchors.' },
    { type: 'historical_distribution_threshold_fallback', formula: 'Because no recognized global aviation-emissions danger threshold exists, map the latest annual CO2 value through the prior annual distribution.' },
    { type: 'annual_momentum', formula: 'Map the latest year-over-year EDGAR change through the prior annual-change distribution.' },
    { type: 'global_reporting_extent', formula: 'Use ICAO reported 99% global statistical coverage.' }
  ],
  source_ids: ['edgar_global_emissions_database', 'icao_environmental_reports'],
  uncertainty: `${edgar.uncertainty} ${icao.uncertainty}`,
  freshness: `EDGAR aviation observation through ${latest.observation_year}; ICAO activity coverage ${icao.assessment.observation_year}; snapshots captured ${edgar.captured_at} and ${icao.captured_at}.`,
  selection_reason: { selected_method_passed: `EDGAR supplies ${series.length} complete global annual civil-aviation CO2 observations including magnitude and momentum, while ICAO reports 99% global activity coverage.`, higher_priority_failures: [] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`Receipt verification failed for aviation: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_45_edgar_icao_global_aviation', generated_at: new Date().toISOString(), promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-45.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-45.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
