import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildTulipUrgencyReceipt,
  normalizeWithAnchors,
  qualifiesForImpactFallback,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-remaining-cohort-impact-snapshot.json';
const FISHERY_PATH = 'public/fao-fishery-protein-impact-snapshot.json';
const [snapshot, fishery] = await Promise.all([SNAPSHOT_PATH, FISHERY_PATH].map(async relativePath => (
  JSON.parse(await fs.readFile(path.join(ROOT, relativePath), 'utf8'))
)));
const round = value => Number(value.toFixed(6));
const n = (value, anchors) => round(normalizeWithAnchors(value, anchors, 'higher_is_worse'));

function make(nodeId, asOf, components, rawInputs, sourceIds, boundary) {
  const candidate = { quantitative_evidence: true, components };
  if (!qualifiesForImpactFallback(candidate)) throw new Error(`${nodeId}: impact fallback gate failed`);
  const receipt = buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(asOf),
    components,
    raw_inputs: {
      ...rawInputs,
      evidence_boundary: boundary,
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at
      }
    },
    transformations: [
      { type: 'documented_anchor_normalization', formula: 'Normalize each retained quantitative burden against declared four-point anchors and clamp to [0,1].' },
      { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' },
      { type: 'boundary_preservation', formula: 'Keep exposure, effect size, observed change, ecosystem-service value and geographic coverage distinct; missing values never become zero.' }
    ],
    source_ids: sourceIds,
    uncertainty: `${snapshot.uncertainty} ${boundary}`,
    freshness: `Latest reviewed global or multicountry assessment through ${asOf}.`,
    selection_reason: {
      selected_method_passed: 'Quantitative accumulated biophysical and human/economic burdens, persistence and broad extent pass the impact-fallback gate.',
      higher_priority_failures: ['No complete current global observation supplies magnitude plus threshold or momentum with at least 60% current-component coverage for this exact node.']
    }
  });
  const check = verifyTulipUrgencyReceipt(receipt);
  if (!check.valid) throw new Error(`${nodeId}: receipt verification failed`);
  return receipt;
}

const a = snapshot.assessments;
const marineInputs = {
  ...a.marine_redistribution,
  fao_consumption_year: fishery.assessment.latest_consumption_year,
  aquatic_food_dependence_billion: fishery.assessment.people_receiving_at_least_20pct_animal_protein_billion,
  fishery_source_snapshot: {
    path: FISHERY_PATH,
    version: fishery.version,
    captured_at: fishery.captured_at
  }
};
const marineComponents = {
  biophysical_burden: n(a.marine_redistribution.observed_distribution_shift_km_per_decade, [0, 10, 40, 100]),
  human_economic_burden: n(fishery.assessment.people_receiving_at_least_20pct_animal_protein_billion, [0, 0.5, 2, 4]),
  persistence: n(a.marine_redistribution.observed_change_window_years, [0, 10, 30, 60]),
  extent: a.marine_redistribution.global_extent
};

const receipts = [
  make('pelagic_species_redistribution', a.marine_redistribution.assessment_year, marineComponents, marineInputs,
    ['ipcc_ar6_wgii_ocean_coastal_ecosystems', 'fao_the_state_of_world_fisheries_and_aquaculture_2024'],
    'The 72 km per decade assessment is a cross-taxa observed distribution response, not a census of every pelagic stock; FAO protein dependence quantifies the exposed food system without attributing all dependence losses to redistribution.'),
  make('fisheries_range_redistribution', a.marine_redistribution.assessment_year, marineComponents, marineInputs,
    ['cheung_global_fisheries_catch_warming_2013', 'ipcc_ar6_wgii_ocean_coastal_ecosystems', 'fao_the_state_of_world_fisheries_and_aquaculture_2024'],
    'The global catch-temperature and range-shift signals quantify redistribution across major marine ecosystems; they do not attribute every landing change to warming.'),
  make('kelp_forest_collapse', a.kelp_forest_change.assessment_year,
    {
      biophysical_burden: n(a.kelp_forest_change.ecoregions_with_declines_pct, [0, 10, 25, 50]),
      human_economic_burden: n(a.kelp_forest_change.annual_ecosystem_service_value_usd_billion, [0, 50, 250, 600]),
      persistence: n(a.kelp_forest_change.assessed_change_window_years, [0, 10, 30, 60]),
      extent: a.kelp_forest_change.global_extent
    }, a.kelp_forest_change,
    ['krumhansl_global_kelp_change_2016', 'eger_global_kelp_services_2023'],
    'Declines occur in 38% of assessed ecoregions while other regions are stable or increasing; the score does not relabel all global kelp as collapsed or count the full service value as realized loss.'),
  ...['smoke_exposure_burden', 'wildfire_smoke_pm25_exposure'].map(nodeId => make(nodeId, a.landscape_fire_smoke.assessment_year,
    {
      biophysical_burden: n(a.landscape_fire_smoke.people_exposed_annually_billion, [0, 0.25, 1, 2.5]),
      human_economic_burden: n(a.landscape_fire_smoke.annual_all_cause_deaths_million, [0, 0.1, 0.75, 2]),
      persistence: n(a.landscape_fire_smoke.observation_end_year - a.landscape_fire_smoke.observation_start_year + 1, [0, 5, 15, 30]),
      extent: a.landscape_fire_smoke.global_extent
    }, a.landscape_fire_smoke,
    ['lancet_landscape_fire_mortality_2000_2019'],
    `Global landscape-fire PM2.5 and ozone exposure supports ${nodeId}; attributable mortality is model-estimated and PM2.5 and ozone shares remain separate.`)),
  make('wildfire_smoke_exposure_duration', a.wildfire_smoke_duration.assessment_year,
    {
      biophysical_burden: n(a.wildfire_smoke_duration.current_average_days_above_who_15ug_m3, [0, 0.25, 1, 5]),
      human_economic_burden: n(a.landscape_fire_smoke.people_exposed_annually_billion, [0, 0.25, 1, 2.5]),
      persistence: n(21, [0, 5, 15, 30]),
      extent: a.wildfire_smoke_duration.global_extent
    }, { ...a.wildfire_smoke_duration, people_exposed_annually_billion: a.landscape_fire_smoke.people_exposed_annually_billion },
    ['lancet_countdown_wildfire_smoke_2024', 'lancet_landscape_fire_mortality_2000_2019'],
    'The retained duration is the global average number of days above the WHO daily PM2.5 threshold, not the duration experienced by every person or locality.'),
  make('wildfire_smoke_hospitalization_burden', a.wildfire_hospitalization.assessment_year,
    {
      biophysical_burden: n((a.wildfire_hospitalization.respiratory_hospital_admission_relative_risk_per_10ug_m3_pm25 - 1) * 100, [0, 1, 3, 8]),
      human_economic_burden: n(a.wildfire_hospitalization.patients_in_meta_analysis_million, [0, 10, 50, 150]),
      persistence: n(a.wildfire_hospitalization.literature_end_year - a.wildfire_hospitalization.literature_start_year + 1, [0, 5, 15, 30]),
      extent: a.wildfire_hospitalization.global_extent
    }, a.wildfire_hospitalization,
    ['wildfire_hospitalization_meta_analysis_2025'],
    'The pooled relative risk is an effect per 10 µg/m³ wildfire PM2.5 increment across the included studies, not a global count of admissions or a uniform local effect.'),
  make('thermokarst_expansion', a.abrupt_permafrost_thaw.assessment_year,
    {
      biophysical_burden: n(a.abrupt_permafrost_thaw.arctic_land_permafrost_vulnerable_to_abrupt_thaw_pct, [0, 5, 15, 30]),
      human_economic_burden: n(a.abrupt_permafrost_thaw.arctic_infrastructure_in_thaw_risk_regions_by_2050_pct, [0, 20, 50, 80]),
      persistence: n(a.abrupt_permafrost_thaw.projection_horizon_year - a.abrupt_permafrost_thaw.assessment_year, [0, 10, 50, 100]),
      extent: a.abrupt_permafrost_thaw.global_extent
    }, a.abrupt_permafrost_thaw,
    ['ipcc_srocc_ar6_global_cryosphere_assessment'],
    'Abrupt-thaw vulnerability and projected lake-area growth quantify the circumpolar thermokarst burden; projections are not relabeled as already realized area.'),
  make('polar_infrastructure_failure', a.abrupt_permafrost_thaw.assessment_year,
    {
      biophysical_burden: n(a.abrupt_permafrost_thaw.arctic_land_permafrost_vulnerable_to_abrupt_thaw_pct, [0, 5, 15, 30]),
      human_economic_burden: n(a.abrupt_permafrost_thaw.arctic_infrastructure_in_thaw_risk_regions_by_2050_pct, [0, 20, 50, 80]),
      persistence: n(2050 - a.abrupt_permafrost_thaw.assessment_year, [0, 10, 20, 40]),
      extent: a.abrupt_permafrost_thaw.global_extent
    }, a.abrupt_permafrost_thaw,
    ['ipcc_srocc_ar6_global_cryosphere_assessment'],
    'The 70% figure is infrastructure located in regions at risk by 2050, not a prediction that 70% of assets will fail.'),
  make('urban_heat_island', a.urban_heat_island.assessment_year,
    {
      biophysical_burden: n(a.urban_heat_island.urban_patches_assessed, [0, 1000, 5000, 10000]),
      human_economic_burden: n(a.urban_heat_island.global_population_facing_over_10pct_heat_risk_increase_pct, [0, 0.5, 2, 5]),
      persistence: n(a.urban_heat_island.observation_end_year - a.urban_heat_island.observation_start_year + 1, [0, 5, 12, 25]),
      extent: a.urban_heat_island.global_extent
    }, a.urban_heat_island,
    ['global_urban_expansion_uhi_risk_2000_2015'],
    'The study isolates additional heat-related risk associated with urban expansion across 7,554 patches; it is not a global city-level mortality inventory.')
];

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_41_remaining_global_observed_impacts',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH, FISHERY_PATH],
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-41.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-41.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method }))
}, null, 2));
