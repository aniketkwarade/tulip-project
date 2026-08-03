import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const windTurnDownPaymentsGbpMillions = 370;
const replacementGasPaymentsGbpMillions = 910;
const snapshot = {
  version: 'eia_neso_renewable_curtailment_2024_2025_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'eia_caiso_wind_solar_curtailment_2024',
      name: 'Solar and wind power curtailments are increasing in California',
      publisher: 'U.S. Energy Information Administration',
      publication_date: '2025-05-28',
      url: 'https://www.eia.gov/todayinenergy/detail.php?id=65364',
      source_locators: [
        'CAISO curtailed 3.4 million megawatthours of utility-scale wind and solar output in 2024, 29 percent more than in 2023.',
        'Solar accounted for 93 percent of CAISO curtailment in 2024.',
        'Western Energy Imbalance Market trading avoided more than 274,000 megawatthours of curtailment, about 8 percent of the amount curtailed.'
      ]
    },
    {
      id: 'neso_annual_balancing_costs_report_2025',
      name: '2025 Annual Balancing Costs Report',
      publisher: 'National Energy System Operator',
      publication_date: '2025-06-12',
      url: 'https://www.neso.energy/document/362561/download',
      source_locators: [
        'Figure 8 reports operational wind outturn and wind-curtailment volume for seven financial years from 2018/19 through 2024/25.',
        'In 2024/25, wind curtailment rose to 13 percent of hypothetical wind outturn.',
        'NESO identifies wind curtailment as a major balancing-cost driver because constrained Scottish wind must be turned down and replacement energy turned on elsewhere.'
      ]
    },
    {
      id: 'uk_desnz_reformed_national_pricing_delivery_plan_2026',
      name: 'Reformed National Pricing delivery plan',
      publisher: 'UK Department for Energy Security and Net Zero',
      publication_date: '2026-05-01',
      url: 'https://www.gov.uk/government/publications/reformed-national-pricing-rnp-delivery-plan/reformed-national-pricing-rnp-delivery-plan-accessible-webpage',
      source_locators: [
        'In 2024/25, wind generators were paid £370 million to turn down.',
        'Gas generators were paid £910 million to replace curtailed generation, roughly two-thirds of total constraint costs.',
        'Constraint costs are recovered through BSUoS charges levied on consumers and usually recovered by suppliers through energy bills.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'renewable_curtailment_losses',
    metric_id: 'renewable_generation_curtailed',
    unit: 'megawatt-hours and percent of available generation, with realized system payments retained separately',
    geography: 'CAISO utility-scale wind and solar system; separate Great Britain wind-curtailment and constraint-cost system',
    assessment_period: 'calendar year 2024 for CAISO and financial year 2024/25 for Great Britain, with NESO persistence documented from 2018/19',
    boundary: 'The receipt treats CAISO volume and Great Britain percentage and costs as independent bounded power-system observations. It does not sum their energy, infer a global curtailed total, price CAISO energy, treat avoided curtailment as loss, or attribute all balancing costs to renewables.'
  },
  accumulated_impact: {
    caiso_wind_solar_curtailed_mwh_2024: 3400000,
    caiso_curtailment_increase_percent_2023_to_2024: 29,
    caiso_solar_share_of_curtailment_percent_2024: 93,
    caiso_curtailment_avoided_via_weim_mwh_2024_unscored: 274000,
    caiso_curtailment_avoided_via_weim_percent_2024_unscored: 8,
    gb_wind_curtailment_share_of_hypothetical_outturn_percent_2024_25: 13,
    gb_wind_turn_down_payments_gbp_millions_2024_25: windTurnDownPaymentsGbpMillions,
    gb_replacement_gas_payments_gbp_millions_2024_25: replacementGasPaymentsGbpMillions,
    gb_direct_constraint_payments_gbp_millions_derived: windTurnDownPaymentsGbpMillions + replacementGasPaymentsGbpMillions,
    neso_documented_financial_year_count: 7,
    neso_series_start_financial_year: '2018/19',
    neso_series_end_financial_year: '2024/25'
  },
  reviewed_normalization_anchors: {
    curtailed_energy_mwh: [0, 500000, 2000000, 5000000],
    direct_constraint_payments_gbp_millions: [0, 100, 500, 1500],
    documented_annual_periods: [0, 1, 4, 10],
    wind_curtailment_share_percent: [0, 2, 6, 15]
  },
  uncertainty: 'CAISO curtailment reports are preliminary operational data and EIA aggregates utility-scale wind and solar; behind-the-meter resources are outside that boundary. Great Britain values use a different grid, financial year and wind-only percentage. The £370-million turn-down and £910-million replacement payments are realized constraint actions, not the market value of CAISO curtailed energy and not all balancing costs. The two systems demonstrate burden and extent independently and are never summed into a global estimate.'
};

await fs.writeFile(path.join(ROOT, 'public/renewable-curtailment-loss-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/renewable-curtailment-loss-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
