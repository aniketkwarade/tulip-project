import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const snapshot = {
  version: 'iea_energy_affordability_impact_2022_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'iea_energy_efficiency_2022_energy_poverty',
      name: 'IEA Energy Efficiency 2022 — Energy Poverty and Emergency Support',
      publisher: 'International Energy Agency',
      url: 'https://www.iea.org/reports/energy-efficiency-2022/executive-summary',
      download_url: 'https://iea.blob.core.windows.net/assets/7741739e-8e7f-4afa-a77f-49dadd51cb52/EnergyEfficiency2022.pdf',
      report_sha256: '7d37620e542d982a17e14d9d97b3b9a5c693bcd280ef78a3458ca712730d470a',
      report_year: 2022,
      licence: 'CC BY 4.0'
    },
    {
      id: 'tracking_sdg7_2024_energy_access_reversal',
      name: 'Tracking SDG7 2024 — Global Energy Access Reversal',
      publisher: 'World Bank, IEA, IRENA, UNSD and WHO',
      url: 'https://www.worldbank.org/en/news/press-release/2024/06/11/progress-on-basic-energy-access-reverses-for-first-time-in-a-decade',
      retrieved_html_sha256: '399491401b16d8938e96793c689fe9f0ac40e0c133ecab70cc682a85b6704b3a',
      published_at: '2024-06-11'
    }
  ],
  metric_contract: {
    node_id: 'energy_affordability_crisis',
    metric_id: 'household_energy_burden',
    unit: 'additional households in energy poverty and emergency public spending',
    geography: 'global',
    period: '2019-2022 accumulated change and 2022 emergency response',
    boundary: 'The assessment scores the IEA estimate of additional households pushed into energy poverty and emergency government spending. It does not infer household disconnections, add overlapping access-deficit populations, or score the projected return to traditional cooking fuels.'
  },
  accumulated_impact: {
    as_of: 2022,
    additional_households_in_energy_poverty_since_2019: 160000000,
    people_without_reliable_energy_services_context_only: 2500000000,
    emergency_government_support_usd: 550000000000,
    accumulation_start_year: 2019,
    accumulation_end_year: 2022,
    inclusive_years: 4,
    global_extent_normalized: 1,
    tracking_sdg7_context: {
      people_without_electricity_2022: 685000000,
      increase_from_2021: 10000000,
      people_without_clean_cooking_2022: 2100000000,
      household_air_pollution_premature_deaths_per_year: 3200000
    },
    excluded_projection: {
      people_who_may_return_to_traditional_cooking: 100000000,
      reason: 'Forward-looking estimate is not accumulated observed burden.'
    }
  },
  reviewed_normalization_anchors: {
    additional_households_in_energy_poverty: [0, 10000000, 100000000, 500000000],
    emergency_government_support_usd: [0, 10000000000, 100000000000, 1000000000000],
    inclusive_years: [0, 1, 5, 20]
  },
  uncertainty: 'The 160-million-household burden and USD 550 billion response are IEA global estimates for the 2019-2022 crisis period, not a household-level administrative census or a current 2026 observation. Energy-poverty definitions vary across countries. The SDG7 access totals overlap with broader unreliable-service estimates and are retained only as context. No disconnection count is inferred, and the projected 100-million-person return to traditional cooking is excluded from scoring.'
};

await fs.writeFile(path.join(ROOT, 'public/iea-energy-affordability-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/iea-energy-affordability-impact-snapshot.json', version: snapshot.version, accumulated_impact: snapshot.accumulated_impact }, null, 2));
