import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = 'public/iea-global-grid-pressure-impact-snapshot.json';
const snapshot = {
  version: 'iea_electricity_2026_global_grid_pressure_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'iea_electricity_2026_global_grid_pressure',
    name: 'IEA Electricity 2026 — Demand and Grids',
    publisher: 'International Energy Agency',
    report_year: 2026,
    report_url: 'https://www.iea.org/reports/electricity-2026',
    demand_url: 'https://www.iea.org/reports/electricity-2026/demand',
    grids_url: 'https://www.iea.org/reports/electricity-2026/grids',
    executive_summary_url: 'https://www.iea.org/reports/electricity-2026/executive-summary'
  },
  assessment: {
    observation_year: 2025,
    global_electricity_consumption_twh: 28200,
    global_electricity_demand_growth_pct: 3,
    emerging_market_share_of_global_demand_growth_pct: 80,
    stalled_grid_queue_capacity_gw: 2500,
    current_annual_grid_investment_usd_billion: 400,
    required_2030_annual_grid_investment_increase_pct: 50,
    implied_2030_annual_grid_investment_usd_billion: 600,
    grid_project_lead_time_years_low: 5,
    grid_project_lead_time_years_high: 15,
    grid_component_price_change_five_year_pct_approx: 100,
    global_scope: true,
    source_locators: [
      'IEA Electricity 2026 Demand: global consumption 28,200 TWh and 3% year-on-year demand growth in 2025; emerging markets and developing economies supplied about 80% of growth.',
      'IEA Electricity 2026 Grids: more than 2,500 GW of renewable, storage and large-load projects stalled in queues worldwide.',
      'IEA Electricity 2026 Grids: annual grid investment must rise roughly 50% from USD 400 billion by 2030; grid projects require 5-15 years; key component prices nearly doubled over five years.'
    ]
  },
  provenance: 'Reviewed IEA current 2025 global demand and grid-queue values are retained separately from 2026-2030 forecasts and required-investment estimates.',
  uncertainty: 'Queue membership changes with project progress and cancellation; investment, component-price and demand estimates are revised; a global demand total does not establish local reserve margin, forecast error or reliability violation.',
  failure_behavior: 'Retain the last reviewed report and mark stale; never treat forecasts as observations, add queued supply and demand capacity, infer transformer quantities, or interpret demand alone as a reliability failure.'
};
await fs.writeFile(path.join(ROOT, output), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, source_id: snapshot.source.id }, null, 2));
