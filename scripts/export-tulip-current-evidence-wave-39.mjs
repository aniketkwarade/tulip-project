import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/fao-world-cereal-feed-share-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const series = a.harmonized_values;
const latest = series.at(-1);
const history = series.slice(0, -1);
const round = (value, digits = 6) => Number(value.toFixed(digits));

function linearSlope(points) {
  const meanX = points.reduce((sum, point) => sum + point.year, 0) / points.length;
  const meanY = points.reduce((sum, point) => sum + point.feed_share_pct, 0) / points.length;
  const numerator = points.reduce((sum, point) => sum + (point.year - meanX) * (point.feed_share_pct - meanY), 0);
  const denominator = points.reduce((sum, point) => sum + (point.year - meanX) ** 2, 0);
  return numerator / denominator;
}

if (series.length !== 63 || latest.year !== 2023 || latest.basis !== 'current_food_balance_sheet') throw new Error('FAOSTAT cereal-feed harmonized-series gate failed.');
const shareAnchors = historicalDistributionAnchors(history.map(point => point.feed_share_pct), 'annual');
const massAnchors = historicalDistributionAnchors(history.map(point => point.feed_1000_t), 'annual');
const rollingFiveYearSlopes = [];
for (let index = 0; index <= series.length - 5; index += 1) {
  const window = series.slice(index, index + 5);
  rollingFiveYearSlopes.push({ start_year: window[0].year, end_year: window.at(-1).year, change_percentage_points_per_five_years: linearSlope(window) * 5 });
}
const momentumAnchors = historicalDistributionAnchors(rollingFiveYearSlopes.slice(0, -1).map(point => point.change_percentage_points_per_five_years), 'annual');
if (!shareAnchors || !massAnchors || !momentumAnchors) throw new Error('FAOSTAT cereal-feed historical-distribution gate failed.');

const components = {
  magnitude: round(normalizeWithAnchors(latest.feed_share_pct, shareAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.feed_1000_t, massAnchors, 'higher_is_worse')),
  momentum: round(normalizeWithAnchors(rollingFiveYearSlopes.at(-1).change_percentage_points_per_five_years, momentumAnchors, 'higher_is_worse')),
  extent: a.global_extent_normalized
};
const gate = { direct_components: ['magnitude', 'threshold', 'momentum', 'extent'], global_scope: true, current_observation: true };
if (!qualifiesForCurrentData(gate)) throw new Error('feed_crop_dependency did not pass the current-data coverage gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'feed_crop_dependency',
  method: 'current_data',
  as_of: String(latest.year),
  components,
  raw_inputs: {
    magnitude: { latest_year: latest.year, latest_world_cereal_feed_share_pct: round(latest.feed_share_pct), latest_world_cereal_domestic_supply_1000_t: latest.supply_1000_t, complete_prior_harmonized_annual_observations: history.length, historical_distribution_anchors_pct: shareAnchors.map(value => round(value)), basket: a.item },
    threshold: { latest_world_cereal_feed_1000_t: latest.feed_1000_t, complete_prior_harmonized_annual_observations: history.length, historical_distribution_anchors_1000_t: massAnchors.map(value => round(value)), boundary: 'No recognized physical threshold exists; absolute feed allocation is normalized against the overlap-crosswalked annual history.' },
    momentum: { window_years: 5, current_window: [series.at(-5).year, latest.year], current_change_percentage_points_per_five_years: round(rollingFiveYearSlopes.at(-1).change_percentage_points_per_five_years), complete_prior_rolling_windows: rollingFiveYearSlopes.length - 1, historical_distribution_anchors: momentumAnchors.map(value => round(value)) },
    extent: { geography: a.geography, source_aggregation: 'FAOSTAT World aggregate', normalized_value: a.global_extent_normalized },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, current_bulk_sha256: snapshot.source.current_bulk_sha256, historic_bulk_sha256: snapshot.source.historic_bulk_sha256, overlap_calibration: a.overlap_calibration, excluded_from_scoring: snapshot.excluded_from_scoring },
    coverage_gate: gate
  },
  transformations: [
    { type: 'source_defined_cereal_basket_share', formula: 'Divide World Feed by World Domestic supply quantity for the exact FAOSTAT Cereals - Excluding Beer item; retain both source masses in 1,000 tonnes.' },
    { type: 'edition_overlap_crosswalk', formula: 'For 1961-2009 historical normalization only, add the mean 2010-2013 current-minus-historic feed-share offset and multiply feed mass by the mean current-to-historic overlap ratio.' },
    { type: 'historical_distribution_level_and_mass', formula: 'Normalize the current feed share and current feed mass through 62 complete prior harmonized annual values.' },
    { type: 'rolling_five_year_momentum', formula: 'Calculate ordinary-least-squares change in feed share for every complete five-year window and normalize the latest window through 58 prior windows.' },
    { type: 'world_extent', formula: 'Use only source-declared World aggregate rows; no country or commodity inference outside the declared basket.' }
  ],
  source_ids: ['faostat_world_cereal_feed_share'],
  uncertainty: snapshot.uncertainty,
  freshness: `Current FAOSTAT Food Balance Sheets through ${latest.year}; current file release ${snapshot.source.current_release_file_timestamp}; historic crosswalk file release ${snapshot.source.historic_release_file_timestamp}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The checksum-bound current FAOSTAT World cereal balance directly supplies annual feed mass and domestic supply through 2023. A four-year overlap crosswalk to the official historical edition yields 63 complete annual values for normalization while leaving every current observation unchanged.',
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for feed_crop_dependency.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_39_faostat_world_cereal_feed_share', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'faostat_world_cereal_feed_share', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-39.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-39.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
