import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, NODES } from '../src/data.js';
import { REJECTED_LEGACY_EDGE_KEYS } from '../src/northstar-contracts.js';

const research = JSON.parse(await fs.readFile(path.resolve('public/connection-research.json'), 'utf8'));
let topologyIntake = { candidates: [] };
try {
  topologyIntake = JSON.parse(await fs.readFile(path.resolve('public/topology-missing-link-intake.json'), 'utf8'));
} catch {
  // A standalone literature refresh can still operate on the source-backed queue.
}
const outputPath = path.resolve('public/missing-link-literature-intake.json');
let priorIntake = null;
try {
  priorIntake = JSON.parse(await fs.readFile(outputPath, 'utf8'));
} catch {
  priorIntake = null;
}
const liveNodes = new Set(NODES.map(node => node.id));
const liveEdges = new Set(EDGES.map(edge => `${edge.source}->${edge.target}`));
const researchableRelationshipTypes = new Set(['direct', 'indirect', 'bounded_operational_chain']);
const sourceBackedCandidates = research
  .filter(item => liveNodes.has(item.source_id) && liveNodes.has(item.target_id))
  .filter(item => !liveEdges.has(`${item.source_id}->${item.target_id}`))
  .filter(item => !REJECTED_LEGACY_EDGE_KEYS.has(`${item.source_id}->${item.target_id}`))
  .filter(item => researchableRelationshipTypes.has(item.relationship_type))
  .filter(item => !item.flag_for_review && item.mechanism && (item.sources || []).length >= 2)
  .map(item => ({ ...item, candidate_origin: 'source_backed_connection_research', discovery_priority_score: (item.edge_defensibility_score || 0) * 20 }));
const sourceBackedKeys = new Set(sourceBackedCandidates.map(item => `${item.source_id}->${item.target_id}`));
const topologyCandidates = (topologyIntake.candidates || [])
  .filter(item => liveNodes.has(item.source_id) && liveNodes.has(item.target_id))
  .filter(item => !liveEdges.has(item.edge_key) && !REJECTED_LEGACY_EDGE_KEYS.has(item.edge_key))
  .filter(item => !sourceBackedKeys.has(item.edge_key))
  .map(item => ({
    source_id: item.source_id,
    source_name: item.source_name,
    target_id: item.target_id,
    target_name: item.target_name,
    candidate_origin: item.candidate_origin,
    discovery_priority_score: item.topology_score || 0
  }));
const candidates = [...sourceBackedCandidates, ...topologyCandidates]
  .sort((a, b) => (b.discovery_priority_score || 0) - (a.discovery_priority_score || 0));

const priorResults = [
  ...(priorIntake?.results || []),
  ...(priorIntake?.refresh_history || []).flatMap(cycle => cycle.results || [])
];
const previouslyQueriedEdges = new Set(priorResults.map(item => item.edge_key));
const previouslySeenWorkIds = new Set(priorResults.flatMap(item => item.works || []).map(work => String(work.doi || work.url).toLowerCase()));
const previouslyQueriedQueries = new Set(priorResults.map(item => String(item.query || '').toLowerCase()).filter(Boolean));
const rotatedCandidates = [
  ...candidates.filter(candidate => !previouslyQueriedEdges.has(`${candidate.source_id}->${candidate.target_id}`)),
  ...candidates.filter(candidate => previouslyQueriedEdges.has(`${candidate.source_id}->${candidate.target_id}`))
];

const QUERY_ALIASES = Object.freeze({
  ice_sheet_mass_loss: ['ice sheet mass loss', 'ice-sheet retreat'],
  glacier_calving_events: ['glacier calving', 'iceberg calving'],
  fast_fashion: ['textile production', 'viscose rayon production'],
  deforestation: ['deforestation', 'forest loss'],
  monsoon_volatility: ['monsoon variability', 'monsoon rainfall extremes'],
  industry_farming: ['agricultural production', 'intensive agriculture'],
  carbon_emission: ['carbon dioxide emissions', 'greenhouse gas emissions'],
  el_nino: ['El Nino', 'ENSO warm phase'],
  la_nina: ['La Nina', 'ENSO cold phase'],
  temp: ['global warming', 'temperature increase'],
  cooling_water_competition: ['thermal power cooling water scarcity', 'cooling water constraints'],
  transformer_heat_failure_risk: ['transformer thermal failure', 'power transformer overheating'],
  semiconductor_fabs: ['semiconductor manufacturing', 'chip fabrication'],
  resource_depletion: ['resource depletion', 'material and water demand'],
  data_centers: ['data centres', 'data center infrastructure'],
  ai_data_centers: ['AI data centres', 'artificial intelligence computing infrastructure'],
  personal_conveyance: ['private vehicle use', 'passenger road transport'],
  urbanization: ['urban expansion', 'urban growth'],
  mobile_wireless_networks: ['mobile communication networks', 'cellular networks'],
  telecom_backbone: ['telecommunication networks', 'internet backbone'],
  internet_exchange_points: ['internet exchange points', 'network interconnection'],
  food: ['agricultural demand', 'food-system demand'],
  environ_anomalies: ['climate extremes', 'extreme weather'],
  ocean_acidification: ['ocean acidification', 'seawater acidification'],
  marine_fisheries_collapse: ['fishery decline', 'marine fishery productivity'],
  migration: ['human migration', 'population displacement'],
  amoc: ['Atlantic Meridional Overturning Circulation', 'AMOC'],
  sea_ice_season_loss: ['sea ice decline', 'seasonal sea ice loss'],
  grid_peak_load_stress: ['peak electricity demand', 'power grid peak load'],
  wet_bulb_heat: ['humid heat stress', 'wet-bulb heat']
});
const stopwords = new Set(['and', 'the', 'of', 'to', 'in', 'for', 'from', 'global', 'risk', 'events', 'demand', 'increase', 'change']);
const termTokens = value => [...new Set(String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/).filter(token => token.length >= 3 && !stopwords.has(token)))];
const endpointPhrases = (id, name) => [...new Set([name, ...(QUERY_ALIASES[id] || [])].map(value => String(value || '').replaceAll(/\s+/g, ' ').trim()).filter(Boolean))];

const selected = [];
const seenQueries = new Set();
for (const candidate of rotatedCandidates) {
  const sourcePhrases = endpointPhrases(candidate.source_id, candidate.source_name);
  const targetPhrases = endpointPhrases(candidate.target_id, candidate.target_name);
  const variants = [];
  const variantCount = Math.max(sourcePhrases.length, targetPhrases.length);
  for (let index = 0; index < variantCount; index += 1) {
    variants.push(`${sourcePhrases[index % sourcePhrases.length]} ${targetPhrases[index % targetPhrases.length]}`.replaceAll(/\s+/g, ' ').trim());
  }
  const query = variants.find(value => !previouslyQueriedQueries.has(value.toLowerCase())) || variants[0];
  if (seenQueries.has(query.toLowerCase())) continue;
  seenQueries.add(query.toLowerCase());
  selected.push({
    edge_key: `${candidate.source_id}->${candidate.target_id}`,
    candidate_origin: candidate.candidate_origin,
    query,
    query_variant_status: previouslyQueriedQueries.has(query.toLowerCase()) ? 'repeated_after_alias_exhaustion' : 'fresh_endpoint_alias_variant',
    source_phrases: sourcePhrases,
    target_phrases: targetPhrases
  });
  if (selected.length === 15) break;
}

const results = [];
const errors = [];
const currentDate = new Date().toISOString().slice(0, 10);
const REQUEST_SPACING_MS = 750;
const RETRY_DELAY_MS = 2500;
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

async function fetchCrossref(url) {
  const headers = {
    Accept: 'application/json',
    'User-Agent': 'LostPlanetEvidenceWatch/1.1'
  };
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, { headers });
    if (response.ok) return response;
    const retryable = response.status === 429 || response.status >= 500;
    if (!retryable || attempt === 1) throw new Error(`Crossref returned ${response.status} after ${attempt + 1} attempt(s)`);
    const retryAfterSeconds = Number(response.headers.get('retry-after'));
    const delay = Number.isFinite(retryAfterSeconds)
      ? Math.min(5000, Math.max(RETRY_DELAY_MS, retryAfterSeconds * 1000))
      : RETRY_DELAY_MS;
    await sleep(delay);
  }
  throw new Error('Crossref retry loop ended unexpectedly');
}

for (let selectedIndex = 0; selectedIndex < selected.length; selectedIndex += 1) {
  const item = selected[selectedIndex];
  if (selectedIndex > 0) await sleep(REQUEST_SPACING_MS);
  const [sourceId, targetId] = item.edge_key.split('->');
  const sourceTerms = termTokens(item.source_phrases.join(' '));
  const targetTerms = termTokens(item.target_phrases.join(' '));
  const url = new URL('https://api.crossref.org/works');
  url.searchParams.set('query.bibliographic', item.query);
  url.searchParams.set('filter', `from-pub-date:2010-01-01,until-pub-date:${currentDate},type:journal-article`);
  url.searchParams.set('select', 'DOI,title,publisher,published,URL,type');
  url.searchParams.set('sort', 'relevance');
  url.searchParams.set('order', 'desc');
  url.searchParams.set('rows', '10');
  try {
    const response = await fetchCrossref(url);
    const payload = await response.json();
    const rawWorks = (payload.message?.items || []).map(work => ({
      title: work.title?.[0] || null,
      doi: work.DOI || null,
      url: work.URL || (work.DOI ? `https://doi.org/${work.DOI}` : null),
      publisher: work.publisher || null,
      published: work.published?.['date-parts']?.[0]?.join('-') || null,
      type: work.type || null,
      discovery_source: 'crossref_rest_api',
      entailment_status: 'unread_discovery_signal'
    })).filter(work => work.title && work.url);
    const works = rawWorks.filter(work => {
      if (previouslySeenWorkIds.has(String(work.doi || work.url).toLowerCase())) return false;
      const titleTerms = new Set(termTokens(work.title));
      return sourceTerms.some(term => titleTerms.has(term)) && targetTerms.some(term => titleTerms.has(term));
    }).slice(0, 3);
    results.push({
      ...item,
      request_url: url.toString(),
      title_gate: { source_terms: sourceTerms, target_terms: targetTerms, rule: 'at_least_one_term_from_each_endpoint' },
      rotation: { previously_queried_edge: previouslyQueriedEdges.has(item.edge_key), query_variant_status: item.query_variant_status, previously_seen_works_excluded: rawWorks.length - rawWorks.filter(work => !previouslySeenWorkIds.has(String(work.doi || work.url).toLowerCase())).length },
      raw_work_count: rawWorks.length,
      rejected_by_title_gate: rawWorks.length - works.length,
      works
    });
  } catch (error) {
    errors.push({ ...item, error: error.message });
  }
}

if (results.length === 0) {
  try {
    const prior = priorIntake || JSON.parse(await fs.readFile(outputPath, 'utf8'));
    prior.last_refresh_failure = { attempted_at: new Date().toISOString(), errors };
    await fs.writeFile(outputPath, `${JSON.stringify(prior, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({ retained_prior: true, queries: selected.length, errors: errors.length }, null, 2));
    process.exit(0);
  } catch {
    throw new Error(`Literature refresh failed for all ${selected.length} queries and no prior intake exists.`);
  }
}

const intake = {
  version: 'missing_link_literature_intake_v4',
  captured_at: new Date().toISOString(),
  source: {
    id: 'crossref_rest_api',
    url: 'https://api.crossref.org/works',
    cadence: 'weekly',
    provenance: 'Crossref DOI metadata; each cycle rotates first to candidate edges and endpoint-alias query variants not present in prior intake history, searches 2010 onward, and excludes previously seen works. Titles remain discovery signals and have not been read for claim entailment.',
    uncertainty: 'Title-query relevance is noisy and publication metadata does not establish a directed mechanism.',
    failure_behavior: 'Retain the previous intake, mark the refresh failure, and never remove or promote graph edges based on an API outage.'
  },
  summary: { queries: selected.length, successful_queries: results.length, failed_queries: errors.length, works: results.reduce((sum, item) => sum + item.works.length, 0) },
  results,
  errors,
  refresh_history: [
    ...(priorIntake?.refresh_history || []),
    ...(priorIntake?.captured_at ? [{
      captured_at: priorIntake.captured_at,
      summary: priorIntake.summary,
      results: priorIntake.results || [],
      errors: priorIntake.errors || []
    }] : [])
  ]
};
await fs.writeFile(outputPath, `${JSON.stringify(intake, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(intake.summary, null, 2));
