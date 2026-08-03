import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-infrastructure-pressure-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessments.submarine_cable_concentration;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(a.annual_faults_high, [0, 25, 100, 250]),
  human_economic_burden: n(a.international_data_traffic_share_pct, [0, 25, 75, 100]),
  persistence: n(10, [0, 2, 7, 15]),
  extent: a.global_extent
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('subsea_cable_landing_chokepoint: impact gate failed');
const receipt = buildTulipUrgencyReceipt({
  node_id: 'subsea_cable_landing_chokepoint',
  method: 'impact_fallback',
  as_of: String(a.assessment_year),
  components,
  raw_inputs: {
    ...a,
    persistence_years: 10,
    evidence_boundary: 'Global cable faults quantify network burden but are not silently relabeled as landing-point failures or full service outages.',
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at }
  },
  transformations: [
    { type: 'annual_fault_burden', formula: 'Normalize the upper bound of the ITU global annual cable-fault range against declared anchors.' },
    { type: 'traffic_dependency', formula: 'Normalize the source-reported share of international data traffic carried by submarine cables.' },
    { type: 'persistence_window', formula: 'Use the assessment decade as a conservative persistence interval; do not convert faults into outage-hours.' },
    { type: 'global_extent', formula: 'Assign full extent because the reported network, traffic and fault totals are worldwide.' }
  ],
  source_ids: ['itu_submarine_cable_resilience_summit_2025'],
  uncertainty: snapshot.uncertainty,
  freshness: `ITU global infrastructure assessment for ${a.assessment_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'ITU quantifies global annual fault burden, international traffic dependence, persistent infrastructure exposure and worldwide extent.',
    higher_priority_failures: ['No globally harmonized current landing-point outage series supplies magnitude plus threshold or momentum at the required coverage.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('subsea_cable_landing_chokepoint: receipt verification failed');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_43_submarine_cable_concentration', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-43.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-43.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
