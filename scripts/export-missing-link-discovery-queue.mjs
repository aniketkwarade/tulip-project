import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, NODES } from '../src/data.js';
import {
  CLOSED_MISSING_LINK_CANDIDATE_KEYS,
  MISSING_LINK_CANDIDATE_DECISIONS
} from '../src/missing-link-candidate-decisions.js';
import { REJECTED_LEGACY_EDGE_KEYS } from '../src/northstar-contracts.js';

const research = JSON.parse(await fs.readFile(path.resolve('public/connection-research.json'), 'utf8'));
const sourceRegistry = JSON.parse(await fs.readFile(path.resolve('public/tulip-source-registry.json'), 'utf8'));
let topologyIntake = { candidates: [], generated_at: null };
try {
  topologyIntake = JSON.parse(await fs.readFile(path.resolve('public/topology-missing-link-intake.json'), 'utf8'));
} catch {
  // Topology discovery is optional. Its absence must not invalidate the source-backed research queue.
}
let literatureIntake = { results: [], captured_at: null };
let literatureAdjudication = { decisions: [], summary: { matches_adjudicated: 0, pending_adjudication: 0 } };
try {
  literatureIntake = JSON.parse(await fs.readFile(path.resolve('public/missing-link-literature-intake.json'), 'utf8'));
} catch {
  // The queue remains valid without a network refresh; the source watch reports that literature intake is not yet captured.
}
try {
  literatureAdjudication = JSON.parse(await fs.readFile(path.resolve('public/literature-match-adjudication-registry.json'), 'utf8'));
} catch {
  // Missing adjudication never upgrades a metadata signal; it remains pending and outside the graph.
}
const adjudicationById = new Map((literatureAdjudication.decisions || []).map(item => [`${item.edge_key}::${item.doi || item.url}`, item]));
const literatureByEdge = new Map((literatureIntake.results || []).map(item => [item.edge_key, item.works || []]));
const nodeIds = new Set(NODES.map(node => node.id));
const liveEdgeKeys = new Set(EDGES.map(edge => `${edge.source}->${edge.target}`));
const degree = new Map(NODES.map(node => [node.id, 0]));
for (const edge of EDGES) {
  degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
  degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
}
const activeSourceUrls = new Set(sourceRegistry.sources
  .filter(source => source.platform_integration?.active)
  .map(source => source.url));
const researchableRelationshipTypes = new Set(['direct', 'indirect', 'bounded_operational_chain']);
const closedCandidateKeys = new Set(CLOSED_MISSING_LINK_CANDIDATE_KEYS);

const sourceBackedCandidates = research
  .filter(item => nodeIds.has(item.source_id) && nodeIds.has(item.target_id))
  .filter(item => !liveEdgeKeys.has(`${item.source_id}->${item.target_id}`))
  .filter(item => !REJECTED_LEGACY_EDGE_KEYS.has(`${item.source_id}->${item.target_id}`))
  .filter(item => !closedCandidateKeys.has(`${item.source_id}->${item.target_id}`))
  .filter(item => researchableRelationshipTypes.has(item.relationship_type))
  .filter(item => !item.flag_for_review && item.mechanism && (item.sources || []).length >= 2)
  .filter(item => (item.edge_defensibility_score || 0) >= 3)
  .map(item => {
    const apiSourceMatch = (item.sources || []).some(source => activeSourceUrls.has(source.url));
    const edgeKey = `${item.source_id}->${item.target_id}`;
    const freshLiteratureMatches = (literatureByEdge.get(edgeKey) || []).map(work => ({
      ...work,
      adjudication: adjudicationById.get(`${edgeKey}::${work.doi || work.url}`) || {
        decision: 'pending_adjudication',
        rationale: 'No edge-work adjudication record is available.',
        evidence_boundary: 'Pending bibliographic metadata cannot be cited or used for graph promotion.'
      }
    }));
    const readbackCandidates = freshLiteratureMatches.filter(work => work.adjudication.decision === 'promote_to_full_text_readback_queue');
    const endpointGap = Math.max(0, 12 - Math.min(degree.get(item.source_id) || 0, degree.get(item.target_id) || 0));
    const priorityScore = (item.edge_defensibility_score || 0) * 20
      + (item.confidence === 'high' ? 15 : item.confidence === 'moderate' || item.confidence === 'medium' ? 8 : 0)
      + endpointGap
      + (apiSourceMatch ? 12 : 0)
      + (readbackCandidates.length ? 6 : 0);
    return {
      queue_id: `missing_link_${item.source_id}_${item.target_id}`,
      edge_key: `${item.source_id}->${item.target_id}`,
      source_id: item.source_id,
      source_name: item.source_name,
      target_id: item.target_id,
      target_name: item.target_name,
      candidate_relationship_type: item.relationship_type,
      candidate_confidence: item.confidence === 'medium' ? 'moderate' : item.confidence,
      mechanism: item.mechanism,
      why_it_matters: `If approved, this candidate would add a bounded ${item.source_name} to ${item.target_name} relationship. It is not currently part of the live graph and the cited sources have not yet passed the full directed-claim promotion gate.`,
      source_research_rationale: item.why_it_matters,
      research_notes: item.research_notes,
      sources: item.sources,
      active_platform_source_overlap: apiSourceMatch,
      fresh_literature_matches: freshLiteratureMatches,
      literature_readback_candidates: readbackCandidates,
      literature_entailment_boundary: freshLiteratureMatches.length
        ? `${freshLiteratureMatches.length} metadata record(s) were adjudicated; only records explicitly routed to full-text readback may proceed, and none can support promotion until claim readback is complete.`
        : 'No new literature metadata match was attached in the latest watch cycle.',
      priority_score: priorityScore,
      graph_state: 'not_live_candidate',
      status: 'discovery_only_pending_human_review',
      auto_promotion: false,
      human_promotion_gate: {
        required: true,
        checks: [
          'Read each cited source against the exact directed claim.',
          'Bound the mechanism, geography, and time period.',
          'Document moderators, alternatives, and counterevidence.',
          'Assign confidence from evidence quality rather than graph need.',
          'Name a measurable node or edge indicator.',
          'Check duplicates, reverse causality, ontology fit, and cycles.',
          'Approve or reject explicitly; never auto-promote.'
        ]
      }
    };
  })
  .sort((a, b) => b.priority_score - a.priority_score || a.edge_key.localeCompare(b.edge_key));

const sourceBackedKeys = new Set(sourceBackedCandidates.map(candidate => candidate.edge_key));
const topologyCandidates = (topologyIntake.candidates || [])
  .filter(item => nodeIds.has(item.source_id) && nodeIds.has(item.target_id))
  .filter(item => !liveEdgeKeys.has(item.edge_key) && !sourceBackedKeys.has(item.edge_key) && !closedCandidateKeys.has(item.edge_key))
  .map(item => {
    const freshLiteratureMatches = (literatureByEdge.get(item.edge_key) || []).map(work => ({
      ...work,
      adjudication: adjudicationById.get(`${item.edge_key}::${work.doi || work.url}`) || {
        decision: 'pending_adjudication',
        rationale: 'No edge-work adjudication record is available.',
        evidence_boundary: 'Pending bibliographic metadata cannot be cited or used for graph promotion.'
      }
    }));
    const readbackCandidates = freshLiteratureMatches.filter(work => work.adjudication.decision === 'promote_to_full_text_readback_queue');
    return {
      queue_id: `missing_link_${item.source_id}_${item.target_id}`,
      edge_key: item.edge_key,
      source_id: item.source_id,
      source_name: item.source_name,
      target_id: item.target_id,
      target_name: item.target_name,
      candidate_origin: item.candidate_origin,
      candidate_relationship_type: item.candidate_relationship_type,
      candidate_confidence: 'unassessed',
      mechanism: null,
      why_it_matters: item.hypothesis,
      source_research_rationale: 'Multiple reviewed two-hop paths make this pair efficient to search, but graph topology is not evidence of a collapsed relationship.',
      research_notes: item.evidence_boundary,
      sources: [],
      path_leg_evidence: item.mediators,
      endpoint_measurement_ready: item.endpoint_measurement_ready,
      active_platform_source_overlap: false,
      fresh_literature_matches: freshLiteratureMatches,
      literature_readback_candidates: readbackCandidates,
      literature_entailment_boundary: freshLiteratureMatches.length
        ? `${freshLiteratureMatches.length} metadata record(s) were found. None supports promotion until a directed full-text claim readback is complete.`
        : 'No literature metadata match has yet been attached to this topology hypothesis.',
      priority_score: item.topology_score,
      graph_state: 'not_live_candidate',
      status: 'topology_hypothesis_awaiting_literature_discovery',
      auto_promotion: false,
      human_promotion_gate: {
        required: true,
        checks: [
          'Do not infer transitivity from the two-hop motif.',
          'Find and read a relationship-specific source for the exact directed claim.',
          'Resolve whether the proposed link is direct, indirect, reversed, confounded, duplicated, or unsupported.',
          'Check the live graph, prior rejection registry, and ontology aliases before commissioning research.',
          'Bound mechanism, geography, period, moderators, alternatives, and counterevidence.',
          'Name a measurable endpoint or edge indicator and assign confidence from evidence quality.',
          'Approve or reject explicitly; never auto-promote.'
        ]
      }
    };
  });

const candidates = [...sourceBackedCandidates, ...topologyCandidates]
  .sort((a, b) => b.priority_score - a.priority_score || a.edge_key.localeCompare(b.edge_key));

const allLiteratureResults = [
  ...(literatureIntake.results || []),
  ...(literatureIntake.refresh_history || []).flatMap(cycle => cycle.results || [])
];
const queriedEdgeKeys = new Set(allLiteratureResults.map(result => result.edge_key));
const currentCandidateEdgeKeys = new Set(candidates.map(candidate => candidate.edge_key));
const queriedCurrentCandidateEdges = [...currentCandidateEdgeKeys].filter(edgeKey => queriedEdgeKeys.has(edgeKey));
const historicalCandidateWorks = allLiteratureResults
  .filter(result => currentCandidateEdgeKeys.has(result.edge_key))
  .reduce((sum, result) => sum + (result.works || []).length, 0);

const queue = {
  version: 'continuous_missing_link_discovery_v1',
  generated_at: new Date().toISOString(),
  source_artifacts: ['public/connection-research.json', 'public/topology-missing-link-intake.json', 'public/tulip-source-registry.json', 'public/missing-link-literature-intake.json', 'public/literature-match-adjudication-registry.json', 'src/missing-link-candidate-decisions.js'],
  source_watch: {
    literature: {
      source_id: 'crossref_rest_api',
      cadence: 'weekly',
      last_captured_at: literatureIntake.captured_at || null,
      intake_file: 'public/missing-link-literature-intake.json',
      status: literatureIntake.captured_at ? 'active' : 'awaiting_first_capture',
      promotion_boundary: 'Metadata discovery only; source text must be read before use as edge evidence.',
      current_candidate_edges_queried_across_retained_history: queriedCurrentCandidateEdges.length,
      current_candidate_edges_not_yet_queried: candidates.length - queriedCurrentCandidateEdges.length,
      retained_refresh_cycles: (literatureIntake.refresh_history || []).length + (literatureIntake.captured_at ? 1 : 0)
    },
    operational_apis: {
      cadence: 'on_snapshot_refresh',
      registered_active_sources: sourceRegistry.sources.filter(source => source.platform_integration?.active).length,
      behavior: 'Re-rank candidates when cited URLs overlap active platform sources; API presence never proves a mechanism.'
    }
  },
  policy: 'Literature and API overlap may raise review priority but can never promote an edge. Every candidate stays outside the live graph until the full human gate is completed.',
  summary: {
    candidates: candidates.length,
    source_backed_candidates: sourceBackedCandidates.length,
    source_backed_candidates_adjudicated_closed: CLOSED_MISSING_LINK_CANDIDATE_KEYS.length,
    topology_hypotheses: topologyCandidates.length,
    active_platform_source_overlap: candidates.filter(item => item.active_platform_source_overlap).length,
    fresh_literature_matches: candidates.reduce((sum, item) => sum + item.fresh_literature_matches.length, 0),
    literature_matches_adjudicated: literatureAdjudication.summary?.matches_adjudicated || 0,
    literature_matches_pending: literatureAdjudication.summary?.pending_adjudication || 0,
    full_text_promoted_to_graph: literatureAdjudication.summary?.full_text_promoted_to_graph || 0,
    literature_readback_candidates: candidates.reduce((sum, item) => sum + item.literature_readback_candidates.length, 0),
    candidate_edges_queried_across_retained_history: queriedCurrentCandidateEdges.length,
    candidate_edges_not_yet_queried: candidates.length - queriedCurrentCandidateEdges.length,
    historical_metadata_matches_for_current_candidates: historicalCandidateWorks,
    auto_promoted: 0
  },
  adjudicated_source_backed_candidates: Object.entries(MISSING_LINK_CANDIDATE_DECISIONS).map(([edgeKey, review]) => ({
    edge_key: edgeKey,
    graph_state: 'reviewed_not_live',
    ...review
  })),
  candidates
};

await fs.writeFile(path.resolve('public/missing-link-discovery-queue.json'), `${JSON.stringify(queue, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(queue.summary, null, 2));
