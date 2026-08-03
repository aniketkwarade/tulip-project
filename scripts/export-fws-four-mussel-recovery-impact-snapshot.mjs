import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const species = [
  { common_name: 'Rayed bean', scientific_name: 'Villosa fabalis', historical_streams_lakes_canals: 115, current_streams_lakes: 38, occurrence_decline_pct: Number(((1 - 38 / 115) * 100).toFixed(6)), estimated_recovery_cost_usd: 27535000 },
  { common_name: 'Sheepnose', scientific_name: 'Plethobasus cyphyus', historical_streams: 79, current_streams: 22, occurrence_decline_pct: Number(((1 - 22 / 79) * 100).toFixed(6)), estimated_recovery_cost_usd: 31245000 },
  { common_name: 'Snuffbox', scientific_name: 'Epioblasma triquetra', historical_streams_lakes: 211, current_streams: 85, occurrence_decline_pct: Number(((1 - 85 / 211) * 100).toFixed(6)), estimated_recovery_cost_usd: 27535000 },
  { common_name: 'Spectaclecase', scientific_name: 'Cumberlandia monodonta', historical_watersheds: 61, current_watersheds: 40, source_reported_known_population_decline_pct: 60, occurrence_decline_pct: 60, estimated_recovery_cost_usd: 32745000 }
];
const sortedDeclines = species.map(row => row.occurrence_decline_pct).sort((a, b) => a - b);
const snapshot = {
  version: 'fws_four_freshwater_mussel_recovery_plan_2024_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [{
    id: 'fws_four_imperiled_freshwater_mussel_recovery_plan_2024',
    name: 'Recovery Plan for the Rayed Bean, Sheepnose, Snuffbox, and Spectaclecase',
    publisher: 'U.S. Fish and Wildlife Service',
    publication_date: '2024-09-11',
    url: 'https://ecos.fws.gov/docs/recovery_plan/20240911_4Mussels%20Recovery%20Plan%20FINAL.pdf',
    report_sha256: '1f2bd63d21ee2398aed7303096c416cfea366991a145eb9c49c5e038be7d49ff',
    source_locators: ['Background section pages 2-4: historical and current streams, lakes or watersheds for four species.', 'Table 2 page 14: species-specific recovery-action costs.', 'Estimated Time to Recovery page 14: 50-year anticipated delisting horizon.']
  }],
  metric_contract: {
    node_id: 'freshwater_mussel_depletion',
    metric_id: 'freshwater_mussel_population_and_recruitment',
    unit: 'occupied streams, lakes or watersheds by species; recovery cost; recovery horizon',
    geography: 'four named mussel taxa across their United States and Ontario ranges',
    assessment_year: 2024,
    boundary: 'Occurrence units remain species-specific. The spectaclecase uses the source-reported 60 percent known-population decline rather than deriving a different percentage from watershed counts. No cause is inferred from absence alone.'
  },
  accumulated_impact: {
    species,
    assessed_species_count: species.length,
    median_occurrence_or_population_decline_pct: Number(((sortedDeclines[1] + sortedDeclines[2]) / 2).toFixed(6)),
    combined_estimated_recovery_cost_usd: species.reduce((sum, row) => sum + row.estimated_recovery_cost_usd, 0),
    estimated_time_to_recovery_years: 50,
    historical_us_state_count_maximum: 18,
    represented_country_count: 2,
    represented_countries: ['United States', 'Canada']
  },
  reviewed_normalization_anchors: {
    occurrence_or_population_decline_pct: [0, 10, 40, 80],
    estimated_recovery_cost_usd: [0, 10000000, 50000000, 250000000],
    estimated_time_to_recovery_years: [0, 5, 20, 50],
    represented_country_count: [0, 1, 10, 100]
  },
  uncertainty: 'Occurrence units differ among species and do not measure density or recruitment directly. Current known occurrence can change with survey effort and detection. Recovery costs omit some undetermined land-acquisition and future-action costs, may overlap when actions benefit multiple species, and are planning estimates rather than realized damages. The assessment covers four imperiled North American taxa, not all freshwater mussels globally.'
};

await fs.writeFile(path.join(ROOT, 'public/fws-four-mussel-recovery-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/fws-four-mussel-recovery-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
