import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lightningStrikes = 14000;
const landAreaSquareMiles = 155858.33;
const squareKilometresPerSquareMile = 2.589988110336;
const landAreaSquareKilometres = landAreaSquareMiles * squareKilometresPerSquareMile;
const snapshot = {
  version: 'california_lightning_siege_august_2020_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'california_board_forestry_2020_annual_report_lightning_siege',
      name: 'California Board of Forestry and Fire Protection 2020 Annual Report',
      publisher: 'California Board of Forestry and Fire Protection',
      publication_date: '2021-01-01',
      url: 'https://cdnverify.bof.fire.ca.gov/media/fofgvmj3/corrected-2020-bof-annual-report.pdf',
      source_locators: [
        'Figure 17 compares the August 15-30, 2020 lightning siege with prior sieges and reports nearly 14,000 lightning strikes, more than 900 wildfires and nearly 2.8 million acres burned.',
        'The same CAL FIRE response boundary reports more than 6,900 structures destroyed and 26 fatalities.',
        'The report cautions that, unless otherwise noted, the values cover wildfires responded to by CAL FIRE in state-responsibility and contracted local-responsibility areas.'
      ]
    },
    {
      id: 'caloes_august_september_2020_wildfire_incidents',
      name: 'California OES August/September 2020 Wildfire Incidents',
      publisher: 'California Governor’s Office of Emergency Services',
      publication_date: '2020-09-01',
      url: 'https://www.wildfirerecovery.caloes.ca.gov/past-incidents/august-september-2020-fires/',
      source_locators: [
        'Cal OES identifies lightning strikes, extreme wildfire conditions and heat as the event boundary for the mid-August complexes.',
        'The August 22 major-disaster declaration covered Lake, Napa, San Mateo, Santa Cruz, Solano, Sonoma and Yolo counties.',
        'The page distinguishes later September fires and declarations from the August lightning-siege extent used by this receipt.'
      ]
    },
    {
      id: 'us_census_quickfacts_california_land_area_2020',
      name: 'U.S. Census Bureau QuickFacts California Land Area 2020',
      publisher: 'U.S. Census Bureau',
      publication_date: '2020-04-01',
      url: 'https://www.census.gov/quickfacts/fact/table/CA/POP010220',
      source_locators: [
        'QuickFacts reports California land area of 155,858.33 square miles in 2020.',
        'The receipt converts the state land area to square kilometres solely to express the reported statewide strike count in the contract unit.',
        'Statewide density is an event-total spatial average and not a claim that strikes were uniformly distributed.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'lightning_fire_weather',
    metric_id: 'dry_lightning_fire_weather_events',
    unit: 'lightning strikes per square kilometre per event, wildfires, acres, structures, fatalities, event days and declared counties',
    geography: 'California statewide lightning-siege reporting boundary; seven-county presidential disaster declaration for conservative impact extent',
    assessment_period: '2020-08-15 to 2020-08-30',
    boundary: 'The receipt uses the agency-defined lightning siege and its CAL FIRE response totals. It does not add the entire 2020 fire season, later wind-driven fires, or imply uniform statewide lightning density.'
  },
  accumulated_impact: {
    lightning_strikes_approx: lightningStrikes,
    california_land_area_square_miles: landAreaSquareMiles,
    california_land_area_square_kilometres_derived: Number(landAreaSquareKilometres.toFixed(3)),
    lightning_strikes_per_square_kilometre_derived: Number((lightningStrikes / landAreaSquareKilometres).toFixed(8)),
    wildfires_more_than: 900,
    acres_burned_approx: 2800000,
    structures_destroyed_more_than: 6900,
    fatalities: 26,
    event_start_date: '2020-08-15',
    event_end_date: '2020-08-30',
    inclusive_event_day_count: 16,
    presidential_major_disaster_declared_counties: 7
  },
  reviewed_normalization_anchors: {
    lightning_strikes_per_square_kilometre_per_event: [0, 0.005, 0.02, 0.05],
    structures_destroyed: [0, 100, 1000, 10000],
    inclusive_event_day_count: [0, 1, 7, 30],
    major_disaster_declared_counties: [0, 1, 5, 20]
  },
  uncertainty: 'The strike and burned-area figures are reported as approximate and the wildfire and structure totals as lower bounds. Statewide strike density divides an event-total count by Census land area and masks strong spatial clustering. The 6,900 structures and 26 fatalities use CAL FIRE’s stated response boundary and are not a complete statewide economic-loss inventory. Seven counties conservatively represent the August 22 major-disaster declaration; affected areas outside those counties are not added. The receipt does not attribute every 2020 wildfire impact to lightning.'
};

await fs.writeFile(path.join(ROOT, 'public/california-2020-lightning-fire-weather-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/california-2020-lightning-fire-weather-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
