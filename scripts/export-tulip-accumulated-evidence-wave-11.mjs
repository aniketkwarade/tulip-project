import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/fao-sofi-food-insecurity-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'food_insecurity',
  method: 'impact_fallback',
  as_of: String(assessment.observation_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(assessment.global_moderate_or_severe_food_insecurity_prevalence_pct, [0, 10, 25, 50], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(assessment.unable_to_afford_healthy_diet_share_pct_implied, [0, 10, 25, 50], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(assessment.comparison_interval_years, [0, 3, 7, 10], 'higher_is_worse')),
    extent: round(assessment.global_moderate_or_severe_food_insecurity_prevalence_pct / 100)
  },
  raw_inputs: {
    biophysical_burden: {
      global_moderate_or_severe_food_insecurity_prevalence_pct: assessment.global_moderate_or_severe_food_insecurity_prevalence_pct,
      global_moderate_or_severe_food_insecurity_people_billion_rounded: assessment.global_moderate_or_severe_food_insecurity_people_billion_rounded,
      anchors_pct: [0, 10, 25, 50],
      boundary: 'Physiological and experiential food-access burden; not crop production, calorie deficiency alone or an acute IPC phase count.'
    },
    human_economic_burden: {
      global_unable_to_afford_healthy_diet_people_billion_rounded: assessment.global_unable_to_afford_healthy_diet_people_billion_rounded,
      population_denominator_billion_implied_from_hunger_estimate: assessment.population_denominator_billion_implied_from_hunger_estimate,
      unable_to_afford_healthy_diet_share_pct_implied: assessment.unable_to_afford_healthy_diet_share_pct_implied,
      anchors_pct: [0, 10, 25, 50],
      derivation_boundary: assessment.derivation_boundary
    },
    persistence: {
      comparison_interval_start_year: assessment.comparison_interval_start_year,
      observation_year: assessment.observation_year,
      comparison_interval_years: assessment.comparison_interval_years,
      additional_people_facing_hunger_since_2015_million: assessment.additional_people_facing_hunger_since_2015_million,
      additional_people_facing_hunger_since_2020_million: assessment.additional_people_facing_hunger_since_2020_million,
      anchors_years: [0, 3, 7, 10]
    },
    extent: {
      global_moderate_or_severe_food_insecurity_prevalence_pct: assessment.global_moderate_or_severe_food_insecurity_prevalence_pct,
      normalized_value: round(assessment.global_moderate_or_severe_food_insecurity_prevalence_pct / 100),
      africa_hunger_people_million_context_only: assessment.africa_hunger_people_million,
      africa_hunger_prevalence_pct_context_only: assessment.africa_hunger_prevalence_pct,
      geography_boundary: 'World population prevalence; regional values remain context and are not re-summed.'
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
      type: 'fixed_global_burden_ranges',
      formula: 'Normalize source-reported food-insecurity prevalence and the explicitly derived healthy-diet unaffordability share through named percentage ranges.'
    },
    {
      type: 'bounded_rounded_count_derivation',
      formula: 'Derive an approximate population denominator from the source-reported hunger count and prevalence, then derive the affordability share; retain rounded-input uncertainty.'
    },
    {
      type: 'source_reported_persistence_interval',
      formula: 'Use the 2015-2024 comparison interval only because the source explicitly reports that the number facing hunger remains 100 million above 2015.'
    }
  ],
  source_ids: ['fao_state_of_food_security_and_nutrition_2025'],
  uncertainty: snapshot.uncertainty,
  freshness: `SOFI 2025 assessment of 2024 conditions; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'SOFI 2025 quantifies global prevalence, people affected, healthy-diet affordability, decade-scale persistence and worldwide extent with source-reported uncertainty.',
    higher_priority_failures: [
      'The harmonized FIES series available in the operational SDG snapshot does not provide at least 20 complete annual or 60 monthly global observations.',
      'The assessment provides benchmark and comparison-year evidence rather than a source-consistent current series that passes the current-data historical-distribution gate.'
    ]
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for food_insecurity.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_11_fao_sofi_food_insecurity',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'fao_state_of_food_security_and_nutrition_2025',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-11.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-11.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
