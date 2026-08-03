import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = {
  version: 'great_london_smog_particulate_soot_december_1952_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'greater_london_authority_great_smog_70_year_review',
      name: '70 Years Since the Great London Smog: 1952 Air Quality in a Modern Context',
      publisher: 'Greater London Authority',
      publication_date: '2022-12-05',
      url: 'https://www.london.gov.uk/programmes-strategies/environment-and-climate-change/environment-and-climate-change-publications/70-years-great-london-smog',
      source_locators: [
        'Daily smoke concentration rose from 490 micrograms per cubic metre on December 4 to 4,460 micrograms per cubic metre on December 7 and 8.',
        'The event lasted five days and led to an estimated 4,000 excess deaths during December 1952.',
        'The report identifies smoke and sulfur dioxide as separate pollutants and attributes the smog mainly to coal combustion from domestic fireplaces, power stations and furnaces.'
      ]
    },
    {
      id: 'uk_national_archives_ministry_health_great_smog_1952',
      name: 'Ministry of Health Statement: Smoke-Laden Fog, 19 December 1952',
      publisher: 'The National Archives, United Kingdom',
      publication_date: '1952-12-19',
      url: 'https://www.nationalarchives.gov.uk/education/resources/fifties-britain/smoke-laden-fog/',
      source_locators: [
        'The greater part of Metropolitan London was continually enveloped by smoke-laden fog for five days, December 5-9.',
        'Deaths registered in Greater London rose to 4,703 in the week ending December 13, more than double the preceding two weeks; 501 Emergency Bed Service applications concerned respiratory disease.',
        'The contemporaneous statement reports increased sulfur dioxide and carbon content but cautions against assigning the event to one constituent before investigations were complete.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'particulate_soot_levels',
    metric_id: 'ambient_black_carbon_concentration',
    unit: 'historical daily smoke mass concentration, excess deaths, event duration and represented city',
    geography: 'Metropolitan and Greater London',
    assessment_period: '1952-12-05 to 1952-12-09',
    boundary: 'The scored pollutant is the separately reported historical smoke concentration, a soot-rich fine-particle measure. Sulfur dioxide is not combined with smoke, emissions are not substituted for ambient concentration, and the historical method is not represented as method-equivalent to modern elemental-carbon or black-carbon instruments.'
  },
  accumulated_impact: {
    daily_smoke_concentration_peak_ug_m3: 4460,
    daily_smoke_concentration_pre_event_1952_12_04_ug_m3: 490,
    estimated_excess_deaths_at_least: 4000,
    registered_deaths_week_ending_1952_12_13: 4703,
    respiratory_emergency_bed_applications: 501,
    event_start_date: '1952-12-05',
    event_end_date: '1952-12-09',
    event_duration_days: 5,
    represented_city_count: 1,
    represented_city: 'London',
    represented_country: 'United Kingdom'
  },
  reviewed_normalization_anchors: {
    historical_daily_smoke_concentration_ug_m3: [0, 50, 250, 1000],
    excess_death_count: [0, 10, 100, 1000],
    event_duration_days: [0, 1, 3, 10],
    represented_city_count: [0, 1, 5, 20]
  },
  uncertainty: 'Historical smoke sampling is not method-equivalent to modern black-carbon, elemental-carbon, PM2.5 or PM10 instruments, so the concentration is retained under its original pollutant label and method boundary. The 4,000 figure is an estimate of excess deaths and later studies have produced higher estimates; the conservative official value is scored. The 4,703 registered deaths and 501 respiratory bed requests are context and do not add separate points. Sulfur dioxide was also extreme but is excluded from this particulate-soot receipt. Extent is one metropolitan event and not a national or global aggregation.'
};

await fs.writeFile(path.join(ROOT, 'public/great-london-smog-soot-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/great-london-smog-soot-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
