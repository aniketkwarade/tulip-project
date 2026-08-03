import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildTulipUrgencyReceipt,
  normalizeWithAnchors,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/noaa-marine-heatwave-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const retained = snapshot.records.find(record => record.treatment === 'long_term_sst_trend_retained');
const detrended = snapshot.records.find(record => record.treatment === 'linear_1991_2020_sst_trend_removed');
if (!retained || !detrended) throw new Error('Both retained-trend and detrended NOAA marine-heatwave records are required.');

const observationYear = Number(retained.observation_period.match(/\b(\d{4})\b/)?.[1]);
const rankingYears = observationYear - retained.ranking_start_year + 1;
if (!Number.isInteger(rankingYears) || rankingYears < 20) throw new Error('Marine-heatwave historical-rank gate failed.');
const empiricalPercentile = 1 - (retained.historical_rank - 1) / (rankingYears - 1);
const distributionAnchors = [0.5, 0.75, 0.9, 0.975];
const historicalPosition = normalizeWithAnchors(empiricalPercentile, distributionAnchors, 'higher_is_worse');
const trendContributionShare = Math.max(0, Math.min(1, (retained.value - detrended.value) / retained.value));
const extentShare = retained.value / 100;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'marine_heatwaves',
  method: 'current_data',
  as_of: retained.observation_period,
  components: {
    magnitude: Number(historicalPosition.toFixed(6)),
    threshold: Number(historicalPosition.toFixed(6)),
    momentum: Number(trendContributionShare.toFixed(6)),
    extent: Number(extentShare.toFixed(6))
  },
  raw_inputs: {
    magnitude: {
      current_global_ocean_area_coverage_pct: retained.value,
      historical_rank: retained.historical_rank,
      ranking_start_year: retained.ranking_start_year,
      ranking_end_year: observationYear,
      complete_same_month_ranking_years: rankingYears,
      empirical_percentile: Number(empiricalPercentile.toFixed(6)),
      percentile_anchors: distributionAnchors,
      source_locator: retained.source_locator
    },
    threshold: {
      basis: 'historical_distribution_fallback_from_source_reported_rank',
      empirical_percentile: Number(empiricalPercentile.toFixed(6)),
      percentile_anchors: distributionAnchors,
      source_locator: retained.source_locator
    },
    momentum: {
      role: 'quantitative_accumulated_warming_fill_not_recent_acceleration',
      trend_retained_global_ocean_area_pct: retained.value,
      detrended_global_ocean_area_pct: detrended.value,
      trend_contribution_percentage_points: retained.value - detrended.value,
      trend_contribution_share_of_current_coverage: Number(trendContributionShare.toFixed(6)),
      source_locator: detrended.source_locator
    },
    extent: {
      global_ocean_area_coverage_pct: retained.value,
      normalized_global_ocean_area_share: Number(extentShare.toFixed(6)),
      source_locator: retained.source_locator
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      record_count: snapshot.record_count
    }
  },
  transformations: [
    {
      type: 'rank_to_empirical_percentile',
      formula: '1 - (historical rank - 1) / (complete same-month ranking years - 1), where rank 1 is highest coverage'
    },
    {
      type: 'historical_percentile_normalization',
      formula: 'Map empirical percentile through median / p75 / p90 / p97.5 probability anchors'
    },
    {
      type: 'quantitative_impact_fill_for_momentum_weight',
      formula: '(trend-retained coverage - detrended coverage) / trend-retained coverage; not relabelled as recent acceleration'
    },
    {
      type: 'global_ocean_extent',
      formula: 'source-reported percent of global ocean area divided by 100'
    }
  ],
  source_ids: ['noaa_marine_heatwaves'],
  uncertainty: snapshot.uncertainty,
  freshness: `Monthly NOAA status for ${retained.observation_period}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'Current global-ocean coverage and its source-reported historical rank directly supply 60% of component weight; the paired detrended estimate and global-ocean area fill the remaining weights quantitatively.',
    higher_priority_failures: []
  }
});

const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error('Receipt verification failed for marine_heatwaves.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_4_noaa_global_marine_heatwave_status',
  generated_at: new Date().toISOString(),
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-4.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-4.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
