import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { calculateMethaneGwpStar, METHANE_GWP_STAR_METHOD } from './lib/tulip-methane-gwp-star.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const outDir = resolve(root, 'artifacts/tulip-calibration-2026-09-22');
const json = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const [catalogue, registry, edgar, ceds, cedsIndustrialHeat, cementKilnFuel, ember, faostat, faostatForests, heatMortality, tundraMethane, jonesReference] = await Promise.all([
  json('artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json'),
  json('public/tulip-assessments.json'),
  json('public/edgar-snapshot.json'),
  json('public/ceds-sector-fuel-co2-snapshot.json'),
  json('artifacts/tulip-calibration-2026-09-22/ceds-industrial-heat-reference-snapshot.json'),
  json('artifacts/tulip-calibration-2026-09-22/cement-kiln-fuel-reference-snapshot.json'),
  json('public/ember-global-power-snapshot.json'),
  json('public/faostat-agriculture-snapshot.json'),
  json('artifacts/tulip-calibration-2026-09-22/faostat-forest-conversion-reference-snapshot.json'),
  json('artifacts/tulip-calibration-2026-09-22/heat-mortality-attribution-reference-snapshot.json'),
  json('artifacts/tulip-calibration-2026-09-22/tundra-methane-reference-snapshot.json'),
  json('artifacts/tulip-calibration-2026-09-22/jones-national-warming-reference-snapshot.json'),
]);

const outputJson = resolve(outDir, 'internal-emission-source-allocation.json');
const outputCsv = resolve(outDir, 'internal-emission-source-allocation.csv');
const outputReport = resolve(outDir, 'internal-emission-source-allocation-report.md');
const round = (value, digits = 3) => value == null ? null : Number(value.toFixed(digits));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const TCRE = {
  bestEstimateCPer1000GtCO2: 0.45,
  likelyLowerCPer1000GtCO2: 0.27,
  likelyUpperCPer1000GtCO2: 0.63,
  sourceId: 'ipcc_ar6_wgi_chapter_5_tcre',
};

const methodReferences = [
  {
    id: 'ipcc_ar6_wgi_chapter_5_tcre',
    title: 'IPCC AR6 WGI Chapter 5: Global Carbon and other Biogeochemical Cycles and Feedbacks',
    url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/',
    checkedOn: '2026-09-23',
    admittedUse: 'Screen cumulative net anthropogenic CO2 emissions through the assessed transient climate response to cumulative emissions.',
    finding: 'The assessed best estimate is 0.45 C per 1000 GtCO2, with a likely range of 0.27 to 0.63 C per 1000 GtCO2.',
    excludedUse: 'A temperature contribution is not a human- or ecosystem-harm score and cannot be mapped directly to a TULIP letter.',
  },
  {
    id: 'ipcc_ar6_wgi_chapter_7_emissions_metrics',
    title: 'IPCC AR6 WGI Chapter 7: emissions metrics for short-lived climate forcers',
    url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/',
    checkedOn: '2026-09-23',
    admittedUse: 'Require a time-dependent methane response instead of treating tonnes of CH4 as cumulative CO2.',
    finding: 'Methane has an assessed perturbation lifetime of 11.8 plus or minus 1.8 years; temperature-equivalent metrics depend on the emissions pathway and time horizon.',
    excludedUse: 'GWP100 or another CO2-equivalent number is not used as a terminal-damage conversion or as a universal severity constant.',
  },
  {
    id: 'global_carbon_budget_2025',
    title: 'Global Carbon Budget 2025',
    url: 'https://doi.org/10.5194/essd-18-3211-2026',
    checkedOn: '2026-09-23',
    admittedUse: 'Check fossil, industrial and land-use accounting boundaries and historical cumulative-emissions logic.',
    finding: 'The budget separates fossil and industrial CO2 from net land-use-change CO2; gross fire or clearing estimates are not interchangeable with the net land-use term.',
    excludedUse: 'A gross land-emissions series is not divided by the net land-use total to create a source share.',
  },
  {
    id: 'global_methane_budget_2000_2020',
    title: 'Global Methane Budget 2000-2020',
    url: 'https://doi.org/10.5194/essd-17-1873-2025',
    checkedOn: '2026-09-23',
    admittedUse: 'Check anthropogenic versus natural methane boundaries and the need to reconcile bottom-up inventories with atmospheric inversions.',
    finding: 'The budget reports material source and sink uncertainty and different natural, anthropogenic and mixed source classes.',
    excludedUse: 'Natural tundra flux is not divided by an anthropogenic inventory denominator, and inventory disagreement is not converted into a probability distribution.',
  },
  {
    id: tundraMethane.sources.inverseModel.id,
    title: tundraMethane.sources.inverseModel.title,
    url: tundraMethane.sources.inverseModel.articleUrl,
    checkedOn: '2026-09-23',
    admittedUse: 'Reproduce the 2010–2021 annual Arctic-Boreal methane flow and its wetland, anthropogenic, fire, other-natural and ocean components from the checksum-pinned open NetCDF.',
    finding: 'The broad-domain mean is 45.4 Mt CH4 per year, of which 21.5 Mt is the wetland component; the total trend is not statistically significant over the source period.',
    excludedUse: 'The broad total and wetland component are not identical to methane newly caused by present-day tundra thaw and do not directly set any TULIP harm axis.',
  },
  {
    id: 'edgar_2025_ghg',
    title: 'EDGAR 2025 global greenhouse-gas emissions dataset',
    url: 'https://edgar.jrc.ec.europa.eu/dataset_ghg2025',
    checkedOn: '2026-09-23',
    admittedUse: 'Calculate same-year, same-gas shares for disjoint EDGAR categories and retain source-native mass units.',
    finding: 'EDGAR provides annual sector and country estimates for separate gases; fossil CO2 excludes large-scale biomass burning and LULUCF.',
    excludedUse: 'Inventory shares are not severity, reach or persistence and are never multiplied by an aggregate TULIP score.',
  },
  {
    id: 'jones_national_warming_contributions',
    title: 'National contributions to climate change due to historical emissions of carbon dioxide, methane and nitrous oxide',
    url: 'https://www.nature.com/articles/s41597-023-02041-1',
    checkedOn: '2026-09-23',
    admittedUse: 'Candidate reproducible method for translating historical CO2, CH4 and N2O emissions histories into contributions to global mean surface temperature.',
    finding: 'The published method and open code account for the different behaviour of long-lived CO2 and shorter-lived methane rather than treating annual mass as harm.',
    excludedUse: 'A temperature contribution is a physical intermediate and does not determine current human or ecosystem consequences.',
  },
  {
    id: 'jones_national_warming_contributions_data_1851_2024',
    title: 'National contributions to climate change due to historical emissions of carbon dioxide, methane, and nitrous oxide, 1851-2024',
    url: 'https://zenodo.org/records/16640595',
    checkedOn: '2026-09-23',
    admittedUse: 'Candidate current reference dataset for validating an emissions-to-warming implementation through 2024.',
    finding: 'The dataset extends the published attribution framework through 2024 and can support reproducibility checks against known outputs.',
    excludedUse: 'Country-level validation data do not allocate terminal harm to the TULIP source nodes by themselves.',
  },
  {
    id: 'carbon_majors_heatwave_attribution_oscar',
    title: 'Systematic attribution of heatwaves to the emissions of carbon majors',
    url: 'https://www.nature.com/articles/s41586-025-09450-9',
    checkedOn: '2026-09-23',
    admittedUse: 'Candidate independent check on source-removal counterfactuals using historical CO2 and CH4 emissions and the OSCAR reduced-complexity climate model.',
    finding: 'The study constructs counterfactual climate histories and evaluates changes in heatwave intensity and probability attributable to emissions sources.',
    excludedUse: 'Heatwave attribution is hazard-specific and cannot stand in for all human and ecosystem endpoints.',
  },
  {
    id: 'vicedo_cabrera_heat_mortality_attribution',
    title: 'The burden of heat-related mortality attributable to recent human-induced climate change',
    url: 'https://www.nature.com/articles/s41558-021-01058-x',
    checkedOn: '2026-09-23',
    admittedUse: 'Candidate observed human endpoint for a partial, present-day heat-mortality calibration and validation case.',
    finding: 'The study estimates attributable heat mortality across 732 locations in 43 countries for 1991-2018 and publishes a multi-location modelling approach.',
    excludedUse: 'It covers one health endpoint and an incomplete set of locations; it cannot be generalized to all people, hazards or geographies without additional evidence.',
  },
  {
    id: 'ipcc_ar6_wgii_technical_summary_attributed_impacts',
    title: 'IPCC AR6 WGII Technical Summary: observed impacts attributed to climate change',
    url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/technical-summary/',
    checkedOn: '2026-09-23',
    admittedUse: 'Map which human and ecosystem endpoint families have assessed observed impacts and confidence statements before selecting quantitative datasets.',
    finding: 'The assessment synthesizes attributed impacts across human and natural systems with explicit confidence, exposure and vulnerability context.',
    excludedUse: 'Confidence language and impact inventories are not a common quantitative ecosystem-harm denominator.',
  },
  {
    id: 'ipcc_ar6_wgii_chapter_2_ecosystems',
    title: 'IPCC AR6 WGII Chapter 2: Terrestrial and Freshwater Ecosystems and Their Services',
    url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/',
    checkedOn: '2026-09-23',
    admittedUse: 'Define ecosystem endpoint families, causal qualifications and evidence limits for the nature half of TULIP.',
    finding: 'The assessment documents observed ecosystem impacts while noting that complete quantitative chains from climate drivers through ecosystem services are often limited by available studies.',
    excludedUse: 'Qualitative synthesis is not converted into invented percentages, severity values or probability distributions.',
  },
];

const sourceIssues = catalogue.issues.filter(row => row.result.causalAllocation?.role === 'emission_source');
assert.equal(sourceIssues.length, 28, 'Expected the 28 reviewed emission-source candidates.');

const edgarCo2Ids = new Set([
  'cement_process_emissions', 'iron_steel_process_co2', 'chemical_process_co2',
  'refinery_combustion_co2', 'aviation_jet_fuel_co2', 'shipping_bunker_fuel_co2',
  'rail_diesel_co2', 'waste_incineration_co2', 'oil_gas_flaring_co2',
]);
const cedsCo2Ids = new Set([
  'oil_power_co2_output', 'residential_gas_heat_co2', 'commercial_gas_heat_co2',
  'oil_building_heat_co2',
]);
const cedsIndustrialHeatIds = new Set(['coal_industrial_heat_co2', 'gas_industrial_heat_co2']);
const emberCo2Ids = new Set(['coal_power_co2_output', 'gas_power_co2_output']);

const edgar2024FossilCO2Gg = edgar.records
  .filter(row => row.metric_id === 'territorial_fossil_and_industrial_co2_emissions' && row.observation_year === 2024)
  .reduce((sum, row) => sum + row.emission_gg_substance, 0);
const edgar2024AnthropogenicCH4Gg = edgar.records
  .filter(row => row.metric_id === 'anthropogenic_methane_emissions' && row.observation_year === 2024)
  .reduce((sum, row) => sum + row.emission_gg_substance, 0);
assert(edgar2024FossilCO2Gg > 39e6 && edgar2024FossilCO2Gg < 41e6);
assert(edgar2024AnthropogenicCH4Gg > 300e3 && edgar2024AnthropogenicCH4Gg < 400e3);

function tcreScreen(cumulativeGtCO2, recordStartYear, recordEndYear, boundaryNote) {
  return {
    status: 'physical_intermediate_only',
    recordStartYear,
    recordEndYear,
    cumulativeGtCO2: round(cumulativeGtCO2),
    estimatedWarmingContributionC: {
      lower: round(cumulativeGtCO2 * TCRE.likelyLowerCPer1000GtCO2 / 1000, 4),
      best: round(cumulativeGtCO2 * TCRE.bestEstimateCPer1000GtCO2 / 1000, 4),
      upper: round(cumulativeGtCO2 * TCRE.likelyUpperCPer1000GtCO2 / 1000, 4),
      intervalKind: 'IPCC_likely_TCRE_range_not_a_probability_for_this_source',
    },
    boundaryNote,
    scoringRule: 'This screening result is never entered directly as severity, reach, persistence, a TULIP value or a TULIP letter.',
  };
}

function magnitudeObservation(record) {
  return record.evidenceAudit?.observations?.find(observation => observation.role === 'magnitude')?.value ?? null;
}

function proxyMeasurement(record) {
  const observations = Object.fromEntries((record.evidenceAudit?.observations ?? []).map(item => [item.role, item.value]));
  const magnitude = magnitudeObservation(record);
  if (magnitude?.latest_trailing_12_month_co2_tonnes != null) return {
    value: round(magnitude.latest_trailing_12_month_co2_tonnes / 1e6), unit: 'Mt CO2/year', year: 2024,
    quality: 'source_reported_or_derived_global_gross_flow',
  };
  if (magnitude?.latest_global_kilotonnes_co2_per_year != null) return {
    value: round(magnitude.latest_global_kilotonnes_co2_per_year / 1000), unit: 'Mt CO2/year', year: 2024,
    quality: 'source_reported_estimated_global_flow',
  };
  if (observations.passenger_car_van_co2_lower_bound_gt != null) return {
    value: round(observations.passenger_car_van_co2_lower_bound_gt * 1000), unit: 'Mt CO2/year', year: observations.observation_year,
    quality: 'lower_bound_without_fuel_split',
  };
  if (observations.truck_co2_gt_approx != null) return {
    value: round(observations.truck_co2_gt_approx * 1000), unit: 'Mt CO2/year', year: observations.observation_year,
    quality: 'approximation_without_diesel_split',
  };
  if (observations.production_emissions_mt_co2e_approx != null) return {
    value: round(observations.production_emissions_mt_co2e_approx), unit: 'Mt CO2e/year', year: observations.observation_year,
    quality: 'approximate_lifecycle_co2e_not_gas_specific',
  };
  if (observations.industry_direct_co2_gt != null) return {
    value: null, unit: null, year: null,
    quality: 'aggregate_industry_context_not_node_specific',
    context: {
      value: round(observations.industry_direct_co2_gt * 1000), unit: 'Mt CO2/year', year: observations.observation_year,
      meaning: 'Aggregate direct industry CO2; this value is not assigned to the individual source node.',
    },
  };
  return { value: null, unit: null, year: null, quality: 'no_source_specific_global_mass_flow' };
}

function edgarCo2Record(nodeId) {
  const rows = edgar.global_time_series.filter(row => row.node_id === nodeId && row.substance === 'CO2');
  assert(rows.length >= 50, `${nodeId}: expected EDGAR history`);
  const latest = rows.at(-1);
  const cumulativeGtCO2 = rows.reduce((sum, row) => sum + row.emission_gg_substance, 0) / 1e6;
  return {
    measurement: {
      value: round(latest.emission_gg_substance / 1000), unit: 'Mt CO2/year', year: latest.observation_year,
      quality: 'same_inventory_disjoint_fossil_co2_category', sourceId: 'edgar_2025_ghg',
    },
    annualInventoryShare: {
      valuePct: round(latest.emission_gg_substance / edgar2024FossilCO2Gg * 100),
      denominator: round(edgar2024FossilCO2Gg / 1000), denominatorUnit: 'Mt fossil and industrial CO2/year',
      denominatorYear: 2024, denominatorSourceId: 'edgar_2025_ghg',
      status: 'compatible_accounting_share_not_harm_share',
    },
    physicalScreening: tcreScreen(cumulativeGtCO2, rows[0].observation_year, latest.observation_year,
      'EDGAR source-category cumulative fossil CO2 from 1970 onward. Earlier emissions are absent, so this is not a full historical attribution.'),
    allocationReadiness: 'physical_intermediate_ready',
  };
}

function cedsCo2Record(nodeId) {
  const metric = ceds.metrics[nodeId];
  assert(metric?.observations?.length >= 50, `${nodeId}: expected CEDS history`);
  const rows = metric.observations;
  const latest = rows.at(-1);
  const cumulativeGtCO2 = rows.reduce((sum, row) => sum + row.value_kt_co2, 0) / 1e6;
  return {
    measurement: {
      value: round(latest.value_kt_co2 / 1000), unit: 'Mt CO2/year', year: latest.year,
      quality: 'source_native_sector_fuel_co2', sourceId: ceds.source.id,
    },
    annualInventoryShare: null,
    physicalScreening: tcreScreen(cumulativeGtCO2, rows[0].year, latest.year,
      'CEDS sector-fuel cumulative CO2 from 1970 onward. It is a different inventory vintage from the EDGAR denominator and is not assigned a cross-inventory annual share.'),
    allocationReadiness: 'physical_intermediate_ready_inventory_alignment_needed',
  };
}

function cedsIndustrialHeatRecord(nodeId) {
  const metric = cedsIndustrialHeat.metrics[nodeId];
  assert(metric?.observations?.length === 273, `${nodeId}: expected CEDS 1750-2022 industrial heat history`);
  const rows = metric.observations;
  const latest = rows.at(-1);
  return {
    measurement: {
      value: round(latest.valueKtCO2 / 1000), unit: 'Mt CO2/year', year: latest.year,
      quality: 'source_native_disjoint_industrial_sector_fuel_co2', sourceId: cedsIndustrialHeat.source.id,
    },
    annualInventoryShare: null,
    physicalScreening: tcreScreen(metric.cumulativeGtCO2, rows[0].year, latest.year,
      `${metric.boundary} The CEDS record begins in 1750 and ends in 2022; observation-level uncertainty is unavailable.`),
    allocationReadiness: 'physical_intermediate_ready_current_refresh_needed',
  };
}

function cementKilnRecord() {
  const metric = cementKilnFuel.metric;
  assert.equal(cementKilnFuel.nodeId, 'cement_kiln_fuel_co2');
  assert.equal(metric.observations.length, 273);
  const latest = metric.observations.at(-1);
  return {
    measurement: {
      value: round(latest.reconstructedCementKilnFuelKtCO2 / 1000), unit: 'Mt CO2/year', year: latest.year,
      quality: 'reconstructed_CEDS_nonmetallic_minerals_scaled_to_2019_cement_combustion_benchmark',
      sourceId: cementKilnFuel.sources.ceds.id,
      reconstructionReferenceId: cementKilnFuel.sources.cementBenchmark.id,
    },
    annualInventoryShare: null,
    physicalScreening: tcreScreen(metric.cumulativeGtCO2, metric.observations[0].year, latest.year,
      'Reconstructed by scaling the CEDS fossil-combustion history for non-metallic minerals to the published approximate 2019 cement-fuel benchmark. The CEDS sector also contains glass, ceramics, lime and other products; a constant 2019 cement share is assumed over 1750–2022. Cement process emissions remain separate.'),
    allocationReadiness: 'physical_intermediate_ready_reconstructed_sector_proxy_review_needed',
  };
}

function emberCo2Record(nodeId) {
  const rows = ember.records.filter(row => row.node_id === nodeId);
  assert(rows.length >= 20, `${nodeId}: expected Ember history`);
  const latest = rows.at(-1);
  const cumulativeGtCO2 = rows.reduce((sum, row) => sum + row.value, 0) / 1000;
  return {
    measurement: {
      value: round(latest.value), unit: 'Mt CO2/year', sourceUnit: latest.unit, year: latest.observation_year,
      quality: 'source_reported_power_lifecycle_co2', sourceId: ember.source.id,
    },
    annualInventoryShare: null,
    physicalScreening: tcreScreen(cumulativeGtCO2, rows[0].observation_year, latest.observation_year,
      'Ember lifecycle power CO2 from 2000 onward. Earlier emissions and boundary reconciliation with direct-combustion inventories are missing.'),
    allocationReadiness: 'physical_intermediate_ready_boundary_review_needed',
  };
}

function peatRecord() {
  const rows = faostat.records.filter(row => row.metric_id === 'drained_peat_co2_flux'
    && row.area === 'World' && row.component === 'agricultural_drained_organic_soil_total_co2');
  assert(rows.length >= 30, 'peatland_drainage_co2: expected FAOSTAT history');
  const latest = rows.at(-1);
  const cumulativeGtCO2 = rows.reduce((sum, row) => sum + row.value, 0) / 1e6;
  return {
    measurement: {
      value: round(latest.value / 1000), unit: 'Mt CO2/year', year: latest.year,
      quality: 'FAOSTAT_Tier_1_estimated_agricultural_drained_organic_soils', sourceId: faostat.source.id,
    },
    annualInventoryShare: null,
    physicalScreening: tcreScreen(cumulativeGtCO2, rows[0].year, latest.year,
      'FAOSTAT Tier 1 cumulative CO2 for agricultural drained organic soils only. Fire, non-agricultural drainage and pre-1990 emissions are outside the record.'),
    allocationReadiness: 'physical_intermediate_ready_estimation_review_needed',
  };
}

function deforestationRecord() {
  const metric = faostatForests.metric;
  assert.equal(metric.nodeId, 'deforestation_co2_release');
  assert.equal(metric.observations.length, 36);
  const latest = metric.observations.at(-1);
  return {
    measurement: {
      value: round(latest.valueKtCO2 / 1000), unit: 'Mt CO2/year', year: latest.year,
      quality: 'FAOSTAT_Tier_1_estimated_partial_net_forest_conversion_living_biomass',
      sourceId: faostatForests.source.id,
    },
    annualInventoryShare: null,
    physicalScreening: tcreScreen(metric.cumulativeGtCO2, metric.observations[0].year, latest.year,
      `${metric.boundary} Every value is source-flagged estimated, and the repeated 2023-2025 values are not treated as independently observed stability.`),
    allocationReadiness: 'physical_intermediate_ready_partial_land_boundary_review_needed',
  };
}

function riceRecord() {
  const rows = edgar.global_time_series.filter(row => row.node_id === 'rice_paddy_methane_bubbles' && row.substance === 'CH4');
  assert(rows.length >= 50);
  const latest = rows.at(-1);
  assert.equal(jonesReference.validation.methaneGwpStar.result, 'published_gwp_star_rows_reproduced');
  const methanePhysicalScreening = calculateMethaneGwpStar({
    annualEmissions: rows.map(row => ({
      year: row.observation_year,
      annualTgCH4: row.emission_gg_substance / 1000,
    })),
    referenceYear: 1991,
    gwp100: METHANE_GWP_STAR_METHOD.biogenicMethaneGwp100,
  });
  return {
    measurement: {
      value: round(latest.emission_gg_substance / 1000), unit: 'Mt CH4/year', year: latest.observation_year,
      quality: 'same_inventory_anthropogenic_methane_category', sourceId: 'edgar_2025_ghg',
    },
    annualInventoryShare: {
      valuePct: round(latest.emission_gg_substance / edgar2024AnthropogenicCH4Gg * 100),
      denominator: round(edgar2024AnthropogenicCH4Gg / 1000), denominatorUnit: 'Mt anthropogenic CH4/year',
      denominatorYear: 2024, denominatorSourceId: 'edgar_2025_ghg',
      status: 'compatible_accounting_share_not_harm_share',
    },
    physicalScreening: null,
    methanePhysicalScreening: {
      status: 'published_gwp_star_method_reproduced_partial_source_history',
      referenceYear: 1991,
      historyStartYear: rows[0].observation_year,
      historyEndYear: latest.observation_year,
      records: methanePhysicalScreening.records,
      latest: methanePhysicalScreening.records.at(-1),
      sourceReferenceVersion: jonesReference.version,
      sourceReferenceDigest: jonesReference.digest,
      interpretation: 'Change in the rice-source global mean temperature contribution since 1991. This is a physical intermediate, not terminal harm.',
    },
    allocationReadiness: 'methane_physical_intermediate_ready_terminal_endpoints_needed',
  };
}

function tundraMethaneRecord() {
  const flux = tundraMethane.endpoints.arcticBorealFlux;
  const annual = flux.annualSeries.total_post.annual;
  assert.equal(annual.length, 12, 'tundra_methane_outgassing: expected complete 2010-2021 annual series');
  assert.deepEqual([annual[0].year, annual.at(-1).year], [2010, 2021]);
  return {
    measurement: {
      value: round(flux.annualSeries.total_post.meanTgCH4PerYear),
      unit: 'Mt CH4/year',
      year: `${flux.observationPeriod.start}-${flux.observationPeriod.end} mean`,
      quality: 'broad_arctic_boreal_total_not_node_specific',
      sourceId: tundraMethane.sources.inverseModel.id,
    },
    componentMeasurements: {
      wetlandMeanMtCH4PerYear: round(flux.annualSeries.wetland_post.meanTgCH4PerYear),
      anthropogenicMeanMtCH4PerYear: round(flux.annualSeries.anthropogenic_post.meanTgCH4PerYear),
      fireMeanMtCH4PerYear: round(flux.annualSeries.fire_post.meanTgCH4PerYear),
      otherNaturalMeanMtCH4PerYear: round(flux.annualSeries.other_post.meanTgCH4PerYear),
      oceanMeanMtCH4PerYear: round(flux.annualSeries.ocean_post.meanTgCH4PerYear),
      rule: 'These components describe the broad Arctic-Boreal inversion. None is equivalent to methane newly caused by current tundra thaw, and they are not added to the thaw-altered-landscape estimate.',
    },
    annualHistory: {
      startYear: flux.observationPeriod.start,
      endYear: flux.observationPeriod.end,
      valuesMtCH4: annual.map(row => ({ year: row.year, value: round(row.valueTgCH4, 6) })),
      trend: flux.articleTrend,
      boundary: flux.boundary,
      sourceSnapshotVersion: tundraMethane.version,
      sourceSnapshotDigest: tundraMethane.snapshotDigest,
    },
    thawAttributionBoundary: tundraMethane.endpoints.permafrostThawAttribution,
    annualInventoryShare: null,
    physicalScreening: null,
    allocationReadiness: 'broad_flux_history_ingested_node_boundary_and_methane_response_needed',
  };
}

function unresolvedRecord(nodeId, record) {
  const measurement = proxyMeasurement(record);
  const climateTraceLand = ['deforestation_co2_release', 'land_use_fire_co2'].includes(nodeId);
  const readiness = climateTraceLand
    ? 'net_flux_and_anthropogenic_attribution_needed'
    : measurement.value == null || /not_node_specific/.test(measurement.quality)
        ? 'source_specific_inventory_needed'
        : 'compatible_historical_time_series_needed';
  return { measurement, annualInventoryShare: null, physicalScreening: null, allocationReadiness: readiness };
}

const commonTerminalGaps = [
  'A reviewed mapping from the source-removal climate response to non-overlapping current human terminal consequences.',
  'A reviewed mapping from the same response to ecosystem condition, extent and recovery, using a compatible geography and period.',
  'Endpoint-model uncertainty that can be carried through the TULIP axis bounds without inventing a probability distribution.',
];

const rows = sourceIssues.map(issue => {
  const nodeId = issue.nodeId;
  const record = registry.records[nodeId];
  assert(record, `${nodeId}: missing assessment record`);
  let allocation;
  if (edgarCo2Ids.has(nodeId)) allocation = edgarCo2Record(nodeId);
  else if (cedsCo2Ids.has(nodeId)) allocation = cedsCo2Record(nodeId);
  else if (cedsIndustrialHeatIds.has(nodeId)) allocation = cedsIndustrialHeatRecord(nodeId);
  else if (nodeId === 'cement_kiln_fuel_co2') allocation = cementKilnRecord();
  else if (emberCo2Ids.has(nodeId)) allocation = emberCo2Record(nodeId);
  else if (nodeId === 'peatland_drainage_co2') allocation = peatRecord();
  else if (nodeId === 'deforestation_co2_release') allocation = deforestationRecord();
  else if (nodeId === 'rice_paddy_methane_bubbles') allocation = riceRecord();
  else if (nodeId === 'tundra_methane_outgassing') allocation = tundraMethaneRecord();
  else allocation = unresolvedRecord(nodeId, record);

  const firstGap = {
    physical_intermediate_ready: 'Extend or reconcile the cumulative CO2 history where necessary, then run a source-removal endpoint model.',
    physical_intermediate_ready_inventory_alignment_needed: 'Reconcile the CEDS sector-fuel series with the selected global fossil-CO2 inventory and extend the history before 1970.',
    physical_intermediate_ready_current_refresh_needed: 'Refresh the CEDS industrial fuel history after 2022 and reconcile inventory uncertainty before endpoint modelling.',
    physical_intermediate_ready_boundary_review_needed: 'Choose and document lifecycle versus direct-combustion scope, remove overlap, and extend the history before 2000.',
    physical_intermediate_ready_estimation_review_needed: 'Review the Tier 1 uncertainty and agricultural-only boundary, and extend the history before 1990.',
    physical_intermediate_ready_partial_land_boundary_review_needed: 'Reconcile the FAOSTAT living-biomass net-forest-conversion series with independent bookkeeping models, quantify model spread, and keep excluded land pools and overlapping land-use sources separate.',
    physical_intermediate_ready_reconstructed_sector_proxy_review_needed: 'Validate a time-varying cement share against GCCA/GNR or equivalent cement-only fuel data and propagate both source-inventory and sector-allocation uncertainty.',
    methane_physical_intermediate_ready_terminal_endpoints_needed: 'Carry the validated GWP* source-removal response through a compatible hazard model and matched current human and ecosystem endpoints; the physical temperature contribution cannot set a TULIP axis.',
    net_flux_and_anthropogenic_attribution_needed: 'Replace or reconcile gross land emissions with an attributable source-removal flux that includes relevant removals and avoids natural-fire attribution.',
    broad_flux_history_ingested_node_boundary_and_methane_response_needed: 'Extend the annual history to a compatible 1991–2020 reference and recent years, isolate a non-overlapping tundra or thaw-attributable source boundary, then apply a methane-specific time-dependent response model.',
    source_specific_inventory_needed: 'Obtain a source-specific global mass-flow history; aggregate sector context cannot be assigned to this node.',
    compatible_historical_time_series_needed: 'Replace the single-year estimate or lower bound with a gas-specific, non-overlapping historical time series.',
  }[allocation.allocationReadiness];

  return {
    nodeId,
    name: issue.name,
    aggregateNodeIds: issue.result.causalAllocation.aggregateNodeIds,
    currentCandidate: {
      value: issue.result.value,
      grade: issue.result.grade.letter,
      confidence: issue.result.confidence,
      status: 'retained_internal_candidate_not_recalculated_by_this_worksheet',
    },
    gasOrBoundary: allocation.measurement.unit?.includes('CH4') || nodeId.includes('methane') ? 'methane'
      : allocation.measurement.unit?.includes('CO2e') ? 'mixed_co2e' : 'carbon_dioxide',
    ...allocation,
    scoreReadiness: 'not_ready_terminal_consequence_model_missing',
    requiredNextEvidence: [firstGap, ...commonTerminalGaps],
    prohibitedConversions: [
      'Do not multiply an aggregate TULIP value or letter by the annual emissions share.',
      'Do not treat tonnes, cumulative tonnes or estimated warming as severity, reach or persistence.',
      'Do not sum this source score with aggregate greenhouse-gas, temperature, hazard or endpoint scores.',
    ],
  };
}).sort((left, right) => left.nodeId.localeCompare(right.nodeId));

assert.equal(new Set(rows.map(row => row.nodeId)).size, 28);
assert(rows.every(row => row.scoreReadiness === 'not_ready_terminal_consequence_model_missing'));
assert(rows.every(row => row.currentCandidate.confidence === 'D'));

const counts = {
  emissionSourceNodes: rows.length,
  numericalCandidatesRetained: rows.filter(row => Number.isFinite(row.currentCandidate.value)).length,
  sameInventoryAnnualShares: rows.filter(row => row.annualInventoryShare).length,
  cumulativeCo2PhysicalScreens: rows.filter(row => row.physicalScreening).length,
  methaneGwpStarPhysicalScreens: rows.filter(row => row.methanePhysicalScreening).length,
  sourceSpecificAnnualMassFlows: rows.filter(row => row.measurement.value != null && !/not_node_specific/.test(row.measurement.quality)).length,
  scoreReadyFromSourceAllocation: rows.filter(row => row.scoreReadiness === 'ready').length,
  readiness: Object.fromEntries([...new Set(rows.map(row => row.allocationReadiness))].sort()
    .map(status => [status, rows.filter(row => row.allocationReadiness === status).length])),
};

const nextModelCandidates = [
  {
    stage: 'physical_attribution',
    status: 'candidate_for_implementation_and_validation',
    question: 'How much of the current climate response is attributable to removing this source emissions history?',
    candidateReferences: [
      'jones_national_warming_contributions',
      'jones_national_warming_contributions_data_1851_2024',
      'carbon_majors_heatwave_attribution_oscar',
    ],
    proposedUse: 'Implement and reproduce the Jones emissions-to-GMST method for compatible CO2 and methane histories, then compare selected counterfactuals with an OSCAR-style source-removal result.',
    acceptedOutput: 'A traceable temperature-response time series with model, inventory-boundary and emissions-history uncertainty retained separately.',
    doesNotAnswer: 'It does not quantify deaths, livelihood loss, ecosystem condition, geographic reach or recovery time.',
  },
  {
    stage: 'human_terminal_endpoint',
    status: 'published_algorithm_reproduced_on_hypothetical_example',
    question: 'What observed harm to people can be causally linked to the attributable climate response?',
    candidateReferences: ['vicedo_cabrera_heat_mortality_attribution'],
    referenceSnapshotVersion: heatMortality.version,
    referenceSnapshotDigest: heatMortality.snapshotDigest,
    proposedUse: 'Run the reproduced factual-versus-counterfactual heat-mortality equation with each compatible TULIP source-removal climate series, preserving location, period, baseline and exposure-response limits.',
    acceptedOutput: 'Attributable heat deaths or fractions for represented locations and years, with the exposure-response model and uncertainty carried through.',
    doesNotAnswer: 'The reproduced ten-city example is hypothetical and does not represent the 732-location study, the world, all health effects, livelihoods, essential services, non-heat hazards or ecosystems.',
  },
  {
    stage: 'ecosystem_terminal_endpoint',
    status: 'research_target_no_common_quantitative_denominator_selected',
    question: 'What observed loss of ecosystem condition, extent or recovery can be causally linked to the same climate response?',
    candidateReferences: [
      'ipcc_ar6_wgii_technical_summary_attributed_impacts',
      'ipcc_ar6_wgii_chapter_2_ecosystems',
    ],
    proposedUse: 'Use the IPCC endpoint map to select compatible quantitative datasets by ecosystem and impact family, then test whether they can support the fixed TULIP nature axes.',
    acceptedOutput: 'A documented endpoint with explicit baseline, area, period, attribution method and recovery interpretation; different endpoints remain separate until a calibration rule is reviewed.',
    doesNotAnswer: 'The synthesis does not supply one universal ecosystem-loss percentage and must not be converted into one by editorial judgement.',
  },
];

const wave1Statuses = new Set(['physical_intermediate_ready']);
const wave2Statuses = new Set([
  'physical_intermediate_ready_inventory_alignment_needed',
  'physical_intermediate_ready_current_refresh_needed',
  'physical_intermediate_ready_boundary_review_needed',
  'physical_intermediate_ready_estimation_review_needed',
  'physical_intermediate_ready_partial_land_boundary_review_needed',
  'physical_intermediate_ready_reconstructed_sector_proxy_review_needed',
]);
const wave1 = rows.filter(row => wave1Statuses.has(row.allocationReadiness));
const wave2 = rows.filter(row => wave2Statuses.has(row.allocationReadiness));
const wave3 = rows.filter(row => row.gasOrBoundary === 'methane');
const assigned = new Set([...wave1, ...wave2, ...wave3].map(row => row.nodeId));
const wave4 = rows.filter(row => !assigned.has(row.nodeId));

const nextIngestionOrder = [
  {
    wave: 1,
    label: 'Run the physical model on compatible CO2 histories',
    reason: 'These sources already have the cleanest cumulative CO2 records, so they can validate the physical-attribution implementation before more boundary work is added.',
    action: 'Implement the emissions-to-GMST candidate, reproduce reference outputs, run source-removal histories and retain temperature response as an intermediate only.',
    nodeIds: wave1.map(row => row.nodeId),
  },
  {
    wave: 2,
    label: 'Reconcile the remaining CO2 histories',
    reason: 'These sources have useful historical records but need inventory, lifecycle or estimation boundaries resolved before comparable counterfactuals are run.',
    action: 'Resolve the documented boundary gap, then run the same validated physical-attribution model used in wave 1.',
    nodeIds: wave2.map(row => row.nodeId),
  },
  {
    wave: 3,
    label: 'Model methane with its own time-dependent response',
    reason: 'The published GWP* calculation is reproduced. Rice has the required history and now has a physical response series; tundra still lacks the twenty-year lookback and a non-overlapping attribution boundary.',
    action: 'Carry rice through a compatible hazard and endpoint chain. Extend and disaggregate the tundra history before applying the same validated methane method.',
    nodeIds: wave3.map(row => row.nodeId),
  },
  {
    wave: 4,
    label: 'Fill missing source histories and land-use attribution',
    reason: 'These sources lack a compatible historical series or a defensible net anthropogenic source-removal boundary.',
    action: 'Acquire the exact inventory identified in each row, prevent double counting, and admit the source to the physical model only after the boundary check passes.',
    nodeIds: wave4.map(row => row.nodeId),
  },
];

assert.deepEqual(nextIngestionOrder.map(wave => wave.nodeIds.length), [9, 11, 2, 6]);
assert.equal(new Set(nextIngestionOrder.flatMap(wave => wave.nodeIds)).size, rows.length);

const payload = {
  version: 'tulip_internal_emission_source_allocation_2026_09_23_v8',
  preparedOn: '2026-09-23',
  status: 'physical_allocation_screen_complete_terminal_consequence_research_required',
  purpose: 'Separate usable emissions accounting from the additional evidence required to rate current harm to people and nature.',
  method: {
    counterfactual: 'Compare current climate and terminal consequences with the same system after removing emissions attributable to the source, without assuming a replacement source.',
    co2: 'For compatible CO2 histories, calculate an explicitly partial cumulative-emissions total and an IPCC TCRE physical screening. This is an intermediate climate response, not harm.',
    methane: 'Use the checksum-validated GWP* transformation, which combines the cumulative methane level with its change over twenty years before applying the published TCRE mapping. Annual mass or GWP100 alone is not sufficient.',
    terminalConsequences: 'Only a reviewed endpoint model may translate the physical response into the fixed TULIP severity, reach and persistence axes for people and nature.',
  },
  constants: { tcre: TCRE },
  inventoryDenominators: {
    edgar2024FossilAndIndustrialCO2Mt: round(edgar2024FossilCO2Gg / 1000),
    edgar2024AnthropogenicMethaneMt: round(edgar2024AnthropogenicCH4Gg / 1000),
    rule: 'Denominators support accounting shares only for same-gas, same-year, same-inventory disjoint categories.',
  },
  counts,
  methodReferences,
  nextModelCandidates,
  nextIngestionOrder,
  rows,
};
payload.digest = digest({
  method: payload.method,
  constants: payload.constants,
  inventoryDenominators: payload.inventoryDenominators,
  nextModelCandidates,
  nextIngestionOrder,
  rows,
});

const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
const csv = [[
  'Node ID', 'Node', 'Candidate', 'Grade', 'Confidence', 'Gas or boundary', 'Latest value', 'Unit', 'Year',
  'Measurement quality', 'Annual inventory share pct', 'Cumulative CO2 Gt', 'TCRE warming best C',
  'TCRE warming lower C', 'TCRE warming upper C', 'Methane GWP* warming best C', 'Allocation readiness', 'Score readiness', 'Next evidence',
], ...rows.map(row => [
  row.nodeId, row.name, row.currentCandidate.value, row.currentCandidate.grade, row.currentCandidate.confidence,
  row.gasOrBoundary, row.measurement.value, row.measurement.unit, row.measurement.year, row.measurement.quality,
  row.annualInventoryShare?.valuePct, row.physicalScreening?.cumulativeGtCO2,
  row.physicalScreening?.estimatedWarmingContributionC.best,
  row.physicalScreening?.estimatedWarmingContributionC.lower,
  row.physicalScreening?.estimatedWarmingContributionC.upper,
  row.methanePhysicalScreening?.latest?.gmstResponseC?.best,
  row.allocationReadiness, row.scoreReadiness, row.requiredNextEvidence.join(' | '),
])].map(line => line.map(csvCell).join(',')).join('\n') + '\n';

const report = `# TULIP emission-source allocation worksheet\n\nStatus: **physical allocation screening complete; terminal-consequence research still required**. This worksheet covers all ${counts.emissionSourceNodes} emission-source candidates. It retains their numerical internal candidates and does not change any TULIP value or letter.\n\n## What became more certain\n\n- ${counts.cumulativeCo2PhysicalScreens} sources have an inspectable cumulative CO2 history that supports an IPCC TCRE physical screening.\n- ${counts.methaneGwpStarPhysicalScreens} methane source has a checksum-validated, path-dependent GWP* physical response series.\n- ${counts.sameInventoryAnnualShares} sources have a valid same-year, same-gas, same-inventory annual share.\n- ${counts.sourceSpecificAnnualMassFlows} sources have a source-specific annual global mass flow or explicit lower-bound estimate.\n- ${counts.scoreReadyFromSourceAllocation} sources are ready to have emissions volume converted directly into a TULIP score. The correct number is zero because emissions, warming and terminal harm are different quantities.\n\n## Rule\n\nA source's annual share may describe its part of an inventory. A cumulative CO2 history may estimate a partial warming contribution. Neither answers how many people were harmed, how much ecosystem condition was lost, how widely the harm occurred or how long recovery takes. Those endpoint quantities must be modelled before the source candidate can move above confidence D.\n\n## What to ingest next\n\nThe work is ordered by data readiness, not by scientific or public importance. Every node remains in the catalogue while its evidence is improved.\n\n${nextIngestionOrder.map(wave => `### Wave ${wave.wave}: ${wave.label}\n\n${wave.reason}\n\n**Action:** ${wave.action}\n\n**Nodes (${wave.nodeIds.length}):** ${wave.nodeIds.join(', ')}`).join('\n\n')}\n\n## Candidate model chain\n\n${nextModelCandidates.map(candidate => `### ${candidate.stage.replaceAll('_', ' ')}\n\n- **Status:** ${candidate.status.replaceAll('_', ' ')}\n- **Question:** ${candidate.question}\n- **Proposed use:** ${candidate.proposedUse}\n- **Accepted output:** ${candidate.acceptedOutput}\n- **Limit:** ${candidate.doesNotAnswer}`).join('\n\n')}\n\n## Source ledger\n\n| Node | Candidate | Measurement | Physical allocation | Exact next gap |\n| --- | ---: | --- | --- | --- |\n${rows.map(row => `| ${row.name} | ${row.currentCandidate.grade} ${row.currentCandidate.value} (${row.currentCandidate.confidence}) | ${row.measurement.value == null ? 'No source-specific global mass flow' : `${row.measurement.value} ${row.measurement.unit} (${row.measurement.year})`} | ${row.physicalScreening ? `${row.physicalScreening.cumulativeGtCO2} Gt CO2 over ${row.physicalScreening.recordStartYear}-${row.physicalScreening.recordEndYear}; ${row.physicalScreening.estimatedWarmingContributionC.best} C best-estimate screening` : row.methanePhysicalScreening ? `${row.methanePhysicalScreening.records.length} annual GWP* response points; ${row.methanePhysicalScreening.latest.gmstResponseC.best} C best change since ${row.methanePhysicalScreening.referenceYear}` : row.annualInventoryShare ? `${row.annualInventoryShare.valuePct}% of compatible ${row.annualInventoryShare.denominatorYear} inventory; methane response pending` : row.allocationReadiness.replaceAll('_', ' ')} | ${row.requiredNextEvidence[0]} |`).join('\n')}\n\n## Method sources\n\n${methodReferences.map(source => `- [${source.title}](${source.url}): ${source.admittedUse} ${source.excludedUse}`).join('\n')}\n`;

await Promise.all([
  writeFile(outputJson, JSON.stringify(payload, null, 2) + '\n'),
  writeFile(outputCsv, csv),
  writeFile(outputReport, report),
]);

console.log(JSON.stringify({ outputJson, outputCsv, outputReport, counts, digest: payload.digest }, null, 2));
