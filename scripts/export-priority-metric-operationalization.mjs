import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';

import { EDGES, NODES } from '../src/data.js';
import { INGESTION_JOB_CONTRACTS } from '../src/ingestion-job-contracts.js';
import { NODE_METRIC_CONTRACTS } from '../src/northstar-contracts.js';

const sourceRegistry = JSON.parse(await fs.readFile(path.resolve('public/tulip-source-registry.json'), 'utf8'));
const nodeById = new Map(NODES.map(node => [node.id, node]));
const degree = new Map(NODES.map(node => [node.id, 0]));
for (const edge of EDGES) {
  degree.set(edge.source, (degree.get(edge.source) || 0) + 1);
  degree.set(edge.target, (degree.get(edge.target) || 0) + 1);
}
const topHubIds = new Set([...degree.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 25).map(([id]) => id));
const activeSourceById = new Map(sourceRegistry.sources
  .filter(source => source.platform_integration?.active)
  .filter(source => fsSync.existsSync(path.resolve('public', source.platform_integration.public_file)))
  .map(source => [source.id, source]));

const cadenceWeight = cadence => {
  const value = String(cadence || '').toLowerCase();
  if (/hour|daily|near.real.time/.test(value)) return 30;
  if (/week/.test(value)) return 22;
  if (/month/.test(value)) return 16;
  if (/quarter/.test(value)) return 10;
  return 5;
};

const liveNodeCandidates = Object.entries(NODE_METRIC_CONTRACTS)
  .filter(([ownerId, contract]) => nodeById.has(ownerId) && activeSourceById.has(contract.source_id))
  .filter(([, contract]) => {
    const servedMetricIds = activeSourceById.get(contract.source_id)?.platform_integration?.served_metric_ids;
    return !Array.isArray(servedMetricIds) || servedMetricIds.includes(contract.metric_id);
  })
  .map(([ownerId, contract]) => {
    const source = activeSourceById.get(contract.source_id);
    const score = (degree.get(ownerId) || 0) * 4
      + (topHubIds.has(ownerId) ? 120 : 0)
      + cadenceWeight(contract.cadence)
      + (source.ingestion_mode === 'api' ? 25 : source.refresh_style === 'scheduled_snapshot' ? 18 : 6);
    return { ownerId, contract, source, score, bindingScope: 'live_node_primary_metric' };
  });

const liveBindingKeys = new Set(
  liveNodeCandidates.map(({ ownerId, contract }) => `${ownerId}|${contract.metric_id}`)
);
const explicitOntologyCandidates = INGESTION_JOB_CONTRACTS
  .flatMap(job => job.contract_bindings.map(binding => ({ job, binding })))
  .filter(({ binding }) => !nodeById.has(binding.node_id))
  .map(({ job, binding }) => ({
    job,
    binding,
    contract: NODE_METRIC_CONTRACTS[binding.node_id],
    source: activeSourceById.get(job.source_id)
  }))
  .filter(({ job, binding, contract, source }) => (
    contract
    && source
    && contract.source_id === job.source_id
    && contract.metric_id === binding.metric_contract_id
    && source.platform_integration?.route === job.api_route
    && source.platform_integration?.public_file === job.snapshot_file
    && source.platform_integration?.measurement_ready_metric_ids?.includes(contract.metric_id)
    && !liveBindingKeys.has(`${binding.node_id}|${contract.metric_id}`)
  ))
  .map(({ binding, contract, source }) => ({
    ownerId: binding.node_id,
    contract,
    source,
    score: cadenceWeight(contract.cadence),
    bindingScope: 'ontology_metric_alias_explicit_job'
  }));

const candidates = [...liveNodeCandidates, ...explicitOntologyCandidates]
  .sort((a, b) => b.score - a.score || b.ownerId.localeCompare(a.ownerId));

const selected = candidates;

const generatedAt = new Date().toISOString();
const readinessForBinding = (source, metricId) => {
  const measurementReadyMetricIds = source.platform_integration?.measurement_ready_metric_ids;
  if (Array.isArray(measurementReadyMetricIds) && measurementReadyMetricIds.includes(metricId)) {
    return 'measurement_snapshot_available';
  }
  const artifactKind = source.platform_integration?.artifact_kind || '';
  if (/bounded_|contract_bound|benchmark/.test(artifactKind)) return 'measurement_snapshot_available';
  const recordCount = Number(source.platform_integration?.record_count);
  if (/source_dataset/.test(artifactKind) && Number.isFinite(recordCount) && recordCount > 0) {
    return 'source_dataset_snapshot_available';
  }
  return 'support_or_catalog_only';
};
const bindings = selected.map(({ ownerId, contract, source, score, bindingScope }, index) => {
  const measurementReadiness = readinessForBinding(source, contract.metric_id);
  const stageByReadiness = {
    measurement_snapshot_available: 'validated_measurement_snapshot_bound',
    source_dataset_snapshot_available: 'source_dataset_bound_pending_node_transformation',
    support_or_catalog_only: 'source_catalog_registered_no_measurement_payload'
  };
  return {
    priority: index + 1,
    node_id: ownerId,
    node_name: nodeById.get(ownerId)?.name || ownerId.split('_').map(part => part[0]?.toUpperCase() + part.slice(1)).join(' '),
    node_degree: degree.get(ownerId) || 0,
    top_25_hub: topHubIds.has(ownerId),
    binding_scope: bindingScope,
    metric_id: contract.metric_id,
    metric_name: contract.metric_name,
    unit: contract.unit,
    geography: contract.geography,
    cadence: contract.cadence,
    observation_time_field: contract.observation_time_field,
    transformation: contract.transformation,
    uncertainty: contract.uncertainty,
    threshold_provenance: contract.threshold_provenance,
    failure_behavior: contract.failure_behavior,
    source_id: source.id,
    source_url: source.url,
    route: source.platform_integration.route,
    public_file: source.platform_integration.public_file,
    artifact_kind: source.platform_integration.artifact_kind,
    artifact_version: source.platform_integration.artifact_version,
    measurement_stage: stageByReadiness[measurementReadiness],
    measurement_readiness: measurementReadiness,
    scoring_boundary: measurementReadiness === 'support_or_catalog_only'
      ? 'This artifact proves only that a relevant source or catalog route is registered. It contains no validated observation payload and must not update a node, edge estimand, score, or visible measurement.'
      : 'The source and transformation are operationally bound. A graph score must not update until the transformed measurement passes node-specific validation.',
    priority_score: score
  };
});

const grouped = new Map();
for (const binding of bindings) {
  if (!grouped.has(binding.source_id)) grouped.set(binding.source_id, []);
  grouped.get(binding.source_id).push(binding);
}
const jobs = [...grouped.entries()].map(([sourceId, sourceBindings]) => ({
  job_id: `operate_priority_metrics_${sourceId}`,
  source_id: sourceId,
  route: sourceBindings[0].route,
  public_file: sourceBindings[0].public_file,
  cadence: sourceBindings.map(binding => binding.cadence).join(' | '),
  provenance: `Source snapshot ${sourceBindings[0].artifact_version}; each binding retains its metric transformation and source identifier.`,
  uncertainty: 'Binding-specific uncertainty is preserved; shared-source availability does not imply equal measurement quality across metrics.',
  failure_behavior: 'Retain the last validated artifact, mark every affected metric stale, expose the failed source, and never convert missing values to zero.',
  contract_bindings: sourceBindings.map(binding => ({ node_id: binding.node_id, metric_id: binding.metric_id }))
}));

const registry = {
  version: 'eligible_metric_operationalization_v2',
  generated_at: generatedAt,
  policy: 'Every live-node metric whose registered source has a current platform artifact is bound into ingestion planning. A catalog or overview snapshot is support only, not a dataset. Priority reflects hub degree, cadence, and source access; no binding may update a score without a validated observation payload and node-specific transformation.',
  summary: {
    operationalized_metric_contracts: bindings.length,
    live_node_primary_metric_contracts: bindings.filter(binding => binding.binding_scope === 'live_node_primary_metric').length,
    ontology_metric_alias_contracts: bindings.filter(binding => binding.binding_scope === 'ontology_metric_alias_explicit_job').length,
    jobs: jobs.length,
    sources: grouped.size,
    top_25_hub_bindings: bindings.filter(binding => binding.top_25_hub).length,
    api_or_scheduled_bindings: bindings.filter(binding => activeSourceById.get(binding.source_id)?.ingestion_mode === 'api' || activeSourceById.get(binding.source_id)?.refresh_style === 'scheduled_snapshot').length,
    measurement_snapshot_available: bindings.filter(binding => binding.measurement_readiness === 'measurement_snapshot_available').length,
    source_dataset_snapshot_available: bindings.filter(binding => binding.measurement_readiness === 'source_dataset_snapshot_available').length,
    support_or_catalog_only: bindings.filter(binding => binding.measurement_readiness === 'support_or_catalog_only').length
  },
  bindings,
  jobs
};

await fs.writeFile(path.resolve('public/priority-metric-operationalization-registry.json'), `${JSON.stringify(registry, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(registry.summary, null, 2));
