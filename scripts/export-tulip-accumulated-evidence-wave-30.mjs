import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLUE_PATH = 'public/unep-blue-ecosystems-impact-snapshot.json';
const NUTRIENT_PATH = 'public/unep-global-nutrient-pollution-impact-snapshot.json';
const MARITIME_PATH = 'public/unctad-maritime-bottleneck-impact-snapshot.json';
const [blue, nutrient, maritime] = await Promise.all([BLUE_PATH, NUTRIENT_PATH, MARITIME_PATH].map(async file => JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'))));
const round = (value, digits = 6) => Number(value.toFixed(digits));
const b = blue.assessments;
const n = nutrient.assessment;
const m = maritime.assessment;

function receipt({ nodeId, asOf, components, rawInputs, transformations, sourceId, snapshot, snapshotPath, passed, failures }) {
  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(asOf),
    components,
    raw_inputs: { ...rawInputs, source_snapshot: { path: snapshotPath, version: snapshot.version, captured_at: snapshot.captured_at, excluded_from_scoring: snapshot.excluded_from_scoring } },
    transformations,
    source_ids: [sourceId],
    uncertainty: snapshot.uncertainty,
    freshness: `Reviewed global assessment snapshot captured ${snapshot.captured_at}.`,
    selection_reason: { selected_method_passed: passed, higher_priority_failures: failures }
  });
}

const receipts = [
  receipt({
    nodeId: 'shipping_lane_disruption',
    asOf: m.latest_report_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(m.ton_mile_growth_multiple_vs_trade_volume_growth_2024, [1, 1.5, 2, 3], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(m.scfi_october_2024_above_pre_pandemic_average_pct, [0, 25, 75, 150], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(m.persistence_years, [0, 0.5, 1, 3], 'higher_is_worse')),
      extent: round(m.seaborne_share_of_world_trade_volume_pct / 100)
    },
    rawInputs: {
      biophysical_burden: { ton_mile_growth_2024_pct: m.vessel_ton_mile_growth_2024_pct, trade_volume_growth_2024_pct: m.maritime_trade_volume_growth_2024_pct, growth_multiple: m.ton_mile_growth_multiple_vs_trade_volume_growth_2024, anchors_multiple: [1, 1.5, 2, 3], boundary: 'Global rerouting burden; no route-level delay is invented.' },
      human_economic_burden: { scfi_above_pre_pandemic_average_pct: m.scfi_october_2024_above_pre_pandemic_average_pct, anchors_pct: [0, 25, 75, 150], boundary: 'Selected global freight-index pressure, not a consumer-price or economy-wide loss estimate.' },
      persistence: { disruption_start_year: m.disruption_start_year, measured_burden_year: m.measured_burden_year, persistence_years: m.persistence_years, anchors_years: [0, 0.5, 1, 3] },
      extent: { seaborne_share_world_trade_volume_pct: m.seaborne_share_of_world_trade_volume_pct, normalized_value: round(m.seaborne_share_of_world_trade_volume_pct / 100) }
    },
    transformations: [
      { type: 'rerouting_growth_multiple', formula: 'Divide source-reported ton-mile growth by maritime-trade volume growth while retaining both values.' },
      { type: 'freight_index_pressure', formula: 'Normalize the source-reported SCFI departure from its pre-pandemic average.' },
      { type: 'fixed_disruption_duration', formula: 'Retain the reviewed 2023-2025 disruption interval.' },
      { type: 'global_trade_extent', formula: 'Use the source-reported seaborne share of world trade volume.' }
    ],
    sourceId: 'unctad_review_of_maritime_transport_2024', snapshot: maritime, snapshotPath: MARITIME_PATH,
    passed: 'UNCTAD quantifies global rerouting ton-mile burden, freight-rate pressure, multi-year persistence and maritime trade exposure.',
    failures: ['No complete 20-year globally comparable route-delay series supports historical-percentile current scoring.', 'Port-call activity is not converted into delay, so the assessment remains accumulated impact.']
  }),
  receipt({
    nodeId: 'blue_carbon_habitat_loss',
    asOf: b.mangrove.latest_extent_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(b.mangrove.carbon_stock_reduction_megatonnes_carbon, [0, 25, 75, 150], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors((b.mangrove.estimated_annual_economic_damage_usd_billion_low + b.mangrove.estimated_annual_economic_damage_usd_billion_high) / 2, [0, 5, 15, 40], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(b.mangrove.persistence_years, [0, 5, 15, 30], 'higher_is_worse')),
      extent: round(b.mangrove.countries_with_mangroves / b.mangrove.global_country_denominator)
    },
    rawInputs: {
      biophysical_burden: { mangrove_carbon_stock_reduction_megatonnes_carbon: b.mangrove.carbon_stock_reduction_megatonnes_carbon, net_area_loss_km2: b.mangrove.net_area_loss_km2, anchors_megatonnes_carbon: [0, 25, 75, 150], boundary: 'Observed mangrove subset only; seagrass and salt-marsh stocks are not added.' },
      human_economic_burden: { annual_damage_range_usd_billion: [b.mangrove.estimated_annual_economic_damage_usd_billion_low, b.mangrove.estimated_annual_economic_damage_usd_billion_high], midpoint_usd_billion: (b.mangrove.estimated_annual_economic_damage_usd_billion_low + b.mangrove.estimated_annual_economic_damage_usd_billion_high) / 2, anchors_usd_billion: [0, 5, 15, 40] },
      persistence: { baseline_year: b.mangrove.baseline_year, latest_extent_year: b.mangrove.latest_extent_year, persistence_years: b.mangrove.persistence_years, anchors_years: [0, 5, 15, 30] },
      extent: { countries_with_mangroves: b.mangrove.countries_with_mangroves, denominator: b.mangrove.global_country_denominator, normalized_value: round(b.mangrove.countries_with_mangroves / b.mangrove.global_country_denominator) }
    },
    transformations: [
      { type: 'documented_mangrove_subset', formula: 'Use the quantified mangrove carbon-stock reduction as a non-additive observed subset of blue-carbon habitat loss.' },
      { type: 'damage_range_midpoint', formula: 'Normalize the midpoint of the source damage range while retaining both bounds.' },
      { type: 'fixed_assessment_duration', formula: 'Use the 1996-2020 habitat-change interval.' },
      { type: 'country_extent', formula: 'Divide countries with mangroves by the source denominator.' }
    ],
    sourceId: 'unep_blue_ecosystems_global_assessments', snapshot: blue, snapshotPath: BLUE_PATH,
    passed: 'UNEP quantifies observed mangrove-area and carbon-stock loss, associated annual damage, persistence and global country extent as a bounded blue-carbon subset.',
    failures: ['No current global annual harmonized inventory covers mangroves, seagrasses and salt marshes together.', 'Habitat areas and carbon stocks are not added across incompatible assessments.']
  }),
  receipt({
    nodeId: 'estuarine_nursery_loss',
    asOf: b.seagrass.assessment_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(b.seagrass.historical_area_lost_pct_approx, [0, 5, 20, 40], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(b.seagrass.largest_fisheries_with_nursery_dependence_pct, [0, 5, 15, 30], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(b.seagrass.persistence_years, [0, 20, 50, 100], 'higher_is_worse')),
      extent: round(b.seagrass.countries_with_seagrass / b.seagrass.global_country_denominator)
    },
    rawInputs: {
      biophysical_burden: { seagrass_historical_area_lost_pct: b.seagrass.historical_area_lost_pct_approx, anchors_pct: [0, 5, 20, 40], boundary: 'Seagrass nursery habitat is a quantified subset; the score does not claim equivalent loss in every estuary.' },
      human_economic_burden: { largest_fisheries_with_seagrass_nursery_dependence_pct: b.seagrass.largest_fisheries_with_nursery_dependence_pct, anchors_pct: [0, 5, 15, 30], boundary: 'Nursery dependence is exposed fisheries scope, not realized catch loss.' },
      persistence: { observed_decline_start_year: b.seagrass.observed_decline_start_year, assessment_year: b.seagrass.assessment_year, persistence_years: b.seagrass.persistence_years, anchors_years: [0, 20, 50, 100] },
      extent: { countries_with_seagrass: b.seagrass.countries_with_seagrass, denominator: b.seagrass.global_country_denominator, normalized_value: round(b.seagrass.countries_with_seagrass / b.seagrass.global_country_denominator) }
    },
    transformations: [
      { type: 'documented_seagrass_nursery_subset', formula: 'Use observed seagrass habitat loss as a bounded subset of estuarine and coastal nursery loss.' },
      { type: 'fisheries_dependence_exposure', formula: 'Normalize the source-reported share of major fisheries supported by seagrass nurseries without relabeling it as realized loss.' },
      { type: 'source_reported_decline_duration', formula: 'Use the 1930-2025 assessment interval.' },
      { type: 'country_extent', formula: 'Divide countries with seagrass by the source denominator.' }
    ],
    sourceId: 'unep_blue_ecosystems_global_assessments', snapshot: blue, snapshotPath: BLUE_PATH,
    passed: 'UNEP quantifies historical seagrass nursery-habitat loss, fisheries dependence, multi-decade persistence and country extent.',
    failures: ['No current harmonized global annual estuary recruitment panel supplies magnitude plus threshold or momentum.', 'The evidence is explicitly a seagrass nursery subset rather than a total-estuary estimate.']
  }),
  receipt({
    nodeId: 'shelf_sea_hypoxia',
    asOf: n.review_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(n.coastal_areas_impacted_by_eutrophication_lower_bound, [0, 100, 300, 600], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(n.fisheries_dependent_on_estuarine_and_nearshore_habitat_pct, [0, 20, 60, 100], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(n.dead_zone_inventory_growth_period_years, [0, 10, 30, 60], 'higher_is_worse')),
      extent: n.global_extent_normalized
    },
    rawInputs: {
      biophysical_burden: { coastal_eutrophication_areas_lower_bound: n.coastal_areas_impacted_by_eutrophication_lower_bound, dead_zone_sites_2008: n.documented_dead_zones_2008, anchors_site_count: [0, 100, 300, 600], boundary: 'Global monitored coastal and shelf inventory lower bound; site count is not converted to area.' },
      human_economic_burden: { fisheries_nearshore_habitat_dependence_pct_lower_bound: n.fisheries_dependent_on_estuarine_and_nearshore_habitat_pct, anchors_pct: [0, 20, 60, 100], boundary: 'Exposed fisheries-system dependence, not realized attributable loss.' },
      persistence: { comparison_start_year: 1960, comparison_end_year: 2008, comparison_years: n.dead_zone_inventory_growth_period_years, anchors_years: [0, 10, 30, 60] },
      extent: { geographic_scope: n.geographic_scope, normalized_value: n.global_extent_normalized }
    },
    transformations: [
      { type: 'global_site_inventory_lower_bound', formula: 'Normalize the monitored coastal and shelf hypoxia inventory without converting sites to area.' },
      { type: 'fisheries_dependence_exposure', formula: 'Normalize nearshore fisheries dependence without treating it as realized loss.' },
      { type: 'fixed_inventory_duration', formula: 'Retain the 1960-2008 inventory comparison.' },
      { type: 'global_assessment_extent', formula: 'Use the source-declared worldwide coastal-system scope.' }
    ],
    sourceId: 'unep_global_nutrient_pollution_impact', snapshot: nutrient, snapshotPath: NUTRIENT_PATH,
    passed: 'UNEP quantifies a worldwide coastal and shelf low-oxygen inventory, fisheries-system exposure, multi-decade accumulation and global scope.',
    failures: ['The operational NOAA survey is regional and cannot provide a current global shelf aggregation.', 'Monitoring-dependent site inventories do not form a complete 20-year annual global observation panel.']
  })
];

for (const item of receipts) {
  const verification = verifyTulipUrgencyReceipt(item);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${item.node_id}: ${verification.errors.join('; ')}`);
}

const registry = {
  version: '1.0.0', method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_30_existing_global_assessment_extensions',
  generated_at: new Date().toISOString(), promoted_node_count: receipts.length, receipts
};
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-30.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-30.json', promoted_node_count: receipts.length, receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
