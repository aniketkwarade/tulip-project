import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = 'public/global-agricultural-health-impact-snapshot.json';
const snapshot = {
  version: 'global_agricultural_heat_and_animal_health_impacts_2026_v1',
  captured_at: new Date().toISOString(),
  sources: [
    {
      id: 'lancet_countdown_data_explorer',
      name: 'Lancet Countdown 2025 data explorer',
      url: 'https://lancetcountdown.org/explore-our-data/'
    },
    {
      id: 'ilo_working_on_a_warmer_planet',
      name: 'ILO Working on a warmer planet',
      url: 'https://www.ilo.org/publications/major-publications/working-warmer-planet-effect-heat-stress-productivity-and-decent-work'
    },
    {
      id: 'woah_state_of_world_animal_health_2026',
      name: "WOAH State of the World's Animal Health 2026",
      url: 'https://www.woah.org/en/animal-health-receives-as-little-as-0-6-percent-of-global-health-spending-despite-mounting-disease-crises-new-report-warns/'
    }
  ],
  assessment: {
    lancet_observation_year: 2024,
    global_agricultural_potential_work_hours_lost: 406471717470,
    global_total_potential_work_hours_lost: 639855005650,
    lancet_complete_annual_observations: 35,
    ilo_agricultural_workers_million: 940,
    animal_health_report_year: 2026,
    global_animal_production_loss_linked_to_disease_pct: 20,
    annual_farmer_economic_loss_usd_billion: 300,
    high_pathogenicity_avian_influenza_outbreaks_2025_2026_lower_bound: 2000,
    high_pathogenicity_avian_influenza_reporting_countries_and_territories: 64,
    poultry_culled_or_lost_million_lower_bound: 140,
    emerging_infectious_human_diseases_with_animal_origin_pct: 75,
    global_scope: true,
    source_locators: [
      'Lancet Countdown 2025 global workbook: 406,471,717,470 potential agricultural work hours lost to heat in 2024 and 35 annual observations.',
      'ILO Working on a warmer planet: 940 million people work in agriculture worldwide.',
      "WOAH State of the World's Animal Health 2026: animal diseases destroy more than 20% of global animal production and cause about USD 300 billion in annual farmer losses.",
      'WOAH 2026: more than 2,000 HPAI outbreaks in 64 countries and territories during 2025-2026, with more than 140 million poultry culled or lost.',
      'WOAH One Health: 75% of emerging infectious human diseases have an animal origin.'
    ]
  },
  provenance: 'Reviewed global assessment values retain observation year, modeled-versus-reported design, population boundary, outbreak period and lower-bound qualifiers.',
  uncertainty: 'Lancet work-loss values are modeled from WBGT, employment and sector assumptions. WOAH production loss is a synthesized global estimate; outbreak reporting, surveillance, disease definitions and indirect economic losses vary.',
  failure_behavior: 'Retain the last reviewed assessments and mark stale; never convert projected 2030 labor losses into observations, add nested animal-disease losses, infer human cases from animal outbreaks, or replace unreported outbreaks with zero.'
};
await fs.writeFile(path.join(ROOT, output), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, sources: snapshot.sources.map(source => source.id) }, null, 2));
