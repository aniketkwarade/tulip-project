import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/usgs-thermoelectric-cooling-water-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact_2015;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.consumption_million_cubic_metres_per_year, anchors.consumption_million_cubic_metres_per_year),
  human_economic_burden: n(impact.thermoelectric_freshwater_share_of_all_national_freshwater_withdrawals_pct, anchors.freshwater_withdrawal_share_pct),
  persistence: n(impact.inclusive_comparison_years, anchors.inclusive_comparison_years),
  extent: n(impact.directly_assessed_country_count, anchors.directly_assessed_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('cooling_water_competition: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'cooling_water_competition',
  method: 'impact_fallback',
  as_of: String(impact.year),
  components,
  raw_inputs: {
    biophysical_burden: { consumption_billion_gallons_per_day: impact.consumption_billion_gallons_per_day, consumption_million_cubic_metres_per_year: impact.consumption_million_cubic_metres_per_year, normalization_anchors_million_cubic_metres_per_year: anchors.consumption_million_cubic_metres_per_year },
    human_economic_burden: { thermoelectric_freshwater_share_of_all_national_freshwater_withdrawals_pct: impact.thermoelectric_freshwater_share_of_all_national_freshwater_withdrawals_pct, normalization_anchors_pct: anchors.freshwater_withdrawal_share_pct },
    persistence: { comparison_year: impact.comparison_year, endpoint_year: impact.year, inclusive_comparison_years: impact.inclusive_comparison_years, withdrawal_change_from_2010_pct: impact.withdrawal_change_from_2010_pct, normalization_anchors_years: anchors.inclusive_comparison_years },
    extent: { directly_assessed_countries: impact.directly_assessed_countries, directly_assessed_country_count: impact.directly_assessed_country_count, normalization_anchors_countries: anchors.directly_assessed_country_count },
    unscored_context: { withdrawal_million_cubic_metres_per_year: impact.withdrawal_million_cubic_metres_per_year, thermoelectric_share_of_all_national_withdrawals_pct: impact.thermoelectric_share_of_all_national_withdrawals_pct, surface_water_share_lower_bound_pct: impact.surface_water_share_of_thermoelectric_withdrawals_lower_bound_pct, freshwater_share_of_surface_withdrawals_pct: impact.freshwater_share_of_thermoelectric_surface_withdrawals_pct, consumption_share_pct: impact.consumption_share_of_thermoelectric_withdrawals_pct },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, report_sha256: snapshot.sources[0].report_sha256 }
  },
  transformations: [
    { type: 'unit_conversion', formula: 'Convert billion US gallons per day to million cubic metres per year using exactly 0.003785411784 cubic metres per US gallon and 365 days.' },
    { type: 'consumption_boundary', formula: 'Score reported consumptive use as biophysical burden; retain gross withdrawal separately because most once-through water is returned.' },
    { type: 'freshwater_competition_share', formula: 'Score the source-reported thermoelectric share of national freshwater withdrawals; do not add saline withdrawals or infer basin shortage.' },
    { type: 'bounded_comparison_period', formula: 'Represent the 2010-to-2015 comparison as six inclusive calendar years without inventing intervening annual observations.' },
    { type: 'bounded_country_extent', formula: 'Normalize the one directly assessed country; nationwide aggregation does not become global coverage.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `USGS national water-use endpoint ${impact.year}; report published ${snapshot.sources[0].published_at}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'USGS quantifies thermoelectric consumptive water use, the sector share of national freshwater withdrawals, a bounded comparison interval and one-country extent under the exact cooling-water contract.',
    higher_priority_failures: ['The national compilation ends in 2015 and does not supply a current global magnitude.', 'The report provides a five-year comparison rather than at least 20 complete annual or 60 monthly observations for historical normalization.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('cooling_water_competition: receipt verification failed.');

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_63_usgs_thermoelectric_cooling_water', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-63.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-63.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
