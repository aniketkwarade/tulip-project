// Internal archival continuity only. This cannot admit a replacement rating or
// refresh an assessment against corrected evidence without a new review.
export function validateContinuityArchive(archive, nodes) {
  if (archive.schemaVersion !== 1 || archive.kind !== 'frozen_public_assessment_continuity'
    || !Array.isArray(archive.records)) throw new Error('Invalid assessment continuity archive');
  const ids = new Set();
  for (const entry of archive.records) {
    if (ids.has(entry.nodeId) || !nodes.some(node => node.id === entry.nodeId && node.node_kind !== 'response')) {
      throw new Error(`Invalid continuity identity: ${entry.nodeId}`);
    }
    ids.add(entry.nodeId);
  }
}

export function resolveAssessmentSourceBasis({ node, receipt, row, policy, archive, fingerprint }) {
  const inputs = metric => ({ receipt, metric, sources: node.source_urls, projectionInputs: [] });
  const liveDigest = fingerprint(inputs(node.metric_contract));
  const entry = archive.records.find(record => record.nodeId === node.id);
  if (!entry) return { sourceDigest: liveDigest, metricContract: node.metric_contract, retainedRecordDigest: null };
  const fail = () => { throw new Error(`Changed frozen assessment continuity: ${node.id}`); };
  if (entry.reason !== 'retain_public_value_during_consequence_review'
    || entry.replacementAdmitted !== false
    || entry.retainedValue !== row.result.value
    || entry.assessmentVersion !== row.result.version
    || entry.policyDigest !== fingerprint(policy)
    || entry.candidateRowDigest !== fingerprint(row)
    || entry.correctedSourceDigest !== liveDigest
    || entry.frozenSourceDigest !== fingerprint(inputs(entry.frozenMetricContract))
    || entry.frozenSourceDigest !== row.candidate.sourceDigest
    || !/^[a-f0-9]{64}$/.test(entry.retainedRecordDigest)) fail();
  return {
    sourceDigest: entry.frozenSourceDigest,
    metricContract: entry.frozenMetricContract,
    retainedRecordDigest: entry.retainedRecordDigest,
  };
}

export function verifyRetainedAssessment(record, basis, fingerprint) {
  if (basis.retainedRecordDigest && fingerprint(record) !== basis.retainedRecordDigest) {
    throw new Error(`Changed retained public assessment: ${record.nodeId}`);
  }
  return record;
}
