import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OXYGEN_PATH = 'public/ioc-global-ocean-oxygen-impact-snapshot.json';
const AIR_PATH = 'public/who-air-pollution-impact-snapshot.json';
const BLUE_PATH = 'public/unep-blue-ecosystems-impact-snapshot.json';
const [oxygen, air, blue] = await Promise.all([OXYGEN_PATH, AIR_PATH, BLUE_PATH].map(async file => JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'))));
const o = oxygen.assessment;
const a = air.assessment;
const m = blue.assessments.mangrove;
const round = (value, digits = 6) => Number(value.toFixed(digits));

function receipt({ nodeId, asOf, components, rawInputs, transformations, sourceId, snapshot, snapshotPath, passed, failures }) {
  return buildTulipUrgencyReceipt({
    node_id: nodeId, method: 'impact_fallback', as_of: String(asOf), components,
    raw_inputs: { ...rawInputs, source_snapshot: { path: snapshotPath, version: snapshot.version, captured_at: snapshot.captured_at, excluded_from_scoring: snapshot.excluded_from_scoring || [] } },
    transformations, source_ids: [sourceId], uncertainty: snapshot.uncertainty,
    freshness: `Reviewed global assessment snapshot captured ${snapshot.captured_at}.`,
    selection_reason: { selected_method_passed: passed, higher_priority_failures: failures }
  });
}

const oceanPersistenceYears = o.assessment_year - o.comparison_start_decade;
const mangroveDamageMidpoint = (m.estimated_annual_economic_damage_usd_billion_low + m.estimated_annual_economic_damage_usd_billion_high) / 2;
const receipts = [
  receipt({
    nodeId: 'oceanic_deoxygenation', asOf: o.assessment_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(o.low_oxygen_open_ocean_area_increase_million_km2, [0, 0.5, 2, 5], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(o.ocean_dependent_livelihoods_million_lower_bound, [0, 50, 250, 750], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(oceanPersistenceYears, [0, 10, 30, 70], 'higher_is_worse')),
      extent: o.global_extent_normalized
    },
    rawInputs: {
      biophysical_burden: { open_ocean_low_oxygen_area_increase_million_km2: o.low_oxygen_open_ocean_area_increase_million_km2, anchors_million_km2: [0, 0.5, 2, 5], boundary: 'Observed increase in low-oxygen open-ocean area; coastal site counts are not added.' },
      human_economic_burden: { ocean_dependent_livelihoods_million_lower_bound: o.ocean_dependent_livelihoods_million_lower_bound, anchors_million_people: [0, 50, 250, 750], boundary: 'Exposed ocean-service livelihood scope, not harm attributed specifically to oxygen loss.' },
      persistence: { comparison_start_decade: o.comparison_start_decade, assessment_year: o.assessment_year, persistence_years: oceanPersistenceYears, anchors_years: [0, 10, 30, 70] },
      extent: { geographic_scope: o.geographic_scope, normalized_value: o.global_extent_normalized }
    },
    transformations: [
      { type: 'observed_open_ocean_area_increase', formula: 'Normalize the source-reported 4.5 million km2 expansion without adding coastal site counts.' },
      { type: 'bounded_ocean_service_exposure', formula: 'Normalize a source-reported lower bound on ocean-dependent livelihoods without treating exposure as realized deoxygenation loss.' },
      { type: 'fixed_multi_decade_duration', formula: 'Use the 1960-2025 assessment span.' },
      { type: 'global_ocean_extent', formula: 'Use the source-declared global open-ocean scope.' }
    ],
    sourceId: 'ioc_unesco_global_ocean_oxygen_network', snapshot: oxygen, snapshotPath: OXYGEN_PATH,
    passed: 'IOC-UNESCO quantifies accumulated low-oxygen open-ocean area expansion, ocean-service livelihood exposure, multi-decade persistence and global extent.',
    failures: ['No complete current global dissolved-oxygen panel supplies magnitude plus threshold or momentum under a single observation method.', 'Coastal and open-ocean measurements remain separate, so the assessment is impact fallback rather than current data.']
  }),
  receipt({
    nodeId: 'ambient_air_quality_deficit', asOf: a.latest_portal_update_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(a.global_population_above_who_guideline_pct, [0, 25, 75, 100], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(a.ambient_air_pollution_deaths_million_2019, [0, 0.5, 2, 5], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(a.persistence_years, [0, 1, 3, 10], 'higher_is_worse')),
      extent: 1
    },
    rawInputs: {
      biophysical_burden: { global_population_above_who_air_quality_guidelines_pct: a.global_population_above_who_guideline_pct, anchors_pct: [0, 25, 75, 100], boundary: 'Population exposure above WHO guideline levels; pollutant-specific concentrations remain separate.' },
      human_economic_burden: { ambient_air_pollution_deaths_million_2019: a.ambient_air_pollution_deaths_million_2019, anchors_million_deaths: [0, 0.5, 2, 5], boundary: 'Ambient-only mortality; household-air-pollution deaths are not added.' },
      persistence: { reference_start_year: a.persistence_reference_start_year, update_year: a.latest_portal_update_year, persistence_years: a.persistence_years, anchors_years: [0, 1, 3, 10] },
      extent: { geographic_scope: 'global population and WHO member reporting context', normalized_value: 1 }
    },
    transformations: [
      { type: 'guideline_exposure_share', formula: 'Normalize the source-reported global population share above WHO air-quality guideline levels.' },
      { type: 'ambient_only_mortality', formula: 'Normalize ambient-air mortality without adding overlapping household exposure.' },
      { type: 'fixed_assessment_persistence', formula: 'Retain the 2019-2025 reviewed assessment interval.' },
      { type: 'global_population_extent', formula: 'Use the WHO global population aggregation.' }
    ],
    sourceId: 'who_global_air_pollution_data_portal', snapshot: air, snapshotPath: AIR_PATH,
    passed: 'WHO quantifies global guideline exceedance exposure, ambient-air attributable mortality, repeated multi-year burden and worldwide scope.',
    failures: ['The source does not provide a complete 20-year annual global exceedance-day panel by pollutant.', 'Population exposure and comparative-risk mortality are assessment evidence rather than a current concentration series.']
  }),
  receipt({
    nodeId: 'tidal_wetland_carbon_reversal', asOf: m.latest_extent_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(m.carbon_stock_reduction_megatonnes_carbon, [0, 25, 75, 150], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(mangroveDamageMidpoint, [0, 5, 15, 40], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(m.persistence_years, [0, 5, 15, 30], 'higher_is_worse')),
      extent: round(m.countries_with_mangroves / m.global_country_denominator)
    },
    rawInputs: {
      biophysical_burden: { mangrove_carbon_stock_reduction_megatonnes_carbon: m.carbon_stock_reduction_megatonnes_carbon, net_area_loss_km2: m.net_area_loss_km2, anchors_megatonnes_carbon: [0, 25, 75, 150], boundary: 'Observed mangrove subset; no emissions factor is applied to unmeasured tidal wetlands.' },
      human_economic_burden: { annual_damage_range_usd_billion: [m.estimated_annual_economic_damage_usd_billion_low, m.estimated_annual_economic_damage_usd_billion_high], midpoint_usd_billion: mangroveDamageMidpoint, anchors_usd_billion: [0, 5, 15, 40] },
      persistence: { baseline_year: m.baseline_year, latest_extent_year: m.latest_extent_year, persistence_years: m.persistence_years, anchors_years: [0, 5, 15, 30] },
      extent: { countries_with_mangroves: m.countries_with_mangroves, denominator: m.global_country_denominator, normalized_value: round(m.countries_with_mangroves / m.global_country_denominator) }
    },
    transformations: [
      { type: 'documented_mangrove_carbon_subset', formula: 'Use the observed mangrove carbon-stock reduction as a bounded subset of tidal-wetland carbon reversal.' },
      { type: 'damage_range_midpoint', formula: 'Normalize the midpoint of the source damage range while retaining both bounds.' },
      { type: 'fixed_assessment_duration', formula: 'Use the 1996-2020 habitat and stock-change interval.' },
      { type: 'country_extent', formula: 'Divide mangrove countries by the source denominator.' }
    ],
    sourceId: 'unep_blue_ecosystems_global_assessments', snapshot: blue, snapshotPath: BLUE_PATH,
    passed: 'UNEP quantifies observed mangrove carbon-stock reduction, associated annual damage, multi-decade persistence and global country extent as a tidal-wetland subset.',
    failures: ['No current annual global tidal-wetland greenhouse-gas balance spans all habitat classes.', 'Mangrove, seagrass and salt-marsh stocks are not added across incompatible methods.']
  })
];

for (const item of receipts) {
  const verification = verifyTulipUrgencyReceipt(item);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${item.node_id}: ${verification.errors.join('; ')}`);
}
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_31_ocean_air_tidal_extensions', generated_at: new Date().toISOString(), promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-31.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-31.json', promoted_node_count: receipts.length, receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
