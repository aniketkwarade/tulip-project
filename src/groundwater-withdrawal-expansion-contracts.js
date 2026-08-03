const USGS_DEPLETION = 'https://www.usgs.gov/water-science-school/science/groundwater-decline-and-depletion';
const USGS_WITHDRAWALS = 'https://www.usgs.gov/publications/estimated-groundwater-withdrawals-principal-aquifers-united-states-2015';
const USGS_IRRIGATION = 'https://www.usgs.gov/publications/aquifer-depletion-and-potential-impacts-long-term-irrigated-agricultural-productivity';

const root = (id, name, description, sources) => ({
  id, name, description, sphere: 'freshwater', authored_node_class: 'authored_root_driver',
  baseValue: 44, value: 44,
  vector: { climate_forcing: .08, ecological_damage: .66, human_drivenness: .94, societal_fallout: .78 },
  source_urls: sources,
  calibration: { role: 'root_driver', source_urls: sources, notes: 'Reviewed withdrawal category. It is only measured within a named aquifer, sector, and reporting period.' },
  adjectives: [{ min: 0, max: 25, label: 'Limited' }, { min: 25, max: 50, label: 'Growing' }, { min: 50, max: 75, label: 'High' }, { min: 75, max: 100, label: 'Overdrawing' }]
});

export const GROUNDWATER_WITHDRAWAL_NODES = Object.freeze([
  root('agricultural_groundwater_withdrawal', 'Agricultural Groundwater Withdrawal', 'Groundwater withdrawn for irrigation in a named aquifer and reporting period; it is not a proxy for all agriculture.', [USGS_IRRIGATION, USGS_WITHDRAWALS]),
  root('municipal_groundwater_withdrawal', 'Municipal Groundwater Withdrawal', 'Public-supply groundwater withdrawal within a named aquifer and reporting period; it is not a proxy for all urban water demand.', [USGS_DEPLETION, USGS_WITHDRAWALS]),
  root('industrial_groundwater_withdrawal', 'Industrial Groundwater Withdrawal', 'Industrial, mining, thermoelectric, or other reported non-agricultural groundwater withdrawal within a named aquifer and reporting period.', [USGS_DEPLETION, USGS_WITHDRAWALS])
]);

export const GROUNDWATER_WITHDRAWAL_NODE_IDS = Object.freeze(GROUNDWATER_WITHDRAWAL_NODES.map(node => node.id));
export const GROUNDWATER_WITHDRAWAL_METRIC_CONTRACTS = Object.freeze(Object.fromEntries(GROUNDWATER_WITHDRAWAL_NODE_IDS.map(id => [id, {
  metric_id: `${id}_aquifer_balance`,
  metric_name: `${id.replaceAll('_', ' ')} aquifer-balance observation`,
  unit: 'volume per time, water-level departure, sector share, or dependence share with stated denominator',
  geography: id === 'industrial_groundwater_withdrawal' ? 'named aquifer, well network, and reporting jurisdiction' : 'global assessment or named aquifer with geography and aggregation retained',
  cadence: id === 'industrial_groundwater_withdrawal' ? 'annual withdrawal inventory or station reporting cycle' : 'major UNESCO or FAO assessment cycle, or annual aquifer inventory',
  observation_time_field: 'reporting_year_or_observation_time',
  source_id: id === 'industrial_groundwater_withdrawal' ? 'usgs_water_data_ogc_api' : 'unesco_fao_global_groundwater_irrigation_impact',
  transformation: 'Retain sector, geography, aggregation, withdrawal or dependence denominator, reporting period, and whether values are measured or estimated; never allocate an aggregate depletion estimate to a sector.',
  uncertainty: 'Sector reporting, aquifer boundaries, metering, return flows, recharge estimates, global aggregation, and dependence denominators vary; withdrawal or dependence alone does not prove depletion or shortage.',
  threshold_provenance: 'Aquifer-specific groundwater-budget and water-level baseline.',
  failure_behavior: 'Do not infer overdraft from a missing inventory, aggregate unlike aquifers into a single balance, allocate aggregate depletion to a sector, or treat dependence as realized shortage.'
}])));

// This preserves the existing groundwater-depletion ingestion binding rather
// than replacing its station-level metric contract with a sector inventory.
const GROUNDWATER_DEPLETION_INDICATOR = Object.freeze({
  metric_id: 'usgs_groundwater_level_observation',
  metric_name: 'Groundwater-level departure from station baseline',
  unit: 'feet or meters from station datum',
  geography: 'USGS well and aquifer',
  cadence: 'weekly',
  source_id: 'usgs_water_data_ogc_api'
});

const loc = (url, locator, source_type = 'authoritative_assessment') => ({ url, locator, source_type });
function edge(source, mechanism, scope, moderators, alternatives, counterevidence, locators) {
  const urls = [...new Set(locators.map(item => item.url))];
  return {
    source, target: 'groundwater_depletion', verb: 'can deepen', adverb: 'when withdrawals persist above replenishment', influence: .53,
    topology_rule: 'groundwater_withdrawal_dossier_promotion',
    evidence: {
      source_status: 'curated_edge_reference', evidence_mode: 'curated_edge_reference', relationship_level: 'direct', relationship_type: 'bounded_withdrawal_driver', confidence: 'high', source_urls: urls, relationship_source_urls: urls,
      mechanism, geographic_scope: scope, temporal_scope: 'Annual inventory to multi-year aquifer response; do not infer immediate depletion from one reporting period.',
      notes: 'The edge represents a groundwater-budget condition, not a claim that every reported withdrawal causes depletion.',
      dossier: { version: 'groundwater_withdrawal_edge_dossier_v1', promotion_status: 'promoted', reviewed_at: '2026-07-17', source, target: 'groundwater_depletion', mechanism, geographic_scope: scope, temporal_scope: 'Annual inventory to multi-year aquifer response.', moderators, alternative_explanations: alternatives, confidence: 'high', counterevidence, indicator: GROUNDWATER_DEPLETION_INDICATOR, source_locators: locators, evidence_basis: 'direct' }
    }
  };
}

export const GROUNDWATER_WITHDRAWAL_RELATIONSHIPS = Object.freeze([
  edge('agricultural_groundwater_withdrawal', 'Irrigation withdrawals remove groundwater from storage; in irrigated regions, sustained use above natural replenishment can lower water levels and deplete the aquifer.', 'Irrigated aquifers with documented agricultural withdrawal, recharge, and water-level context.', ['crop water demand', 'irrigation efficiency', 'return flow', 'recharge'], ['surface-water substitution', 'managed aquifer recharge', 'wet-period replenishment'], 'Agricultural withdrawal does not necessarily deplete an aquifer where recharge, return flow, or managed replenishment balances use.', [loc(USGS_IRRIGATION, 'USGS: irrigation withdrawals can exceed natural replenishment in important agricultural aquifers'), loc(USGS_DEPLETION, 'USGS: sustained pumping faster than recharge lowers groundwater storage', 'independent_authoritative')]),
  edge('municipal_groundwater_withdrawal', 'Sustained public-supply pumping can lower groundwater levels when extraction exceeds recharge and alternative sources do not offset demand.', 'Public-supply well fields and aquifers with documented withdrawal, recharge, and water-level data.', ['population demand', 'well-field distribution', 'surface-water substitution', 'recharge'], ['conjunctive use', 'demand management', 'managed recharge'], 'Municipal withdrawal alone is not evidence of depletion; the balance with recharge and other supply sources is decisive.', [loc(USGS_DEPLETION, 'USGS: long-term water-level decline is caused by sustained groundwater pumping'), loc(USGS_WITHDRAWALS, 'USGS: public supply is a reported groundwater-withdrawal sector', 'independent_authoritative')]),
  edge('industrial_groundwater_withdrawal', 'Reported industrial, mining, thermoelectric, or other non-agricultural extraction can lower groundwater storage when sustained withdrawals exceed replenishment in the affected aquifer.', 'Named aquifer and documented industrial or energy-sector withdrawal category.', ['withdrawal volume', 'sector return flow', 'aquifer transmissivity', 'recharge'], ['recycled process water', 'surface-water supply', 'managed recharge'], 'A sector withdrawal category does not establish aquifer depletion without a groundwater-budget or water-level trend for that aquifer.', [loc(USGS_WITHDRAWALS, 'USGS: industrial, mining, thermoelectric, and other sectors are reported groundwater withdrawals'), loc(USGS_DEPLETION, 'USGS: pumping faster than recharge can reduce groundwater storage', 'independent_authoritative')])
]);

export function hasCompleteGroundwaterWithdrawalDossier(item) {
  const dossier = item.evidence?.dossier;
  return Boolean(dossier?.promotion_status === 'promoted' && dossier.moderators?.length && dossier.alternative_explanations?.length && dossier.counterevidence && dossier.indicator?.metric_id && dossier.source_locators?.length >= 2);
}
