const freezeList = values => Object.freeze(values);

function boundedPromotion({
  source,
  target,
  verb,
  adverb,
  influence,
  level,
  relationshipType,
  confidence,
  mechanism,
  geography,
  period,
  moderators,
  alternatives,
  counterevidence,
  locators,
  indicator,
  evidenceBasis
}) {
  const frozenLocators = freezeList(locators.map(item => Object.freeze(item)));
  const urls = freezeList(locators.map(item => item.url));
  return Object.freeze({
    source,
    target,
    verb,
    adverb,
    influence,
    topology_rule: 'missing_link_bounded_directed_claim_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: level,
      relationship_type: relationshipType,
      confidence,
      source_urls: urls,
      relationship_source_urls: urls,
      mechanism,
      geographic_scope: geography,
      temporal_scope: period,
      moderators: freezeList(moderators),
      alternative_explanations: freezeList(alternatives),
      counterevidence,
      notes: 'Promoted after exact directed-claim review; source totals remain inventory or scenario context rather than universal causal coefficients.',
      reviewed_at: '2026-07-25',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_bounded_directed_claim_readback',
        source,
        target,
        direction: `${source} precedes and can increase ${target} only through the bounded mechanism stated here`,
        mechanism,
        geographic_scope: geography,
        temporal_scope: period,
        confidence,
        evidence_basis: evidenceBasis,
        source_locators: frozenLocators,
        indicator: Object.freeze(indicator)
      })
    })
  });
}

export const MISSING_LINK_RESEARCH_PROMOTION_EDGES_BATCH_TWO = Object.freeze([
  boundedPromotion({
    source: 'ai_data_centers',
    target: 'semiconductor_fabs',
    verb: 'can increase demand for',
    adverb: 'through purchases of advanced accelerators, memory and packaging capacity',
    influence: 0.56,
    level: 'indirect',
    relationshipType: 'bounded_ai_hardware_semiconductor_demand_pathway',
    confidence: 'moderate',
    mechanism: 'Expansion of AI training and inference increases purchases of advanced accelerators and high-bandwidth memory. Foundries and packaging suppliers can respond with higher utilisation and added leading-edge wafer and packaging capacity.',
    geography: 'Global semiconductor supply chain, with United States policy evidence and TSMC company-specific capacity evidence; not a universal fab response.',
    period: 'Demand and capacity evidence from 2024-2025; announced future fabs remain plans until operational.',
    moderators: ['chip reuse and utilisation', 'model and hardware efficiency', 'inventory cycles', 'foundry lead times', 'export controls', 'advanced packaging bottlenecks', 'non-AI semiconductor demand'],
    alternatives: ['smartphones, automotive and other HPC markets also drive fabs', 'policy incentives can add capacity independently of current AI orders', 'sales growth does not equal wafer-start growth'],
    counterevidence: 'AI is not the whole semiconductor market, and company investment plans are not observed production. No reviewed source provides a universal conversion from AI compute demand to wafer starts.',
    evidenceBasis: 'official_industrial_policy_statement_with_company_capacity_and_demand_disclosure',
    locators: [
      { url: 'https://www.commerce.gov/news/speeches/2024/02/remarks-us-secretary-commerce-gina-raimondo-investing-leading-edge-technology', locator: 'AI described as driving demand for leading-edge chips and memory, with fabrication and advanced packaging capacity required.', source_type: 'official_industrial_policy_statement' },
      { url: 'https://investor.tsmc.com/static/annualReports/2025/english/index.html', locator: '2025 annual report: robust AI-related demand, new 2 nm and 3 nm fab phases, and more than 17 million 12-inch-equivalent wafers of annual managed capacity.', source_type: 'primary_company_annual_report' }
    ],
    indicator: {
      metric_id: 'ai_related_advanced_chip_demand_and_fab_output',
      metric_name: 'AI-related advanced-chip demand and matched foundry wafer output',
      unit: 'accelerator or advanced-package units and 12-inch-equivalent wafer starts per year, reported separately',
      geography: 'named buyer, foundry and fabrication or packaging site',
      cadence: 'quarterly or annual company reporting',
      source_id: 'commerce_chips_and_tsmc_annual_reporting',
      transformation: 'Retain AI-related demand, process node, wafer capacity, actual wafer starts, packaging capacity and announced-versus-operational status separately.',
      uncertainty: 'Company allocation, product mix, inventory, yield, utilisation and confidential customer orders limit attribution.',
      threshold_provenance: 'Company filings and official CHIPS program capacity disclosures.',
      failure_behavior: 'Do not assign all semiconductor sales or announced fab capacity to AI.'
    }
  }),
  boundedPromotion({
    source: 'mobile_wireless_networks',
    target: 'carbon_emission',
    verb: 'can add',
    adverb: 'indirectly through grid electricity and on-site fuel used by radio-access networks',
    influence: 0.48,
    level: 'indirect',
    relationshipType: 'bounded_mobile_network_energy_emissions_pathway',
    confidence: 'high',
    mechanism: 'Radio equipment, towers, backhaul and supporting systems consume electricity continuously; fossil generation supplying that load and on-site diesel backup emit carbon dioxide.',
    geography: 'Global operator and network totals; site attribution requires matched electricity, fuel and grid-region data.',
    period: 'IEA 2022 network-energy assessment and GSMA 2019-2024 operator trend, retained separately.',
    moderators: ['traffic volume', 'radio technology and spectrum', 'site density', 'sleep modes', 'renewable electricity', 'grid carbon intensity', 'diesel backup use'],
    alternatives: ['fixed networks and data centers contribute separately', 'traffic can rise while energy stays flat through efficiency', 'contractual renewable purchases may not match physical hourly supply'],
    counterevidence: 'GSMA reports falling operational emissions despite rising traffic, showing that traffic growth is not an emissions coefficient. Operator electricity includes some fixed and data-center loads.',
    evidenceBasis: 'authoritative_global_energy_assessment_with_industry_operator_inventory',
    locators: [
      { url: 'https://www.iea.org/energy-system/buildings/data-centres-and-data-transmission-networks', locator: 'Data-transmission networks used 260-360 TWh in 2022; mobile networks represented around two-thirds, with emissions depending on electricity supply.', source_type: 'authoritative_global_energy_assessment' },
      { url: 'https://view.gsma.com/mobile-net-zero-2026', locator: 'Mobile Net Zero 2026, operator electricity and Scope 2 sections: about 300 TWh in 2024, networks usually more than three-quarters of operator electricity, and operational emissions down 13 percent since 2019.', source_type: 'industry_operator_inventory' }
    ],
    indicator: {
      metric_id: 'mobile_network_electricity_fuel_and_co2',
      metric_name: 'Mobile-network energy use and associated operational carbon dioxide',
      unit: 'megawatt-hours, litres of fuel and tonnes CO2 per year, reported separately',
      geography: 'named site, operator network and matched electricity region',
      cadence: 'monthly energy data with annual emissions inventory',
      source_id: 'iea_network_energy_and_gsma_mobile_net_zero',
      transformation: 'Separate mobile, fixed, data-center, grid-electricity and on-site-fuel loads; multiply only matched energy by declared emissions factors.',
      uncertainty: 'Operator coverage, allocation, renewable accounting, backup runtime and grid-factor choice affect emissions.',
      threshold_provenance: 'IEA network-energy and GSMA operator-reporting boundaries.',
      failure_behavior: 'Do not infer CO2 from data traffic alone or assign total operator electricity to mobile radio sites.'
    }
  }),
  boundedPromotion({
    source: 'telecom_backbone',
    target: 'carbon_emission',
    verb: 'can add',
    adverb: 'indirectly through electricity used by core routers, optical transport and fixed transmission',
    influence: 0.42,
    level: 'indirect',
    relationshipType: 'bounded_fixed_core_network_energy_emissions_pathway',
    confidence: 'moderate',
    mechanism: 'Long-haul optical equipment, core routers and network facilities consume electricity; the fossil share of matched physical electricity supply produces indirect carbon dioxide.',
    geography: 'Global transmission-network context; backbone-specific attribution requires operator segmentation between access, backhaul and core.',
    period: 'IEA 2022 network-energy assessment and ITU 2025 indicator recommendations.',
    moderators: ['traffic and capacity', 'equipment generation', 'route length', 'utilisation', 'cooling', 'grid carbon intensity', 'renewable procurement'],
    alternatives: ['access networks can dominate operator energy', 'data centers are outside the backbone boundary', 'efficiency can offset traffic growth'],
    counterevidence: 'The IEA global total covers all data-transmission networks, not the telecom backbone alone. ITU explicitly calls for separate mobile, fixed, access, backhaul and core reporting.',
    evidenceBasis: 'authoritative_global_energy_assessment_with_official_telecom_measurement_standard',
    locators: [
      { url: 'https://www.iea.org/energy-system/buildings/data-centres-and-data-transmission-networks', locator: 'Global data-transmission network electricity and emissions context, including fixed-line efficiency trends.', source_type: 'authoritative_global_energy_assessment' },
      { url: 'https://www.itu.int/dms_pub/itu-d/md/22/egti.gem.2025/r/D22-EGTI.GEM.2025-R-0001%21%21PDF-E.pdf', locator: '2025 EGTI subgroup report: total telecom-network energy and requested fixed/mobile, access, backhaul and core disaggregation.', source_type: 'official_telecom_measurement_standard' }
    ],
    indicator: {
      metric_id: 'telecom_backbone_electricity_and_grid_co2',
      metric_name: 'Backbone-network electricity and associated grid carbon dioxide',
      unit: 'megawatt-hours and tonnes CO2 per year, reported separately',
      geography: 'named operator core/backbone boundary and matched electricity region',
      cadence: 'monthly energy data with annual emissions inventory',
      source_id: 'iea_data_transmission_and_itu_egti',
      transformation: 'Retain access, backhaul, core, fixed, mobile and facility energy separately before applying matched grid factors.',
      uncertainty: 'Operator allocation, shared facilities, equipment coverage and grid-factor choice affect attribution.',
      threshold_provenance: 'ITU telecom energy indicators and IEA global network boundary.',
      failure_behavior: 'Do not assign the full data-transmission-network total to backbone equipment.'
    }
  }),
  boundedPromotion({
    source: 'food',
    target: 'carbon_emission',
    verb: 'can increase',
    adverb: 'through fossil energy used across production, processing, transport, retail and preparation',
    influence: 0.58,
    level: 'indirect',
    relationshipType: 'bounded_agricultural_demand_fossil_energy_co2_pathway',
    confidence: 'high',
    mechanism: 'Demand for agricultural commodities induces production and supply-chain activity. Fossil fuels and fossil-generated electricity used for machinery, fertilizer manufacture, processing, refrigeration, transport and retail emit carbon dioxide.',
    geography: 'Global territorial food-system inventory; country or commodity attribution requires matched demand, production, trade and sector-energy accounts.',
    period: 'IPCC inventory synthesis for 2018 and EDGAR-FOOD primary series for 1990-2015.',
    moderators: ['diet and commodity mix', 'trade', 'food loss and waste', 'energy efficiency', 'electricity mix', 'transport distance and mode', 'fertilizer production route'],
    alternatives: ['methane and nitrous oxide dominate some agricultural sources', 'land-use CO2 is outside the target fossil-and-industrial metric', 'exports separate consumption demand from territorial emissions'],
    counterevidence: 'Total food-system GHG is not the target metric: methane, nitrous oxide, fluorinated gases and land-use CO2 must be excluded. The 31 percent food-system share is not an elasticity of emissions to demand.',
    evidenceBasis: 'authoritative_food_system_inventory_synthesis_with_peer_reviewed_edgar_food_database',
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-12/', locator: 'Sections 12.4.1-12.4.2: 2018 food-system inventory; energy industries, manufacturing/construction and transport contributions were almost entirely CO2.', source_type: 'authoritative_assessment' },
      { url: 'https://doi.org/10.1038/s43016-021-00225-9', locator: 'EDGAR-FOOD methods and results: global CO2, CH4, N2O and fluorinated-gas emissions from production through consumption, 1990-2015.', source_type: 'peer_reviewed_primary_inventory' }
    ],
    indicator: {
      metric_id: 'food_demand_matched_fossil_supply_chain_co2',
      metric_name: 'Apparent agricultural demand and matched fossil-energy food-supply-chain carbon dioxide',
      unit: 'tonnes commodity and tonnes fossil CO2 per year, reported separately',
      geography: 'declared country, commodity and territorial or consumption accounting boundary',
      cadence: 'annual inventory',
      source_id: 'ipcc_ar6_edgar_food',
      transformation: 'Match commodity demand to production and trade; retain fossil energy CO2 separately from land-use CO2 and non-CO2 gases.',
      uncertainty: 'Trade allocation, informal activity, sector shares, fuel statistics and food/non-food allocation affect attribution.',
      threshold_provenance: 'IPCC AR6 food-system inventory and EDGAR-FOOD methods.',
      failure_behavior: 'Do not report total food-system CO2e as territorial fossil and industrial CO2.'
    }
  }),
  boundedPromotion({
    source: 'carbon_emission',
    target: 'amoc',
    verb: 'can weaken',
    adverb: 'through cumulative greenhouse forcing, subpolar warming and hydrological-cycle freshening',
    influence: 0.61,
    level: 'indirect',
    relationshipType: 'bounded_emissions_climate_forcing_amoc_pathway',
    confidence: 'high',
    mechanism: 'Cumulative greenhouse emissions raise radiative forcing and warm the climate. Faster subpolar North Atlantic warming and enhanced high-latitude freshening increase buoyancy and stratification, weakening deep-water formation and overturning.',
    geography: 'Global emissions forcing and Atlantic overturning transport, with AMOC measured at a declared latitude.',
    period: 'IPCC CMIP6 projections through 2100 across SSP scenarios; historical trend attribution remains low confidence.',
    moderators: ['cumulative multi-gas forcing', 'aerosols', 'North Atlantic freshwater flux', 'ocean mixing', 'model bias', 'internal variability', 'emissions scenario'],
    alternatives: ['internal variability affects decadal AMOC strength', 'aerosol forcing and natural variability influence the North Atlantic', 'historical observing records are short'],
    counterevidence: 'IPCC has low confidence in the quantitative historical trend and projected magnitude despite very likely 21st-century decline. SSP ranges are scenario/model ranges, not a confidence interval or annual-emissions coefficient.',
    evidenceBasis: 'authoritative_climate_model_assessment_with_process_understanding',
    locators: [
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', locator: 'Section 9.2.3: AMOC very likely declines in all SSPs; subpolar warming and enhanced hydrological-cycle freshening reduce the north-south pressure gradient and deep-water formation.', source_type: 'authoritative_assessment' },
      { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/technical-summary/', locator: 'Technical Summary ocean circulation: 21st-century AMOC decline very likely across SSP scenarios.', source_type: 'independent_assessment_summary' }
    ],
    indicator: {
      metric_id: 'scenario_emissions_and_amoc_transport_change',
      metric_name: 'Scenario cumulative greenhouse emissions and AMOC transport change',
      unit: 'gigatonnes CO2-equivalent and sverdrups or percent change, reported separately',
      geography: 'global emissions and declared Atlantic observing latitude',
      cadence: 'annual observations with assessment-cycle projections',
      source_id: 'ipcc_ar6_wgi_amoc',
      transformation: 'Retain emissions scenario, forcing agents, baseline, model ensemble, latitude and absolute versus percent AMOC change.',
      uncertainty: 'Internal variability, model bias, freshwater forcing and scenario spread dominate quantitative uncertainty.',
      threshold_provenance: 'IPCC AR6 WGI Sections 9.2.3 and 4.3.2.3.',
      failure_behavior: 'Do not infer an annual emissions-to-sverdrup coefficient or label SSP spread as a confidence interval.'
    }
  }),
  boundedPromotion({
    source: 'urbanization',
    target: 'deforestation',
    verb: 'can cause',
    adverb: 'where outward built-up and infrastructure expansion permanently converts forest land',
    influence: 0.43,
    level: 'direct',
    relationshipType: 'bounded_urban_land_conversion_pathway',
    confidence: 'high',
    mechanism: 'Horizontal expansion of settlements, roads and urban infrastructure can replace forest with built land, producing permanent land-use conversion.',
    geography: 'Global FAO land-use attribution with strong regional variation; local attribution requires matched urban-footprint and forest-conversion maps.',
    period: 'FAO Global Remote Sensing Survey land-use change for 2000-2018 and IPCC urban-land evidence through AR6.',
    moderators: ['outward versus vertical growth', 'baseline forest cover', 'population density', 'planning and zoning', 'road infrastructure', 'agricultural displacement', 'forest protection'],
    alternatives: ['agriculture causes most global deforestation', 'urban growth often replaces cropland rather than forest', 'roads can enable indirect clearing beyond the built footprint'],
    counterevidence: 'FAO attributes only about 6 percent of assessed global deforestation to urban and infrastructure development, with strong regional variation. Built-up expansion is not synonymous with forest conversion.',
    evidenceBasis: 'authoritative_global_remote_sensing_attribution_with_independent_land_system_assessment',
    locators: [
      { url: 'https://www.fao.org/interactive/forests-2020-remotesensing-forestwater/remotesensing/en/', locator: 'FRA 2020 Remote Sensing Survey: urban and infrastructure development account for 6 percent of global deforestation in 2000-2018.', source_type: 'authoritative_global_remote_sensing_assessment' },
      { url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-8/', locator: 'Section on urban land: outward urban expansion occurs at the expense of cropland or forests; vertical and infill growth have different land effects.', source_type: 'independent_authoritative_assessment' }
    ],
    indicator: {
      metric_id: 'built_up_expansion_matched_to_forest_conversion',
      metric_name: 'Outward built-up expansion spatially matched to permanent forest conversion',
      unit: 'hectares built-up expansion and hectares forest conversion per year, reported separately',
      geography: 'declared urban footprint, administrative area and forest baseline',
      cadence: 'annual to multi-year remote-sensing update',
      source_id: 'fao_fra_remote_sensing_and_ghsl',
      transformation: 'Overlay harmonized built-up expansion with forest-to-built land transitions using fixed epochs, forest definitions and boundaries.',
      uncertainty: 'Sensor resolution, class definitions, road footprints, temporal mismatch and indirect displacement affect attribution.',
      threshold_provenance: 'FAO FRA land-use transition classes and reviewed built-up-surface products.',
      failure_behavior: 'Do not assign all urban expansion to forest loss or count temporary tree-cover loss as deforestation.'
    }
  })
]);
