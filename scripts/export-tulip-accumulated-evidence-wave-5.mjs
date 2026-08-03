import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/unep-fao-cold-chain-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'cold_chain_failure_risk',
  method: 'impact_fallback',
  as_of: String(assessment.observation_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(assessment.attributable_emissions_gigatonnes_co2e, [0, 0.25, 0.5, 1], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(assessment.small_scale_farmer_income_loss_pct, [0, 5, 10, 20], 'higher_is_worse')),
    persistence: 1,
    extent: 1
  },
  raw_inputs: {
    biophysical_burden: {
      food_loss_due_to_lack_of_effective_refrigeration_million_tonnes: assessment.food_loss_due_to_lack_of_effective_refrigeration_million_tonnes,
      food_loss_due_to_lack_of_effective_refrigeration_share_global_production_pct: assessment.food_loss_due_to_lack_of_effective_refrigeration_share_global_production_pct,
      attributable_emissions_gigatonnes_co2e: assessment.attributable_emissions_gigatonnes_co2e,
      anchors_gigatonnes_co2e: [0, 0.25, 0.5, 1]
    },
    human_economic_burden: {
      small_scale_farmers_with_income_impact_million: assessment.small_scale_farmers_with_income_impact_million,
      small_scale_farmer_income_loss_pct: assessment.small_scale_farmer_income_loss_pct,
      anchors_income_loss_pct: [0, 5, 10, 20],
      people_equivalent_food_supply_billion_context_only: assessment.people_equivalent_food_supply_billion
    },
    persistence: {
      normalized_value: 1,
      recurrence_period: 'annual',
      assessment_language: 'The report expresses the refrigeration-attributable food loss and associated burden as annual quantities.',
      boundary: 'Annual recurrence is scored; no multi-year trend is inferred.'
    },
    extent: {
      normalized_value: 1,
      geography_boundary: assessment.geography_boundary,
      developing_country_annual_food_savings_potential_million_tonnes: assessment.developing_country_annual_food_savings_potential_million_tonnes
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
      formula: 'Normalize source-attributed annual emissions and farmer income loss through named fixed impact ranges; mass, people and emissions-share values remain corroborating context rather than extra points.'
    },
    {
      type: 'source_reported_annual_persistence',
      formula: 'Score one for explicit annual recurrence while declining to infer a multi-year trend from the assessment.'
    },
    {
      type: 'global_assessment_extent',
      formula: 'Score global extent only because the source quantity is explicitly a share of global food production; the developing-country estimate remains separate.'
    }
  ],
  source_ids: ['unep_and_fao_sustainable_food_cold_chains'],
  uncertainty: snapshot.uncertainty,
  freshness: `Joint UNEP-FAO 2022 assessment using source-attributed ${assessment.observation_year} cold-chain loss quantities; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The global assessment quantifies refrigeration-attributable food-loss mass and share, annual emissions, farmer income loss and affected livelihoods, recurrence, and global extent.',
    higher_priority_failures: [
      'The assessment is not a 20-year annual or 60-month global observation series.',
      'No source-consistent global history supplies current magnitude plus threshold position or momentum for cold-chain failures.'
    ]
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for cold_chain_failure_risk.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_5_unep_fao_cold_chain',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'unep_and_fao_sustainable_food_cold_chains',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-5.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-5.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
