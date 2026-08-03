const EPA_FRACKING = 'https://www.epa.gov/hfstudy/questions-and-answers-about-epas-hydraulic-fracturing-drinking-water-assessment';
const EPA_WASTEWATER = 'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100UH0K.TXT';
const NOAA_PYROCB = 'https://csl.noaa.gov/news/2023/370_0223.html';
const NOAA_PYROCB_PAPER = 'https://repository.library.noaa.gov/view/noaa/53621/noaa_53621_DS1.pdf';
const NOAA_ENSO = 'https://www.climate.gov/news-features/understanding-climate/el-nino-and-la-nina-frequently-asked-questions';
const NOAA_CURRENTS = 'https://oceanservice.noaa.gov/education/tutorial_currents/04currents2.html';

function edge({ source, target, urls, mechanism, verb = 'contributes to', level = 'indirect', influence = 0.44, relationshipType = 'bounded_cross_system_pathway' }) {
  const dossier = {
    promotion_status: 'promoted', source, target, mechanism,
    geographic_scope: 'Limited to the documented affected system and exposure footprint.',
    temporal_scope: 'Limited to the observed release, event, or assessed response interval.',
    moderators: ['release magnitude or anomaly strength', 'local transport and exposure', 'baseline system condition', 'response and recovery capacity'],
    alternative_explanations: ['other pollution sources', 'natural variability', 'co-occurring disturbances', 'measurement uncertainty'],
    confidence: level === 'direct' ? 'high' : 'medium',
    counterevidence: 'The cited mechanism does not imply a uniform response outside the measured footprint or interval.',
    indicator: {
      metric_id: `backlog_batch_three_${source}_${target}`,
      metric_name: 'Bounded relationship observation', unit: 'source-defined measurement',
      geography: 'named site, basin, atmospheric layer, or infrastructure system',
      cadence: 'event-based or source update', source_id: 'authoritative_relationship_source',
      transformation: 'Preserve sign, geography, interval, and source uncertainty.',
      uncertainty: 'Event attribution, transport, exposure, and recovery vary.',
      threshold_provenance: 'Use the cited source definition; no universal threshold.',
      failure_behavior: 'Keep research-track if the bounded observation is unavailable.'
    },
    source_locators: urls.map((url, index) => ({ url, locator: index ? 'Independent mechanism corroboration.' : 'Primary authoritative mechanism statement.', source_type: index ? 'independent_authoritative' : 'authoritative_mechanism' })),
    evidence_basis: level
  };
  return { source, target, verb, adverb: 'within the stated evidence boundary', influence, topology_rule: 'cross_system_backlog_rehabilitation_batch_three', evidence: { source_status: 'curated_edge_reference', evidence_mode: 'curated_edge_reference', relationship_level: level, relationship_type: relationshipType, confidence: dossier.confidence, source_urls: urls, relationship_source_urls: urls, mechanism, geographic_scope: dossier.geographic_scope, temporal_scope: dossier.temporal_scope, notes: 'Third cross-system backlog rehabilitation batch.', dossier } };
}

export const CROSS_SYSTEM_BACKLOG_BATCH_THREE_RELATIONSHIPS = Object.freeze([
  edge({ source: 'fracking_wastewater_lakes', target: 'water_stress', urls: [EPA_FRACKING, EPA_WASTEWATER], mechanism: 'Withdrawals and contamination from poorly managed produced water can reduce usable freshwater availability, especially where groundwater or surface-water supplies are already limited.' }),
  edge({ source: 'fracking_wastewater_lakes', target: 'freshwater_ecosystem_collapse', urls: [EPA_WASTEWATER, EPA_FRACKING], mechanism: 'Spills, unlined storage, or inadequately treated discharges can deliver salts, metals, hydrocarbons, and other constituents to streams or groundwater, stressing aquatic systems within the release footprint.' }),
  edge({ source: 'fracking_wastewater_lakes', target: 'biodiversity_intactness_loss', urls: [EPA_WASTEWATER, EPA_FRACKING], mechanism: 'Toxic or saline releases can injure aquatic organisms and degrade habitat where wastewater reaches surface waters; effects depend on composition, dose, transport, and recovery.' }),
  edge({ source: 'pyrocumulonimbus_smoke_injection', target: 'aerosol_cooling_loss', urls: [NOAA_PYROCB, NOAA_PYROCB_PAPER], verb: 'temporarily offsets', level: 'direct', influence: -0.31, relationshipType: 'signed_atmospheric_forcing', mechanism: 'Deep convective fire clouds can add persistent black-carbon and organic aerosol to the lower stratosphere, temporarily increasing aerosol loading rather than allowing the background cooling contribution to disappear.' }),
  edge({ source: 'pyrocumulonimbus_smoke_injection', target: 'temp', urls: [NOAA_PYROCB, NOAA_PYROCB_PAPER], verb: 'can temporarily suppress', influence: -0.22, relationshipType: 'signed_atmospheric_forcing', mechanism: 'Some observed stratospheric smoke episodes produced a net short-lived cooling influence, but composition, altitude, lifetime, clouds, and surface albedo determine the sign and magnitude.' }),
  edge({ source: 'trade_wind_weakening', target: 'ocean_current_regime_shift', urls: [NOAA_ENSO, NOAA_CURRENTS], level: 'direct', verb: 'reorganizes', mechanism: 'Signed changes in equatorial easterlies alter westward surface transport, thermocline slope, and cold-water upwelling across the tropical Pacific.' })
]);
