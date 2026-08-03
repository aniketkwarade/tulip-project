import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/wmo-unesco-glacier-water-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'glacier_meltwater_dependency',
  method: 'impact_fallback',
  as_of: String(a.water_report_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.global_glacier_mass_loss_gt, [0, 100, 300, 600], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.people_relying_on_glacier_and_snow_melt_billion_lower_bound, [0, 0.5, 1.5, 3], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(a.consecutive_all_region_loss_years, [0, 1, 3, 10], 'higher_is_worse')),
    extent: round(a.glaciated_regions_with_loss / a.glaciated_regions_assessed)
  },
  raw_inputs: {
    biophysical_burden: {
      global_glacier_mass_loss_gt: a.global_glacier_mass_loss_gt,
      sea_level_equivalent_mm_context_only: a.global_mean_sea_level_equivalent_mm,
      anchors_gt: [0, 100, 300, 600],
      measurement_support: { field_glaciers_approx: a.field_monitored_glaciers_approx, geodetic_glaciers_lower_bound: a.geodetically_measured_glaciers_lower_bound, geodetic_coverage_pct: a.geodetic_global_glacier_coverage_pct }
    },
    human_economic_burden: {
      people_relying_on_glacier_and_snow_melt_billion_lower_bound: a.people_relying_on_glacier_and_snow_melt_billion_lower_bound,
      anchors_billion_people: [0, 0.5, 1.5, 3],
      boundary: 'Dependence on melt from glaciers and snow; not glacier-only water-supply share and not a count experiencing shortage.'
    },
    persistence: {
      consecutive_all_region_loss_years: a.consecutive_all_region_loss_years,
      small_glacier_region_peak_water_status: a.small_glacier_region_peak_water_status,
      anchors_years: [0, 1, 3, 10]
    },
    extent: {
      glaciated_regions_with_loss: a.glaciated_regions_with_loss,
      glaciated_regions_assessed: a.glaciated_regions_assessed,
      normalized_value: round(a.glaciated_regions_with_loss / a.glaciated_regions_assessed)
    },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'global_glacier_mass_burden', formula: 'Normalize the source-reported 2024 global glacier mass loss through a fixed gigatonne range; retain sea-level equivalent as context only.' },
    { type: 'bounded_meltwater_dependence', formula: 'Normalize the official lower-bound population relying on glacier-and-snow melt while preserving its snow-inclusive exposure boundary.' },
    { type: 'all_region_persistence_and_extent', formula: 'Use the source-reported third consecutive all-region loss year and divide 19 loss regions by 19 assessed regions.' }
  ],
  source_ids: ['wmo_unesco_global_glacier_water_assessments'],
  uncertainty: snapshot.uncertainty,
  freshness: `WMO State of Global Water Resources ${a.water_report_year} and UN glacier-water assessment ${a.publication_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'Official global assessments quantify glacier mass loss, glacier-and-snow meltwater dependence, consecutive persistence and complete glacier-region extent.',
    higher_priority_failures: ['No harmonized current global series measures glacier-derived runoff as a share of seasonal human water supply, so the current-data method does not pass the exact node contract.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for glacier_meltwater_dependency.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_17_wmo_unesco_glacier_water', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'wmo_unesco_global_glacier_water_assessments', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-17.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-17.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
