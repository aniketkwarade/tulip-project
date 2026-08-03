import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-agricultural-health-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));
const n = (value, anchors) => round(normalizeWithAnchors(value, anchors, 'higher_is_worse'));

function receipt({ nodeId, asOf, components, rawInputs, transformations, sourceIds, passed, failures }) {
  const item = buildTulipUrgencyReceipt({
    node_id: nodeId, method: 'impact_fallback', as_of: String(asOf), components,
    raw_inputs: { ...rawInputs, source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at } },
    transformations, source_ids: sourceIds, uncertainty: snapshot.uncertainty,
    freshness: `Reviewed global agricultural-health assessment through ${asOf}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: { selected_method_passed: passed, higher_priority_failures: failures }
  });
  if (!verifyTulipUrgencyReceipt(item).valid) throw new Error(`Receipt verification failed for ${nodeId}.`);
  return item;
}

const receipts = [
  receipt({
    nodeId: 'agricultural_labor_exposure', asOf: a.lancet_observation_year,
    components: {
      biophysical_burden: n(a.global_agricultural_potential_work_hours_lost / 1e9, [0, 50, 200, 500]),
      human_economic_burden: n(a.ilo_agricultural_workers_million, [0, 100, 500, 1000]),
      persistence: n(a.lancet_complete_annual_observations, [0, 10, 20, 40]),
      extent: 1
    },
    rawInputs: {
      biophysical_burden: { global_agricultural_potential_work_hours_lost_billion: round(a.global_agricultural_potential_work_hours_lost / 1e9), total_global_potential_work_hours_lost_billion: round(a.global_total_potential_work_hours_lost / 1e9), anchors_billion_hours: [0, 50, 200, 500] },
      human_economic_burden: { global_agricultural_workers_million: a.ilo_agricultural_workers_million, anchors_million_workers: [0, 100, 500, 1000] },
      persistence: { complete_annual_lancet_observations: a.lancet_complete_annual_observations, anchors_years: [0, 10, 20, 40] },
      extent: { geography: 'global modeled agricultural heat-work burden and global agricultural workforce', normalized_value: 1 }
    },
    transformations: [
      { type: 'agricultural_heat_work_burden', formula: 'Convert source thousand-hours to hours and normalize the agricultural component only; do not add it to the all-sector total.' },
      { type: 'agricultural_worker_scope', formula: 'Normalize the ILO global agricultural workforce as exposed scope, not as a count of injured workers.' },
      { type: 'observed_series_persistence', formula: 'Normalize the number of complete annual Lancet global observations.' },
      { type: 'global_extent', formula: 'Assign full extent for the source global model and workforce assessment.' }
    ],
    sourceIds: ['lancet_countdown_data_explorer', 'ilo_working_on_a_warmer_planet'],
    passed: 'Lancet and ILO quantify current global agricultural heat-work loss, the exposed workforce, a 35-year annual series and global scope.',
    failures: ['The node contract does not have a globally observed worker-level threshold-exposure census, so the accumulated impact tier is used.']
  }),
  receipt({
    nodeId: 'livestock_disease_pressure', asOf: a.animal_health_report_year,
    components: {
      biophysical_burden: n(a.global_animal_production_loss_linked_to_disease_pct, [0, 5, 12, 25]),
      human_economic_burden: n(a.annual_farmer_economic_loss_usd_billion, [0, 25, 125, 350]),
      persistence: n(a.high_pathogenicity_avian_influenza_outbreaks_2025_2026_lower_bound, [0, 100, 750, 2500]),
      extent: round(a.high_pathogenicity_avian_influenza_reporting_countries_and_territories / 193)
    },
    rawInputs: {
      biophysical_burden: { global_animal_production_loss_linked_to_disease_pct: a.global_animal_production_loss_linked_to_disease_pct, anchors_pct: [0, 5, 12, 25] },
      human_economic_burden: { annual_farmer_economic_loss_usd_billion: a.annual_farmer_economic_loss_usd_billion, anchors_usd_billion: [0, 25, 125, 350] },
      persistence: { hpai_outbreaks_2025_2026_lower_bound: a.high_pathogenicity_avian_influenza_outbreaks_2025_2026_lower_bound, poultry_culled_or_lost_million_lower_bound: a.poultry_culled_or_lost_million_lower_bound, anchors_outbreaks: [0, 100, 750, 2500] },
      extent: { hpai_reporting_countries_and_territories: a.high_pathogenicity_avian_influenza_reporting_countries_and_territories, denominator_un_member_states: 193 }
    },
    transformations: [
      { type: 'animal_production_loss', formula: 'Normalize the WOAH synthesized global share of animal production lost to disease.' },
      { type: 'farmer_economic_loss', formula: 'Normalize annual farmer losses without adding outbreak-specific values.' },
      { type: 'current_outbreak_burden', formula: 'Normalize the lower-bound HPAI outbreak count; retain poultry loss separately.' },
      { type: 'reported_country_extent', formula: 'Divide countries and territories reporting HPAI outbreaks by 193 UN Member States as a conservative denominator.' }
    ],
    sourceIds: ['woah_state_of_world_animal_health_2026'],
    passed: 'WOAH quantifies global production and farmer losses plus current outbreak burden and reporting-country extent.',
    failures: ['No single method-comparable global annual multi-disease surveillance series supplies the current-data gate.']
  }),
  receipt({
    nodeId: 'zoonotic_disease_outbreaks', asOf: a.animal_health_report_year,
    components: {
      biophysical_burden: n(a.emerging_infectious_human_diseases_with_animal_origin_pct, [0, 20, 50, 80]),
      human_economic_burden: n(a.annual_farmer_economic_loss_usd_billion, [0, 25, 125, 350]),
      persistence: n(a.high_pathogenicity_avian_influenza_outbreaks_2025_2026_lower_bound, [0, 100, 750, 2500]),
      extent: round(a.high_pathogenicity_avian_influenza_reporting_countries_and_territories / 193)
    },
    rawInputs: {
      biophysical_burden: { emerging_infectious_human_diseases_with_animal_origin_pct: a.emerging_infectious_human_diseases_with_animal_origin_pct, anchors_pct: [0, 20, 50, 80], boundary: 'Origin share is a structural zoonotic burden, not a count of current human cases.' },
      human_economic_burden: { global_animal_disease_farmer_loss_usd_billion_per_year: a.annual_farmer_economic_loss_usd_billion, anchors_usd_billion: [0, 25, 125, 350] },
      persistence: { current_hpai_outbreaks_lower_bound: a.high_pathogenicity_avian_influenza_outbreaks_2025_2026_lower_bound, poultry_culled_or_lost_million_lower_bound: a.poultry_culled_or_lost_million_lower_bound, anchors_outbreaks: [0, 100, 750, 2500] },
      extent: { current_hpai_reporting_countries_and_territories: a.high_pathogenicity_avian_influenza_reporting_countries_and_territories, denominator_un_member_states: 193 }
    },
    transformations: [
      { type: 'zoonotic_origin_burden', formula: 'Normalize the WOAH share of emerging human infectious diseases with animal origin; do not infer current cases.' },
      { type: 'animal_disease_economic_scope', formula: 'Normalize global farmer losses as the economic burden of the animal-health interface.' },
      { type: 'current_animal_outbreak_burden', formula: 'Normalize current HPAI animal outbreaks as a zoonotic-pressure indicator, not as human outbreaks.' },
      { type: 'reported_country_extent', formula: 'Divide current reporting countries and territories by 193 UN Member States.' }
    ],
    sourceIds: ['woah_state_of_world_animal_health_2026'],
    passed: 'WOAH quantifies the structural zoonotic share, current transboundary HPAI outbreak burden, animal-health economic loss and geographic extent.',
    failures: ['The source does not provide a complete annual global series of confirmed human zoonotic outbreaks, so the score remains an accumulated-impact fallback.']
  })
];

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_38_global_agricultural_heat_and_animal_health', generated_at: new Date().toISOString(), promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-38.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-38.json', receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
