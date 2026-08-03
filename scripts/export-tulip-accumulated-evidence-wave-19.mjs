import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/ramsar-global-wetland-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'wetlands_drainage_scales',
  method: 'impact_fallback',
  as_of: String(a.report_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.wetland_share_lost_pct, [0, 5, 15, 30], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.accumulated_services_lost_trillion_2023_intl_usd, [0, 0.25, 2, 7.5], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(a.assessment_period_years, [0, 10, 30, 60], 'higher_is_worse')),
    extent: a.global_extent_normalized
  },
  raw_inputs: {
    biophysical_burden: { wetland_area_lost_million_hectares: a.wetland_area_lost_million_hectares, wetland_share_lost_pct: a.wetland_share_lost_pct, remaining_wetlands_poor_condition_pct_context: a.remaining_wetlands_poor_condition_pct, anchors_pct_lost: [0, 5, 15, 30], boundary: 'All assessed natural wetland loss; not agricultural drainage alone.' },
    human_economic_burden: { accumulated_services_lost_trillion_2023_intl_usd: a.accumulated_services_lost_trillion_2023_intl_usd, anchors_trillion_2023_intl_usd: [0, 0.25, 2, 7.5], boundary: 'Assessment valuation of services already lost since 1970; remaining or projected service value excluded.' },
    persistence: { baseline_year: a.baseline_year, report_year: a.report_year, assessment_period_years: a.assessment_period_years, ongoing_annual_decline_pct_context: a.ongoing_annual_decline_pct, anchors_years: [0, 10, 30, 60] },
    extent: { assessed_natural_wetland_types: a.assessed_natural_wetland_types, geographic_scope: a.geographic_scope, normalized_value: a.global_extent_normalized },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'accumulated_global_area_loss', formula: 'Normalize the source-reported share of assessed natural wetland area lost since 1970 through fixed versioned percentage anchors.' },
    { type: 'realized_service_loss_only', formula: 'Normalize the assessment valuation of services already lost; exclude remaining annual value and projected future loss.' },
    { type: 'persistent_global_assessment', formula: 'Normalize the fixed 1970-to-2025 assessment period and retain global scope without inferring uniform regional loss.' }
  ],
  source_ids: ['ramsar_global_wetland_outlook_2025'],
  uncertainty: snapshot.uncertainty,
  freshness: `Global Wetland Outlook ${a.report_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The Convention on Wetlands quantifies accumulated global area loss, realized service-value loss, a 55-year persistence window and worldwide extent.',
    higher_priority_failures: ['The existing FAOSTAT organic-soil snapshot covers agricultural cropland and grassland drainage only and does not provide a complete current global all-wetland series.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for wetlands_drainage_scales.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_19_ramsar_global_wetlands', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'ramsar_global_wetland_outlook_2025', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-19.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-19.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
