import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'noaa-coastal-hypoxia-snapshot.json');
const SOURCE_ID = 'noaa_dynamics_and_distribution_of_natural_and_human_caused_coastal_hypoxia';
const INGESTION_JOB_ID = 'fetch_noaa_gulf_coastal_hypoxia';
const METRIC_ID = 'noaa_gulf_midsummer_hypoxic_zone_area';
const SOURCE_URL = 'https://oceanservice.noaa.gov/hazards/hypoxia/';
const MONITORING_URL = 'https://coastalscience.noaa.gov/project/operational-gulf-of-america-hypoxia-monitoring/';
const DATA_ARCHIVE_URL = 'https://www.ncei.noaa.gov/waf/hypoxia-waf/documents/hypoxia/data/';
const SQUARE_MILES_TO_KM2 = 2.589988110336;

function cleanText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&quot;/gi, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseLatestSurvey(text) {
  const sizeMatch = text.match(/At\s+([\d,]+(?:\.\d+)?)\s+square miles,\s+the\s+(20\d{2})\s+hypoxic zone/i);
  if (!sizeMatch) throw new Error('NOAA page no longer exposes the expected annual hypoxic-zone size statement.');
  const squareMiles = Number(sizeMatch[1].replaceAll(',', ''));
  const year = Number(sizeMatch[2]);
  if (!(squareMiles > 0) || year < 1985 || year > new Date().getUTCFullYear()) throw new Error('NOAA hypoxia size or year is invalid.');

  const surveyWindowMatch = text.match(/measured from\s+([A-Z][a-z]+\s+\d{1,2})\s+to\s+([A-Z][a-z]+\s+\d{1,2}),\s+(20\d{2})/i);
  const surveyYear = surveyWindowMatch ? Number(surveyWindowMatch[3]) : null;
  if (surveyWindowMatch && surveyYear !== year) throw new Error('NOAA survey window year does not match the reported hypoxic-zone year.');

  const rankMatch = text.match(/is the\s+(\d+)(?:st|nd|rd|th)\s+(smallest|largest)\s+ever measured in the\s+(\d+)-year record/i);
  return {
    year,
    squareMiles,
    surveyStart: surveyWindowMatch ? `${surveyWindowMatch[1]}, ${year}` : null,
    surveyEnd: surveyWindowMatch ? `${surveyWindowMatch[2]}, ${year}` : null,
    recordRank: rankMatch ? Number(rankMatch[1]) : null,
    rankDirection: rankMatch ? rankMatch[2].toLowerCase() : null,
    recordLengthYears: rankMatch ? Number(rankMatch[3]) : null
  };
}

async function main() {
  const response = await fetch(SOURCE_URL, {
    headers: { Accept: 'text/html', 'User-Agent': 'LostPlanet-Northstar/1.0 source-bound scientific snapshot' },
    signal: AbortSignal.timeout(120_000)
  });
  if (!response.ok) throw new Error(`NOAA hypoxia page request failed: ${response.status} ${response.statusText}`);
  const sourceText = cleanText(await response.text());
  const survey = parseLatestSurvey(sourceText);
  const hypoxicAreaKm2 = Number((survey.squareMiles * SQUARE_MILES_TO_KM2).toFixed(1));

  const record = {
    record_id: `noaa_gulf_hypoxia_${survey.year}`,
    metric_id: METRIC_ID,
    measurement_role: 'bounded_annual_shelf_wide_cruise_primary',
    geography: 'northern Gulf of America continental shelf off Louisiana and Texas',
    observation_year: survey.year,
    survey_start_date_label: survey.surveyStart,
    survey_end_date_label: survey.surveyEnd,
    source_reported_hypoxic_area_square_miles: survey.squareMiles,
    converted_hypoxic_area_square_kilometres: hypoxicAreaKm2,
    dissolved_oxygen_threshold_mg_l: 2,
    threshold_operator: 'less_than_or_equal_to',
    source_reported_record_rank: survey.recordRank,
    source_reported_rank_direction: survey.rankDirection,
    source_reported_record_length_years: survey.recordLengthYears,
    source_locator: {
      annual_status_page_url: SOURCE_URL,
      monitoring_program_url: MONITORING_URL,
      station_and_contour_archive_url: DATA_ARCHIVE_URL,
      locator: `Annual NOAA status statement for the ${survey.year} shelf-wide cruise; source-reported area in square miles and bottom-water hypoxia threshold of 2 milligrams per litre or lower.`
    }
  };

  const snapshot = {
    version: `noaa_gulf_coastal_hypoxia_${survey.year}_v1`,
    captured_at: new Date().toISOString(),
    source: {
      id: SOURCE_ID,
      name: 'NOAA Gulf of America annual hypoxic-zone monitoring',
      url: SOURCE_URL,
      monitoring_url: MONITORING_URL,
      data_archive_url: DATA_ARCHIVE_URL,
      access: 'open_authoritative_web_and_station_archive'
    },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: [METRIC_ID],
    cadence: 'annual after completion of the NOAA-supported midsummer shelf-wide monitoring cruise',
    provenance: 'NOAA Ocean Service source-reported annual Gulf hypoxic-zone area from the long-running shelf-wide ship survey. The published square-mile area is retained and independently converted to square kilometres with an explicit constant.',
    uncertainty: 'The status page does not publish an interval for the annual mapped area. Cruise timing, station spacing, contour interpolation, storms, mixing, river discharge, nutrient load and transient oxygen conditions affect the mapped maximum midsummer extent.',
    failure_behavior: 'Retain the last validated annual survey and mark stale; reject an unparseable year, size, threshold or mismatched survey window; never interpret a missing survey as zero hypoxia or extrapolate this Gulf metric to another coastal system.',
    measurement_boundary: 'This metric is the mapped annual midsummer area with bottom dissolved oxygen at or below 2 milligrams per litre in the northern Gulf shelf survey. It is not event duration, oxygen-deficit volume, annual average area, global coastal hypoxia, ecological damage or a causal nutrient-response coefficient.',
    conversion: {
      square_miles_to_square_kilometres: SQUARE_MILES_TO_KM2,
      converted_field: 'converted_hypoxic_area_square_kilometres'
    },
    record_count: 1,
    records: [record]
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: OUTPUT_PATH, observation_year: survey.year, square_miles: survey.squareMiles, square_kilometres: hypoxicAreaKm2 }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
