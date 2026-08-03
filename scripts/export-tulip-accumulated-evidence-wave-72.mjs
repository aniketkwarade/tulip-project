import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/cape-town-water-demand-rationing-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));

const definitions = [
  {
    node_id: 'urban_water_demand_peak',
    as_of: '2018-02',
    components: {
      biophysical_burden: n(impact.peak_demand.peak_reduction_mld, anchors.peak_reduction_mld),
      human_economic_burden: n(impact.water_service_revenue_under_recovery_zar, anchors.water_service_revenue_under_recovery_zar),
      persistence: n(impact.peak_demand.demand_management_period_years, anchors.demand_management_period_years),
      extent: n(impact.level_6b_rationing.represented_population, anchors.represented_population)
    },
    raw_inputs: {
      biophysical_burden: { ...impact.peak_demand, normalization_anchors_peak_reduction_mld: anchors.peak_reduction_mld },
      human_economic_burden: { water_service_revenue_under_recovery_zar: impact.water_service_revenue_under_recovery_zar, normalization_anchors_zar: anchors.water_service_revenue_under_recovery_zar },
      persistence: { demand_management_period_years: impact.peak_demand.demand_management_period_years, normalization_anchors_years: anchors.demand_management_period_years },
      extent: { represented_population: impact.level_6b_rationing.represented_population, represented_country: impact.represented_country, normalization_anchors_people: anchors.represented_population }
    },
    transformations: [
      { type: 'reported_peak_gap', formula: 'Subtract the utility-reported 2018 actual demand of about 500 MLD from the reported 2015 summer peak of about 1,200 MLD, retaining the 450 MLD restricted target and 50 MLD target exceedance.' },
      { type: 'service_revenue_burden', formula: 'Use the City-reported ZAR 1.7 billion anticipated water-service revenue under-recovery; do not substitute total provincial drought losses.' },
      { type: 'demand_management_persistence', formula: 'Use the three-year February 2015 to February 2018 peak-demand comparison period.' },
      { type: 'bounded_service_extent', formula: 'Normalize the City-reported four-million-person service population; do not extrapolate one utility to national or global coverage.' }
    ],
    selected_method_passed: 'The City utility report quantifies summer peak demand, actual demand, its restricted target, service-revenue burden, a multi-year management period and represented population within a named service area.',
    higher_priority_failures: ['The observation is a dated metropolitan accumulated-impact episode, not a current global utility-demand aggregation.', 'The three annual peak points do not satisfy the 20-annual-observation historical-distribution gate.']
  },
  {
    node_id: 'urban_water_rationing_zones',
    as_of: impact.level_6b_rationing.end_date,
    components: {
      biophysical_burden: n(impact.peak_demand.peak_reduction_pct, anchors.peak_reduction_pct),
      human_economic_burden: n(impact.water_service_revenue_under_recovery_zar, anchors.water_service_revenue_under_recovery_zar),
      persistence: n(impact.level_6b_rationing.duration_months, anchors.restriction_duration_months),
      extent: n(impact.level_6b_rationing.represented_population, anchors.represented_population)
    },
    raw_inputs: {
      biophysical_burden: { peak_reduction_pct: impact.peak_demand.peak_reduction_pct, actual_demand_2018_mld: impact.peak_demand.actual_demand_2018_mld, restricted_target_mld: impact.peak_demand.restricted_target_mld, normalization_anchors_pct: anchors.peak_reduction_pct },
      human_economic_burden: { water_service_revenue_under_recovery_zar: impact.water_service_revenue_under_recovery_zar, normalization_anchors_zar: anchors.water_service_revenue_under_recovery_zar },
      persistence: { restriction_stage: impact.level_6b_rationing.restriction_stage, start_date: impact.level_6b_rationing.start_date, end_date: impact.level_6b_rationing.end_date, duration_months: impact.level_6b_rationing.duration_months, personal_limit_litres_per_day: impact.level_6b_rationing.personal_limit_litres_per_day, normalization_anchors_months: anchors.restriction_duration_months },
      extent: { represented_population: impact.level_6b_rationing.represented_population, represented_country: impact.represented_country, normalization_anchors_people: anchors.represented_population }
    },
    transformations: [
      { type: 'documented_restriction_severity', formula: 'Use the utility-reported 58.333333 percent reduction from the 2015 summer peak to 2018 demand as the system burden accompanying formal Level 6B; do not score the unrealized Day Zero shutoff.' },
      { type: 'service_revenue_burden', formula: 'Use the City-reported ZAR 1.7 billion anticipated water-service revenue under-recovery; do not substitute total provincial drought losses.' },
      { type: 'formal_stage_duration', formula: 'Count eight months from Level 6B taking effect on 1 February 2018 through its replacement by Level 5 on 1 October 2018.' },
      { type: 'bounded_service_extent', formula: 'Normalize the four million residents explicitly used in the City’s 50-litre-per-day calculation; do not infer customer connections.' }
    ],
    selected_method_passed: 'The City’s administrative record documents a formal restriction stage, per-person limit, exact effective dates, represented population and quantified service-revenue burden.',
    higher_priority_failures: ['The restriction ended in 2018 and is not a current global rationing-zone aggregation.', 'A single metropolitan episode cannot support current global magnitude, momentum and extent coverage.']
  }
];

const receipts = definitions.map(definition => {
  if (!qualifiesForImpactFallback({ quantitative_evidence: true, components: definition.components })) throw new Error(`${definition.node_id}: accumulated-impact gate failed.`);
  const receipt = buildTulipUrgencyReceipt({
    node_id: definition.node_id,
    method: 'impact_fallback',
    as_of: definition.as_of,
    components: definition.components,
    raw_inputs: { ...definition.raw_inputs, source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) } },
    transformations: [...definition.transformations, { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }],
    source_ids: snapshot.sources.map(source => source.id),
    uncertainty: snapshot.uncertainty,
    freshness: `Cape Town 2018 drought episode; official reports reviewed ${snapshot.captured_at}.`,
    selection_reason: { selected_method_passed: definition.selected_method_passed, higher_priority_failures: definition.higher_priority_failures }
  });
  const verification = verifyTulipUrgencyReceipt(receipt);
  if (!verification.valid) throw new Error(`${definition.node_id}: receipt verification failed: ${verification.errors.join('; ')}`);
  return receipt;
});

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_72_cape_town_water_demand_and_rationing', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-72.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-72.json', receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components })) }, null, 2));
