import { EDGES } from '../src/data.js';

const failures = [];
const seen = new Map();
const seenPlainLanguage = new Map();
const prohibitedPatterns = [
  { code: 'relationship_description_evidence_prefix', pattern: /^Evidence indicates that/i },
  { code: 'relationship_description_record_id_filler', pattern: /\bRD-\d+\b/ },
  { code: 'relationship_description_length_filler', pattern: /The evidence applies|It should not be treated|The sources explain|Local conditions and measurement choices can change/i },
  { code: 'relationship_description_catalog_filler', pattern: /(?<=[.!?])\s+(?:Active tracking|Monitors|Details|Quantifies|Describes|Provides|Maintains)\b/i },
  { code: 'relationship_description_topology_filler', pattern: /adjacent systems|systemically|Priority-anchor promotion|Contract repair|reviewed .+ mechanism|\bthe edge\b|defensible|under bounded conditions|documented system pathway|forcing proxy|downstream attribution|graph influence/i },
  { code: 'relationship_description_signed_influence_filler', pattern: /The signed (?:positive|negative) influence denotes/i },
  { code: 'relationship_description_maintenance_jargon', pattern: /\bbounded (?:pathway|component|current-regime pathway|conditions)\b|Research-track rehabilitation|backlog rehabilitation|Exact-term promotion|Promoted from exact-term ontology|promoted to anchor status|treated as (?:a|the) .*anchor|kept as (?:a|the) .*anchor|used here as (?:a|the) anchor|This anchor uses|local attribution is not implied|scope, moderators, and counterevidence/i },
  { code: 'relationship_description_malformed_phrase', pattern: /competes for Cooling Water Competition|depletes into Aquifer Overdraft|warms into|loads (?:heat|instability|through)|pressure from through|pressure on through|exposure to by|performance of by|demand for when|relief from when|\ba upstream\b/i }
];

function sentenceTokens(value = '') {
  const ignored = new Set([
    'about', 'after', 'again', 'against', 'along', 'also', 'among', 'because',
    'been', 'being', 'between', 'could', 'does', 'from', 'have', 'into', 'more',
    'other', 'over', 'such', 'than', 'that', 'their', 'there', 'these', 'they',
    'this', 'through', 'under', 'when', 'where', 'which', 'while', 'with', 'would'
  ]);
  return new Set(String(value)
    .toLocaleLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 3 && !ignored.has(token)));
}

function sentenceOverlap(left, right) {
  const leftTokens = sentenceTokens(left);
  const rightTokens = sentenceTokens(right);
  if (!leftTokens.size || !rightTokens.size) return 0;
  const shared = [...rightTokens].filter(token => leftTokens.has(token)).length;
  return shared / Math.min(leftTokens.size, rightTokens.size);
}

for (const edge of EDGES) {
  const key = `${edge.source}->${edge.target}`;
  const description = String(edge.relationship_description || '').trim();
  const content = edge.relationship_content || {};
  const plainLanguage = String(content.plain_language || '').trim();
  const technicalDetail = String(content.technical_detail || '').trim();
  const confidence = content.confidence || {};
  const sources = Array.isArray(content.sources) ? content.sources : [];
  const sentenceCount = description.split(/(?<=[.!?])\s+/).filter(Boolean).length;
  const wordCount = description.split(/\s+/).filter(Boolean).length;
  const plainLanguageSentenceCount = plainLanguage.split(/(?<=[.!?])\s+/).filter(Boolean).length;
  const plainLanguageWordCount = plainLanguage.split(/\s+/).filter(Boolean).length;
  if (!description) failures.push({ code: 'relationship_description_missing', key });
  if (wordCount < 10) failures.push({ code: 'relationship_description_too_thin', key, word_count: wordCount });
  if (sentenceCount < 1 || sentenceCount > 2) failures.push({ code: 'relationship_description_sentence_count', key, sentence_count: sentenceCount });
  if (!plainLanguage) failures.push({ code: 'relationship_plain_language_missing', key });
  if (plainLanguageWordCount < 8) failures.push({ code: 'relationship_plain_language_too_thin', key, word_count: plainLanguageWordCount });
  if (plainLanguageWordCount > 82) failures.push({ code: 'relationship_plain_language_too_long', key, word_count: plainLanguageWordCount });
  if (plainLanguageSentenceCount < 2 || plainLanguageSentenceCount > 3) failures.push({ code: 'relationship_plain_language_sentence_count', key, sentence_count: plainLanguageSentenceCount });
  const plainLanguageSentences = plainLanguage.split(/(?<=[.!?])\s+/).filter(Boolean);
  for (let index = 1; index < plainLanguageSentences.length; index += 1) {
    const overlap = sentenceOverlap(plainLanguageSentences[index - 1], plainLanguageSentences[index]);
    if (overlap >= 0.55) failures.push({ code: 'relationship_plain_language_repetition', key, overlap: Number(overlap.toFixed(2)) });
  }
  if (/;/.test(plainLanguage)) failures.push({ code: 'relationship_plain_language_semicolon', key, plain_language: plainLanguage });
  if (/survival of young animals into adulthood (?:into|to|for)/i.test(plainLanguage)) failures.push({ code: 'relationship_plain_language_malformed_recruitment', key, plain_language: plainLanguage });
  if (/\b(?:anthropogenic|nitrification|denitrification|radiative forcing|biogeochemical|stoichiometric|hydrological|teleconnection|eutrophication|calcination|albedo|anoxic|hypoxic|cryosphere|pedogenic|enthalpy|evapotranspiration|sequestration|solubility|recruitment|operationally monitored|mole fraction|retrograde|parameterized|perturbation lifetime|trophic-transfer|biomass-flow|inventory boundary|forcing proxy|subseasonal|current-regime|EF\d|Tier \d|N2O-N)\b/i.test(plainLanguage)) {
    failures.push({ code: 'relationship_plain_language_specialist_term', key, plain_language: plainLanguage });
  }
  if (/\b[A-Z][A-Z0-9.-]{1,}\b/.test(plainLanguage)) failures.push({ code: 'relationship_plain_language_unexplained_acronym', key, plain_language: plainLanguage });
  if (!technicalDetail) failures.push({ code: 'relationship_technical_detail_missing', key });
  if (!['high', 'moderate'].includes(confidence.level)) failures.push({ code: 'relationship_confidence_level_missing', key, level: confidence.level || null });
  if (!confidence.explanation?.trim()) failures.push({ code: 'relationship_confidence_explanation_missing', key });
  if (!sources.length) failures.push({ code: 'relationship_sources_missing', key });
  if (sources.some(source => !source?.url || !/^https?:\/\//.test(source.url))) failures.push({ code: 'relationship_source_invalid', key });
  for (const { code, pattern } of prohibitedPatterns) {
    if (pattern.test(description)) failures.push({ code, key, description });
  }
  const duplicate = seen.get(description.toLocaleLowerCase());
  if (duplicate) failures.push({ code: 'relationship_description_duplicate', key, duplicate_of: duplicate });
  else seen.set(description.toLocaleLowerCase(), key);
  const plainLanguageDuplicate = seenPlainLanguage.get(plainLanguage.toLocaleLowerCase());
  if (plainLanguageDuplicate) failures.push({ code: 'relationship_plain_language_duplicate', key, duplicate_of: plainLanguageDuplicate });
  else seenPlainLanguage.set(plainLanguage.toLocaleLowerCase(), key);
}

const result = { ok: failures.length === 0, relationships: EDGES.length, unique_descriptions: seen.size, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
