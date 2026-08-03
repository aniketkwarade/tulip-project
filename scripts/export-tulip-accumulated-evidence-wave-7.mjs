import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/fao-fishery-protein-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));
const perCapitaIncreasePct = (assessment.global_aquatic_food_consumption_kg_per_capita_2021 / assessment.global_aquatic_food_consumption_kg_per_capita_1961 - 1) * 100;
const assessedYears = assessment.latest_consumption_year - 1961;
const regionalCoveragePct = Object.values(assessment.aquatic_animal_production_region_share_pct).reduce((sum, value) => sum + value, 0);

const receipt = buildTulipUrgencyReceipt({
  node_id: 'fishery_protein_dependence',
  method: 'impact_fallback',
  as_of: String(assessment.latest_consumption_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(perCapitaIncreasePct, [0, 25, 50, 100], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(assessment.people_receiving_at_least_20pct_animal_protein_billion, [0, 1, 2, 4], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(assessedYears, [0, 10, 25, 50], 'higher_is_worse')),
    extent: round(regionalCoveragePct / 100)
  },
  raw_inputs: {
    biophysical_burden: {
      global_aquatic_animal_food_consumption_million_tonnes: assessment.global_aquatic_animal_food_consumption_million_tonnes,
      per_capita_kg_1961: assessment.global_aquatic_food_consumption_kg_per_capita_1961,
      per_capita_kg_2021: assessment.global_aquatic_food_consumption_kg_per_capita_2021,
      per_capita_increase_pct: round(perCapitaIncreasePct),
      anchors_increase_pct: [0, 25, 50, 100],
      boundary: 'Dependency pressure only; this component does not assert ecological damage or unsustainable harvest.'
    },
    human_economic_burden: {
      people_receiving_at_least_20pct_animal_protein_billion: assessment.people_receiving_at_least_20pct_animal_protein_billion,
      animal_protein_dependency_threshold_pct: assessment.animal_protein_dependency_threshold_pct,
      anchors_billion_people: [0, 1, 2, 4],
      primary_sector_employment_million_context_only: assessment.primary_sector_employment_million,
      first_sale_value_usd_billion_context_only: assessment.total_fisheries_aquaculture_first_sale_value_usd_billion
    },
    persistence: {
      start_year: 1961,
      end_year: assessment.latest_consumption_year,
      assessed_year_span: assessedYears,
      anchors_years: [0, 10, 25, 50]
    },
    extent: {
      normalized_value: round(regionalCoveragePct / 100),
      source_reported_regional_production_shares_pct: assessment.aquatic_animal_production_region_share_pct,
      source_reported_share_sum_pct: regionalCoveragePct,
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
      type: 'source_endpoint_dependence_change',
      formula: '(2021 global per-capita aquatic-food consumption / 1961 value - 1) × 100; endpoints are source reported and no intervening annual series is fabricated.'
    },
    {
      type: 'population_dependence_range',
      formula: 'Normalize the source-reported population receiving at least 20% of animal protein from aquatic foods through a named fixed range.'
    },
    {
      type: 'source_regional_extent',
      formula: 'Sum source-reported aquatic-animal production shares across Asia, Europe, Latin America and the Caribbean, Africa, Northern America and Oceania.'
    }
  ],
  source_ids: ['fao_the_state_of_world_fisheries_and_aquaculture_2024'],
  uncertainty: snapshot.uncertainty,
  freshness: `FAO SOFIA 2024 with consumption dependence through ${assessment.latest_consumption_year} and production context for ${assessment.production_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'FAO quantifies accumulated global consumption dependence, a population-level animal-protein reliance threshold, six-region production extent and a sixty-year endpoint comparison.',
    higher_priority_failures: [
      'The assessment summary supplies endpoints rather than a complete 20-year annual observation series for the contracted dependency measure.',
      'No recognized urgency threshold or source-consistent recent momentum series is available for current-data scoring.'
    ]
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for fishery_protein_dependence.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_7_fao_fishery_protein_dependence',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'fao_the_state_of_world_fisheries_and_aquaculture_2024',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-7.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-7.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
