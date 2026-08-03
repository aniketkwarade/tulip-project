const FCC_ORDER = 'https://docs.fcc.gov/public/attachments/FCC-26-42A1.pdf';
const CISA_COMMUNICATIONS = 'https://www.cisa.gov/topics/critical-infrastructure-security-and-resilience/resilience-services/infrastructure-dependency-primer/learn/communications';
const SOURCE_URLS = Object.freeze([FCC_ORDER, CISA_COMMUNICATIONS]);

export const SUBSEA_CABLE_NODE_ID = 'subsea_cables';

export const SUBSEA_CABLE_METRIC_CONTRACTS = Object.freeze({
  subsea_cables: {
    metric_id: 'subsea_cable_system_capacity_and_status',
    metric_name: 'Subsea cable system capacity and operational status',
    unit: 'named cable systems, landing points, operational status, and documented design or lit capacity in terabits per second',
    geography: 'named international cable system, landing jurisdiction, and connected terrestrial network',
    cadence: 'on licensing, topology, capacity, or operational-status update',
    observation_time_field: 'filing_or_status_date',
    source_id: 'fcc_submarine_cable_landing_licensing_records',
    transformation: 'Retain system name, owners and operators, landing points, terrestrial handoff, capacity definition, and status; do not sum design and lit capacity.',
    uncertainty: 'Public filings may lag operational changes, omit commercially sensitive utilization, or report design capacity rather than traffic carried.',
    threshold_provenance: 'Use only capacity, topology, status, and incident definitions stated in FCC filings or authoritative operator records.',
    failure_behavior: 'Keep the relationship qualitative and bounded when current system-level capacity, topology, or status cannot be verified.'
  }
});

const sourceLocators = (fccLocator, cisaLocator) => [
  { url: FCC_ORDER, locator: fccLocator, source_type: 'primary_regulatory_order' },
  { url: CISA_COMMUNICATIONS, locator: cisaLocator, source_type: 'independent_authoritative_dependency_reference' }
];

function relationship({ target, verb, mechanism, level, influence, fccLocator, cisaLocator, moderators, alternatives, counterevidence }) {
  const dossier = {
    version: 'subsea_cable_rehabilitation_v1',
    promotion_status: 'promoted',
    reviewed_at: '2026-07-17',
    source: SUBSEA_CABLE_NODE_ID,
    target,
    mechanism,
    geographic_scope: 'Named international cable system, landing points, connected terrestrial network, and dependent service geography.',
    temporal_scope: 'Operational service interval and documented outage, capacity, licensing, or dependency period.',
    moderators,
    alternative_explanations: alternatives,
    confidence: level === 'direct' ? 'high' : 'moderate',
    counterevidence,
    indicator: SUBSEA_CABLE_METRIC_CONTRACTS.subsea_cables,
    source_locators: sourceLocators(fccLocator, cisaLocator),
    evidence_basis: level
  };
  return {
    source: SUBSEA_CABLE_NODE_ID,
    target,
    verb,
    adverb: 'within the documented international communications dependency',
    influence,
    topology_rule: 'subsea_cable_rehabilitation',
    evidence: {
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: level,
      relationship_type: level === 'direct' ? 'communications_backbone_pathway' : 'bounded_infrastructure_dependency',
      confidence: dossier.confidence,
      source_urls: SOURCE_URLS,
      relationship_source_urls: SOURCE_URLS,
      mechanism,
      geographic_scope: dossier.geographic_scope,
      temporal_scope: dossier.temporal_scope,
      notes: 'Capacity and dependency are system-specific; this edge does not imply that a single route carries all traffic or that every outage propagates globally.',
      dossier
    }
  };
}

export const SUBSEA_CABLE_RELATIONSHIPS = Object.freeze([
  relationship({
    target: 'telecom_backbone',
    verb: 'forms part of',
    level: 'direct',
    influence: 0.72,
    mechanism: 'End-to-end undersea fiber systems carry bidirectional voice and data traffic between landing terminals and terrestrial networks, providing ultra-low-latency international backbone capacity.',
    fccLocator: 'FCC 26-42A1, paragraph 1 and paragraph 9: submarine systems carry communications traffic, form a backbone for ultra-low-latency global connections, and connect wet links through terminal equipment to terrestrial facilities.',
    cisaLocator: 'Communications Systems, overview: physical and cyber cable and wireline systems deliver voice, video, and data services through geographically distributed networks.',
    moderators: ['route diversity', 'available capacity', 'terrestrial backhaul', 'landing-station redundancy', 'traffic engineering'],
    alternatives: ['satellite links', 'domestic terrestrial fiber', 'regional traffic localization'],
    counterevidence: 'A particular domestic or regional backbone can operate without an international wet link, and traffic can reroute when alternate paths have sufficient capacity.'
  }),
  relationship({
    target: 'ai_data_centers',
    verb: 'enables connectivity for',
    level: 'indirect',
    influence: 0.48,
    mechanism: 'International low-latency capacity supports distributed computing, model delivery, data movement, and service access across facilities, although compute deployment also depends on power, chips, terrestrial networks, and demand.',
    fccLocator: 'FCC 26-42A1, paragraph 1: the Commission identifies submarine systems as critical infrastructure for AI and as the backbone for ultra-low-latency global connections.',
    cisaLocator: 'Communications Systems, Dependencies: communications networks provide the Information Technology sector with delivery and distribution of applications and services.',
    moderators: ['workload locality', 'terrestrial fiber capacity', 'cloud architecture', 'latency requirements', 'data-residency policy'],
    alternatives: ['domestic-only workloads', 'satellite connectivity', 'local caching and replication', 'terrestrial cross-border routes'],
    counterevidence: 'Facility construction and electricity demand are not determined by cable capacity alone, and many workloads remain local or use terrestrial routes.'
  }),
  relationship({
    target: 'critical_infrastructure_fragility',
    verb: 'can transmit disruption into',
    level: 'indirect',
    influence: 0.52,
    mechanism: 'When dependent services lack route, landing, power, or capacity redundancy, damage or compromise can reduce communications availability and impair infrastructure monitoring, control, transactions, and emergency coordination.',
    fccLocator: 'FCC 26-42A1, paragraphs 3-5 and incident-reporting rules: the Commission treats submarine systems as critical infrastructure requiring physical, cyber, integrity, security, and resilience safeguards.',
    cisaLocator: 'Communications Systems, Dependencies: energy, transportation, water, emergency services, information technology, and financial services rely on communications for monitoring, control, coordination, and transactions.',
    moderators: ['route diversity', 'repair time', 'spare capacity', 'landing concentration', 'backup power', 'incident response'],
    alternatives: ['local equipment failure', 'terrestrial fiber cuts', 'power outages', 'cyber incidents outside the cable system'],
    counterevidence: 'Well-diversified networks can reroute around a failed segment, so a cable incident does not automatically produce a service or infrastructure failure.'
  })
]);

export function hasCompleteSubseaCableDossier(edge) {
  const dossier = edge?.evidence?.dossier;
  return edge?.topology_rule === 'subsea_cable_rehabilitation'
    && Boolean(dossier?.mechanism && dossier?.geographic_scope && dossier?.temporal_scope && dossier?.counterevidence)
    && Array.isArray(dossier?.moderators) && dossier.moderators.length > 0
    && Array.isArray(dossier?.alternative_explanations) && dossier.alternative_explanations.length > 0
    && Array.isArray(dossier?.source_locators) && dossier.source_locators.length >= 2
    && Boolean(dossier?.indicator?.metric_id);
}
