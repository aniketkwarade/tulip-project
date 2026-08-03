export const TULIP_URGENCY_METHOD_VERSION = 'tulip_urgency_v2';

export const TULIP_URGENCY_WEIGHTS = Object.freeze({
  current_data: Object.freeze({
    magnitude: 0.30,
    threshold: 0.30,
    momentum: 0.25,
    extent: 0.15
  }),
  impact_fallback: Object.freeze({
    biophysical_burden: 0.35,
    human_economic_burden: 0.30,
    persistence: 0.20,
    extent: 0.15
  })
});

export const TULIP_URGENCY_BANDS = Object.freeze([
  Object.freeze({ label: 'Low', min: 1.0, max: 2.9 }),
  Object.freeze({ label: 'Elevated', min: 3.0, max: 4.9 }),
  Object.freeze({ label: 'Rising', min: 5.0, max: 6.9 }),
  Object.freeze({ label: 'Critical', min: 7.0, max: 10.0 })
]);

const NORMALIZED_ANCHORS = Object.freeze([0, 0.33, 0.67, 1]);

function assertFiniteNumber(value, label) {
  if (!Number.isFinite(value)) throw new TypeError(`${label} must be a finite number`);
}

export function clamp01(value) {
  assertFiniteNumber(value, 'normalized value');
  return Math.max(0, Math.min(1, value));
}

export function getTulipUrgencyBand(score) {
  assertFiniteNumber(score, 'score');
  if (score < 1 || score > 10) throw new RangeError('score must be between 1 and 10');
  return TULIP_URGENCY_BANDS.find(({ min, max }) => score >= min && score <= max)?.label ?? 'Critical';
}

/** Piecewise-linear normalization through reference, concerning, critical and extreme anchors. */
export function normalizeWithAnchors(value, anchors, direction = 'higher_is_worse') {
  assertFiniteNumber(value, 'indicator value');
  if (!Array.isArray(anchors) || anchors.length !== 4 || anchors.some(anchor => !Number.isFinite(anchor))) {
    throw new TypeError('anchors must contain four finite numbers');
  }
  if (direction !== 'higher_is_worse' && direction !== 'lower_is_worse') {
    throw new TypeError('direction must be higher_is_worse or lower_is_worse');
  }
  const transformedValue = direction === 'lower_is_worse' ? -value : value;
  const transformedAnchors = direction === 'lower_is_worse' ? anchors.map(anchor => -anchor) : [...anchors];
  if (transformedAnchors.some((anchor, index) => index > 0 && anchor <= transformedAnchors[index - 1])) {
    throw new RangeError('anchors must progress monotonically in the stated direction');
  }
  if (transformedValue <= transformedAnchors[0]) return 0;
  if (transformedValue >= transformedAnchors[3]) return 1;
  for (let index = 0; index < 3; index += 1) {
    const low = transformedAnchors[index];
    const high = transformedAnchors[index + 1];
    if (transformedValue <= high) {
      const fraction = (transformedValue - low) / (high - low);
      return NORMALIZED_ANCHORS[index] + fraction * (NORMALIZED_ANCHORS[index + 1] - NORMALIZED_ANCHORS[index]);
    }
  }
  return 1;
}

function quantile(sorted, probability) {
  const position = (sorted.length - 1) * probability;
  const lower = Math.floor(position);
  const fraction = position - lower;
  return sorted[lower] + (sorted[Math.min(lower + 1, sorted.length - 1)] - sorted[lower]) * fraction;
}

export function historicalDistributionAnchors(observations, cadence = 'annual') {
  const minimum = cadence === 'monthly' ? 60 : 20;
  if (cadence !== 'annual' && cadence !== 'monthly') throw new TypeError('cadence must be annual or monthly');
  const complete = observations.filter(Number.isFinite).sort((a, b) => a - b);
  if (complete.length < minimum) return null;
  return [0.5, 0.75, 0.9, 0.975].map(probability => quantile(complete, probability));
}

export function calculateComposite(method, components, weightsOverride = null) {
  if (method === 'modeled') {
    assertFiniteNumber(components.modeled_estimate, 'modeled_estimate');
    return clamp01(components.modeled_estimate);
  }
  const weights = weightsOverride ?? TULIP_URGENCY_WEIGHTS[method];
  if (!weights) throw new TypeError(`Unsupported TULIP urgency method: ${method}`);
  const componentKeys = Object.keys(weights);
  const missing = componentKeys.filter(key => !Number.isFinite(components[key]));
  if (missing.length) throw new TypeError(`Missing normalized components: ${missing.join(', ')}`);
  const weightTotal = componentKeys.reduce((sum, key) => sum + weights[key], 0);
  if (Math.abs(weightTotal - 1) > 1e-9) throw new RangeError('component weights must sum to 1');
  return clamp01(componentKeys.reduce((sum, key) => sum + clamp01(components[key]) * weights[key], 0));
}

export function compositeToTulipScore(composite) {
  return Number((1 + 9 * clamp01(composite)).toFixed(1));
}

export function qualifiesForCurrentData(candidate) {
  if (!candidate) return false;
  const direct = new Set(candidate.direct_components ?? []);
  const coverage = Object.entries(TULIP_URGENCY_WEIGHTS.current_data)
    .filter(([component]) => direct.has(component))
    .reduce((sum, [, weight]) => sum + weight, 0);
  return coverage >= 0.6 - Number.EPSILON
    && direct.has('magnitude')
    && (direct.has('threshold') || direct.has('momentum'))
    && candidate.global_scope === true
    && candidate.current_observation === true;
}

export function qualifiesForImpactFallback(candidate) {
  if (!candidate || candidate.quantitative_evidence !== true) return false;
  return Object.keys(TULIP_URGENCY_WEIGHTS.impact_fallback)
    .every(component => Number.isFinite(candidate.components?.[component]));
}

export function selectHighestUrgencyMethod(candidates) {
  if (qualifiesForCurrentData(candidates.current_data)) return 'current_data';
  if (qualifiesForImpactFallback(candidates.impact_fallback)) return 'impact_fallback';
  if (Number.isFinite(candidates.modeled?.components?.modeled_estimate)) return 'modeled';
  throw new Error('No TULIP urgency method passes its coverage gate');
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonicalize(value[key])]));
  }
  return value;
}

export function stableStringify(value) {
  return JSON.stringify(canonicalize(value));
}

export function hashTulipInputs(value) {
  const text = stableStringify(value);
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export function buildTulipUrgencyReceipt({
  node_id,
  method,
  as_of,
  components,
  raw_inputs,
  transformations,
  source_ids,
  uncertainty,
  freshness,
  selection_reason,
  model_version = null
}) {
  if (!node_id || !as_of) throw new TypeError('node_id and as_of are required');
  if (!['current_data', 'impact_fallback', 'modeled'].includes(method)) throw new TypeError('invalid method');
  if (method === 'modeled' && !model_version) throw new TypeError('modeled receipts require a named model_version');
  if (method !== 'modeled' && (!Array.isArray(source_ids) || source_ids.length === 0)) {
    throw new TypeError('non-modeled receipts require quantitative source_ids');
  }
  const composite = calculateComposite(method, components);
  const value = compositeToTulipScore(composite);
  const receiptInputs = {
    method_version: TULIP_URGENCY_METHOD_VERSION,
    method,
    ...(model_version ? { model_version } : {}),
    as_of,
    components,
    raw_inputs,
    transformations,
    source_ids,
    uncertainty,
    freshness
  };
  return {
    node_id,
    value,
    band: getTulipUrgencyBand(value),
    method,
    method_version: TULIP_URGENCY_METHOD_VERSION,
    ...(model_version ? { model_version } : {}),
    as_of,
    components,
    raw_inputs,
    transformations,
    source_ids,
    uncertainty,
    freshness,
    selection_reason,
    input_hash: hashTulipInputs(receiptInputs)
  };
}

export function verifyTulipUrgencyReceipt(receipt) {
  const { input_hash, node_id: _nodeId, value, band, selection_reason: _reason, ...receiptInputs } = receipt;
  const expectedValue = compositeToTulipScore(calculateComposite(receipt.method, receipt.components));
  return {
    valid: expectedValue === value
      && getTulipUrgencyBand(expectedValue) === band
      && hashTulipInputs(receiptInputs) === input_hash,
    expected_value: expectedValue,
    expected_band: getTulipUrgencyBand(expectedValue),
    expected_input_hash: hashTulipInputs(receiptInputs)
  };
}
