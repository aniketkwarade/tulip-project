import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CUBIC_METRES_PER_US_GALLON = 0.003785411784;
const billionGallonsPerDayToMillionCubicMetresPerYear = value => Number((value * 1e9 * CUBIC_METRES_PER_US_GALLON * 365 / 1e6).toFixed(6));

const withdrawalBgalPerDay = 133;
const consumptionBgalPerDay = 4.31;
const snapshot = {
  version: 'usgs_thermoelectric_cooling_water_2015_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'usgs_estimated_water_use_2015_circular_1441',
      name: 'USGS Estimated Use of Water in the United States in 2015 — Circular 1441',
      publisher: 'U.S. Geological Survey',
      url: 'https://www.usgs.gov/publications/estimated-use-water-united-states-2015',
      download_url: 'https://pubs.usgs.gov/circ/1441/circ1441.pdf',
      report_sha256: 'ef0e2caa3bd7769fde0de383f6668ba2559d8b716a38bfec6bed027729061f88',
      doi: '10.3133/cir1441',
      published_at: '2018-06-19',
      data_year: 2015
    }
  ],
  metric_contract: {
    node_id: 'cooling_water_competition',
    metric_id: 'thermoelectric_cooling_water_withdrawal_and_consumption',
    unit: 'million cubic metres per year and percent of national freshwater withdrawals',
    geography: 'United States',
    period: 'calendar year 2015 with a 2010 comparison',
    boundary: 'Withdrawal and consumption remain distinct. The receipt scores consumptive use and freshwater-withdrawal share; it does not treat saline withdrawals or returned once-through flow as destroyed freshwater and does not infer a basin-specific shortage.'
  },
  accumulated_impact_2015: {
    year: 2015,
    comparison_year: 2010,
    inclusive_comparison_years: 6,
    withdrawal_billion_gallons_per_day: withdrawalBgalPerDay,
    withdrawal_million_cubic_metres_per_year: billionGallonsPerDayToMillionCubicMetresPerYear(withdrawalBgalPerDay),
    consumption_billion_gallons_per_day: consumptionBgalPerDay,
    consumption_million_cubic_metres_per_year: billionGallonsPerDayToMillionCubicMetresPerYear(consumptionBgalPerDay),
    thermoelectric_share_of_all_national_withdrawals_pct: 41,
    thermoelectric_freshwater_share_of_all_national_freshwater_withdrawals_pct: 34,
    surface_water_share_of_thermoelectric_withdrawals_lower_bound_pct: 99,
    freshwater_share_of_thermoelectric_surface_withdrawals_pct: 72,
    consumption_share_of_thermoelectric_withdrawals_pct: 3,
    withdrawal_change_from_2010_pct: -18,
    directly_assessed_countries: ['United States'],
    directly_assessed_country_count: 1
  },
  reviewed_normalization_anchors: {
    consumption_million_cubic_metres_per_year: [0, 100, 1000, 10000],
    freshwater_withdrawal_share_pct: [0, 5, 20, 50],
    inclusive_comparison_years: [0, 1, 5, 20],
    directly_assessed_country_count: [0, 1, 5, 25]
  },
  uncertainty: 'The national compilation is for 2015 and cannot represent current 2026 conditions. USGS combines facility, state, EIA and modeled information; estimates carry reporting and model uncertainty. National withdrawals do not identify which basins were scarce or which competing users experienced shortage. Gross withdrawal is dominated by once-through systems and is not equivalent to consumption, while saline water is not interchangeable with freshwater. The receipt therefore scores reported consumption and freshwater-withdrawal share separately.'
};

await fs.writeFile(path.join(ROOT, 'public/usgs-thermoelectric-cooling-water-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/usgs-thermoelectric-cooling-water-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact_2015 }, null, 2));
