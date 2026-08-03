import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/iea-global-grid-pressure-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));
const n = (value, anchors) => round(normalizeWithAnchors(value, anchors, 'higher_is_worse'));
const investmentGap = a.implied_2030_annual_grid_investment_usd_billion - a.current_annual_grid_investment_usd_billion;

function build(nodeId, components, rawInputs, transformations, passed, failures) {
  const receipt = buildTulipUrgencyReceipt({
    node_id: nodeId, method: 'impact_fallback', as_of: String(a.observation_year), components,
    raw_inputs: { ...rawInputs, source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at } },
    transformations, source_ids: [snapshot.source.id], uncertainty: snapshot.uncertainty,
    freshness: `IEA Electricity 2026 assessment of calendar year ${a.observation_year}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: { selected_method_passed: passed, higher_priority_failures: failures }
  });
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`Receipt verification failed for ${nodeId}.`);
  return receipt;
}

const receipts = [
  build('grid_peak_load_stress', {
    biophysical_burden: n(a.global_electricity_consumption_twh, [0, 10000, 22000, 32000]),
    human_economic_burden: n(a.stalled_grid_queue_capacity_gw, [0, 250, 1000, 3000]),
    persistence: n(a.grid_project_lead_time_years_high, [0, 2, 7, 15]),
    extent: n(a.emerging_market_share_of_global_demand_growth_pct, [0, 20, 50, 90])
  }, {
    biophysical_burden: { global_electricity_consumption_twh: a.global_electricity_consumption_twh, demand_growth_pct: a.global_electricity_demand_growth_pct, anchors_twh: [0, 10000, 22000, 32000], boundary: 'Demand is a system-load burden, not proof of inadequate reserve margin.' },
    human_economic_burden: { stalled_grid_queue_capacity_gw: a.stalled_grid_queue_capacity_gw, anchors_gw: [0, 250, 1000, 3000] },
    persistence: { grid_project_lead_time_years: [a.grid_project_lead_time_years_low, a.grid_project_lead_time_years_high], normalized_value_uses_years: a.grid_project_lead_time_years_high, anchors_years: [0, 2, 7, 15] },
    extent: { emerging_market_share_of_global_demand_growth_pct: a.emerging_market_share_of_global_demand_growth_pct, anchors_pct: [0, 20, 50, 90] }
  }, [
    { type: 'global_load_burden', formula: 'Normalize current global electricity consumption and retain the current annual growth rate separately.' },
    { type: 'grid_capacity_pressure', formula: 'Normalize stalled global connection-queue capacity without adding supply, demand and storage projects.' },
    { type: 'delivery_persistence', formula: 'Use the upper bound of the source-reported grid planning, permitting and completion interval.' },
    { type: 'growth_extent', formula: 'Normalize the share of current global demand growth occurring in emerging markets and developing economies.' }
  ], 'IEA quantifies current global load, growth, stalled connection capacity, long delivery times and broad geographic demand growth.', ['No globally harmonized hourly peak-and-capacity history passes the current-data gate.', 'Demand and queue pressure are accumulated system burden rather than a reliability violation.']),
  build('transmission_buildout_lag', {
    biophysical_burden: n(a.stalled_grid_queue_capacity_gw, [0, 250, 1000, 3000]),
    human_economic_burden: n(investmentGap, [0, 25, 100, 250]),
    persistence: n(a.grid_project_lead_time_years_high, [0, 2, 7, 15]),
    extent: 1
  }, {
    biophysical_burden: { stalled_grid_queue_capacity_gw: a.stalled_grid_queue_capacity_gw, anchors_gw: [0, 250, 1000, 3000] },
    human_economic_burden: { current_annual_grid_investment_usd_billion: a.current_annual_grid_investment_usd_billion, implied_required_2030_usd_billion: a.implied_2030_annual_grid_investment_usd_billion, implied_gap_usd_billion: investmentGap, anchors_usd_billion: [0, 25, 100, 250] },
    persistence: { grid_project_lead_time_years: [a.grid_project_lead_time_years_low, a.grid_project_lead_time_years_high], anchors_years: [0, 2, 7, 15] },
    extent: { geography: 'worldwide project queues and global grid investment', normalized_value: 1 }
  }, [
    { type: 'stalled_connection_capacity', formula: 'Normalize the source-reported worldwide connection-queue capacity as a buildout burden.' },
    { type: 'investment_delivery_gap', formula: 'Subtract current annual grid investment from the IEA 2030 annual requirement; retain the requirement as a target, not a current spend.' },
    { type: 'project_delivery_time', formula: 'Normalize the upper bound of the source-reported global grid project lead-time range.' },
    { type: 'global_extent', formula: 'Assign full extent because both queue and investment assessments are explicitly worldwide.' }
  ], 'IEA quantifies the worldwide stalled grid queue, annual investment gap, 5-15 year delivery interval and global extent.', ['The report does not provide a complete 20-year annual global delayed-circuit-kilometre series.', 'The investment requirement is therefore used only within an accumulated buildout burden.'])
];

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_37_iea_global_grid_pressure', generated_at: new Date().toISOString(), promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-37.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-37.json', receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
