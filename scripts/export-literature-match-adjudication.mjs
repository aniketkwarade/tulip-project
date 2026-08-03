import fs from 'node:fs/promises';
import path from 'node:path';

import { NODES } from '../src/data.js';
import { LITERATURE_FULL_TEXT_DECISIONS, MANUAL_FULL_TEXT_PROMOTIONS } from '../src/literature-full-text-decisions.js';

const intakePath = path.resolve('public/missing-link-literature-intake.json');
const intake = JSON.parse(await fs.readFile(intakePath, 'utf8'));
const intakeCycles = [
  { captured_at: intake.captured_at, results: intake.results || [] },
  ...(intake.refresh_history || []).map(cycle => ({
    captured_at: cycle.captured_at,
    results: cycle.results || []
  }))
];
for (const cycle of intakeCycles) {
  const capturedDate = String(cycle.captured_at || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(capturedDate)) {
    throw new Error('Every literature intake cycle requires a stable captured_at timestamp before adjudication can be exported');
  }
}
const nodeById = new Map(NODES.map(node => [node.id, node]));
const currentYear = new Date().getUTCFullYear();
const stopwords = new Set(['and', 'the', 'of', 'to', 'in', 'for', 'from', 'global', 'risk', 'events', 'demand']);

function tokens(value) {
  return [...new Set(String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
    .filter(token => token.length >= 3 && !stopwords.has(token)))];
}

function endpointTokens(nodeId) {
  const node = nodeById.get(nodeId);
  const labelTokens = tokens(node?.name || nodeId.replaceAll('_', ' '));
  return labelTokens.length ? labelTokens : tokens(nodeId.replaceAll('_', ' '));
}

function publishedYear(value) {
  const match = String(value || '').match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

const decisions = [];
const seenAdjudicationIds = new Set();
for (const cycle of intakeCycles) {
  const intakeCapturedAt = String(cycle.captured_at).slice(0, 10);
  for (const result of cycle.results) {
    const [sourceId, targetId] = result.edge_key.split('->');
    const sourceTerms = endpointTokens(sourceId);
    const targetTerms = endpointTokens(targetId);
    for (const work of result.works || []) {
      const adjudicationId = `${result.edge_key}::${work.doi || work.url}`;
      if (seenAdjudicationIds.has(adjudicationId)) continue;
      seenAdjudicationIds.add(adjudicationId);
    const titleTerms = new Set(tokens(work.title));
    const sourceHits = sourceTerms.filter(term => titleTerms.has(term));
    const targetHits = targetTerms.filter(term => titleTerms.has(term));
    const year = publishedYear(work.published);
    let decision;
    let rationale;
    if (year && year > currentYear) {
      decision = 'reject_future_dated_metadata_for_current_evidence';
      rationale = `The record is dated ${year}, after the ${currentYear} review year, so it cannot be treated as current published evidence.`;
    } else if (sourceHits.length && targetHits.length) {
      decision = 'promote_to_full_text_readback_queue';
      rationale = `The title contains source terms (${sourceHits.join(', ')}) and target terms (${targetHits.join(', ')}); metadata relevance is plausible but claim entailment remains unread.`;
    } else if (sourceHits.length || targetHits.length) {
      decision = 'reject_one_sided_title_match';
      rationale = `The title matches only the ${sourceHits.length ? 'source' : 'target'} endpoint and does not express the directed pair.`;
    } else {
      decision = 'reject_irrelevant_or_polysemous_title_match';
      rationale = 'The title does not match both environmental endpoints; generic or polysemous query terms produced an unrelated record.';
    }
    const fullTextDecision = LITERATURE_FULL_TEXT_DECISIONS[adjudicationId];
    decisions.push({
      adjudication_id: adjudicationId,
      edge_key: result.edge_key,
      query: result.query,
      title: work.title,
      doi: work.doi,
      url: work.url,
      published: work.published,
      decision: fullTextDecision?.decision || decision,
      rationale: fullTextDecision?.rationale || rationale,
      source_endpoint_terms: sourceTerms,
      target_endpoint_terms: targetTerms,
      source_title_hits: sourceHits,
      target_title_hits: targetHits,
      intake_captured_at: cycle.captured_at,
      reviewed_at: fullTextDecision?.reviewed_at || intakeCapturedAt,
      reviewer: fullTextDecision?.reviewer || 'northstar_metadata_adjudication_v1',
      source_locators: fullTextDecision?.source_locators || [],
      evidence_boundary: fullTextDecision?.evidence_boundary || (decision === 'promote_to_full_text_readback_queue'
        ? 'Bibliographic metadata only. Full-text relationship-specific readback is required before citation or edge promotion.'
        : 'Rejected discovery metadata must not be cited, scored as corroboration, or used for edge promotion.')
    });
    }
  }
}

const intakeDecisionCount = decisions.length;
const existingAdjudicationIds = new Set(decisions.map(item => item.adjudication_id));
for (const promotion of MANUAL_FULL_TEXT_PROMOTIONS) {
  if (!existingAdjudicationIds.has(promotion.adjudication_id)) decisions.push(promotion);
}

const counts = decisions.reduce((out, item) => {
  out[item.decision] = (out[item.decision] || 0) + 1;
  return out;
}, {});
const registry = {
  version: 'literature_match_adjudication_v1',
  generated_at: new Date().toISOString(),
  source_intake: 'public/missing-link-literature-intake.json',
  policy: 'Adjudication is edge-work specific. Title metadata can reject obvious mismatches or route a work to readback, but cannot establish a directed relationship.',
  summary: {
    matches_adjudicated: intakeDecisionCount,
    manual_full_text_promotions: MANUAL_FULL_TEXT_PROMOTIONS.length,
    pending_adjudication: 0,
    decisions: counts,
    metadata_promoted_directly_to_graph: 0,
    full_text_promoted_to_graph: decisions.filter(item => item.decision === 'full_text_confirmed_bounded_and_promoted').length,
    promoted_directly_to_graph: decisions.filter(item => item.decision === 'full_text_confirmed_bounded_and_promoted').length
  },
  decisions
};

await fs.writeFile(path.resolve('public/literature-match-adjudication-registry.json'), `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(registry.summary, null, 2));
