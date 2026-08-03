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
const SNAPSHOT_PATH = 'public/nsidc-sea-ice-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictHigherAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function strictLowerAnchors(values) {
  return strictHigherAnchors(values.map(value => -value)).map(value => -value);
}

const records = snapshot.records
  .filter(record => Number.isFinite(record.monthly_mean_extent_million_km2))
  .sort((left, right) => left.year - right.year);
if (records.length < 20) throw new Error(`Only ${records.length} complete annual NSIDC September observations are available.`);
const climatology = records.filter(record => record.year >= 1981 && record.year <= 2010);
if (climatology.length !== 30) throw new Error(`Expected 30 years in the 1981–2010 climatology; found ${climatology.length}.`);
const baseline = climatology.reduce((sum, record) => sum + record.monthly_mean_extent_million_km2, 0) / climatology.length;
const values = records.map(record => record.monthly_mean_extent_million_km2);
const deficits = values.map(value => baseline - value);
const changes = values.slice(1).map((value, index) => value - values[index]);
const magnitudeAnchors = strictHigherAnchors(deficits);
const thresholdAnchors = strictLowerAnchors(values);
const momentumAnchors = strictLowerAnchors(changes);
const latest = records.at(-1);
const latestChange = changes.at(-1);
const lostExtentFraction = Math.max(0, Math.min(1, (baseline - latest.monthly_mean_extent_million_km2) / baseline));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'sea_ice_season_loss',
  method: 'current_data',
  as_of: String(latest.year),
  components: {
    magnitude: round(normalizeWithAnchors(baseline - latest.monthly_mean_extent_million_km2, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.monthly_mean_extent_million_km2, thresholdAnchors, 'lower_is_worse')),
    momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'lower_is_worse')),
    extent: round(lostExtentFraction)
  },
  raw_inputs: {
    magnitude: {
      latest_september_extent_million_km2: round(latest.monthly_mean_extent_million_km2),
      baseline_1981_2010_mean_extent_million_km2: round(baseline),
      extent_deficit_million_km2: round(baseline - latest.monthly_mean_extent_million_km2),
      complete_annual_observations: records.length,
      anchors: magnitudeAnchors.map(value => round(value)),
      source_locator: latest.source_locator
    },
    threshold: {
      latest_september_extent_million_km2: round(latest.monthly_mean_extent_million_km2),
      threshold_basis: 'historical_distribution_fallback_lower_is_worse',
      anchors: thresholdAnchors.map(value => round(value)),
      source_locator: latest.source_locator
    },
    momentum: {
      latest_year_over_year_extent_change_million_km2: round(latestChange),
      annual_change_observations: changes.length,
      anchors: momentumAnchors.map(value => round(value)),
      source_locator: latest.source_locator
    },
    extent: {
      fraction_of_1981_2010_september_extent_lost: round(lostExtentFraction),
      normalized_value: round(lostExtentFraction),
      formula: '(1981–2010 mean September extent - latest September extent) / 1981–2010 mean September extent',
      source_locator: latest.source_locator
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      updated_at: snapshot.updated_at,
      measurement_boundary: snapshot.measurement_boundary,
      source_history_start: records[0].year,
      source_history_end: latest.year
    }
  },
  transformations: [
    {
      type: 'fixed_climatology_extent_deficit',
      formula: 'Latest NOAA/NSIDC Northern Hemisphere September monthly mean sea-ice extent subtracted from the complete 1981–2010 source mean.'
    },
    {
      type: 'historical_distribution_normalization_lower_is_worse',
      formula: 'Map annual September extent through median / p25 / p10 / p2.5 anchors; map extent deficit and annual loss through the corresponding worse-direction distributions.'
    }
  ],
  source_ids: ['national_snow_and_ice_data_center'],
  uncertainty: `${snapshot.uncertainty} September monthly mean extent is a bounded pan-Arctic retreat indicator; it is not a direct observation of season length, ice thickness, ice age or local-sector retreat.`,
  freshness: `NOAA/NSIDC Sea Ice Index Version 4 September record through ${latest.year}; snapshot refreshed ${snapshot.updated_at}.`,
  selection_reason: {
    selected_method_passed: `NOAA/NSIDC supplies ${records.length} consistent annual pan-Arctic September extent observations, a complete fixed climatology, current deficit, lower-tail position, momentum and quantified fraction of reference extent lost.`,
    higher_priority_failures: []
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for sea_ice_season_loss.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_10_nsidc_september_extent',
  generated_at: new Date().toISOString(),
  promoted_node_count: 1,
  receipts: [receipt]
};
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-10.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-10.json',
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
