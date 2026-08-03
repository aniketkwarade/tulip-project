import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/edgar-global-air-pollutant-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const annual = snapshot.records.filter(record => Number.isFinite(record.global_total_gg)).sort((a, b) => a.year - b.year);
const latest = annual.at(-1);
const prior = annual.slice(0, -1);
const annualChanges = annual.slice(1).map((record, index) => record.global_total_gg - annual[index].global_total_gg);
const magnitudeAnchors = historicalDistributionAnchors(prior.map(record => record.global_total_gg), 'annual');
const momentumAnchors = historicalDistributionAnchors(annualChanges.slice(0, -1), 'annual');
if (annual.length < 20 || !magnitudeAnchors || !momentumAnchors) throw new Error('EDGAR NMVOC historical-distribution gate failed.');
const round = value => Number(value.toFixed(6));
const latestChange = annualChanges.at(-1);
const components = {
  magnitude: round(normalizeWithAnchors(latest.global_total_gg, magnitudeAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.global_total_gg, magnitudeAnchors, 'higher_is_worse')),
  momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
  extent: 1
};
const gate = { direct_components: ['magnitude', 'threshold', 'momentum', 'extent'], global_scope: true, current_observation: true };
if (!qualifiesForCurrentData(gate)) throw new Error('volatile_organic_compounds did not pass the current-data gate.');
const receipt = buildTulipUrgencyReceipt({
  node_id: 'volatile_organic_compounds',
  method: 'current_data',
  as_of: String(latest.year),
  components,
  raw_inputs: {
    magnitude: { latest_year: latest.year, latest_global_nmvoc_emissions_gg: latest.global_total_gg, historical_distribution_anchors_gg: magnitudeAnchors.map(round), complete_prior_annual_observations: prior.length, direction: 'higher_is_worse' },
    threshold: { basis: 'historical_distribution_fallback_no_recognized_global_emissions_threshold', anchors_gg: magnitudeAnchors.map(round), minimum_observation_gate: 20 },
    momentum: { prior_year: annual.at(-2).year, prior_global_nmvoc_emissions_gg: annual.at(-2).global_total_gg, latest_annual_change_gg: round(latestChange), historical_change_anchors_gg: momentumAnchors.map(round) },
    extent: { normalized_value: 1, geography: 'World', aggregation: snapshot.metric_contract.aggregation },
    coverage_gate: gate,
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_release: snapshot.source.release, archive_sha256: snapshot.source.archive_sha256, records: annual.length }
  },
  transformations: [
    { type: 'source_native_global_aggregation', formula: 'Sum each finite EDGAR country-total row exactly once for each year; exclude regional and sector-sheet duplication.' },
    { type: 'historical_distribution_normalization', formula: 'Map the prior annual median, p75, p90 and p97.5 to 0, 0.33, 0.67 and 1 because no recognized global NMVOC emissions threshold exists.' },
    { type: 'annual_change_momentum', formula: 'Subtract the prior complete year and normalize the latest annual change against the preceding complete annual-change distribution.' },
    { type: 'global_extent', formula: 'Assign full extent because the aggregation covers the EDGAR global country inventory.' }
  ],
  source_ids: ['edgar_global_air_pollutant_emissions_v81'],
  uncertainty: snapshot.uncertainty,
  freshness: `${snapshot.source.release}; latest complete observation year ${latest.year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: `EDGAR supplies ${annual.length} complete global annual NMVOC observations, including latest magnitude, historical-distribution threshold position, annual momentum and global extent.`, higher_priority_failures: [] }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('volatile_organic_compounds receipt verification failed.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_48_edgar_global_nmvoc', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: snapshot.source.id, promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-48.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-48.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
