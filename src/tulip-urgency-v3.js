import { calculateComposite, compositeToTulipScore } from './tulip-urgency-v2.js';

export const TULIP_URGENCY_METHOD_VERSION_V3 = 'tulip_urgency_v3';
export const TULIP_URGENCY_CALCULATION_VERSION = 'tulip_urgency_v2';
export const TULIP_URGENCY_BAND_VERSION = 'tulip_urgency_bands_v3_2026_08';

export const TULIP_URGENCY_BANDS_V3 = Object.freeze([
  Object.freeze({ label: 'Low Concern', min: 1.0, max: 4.9 }),
  Object.freeze({ label: 'Elevated', min: 5.0, max: 6.9 }),
  Object.freeze({ label: 'Concerning', min: 7.0, max: 7.5 }),
  Object.freeze({ label: 'High Risk', min: 7.6, max: 8.1 }),
  Object.freeze({ label: 'Severe', min: 8.2, max: 8.6 }),
  Object.freeze({ label: 'Critical', min: 8.7, max: 9.2 }),
  Object.freeze({ label: 'Extreme', min: 9.3, max: 10.0 })
]);

export const TULIP_URGENCY_COMPONENTS = Object.freeze({
  current_data: Object.freeze([
    Object.freeze({ key: 'magnitude', label: 'Magnitude', description: 'How large the measured condition is relative to its reviewed anchors.' }),
    Object.freeze({ key: 'threshold', label: 'Threshold proximity', description: 'How close the measured condition is to a reviewed dangerous level.' }),
    Object.freeze({ key: 'momentum', label: 'Momentum', description: 'How strongly the measured condition is worsening or accelerating.' }),
    Object.freeze({ key: 'extent', label: 'Extent', description: 'How widely the measured condition applies within its declared scope.' })
  ]),
  impact_fallback: Object.freeze([
    Object.freeze({ key: 'biophysical_burden', label: 'Biophysical burden', description: 'The normalized ecological or physical burden in the evidence record.' }),
    Object.freeze({ key: 'human_economic_burden', label: 'Human and economic burden', description: 'The normalized burden on people, infrastructure, or economic systems.' }),
    Object.freeze({ key: 'persistence', label: 'Persistence', description: 'How long the documented burden persists or accumulates.' }),
    Object.freeze({ key: 'extent', label: 'Extent', description: 'How widely the documented burden applies within its declared scope.' })
  ]),
  modeled: Object.freeze([
    Object.freeze({ key: 'modeled_estimate', label: 'Modeled estimate', description: 'The model output used by the fallback receipt; changing it is not an evidence-backed forecast.' })
  ])
});

function assertFiniteScore(score) {
  if (!Number.isFinite(score)) throw new TypeError('score must be a finite number');
  if (score < 1 || score > 10) throw new RangeError('score must be between 1 and 10');
}

export function getTulipUrgencyBandV3(score) {
  assertFiniteScore(score);
  return TULIP_URGENCY_BANDS_V3.find(({ min, max }) => score >= min && score <= max)?.label ?? 'Extreme';
}

export function getTulipUrgencyComponentDefinitions(method) {
  return TULIP_URGENCY_COMPONENTS[method] ?? null;
}

export function calculateTulipSensitivity(receipt, componentValues) {
  if (!receipt || !['current_data', 'impact_fallback', 'modeled'].includes(receipt.method)) {
    throw new TypeError('a supported TULIP urgency receipt is required');
  }
  const definitions = getTulipUrgencyComponentDefinitions(receipt.method);
  if (!componentValues || typeof componentValues !== 'object') {
    throw new TypeError('component values are required');
  }
  const expectedKeys = definitions.map(({ key }) => key);
  const suppliedKeys = Object.keys(componentValues);
  const unexpected = suppliedKeys.filter(key => !expectedKeys.includes(key));
  if (unexpected.length) throw new TypeError(`Unexpected sensitivity components: ${unexpected.join(', ')}`);
  const missing = expectedKeys.filter(key => !Number.isFinite(componentValues[key]));
  if (missing.length) throw new TypeError(`Missing sensitivity components: ${missing.join(', ')}`);
  const outOfRange = expectedKeys.filter(key => componentValues[key] < 0 || componentValues[key] > 1);
  if (outOfRange.length) throw new RangeError(`Sensitivity components must be between 0 and 1: ${outOfRange.join(', ')}`);

  const components = Object.fromEntries(expectedKeys.map(key => [key, componentValues[key]]));
  const composite = calculateComposite(receipt.method, components);
  const value = compositeToTulipScore(composite);
  return {
    value,
    band: getTulipUrgencyBandV3(value),
    delta: Number((value - receipt.value).toFixed(1)),
    method: receipt.method,
    components
  };
}
