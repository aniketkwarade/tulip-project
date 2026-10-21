// Source-native nature-side observation. Forest conversion area is not by
// itself a calibrated ecosystem-harm score or a complete node assessment.
import { REGISTERED_ECOSYSTEM_EXTENT_OBSERVATIONS } from './tulip-source-observation-registry.js';

export const ECOSYSTEM_EXTENT_VERSION = 'tulip_ecosystem_extent_2026_09_27_v1';

const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const positive = value => typeof value === 'number' && Number.isFinite(value) && value > 0;

export function evaluateForestConversionExtent(input) {
  const reasons = [];
  const source = input?.sourceObservation;
  const registered = Object.hasOwn(REGISTERED_ECOSYSTEM_EXTENT_OBSERVATIONS, input?.sourceId)
    ? REGISTERED_ECOSYSTEM_EXTENT_OBSERVATIONS[input.sourceId] : null;
  if (!registered) reasons.push('registered_source_row_required');
  if (registered && (!nonempty(registered.sourceVersion) || !nonempty(registered.sourceLocator)
    || !/^[a-f0-9]{64}$/.test(registered.sourceArtifactSha256 ?? ''))) {
    reasons.push('registered_source_provenance_missing');
  }
  if (input?.methodVersion !== ECOSYSTEM_EXTENT_VERSION) reasons.push('method_version_mismatch');
  if (!nonempty(input?.nodeId) || input?.nodeKind !== 'issue') reasons.push('issue_node_id_required');
  if (input?.domain !== 'ecosystem' || input?.coverage !== 'endpoint_only') reasons.push('ecosystem_endpoint_only_required');
  if (!nonempty(input?.sourceId) || !nonempty(input?.counterfactual)
    || !nonempty(input?.overlapReview)) reasons.push('source_counterfactual_or_overlap_missing');
  if (!source || source.sourceId !== input?.sourceId
    || !nonempty(source.sourceUrl) || !source.sourceUrl.startsWith('https://')) {
    reasons.push('source_reference_missing_or_mismatched');
  }
  for (const field of ['geography', 'ecosystemType', 'outcomeKind', 'reportingPeriodBasis']) {
    if (!nonempty(input?.[field]) || source?.[field] !== input?.[field]) reasons.push(`${field}_source_scope_mismatch`);
  }
  if (input?.outcomeKind !== 'forest_to_other_land_use_conversion_extent'
    || input?.reportingPeriodBasis !== 'mean_annual_rate_over_ten_elapsed_years'
    || source?.metricKind !== 'gross_deforestation') {
    reasons.push('gross_forest_conversion_endpoint_required');
  }
  const years = [input?.periodStartYear, input?.periodEndYear];
  if (!years.every(year => Number.isInteger(year)) || years[1] - years[0] !== 10
    || source?.periodStartYear !== years[0] || source?.periodEndYear !== years[1]) {
    reasons.push('ten_elapsed_year_period_mismatch');
  }
  if (source?.unit !== 'hectares_per_year' || !positive(source?.value)
    || !positive(source?.reportedResolution)
    || Math.abs(source.value - Math.round(source.value / source.reportedResolution)
      * source.reportedResolution) > Math.max(1e-6, source.reportedResolution * 1e-9)) {
    reasons.push('source_rate_unit_value_or_resolution_invalid');
  }
  if (source?.uncertaintyInterval !== null) reasons.push('unsupported_interval_claim');
  const sourceFields = ['sourceId', 'sourceUrl', 'geography', 'ecosystemType',
    'periodStartYear', 'periodEndYear', 'reportingPeriodBasis', 'metricKind',
    'outcomeKind', 'value', 'unit', 'reportedResolution', 'uncertaintyInterval'];
  if (registered && sourceFields.some(field => source?.[field] !== registered[field])) {
    reasons.push('candidate_source_row_differs_from_registry');
  }
  if (reasons.length) return { status: 'needs_source_native_extent', score: null, reasons };
  return {
    status: 'source_bound_extent_observation',
    methodVersion: ECOSYSTEM_EXTENT_VERSION,
    nodeId: input.nodeId,
    coverage: 'endpoint_only',
    domain: 'ecosystem',
    outcomeKind: input.outcomeKind,
    ecosystemType: input.ecosystemType,
    geography: input.geography,
    period: { startYear: years[0], endYear: years[1], elapsedYears: 10,
      basis: input.reportingPeriodBasis },
    rate: { value: source.value, unit: 'hectares_per_year',
      reportedResolution: source.reportedResolution, uncertaintyInterval: null },
    source: { id: registered.sourceId, url: registered.sourceUrl,
      version: registered.sourceVersion, locator: registered.sourceLocator,
      artifactSha256: registered.sourceArtifactSha256 },
    score: null,
    scoreReason: 'Area converted is observed, but ecosystem condition, persistence, overlap and fixed nature-harm anchors are not calibrated.',
    reasons: [],
  };
}
