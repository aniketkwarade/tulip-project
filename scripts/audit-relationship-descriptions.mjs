import { EDGES } from '../src/data.js';

const failures = [];
const seen = new Map();
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

for (const edge of EDGES) {
  const key = `${edge.source}->${edge.target}`;
  const description = String(edge.relationship_description || '').trim();
  const sentenceCount = description.split(/(?<=[.!?])\s+/).filter(Boolean).length;
  const wordCount = description.split(/\s+/).filter(Boolean).length;
  if (!description) failures.push({ code: 'relationship_description_missing', key });
  if (wordCount < 10) failures.push({ code: 'relationship_description_too_thin', key, word_count: wordCount });
  if (sentenceCount < 1 || sentenceCount > 2) failures.push({ code: 'relationship_description_sentence_count', key, sentence_count: sentenceCount });
  for (const { code, pattern } of prohibitedPatterns) {
    if (pattern.test(description)) failures.push({ code, key, description });
  }
  const duplicate = seen.get(description.toLocaleLowerCase());
  if (duplicate) failures.push({ code: 'relationship_description_duplicate', key, duplicate_of: duplicate });
  else seen.set(description.toLocaleLowerCase(), key);
}

const result = { ok: failures.length === 0, relationships: EDGES.length, unique_descriptions: seen.size, failures };
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
