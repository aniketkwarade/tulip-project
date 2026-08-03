import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/premium-standard-farms-lagoon-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.confined_pig_head_approx, anchors.confined_swine_head),
  human_economic_burden: n(impact.total_paid_civil_penalties_usd_derived, anchors.paid_civil_penalties_usd),
  persistence: n(impact.operating_system_span_years, anchors.operating_system_span_years),
  extent: n(impact.large_farm_count, anchors.large_farm_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('anaerobic_manure_lagoon_operation: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'anaerobic_manure_lagoon_operation', method: 'impact_fallback', as_of: String(impact.settlement_year), components,
  raw_inputs: {
    biophysical_burden: { confined_pig_head_approx: impact.confined_pig_head_approx, hog_barns_more_than: impact.hog_barns_more_than, anaerobic_animal_waste_lagoon_count: impact.anaerobic_animal_waste_lagoon_count, normalization_anchors_swine_head: anchors.confined_swine_head, boundary: 'Portfolio animal loading proxy with species preserved; no animal-unit, volume, nutrient-mass or retention-time conversion.' },
    human_economic_burden: { federal_civil_penalty_usd: impact.federal_civil_penalty_usd, prior_missouri_penalties_usd: impact.prior_missouri_penalties_usd, total_paid_civil_penalties_usd_derived: impact.total_paid_civil_penalties_usd_derived, normalization_anchors_usd: anchors.paid_civil_penalties_usd },
    persistence: { operation_start_year: impact.operation_start_year, settlement_year: impact.settlement_year, operating_system_span_years: impact.operating_system_span_years, normalization_anchors_years: anchors.operating_system_span_years, boundary: 'Operating-system duration, not alleged-violation duration.' },
    extent: { large_farm_count: impact.large_farm_count, county_count: impact.county_count, normalization_anchors_farms: anchors.large_farm_count },
    unscored_context: { required_nitrogen_content_reduction_percent_at_least: impact.required_nitrogen_content_reduction_percent_at_least_unscored, future_wastewater_technology_spending_usd_up_to: impact.future_wastewater_technology_spending_usd_up_to_unscored, supplemental_environmental_project_usd: impact.supplemental_environmental_project_usd_unscored },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'species_preserved_portfolio_loading', formula: 'Normalize the source-reported approximate 1.25 million confined pigs while retaining 163 mostly single-stage anaerobic lagoons as system context; do not derive nutrient or hydraulic loads.' },
    { type: 'paid_penalty_burden', formula: 'Add the USD 350,000 federal penalty and USD 650,000 prior Missouri penalties to obtain USD 1 million in actual paid civil penalties.' },
    { type: 'operating_system_span', formula: 'Subtract the 1988 operation start from the 2001 settlement year to obtain a 13-year system span, not a violation duration.' },
    { type: 'portfolio_extent', formula: 'Normalize 21 large farms and retain five counties as bounded geographic context.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical Missouri CAFO portfolio assessed at the ${impact.settlement_year} consent decree; EPA records reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'EPA and the consent decree quantify species-specific portfolio loading, anaerobic lagoon systems, paid penalties, operating-system span and farm extent.', higher_priority_failures: ['The evidence is a historical Missouri portfolio rather than a current global manure-lagoon aggregation.', 'Current globally comparable lagoon loading, retention, temperature and treatment-condition data do not meet the coverage gate.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`anaerobic_manure_lagoon_operation: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_87_premium_standard_farms_lagoons', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-87.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-87.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
