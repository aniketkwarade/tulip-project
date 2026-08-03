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
const odgi = snapshot.benchmarks?.odgi;
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

if (!odgi) throw new Error('NOAA GML snapshot does not contain the ODGI benchmark.');
const antarcticByYear = new Map(odgi.annual_antarctic.map(record => [record.year, record]));
const records = odgi.annual_midlatitude
  .filter(record => antarcticByYear.has(record.year))
  .map(midlatitude => {
    const antarctic = antarcticByYear.get(midlatitude.year);
    return {
      year: midlatitude.year,
      midlatitude_odgi: midlatitude.odgi,
      antarctic_odgi: antarctic.odgi,
      midlatitude_eesc_ppt: midlatitude.eesc_ppt,
      antarctic_eesc_ppt: antarctic.eesc_ppt,
      mean_odgi: (midlatitude.odgi + antarctic.odgi) / 2,
      maximum_odgi: Math.max(midlatitude.odgi, antarctic.odgi)
    };
  })
  .sort((left, right) => left.year - right.year);

if (records.length < 20) throw new Error(`Only ${records.length} complete paired NOAA ODGI annual observations are available.`);
const changes = records.slice(1).map((record, index) => record.mean_odgi - records[index].mean_odgi);
const momentumAnchors = strictAnchors(changes);
const latest = records.at(-1);
const latestChange = changes.at(-1);
const magnitude = latest.mean_odgi / 100;
const threshold = latest.maximum_odgi / 100;
const momentum = normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'cfc_saturated_layers',
  method: 'current_data',
  as_of: String(latest.year),
  components: {
    magnitude: round(magnitude),
    threshold: round(threshold),
    momentum: round(momentum),
    extent: 1
  },
  raw_inputs: {
    magnitude: {
      latest_midlatitude_odgi: latest.midlatitude_odgi,
      latest_antarctic_odgi: latest.antarctic_odgi,
      equal_domain_mean_odgi: round(latest.mean_odgi),
      normalized_value: round(magnitude),
      formula: 'mean(ODGI-ML, ODGI-A) / 100',
      source_scale: 'NOAA defines 0 as the 1980 EESC recovery benchmark and 100 as peak EESC.',
      complete_paired_annual_observations: records.length,
      source_locator: odgi.url
    },
    threshold: {
      most_stressed_domain: latest.antarctic_odgi >= latest.midlatitude_odgi ? 'antarctic' : 'midlatitude',
      maximum_current_domain_odgi: latest.maximum_odgi,
      normalized_value: round(threshold),
      formula: 'max(ODGI-ML, ODGI-A) / 100',
      threshold_basis: 'source_defined_peak_to_1980_recovery_scale',
      source_locator: odgi.url
    },
    momentum: {
      latest_annual_change_in_equal_domain_mean_odgi: round(latestChange),
      annual_change_observations: changes.length,
      anchors: momentumAnchors.map(value => round(value)),
      direction: 'higher_or_less_negative_is_worse',
      source_locator: odgi.url
    },
    extent: {
      geography: 'global lower atmosphere with Antarctic and both-hemisphere mid-latitude stratospheric burden estimates',
      normalized_value: 1,
      definition: 'NOAA derives hemispheric and global surface means from remote sites; the lower atmosphere is well mixed, and the source provides ODGI for the two distinct primary stratospheric regions while stating that Arctic ODGI is expected to lie between them.',
      source_locator: odgi.url
    },
    latest_eesc_ppt: {
      midlatitude: latest.midlatitude_eesc_ppt,
      antarctic: latest.antarctic_eesc_ppt
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      updated_at: snapshot.updated_at,
      release_cycle: odgi.release_cycle,
      source_history_start: records[0].year,
      source_history_end: latest.year,
      antarctic_csv_url: odgi.antarctic_csv_url,
      midlatitude_csv_url: odgi.midlatitude_csv_url
    }
  },
  transformations: [
    {
      type: 'source_defined_odgi_normalization',
      formula: 'Retain NOAA ODGI, already normalized from zero at the 1980 EESC benchmark to 100 at peak EESC; average the two published domains for magnitude and retain the worse domain for threshold proximity.'
    },
    {
      type: 'historical_distribution_momentum_normalization',
      formula: 'Map annual change in the paired-domain mean ODGI through median / p75 / p90 / p97.5 anchors from the complete 1992–2024 series; larger or less-negative changes are worse.'
    }
  ],
  source_ids: ['noaa_global_monitoring_laboratory'],
  uncertainty: 'EESC is inferred from measured global mean lower-tropospheric abundances using region-specific transport, mixing, fractional-release and bromine-efficiency assumptions. NOAA notes that a newer EESC formulation would indicate less mid-latitude recovery and that ODGI excludes short-lived halogenated substances not controlled by the Montreal Protocol.',
  freshness: `Annual NOAA ODGI/EESC history through ${latest.year}; benchmark snapshot refreshed ${snapshot.updated_at}.`,
  selection_reason: {
    selected_method_passed: `NOAA supplies ${records.length} complete paired annual observations of the node's exact ozone-depleting-substance burden metric, a source-defined recovery/peak scale, current EESC and ODGI for two stratospheric domains, annual momentum, and global-mean observational coverage.`,
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for cfc_saturated_layers.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_11_noaa_odgi_eesc_burden',
  generated_at: new Date().toISOString(),
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-11.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-11.json',
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
