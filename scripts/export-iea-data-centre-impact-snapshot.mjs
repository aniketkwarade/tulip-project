import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/iea-data-centre-impact-snapshot.json');
const snapshot = {
  version: 'iea_energy_and_ai_2025_data_centres_snapshot_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'iea_energy_and_ai',
    name: 'IEA Energy and AI',
    publisher: 'International Energy Agency',
    report_year: 2025,
    observation_year: 2024,
    report_url: 'https://www.iea.org/reports/energy-and-ai',
    energy_demand_url: 'https://www.iea.org/reports/energy-and-ai/energy-demand-from-ai',
    climate_url: 'https://www.iea.org/reports/energy-and-ai/ai-and-climate-change',
    executive_summary_url: 'https://www.iea.org/reports/energy-and-ai/executive-summary'
  },
  ingestion_job_id: 'export_iea_data_centre_impact_snapshot',
  metric_contract_ids: ['data_center_electricity_consumption'],
  contract_bindings: [
    { node_id: 'data_centers', metric_id: 'data_center_electricity_consumption', measurement_role: 'global_assessment_accumulated_pressure_primary' }
  ],
  cadence: 'Refresh when IEA updates Energy and AI or its Energy and AI Observatory.',
  provenance: 'Reviewed source-reported current global data-centre electricity, electricity share, five-year growth, indirect power emissions and investment from IEA Energy and AI. Scenario values remain explicitly projected.',
  uncertainty: 'IEA describes substantial uncertainty around current and future electricity demand. Facility coverage, server stock and utilization, cooling, behind-the-meter power, electricity mix, investment accounting and rapid technology change affect estimates. AI is a subset and is not separated as a current global total here.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale; never count projected 2030 or 2035 demand as current, infer AI-only electricity from total data-centre demand, add backup-generator emissions, or treat missing facilities as zero.',
  assessment: {
    report_year: 2025,
    observation_year: 2024,
    global_electricity_consumption_twh: 415,
    global_electricity_consumption_share_pct: 1.5,
    annual_growth_rate_previous_five_years_pct: 12,
    indirect_power_emissions_mt_co2: 180,
    global_investment_usd_billion: 500,
    investment_change_since_2022: 'nearly doubled',
    assessed_growth_years: 5,
    regions_explicitly_assessed: ['United States', 'China', 'Europe', 'Asia excluding China', 'Rest of world'],
    projected_2030_global_electricity_consumption_twh: 945,
    projected_2030_share_global_electricity_pct: 3,
    geography_boundary: 'Global IEA model with exhaustive regional partitions',
    source_locators: [
      'IEA Energy demand from AI, current global data-centre demand section',
      'IEA AI and climate change, current indirect emissions section',
      'IEA Energy and AI executive summary, current global investment statement'
    ]
  }
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, observation_year: snapshot.assessment.observation_year, metric_contract_ids: snapshot.metric_contract_ids }, null, 2));
