import { normalizeSearchText, searchNodes } from './search.js';
import { isCausalRelationship } from './relationship-semantics.js';

const STOP = new Set('a an the is are was were why what how does do can could would should it that this of to in on for and or with from my our happen happens cause causes causing affect affects effect effects about tell me please'.split(' '));
const tokens = text => [...new Set(normalizeSearchText(text).split(' ').filter(word => word.length > 2 && !STOP.has(word)))];
const plain = value => String(value || '').replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();

export function discoveryIntent(query) {
  if (/\b(why|cause|causes|causing|driver|drivers)\b/i.test(query)) return 'cause';
  if (/\b(solve|solution|solutions|reduce|prevent|action|actions|done|respond)\b/i.test(query)) return 'response';
  if (/\b(measure|measured|measurement|monitor|track)\b/i.test(query)) return 'measurement';
  if (/\b(recent|latest|today|currently|now)\b/i.test(query)) return 'recent';
  if (/\b(effect|effects|affect|affects|consequence|consequences|next)\b/i.test(query)) return 'effect';
  return 'overview';
}
export function isDiscoveryQuestion(query) {
  return /\?|\b(why|what|how|cause|causes|happens|affects|solutions|recent|latest)\b/i.test(query) || tokens(query).length >= 4;
}
function expandQuery(query) {
  let value = query;
  if (/\b(water|lake|river)\b/i.test(query) && /green|scum|bloom/i.test(query)) value += ' harmful algal blooms';
  if (/allerg|pollen|hay fever/i.test(query)) value += ' air pollution health';
  if (/wilt/i.test(query) && /heat|hot/i.test(query)) value += ' farm heat stress';
  if (/getting hotter|planet warming|climate change/i.test(query)) value += ' global temperature';
  return value;
}

// Build once after lazy-loading published details. No generated facts or model calls.
export function createDiscoveryIndex(nodes, edges, details = new Map(), relationships = new Map(), recentForNode = () => null) {
  const byId = new Map(nodes.map(node => [node.id, node]));
  const records = nodes.map(node => {
    const detail = details.get(node.id) || node;
    const sourceUrls = detail.calibration?.source_urls || [];
    const passages = [];
    const add = (kind, text, urls = sourceUrls, relatedId = null, evidencePriority = 0) => {
      const copy = plain(text);
      if (copy) passages.push({ kind, text: copy, urls: urls.filter(url => /^https:\/\//i.test(url)), relatedId, evidencePriority, tokens: tokens(copy) });
    };
    add('overview', detail.readerMeaning || node.readerMeaning || node.description);
    add('effect', detail.humanImpact?.summary);
    add('effect', detail.planetImpact?.summary);
    for (const lever of detail.economicContext?.systemLevers || []) add('response', lever);
    add('measurement', detail.metric_contract?.transformation || detail.calibration?.metric?.metric_name);
    for (const occurrence of recentForNode({ ...node, ...detail })?.occurrences || []) {
      add('recent', [occurrence.date, occurrence.title, occurrence.summary].filter(Boolean).join(' · '), (occurrence.sources || []).map(source => source.url).filter(Boolean));
    }
    for (const edge of edges) {
      if (!isCausalRelationship(edge) || (edge.source !== node.id && edge.target !== node.id)) continue;
      const relationship = relationships.get(`${edge.source}->${edge.target}`);
      const relatedId = edge.target === node.id ? edge.source : edge.target;
      const relationshipUrls = relationship?.source_urls || relationship?.sources?.map(source => typeof source === 'string' ? source : source.url) || [];
      add(edge.target === node.id ? 'cause' : 'effect', relationship?.plain_language || relationship?.description || edge.relationship_content?.plain_language,
        relationshipUrls, relatedId, (edge.evidence?.relationship_level === 'direct' ? 3 : 0) + (edge.verb === 'causes' ? 2 : 0));
    }
    return { node, passages, nameTokens: tokens([node.name, ...(node.semanticAliases || []).map(alias => alias.name)].join(' ')) };
  });
  const frequency = new Map();
  for (const record of records) for (const token of new Set([...record.nameTokens, ...record.passages.flatMap(p => p.tokens)])) frequency.set(token, (frequency.get(token) || 0) + 1);
  return { records, byId, frequency };
}

export function discoverTopics(index, query, limit = 6) {
  const intent = discoveryIntent(query);
  const queryTokens = tokens(expandQuery(query));
  if (!queryTokens.length) return { intent, matches: [], ambiguous: false };
  const lexical = new Map(searchNodes([...index.byId.values()], query, index.byId.size).map(match => [match.node.id, match]));
  const weighted = words => queryTokens.reduce((sum, token) => sum + (words.includes(token) ? 1 + Math.log(1 + index.records.length / (index.frequency.get(token) || 1)) : 0), 0);
  const matches = index.records.map(record => {
    const nameHits = queryTokens.filter(token => record.nameTokens.includes(token)).length;
    const passages = record.passages.map(passage => ({ ...passage,
      // Topic-name repetition should not outrank a directly documented mechanism.
      rank: weighted(passage.tokens.filter(token => !record.nameTokens.includes(token))) + passage.evidencePriority + (passage.kind === intent ? 2 : 0)
    })).sort((a, b) => b.rank - a.rank);
    const preferred = passages.find(passage => passage.kind === intent);
    const direct = lexical.get(record.node.id);
    const rawEvidence = Math.max(0, ...record.passages.map(passage => weighted(passage.tokens)));
    const coverage = queryTokens.filter(token => record.nameTokens.includes(token) || record.passages.some(p => p.tokens.includes(token))).length / queryTokens.length;
    const excludesDrought = /enough (rain|water)|well watered/i.test(query) && /drought|water shortage/i.test(record.node.name);
    const score = excludesDrought ? 0 : (direct?.score || 0) + weighted(record.nameTokens) * 5 + rawEvidence;
    // Match the topic independently of intent; then choose the requested kind of evidence.
    const evidence = preferred || passages[0];
    return { node: record.node, score, coverage, nameHits, direct,
      evidence: evidence ? { text: sentences(evidence.text), kind: evidence.kind, urls: evidence.urls, relatedId: evidence.relatedId } : null,
      related: passages.filter(p => p.kind === intent && p.relatedId).map(p => index.byId.get(p.relatedId)).filter(Boolean).filter((node, i, all) => all.findIndex(n => n.id === node.id) === i).slice(0, 5)
    };
  }).filter(match => match.score > 0 && (match.direct || match.nameHits > 0 || (match.coverage >= .6 && match.score >= 7)))
    .sort((a, b) => b.score - a.score || a.node.name.localeCompare(b.node.name)).slice(0, limit);
  const ambiguous = matches.length > 1 && matches[1].score >= matches[0].score * .88;
  return { intent, matches, ambiguous,
    scopeNote: /near me|my (city|area|town)|where i live/i.test(query) ? 'These are graph-wide matches. TULIP has not determined your location or local conditions.' : null
  };
}
const sentences = value => (plain(value).match(/[^.!?]+[.!?]*/g) || []).slice(0, 2).join('').trim();
