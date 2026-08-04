const ACCESS_PRESENTATION = Object.freeze({
  open_api: Object.freeze({ label: 'Technical API', cta: 'Open technical API' }),
  open_download: Object.freeze({ label: 'Downloadable dataset', cta: 'View data' }),
  open_data: Object.freeze({ label: 'Open dataset', cta: 'View data' }),
  open_portal: Object.freeze({ label: 'Public data portal', cta: 'Visit source' }),
  operational_open: Object.freeze({ label: 'Public monitoring source', cta: 'Visit source' }),
  reference_only: Object.freeze({ label: 'Report or scientific reference', cta: 'Read source' }),
  mixed_or_gated: Object.freeze({ label: 'Restricted or mixed access', cta: 'View access details' })
});

const DEFAULT_ACCESS_PRESENTATION = Object.freeze({
  label: 'Evidence source',
  cta: 'View source'
});

const EVIDENCE_METHOD_PRESENTATION = Object.freeze({
  current_data: Object.freeze({ label: 'Current observations', description: 'Direct observations meet TULIP’s current-data coverage requirements.' }),
  impact_fallback: Object.freeze({ label: 'Accumulated evidence', description: 'Reviewed burden or impact evidence is used when a reliable current series is not available.' }),
  modeled: Object.freeze({ label: 'Modeled estimate', description: 'A reviewed model is used because direct observations do not cover the full measurement.' })
});

const DEFAULT_EVIDENCE_METHOD_PRESENTATION = Object.freeze({
  label: 'Reviewed evidence',
  description: 'TULIP uses a reviewed evidence receipt for this snapshot.'
});

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function humanizeIdentifier(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, character => character.toUpperCase())
    .trim();
}

function readableCadence(value) {
  const cadence = String(value || '').trim();
  if (!cadence) return 'Follows the source release cycle';

  const exactLabels = {
    hourly: 'Hourly',
    daily: 'Daily',
    weekly: 'Weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
    annually: 'Annual'
  };
  const exact = exactLabels[cadence.toLowerCase()];
  if (exact) return exact;
  if (/hourly to annual according to the source release/i.test(cadence)) {
    return 'Hourly to annual, depending on the source';
  }
  if (/updates follow the source release cycle/i.test(cadence)) {
    return 'Follows the source release cycle';
  }
  return cadence.charAt(0).toUpperCase() + cadence.slice(1);
}

function formatHighlightValue(value) {
  if (!Number.isFinite(value)) return null;
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: Math.abs(value) < 10 ? 2 : 1
  }).format(value);
}

function getHighlightUnitFamily(unit) {
  const normalized = String(unit).toLowerCase().replace(/\s+/g, ' ').trim();
  if (/degc|°c|celsius/.test(normalized)) return 'temperature-celsius';
  if (normalized === '%' || /percent/.test(normalized)) return 'percent';
  return normalized;
}

function addHighlight(highlights, seen, { label, value, unit, observedAt = null }) {
  const formattedValue = formatHighlightValue(Number(value));
  if (!label || !formattedValue || !unit) return;
  const signature = `${formattedValue}|${getHighlightUnitFamily(unit)}`;
  if (seen.has(signature) || highlights.length >= 4) return;
  seen.add(signature);
  highlights.push(Object.freeze({ label, value: formattedValue, unit, observedAt }));
}

export function getEvidenceMethodPresentation(method) {
  return EVIDENCE_METHOD_PRESENTATION[method] || DEFAULT_EVIDENCE_METHOD_PRESENTATION;
}

export function extractReviewedHighlights(node, receipt) {
  const highlights = [];
  const seen = new Set();
  const authoredMetric = node?.calibration?.metric;

  if (Number.isFinite(Number(authoredMetric?.current_value)) && authoredMetric?.unit) {
    addHighlight(highlights, seen, {
      label: authoredMetric.metric_name || node?.metric_contract?.metric_name || 'Current value',
      value: authoredMetric.current_value,
      unit: authoredMetric.unit,
      observedAt: authoredMetric.observed_at || null
    });
  }
  if (Number.isFinite(Number(authoredMetric?.share_of_global_electricity))) {
    addHighlight(highlights, seen, {
      label: 'Share of global electricity',
      value: authoredMetric.share_of_global_electricity,
      unit: '%',
      observedAt: authoredMetric.observed_at || null
    });
  }

  for (const input of Object.values(receipt?.raw_inputs || {})) {
    if (highlights.length >= 4) break;
    if (!input || Array.isArray(input) || typeof input !== 'object') continue;
    if (!input.id || !Number.isFinite(Number(input.value)) || typeof input.unit !== 'string') continue;
    addHighlight(highlights, seen, {
      label: humanizeIdentifier(input.id),
      value: input.value,
      unit: input.unit,
      observedAt: receipt?.as_of || null
    });
  }

  return Object.freeze(highlights);
}

function sourceCandidateScore(source, metricId) {
  const integration = source?.platform_integration;
  const measurementReady = asArray(integration?.measurement_ready_metric_ids).includes(metricId);
  const servesMetric = asArray(integration?.served_metric_ids).includes(metricId);

  return (
    (measurementReady ? 32 : 0)
    + (servesMetric ? 16 : 0)
    + (integration?.active ? 8 : 0)
    + (source?.flags?.includes('northstar_contract_bound') ? 4 : 0)
    + (source?.verified_now ? 2 : 0)
    + (source?.operational_open ? 1 : 0)
  );
}

/**
 * Resolve one canonical registry record without ever crossing source IDs.
 * Duplicate records are ranked by their relationship to the requested metric,
 * then by reviewed integration metadata and audit recency.
 */
export function resolveCanonicalSource(sources, sourceId, metricId) {
  const candidates = asArray(sources).filter(source => source?.id === sourceId);
  if (candidates.length === 0) return null;

  return [...candidates].sort((left, right) => {
    const scoreDifference = sourceCandidateScore(right, metricId) - sourceCandidateScore(left, metricId);
    if (scoreDifference !== 0) return scoreDifference;
    return (Number(right.audit_index) || 0) - (Number(left.audit_index) || 0);
  })[0];
}

export function resolveSupportingSources(sources, sourceIds = []) {
  return Object.freeze([...new Set(asArray(sourceIds).filter(Boolean))].map(sourceId => {
    const source = resolveCanonicalSource(sources, sourceId, null);
    const access = getSourceAccessPresentation(source?.access_classification);
    return Object.freeze({
      id: sourceId,
      name: source?.name || humanizeIdentifier(sourceId),
      url: source?.url || null,
      type: source ? access.label : 'Reviewed evidence source',
      resolved: Boolean(source)
    });
  }));
}

export function getSourceAccessPresentation(accessClassification) {
  return ACCESS_PRESENTATION[accessClassification] || DEFAULT_ACCESS_PRESENTATION;
}

function getSnapshotStatus(source, metricId) {
  const integration = source?.platform_integration;
  if (!integration?.active) return 'External evidence source';
  if (asArray(integration.measurement_ready_metric_ids).includes(metricId)) {
    return 'Measurement-ready snapshot';
  }
  if (asArray(integration.served_metric_ids).includes(metricId)) {
    return 'Reviewed TULIP snapshot';
  }
  return 'Source integration available';
}

function getFallbackSourceUrl(node, sourceId, sourceDateEntry) {
  if (sourceDateEntry?.source_id === sourceId && sourceDateEntry.source_url) {
    return sourceDateEntry.source_url;
  }

  return [
    ...asArray(node?.source_urls),
    ...asArray(node?.calibration?.source_urls)
  ].find(Boolean) || null;
}

function getSnapshotPath(source) {
  const publicFile = source?.platform_integration?.public_file;
  if (!/^[a-z0-9][a-z0-9._-]*\.json$/i.test(String(publicFile || ''))) return null;
  return `/${publicFile}`;
}

export function buildMonitoringSourceProfile(
  node,
  sources = [],
  sourceDateEntry = null,
  { registryStatus = 'ready', urgencyReceipt = null, urgencyStatus = 'ready' } = {}
) {
  const metric = node?.metric_contract;
  if (!node || !metric?.source_id) return null;

  const source = resolveCanonicalSource(sources, metric.source_id, metric.metric_id);
  const access = getSourceAccessPresentation(source?.access_classification);
  const fallbackUrl = getFallbackSourceUrl(node, metric.source_id, sourceDateEntry);
  const sourceUrl = source?.url || fallbackUrl;
  const sourceDateMatches = sourceDateEntry?.source_id === metric.source_id;
  const integrationDate = source?.platform_integration?.updated_at
    || source?.platform_integration?.captured_at
    || source?.platform_integration?.generated_at
    || null;

  const isResponse = node.node_kind === 'response';
  const meaning = node.readerMeaning || node.description || `TULIP tracks ${metric.metric_name || node.name}.`;
  const supportingSources = isResponse
    ? Object.freeze([])
    : resolveSupportingSources(sources, urgencyReceipt?.source_ids);
  const evidenceMethod = urgencyReceipt
    ? getEvidenceMethodPresentation(urgencyReceipt.method)
    : null;
  const evidenceSnapshot = !isResponse && urgencyReceipt
    ? Object.freeze({
      score: Number.isFinite(Number(urgencyReceipt.value)) ? Number(urgencyReceipt.value) : null,
      band: urgencyReceipt.band || null,
      asOf: urgencyReceipt.as_of || null,
      method: urgencyReceipt.method || null,
      methodLabel: evidenceMethod.label,
      methodDescription: evidenceMethod.description,
      rationale: urgencyReceipt.selection_reason?.selected_method_passed || null,
      freshness: urgencyReceipt.freshness || null,
      highlights: extractReviewedHighlights(node, urgencyReceipt),
      supportingSources,
      snapshotNote: 'This is a reviewed TULIP snapshot, not a live feed.'
    })
    : null;
  const responseTracking = isResponse
    ? Object.freeze({
      summary: node.responseProfile?.summary || meaning,
      status: 'Response being tracked',
      note: 'Response nodes track progress and potential leverage. TULIP does not assign them an environmental urgency score.'
    })
    : null;

  const measurementSource = Object.freeze({
    id: metric.source_id,
    name: source?.name || humanizeIdentifier(metric.source_id) || 'Reviewed source',
    url: sourceUrl,
    type: source ? access.label : (registryStatus === 'loading' ? 'Loading source details' : 'Reviewed supporting source'),
    cta: source ? access.cta : 'View source',
    resolved: Boolean(source),
    registryStatus,
    snapshotStatus: getSnapshotStatus(source, metric.metric_id),
    snapshotPath: getSnapshotPath(source),
    sourceDate: sourceDateMatches ? sourceDateEntry.source_date : integrationDate,
    sourceDateKind: sourceDateMatches ? sourceDateEntry.date_kind : (integrationDate ? 'reviewed_snapshot' : null)
  });

  return Object.freeze({
    nodeId: node.id,
    nodeName: node.name,
    nodeType: isResponse ? 'Response being tracked' : 'Environmental issue',
    isResponse,
    meaning,
    metricId: metric.metric_id,
    metricName: metric.metric_name || node.name,
    unit: metric.unit || 'Source-defined units',
    geography: metric.geography || 'Source-defined coverage',
    cadence: metric.cadence || 'Updates follow the source release cycle',
    cadenceLabel: readableCadence(metric.cadence),
    observationTimeField: metric.observation_time_field || null,
    transformation: metric.transformation || null,
    uncertainty: metric.uncertainty || null,
    thresholdProvenance: metric.threshold_provenance || null,
    failureBehavior: metric.failure_behavior || null,
    measurementSource,
    evidenceSnapshot,
    supportingSources,
    responseTracking,
    urgencyStatus,
    sourceId: measurementSource.id,
    sourceName: measurementSource.name,
    sourceUrl: measurementSource.url,
    sourceType: measurementSource.type,
    sourceCta: measurementSource.cta,
    sourceResolved: measurementSource.resolved,
    registryStatus,
    snapshotStatus: measurementSource.snapshotStatus,
    snapshotPath: measurementSource.snapshotPath,
    sourceDate: measurementSource.sourceDate,
    sourceDateKind: measurementSource.sourceDateKind,
    reviewedAt: metric.reviewed_at || node?.calibration?.reviewed_at || null
  });
}
