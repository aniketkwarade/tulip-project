import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/fao-food-import-exposure-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const series = a.values;
const latest = series.at(-1);
const history = series.slice(0, -1);
const round = (value, digits = 6) => Number(value.toFixed(digits));

if (series.length !== 22 || latest.period !== '2021-2023' || latest.population_coverage < 0.9) throw new Error('FAOSTAT food-import exposure source-data gate failed.');
const magnitudeAnchors = historicalDistributionAnchors(history.map(point => point.population_weighted_signed_dependency_pct), 'annual');
const thresholdAnchors = historicalDistributionAnchors(history.map(point => point.population_share_dependency_ge_50), 'annual');
const annualChanges = series.slice(1).map((point, index) => ({ period: point.period, value: point.population_share_dependency_ge_50 - series[index].population_share_dependency_ge_50 }));
const momentumAnchors = historicalDistributionAnchors(annualChanges.slice(0, -1).map(point => point.value), 'annual');
if (!magnitudeAnchors || !thresholdAnchors || !momentumAnchors) throw new Error('FAOSTAT food-import historical-distribution gate failed.');

const components = {
  magnitude: round(normalizeWithAnchors(latest.population_weighted_signed_dependency_pct, magnitudeAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.population_share_dependency_ge_50, thresholdAnchors, 'higher_is_worse')),
  momentum: round(normalizeWithAnchors(annualChanges.at(-1).value, momentumAnchors, 'higher_is_worse')),
  extent: round(latest.population_coverage)
};
const gate = { direct_components: ['magnitude', 'threshold', 'momentum', 'extent'], global_scope: true, current_observation: true };
if (!qualifiesForCurrentData(gate)) throw new Error('food_import_exposure did not pass the current-data coverage gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'food_import_exposure',
  method: 'current_data',
  as_of: latest.period,
  components,
  raw_inputs: {
    magnitude: { latest_period: latest.period, latest_population_weighted_signed_dependency_pct: latest.population_weighted_signed_dependency_pct, complete_prior_three_year_periods: history.length, historical_distribution_anchors_pct: magnitudeAnchors.map(value => round(value)), net_exporter_handling: 'Signed negative country ratios retained.' },
    threshold: { high_dependency_boundary_pct: a.high_dependency_boundary_pct, latest_population_share_in_high_dependency_countries: latest.population_share_dependency_ge_50, complete_prior_three_year_periods: history.length, historical_distribution_anchors: thresholdAnchors.map(value => round(value)), boundary_meaning: a.high_dependency_boundary_meaning },
    momentum: { latest_change_in_high_dependency_population_share: round(annualChanges.at(-1).value), latest_comparison: [series.at(-2).period, latest.period], complete_prior_overlapping_period_changes: annualChanges.length - 1, historical_distribution_anchors: momentumAnchors.map(value => round(value)) },
    extent: { latest_reporting_countries: latest.reporting_countries, latest_population_year: latest.population_year, latest_population_coverage: latest.population_coverage, denominator: 'FAOSTAT World total population' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, food_security_bulk_sha256: snapshot.source.food_security_bulk_sha256, population_bulk_sha256: snapshot.source.population_bulk_sha256, excluded_from_scoring: snapshot.excluded_from_scoring },
    coverage_gate: gate
  },
  transformations: [
    { type: 'population_weighted_signed_country_distribution', formula: 'Join country or territory cereal import-dependency ratios to middle-year total population by FAOSTAT area code; retain signed ratios and divide weighted sums by covered population.' },
    { type: 'historical_distribution_magnitude', formula: 'Normalize the latest population-weighted signed dependency through 21 prior complete three-year-period values.' },
    { type: 'majority_supply_exposure_threshold', formula: 'Calculate covered-population share in countries where net imports provide at least 50% of apparent cereal supply, then normalize the latest share through 21 prior values.' },
    { type: 'exposure_share_momentum', formula: 'Normalize the latest change in high-dependency population share through 20 prior overlapping-period changes.' },
    { type: 'population_coverage_extent', formula: 'Use covered population divided by the source World population; missing country ratios do not enter the numerator or denominator.' }
  ],
  source_ids: ['faostat_cereal_import_dependency_and_population_2026'],
  uncertainty: snapshot.uncertainty,
  freshness: `FAOSTAT Food Security release ${snapshot.source.food_security_release_file_timestamp}; latest complete period ${latest.period}; population release ${snapshot.source.population_release_file_timestamp}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The paired FAOSTAT releases supply 22 complete globally aggregated three-year dependency distributions with roughly 96% population coverage. Current magnitude, high-dependency exposure, recent movement and extent are all directly quantified without allowing net-exporter and importer values to cancel at the World trade-balance row.',
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for food_import_exposure.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_38_faostat_food_import_exposure', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'faostat_cereal_import_dependency_and_population_2026', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-38.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-38.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
