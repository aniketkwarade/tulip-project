import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const electricity = {
  final_notices: 94870709.43,
  disconnections: 13447934.8,
  reconnections: 11370551.07,
  average_monthly_service_accounts: 143033986.416667
};
const naturalGas = {
  final_notices: 27078913.46,
  disconnections: 1650511.03,
  reconnections: 1171434.56,
  average_monthly_service_accounts: 74000100.666667
};
const totalDisconnections = Number((electricity.disconnections + naturalGas.disconnections).toFixed(2));
const combinedAverageServiceAccounts = electricity.average_monthly_service_accounts + naturalGas.average_monthly_service_accounts;
const disconnectionsPer1000ServiceAccounts = Number((1000 * totalDisconnections / combinedAverageServiceAccounts).toFixed(6));

const snapshot = {
  version: 'eia112_residential_utility_disconnections_2024_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'eia112_residential_utility_disconnection_microdata_2024',
      name: 'EIA-112 Residential Utility Disconnections Survey Microdata — 2024',
      publisher: 'U.S. Energy Information Administration',
      url: 'https://www.eia.gov/analysis/requests/residential/utility/',
      electricity_download_url: 'https://www.eia.gov/analysis/requests/residential/utility/xls/112%20electric%20utility%20level%20data%202024.xlsx',
      natural_gas_download_url: 'https://www.eia.gov/analysis/requests/residential/utility/xls/112%20natural%20gas%20utility%20level%20data%202024.xlsx',
      electricity_workbook_sha256: '96188f7b68946e68fba917e140c01fae9d081d5aba54734bc003dc5c2d60fe0a',
      natural_gas_workbook_sha256: '82aa53e574cdf1fd42bb3059681765ef958fb49cf7fc0a129e4320b1eb2d9a10'
    },
    {
      id: 'eia112_residential_utility_disconnections_report_2024',
      name: 'EIA 2024 Residential Utility Disconnections Report',
      publisher: 'U.S. Energy Information Administration',
      url: 'https://www.eia.gov/analysis/requests/residential/utility/pdf/Residential%20Utility%20Disconnections%20Report%20-%20April%202026.pdf',
      report_sha256: '1d5b3a7dc4550fd056f0960cf055cd04ce57b52aca4b4ce8c56f22b1a1f4ea36',
      released_at: '2026-04-14'
    }
  ],
  metric_contract: {
    node_id: 'utility_disconnection_risk',
    metric_id: 'residential_utility_disconnections',
    unit: 'involuntary service disconnections for nonpayment and disconnections per 1,000 average monthly service accounts',
    geography: 'United States and District of Columbia',
    period: 'calendar year 2024',
    boundary: 'Electricity and natural-gas service accounts are summed as service relationships, not deduplicated households. A customer account may have multiple events. Final notices and reconnections are retained as context and do not become unique people or remaining disconnected accounts.'
  },
  extraction: {
    workbook_sheets: ['Final notices', 'Disconnections', 'Reconnections', 'Number of customers'],
    state_total_rows_per_sheet_and_fuel: 51,
    months_present: 12,
    state_total_month_cells_missing: 0,
    method: 'For each fuel and sheet, sum only the 51 State Total rows across 12 months. Average monthly service accounts before calculating the combined event rate; do not sum utility rows with State Total rows.'
  },
  accumulated_impact_2024: {
    year: 2024,
    complete_calendar_years: 1,
    electricity,
    natural_gas: naturalGas,
    combined: {
      final_notices: Number((electricity.final_notices + naturalGas.final_notices).toFixed(2)),
      disconnections: totalDisconnections,
      reconnections: Number((electricity.reconnections + naturalGas.reconnections).toFixed(2)),
      average_monthly_service_accounts: Number(combinedAverageServiceAccounts.toFixed(6)),
      disconnections_per_1000_service_accounts: disconnectionsPer1000ServiceAccounts
    },
    directly_assessed_countries: ['United States'],
    directly_assessed_country_count: 1
  },
  reviewed_normalization_anchors: {
    disconnection_events: [0, 100000, 5000000, 25000000],
    disconnections_per_1000_service_accounts: [0, 1, 25, 100],
    complete_calendar_years: [0, 1, 6, 30],
    directly_assessed_country_count: [0, 1, 5, 25]
  },
  uncertainty: 'The EIA-112 estimates cover the United States and District of Columbia, not the world. Weighted response rates were 93.5% for electricity and 96.1% for natural gas; state adjustments include imputation. Counts are service events rather than deduplicated households, and a service account can experience multiple events. Electricity and gas accounts overlap at the household level. One calendar year quantifies accumulated burden but cannot establish a historical trend or current 2026 magnitude.'
};

await fs.writeFile(path.join(ROOT, 'public/eia112-utility-disconnection-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/eia112-utility-disconnection-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact_2024.combined }, null, 2));
