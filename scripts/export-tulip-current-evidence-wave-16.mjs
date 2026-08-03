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
const SNAPSHOT_PATH = 'public/noaa-climate-indices-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictMonthlyAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'monthly');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} monthly observations.`);
  const scale = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = scale * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function daysInMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function completeMonthlyIntensity(nodeId) {
  const records = snapshot.records
    .filter(record => record.node_id === nodeId && Number.isFinite(record.index_value))
    .sort((left, right) => left.observation_date.localeCompare(right.observation_date));
  if (!records.length) throw new Error(`No NOAA index records for ${nodeId}.`);
  const frequency = records[0].frequency;
  if (records.some(record => record.frequency !== frequency)) throw new Error(`${nodeId} mixes source frequencies.`);
  if (frequency === 'monthly') return records.map(record => ({
    month: record.observation_month,
    intensity: Math.abs(record.index_value),
    signed_value: record.index_value,
    source_record_count: 1,
    source_locator: record.source_locator,
    unit: record.unit,
    index_name: record.index_name
  }));

  const byMonth = new Map();
  for (const record of records) {
    const rows = byMonth.get(record.observation_month) ?? [];
    rows.push(record);
    byMonth.set(record.observation_month, rows);
  }
  return [...byMonth]
    .filter(([month, rows]) => rows.length === daysInMonth(month))
    .map(([month, rows]) => ({
      month,
      intensity: rows.reduce((sum, record) => sum + Math.abs(record.index_value), 0) / rows.length,
      signed_value: rows.reduce((sum, record) => sum + record.index_value, 0) / rows.length,
      source_record_count: rows.length,
      source_locator: rows.at(-1).source_locator,
      unit: rows[0].unit,
      index_name: rows[0].index_name
    }))
    .sort((left, right) => left.month.localeCompare(right.month));
}

function buildReceipt(nodeId) {
  const monthly = completeMonthlyIntensity(nodeId);
  if (monthly.length < 60) throw new Error(`${nodeId} has only ${monthly.length} complete monthly index-intensity observations.`);
  const intensities = monthly.map(point => point.intensity);
  const baseline = median(intensities);
  const magnitudeValues = intensities.map(value => value - baseline);
  const changes = intensities.slice(1).map((value, index) => value - intensities[index]);
  const magnitudeAnchors = strictMonthlyAnchors(magnitudeValues);
  const thresholdAnchors = strictMonthlyAnchors(intensities);
  const momentumAnchors = strictMonthlyAnchors(changes);
  const latest = monthly.at(-1);
  const latestChange = changes.at(-1);

  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'current_data',
    as_of: latest.month,
    components: {
      magnitude: round(normalizeWithAnchors(latest.intensity - baseline, magnitudeAnchors, 'higher_is_worse')),
      threshold: round(normalizeWithAnchors(latest.intensity, thresholdAnchors, 'higher_is_worse')),
      momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
      extent: 1
    },
    raw_inputs: {
      magnitude: {
        latest_complete_month: latest.month,
        latest_signed_monthly_index: round(latest.signed_value),
        latest_absolute_monthly_intensity: round(latest.intensity),
        full_history_median_absolute_intensity: round(baseline),
        complete_monthly_observations: monthly.length,
        anchors: magnitudeAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      threshold: {
        latest_absolute_monthly_intensity: round(latest.intensity),
        threshold_basis: 'historical_distribution_fallback',
        direction_review: 'Absolute phase intensity is higher-is-worse; neither positive nor negative phase is assigned urgency solely from its sign.',
        anchors: thresholdAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      momentum: {
        latest_month_over_month_absolute_intensity_change: round(latestChange),
        complete_monthly_change_observations: changes.length,
        anchors: momentumAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      extent: {
        normalized_value: 1,
        definition: 'The source-native index covers its full NOAA-defined spatial pattern or ocean-gradient domain; this is complete node-domain coverage and does not imply uniform worldwide impacts.',
        source_locator: latest.source_locator
      },
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        index_name: latest.index_name,
        source_frequency: snapshot.records.find(record => record.node_id === nodeId)?.frequency,
        latest_source_records_in_month: latest.source_record_count,
        complete_month_history_start: monthly[0].month,
        complete_month_history_end: latest.month
      }
    },
    transformations: [
      {
        type: 'phase_neutral_intensity',
        formula: 'Use the absolute source-native index value (published amplitude for ROMI/MJO) so both strong positive and strong negative phases represent intensity; retain the signed value as metadata.'
      },
      {
        type: 'complete_calendar_month_aggregation',
        formula: 'For daily indices, average absolute daily values only for months containing every calendar day; exclude partial months. Source-monthly indices remain source-native.'
      },
      {
        type: 'historical_distribution_normalization',
        formula: 'Map deviation from full-history median intensity, absolute intensity, and month-over-month intensity change through median / p75 / p90 / p97.5 anchors from complete monthly observations.'
      }
    ],
    source_ids: ['noaa_cpc_psl_climate_indices'],
    uncertainty: `${snapshot.uncertainty} Phase intensity does not by itself establish harmful downstream weather, exposure or loss; impacts depend on season, geography, persistence and interacting circulation states.`,
    freshness: `NOAA source-native index through latest complete retained month ${latest.month}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `NOAA supplies ${monthly.length} complete monthly observations of the exact node index. A reviewed phase-neutral direction resolves sign ambiguity, while magnitude, historical position, momentum and full node-domain coverage are all quantitative.`,
      higher_priority_failures: []
    }
  });
}

const nodeIds = [
  'pacific_decadal_oscillation',
  'pacific_north_american_pattern',
  'north_atlantic_oscillation',
  'arctic_oscillation',
  'indian_ocean_dipole',
  'madden_julian_oscillation',
  'southern_annular_mode',
  'quasi_biennial_oscillation',
  'atlantic_multidecadal_oscillation'
];
const receipts = nodeIds.map(buildReceipt);
for (const receipt of receipts) {
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`Receipt verification failed for ${receipt.node_id}.`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_16_noaa_phase_neutral_climate_indices',
  generated_at: new Date().toISOString(),
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-16.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-16.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }))
}, null, 2));
