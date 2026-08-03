import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/ceds-sector-fuel-co2-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = value => Number(value.toFixed(6));

const receipts = Object.entries(snapshot.metrics).map(([node_id, metric]) => {
  const annual = metric.observations.slice().sort((left, right) => left.year - right.year);
  const latest = annual.at(-1);
  const prior = annual.slice(0, -1);
  const changes = annual.slice(1).map((record, index) => record.value_kt_co2 - annual[index].value_kt_co2);
  const magnitudeAnchors = historicalDistributionAnchors(prior.map(record => record.value_kt_co2), 'annual');
  const momentumAnchors = historicalDistributionAnchors(changes.slice(0, -1), 'annual');
  if (!magnitudeAnchors || !momentumAnchors || annual.length < 20) throw new Error(`${node_id}: historical-distribution gate failed.`);
  const latestChange = changes.at(-1);
  const components = {
    magnitude: round(normalizeWithAnchors(latest.value_kt_co2, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.value_kt_co2, magnitudeAnchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
    extent: 1
  };
  const gate = { direct_components: ['magnitude', 'threshold', 'momentum', 'extent'], global_scope: true, current_observation: true };
  if (!qualifiesForCurrentData(gate)) throw new Error(`${node_id}: current-data gate failed.`);

  const receipt = buildTulipUrgencyReceipt({
    node_id,
    method: 'current_data',
    as_of: String(latest.year),
    components,
    raw_inputs: {
      magnitude: { latest_year: latest.year, latest_global_kt_co2: latest.value_kt_co2, historical_distribution_anchors_kt_co2: magnitudeAnchors.map(round), direction: 'higher_is_worse' },
      threshold: { basis: 'historical_distribution_fallback_no_recognized_global_sector_fuel_co2_threshold', anchors_kt_co2: magnitudeAnchors.map(round), complete_prior_annual_observations: prior.length },
      momentum: { prior_year: annual.at(-2).year, prior_global_kt_co2: annual.at(-2).value_kt_co2, latest_annual_change_kt_co2: round(latestChange), historical_change_anchors_kt_co2: momentumAnchors.map(round) },
      extent: { normalized_value: 1, geography: metric.geography, aggregation: metric.aggregation },
      coverage_gate: gate,
      source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, archive_md5: snapshot.source.archive_md5, archive_sha256: snapshot.source.archive_sha256, member_sha256: snapshot.source.member_sha256, annual_observations: annual.length }
    },
    transformations: [
      { type: 'contract_bound_fuel_sector_aggregation', formula: metric.aggregation },
      { type: 'historical_distribution_normalization', formula: 'Map the prior annual median, p75, p90 and p97.5 to 0, 0.33, 0.67 and 1 because no recognized global threshold exists for this exact sector-fuel CO2 total.' },
      { type: 'annual_change_momentum', formula: 'Normalize the latest complete-year change against the preceding complete annual changes.' },
      { type: 'global_extent', formula: 'Assign full extent because the selected rows are CEDS source-native global aggregates.' }
    ],
    source_ids: ['ceds_v2024_04_01_release_emission_data', 'mcduffie_ceds_sector_fuel_specific_inventory_2020'],
    uncertainty: `${snapshot.uncertainty} ${snapshot.exclusions}`,
    freshness: `Latest complete inventory year ${latest.year}; CEDS release ${snapshot.source.release_date}; snapshot reviewed ${snapshot.captured_at}.`,
    selection_reason: { selected_method_passed: `CEDS supplies ${annual.length} complete source-native global annual observations for the exact declared sector-fuel aggregation, covering magnitude, historical position, momentum and extent.`, higher_priority_failures: [] }
  });
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`${node_id}: receipt verification failed.`);
  return receipt;
});

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_52_ceds_global_sector_fuel_co2', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: snapshot.source.id, promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-52.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-52.json', promoted_node_count: receipts.length, receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
