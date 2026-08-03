export const CASCADE_ANCHOR_IDS = Object.freeze([
  'extreme_precipitation_intensity',
  'tropical_cyclone_rapid_intensification',
  'el_nino',
  'la_nina',
  'deforestation',
  'industry_farming',
  'vector_borne_disease_expansion',
  'ocean_carbon_uptake_weakening'
]);

export const CASCADE_UNSUPPORTED_EDGE_KEYS = new Set([
  'temp->el_nino',
  'carbon_emission->el_nino',
  'carbon_emission->la_nina',
  'temp->industry_farming',
  'monsoon_volatility->industry_farming',
  'ocean_acidification->ocean_heat_content'
]);

export const CASCADE_SUPPORT_NODE_OVERRIDES = Object.freeze({
  trade_wind_weakening: {
    name: 'Equatorial Pacific Trade-Wind Anomaly',
    description: 'Signed departure of equatorial Pacific easterly trade winds from their seasonal baseline. Weaker or reversed easterlies support El Niño development; stronger easterlies support La Niña development.',
    source_urls: [
      'https://www.climate.gov/news-features/understanding-climate/el-nino-and-la-nina-frequently-asked-questions',
      'https://earthobservatory.nasa.gov/WorldOfChange/ENSO'
    ],
    authenticity: {
      status: 'source_backed_operational_concept',
      label: 'Source-backed operational concept',
      exact_label_validated: true,
      source_scope: 'node_specific',
      anchor_id: null,
      note: 'The visible label is a signed wind-anomaly concept. The legacy internal ID is retained for compatibility and must not be interpreted as weakening on the La Niña pathway.'
    }
  },
  ocean_heat_content: {
    description: 'Heat stored in the upper ocean, interpreted at the geography and depth required by each relationship. ENSO dossiers use equatorial Pacific warm-water-volume anomalies; cyclone dossiers use storm-track tropical-cyclone heat potential.',
    source_urls: [
      'https://www.aoml.noaa.gov/ocean-conditions-in-the-intensification-of-hurricane-michael-2018/',
      'https://www.pmel.noaa.gov/elnino/upper-ocean-heat-content-and-enso'
    ],
    authenticity: {
      status: 'source_backed_operational_concept',
      label: 'Source-backed operational concept',
      exact_label_validated: true,
      source_scope: 'node_specific',
      anchor_id: null,
      note: 'Ocean heat content is a standard measured quantity, but every relationship must state its region, depth, anomaly sign, and baseline.'
    }
  },
  palm_oil_canopy_clearance: {
    name: 'Palm Oil-Driven Forest Clearance',
    description: 'Permanent forest conversion associated with expansion of oil-palm plantations, bounded to locations where land-use attribution or supply-area evidence supports the commodity link.',
    source_urls: [
      'https://www.globalforestwatch.org/blog/data-and-tools/companies-can-now-spot-deforestation-in-their-palm-oil-supply-chains-before-it-happens/',
      'https://www.fao.org/haltingdeforestation/about/transforming-agrifood-systems/solutions-tree/shift-5/measures'
    ],
    authenticity: {
      status: 'source_backed_operational_concept',
      label: 'Source-backed operational concept',
      exact_label_validated: true,
      source_scope: 'node_specific',
      anchor_id: null,
      note: 'This node is limited to attributed forest conversion and does not treat all oil-palm production or all tree-cover loss as deforestation.'
    }
  }
});

const INDICATORS = Object.freeze({
  extreme_precipitation_intensity: {
    metric_id: 'power_annual_max_daily_precipitation_anomaly',
    metric_name: 'Annual maximum corrected daily precipitation anomaly',
    unit: 'millimeters per day and percent anomaly',
    source_id: 'nasa_power_open_api',
    access: 'open API',
    endpoint: 'https://power.larc.nasa.gov/docs/services/api/temporal/daily/'
  },
  tropical_cyclone_rapid_intensification: {
    metric_id: 'ibtracs_24h_maximum_wind_change',
    metric_name: 'Tropical-cyclone 24-hour maximum sustained-wind change',
    unit: 'knots per 24 hours',
    source_id: 'noaa_ibtracs',
    access: 'open NCEI archive/download',
    endpoint: 'https://www.ncei.noaa.gov/products/international-best-track-archive'
  },
  el_nino: {
    metric_id: 'noaa_oni_warm_phase',
    metric_name: 'Oceanic Niño Index warm-phase anomaly',
    unit: 'degrees Celsius, rolling three-month Niño 3.4 SST anomaly',
    source_id: 'noaa_physical_sciences_laboratory_enso',
    access: 'open download; repository snapshot route /api/enso/snapshot',
    endpoint: 'https://psl.noaa.gov/enso/'
  },
  la_nina: {
    metric_id: 'noaa_oni_cool_phase',
    metric_name: 'Oceanic Niño Index cool-phase anomaly',
    unit: 'degrees Celsius, rolling three-month Niño 3.4 SST anomaly',
    source_id: 'noaa_physical_sciences_laboratory_enso',
    access: 'open download; repository snapshot route /api/enso/snapshot',
    endpoint: 'https://psl.noaa.gov/enso/'
  },
  deforestation: {
    metric_id: 'fao_fra_forest_conversion_rate',
    metric_name: 'Forest conversion and annual forest-area change',
    unit: 'hectares per year and percent of baseline forest area',
    source_id: 'fao_global_forest_resources_assessment',
    access: 'open download; repository snapshot route /api/fra/snapshot',
    endpoint: 'https://www.fao.org/forest-resources-assessment/'
  },
  industry_farming: {
    metric_id: 'faostat_input_intensity_profile',
    metric_name: 'Agricultural input-intensity profile',
    unit: 'fertilizer, feed, livestock, and production quantities by country-year',
    source_id: 'faostat',
    access: 'open bulk download; repository support route /api/food-security/snapshot',
    endpoint: 'https://www.fao.org/faostat/en/'
  },
  vector_borne_disease_expansion: {
    metric_id: 'vbd_climate_suitability_and_transmission_season',
    metric_name: 'Disease-specific climate suitability and transmission-season length',
    unit: 'dimensionless dengue R0 and malaria-suitable months per year, reported separately',
    source_id: 'lancet_countdown_data_explorer',
    access: 'open annual indicator workbooks; CC BY-NC-SA 4.0 non-commercial license boundary',
    endpoint: 'https://lancetcountdown.org/explore-our-data/'
  },
  ocean_carbon_uptake_weakening: {
    metric_id: 'global_carbon_budget_ocean_sink_efficiency',
    metric_name: 'Ocean carbon sink and sink-efficiency anomaly',
    unit: 'gigatonnes carbon per year and fraction of anthropogenic emissions',
    source_id: 'global_carbon_budget',
    access: 'open download; repository snapshot route /api/gcb/snapshot',
    endpoint: 'https://globalcarbonbudget.org/'
  }
});

function locator(url, locatorText, sourceType = 'authoritative_assessment') {
  return { url, locator: locatorText, source_type: sourceType };
}

function dossierRelationship({
  source,
  target,
  relationshipLevel,
  direction,
  mechanism,
  geographicScope,
  temporalScope,
  moderators,
  alternatives,
  confidence,
  counterevidence,
  locators,
  verb = 'contributes to',
  adverb = 'under the documented conditions',
  influence = 0.36
}) {
  const sourceUrls = [...new Set(locators.map(item => item.url))];
  return {
    source,
    target,
    verb,
    adverb,
    influence,
    topology_rule: 'cascade_anchor_dossier_promotion',
    evidence: {
      source_status: relationshipLevel === 'direct' ? 'curated_edge_reference' : 'curated_local_reference',
      evidence_mode: relationshipLevel === 'direct' ? 'curated_edge_reference' : 'curated_local_reference',
      relationship_level: relationshipLevel,
      relationship_type: 'bounded_cascade_driver',
      confidence,
      source_urls: sourceUrls,
      relationship_source_urls: sourceUrls,
      mechanism,
      geographic_scope: geographicScope,
      temporal_scope: temporalScope,
      notes: `${direction} This relationship is promoted only within its stated scope and moderators.`,
      dossier: {
        version: 'cascade_anchor_edge_dossier_v1',
        promotion_status: 'promoted',
        reviewed_at: '2026-07-17',
        source,
        target,
        direction,
        mechanism,
        geographic_scope: geographicScope,
        temporal_scope: temporalScope,
        moderators,
        alternative_explanations: alternatives,
        confidence,
        counterevidence,
        indicator: INDICATORS[target],
        source_locators: locators
      }
    }
  };
}

const IPCC_HEAVY_PRECIP = 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/';
const NASA_EXTREMES = 'https://science.nasa.gov/climate-change/extreme-weather/extreme-weather-graphic-full-text/';
const NOAA_TCHP = 'https://www.aoml.noaa.gov/ocean-conditions-in-the-intensification-of-hurricane-michael-2018/';
const NOAA_RI_ENVIRONMENT = 'https://www.aoml.noaa.gov/atlantic-coast-hurricanes-intensifying-faster/';
const NASA_ENSO = 'https://earthobservatory.nasa.gov/WorldOfChange/ENSO';
const NOAA_ENSO_RISE = 'https://www.climate.gov/news-features/blogs/enso/rise-el-ni%C3%B1o-and-la-ni%C3%B1a';
const NOAA_ENSO_FAQ = 'https://www.climate.gov/news-features/understanding-climate/el-nino-and-la-nina-frequently-asked-questions';
const NOAA_ENSO_PREDICTION = 'https://content-drupal.climate.gov/news-features/blogs/enso/predicting-el-ni%C3%B1o-then-and-now';
const NOAA_MJO_EL_NINO = 'https://repository.library.noaa.gov/view/noaa/64700';
const NOAA_ENSO_TRANSITION = 'https://www.climate.gov/news-features/blogs/enso/double-dipping-why-does-la-ni%C3%B1a-often-occur-consecutive-winters';
const NOAA_ENSO_RECHARGE = 'https://www.pmel.noaa.gov/pubs/outstand/mein2119/theoretical.shtml';
const FAO_DEFORESTATION = 'https://www.fao.org/newsroom/detail/cop26-agricultural-expansion-drives-almost-90-percent-of-global-deforestation/en';
const GFW_PALM = 'https://www.globalforestwatch.org/blog/data-and-tools/companies-can-now-spot-deforestation-in-their-palm-oil-supply-chains-before-it-happens/';
const WORLD_BANK_MINING = 'https://documents.worldbank.org/curated/en/104271560321150518/pdf/Forest-Smart-Mining-Identifying-Factors-Associated-with-the-Impacts-of-Large-Scale-Mining-on-Forests.pdf';
const IPCC_AFOLU = 'https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-7/';
const OECD_FAO_OUTLOOK = 'https://www.oecd.org/en/publications/oecd-fao-agricultural-outlook-2019-2028_agr_outlook-2019-en/full-report/component-5.html';
const IPCC_HEALTH = 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-7/';
const IPCC_CROSS_SECTOR_RISK = 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-16/';
const IPCC_CARBON = 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-5/';
const IPCC_OCEAN = 'https://www.ipcc.ch/srocc/chapter/chapter-5/';

export const CASCADE_ANCHOR_RELATIONSHIPS = Object.freeze([
  dossierRelationship({
    source: 'temp', target: 'extreme_precipitation_intensity', relationshipLevel: 'direct',
    direction: 'Additional warming increases the moisture ceiling available to the heaviest precipitation events.',
    mechanism: 'Warmer air can contain more water vapour, increasing moisture convergence and event-scale precipitation intensity when lifting and storm dynamics are present.',
    geographicScope: 'Global thermodynamic mechanism; observed and projected changes vary by region, season, storm type, and data coverage.',
    temporalScope: 'Event scale, evaluated across multi-decadal climate trends and warming levels.',
    moderators: ['storm dynamics and moisture transport', 'aerosols and cloud microphysics', 'orography', 'regional circulation'],
    alternatives: ['natural variability', 'changes in observing systems', 'regional circulation changes'],
    confidence: 'high',
    counterevidence: 'The thermodynamic response does not imply that every storm or region becomes wetter; regional occurrence and dynamical responses remain heterogeneous.',
    locators: [
      locator(IPCC_HEAVY_PRECIP, 'Executive Summary, Heavy Precipitation and Pluvial Floods; Section 11.4 and Table 11.1'),
      locator(NASA_EXTREMES, 'Heavy Precipitation subsection')
    ], verb: 'raises', adverb: 'by increasing event-available atmospheric moisture', influence: 0.63
  }),
  dossierRelationship({
    source: 'humidity_amplification', target: 'extreme_precipitation_intensity', relationshipLevel: 'direct',
    direction: 'Higher event-available atmospheric moisture raises potential rainfall totals and intensities when precipitation is triggered.',
    mechanism: 'Moisture amplification supplies more condensable water to organized convection, fronts, and other lifting systems.',
    geographicScope: 'Global physical mechanism with strong regional and storm-regime dependence.',
    temporalScope: 'Hours to days for events; seasonal to multi-decadal for background moisture change.',
    moderators: ['vertical motion', 'storm organization', 'moisture transport', 'local topography'],
    alternatives: ['circulation-driven convergence changes', 'storm-track shifts'],
    confidence: 'high',
    counterevidence: 'Moisture availability alone cannot generate an extreme event without lifting, instability, or organized dynamics.',
    locators: [
      locator(IPCC_HEAVY_PRECIP, 'Section 11.4.3.1 and Executive Summary moisture-scaling assessment'),
      locator(NASA_EXTREMES, 'Heavy Precipitation subsection')
    ], verb: 'supplies moisture for', adverb: 'when lifting and storm organization are present', influence: 0.55
  }),
  dossierRelationship({
    source: 'monsoon_volatility', target: 'extreme_precipitation_intensity', relationshipLevel: 'indirect',
    direction: 'Large monsoon circulation and moisture-transport anomalies can concentrate rainfall into more extreme regional events.',
    mechanism: 'Seasonal wind and moisture-transport departures alter convergence, active-break timing, and the location of intense monsoon rainfall.',
    geographicScope: 'Monsoon regions only; not a global driver of all extreme precipitation.',
    temporalScope: 'Subseasonal to seasonal, with event-scale rainfall expression.',
    moderators: ['ENSO and Indian Ocean variability', 'land-sea thermal contrast', 'orography', 'intraseasonal oscillations'],
    alternatives: ['local convection', 'tropical cyclones', 'atmospheric rivers outside monsoon dynamics'],
    confidence: 'moderate',
    counterevidence: 'Monsoon volatility can also produce rainfall deficits or displaced rainfall; the sign is conditional rather than uniformly positive.',
    locators: [
      locator(IPCC_HEAVY_PRECIP, 'Section 11.4 and Figure 11.13 discussion of global monsoon regions'),
      locator('https://www.nesdis.noaa.gov/about/k-12-education/severe-weather/what-monsoon', 'Why Does a Monsoon Cause Rain? subsection')
    ], verb: 'can concentrate', adverb: 'within volatile monsoon circulation regimes', influence: 0.32
  }),
  dossierRelationship({
    source: 'temp', target: 'tropical_cyclone_rapid_intensification', relationshipLevel: 'indirect',
    direction: 'Ocean and lower-atmosphere warming can make the thermodynamic environment more favorable for rapid intensification, without determining individual events.',
    mechanism: 'Warmer upper-ocean conditions raise potential intensity and air-sea enthalpy fluxes available to an already organized tropical cyclone.',
    geographicScope: 'Tropical-cyclone basins; magnitude and trend vary by basin and coastal environment.',
    temporalScope: 'Hours to days for intensification; multi-decadal for background warming.',
    moderators: ['vertical wind shear', 'inner-core structure', 'dry-air intrusions', 'ocean-mixed-layer depth'],
    alternatives: ['internal storm dynamics', 'regional circulation variability', 'observing-practice changes'],
    confidence: 'moderate',
    counterevidence: 'Warming is not sufficient for rapid intensification, and basin-wide event-frequency signals are less certain than thermodynamic favorability.',
    locators: [
      locator(NOAA_TCHP, 'Introduction: upper-ocean thermal structure and intensification'),
      locator(NOAA_RI_ENVIRONMENT, 'Observed and modeled nearshore environmental factors')
    ], verb: 'raises the odds of', adverb: 'when ocean and atmospheric conditions align', influence: 0.49
  }),
  dossierRelationship({
    source: 'ocean_heat_content', target: 'tropical_cyclone_rapid_intensification', relationshipLevel: 'direct',
    direction: 'Deep upper-ocean heat reduces storm-induced cooling and sustains energy flux during rapid intensification.',
    mechanism: 'High tropical-cyclone heat potential provides a deeper warm reservoir, allowing strong air-sea heat transfer as the cyclone mixes the upper ocean.',
    geographicScope: 'Storm tracks over tropical and subtropical warm-water features.',
    temporalScope: 'Hours to days before and during an intensification episode.',
    moderators: ['storm translation speed', 'mixed-layer depth', 'salinity stratification', 'vertical wind shear'],
    alternatives: ['atmospheric outflow', 'vortex structure', 'environmental humidity'],
    confidence: 'high',
    counterevidence: 'High ocean heat content is a favorable condition rather than a guarantee; hostile shear or poor storm structure can prevent intensification.',
    locators: [
      locator(NOAA_TCHP, 'Introduction and Past Events: Tropical Cyclone Heat Potential'),
      locator('https://repository.library.noaa.gov/view/noaa/64944', 'Abstract: greater ocean heat content in rapidly intensifying events', 'primary_research')
    ], verb: 'fuels', adverb: 'through a deep warm-water reservoir', influence: 0.58
  }),
  dossierRelationship({
    source: 'humidity_amplification', target: 'tropical_cyclone_rapid_intensification', relationshipLevel: 'direct',
    direction: 'A moist storm environment supports organized deep convection and latent-heat release needed for intensification.',
    mechanism: 'Higher environmental and inner-core moisture limits dry-air disruption and supports sustained convective heating around the vortex.',
    geographicScope: 'Tropical-cyclone environments; storm-relative humidity structure matters more than a global mean.',
    temporalScope: 'Hours to days around an intensification episode.',
    moderators: ['vertical wind shear direction and magnitude', 'vortex alignment', 'ocean heat supply'],
    alternatives: ['internal eyewall processes', 'upper-level outflow changes'],
    confidence: 'moderate',
    counterevidence: 'Moisture is not sufficient and can be distributed asymmetrically in ways that inhibit organization.',
    locators: [
      locator(NOAA_RI_ENVIRONMENT, 'Results discussion: humidity, ocean warming, pressure gradient, and wind shear'),
      locator('https://www.aoml.noaa.gov/impact-of-wind-shear-on-tropical-cyclone-intensity/', 'Moisture symmetry and wind-shear direction discussion', 'primary_research_summary')
    ], verb: 'supports', adverb: 'when moisture reaches and remains organized around the inner core', influence: 0.41
  }),
  dossierRelationship({
    source: 'trade_wind_weakening', target: 'el_nino', relationshipLevel: 'direct',
    direction: 'Weak or reversed equatorial Pacific easterly trade-wind anomalies permit warm surface water and convection to shift eastward during El Niño development.',
    mechanism: 'Weaker easterlies reduce eastern-Pacific upwelling and zonal thermocline tilt, reinforcing central and eastern equatorial Pacific warming through coupled feedback.',
    geographicScope: 'Equatorial Pacific, especially the western-to-central Pacific wind field and Niño regions.',
    temporalScope: 'Weeks to seasons during onset and growth.',
    moderators: ['background seasonal cycle', 'westerly wind bursts', 'subsurface heat content', 'event diversity'],
    alternatives: ['stochastic wind forcing', 'remote basin interactions'],
    confidence: 'high',
    counterevidence: 'Wind anomalies are part of a coupled feedback and should not be treated as an external, independently sufficient cause.',
    locators: [
      locator(NOAA_ENSO_RISE, 'Bjerknes feedback and El Niño trade-wind discussion'),
      locator(NASA_ENSO, 'World of Change description of weaker trade winds during El Niño')
    ], verb: 'helps initiate and reinforce', adverb: 'through weakened equatorial Pacific easterlies', influence: 0.57
  }),
  dossierRelationship({
    source: 'ocean_heat_content', target: 'el_nino', relationshipLevel: 'direct',
    direction: 'A positive equatorial Pacific upper-ocean heat-content anomaly preconditions, but does not guarantee, El Niño onset.',
    mechanism: 'Recharge of warm water volume deepens the equatorial thermocline and supplies warm subsurface water that can reach the central and eastern Pacific after wind triggering.',
    geographicScope: 'Upper equatorial Pacific, not global ocean heat content.',
    temporalScope: 'Typically months before and through event onset.',
    moderators: ['westerly wind bursts', 'seasonal predictability barrier', 'thermocline structure'],
    alternatives: ['wind-driven Kelvin waves without sustained coupled feedback'],
    confidence: 'moderate',
    counterevidence: 'Positive warm-water volume alone is not a reliable deterministic predictor; the atmosphere must couple through wind changes.',
    locators: [
      locator(NOAA_ENSO_PREDICTION, 'Upper-150 m heat content and westerly-wind-burst discussion'),
      locator('https://www.climate.gov/news-features/blogs/enso/why-enso-forecasters-shouldn%E2%80%99t-just-take-their-ball-and-go-home-during', 'Warm-water-volume predictive asymmetry discussion')
    ], verb: 'preconditions', adverb: 'when positive equatorial Pacific warm-water volume couples to wind forcing', influence: 0.43
  }),
  dossierRelationship({
    source: 'madden_julian_oscillation', target: 'el_nino', relationshipLevel: 'indirect',
    direction: 'Some MJO events contribute to El Niño onset by organizing equatorial Pacific westerly wind bursts.',
    mechanism: 'The active MJO envelope can produce westerly wind bursts that launch downwelling Kelvin waves and move warm water eastward.',
    geographicScope: 'Western and central equatorial Pacific during favorable MJO phase and background SST conditions.',
    temporalScope: 'Intraseasonal forcing over days to weeks during El Niño onset or development.',
    moderators: ['MJO phase and amplitude', 'background SST anomalies', 'season', 'subsurface heat content'],
    alternatives: ['non-MJO westerly wind bursts', 'stochastic atmospheric forcing'],
    confidence: 'moderate',
    counterevidence: 'The MJO-ENSO relationship is bidirectional and incomplete; many MJO events do not initiate El Niño.',
    locators: [
      locator(NOAA_MJO_EL_NINO, 'Abstract and Plain Language Summary', 'primary_research'),
      locator('https://www.pmel.noaa.gov/pubs/outstand/mcph2029/text.shtml', '1997 MJO westerly wind episodes and El Niño development', 'primary_research')
    ], verb: 'can trigger', adverb: 'through MJO-linked westerly wind bursts', influence: 0.31
  }),
  dossierRelationship({
    source: 'trade_wind_weakening', target: 'la_nina', relationshipLevel: 'direct',
    direction: 'The signed equatorial Pacific trade-wind anomaly supports La Niña when easterlies are stronger, not weaker, than normal.',
    mechanism: 'Stronger easterlies push warm surface water westward, steepen the thermocline, and enhance cold-water upwelling in the eastern equatorial Pacific.',
    geographicScope: 'Equatorial Pacific.',
    temporalScope: 'Weeks to seasons during onset and maintenance.',
    moderators: ['thermocline depth', 'seasonal cycle', 'ocean-atmosphere coupling strength'],
    alternatives: ['easterly wind bursts', 'remote tropical-basin forcing'],
    confidence: 'high',
    counterevidence: 'The legacy source ID contains “weakening”; this edge applies only to the opposite, strengthening side of the signed wind-anomaly indicator.',
    locators: [
      locator(NOAA_ENSO_FAQ, 'La Niña trade winds, upwelling, and Walker circulation explanation'),
      locator(NASA_ENSO, 'World of Change description of stronger trade winds during La Niña')
    ], verb: 'supports', adverb: 'only on the stronger-easterly side of the signed wind anomaly', influence: 0.55
  }),
  dossierRelationship({
    source: 'ocean_heat_content', target: 'la_nina', relationshipLevel: 'direct',
    direction: 'A negative equatorial Pacific warm-water-volume anomaly strongly favors subsequent La Niña cooling.',
    mechanism: 'Discharged equatorial heat and a shallower thermocline allow stronger upwelling of colder subsurface water in the central and eastern Pacific.',
    geographicScope: 'Upper equatorial Pacific, not global ocean heat content.',
    temporalScope: 'Lead time of several months through event onset.',
    moderators: ['trade-wind response', 'season', 'off-equatorial heat transport'],
    alternatives: ['stochastic wind events', 'remote-basin teleconnections'],
    confidence: 'high',
    counterevidence: 'The relationship depends on the sign and location of the anomaly; globally elevated ocean heat content does not itself imply La Niña.',
    locators: [
      locator(NOAA_ENSO_RECHARGE, 'Recharge-oscillator theoretical background', 'primary_research'),
      locator('https://www.climate.gov/news-features/blogs/enso/why-enso-forecasters-shouldn%E2%80%99t-just-take-their-ball-and-go-home-during', 'Negative warm-water-volume anomaly and subsequent La Niña discussion')
    ], verb: 'preconditions', adverb: 'when equatorial Pacific warm-water volume is negative', influence: 0.49
  }),
  dossierRelationship({
    source: 'el_nino', target: 'la_nina', relationshipLevel: 'indirect',
    direction: 'A mature El Niño can discharge equatorial upper-ocean heat and set the stage for a subsequent La Niña, but the transition is not inevitable.',
    mechanism: 'El Niño-related wind stress and poleward heat discharge can leave a shallow thermocline and negative warm-water-volume anomaly favorable for La Niña.',
    geographicScope: 'Equatorial Pacific ENSO cycle.',
    temporalScope: 'Seasonal transition, commonly within the following year.',
    moderators: ['El Niño strength and flavor', 'spring atmospheric noise', 'off-equatorial heat transport'],
    alternatives: ['transition to neutral conditions', 'Atlantic or Indian Ocean influence'],
    confidence: 'moderate',
    counterevidence: 'Not all El Niño events are followed by La Niña, so this is a bounded phase-transition pathway rather than deterministic succession.',
    locators: [
      locator(NOAA_ENSO_TRANSITION, 'Poleward discharge after El Niño and setup for La Niña'),
      locator('https://content-drupal.climate.gov/news-features/blogs/enso/life-and-death-el-ni%C3%B1o', 'Recharge-discharge phases and conditional La Niña transition')
    ], verb: 'can set the stage for', adverb: 'through post-El Niño upper-ocean heat discharge', influence: 0.30
  }),
  dossierRelationship({
    source: 'palm_oil_canopy_clearance', target: 'deforestation', relationshipLevel: 'direct',
    direction: 'Expansion of oil-palm plantations into forested land directly converts forest to agricultural land.',
    mechanism: 'Forest is cleared and permanently converted to plantation land within commodity supply areas.',
    geographicScope: 'Primarily tropical producing regions; strongest documented signal in Southeast Asia with regional variation elsewhere.',
    temporalScope: 'Annual to multi-decadal land-use change.',
    moderators: ['supply-chain safeguards', 'land tenure', 'yield improvements', 'protected-area enforcement'],
    alternatives: ['fire unrelated to plantation expansion', 'logging followed by other land uses'],
    confidence: 'high',
    counterevidence: 'Oil palm is not a dominant driver in every region, and plantation expansion on previously cleared land should not be counted as new deforestation.',
    locators: [
      locator(GFW_PALM, 'PALM Risk Tool methodology and plantation-clearance discussion'),
      locator('https://www.fao.org/haltingdeforestation/about/transforming-agrifood-systems/solutions-tree/shift-5/measures', 'Forest Data Partnership oil-palm mapping example')
    ], verb: 'directly causes', adverb: 'where plantations replace standing forest', influence: 0.68
  }),
  dossierRelationship({
    source: 'industry_farming', target: 'deforestation', relationshipLevel: 'direct',
    direction: 'Agricultural expansion for cropland and livestock is the dominant direct global driver of deforestation.',
    mechanism: 'Forests are permanently converted to cropland or pasture to expand agricultural production.',
    geographicScope: 'Global, with regional differences between cropland, livestock grazing, infrastructure, and other drivers.',
    temporalScope: 'Annual to multi-decadal land-use change.',
    moderators: ['yield change', 'commodity demand', 'land governance', 'supply-chain standards'],
    alternatives: ['urban and infrastructure expansion', 'mining', 'fire followed by non-agricultural use'],
    confidence: 'high',
    counterevidence: 'Agricultural intensification can reduce land-expansion pressure when production growth is decoupled from forest conversion.',
    locators: [
      locator(FAO_DEFORESTATION, 'Global Remote Sensing Survey findings: cropland and livestock conversion shares'),
      locator('https://www.fao.org/sustainable-forest-management/toolbox/modules/reducing-deforestation/in-more-depth/en/?type=111', 'Commercial agriculture drivers list')
    ], verb: 'drives', adverb: 'where cropland or pasture expansion replaces forest', influence: 0.71
  }),
  dossierRelationship({
    source: 'mining_critical_minerals', target: 'deforestation', relationshipLevel: 'direct',
    direction: 'Mining can directly clear forest at extraction sites and indirectly expand forest loss through access roads, settlements, and induced activity.',
    mechanism: 'Mine footprints and associated infrastructure remove forest cover and open previously inaccessible forest to additional land conversion.',
    geographicScope: 'Forest-overlapping mining regions; effects are localized but can extend along infrastructure corridors.',
    temporalScope: 'Project construction through multi-decadal operation and induced development.',
    moderators: ['mine type', 'ore grade', 'governance', 'road access', 'restoration standards'],
    alternatives: ['agriculture and logging enabled by the same access corridor'],
    confidence: 'moderate',
    counterevidence: 'Mining occupies less land globally than agriculture, and well-sited projects outside forests do not create the same pathway.',
    locators: [
      locator(WORLD_BANK_MINING, 'Executive Summary: Mining in Forests and direct/indirect/induced impacts'),
      locator('https://documents1.worldbank.org/curated/en/175211468257358269/pdf/Deforestation-trends-in-the-Congo-Basin-reconciling-economic-growth-and-forest-protection.pdf', 'Impacts on Forests: Current and Future, mining direct and indirect impacts')
    ], verb: 'can cause', adverb: 'through mine footprints and access infrastructure in forested regions', influence: 0.34
  }),
  dossierRelationship({
    source: 'food', target: 'industry_farming', relationshipLevel: 'indirect',
    direction: 'Growth in demand for food, feed, fibre, and animal-source products increases pressure for higher-output and more intensive agricultural production systems.',
    mechanism: 'Demand growth is met partly through yield, stocking, and production-intensity increases when land expansion, imports, or demand reduction do not absorb it.',
    geographicScope: 'Global agrifood systems with strong income, diet, policy, and regional production differences.',
    temporalScope: 'Annual to multi-decadal structural change.',
    moderators: ['diet change', 'waste reduction', 'trade', 'yield technology', 'environmental regulation'],
    alternatives: ['cropland expansion', 'imports', 'agroecological intensification'],
    confidence: 'high',
    counterevidence: 'Demand growth does not uniquely select industrial farming; policy and production systems determine whether intensification is input-heavy, sustainable, or avoided.',
    locators: [
      locator(IPCC_AFOLU, 'Section 7.3.2: demand for food, feed, fuel and fibre and intensification'),
      locator('https://www.fao.org/interactive/2025/how-to-sustainable-agriculture/en/', 'Current status and trends; Figure 1 production growth and intensification')
    ], verb: 'increases pressure for', adverb: 'when additional demand is met through production intensification', influence: 0.46
  }),
  dossierRelationship({
    source: 'feed_crop_dependency', target: 'industry_farming', relationshipLevel: 'direct',
    direction: 'Expansion of compound-feed-dependent livestock production is a major pathway of agricultural intensification.',
    mechanism: 'Commercial livestock systems concentrate production by relying on larger and more standardized flows of maize, soy, protein meal, and other feed crops.',
    geographicScope: 'Commercial livestock and aquaculture systems; strongest where compound-feed systems are expanding.',
    temporalScope: 'Annual to decadal production-system change.',
    moderators: ['feed conversion efficiency', 'diet demand', 'pasture availability', 'livestock species mix'],
    alternatives: ['pasture-based or integrated crop-livestock production'],
    confidence: 'high',
    counterevidence: 'Feed demand and intensification can move in both directions as feed efficiency, herd composition, and management change.',
    locators: [
      locator(IPCC_AFOLU, 'Section 7.2.2 livestock intensification and growing feed-crop share'),
      locator(OECD_FAO_OUTLOOK, 'Global outlook for feed demand and production-system intensification')
    ], verb: 'supports', adverb: 'through compound-feed-dependent livestock intensification', influence: 0.48
  }),
  dossierRelationship({
    source: 'fertilizer_production', target: 'industry_farming', relationshipLevel: 'direct',
    direction: 'Availability and use of synthetic fertilizer is an enabling input for input-intensive crop-yield intensification.',
    mechanism: 'External nutrient inputs raise attainable yields and support repeated high-output cropping where soil nutrients would otherwise constrain production.',
    geographicScope: 'Crop systems using mineral fertilizer; effects vary with soil, crop, management, and nutrient-use efficiency.',
    temporalScope: 'Seasonal application through multi-decadal production-system change.',
    moderators: ['nutrient-use efficiency', 'soil fertility', 'crop genetics', 'fertilizer prices and policy'],
    alternatives: ['biological nitrogen fixation', 'manure and recycled nutrients', 'crop rotation'],
    confidence: 'moderate',
    counterevidence: 'Fertilizer is an input rather than a sufficient cause of industrial farming, and high yields can be pursued through lower-input or agroecological systems.',
    locators: [
      locator(IPCC_AFOLU, 'Section 7.3.2.3 Synthetic Fertiliser Use'),
      locator('https://www.fao.org/4/j0902e/j0902e03.htm', 'Technical definition of agricultural intensification and fertilizer as an input')
    ], verb: 'enables', adverb: 'as a bounded input to high-output crop production', influence: 0.33
  }),
  dossierRelationship({
    source: 'temp', target: 'vector_borne_disease_expansion', relationshipLevel: 'indirect',
    direction: 'Temperature changes can alter vector survival, development, biting rates, pathogen incubation, season length, and geographic suitability.',
    mechanism: 'Temperature affects vector and pathogen biology, shifting transmission suitability within disease-specific thermal limits.',
    geographicScope: 'Disease-, vector-, and region-specific; applies where temperature is limiting and hosts, vectors, and transmission pathways are present.',
    temporalScope: 'Seasonal to multi-decadal.',
    moderators: ['public health capacity', 'vector control', 'housing', 'humidity and rainfall', 'thermal upper limits'],
    alternatives: ['urbanization', 'mobility', 'land-use change', 'surveillance changes'],
    confidence: 'high',
    counterevidence: 'Excess heat can reduce some vectors, and observed incidence cannot be attributed to temperature without accounting for socioeconomic and public-health determinants.',
    locators: [
      locator(IPCC_HEALTH, 'Section 7.3.1.3 Projected Impacts on Vector-Borne Diseases'),
      locator(IPCC_CROSS_SECTOR_RISK, 'Section 16.2.3.7 Vector-Borne Diseases')
    ], verb: 'shifts transmission suitability for', adverb: 'within vector- and disease-specific thermal bounds', influence: 0.52
  }),
  dossierRelationship({
    source: 'flash_flood_regime', target: 'vector_borne_disease_expansion', relationshipLevel: 'indirect',
    direction: 'Flooding and associated water and sanitation disruption can create breeding habitat and increase exposure for some vector-borne diseases.',
    mechanism: 'Standing water, damaged drainage, altered water storage, and service disruption can increase mosquito breeding and human-vector contact.',
    geographicScope: 'Flood-affected settlements and regions with competent vectors; sign varies by timing, vector, and flood severity.',
    temporalScope: 'Weeks to months after an event.',
    moderators: ['drainage', 'water storage behavior', 'vector control', 'flood flushing intensity'],
    alternatives: ['post-disaster reporting changes', 'population displacement', 'concurrent temperature anomalies'],
    confidence: 'moderate',
    counterevidence: 'Severe floods can flush breeding sites, and both drought and excessive rainfall can raise or lower risk depending on vector ecology.',
    locators: [
      locator(IPCC_CROSS_SECTOR_RISK, 'Section 16.2.3.7 examples for rainfall, drought, storms, and flooding'),
      locator(IPCC_HEALTH, 'Section 7.3.1.3 climate and non-climate determinants')
    ], verb: 'can expand', adverb: 'where flood aftermath increases breeding habitat and exposure', influence: 0.37
  }),
  dossierRelationship({
    source: 'urbanization', target: 'vector_borne_disease_expansion', relationshipLevel: 'indirect',
    direction: 'Rapid or poorly serviced urbanization can expand habitat, host density, water-storage practices, and exposure networks favorable to some disease vectors.',
    mechanism: 'Dense populations, artificial containers, drainage gaps, mobility, and uneven vector control can increase vector-human contact and transmission persistence.',
    geographicScope: 'Urban and peri-urban areas; strongest for vectors adapted to human-built environments such as Aedes species.',
    temporalScope: 'Seasonal transmission embedded in multi-year urban growth.',
    moderators: ['housing quality', 'water and sanitation service', 'vector control', 'health surveillance'],
    alternatives: ['climate suitability', 'population mobility', 'land-use change outside cities'],
    confidence: 'high',
    counterevidence: 'Well-serviced urbanization with effective surveillance and vector control can reduce rather than increase transmission risk.',
    locators: [
      locator(IPCC_HEALTH, 'Section 7.3.1.3: urbanisation, population growth, migration, land-use change, and public-health measures'),
      locator(IPCC_CROSS_SECTOR_RISK, 'Section 16.2.3.7 and Table SM16.23 urbanisation and population mobility assessment')
    ], verb: 'can expand', adverb: 'where urban services and vector control do not keep pace', influence: 0.40
  }),
  dossierRelationship({
    source: 'temp', target: 'ocean_carbon_uptake_weakening', relationshipLevel: 'direct',
    direction: 'Ocean warming reduces carbon-dioxide solubility and contributes to physical feedbacks that weaken ocean sink efficiency.',
    mechanism: 'Warming raises surface-ocean pCO2, lowers CO2 solubility, and strengthens stratification, reducing uptake and exchange with the ocean interior.',
    geographicScope: 'Global ocean with strong regional and circulation-dependent variability.',
    temporalScope: 'Interannual to centennial.',
    moderators: ['atmospheric CO2 growth', 'buffering capacity', 'winds', 'circulation', 'biological pump'],
    alternatives: ['decadal circulation variability', 'changes in emissions growth rate'],
    confidence: 'high',
    counterevidence: 'The absolute ocean sink can continue growing while its efficiency or fraction of emissions declines; “weakening” must state the chosen baseline.',
    locators: [
      locator(IPCC_CARBON, 'Section 5.4.4.1 Physical Drivers of Future Ocean Carbon Uptake and Storage'),
      locator(IPCC_OCEAN, 'Section 5.2.2.3 ocean carbon uptake and decadal variability')
    ], verb: 'weakens', adverb: 'through reduced solubility and coupled physical feedbacks', influence: 0.54
  }),
  dossierRelationship({
    source: 'ocean_salinity_stratification', target: 'ocean_carbon_uptake_weakening', relationshipLevel: 'direct',
    direction: 'Stronger density stratification can limit surface-interior exchange and carbon transport.',
    mechanism: 'Freshening-driven density layering inhibits mixed-layer deepening, ventilation, and transfer of absorbed carbon into the ocean interior.',
    geographicScope: 'Regions where salinity changes materially strengthen upper-ocean density stratification.',
    temporalScope: 'Seasonal to multi-decadal.',
    moderators: ['wind stress', 'mixed-layer depth', 'temperature stratification', 'water-mass formation'],
    alternatives: ['circulation and storm-driven mixing changes'],
    confidence: 'moderate',
    counterevidence: 'Regional stratification effects do not map uniformly to the global net sink, and salinity is only one component of density.',
    locators: [
      locator(IPCC_CARBON, 'Section 5.4.4.1 mixed-layer stratification, circulation, and carbon storage'),
      locator(IPCC_OCEAN, 'Section 5.2.2.2 and consequences for anthropogenic carbon uptake')
    ], verb: 'can weaken', adverb: 'by limiting surface-to-interior carbon exchange', influence: 0.42
  }),
  dossierRelationship({
    source: 'thermal_stratification_intensification', target: 'ocean_carbon_uptake_weakening', relationshipLevel: 'direct',
    direction: 'Warming-driven upper-ocean stratification reduces vertical exchange and contributes to lower ocean carbon-sink efficiency.',
    mechanism: 'A more stable warm surface layer restricts mixed-layer depth, ventilation, and the transport of anthropogenic carbon away from the surface.',
    geographicScope: 'Global upper ocean with regional differences in mixing, water-mass formation, and wind forcing.',
    temporalScope: 'Seasonal to centennial.',
    moderators: ['storms and wind stress', 'overturning circulation', 'freshwater flux', 'biological production'],
    alternatives: ['buffering-capacity decline', 'changes in atmospheric CO2 growth'],
    confidence: 'high',
    counterevidence: 'The global sink integrates many regions and processes; local stratification increases do not guarantee a local or immediate net-flux decline.',
    locators: [
      locator(IPCC_CARBON, 'Section 5.4.4.1 and Cross-Chapter Box 5.3'),
      locator(IPCC_OCEAN, 'Section 5.2.2.2: stratification and inhibited exchange with consequences for anthropogenic carbon uptake')
    ], verb: 'weakens', adverb: 'by restricting mixed-layer and interior-ocean exchange', influence: 0.47
  })
]);

export const CASCADE_ANCHOR_METRIC_CONTRACTS = Object.freeze(Object.fromEntries(
  CASCADE_ANCHOR_IDS.map(nodeId => {
    const indicator = INDICATORS[nodeId];
    const common = {
      metric_id: indicator.metric_id,
      metric_name: indicator.metric_name,
      unit: indicator.unit,
      geography: nodeId === 'el_nino' || nodeId === 'la_nina'
        ? 'Niño 3.4 region with coupled tropical-Pacific context'
        : 'bounded region first; aggregate only with reviewed spatial weights',
      cadence: nodeId === 'extreme_precipitation_intensity' || nodeId === 'tropical_cyclone_rapid_intensification'
        ? 'event and monthly snapshot'
        : 'monthly or annual according to source release',
      observation_time_field: 'source-specific observation period',
      source_id: indicator.source_id,
      transformation: `Normalize ${indicator.metric_name.toLowerCase()} against a fixed, source-appropriate baseline; preserve source flags and spatial coverage.`,
      uncertainty: 'Preserve source uncertainty, sampling and model limitations, revisions, and geographic coverage; do not infer missing observations as zero.',
      threshold_provenance: 'No score threshold is approved by this relationship repair. Thresholds require separate scientific and product approval.',
      failure_behavior: 'Retain the last reviewed value, mark it stale, expose the failed source and coverage, and do not update graph scores.'
    };
    return [nodeId, nodeId === 'extreme_precipitation_intensity' ? {
      ...common,
      geography: 'bounded NASA POWER 0.5 x 0.625 degree meteorological grid cell represented by a named point',
      cadence: 'daily source observations with annual complete-year rollup',
      observation_time_field: 'precipitation_observation_date',
      transformation: 'For each declared point, calculate the annual maximum PRECTOTCORR daily value for a complete observation year and compare it with the mean of annual maxima over the fixed 1991-2020 baseline. Report the millimeter and percent anomaly separately, retain the baseline annual-maximum distribution and daily-P95 exceedance count, and do not treat a gridded daily value as sub-daily gauge intensity.',
      uncertainty: 'NASA POWER is gridded and reanalysis-derived. Grid resolution, point assignment, precipitation bias, source replacement, daily aggregation, baseline selection, and local gauge representativeness affect the metric.',
      threshold_provenance: 'The primary anomaly uses the 1991-2020 mean annual maximum; the supporting heavy-precipitation-day count uses the location-specific 95th percentile of baseline daily precipitation. Neither is a universal impact threshold.',
      failure_behavior: 'Withhold a location below 95 percent daily completeness, retain the last validated complete-year record, mark it stale, and never treat missing days as non-events.'
    } : nodeId === 'vector_borne_disease_expansion' ? {
      ...common,
      geography: 'global time series plus latest WHO-region observations, with disease, vector species or parasite retained',
      cadence: 'annual Lancet Countdown release',
      observation_time_field: 'calendar_year',
      transformation: 'Retain dengue climate-defined R0 separately by mosquito species and malaria climate-suitable transmission-season length separately by parasite; preserve geography, year, method and source units and never combine the two measures into a scalar.',
      uncertainty: 'The current workbooks provide modeled point estimates without observation-level intervals. Reanalysis inputs, mechanistic thresholds, population density, omitted humidity or socioeconomic controls, vector control, immunity, health access and revisions affect interpretation.',
      threshold_provenance: 'Use the disease-specific provider method. R0 and suitable months are descriptive climate-suitability outputs, not observed-case, incidence, occupied-range, or universal transmission thresholds.',
      failure_behavior: 'Retain the last validated release and mark stale; reject missing disease or species boundaries and never infer observed infections, incidence, geographic occupation, or climate attribution from modeled suitability alone.'
    } : common];
  })
));

export function hasCompletePromotedDossier(edge) {
  const dossier = edge.evidence?.dossier;
  return Boolean(
    dossier?.promotion_status === 'promoted'
    && ['direct', 'indirect'].includes(edge.evidence?.relationship_level)
    && ['high', 'moderate'].includes(edge.evidence?.confidence)
    && dossier.mechanism
    && dossier.geographic_scope
    && dossier.temporal_scope
    && dossier.moderators?.length
    && dossier.alternative_explanations?.length
    && dossier.counterevidence
    && dossier.indicator?.metric_id
    && dossier.source_locators?.length >= 2
    && dossier.source_locators.every(item => item.url && item.locator && item.source_type)
  );
}
