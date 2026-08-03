import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildTulipUrgencyReceipt,
  historicalDistributionAnchors,
  normalizeWithAnchors,
  qualifiesForCurrentData,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/nasa-ceres-global-cloud-radiative-effect-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

const recordsByYear = new Map();
for (const record of snapshot.records || []) {
  if (!Number.isFinite(record.toa_shortwave_cloud_radiative_effect_w_m2)) continue;
  const records = recordsByYear.get(record.observation_year) || [];
  records.push(record);
  recordsByYear.set(record.observation_year, records);
}
const annual = [...recordsByYear.entries()]
  .filter(([, records]) => records.length === 12)
  .map(([year, records]) => ({
    year,
    monthly_observations: records.length,
    mean_shortwave_cloud_radiative_effect_w_m2: round(
      records.reduce((sum, record) => sum + record.toa_shortwave_cloud_radiative_effect_w_m2, 0) / records.length
    )
  }))
  .sort((left, right) => left.year - right.year);

if (annual.length < 20) throw new Error(`NASA CERES annual coverage gate failed: ${annual.length} complete years.`);
const baselineYears = annual.filter(point => point.year >= 2001 && point.year <= 2010);
if (baselineYears.length !== 10) throw new Error(`NASA CERES 2001-2010 baseline is incomplete: ${baselineYears.length} years.`);
const baselineMean = baselineYears.reduce((sum, point) => sum + point.mean_shortwave_cloud_radiative_effect_w_m2, 0) / baselineYears.length;
const annualWithLoss = annual.map(point => ({
  ...point,
  shortwave_cooling_loss_from_2001_2010_w_m2: round(point.mean_shortwave_cloud_radiative_effect_w_m2 - baselineMean)
}));
const latest = annualWithLoss.at(-1);
const priorAnnual = annualWithLoss.slice(0, -1);
const annualWeakening = annualWithLoss.slice(1).map((point, index) => ({
  year: point.year,
  weakening_w_m2: round(point.mean_shortwave_cloud_radiative_effect_w_m2 - annualWithLoss[index].mean_shortwave_cloud_radiative_effect_w_m2)
}));
const magnitudeAnchors = historicalDistributionAnchors(
  priorAnnual.map(point => point.shortwave_cooling_loss_from_2001_2010_w_m2),
  'annual'
);
const thresholdAnchors = historicalDistributionAnchors(
  priorAnnual.map(point => point.mean_shortwave_cloud_radiative_effect_w_m2),
  'annual'
);
const momentumAnchors = historicalDistributionAnchors(
  annualWeakening.slice(0, -1).map(point => point.weakening_w_m2),
  'annual'
);
if (!magnitudeAnchors || !thresholdAnchors || !momentumAnchors) {
  throw new Error('NASA CERES historical-distribution anchors did not pass the 20-complete-annual-observation gate.');
}

const latestWeakening = annualWeakening.at(-1);
const components = {
  magnitude: round(normalizeWithAnchors(latest.shortwave_cooling_loss_from_2001_2010_w_m2, magnitudeAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.mean_shortwave_cloud_radiative_effect_w_m2, thresholdAnchors, 'higher_is_worse')),
  momentum: round(normalizeWithAnchors(latestWeakening.weakening_w_m2, momentumAnchors, 'higher_is_worse')),
  extent: 1
};
const gate = {
  direct_components: ['magnitude', 'threshold', 'momentum', 'extent'],
  global_scope: true,
  current_observation: true
};
if (!qualifiesForCurrentData(gate)) throw new Error('cloud_albedo_shift did not pass the current-data coverage gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'cloud_albedo_shift',
  method: 'current_data',
  as_of: String(latest.year),
  components,
  raw_inputs: {
    magnitude: {
      latest_complete_calendar_year: latest.year,
      latest_global_mean_shortwave_cloud_radiative_effect_w_m2: latest.mean_shortwave_cloud_radiative_effect_w_m2,
      baseline_period: '2001-2010 complete calendar years',
      baseline_global_mean_shortwave_cloud_radiative_effect_w_m2: round(baselineMean),
      latest_shortwave_cooling_loss_from_baseline_w_m2: latest.shortwave_cooling_loss_from_2001_2010_w_m2,
      historical_distribution_anchors_w_m2: magnitudeAnchors.map(value => round(value)),
      direction: 'higher_is_worse'
    },
    threshold: {
      latest_global_mean_shortwave_cloud_radiative_effect_w_m2: latest.mean_shortwave_cloud_radiative_effect_w_m2,
      threshold_basis: 'historical_distribution_no_recognized_global_shortwave_cloud_radiative_effect_threshold',
      historical_distribution_anchors_w_m2: thresholdAnchors.map(value => round(value)),
      complete_prior_annual_observations: priorAnnual.length,
      direction: 'higher_is_worse_less_negative_means_weaker_shortwave_cloud_cooling'
    },
    momentum: {
      latest_complete_calendar_year: latestWeakening.year,
      prior_complete_calendar_year: annualWithLoss.at(-2).year,
      latest_year_over_year_shortwave_cooling_weakening_w_m2: latestWeakening.weakening_w_m2,
      historical_distribution_anchors_annual_weakening_w_m2: momentumAnchors.map(value => round(value)),
      complete_prior_annual_change_observations: annualWeakening.length - 1,
      direction: 'higher_is_worse'
    },
    extent: {
      normalized_value: 1,
      geography: 'Global mean',
      aggregation: 'NASA CERES source-native global monthly means aggregated to complete calendar years'
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      product_id: snapshot.source_summary.product_id,
      product_version: snapshot.source_summary.product_version,
      latest_source_observation_period: snapshot.source_summary.latest_observation_period,
      complete_calendar_years: annual.length
    },
    coverage_gate: gate
  },
  transformations: [
    {
      type: 'signed_shortwave_cloud_radiative_effect',
      formula: 'For every month, subtract outgoing all-sky shortwave flux from outgoing clear-sky shortwave flux. Negative values denote cloud shortwave cooling.'
    },
    {
      type: 'complete_calendar_year_mean',
      formula: 'Average exactly 12 source-native global monthly shortwave cloud-radiative-effect observations; exclude partial 2000 and 2026 calendar years.'
    },
    {
      type: 'historical_distribution_magnitude',
      formula: 'Subtract the fixed 2001-2010 annual mean from each annual value and map the latest cooling loss through prior annual median, p75, p90 and p97.5 anchors.'
    },
    {
      type: 'historical_distribution_threshold',
      formula: 'Because no recognized global threshold exists, map the latest signed annual effect through prior annual median, p75, p90 and p97.5 anchors, with higher/less-negative values worse.'
    },
    {
      type: 'annual_weakening_momentum',
      formula: 'Subtract the preceding complete-year signed effect from the latest complete year and normalize through the prior annual-change distribution.'
    },
    {
      type: 'global_extent',
      formula: 'Assign full extent because the observations are NASA CERES source-native global means.'
    }
  ],
  source_ids: ['nasa_ceres_ebaf_toa_ed4_2_1_global_monthly'],
  uncertainty: `${snapshot.uncertainty} The score is a condition-and-trend index, not an attribution of the observed change to cloud feedback, aerosols or a particular cloud regime.`,
  freshness: `NASA CERES source available through ${snapshot.source_summary.latest_observation_period}; latest complete calendar year ${latest.year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `NASA CERES supplies ${snapshot.records.length} consecutive source-native global monthly observations and ${annual.length} complete calendar years, covering signed magnitude, historical threshold position, momentum and global extent.`,
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for cloud_albedo_shift.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_44_nasa_ceres_global_shortwave_cloud_radiative_effect',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'nasa_ceres_ebaf_toa_ed4_2_1_global_monthly',
  promoted_node_count: 1,
  receipts: [receipt]
};
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-44.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-44.json',
  receipt: {
    node_id: receipt.node_id,
    value: receipt.value,
    band: receipt.band,
    method: receipt.method,
    components: receipt.components
  }
}, null, 2));
