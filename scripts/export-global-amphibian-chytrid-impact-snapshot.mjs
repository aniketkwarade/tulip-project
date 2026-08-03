import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const snapshot = {
  version: 'global_amphibian_chytrid_impact_2022_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'olson_global_bd_patterns_2021',
      name: 'Global Patterns of the Fungal Pathogen Batrachochytrium dendrobatidis Support Conservation Urgency',
      publisher: 'Frontiers in Veterinary Science',
      url: 'https://www.frontiersin.org/journals/veterinary-science/articles/10.3389/fvets.2021.685877/full',
      doi: '10.3389/fvets.2021.685877'
    },
    {
      id: 'springborn_amphibian_collapse_malaria_2022',
      name: 'Amphibian collapses increased malaria incidence in Central America',
      publisher: 'Environmental Research Letters',
      url: 'https://iopscience.iop.org/article/10.1088/1748-9326/ac8e1d',
      doi: '10.1088/1748-9326/ac8e1d'
    }
  ],
  assessment: {
    global_pathogen_inventory: {
      compiled_through_year: 2020,
      detected_species: 1375,
      sampled_species: 2525,
      detected_species_share_pct: 55,
      countries_with_occurrence: 93,
      sampled_countries: 134,
      countries_with_occurrence_share_pct: 69,
      oldest_detection_record_age_years_minimum: 80,
      finding: 'Known species and site detections increased as surveillance expanded; the publication does not interpret the accretion of records as a prevalence trend.'
    },
    observed_human_health_effect: {
      geography: 'Costa Rica and Panama',
      study_period_start_year: 1976,
      study_period_end_year: 2016,
      elevated_malaria_incidence_duration_years: 8,
      peak_additional_cases_per_1000_people_per_year: 1,
      causal_boundary: 'The event-study estimates the regional malaria effect after Bd-driven amphibian collapse; it is not a global malaria burden estimate.'
    }
  },
  uncertainty: 'The global infection compilation is surveillance-based: sampling is incomplete and uneven, a detection does not mean every infected host developed lethal disease, and growth in known records is not a measured temporal increase in prevalence. The human-health effect is causal but geographically limited to Costa Rica and Panama and must not be extrapolated worldwide.'
};

await fs.writeFile(
  path.join(ROOT, 'public/global-amphibian-chytrid-impact-snapshot.json'),
  `${JSON.stringify(snapshot, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/global-amphibian-chytrid-impact-snapshot.json',
  version: snapshot.version,
  source_count: snapshot.sources.length
}, null, 2));
