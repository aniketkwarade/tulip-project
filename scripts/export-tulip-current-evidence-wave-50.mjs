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
const SNAPSHOT_PATH = 'public/faostat-cattle-stocking-density-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const annual = snapshot.records.slice().sort((left, right) => left.year - right.year);
const latest = annual.at(-1);
const prior = annual.slice(0, -1);
const changes = annual.slice(1).map((record, index) => record.cattle_per_permanent_meadow_pasture_ha - annual[index].cattle_per_permanent_meadow_pasture_ha);
const magnitudeAnchors = historicalDistributionAnchors(prior.map(record => record.cattle_per_permanent_meadow_pasture_ha), 'annual');
const momentumAnchors = historicalDistributionAnchors(changes.slice(0, -1), 'annual');
if (annual.length < 20 || !magnitudeAnchors || !momentumAnchors) throw new Error('FAOSTAT stocking-density historical-distribution gate failed.');
const round = value => Number(value.toFixed(6));
const latestChange = changes.at(-1);
const components = {
  magnitude: round(normalizeWithAnchors(latest.cattle_per_permanent_meadow_pasture_ha, magnitudeAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.cattle_per_permanent_meadow_pasture_ha, magnitudeAnchors, 'higher_is_worse')),
  momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
  extent: 1
};
const gate = { direct_components: ['magnitude', 'threshold', 'momentum', 'extent'], global_scope: true, current_observation: true };
if (!qualifiesForCurrentData(gate)) throw new Error('cattle_stocking_density did not pass the current-data gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'cattle_stocking_density',
  method: 'current_data',
  as_of: String(latest.year),
  components,
  raw_inputs: {
    magnitude: {
      latest_year: latest.year,
      latest_cattle_head: latest.cattle_head,
      latest_permanent_meadows_and_pastures_thousand_ha: latest.permanent_meadows_and_pastures_thousand_ha,
      latest_cattle_per_permanent_meadow_pasture_ha: latest.cattle_per_permanent_meadow_pasture_ha,
      historical_distribution_anchors_cattle_per_ha: magnitudeAnchors.map(round),
      direction: 'higher_is_worse'
    },
    threshold: {
      basis: 'historical_distribution_fallback_no_recognized_global_cattle_permanent_pasture_density_threshold',
      anchors_cattle_per_ha: magnitudeAnchors.map(round),
      complete_prior_annual_observations: prior.length
    },
    momentum: {
      prior_year: annual.at(-2).year,
      prior_cattle_per_permanent_meadow_pasture_ha: annual.at(-2).cattle_per_permanent_meadow_pasture_ha,
      latest_annual_change_cattle_per_ha: round(latestChange),
      historical_change_anchors_cattle_per_ha: momentumAnchors.map(round)
    },
    extent: { normalized_value: 1, geography: 'World', aggregation: snapshot.metric_contract.aggregation },
    coverage_gate: gate,
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, land_use_archive_sha256: snapshot.source.land_use_archive_sha256, annual_observations: annual.length }
  },
  transformations: [
    { type: 'same_year_world_density_join', formula: 'Divide source-native FAOSTAT World cattle head by source-native World permanent-meadow-and-pasture area converted from thousand hectares to hectares.' },
    { type: 'historical_distribution_normalization', formula: 'Map prior annual median, p75, p90 and p97.5 to 0, 0.33, 0.67 and 1 because no recognized global cattle-permanent-pasture density threshold exists.' },
    { type: 'annual_change_momentum', formula: 'Subtract the prior complete-year density and normalize the latest change against preceding complete annual changes.' },
    { type: 'global_extent', formula: 'Assign full extent because both numerator and denominator are source-native FAOSTAT World aggregates.' }
  ],
  source_ids: ['faostat_land_use_and_livestock_stock_density'],
  uncertainty: snapshot.uncertainty,
  freshness: `Latest complete joined year ${latest.year}; FAOSTAT land-use release ${snapshot.source.land_use_release_date}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `FAOSTAT supplies ${annual.length} complete same-year global cattle-stock and permanent-meadow/pasture observations, covering magnitude, historical position, momentum and global extent.`,
    higher_priority_failures: []
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('cattle_stocking_density receipt verification failed.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_50_faostat_world_cattle_stocking_density', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: snapshot.source.id, promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-50.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-50.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
