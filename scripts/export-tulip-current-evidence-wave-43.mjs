import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/world-bank-global-air-quality-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const annual = snapshot.records
  .filter(record => Number.isFinite(record.mean_annual_pm2_5_exposure_ug_m3))
  .sort((left, right) => left.observation_year - right.observation_year);
const latest = annual.at(-1);
const history = annual.slice(0, -1);
const annualIncreases = annual.slice(1).map((record, index) => record.mean_annual_pm2_5_exposure_ug_m3 - annual[index].mean_annual_pm2_5_exposure_ug_m3);
const momentumAnchors = historicalDistributionAnchors(annualIncreases.slice(0, -1), 'annual');
const recognizedAnchors = [5, 15, 25, 35];
const round = (value, digits = 6) => Number(value.toFixed(digits));

if (annual.length < 20 || history.length < 20 || !momentumAnchors || latest.observation_year !== snapshot.source_summary.latest_complete_year) {
  throw new Error('World Bank global PM2.5 annual coverage gate failed.');
}

const latestIncrease = annualIncreases.at(-1);
const components = {
  magnitude: round(normalizeWithAnchors(latest.mean_annual_pm2_5_exposure_ug_m3, recognizedAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.mean_annual_pm2_5_exposure_ug_m3, recognizedAnchors, 'higher_is_worse')),
  momentum: round(normalizeWithAnchors(latestIncrease, momentumAnchors, 'higher_is_worse')),
  extent: 1
};
const gate = { direct_components: ['magnitude', 'threshold', 'momentum', 'extent'], global_scope: true, current_observation: true };
if (!qualifiesForCurrentData(gate)) throw new Error('pm2_5_particulates did not pass the current-data coverage gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'pm2_5_particulates',
  method: 'current_data',
  as_of: String(latest.observation_year),
  components,
  raw_inputs: {
    magnitude: {
      latest_complete_year: latest.observation_year,
      latest_world_population_weighted_mean_pm2_5_ug_m3: latest.mean_annual_pm2_5_exposure_ug_m3,
      baseline: 'WHO 2021 annual PM2.5 air-quality guideline',
      baseline_ug_m3: recognizedAnchors[0],
      complete_prior_annual_observations: history.length,
      direction: 'higher_is_worse'
    },
    threshold: {
      latest_world_population_weighted_mean_pm2_5_ug_m3: latest.mean_annual_pm2_5_exposure_ug_m3,
      threshold_basis: 'recognized_who_2021_annual_pm2_5_air_quality_guideline_and_interim_targets',
      four_normalization_anchors_ug_m3: {
        reference_aqg: recognizedAnchors[0],
        concerning_interim_target_3: recognizedAnchors[1],
        critical_interim_target_2: recognizedAnchors[2],
        extreme_interim_target_1: recognizedAnchors[3]
      },
      excluded_intermediate_who_target: { interim_target_4_ug_m3: 10, reason: 'TULIP v2 requires exactly four documented normalization anchors.' },
      direction: 'higher_is_worse'
    },
    momentum: {
      prior_complete_year: annual.at(-2).observation_year,
      prior_world_population_weighted_mean_pm2_5_ug_m3: annual.at(-2).mean_annual_pm2_5_exposure_ug_m3,
      latest_year_over_year_increase_ug_m3: round(latestIncrease),
      complete_prior_annual_change_observations: annualIncreases.length - 1,
      historical_distribution_anchors_annual_increase_ug_m3: momentumAnchors.map(value => round(value))
    },
    extent: {
      normalized_value: 1,
      geography: 'World',
      aggregation: 'World Bank source-native population-weighted global mean exposure'
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      source_last_updated: snapshot.source_summary.source_last_updated,
      indicator_id: snapshot.source_summary.indicator_id,
      complete_annual_observations: annual.length
    },
    coverage_gate: gate
  },
  transformations: [
    { type: 'source_native_global_aggregation', formula: 'Use the World Bank WLD observation directly; do not manually average or sum country rows.' },
    { type: 'recognized_threshold_normalization', formula: 'Piecewise-linearly map 5, 15, 25 and 35 micrograms per cubic metre to normalized 0, 0.33, 0.67 and 1 using WHO 2021 annual PM2.5 AQG and interim targets.' },
    { type: 'annual_increase_momentum', formula: 'Subtract the preceding complete-year World exposure from the latest complete year and normalize the increase through the prior annual-change median, p75, p90 and p97.5 distribution.' },
    { type: 'global_population_exposure_extent', formula: 'Assign full extent because the source observation is the World population-weighted aggregate for the metric contract.' }
  ],
  source_ids: ['world_bank_wdi_global_pm2_5_exposure'],
  uncertainty: `${snapshot.uncertainty} WHO thresholds are health-based guidance rather than legal exceedance limits, and the latest exposure year trails the source update date.`,
  freshness: `World Bank source updated ${snapshot.source_summary.source_last_updated}; latest complete global exposure year ${latest.observation_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `The World Bank supplies ${annual.length} consecutive World population-weighted annual exposure estimates, including current magnitude, recognized WHO threshold position, annual momentum and global extent.`,
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for pm2_5_particulates.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_43_world_bank_global_pm2_5_exposure', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'world_bank_wdi_global_pm2_5_exposure', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-43.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-43.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
