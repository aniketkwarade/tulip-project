import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/iea-battery-supply-chain-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'battery_supply_chain_pressure',
  method: 'impact_fallback',
  as_of: String(assessment.observation_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(assessment.global_energy_sector_battery_demand_twh, [0, 0.25, 0.5, 1.5], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(assessment.china_share_global_battery_cell_production_pct, [0, 33, 67, 100], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(assessment.lithium_demand_comparison_years, [0, 3, 7, 10], 'higher_is_worse')),
    extent: round(assessment.energy_sector_share_battery_metal_demand_growth_2021_2024_pct / 100)
  },
  raw_inputs: {
    biophysical_burden: {
      global_energy_sector_battery_demand_twh: assessment.global_energy_sector_battery_demand_twh,
      global_ev_battery_demand_gwh_lower_bound: assessment.global_ev_battery_demand_gwh_lower_bound,
      global_ev_battery_demand_annual_growth_pct: assessment.global_ev_battery_demand_annual_growth_pct,
      anchors_twh: [0, 0.25, 0.5, 1.5],
      boundary: 'Installed battery demand in EV and stationary energy applications; not mineral mass, manufacturing capacity or announced projects.'
    },
    human_economic_burden: {
      china_share_global_battery_cell_production_pct: assessment.china_share_global_battery_cell_production_pct,
      china_share_global_battery_manufacturing_capacity_pct_context_only: assessment.china_share_global_battery_manufacturing_capacity_pct,
      china_share_lfp_cathode_material_and_cell_production_pct_lower_bound_context_only: assessment.china_share_lfp_cathode_material_and_cell_production_pct_lower_bound,
      anchors_global_production_share_pct: [0, 33, 67, 100],
      boundary: 'Observed geographic concentration as economic disruption exposure; not a realized shortage or loss estimate.'
    },
    persistence: {
      lithium_demand_multiple_vs_2015: assessment.lithium_demand_multiple_vs_2015,
      comparison_start_year: assessment.lithium_demand_comparison_start_year,
      comparison_years: assessment.lithium_demand_comparison_years,
      anchors_years: [0, 3, 7, 10]
    },
    extent: {
      energy_sector_share_battery_metal_demand_growth_2021_2024_pct: assessment.energy_sector_share_battery_metal_demand_growth_2021_2024_pct,
      normalized_value: round(assessment.energy_sector_share_battery_metal_demand_growth_2021_2024_pct / 100),
      global_scope: true
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      source_locators: assessment.source_locators,
      excluded_from_scoring: assessment.excluded_from_scoring
    }
  },
  transformations: [
    {
      type: 'fixed_global_demand_range',
      formula: 'Normalize the source-reported 2024 global battery demand through a named TWh burden range without substituting manufacturing capacity.'
    },
    {
      type: 'observed_supply_concentration',
      formula: 'Normalize the source-reported share of global battery-cell production located in China through the bounded 0-100 percent range.'
    },
    {
      type: 'source_reported_demand_persistence',
      formula: 'Use the source comparison from 2015 to 2024, during which lithium demand rose sixfold; no future scenario enters the component.'
    }
  ],
  source_ids: ['iea_global_critical_minerals_outlook_2025'],
  uncertainty: snapshot.uncertainty,
  freshness: `IEA 2025 assessments of 2024 conditions; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'IEA quantifies global battery demand and growth, observed supply-chain concentration, multi-year demand persistence and the energy sector share of battery-metal demand growth.',
    higher_priority_failures: [
      'The public assessment supplies only seven annual EV battery-demand observations from 2018-2024, below the 20-year historical-distribution gate.',
      'No recognized global threshold series supplies current magnitude plus threshold proximity or momentum at the current-data coverage gate.'
    ]
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for battery_supply_chain_pressure.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_12_iea_battery_supply_chain',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'iea_global_critical_minerals_outlook_2025',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-12.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-12.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
