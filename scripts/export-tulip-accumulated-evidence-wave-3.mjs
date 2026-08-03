import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/unep-food-waste-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'food_waste',
  method: 'impact_fallback',
  as_of: String(assessment.observation_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(assessment.share_of_food_available_to_consumers_pct, [0, 5, 10, 20], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(assessment.estimated_annual_economic_cost_usd_trillion_lower_bound, [0, 0.25, 0.5, 1], 'higher_is_worse')),
    persistence: 1,
    extent: 1
  },
  raw_inputs: {
    biophysical_burden: {
      global_food_waste_million_tonnes: assessment.global_food_waste_million_tonnes,
      global_food_waste_kg_per_capita_year: assessment.global_food_waste_kg_per_capita_year,
      share_of_food_available_to_consumers_pct: assessment.share_of_food_available_to_consumers_pct,
      anchors_pct: [0, 5, 10, 20],
      related_resource_burdens: {
        global_ghg_emissions_share_range_pct: assessment.global_ghg_emissions_share_range_pct,
        global_agricultural_land_squandered_pct: assessment.global_agricultural_land_squandered_pct,
        agriculture_freshwater_squandered_pct: assessment.agriculture_freshwater_squandered_pct
      }
    },
    human_economic_burden: {
      estimated_annual_economic_cost_usd_trillion_lower_bound: assessment.estimated_annual_economic_cost_usd_trillion_lower_bound,
      anchors_usd_trillion: [0, 0.25, 0.5, 1],
      concurrent_hunger_context_excluded_from_scoring: 'The report discusses hunger and food insecurity, but those contextual counts do not become extra urgency points.'
    },
    persistence: {
      household_meals_wasted_per_day_lower_bound_billion: assessment.household_meals_wasted_per_day_lower_bound_billion,
      recurrence_days_per_year: 365,
      reference_days_per_year: 365,
      normalized_value: 1,
      definition: 'The source reports at least one billion household meals wasted per day; persistence records daily recurrence across the assessment year, not a multi-year trend.'
    },
    extent: {
      normalized_value: 1,
      geography_boundary: assessment.geography_boundary,
      sectors: ['household', 'food service', 'retail'],
      sector_shares_pct: [assessment.household.share_pct, assessment.food_service.share_pct, assessment.retail.share_pct]
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
      type: 'fixed_global_assessment_ranges',
      formula: 'Normalize the source-reported consumer-food-waste share and annual economic-cost lower bound through named fixed impact ranges; do not infer a trend across report editions.'
    },
    {
      type: 'quantitative_daily_persistence',
      formula: '365 reported recurring days / 365 calendar days.'
    },
    {
      type: 'global_assessment_extent',
      formula: 'The report constructs a global estimate for every country; extrapolated countries remain explicitly uncertain rather than counted as observed zeros.'
    }
  ],
  source_ids: ['unep_food_waste_index'],
  uncertainty: snapshot.uncertainty,
  freshness: `UNEP 2024 assessment of ${assessment.observation_year} food waste; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The UNEP assessment quantifies global waste mass and share, annual economic cost, daily recurrence, three consumer-facing sectors, resource burdens, and every-country global extent.',
    higher_priority_failures: [
      'The report explicitly says the 2019 and 2022 estimates should not be interpreted as a measured trend because methods and coverage changed.',
      'No comparable 20-year annual or 60-month global observation series is available, so current-data scoring is not used.'
    ]
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for food_waste.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_3_unep_food_waste',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'unep_food_waste_index',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-3.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-3.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
