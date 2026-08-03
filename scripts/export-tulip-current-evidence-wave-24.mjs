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
const SNAPSHOT_PATH = 'public/copernicus-global-ocean-ph-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const observations = snapshot.observations;
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

const baseline = observations[0];
const latest = observations.at(-1);
const declines = observations.map(({ ph }) => baseline.ph - ph);
const annualChanges = observations.slice(1).map((point, index) => point.ph - observations[index].ph);
const magnitudeAnchors = strictAnchors(declines);
const thresholdAnchors = strictAnchors(observations.map(({ ph }) => -ph)).map(value => -value);
const momentumAnchors = strictAnchors(annualChanges.map(value => -value)).map(value => -value);
const latestChange = annualChanges.at(-1);

const receipt = buildTulipUrgencyReceipt({
  node_id: 'ocean_acidification',
  method: 'current_data',
  as_of: String(latest.year),
  components: {
    magnitude: round(normalizeWithAnchors(baseline.ph - latest.ph, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.ph, thresholdAnchors, 'lower_is_worse')),
    momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'lower_is_worse')),
    extent: 1
  },
  raw_inputs: {
    magnitude: {
      baseline_year: baseline.year,
      baseline_global_mean_surface_ph: baseline.ph,
      latest_year: latest.year,
      latest_global_mean_surface_ph: latest.ph,
      cumulative_ph_decline: round(baseline.ph - latest.ph),
      complete_annual_observations: observations.length,
      anchors_ph_decline: magnitudeAnchors.map(value => round(value))
    },
    threshold: {
      latest_global_mean_surface_ph: latest.ph,
      threshold_basis: 'historical_distribution_fallback',
      direction: 'lower_is_worse',
      anchors_ph: thresholdAnchors.map(value => round(value))
    },
    momentum: {
      latest_year_over_year_ph_change: round(latestChange),
      annual_change_observations: annualChanges.length,
      direction: 'lower_is_worse',
      anchors_ph_change: momentumAnchors.map(value => round(value))
    },
    extent: {
      geography: 'Global ocean',
      normalized_value: 1,
      definition: snapshot.measurement_boundary
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      product_id: snapshot.source.product_id,
      dataset_id: snapshot.source.dataset_id,
      native_file_sha256: snapshot.source.native_file_sha256,
      latest_uncertainty_standard_deviation: latest.uncertainty,
      excluded_from_scoring: snapshot.excluded_from_scoring
    }
  },
  transformations: [
    { type: 'global_area_averaged_series', formula: 'Retain the source annual global mean pH and source uncertainty; do not aggregate the regional trend map or combine the North American climatology.' },
    { type: 'historical_distribution_normalization', formula: 'Use all 40 complete annual observations to map cumulative decline and lower-is-worse current pH through median / p75 / p90 / p97.5 positions.' },
    { type: 'lower_is_worse_momentum', formula: 'Map the latest annual pH change against the complete 39-value annual-change distribution, reversing direction because a larger decline is worse.' }
  ],
  source_ids: ['copernicus_marine_global_ocean_ph'],
  uncertainty: snapshot.uncertainty,
  freshness: `Copernicus Marine annual global surface-ocean pH series through ${latest.year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `The source supplies ${observations.length} complete annual global observations, a current global magnitude, historical position, annual momentum and explicit global extent.`,
    higher_priority_failures: []
  }
});

const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`Receipt verification failed for ocean_acidification: ${verification.errors?.join('; ') || 'hash or score mismatch'}`);

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_24_copernicus_global_ocean_ph',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'copernicus_marine_global_ocean_ph',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-24.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-24.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
