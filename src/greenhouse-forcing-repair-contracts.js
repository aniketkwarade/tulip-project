const NOAA_AGGI = 'https://gml.noaa.gov/aggi/aggi.html';
const IPCC_ERF = 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/';

export const GREENHOUSE_FORCING_NODE_ID = 'solar_radiation_trapping';
export const GREENHOUSE_FORCING_NODE_SOURCES = Object.freeze([NOAA_AGGI, IPCC_ERF]);
export const GREENHOUSE_FORCING_METRIC_CONTRACTS = Object.freeze({
  [GREENHOUSE_FORCING_NODE_ID]: Object.freeze({
    metric_id: 'long_lived_greenhouse_gas_effective_radiative_forcing',
    metric_name: 'Long-lived greenhouse-gas effective radiative forcing',
    unit: 'watts per square metre relative to a stated preindustrial baseline, with gas contributions and uncertainty retained',
    geography: 'global atmosphere, with the observing network and forcing calculation stated',
    cadence: 'annual concentration update with assessment-method revision tracking',
    observation_time_field: 'forcing_assessment_year',
    source_id: 'noaa_global_monitoring_laboratory',
    transformation: 'Convert quality-controlled global mole fractions to gas-specific forcing using the named assessment equations; retain overlap corrections, baseline, gas coverage, uncertainty, and index normalization.',
    uncertainty: 'Sparse sampling for some gases, calibration scale, atmospheric lifetime, spectral overlap, radiative efficiency, and rapid adjustments affect component and total estimates.',
    threshold_provenance: 'Use NOAA AGGI or an explicitly named IPCC effective-radiative-forcing method; no generic trapping score is permitted.',
    failure_behavior: 'Do not treat emitted mass, local concentration, heat flux, or surface temperature as interchangeable with effective radiative forcing.'
  })
});

const locator = (url, text, source_type = 'authoritative_assessment') => Object.freeze({ url, locator: text, source_type });
function edge({ source, target, verb, adverb, influence, mechanism, scope, time, moderators, alternatives, counterevidence, locators, level = 'direct', type }) {
  const urls = [...new Set(locators.map(item => item.url))];
  return Object.freeze({
    source, target, verb, adverb, influence, topology_rule: 'greenhouse_forcing_rehabilitation',
    evidence: {
      source_status: 'curated_edge_reference', evidence_mode: 'curated_edge_reference', relationship_level: level,
      relationship_type: type, confidence: level === 'direct' ? 'high' : 'moderate', source_urls: urls, relationship_source_urls: urls,
      mechanism, geographic_scope: scope, temporal_scope: time, notes: counterevidence,
      dossier: {
        version: 'greenhouse_forcing_rehabilitation_v1', promotion_status: 'promoted', reviewed_at: '2026-07-17', source, target,
        mechanism, geographic_scope: scope, temporal_scope: time, moderators, alternative_explanations: alternatives,
        confidence: level === 'direct' ? 'high' : 'moderate', counterevidence,
        indicator: GREENHOUSE_FORCING_METRIC_CONTRACTS[GREENHOUSE_FORCING_NODE_ID], source_locators: locators, evidence_basis: level
      }
    }
  });
}

const sharedScope = 'Global atmosphere for a stated annual mean and preindustrial reference; local emissions or station values are not substituted.';
const sharedTime = 'Annual concentration record translated to forcing, with effects persisting according to each gas lifetime.';

export const GREENHOUSE_FORCING_RELATIONSHIPS = Object.freeze([
  edge({ source: 'carbon_emission', target: GREENHOUSE_FORCING_NODE_ID, verb: 'raises', adverb: 'as accumulated atmospheric abundance increases longwave energy retention', influence: 0.82, type: 'radiative_forcing_component', mechanism: 'Rising atmospheric abundance changes the top-of-atmosphere energy balance; the component is calculated from globally averaged mole fraction relative to a declared baseline.', scope: sharedScope, time: sharedTime, moderators: ['ocean and land uptake', 'atmospheric lifetime', 'baseline year', 'spectral overlap', 'measurement network'], alternatives: ['methane forcing', 'nitrous-oxide forcing', 'halogenated-gas forcing', 'aerosol forcing'], counterevidence: 'Annual emissions and atmospheric abundance can diverge because sinks vary, so an emissions total alone does not establish the forcing increment.', locators: [locator(NOAA_AGGI, 'NOAA identifies carbon dioxide as the largest contributor to forcing from the long-lived gases and publishes its annual component.'), locator(IPCC_ERF, 'IPCC assesses a distinct carbon-dioxide effective-radiative-forcing contribution with an uncertainty range.', 'independent_authoritative')] }),
  edge({ source: 'methane', target: GREENHOUSE_FORCING_NODE_ID, verb: 'adds to', adverb: 'through direct absorption and chemically mediated atmospheric adjustments', influence: 0.58, type: 'radiative_forcing_component', mechanism: 'Higher globally averaged abundance increases direct forcing and also affects ozone and stratospheric water vapour; overlap with other absorbers is included in the assessment method.', scope: sharedScope, time: sharedTime, moderators: ['hydroxyl radical availability', 'atmospheric lifetime', 'ozone response', 'stratospheric water vapour', 'spectral overlap'], alternatives: ['carbon-dioxide forcing', 'nitrous-oxide forcing', 'tropospheric ozone from other precursors', 'water-vapour feedback'], counterevidence: 'A local plume or short-lived concentration spike is not equivalent to a global annual forcing change.', locators: [locator(NOAA_AGGI, 'NOAA reports methane as the second-largest forcing contributor among the long-lived gases in its annual index.'), locator(IPCC_ERF, 'IPCC includes direct shortwave effects and atmospheric adjustments in the assessed methane forcing.', 'independent_authoritative')] }),
  edge({ source: 'nitrous_oxide', target: GREENHOUSE_FORCING_NODE_ID, verb: 'increases', adverb: 'as long-lived atmospheric accumulation changes outgoing-radiation absorption', influence: 0.43, type: 'radiative_forcing_component', mechanism: 'Long atmospheric persistence allows globally mixed abundance to rise, producing a separately assessed forcing contribution with carbon-dioxide spectral overlap accounted for.', scope: sharedScope, time: sharedTime, moderators: ['soil and ocean sources', 'stratospheric loss', 'atmospheric lifetime', 'spectral overlap', 'calibration scale'], alternatives: ['carbon-dioxide forcing', 'methane forcing', 'halogenated-gas forcing', 'ozone changes'], counterevidence: 'Sectoral emissions inventories carry different uncertainties and cannot be substituted directly for observed global abundance.', locators: [locator(NOAA_AGGI, 'NOAA calculates a separate annual forcing contribution from globally measured nitrous-oxide abundance.'), locator(IPCC_ERF, 'IPCC assesses the component using updated calculations that include absorption-band overlap.', 'independent_authoritative')] }),
  edge({ source: GREENHOUSE_FORCING_NODE_ID, target: 'temp', verb: 'drives', adverb: 'by creating a sustained positive imbalance in the planetary energy budget', influence: 0.79, type: 'climate_response', mechanism: 'A positive forcing adds energy to the climate system; surface and ocean warming proceed until radiative feedbacks and heat uptake move the system toward a new balance.', scope: 'Global climate response to a stated forcing history; regional temperature change requires circulation and feedback analysis.', time: 'Years to centuries because ocean heat uptake and long gas lifetimes delay full equilibration.', moderators: ['ocean heat uptake', 'climate feedbacks', 'aerosol forcing', 'internal variability', 'forcing pathway'], alternatives: ['solar variability', 'volcanic forcing', 'internal climate variability', 'land-use forcing'], counterevidence: 'Short-period regional temperature variability can oppose the forced global trend, and forcing is not itself a temperature observation.', locators: [locator(IPCC_ERF, 'IPCC defines effective radiative forcing as an energy-budget driver and relates it to temperature response.'), locator(NOAA_AGGI, 'NOAA states that increases in long-lived gases are the main cause of industrial-period global temperature increases.', 'independent_authoritative')] })
]);

export function hasCompleteGreenhouseForcingDossier(item) {
  const d = item?.evidence?.dossier;
  return Boolean(d?.promotion_status === 'promoted' && d?.mechanism && d?.geographic_scope && d?.temporal_scope && d?.moderators?.length && d?.alternative_explanations?.length && d?.counterevidence && d?.indicator?.metric_id && d?.source_locators?.length >= 2 && d?.evidence_basis);
}
