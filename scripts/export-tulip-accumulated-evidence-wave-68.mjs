import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/alaska-coastal-permafrost-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.net_average_shoreline_retreat_m_per_year, anchors.shoreline_retreat_m_per_year),
  human_economic_burden: n(impact.combined_relocation_cost_lower_bound_usd, anchors.associated_relocation_cost_usd),
  persistence: n(impact.observed_record_years_lower_bound, anchors.observation_record_years),
  extent: n(impact.directly_assessed_country_count, anchors.directly_assessed_countries)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('coastal_permafrost_erosion: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'coastal_permafrost_erosion',
  method: 'impact_fallback',
  as_of: '2015',
  components,
  raw_inputs: {
    biophysical_burden: { studied_coastline_km_lower_bound: impact.studied_coastline_km_lower_bound, net_average_shoreline_retreat_m_per_year: impact.net_average_shoreline_retreat_m_per_year, most_coast_retreat_rate_m_per_year_lower_bound: impact.most_coast_retreat_rate_m_per_year_lower_bound, normalization_anchors_m_per_year: anchors.shoreline_retreat_m_per_year },
    human_economic_burden: { assessed_villages: impact.assessed_villages, assessed_village_count: impact.assessed_village_count, combined_relocation_cost_lower_bound_usd: impact.combined_relocation_cost_lower_bound_usd, combined_relocation_cost_upper_bound_usd: impact.combined_relocation_cost_upper_bound_usd, normalization_anchors_usd: anchors.associated_relocation_cost_usd, boundary: 'Lower-bound associated relocation burden from compound coastal flooding and erosion; not a permafrost-only causal attribution.' },
    persistence: { observed_record_years_lower_bound: impact.observed_record_years_lower_bound, normalization_anchors_years: anchors.observation_record_years, corps_estimated_location_loss_years_range: [impact.corps_estimated_location_loss_years_lower_bound, impact.corps_estimated_location_loss_years_upper_bound] },
    extent: { directly_assessed_country_count: impact.directly_assessed_country_count, studied_coastline_km_lower_bound: impact.studied_coastline_km_lower_bound, normalization_anchors_countries: anchors.directly_assessed_countries },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.map(source => source.source_locator) }
  },
  transformations: [
    { type: 'regional_retreat_rate', formula: 'Normalize the USGS net average shoreline loss rate across the assessed northern Alaska coast; retain coast length and the greater-than-1 m/year majority statement as context.' },
    { type: 'lower_bound_relocation_cost', formula: 'Multiply the source-reported $80 million lower bound by the three named villages; retain the $200 million each upper bound without scoring it.' },
    { type: 'associated_burden_boundary', formula: 'Treat relocation cost as associated compound coastal-erosion burden and do not attribute every dollar to permafrost thaw alone.' },
    { type: 'observation_persistence_floor', formula: 'Use 50 years as the conservative numeric lower bound for a source record described as more than half a century.' },
    { type: 'bounded_country_extent', formula: 'Normalize one directly assessed country; 1,600 km of Arctic coast is not expanded to pan-Arctic coverage.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `USGS regional assessment published ${snapshot.sources[0].publication_date}; relocation estimates reported ${snapshot.sources[1].publication_date}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'USGS directly quantifies named Arctic-coast retreat rate and spatial coverage, while GAO reports bounded relocation-cost ranges for three named erosion-threatened villages; the receipt preserves persistence and one-country extent.',
    higher_priority_failures: ['The latest source is a historical regional assessment rather than a current pan-Arctic aggregation.', 'The record does not provide a method-comparable current global magnitude, threshold and momentum series.']
  }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`coastal_permafrost_erosion: receipt verification failed: ${verification.errors.join('; ')}`);

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_68_usgs_gao_alaska_coastal_permafrost', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-68.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-68.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
