// Recent modeled biological change, deliberately short of node attribution.
import { REGISTERED_REEF_EVENT_CHANGE_OBSERVATIONS } from './tulip-source-observation-registry.js';

export const REEF_EVENT_OBSERVATION_VERSION = 'tulip_reef_event_observation_2026_09_27_v1';
const nonempty = value => typeof value === 'string' && value.trim().length > 0;
const percent = value => typeof value === 'number' && Number.isFinite(value)
  && value >= 0 && value <= 100;

export function evaluateRecentReefCoverChange(input) {
  const reasons = [];
  const observed = input?.sourceObservation;
  const registered = Object.hasOwn(REGISTERED_REEF_EVENT_CHANGE_OBSERVATIONS, input?.sourceId)
    ? REGISTERED_REEF_EVENT_CHANGE_OBSERVATIONS[input.sourceId] : null;
  if (!registered) reasons.push('registered_source_row_required');
  if (input?.methodVersion !== REEF_EVENT_OBSERVATION_VERSION) reasons.push('method_version_mismatch');
  if (input?.nodeKind !== 'issue' || !nonempty(input?.nodeId)) reasons.push('issue_node_required');
  if (input?.domain !== 'ecosystem' || input?.coverage !== 'endpoint_only') reasons.push('ecosystem_endpoint_only_required');
  if (input?.attributionStatus !== 'event_associated_not_apportioned') reasons.push('node_attribution_not_established');
  if (!observed || observed.sourceId !== input?.sourceId) reasons.push('source_row_missing_or_mismatched');
  const fields = ['sourceId', 'sourceVersion', 'sourceArtifactSha256', 'sourceUrl',
    'sourceLocator', 'geography', 'ecosystemType', 'outcomeKind', 'coverUnit',
    'areaUnit', 'yearBefore', 'yearAfter', 'beforeCoverPct', 'afterCoverPct',
    'mappedReefAreaKm2', 'pairedChangeUncertaintyInterval'];
  if (registered && fields.some(field => observed?.[field] !== registered[field])) {
    reasons.push('candidate_source_row_differs_from_registry');
  }
  for (const field of ['geography', 'ecosystemType', 'outcomeKind', 'yearBefore', 'yearAfter']) {
    if (input?.[field] !== registered?.[field]) reasons.push(`${field}_source_scope_mismatch`);
  }
  if (registered && (!/^[a-f0-9]{64}$/.test(registered.sourceArtifactSha256)
    || !registered.sourceUrl.startsWith('https://') || !nonempty(registered.sourceLocator))) {
    reasons.push('registered_source_provenance_missing');
  }
  if (!percent(observed?.beforeCoverPct) || !percent(observed?.afterCoverPct)
    || observed?.afterCoverPct >= observed?.beforeCoverPct
    || observed?.coverUnit !== 'percent_reef_surface'
    || observed?.areaUnit !== 'km2'
    || typeof observed?.mappedReefAreaKm2 !== 'number'
    || !Number.isFinite(observed.mappedReefAreaKm2)
    || observed.mappedReefAreaKm2 <= 0) reasons.push('compatible_cover_and_area_required');
  if (observed?.pairedChangeUncertaintyInterval !== null) reasons.push('unsupported_paired_change_interval');
  if (reasons.length) return { status: 'needs_source_native_reef_change', score: null,
    reasons: [...new Set(reasons)] };

  const absoluteCoverDropPctPoints = registered.beforeCoverPct - registered.afterCoverPct;
  return {
    status: 'source_bound_event_associated_change',
    methodVersion: REEF_EVENT_OBSERVATION_VERSION, nodeId: input.nodeId,
    geography: registered.geography, ecosystemType: registered.ecosystemType,
    years: { before: registered.yearBefore, after: registered.yearAfter },
    change: {
      beforeCoverPct: registered.beforeCoverPct,
      afterCoverPct: registered.afterCoverPct,
      absoluteCoverDropPctPoints,
      // Ratio of annual model point estimates, not a paired posterior median.
      relativePointEstimateDropPct: absoluteCoverDropPctPoints / registered.beforeCoverPct * 100,
      coverEquivalentKm2: registered.mappedReefAreaKm2 * absoluteCoverDropPctPoints / 100,
      pairedChangeUncertaintyInterval: null,
    },
    source: { id: registered.sourceId, url: registered.sourceUrl,
      version: registered.sourceVersion, locator: registered.sourceLocator,
      artifactSha256: registered.sourceArtifactSha256 },
    nodeAttributable: false, score: null, publicReady: false, reasons: [],
    limitation: 'A modeled global cover decline followed the bleaching event. The ratio of annual point estimates is not a paired posterior estimate; no paired-change interval is available here. This row does not apportion the decline to bleaching versus other pressures, establish recovery duration, or quantify other reef functions.',
  };
}
