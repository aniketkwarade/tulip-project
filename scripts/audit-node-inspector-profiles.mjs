import { writeFile } from 'node:fs/promises';
import { EDGES, NODES } from '../src/data.js';

const profileBasis = (profile) => profile?.basis || profile?.confidence || 'missing';
const countByBasis = (field) => NODES.reduce((counts, node) => {
  const basis = profileBasis(node[field]);
  counts[basis] = (counts[basis] || 0) + 1;
  return counts;
}, {});

const failures = [];
const evidenceContractNodeIds = ['temp', 'carbon_emission', 'deforestation', 'industry_farming', 'steel'];
const syntheticDescriptionPattern = /Earth system parameter calibrated|Northstar anchor covering|modelled in the .* sphere to widen causal coverage|anchor and .* domain profile/i;
const fallbackEconomicNodes = NODES
  .filter((node) => node.economicContext?.basis === 'default_sphere_fallback_v1')
  .map((node) => node.id);
const unauthoredEconomicInheritance = NODES
  .filter((node) => (
    node.economicContext?.basis?.startsWith('inherited_from:')
    && !node.economicContext?.inheritsFrom
  ))
  .map((node) => node.id);
const inheritedHumanImpact = NODES
  .filter((node) => node.humanImpact?.basis?.startsWith('inherited_from:'))
  .map((node) => node.id);
const inheritedPlanetImpact = NODES
  .filter((node) => node.planetImpact?.basis?.startsWith('inherited_from:'))
  .map((node) => node.id);
const edgeKeys = new Set(EDGES.map((edge) => `${edge.source}->${edge.target}`));
const wordCount = (text) => String(text || '').trim().split(/\s+/).filter(Boolean).length;
const firstSentence = (text) => String(text || '').split(/(?<=[.!?])\s+/).filter(Boolean)[0]?.trim() || '';
const duplicateValues = (entries) => {
  const seen = new Map();
  const duplicates = [];
  for (const { key, value } of entries) {
    const normalized = String(value || '').trim().toLocaleLowerCase();
    if (!normalized) continue;
    if (seen.has(normalized)) duplicates.push(`${key} duplicates ${seen.get(normalized)}`);
    else seen.set(normalized, key);
  }
  return duplicates;
};

if (fallbackEconomicNodes.length) {
  failures.push(`sphere-wide economic fallback presented as node-specific: ${fallbackEconomicNodes.join(', ')}`);
}
if (unauthoredEconomicInheritance.length) {
  failures.push(`economic inheritance lacks an authored declaration: ${unauthoredEconomicInheritance.join(', ')}`);
}
if (inheritedHumanImpact.length) {
  failures.push(`calibration anchors presented as human-impact evidence: ${inheritedHumanImpact.join(', ')}`);
}
if (inheritedPlanetImpact.length) {
  failures.push(`calibration anchors presented as planet-impact evidence: ${inheritedPlanetImpact.join(', ')}`);
}
const syntheticDescriptions = NODES
  .filter((node) => syntheticDescriptionPattern.test(node.description || ''))
  .map((node) => node.id);
if (syntheticDescriptions.length) {
  failures.push(`synthetic calibration copy exposed as node meaning: ${syntheticDescriptions.join(', ')}`);
}
for (const nodeId of evidenceContractNodeIds) {
  const node = NODES.find((candidate) => candidate.id === nodeId);
  const profile = node?.economicContext;
  if (!profile?.evidenceBoundary) failures.push(`${nodeId}: economic context lacks an evidence boundary`);
  if (!Array.isArray(profile?.sourceUrls) || profile.sourceUrls.length < 2) {
    failures.push(`${nodeId}: economic context lacks two authoritative source URLs`);
  }
  for (const url of profile?.sourceUrls || []) {
    if (!/^https?:\/\/[^/]+/.test(url)) failures.push(`${nodeId}: invalid economic-context source URL ${url}`);
  }
}

const humanSummaries = [];
const planetSummaries = [];
const readerMeanings = [];
const defaultDrivers = [];
const systemLevers = [];
const prohibitedVisibleCopy = /Structural response guidance has not been curated|Curated system levers will appear|This response reduces pressure on climate and ecological systems when it is deployed with its trade-offs managed|requires a node-specific driver assessment/i;
const readerMethodologyCopy = /\bis represented here through\b|\bmeasured in\b|\bdeclared geography\b|\bobserving network\b|\bcalculation stated\b|\bcalibration scale\b|\bcomparisons? must preserve\b|\bmetric contract\b|\breported separately with\b/i;
const dependentReaderScaffold = /^[^.!?]{1,140}\bcan (?:change|result from changes in)\b[^:]*:/i;
const weakRelationshipMeaning = /\bis a documented driver or conditioning factor\b|\bthrough the reviewed [a-z -]+ mechanism\b|\bthrough the documented system pathway\b|\bcan propagate into\b|\badds pressure to\b/i;

for (const node of NODES) {
  if (!node.readerMeaning) {
    failures.push(`${node.id}: missing readerMeaning`);
  } else {
    const meaningWords = wordCount(node.readerMeaning);
    if (meaningWords < 8) failures.push(`${node.id}: readerMeaning is too thin`);
    if (meaningWords > 80) failures.push(`${node.id}: readerMeaning is too long`);
    if (readerMethodologyCopy.test(node.readerMeaning)) {
      failures.push(`${node.id}: readerMeaning exposes measurement methodology`);
    }
    if (dependentReaderScaffold.test(node.readerMeaning)) {
      failures.push(`${node.id}: readerMeaning depends on an adjacent node`);
    }
    if (weakRelationshipMeaning.test(node.readerMeaning)) {
      failures.push(`${node.id}: readerMeaning exposes generic relationship scaffolding`);
    }
    if (node.readerMeaning.toLocaleLowerCase().startsWith(node.name.toLocaleLowerCase())) {
      failures.push(`${node.id}: readerMeaning repeats the node name at the opening`);
    }
    if (
      /\bis represented here through\b/i.test(node.description || '')
      && node.readerMeaning.trim().toLocaleLowerCase() === String(node.description).trim().toLocaleLowerCase()
    ) {
      failures.push(`${node.id}: readerMeaning repeats its metric-contract description`);
    }
    if (node.readerMeaningBasis === 'standalone_relationship_meaning_v2') {
      const opening = firstSentence(node.readerMeaning).toLocaleLowerCase();
      const nodeName = node.name.toLocaleLowerCase();
      if (opening.includes(` involving ${nodeName}.`)) {
        failures.push(`${node.id}: standalone readerMeaning defines the node circularly`);
      }
      if (!node.readerMeaningSupportingEdgeKey) {
        failures.push(`${node.id}: relationship-derived readerMeaning lacks an edge`);
      } else if (!edgeKeys.has(node.readerMeaningSupportingEdgeKey)) {
        failures.push(`${node.id}: readerMeaning cites missing edge ${node.readerMeaningSupportingEdgeKey}`);
      } else if (
        !node.readerMeaningSupportingEdgeKey.startsWith(`${node.id}->`)
        && !node.readerMeaningSupportingEdgeKey.endsWith(`->${node.id}`)
      ) {
        failures.push(`${node.id}: readerMeaning cites non-incident edge ${node.readerMeaningSupportingEdgeKey}`);
      }
    }
    readerMeanings.push({ key: `${node.id}.readerMeaning`, value: node.readerMeaning });
  }

  for (const [field, profile, systemField] of [
    ['humanImpact', node.humanImpact, 'affectedPopulations'],
    ['planetImpact', node.planetImpact, 'affectedSystems']
  ]) {
    if (!profile) {
      failures.push(`${node.id}: missing ${field}`);
      continue;
    }
    if (wordCount(profile.summary) < 8) failures.push(`${node.id}: ${field} summary is too thin`);
    if (!Array.isArray(profile.domains) || profile.domains.length === 0) failures.push(`${node.id}: ${field} lacks domains`);
    if (!Array.isArray(profile[systemField]) || profile[systemField].length === 0) failures.push(`${node.id}: ${field} lacks ${systemField}`);
    if (!Array.isArray(profile.consequences) || profile.consequences.length === 0 || profile.consequences.length > 4) {
      failures.push(`${node.id}: ${field} must contain 1-4 consequences`);
    }
    for (const consequence of profile.consequences || []) {
      if (wordCount(consequence) < 3) failures.push(`${node.id}: ${field} consequence is too thin`);
      if (consequence.trim().toLocaleLowerCase() === profile.summary.trim().toLocaleLowerCase()) {
        failures.push(`${node.id}: ${field} repeats its summary as a consequence`);
      }
      if (prohibitedVisibleCopy.test(consequence)) failures.push(`${node.id}: ${field} exposes generic fallback copy`);
    }
    if (prohibitedVisibleCopy.test(profile.summary)) failures.push(`${node.id}: ${field} exposes generic fallback copy`);
    if (profile.basis === 'evidence_derived_node_v1') {
      const support = profile.supportingEdgeKeys || [];
      for (const key of support) {
        if (!edgeKeys.has(key)) failures.push(`${node.id}: ${field} cites missing edge ${key}`);
      }
      if (
        support.length === 0
        && profile.derivationMode !== 'node_definition'
        && !/no direct (?:human|Earth-system) outcome established/i.test(profile.summary)
      ) {
        failures.push(`${node.id}: ${field} lacks relationship support or an explicit no-direct-impact boundary`);
      }
      if (support.length > 0 && !support.some((key) => key.startsWith(`${node.id}->`))) {
        failures.push(`${node.id}: ${field} support does not begin at the node`);
      }
      const summary = profile.summary.toLocaleLowerCase();
      const nodeName = node.name.toLocaleLowerCase();
      const nodeDefinition = firstSentence(node.description).toLocaleLowerCase();
      if (!summary.includes(nodeName) && summary !== nodeDefinition) {
        failures.push(`${node.id}: ${field} summary is not tied to the node name or definition`);
      }
    }
    (field === 'humanImpact' ? humanSummaries : planetSummaries).push({
      key: `${node.id}.${field}.summary`,
      value: profile.summary
    });
  }

  const economic = node.economicContext;
  if (!economic) {
    failures.push(`${node.id}: missing economicContext`);
    continue;
  }
  for (const field of ['hiddenCost', 'whoPays', 'physicalLimit', 'defaultDriver']) {
    if (wordCount(economic[field]) < 6) failures.push(`${node.id}: economicContext.${field} is too thin`);
    if (prohibitedVisibleCopy.test(economic[field])) failures.push(`${node.id}: economicContext.${field} exposes generic fallback copy`);
  }
  if (!Array.isArray(economic.systemLevers) || economic.systemLevers.length < 2 || economic.systemLevers.length > 4) {
    failures.push(`${node.id}: economicContext must contain 2-4 system levers`);
  }
  for (const [index, lever] of (economic.systemLevers || []).entries()) {
    if (wordCount(lever) < 3) failures.push(`${node.id}: system lever ${index + 1} is too thin`);
    if (prohibitedVisibleCopy.test(lever)) failures.push(`${node.id}: system lever ${index + 1} exposes generic fallback copy`);
    systemLevers.push({ key: `${node.id}.systemLevers[${index}]`, value: lever });
  }
  if (!Array.isArray(economic.sourceUrls) || economic.sourceUrls.length === 0) {
    failures.push(`${node.id}: economicContext lacks a source URL`);
  }
  for (const url of economic.sourceUrls || []) {
    if (!/^https?:\/\/[^/]+/.test(url)) failures.push(`${node.id}: invalid economic-context source URL ${url}`);
  }
  if (economic.basis === 'evidence_derived_node_v1') {
    const support = economic.supportingEdgeKeys || [];
    if (support.length === 0) failures.push(`${node.id}: economicContext lacks incident relationship support`);
    for (const key of support) {
      if (!edgeKeys.has(key)) failures.push(`${node.id}: economicContext cites missing edge ${key}`);
      if (!key.startsWith(`${node.id}->`) && !key.endsWith(`->${node.id}`)) {
        failures.push(`${node.id}: economicContext cites non-incident edge ${key}`);
      }
    }
    const nodeName = node.name.toLocaleLowerCase();
    const metricName = String(node.metric_contract?.metric_name || '').toLocaleLowerCase();
    const tailoredLeverCount = (economic.systemLevers || []).filter((lever) => {
      const normalized = lever.toLocaleLowerCase();
      return normalized.includes(nodeName) || (metricName && normalized.includes(metricName));
    }).length;
    if (tailoredLeverCount < 2) failures.push(`${node.id}: system levers are not sufficiently node-specific`);
  }
  defaultDrivers.push({ key: `${node.id}.economicContext.defaultDriver`, value: economic.defaultDriver });
}

for (const duplicate of duplicateValues(humanSummaries)) failures.push(`duplicate human-impact summary: ${duplicate}`);
for (const duplicate of duplicateValues(planetSummaries)) failures.push(`duplicate planet-impact summary: ${duplicate}`);
for (const duplicate of duplicateValues(readerMeanings)) failures.push(`duplicate reader meaning: ${duplicate}`);
for (const duplicate of duplicateValues(defaultDrivers)) failures.push(`duplicate default driver: ${duplicate}`);
for (const duplicate of duplicateValues(systemLevers)) failures.push(`duplicate system lever: ${duplicate}`);

const report = {
  generated_at: new Date().toISOString(),
  nodes: NODES.length,
  profile_coverage: {
    reader_meaning: NODES.reduce((counts, node) => {
      const basis = node.readerMeaningBasis || 'missing';
      counts[basis] = (counts[basis] || 0) + 1;
      return counts;
    }, {}),
    economic_context: countByBasis('economicContext'),
    human_impact: countByBasis('humanImpact'),
    planet_impact: countByBasis('planetImpact')
  },
  explicit_research_boundaries: {
    reader_meaning_missing: NODES.filter((node) => !node.readerMeaning).map((node) => node.id),
    economic_context_missing: NODES.filter((node) => !node.economicContext).map((node) => node.id),
    human_impact_missing: NODES.filter((node) => !node.humanImpact).map((node) => node.id),
    planet_impact_missing: NODES.filter((node) => !node.planetImpact).map((node) => node.id)
  },
  failures
};

await writeFile('tmp-node-inspector-profile-audit.json', `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({
  nodes: report.nodes,
  profile_coverage: report.profile_coverage,
  explicit_research_boundary_counts: Object.fromEntries(
    Object.entries(report.explicit_research_boundaries).map(([key, ids]) => [key, ids.length])
  ),
  failures
}, null, 2));

if (failures.length) process.exitCode = 1;
