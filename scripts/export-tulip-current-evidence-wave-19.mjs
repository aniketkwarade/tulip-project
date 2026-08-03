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
const SNAPSHOT_PATH = 'public/nasa-ozone-watch-annual-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const records = snapshot.records.slice().sort((left, right) => left.observation_year - right.observation_year);
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const scale = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = scale * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

if (records.length < 20) throw new Error(`stratospheric_chlorine_sinks has only ${records.length} complete annual observations.`);
const reference = records[0];
const latest = records.at(-1);
const declines = records.map(record => reference.minimum_mean_ozone_du_sep21_oct16 - record.minimum_mean_ozone_du_sep21_oct16);
const annualizedChanges = records.slice(1).map((record, index) => {
  const previous = records[index];
  return (record.minimum_mean_ozone_du_sep21_oct16 - previous.minimum_mean_ozone_du_sep21_oct16) / (record.observation_year - previous.observation_year);
});
if (annualizedChanges.length < 20) throw new Error('Insufficient annualized ozone-column changes.');
const magnitudeAnchors = strictAnchors(declines);
const negativeOzoneAnchors = strictAnchors(records.map(record => -record.minimum_mean_ozone_du_sep21_oct16));
const ozoneAnchorsLowerIsWorse = negativeOzoneAnchors.map(value => -value);
const negativeMomentumAnchors = strictAnchors(annualizedChanges.map(value => -value));
const momentumAnchorsLowerIsWorse = negativeMomentumAnchors.map(value => -value);
const latestAnnualizedChange = annualizedChanges.at(-1);
const maximumHoleArea = Math.max(...records.map(record => record.mean_ozone_hole_area_million_km2_sep07_oct13));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'stratospheric_chlorine_sinks',
  method: 'current_data',
  as_of: String(latest.observation_year),
  components: {
    magnitude: round(normalizeWithAnchors(reference.minimum_mean_ozone_du_sep21_oct16 - latest.minimum_mean_ozone_du_sep21_oct16, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.minimum_mean_ozone_du_sep21_oct16, ozoneAnchorsLowerIsWorse, 'lower_is_worse')),
    momentum: round(normalizeWithAnchors(latestAnnualizedChange, momentumAnchorsLowerIsWorse, 'lower_is_worse')),
    extent: round(latest.mean_ozone_hole_area_million_km2_sep07_oct13 / maximumHoleArea)
  },
  raw_inputs: {
    magnitude: {
      latest_minimum_mean_ozone_du: latest.minimum_mean_ozone_du_sep21_oct16,
      reference_year: reference.observation_year,
      reference_minimum_mean_ozone_du: reference.minimum_mean_ozone_du_sep21_oct16,
      decline_against_reference_du: round(reference.minimum_mean_ozone_du_sep21_oct16 - latest.minimum_mean_ozone_du_sep21_oct16),
      complete_annual_observations: records.length,
      anchors_decline_du: magnitudeAnchors.map(value => round(value)),
      source_locator: latest.source_locator
    },
    threshold: {
      latest_minimum_mean_ozone_du: latest.minimum_mean_ozone_du_sep21_oct16,
      recognized_ozone_hole_threshold_du: latest.ozone_hole_threshold_du,
      latest_deficit_against_threshold_du: latest.ozone_deficit_against_threshold_du,
      threshold_basis: 'historical_distribution_fallback_with_lower_values_worse',
      anchors_du_lower_is_worse: ozoneAnchorsLowerIsWorse.map(value => round(value)),
      source_locator: latest.source_locator
    },
    momentum: {
      latest_annualized_ozone_change_du_per_year: round(latestAnnualizedChange),
      annualized_change_observations: annualizedChanges.length,
      anchors_du_per_year_lower_is_worse: momentumAnchorsLowerIsWorse.map(value => round(value)),
      missing_year_handling: 'Changes spanning the missing 1995 record are divided by elapsed years; no 1995 value is imputed.',
      source_locator: latest.source_locator
    },
    extent: {
      latest_mean_ozone_hole_area_million_km2: latest.mean_ozone_hole_area_million_km2_sep07_oct13,
      maximum_observed_mean_ozone_hole_area_million_km2: maximumHoleArea,
      normalized_value: round(latest.mean_ozone_hole_area_million_km2_sep07_oct13 / maximumHoleArea),
      geography_boundary: latest.geography,
      source_locator: latest.source_locator
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      source_last_modified: snapshot.source?.source_last_modified,
      retained_history_start: reference.observation_year,
      retained_history_end: latest.observation_year,
      retained_history_record_count: records.length
    }
  },
  transformations: [
    {
      type: 'fixed_window_antarctic_indicator',
      formula: 'Retain NASA mean ozone-hole area for 7 September-13 October and minimum mean ozone for 21 September-16 October as separate annual quantities.'
    },
    {
      type: 'reverse_direction_historical_normalization',
      formula: 'Lower ozone is worse: map the latest Dobson Unit value and annual change through reversed median / p75 / p90 / p97.5 historical anchors.'
    },
    {
      type: 'missing_year_preserving_momentum',
      formula: 'Annualize changes by elapsed years across the declared 1995 gap without interpolation or zero fill.'
    }
  ],
  source_ids: ['nasa_ozone_watch'],
  uncertainty: snapshot.uncertainty,
  freshness: `NASA finalized annual history through ${latest.observation_year}; source last modified ${snapshot.source?.source_last_modified}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `NASA supplies ${records.length} complete annual Antarctic ozone-hole observations, a recognized 220-DU depletion threshold, reverse-direction magnitude and momentum, and measured spatial extent.`,
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for stratospheric_chlorine_sinks.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_19_nasa_ozone_watch',
  generated_at: new Date().toISOString(),
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-19.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-19.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
