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
const SNAPSHOT_PATH = 'public/ceds-coal-power-so2-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const annual = snapshot.observations.slice().sort((left, right) => left.year - right.year);
const latest = annual.at(-1);
const prior = annual.slice(0, -1);
const changes = annual.slice(1).map((record, index) => record.coal_power_so2_kt - annual[index].coal_power_so2_kt);
const magnitudeAnchors = historicalDistributionAnchors(prior.map(record => record.coal_power_so2_kt), 'annual');
const momentumAnchors = historicalDistributionAnchors(changes.slice(0, -1), 'annual');
if (!magnitudeAnchors || !momentumAnchors || annual.length < 20) {
  throw new Error('coal_power_sulfur_emissions historical-distribution gate failed.');
}

const round = value => Number(value.toFixed(6));
const latestChange = changes.at(-1);
const components = {
  magnitude: round(normalizeWithAnchors(latest.coal_power_so2_kt, magnitudeAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.coal_power_so2_kt, magnitudeAnchors, 'higher_is_worse')),
  momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
  extent: 1
};
const gate = {
  direct_components: ['magnitude', 'threshold', 'momentum', 'extent'],
  global_scope: true,
  current_observation: true
};
if (!qualifiesForCurrentData(gate)) throw new Error('coal_power_sulfur_emissions did not pass the current-data gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'coal_power_sulfur_emissions',
  method: 'current_data',
  as_of: String(latest.year),
  components,
  raw_inputs: {
    magnitude: {
      latest_year: latest.year,
      latest_global_coal_power_so2_kt: latest.coal_power_so2_kt,
      historical_distribution_anchors_kt_so2: magnitudeAnchors.map(round),
      direction: 'higher_is_worse'
    },
    threshold: {
      basis: 'historical_distribution_fallback_no_recognized_global_coal_power_so2_emission_threshold',
      anchors_kt_so2: magnitudeAnchors.map(round),
      complete_prior_annual_observations: prior.length
    },
    momentum: {
      prior_year: annual.at(-2).year,
      prior_global_coal_power_so2_kt: annual.at(-2).coal_power_so2_kt,
      latest_annual_change_kt_so2: round(latestChange),
      historical_change_anchors_kt_so2: momentumAnchors.map(round)
    },
    extent: {
      normalized_value: 1,
      geography: snapshot.metric_contract.geography,
      aggregation: snapshot.metric_contract.aggregation
    },
    coverage_gate: gate,
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      archive_md5: snapshot.source.archive_md5,
      archive_sha256: snapshot.source.archive_sha256,
      member_sha256: snapshot.source.member_sha256,
      annual_observations: annual.length
    }
  },
  transformations: [
    { type: 'contract_bound_fuel_sector_aggregation', formula: snapshot.metric_contract.aggregation },
    { type: 'historical_distribution_normalization', formula: 'Map the prior annual median, p75, p90 and p97.5 to 0, 0.33, 0.67 and 1 because no recognized global coal-power SO2 emission threshold exists.' },
    { type: 'annual_change_momentum', formula: 'Subtract the prior complete-year coal-power SO2 total and normalize the latest change against preceding complete annual changes.' },
    { type: 'global_extent', formula: 'Assign full extent because the selected rows are CEDS source-native global aggregates, not a country sample or extrapolation.' }
  ],
  source_ids: ['ceds_v2024_04_01_release_emission_data', 'mcduffie_ceds_sector_fuel_specific_inventory_2020'],
  uncertainty: snapshot.uncertainty,
  freshness: `Latest complete inventory year ${latest.year}; CEDS release ${snapshot.source.release_date}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `CEDS supplies ${annual.length} complete source-native global annual observations that isolate coal fuels within electricity generation, covering magnitude, historical position, momentum and global extent.`,
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('coal_power_sulfur_emissions receipt verification failed.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_51_ceds_global_coal_power_so2',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: snapshot.source.id,
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-current-evidence-wave-51.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-51.json',
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components }
}, null, 2));
