import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NODES } from '../src/data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const registry = JSON.parse(await fs.readFile(path.join(PUBLIC, 'tulip-urgency-v3-scores.json'), 'utf8'));
const receiptsById = new Map(registry.receipts.map(receipt => [receipt.node_id, receipt]));
const issueNodes = NODES.filter(node => node.node_kind !== 'response' && receiptsById.has(node.id));
const spheres = [...new Set(issueNodes.map(node => node.sphere))].sort();

if (spheres.length !== 12) throw new Error(`Expected 12 issue spheres; found ${spheres.length}.`);

const targetQuantiles = [0.08, 0.38, 0.68, 0.94];
const selected = [];

for (const sphere of spheres) {
  const candidates = issueNodes
    .filter(node => node.sphere === sphere)
    .map(node => ({ node, receipt: receiptsById.get(node.id) }))
    .sort((left, right) => left.receipt.value - right.receipt.value || left.node.id.localeCompare(right.node.id));
  if (candidates.length < 4) throw new Error(`Sphere ${sphere} has fewer than four eligible issue nodes.`);

  const chosen = new Set();
  for (const quantile of targetQuantiles) {
    const targetIndex = Math.round((candidates.length - 1) * quantile);
    const ordered = candidates
      .map((candidate, index) => ({ candidate, distance: Math.abs(index - targetIndex) }))
      .sort((left, right) => left.distance - right.distance || left.candidate.node.id.localeCompare(right.candidate.node.id));
    const pick = ordered.find(item => !chosen.has(item.candidate.node.id))?.candidate;
    if (!pick) throw new Error(`Could not select a unique pilot node for ${sphere}.`);
    chosen.add(pick.node.id);
    selected.push({
      node_id: pick.node.id,
      node_name: pick.node.name,
      sphere,
      score: pick.receipt.value,
      band: pick.receipt.band,
      method: pick.receipt.method,
      source_date: pick.receipt.as_of,
      review_status: pick.receipt.scientific_review?.status ?? 'pending',
      external_domain_review: 'not_started',
      independent_reproduction: 'not_started'
    });
  }
}

const countBy = (key) => Object.fromEntries([...new Set(selected.map(item => item[key]))]
  .sort()
  .map(value => [value, selected.filter(item => item[key] === value).length]));

const pilot = {
  version: '1.0.0',
  status: 'active_protocol_cohort_selected',
  generated_at: new Date().toISOString(),
  cohort_size: selected.length,
  selection_method: 'Four issue nodes per sphere, sampled deterministically near the 8th, 38th, 68th, and 94th within-sphere score quantiles.',
  representativeness: {
    sphere_counts: countBy('sphere'),
    method_counts: countBy('method'),
    band_counts: countBy('band')
  },
  claim_policy: {
    scientifically_approved_label_retained: true,
    scientifically_validated_claim_allowed: false,
    required_before_validation_claim: [
      'external_domain_review_completed',
      'independent_reproduction_completed',
      'predeclared_acceptance_criteria_met'
    ]
  },
  protocol: 'docs/tulip-scientific-validation-protocol.md',
  nodes: selected
};

if (pilot.cohort_size !== 48) throw new Error(`Expected a 48-node pilot; selected ${pilot.cohort_size}.`);
await fs.writeFile(path.join(PUBLIC, 'tulip-scientific-validation-pilot.json'), `${JSON.stringify(pilot, null, 2)}\n`);
console.log(JSON.stringify({ cohort_size: pilot.cohort_size, ...pilot.representativeness }, null, 2));
