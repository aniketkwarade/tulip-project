import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/wmo-unep-coastal-inundation-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'coastal_inundation_risk',
  method: 'impact_fallback',
  as_of: String(a.assessment_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.sea_level_rate_increase_pct, [0, 25, 60, 120], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.low_lying_coastal_population_exposed_million, [0, 100, 500, 1200], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(a.assessment_period_years, [0, 10, 25, 50], 'higher_is_worse')),
    extent: a.global_extent_normalized
  },
  raw_inputs: {
    biophysical_burden: { early_sea_level_rise_rate_mm_per_year: a.early_sea_level_rise_rate_mm_per_year, early_period: a.early_sea_level_rate_period, recent_sea_level_rise_rate_mm_per_year: a.recent_sea_level_rise_rate_mm_per_year, recent_period: a.recent_sea_level_rate_period, observed_rate_increase_pct: a.sea_level_rate_increase_pct, anchors_pct: [0, 25, 60, 120] },
    human_economic_burden: { low_lying_coastal_population_exposed_million: a.low_lying_coastal_population_exposed_million, population_share_pct_context: a.low_lying_coastal_population_share_pct, additional_people_with_one_in_twenty_annual_flood_chance_million_context: a.additional_people_with_one_in_twenty_annual_coastal_flood_chance_million, anchors_million_people: [0, 100, 500, 1200], boundary: 'Present exposure, not realized annual victims or future exposure.' },
    persistence: { satellite_record_start_year: a.satellite_record_start_year, assessment_year: a.assessment_year, assessment_period_years: a.assessment_period_years, coastal_flood_extent_comparison_period_years_context: a.coastal_flood_extent_comparison_period_years, anchors_years: [0, 10, 25, 50] },
    extent: { geographic_scope: a.geographic_scope, normalized_value: a.global_extent_normalized, boundary: 'Global coastal scope; no inference of uniform hazard or protection.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'observed_sea_level_rate_acceleration', formula: 'Calculate the percentage increase from the WMO 1993-2002 global mean sea-level rate to the 2016-2025 rate.' },
    { type: 'current_exposure_not_realized_loss', formula: 'Normalize WMO current low-lying-coast exposure; retain the UNEP additional 1-in-20 exposure as context and never add overlapping populations.' },
    { type: 'persistent_global_record', formula: 'Normalize the 32-year satellite assessment period and retain global coastal scope without uniform-hazard inference.' }
  ],
  source_ids: ['wmo_unep_global_coastal_inundation_assessments'],
  uncertainty: snapshot.uncertainty,
  freshness: `WMO 2025 update and UNEP 2026 coastal-exposure statement; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'WMO and UNEP quantify observed global hazard acceleration, present exposed population, multi-decadal persistence and worldwide coastal extent.',
    higher_priority_failures: ['The operational NOAA CO-OPS snapshot is a selected-station panel and cannot defensibly aggregate current global coastal inundation exposure.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for coastal_inundation_risk.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_20_wmo_unep_coastal_inundation', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'wmo_unep_global_coastal_inundation_assessments', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-20.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-20.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
