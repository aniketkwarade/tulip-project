import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

import { INGESTION_JOB_CONTRACTS } from '../src/ingestion-job-contracts.js';
import {
  NODES,
  NONCAUSAL_GENERATED_METRIC_BINDINGS,
  NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS,
  NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS
} from '../src/data.js';

const registry = JSON.parse(
  await fs.readFile(path.resolve('public/pipeline-lineage-registry.json'), 'utf8')
);
const metricRegistry = JSON.parse(
  await fs.readFile(path.resolve('public/node-metric-contracts.json'), 'utf8')
);
const sourceRegistry = JSON.parse(
  await fs.readFile(path.resolve('public/tulip-source-registry.json'), 'utf8')
);

const failures = [];
const expectedJobs = new Map(INGESTION_JOB_CONTRACTS.map(job => [job.ingestion_job_id, job]));
const pipelines = Array.isArray(registry.pipelines) ? registry.pipelines : [];
const pipelineById = new Map(pipelines.map(pipeline => [pipeline.pipeline_id, pipeline]));
const nodeIds = new Set((registry.nodes || []).map(node => node.id));
const graphNodeIds = new Set(NODES.map(node => node.id));
const metricIds = new Set(
  Object.values(metricRegistry.contracts || {}).map(contract => contract.metric_id)
);
const sourceIds = new Set((sourceRegistry.sources || []).map(source => source.id));
const noncausalBindings = {
  ...NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS,
  ...NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS,
  ...NONCAUSAL_GENERATED_METRIC_BINDINGS
};

function fail(code, details = null) {
  failures.push({ code, details });
}

if (registry.version !== 'tulip_pipeline_lineage_v1') {
  fail('unexpected_registry_version', registry.version);
}
if (pipelines.length !== expectedJobs.size) {
  fail('pipeline_count_mismatch', { expected: expectedJobs.size, actual: pipelines.length });
}
if (pipelineById.size !== pipelines.length) {
  fail('duplicate_pipeline_ids');
}
if (nodeIds.size !== (registry.nodes || []).length) {
  fail('duplicate_lineage_node_ids');
}

const edgeIds = new Set();
for (const edge of registry.edges || []) {
  if (edgeIds.has(edge.id)) fail('duplicate_lineage_edge', edge.id);
  edgeIds.add(edge.id);
  if (!nodeIds.has(edge.from)) fail('edge_source_missing', edge);
  if (!nodeIds.has(edge.to)) fail('edge_target_missing', edge);
}

for (const [jobId, contract] of expectedJobs) {
  const pipeline = pipelineById.get(jobId);
  if (!pipeline) {
    fail('pipeline_missing', jobId);
    continue;
  }
  if (pipeline.source?.id !== contract.source_id) {
    fail('pipeline_source_mismatch', { jobId, expected: contract.source_id, actual: pipeline.source?.id });
  }
  if (!sourceIds.has(contract.source_id)) {
    fail('pipeline_source_not_registered', { jobId, source_id: contract.source_id });
  }
  if (pipeline.snapshot?.id !== contract.snapshot_file) {
    fail('pipeline_snapshot_mismatch', { jobId, expected: contract.snapshot_file, actual: pipeline.snapshot?.id });
  }
  if (pipeline.delivery?.api_route !== contract.api_route) {
    fail('pipeline_route_mismatch', { jobId, expected: contract.api_route, actual: pipeline.delivery?.api_route });
  }
  if (!pipeline.job?.implementation_paths?.length) {
    fail('pipeline_implementation_missing', jobId);
  }
  for (const implementationPath of pipeline.job?.implementation_paths || []) {
    try {
      await fs.access(path.resolve(implementationPath));
    } catch {
      fail('pipeline_implementation_file_missing', { jobId, implementationPath });
    }
  }

  const snapshotPath = path.resolve('public', contract.snapshot_file);
  try {
    const contents = await fs.readFile(snapshotPath);
    const actualSha256 = crypto.createHash('sha256').update(contents).digest('hex');
    if (pipeline.snapshot?.sha256 !== actualSha256) {
      fail('snapshot_checksum_mismatch', { jobId, expected: actualSha256, actual: pipeline.snapshot?.sha256 });
    }
    if (pipeline.snapshot?.bytes !== contents.length) {
      fail('snapshot_size_mismatch', { jobId, expected: contents.length, actual: pipeline.snapshot?.bytes });
    }
  } catch {
    fail('pipeline_snapshot_file_missing', { jobId, snapshot: contract.snapshot_file });
  }

  if ((pipeline.bindings || []).length !== contract.contract_bindings.length) {
    fail('pipeline_binding_count_mismatch', {
      jobId,
      expected: contract.contract_bindings.length,
      actual: pipeline.bindings?.length || 0
    });
  }
  for (const binding of pipeline.bindings || []) {
    if (!metricIds.has(binding.metric_contract_id)) {
      fail('pipeline_metric_contract_missing', { jobId, metric_contract_id: binding.metric_contract_id });
    }
    const reviewedBinding = noncausalBindings[binding.declared_owner_id] || null;
    const expectedCanonicalNodeId = graphNodeIds.has(binding.declared_owner_id)
      ? binding.declared_owner_id
      : reviewedBinding?.canonical_node_id || null;
    if (binding.canonical_node_id !== expectedCanonicalNodeId) {
      fail('pipeline_canonical_node_mismatch', {
        jobId,
        declared_owner_id: binding.declared_owner_id,
        expected: expectedCanonicalNodeId,
        actual: binding.canonical_node_id
      });
    }
    if (binding.canonical_node_id && !graphNodeIds.has(binding.canonical_node_id)) {
      fail('pipeline_canonical_graph_node_missing', {
        jobId,
        canonical_node_id: binding.canonical_node_id
      });
    }
    if (!nodeIds.has(binding.metric_node_id)) {
      fail('pipeline_metric_lineage_node_missing', { jobId, metric_node_id: binding.metric_node_id });
    }
    if (!nodeIds.has(binding.owner_node_id)) {
      fail('pipeline_owner_lineage_node_missing', { jobId, owner_node_id: binding.owner_node_id });
    }
    if (!nodeIds.has(binding.target_node_id)) {
      fail('pipeline_target_lineage_node_missing', { jobId, target_node_id: binding.target_node_id });
    }
  }
}

for (const pipeline of pipelines) {
  if (!expectedJobs.has(pipeline.pipeline_id)) {
    fail('unexpected_pipeline', pipeline.pipeline_id);
  }
}

const expectedSummary = {
  pipelines: pipelines.length,
  sources: new Set(pipelines.map(pipeline => pipeline.source?.id)).size,
  implementation_files: new Set(pipelines.flatMap(pipeline => pipeline.job?.implementation_paths || [])).size,
  snapshots: new Set(pipelines.map(pipeline => pipeline.snapshot?.id)).size,
  api_routes: new Set(pipelines.map(pipeline => pipeline.delivery?.api_route)).size,
  metric_bindings: pipelines.reduce((sum, pipeline) => sum + (pipeline.bindings?.length || 0), 0),
  lineage_nodes: (registry.nodes || []).length,
  lineage_edges: (registry.edges || []).length
};
for (const [key, expected] of Object.entries(expectedSummary)) {
  if (registry.summary?.[key] !== expected) {
    fail('lineage_summary_mismatch', { key, expected, actual: registry.summary?.[key] });
  }
}

if (failures.length) {
  console.error(JSON.stringify({
    audit: 'pipeline_lineage',
    status: 'failed',
    failures
  }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  audit: 'pipeline_lineage',
  status: 'passed',
  ...expectedSummary
}, null, 2));
