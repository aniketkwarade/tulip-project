import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/cdc-atlanta-pollen-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.median_significant_annual_peak_concentration_change_pct, anchors.annual_peak_concentration_change_pct),
  human_economic_burden: n(impact.combined_allergic_rhinitis_cases_us_context_only, anchors.associated_allergic_rhinitis_cases),
  persistence: n(impact.observation_years, anchors.observation_years),
  extent: n(impact.monitored_metro_areas, anchors.monitored_metro_areas)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('pollen_allergen_spikes: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'pollen_allergen_spikes',
  method: 'impact_fallback',
  as_of: String(impact.end_year),
  components,
  raw_inputs: {
    biophysical_burden: { significant_peak_concentration_trends: impact.significant_peak_concentration_trends, median_significant_annual_peak_concentration_change_pct: impact.median_significant_annual_peak_concentration_change_pct, normalization_anchors_pct_per_year: anchors.annual_peak_concentration_change_pct },
    human_economic_burden: { adult_allergic_rhinitis_cases_us_context_only: impact.adult_allergic_rhinitis_cases_us_context_only, child_allergic_rhinitis_cases_us_context_only: impact.child_allergic_rhinitis_cases_us_context_only, combined_allergic_rhinitis_cases_us_context_only: impact.combined_allergic_rhinitis_cases_us_context_only, normalization_anchors_cases: anchors.associated_allergic_rhinitis_cases, boundary: 'Associated national allergic-rhinitis burden; not an Atlanta trend-attributable count.' },
    persistence: { start_year: impact.start_year, end_year: impact.end_year, observation_years: impact.observation_years, normalization_anchors_years: anchors.observation_years },
    extent: { monitored_metro_areas: impact.monitored_metro_areas, stated_station_representativeness_radius_miles: impact.stated_station_representativeness_radius_miles, normalization_anchors_metro_areas: anchors.monitored_metro_areas },
    unscored_context: { sampled_taxa: impact.sampled_taxa, taxa_with_significant_increasing_peak_concentration: impact.taxa_with_significant_increasing_peak_concentration, spring_grouped_tree_average_daily_concentration_change_pct_per_year: impact.spring_grouped_tree_average_daily_concentration_change_pct_per_year, fall_grouped_tree_average_daily_concentration_change_pct_per_year: impact.fall_grouped_tree_average_daily_concentration_change_pct_per_year, historical_annual_treatment_cost_usd: impact.historical_annual_treatment_cost_usd_context_only },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, report_sha256: snapshot.sources[0].report_sha256 }
  },
  transformations: [
    { type: 'peak_trend_filter', formula: 'Retain only taxon-specific seasonal peak-concentration trends reported as statistically significant increases.' },
    { type: 'median_taxon_summary', formula: 'Sort the six significant annual peak-concentration changes and average the third and fourth values; do not use the largest taxon trend as the station-wide burden.' },
    { type: 'health_burden_boundary', formula: 'Normalize the source-cited national allergic-rhinitis population as associated burden; do not label it attributable to Atlanta or to the measured trend.' },
    { type: 'station_extent_boundary', formula: 'Normalize one monitored metropolitan area and retain the stated 25-mile station representativeness radius; do not convert it to national coverage.' },
    { type: 'season_length_exclusion', formula: 'Do not use season-length changes as pollen-concentration intensity.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Station observations cover ${impact.start_year}-${impact.end_year}; peer-reviewed study published ${snapshot.sources[0].publication_year}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'A 27-year standardized station study quantifies taxon-specific peak allergenic-pollen concentration trends, associated health burden, persistence and bounded metropolitan extent under the exact exposure contract.',
    higher_priority_failures: ['The concentration series ends in 2018 and represents one station rather than a current global aggregation.', 'Sampler cadence and station scope prevent use as a current worldwide magnitude, threshold and momentum score.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('pollen_allergen_spikes: receipt verification failed.');

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_65_cdc_atlanta_pollen', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-65.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-65.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
