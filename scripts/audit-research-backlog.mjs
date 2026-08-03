import fs from 'node:fs/promises';
import { NODES, PUBLISHED_NODES } from '../src/data.js';

const registry = JSON.parse(await fs.readFile('public/research-backlog.json', 'utf8'));
const publishedIds = new Set(PUBLISHED_NODES.map(node => node.id));
const expectedIds = new Set(NODES.filter(node => !publishedIds.has(node.id)).map(node => node.id));
const actualIds = new Set(registry.nodes.map(node => node.id));
const failures = [];

for (const id of expectedIds) if (!actualIds.has(id)) failures.push({ code: 'backlog_node_missing', id });
for (const id of actualIds) if (!expectedIds.has(id)) failures.push({ code: 'non_backlog_node_in_registry', id });
for (const node of registry.nodes) {
  if (!node.action || !node.rationale || !node.status) failures.push({ code: 'incomplete_disposition', id: node.id });
  if (!Number.isInteger(node.priority) || node.priority < 1 || node.priority > 3) failures.push({ code: 'invalid_priority', id: node.id });
  if (node.status === 'open' && node.campaign_eligible !== true) failures.push({ code: 'open_node_excluded_from_campaign', id: node.id });
  if (node.status === 'open' && node.campaign_scope !== 'full_open_backlog') failures.push({ code: 'open_node_outside_full_backlog_scope', id: node.id });
  if (node.status === 'open' && node.campaign_wave !== 'continuous_exhaustive_review') failures.push({ code: 'fixed_or_missing_campaign_wave', id: node.id });
  if (node.status === 'open' && !node.workstream) failures.push({ code: 'missing_campaign_workstream', id: node.id });
  if (node.status === 'open' && !node.topology_lane) failures.push({ code: 'missing_topology_lane', id: node.id });
  if (node.status === 'open' && !node.evidence_lane) failures.push({ code: 'missing_evidence_lane', id: node.id });
  if (node.status === 'open' && (!Array.isArray(node.research_questions) || node.research_questions.length === 0)) failures.push({ code: 'missing_research_questions', id: node.id });
  if (node.status === 'open' && (!Array.isArray(node.relationship_dossier_contract) || node.relationship_dossier_contract.length !== 8)) failures.push({ code: 'incomplete_relationship_dossier_contract', id: node.id });
  if (node.status === 'resolved' && node.campaign_eligible !== false) failures.push({ code: 'resolved_record_campaign_eligible', id: node.id });
}
if (actualIds.size !== registry.nodes.length) failures.push({ code: 'duplicate_backlog_ids' });

const openNodes = registry.nodes.filter(node => node.status === 'open');
const resolvedNodes = registry.nodes.filter(node => node.status === 'resolved');
const campaignRecords = Array.isArray(registry.campaign_records) ? registry.campaign_records : [];
if (registry.campaign?.scope !== 'entire_registered_backlog') failures.push({ code: 'registry_campaign_scope_not_exhaustive' });
if (registry.campaign?.fixed_batch_limit !== null) failures.push({ code: 'registry_has_fixed_batch_limit' });
if (registry.summary?.campaign_eligible_nodes !== openNodes.length) failures.push({ code: 'campaign_eligible_summary_mismatch' });
if (!Array.isArray(registry.execution_queue) || registry.execution_queue.length !== openNodes.length) failures.push({ code: 'execution_queue_not_all_open_records' });
if (!Array.isArray(registry.resolution_ledger) || registry.resolution_ledger.length !== resolvedNodes.length) failures.push({ code: 'resolution_ledger_not_all_resolved_records' });
if (campaignRecords.length !== registry.summary?.total_campaign_records_accounted_for) failures.push({ code: 'campaign_record_total_mismatch' });
if (campaignRecords.some(record => record.review_eligible !== true || record.review_scope !== 'full_campaign_backlog')) failures.push({ code: 'campaign_record_excluded_from_review' });
if (registry.summary?.campaign_reviewable_records !== campaignRecords.length) failures.push({ code: 'campaign_reviewable_summary_mismatch' });
if (!Array.isArray(registry.review_queue) || registry.review_queue.length !== campaignRecords.length) failures.push({ code: 'review_queue_not_full_campaign' });
if (new Set(registry.review_queue || []).size !== campaignRecords.length) failures.push({ code: 'review_queue_contains_duplicate_or_missing_records' });
const queuedIds = new Set(registry.execution_queue || []);
const resolvedIds = new Set(registry.resolution_ledger || []);
for (const node of openNodes) if (!queuedIds.has(node.id)) failures.push({ code: 'open_record_missing_from_execution_queue', id: node.id });
for (const node of resolvedNodes) if (!resolvedIds.has(node.id)) failures.push({ code: 'resolved_record_missing_from_ledger', id: node.id });
const laneIds = Object.values(registry.execution_lanes || {}).flat();
const uniqueLaneIds = new Set(laneIds);
if (laneIds.length !== openNodes.length || uniqueLaneIds.size !== openNodes.length) failures.push({ code: 'execution_lanes_not_exact_open_partition' });
for (const node of openNodes) if (!uniqueLaneIds.has(node.id)) failures.push({ code: 'open_record_missing_from_execution_lane', id: node.id });

console.log(JSON.stringify({ expected_backlog_nodes: expectedIds.size, registered_backlog_nodes: actualIds.size, failures }, null, 2));
if (failures.length) process.exitCode = 1;
