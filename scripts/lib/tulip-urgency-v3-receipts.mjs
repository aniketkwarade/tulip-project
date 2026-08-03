import crypto from 'node:crypto';
import {
  calculateComposite,
  compositeToTulipScore,
  stableStringify
} from '../../src/tulip-urgency-v2.js';
import {
  TULIP_URGENCY_BAND_VERSION,
  TULIP_URGENCY_CALCULATION_VERSION,
  TULIP_URGENCY_METHOD_VERSION_V3,
  getTulipUrgencyBandV3
} from '../../src/tulip-urgency-v3.js';

export const TULIP_URGENCY_RECEIPT_SCHEMA_VERSION = '3.2.0';
export const SCIENTIFIC_REVIEW_CHECKS = Object.freeze([
  'measurement_suitability',
  'anchor_provenance',
  'transformation_correctness',
  'method_eligibility',
  'source_entailment',
  'source_currency'
]);

function inferTransformationComponents(receipt, transformation, index) {
  const componentKeys = Object.keys(receipt.components ?? {});
  if (Array.isArray(transformation.components)) {
    return transformation.components.filter(component => componentKeys.includes(component));
  }
  if (componentKeys.includes(transformation.component)) return [transformation.component];
  if (transformation.indicator_id) {
    const rawEntry = Object.entries(receipt.raw_inputs ?? {})
      .find(([, input]) => input?.id === transformation.indicator_id);
    if (rawEntry && componentKeys.includes(rawEntry[0])) return [rawEntry[0]];
  }

  const description = `${transformation.type ?? ''} ${transformation.formula ?? ''}`.toLowerCase();
  const inferred = new Set();
  if (description.includes('magnitude')) inferred.add('magnitude');
  if (description.includes('threshold')) inferred.add('threshold');
  if (/momentum|change|increase|decline|acceleration|deterioration/.test(description)) inferred.add('momentum');
  if (/extent|coverage|breadth|domain|area|country|region|global reporting/.test(description)) inferred.add('extent');
  const validInferred = [...inferred].filter(component => componentKeys.includes(component));
  if (validInferred.length) return validInferred;
  if ((receipt.transformations ?? []).length === componentKeys.length && componentKeys[index]) return [componentKeys[index]];
  return componentKeys;
}

function nestedValuesForKey(value, key, results = []) {
  if (!value || typeof value !== 'object') return results;
  if (!Array.isArray(value) && value[key] != null) results.push(value[key]);
  for (const child of Object.values(value)) nestedValuesForKey(child, key, results);
  return results;
}

function componentRawInputs(receipt, components) {
  return Object.fromEntries(components.map(component => [component, receipt.raw_inputs?.[component] ?? null]));
}

function buildTransformationAssurance(receipt, review = null) {
  const transformationReviews = new Map((review?.assurance?.transformation_reviews ?? [])
    .map(item => [item.transformation_ref, item]));
  return (receipt.transformations ?? []).map((transformation, index) => {
    const indicatorId = transformation.indicator_id ?? `${receipt.node_id}_transformation_${index + 1}`;
    const transformationRef = `${receipt.node_id}:${indicatorId}:v1`;
    const appliedComponents = inferTransformationComponents(receipt, transformation, index);
    const rawInputs = componentRawInputs(receipt, appliedComponents);
    const units = [...new Set(nestedValuesForKey(rawInputs, 'unit').filter(value => typeof value === 'string'))];
    const rawAnchors = nestedValuesForKey(rawInputs, 'anchors').filter(Array.isArray);
    const anchorValues = transformation.anchors ?? (rawAnchors.length === 1 ? rawAnchors[0] : rawAnchors.length ? rawAnchors : null);
    const sourceLocators = [...new Set(nestedValuesForKey(rawInputs, 'source_locator')
      .filter(value => typeof value === 'string'))];
    const reviewed = transformationReviews.get(transformationRef);
    return {
      transformation_ref: transformationRef,
      anchor_set_ref: anchorValues ? `${receipt.node_id}:${indicatorId}:anchors:v1` : null,
      indicator_id: indicatorId,
      component: appliedComponents.length === 1 ? appliedComponents[0] : null,
      applies_to_components: appliedComponents,
      type: transformation.type ?? 'declared_transformation',
      units: reviewed?.units ?? (units.length ? units : ['source-native; see raw_inputs']),
      direction: reviewed?.direction ?? transformation.direction ?? 'higher_normalized_value_is_more_urgent',
      anchor_values: reviewed?.anchor_values ?? anchorValues,
      parameters: transformation,
      rationale: reviewed?.rationale ?? transformation.rationale ?? transformation.formula
        ?? 'Declared transformation retained verbatim; scientific approval is pending.',
      citations: reviewed?.citations ?? [...new Set(receipt.source_ids ?? [])],
      source_locators: reviewed?.source_locators ?? sourceLocators,
      test_fixtures: appliedComponents.map(component => ({
        component,
        raw_input: receipt.raw_inputs?.[component] ?? null,
        expected_component: Number.isFinite(receipt.components?.[component]) ? receipt.components[component] : null
      })),
      review_evidence: reviewed?.review_evidence ?? null,
      approval: reviewed?.approval ?? {
        status: 'pending',
        reviewed_by: null,
        reviewed_at: null,
        reviewer_type: null
      }
    };
  });
}

function buildMethodSelection(receipt, review = null) {
  const failures = receipt.selection_reason?.higher_priority_failures ?? [];
  const selected = receipt.method;
  return {
    priority_order: ['current_data', 'impact_fallback', 'modeled'],
    selected_method: selected,
    candidates: {
      current_data: {
        status: selected === 'current_data' ? 'passed' : 'failed',
        selected: selected === 'current_data',
        reasons: selected === 'current_data' ? [] : failures.slice(0, 1)
      },
      impact_fallback: {
        status: selected === 'current_data' ? 'not_evaluated_after_higher_priority_passed'
          : selected === 'impact_fallback' ? 'passed' : 'failed',
        selected: selected === 'impact_fallback',
        reasons: selected === 'modeled' ? failures.slice(1, 2) : []
      },
      modeled: {
        status: selected === 'modeled' ? 'passed' : 'not_needed',
        selected: selected === 'modeled',
        reasons: []
      }
    },
    decision_summary: receipt.selection_reason?.selected_method_passed ?? null,
    review_status: review?.assurance?.method_selection_review?.status ?? 'pending_scientific_eligibility_review',
    review_evidence: review?.assurance?.method_selection_review?.evidence ?? null
  };
}

function buildSourceAssertions(receipt, review = null) {
  if (Array.isArray(review?.assurance?.source_assertion_reviews)) {
    return review.assurance.source_assertion_reviews;
  }
  return (receipt.source_ids ?? []).map(sourceId => ({
    source_id: sourceId,
    claim: receipt.selection_reason?.selected_method_passed ?? 'Source supports the quantitative inputs declared in this receipt.',
    locator: null,
    retrieved_at: receipt.as_of,
    source_currency_status: 'pending_review',
    entailment_status: 'pending_human_readback'
  }));
}

export function tulipUrgencyV3ContentPayload(receipt) {
  return {
    receipt_schema_version: receipt.receipt_schema_version,
    node_id: receipt.node_id,
    method_version: receipt.method_version,
    calculation_version: receipt.calculation_version,
    band_version: receipt.band_version,
    method: receipt.method,
    ...(receipt.model_version ? { model_version: receipt.model_version } : {}),
    as_of: receipt.as_of,
    components: receipt.components,
    raw_inputs: receipt.raw_inputs,
    transformations: receipt.transformations,
    transformation_assurance: receipt.transformation_assurance,
    source_ids: receipt.source_ids,
    source_assertions: receipt.source_assertions,
    uncertainty: receipt.uncertainty,
    freshness: receipt.freshness,
    selection_reason: receipt.selection_reason,
    method_selection: receipt.method_selection
  };
}

export function hashTulipUrgencyV3Content(receipt) {
  return `sha256:${crypto.createHash('sha256').update(stableStringify(tulipUrgencyV3ContentPayload(receipt))).digest('hex')}`;
}

function defaultReview() {
  return {
    status: 'pending',
    reviewed_content_hash: null,
    reviewed_by: [],
    reviewed_at: null,
    next_review_at: null,
    checks: Object.fromEntries(SCIENTIFIC_REVIEW_CHECKS.map(check => [check, 'pending'])),
    notes: 'Scientific review has not yet been completed. Computational validity does not establish scientific correctness.'
  };
}

function normalizeScientificReview(review, contentHash, now) {
  const { assurance: _assurance, ...reviewState } = review ?? {};
  const normalized = { ...defaultReview(), ...reviewState };
  normalized.reviewed_by = Array.isArray(normalized.reviewed_by) ? normalized.reviewed_by : [];
  normalized.checks = { ...defaultReview().checks, ...(normalized.checks ?? {}) };
  const allChecksPass = SCIENTIFIC_REVIEW_CHECKS.every(check => normalized.checks[check] === 'pass');
  const hashMatches = normalized.reviewed_content_hash === contentHash;
  const nextReview = normalized.next_review_at ? new Date(normalized.next_review_at) : null;
  const dateIsValid = nextReview ? !Number.isNaN(nextReview.getTime()) : false;
  const pastDue = dateIsValid && nextReview.getTime() < now.getTime();
  const approvalComplete = normalized.reviewed_by.length > 0 && normalized.reviewed_at && dateIsValid && allChecksPass;

  if (normalized.status === 'approved' && (!approvalComplete || !hashMatches || pastDue)) {
    normalized.status = 'stale';
    normalized.notes = pastDue
      ? 'The per-receipt scientific review date has passed.'
      : 'The approved scientific review no longer matches the current receipt content or is incomplete.';
  }
  return normalized;
}

export function upgradeTulipUrgencyReceiptV3(v2Receipt, review = null, now = new Date()) {
  const upgraded = {
    ...v2Receipt,
    receipt_schema_version: TULIP_URGENCY_RECEIPT_SCHEMA_VERSION,
    method_version: TULIP_URGENCY_METHOD_VERSION_V3,
    calculation_version: TULIP_URGENCY_CALCULATION_VERSION,
    band_version: TULIP_URGENCY_BAND_VERSION,
    band: getTulipUrgencyBandV3(v2Receipt.value),
    legacy_input_hash: v2Receipt.input_hash,
    transformation_assurance: buildTransformationAssurance(v2Receipt, review),
    source_assertions: buildSourceAssertions(v2Receipt, review),
    method_selection: buildMethodSelection(v2Receipt, review)
  };
  delete upgraded.input_hash;
  upgraded.content_hash = hashTulipUrgencyV3Content(upgraded);
  upgraded.scientific_review = normalizeScientificReview(review, upgraded.content_hash, now);
  return upgraded;
}

export function verifyTulipUrgencyReceiptV3(receipt, now = new Date()) {
  const expectedValue = compositeToTulipScore(calculateComposite(receipt.method, receipt.components));
  const expectedBand = getTulipUrgencyBandV3(expectedValue);
  const expectedContentHash = hashTulipUrgencyV3Content(receipt);
  const checks = {
    score_reproduces: expectedValue === receipt.value,
    band_reproduces: expectedBand === receipt.band,
    content_hash_matches: expectedContentHash === receipt.content_hash
  };
  const computationallyValid = Object.values(checks).every(Boolean);
  const review = normalizeScientificReview(receipt.scientific_review, expectedContentHash, now);
  const scientificReviewCurrent = computationallyValid && review.status === 'approved';
  return {
    valid: computationallyValid,
    computationally_valid: computationallyValid,
    scientific_review_current: scientificReviewCurrent,
    checks,
    expected_value: expectedValue,
    expected_band: expectedBand,
    expected_content_hash: expectedContentHash,
    effective_scientific_review_status: review.status,
    validity_boundary: 'Computational validity does not certify measurement correctness, anchor appropriateness, transformation validity, method eligibility, or continuing source support.'
  };
}
