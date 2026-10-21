import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { PUBLISHED_NODES } from '../../src/data.js';
import { canonicalJSON } from '../../src/tulip-assessment-core.js';
import SCORE_METHOD_COPY from '../../src/tulip-legacy-score-method.json' with { type: 'json' };
import { resolveAssessmentSourceBasis, validateContinuityArchive, verifyRetainedAssessment } from './tulip-assessment-continuity.mjs';
import { requireCatalogueConsequenceRoutes } from './tulip-consequence-route-contract.mjs';
import {
  INTERNAL_AXIS_WEIGHTS,
  INTERNAL_CALIBRATION_VERSION,
  INTERNAL_CONFIDENCE,
  INTERNAL_HISTORY_STANDARD,
} from '../../src/tulip-internal-calibration.js';

export const digest = value => createHash('sha256').update(value).digest('hex');
export const receiptDigest = value => digest(canonicalJSON(value ?? null));

const round1 = value => Math.round((value + 1e-9) * 10) / 10;
const PUBLIC_CONFIDENCE = Object.freeze({ A: 'high', B: 'supported', C: 'limited', D: 'provisional' });

function publicConfidence(value) {
  return PUBLIC_CONFIDENCE[value] ?? value ?? null;
}

function publicComponents(components = {}) {
  return Object.fromEntries(Object.entries(components).map(([key, component]) => [
    key,
    component ? { ...component, confidence: publicConfidence(component.confidence) } : null,
  ]));
}

function publicOutlook(outlook) {
  if (!outlook) return outlook;
  return {
    ...outlook,
    confidence: publicConfidence(outlook.confidence),
    basis: String(outlook.basis ?? '').replace(/\bcurrent grade\b/gi, 'current score'),
  };
}

function candidateEvidenceIds(candidate) {
  return [...new Set([
    ...(candidate.history?.evidenceReferences ?? []),
    ...(candidate.outlook?.evidenceReferences ?? []),
    ...Object.values(candidate.components ?? {}).flatMap(component => component.evidenceReferences ?? []),
  ])];
}

function receiptReferences(receipt) {
  return new Map((receipt?.source_assertions ?? []).flatMap(source => {
    const url = (source.locator ?? '').match(/https:\/\/[^\s|]+/)?.[0];
    return url ? [[source.source_id, {
      id: source.source_id,
      label: source.source_id.replaceAll('_', ' '),
      url,
      locator: source.locator,
    }]] : [];
  }));
}

function supplementReference(source) {
  const url = source?.url ?? source?.doiUrl ?? source?.sourceUrl;
  if (!url || !/^https:\/\//.test(url)) return null;
  return {
    id: source.id,
    label: source.title ?? source.publisher ?? source.id.replaceAll('_', ' '),
    url,
    locator: source.locator ?? url,
  };
}

function assessmentSensitivity(result, candidate) {
  const activeDomains = candidate.applicableDomains;
  const weightCases = activeDomains.length === 2
    ? [0.3, 0.5, 0.7].map(humanWeight => ({
      humanWeight,
      value: round1(1 + 9 * (
        humanWeight * result.components.human.central
        + (1 - humanWeight) * result.components.ecosystem.central
      )),
    }))
    : [];
  return {
    status: 'assessed',
    scoreRange: { lower: result.uncertainty.lower, upper: result.uncertainty.upper },
    rangeWidth: round1(result.uncertainty.upper - result.uncertainty.lower),
    weightCases,
    note: weightCases.length
      ? 'The weight cases test people/nature emphasis only; they are not alternative probability forecasts.'
      : 'This topic has one applicable harm domain, so people/nature weight sensitivity does not apply.',
  };
}

function evidencePeriod(window) {
  return window.start === window.end ? String(window.end) : `${window.start}–${window.end}`;
}

function pilotFinding(review, receipt) {
  return review ? {
    kind: 'historical_pilot_review',
    reviewedOn: review.reviewed_on,
    inputsUnchanged: review.receipt_sha256 === receiptDigest(receipt),
    status: review.criticality_status,
    limitation: review.main_pitfall,
    nextStep: review.method_needed,
  } : null;
}

export async function buildHistoricalTulipAssessments(root) {
  const readJSON = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const [archive, pilot, policy, catalogue, supplements, continuity, consequenceRoutes] = await Promise.all([
    readJSON('public/tulip-urgency-v3-scores.json'),
    readJSON('src/tulip-assessment-pilot.json'),
    readJSON('src/tulip-score-policy.json'),
    readJSON('artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json'),
    readJSON('artifacts/tulip-calibration-2026-09-22/internal-certainty-source-supplements.json'),
    readJSON('artifacts/tulip-consequence-rule-audit-2026-09-27/public-score-continuity.json'),
    readJSON('src/tulip-consequence-routes-v1.json'),
  ]);
  requireCatalogueConsequenceRoutes(PUBLISHED_NODES, consequenceRoutes);
  const receipts = new Map(archive.receipts.map(receipt => [receipt.node_id, receipt]));
  const pilotReviews = new Map(pilot.nodes.map(review => [review.node_id, review]));
  const issues = new Map(catalogue.issues.map(row => [row.nodeId, row]));
  const responses = new Map(catalogue.responses.map(row => [row.nodeId, row]));
  const supplementSources = new Map(supplements.sources.map(source => [source.id, source]));
  validateContinuityArchive(continuity, PUBLISHED_NODES);
  if (receipts.size !== archive.receipts.length
    || issues.size !== 354
    || responses.size !== 27
    || new Set(PUBLISHED_NODES.map(node => node.id)).size !== PUBLISHED_NODES.length) {
    throw new Error('Duplicate or incomplete assessment identity');
  }

  const records = Object.fromEntries(PUBLISHED_NODES.map(node => {
    const receipt = receipts.get(node.id);
    const archivedReferences = receiptReferences(receipt);
    let sourceDigest = receiptDigest({ receipt, metric: node.metric_contract, sources: node.source_urls, projectionInputs: [] });
    const horizon = policy.horizon;
    const review = pilotReviews.get(node.id);
    if (node.node_kind === 'response') {
      if (!responses.has(node.id)) throw new Error(`Missing response assessment: ${node.id}`);
      const references = [...archivedReferences.values()];
      return [node.id, {
        nodeId: node.id,
        nodeKind: 'response',
        version: INTERNAL_CALIBRATION_VERSION,
        value: null,
        status: 'not_applicable',
        label: 'Response',
        horizon,
        scenario: policy.scenario,
        geography: policy.geography,
        comparisonGroup: 'current_harm_at_assessment_cutoff',
        components: { human: null, ecosystem: null },
        uncertainty: null,
        confidence: null,
        reasons: [],
        evidenceReferences: references,
        explanation: 'This topic describes a response. Its benefits, costs and trade-offs are assessed against what would happen without it, so it does not receive a danger score.',
        sourceDigest,
        methodCopy: SCORE_METHOD_COPY,
        evidenceAudit: {
          kind: 'response_exclusion_control',
          metric: node.metric_contract?.metric_name ?? node.metric_contract?.id ?? node.name,
          sourceAsOf: receipt?.as_of ?? null,
          required: ['Intervention-specific benefits, costs and counterfactual; no danger score.'],
          pilotFinding: pilotFinding(review, receipt),
        },
        sensitivity: { status: 'not_applicable', reason: 'Response topics do not receive danger scores.' },
        scenarioChecks: [],
      }];
    }

    const row = issues.get(node.id);
    if (!row || row.result?.status !== 'internal_candidate' || !Number.isFinite(row.result.value)) {
      throw new Error(`Missing internally audited numerical candidate: ${node.id}`);
    }
    const { candidate, result } = row;
    const sourceBasis = resolveAssessmentSourceBasis({ node, receipt, row, policy, archive: continuity, fingerprint: receiptDigest });
    sourceDigest = sourceBasis.sourceDigest;
    if (candidate.sourceDigest !== sourceDigest || candidate.policyVersion !== policy.version
      || result.version !== INTERNAL_CALIBRATION_VERSION || result.reasons.length) {
      throw new Error(`Stale or invalid internally audited candidate: ${node.id}`);
    }
    const evidenceReferences = candidateEvidenceIds(candidate).map(id => {
      if (archivedReferences.has(id)) return archivedReferences.get(id);
      const reference = supplementReference(supplementSources.get(id));
      if (!reference) throw new Error(`Unresolved assessment source ${id}: ${node.id}`);
      return reference;
    });
    const period = evidencePeriod(candidate.currentWindow);
    return [node.id, verifyRetainedAssessment({
      nodeId: node.id,
      nodeKind: 'issue',
      version: INTERNAL_CALIBRATION_VERSION,
      assessmentBasis: 'current_harm',
      value: result.value,
      status: 'assessed',
      label: 'TULIP Score',
      horizon,
      scenario: policy.scenario,
      geography: candidate.geography,
      comparisonGroup: 'current_harm_at_assessment_cutoff',
      components: publicComponents(result.components),
      domainWeights: result.domainWeights,
      uncertainty: result.uncertainty,
      confidence: publicConfidence(result.confidence),
      reasons: [],
      currentWindow: candidate.currentWindow,
      referenceBasis: candidate.referenceBasis,
      outlook: publicOutlook(candidate.outlook),
      evidenceReferences,
      explanation: `Current harm for ${node.name} is assessed from ${period} evidence and scores ${result.value.toFixed(1)} out of 10 under TULIP's declared severity, reach and persistence rules. The separate ${candidate.outlook.horizon.start}–${candidate.outlook.horizon.end} ${candidate.outlook.scenario} outlook is ${candidate.outlook.direction} and does not change this rating.`,
      sourceDigest,
      methodCopy: SCORE_METHOD_COPY,
      evidenceAudit: {
        kind: 'internally_authored_current_harm_double_audit',
        metric: sourceBasis.metricContract?.metric_name ?? sourceBasis.metricContract?.id ?? node.name,
        sourceAsOf: receipt?.as_of ?? null,
        reuse: 'Source-native observations support the recorded current-harm axes only within their declared geography, period, denominator and causal boundary.',
        required: [candidate.history.limitations, candidate.causalAllocation?.limitations].filter(Boolean),
        pilotFinding: pilotFinding(review, receipt),
      },
      sensitivity: assessmentSensitivity(result, candidate),
      scenarioChecks: [{
        scenario: candidate.outlook.scenario,
        status: 'direction_only',
        direction: candidate.outlook.direction,
        reason: 'The outlook is reported separately and does not enter the current-harm score.',
      }],
    }, sourceBasis, receiptDigest)];
  }));

  const list = Object.values(records);
  const payload = {
    schemaVersion: 4,
    version: INTERNAL_CALIBRATION_VERSION,
    rollout: 'catalogue_wide_current_harm',
    policy: {
      version: INTERNAL_CALIBRATION_VERSION,
      label: 'TULIP Score',
      assessmentBasis: 'current_harm',
      currentEvidence: 'newest reliable evidence available for each node at the assessment cut-off',
      outlook: { horizon: policy.horizon, scenario: policy.scenario, changesCurrentScore: false },
      geography: policy.geography,
      domainWeights: policy.weights,
      axisWeights: INTERNAL_AXIS_WEIGHTS,
      scoreScale: { minimum: 1, maximum: 10, decimalPlaces: 1, direction: 'higher_means_greater_current_harm' },
      confidence: Object.fromEntries(Object.entries(INTERNAL_CONFIDENCE).map(([key, description]) => [PUBLIC_CONFIDENCE[key], description])),
      historyStandard: INTERNAL_HISTORY_STANDARD,
    },
    methodCopy: SCORE_METHOD_COPY,
    coverage: {
      total: list.length,
      assessed: list.filter(record => record.status === 'assessed').length,
      responses: list.filter(record => record.nodeKind === 'response').length,
      unscored: list.filter(record => record.nodeKind === 'issue' && record.value === null).length,
      internalAudit: 'complete_two_pass_catalogue_audit',
      rankings: 'available_for_all_issue_nodes',
      detailedEvidenceReviews: catalogue.catalogueReview?.counts?.detailedEvidenceReviews ?? null,
      structuredReviews: catalogue.catalogueReview?.counts?.blindStructuredReclassifications ?? null,
    },
    records,
  };
  const clean = JSON.parse(JSON.stringify(payload));
  return { ...clean, revision: `sha256:${digest(canonicalJSON(clean))}` };
}

// The active release is deliberate and catalogue-wide. No per-node fallback.
export async function buildTulipAssessments(root, options = {}) {
  const { buildCurrentTulipAssessments } = await import('./build-current-tulip-assessments.mjs');
  return buildCurrentTulipAssessments(root, options);
}
