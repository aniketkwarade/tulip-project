import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildTulipUrgencyReceipt,
  normalizeWithAnchors,
  qualifiesForImpactFallback,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/us-bridge-scour-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const coverage = snapshot.assessment.coverage;
const burden = snapshot.assessment.scour_critical_burden;
const traffic = snapshot.assessment.traffic_exposure;
const persistence = snapshot.assessment.management_persistence;
const extent = snapshot.assessment.geographic_extent;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(burden.scour_critical_share_pct, [0, 1, 3, 5]),
  human_economic_burden: n(traffic.open_scour_critical_daily_vehicle_crossings, [0, 1000000, 25000000, 100000000]),
  persistence: n(persistence.scour_critical_bridges_requiring_plan_of_action_pct, [0, 25, 50, 100]),
  extent: n(extent.directly_assessed_country_count, [0, 1, 10, 50])
};

if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) {
  throw new Error('bridge_scour_exposure: accumulated-impact gate failed');
}

const receipt = buildTulipUrgencyReceipt({
  node_id: 'bridge_scour_exposure',
  method: 'impact_fallback',
  as_of: coverage.inventory_page_updated,
  components,
  raw_inputs: {
    biophysical_burden: {
      highway_bridge_count: coverage.highway_bridge_count,
      recognized_scour_critical_codes: burden.recognized_scour_critical_codes,
      scour_critical_code_counts: burden.scour_critical_code_counts,
      scour_critical_bridge_count: burden.scour_critical_bridge_count,
      scour_critical_share_pct: burden.scour_critical_share_pct,
      unknown_foundation_bridge_count: burden.unknown_foundation_bridge_count,
      unknown_foundations_excluded_from_scour_critical_count: burden.unknown_foundations_excluded_from_scour_critical_count,
      normalization_anchors_pct: [0, 1, 3, 5]
    },
    human_economic_burden: {
      open_scour_critical_bridge_count: traffic.open_scour_critical_bridge_count,
      closed_scour_critical_bridge_count: traffic.closed_scour_critical_bridge_count,
      open_scour_critical_adt_record_count: traffic.open_scour_critical_adt_record_count,
      open_scour_critical_daily_vehicle_crossings: traffic.open_scour_critical_daily_vehicle_crossings,
      normalization_anchors_daily_vehicle_crossings: [0, 1000000, 25000000, 100000000],
      interpretation: traffic.interpretation
    },
    persistence: {
      scour_critical_bridges_requiring_unique_plan_of_action: persistence.scour_critical_bridges_requiring_unique_plan_of_action,
      scour_critical_bridges_requiring_plan_of_action_pct: persistence.scour_critical_bridges_requiring_plan_of_action_pct,
      monitoring_alone_removes_scour_critical_status: persistence.monitoring_alone_removes_scour_critical_status,
      normalization_anchors_pct: [0, 25, 50, 100],
      interpretation: persistence.interpretation
    },
    extent: {
      jurisdictions_with_scour_critical_bridges: extent.jurisdictions_with_scour_critical_bridges,
      reporting_jurisdiction_count: extent.reporting_jurisdiction_count,
      directly_assessed_countries: extent.directly_assessed_countries,
      directly_assessed_country_count: extent.directly_assessed_country_count,
      normalization_anchors_countries: [0, 1, 10, 50],
      scoring_boundary: extent.scoring_boundary
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      aggregate_input_sha256: coverage.aggregate_input_sha256,
      reproduction: snapshot.reproduction
    }
  },
  transformations: [
    {
      type: 'recognized_scour_critical_share_normalization',
      formula: 'Classify only FHWA Item 113 codes 0, 1, 2, and 3 as scour critical, divide their count by all 2025 highway bridge records, and normalize the resulting percentage. Unknown-foundation bridges remain separate.'
    },
    {
      type: 'open_bridge_traffic_exposure_normalization',
      formula: 'Sum reported average daily traffic only for scour-critical bridges with open, posted, restricted, shored, or temporary operating-status codes, then normalize the crossing total. Do not infer unique people, economic loss, or service failure.'
    },
    {
      type: 'required_management_persistence_normalization',
      formula: 'Normalize the share of scour-critical bridges subject to the federal bridge-specific plan-of-action requirement; retain that monitoring alone does not remove scour-critical status.'
    },
    {
      type: 'bounded_country_extent_normalization',
      formula: 'Normalize only the one directly assessed country; broad coverage across 52 United States jurisdictions does not become global coverage.'
    },
    {
      type: 'impact_composite',
      formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1–10 with 1 + 9 × composite and round to one decimal.'
    }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `The FHWA 2025 National Bridge Inventory page was updated ${coverage.inventory_page_updated}; all ${coverage.highway_bridge_count.toLocaleString('en-US')} records were reconciled and hashed when reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The complete 2025 federal bridge inventory and engineering code definitions quantify scour-critical prevalence, open-bridge traffic exposure, the bridge-specific management requirement and nationwide geographic spread under an exact node-metric match.',
    higher_priority_failures: ['The inventory is limited to the United States and participating territories, so it is not a current global observation or defensible global aggregation.', 'A single annual inventory endpoint does not satisfy the 20-annual-observation historical-distribution gate or supply recent global momentum.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for bridge_scour_exposure.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_52_us_bridge_scour_exposure',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-52.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-52.json',
  promoted_node_count: registry.promoted_node_count,
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
