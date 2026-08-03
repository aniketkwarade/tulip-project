import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = {
  version: 'global_final_promotion_assessments_2026_v1',
  captured_at: '2026-07-31T00:00:00.000Z',
  sources: [
    { id: 'csiro_antarctic_bottom_water_observations_2023', publisher: 'Commonwealth Scientific and Industrial Research Organisation', url: 'https://www.csiro.au/en/news/all/articles/2023/may/antarctic-bottom-water' },
    { id: 'nasa_global_ocean_primary_production_1998_2015', publisher: 'NASA Goddard Space Flight Center', url: 'https://ntrs.nasa.gov/citations/20210011808', doi: '10.1088/1748-9326/ab4667' },
    { id: 'lancet_countdown_vibrio_indicator_2025', publisher: 'Lancet Countdown', url: 'https://lancetcountdown.org/explore-our-data/' },
    { id: 'iarc_gbd_ambient_air_pollution_2015', publisher: 'International Agency for Research on Cancer', url: 'https://www.iarc.who.int/reference/estimates-and-25-year-trends-of-the-global-burden-of-disease-attributable-to-ambient-air-pollution-an-analysis-of-data-from-the-global-burden-of-diseases-study-2015/' },
    { id: 'iea_breakthrough_agenda_road_transport_2025', publisher: 'International Energy Agency', url: 'https://www.iea.org/reports/breakthrough-agenda-report-2025/road-transport' },
    { id: 'iea_breakthrough_agenda_hydrogen_2025', publisher: 'International Energy Agency', url: 'https://www.iea.org/reports/breakthrough-agenda-report-2025/hydrogen' },
    { id: 'iea_global_industry_transition_assessments', publisher: 'International Energy Agency', url: 'https://www.iea.org/reports/breakthrough-agenda-report-2025' }
  ],
  assessments: {
    antarctic_bottom_water: { assessment_year: 2023, decline_since_1990s_pct: 30, years_approx: 30, salty_oxygen_rich_water_sinking_trillion_tonnes_per_year: 250, excess_atmospheric_heat_absorbed_by_ocean_pct_lower_bound: 90, global_extent: 1 },
    phytoplankton: { end_year: 2015, start_year: 1998, annual_primary_production_decline_pgc: 0.8, primary_production_decline_pct_per_decade: 2.1, chlorophyte_production_decline_pct_per_decade: 14.3, global_extent: 1 },
    vibrio: { observation_year: 2024, suitable_coastline_km: 91195, increase_from_previous_record_pct: 3.2, assessed_history_start_year: 1982, global_extent: 1 },
    tropospheric_ozone: { observation_year: 2015, attributable_deaths: 254000, attributable_deaths_lower_95_ui: 97000, attributable_deaths_upper_95_ui: 422000, dalys_million: 4.1, history_years: 25, global_extent: 1 },
    road_freight: { observation_year: 2024, road_transport_co2_gt: 6, truck_share_pct_approx: 33.333333, truck_co2_gt_approx: 2, growth_since_2015_pct: 8, global_extent: 1 },
    fossil_hydrogen: { observation_year: 2024, hydrogen_production_mt_approx: 100, production_emissions_mt_co2e_approx: 1300, low_emissions_share_pct_less_than: 1, fossil_supply_share_pct_lower_bound: 99, stable_intensity_years: 5, global_extent: 1 },
    industry: { observation_year: 2024, industry_direct_co2_gt: 9, heavy_industry_direct_co2_gt: 6, heavy_industry_share_pct: 70, industrial_heat_nonrenewable_share_pct: 88, heat_share_energy_related_co2_pct: 37, cement_production_mt: 4160, cement_low_emissions_fuel_share_pct: 5, assessment_span_years: 6, global_extent: 1 }
  },
  uncertainty: 'Values retain each publisher’s global method and period. Approximate shares remain labeled, uncertainty intervals are preserved where reported, fuel-specific industrial-heat nodes do not receive an invented coal-gas split, and missing observations never become zero.'
};

await fs.writeFile(path.join(ROOT, 'public/global-final-promotion-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/global-final-promotion-impact-snapshot.json', version: snapshot.version }, null, 2));
