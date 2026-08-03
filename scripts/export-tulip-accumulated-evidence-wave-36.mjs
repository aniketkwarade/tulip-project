import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const IPCC_PATH = 'public/ipcc-global-cryosphere-impact-snapshot.json';
const GLACIER_PATH = 'public/wmo-unesco-glacier-water-impact-snapshot.json';
const [ipcc, glacier] = await Promise.all([IPCC_PATH, GLACIER_PATH].map(async file => JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'))));
const a = ipcc.assessment;
const g = glacier.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));
const normalize = (value, anchors) => round(normalizeWithAnchors(value, anchors, 'higher_is_worse'));

function receipt({ nodeId, components, rawInputs, transformations, sourceIds, snapshotPaths, uncertainty, passed, failures, asOf }) {
  const item = buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(asOf),
    components,
    raw_inputs: { ...rawInputs, source_snapshots: snapshotPaths },
    transformations,
    source_ids: sourceIds,
    uncertainty,
    freshness: `Reviewed global assessment snapshot; latest quantitative observation period ends ${asOf}.`,
    selection_reason: { selected_method_passed: passed, higher_priority_failures: failures }
  });
  if (!verifyTulipUrgencyReceipt(item).valid) throw new Error(`Receipt verification failed for ${nodeId}.`);
  return item;
}

const sharedSnowComponents = {
  biophysical_burden: normalize(a.mountain_snow_cover_duration_decline_days_per_decade, [0, 1, 3, 7]),
  human_economic_burden: normalize(a.arctic_and_high_mountain_population_million_approx, [0, 100, 400, 800]),
  persistence: normalize(a.arctic_snow_observed_end_year - a.mountain_snow_observed_start_year_approx, [0, 10, 30, 70]),
  extent: 1
};
const snowRaw = {
  biophysical_burden: { observed_mountain_snow_cover_duration_decline_days_per_decade: a.mountain_snow_cover_duration_decline_days_per_decade, likely_range: [a.mountain_snow_cover_duration_decline_likely_low, a.mountain_snow_cover_duration_decline_likely_high], anchors_days_per_decade: [0, 1, 3, 7] },
  human_economic_burden: { arctic_and_high_mountain_population_million_approx: a.arctic_and_high_mountain_population_million_approx, anchors_million_people: [0, 100, 400, 800] },
  persistence: { approximate_start_year: a.mountain_snow_observed_start_year_approx, assessment_end_year: a.arctic_snow_observed_end_year, anchors_years: [0, 10, 30, 70] },
  extent: { geography: 'IPCC global high-mountain synthesis across assessed mountain regions', normalized_value: 1 }
};
const snowTransformations = [
  { type: 'observed_snow_duration_loss', formula: 'Normalize the IPCC source-reported average lower-elevation mountain snow-cover duration decline; preserve the 0-10 day likely range.' },
  { type: 'cryosphere_population_scope', formula: 'Normalize the approximate population living in the Arctic and high mountains without treating every person as directly harmed.' },
  { type: 'minimum_observed_persistence', formula: 'Use the interval from the approximate mid-century observation start through the IPCC Arctic snow assessment end.' },
  { type: 'global_assessment_extent', formula: 'Assign full assessment extent for the IPCC global high-mountain synthesis, not for every grid cell.' }
];
const snowNodes = ['snowmelt_timing_shift', 'alpine_snowpack_declines', 'snow_drought'];
const receipts = [
  receipt({
    nodeId: 'permafrost_thaw', asOf: a.permafrost_change_end_year,
    components: {
      biophysical_burden: normalize(a.permafrost_temperature_change_c, [0, 0.1, 0.2, 0.4]),
      human_economic_burden: normalize(a.arctic_and_high_mountain_population_million_approx, [0, 100, 400, 800]),
      persistence: normalize(a.permafrost_change_end_year - a.permafrost_change_start_year, [0, 2, 5, 12]),
      extent: normalize(a.arctic_permafrost_global_soil_area_share_pct, [0, 3, 8, 18])
    },
    rawInputs: {
      biophysical_burden: { observed_global_permafrost_temperature_change_c: a.permafrost_temperature_change_c, uncertainty_c: a.permafrost_temperature_uncertainty_c, anchors_c: [0, 0.1, 0.2, 0.4] },
      human_economic_burden: { arctic_and_high_mountain_population_million_approx: a.arctic_and_high_mountain_population_million_approx, anchors_million_people: [0, 100, 400, 800] },
      persistence: { start_year: a.permafrost_change_start_year, end_year: a.permafrost_change_end_year, anchors_years: [0, 2, 5, 12] },
      extent: { northern_permafrost_share_of_global_soil_area_pct: a.arctic_permafrost_global_soil_area_share_pct, anchors_pct: [0, 3, 8, 18] }
    },
    transformations: [
      { type: 'observed_permafrost_warming', formula: 'Normalize the assessed global polar and high-mountain permafrost temperature increase without subtracting its uncertainty bound.' },
      { type: 'exposed_cryosphere_population_scope', formula: 'Use the IPCC Arctic and high-mountain population only as exposed scope.' },
      { type: 'observed_period', formula: 'Use the source 2007-2016 interval.' },
      { type: 'permafrost_area_extent', formula: 'Normalize the source-reported share of global soil area in the northern circumpolar permafrost region.' }
    ],
    sourceIds: [ipcc.source.id], snapshotPaths: [{ path: IPCC_PATH, version: ipcc.version, captured_at: ipcc.captured_at }], uncertainty: ipcc.uncertainty,
    passed: 'IPCC quantifies observed global permafrost warming, its period, exposed cryosphere population and circumpolar area.',
    failures: ['No current global active-layer series supplies all current-data components under one method-comparable annual product.']
  }),
  ...snowNodes.map(nodeId => receipt({
    nodeId, asOf: a.arctic_snow_observed_end_year, components: sharedSnowComponents, rawInputs: snowRaw, transformations: snowTransformations,
    sourceIds: [ipcc.source.id], snapshotPaths: [{ path: IPCC_PATH, version: ipcc.version, captured_at: ipcc.captured_at }], uncertainty: ipcc.uncertainty,
    passed: 'IPCC quantifies persistent observed mountain snow-duration loss, a global cryosphere-dependent population and multi-region extent.',
    failures: ['The assessment does not provide a complete current global annual series for node-specific snowmelt timing or snow-water-equivalent deficit.']
  })),
  receipt({
    nodeId: 'peak_glacier_runoff_passage', asOf: g.water_report_year,
    components: {
      biophysical_burden: normalize(g.global_glacier_mass_loss_gt, [0, 100, 300, 600]),
      human_economic_burden: normalize(g.people_relying_on_glacier_and_snow_melt_billion_lower_bound, [0, 0.25, 1, 2.5]),
      persistence: normalize(g.consecutive_all_region_loss_years, [0, 1, 2, 4]),
      extent: round(g.glaciated_regions_with_loss / g.glaciated_regions_assessed)
    },
    rawInputs: {
      biophysical_burden: { global_glacier_mass_loss_gt: g.global_glacier_mass_loss_gt, small_glacier_region_peak_water_status: g.small_glacier_region_peak_water_status, anchors_gt: [0, 100, 300, 600] },
      human_economic_burden: { people_relying_on_glacier_and_snow_melt_billion_lower_bound: g.people_relying_on_glacier_and_snow_melt_billion_lower_bound, anchors_billion_people: [0, 0.25, 1, 2.5] },
      persistence: { consecutive_all_region_loss_years: g.consecutive_all_region_loss_years, anchors_years: [0, 1, 2, 4] },
      extent: { glaciated_regions_with_loss: g.glaciated_regions_with_loss, glaciated_regions_assessed: g.glaciated_regions_assessed }
    },
    transformations: [
      { type: 'global_glacier_loss_burden', formula: 'Normalize WMO global glacier mass loss while retaining the separate assessment that most smaller-glacier regions likely passed peak water.' },
      { type: 'meltwater_dependence_scope', formula: 'Normalize the lower-bound population relying on glacier and snow melt; do not relabel it as observed shortage.' },
      { type: 'consecutive_loss_persistence', formula: 'Use the source-reported consecutive years in which all assessed glaciated regions lost mass.' },
      { type: 'regional_extent', formula: 'Divide glaciated regions with loss by all assessed glaciated regions.' }
    ],
    sourceIds: [glacier.source.id], snapshotPaths: [{ path: GLACIER_PATH, version: glacier.version, captured_at: glacier.captured_at }], uncertainty: glacier.uncertainty,
    passed: 'WMO and UNESCO quantify global glacier loss, all-region persistence, meltwater-dependent population and the current assessment that most smaller-glacier regions likely passed peak water.',
    failures: ['No basin-complete annual global runoff series supports a current-data score.']
  })
];

const sootNodes = ['soot_deposition_on_snow', 'snowpack_dust_soot_coverage'];
for (const nodeId of sootNodes) receipts.push(receipt({
  nodeId, asOf: a.publication_years.at(-1),
  components: {
    biophysical_burden: normalize(a.present_land_snow_black_carbon_and_dust_radiative_effect_w_m2, [0, 0.02, 0.05, 0.1]),
    human_economic_burden: normalize(a.arctic_and_high_mountain_population_million_approx, [0, 100, 400, 800]),
    persistence: normalize(a.publication_years.at(-1) - 1850, [0, 25, 100, 200]),
    extent: 1
  },
  rawInputs: {
    biophysical_burden: { present_land_snow_black_carbon_and_dust_radiative_effect_w_m2: a.present_land_snow_black_carbon_and_dust_radiative_effect_w_m2, seasonal_snow_and_sea_ice_black_carbon_direct_forcing_w_m2: a.black_carbon_seasonal_snow_and_sea_ice_direct_forcing_w_m2, anchors_w_m2: [0, 0.02, 0.05, 0.1] },
    human_economic_burden: { arctic_and_high_mountain_population_million_approx: a.arctic_and_high_mountain_population_million_approx, anchors_million_people: [0, 100, 400, 800] },
    persistence: { reference_year: 1850, assessment_year: a.publication_years.at(-1), anchors_years: [0, 25, 100, 200] },
    extent: { geography: 'IPCC global forcing assessment for seasonal snow and sea ice', normalized_value: 1 }
  },
  transformations: [
    { type: 'snow_darkening_radiative_effect', formula: 'Normalize the combined present-day black-carbon and dust land-snow radiative effect; retain the black-carbon-only forcing separately and do not add them.' },
    { type: 'cryosphere_population_scope', formula: 'Normalize population living in close contact with Arctic and high-mountain cryosphere.' },
    { type: 'industrial_era_persistence', formula: 'Use the assessment span from the stated 1850 comparison to the latest IPCC assessment year.' },
    { type: 'global_forcing_extent', formula: 'Assign full extent only to the source global seasonal-snow and sea-ice forcing assessment.' }
  ],
  sourceIds: [ipcc.source.id], snapshotPaths: [{ path: IPCC_PATH, version: ipcc.version, captured_at: ipcc.captured_at }], uncertainty: ipcc.uncertainty,
  passed: 'IPCC quantifies present-day snow-darkening radiative effects, global seasonal-snow and sea-ice scope, persistence and cryosphere-dependent population.',
  failures: ['No 20-year globally complete deposition-flux or snow-cover-fraction series is bound to this node.']
}));

receipts.push(receipt({
  nodeId: 'ice_albedo_feedback_loops', asOf: a.arctic_snow_observed_end_year,
  components: {
    biophysical_burden: normalize(a.arctic_june_snow_cover_decline_pct_per_decade, [0, 2, 7, 15]),
    human_economic_burden: normalize(a.arctic_and_high_mountain_population_million_approx, [0, 100, 400, 800]),
    persistence: normalize(a.arctic_snow_observed_end_year - a.arctic_snow_observed_start_year, [0, 10, 30, 60]),
    extent: normalize(a.arctic_permafrost_global_soil_area_share_pct, [0, 3, 8, 18])
  },
  rawInputs: {
    biophysical_burden: { arctic_june_snow_cover_decline_pct_per_decade: a.arctic_june_snow_cover_decline_pct_per_decade, uncertainty_pct_per_decade: a.arctic_june_snow_cover_decline_uncertainty_pct_per_decade, snow_and_sea_ice_black_carbon_forcing_w_m2: a.black_carbon_seasonal_snow_and_sea_ice_direct_forcing_w_m2, anchors_pct_per_decade: [0, 2, 7, 15] },
    human_economic_burden: { arctic_and_high_mountain_population_million_approx: a.arctic_and_high_mountain_population_million_approx, anchors_million_people: [0, 100, 400, 800] },
    persistence: { start_year: a.arctic_snow_observed_start_year, end_year: a.arctic_snow_observed_end_year, anchors_years: [0, 10, 30, 60] },
    extent: { northern_permafrost_global_soil_area_share_pct_as_bounded_arctic_land_scope: a.arctic_permafrost_global_soil_area_share_pct, anchors_pct: [0, 3, 8, 18] }
  },
  transformations: [
    { type: 'observed_arctic_snow_loss', formula: 'Normalize the observed June Arctic snow-cover decline and retain its uncertainty.' },
    { type: 'feedback_support', formula: 'Retain the separately assessed snow-and-sea-ice black-carbon forcing as quantitative support; do not add it to the snow-loss rate.' },
    { type: 'observed_persistence', formula: 'Use the source 1967-2018 Arctic snow-cover interval.' },
    { type: 'bounded_arctic_extent', formula: 'Normalize the northern permafrost soil-area share as a conservative Arctic land scope, not as global ice area.' }
  ],
  sourceIds: [ipcc.source.id], snapshotPaths: [{ path: IPCC_PATH, version: ipcc.version, captured_at: ipcc.captured_at }], uncertainty: ipcc.uncertainty,
  passed: 'IPCC quantifies persistent Arctic snow-cover loss, a separately assessed light-absorbing-particle forcing, cryosphere-dependent population and bounded Arctic extent.',
  failures: ['No complete global annual albedo-and-absorbed-shortwave series supplies the current-data coverage gate.']
}));

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_36_ipcc_global_cryosphere', generated_at: new Date().toISOString(), promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-36.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-36.json', receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
