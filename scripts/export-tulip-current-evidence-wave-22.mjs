import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/aqueduct-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.global_water_stress_assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

if (!a) throw new Error('Aqueduct global water-stress assessment is missing.');
if (a.global_water_demand_increase_multiple_lower_bound < 2) throw new Error('Global demand endpoint statement no longer supports the retained lower bound.');
if (a.extreme_water_stress_withdrawal_to_renewable_supply_threshold_pct !== 80) throw new Error('Aqueduct extreme-stress threshold changed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'water_stress',
  method: 'current_data',
  as_of: String(a.assessment_year),
  components: {
    magnitude: round(normalizeWithAnchors(a.global_population_share_in_those_countries_pct, [0, 10, 25, 50], 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(a.extreme_water_stress_withdrawal_to_renewable_supply_threshold_pct, [0, 20, 40, 80], 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(a.global_water_demand_increase_multiple_lower_bound, [1, 1.25, 1.5, 2], 'higher_is_worse')),
    extent: round(a.global_population_share_with_high_water_stress_at_least_one_month_pct / 100)
  },
  raw_inputs: {
    magnitude: {
      countries_with_extremely_high_annual_water_stress: a.countries_with_extremely_high_annual_water_stress,
      global_population_share_in_those_countries_pct: a.global_population_share_in_those_countries_pct,
      anchors_population_share_pct: [0, 10, 25, 50],
      boundary: 'Population residing in countries classified at extremely high annual baseline water stress; not a count of households experiencing shortage.'
    },
    threshold: {
      extreme_water_stress_threshold_pct: a.extreme_water_stress_withdrawal_to_renewable_supply_threshold_pct,
      high_water_stress_threshold_pct: a.high_water_stress_withdrawal_to_renewable_supply_threshold_pct,
      anchors_withdrawal_to_supply_pct: [0, 20, 40, 80],
      classification: 'The 25-country group meets the source-defined extremely high category at more than 80 percent withdrawals relative to renewable supply.'
    },
    momentum: {
      global_water_demand_reference_year: a.global_water_demand_reference_year,
      global_water_demand_increase_multiple_lower_bound: a.global_water_demand_increase_multiple_lower_bound,
      anchors_multiple: [1, 1.25, 1.5, 2],
      boundary: 'Source-reported endpoint comparison; not a complete annual series and not used for historical percentiles.'
    },
    extent: {
      global_population_with_high_water_stress_at_least_one_month_billion: a.global_population_with_high_water_stress_at_least_one_month_billion,
      global_population_share_with_high_water_stress_at_least_one_month_pct: a.global_population_share_with_high_water_stress_at_least_one_month_pct,
      normalized_value: round(a.global_population_share_with_high_water_stress_at_least_one_month_pct / 100),
      irrigated_agriculture_facing_extremely_high_water_stress_pct_context_only: a.irrigated_agriculture_facing_extremely_high_water_stress_pct
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      updated_at: snapshot.updated_at,
      source_url: a.source_url,
      measurement_boundary: a.measurement_boundary
    }
  },
  transformations: [
    { type: 'annual_extreme_exposure_magnitude', formula: 'Normalize the source-reported global population share residing in countries at extremely high annual baseline water stress.' },
    { type: 'recognized_aqueduct_threshold', formula: 'Map the WRI withdrawal-to-renewable-supply category boundaries, with 80 percent as the source-defined extreme threshold.' },
    { type: 'source_endpoint_demand_change', formula: 'Normalize the conservative lower bound of a doubling in global demand since 1960 without inventing annual observations.' },
    { type: 'monthly_population_extent', formula: 'Use the source-reported share of global population exposed to high water stress for at least one month per year.' }
  ],
  source_ids: ['wri_aqueduct'],
  uncertainty: snapshot.uncertainty,
  freshness: `WRI Aqueduct 4.0 global assessment ${a.assessment_year}; snapshot refreshed ${snapshot.updated_at}.`,
  selection_reason: {
    selected_method_passed: `WRI Aqueduct supplies a current global model, recognized 40% high and 80% extreme thresholds, annual extreme-stress exposure covering ${a.global_population_share_in_those_countries_pct}% of global population, a source-backed demand comparison since ${a.global_water_demand_reference_year}, and monthly high-stress exposure covering ${a.global_population_share_with_high_water_stress_at_least_one_month_pct}% of global population.`,
    higher_priority_failures: []
  }
});

const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`Receipt verification failed for water_stress: ${verification.errors.join('; ')}`);
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_22_wri_aqueduct_global_water_stress',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'wri_aqueduct',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-22.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-22.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
