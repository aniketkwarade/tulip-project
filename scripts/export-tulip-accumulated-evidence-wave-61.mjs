import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/iea-energy-affordability-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.additional_households_in_energy_poverty_since_2019, anchors.additional_households_in_energy_poverty),
  human_economic_burden: n(impact.emergency_government_support_usd, anchors.emergency_government_support_usd),
  persistence: n(impact.inclusive_years, anchors.inclusive_years),
  extent: impact.global_extent_normalized
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('energy_affordability_crisis: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'energy_affordability_crisis',
  method: 'impact_fallback',
  as_of: String(impact.as_of),
  components,
  raw_inputs: {
    biophysical_burden: { additional_households_in_energy_poverty_since_2019: impact.additional_households_in_energy_poverty_since_2019, normalization_anchors_households: anchors.additional_households_in_energy_poverty },
    human_economic_burden: { emergency_government_support_usd: impact.emergency_government_support_usd, normalization_anchors_usd: anchors.emergency_government_support_usd },
    persistence: { accumulation_start_year: impact.accumulation_start_year, accumulation_end_year: impact.accumulation_end_year, inclusive_years: impact.inclusive_years, normalization_anchors_years: anchors.inclusive_years },
    extent: { geographic_scope: snapshot.metric_contract.geography, normalized_value: impact.global_extent_normalized },
    unscored_context: { people_without_reliable_energy_services: impact.people_without_reliable_energy_services_context_only, tracking_sdg7: impact.tracking_sdg7_context, excluded_projection: impact.excluded_projection },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, iea_report_sha256: snapshot.sources[0].report_sha256, tracking_sdg7_html_sha256: snapshot.sources[1].retrieved_html_sha256 }
  },
  transformations: [
    { type: 'exact_energy_poverty_burden', formula: 'Normalize the IEA estimate of 160 million additional households pushed into energy poverty since 2019; do not add overlapping people-without-access totals.' },
    { type: 'emergency_response_burden', formula: 'Normalize the reported USD 550 billion emergency government response without treating spending as household income loss.' },
    { type: 'inclusive_period', formula: 'Represent the reported since-2019 interval through the 2022 assessment as four inclusive calendar years.' },
    { type: 'projection_exclusion', formula: 'Exclude the projected 100 million people who may return to traditional cooking because projected impact is not accumulated burden.' },
    { type: 'global_assessment_extent', formula: 'Use full extent for the source-declared worldwide energy crisis while retaining uneven country severity.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `IEA crisis estimates are as of ${impact.as_of}; the SDG7 access reversal was published ${snapshot.sources[1].published_at}; sources reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'IEA quantifies additional households pushed into energy poverty, emergency government spending, a bounded multi-year period and global extent under the exact energy-affordability contract.',
    higher_priority_failures: ['No harmonized global household-expenditure-to-income series provides at least 20 annual or 60 monthly observations.', 'The available assessment does not supply a current global magnitude plus threshold or momentum at the current-data coverage gate.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('energy_affordability_crisis: receipt verification failed.');

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_61_iea_energy_affordability', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-61.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-61.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
