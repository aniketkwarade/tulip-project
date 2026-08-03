import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const snapshot = {
  version: 'noaa_california_atmospheric_river_january_2021_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'noaa_wpc_january_2021_california_atmospheric_river_review',
      name: 'NOAA Weather Prediction Center January 2021 Western U.S. Atmospheric River Event Review',
      publisher: 'NOAA National Weather Service Weather Prediction Center',
      publication_date: '2021-01-29',
      url: 'https://www.wpc.ncep.noaa.gov/storm_summaries/event_reviews.php?YYYYMMDD=20210129&product=h2',
      source_locators: [
        'WPC reports integrated vapor transport of 500-700 kg/m/s, four to five standard deviations above the mean, for 24-48 hours along portions of California’s central coast.',
        'Using the Ralph et al. intensity-duration scale, WPC classified the event as a category 2 atmospheric river.',
        'The January 26-28 storm produced 10-15 inches of rain along coastal ranges, widespread Sierra snowfall above 48 inches, debris flows, wind damage and flooding.'
      ]
    },
    {
      id: 'noaa_ncei_california_flooding_severe_weather_january_2021',
      name: 'NOAA NCEI California Flooding and Severe Weather January 2021',
      publisher: 'NOAA National Centers for Environmental Information',
      publication_date: '2021-01-29',
      url: 'https://www.ncei.noaa.gov/access/billions/state-summary/CA',
      source_locators: [
        'NCEI bounds the event from January 24-29 and attributes USD 1.3 billion in CPI-adjusted damage and two deaths to the California flooding and severe-weather disaster.',
        'More than seven inches of rain fell from southern California to the central coast, with totals above 15 inches in Monterey and San Luis Obispo counties.',
        'The event damaged homes, vehicles, businesses and infrastructure, washed out Highway 1 and caused extensive power outages.'
      ]
    }
  ],
  metric_contract: {
    node_id: 'atmospheric_river_intensification',
    metric_id: 'atmospheric_river_integrated_vapor_transport_intensity_and_duration',
    unit: 'kilograms per metre per second peak integrated vapor transport, hours, event category, CPI-adjusted US dollars, deaths, event days and counties',
    geography: 'California central-coast IVT corridor and NCEI statewide disaster-event boundary',
    assessment_period: '2021-01-24 to 2021-01-29',
    boundary: 'The receipt preserves WPC’s IVT range, duration and named category algorithm while using the matched NCEI disaster record for impacts. It does not generalize the corridor IVT maximum across California or treat precipitation alone as IVT.'
  },
  accumulated_impact: {
    integrated_vapor_transport_kg_m_s_min: 500,
    integrated_vapor_transport_kg_m_s_max: 700,
    integrated_vapor_transport_duration_hours_min: 24,
    integrated_vapor_transport_duration_hours_max: 48,
    integrated_vapor_transport_standard_deviations_above_mean_min: 4,
    integrated_vapor_transport_standard_deviations_above_mean_max: 5,
    atmospheric_river_category: 2,
    damage_usd_cpi_adjusted_billions: 1.3,
    deaths: 2,
    event_start_date: '2021-01-24',
    event_end_date: '2021-01-29',
    inclusive_event_day_count: 6,
    counties_with_rainfall_above_15_inches: 2
  },
  reviewed_normalization_anchors: {
    peak_integrated_vapor_transport_kg_m_s: [250, 500, 750, 1000],
    damage_usd_cpi_adjusted_billions: [0, 0.01, 0.1, 1],
    inclusive_event_day_count: [0, 1, 3, 7],
    counties_with_extreme_rainfall: [0, 1, 5, 20]
  },
  uncertainty: 'The 700 kg/m/s value is the upper end of a WPC-reported corridor range and is not a statewide spatial mean. Category 2 uses the named Ralph et al. intensity-duration scale; it is retained for provenance rather than independently added to the score. NCEI’s USD 1.3 billion is a CPI-adjusted disaster estimate and may be revised. The six-day NCEI event window is longer than the 24-48-hour high-IVT interval. Two counties with rainfall above 15 inches form a conservative observed extent and do not represent every affected county. Antecedent burn scars changed local damage severity.'
};

await fs.writeFile(path.join(ROOT, 'public/noaa-january-2021-atmospheric-river-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/noaa-january-2021-atmospheric-river-impact-snapshot.json', version: snapshot.version, accumulated: snapshot.accumulated_impact }, null, 2));
