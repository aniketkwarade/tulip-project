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
      notes: 'Promoted after full-text directed-claim review. Reported estimates remain study-specific and are not universal causal coefficients.',
      reviewed_at: '2026-07-25',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_bounded_directed_claim_readback',
        source,
        target,
        direction: `${source} can alter ${target} only through the bounded mechanism and conditions stated here`,
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

export const MISSING_LINK_RESEARCH_PROMOTION_EDGES_BATCH_THREE = Object.freeze([
  boundedPromotion({
    source: 'building_energy_efficiency',
    target: 'heat_related_mortality_burden',
    verb: 'can reduce',
    adverb: 'when envelope upgrades also improve passive heat resilience during extreme heat',
    influence: -0.52,
    level: 'indirect',
    relationshipType: 'bounded_building_heat_resilience_health_pathway',
    confidence: 'moderate',
    mechanism: 'Insulation, air sealing, glazing, shading, ventilation and related envelope measures can reduce dangerous indoor heat exposure when the retrofit is designed for the local climate and preserves heat rejection. Lower indoor heat exposure can reduce modeled heat-related mortality risk.',
    geography: 'Melbourne, Australia for the primary 2009-heatwave simulation; independent United States single-family retrofit simulations support the indoor-temperature mechanism but not a universal mortality effect.',
    period: 'Melbourne 2009 heatwave weather and the study building-stock assumptions; future scenarios and other climates require separate simulation or observation.',
    moderators: ['outdoor heat and humidity', 'retrofit design and quality', 'solar shading', 'ventilation and night cooling', 'thermal mass', 'air-conditioning availability', 'power reliability', 'occupant age and health', 'housing type and occupancy'],
    alternatives: ['heat warnings and behavior can change exposure', 'air-conditioning access can dominate indoor temperature', 'neighborhood heat and social vulnerability can affect mortality independently', 'the mortality model is not an observed retrofit trial'],
    counterevidence: 'Energy efficiency is not automatically heat resilience. Envelope measures can trap heat when shading, ventilation, cooling capacity or local-climate design are inadequate. The reported 90 percent mortality reduction is a model scenario for upgrading lower-rated Melbourne houses to at least 5.4 stars, not an observed effect or transferable coefficient.',
    evidenceBasis: 'building_simulation_with_empirical_health_functions_and_independent_heat_adaptation_simulation',
    locators: [
      {
        url: 'https://doi.org/10.1016/j.scs.2016.01.006',
        locator: 'Abstract and modeled results: Melbourne 2009 heatwave; 0.9-star house exposed occupants to almost 25 hours of extreme heat stress versus 6 hours in a 5.4-star house; modeled stock upgrade scenario estimated a possible 90 percent mortality reduction.',
        source_type: 'peer_reviewed_primary_building_and_health_simulation'
      },
      {
        url: 'https://doi.org/10.3389/frsc.2020.561828',
        locator: 'Results and health discussion: light and deep single-family retrofit scenarios reduced modeled maximum indoor temperature by 3.0-5.5 C and 4.3-8.9 C, respectively; indoor-temperature health benefits were discussed but not included in the quantified mortality estimates.',
        source_type: 'independent_peer_reviewed_building_simulation'
      }
    ],
    indicator: {
      metric_id: 'retrofit_conditioned_indoor_heat_and_health_burden',
      metric_name: 'Indoor heat exposure and modeled heat-related mortality under declared retrofit and counterfactual scenarios',
      unit: 'hours above a declared indoor heat threshold and modeled deaths or mortality rate, reported separately',
      geography: 'named building stock, climate zone and population',
      cadence: 'event-based heatwave simulation or linked observational health study',
      source_id: 'alam_2016_and_frontiers_2020_building_heat_studies',
      transformation: 'Retain weather event, energy-rating or retrofit package, building archetype, occupancy, cooling availability, indoor heat metric, health function and counterfactual separately.',
      uncertainty: 'Building-model error, behavioral assumptions, indoor-outdoor exposure, population vulnerability and the selected health function affect the result.',
      threshold_provenance: 'Study-native NatHERS energy rating, wet-bulb globe temperature, discomfort index and retrofit definitions.',
      failure_behavior: 'Do not display an efficiency-to-mortality percentage without the exact building stock, heatwave, retrofit, exposure model and health-function boundary.'
    }
  }),
  boundedPromotion({
    source: 'arctic_oscillation',
    target: 'drought_persistence',
    verb: 'can organize',
    adverb: 'through seasonally lagged circulation, temperature, precipitation and soil-moisture pathways',
    influence: 0.39,
    level: 'indirect',
    relationshipType: 'bounded_regional_ao_drought_teleconnection',
    confidence: 'moderate',
    mechanism: 'Arctic Oscillation phases alter pressure, storm-track and temperature patterns. In some regions and seasons, the resulting precipitation deficits, early warming, snowmelt and evapotranspiration can contribute to persistent dryness into the following season.',
    geography: 'Shaanxi Province in North China for 1960-2009 winter dryness/wetness associations, and the eastern Taimyr Peninsula in Central Siberia for the May-AO to summer-drought reconstruction; no hemispheric sign is asserted.',
    period: '1960-2009 instrumental drought-index analysis in Shaanxi and a 516-2009 CE tree-ring reconstruction calibrated mainly against 1948-2009 observations in Central Siberia.',
    moderators: ['AO phase and persistence', 'season and lag', 'regional storm tracks', 'ENSO and NAO state', 'snow cover and melt timing', 'soil moisture and permafrost', 'temperature and vapor-pressure deficit', 'topography and monsoon circulation'],
    alternatives: ['ENSO and regional monsoon variability can organize drought independently', 'volcanic forcing and internal variability affect circulation', 'temperature and precipitation trends can share drivers with the AO index', 'tree-ring isotope reconstructions contain proxy and calibration uncertainty'],
    counterevidence: 'The relationship is not sign-stable across the Northern Hemisphere. The Shaanxi study reports multiscale association rather than isolated causation, and the Siberian study is a single-site proxy reconstruction with a short instrumental calibration. Neither provides a universal AO-index-to-drought coefficient.',
    evidenceBasis: 'regional_instrumental_wavelet_association_with_independent_long_proxy_reconstruction',
    locators: [
      {
        url: 'https://doi.org/10.1016/j.atmosres.2017.10.012',
        locator: 'Abstract, methods and conclusions: self-calibrating PDSI, EOF and wavelet coherence for Shaanxi winter dryness/wetness during 1960-2009; positive multiscale PDSI-AO relations over most of the province.',
        source_type: 'peer_reviewed_regional_instrumental_association'
      },
      {
        url: 'https://doi.org/10.1038/s41598-021-97911-2',
        locator: 'Abstract, Results and Discussion: 516-2009 CE larch-isotope reconstruction; positive May AO linked to warm, dry conditions, reduced July precipitation and drought/fire context in the eastern Taimyr Peninsula, with instrumental correlations reported for 1948-2009 and 1969-2009.',
        source_type: 'peer_reviewed_open_proxy_reconstruction'
      }
    ],
    indicator: {
      metric_id: 'seasonal_ao_conditioned_regional_drought',
      metric_name: 'Regional drought metric conditioned on declared Arctic Oscillation phase and seasonal lag',
      unit: 'standardized AO index and PDSI, precipitation anomaly or soil-moisture anomaly, reported separately',
      geography: 'declared station, grid or proxy-reconstruction domain',
      cadence: 'monthly observations with seasonal or annual relationship reassessment',
      source_id: 'noaa_ao_index_and_regional_drought_observations',
      transformation: 'Match AO month or season to the regional drought variable at the study-native lag; retain sign, geography, season, period, detrending and covariates.',
      uncertainty: 'Sampling, proxy reconstruction, multiple time scales, autocorrelation, confounding climate modes and regional sign reversal limit transfer.',
      threshold_provenance: 'Study-native self-calibrating PDSI, precipitation reconstruction and AO definitions.',
      failure_behavior: 'Do not apply the Shaanxi or Taimyr sign globally, collapse seasons, or infer drought persistence from the AO index without a validated regional lag relationship.'
    }
  }),
  boundedPromotion({
    source: 'temp',
    target: 'coastal_hypoxia',
    verb: 'can intensify',
    adverb: 'through lower oxygen solubility, higher metabolic oxygen demand, and stronger or longer-lived stratification',
    influence: 0.62,
    level: 'indirect',
    relationshipType: 'bounded_warming_coastal_deoxygenation_pathway',
    confidence: 'high',
    mechanism: 'Warmer seawater holds less dissolved oxygen, can increase organism and microbial oxygen demand, and can strengthen or prolong density stratification that limits ventilation of bottom waters. These pathways can increase oxygen stress in susceptible coastal waters, while nutrient loading, circulation and runoff remain independent and often dominant controls.',
    geography: 'Global coastal-ocean model grid and 532 documented coastal hypoxic areas for the primary analysis; individual estuaries, embayments and nearshore systems may not be resolved by the coarse model.',
    period: 'Observations analyzed for 1982-2021 and projections for 2006-2100 under declared climate-model scenarios.',
    moderators: ['nutrient loading and eutrophication', 'freshwater runoff', 'salinity and density structure', 'coastal circulation and upwelling', 'storm mixing', 'water depth and residence time', 'sediment oxygen demand', 'ecosystem metabolism', 'emissions scenario and climate-model choice'],
    alternatives: ['nutrient enrichment can drive coastal hypoxia independently of warming', 'circulation and upwelling shifts can raise or lower oxygen', 'storm mixing can ventilate bottom water', 'local salinity and freshwater change can dominate stratification', 'coarse global models omit many estuarine processes'],
    counterevidence: 'The primary model projects heterogeneous local oxygen trends, does not resolve many estuaries, and does not attribute every documented hypoxic event to warming. Nutrients, runoff, salinity, circulation and storms can dominate or reverse local trends. The reported oxygen-capacity trends are scenario- and model-specific pressure indicators, not a universal temperature-to-hypoxic-area coefficient.',
    evidenceBasis: 'global_observational_trend_analysis_and_coastal_ocean_projection_with_mechanistic_physiochemical_support',
    locators: [
      {
        url: 'https://doi.org/10.5194/bg-19-4479-2022',
        locator: 'Abstract, Methods, Table 1, Results and Discussion: 1982-2021 observed coastal warming and 2006-2100 projected sea-surface-temperature, oxygen-capacity and vertical-minimum-oxygen trends along the global coast and at documented hypoxic locations.',
        source_type: 'peer_reviewed_open_primary_observation_and_model_analysis'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/',
        locator: 'AR6 WGII Chapter 3 assessment of ocean warming, stratification, oxygen loss and coastal-system risks; authoritative mechanism corroboration rather than an edge-specific coefficient.',
        source_type: 'authoritative_assessment_mechanism_corroboration'
      }
    ],
    indicator: {
      metric_id: 'coastal_warming_conditioned_oxygen_pressure',
      metric_name: 'Coastal sea-surface-temperature trend paired with oxygen-capacity and vertical-minimum-oxygen trends',
      unit: 'degrees Celsius per decade and millimoles oxygen per cubic metre per decade, reported separately',
      geography: 'declared coastal grid cells or documented hypoxic-area subset',
      cadence: 'annual update with multidecadal trend reassessment',
      source_id: 'copernicus_bg_2022_global_coastal_hypoxia_analysis',
      transformation: 'Retain observed versus projected period, scenario, model, coastal mask, hypoxic-area subset, sea-surface-temperature trend, oxygen-capacity trend and vertical-minimum-oxygen trend separately.',
      uncertainty: 'Model structure, scenario, coarse coastal resolution, salinity assumptions, local nutrient and runoff data, circulation, storm mixing and trend-estimation uncertainty affect interpretation.',
      threshold_provenance: 'Study-native documented-hypoxic-area inventory, coastal-grid definition and oxygen variables; no new platform hypoxia threshold is inferred.',
      failure_behavior: 'Do not convert a coastal temperature trend directly into hypoxic area, event count or mortality, and do not apply global-grid trends to an unresolved estuary.'
    }
  }),
  boundedPromotion({
    source: 'deforestation',
    target: 'monsoon_volatility',
    verb: 'can destabilize',
    adverb: 'through land-surface energy, moisture-recycling, pressure-gradient and circulation changes under large-scale forest loss',
    influence: 0.48,
    level: 'indirect',
    relationshipType: 'bounded_large_scale_deforestation_monsoon_disruption',
    confidence: 'moderate',
    mechanism: 'Large-scale forest removal changes albedo, surface roughness, evapotranspiration and moisture recycling. The resulting land-temperature and hemispheric-energy contrasts can alter pressure gradients, cross-equatorial flow, monsoon circulation and rainfall. The evidence supports disruption and regional shifts, not a globally uniform increase in statistical rainfall variance.',
    geography: 'Global monsoon domain and land-monsoon regions in an 11-model LUMIP/CMIP6 idealized deforestation experiment, with independent South American and Indian regional model evidence.',
    period: 'Idealized paired-model response to approximately 38 percent global forest removal; regional corroboration uses study-specific simulated periods and scenarios rather than an observed annual deforestation time series.',
    moderators: ['location and fraction of forest removed', 'background sea-surface temperatures', 'land-atmosphere coupling', 'soil moisture and evapotranspiration', 'aerosols and greenhouse forcing', 'ITCZ position', 'topography', 'model parameterization', 'monsoon region and season'],
    alternatives: ['greenhouse forcing and ocean variability alter monsoons independently', 'aerosols can shift regional monsoon circulation', 'irrigation and other land-use changes affect surface fluxes', 'ENSO and other internal modes can dominate individual seasons'],
    counterevidence: 'The global multi-model precipitation response spans negative and positive values, regional responses differ, and the experiment removes roughly 38 percent of global forest rather than observing a marginal real-world change. The primary outcome is mean precipitation and circulation change, not a universal onset-variance or volatility coefficient.',
    evidenceBasis: 'paired_multi_model_idealized_land_use_experiment_with_independent_regional_model_corroboration',
    locators: [
      {
        url: 'https://doi.org/10.1029/2022EF002863',
        locator: 'Methods, Results and Discussion: paired LUMIP/CMIP6 deforestation experiments across 11 models; approximately 38 percent global deforestation; multi-model monsoon precipitation and circulation responses with cross-model ranges.',
        source_type: 'peer_reviewed_primary_multi_model_experiment'
      },
      {
        url: 'https://doi.org/10.1126/sciadv.add9973',
        locator: 'South American monsoon analysis retained as independent regional corroboration for a deforestation-conditioned circulation transition, not as a global coefficient.',
        source_type: 'peer_reviewed_independent_regional_corroboration'
      }
    ],
    indicator: {
      metric_id: 'deforestation_conditioned_monsoon_response',
      metric_name: 'Monsoon precipitation and circulation anomaly under a declared forest-loss counterfactual',
      unit: 'forest-area fraction removed, millimetres precipitation per year or day, and metres per second circulation anomaly, reported separately',
      geography: 'declared global monsoon domain, land-monsoon domain or named regional monsoon',
      cadence: 'model-experiment release or observational attribution update',
      source_id: 'lumip_cmip6_deforestation_monsoon_experiment',
      transformation: 'Pair each forest-loss experiment with its control; retain model, removed-forest fraction, geography, season, precipitation metric, circulation metric and cross-model range.',
      uncertainty: 'Model spread, idealized land conversion, regional sign changes, coupled-ocean response, background forcing and land-surface parameterization limit transfer.',
      threshold_provenance: 'Study-native LUMIP deforestation experiment and monsoon-domain definitions.',
      failure_behavior: 'Do not map the FAO annual gross-deforestation rate directly onto the idealized model effect, and do not label mean rainfall change as observed onset variability.'
    }
  }),
  boundedPromotion({
    source: 'urbanization',
    target: 'water_stress',
    verb: 'can intensify',
    adverb: 'when population, demand and pollution pressures outpace water-system efficiency and regional coordination',
    influence: 0.43,
    level: 'indirect',
    relationshipType: 'bounded_urbanization_water_quantity_quality_pressure',
    confidence: 'moderate',
    mechanism: 'Urban population growth, construction, consumption and industrial concentration can raise blue-water demand and grey-water pollution pressure within and beyond administrative boundaries. Agglomeration, industrial restructuring, infrastructure and water-efficiency improvements can moderate or reverse the net effect at higher development levels.',
    geography: 'Thirty-one Chinese provincial-level regions for the primary spatial analysis and 30 mainland Chinese provinces for the independent 2006-2020 panel study; no global sign is asserted.',
    period: 'Study-specific Chinese provincial panel periods, including 2006-2020 for the independent open full-text analysis.',
    moderators: ['population urbanization', 'economic urbanization', 'spatial urbanization', 'social urbanization', 'industrial structure', 'water-use efficiency', 'wastewater treatment', 'water transfers and trade', 'regional water availability', 'water-quality accounting', 'urban development stage'],
    alternatives: ['industrial structure can change water pressure independently', 'climate and hydrology affect available supply', 'agricultural demand can dominate provincial water stress', 'water policy and infrastructure can reduce demand or pollution', 'spatial spillovers can reflect trade and shared basins rather than urbanization alone'],
    counterevidence: 'Both studies report nonlinear and heterogeneous effects. The primary study finds threshold behavior and mitigating interactions with industrial restructuring; the independent study reports an inverted-U relationship for combined water-energy-food pressure, different signs across urbanization dimensions, and regional insignificance outside eastern China. The edge therefore does not encode a universal monotonic urban-population coefficient.',
    evidenceBasis: 'provincial_spatial_econometric_panel_analysis_with_independent_open_fixed_effects_and_nonlinearity_study',
    locators: [
      {
        url: 'https://doi.org/10.1016/j.scs.2022.103686',
        locator: 'Publisher abstract, highlights and methods summary: 31 Chinese provinces; water-footprint stress index incorporating use and pollution; spatial Durbin and panel-threshold models; surrounding-region and threshold effects.',
        source_type: 'peer_reviewed_primary_spatial_panel_study'
      },
      {
        url: 'https://doi.org/10.1016/j.scs.2024.105411',
        locator: 'Open full text, Methods, Tables 4-5, robustness tests and Conclusions: 30 Chinese provinces, 2006-2020; composite new-urbanization index; grey-water footprint; fixed-effects, nonlinear and regional-heterogeneity results.',
        source_type: 'peer_reviewed_open_independent_panel_corroboration'
      }
    ],
    indicator: {
      metric_id: 'urbanization_conditioned_water_stress',
      metric_name: 'Water quantity-and-quality stress paired with a declared urbanization index',
      unit: 'study-native dimensionless urbanization and water-stress indices, with blue and grey water-footprint components retained separately',
      geography: 'declared province, basin or urban region',
      cadence: 'annual panel update with periodic model reassessment',
      source_id: 'china_provincial_urbanization_water_stress_panel_studies',
      transformation: 'Retain urbanization dimensions, water quantity and quality components, spatial weights, industrial structure, fixed effects, nonlinear terms, geography and year; report direct and spillover effects separately.',
      uncertainty: 'Composite-index construction, spatial-weight choice, endogeneity, omitted hydrology or policy, model form, regional heterogeneity and threshold estimation affect the relationship.',
      threshold_provenance: 'Study-native entropy-weighted urbanization indices, water-footprint stress measures and estimated nonlinear thresholds.',
      failure_behavior: 'Do not apply the Chinese provincial sign globally, collapse population and eco-environmental urbanization into one causal factor, or interpret an index coefficient as a physical water-withdrawal coefficient.'
    }
  }),
  boundedPromotion({
    source: 'madden_julian_oscillation',
    target: 'extreme_precipitation_intensity',
    verb: 'can organize',
    adverb: 'through phase-dependent tropical convection, Rossby-wave teleconnections and regional moisture transport',
    influence: 0.57,
    level: 'direct',
    relationshipType: 'bounded_mjo_extreme_precipitation_teleconnection',
    confidence: 'high',
    mechanism: 'The propagating convective and circulation anomalies of the Madden-Julian Oscillation alter upper-level divergence, Rossby-wave trains and low-level moisture availability. During particular active phases these teleconnections change the probability, spatial extent and intensity of extreme precipitation in downstream regions.',
    geography: 'Contiguous United States sectors during boreal winter for the primary 1979-2010 analysis; phase and sign are region-specific and cannot be transferred globally.',
    period: 'November-March days from 1979-2010 in the primary gridded observational analysis.',
    moderators: ['MJO phase', 'MJO activity threshold', 'ENSO phase', 'season', 'regional storm track', 'moisture availability', 'topography', 'extreme-percentile definition', 'precipitation dataset'],
    alternatives: ['ENSO changes extreme precipitation independently', 'synoptic storms can occur without an active MJO', 'atmospheric rivers and blocking affect regional extremes', 'the MJO is not the sole predictor and amplitude was not a monotonic control in the study'],
    counterevidence: 'The conditioned response varies by CONUS sector, MJO phase and ENSO state. The authors report no clear phase predominance for every 90th-percentile spatial-extent event and conclude that the MJO is not the sole player; probabilities did not depend on MJO amplitude. The edge is therefore a probabilistic teleconnection, not a deterministic event attribution.',
    evidenceBasis: 'daily_gridded_observational_composite_and_conditional_probability_analysis',
    locators: [
      {
        url: 'https://doi.org/10.1175/JCLI-D-11-00278.1',
        locator: 'Abstract, Methods, Results and Conclusions: 1979-2010 boreal-winter CONUS contiguous regions exceeding 75th and 90th precipitation percentiles; active/inactive MJO and phase- and ENSO-conditioned spatial-extent and intensity probabilities.',
        source_type: 'peer_reviewed_primary_observational_teleconnection_analysis'
      },
      {
        url: 'https://repository.library.noaa.gov/view/noaa/28716',
        locator: 'NOAA-hosted independent mechanism study describing MJO upper-level and low-level moisture teleconnections to North American precipitation.',
        source_type: 'authoritative_repository_mechanism_corroboration'
      }
    ],
    indicator: {
      metric_id: 'mjo_conditioned_extreme_precipitation',
      metric_name: 'Extreme-precipitation intensity and spatial extent conditioned on MJO activity and phase',
      unit: 'MJO index phase and amplitude, precipitation percentile exceedance, conditional probability and affected-area fraction, reported separately',
      geography: 'declared precipitation grid and regional sector',
      cadence: 'daily monitoring with seasonal and multidecadal reassessment',
      source_id: 'noaa_mjo_index_and_gridded_precipitation',
      transformation: 'Classify active MJO days and phases using the declared index; calculate region-specific intensity and area exceedances against study-native seasonal percentiles; stratify by ENSO.',
      uncertainty: 'Precipitation dataset, percentile threshold, MJO classification, sample size by phase, ENSO interaction and non-MJO synoptic variability affect conditional probabilities.',
      threshold_provenance: 'Study-native active-MJO definition and 75th and 90th percentile contiguous-region thresholds.',
      failure_behavior: 'Do not use the CONUS winter probability ratio as a global event attribution or infer a deterministic extreme from an MJO phase.'
    }
  }),
  boundedPromotion({
    source: 'pacific_north_american_pattern',
    target: 'wildfire_regime_shift',
    verb: 'can modulate',
    adverb: 'through lagged regional temperature, precipitation, drought and fuel-condition anomalies',
    influence: 0.46,
    level: 'indirect',
    relationshipType: 'bounded_pna_fire_danger_and_occurrence_teleconnection',
    confidence: 'moderate',
    mechanism: 'Positive and negative Pacific-North American pattern phases reorganize regional temperature, precipitation and drought conditions. Those anomalies can change potential fire danger and the geography and timing of observed wildfire occurrence, with lags of days to weeks.',
    geography: 'Northern Hemisphere extratropical regions in the 2001-2020 study, with specific responses in Alaska, northwestern Canada, western North America, western Russia, northeastern Europe, the Baltic states and central Asia.',
    period: 'March-October during 2001-2020, with satellite fire comparisons concentrated in the 2001-2016 overlap.',
    moderators: ['PNA phase and threshold', 'region', 'season', 'lag', 'Arctic Oscillation state', 'temperature and precipitation anomalies', 'drought duration', 'fuel availability and decomposition', 'ignitions and suppression', 'fire-danger-index specification'],
    alternatives: ['Arctic Oscillation and other climate modes covary with fire weather', 'human ignition and suppression affect occurrence', 'fuel management and land use alter fire regime independently', 'a fire-danger index does not capture all fire controls'],
    counterevidence: 'The study is a composite and lag-correlation analysis, not isolated causal attribution. PNA phase has opposite or weak effects across regions, observed fire occurrence can be in phase rather than lagged, and the authors state that the fire index omits dimensions of fire forcing. The edge does not imply a uniform or secular wildfire trend.',
    evidenceBasis: 'hemispheric_reanalysis_composites_fire_danger_indices_and_satellite_fire_occurrence',
    locators: [
      {
        url: 'https://doi.org/10.1038/s41612-022-00274-2',
        locator: 'Open full text, Results Figs. 1-7 and Discussion: 2001-2020 AO/PNA composites, fire-danger indices, lags and MODIS fire occurrence; regional PNA phase responses and stated limitations.',
        source_type: 'peer_reviewed_open_primary_observational_composite_analysis'
      },
      {
        url: 'https://www.cpc.ncep.noaa.gov/data/teledoc/pna.shtml',
        locator: 'NOAA Climate Prediction Center definition of the PNA and associated regional temperature and precipitation anomaly patterns; retained as teleconnection-mechanism corroboration, not an independent wildfire estimate.',
        source_type: 'authoritative_teleconnection_mechanism_corroboration'
      }
    ],
    indicator: {
      metric_id: 'pna_conditioned_fire_danger_occurrence',
      metric_name: 'Regional fire danger and wildfire occurrence conditioned on PNA phase and lag',
      unit: 'standardized PNA index, fire-danger index, hotspot count or share, and lag days, reported separately',
      geography: 'declared extratropical analysis region',
      cadence: 'daily to weekly monitoring during the regional fire season',
      source_id: 'noaa_pna_index_reanalysis_and_modis_fire_occurrence',
      transformation: 'Stratify temperature, precipitation, drought, fire-danger and hotspot observations by PNA phase, region, season and lag; retain AO state and index definition.',
      uncertainty: 'Composite sample size, climate-mode covariance, fire-detection completeness, index calibration, human ignition and suppression, and spatial aggregation limit attribution.',
      threshold_provenance: 'Study-native PNA phase threshold, PFIv2/FWI definitions and MODIS hotspot criteria.',
      failure_behavior: 'Do not apply a phase sign outside the studied region, equate danger with burned area, or label a short-term teleconnection as a long-term fire-regime trend.'
    }
  }),
  boundedPromotion({
    source: 'coastal_inundation_risk',
    target: 'critical_infrastructure_fragility',
    verb: 'can expose and damage',
    adverb: 'when storm-tide depth and extent exceed the elevation and protection of coastal assets',
    influence: 0.61,
    level: 'direct',
    relationshipType: 'bounded_coastal_inundation_infrastructure_damage_pathway',
    confidence: 'moderate',
    mechanism: 'Storm surge, astronomical tide and sea-level rise combine to inundate low-elevation coastal assets. Water depth and extent intersected with infrastructure and building inventories create direct physical exposure and damage potential; actual functional failure also depends on asset vulnerability, redundancy and protection.',
    geography: 'Mauritius Island for the primary GIS flood-and-asset assessment, with East Asian seaport and European critical-infrastructure studies retained as independent geographic corroboration.',
    period: 'Current and projected storm-tide scenarios through 2100, 2200, 2300 and 2500 in the Mauritius study; return periods and sea-level scenarios remain study-specific.',
    moderators: ['storm-surge magnitude', 'astronomical tide', 'sea-level scenario', 'return period', 'asset elevation', 'flood depth and duration', 'coastal defenses', 'building and infrastructure vulnerability', 'network redundancy', 'adaptation and maintenance'],
    alternatives: ['wind and wave damage can disrupt assets without inundation', 'pluvial and river flooding can coincide', 'asset deterioration and operational failures affect fragility independently', 'exposure mapping does not observe service outage or recovery'],
    counterevidence: 'The primary study models tangible exposure and damage rather than observed infrastructure service failure, and long-horizon results depend on flood, sea-level and asset assumptions. A mapped exposed asset is not necessarily fragile or disrupted. The edge therefore stops at conditional physical exposure and damage potential.',
    evidenceBasis: 'gis_based_coastal_flood_model_intersected_with_asset_inventory_and_scenario_damage_assessment',
    locators: [
      {
        url: 'https://doi.org/10.1016/j.ijdrr.2024.104909',
        locator: 'Abstract and reported results: Mauritius storm-tide inundation model, exposed infrastructure/building assets, return-period scenarios, future sea levels and critical inundation thresholds.',
        source_type: 'peer_reviewed_primary_scenario_damage_assessment'
      },
      {
        url: 'https://doi.org/10.1016/j.ocecoaman.2017.02.015',
        locator: 'Independent East Asian seaport cyclone-risk mapping retained as infrastructure-sector corroboration, not as a Mauritius coefficient.',
        source_type: 'peer_reviewed_independent_sector_corroboration'
      }
    ],
    indicator: {
      metric_id: 'coastal_inundation_exposed_critical_assets',
      metric_name: 'Critical assets and building area exposed above a declared coastal-inundation depth',
      unit: 'square kilometres or count of exposed assets, flood depth, affected-area share and modeled damage value, reported separately',
      geography: 'declared island, coast, port or infrastructure network',
      cadence: 'event-based observation and scenario reassessment after asset, defense or sea-level updates',
      source_id: 'coastal_flood_model_and_critical_asset_inventory',
      transformation: 'Intersect depth-resolved inundation footprints with dated asset inventories; retain return period, tide, surge, sea level, defense assumptions, vulnerability function and asset class.',
      uncertainty: 'Elevation, surge and wave modeling, return periods, sea-level scenario, asset inventory, vulnerability curves, adaptation and functional redundancy affect damage estimates.',
      threshold_provenance: 'Study-native storm-tide return periods and reported 1.5 m and 4.5 m critical inundation levels for Mauritius.',
      failure_behavior: 'Do not display exposed area as observed outage, apply Mauritius thresholds elsewhere, or aggregate buildings and critical network assets without class-specific vulnerability.'
    }
  }),
  boundedPromotion({
    source: 'deforestation',
    target: 'vector_borne_disease_expansion',
    verb: 'can enable',
    adverb: 'when forest conversion creates habitat and host-contact conditions favorable to competent disease vectors',
    influence: 0.49,
    level: 'indirect',
    relationshipType: 'bounded_forest_conversion_vector_habitat_pathway',
    confidence: 'moderate',
    mechanism: 'Forest conversion changes canopy, light, temperature, standing water, predators, host communities and human contact patterns. In some tropical settings these changes favor mosquito species that transmit human pathogens, increasing vector abundance or richness and creating conditions that can support disease emergence or geographic expansion.',
    geography: 'Tropical deforested and forested study sites synthesized in the primary review, with independent Latin American and Caribbean mosquito records; vector, pathogen and land-use responses differ substantially by region.',
    period: 'Study-specific field periods represented in the evidence synthesis and the 2023 comparative mosquito-record analysis; no single global time trend is asserted.',
    moderators: ['vector species', 'pathogen and reservoir host', 'forest edge and conversion type', 'standing-water habitat', 'temperature and humidity', 'human settlement and mobility', 'agricultural practice', 'vector control', 'healthcare and surveillance', 'urbanization'],
    alternatives: ['urbanization can favor some vectors independently of deforestation', 'climate variability changes vector suitability', 'travel and trade introduce pathogens', 'public-health interventions alter cases independently of vector abundance', 'some vectors decline after forest conversion'],
    counterevidence: 'The primary synthesis reports conflicting disease responses across systems, many included studies sampled selected vector taxa rather than complete communities, and vector abundance or richness is not equivalent to pathogen transmission or diagnosed disease. The direction is species-, pathogen-, geography- and conversion-specific.',
    evidenceBasis: 'systematic_evidence_synthesis_of_forest_conversion_and_mosquito_vectors_with_independent_regional_field_record_analysis',
    locators: [
      {
        url: 'https://doi.org/10.1016/j.baae.2017.09.012',
        locator: 'Abstract, methods summary and synthesis results: comparison of mosquito vectors in deforested or converted tropical habitats and intact forest, including conflicting system responses and taxonomic sampling limitations.',
        source_type: 'peer_reviewed_primary_evidence_synthesis'
      },
      {
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10348580/',
        locator: 'Independent Latin America and Caribbean comparative analysis of 10,244 Aedes and Anopheles records; forest-loss and land-use associations, including taxonomic and scale heterogeneity.',
        source_type: 'peer_reviewed_open_regional_corroboration'
      }
    ],
    indicator: {
      metric_id: 'forest_conversion_conditioned_vector_suitability',
      metric_name: 'Competent-vector abundance or richness and disease incidence conditioned on declared forest conversion',
      unit: 'forest-cover change, vector abundance or species richness, pathogen prevalence and human incidence, reported separately',
      geography: 'declared field site, administrative region and vector range',
      cadence: 'seasonal entomological surveillance with annual land-cover and disease reassessment',
      source_id: 'forest_cover_vector_surveillance_and_disease_reporting',
      transformation: 'Join dated forest-cover and conversion data to species-resolved vector sampling and pathogen or case surveillance; retain sampling effort, habitat, edge distance, climate, population and intervention covariates.',
      uncertainty: 'Taxonomic identification, trap design, sampling effort, spatial scale, pathogen presence, host contact, surveillance completeness and confounding land use affect inference.',
      threshold_provenance: 'Study-native forest, converted-land and vector definitions; no vector abundance threshold is converted into a disease threshold.',
      failure_behavior: 'Do not display vector richness as disease cases, generalize one mosquito response to all vectors, or infer a global disease-expansion rate from forest loss alone.'
    }
  }),
  boundedPromotion({
    source: 'thermal_stratification_intensification',
    target: 'marine_food_web_simplification',
    verb: 'can contract',
    adverb: 'when prolonged stratification suppresses primary production and narrows basal-resource and consumer niche space',
    influence: 0.41,
    level: 'indirect',
    relationshipType: 'bounded_stratification_benthic_food_web_niche_contraction',
    confidence: 'moderate',
    mechanism: 'Seasonal thermal stratification reduces vertical mixing and can limit nutrient delivery and primary production. At the Gulf of Lions study site, the stratified low-productivity season coincided with contraction of total benthic isotopic niche space, especially among low-trophic-level consumers, consistent with a narrower food-web resource base.',
    geography: 'Terrigenous-mud benthic community on the Gulf of Lions continental shelf in the northwestern Mediterranean; independent sub-Arctic shelf evidence shows that the response is not geographically universal.',
    period: 'Two 2018 sampling campaigns comparing April mixed/high-productivity and September end-of-summer stratified/low-productivity conditions.',
    moderators: ['stratification duration and strength', 'nutrient supply', 'primary production', 'water depth', 'benthic-pelagic coupling', 'taxonomic composition', 'trawling pressure', 'seasonal recruitment', 'organic-matter sources', 'temperature independent of mixing'],
    alternatives: ['seasonal biology can change isotope niches independently of stratification', 'intense trawling affected sampling and community structure', 'food-source shifts may alter isotope space without fewer trophic links', 'two campaigns cannot establish a long-term regime shift'],
    counterevidence: 'The study compares only two seasons at one trawled site and reports isotopic niche contraction rather than directly counting food-web links or extinctions. A separate highly stratified sub-Arctic shelf study reports little spatial or temporal change and possible resilience from benthic primary producers. The edge therefore does not assert inevitable global simplification.',
    evidenceBasis: 'paired_seasonal_stable_isotope_food_web_analysis_with_independent_geographic_counterevidence',
    locators: [
      {
        url: 'https://doi.org/10.1016/j.rsma.2023.103359',
        locator: 'Abstract and study design: April mixed/high-productivity and September stratified/low-productivity 2018 sampling; stable-isotope food-web analysis; contraction of total niche space concentrated among low trophic levels.',
        source_type: 'peer_reviewed_primary_seasonal_field_study'
      },
      {
        url: 'https://doi.org/10.1016/j.ecss.2024.108982',
        locator: 'Independent sub-Arctic benthic-food-web study retained as counterevidence: little temporal or spatial structural change under contrasting thermal stratification and possible resilience from benthic primary producers.',
        source_type: 'peer_reviewed_independent_counterevidence'
      }
    ],
    indicator: {
      metric_id: 'stratification_conditioned_food_web_niche_space',
      metric_name: 'Marine food-web isotopic niche space conditioned on thermal stratification and productivity',
      unit: 'stratification metric, primary-productivity indicator and carbon-nitrogen isotopic niche area, reported separately',
      geography: 'declared shelf, basin and benthic or pelagic community',
      cadence: 'seasonal sampling with multi-year reassessment',
      source_id: 'paired_hydrography_primary_production_and_stable_isotope_food_web_surveys',
      transformation: 'Pair hydrographic stratification and productivity observations with taxon-resolved carbon and nitrogen stable isotopes; retain sampling season, depth, trawling, taxa, trophic level and niche-area method.',
      uncertainty: 'Limited seasonal samples, isotope-baseline shifts, taxon coverage, trawling, spatial heterogeneity and distinction between niche contraction and network simplification affect interpretation.',
      threshold_provenance: 'Study-native mixed versus stratified campaign and stable-isotope niche metrics.',
      failure_behavior: 'Do not equate seasonal isotope-space contraction with species extinction, global food-web collapse or a permanent regime shift.'
    }
  }),
  boundedPromotion({
    source: 'el_nino',
    target: 'drought_persistence',
    verb: 'can prolong',
    adverb: 'through regionally persistent rainfall deficits and lagged soil, river and reservoir responses',
    influence: 0.47,
    level: 'indirect',
    relationshipType: 'bounded_regional_el_nino_drought_persistence_teleconnection',
    confidence: 'moderate',
    mechanism: 'El Niño reorganizes tropical convection and atmospheric circulation, producing sustained rainfall deficits in some regions. Meteorological deficits can persist through soil-moisture, river-flow, reservoir and peatland memory after the atmospheric anomaly develops, extending agricultural, hydrological and fire-weather drought conditions.',
    geography: 'Java and the broader Indonesian maritime region for the open satellite and gauge evidence, and the Poyang Lake basin in China for independent lagged ENSO-drought analysis; California provides explicit opposite-sign regional counterevidence.',
    period: 'The 2015-2016 El Niño drought in the Java study, longer annual Indonesian records in the independent fire-drought analysis, and study-specific multiyear Poyang Lake observations.',
    moderators: ['El Niño type and strength', 'region and season', 'Indian Ocean Dipole', 'monsoon circulation', 'antecedent soil moisture', 'river and reservoir storage', 'peat degradation and land use', 'local rainfall variability', 'drought-index accumulation period'],
    alternatives: ['Indian Ocean Dipole and monsoon variability can drive regional drought', 'land-surface and hydrologic memory can sustain drought after ENSO weakens', 'water management alters reservoir and agricultural drought', 'El Niño can increase precipitation and relieve drought in other regions'],
    counterevidence: 'The sign is not global: El Niño often favors wetter conditions in parts of California and the southern United States, and the 2015-2016 event did not end the multiyear California drought uniformly. Regional drought can also persist through land and water-storage feedbacks after ENSO. The edge is therefore a lagged regional teleconnection, not a universal El Niño-to-drought coefficient.',
    evidenceBasis: 'regional_satellite_gauge_drought_analysis_with_lagged_enso_hydrologic_study_and_opposite_sign_counterevidence',
    locators: [
      {
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC9165873/',
        locator: 'Open full text, Results and Discussion: SPI drought indicators for major Java rice-producing districts during the 2015-2016 El Niño and reported 5-6 month river-flow and reservoir-level lag.',
        source_type: 'peer_reviewed_open_regional_satellite_and_station_analysis'
      },
      {
        url: 'https://doi.org/10.1016/j.atmosres.2022.106218',
        locator: 'Independent Poyang Lake basin analysis of El Niño and La Niña impacts on drought events at varied lags and circulation mechanisms.',
        source_type: 'peer_reviewed_independent_lagged_drought_analysis'
      },
      {
        url: 'https://doi.org/10.1073/pnas.1524888113',
        locator: 'Independent Indonesian satellite, gauge and fire record showing persistent nonlinear sensitivity during prolonged El Niño-associated rainfall deficits; retained as drought-duration and land-use interaction evidence.',
        source_type: 'peer_reviewed_open_independent_regional_corroboration'
      }
    ],
    indicator: {
      metric_id: 'el_nino_conditioned_regional_drought_duration',
      metric_name: 'Regional drought duration and hydrologic lag conditioned on El Niño state',
      unit: 'Niño index anomaly, SPI or related drought index, months below threshold, rainfall rate, river flow and reservoir level, reported separately',
      geography: 'declared basin, island, district or grid',
      cadence: 'monthly monitoring with event and seasonal reassessment',
      source_id: 'noaa_enso_index_and_regional_precipitation_hydrology',
      transformation: 'Pair study-native El Niño classification with regional precipitation and drought indices; calculate threshold duration and hydrologic lag while retaining season, IOD, antecedent state and water management.',
      uncertainty: 'Drought-index choice, precipitation dataset, sparse gauges, ENSO definition, compound climate modes, hydrologic memory and land management affect attribution.',
      threshold_provenance: 'Study-native SPI accumulation periods, El Niño definition and reported hydrologic lag.',
      failure_behavior: 'Do not apply an Indonesian or Poyang sign to California or another region, infer drought from El Niño alone, or treat a 5-6 month regional lag as a universal coefficient.'
    }
  }),
  boundedPromotion({
    source: 'temp',
    target: 'sea_level_rise',
    verb: 'raises',
    adverb: 'partly through ocean thermal expansion, alongside separately measured land-ice mass loss',
    influence: 0.72,
    level: 'direct',
    relationshipType: 'bounded_warming_thermosteric_sea_level_pathway',
    confidence: 'high',
    mechanism: 'Ocean warming lowers seawater density and expands the ocean volume, raising global mean thermosteric sea level. Total sea-level rise also contains land-ice, land-water-storage, circulation, salinity and local vertical-land-motion terms that must remain separate.',
    geography: 'Global mean thermosteric sea level; local relative sea level can depart substantially from the global mean.',
    period: 'IPCC-assessed historical rates for 1970-2015, 1993-2015 and 2006-2015, with future response dependent on the emissions pathway and ocean heat uptake.',
    moderators: ['vertically integrated ocean heat uptake', 'ocean basin and depth', 'salinity', 'circulation', 'land-ice mass change', 'land-water storage', 'gravitational and rotational fingerprints', 'vertical land motion', 'assessment period'],
    alternatives: ['glacier and ice-sheet mass loss raises total sea level independently of thermal expansion', 'groundwater depletion and reservoir storage alter ocean mass', 'circulation and vertical land motion dominate some local records'],
    counterevidence: 'Global surface-air temperature is not a universal conversion factor for local or total sea level. Thermal expansion is only one component, the response is time-scale dependent, and local relative sea level can differ in sign or magnitude because of ocean dynamics and land motion.',
    evidenceBasis: 'ipcc_authoritative_assessment_of_ocean_warming_thermosteric_expansion_and_component_separation',
    locators: [
      {
        url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
        locator: 'Chapter 9, Box 9.1 and Section 9.2.4.1: density-driven thermal expansion, global mean thermosteric sea-level change and assessed historical rates; total and local component boundaries.',
        source_type: 'authoritative_scientific_assessment'
      },
      {
        url: 'https://oceanservice.noaa.gov/facts/sealevel.html',
        locator: 'NOAA Ocean Service explanation that ocean-warming thermal expansion and land-ice melt are the two major contributors to global sea-level rise.',
        source_type: 'authoritative_independent_mechanism_corroboration'
      }
    ],
    indicator: {
      metric_id: 'global_thermosteric_sea_level_change',
      metric_name: 'Global mean thermosteric sea-level change associated with vertically integrated ocean heat uptake',
      unit: 'millimetres per year thermosteric sea-level change, ocean heat content in joules, and total sea-level component rates reported separately',
      geography: 'global mean with basin and local departures retained',
      cadence: 'annual assessment with monthly observational updates where available',
      source_id: 'ipcc_ocean_heat_content_and_thermosteric_sea_level_assessment',
      transformation: 'Estimate thermosteric change from vertically integrated temperature and salinity profiles or assessed component series; never substitute surface-air temperature for ocean heat content.',
      uncertainty: 'Sampling depth, Argo-era coverage, historical bias correction, salinity, steric decomposition and component closure affect the assessed rate.',
      threshold_provenance: 'IPCC AR6 study periods and component definitions.',
      failure_behavior: 'Do not present the thermosteric rate as total or local relative sea-level rise, or convert one degree of surface warming into a universal sea-level increment.'
    }
  }),
  boundedPromotion({
    source: 'temp',
    target: 'public_health_heat_burden',
    verb: 'increases',
    adverb: 'when higher ambient temperatures raise population heat exposure beyond locally adapted ranges',
    influence: 0.66,
    level: 'direct',
    relationshipType: 'bounded_temperature_heat_related_health_burden',
    confidence: 'high',
    mechanism: 'Higher ambient temperature increases physiological heat load and can aggravate cardiovascular, renal, respiratory and thermoregulatory stress. Population deaths or years of life lost depend on the local nonlinear exposure-response curve, humidity, age, housing, health, cooling access and adaptation.',
    geography: 'Tianjin, China for the primary elderly ischemic-heart-disease projection; the physiological mechanism and direction are independently assessed across regions.',
    period: 'Observed daily deaths and weather during 2006-2011, with modeled 2050s and 2070s outcomes under RCP2.6, RCP4.5 and RCP8.5.',
    moderators: ['local temperature distribution', 'humidity and nighttime cooling', 'age and baseline disease', 'housing and urban heat', 'air conditioning and power reliability', 'heat warnings and behavior', 'healthcare access', 'demographic change', 'physiological and infrastructural adaptation'],
    alternatives: ['air pollution can covary with heat', 'demographic aging changes burden independently', 'urban-form change alters exposure', 'cold-related burden can decline as heat-related burden rises'],
    counterevidence: 'The primary study is a model projection for elderly ischemic-heart-disease burden in one city, not a universal all-cause mortality coefficient. Total temperature-related burden can include offsetting cold effects, and adaptation assumptions materially change projected outcomes.',
    evidenceBasis: 'city_level_daily_mortality_model_with_multi_model_climate_projections_and_authoritative_health_mechanism_assessment',
    locators: [
      {
        url: 'https://doi.org/10.1186/s12889-019-7678-0',
        locator: 'Open full text, Methods, Results and Discussion: Tianjin daily temperature and elderly ischemic-heart-disease deaths, 19 climate models, RCP scenarios, 2050s/2070s years-of-life-lost projections and adaptation/demographic limitations.',
        source_type: 'peer_reviewed_open_primary_projection_study'
      },
      {
        url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-7/',
        locator: 'IPCC AR6 WGII Chapter 7 assessment of heat exposure, mortality and morbidity, vulnerability, adaptation and regional heterogeneity.',
        source_type: 'authoritative_independent_assessment'
      }
    ],
    indicator: {
      metric_id: 'temperature_attributable_heat_health_burden',
      metric_name: 'Heat-attributable deaths or years of life lost above the locally defined minimum-risk temperature',
      unit: 'daily temperature, attributable deaths, years of life lost and attributable fraction, reported separately',
      geography: 'declared city or population with local exposure-response function',
      cadence: 'daily surveillance with annual burden and adaptation reassessment',
      source_id: 'local_temperature_mortality_surveillance_and_climate_projection_ensemble',
      transformation: 'Apply a location- and population-specific nonlinear lagged exposure-response function to observed or modeled daily temperature while retaining baseline mortality, demographics and adaptation scenario.',
      uncertainty: 'Exposure measurement, model ensemble, response-function estimation, baseline mortality, demographic projection, adaptation and air-pollution confounding affect burden.',
      threshold_provenance: 'Locally estimated minimum-risk temperature and study-native heat definition.',
      failure_behavior: 'Do not export Tianjin scenario percentages as a universal heat coefficient or combine heat and cold burden without displaying both components.'
    }
  }),
  boundedPromotion({
    source: 'temp',
    target: 'critical_infrastructure_fragility',
    verb: 'can accelerate',
    adverb: 'through temperature-, moisture- and chloride-sensitive material deterioration',
    influence: 0.43,
    level: 'indirect',
    relationshipType: 'bounded_warming_material_deterioration_infrastructure_pathway',
    confidence: 'moderate',
    mechanism: 'Warming and associated humidity, precipitation, sea-level and chloride-exposure changes alter carbonation, corrosion initiation and material deterioration rates. For reinforced concrete and steel assets this can shorten modeled service life and increase maintenance or failure risk.',
    geography: 'Contiguous United States projections, including 25 degrees north concrete cases and 223 coastal counties in independent NIST analysis.',
    period: 'Twenty-first-century projections from 2000 to 2100 under study-native RCP scenarios and asset assumptions.',
    moderators: ['material and concrete strength', 'cover depth and workmanship', 'humidity and precipitation', 'chloride exposure and sea spray', 'coastal proximity', 'emissions scenario', 'maintenance and adaptation', 'asset age and design standard', 'freeze-thaw and compound hazards'],
    alternatives: ['aging and deferred maintenance can dominate deterioration', 'flooding and storm damage can cause acute failure', 'traffic and loading affect service life', 'adaptation and material substitution can offset climate exposure'],
    counterevidence: 'These are material-service-life projections rather than observed network outages. Results differ by material, location, exposure model and adaptation, and the largest concrete estimate comes from a specified latitude and RCP8.5 case rather than all infrastructure.',
    evidenceBasis: 'material_deterioration_and_service_life_models_with_independent_nist_coastal_infrastructure_projection',
    locators: [
      {
        url: 'https://doi.org/10.14359/51744358',
        locator: 'Study results for climate-sensitive reinforced-concrete service life across the contiguous United States, including up to 20 percent high-strength and 30 percent normal-strength reductions at 25 degrees north under RCP8.5.',
        source_type: 'peer_reviewed_primary_material_service_life_projection'
      },
      {
        url: 'https://www.nist.gov/publications/projections-corrosion-and-deterioration-infrastructure-united-states-coasts-under',
        locator: 'Independent NIST projection for concrete and steel deterioration across 223 United States coastal counties from 2000-2100, with RCP-specific service-life changes.',
        source_type: 'authoritative_independent_infrastructure_projection'
      }
    ],
    indicator: {
      metric_id: 'climate_adjusted_infrastructure_service_life',
      metric_name: 'Projected change in material service life under declared temperature and moisture exposure',
      unit: 'percent or years of service-life change by asset and material class',
      geography: 'declared asset location and exposure zone',
      cadence: 'annual climate update with asset-condition reassessment at inspection intervals',
      source_id: 'infrastructure_inventory_material_condition_and_climate_exposure_model',
      transformation: 'Join asset material, age and design parameters to temperature, humidity, precipitation and chloride exposure; compare scenario service life against the same-asset baseline.',
      uncertainty: 'Climate model, deterioration kinetics, material properties, construction quality, inspection data, maintenance and adaptation affect projections.',
      threshold_provenance: 'Study-native RCP, material, latitude and service-life model definitions.',
      failure_behavior: 'Do not display modeled service-life reduction as observed outage probability or transfer the 25-degree-north concrete range to other materials and locations.'
    }
  }),
  boundedPromotion({
    source: 'temp',
    target: 'crop_yield_volatility',
    verb: 'can alter',
    adverb: 'through crop- and region-specific heat stress and agroclimatic variability',
    influence: 0.39,
    level: 'indirect',
    relationshipType: 'bounded_warming_crop_yield_variability_pathway',
    confidence: 'moderate',
    mechanism: 'Temperature variability and exposure above crop-specific optima affect phenology, reproductive success, water demand and extreme-heat damage. These processes can change interannual yield variability, but the sign differs where cold limitation eases, irrigation buffers heat, or other weather variables dominate.',
    geography: 'Global gridded harvested areas for maize, rice, soybean and wheat, with crop- and breadbasket-specific results retained.',
    period: 'Observed yield and agroclimatic changes during 1981-2010 in the primary study, with separate future model evidence used only as corroboration.',
    moderators: ['crop and cultivar', 'temperature relative to optimum', 'precipitation and soil moisture', 'irrigation', 'planting date', 'soil and nutrient management', 'CO2 fertilization', 'pests and disease', 'technology trend', 'spatial aggregation'],
    alternatives: ['precipitation variability can dominate yield variability', 'technology and management change residual variance', 'market and conflict shocks affect production without biophysical yield change', 'aggregation can hide local instability'],
    counterevidence: 'Observed yield variability decreased across 19-33 percent of harvested area and increased across 9-22 percent, depending on crop and location. The relationship is therefore sign-changing and cannot be rendered as universal destabilization or a single per-degree yield-variance coefficient.',
    evidenceBasis: 'global_gridded_observational_yield_variability_attribution_with_independent_global_climate_variability_analysis',
    locators: [
      {
        url: 'https://doi.org/10.1088/1748-9326/11/3/034003',
        locator: 'Global 1981-2010 analysis of changes in maize, rice, soybean and wheat yield variability; harvested-area shares with increasing and decreasing variability and agroclimatic contribution.',
        source_type: 'peer_reviewed_primary_global_observational_analysis'
      },
      {
        url: 'https://www.nature.com/articles/ncomms6989',
        locator: 'Independent global analysis reporting the contribution of climate variability to crop-yield variability, including high-contribution breadbasket regions.',
        source_type: 'peer_reviewed_open_independent_global_corroboration'
      }
    ],
    indicator: {
      metric_id: 'temperature_conditioned_crop_yield_variability',
      metric_name: 'Crop-specific interannual yield variability conditioned on heat exposure relative to the crop optimum',
      unit: 'yield coefficient of variation or detrended variance, temperature anomaly, extreme-heat days and harvested-area share, reported separately',
      geography: 'declared crop grid, production region or breadbasket',
      cadence: 'annual crop-season update with decadal trend reassessment',
      source_id: 'gridded_crop_yield_weather_and_management_observations',
      transformation: 'Detrend crop-specific yield, calculate variability in consistent windows and attribute changes using crop-calendar heat, precipitation and management covariates; retain both increases and decreases.',
      uncertainty: 'Yield data quality, detrending, crop calendars, spatial aggregation, weather dataset, irrigation and technological change affect attribution.',
      threshold_provenance: 'Crop-specific study-native optimum-temperature and variability definitions.',
      failure_behavior: 'Do not label warming as universally increasing yield volatility, combine crops without weights, or convert climate-explained variance into a causal effect size.'
    }
  })
]);
