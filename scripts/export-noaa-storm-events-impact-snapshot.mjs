import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const annual = (values) => Object.entries(values).map(([year, value]) => ({ year: Number(year), ...value }));

const snapshot = {
  version: 'noaa_ncei_storm_events_2020_2025_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'noaa_ncei_storm_events_bulk_csv',
      name: 'NOAA NCEI Storm Events Bulk CSV',
      publisher: 'NOAA National Centers for Environmental Information',
      url: 'https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/',
      files: [
        { year: 2020, filename: 'StormEvents_details-ftp_v1.0_d2020_c20260323.csv.gz', sha256: '895c56fd46991c4d9a135d67558dc4b447a02a2314efac0ace645135b98f9c9d' },
        { year: 2021, filename: 'StormEvents_details-ftp_v1.0_d2021_c20260323.csv.gz', sha256: '60c1daf96dbe8eafd48c80df5b70df51a0125ab95d467ee7009a646761d57715' },
        { year: 2022, filename: 'StormEvents_details-ftp_v1.0_d2022_c20260625.csv.gz', sha256: '7d6b79d0049a6edec96b061738289daddba90be26fc9afe7b0a6fd617f21452e' },
        { year: 2023, filename: 'StormEvents_details-ftp_v1.0_d2023_c20260323.csv.gz', sha256: '713784bed40d9e5a95b1d6240a654f865f3ef97703713105c7b35437270da134' },
        { year: 2024, filename: 'StormEvents_details-ftp_v1.0_d2024_c20260728.csv.gz', sha256: '2070b83eccab041b36360ab73645b9a249c3eefc5b92b5b3fc0cbba4d9fcc09c' },
        { year: 2025, filename: 'StormEvents_details-ftp_v1.0_d2025_c20260728.csv.gz', sha256: '447b536ce7796585b923b946f0b85be538bde142858674f5d0b45a3b4c134bf5' }
      ]
    },
    {
      id: 'noaa_ncei_storm_events_database_documentation',
      name: 'NOAA NCEI Storm Events Database and Bulk Format Documentation',
      publisher: 'NOAA National Centers for Environmental Information',
      url: 'https://www.ncei.noaa.gov/stormevents/',
      format_url: 'https://www.ncei.noaa.gov/pub/data/swdi/stormevents/csvfiles/Storm-Data-Bulk-csv-Format.pdf',
      validation: 'NCEI identifies the database as the record behind official Storm Data and preserves reported fatalities, injuries, damage, narratives and event-specific values while warning that procedures and periods of record vary by event type.'
    }
  ],
  metric_contract: {
    geography: 'United States, District of Columbia and U.S. territories represented in NOAA Storm Events reporting',
    cadence: 'event records aggregated over complete calendar years',
    event_types: ['Hail', 'Flash Flood', 'Lightning'],
    damage_conversion: 'Parse NOAA reported-property and crop-damage suffixes K, M, B and T to nominal U.S. dollars; blank and unparsable values remain missing rather than zero-valued evidence.',
    failure_boundary: 'Storm Events reporting practices and periods vary, reported damage is not inflation-adjusted, and event counts reflect reportable records rather than a complete physical climatology. These accumulated impacts do not establish a current global frequency anomaly.'
  },
  assessments: {
    hail_hazard_shift: {
      node_id: 'hail_hazard_shift',
      metric_id: 'severe_hail_event_frequency',
      event_type: 'Hail',
      start_year: 2020,
      end_year: 2025,
      observed_years: 6,
      event_count: 51036,
      injuries: 138,
      deaths: 6,
      property_damage_usd: 3876343970,
      crop_damage_usd: 553777000,
      total_reported_damage_usd: 4430120970,
      reporting_areas: 53,
      directly_assessed_countries: ['United States'],
      directly_assessed_country_count: 1,
      annual: annual({
        2020: { events: 7677, injuries: 7, deaths: 1, property_damage_usd: 226324300, crop_damage_usd: 54101730 },
        2021: { events: 6272, injuries: 6, deaths: 1, property_damage_usd: 1025707860, crop_damage_usd: 38235270 },
        2022: { events: 7180, injuries: 9, deaths: 2, property_damage_usd: 135467900, crop_damage_usd: 208875900 },
        2023: { events: 11761, injuries: 94, deaths: 2, property_damage_usd: 2201781780, crop_damage_usd: 107404100 },
        2024: { events: 8941, injuries: 15, deaths: 0, property_damage_usd: 226989630, crop_damage_usd: 142860000 },
        2025: { events: 9205, injuries: 7, deaths: 0, property_damage_usd: 60072500, crop_damage_usd: 2300000 }
      })
    },
    flash_flood_regime: {
      node_id: 'flash_flood_regime',
      metric_id: 'flash_flood_event_frequency_and_peak',
      event_type: 'Flash Flood',
      start_year: 2020,
      end_year: 2025,
      observed_years: 6,
      event_count: 25142,
      injuries: 140,
      deaths: 615,
      property_damage_usd: 10094613270,
      crop_damage_usd: 234314100,
      total_reported_damage_usd: 10328927370,
      reporting_areas: 55,
      directly_assessed_countries: ['United States'],
      directly_assessed_country_count: 1,
      annual: annual({
        2020: { events: 3569, injuries: 8, deaths: 40, property_damage_usd: 471061540, crop_damage_usd: 96183210 },
        2021: { events: 4797, injuries: 63, deaths: 138, property_damage_usd: 2423916610, crop_damage_usd: 30588220 },
        2022: { events: 3097, injuries: 14, deaths: 74, property_damage_usd: 1166967920, crop_damage_usd: 1991530 },
        2023: { events: 3625, injuries: 16, deaths: 37, property_damage_usd: 1592095450, crop_damage_usd: 3189640 },
        2024: { events: 4661, injuries: 19, deaths: 117, property_damage_usd: 3143421200, crop_damage_usd: 101576500 },
        2025: { events: 5393, injuries: 20, deaths: 209, property_damage_usd: 1297150550, crop_damage_usd: 785000 }
      })
    },
    lightning_regime_shifts: {
      node_id: 'lightning_regime_shifts',
      metric_id: 'lightning_flash_density_extent_and_seasonality_anomaly',
      event_type: 'Lightning',
      start_year: 2020,
      end_year: 2025,
      observed_years: 6,
      event_count: 1493,
      injuries: 408,
      deaths: 106,
      property_damage_usd: 113558720,
      crop_damage_usd: 3511030,
      total_reported_damage_usd: 117069750,
      reporting_areas: 54,
      directly_assessed_countries: ['United States'],
      directly_assessed_country_count: 1,
      annual: annual({
        2020: { events: 247, injuries: 60, deaths: 19, property_damage_usd: 19075270, crop_damage_usd: 6030 },
        2021: { events: 242, injuries: 74, deaths: 13, property_damage_usd: 10083800, crop_damage_usd: 29000 },
        2022: { events: 261, injuries: 60, deaths: 20, property_damage_usd: 11694000, crop_damage_usd: 4500 },
        2023: { events: 264, injuries: 66, deaths: 15, property_damage_usd: 29889800, crop_damage_usd: 954100 },
        2024: { events: 191, injuries: 50, deaths: 18, property_damage_usd: 20215700, crop_damage_usd: 2502000 },
        2025: { events: 288, injuries: 98, deaths: 21, property_damage_usd: 22600150, crop_damage_usd: 15400 }
      })
    }
  },
  shared_normalization_anchors: {
    accumulated_event_count: [0, 250, 5000, 50000],
    total_reported_damage_usd: [0, 100000000, 1000000000, 10000000000],
    observed_years: [0, 1, 6, 30],
    directly_assessed_country_count: [0, 1, 5, 25]
  },
  uncertainty: 'The assessment covers NOAA-reported U.S. events and territories for 2020-2025 and is not extrapolated globally. Counts are administrative event records, not sensor-derived hail, discharge or lightning-flash climatologies. Damage is nominal, incomplete where no estimate was reported, and not inflation-adjusted. Casualty fields combine direct and indirect totals without monetization. Common anchors are applied across the three event inventories so differing record volumes do not all saturate independently.'
};

await fs.writeFile(path.join(ROOT, 'public/noaa-storm-events-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/noaa-storm-events-impact-snapshot.json', version: snapshot.version, assessments: Object.keys(snapshot.assessments) }, null, 2));
