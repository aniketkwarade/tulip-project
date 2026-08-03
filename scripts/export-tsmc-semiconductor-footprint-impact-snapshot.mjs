import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const totalWaterMillionM3 = 129;
const waterLitresPerWaferLayer = 161;
const totalEnergyGwh = 27456;
const totalGhgTonnesCo2e = 21006442;
const environmentalExpenseThousandTwd2024 = 24478265;
const environmentalInvestmentThousandTwd2024 = 39010360;
const environmentalExpenseThousandTwd2014 = 4439017;
const environmentalInvestmentThousandTwd2014 = 9703309;
const impliedWaferLayers = (totalWaterMillionM3 * 1e9) / waterLitresPerWaferLayer;

const snapshot = {
  version: 'tsmc_semiconductor_fabrication_footprint_2014_2024_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'tsmc_sustainability_report_2024_fab_footprint',
      name: 'TSMC 2024 Sustainability Report',
      publisher: 'Taiwan Semiconductor Manufacturing Company Limited',
      publication_date: '2025',
      url: 'https://esg.tsmc.com/en-US/file/public/2024-TSMC-Sustainability-Report-e.pdf',
      source_locators: [
        'The report gives 2024 total water use of 129 million cubic metres and unit water use of 161.0 litres per 12-inch equivalent wafer mask layer for Taiwan and named subsidiaries.',
        'It reports total energy consumption of 27,456 GWh and total Scope 1, 2 and 3 GHG emissions of 21,006,442 tCO2e for 2024.',
        'It reports that absolute GHG emissions increased 8% year over year and emissions per unit product increased 19%; water intensity declined 8.7% from 2023 but remained 14.3% above the 2010 baseline.',
        'The water reporting note covers Taiwan fabs, TSMC China, TSMC Nanjing, TSMC Washington, TSMC Arizona, JASM and VisEra.'
      ]
    },
    {
      id: 'tsmc_annual_report_2024_environmental_accounting',
      name: 'TSMC 2024 Annual Report — Environmental Accounting',
      publisher: 'Taiwan Semiconductor Manufacturing Company Limited',
      publication_date: '2025-03-12',
      url: 'https://investor.tsmc.com/sites/ir/annual-report/2024/2024%20Annual%20Report_E.pdf',
      source_locators: [
        'The Taiwan-fab environmental accounting table reports NT$24,478,265 thousand in 2024 expense and NT$39,010,360 thousand in investment.',
        'The table separately identifies pollution control, resource conservation, energy conservation, GHG reduction, waste treatment and environmental management costs.',
        'The report gives 2024 outsourced waste of 344,056 tonnes general and 445,152 tonnes hazardous, plus 1.16 kg per 12-inch equivalent wafer mask layer for Taiwan facilities.'
      ]
    },
    {
      id: 'tsmc_annual_report_2014_environmental_accounting',
      name: 'TSMC 2014 Annual Report — Environmental Accounting',
      publisher: 'Taiwan Semiconductor Manufacturing Company Limited',
      publication_date: '2015',
      url: 'https://investor.tsmc.com/static/annualReports/2014/english/pdf/e_7.pdf',
      source_locators: [
        'The 2014 Taiwan-fab environmental accounting table reports total environmental investment of NT$9,703,309 thousand and expense of NT$4,439,017 thousand.',
        'The matching 2014 and 2024 accounting endpoints establish ten years of recurring quantified environmental expenditure at the main manufacturing boundary.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'semiconductor_fabrication_footprint',
    metric_id: 'semiconductor_output_environmental_intensity',
    unit: 'kilowatt-hours, litres, and kilograms CO2-equivalent per 12-inch equivalent wafer mask layer',
    geography: 'TSMC Taiwan fabs and named manufacturing subsidiaries in Taiwan, China, the United States and Japan; environmental cost is limited to Taiwan fabs',
    assessment_period: '2024 fabrication footprint with environmental-accounting persistence endpoints in 2014 and 2024',
    boundary: 'The receipt preserves TSMC\'s 12-inch equivalent wafer mask-layer denominator. It does not relabel mask layers as wafer starts, generalize one company to the global semiconductor industry, or add company revenue as urgency burden.'
  },
  accumulated_impact: {
    total_water_million_m3_2024: totalWaterMillionM3,
    water_litres_per_12_inch_equivalent_wafer_mask_layer_2024: waterLitresPerWaferLayer,
    implied_12_inch_equivalent_wafer_mask_layers_2024_derived: Number(impliedWaferLayers.toFixed(3)),
    total_energy_gwh_2024: totalEnergyGwh,
    energy_kwh_per_12_inch_equivalent_wafer_mask_layer_2024_derived: Number(((totalEnergyGwh * 1e6) / impliedWaferLayers).toFixed(6)),
    total_scope_1_2_3_ghg_tonnes_co2e_2024: totalGhgTonnesCo2e,
    ghg_kg_co2e_per_12_inch_equivalent_wafer_mask_layer_2024_derived: Number(((totalGhgTonnesCo2e * 1000) / impliedWaferLayers).toFixed(6)),
    absolute_ghg_year_over_year_change_percent_2024: 8,
    unit_ghg_year_over_year_change_percent_2024: 19,
    water_intensity_year_over_year_change_percent_2024: -8.7,
    water_intensity_change_from_2010_baseline_percent_2024: 14.3,
    environmental_expense_billion_twd_2024: Number((environmentalExpenseThousandTwd2024 / 1e6).toFixed(6)),
    environmental_investment_billion_twd_2024: Number((environmentalInvestmentThousandTwd2024 / 1e6).toFixed(6)),
    environmental_cost_billion_twd_2024_derived: Number(((environmentalExpenseThousandTwd2024 + environmentalInvestmentThousandTwd2024) / 1e6).toFixed(6)),
    environmental_cost_billion_twd_2014_derived: Number(((environmentalExpenseThousandTwd2014 + environmentalInvestmentThousandTwd2014) / 1e6).toFixed(6)),
    environmental_accounting_span_years_derived: 10,
    reporting_countries_or_economies_count: 4,
    named_reporting_entities_or_site_groups_count: 7
  },
  reviewed_normalization_anchors: {
    energy_kwh_per_wafer_layer: [0, 5, 20, 50],
    water_litres_per_wafer_layer: [0, 50, 150, 250],
    ghg_kg_co2e_per_wafer_layer: [0, 5, 20, 50],
    environmental_cost_billion_twd: [0, 5, 25, 75],
    environmental_accounting_span_years: [0, 1, 5, 10],
    reporting_countries_or_economies: [1, 2, 4, 7]
  },
  uncertainty: 'The energy and GHG intensities are deterministic derivations that divide disclosed totals by an implied wafer-mask-layer denominator derived from total water and disclosed water intensity. Scope 3 is retained because the reported total includes it; the value is therefore a company footprint intensity, not only fab-gate emissions. Environmental expense and investment cover Taiwan fabs, a narrower boundary than the multinational resource totals, and represent realized prevention, control, treatment and management costs rather than monetized environmental damage. Four countries or economies and seven named entities or site groups describe reporting reach, not global industry coverage.'
};

await fs.writeFile(path.join(ROOT, 'public/tsmc-semiconductor-fabrication-footprint-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tsmc-semiconductor-fabrication-footprint-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
