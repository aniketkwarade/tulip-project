const REVIEWED_AT = '2026-07-18';

export const MISSING_LINK_RESEARCH_PROMOTION_EDGES = Object.freeze([
  Object.freeze({
    source: 'marine_heatwaves',
    target: 'tropical_cyclone_rapid_intensification',
    verb: 'raises the likelihood of',
    adverb: 'under bounded warm-ocean and storm-environment conditions',
    influence: 0.66,
    topology_rule: 'missing_link_full_text_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'direct',
      relationship_type: 'bounded_ocean_atmosphere_pathway',
      confidence: 'high',
      source_urls: Object.freeze([
        'https://www.nature.com/articles/s43247-024-01578-2',
        'https://www.aoml.noaa.gov/ocean-conditions-in-the-intensification-of-hurricane-michael-2018/'
      ]),
      relationship_source_urls: Object.freeze([
        'https://www.nature.com/articles/s43247-024-01578-2',
        'https://www.aoml.noaa.gov/ocean-conditions-in-the-intensification-of-hurricane-michael-2018/'
      ]),
      mechanism: 'Persistent anomalously warm surface water and associated upper-ocean heat can sustain air-sea enthalpy flux and limit storm-induced cooling, increasing the conditional likelihood of rapid intensification when wind shear, humidity, storm structure, and track are also favorable.',
      geographic_scope: 'Gulf of Mexico and northwestern Caribbean Sea for the reported estimate; no global extrapolation.',
      temporal_scope: 'Historical tropical-cyclone and ERA5 sea-surface-temperature observations from 1950 through 2022.',
      moderators: Object.freeze([
        'vertical wind shear',
        'mid-level humidity',
        'storm intensity and internal structure',
        'translation speed and direction',
        'tropical cyclone heat potential',
        'mixed-layer depth',
        'marine-heatwave threshold and baseline period',
        'distance and timing between the heatwave and intensification onset'
      ]),
      alternative_explanations: Object.freeze([
        'favorable atmospheric circulation can co-occur with warm-ocean anomalies',
        'storm-track selection affects exposure to heatwave regions',
        'relative rather than absolute sea-surface temperature can constrain potential intensity',
        'the observational design does not isolate a randomized causal intervention'
      ]),
      counterevidence: 'Marine heatwaves are neither necessary nor sufficient for rapid intensification. The source reports spatially heterogeneous multiplication rates, insufficient-data grid cells, sensitivity to the heatwave definition, and omitted storm-motion and anomaly-length-scale factors.',
      notes: 'Promoted from fresh full-text missing-link review. The estimate is regional and conditional, not a global cyclone-frequency coefficient.',
      reviewed_at: REVIEWED_AT,
      dossier: Object.freeze({
        promotion_status: 'promoted_after_full_text_bounded_readback',
        source: 'marine_heatwaves',
        target: 'tropical_cyclone_rapid_intensification',
        direction: 'marine heatwave presence precedes and conditions rapid-intensification likelihood',
        mechanism: 'Persistent anomalously warm water supplies surface and upper-ocean heat that can sustain storm enthalpy flux and reduce storm-induced cooling.',
        geographic_scope: 'Gulf of Mexico and northwestern Caribbean Sea only for the quantified estimate.',
        temporal_scope: '1950-2022 historical analysis.',
        confidence: 'high',
        evidence_basis: 'direct_observational_conditional_probability_analysis',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://www.nature.com/articles/s43247-024-01578-2',
            locator: 'Abstract; Results, Figures 7-8; Discussion; Methods: 1.5-fold average and up to 5-fold regional RI-likelihood multiplication during qualifying marine heatwaves, using IBTrACS and ERA5 for 1950-2022.',
            source_type: 'peer_reviewed_primary_study'
          }),
          Object.freeze({
            url: 'https://www.aoml.noaa.gov/ocean-conditions-in-the-intensification-of-hurricane-michael-2018/',
            locator: 'NOAA AOML hurricane-intensification overview: upper-ocean thermal structure, air-sea exchange, and storm-induced cooling as intensity controls.',
            source_type: 'independent_authoritative_mechanism'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'mhw_conditioned_ibtracs_rapid_intensification_probability_ratio',
          metric_name: 'Ratio of rapid-intensification probability with versus without a qualifying marine heatwave',
          unit: 'conditional probability ratio',
          geography: 'declared tropical-cyclone basin and gridded study domain',
          cadence: 'episodic peer-reviewed assessment or annual recomputation after best-track revision',
          source_id: 'communications_earth_environment_radfar_2024',
          transformation: 'Retain the marine-heatwave definition, climatology period, spatial and temporal matching thresholds, RI threshold, and insufficient-data masks.',
          uncertainty: 'The reported 1.5-to-5-fold span is spatial heterogeneity, not a confidence interval; SST product, baseline, threshold, storm track, and atmospheric covariates affect the result.',
          threshold_provenance: 'Source method: at least five days above the seasonally varying 80th-percentile SST threshold, within 10 days and 125 miles of RI onset; RI events separated by at least 24 hours.',
          failure_behavior: 'Do not extrapolate outside the study domain or update the edge magnitude when the required heatwave, storm-track, and atmospheric-condition fields are absent.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'ocean_heat_content',
    target: 'sea_level_rise',
    verb: 'raises',
    adverb: 'through global mean thermosteric expansion as ocean temperature increases',
    influence: 0.72,
    topology_rule: 'missing_link_authoritative_mechanism_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'direct',
      relationship_type: 'bounded_thermosteric_sea_level_pathway',
      confidence: 'high',
      source_urls: Object.freeze([
        'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
        'https://oceanservice.noaa.gov/facts/sealevel.html'
      ]),
      relationship_source_urls: Object.freeze([
        'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
        'https://oceanservice.noaa.gov/facts/sealevel.html'
      ]),
      mechanism: 'Increasing globally averaged ocean heat content raises mean ocean temperature, reduces seawater density, and increases ocean volume per unit mass. This thermosteric expansion contributes directly to global mean sea-level rise.',
      geographic_scope: 'Global mean ocean heat content and global mean thermosteric sea level. Regional and local relative sea level require separate dynamic, gravitational, rotational, deformational and vertical-land-motion terms.',
      temporal_scope: 'Observed 1971-2018 ocean-heat-content and sea-level change for the assessed historical relationship; projected responses are scenario and time-scale specific.',
      moderators: Object.freeze([
        'vertical and basin distribution of ocean heat uptake',
        'temperature-dependent seawater expansion coefficient',
        'salinity and halosteric redistribution at regional scales',
        'ocean circulation and mixing',
        'land-ice and land-water mass contributions to total sea level',
        'vertical land motion for local relative sea level',
        'baseline period and depth coverage'
      ]),
      alternative_explanations: Object.freeze([
        'land-ice mass loss contributes independently to total global mean sea-level rise',
        'regional ocean dynamics can raise or lower local sea level without matching the global thermosteric mean',
        'wind-driven redistribution can covary with both upper-ocean heat content and regional sea level',
        'salinity changes affect regional steric height but global mean halosteric change is negligible'
      ]),
      counterevidence: 'Ocean heat content is not the only driver of total sea-level rise, and a universal conversion from sea-surface or global surface-air temperature to thermosteric rise is not valid. The promoted relationship is limited to the IPCC-assessed OHC-to-global-mean-thermosteric component, with regional and mass contributions kept separate.',
      notes: 'Promoted after authoritative mechanism readback. The rotating Crossref records were rejected because they treated common drivers, reconstruction, or predictive association rather than isolating this exact source-to-target pathway.',
      reviewed_at: '2026-07-19',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_authoritative_bounded_readback',
        source: 'ocean_heat_content',
        target: 'sea_level_rise',
        direction: 'higher globally averaged ocean heat content causes higher global mean thermosteric sea level',
        mechanism: 'Ocean warming lowers seawater density and expands ocean volume per unit mass.',
        geographic_scope: 'Global mean thermosteric sea-level component; not local relative sea level.',
        temporal_scope: 'Historical assessment for 1971-2018, with source-reported conversion values synthesized from modern observations, CMIP6, two-layer emulators and palaeoclimate evidence.',
        confidence: 'high',
        evidence_basis: 'authoritative_assessment_of_observed_mechanism_and_conversion',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/',
            locator: 'Section 9.2.4.1 and Box 9.1: globally averaged OHC changes cause global mean thermosteric sea-level change; increasing ocean temperature reduces density and increases volume. The assessed OHC-to-GMTSL conversion is 0.113 plus or minus 0.013 metres per yottajoule.',
            source_type: 'authoritative_assessment'
          }),
          Object.freeze({
            url: 'https://oceanservice.noaa.gov/facts/sealevel.html',
            locator: 'NOAA Ocean Service: thermal expansion caused by ocean warming is one of the two major causes of global sea-level rise.',
            source_type: 'independent_authoritative_mechanism'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'global_ohc_to_thermosteric_sea_level_conversion',
          metric_name: 'Global mean thermosteric sea-level response per unit ocean heat-content change',
          unit: 'metres per yottajoule',
          geography: 'global mean ocean and global mean thermosteric sea-level component',
          cadence: 'assessment update or recomputation when reviewed global OHC and sea-level products change',
          source_id: 'ipcc_ar6_wgi_chapter_9',
          transformation: 'Apply only to globally integrated OHC and the global mean thermosteric component; preserve depth, baseline and heat-content units.',
          uncertainty: 'IPCC assessed mean and standard deviation 0.113 plus or minus 0.013 metres per yottajoule; model, emulator, observational and vertical heat-distribution differences remain.',
          threshold_provenance: 'IPCC AR6 WGI Section 9.2.4.1 assessment from two-layer emulators, CMIP6, modern observations and palaeoclimate evidence.',
          failure_behavior: 'Do not calculate a local sea-level response or substitute sea-surface temperature, global surface-air temperature, or an incomplete-depth heat-content series for globally integrated OHC.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'wildfire_regime_shift',
    target: 'air_pollution_health_burden',
    verb: 'raises',
    adverb: 'through smoke-mediated particulate and co-pollutant exposure in affected populations',
    influence: 0.64,
    topology_rule: 'missing_link_full_text_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'indirect',
      relationship_type: 'bounded_wildfire_smoke_health_pathway',
      confidence: 'moderate',
      source_urls: Object.freeze([
        'https://doi.org/10.1007/s11270-025-08047-2',
        'https://www.who.int/health-topics/wildfires'
      ]),
      relationship_source_urls: Object.freeze([
        'https://doi.org/10.1007/s11270-025-08047-2',
        'https://www.who.int/health-topics/wildfires'
      ]),
      mechanism: 'A shift toward larger or more persistent wildfire seasons can increase smoke emissions and ambient PM2.5, PM10, ozone and nitrogen-dioxide exposure. In exposed populations, inhaled fine particles and co-pollutants can cause respiratory and cardiovascular injury and increase morbidity and mortality risk.',
      geographic_scope: 'Northern Portugal for the 2019-2022 observational study; the general smoke-health mechanism is independently corroborated by WHO. The quantified observations are not extrapolated globally.',
      temporal_scope: 'Wildfire-season and large-fire comparisons from 2019 through 2022 in the primary study; acute and longer-term exposure windows remain distinct.',
      moderators: Object.freeze([
        'burned area, fire intensity and fuel type',
        'wind direction, plume height and atmospheric chemistry',
        'distance from fire and monitoring-station coverage',
        'background pollution and heat',
        'indoor infiltration, filtration and protective behavior',
        'age, pregnancy, occupation and pre-existing disease',
        'health-care access and outcome-reporting cadence'
      ]),
      alternative_explanations: Object.freeze([
        'summer meteorology and non-fire sources can raise ozone and particulate concentrations',
        'seasonal health-care use can vary independently of smoke',
        'burned area is an imperfect proxy for individual smoke dose',
        'monthly regional outcomes can obscure event-level and subregional variation'
      ]),
      counterevidence: 'The Northern Portugal study is ecological and observational, has incomplete hourly air-quality coverage, lacks daily health-visit and subregional health data, and does not model wind or spatial fire severity. Its reported wildfire-season increases in total emergency visits and medication costs were not statistically significant. The relationship therefore remains indirect and moderate-confidence rather than a universal effect coefficient.',
      notes: 'Promoted only after full-text endpoint review. Source-reported pollutant changes and estimated mortality remain study observations, not a platform-wide causal coefficient.',
      reviewed_at: '2026-07-19',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_full_text_bounded_readback',
        source: 'wildfire_regime_shift',
        target: 'air_pollution_health_burden',
        direction: 'more extensive or persistent wildfire seasons increase smoke-mediated air-pollution health burden in exposed populations',
        mechanism: 'Wildfire combustion elevates particulate and gaseous pollutants; inhalation produces respiratory and cardiovascular injury through inflammatory and systemic pathways.',
        geographic_scope: 'Northern Portugal for the quantified observations; authoritative mechanism corroboration is broader but not used to globalize the effect size.',
        temporal_scope: '2019-2022 seasonal and large-fire observations, with acute and long-term health calculations kept separate.',
        confidence: 'moderate',
        evidence_basis: 'direct_air_quality_observation_with_ecological_health_surveillance_and_authoritative_mechanism_corroboration',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://doi.org/10.1007/s11270-025-08047-2',
            locator: 'Abstract; Sections 2.1-2.5 and 3.1-3.2; limitations: Northern Portugal, 2019-2022, burned area and rural monitors, wildfire-season pollutant changes, health-surveillance associations, WHO AIRQ+ mortality estimates, missing-data and ecological-design limitations.',
            source_type: 'peer_reviewed_primary_observational_study'
          }),
          Object.freeze({
            url: 'https://www.who.int/health-topics/wildfires',
            locator: 'WHO wildfire health overview: smoke particulate exposure, respiratory and cardiovascular effects, mortality, vulnerable populations and public-health protection.',
            source_type: 'independent_authoritative_mechanism'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'wildfire_smoke_attributable_health_burden',
          metric_name: 'Health burden attributable to wildfire-smoke pollutant exposure',
          unit: 'endpoint-specific cases, visits, admissions, deaths or attributable fraction',
          geography: 'declared fire-plume exposure area and health-surveillance population',
          cadence: 'event, daily, seasonal or annual only when fire, exposure and health series share a declared window',
          source_id: 'barros_oliveira_morais_2025_wildfire_health',
          transformation: 'Link fire occurrence or burned area to monitored or modeled smoke-specific pollutant exposure before applying an endpoint-specific concentration-response function; retain lag, baseline rate and population.',
          uncertainty: 'Carry monitor and model error, exposure misclassification, concentration-response uncertainty, missing-data coverage and health-outcome uncertainty. Do not treat seasonal percentage differences as causal effects when statistical support is absent.',
          threshold_provenance: 'Study-specific fire-size definition and WHO air-quality guideline thresholds must remain attached to any derived estimate.',
          failure_behavior: 'Do not calculate or display an attributable health burden when smoke-specific exposure, population, baseline health rate, response function, lag or uncertainty is unavailable.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'peatland_degradations',
    target: 'carbon_emission',
    verb: 'releases',
    adverb: 'through drainage-driven peat oxidation, dissolved-carbon loss, biomass change, and peat fire',
    influence: 0.69,
    topology_rule: 'missing_link_full_text_and_authoritative_assessment_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference', evidence_mode: 'curated_edge_reference', relationship_level: 'direct', relationship_type: 'bounded_drained_peat_carbon_emission_pathway', confidence: 'high',
      source_urls: Object.freeze(['https://doi.org/10.22146/ipas.6170', 'https://www.ipcc-nggip.iges.or.jp/public/wetlands/']),
      relationship_source_urls: Object.freeze(['https://doi.org/10.22146/ipas.6170', 'https://www.ipcc-nggip.iges.or.jp/public/wetlands/']),
      mechanism: 'Drainage lowers the peat water table, exposes organic soil to aerobic decomposition, and produces persistent carbon-dioxide emissions while organic matter remains. Degradation can also increase dissolved-carbon export and fire losses; biomass removals and land-use change alter the net balance.',
      geographic_scope: 'The primary field study covers agricultural and plantation peat uses in Central and West Kalimantan. IPCC inventory factors apply only after stratifying drained organic-soil area by land use, climate, nutrient status and drainage class.',
      temporal_scope: 'Field measurements in January-June 2006 and January-April 2007 for the Kalimantan study; IPCC factors represent annual long-term drained-soil fluxes and do not capture the initial post-drainage transition.',
      moderators: Object.freeze(['water-table depth and drainage class', 'land use and management intensity', 'climate and peat temperature', 'peat nutrient status and depth', 'time since drainage', 'fire occurrence and burn depth', 'vegetation carbon uptake and biomass removal', 'dissolved and particulate carbon export']),
      alternative_explanations: Object.freeze(['soil respiration includes autotrophic and heterotrophic components unless partitioned', 'land-use types differ in crop biomass and management as well as drainage', 'short campaigns can alias seasonal moisture and temperature', 'carbon stock loss and instantaneous chamber flux are different estimands']),
      counterevidence: 'The Kalimantan field study is not a randomized degradation experiment and reports short-period chamber measurements across land uses. IPCC confidence intervals vary widely by land-use and climate class, some lower bounds are mathematically negative despite positive underlying fluxes, and Tier 1 factors omit the potentially high initial post-drainage transition. Rewetted, undrained and accumulating peatlands require separate accounting.',
      notes: 'Promoted as a direct but stratification-dependent pathway. No universal peatland emission factor is attached to the graph influence value.', reviewed_at: '2026-07-19',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_full_text_and_authoritative_bounded_readback', source: 'peatland_degradations', target: 'carbon_emission', direction: 'drainage and degrading peat use release stored peat carbon to the atmosphere and drainage network',
        mechanism: 'Lowered water tables create an oxic peat layer in which organic carbon decomposes to carbon dioxide; fire, DOC export and management-related biomass change add separate loss terms.',
        geographic_scope: 'Kalimantan field evidence plus IPCC climate and land-use strata; not a global unstratified coefficient.', temporal_scope: '2006-2007 field campaigns and annual long-term inventory factors.', confidence: 'high', evidence_basis: 'primary_field_flux_measurement_and_ipcc_inventory_synthesis',
        source_locators: Object.freeze([
          Object.freeze({ url: 'https://doi.org/10.22146/ipas.6170', locator: 'Abstract, methods, results and discussion: Central and West Kalimantan peat land uses, 2006-2007 infrared gas-analysis measurements, water-table correlations, land-use-specific CO2 fluxes and carbon-balance limits.', source_type: 'peer_reviewed_primary_field_study' }),
          Object.freeze({ url: 'https://www.ipcc-nggip.iges.or.jp/public/wetlands/pdf/Wetlands_separate_files/WS_Chp2_Drained_Inland_Organic_Soils.pdf', locator: 'Chapter 2 Sections 2.1-2.2 and Table 2.1: persistent drainage-related CO2, DOC and fire pathways; land-use, climate, nutrient and drainage stratification; Tier 1 factors with 95 percent confidence intervals and transition limits.', source_type: 'authoritative_inventory_assessment' })
        ]),
        indicator: Object.freeze({ metric_id: 'drained_peatland_carbon_emission_by_stratum', metric_name: 'Annual carbon emission from drained organic soil by land-use and climate stratum', unit: 'tonnes CO2-C per hectare per year, with area-weighted tonnes CO2-C per year reported separately', geography: 'mapped drained organic-soil area stratified by land use, climate, nutrient status and drainage class', cadence: 'annual inventory with land-use and drainage updates', source_id: 'ipcc_2013_wetlands_supplement_chapter_2', transformation: 'Multiply a matching IPCC or locally validated emission factor by the corresponding drained-organic-soil area; keep on-site soil, DOC, fire, biomass and non-CO2 terms separate and convert carbon to carbon dioxide only with an explicit 44/12 factor.', uncertainty: 'Carry the source-reported factor interval and activity-area uncertainty; use country-specific higher-tier factors where representative measurements exist.', threshold_provenance: 'IPCC Chapter 2 definitions and Table 2.1 strata; shallow drainage is mean annual water table less than 30 centimetres below the surface and deep drainage is 30 centimetres or deeper.', failure_behavior: 'Do not calculate when peat extent, drainage status, land-use stratum, climate class, area or compatible factor is missing; never assign drained-soil factors to undrained or rewetted peat.' })
      })
    })
  }),
  Object.freeze({
    source: 'marine_heatwaves',
    target: 'marine_food_web_simplification',
    verb: 'disrupts',
    adverb: 'through trophic-level-specific mortality, metabolic losses, and altered energy transfer',
    influence: 0.67,
    topology_rule: 'missing_link_full_text_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'direct',
      relationship_type: 'bounded_marine_heatwave_food_web_pathway',
      confidence: 'high',
      source_urls: Object.freeze([
        'https://bg.copernicus.org/articles/22/6583/2025/',
        'https://www.nature.com/articles/s41467-024-46263-2'
      ]),
      relationship_source_urls: Object.freeze([
        'https://bg.copernicus.org/articles/22/6583/2025/',
        'https://www.nature.com/articles/s41467-024-46263-2'
      ]),
      mechanism: 'Marine heatwave thermal stress changes mortality, respiration, predation, trophic-transfer efficiency and biomass-flow speed. Because responses differ across trophic levels, prey fields and energy pathways can reorganize and higher-trophic-level biomass can decline more strongly and recover more slowly.',
      geographic_scope: 'Global 1-degree model domain for 1998-2021, with the source-reported quantified example limited to the northeastern Pacific biogeochemical provinces affected by the 2013-2016 marine heatwave.',
      temporal_scope: 'Satellite-forced 15-day simulations from 1998 through 2021; the quantified northeastern Pacific event comparison covers 2013-2016 and recovery through 2021.',
      moderators: Object.freeze([
        'marine heatwave intensity, duration, season and recurrence',
        'ecosystem thermal regime and biogeochemical province',
        'net primary production and satellite-product uncertainty',
        'species and trophic-level thermal sensitivity',
        'food-web transfer efficiency and biomass residence time',
        'upwelling, nutrient supply and background productivity',
        'fishing pressure and other disturbances',
        'model resistance parameter and recovery assumption'
      ]),
      alternative_explanations: Object.freeze([
        'long-term ocean warming and productivity trends can co-occur with marine heatwaves',
        'fishing, recruitment variability and species redistribution can alter food-web biomass',
        'satellite net-primary-production algorithms differ, especially on shelves and in oligotrophic gyres',
        'aggregated trophic models do not resolve species-specific winners and losers'
      ]),
      counterevidence: 'The primary estimate is model-derived rather than a controlled ecosystem intervention. Its resistance parameter is chosen from plausible scenarios, species are aggregated by trophic level, net-primary-production responses to heatwaves are not represented separately, and some species or regions can show neutral or positive responses. An independent demersal-fish study cited by the source found marine heatwaves were not a dominant driver across all surveyed communities.',
      notes: 'Promoted for food-web disruption and simplification risk, not universal collapse. The 8.7 percent estimate remains a regional event-model result with its standard error and assumptions attached.',
      reviewed_at: '2026-07-19',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_open_full_text_and_independent_corroboration',
        source: 'marine_heatwaves',
        target: 'marine_food_web_simplification',
        direction: 'qualifying marine heatwaves alter trophic structure, energy transfer and biomass distribution',
        mechanism: 'Thermal stress raises metabolic costs and mortality, changes predation and transfer efficiency, and propagates unevenly through trophic levels.',
        geographic_scope: 'Global model context; quantified estimate limited to northeastern Pacific 2013-2016 marine-heatwave provinces.',
        temporal_scope: '1998-2021 simulations with a 2013-2016 event estimate.',
        confidence: 'high',
        evidence_basis: 'satellite_forced_dynamic_trophic_model_with_independent_regional_food_web_model_corroboration',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://bg.copernicus.org/articles/22/6583/2025/',
            locator: 'Abstract; Methods; Results Figures 3-9; Discussion and limitations: EcoTroph-Dyn with daily temperature and monthly NPP, with-versus-filtered-MHW comparison, 8.7 +/- 1.0 percent northeastern Pacific biomass decline, trophic-level persistence, resistance-parameter and NPP uncertainty.',
            source_type: 'peer_reviewed_open_primary_model_study'
          }),
          Object.freeze({
            url: 'https://www.nature.com/articles/s41467-024-46263-2',
            locator: 'Abstract; Results and Methods: independent Ecotran analysis of the Northeast Pacific Blob linking marine heatwave conditions to altered community structure, food-web pathways and energy flux.',
            source_type: 'independent_peer_reviewed_open_model_study'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'marine_heatwave_attributable_trophic_biomass_change',
          metric_name: 'Food-web biomass difference with versus without source-defined marine heatwaves',
          unit: 'percent biomass change by trophic level and biogeochemical province',
          geography: 'declared marine biogeochemical province or ecosystem-model domain',
          cadence: 'event and annual hindcast update when temperature, NPP and food-web inputs are complete',
          source_id: 'biogeosciences_ecotroph_dyn_mhw_2025',
          transformation: 'Run matched food-web simulations with observed marine heatwaves and with marine-heatwave temperature anomalies filtered out; retain trophic level, province, event definition, NPP series, resistance scenario and recovery horizon.',
          uncertainty: 'Carry the source-reported standard error and scenario spread; separately propagate temperature, NPP, food-web parameter, resistance and structural-model uncertainty.',
          threshold_provenance: 'Source marine-heatwave event definition and warmest-month comparison, with 1-degree spatial and 15-day temporal model resolution.',
          failure_behavior: 'Do not transfer the northeastern Pacific coefficient to another ecosystem or claim species-level collapse when event matching, trophic biomass, NPP or model-scenario uncertainty is unavailable.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'deforestation',
    target: 'temp',
    verb: 'alters',
    adverb: 'through carbon release and sign-changing local and nonlocal biophysical responses',
    influence: 0.65,
    topology_rule: 'missing_link_full_text_biophysical_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'direct',
      relationship_type: 'bounded_deforestation_temperature_response',
      confidence: 'high',
      source_urls: Object.freeze([
        'https://doi.org/10.1029/2018GL080211',
        'https://doi.org/10.1002/2016JG003653',
        'https://doi.org/10.1016/j.gloenvcha.2018.07.004'
      ]),
      relationship_source_urls: Object.freeze([
        'https://doi.org/10.1029/2018GL080211',
        'https://doi.org/10.1002/2016JG003653',
        'https://doi.org/10.1016/j.gloenvcha.2018.07.004'
      ]),
      mechanism: 'Removing forest changes evapotranspiration, latent and sensible heat, roughness, turbulent mixing, absorbed solar radiation and heat storage locally, while atmospheric and oceanic adjustments create nonlocal responses. Forest-carbon loss adds a separate greenhouse-gas warming pathway. The combined response is scale-, latitude-, season- and time-dependent.',
      geographic_scope: 'Global satellite and climate-model analyses plus tropical local-temperature observations. Local land-surface temperature contrasts are not substituted for annual global mean surface temperature.',
      temporal_scope: 'Study-specific satellite, reanalysis and model periods; the relationship represents an enduring land-cover perturbation rather than an instantaneous global-temperature coefficient.',
      moderators: Object.freeze([
        'latitude and background climate',
        'forest type and clearing extent',
        'day versus night and season',
        'evapotranspiration and soil moisture',
        'surface albedo and absorbed solar radiation',
        'aerodynamic roughness and boundary-layer stability',
        'atmospheric and oceanic nonlocal adjustment',
        'carbon-stock loss, regrowth and post-clearing land use'
      ]),
      alternative_explanations: Object.freeze([
        'agricultural expansion and settlement can alter local temperature independently of tree-cover loss',
        'satellite space-for-time contrasts can retain site-selection and land-management differences',
        'climate models disagree with local observations when nonlocal effects are omitted',
        'carbon-cycle warming and biophysical cooling or warming operate on different scales and horizons'
      ]),
      counterevidence: 'The response does not have one universal sign. Satellite evidence shows widespread daytime warming but nighttime cooling, with strongest tropical daytime warming and strongest boreal nighttime cooling. Climate models can show global-mean biophysical cooling dominated by nonlocal effects even where observed local effects warm. The edge therefore says alters, not raises, and no local contrast is presented as a global coefficient.',
      notes: 'Promoted as a direct sign-changing relationship. Carbon-cycle and biophysical components must remain separable in estimation and display.',
      reviewed_at: '2026-07-19',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_primary_satellite_and_climate_model_readback',
        source: 'deforestation',
        target: 'temp',
        direction: 'forest removal changes local surface temperature and contributes to a scale-dependent global mean response',
        mechanism: 'Changes in evapotranspiration, radiation, roughness, turbulence, heat storage, nonlocal circulation and atmospheric carbon alter temperature on different scales.',
        geographic_scope: 'Global satellite and model domains with tropical local-observation corroboration.',
        temporal_scope: 'Study-specific historical observations and equilibrium or scenario model experiments.',
        confidence: 'high',
        evidence_basis: 'global_satellite_space_for_time_analysis_and_multi_model_biophysical_experiments',
        source_locators: Object.freeze([
          Object.freeze({ url: 'https://doi.org/10.1029/2018GL080211', locator: 'Abstract and model analysis: nonlocal effects dominate global-mean biophysical temperature response across realistic deforestation scenarios; MPI-ESM nonlocal cooling exceeds local warming by a factor of three.', source_type: 'peer_reviewed_primary_climate_model_study' }),
          Object.freeze({ url: 'https://doi.org/10.1002/2016JG003653', locator: 'Abstract and analysis: global satellite, reanalysis and flux-tower evidence for daytime warming and nighttime cooling; tropical daytime 4.4 +/- 0.07 K and boreal nighttime -1.4 +/- 0.04 K local surface-temperature contrasts.', source_type: 'peer_reviewed_primary_satellite_and_flux_study' }),
          Object.freeze({ url: 'https://doi.org/10.1016/j.gloenvcha.2018.07.004', locator: 'Primary tropical deforestation analysis linking tree-cover loss to local temperature and perceived well-being; retained as local human-exposure corroboration, not a global mean coefficient.', source_type: 'peer_reviewed_primary_observational_study' })
        ]),
        indicator: Object.freeze({
          metric_id: 'deforestation_temperature_response_by_scale_and_time_of_day',
          metric_name: 'Temperature difference attributable to forest-cover loss by spatial scale, latitude, season and time of day',
          unit: 'kelvin local land-surface contrast or kelvin global mean response, never pooled across scales',
          geography: 'declared cleared-forest contrast, model domain or global mean experiment',
          cadence: 'annual land-cover update with seasonal and diurnal temperature recomputation',
          source_id: 'winckler_deforestation_temperature_primary_studies',
          transformation: 'Estimate local and nonlocal biophysical components separately; retain day/night, latitude, forest type, cleared fraction, carbon-cycle inclusion and model or observational design.',
          uncertainty: 'Carry source-reported sampling or model uncertainty and inter-model spread; never combine local satellite contrasts with global mean model responses as one coefficient.',
          threshold_provenance: 'Study land-cover classifications, space-for-time matching and deforestation experiment definitions.',
          failure_behavior: 'Do not report a signed global effect when spatial scale, carbon-cycle inclusion, nonlocal response, latitude or day-night aggregation is unknown.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'permafrost_thaw',
    target: 'polar_infrastructure_failure',
    verb: 'raises the risk of',
    adverb: 'where warming intersects ice-rich ground and exposed foundations',
    influence: 0.64,
    topology_rule: 'missing_link_full_text_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'direct',
      relationship_type: 'bounded_permafrost_infrastructure_failure_pathway',
      confidence: 'moderate',
      source_urls: Object.freeze([
        'https://www.nature.com/articles/s43247-024-01317-7',
        'https://www.ipcc.ch/srocc/chapter/chapter-3-2/'
      ]),
      relationship_source_urls: Object.freeze([
        'https://www.nature.com/articles/s43247-024-01317-7',
        'https://www.ipcc.ch/srocc/chapter/chapter-3-2/'
      ]),
      mechanism: 'Warming increases active-layer thickness and can thaw excess ground ice. The resulting loss of ground volume, differential settlement, subsidence, drainage change and slope instability can reduce foundation bearing capacity, distort embankments and disrupt transport or utility assets built on susceptible permafrost.',
      geographic_scope: 'Asset-specific ice-bearing permafrost, with the primary quantified case studies limited to the Hudson Bay Railway, Mackenzie Northern Railway and Inuvik-Tuktoyaktuk/Dempster Highway corridors in northern Canada; IPCC provides broader Arctic and high-mountain corroboration.',
      temporal_scope: 'Present conditions and projections through 2050 and 2100 under the source RCP4.5 and RCP8.5 scenarios; observed instability examples are retained separately from projected thaw threat.',
      moderators: Object.freeze([
        'ground-ice abundance, type and depth',
        'initial mean annual ground-surface temperature',
        'active-layer thickness and snow insulation',
        'soil type, drainage and water ponding',
        'embankment geometry and surface disturbance',
        'foundation and thermosyphon design',
        'maintenance, monitoring and adaptation investment',
        'flooding, precipitation and freeze-thaw co-hazards'
      ]),
      alternative_explanations: Object.freeze([
        'poor construction, drainage or maintenance can cause settlement without climate-driven permafrost thaw',
        'flooding, erosion, wildfire and slope failure can damage the same assets through distinct pathways',
        'the thaw index is a screening metric and does not simulate each foundation or failure mode',
        'infrastructure itself changes snow, drainage and ground heat flux'
      ]),
      counterevidence: 'The modeled thaw index is zero where mapped excess ground ice is absent and remains stable in some studied segments despite projected warming. The primary study is a regional screening framework rather than an observed failure-rate model, and IPCC assesses broad future infrastructure impacts at medium confidence. Adaptation and redesign can substantially reduce losses.',
      notes: 'Promoted as a conditional failure-risk pathway, not inevitable asset failure. Ground warming, thaw susceptibility, observed deformation and functional failure must remain separate measurable stages.',
      reviewed_at: '2026-07-19',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_open_full_text_and_authoritative_assessment_readback',
        source: 'permafrost_thaw',
        target: 'polar_infrastructure_failure',
        direction: 'thaw of ice-bearing permafrost increases instability and functional-failure risk for exposed infrastructure',
        mechanism: 'Ground-ice melt produces settlement, subsidence and changes in bearing capacity and drainage beneath foundations and embankments.',
        geographic_scope: 'Northern Canadian transport corridors for the primary study; broader Arctic and high-mountain infrastructure only at the IPCC assessment level.',
        temporal_scope: 'Present, mid-century and end-century threat under the source scenarios.',
        confidence: 'moderate',
        evidence_basis: 'primary_asset_corridor_thaw_threat_model_with_authoritative_arctic_assessment',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://www.nature.com/articles/s43247-024-01317-7',
            locator: 'Abstract; Study cases; Results Figures 3-6; Discussion; Methods: ground-ice and predicted-ground-temperature thaw index for three northern Canadian transportation corridors, including observed settlement context and projected spatially varying threat.',
            source_type: 'peer_reviewed_open_primary_model_study'
          }),
          Object.freeze({
            url: 'https://www.ipcc.ch/srocc/chapter/chapter-3-2/',
            locator: 'Sections 3.4.1.2.2 and 3.4.3.3.4 and key findings: ground-ice loss, subsidence, infrastructure stability, exposure, projected impacts and adaptation benefits.',
            source_type: 'independent_authoritative_assessment'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'asset_specific_permafrost_thaw_failure_risk',
          metric_name: 'Infrastructure exposure to mapped thaw-susceptible ice-bearing permafrost',
          unit: 'asset kilometres or asset count by thaw-threat class, with observed failures reported separately',
          geography: 'declared transport, building, pipeline, communication or utility asset intersected with ground-ice and ground-temperature grids',
          cadence: 'annual condition update with scenario reassessment after climate-model or ground-ice revisions',
          source_id: 'gheysari_maghoul_permafrost_transport_framework_2024',
          transformation: 'Intersect asset geometry with source-compatible ground-ice and mean annual ground-surface-temperature fields; preserve scenario, period, model, ice class, foundation, maintenance and adaptation state. Do not convert threat class to failure probability without an asset-specific fragility model.',
          uncertainty: 'Carry ground-ice mapping, climate-model, reanalysis, downscaling and asset-condition uncertainty; observed settlement and modeled future threat remain separate.',
          threshold_provenance: 'Source thaw-index definitions and Table 2 interpretation, with IPCC impact and adaptation boundaries.',
          failure_behavior: 'Do not score an asset when ground-ice depth, thermal regime, foundation exposure or observation period is unknown, and never label a regional thaw index as a confirmed failure.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'environ_anomalies',
    target: 'overstory_tree_mortality',
    verb: 'raises the risk of',
    adverb: 'when hot, dry and high-demand conditions coincide or compound over time',
    influence: 0.66,
    topology_rule: 'missing_link_full_text_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'direct',
      relationship_type: 'bounded_compound_climate_tree_mortality_pathway',
      confidence: 'high',
      source_urls: Object.freeze([
        'https://doi.org/10.1016/j.scitotenv.2021.151604',
        'https://www.nature.com/articles/s41598-021-97762-x'
      ]),
      relationship_source_urls: Object.freeze([
        'https://doi.org/10.1016/j.scitotenv.2021.151604',
        'https://www.nature.com/articles/s41598-021-97762-x'
      ]),
      mechanism: 'Concurrent soil-water deficit, high temperature and elevated atmospheric vapour-pressure deficit increase evaporative demand, reduce hydraulic safety margins and carbon assimilation, and can interact with antecedent wetting, prior stress and biotic agents to trigger canopy defoliation, dieback and tree death.',
      geographic_scope: 'European forest mortality databases and ICP-Forest plots plus northern Australian mangrove and inland native-forest dieback events. The studies do not establish a universal global forest coefficient.',
      temporal_scope: 'European event and monitoring records spanning recent decades, including ICP-Forest background mortality during 1993-2013; northern Australian event reconstructions for 2015-2016 and 2020 placed in roughly 220-250-year palaeoclimate context.',
      moderators: Object.freeze([
        'tree species, age and hydraulic traits',
        'soil depth, rooting access and antecedent moisture',
        'vapour-pressure deficit and heat duration',
        'drought intensity, timing and recovery interval',
        'stand density and competition',
        'insects, pathogens and fire',
        'salinity and sea-level antecedents for mangroves',
        'management, thinning and local adaptation'
      ]),
      alternative_explanations: Object.freeze([
        'pests, pathogens, fire, windthrow and land management can cause mortality independently',
        'mortality-event databases are spatially uneven and may overrepresent well-studied regions',
        'coincidence with a rare compound event is not a causal risk ratio',
        'mangrove and inland-forest dieback have different antecedent mechanisms and cannot share one effect coefficient'
      ]),
      counterevidence: 'Not every hot-dry episode produces mortality, and many mortality events in the European compilation did not coincide with the source rare-compound-event definition. The northern Australian study reconstructs event context rather than a controlled causal intervention. Species tolerance, acclimation, deeper roots, favorable post-event conditions and management can reduce or delay mortality.',
      notes: 'Promoted as a compound-hazard pathway. The reported 46, 34 and 27 percent values are event coincidence proportions, not transferable effect sizes or probabilities attributable to the compound exposure.',
      reviewed_at: '2026-07-19',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_two_independent_primary_full_text_readbacks',
        source: 'environ_anomalies',
        target: 'overstory_tree_mortality',
        direction: 'compound hot, dry and high-atmospheric-demand events increase tree defoliation, dieback and mortality risk under bounded ecosystem conditions',
        mechanism: 'Coincident soil and atmospheric drought plus heat increase hydraulic and carbon stress and can cross species- and stand-specific mortality thresholds.',
        geographic_scope: 'Europe and northern Australia in the cited studies.',
        temporal_scope: 'Recent monitoring and event records with multi-century palaeoclimate context for the Australian cases.',
        confidence: 'high',
        evidence_basis: 'two_independent_observational_mortality_and_compound_event_analyses',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://doi.org/10.1016/j.scitotenv.2021.151604',
            locator: 'Abstract, highlights, methods and results: two independent European datasets; simultaneous hot summers, elevated VPD and dry years; 143 of 310 compiled mortality events, 34 percent of drought-defoliation cases and 27 percent of drought-mortality cases coincident with rare compound events.',
            source_type: 'peer_reviewed_open_primary_observational_study'
          }),
          Object.freeze({
            url: 'https://www.nature.com/articles/s41598-021-97762-x',
            locator: 'Abstract; event reconstructions; palaeoclimate analysis; Discussion: compound antecedent and coincident conditions for 2015-2016 mangrove dieback and 2020 inland forest dieback in northern Australia.',
            source_type: 'independent_peer_reviewed_open_primary_study'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'compound_hot_dry_event_tree_mortality_response',
          metric_name: 'Tree mortality or severe defoliation during source-defined compound hot-dry events',
          unit: 'mortality probability, dead-tree count, affected area, or event coincidence proportion with denominator retained',
          geography: 'declared forest plot, stand, mortality-event footprint or monitoring network',
          cadence: 'event and annual forest-health update',
          source_id: 'gazol_camarero_2022_allen_et_al_2021',
          transformation: 'Join tree mortality or severe-defoliation observations to source-defined temperature, VPD, precipitation or drought metrics at the same location and exposure window; retain species, event threshold, denominator, background mortality and antecedent conditions.',
          uncertainty: 'Carry sampling, event-detection, climate-data, spatial-matching, mortality-classification and reporting-bias uncertainty. Coincidence proportions are not converted to attributable fractions.',
          threshold_provenance: 'Study-specific rare hot-summer and dry-year definitions, VPD trends, drought-cause classifications and palaeoclimate event reconstructions.',
          failure_behavior: 'Do not estimate when mortality timing, compound-event definition, denominator, species or spatial match is absent, and never pool mangrove and inland-forest effects without ecosystem stratification.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'wet_bulb_heat',
    target: 'public_health_heat_burden',
    verb: 'raises',
    adverb: 'through humidity-constrained human heat dissipation under sustained exposure',
    influence: 0.7,
    topology_rule: 'missing_link_manual_full_text_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'direct',
      relationship_type: 'bounded_wet_bulb_temperature_mortality_pathway',
      confidence: 'high',
      source_urls: Object.freeze([
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC11623271/',
        'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
      ]),
      relationship_source_urls: Object.freeze([
        'https://pmc.ncbi.nlm.nih.gov/articles/PMC11623271/',
        'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health'
      ]),
      mechanism: 'Wet-bulb temperature combines air temperature and atmospheric moisture and therefore bounds evaporative cooling potential. As wet-bulb heat rises, sweat evaporation becomes less effective, body heat storage and cardiovascular and renal strain increase, and acute illness or mortality risk can rise, with strong variation by age, activity, acclimatization, housing and cooling access.',
      geographic_scope: 'Mexico for the primary population study, using municipality-day wet-bulb exposure and national vital-statistics microdata. WHO corroborates the human heat-balance mechanism globally but does not supply a transferable wet-bulb coefficient.',
      temporal_scope: 'Daily exposures and distributed mortality lags across 1998-2019 in Mexico; future projections in the primary paper remain scenario outputs and are not substituted for observed historical effects.',
      moderators: Object.freeze([
        'age and baseline health',
        'physical activity and occupational exposure',
        'acclimatization and local minimum-mortality temperature',
        'indoor versus outdoor conditions',
        'shade, wind and radiation',
        'cooling access and power reliability',
        'housing quality and socioeconomic status',
        'lag structure, mortality harvesting and precipitation'
      ]),
      alternative_explanations: Object.freeze([
        'dry-bulb temperature and other heat indices can explain overlapping mortality variation',
        'air pollution, infection and socioeconomic shocks can coincide with heat',
        'station interpolation and municipality exposure assignment create measurement error',
        'occupational and behavioral exposure varies within the same municipality-day'
      ]),
      counterevidence: 'Wet-bulb temperature is not a complete personal heat-dose metric because it omits radiation, wind, clothing, metabolic load and indoor conditions. The primary study finds strong age heterogeneity, and its Mexico-specific exposure-response functions are not universal. Other research finds no single wet-bulb survivability threshold across people and settings.',
      notes: 'Promoted from a thermodynamic wet-bulb study, not WBGT. Wet-Bulb Globe Temperature evidence remains excluded from this exact endpoint unless a separate operational indicator is created.',
      reviewed_at: '2026-07-19',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_open_population_full_text_and_authoritative_mechanism_readback',
        source: 'wet_bulb_heat',
        target: 'public_health_heat_burden',
        direction: 'higher daily wet-bulb temperature increases excess mortality risk above age-specific minimum-mortality conditions',
        mechanism: 'High humidity and temperature reduce evaporative heat loss, increasing body heat storage and acute physiological strain.',
        geographic_scope: 'Approximately 2,400 Mexican municipalities represented in national mortality and weather records.',
        temporal_scope: '1998-2019 historical daily exposure-response analysis.',
        confidence: 'high',
        evidence_basis: 'population_wide_municipality_day_fixed_effects_and_distributed_lag_analysis',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11623271/',
            locator: 'Abstract; Introduction; Methods; Figure 1; supplementary Table S1: station-derived daily mean wet-bulb temperature, 13.4 million deaths over more than 21 million municipality-days, age-specific exposure-response functions, distributed lags, fixed effects, precipitation controls and confidence bands.',
            source_type: 'peer_reviewed_open_primary_population_study'
          }),
          Object.freeze({
            url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health',
            locator: 'Heat and health mechanism and vulnerability sections: high temperature and humidity constrain heat elimination and increase acute cardiovascular, renal and heat-illness risks; vulnerability and adaptation conditions.',
            source_type: 'independent_authoritative_mechanism'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'wet_bulb_temperature_mortality_response',
          metric_name: 'Age-specific mortality response to daily mean thermodynamic wet-bulb temperature',
          unit: 'relative mortality risk or additional deaths per one million person-days by wet-bulb-temperature bin',
          geography: 'declared municipality or comparable health-service population with matched daily meteorology and mortality',
          cadence: 'daily exposure with annual or multi-year epidemiological estimation',
          source_id: 'wilson_et_al_science_advances_2024_mexico',
          transformation: 'Estimate wet-bulb temperature from collocated temperature, humidity and pressure using a declared thermodynamic method; match daily exposure to age-stratified mortality; use distributed lags and location and time controls; retain the age-specific minimum-mortality temperature and full response curve.',
          uncertainty: 'Carry source confidence bands or coefficient uncertainty, station interpolation, mortality coding, exposure assignment, lag, model-form and confounding uncertainty; do not reduce the nonlinear age-specific curve to a universal per-degree coefficient.',
          threshold_provenance: 'Source age-specific minimum-mortality wet-bulb temperatures and exposure bins; no universal 35 degree Celsius threshold is used for population mortality estimation.',
          failure_behavior: 'Do not estimate when wet-bulb and health observations are not time- and geography-matched, and never substitute WBGT, heat index or dry-bulb temperature without an explicitly separate contract.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'demand_response',
    target: 'carbon_emission',
    verb: 'can reduce',
    adverb: 'when flexible electricity use shifts from higher- to lower-carbon hours without increasing total demand',
    influence: -0.48,
    topology_rule: 'missing_link_full_text_signed_response_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'direct',
      relationship_type: 'mitigation_pathway',
      confidence: 'moderate',
      source_urls: Object.freeze([
        'https://www.mdpi.com/2071-1050/16/4/1413',
        'https://www.eia.gov/todayinenergy/detail.php?id=60482'
      ]),
      relationship_source_urls: Object.freeze([
        'https://www.mdpi.com/2071-1050/16/4/1413',
        'https://www.eia.gov/todayinenergy/detail.php?id=60482'
      ]),
      mechanism: 'Carbon-aware demand response reschedules flexible electricity consumption toward hours or locations with lower attributable grid carbon intensity. Emissions fall only when the shifted load changes generation dispatch or consumption-weighted emissions and any rebound is smaller than the avoided high-carbon supply.',
      geographic_scope: 'Fangshan District, Beijing, for the primary 108-enterprise simulation and operational-data case study. Application elsewhere requires local grid dispatch, marginal or consumption-based carbon intensity, flexible-load and rebound data.',
      temporal_scope: 'The primary case uses hourly Fangshan power-flow and load data for a representative day in December 2022; longer-run capacity and investment effects are outside that estimate.',
      moderators: Object.freeze([
        'marginal rather than average grid carbon intensity',
        'renewable availability and curtailment',
        'dispatch constraints and imports',
        'load flexibility and production requirements',
        'rebound or catch-up consumption',
        'storage losses',
        'customer participation and automation',
        'carbon-accounting boundary'
      ]),
      alternative_explanations: Object.freeze([
        'emissions can fall because the underlying generation mix changes rather than because demand response shifts load',
        'average carbon factors can report an accounting change without a marginal dispatch change',
        'efficiency improvements or production changes can coincide with the response event',
        'a shifted load can move emissions to another hour or balancing area'
      ]),
      counterevidence: 'Demand response does not necessarily reduce emissions. Shifting toward a lower-price hour can increase emissions when marginal generation is more carbon intensive, and load rebound, storage losses or total-demand growth can erase reductions. The Fangshan results are modeled potential under a 10 percent load-adjustment constraint, not randomized observed abatement.',
      notes: 'Promoted as a signed and conditional response edge. The graph value is negative because the defended pathway reduces the target; it is not a universal avoided-emissions coefficient.',
      reviewed_at: '2026-07-25',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_open_full_text_signed_pathway_readback',
        source: 'demand_response',
        target: 'carbon_emission',
        direction: 'carbon-aware load shifting can reduce electricity-attributable carbon emissions under a verified lower-carbon dispatch contrast',
        mechanism: 'Flexible demand is moved away from higher-carbon supply intervals and toward lower-carbon intervals while useful energy service is preserved.',
        geographic_scope: 'Fangshan District, Beijing, for the source case; no globalized reduction factor.',
        temporal_scope: 'Hourly representative-day analysis using December 2022 system and load data.',
        confidence: 'moderate',
        evidence_basis: 'power_flow_and_dynamic_carbon_accounting_simulation_with_real_enterprise_load_profiles',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://www.mdpi.com/2071-1050/16/4/1413',
            locator: 'Methods Sections 2-3; Figures 8-12; Discussion; Conclusions: hourly dynamic carbon factors, 108 enterprises in six industries, maximum 10 percent load adjustment, before-versus-after modeled emissions and explicit grid and industry moderators.',
            source_type: 'peer_reviewed_open_primary_model_and_case_study'
          }),
          Object.freeze({
            url: 'https://www.eia.gov/todayinenergy/detail.php?id=60482',
            locator: 'EIA operational context for hourly electricity demand, generation mix and grid balancing; retained as measurement corroboration rather than an avoided-emissions coefficient.',
            source_type: 'independent_authoritative_operational_context'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'demand_response_avoided_grid_co2',
          metric_name: 'Electricity-attributable carbon-dioxide change after verified demand-response dispatch',
          unit: 'kilograms or tonnes CO2 avoided, with megawatt-hours shifted and carbon-intensity contrast reported separately',
          geography: 'declared balancing area, node, utility territory or facility portfolio',
          cadence: 'event and hourly settlement with monthly or annual aggregation',
          source_id: 'fangshan_low_carbon_demand_response_2024',
          transformation: 'Compare time- and location-matched counterfactual and response load against reviewed marginal or consumption-based carbon-intensity series; retain shifted energy, rebound, imports, storage losses and baseline method.',
          uncertainty: 'Carry load-baseline error, participation, dispatch attribution, carbon-factor uncertainty, rebound and counterfactual sensitivity. Modeled potential is not treated as metered avoided emissions.',
          threshold_provenance: 'The source case constrains load adjustment to at most 10 percent of original load; other programs require their own verified flexibility and comfort or production limits.',
          failure_behavior: 'Do not report avoided emissions when only peak reduction is known, when the carbon-intensity contrast is absent, or when catch-up load and total energy are not reconciled.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'urbanization',
    target: 'carbon_emission',
    verb: 'alters',
    adverb: 'through changing settlement form, household structure, industry, transport, infrastructure, income, and energy intensity',
    influence: 0.42,
    topology_rule: 'missing_link_full_text_sign_changing_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'indirect',
      relationship_type: 'sign_changing_socioeconomic_pathway',
      confidence: 'moderate',
      source_urls: Object.freeze([
        'https://doi.org/10.5018/economics-ejournal.ja.2018-44',
        'https://doi.org/10.1007/s11356-017-0662-2',
        'https://doi.org/10.1186/s42162-024-00344-0'
      ]),
      relationship_source_urls: Object.freeze([
        'https://doi.org/10.5018/economics-ejournal.ja.2018-44',
        'https://doi.org/10.1007/s11356-017-0662-2',
        'https://doi.org/10.1186/s42162-024-00344-0'
      ]),
      mechanism: 'Urbanization simultaneously changes population density, household size, buildings, transport, public infrastructure, industrial structure, income, technology, land cover and energy intensity. These pathways can raise or lower territorial carbon emissions, and spatial spillovers can transfer part of the response to adjacent regions.',
      geographic_scope: 'Chinese provincial evidence, with the primary spatial-panel study covering 29 provinces and excluding Tibet for unavailable energy data. The Guizhou corroboration covers one province; neither is globalized.',
      temporal_scope: 'The primary dynamic spatial-panel study uses annual provincial observations through 2000-2013, with supporting Chinese evidence spanning 1980-2014 and Guizhou observations spanning 2000-2020.',
      moderators: Object.freeze([
        'urbanization definition and stage',
        'city-size distribution and density',
        'household size',
        'industrial and employment structure',
        'income and consumption',
        'energy intensity and fuel mix',
        'transport and building form',
        'regional spillovers and embodied emissions',
        'environmental policy and technology'
      ]),
      alternative_explanations: Object.freeze([
        'economic growth and industrialization can drive both urbanization and emissions',
        'energy policy and technology can change emissions independently',
        'migration can relocate rather than create production emissions',
        'territorial inventories omit embodied emissions in interregional trade',
        'dynamic panel and Granger methods do not establish a randomized causal effect'
      ]),
      counterevidence: 'The sign is not universal. The primary study reports negative short-run and positive long-run urbanization-rate effects, a positive city-size-distribution effect, and spatial spillovers; other studies find regional and stage-dependent nonlinearities. The edge therefore says alters rather than increases and must not carry a single global elasticity.',
      notes: 'Promoted after exact full-text review with sign, time horizon, spatial spillovers and alternative socioeconomic drivers preserved.',
      reviewed_at: '2026-07-25',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_full_text_sign_changing_spatial_panel_readback',
        source: 'urbanization',
        target: 'carbon_emission',
        direction: 'urbanization changes carbon emissions through multiple opposing pathways whose net sign varies by place, stage, urban form and time horizon',
        mechanism: 'Settlement and demographic change reorganize energy demand, buildings, mobility, industry, household scale economies, infrastructure and innovation.',
        geographic_scope: 'Twenty-nine Chinese provinces in the primary study, with China-wide and Guizhou-specific corroboration.',
        temporal_scope: 'Primarily 2000-2013 annual provincial panel, with corroborating studies through 2014 and 2020.',
        confidence: 'moderate',
        evidence_basis: 'dynamic_spatial_panel_plus_independent_error_correction_stirpat_and_var_studies',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://doi.org/10.5018/economics-ejournal.ja.2018-44',
            locator: 'Methods Sections 3.1-3.2; Tables 8-9; Sections 4.3.5-4.3.8; Conclusions: dynamic Spatial Durbin panel, short- and long-run direct and spillover effects, sign reversal, city-size-distribution effect and limitations for Chinese provinces.',
            source_type: 'peer_reviewed_open_primary_spatial_panel_study'
          }),
          Object.freeze({
            url: 'https://doi.org/10.1007/s11356-017-0662-2',
            locator: 'Abstract and methods summary: 1980-2014 Chinese urban-population and carbon-emission series, Granger and error-correction analysis, and STIRPAT decomposition across 29 provinces.',
            source_type: 'independent_peer_reviewed_primary_study'
          }),
          Object.freeze({
            url: 'https://doi.org/10.1186/s42162-024-00344-0',
            locator: 'Open full text, Abstract, Methods and Conclusion: Guizhou 2000-2020 VAR, impulse-response and variance-decomposition evidence showing time-varying magnitude and direction.',
            source_type: 'independent_peer_reviewed_open_regional_study'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'urbanization_emissions_spatial_dynamic_response',
          metric_name: 'Territorial carbon-emissions response to multidimensional urbanization',
          unit: 'dimension-specific elasticity or emissions change per declared urbanization contrast',
          geography: 'declared city, province or spatial panel with neighbor matrix and inventory boundary',
          cadence: 'annual socioeconomic and emissions panel',
          source_id: 'niu_lekse_2018_urbanization_carbon_spatial_panel',
          transformation: 'Keep urban population share, city-size distribution, built area, income, household size, industrial structure, energy intensity and territorial emissions as separate variables; report short- and long-run direct, indirect and total effects.',
          uncertainty: 'Carry coefficient standard errors or intervals, spatial-weight sensitivity, fixed effects, endogeneity, inventory uncertainty and regional heterogeneity. Do not collapse opposing dimensions into a universal signed coefficient.',
          threshold_provenance: 'No universal threshold; source-specific urbanization stage, city-size distribution and model specification govern interpretation.',
          failure_behavior: 'Do not estimate from urban population share alone when emissions boundary, time horizon, confounders, spatial spillovers or urban-form dimensions are unavailable.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'temp',
    target: 'overstory_tree_mortality',
    verb: 'raises the risk of',
    adverb: 'through warming-sensitive western-pine-beetle development during severe drought',
    influence: 0.58,
    topology_rule: 'missing_link_full_text_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'indirect',
      relationship_type: 'bounded_warming_beetle_tree_mortality_pathway',
      confidence: 'moderate',
      source_urls: Object.freeze([
        'https://research.fs.usda.gov/treesearch/63775',
        'https://toolkit.climate.gov/NCA5',
        'https://eros.usgs.gov/earthshots/the-beetles-attack'
      ]),
      relationship_source_urls: Object.freeze([
        'https://research.fs.usda.gov/treesearch/63775',
        'https://toolkit.climate.gov/NCA5',
        'https://eros.usgs.gov/earthshots/the-beetles-attack'
      ]),
      mechanism: 'Contemporary warming can accelerate western-pine-beetle development and reduce larval overwinter mortality. During severe drought, weakened ponderosa-pine defenses allow the larger beetle population to translate that thermal response into additional overstory mortality.',
      geographic_scope: 'Ponderosa-pine forests of the Sierra Nevada, California, for the quantified estimate. The mechanism is not extrapolated to every beetle, tree species or forest region.',
      temporal_scope: 'California meteorological drought during 2012-2015, with lagged ponderosa-pine mortality response observations extending through 2016.',
      moderators: Object.freeze([
        'western-pine-beetle development and voltinism',
        'winter larval survival',
        'drought severity and duration',
        'ponderosa-pine water stress and resin defense',
        'stand density, age and structure',
        'temperature thresholds and seasonal timing',
        'other bark-beetle and mortality agents',
        'forest management and recovery conditions'
      ]),
      alternative_explanations: Object.freeze([
        'drought-driven host-defense failure can raise mortality without a warming-driven beetle-population change',
        'other bark-beetle species and pathogens contributed during the regional event',
        'stand structure and competition can alter drought mortality',
        'the process model is evaluated against field observations but is not a randomized temperature intervention'
      ]),
      counterevidence: 'The source estimate is specific to western pine beetle, ponderosa pine and one extreme California drought. Thermal responses can differ or reverse across species and temperature ranges, and improved moisture can restore host defense. The study suggestion of a possible 35-40 percent mortality increase per degree assumes additive host and beetle effects and is not promoted as an effect coefficient.',
      notes: 'Promoted from the missing-link queue only for the exact warming-to-tree-mortality pathway mediated by western pine beetle during severe drought. The numerical estimate and its 95 percent interval render in the relationship inspector with the regional and mechanistic boundary.',
      reviewed_at: '2026-07-25',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_primary_full_text_and_national_assessment_readback',
        source: 'temp',
        target: 'overstory_tree_mortality',
        direction: 'warming increases overstory mortality risk through temperature-sensitive beetle population dynamics when severe drought reduces host defense',
        mechanism: 'Faster beetle development and lower overwinter mortality increase population pressure on drought-stressed ponderosa pine.',
        geographic_scope: 'Sierra Nevada ponderosa-pine forests in California for the quantified estimate.',
        temporal_scope: '2012-2015 meteorological drought and lagged tree response through 2016.',
        confidence: 'moderate',
        evidence_basis: 'process_based_beetle_host_model_evaluated_against_field_observations_with_national_assessment_corroboration',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://research.fs.usda.gov/treesearch/63775',
            locator: 'Abstract and full text: coupled western-pine-beetle and host-tree model, field evaluation, temperature-sensitive development and overwinter survival, and 29.9 percent increase in ponderosa-pine mortality with 95 percent CI 29.4-30.2 percent.',
            source_type: 'peer_reviewed_primary_model_and_field_evaluation'
          }),
          Object.freeze({
            url: 'https://toolkit.climate.gov/NCA5',
            locator: 'Fifth National Climate Assessment Chapter 7, Box 7.1: warming-sensitive beetle life cycles and winter survival, drought-weakened host defense, California mortality attribution and cross-system limitations.',
            source_type: 'independent_authoritative_national_assessment'
          }),
          Object.freeze({
            url: 'https://eros.usgs.gov/earthshots/the-beetles-attack',
            locator: 'USGS Earthshots: warm dry summers, mild winters, host defense and successive favorable years as conditional outbreak controls, with Landsat-observed forest-cover damage.',
            source_type: 'independent_authoritative_mechanism_and_observation_context'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'warming_attributable_beetle_mediated_ponderosa_mortality',
          metric_name: 'Ponderosa-pine mortality attributable to warming-sensitive western-pine-beetle dynamics during drought',
          unit: 'percent change in drought-period ponderosa-pine mortality with 95 percent interval',
          geography: 'declared ponderosa-pine population in the Sierra Nevada study domain',
          cadence: 'event assessment after tree-mortality and beetle-flight observations are complete',
          source_id: 'global_change_biology_robbins_2022_warming_beetle_tree_mortality',
          transformation: 'Retain the observed drought window, lagged tree response, beetle and host species, contemporary-versus-counterfactual temperature contrast, process-model structure, field-evaluation data and confidence interval.',
          uncertainty: 'Carry the source confidence interval and preserve structural uncertainty in beetle development, winter survival, host defense, drought response, stand condition and non-beetle mortality agents.',
          threshold_provenance: 'Source-defined contemporary-warming counterfactual and drought years; no universal temperature or mortality threshold is implied.',
          failure_behavior: 'Do not transfer the coefficient to another beetle-host system, region, non-drought period or per-degree estimate without a separately validated model and observations.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'fast_fashion',
    target: 'deforestation',
    verb: 'can carry demand into',
    adverb: 'through traceable leather or forest-derived fibre supply chains',
    influence: 0.42,
    topology_rule: 'missing_link_bounded_supply_chain_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'indirect',
      relationship_type: 'bounded_fashion_forest_risk_supply_chain',
      confidence: 'moderate',
      source_urls: Object.freeze([
        'https://doi.org/10.3390/f11040472',
        'https://www.eea.europa.eu/en/newsroom/editorial/how-to-make-textile-consumption-and-production-more-sustainable',
        'https://www.eea.europa.eu/en/circularity/sectoral-modules/textiles/land-use-for-eus-textiles-consumption'
      ]),
      relationship_source_urls: Object.freeze([
        'https://doi.org/10.3390/f11040472',
        'https://www.eea.europa.eu/en/newsroom/editorial/how-to-make-textile-consumption-and-production-more-sustainable',
        'https://www.eea.europa.eu/en/circularity/sectoral-modules/textiles/land-use-for-eus-textiles-consumption'
      ]),
      mechanism: 'High-volume, short-use fashion demand can increase procurement of new leather and bio-based fibres. Where bovine leather originates from cattle expansion in a forest-risk frontier, or forest-derived cellulosic fibre lacks deforestation-free traceability, clothing and footwear demand can transmit commodity pressure into forest conversion.',
      geographic_scope: 'The primary leather study covers Brazilian leather exported to Italy during 2014-2018, with exporter-importer records for August 2017-August 2018. The EEA evidence covers EU textile consumption and upstream land-use pressure; it does not attribute all textile land use to forest loss.',
      temporal_scope: 'Commodity sourcing and trade over the named study periods, with deforestation timing linked only when farm, slaughterhouse, processor, fibre producer and importer traceability is available.',
      moderators: Object.freeze([
        'garment and footwear material mix',
        'share of virgin versus recycled fibre',
        'leather treatment as co-product and allocation method',
        'supplier-country and subnational origin',
        'farm-to-processor traceability',
        'certification and deforestation-free procurement',
        'product lifetime, reuse and recycling',
        'consumer demand and unsold inventory',
        'forest baseline and legal-deforestation definition'
      ]),
      alternative_explanations: Object.freeze([
        'cattle expansion may be driven primarily by beef demand rather than leather value',
        'cotton and wool land use need not replace forests',
        'textile land-use footprints can rise without observed deforestation',
        'commodity exports can be re-routed through processors and obscure origin',
        'agricultural policy, land tenure, roads and enforcement can dominate frontier clearing'
      ]),
      counterevidence: 'Fast fashion is not a land-use category and most garments do not directly contain a traceable forest-risk input. The EEA excludes forest impacts from its newest land-use indicator because of high model uncertainty. The leather study identifies embedded deforestation risk rather than a causal area-per-garment coefficient, and bovine hides are co-products of cattle production. The edge must therefore remain indirect, material-specific and traceability-dependent.',
      notes: 'Promoted only as a bounded forest-risk supply-chain pathway. It must not be rendered as a universal claim that every fast-fashion purchase causes deforestation.',
      reviewed_at: '2026-07-25',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_primary_supply_chain_and_authoritative_land_use_readback',
        source: 'fast_fashion',
        target: 'deforestation',
        direction: 'high-volume fashion demand can transmit pressure into forest conversion when a named leather or forest-derived fibre supply chain is linked to a forest-risk frontier',
        mechanism: 'Virgin-material demand reaches cattle, pulp or other bio-based fibre producers through procurement and trade; deforestation occurs only where expansion or extraction replaces forest and traceability confirms the chain.',
        geographic_scope: 'Brazil-to-Italy bovine-leather trade for the primary case, with EU textile land-use evidence as broader pressure context.',
        temporal_scope: '2014-2018 trade analysis, including exporter-importer declarations for August 2017-August 2018; other periods require refreshed trade and land-use data.',
        confidence: 'moderate',
        evidence_basis: 'primary_multilevel_trade_and_supply_chain_analysis_with_authoritative_european_textile_land_use_corroboration',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://doi.org/10.3390/f11040472',
            locator: 'Abstract, Methods, Results and Conclusions: Brazilian-Italian bovine-leather trade using country, state and exporter-importer records; imports from Amazon deforestation-frontier states and loss of origin traceability create embedded deforestation risk.',
            source_type: 'peer_reviewed_primary_supply_chain_study'
          }),
          Object.freeze({
            url: 'https://www.eea.europa.eu/en/newsroom/editorial/how-to-make-textile-consumption-and-production-more-sustainable',
            locator: 'EEA assessment: bio-based textile fibres create land, water, deforestation and processing pressures; the statement is material-specific rather than a universal textile coefficient.',
            source_type: 'independent_authoritative_assessment'
          }),
          Object.freeze({
            url: 'https://www.eea.europa.eu/en/circularity/sectoral-modules/textiles/land-use-for-eus-textiles-consumption',
            locator: 'EU27 textile-consumption land-use indicator for 2010-2022, methodology and explicit exclusion of forest impacts in the latest model because of high uncertainty.',
            source_type: 'independent_authoritative_indicator_and_counterevidence'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'traceable_fashion_forest_risk_material_flow',
          metric_name: 'Virgin leather or forest-derived textile input traceably linked to recent forest conversion',
          unit: 'tonnes material and hectares verified forest conversion per declared supply chain and period, reported separately',
          geography: 'named farm or forest origin, processor, exporter, importer and destination market',
          cadence: 'shipment or annual due-diligence reporting with satellite and land-registry refresh',
          source_id: 'mammadova_masiero_pettenella_2020_embedded_deforestation_leather',
          transformation: 'Retain commodity, co-product allocation, shipment, origin, processor, time, forest baseline, conversion date and traceability coverage; never multiply generic textile sales by an unverified deforestation factor.',
          uncertainty: 'Origin laundering, re-export, missing interstate trade, co-product allocation, forest maps, legal status and supplier coverage affect attribution.',
          threshold_provenance: 'Use a declared deforestation-free due-diligence cutoff date and forest definition, plus source-specific material and trade classifications.',
          failure_behavior: 'Do not calculate or display a fashion-attributable deforestation area when material composition, geographic origin, traceability and matched land-cover change are absent.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'personal_conveyance',
    target: 'carbon_emission',
    verb: 'adds to',
    adverb: 'through fossil-fuel combustion in private cars and vans',
    influence: 0.7,
    topology_rule: 'missing_link_authoritative_emissions_inventory_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'direct',
      relationship_type: 'bounded_private_road_transport_emissions_pathway',
      confidence: 'high',
      source_urls: Object.freeze([
        'https://www.iea.org/reports/breakthrough-agenda-report-2025/road-transport',
        'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/'
      ]),
      relationship_source_urls: Object.freeze([
        'https://www.iea.org/reports/breakthrough-agenda-report-2025/road-transport',
        'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/'
      ]),
      mechanism: 'Gasoline- and diesel-powered private cars and vans oxidize fossil carbon during use and emit carbon dioxide through their exhaust. Electric vehicles move most use-phase emissions to electricity generation, while vehicle and infrastructure production remain separate lifecycle terms.',
      geographic_scope: 'Global road-transport inventory for the IEA source and global transport-sector assessment for IPCC. Country, city and household attribution requires local vehicle activity, fuel, occupancy, fleet and electricity data.',
      temporal_scope: 'IEA road-sector totals and modal shares for 2024; IPCC transport inventory context for 2019. The two reporting years are retained separately and are not combined into a trend.',
      moderators: Object.freeze([
        'vehicle-kilometres and passenger-kilometres travelled',
        'vehicle occupancy',
        'fuel carbon content and fuel economy',
        'vehicle size, age and powertrain',
        'electricity carbon intensity for electric vehicles',
        'urban form and access to public or active transport',
        'vehicle manufacturing and infrastructure lifecycle boundary',
        'road freight separation from passenger travel'
      ]),
      alternative_explanations: Object.freeze([
        'freight trucks, buses and two- or three-wheelers contribute separately to road-sector emissions',
        'electricity generation can be the proximate emissions source for electric personal travel',
        'vehicle manufacturing and road construction can add lifecycle emissions outside tailpipe inventories',
        'population, income, land use and transport policy jointly influence personal travel demand'
      ]),
      counterevidence: 'Personal conveyance is not synonymous with all road transport or all transport emissions. The IEA share combines passenger cars and vans, and neither source supplies a universal emissions-per-person coefficient or uncertainty interval. Zero-tailpipe vehicles can sharply reduce direct use-phase emissions, while their lifecycle result depends on electricity and manufacturing conditions.',
      notes: 'Promoted as a direct fossil-fuel-use pathway with explicit inventory boundaries. The source-reported road-emissions share is displayed as attribution context, not as a causal effect coefficient.',
      reviewed_at: '2026-07-25',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_authoritative_inventory_and_mechanism_readback',
        source: 'personal_conveyance',
        target: 'carbon_emission',
        direction: 'fossil-fuel use in private passenger cars and vans directly adds carbon dioxide to transport emissions',
        mechanism: 'Combustion of gasoline and diesel oxidizes fuel carbon and releases carbon dioxide at the tailpipe.',
        geographic_scope: 'Global road-transport inventory; subnational or household estimates require matched local activity and fleet data.',
        temporal_scope: '2024 IEA road-emissions inventory context and 2019 IPCC transport assessment context, reported separately.',
        confidence: 'high',
        evidence_basis: 'authoritative_sector_inventory_with_independent_assessment_of_transport_emissions_and_lifecycle_boundaries',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://www.iea.org/reports/breakthrough-agenda-report-2025/road-transport',
            locator: 'Road transport, State of the transition, Emissions: road-sector emissions were just over 6 Gt CO2 in 2024 and more than 60 percent came from passenger cars or vans.',
            source_type: 'authoritative_sector_inventory'
          }),
          Object.freeze({
            url: 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-10/',
            locator: 'Chapter 10, Figure 10.1 and Sections 10.1 and 10.4: road passenger and freight activity dominate transport emissions; passenger cars, two- and three-wheelers and minibuses account for most passenger-transport CO2, with direct, electricity and lifecycle boundaries distinguished.',
            source_type: 'independent_authoritative_assessment'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'passenger_car_van_share_of_road_co2',
          metric_name: 'Passenger-car and van share of road-transport carbon-dioxide emissions',
          unit: 'percent of road-transport CO2 emissions, with total road CO2 reported separately',
          geography: 'declared global or national road-transport inventory',
          cadence: 'annual inventory update',
          source_id: 'iea_breakthrough_agenda_road_transport_2025',
          transformation: 'Retain the reporting year, passenger-car-and-van grouping, direct road-emissions boundary and total road CO2. Do not infer a household coefficient by dividing by population.',
          uncertainty: 'The source reports a greater-than-60-percent share rather than a point estimate or confidence interval. Fleet coverage, fuel statistics, modal classification and inventory revision uncertainty must remain disclosed.',
          threshold_provenance: 'IEA 2025 road-transport assessment using 2024 sector emissions and modal shares.',
          failure_behavior: 'Do not display a precise personal-conveyance effect size or uncertainty interval when only the bounded sector share is available; do not mix direct tailpipe and lifecycle emissions.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'ai_data_centers',
    target: 'carbon_emission',
    verb: 'can raise',
    adverb: 'indirectly through additional electricity demand on fossil-containing grids',
    influence: 0.56,
    topology_rule: 'missing_link_authoritative_energy_system_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'indirect',
      relationship_type: 'bounded_ai_compute_electricity_emissions_pathway',
      confidence: 'moderate',
      source_urls: Object.freeze([
        'https://www.iea.org/reports/energy-and-ai/ai-and-climate-change',
        'https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai',
        'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report'
      ]),
      relationship_source_urls: Object.freeze([
        'https://www.iea.org/reports/energy-and-ai/ai-and-climate-change',
        'https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai',
        'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report'
      ]),
      mechanism: 'Growth in AI training and inference increases deployment and utilisation of accelerated servers. The resulting facility electricity demand causes indirect carbon-dioxide emissions when the physically supplied marginal and average generation mix contains fossil fuels.',
      geographic_scope: 'Global data-centre electricity and indirect-emissions system in the IEA assessment, with United States accelerated-server demand corroboration from LBNL. Facility attribution requires a named location, workload boundary and electricity supply.',
      temporal_scope: 'IEA observed data-centre totals for 2024 and scenarios through 2035; LBNL United States historical estimates through 2023 and scenarios through 2028.',
      moderators: Object.freeze([
        'AI workload adoption and service demand',
        'accelerator shipments, installed stock and utilisation',
        'hardware, model and software energy efficiency',
        'training versus inference workload mix',
        'power usage effectiveness and cooling technology',
        'grid location, hourly generation mix and marginal supply',
        'additional low-emissions generation and transmission availability',
        'load flexibility, curtailment and deployment bottlenecks'
      ]),
      alternative_explanations: Object.freeze([
        'non-AI cloud, storage and conventional-server workloads also increase data-centre demand',
        'building cooling and other infrastructure contribute separately to facility load growth',
        'grid emissions can change because of economy-wide demand, weather and generation investment',
        'contractual renewable procurement does not necessarily equal the physical hourly supply mix'
      ]),
      counterevidence: 'IEA reports 180 Mt CO2 from electricity used by all data centres in 2024, not by AI alone. Efficiency, lower-carbon electricity, flexible operation and deployment constraints can weaken or reverse emissions growth per unit of AI service. Neither IEA nor LBNL supplies a universal AI-task-to-CO2 coefficient, and their scenario ranges are not confidence intervals.',
      notes: 'Promoted only as a bounded electricity-mediated pathway. The platform displays total data-centre benchmarks alongside an explicit warning that AI is a subset and cannot be assigned the full total.',
      reviewed_at: '2026-07-25',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_authoritative_global_model_and_national_laboratory_readback',
        source: 'ai_data_centers',
        target: 'carbon_emission',
        direction: 'additional AI-accelerator electricity demand can increase indirect carbon-dioxide emissions where physical electricity supply includes fossil generation',
        mechanism: 'Accelerated-server electricity demand is met by a location- and time-specific generation mix whose fossil component emits carbon dioxide.',
        geographic_scope: 'Global IEA data-centre energy system with United States LBNL corroboration; no facility or household extrapolation.',
        temporal_scope: 'Observed 2024 global data-centre totals, IEA scenarios to 2035, and LBNL United States scenarios to 2028.',
        confidence: 'moderate',
        evidence_basis: 'authoritative_global_energy_system_modelling_with_independent_national_laboratory_bottom_up_demand_scenarios',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://www.iea.org/reports/energy-and-ai/ai-and-climate-change',
            locator: 'AI and climate change: data centres account for around 180 Mt indirect CO2 from electricity in 2024, all workloads combined and excluding backup generation; emissions depend on the supplied electricity mix and scenario.',
            source_type: 'authoritative_global_energy_system_assessment'
          }),
          Object.freeze({
            url: 'https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai',
            locator: 'Energy demand from AI: 415 TWh data-centre electricity in 2024; accelerated servers mainly driven by AI account for almost half of projected net electricity growth to 2030; adoption, efficiency and bottleneck sensitivity cases.',
            source_type: 'authoritative_global_demand_model'
          }),
          Object.freeze({
            url: 'https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report',
            locator: 'Executive summary and scenario methods: rapid accelerated-server growth, GPU shipment and utilisation uncertainty, cooling scenarios, and 325-580 TWh United States data-centre electricity range for 2028.',
            source_type: 'independent_national_laboratory_report'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'ai_accelerator_electricity_and_indirect_grid_co2',
          metric_name: 'AI-accelerator electricity demand and associated indirect grid carbon dioxide',
          unit: 'terawatt-hours and million tonnes CO2 per year, reported separately',
          geography: 'declared data-centre fleet or facility and matched physical electricity-supply region',
          cadence: 'annual inventory with scenario refresh when workload, hardware or power-system assumptions change',
          source_id: 'iea_energy_and_ai_2025',
          transformation: 'Separate AI-accelerator load from conventional workloads, multiply only temporally and geographically matched electricity by a declared physical-supply emissions factor, and retain observed versus scenario status.',
          uncertainty: 'Carry scenario, utilisation, efficiency, PUE, grid-mix, marginal-versus-average and workload-allocation uncertainty. IEA scenario ranges are not confidence intervals.',
          threshold_provenance: 'IEA 2025 Energy and AI modelling and LBNL 2024 bottom-up installed-equipment scenarios.',
          failure_behavior: 'Do not assign total data-centre electricity or emissions to AI, infer task-level CO2 without workload electricity, or mix contractual clean-energy claims with unmatched physical grid intensity.'
        })
      })
    })
  }),
  Object.freeze({
    source: 'food',
    target: 'deforestation',
    verb: 'can increase',
    adverb: 'through commodity-demand-mediated expansion of cropland and pasture into forests',
    influence: 0.62,
    topology_rule: 'missing_link_authoritative_land_use_promotion',
    evidence: Object.freeze({
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: 'indirect',
      relationship_type: 'bounded_agricultural_demand_land_conversion_pathway',
      confidence: 'high',
      source_urls: Object.freeze([
        'https://www.fao.org/newsroom/detail/cop26-agricultural-expansion-drives-almost-90-percent-of-global-deforestation/',
        'https://gfr.wri.org/forest-extent-indicators/deforestation-agriculture'
      ]),
      relationship_source_urls: Object.freeze([
        'https://www.fao.org/newsroom/detail/cop26-agricultural-expansion-drives-almost-90-percent-of-global-deforestation/',
        'https://gfr.wri.org/forest-extent-indicators/deforestation-agriculture'
      ]),
      mechanism: 'Demand for cattle, feed, oil crops and other agricultural commodities can increase production incentives and land requirements. Where yield growth, intensification, trade, governance or use of existing cleared land do not absorb that demand, producers can expand pasture or cropland by converting forest to agricultural land.',
      geographic_scope: 'Global agricultural-expansion attribution in the FAO Remote Sensing Survey, with commodity-specific replacement estimates and subnational maps in the WRI Global Forest Review. Local demand attribution requires traceable commodity origin and land-conversion data.',
      temporal_scope: 'FAO global forest-conversion assessment for 2000-2018 and WRI commodity-linked forest replacement for 2001-2015, retained as separate periods.',
      moderators: Object.freeze([
        'commodity type and production geography',
        'crop yield and pasture productivity',
        'use of existing cleared or degraded land',
        'international trade and supply-chain traceability',
        'land tenure and speculation',
        'forest governance and enforcement',
        'deforestation-free sourcing rules',
        'indirect land-use displacement and leakage'
      ]),
      alternative_explanations: Object.freeze([
        'subsistence production can clear forest without a global market-demand signal',
        'land speculation or tenure claims can motivate clearing despite weak agricultural profitability',
        'mining, infrastructure, settlements, fire and logging cause other forest loss',
        'tree-cover loss includes temporary disturbance and is not synonymous with permanent deforestation'
      ]),
      counterevidence: 'Rising agricultural demand does not require forest conversion when it is met by yield gains, dietary change, reduced waste, production shifts, restored land, or strong forest protection. FAO reports the share of deforestation associated with agricultural expansion, not the causal elasticity of deforestation to a unit of demand. WRI warns that spatial replacement does not by itself prove that a current farm caused an earlier clearing event and does not capture all indirect displacement.',
      notes: 'Promoted as a demand-mediated land-conversion pathway. The platform must keep agricultural expansion, forest replacement, gross tree-cover loss and permanent deforestation distinct.',
      reviewed_at: '2026-07-25',
      dossier: Object.freeze({
        promotion_status: 'promoted_after_authoritative_remote_sensing_and_independent_geospatial_readback',
        source: 'food',
        target: 'deforestation',
        direction: 'agricultural commodity demand can increase permanent forest conversion when production expands into forest land',
        mechanism: 'Commodity demand is mediated through production incentives and pasture or cropland expansion; forest conversion occurs when expansion takes place on forested land.',
        geographic_scope: 'Global attribution with commodity and subnational differentiation; no consumer, company or jurisdiction attribution without traceability.',
        temporal_scope: 'FAO 2000-2018 and WRI 2001-2015 assessments, reported separately.',
        confidence: 'high',
        evidence_basis: 'authoritative_global_remote_sensing_survey_with_independent_geospatial_commodity_replacement_analysis',
        source_locators: Object.freeze([
          Object.freeze({
            url: 'https://www.fao.org/newsroom/detail/cop26-agricultural-expansion-drives-almost-90-percent-of-global-deforestation/',
            locator: 'FAO Global Remote Sensing Survey findings: agricultural expansion accounts for almost 90 percent of global deforestation; more than half is conversion to cropland and almost 40 percent is livestock grazing.',
            source_type: 'authoritative_global_remote_sensing_assessment'
          }),
          Object.freeze({
            url: 'https://gfr.wri.org/forest-extent-indicators/deforestation-agriculture',
            locator: 'How much forest has been replaced by specific agricultural commodities; 2001-2015 commodity overlays, cattle, oil palm, soy and other commodity estimates, plus stated attribution and indirect-effect limitations.',
            source_type: 'independent_geospatial_indicator_and_methodology'
          })
        ]),
        indicator: Object.freeze({
          metric_id: 'agricultural_expansion_matched_to_permanent_forest_conversion',
          metric_name: 'Agricultural land expansion spatially and temporally matched to permanent forest conversion',
          unit: 'hectares of cropland or pasture expansion and hectares of permanent forest conversion, reported separately and as a matched share',
          geography: 'declared commodity origin, second-level administrative area, country, biome or reviewed global aggregation',
          cadence: 'annual to multi-year remote-sensing and agricultural-statistics update',
          source_id: 'fao_remote_sensing_survey_and_wri_global_forest_review',
          transformation: 'Match harmonized cropland or pasture expansion to a fixed forest definition, conversion period and commodity geography; keep gross tree-cover loss, temporary disturbance, forest replacement and permanent deforestation separate.',
          uncertainty: 'Land-cover classification, forest definition, commodity-map coverage, production origin, temporal mismatch, indirect displacement, mixed drivers and illegal or unreported production affect attribution.',
          threshold_provenance: 'FAO Global Remote Sensing Survey forest-conversion classes and WRI Global Forest Review commodity-linked deforestation methods.',
          failure_behavior: 'Do not assign deforestation to aggregate food demand, a consumer, or a company when production origin, expansion, forest baseline and conversion timing cannot be matched.'
        })
      })
    })
  })
]);
