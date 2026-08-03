import { HUMANITARIAN_EXPANSION_DOCKET } from './humanitarian-expansion-docket.js';

const root = item => ({ id: item.id, name: item.proposed_name, description: item.mechanism, sphere: 'sociopolitical', authored_node_class: 'authored_root_driver', baseValue: 46, value: 46, vector: { climate_forcing: .1, ecological_damage: .18, human_drivenness: .74, societal_fallout: .94 }, source_urls: item.sources, calibration: { role: 'root_driver', source_urls: item.sources, notes: 'External humanitarian-system driver, bounded to documented operations and reporting cycles.' }, adjectives: [{ min:0,max:25,label:'Limited'},{min:25,max:50,label:'Stressed'},{min:50,max:75,label:'Constrained'},{min:75,max:100,label:'Critical'}] });
export const HUMANITARIAN_EXPANSION_NODES = Object.freeze(HUMANITARIAN_EXPANSION_DOCKET.map(root));
export const HUMANITARIAN_EXPANSION_NODE_IDS = Object.freeze(HUMANITARIAN_EXPANSION_NODES.map(node => node.id));
const GENERIC_HUMANITARIAN_METRIC_CONTRACTS = Object.fromEntries([...HUMANITARIAN_EXPANSION_NODE_IDS, 'humanitarian_resource_gaps'].map(id => [id, { metric_id: `${id}_operation_bound_metric`, metric_name: `${id.replaceAll('_', ' ')} operation-bound measure`, unit: 'people, US dollars, or documented constraint incidents', geography: 'named humanitarian operation', cadence: 'appeal or operational reporting cycle', observation_time_field: 'reporting_period', source_id: 'unhcr_climate_change_conflict_and_displacement', transformation: 'Use named operation reports and retain the denominator, appeal period, source agency, and coverage caveats.', uncertainty: 'Needs, access incidents, funding, and service coverage are not directly interchangeable and vary by reporting practice.', threshold_provenance: 'Operation-specific baseline and humanitarian-response plan definitions.', failure_behavior: 'Do not aggregate across incomparable operations or infer a gap from a missing report.' }]));
export const HUMANITARIAN_METRIC_CONTRACTS = Object.freeze({
  ...GENERIC_HUMANITARIAN_METRIC_CONTRACTS,
  humanitarian_access_constraints: Object.freeze({
    metric_id: 'acaps_humanitarian_access_severity_distribution',
    metric_name: 'ACAPS distribution of assessed humanitarian access severity',
    unit: 'countries and percent of assessed crisis-affected countries at access score 3-5, with trend-category counts and shares',
    geography: 'global panel of crisis-affected countries assessed in the named ACAPS release',
    cadence: 'twice-yearly assessment release with weekly page-change monitoring',
    observation_time_field: 'assessment_period_end_and_snapshot_captured_at',
    source_id: 'acaps_humanitarian_access',
    transformation: 'Retain the source-reported count and share of countries at ACAPS access score 3-5 plus source-reported deteriorated, improved, and stable counts and shares. Derive the assessed-country denominator only by summing those mutually exclusive trend counts, and label it derived. Preserve period, threshold and methodology.',
    uncertainty: 'The assessment synthesizes analyst-reviewed secondary information. Country aggregation can hide subnational variation; crisis definitions, source availability, conflict dynamics, information access, and assessment revisions affect comparison. The denominator is derived from trend-category counts because it is not directly stated on the page.',
    threshold_provenance: 'Use the ACAPS published high-to-extreme threshold of overall access score 3-5 under its nine-indicator, three-pillar framework. Do not create a platform-derived country score or interpret a change as a causal effect.',
    failure_behavior: 'Retain the last validated assessment and mark stale; reject missing claims, changed method, invalid percentages, or unreconciled country counts. Never infer people reached, access incidents, aid delivered, country-specific severity, or absence of constraints.'
  }),
  humanitarian_response_funding_shortfall: Object.freeze({
    metric_id: 'humanitarian_response_funding_shortfall_operation_bound_metric',
    metric_name: 'OCHA FTS reported humanitarian response-plan funding shortfall',
    unit: 'current USD requirement, current USD reported funding, current USD shortfall, and percent of requirement funded',
    geography: 'named released OCHA Humanitarian Programme Cycle plan and its declared locations',
    cadence: 'monthly during the plan year; retain the completed-year record because FTS flows may be revised later',
    observation_time_field: 'plan_year_and_snapshot_captured_at',
    source_id: 'ocha_humanitarian_programme_cycle_public_api',
    transformation: 'For each released plan with a positive revised requirement, join the plan-year endpoint to FTS incoming funding grouped by destination plan ID; shortfall is max(revised requirement minus reported paid/committed funding, zero), while coverage remains uncapped.',
    uncertainty: 'FTS reflects funding reported and linked to a plan, not all resources available or aid delivered. Reporting delay, revisions, unlinked or multi-plan flows, exchange rates, plan-requirement revisions, and funding recorded outside FTS affect the result; pledges are retained separately and excluded from reported funding.',
    threshold_provenance: 'Zero shortfall means reported incoming funding meets or exceeds the current revised requirement for that named plan; it does not prove operational sufficiency, equitable allocation, timely disbursement, or delivery.',
    failure_behavior: 'Retain the last validated snapshot and mark stale; reject missing plan or FTS reports, duplicate plan IDs, invalid requirements or funding, and a materially empty join. Never substitute original requirements for a present revised requirement, treat pledges as funding, or infer actual delivery.'
  }),
  humanitarian_resource_gaps: Object.freeze({
    metric_id: 'humanitarian_plan_reported_resource_gap',
    metric_name: 'OCHA FTS reported response-plan resource gap',
    unit: 'current USD shortfall and percent of current requirement',
    geography: 'named released OCHA Humanitarian Programme Cycle plan and its declared locations',
    cadence: 'monthly during the plan year; retain completed-year revisions',
    observation_time_field: 'plan_year_and_snapshot_captured_at',
    source_id: 'ocha_humanitarian_programme_cycle_public_api',
    transformation: 'For each released plan, subtract reported incoming plan-linked FTS funding from the positive current revised requirement and zero-bound the monetary shortfall. Preserve original and revised requirements, funding, pledges, coverage, plan ID, locations, and reporting year.',
    uncertainty: 'This is a reported financial resource gap, not a complete inventory of staff, supplies, access, logistics, local capacity, or delivered assistance. Reporting lag, unlinked flows, plan revisions, exchange rates, and off-FTS resources affect the estimate.',
    threshold_provenance: 'A positive value means reported plan-linked incoming funding is below the official current financial requirement for that named plan. It does not prove an equivalent operational service deficit.',
    failure_behavior: 'Retain the last validated snapshot and mark stale; reject missing plan or FTS reports, invalid requirements, duplicate plan IDs, or an empty join. Never convert missing funding to a verified zero-gap result or treat pledges as received funding.'
  }),
  humanitarian_surge_demand: Object.freeze({
    metric_id: 'humanitarian_plan_positive_requirement_revision',
    metric_name: 'Positive revision in an OCHA humanitarian plan financial requirement',
    unit: 'current USD and percent change from original requirement',
    geography: 'named released OCHA Humanitarian Programme Cycle plan and its declared locations',
    cadence: 'monthly during the plan year; retain completed-year revisions',
    observation_time_field: 'plan_year_and_snapshot_captured_at',
    source_id: 'ocha_humanitarian_programme_cycle_public_api',
    transformation: 'Calculate max(current revised requirement minus original requirement, zero) and its percent of the positive original requirement for each released plan. Preserve negative or zero revisions separately so only positive revisions count toward this bounded surge-demand proxy.',
    uncertainty: 'Requirement revisions can reflect changed needs, prices, scope, planning method, coverage, prioritization, or corrections. They are a financial planning signal, not a direct count of people newly in need or proof that an emergency surge occurred.',
    threshold_provenance: 'A positive value requires the official current revised plan requirement to exceed its official original requirement. Zero means no positive financial revision was reported, not absence of humanitarian pressure.',
    failure_behavior: 'Retain the last validated snapshot and mark stale; reject absent or non-positive original requirements, missing revised requirements, duplicate plans, or invalid currency values. Never infer people affected or operational workload from the financial revision alone.'
  })
});
const loc = (url, locator) => ({url, locator, source_type:'authoritative_assessment'});
function edge(source, target, mechanism, locators, effect=false) { const urls=[...new Set(locators.map(x=>x.url))]; return {source,target,verb:effect?'can intensify':'can constrain',adverb:'within a named humanitarian operation',influence:.48,topology_rule:'humanitarian_dossier_promotion',evidence:{source_status:'curated_edge_reference',evidence_mode:'curated_edge_reference',relationship_level:'direct',relationship_type:effect?'bounded_downstream_effect':'bounded_root_driver',confidence:'high',source_urls:urls,relationship_source_urls:urls,mechanism,geographic_scope:'Named humanitarian operation only; do not generalize across crises.',temporal_scope:'Appeal, emergency, or reporting cycle.',notes:'Humanitarian capacity is operation-specific and affected by mandate, access, funding flexibility, and reporting coverage.',dossier:{version:'humanitarian_edge_dossier_v1',promotion_status:'promoted',reviewed_at:'2026-07-17',source,target,mechanism,geographic_scope:'Named humanitarian operation only.',temporal_scope:'Appeal, emergency, or reporting cycle.',moderators:['mandate','operational access','flexible funding','local capacity'],alternative_explanations:['needs-estimation revision','reporting coverage change','service prioritization'],confidence:'high',counterevidence:'A documented pressure does not prove that all response gaps are caused by it; operations may reprioritize, mobilize additional resources, or retain local capacity.',indicator:HUMANITARIAN_METRIC_CONTRACTS[effect?source:target],source_locators:locators,evidence_basis:'direct'}}};}
export const HUMANITARIAN_RELATIONSHIPS=Object.freeze([
 edge('humanitarian_response_funding_shortfall','humanitarian_resource_gaps','Funding below assessed operational requirements can force reduction, delay, or closure of life-saving programmes.',[loc('https://www.unhcr.org/about-unhcr/planning-funding-and-results/underfunding','UNHCR: funding gap constrains essential services'),loc('https://www.un.org/en/global-issues/crisis-and-emergency-response','UN: funding shortfalls threaten critical aid delivery')]),
 edge('humanitarian_access_constraints','humanitarian_resource_gaps','Conflict, administrative restrictions, and attacks can prevent humanitarian organizations from reaching affected people.',[loc('https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess','OCHA: access constraints and impact monitoring'),loc('https://www.un.org/en/global-issues/crisis-and-emergency-response','UN: restricted crisis-zone access blocks aid delivery')]),
 edge('humanitarian_surge_demand','humanitarian_resource_gaps','Concurrent disaster, displacement, and conflict needs can outpace available response capacity.',[loc('https://www.un.org/en/annualreport/2025/humanitarian-assistance','UN annual report: intensifying conflict and climate disaster needs'),loc('https://www.unhcr.org/publications/underfunded-report-2024','UNHCR: emergency needs and underfunding')]),
 edge('humanitarian_resource_gaps','famine_relief_resource_strains','Unmet humanitarian resource needs can constrain food, shelter, health, and protection response in acute crises.',[loc('https://www.unhcr.org/publications/underfunded-report-2024','UNHCR: underfunding reduces priority life-saving activities'),loc('https://www.un.org/en/global-issues/crisis-and-emergency-response','UN: funding and access constraints in emergency response')],true)
]);
export function hasCompleteHumanitarianDossier(e){const d=e.evidence?.dossier;return Boolean(d?.promotion_status==='promoted'&&d.indicator?.metric_id&&d.source_locators?.length>=2&&d.moderators?.length);}
