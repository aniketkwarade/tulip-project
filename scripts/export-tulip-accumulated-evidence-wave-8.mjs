import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/iea-data-centre-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'data_centers',
  method: 'impact_fallback',
  as_of: String(assessment.observation_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(assessment.indirect_power_emissions_mt_co2, [0, 50, 100, 250], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(assessment.global_investment_usd_billion, [0, 100, 250, 500], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(assessment.assessed_growth_years, [0, 5, 10, 20], 'higher_is_worse')),
    extent: 1
  },
  raw_inputs: {
    biophysical_burden: {
      global_electricity_consumption_twh: assessment.global_electricity_consumption_twh,
      global_electricity_consumption_share_pct: assessment.global_electricity_consumption_share_pct,
      indirect_power_emissions_mt_co2: assessment.indirect_power_emissions_mt_co2,
      anchors_mt_co2: [0, 50, 100, 250],
      boundary: 'Electricity-related indirect emissions only; backup power is excluded by the source figure.'
    },
    human_economic_burden: {
      global_investment_usd_billion: assessment.global_investment_usd_billion,
      anchors_usd_billion: [0, 100, 250, 500],
      investment_change_since_2022: assessment.investment_change_since_2022,
      boundary: 'Economic scale and infrastructure commitment, not observed economic damage.'
    },
    persistence: {
      source_reported_annual_growth_rate_pct: assessment.annual_growth_rate_previous_five_years_pct,
      source_reported_growth_period_years: assessment.assessed_growth_years,
      anchors_years: [0, 5, 10, 20]
    },
    extent: {
      normalized_value: 1,
      regions_explicitly_assessed: assessment.regions_explicitly_assessed,
      geography_boundary: assessment.geography_boundary
    },
    excluded_projections: {
      projected_2030_global_electricity_consumption_twh: assessment.projected_2030_global_electricity_consumption_twh,
      projected_2030_share_global_electricity_pct: assessment.projected_2030_share_global_electricity_pct
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
      type: 'current_assessment_burden_ranges',
      formula: 'Normalize source-reported current indirect CO2 emissions and global investment through named fixed ranges; do not score projected electricity demand.'
    },
    {
      type: 'source_reported_growth_persistence',
      formula: 'Use the IEA-reported five-year period behind the 12% annual growth estimate without reconstructing missing annual observations.'
    },
    {
      type: 'global_model_extent',
      formula: 'The IEA global total is partitioned across five exhaustive world regions.'
    }
  ],
  source_ids: ['iea_energy_and_ai'],
  uncertainty: snapshot.uncertainty,
  freshness: `IEA Energy and AI 2025 assessment of ${assessment.observation_year} global data centres; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'IEA quantifies current global electricity use, indirect emissions, investment, a five-year growth period and exhaustive regional extent for data centres.',
    higher_priority_failures: [
      'Only a five-year growth statement is available, below the 20-complete-annual-observation gate.',
      'No recognized urgency threshold or 60-month source series supports current-data normalization.'
    ]
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for data_centers.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_8_iea_data_centres',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'iea_energy_and_ai',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-8.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-8.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
