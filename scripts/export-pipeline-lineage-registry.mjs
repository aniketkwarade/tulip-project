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

const ROOT = path.resolve('.');
const PUBLIC_DIR = path.join(ROOT, 'public');
const SCRIPTS_DIR = path.join(ROOT, 'scripts');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'pipeline-lineage-registry.json');

const scriptFilenames = (await fs.readdir(SCRIPTS_DIR))
  .filter(filename => /^(fetch|build|export-(?:unep|unesco|fao|iea|icao|unece|world-bank|who|ipbes|unctad|copernicus|wmo|undrr|ramsar|ioc|ipcc|pollinator|groundwater|global))-.+\.(mjs|js)$/.test(filename))
  .sort();
const scriptSources = new Map(await Promise.all(scriptFilenames.map(async filename => [
  filename,
  await fs.readFile(path.join(SCRIPTS_DIR, filename), 'utf8')
])));
const publishedNodeIds = new Set(NODES.map(node => node.id));
const noncausalBindings = {
  ...NONCAUSAL_ROOT_DRIVER_METRIC_BINDINGS,
  ...NONCAUSAL_OPERATIONAL_INDICATOR_METRIC_BINDINGS,
  ...NONCAUSAL_GENERATED_METRIC_BINDINGS
};

function addNode(nodeMap, node) {
  if (!nodeMap.has(node.id)) nodeMap.set(node.id, node);
}

function addEdge(edgeMap, edge) {
  const id = `${edge.from}|${edge.relationship}|${edge.to}`;
  if (!edgeMap.has(id)) edgeMap.set(id, { id, ...edge });
}

function inferRecordCount(snapshot) {
  if (Number.isFinite(snapshot?.record_count)) return Number(snapshot.record_count);
  const candidates = [
    snapshot?.records,
    snapshot?.observations,
    snapshot?.data,
    snapshot?.rows,
    snapshot?.features,
    snapshot?.series,
    snapshot?.locations,
    snapshot?.countries
  ];
  const array = candidates.find(Array.isArray);
  return array?.length ?? null;
}

function readSnapshotVersion(snapshot) {
  return snapshot?.version
    || snapshot?.schema_version
    || snapshot?.snapshot_version
    || null;
}

function readSnapshotTimestamp(snapshot) {
  return snapshot?.generated_at
    || snapshot?.fetched_at
    || snapshot?.updated_at
    || snapshot?.retrieved_at
    || snapshot?.source_checked_at
    || null;
}

const nodes = new Map();
const edges = new Map();
const pipelines = [];

for (const job of INGESTION_JOB_CONTRACTS) {
  const snapshotPath = path.join(PUBLIC_DIR, job.snapshot_file);
  const snapshotContents = await fs.readFile(snapshotPath);
  const snapshot = JSON.parse(snapshotContents.toString('utf8'));
  const snapshotStats = await fs.stat(snapshotPath);
  const implementationPaths = [...scriptSources.entries()]
    .filter(([, source]) => source.includes(job.snapshot_file))
    .map(([filename]) => `scripts/${filename}`);

  const sourceNodeId = `source:${job.source_id}`;
  const jobNodeId = `job:${job.ingestion_job_id}`;
  const snapshotNodeId = `snapshot:${job.snapshot_file}`;
  const routeNodeId = `route:${job.api_route}`;
  const sha256 = crypto.createHash('sha256').update(snapshotContents).digest('hex');
  const snapshotMetadata = {
    path: `public/${job.snapshot_file}`,
    bytes: snapshotStats.size,
    sha256,
    record_count: inferRecordCount(snapshot),
    snapshot_family: snapshot?.snapshot_family || null,
    schema_version: readSnapshotVersion(snapshot),
    observed_at: readSnapshotTimestamp(snapshot)
  };

  addNode(nodes, {
    id: sourceNodeId,
    kind: 'source',
    label: job.source_id,
    source_id: job.source_id
  });
  addNode(nodes, {
    id: jobNodeId,
    kind: 'job',
    label: job.ingestion_job_id,
    ingestion_job_id: job.ingestion_job_id,
    implementation_paths: implementationPaths
  });
  addNode(nodes, {
    id: snapshotNodeId,
    kind: 'snapshot',
    label: job.snapshot_file,
    ...snapshotMetadata
  });
  addNode(nodes, {
    id: routeNodeId,
    kind: 'route',
    label: job.api_route,
    api_route: job.api_route
  });
  addEdge(edges, { from: sourceNodeId, to: jobNodeId, relationship: 'ingested_by' });
  addEdge(edges, { from: jobNodeId, to: snapshotNodeId, relationship: 'materializes' });
  addEdge(edges, { from: snapshotNodeId, to: routeNodeId, relationship: 'served_by' });

  const bindings = job.contract_bindings.map(binding => {
    const metricNodeId = `metric:${binding.metric_contract_id}`;
    const reviewedBinding = noncausalBindings[binding.node_id] || null;
    const canonicalNodeId = publishedNodeIds.has(binding.node_id)
      ? binding.node_id
      : reviewedBinding?.canonical_node_id || null;
    const ownerNodeId = `metric_owner:${binding.node_id}`;
    const targetNodeId = canonicalNodeId
      ? `graph_node:${canonicalNodeId}`
      : `research_metric:${binding.node_id}`;
    addNode(nodes, {
      id: metricNodeId,
      kind: 'metric',
      label: binding.metric_contract_id,
      metric_contract_id: binding.metric_contract_id
    });
    addNode(nodes, {
      id: ownerNodeId,
      kind: 'metric_owner',
      label: binding.node_id,
      metric_owner_id: binding.node_id,
      binding_type: reviewedBinding?.binding_type || 'published_node_metric'
    });
    addNode(nodes, canonicalNodeId ? {
      id: targetNodeId,
      kind: 'graph_node',
      label: canonicalNodeId,
      graph_node_id: canonicalNodeId
    } : {
      id: targetNodeId,
      kind: 'research_metric',
      label: binding.node_id,
      metric_owner_id: binding.node_id
    });
    addEdge(edges, {
      from: snapshotNodeId,
      to: metricNodeId,
      relationship: 'provides_measurement_for'
    });
    addEdge(edges, {
      from: metricNodeId,
      to: ownerNodeId,
      relationship: 'owned_by'
    });
    addEdge(edges, {
      from: ownerNodeId,
      to: targetNodeId,
      relationship: canonicalNodeId === binding.node_id
        ? 'published_as'
        : canonicalNodeId
          ? 'canonicalized_to'
          : 'retained_in_research'
    });
    return {
      declared_owner_id: binding.node_id,
      metric_contract_id: binding.metric_contract_id,
      measurement_role: binding.measurement_role || null,
      binding_type: reviewedBinding?.binding_type || 'published_node_metric',
      canonical_node_id: canonicalNodeId,
      target_status: canonicalNodeId ? 'published_graph_node' : 'research_metric_without_canonical_node',
      metric_node_id: metricNodeId,
      owner_node_id: ownerNodeId,
      target_node_id: targetNodeId
    };
  });

  pipelines.push({
    pipeline_id: job.ingestion_job_id,
    source: {
      id: job.source_id,
      lineage_node_id: sourceNodeId
    },
    job: {
      id: job.ingestion_job_id,
      lineage_node_id: jobNodeId,
      implementation_paths: implementationPaths,
      cadence: job.cadence,
      provenance: job.provenance,
      uncertainty: job.uncertainty,
      failure_behavior: job.failure_behavior
    },
    snapshot: {
      id: job.snapshot_file,
      lineage_node_id: snapshotNodeId,
      ...snapshotMetadata
    },
    delivery: {
      api_route: job.api_route,
      lineage_node_id: routeNodeId
    },
    bindings
  });
}

const registry = {
  version: 'tulip_pipeline_lineage_v1',
  generated_at: new Date().toISOString(),
  provenance_model: {
    inspiration: 'Kedro Data Catalog and pipeline lineage concepts',
    implementation: 'TULIP Node-native generated registry',
    boundary: 'This registry documents operational lineage. It does not infer scientific causality or replace relationship evidence dossiers.'
  },
  policy: {
    completeness: 'Every contracted ingestion job must resolve to a source, implementation, materialized snapshot, API route, metric contract, and published graph-node binding.',
    reproducibility: 'Each materialized snapshot records its byte size and SHA-256 digest so a published artifact can be identified exactly.',
    failure_boundary: 'Missing implementations, snapshots, source contracts, metric contracts, graph nodes, or lineage references fail the lineage audit.'
  },
  summary: {
    pipelines: pipelines.length,
    sources: new Set(pipelines.map(pipeline => pipeline.source.id)).size,
    implementation_files: new Set(pipelines.flatMap(pipeline => pipeline.job.implementation_paths)).size,
    snapshots: new Set(pipelines.map(pipeline => pipeline.snapshot.id)).size,
    api_routes: new Set(pipelines.map(pipeline => pipeline.delivery.api_route)).size,
    metric_bindings: pipelines.reduce((sum, pipeline) => sum + pipeline.bindings.length, 0),
    lineage_nodes: nodes.size,
    lineage_edges: edges.size
  },
  nodes: [...nodes.values()].sort((a, b) => a.id.localeCompare(b.id)),
  edges: [...edges.values()].sort((a, b) => a.id.localeCompare(b.id)),
  pipelines: pipelines.sort((a, b) => a.pipeline_id.localeCompare(b.pipeline_id))
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');

console.log(JSON.stringify({
  output: path.relative(ROOT, OUTPUT_PATH),
  ...registry.summary
}, null, 2));
