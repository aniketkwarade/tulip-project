// Candidate *mapping mechanism*, not a calibrated TULIP method. Anchor
// magnitudes must be set and challenged independently of current node scores.
import { mapFixedBenchmarkMagnitude, roundBenchmarkDisplay,
  validateFixedBenchmarkPoints } from './tulip-fixed-benchmark-map.js';
const finiteNonnegative = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;

export function validateAbsoluteBurdenAnchors(anchors) {
  const reasons = [];
  if (!anchors || typeof anchors.version !== 'string' || !anchors.version.trim()) reasons.push('anchor_version_missing');
  if (anchors?.domain !== 'human' || anchors?.outcomeKind !== 'attributable_dalys'
    || anchors?.unit !== 'DALY') reasons.push('anchor_outcome_or_unit_mismatch');
  if (anchors?.reportingPeriodBasis !== 'single_calendar_year_estimate') reasons.push('anchor_reporting_period_basis_mismatch');
  if (anchors?.basis !== 'fixed_absolute_burden') reasons.push('catalogue_relative_anchors_forbidden');
  reasons.push(...validateFixedBenchmarkPoints(anchors?.points));
  return reasons;
}

export function mapDalyBurdenWithFixedAnchors(endpoint, anchors) {
  const reasons = validateAbsoluteBurdenAnchors(anchors);
  if (endpoint?.status !== 'source_bound_endpoint' || endpoint.domain !== 'human'
    || endpoint.outcomeKind !== 'attributable_dalys' || endpoint.unit !== 'DALY') {
    reasons.push('compatible_source_bound_endpoint_required');
  }
  if (endpoint?.reportingPeriodBasis !== anchors?.reportingPeriodBasis) reasons.push('endpoint_reporting_period_basis_mismatch');
  const burden = endpoint?.burden;
  if (!burden || !finiteNonnegative(burden.lower) || !finiteNonnegative(burden.central)
    || !finiteNonnegative(burden.upper) || burden.lower > burden.central
    || burden.central > burden.upper) reasons.push('compatible_burden_interval_required');
  if (reasons.length) return { status: 'needs_calibration', value: null, reasons };
  const unrounded = Object.fromEntries(['lower', 'central', 'upper'].map(key =>
    [key, mapFixedBenchmarkMagnitude(burden[key], anchors.points)]));
  if (Object.values(unrounded).some(value => value === null)) {
    return { status: 'needs_calibration', value: null, reasons: ['benchmark_mapping_not_resolvable'] };
  }
  return {
    status: 'experimental_candidate',
    value: roundBenchmarkDisplay(unrounded.central),
    unrounded,
    interval: { lower: roundBenchmarkDisplay(unrounded.lower), upper: roundBenchmarkDisplay(unrounded.upper),
      kind: 'source_interval_transformed_by_fixed_monotone_map' },
    anchorVersion: anchors.version,
    anchorDefinition: anchors.points.map(point => ({ score: point.score, burden: point.burden })),
    nodeId: endpoint.nodeId,
    source: endpoint.source,
    publicReady: false,
    limitations: 'The mapping mechanism is deterministic and catalogue-independent; its anchor magnitudes need independent calibration and cannot yet support a public TULIP rating.',
    reasons: [],
  };
}
