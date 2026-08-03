import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/world-bank-desalination-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'desalination_dependence',
  method: 'impact_fallback',
  as_of: String(assessment.report_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(assessment.implied_global_installed_capacity_million_m3_day, [0, 25, 50, 100], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(assessment.people_supplied_daily_million, [0, 100, 200, 500], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(assessment.source_capacity_panel_year_span, [0, 5, 10, 20], 'higher_is_worse')),
    extent: round(assessment.countries_using_desalination_lower_bound / 193)
  },
  raw_inputs: {
    biophysical_burden: {
      middle_east_capacity_million_m3_day: assessment.middle_east_capacity_million_m3_day,
      middle_east_share_global_capacity_pct: assessment.middle_east_share_global_capacity_pct,
      implied_global_installed_capacity_million_m3_day: assessment.implied_global_installed_capacity_million_m3_day,
      anchors_million_m3_day: [0, 25, 50, 100],
      boundary: 'Installed capacity, not actual production or municipal-supply share.'
    },
    human_economic_burden: {
      people_supplied_daily_million: assessment.people_supplied_daily_million,
      anchors_million_people: [0, 100, 200, 500],
      global_desalination_plants_lower_bound_context_only: assessment.global_desalination_plants_lower_bound
    },
    persistence: {
      source_capacity_panel_start_year: assessment.source_capacity_panel_start_year,
      source_capacity_panel_end_year: assessment.source_capacity_panel_end_year,
      source_capacity_panel_year_span: assessment.source_capacity_panel_year_span,
      anchors_years: [0, 5, 10, 20],
      boundary: 'Persistence uses only the report figure period and does not reconstruct annual capacity values.'
    },
    extent: {
      countries_using_desalination_lower_bound: assessment.countries_using_desalination_lower_bound,
      un_member_state_denominator: 193,
      normalized_value: round(assessment.countries_using_desalination_lower_bound / 193),
      geography_boundary: assessment.geography_boundary
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
      type: 'transparent_global_capacity_implication',
      formula: '34.1 million m3/day Middle East capacity / 0.44 source-reported global share; retain rounding uncertainty and label as installed capacity.'
    },
    {
      type: 'fixed_dependence_ranges',
      formula: 'Normalize implied installed capacity and approximate people supplied through named fixed ranges.'
    },
    {
      type: 'country_extent_ratio',
      formula: 'More than 150 source-reported countries using desalination / 193 UN Member States; use 150 as a conservative lower bound.'
    }
  ],
  source_ids: ['world_bank_the_role_of_desalination_in_an_increasingly_water_scarce_world'],
  uncertainty: snapshot.uncertainty,
  freshness: `World Bank ${assessment.report_year} global technical assessment; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The World Bank quantifies global plant stock, an installed-capacity share, people supplied, a multi-year capacity panel and country extent.',
    higher_priority_failures: [
      'The public assessment does not provide 20 complete annual global observations for the contracted supply-dependence measure.',
      'No recognized global urgency threshold or source-consistent recent momentum series supports current-data scoring.'
    ]
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for desalination_dependence.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_9_world_bank_desalination',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'world_bank_the_role_of_desalination_in_an_increasingly_water_scarce_world',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-9.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-9.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
