import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/unep-cooling-equity-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));
const assessedPersistenceYears = assessment.report_year - assessment.baseline_year;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'cooling_equity_gaps',
  method: 'impact_fallback',
  as_of: String(assessment.report_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(assessment.current_cooling_emissions_gt_co2e, [0, 2, 4, 8], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(assessment.people_lacking_adequate_cooling_lower_bound_billion, [0, 0.5, 1, 2], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(assessedPersistenceYears, [0, 5, 10, 20], 'higher_is_worse')),
    extent: 1
  },
  raw_inputs: {
    biophysical_burden: {
      current_cooling_emissions_gt_co2e: assessment.current_cooling_emissions_gt_co2e,
      current_cooling_capacity_tw: assessment.current_cooling_capacity_tw,
      anchors_gt_co2e: [0, 2, 4, 8]
    },
    human_economic_burden: {
      people_lacking_adequate_cooling_lower_bound_billion: assessment.people_lacking_adequate_cooling_lower_bound_billion,
      anchors_billion_people: [0, 0.5, 1, 2],
      boundary: 'Lower-bound current access gap; projected 2050 access needs and heat deaths are excluded from scoring.'
    },
    persistence: {
      assessment_baseline_year: assessment.baseline_year,
      report_year: assessment.report_year,
      assessed_persistence_years: assessedPersistenceYears,
      anchors_years: [0, 5, 10, 20],
      boundary: 'Duration between the source baseline and report assessment, not a reconstructed annual history.'
    },
    extent: {
      normalized_value: 1,
      geography_boundary: assessment.geography_boundary,
      countries_referencing_cooling_in_climate_or_energy_plans_context_only: assessment.countries_referencing_cooling_in_climate_or_energy_plans,
      signatory_share_global_cooling_emissions_pct_context_only: assessment.signatory_share_global_cooling_emissions_pct
    },
    excluded_projections: {
      business_as_usual_2050_capacity_tw: assessment.business_as_usual_2050_capacity_tw_projection,
      business_as_usual_2050_emissions_gt_co2e: assessment.business_as_usual_2050_emissions_gt_co2e_projection,
      people_needing_access_by_2050_billion: assessment.people_needing_access_by_2050_projection_billion
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      source_locators: assessment.source_locators
    }
  },
  transformations: [
    {
      type: 'conservative_fixed_assessment_ranges',
      formula: 'Normalize current source-reported cooling emissions and the lower-bound access gap through named fixed ranges; future projections remain unscored metadata.'
    },
    {
      type: 'assessment_period_persistence',
      formula: '2025 report year minus 2022 source baseline year; do not fabricate intervening annual observations.'
    },
    {
      type: 'global_assessment_extent',
      formula: 'The retained current access-gap and cooling-sector estimates are explicitly global.'
    }
  ],
  source_ids: ['unep_global_cooling_watch_2025'],
  uncertainty: snapshot.uncertainty,
  freshness: `UNEP Global Cooling Watch 2025 assessment against its ${assessment.baseline_year} baseline; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNEP quantifies the current global cooling access gap, current sector capacity and emissions, a named baseline period, and global assessment extent.',
    higher_priority_failures: [
      'The report does not provide at least 20 complete annual or 60 monthly global observations.',
      'Projected 2050 outcomes cannot supply current magnitude, threshold position or recent momentum.'
    ]
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for cooling_equity_gaps.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_6_unep_cooling_equity',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'unep_global_cooling_watch_2025',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-6.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-6.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
