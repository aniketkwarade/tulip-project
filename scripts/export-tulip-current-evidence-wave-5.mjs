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
const SNAPSHOT_PATH = 'public/noaa-ibtracs-rapid-intensification-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

const bySeason = new Map();
for (const record of snapshot.records) {
  const group = bySeason.get(record.season) ?? [];
  group.push(record);
  bySeason.set(record.season, group);
}
const annual = [...bySeason.entries()].map(([year, records]) => {
  const rapid = records.filter(record => record.rapid_intensification_observed);
  const observedBasins = new Set(records.map(record => record.basin).filter(Boolean));
  const rapidBasins = new Set(rapid.map(record => record.basin).filter(Boolean));
  return {
    year,
    total_storms: records.length,
    rapid_storms: rapid.length,
    rapid_share_pct: rapid.length / records.length * 100,
    observed_basins: observedBasins.size,
    rapid_basins: rapidBasins.size
  };
}).sort((left, right) => left.year - right.year);
if (annual.length < 20) throw new Error(`Only ${annual.length} complete annual IBTrACS aggregates are available.`);

const reference = annual[0].rapid_share_pct;
const shares = annual.map(point => point.rapid_share_pct);
const magnitudeAnchors = strictAnchors(shares.map(value => value - reference));
const thresholdAnchors = strictAnchors(shares);
const annualChanges = annual.slice(1).map((point, index) => point.rapid_share_pct - annual[index].rapid_share_pct);
const momentumAnchors = strictAnchors(annualChanges);
const latest = annual.at(-1);
const latestChange = annualChanges.at(-1);
const extent = latest.observed_basins > 0 ? latest.rapid_basins / latest.observed_basins : 0;
const sourceLocator = snapshot.records.find(record => record.season === latest.year)?.source_locator;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'tropical_cyclone_rapid_intensification',
  method: 'current_data',
  as_of: String(latest.year),
  components: {
    magnitude: round(normalizeWithAnchors(latest.rapid_share_pct - reference, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.rapid_share_pct, thresholdAnchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
    extent: round(extent)
  },
  raw_inputs: {
    magnitude: {
      latest_rapid_intensification_storm_share_pct: round(latest.rapid_share_pct),
      reference_year: annual[0].year,
      reference_rapid_intensification_storm_share_pct: round(reference),
      value_against_reference_percentage_points: round(latest.rapid_share_pct - reference),
      complete_annual_observations: annual.length,
      anchors: magnitudeAnchors.map(value => round(value)),
      source_locator: sourceLocator
    },
    threshold: {
      latest_rapid_intensification_storm_share_pct: round(latest.rapid_share_pct),
      threshold_basis: 'historical_distribution_fallback',
      anchors: thresholdAnchors.map(value => round(value)),
      source_locator: sourceLocator
    },
    momentum: {
      latest_year_over_year_change_percentage_points: round(latestChange),
      annual_change_observations: annualChanges.length,
      anchors: momentumAnchors.map(value => round(value)),
      source_locator: sourceLocator
    },
    extent: {
      latest_basins_with_rapid_intensification: latest.rapid_basins,
      latest_basins_with_valid_storm_observations: latest.observed_basins,
      normalized_value: round(extent),
      source_locator: sourceLocator
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      storm_records: snapshot.record_count,
      annual_panel_start: annual[0].year,
      annual_panel_end: latest.year
    }
  },
  transformations: [
    {
      type: 'annual_global_storm_prevalence',
      formula: 'storms with at least one exact 24-hour USA_WIND increase of 30 knots or more divided by storms with valid exact 24-hour pairs'
    },
    {
      type: 'historical_distribution_normalization',
      formula: 'Map annual global prevalence and its change through median / p75 / p90 / p97.5 anchors'
    },
    {
      type: 'global_basin_extent',
      formula: 'basins with at least one rapid-intensification storm divided by basins with valid storm observations in the latest season'
    }
  ],
  source_ids: ['noaa_ibtracs'],
  uncertainty: snapshot.uncertainty,
  freshness: `NOAA IBTrACS since-1980 archive through season ${latest.year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `The official NOAA archive supplies ${annual.length} complete annual global storm aggregates, an operational 30-knot threshold, annual prevalence, momentum, and basin extent.`,
    higher_priority_failures: []
  }
});

const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error('Receipt verification failed for tropical_cyclone_rapid_intensification.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_5_noaa_ibtracs_since_1980',
  generated_at: new Date().toISOString(),
  promoted_node_count: 1,
  receipts: [receipt]
};
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-5.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-5.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
