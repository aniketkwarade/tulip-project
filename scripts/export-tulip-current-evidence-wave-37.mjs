import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/fao-fertilizer-product-output-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const years = a.years;
const products = Object.entries(a.products).map(([product_code, product]) => ({ product_code, ...product }));
const round = (value, digits = 6) => Number(value.toFixed(digits));
const quantile = (values, probability) => {
  const sorted = [...values].sort((left, right) => left - right);
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction;
};

if (years.length !== 22 || years[0] !== 2002 || years.at(-1) !== 2023 || products.length !== 15) throw new Error('FAOSTAT fertilizer product panel gate failed.');

const normalizedLevelsByYear = new Map(years.map(year => [year, []]));
const perProductLatest = [];
for (const product of products) {
  const anchors = historicalDistributionAnchors(product.values.slice(0, -1), 'annual');
  if (!anchors) throw new Error(`Historical distribution unavailable for ${product.name}.`);
  for (let index = 0; index < years.length; index += 1) normalizedLevelsByYear.get(years[index]).push(normalizeWithAnchors(product.values[index], anchors, 'higher_is_worse'));
  perProductLatest.push({ product_code: product.product_code, product_name: product.name, latest_tonnes: product.values.at(-1), historical_distribution_anchors_tonnes: anchors.map(value => round(value)), normalized_latest: round(normalizeWithAnchors(product.values.at(-1), anchors, 'higher_is_worse')) });
}

const annualLevelSummaries = years.map(year => {
  const levels = normalizedLevelsByYear.get(year);
  return { year, mean_normalized_level: levels.reduce((sum, value) => sum + value, 0) / levels.length, lower_quartile_normalized_level: quantile(levels, 0.25) };
});
const latestLevel = annualLevelSummaries.at(-1);
const breadthAnchors = historicalDistributionAnchors(annualLevelSummaries.slice(0, -1).map(point => point.lower_quartile_normalized_level), 'annual');

const annualMedianLogChanges = [];
for (let index = 1; index < years.length; index += 1) {
  const changes = products.map(product => Math.log(product.values[index] / product.values[index - 1]));
  annualMedianLogChanges.push({ year: years[index], median_log_change: quantile(changes, 0.5) });
}
const momentumAnchors = historicalDistributionAnchors(annualMedianLogChanges.slice(0, -1).map(point => point.median_log_change), 'annual');
if (!breadthAnchors || !momentumAnchors) throw new Error('FAOSTAT fertilizer cross-product historical distribution gate failed.');

const components = {
  magnitude: round(latestLevel.mean_normalized_level),
  threshold: round(normalizeWithAnchors(latestLevel.lower_quartile_normalized_level, breadthAnchors, 'higher_is_worse')),
  momentum: round(normalizeWithAnchors(annualMedianLogChanges.at(-1).median_log_change, momentumAnchors, 'higher_is_worse')),
  extent: a.global_extent_normalized
};
const gate = { direct_components: ['magnitude', 'threshold', 'momentum', 'extent'], global_scope: true, current_observation: true };
if (!qualifiesForCurrentData(gate)) throw new Error('fertilizer_production did not pass the current-data coverage gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'fertilizer_production',
  method: 'current_data',
  as_of: String(years.at(-1)),
  components,
  raw_inputs: {
    magnitude: { selected_year: years.at(-1), product_class_count: products.length, aggregation: 'unweighted mean of class-specific normalized production levels; tonnes are never summed across product classes', per_product_latest: perProductLatest },
    threshold: { selected_year_lower_quartile_normalized_level: round(latestLevel.lower_quartile_normalized_level), complete_prior_annual_cross_product_summaries: annualLevelSummaries.length - 1, historical_distribution_anchors: breadthAnchors.map(value => round(value)), boundary: 'No recognized global production threshold exists; the historical fallback tests whether production is broadly high across at least three quarters of complete product classes.' },
    momentum: { selected_year: annualMedianLogChanges.at(-1).year, latest_cross_product_median_log_change: round(annualMedianLogChanges.at(-1).median_log_change), complete_prior_annual_changes: annualMedianLogChanges.length - 1, historical_distribution_anchors: momentumAnchors.map(value => round(value)), boundary: 'Median product-class log change limits domination by differently scaled product masses.' },
    extent: { geography: a.geography, selected_year_reporting_country_or_territory_count: a.selected_year_reporting_country_or_territory_count, global_extent_normalized: a.global_extent_normalized },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, bulk_sha256: snapshot.source.bulk_sha256, selected_year_source_flag_counts: a.selected_year_source_flag_counts, withheld_incomplete_year: a.withheld_incomplete_year, excluded_from_scoring: snapshot.excluded_from_scoring },
    coverage_gate: gate
  },
  transformations: [
    { type: 'disjoint_country_product_aggregation', formula: 'Filter official FAOSTAT production rows in tonnes to country or territory area codes below 500; sum only within identical product code and year.' },
    { type: 'class_preserving_magnitude', formula: 'For each of 15 complete product classes, normalize 2023 output through that class’s 2002-2022 historical distribution, then average normalized class levels without summing product tonnes.' },
    { type: 'cross_class_breadth_threshold', formula: 'Take the lower quartile of class-normalized output each year and normalize the 2023 breadth value through 21 prior annual breadth values.' },
    { type: 'cross_class_momentum', formula: 'Calculate each class’s annual log change, take the cross-class median, and normalize the 2023 median through 20 prior annual medians.' },
    { type: 'incomplete_release_withheld', formula: 'Withhold 2024 because only 25 country or territory reporters are present versus 41 in the selected 2023 panel; missing production is never treated as zero.' }
  ],
  source_ids: ['faostat_fertilizer_product_output_2026'],
  uncertainty: snapshot.uncertainty,
  freshness: `FAOSTAT bulk release timestamp ${snapshot.source.release_file_timestamp}; latest complete scoring panel ${years.at(-1)}; incomplete ${a.withheld_incomplete_year.year} panel withheld; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The checksum-bound FAOSTAT release supplies 15 product-class series with 22 complete annual global reported totals, 21 prior annual breadth values and 20 prior cross-product momentum values. All four current-data components are directly quantified while product classes and units remain separate.',
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for fertilizer_production.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_37_faostat_fertilizer_product_output', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'faostat_fertilizer_product_output_2026', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-37.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-37.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
