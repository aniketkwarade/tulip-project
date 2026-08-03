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
const SNAPSHOT_PATH = 'public/gwis-wildfire-regime-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

const records = (snapshot.global_time_series ?? [])
  .filter(record => Number.isFinite(record.non_cropland_burned_area_ha))
  .sort((left, right) => left.observation_year - right.observation_year);
if (records.length < 20) throw new Error(`Only ${records.length} complete GWIS global annual observations are available.`);
const baselineRecords = records.filter(record => record.observation_year >= 2003 && record.observation_year <= 2022);
if (baselineRecords.length !== 20) throw new Error(`Expected 20 years in the fixed 2003–2022 GWIS baseline; found ${baselineRecords.length}.`);
const baseline = baselineRecords.reduce((sum, record) => sum + record.non_cropland_burned_area_ha, 0) / baselineRecords.length;
const values = records.map(record => record.non_cropland_burned_area_ha);
const anomalies = values.map(value => value - baseline);
const changes = values.slice(1).map((value, index) => value - values[index]);
const magnitudeAnchors = strictAnchors(anomalies);
const thresholdAnchors = strictAnchors(values);
const momentumAnchors = strictAnchors(changes);
const latest = records.at(-1);
const latestChange = changes.at(-1);
const maximumCountries = Math.max(...records.map(record => record.countries_or_territories_reporting));
const extent = latest.countries_or_territories_reporting / maximumCountries;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'wildfire_regime_shift',
  method: 'current_data',
  as_of: String(latest.observation_year),
  components: {
    magnitude: round(normalizeWithAnchors(latest.non_cropland_burned_area_ha - baseline, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.non_cropland_burned_area_ha, thresholdAnchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
    extent: round(extent)
  },
  raw_inputs: {
    magnitude: {
      latest_global_non_cropland_burned_area_ha: round(latest.non_cropland_burned_area_ha, 2),
      baseline_2003_2022_mean_ha: round(baseline, 2),
      latest_anomaly_ha: round(latest.non_cropland_burned_area_ha - baseline, 2),
      complete_annual_observations: records.length,
      anchors: magnitudeAnchors.map(value => round(value, 2)),
      source_locator: latest.source_locator
    },
    threshold: {
      latest_global_non_cropland_burned_area_ha: round(latest.non_cropland_burned_area_ha, 2),
      threshold_basis: 'historical_distribution_fallback',
      anchors: thresholdAnchors.map(value => round(value, 2)),
      source_locator: latest.source_locator
    },
    momentum: {
      latest_year_over_year_change_ha: round(latestChange, 2),
      annual_change_observations: changes.length,
      anchors: momentumAnchors.map(value => round(value, 2)),
      source_locator: latest.source_locator
    },
    extent: {
      latest_countries_or_territories_reporting: latest.countries_or_territories_reporting,
      maximum_countries_or_territories_reporting: maximumCountries,
      normalized_value: round(extent),
      definition: 'Latest source geography coverage divided by the maximum geography coverage in the complete retained global history.',
      source_locator: latest.source_locator
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      source_rows_parsed: snapshot.source_rows_parsed,
      source_history_start: records[0].observation_year,
      source_history_end: latest.observation_year,
      excluded_source_partitions: snapshot.excluded_source_partitions
    }
  },
  transformations: [
    {
      type: 'global_non_cropland_burned_area_sum',
      formula: 'Sum source MCD64A1 forest, savanna, shrubland/grassland and other burned-area hectares across all GWIS GADM level 1 rows; retain cropland separately and exclude it from the urgency series.'
    },
    {
      type: 'fixed_baseline_anomaly',
      formula: 'Subtract the complete 2003–2022 global mean from each annual global non-cropland burned-area total.'
    },
    {
      type: 'historical_distribution_normalization',
      formula: 'Map annual anomaly, current area and annual change through median / p75 / p90 / p97.5 anchors from the complete 2002–2023 source history.'
    }
  ],
  source_ids: ['ec_jrc_global_wildfire_information_system_mcd64a1_burned_area'],
  uncertainty: `${snapshot.uncertainty} ${snapshot.boundary} A global season-span statistic is intentionally excluded because overlapping Northern and Southern Hemisphere fire seasons would make it physically ambiguous.`,
  freshness: `Official GWIS MCD64A1 complete-year archive through ${latest.observation_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `GWIS supplies ${records.length} complete annual globally aggregated non-cropland burned-area observations, a fixed 20-year baseline, current magnitude, historical position, momentum and explicit country/territory coverage.`,
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for wildfire_regime_shift.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_13_gwis_global_burned_area',
  generated_at: new Date().toISOString(),
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-13.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-13.json',
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
