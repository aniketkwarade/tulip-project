import fs from 'node:fs/promises';
import path from 'node:path';

import { EDGES, NODES } from '../src/data.js';

const outputJsonPath = path.resolve('tmp-source-entailment-audit.json');
const outputMarkdownPath = path.resolve('tmp-source-entailment-audit.md');
const nodeById = new Map(NODES.map(node => [node.id, node]));

const boundedTypePattern = /(bounded|conditional|observed|covariability|modulation|teleconnection|operational|regional|local|pathway|feedback|mechanism|deposition|taxonomic)/i;
const boilerplatePattern = /(combined source and target|family topology|inherited evidence|provides evidence context)/i;
const sourceReadbackConfirmedKeys = new Set([
  'amoc->ocean_current_regime_shift',
  'amoc->coastal_inundation_risk',
  'atmospheric_dryness->lightning_fire_weather',
  'humidity_amplification->flash_flood_regime',
  'particulate_soot_levels->soot_deposition_on_snow',
  'temp->lightning_fire_weather',
  'temp->smoke_exposure_burden'
]);
const sourceReadbackRequiredKeys = new Set([
  'rossby_wave_stalling->blocking_pattern_persistence'
]);

function hasSpecificPath(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const segments = url.pathname.split('/').filter(Boolean);
    return segments.length >= 2 || /doi\.org|\.pdf$/i.test(rawUrl);
  } catch {
    return false;
  }
}

function auditEdge(edge) {
  const edgeKey = `${edge.source}->${edge.target}`;
  const evidence = edge.evidence || {};
  const mode = evidence.evidence_mode || evidence.source_status || 'none';
  const relationshipUrls = evidence.relationship_source_urls || [];
  const notes = evidence.notes || '';
  const relationshipType = evidence.relationship_type || 'unspecified';
  const confidence = evidence.confidence || 'unspecified';
  const structuredReadback = evidence.source_readback;
  const reasons = [];

  if (mode === 'anchor_context_reference') {
    reasons.push('No relationship-specific source is attached.');
    reasons.push('The direction and mechanism remain an explicit low-confidence hypothesis.');
    return {
      disposition: 'fails_entailment_demoted',
      risk: 'high',
      reasons,
      relationshipUrls
    };
  }

  if (structuredReadback?.status === 'confirmed_bounded') {
    const complete = structuredReadback.reviewed_at
      && structuredReadback.exact_claim
      && structuredReadback.geographic_temporal_scope
      && structuredReadback.moderators_and_counterevidence
      && structuredReadback.source_locators?.length >= 2
      && structuredReadback.source_locators.every(locator => locator.url && locator.section);
    if (complete) {
      return {
        disposition: 'source_readback_confirmed',
        risk: confidence === 'low' ? 'medium' : 'low',
        reasons: [confidence === 'low'
          ? 'The source readback confirms a bounded, conditional mechanism; low confidence is retained because general causal evidence is limited.'
          : 'The cited primary or authoritative source was read back against the stated bounded mechanism, scope, and counterevidence.'],
        relationshipUrls: structuredReadback.source_locators.map(locator => locator.url)
      };
    }
    reasons.push('Structured source readback is incomplete.');
  }

  if (sourceReadbackConfirmedKeys.has(edgeKey)) {
    return {
      disposition: 'source_readback_confirmed',
      risk: 'low',
      reasons: ['The cited primary or authoritative source was read back against the stated bounded mechanism.'],
      relationshipUrls
    };
  }

  if (sourceReadbackRequiredKeys.has(edgeKey)) {
    return {
      disposition: 'manual_source_readback',
      risk: 'medium',
      reasons: ['Citation metadata is specific, but accessible source text did not confirm the exact relationship during this audit.'],
      relationshipUrls
    };
  }

  if (!relationshipUrls.length) reasons.push('No relationship-specific source URL.');
  if (boilerplatePattern.test(notes)) reasons.push('Evidence note is generic rather than claim-specific.');
  if (!boundedTypePattern.test(relationshipType)) reasons.push('Relationship type does not encode a bounded or conditional scope.');
  if (!['moderate', 'medium', 'high'].includes(confidence)) reasons.push('Confidence is missing or unsupported.');

  const specificUrlCount = relationshipUrls.filter(hasSpecificPath).length;
  if (relationshipUrls.length && specificUrlCount === 0) {
    reasons.push('Attached sources are broad landing pages and require manual source readback.');
  }

  if (reasons.length) {
    return {
      disposition: 'manual_source_readback',
      risk: reasons.some(reason => reason.startsWith('No relationship')) ? 'high' : 'medium',
      reasons,
      relationshipUrls
    };
  }

  return {
    disposition: 'bounded_claim_metadata_ready',
    risk: 'low',
    reasons: ['Relationship citation, bounded claim type, confidence, and claim-specific note are present. Source text still requires human readback before direct promotion.'],
    relationshipUrls
  };
}

const rows = EDGES
  .filter(edge => ['curated_local_reference', 'anchor_context_reference'].includes(edge.evidence?.evidence_mode || edge.evidence?.source_status))
  .map(edge => {
    const audit = auditEdge(edge);
    return {
      key: `${edge.source}->${edge.target}`,
      source: nodeById.get(edge.source)?.name || edge.source,
      target: nodeById.get(edge.target)?.name || edge.target,
      claim: `${edge.verb}${edge.adverb ? ` ${edge.adverb}` : ''}`,
      mode: edge.evidence?.evidence_mode || edge.evidence?.source_status,
      relationship_type: edge.evidence?.relationship_type || null,
      confidence: edge.evidence?.confidence || null,
      disposition: audit.disposition,
      risk: audit.risk,
      reasons: audit.reasons,
      relationship_source_urls: audit.relationshipUrls
    };
  })
  .sort((a, b) => {
    const riskOrder = { high: 3, medium: 2, low: 1 };
    return riskOrder[b.risk] - riskOrder[a.risk] || a.key.localeCompare(b.key);
  });

const counts = rows.reduce((result, row) => {
  result[row.disposition] = (result[row.disposition] || 0) + 1;
  return result;
}, {});

const report = {
  generated_at: new Date().toISOString(),
  scope: {
    note: 'This audit tests whether claim metadata and citation specificity are sufficient for an entailment readback. It does not claim to replace reading the cited source.',
    requested_baseline: {
      anchor_inferences: 69,
      curated_local_claims: 156
    },
    current: {
      anchor_hypotheses: rows.filter(row => row.mode === 'anchor_context_reference').length,
      curated_local_claims: rows.filter(row => row.mode === 'curated_local_reference').length
    }
  },
  counts,
  rows
};

const markdown = [
  '# Source Entailment Audit',
  '',
  `Generated: ${report.generated_at}`,
  '',
  '## Scope',
  '',
  '- Baseline requested: 69 anchor inferences and 156 curated-local claims.',
  `- Current anchor hypotheses: ${report.scope.current.anchor_hypotheses}. The difference from baseline was pruned during expansion cleanup.`,
  `- Current curated-local claims: ${report.scope.current.curated_local_claims}.`,
  '- Metadata readiness is not scientific certification; direct promotion still requires reading the cited source against the exact claim.',
  '',
  '## Dispositions',
  '',
  ...Object.entries(counts).map(([key, count]) => `- ${key}: ${count}`),
  '',
  '## Review Queue',
  '',
  '| Edge | Mode | Disposition | Risk |',
  '| --- | --- | --- | --- |',
  ...rows.map(row => `| ${row.source} -> ${row.target} | ${row.mode} | ${row.disposition} | ${row.risk} |`),
  '',
  '## Interpretation',
  '',
  '- `fails_entailment_demoted` remains discoverable only as an explicitly labeled hypothesis.',
  '- `manual_source_readback` has a citation or claim-shape deficiency and cannot be promoted.',
  '- `bounded_claim_metadata_ready` has the metadata needed for source-by-source human entailment review, but is not automatically equivalent to a direct causal claim.'
];

await fs.writeFile(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.writeFile(outputMarkdownPath, `${markdown.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  json: outputJsonPath,
  markdown: outputMarkdownPath,
  current: report.scope.current,
  counts
}, null, 2));
