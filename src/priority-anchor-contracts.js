export const PRIORITY_ANCHOR_IDS = Object.freeze([
  'peak_glacier_runoff_passage',
  'marine_pathogen_range_expansion',
  'coastal_permafrost_erosion'
]);

const IPCC_WATER = 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/';
const IPCC_SROCC_GLACIERS = 'https://www.ipcc.ch/srocc/about/faq/final-faq-chapter-2/';
const NOAA_VIBRIO = 'https://www.aoml.noaa.gov/early-warning-waterborne-disease/';
const CDC_VIBRIO = 'https://www.cdc.gov/ncezid/topics-programs/climate-infectious-disease.html';
const NOAA_COASTAL_PERMAFROST = 'https://arctic.noaa.gov/report-card/report-card-2020/coastal-permafrost-erosion/';
const USGS_PERMAFROST = 'https://www.usgs.gov/publications/carbon-release-through-abrupt-permafrost-thaw';

const indicator = (metric_id, metric_name, unit, source_id, endpoint) => ({
  metric_id, metric_name, unit, source_id, endpoint
});

function locator(url, locatorText, sourceType = 'authoritative_assessment') {
  return { url, locator: locatorText, source_type: sourceType };
}

function dossierEdge({ source, target, relationshipLevel, mechanism, geographicScope, temporalScope, moderators, alternatives, counterevidence, locators, role = 'driver', influence = 0.4 }) {
  const sourceUrls = [...new Set(locators.map(item => item.url))];
  return {
    source,
    target,
    verb: role === 'effect' ? 'can propagate into' : 'contributes to',
    adverb: 'within the documented geographic and temporal bounds',
    influence,
    topology_rule: 'priority_anchor_dossier_promotion',
    evidence: {
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: relationshipLevel,
      relationship_type: role === 'effect' ? 'bounded_downstream_effect' : 'bounded_priority_driver',
      confidence: relationshipLevel === 'direct' ? 'high' : 'moderate',
      source_urls: sourceUrls,
      relationship_source_urls: sourceUrls,
      mechanism,
      geographic_scope: geographicScope,
      temporal_scope: temporalScope,
      notes: 'Priority-anchor promotion: this edge is not universal, and is shown only with its documented moderators and alternatives.',
      dossier: {
        version: 'priority_anchor_edge_dossier_v1',
        promotion_status: 'promoted',
        reviewed_at: '2026-07-17',
        source,
        target,
        mechanism,
        geographic_scope: geographicScope,
        temporal_scope: temporalScope,
        moderators,
        alternative_explanations: alternatives,
        confidence: relationshipLevel === 'direct' ? 'high' : 'moderate',
        counterevidence,
        indicator: PRIORITY_ANCHOR_METRIC_CONTRACTS[PRIORITY_ANCHOR_IDS.includes(target) ? target : source],
        source_locators: locators,
        evidence_basis: relationshipLevel
      }
    }
  };
}

export const PRIORITY_ANCHOR_METRIC_CONTRACTS = Object.freeze({
  peak_glacier_runoff_passage: {
    metric_id: 'glacier_runoff_peak_timing_and_volume', metric_name: 'Glacier-basin annual runoff peak timing and post-peak discharge trend',
    unit: 'water year, cubic meters per second, and percent departure from basin baseline', geography: 'named glacier-fed basin', cadence: 'annual reviewed update', observation_time_field: 'water_year',
    source_id: 'ipcc_ar6_wg2_chapter_4_water', transformation: 'Classify a basin only after comparable long-term glacier, snow, precipitation, and discharge records distinguish temporary meltwater increase from a post-peak decline.',
    uncertainty: 'Peak timing differs by glacier size, elevation, precipitation regime, groundwater storage, and monitoring coverage.', threshold_provenance: 'No global date threshold; basin-specific attribution and uncertainty bounds are required.',
    failure_behavior: 'Retain the last reviewed basin status and mark evidence stale; never infer a passage from global temperature alone.'
  },
  marine_pathogen_range_expansion: {
    metric_id: 'coastal_vibrio_environmental_suitability_and_cases', metric_name: 'Coastal Vibrio environmental suitability, season length, and reported cases',
    unit: 'suitable coastal area, suitable days, and surveillance cases', geography: 'bounded estuary, coast, or public-health jurisdiction', cadence: 'seasonal', observation_time_field: 'observation_date',
    source_id: 'noaa_aoml_environmental_suitability_of_vibrio_infections_in_a_warming_climate', transformation: 'Combine quality-controlled sea-surface temperature and salinity suitability with jurisdictional case surveillance; keep exposure, reporting, and shellfish-harvest changes separate.',
    uncertainty: 'Suitability is not disease incidence; surveillance intensity, exposure behavior, species, and salinity can dominate local outcomes.', threshold_provenance: 'Species- and geography-specific suitability models and surveillance baselines only.',
    failure_behavior: 'Publish no range claim when either environmental coverage or case-surveillance provenance is missing.'
  },
  coastal_permafrost_erosion: {
    metric_id: 'arctic_permafrost_coastline_retreat_rate', metric_name: 'Ice-rich Arctic coastline retreat and bluff-failure rate',
    unit: 'meters per year and mapped retreating shoreline length', geography: 'mapped Arctic permafrost coastline', cadence: 'annual to multi-year survey', observation_time_field: 'survey_year',
    source_id: 'noaa_arctic_report_card', transformation: 'Estimate comparable shoreline change from repeat imagery or surveys, paired with ground-ice/permafrost condition and open-water/wave exposure.',
    uncertainty: 'Retreat is episodic and highly site-specific; image resolution, tide stage, storms, and local geology alter measured rates.', threshold_provenance: 'Site-specific baseline and shoreline-change method required; no pan-Arctic score from a single coast.',
    failure_behavior: 'Keep the prior reviewed rate and identify coverage gaps instead of extrapolating unsurveyed coastline.'
  }
});

export const PRIORITY_ANCHOR_RELATIONSHIPS = Object.freeze([
  dossierEdge({ source: 'temp', target: 'peak_glacier_runoff_passage', relationshipLevel: 'direct', influence: .59,
    mechanism: 'Warming initially raises glacier meltwater production but continued ice loss reduces glacier area, so many glacier-fed basins ultimately pass a runoff maximum and enter declining long-term meltwater contribution.',
    geographicScope: 'Glacier-fed mountain basins; timing differs strongly by glacier size, elevation, and precipitation regime.', temporalScope: 'Decadal transition expressed in seasonal and annual discharge.', moderators: ['glacier size and hypsometry', 'snowfall and rainfall regime', 'groundwater and reservoir storage'], alternatives: ['short-term precipitation anomalies', 'changes in discharge measurement coverage'], counterevidence: 'Some cold, high-elevation, or precipitation-increasing basins may not yet be near peak water; warming does not identify a basin-specific passage by itself.',
    locators: [locator(IPCC_SROCC_GLACIERS, 'FAQ Chapter 2: glacier runoff first increases then declines after peak water'), locator(IPCC_WATER, 'Chapter 4: mountain water and glacier-runoff risks', 'independent_assessment')] }),
  dossierEdge({ source: 'snowmelt_timing_shift', target: 'peak_glacier_runoff_passage', relationshipLevel: 'indirect', influence: .42,
    mechanism: 'Earlier snowmelt changes the seasonal timing and apparent composition of mountain runoff, helping expose when former glacier-melt buffering no longer sustains late-season flow.',
    geographicScope: 'Seasonally snow-covered glacier-fed basins with downstream reliance on warm-season flow.', temporalScope: 'Seasonal timing shifts accumulated over decades.', moderators: ['snowpack depth', 'rain-on-snow events', 'reservoir operations', 'groundwater storage'], alternatives: ['seasonal rainfall changes', 'water withdrawals and reservoir releases'], counterevidence: 'Earlier snowmelt alone does not prove passage of glacier peak water and may temporarily increase early-season discharge.',
    locators: [locator(IPCC_WATER, 'Chapter 4: changing snow, glacier, and runoff seasonality in mountain water systems'), locator(IPCC_SROCC_GLACIERS, 'FAQ Chapter 2: changing cryosphere contribution to downstream water', 'independent_assessment')] }),
  dossierEdge({ source: 'snow_drought', target: 'peak_glacier_runoff_passage', relationshipLevel: 'indirect', influence: .38,
    mechanism: 'Reduced snow accumulation decreases seasonal storage and can make basins more dependent on a shrinking glacier contribution, increasing post-peak late-season supply risk.',
    geographicScope: 'Snow-dominated glacier-fed basins; not applicable where rainfall or groundwater controls most runoff.', temporalScope: 'Seasonal deficits with multi-year hydrologic consequences.', moderators: ['storm-track variability', 'elevation-dependent snowfall', 'groundwater buffering'], alternatives: ['demand growth', 'reservoir release rules', 'measurement gaps'], counterevidence: 'A single snow-poor year is insufficient to classify glacier-runoff passage; long records must separate snow variability from glacier mass-loss trends.',
    locators: [locator(IPCC_WATER, 'Chapter 4: snowpack decline and downstream water availability'), locator(IPCC_SROCC_GLACIERS, 'FAQ Chapter 2: mountain snow and glacier contributions to runoff', 'independent_assessment')] }),
  dossierEdge({ source: 'peak_glacier_runoff_passage', target: 'glacier_meltwater_dependency', relationshipLevel: 'direct', role: 'effect', influence: .51,
    mechanism: 'After a basin passes peak glacier runoff, a formerly reliable meltwater contribution can decline during the dry season, increasing the exposure of downstream users and systems that rely on it.',
    geographicScope: 'Downstream users of glacier-fed river systems, especially seasonally dry basins.', temporalScope: 'Multi-decadal hydrologic transition and seasonal water-supply effects.', moderators: ['storage and transfer infrastructure', 'water demand', 'alternative supplies'], alternatives: ['new withdrawals', 'allocation changes', 'drought unrelated to glacier change'], counterevidence: 'Dependence is mediated by governance and infrastructure; declining glacier runoff need not cause a supply crisis where substitution or storage is sufficient.',
    locators: [locator(IPCC_WATER, 'Chapter 4: glacier retreat and water-supply exposure'), locator(IPCC_SROCC_GLACIERS, 'FAQ Chapter 2: implications of declining glacier runoff', 'independent_assessment')] }),
  dossierEdge({ source: 'marine_heatwaves', target: 'marine_pathogen_range_expansion', relationshipLevel: 'direct', influence: .56,
    mechanism: 'Marine heatwaves can raise coastal water temperatures into favorable growth conditions for warm-water pathogens, extending seasonal suitability where salinity and exposure conditions also permit.',
    geographicScope: 'Estuarine and coastal waters; especially Vibrio-relevant warm, low-to-moderate-salinity habitats.', temporalScope: 'Days to seasons, with longer-term range shifts assessed over years.', moderators: ['salinity', 'species', 'human exposure', 'coastal circulation'], alternatives: ['surveillance expansion', 'shellfish distribution and harvest changes'], counterevidence: 'Heat alone is not sufficient: unsuitable salinity, host absence, or limited exposure can prevent disease or range expansion.',
    locators: [locator(NOAA_VIBRIO, 'AOML early-warning summary: SST and salinity influence Vibrio presence and warming expands suitability'), locator(CDC_VIBRIO, 'Vibriosis and Coastal Waters: warmer months and rising temperatures extend season and waterways', 'independent_public_health')] }),
  dossierEdge({ source: 'temp', target: 'marine_pathogen_range_expansion', relationshipLevel: 'indirect', influence: .43,
    mechanism: 'Atmospheric warming raises coastal water temperature, altering the environmental envelope for temperature-sensitive marine pathogens such as Vibrio.',
    geographicScope: 'Coastal and estuarine waters; no claim for pathogens without demonstrated temperature sensitivity.', temporalScope: 'Seasonal warming and multi-decadal range or season changes.', moderators: ['sea-surface temperature response', 'salinity', 'species ecology', 'exposure patterns'], alternatives: ['improved diagnostics', 'reporting changes'], counterevidence: 'Global temperature is a distal driver and cannot substitute for local water-temperature and salinity observations.',
    locators: [locator(CDC_VIBRIO, 'Climate and Infectious Diseases: rising temperatures prolong Vibrio season and enable expansion'), locator(NOAA_VIBRIO, 'AOML early-warning summary: coastal SST and salinity determine environmental suitability', 'independent_public_health')] }),
  dossierEdge({ source: 'coastal_inundation_risk', target: 'marine_pathogen_range_expansion', relationshipLevel: 'indirect', influence: .35,
    mechanism: 'Sea-level-driven salinity changes can alter estuarine habitat suitability for pathogens with bounded salinity optima, changing exposure risk in particular estuaries.',
    geographicScope: 'Estuaries with documented salinity shifts and pathogen-specific suitability evidence; not a general coastal rule.', temporalScope: 'Seasonal salinity variation and long-term sea-level influence.', moderators: ['species-specific salinity optimum', 'freshwater inflow', 'tidal mixing', 'storm flooding'], alternatives: ['water-temperature change', 'land-use pollution', 'sampling locations'], counterevidence: 'Salinity shifts can reduce as well as increase suitability; this edge must not be read as directionally universal.',
    locators: [locator(NOAA_VIBRIO, 'AOML early-warning summary: SST and salinity are key factors for Vibrio presence'), locator('https://repository.library.noaa.gov/view/noaa/27714', 'NOAA record: V. vulnificus range depends on temperature and salinity; sea-level salinity gradients affect exposure risk', 'peer_reviewed_primary')] }),
  dossierEdge({ source: 'marine_pathogen_range_expansion', target: 'public_health_heat_burden', relationshipLevel: 'indirect', role: 'effect', influence: .3,
    mechanism: 'Expansion of environmentally suitable marine-pathogen range or season can raise coastal illness exposure through seafood consumption and wound contact, adding demand to public-health response systems.',
    geographicScope: 'Coastal populations with exposure to raw shellfish or seawater and functioning case surveillance.', temporalScope: 'Seasonal exposure with multi-year shifts in suitable season and geography.', moderators: ['seafood handling', 'public warnings', 'healthcare access', 'case detection'], alternatives: ['food-safety failures', 'recreational exposure changes'], counterevidence: 'Environmental suitability is not equivalent to recorded illness; prevention and exposure behavior can substantially change outcomes.',
    locators: [locator(CDC_VIBRIO, 'Vibriosis and Coastal Waters: pathways from warmer waters to illness and public-health response'), locator(NOAA_VIBRIO, 'AOML early-warning summary: projected relative infection risk and early-warning use', 'independent_public_health')] }),
  dossierEdge({ source: 'permafrost_thaw', target: 'coastal_permafrost_erosion', relationshipLevel: 'direct', influence: .6,
    mechanism: 'Thaw of ice-rich coastal permafrost reduces bluff strength and exposes sediment and ground ice to thermal and mechanical erosion.',
    geographicScope: 'Ice-rich Arctic permafrost coasts; rates differ substantially by ground-ice content and geology.', temporalScope: 'Seasonal thaw and storm events accumulated over years to decades.', moderators: ['ground-ice content', 'bluff geometry', 'vegetation', 'sediment type'], alternatives: ['tectonic or local sediment processes', 'shoreline mapping differences'], counterevidence: 'Not every permafrost coast erodes rapidly; low ground ice, protective beaches, or different geology can limit retreat.',
    locators: [locator(NOAA_COASTAL_PERMAFROST, 'NOAA Arctic Report Card: warming permafrost weakens coastal bluffs and accelerates erosion'), locator(USGS_PERMAFROST, 'USGS permafrost science: thaw alters ground stability and infrastructure exposure', 'independent_authoritative')] }),
  dossierEdge({ source: 'sea_ice_season_loss', target: 'coastal_permafrost_erosion', relationshipLevel: 'direct', influence: .55,
    mechanism: 'A longer open-water season increases fetch and the duration of wave attack on vulnerable Arctic coastlines, amplifying thermal and mechanical erosion of thawing bluffs.',
    geographicScope: 'Arctic shorelines where seasonal sea ice formerly limited open-water wave exposure.', temporalScope: 'Seasonal open-water duration and episodic storm-wave events.', moderators: ['fetch', 'storm tracks', 'nearshore bathymetry', 'protective beach or landfast ice'], alternatives: ['local storm anomalies', 'shoreline engineering'], counterevidence: 'Open water does not determine retreat alone; wave energy and local coastal morphology control whether erosion accelerates.',
    locators: [locator(NOAA_COASTAL_PERMAFROST, 'NOAA Arctic Report Card: sea-ice loss, open water, waves, and coastal erosion interaction'), locator('https://arctic.noaa.gov/report-card/report-card-2024/', 'NOAA Arctic Report Card: Arctic sea-ice loss and increasing coastal exposure context', 'independent_authoritative')] }),
  dossierEdge({ source: 'temp', target: 'coastal_permafrost_erosion', relationshipLevel: 'indirect', influence: .44,
    mechanism: 'Warmer air and sea temperatures promote ground thaw and thermal abrasion, increasing susceptibility to wave-driven erosion where ice-rich shorelines are exposed.',
    geographicScope: 'Arctic permafrost coasts; local ocean and ground temperatures, not the global average alone, govern site response.', temporalScope: 'Seasonal to decadal warming with event-driven retreat.', moderators: ['permafrost temperature', 'sea-ice cover', 'storm waves', 'ground-ice content'], alternatives: ['coastal engineering', 'changing sediment supply'], counterevidence: 'Temperature is a distal conditioning driver and cannot predict site-level retreat without shoreline and wave observations.',
    locators: [locator(NOAA_COASTAL_PERMAFROST, 'NOAA Arctic Report Card: warmer air and sea temperatures interact with thaw and wave erosion'), locator(USGS_PERMAFROST, 'USGS permafrost science: warming and ground-ice thaw susceptibility', 'independent_authoritative')] }),
  dossierEdge({ source: 'coastal_permafrost_erosion', target: 'polar_infrastructure_failure', relationshipLevel: 'direct', role: 'effect', influence: .47,
    mechanism: 'Rapid shoreline retreat and bluff failure can undermine roads, buildings, utilities, and access infrastructure located on or near unstable Arctic coasts.',
    geographicScope: 'Settlements and facilities on eroding Arctic permafrost coasts.', temporalScope: 'Episodic storm damage and cumulative multi-year shoreline retreat.', moderators: ['setback distance', 'relocation capacity', 'shore protection', 'asset condition'], alternatives: ['river flooding', 'foundation thaw away from the coast', 'maintenance failure'], counterevidence: 'Exposure is avoidable where assets are set back, relocated, or adequately protected; erosion does not automatically cause infrastructure failure.',
    locators: [locator(NOAA_COASTAL_PERMAFROST, 'NOAA Arctic Report Card: erosion threatens infrastructure and communities'), locator(USGS_PERMAFROST, 'USGS permafrost science: thaw-ground hazards for infrastructure', 'independent_authoritative')] })
]);

export function hasCompletePriorityAnchorDossier(edge) {
  const dossier = edge.evidence?.dossier;
  return Boolean(dossier?.promotion_status === 'promoted' && dossier.mechanism && dossier.geographic_scope && dossier.temporal_scope && dossier.moderators?.length && dossier.alternative_explanations?.length && dossier.counterevidence && dossier.indicator?.metric_id && dossier.source_locators?.length >= 2);
}
