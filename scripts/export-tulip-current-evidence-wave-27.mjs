import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOAA_PATH = 'public/noaa-coastal-hypoxia-snapshot.json';
const IOC_PATH = 'public/ioc-global-ocean-oxygen-impact-snapshot.json';
const [noaa, ioc] = await Promise.all([NOAA_PATH, IOC_PATH].map(async file => JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'))));
const n = noaa.records[0];
const g = ioc.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));
const managementGoalKm2 = 5000;
const goalExceedanceRatio = n.converted_hypoxic_area_square_kilometres / managementGoalKm2;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'coastal_hypoxia',
  method: 'current_data',
  as_of: String(n.observation_year),
  components: {
    magnitude: round(normalizeWithAnchors(n.converted_hypoxic_area_square_kilometres, [0, 5000, 10000, 20000], 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(goalExceedanceRatio, [1, 1.25, 2, 4], 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(g.coastal_low_oxygen_sites_lower_bound, [0, 50, 250, 750], 'higher_is_worse')),
    extent: g.global_extent_normalized
  },
  raw_inputs: {
    magnitude: { noaa_gulf_hypoxic_area_km2: n.converted_hypoxic_area_square_kilometres, source_reported_square_miles: n.source_reported_hypoxic_area_square_miles, survey_window: [n.survey_start_date_label, n.survey_end_date_label], anchors_km2: [0, 5000, 10000, 20000], geography: n.geography },
    threshold: { dissolved_oxygen_threshold_mg_l: n.dissolved_oxygen_threshold_mg_l, hypoxic_area_management_goal_km2: managementGoalKm2, goal_horizon_year: 2035, observed_to_goal_ratio: round(goalExceedanceRatio), anchors_ratio: [1, 1.25, 2, 4], boundary: 'EPA goal is a five-year running-average area; the annual 2025 observation is retained as an annual value and not mislabeled as that average.' },
    momentum: { role: 'accumulated_impact_fill_for_unavailable_global_momentum', global_coastal_low_oxygen_sites_lower_bound: g.coastal_low_oxygen_sites_lower_bound, comparison_start_decade: g.comparison_start_decade, anchors_sites: [0, 50, 250, 750], boundary: 'Site inventory is used only as accumulated spread evidence; it is not an annual trend or global area.' },
    extent: { geographic_scope: g.geographic_scope, normalized_value: g.global_extent_normalized, boundary: 'Global presence, not uniform coverage or concurrent area.' },
    source_snapshots: [{ path: NOAA_PATH, version: noaa.version, captured_at: noaa.captured_at }, { path: IOC_PATH, version: ioc.version, captured_at: ioc.captured_at, source_locators: g.source_locators }],
    current_data_coverage_weight: 0.6,
    accumulated_impact_fill_weight: 0.4
  },
  transformations: [
    { type: 'bounded_current_area', formula: 'Normalize the NOAA source-reported 2025 northern-Gulf hypoxic-zone area; do not extrapolate it to other coasts.' },
    { type: 'recognized_management_goal_position', formula: 'Divide the annual observed area by the EPA Hypoxia Task Force 5,000-square-kilometre management goal while preserving the annual-versus-five-year-average distinction.' },
    { type: 'accumulated_global_fill', formula: 'Use the IOC-UNESCO lower-bound coastal site inventory for the unavailable momentum component and global presence for extent; never convert sites to area.' }
  ],
  source_ids: ['noaa_dynamics_and_distribution_of_natural_and_human_caused_coastal_hypoxia', 'ioc_unesco_global_ocean_oxygen_network'],
  uncertainty: `${noaa.uncertainty} ${ioc.uncertainty}`,
  freshness: `NOAA ${n.observation_year} midsummer survey and current IOC-UNESCO GO2NE assessment; companion snapshot captured ${ioc.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'NOAA supplies current magnitude and recognized threshold position for 60 percent of component weight; quantitative IOC-UNESCO accumulated-impact indicators fill the remaining 40 percent and establish global presence.',
    higher_priority_failures: []
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for coastal_hypoxia.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_27_noaa_ioc_coastal_hypoxia', generated_at: new Date().toISOString(), source_snapshots: [NOAA_PATH, IOC_PATH], source_ids: receipt.source_ids, promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-27.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-27.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
