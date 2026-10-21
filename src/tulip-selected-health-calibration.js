// The internal choice of a ruler is distinct from admitting a complete node.
// Keep the historical candidate intact and use its exact, fixed quantities.
import choices from '../docs/tulip-calibration/calibration-decisions-2026-09-28.json' with { type: 'json' };
import anchors from '../docs/tulip-calibration/human-health-anchor-candidate.json' with { type: 'json' };
import { mapDalyBurdenWithFixedAnchors } from './tulip-burden-scale-experiment.js';

const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};
const decision = freeze(structuredClone(choices));
const fixed = freeze(structuredClone(anchors));
if (decision.humanHealth.anchorVersion !== fixed.version
  || decision.humanHealth.outerBenchmarkDalys !== fixed.points.at(-1).burden
  || decision.humanHealth.sourceWorkbookSha256 !== fixed.sourceWorkbookSha256
  || decision.humanHealth.interpolation !== 'piecewise_log1p_canonical_unit'
  || decision.humanHealth.logOffsetDalys !== 1
  || !decision.humanHealth.internalNumericalBenchmarkChoiceClosed
  || decision.publication.wholeMethodCalibrated !== false
  || fixed.points.some(point => point.score > 1 && point.score < 10
    && decision.humanHealth.middleBenchmarks[point.score] !== point.burden)) {
  throw new Error('selected_health_benchmark_definition_mismatch');
}

export const SELECTED_HEALTH_CALIBRATION_DECISION_VERSION = decision.version;

// No packet-level thresholds, curve parameter or other-domain fallback.
export function mapSelectedHealthEndpoint(endpoint) {
  const result = mapDalyBurdenWithFixedAnchors(endpoint, fixed);
  return {
    ...result,
    calibrationDecisionVersion: decision.version,
    internalBenchmarkChoice: decision.humanHealth.decision,
    wholeNodeScore: null,
    publicReady: false,
    limitations: 'Fixed TULIP health benchmarks selected internally. This is an endpoint diagnostic, not proof of complete human or ecosystem coverage, empirical validity of the source model, independent scientific review, or admission of a replacement public score.',
  };
}

export function selectedHealthCalibrationDefinition() {
  return {
    ...structuredClone(fixed),
    internalSelectionDecisionVersion: decision.version,
    logOffset: decision.humanHealth.logOffsetDalys,
    interpolation: decision.humanHealth.interpolation,
    inputUnits: { DALY: 1, thousand_DALYs: 1000 },
  };
}
