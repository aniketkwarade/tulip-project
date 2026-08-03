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
const SNAPSHOT_PATH = 'public/noaa-gml-benchmarks.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const annual = snapshot.benchmarks?.aggi?.annual_radiative_forcing ?? [];
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

if (annual.length < 20) throw new Error(`Only ${annual.length} complete NOAA AGGI annual observations are available.`);
const points = annual.map(record => ({
  year: record.year,
  value: record.effective_radiative_forcing_w_m2.total,
  aggi: record.aggi_1990_equals_1,
  record
})).sort((left, right) => left.year - right.year);
const reference = points[0].value;
const values = points.map(point => point.value);
const magnitudeValues = values.map(value => value - reference);
const changes = points.slice(1).map((point, index) => point.value - points[index].value);
const magnitudeAnchors = strictAnchors(magnitudeValues);
const thresholdAnchors = strictAnchors(values);
const momentumAnchors = strictAnchors(changes);
const latest = points.at(-1);
const latestChange = changes.at(-1);
const sourceUrl = snapshot.benchmarks.aggi.url;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'solar_radiation_trapping',
  method: 'current_data',
  as_of: String(latest.year),
  components: {
    magnitude: round(normalizeWithAnchors(latest.value - reference, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.value, thresholdAnchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
    extent: 1
  },
  raw_inputs: {
    magnitude: {
      latest_total_effective_radiative_forcing_w_m2: round(latest.value),
      reference_year: points[0].year,
      reference_total_effective_radiative_forcing_w_m2: round(reference),
      increase_against_reference_w_m2: round(latest.value - reference),
      complete_annual_observations: points.length,
      anchors: magnitudeAnchors.map(value => round(value)),
      source_locator: sourceUrl
    },
    threshold: {
      latest_total_effective_radiative_forcing_w_m2: round(latest.value),
      latest_aggi_1990_equals_1: round(latest.aggi),
      threshold_basis: 'historical_distribution_fallback',
      anchors: thresholdAnchors.map(value => round(value)),
      source_locator: sourceUrl
    },
    momentum: {
      latest_year_over_year_forcing_change_w_m2: round(latestChange),
      annual_change_observations: changes.length,
      anchors: momentumAnchors.map(value => round(value)),
      source_locator: sourceUrl
    },
    extent: {
      geography: 'global atmosphere',
      normalized_value: 1,
      definition: 'NOAA derives the annual total from global atmospheric abundance averages measured by its remote-site reference network.',
      source_locator: sourceUrl
    },
    latest_gas_components_w_m2: latest.record.effective_radiative_forcing_w_m2,
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      updated_at: snapshot.updated_at,
      annual_panel_start: points[0].year,
      annual_panel_end: latest.year
    }
  },
  transformations: [
    {
      type: 'source_reported_global_effective_radiative_forcing',
      formula: 'Retain NOAA AGGI Table 2 total long-lived-greenhouse-gas effective radiative forcing and gas contributions in W m−2 relative to the source preindustrial baseline.'
    },
    {
      type: 'historical_distribution_normalization',
      formula: 'Map the total forcing, its increase from 1979 and its annual change through median / p75 / p90 / p97.5 anchors from the complete 1979–2024 series.'
    }
  ],
  source_ids: ['noaa_global_monitoring_laboratory'],
  uncertainty: 'NOAA reports roughly 10% uncertainty for the radiative-forcing expressions and less than 1% abundance-measurement uncertainty for the most abundant gases. The AGGI excludes spatially heterogeneous short-lived forcing agents and slower surface-temperature feedbacks.',
  freshness: `Annual NOAA AGGI history through ${latest.year}; benchmark snapshot refreshed ${snapshot.updated_at}.`,
  selection_reason: {
    selected_method_passed: `NOAA supplies ${points.length} complete annual global observations of the node's exact effective-radiative-forcing metric, including current magnitude, historical position, annual momentum and global observing-network scope.`,
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for solar_radiation_trapping.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_7_noaa_aggi_global_history',
  generated_at: new Date().toISOString(),
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-7.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-7.json',
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
