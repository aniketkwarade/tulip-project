import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'coral-reef-watch-snapshot.json');
const REFRESH_DAYS = 7;

const HOME_URL = 'https://coralreefwatch.noaa.gov/';
const FIVE_KM_URL = 'https://coralreefwatch.noaa.gov/product/5km/';
const MARINE_HEATWAVE_URL = 'https://coralreefwatch.noaa.gov/product/marine_heatwave/';
const GLOBAL_BLEACHING_STATUS_URL = 'https://www.coralreefwatch.noaa.gov/satellite/research/coral_bleaching_report.php';
const GLOBAL_BLEACHING_NEWS_URL = 'https://www.nesdis.noaa.gov/news/worlds-fourth-mass-coral-bleaching-event-likely-ended-2025';
const BLEACHING_STRESS_EXTENT_URL = 'https://coralreefwatch.noaa.gov/product/5km/index_5km_bse-365d.php';
const METHODOLOGY_URL = 'https://coralreefwatch.noaa.gov/product/5km/methodology.php';
const TUTORIAL_URL = 'https://coralreefwatch.noaa.gov/product/5km/tutorial/welcome.php';

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; TULIP/1.0; +https://github.com/)'
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }
  return response.text();
}

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function toAbsoluteUrl(value) {
  if (!value) return null;
  return new URL(value, HOME_URL).toString();
}

function extractTitle(html) {
  return normalizeWhitespace(html.match(/<title>([^<]+)<\/title>/i)?.[1] || '');
}

function extractMetaKeywords(html) {
  return normalizeWhitespace(html.match(/<meta[^>]+name="Keywords"[^>]+content="([^"]+)"/i)?.[1] || '');
}

function extractImageUrl(html, pattern) {
  const match = html.match(pattern);
  return toAbsoluteUrl(match?.[1] || '');
}

function requireNumber(text, pattern, label) {
  const value = Number(text.match(pattern)?.[1]);
  if (!Number.isFinite(value)) throw new Error(`Unable to extract ${label}.`);
  return value;
}

function requireText(text, pattern, label) {
  const value = text.match(pattern)?.[1]?.trim();
  if (!value) throw new Error(`Unable to extract ${label}.`);
  return value;
}

async function main() {
  const [homeHtml, fiveKmHtml, marineHeatwaveHtml, statusHtml, newsHtml, extentHtml] = await Promise.all([
    fetchText(HOME_URL),
    fetchText(FIVE_KM_URL),
    fetchText(MARINE_HEATWAVE_URL),
    fetchText(GLOBAL_BLEACHING_STATUS_URL),
    fetchText(GLOBAL_BLEACHING_NEWS_URL),
    fetchText(BLEACHING_STRESS_EXTENT_URL)
  ]);
  const statusText = normalizeWhitespace(statusHtml);
  const newsText = normalizeWhitespace(newsHtml);
  const extentText = normalizeWhitespace(extentHtml);

  const fiveKmDefaultImage = extractImageUrl(
    fiveKmHtml,
    /document\.getElementById\("mainImage"\)\.src="([^"]+)"/i
  );
  const marineHeatwaveImage = extractImageUrl(
    marineHeatwaveHtml,
    /<img[^>]+alt="Global Marine Heatwave image"[^>]+src="([^"]+)"/i
  );

  const snapshot = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    snapshot_family: 'reef_and_ocean_heat_operational',
    source: {
      id: 'noaa_coral_reef_watch',
      name: 'NOAA Coral Reef Watch',
      url: HOME_URL,
      publisher: 'NOAA NESDIS',
      access: 'open'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Treat as a short-cycle operational ocean-heat and coral-stress surface. Refresh frequently, but use as monitoring support rather than as the sole basis for broader ocean chemistry claims.'
    },
    use_guidance: {
      primary_role: 'Use for operational reef and marine-heat support on ocean nodes where thermal stress and bleaching risk matter.',
      caution: 'Coral Reef Watch is strongest for ocean thermal stress, bleaching, and marine heatwave context. It complements but does not replace ocean acidification chemistry support.'
    },
    overview: {
      title: extractTitle(homeHtml) || 'NOAA Coral Reef Watch',
      five_km_title: extractTitle(fiveKmHtml),
      marine_heatwave_title: extractTitle(marineHeatwaveHtml),
      keywords: extractMetaKeywords(homeHtml)
    },
    current_global_bleaching_event: {
      status: /likely ended in 2025/i.test(`${statusText} ${newsText}`) ? 'likely_ended' : 'active_or_unresolved',
      source_updated_at: requireText(statusText, /Updated:\s*([^)]+)\)/i, 'global bleaching status update date'),
      observation_start: '2023-01-01',
      observation_end: '2025-09-30',
      reef_area_with_bleaching_level_heat_stress_pct: requireNumber(statusText, /heat stress has impacted\s*~?([\d.]+)%/i, 'reef-area heat-stress percentage'),
      jurisdictions_with_documented_mass_bleaching_lower_bound: requireNumber(statusText, /at least\s*(\d+)\s*countries and territories/i, 'mass-bleaching jurisdiction count'),
      previous_global_event_start_year: 2014,
      previous_global_event_end_year: 2017,
      previous_record_reef_area_pct: requireNumber(statusText, /previous record[^.]*?([\d.]+)% of the world'?s reef area/i, 'previous global-event reef-area percentage'),
      tropical_ocean_basins_affected: requireText(newsText, /all\s+(three)\s+coral reef-containing ocean basins/i, 'affected tropical ocean basin count') === 'three' ? 3 : null,
      tropical_ocean_basin_count: 3,
      measurement_boundary: 'Satellite-observed bleaching-level heat stress across reef pixels, accompanied by field-documented mass bleaching; not a direct census of every coral colony bleached or killed.'
    },
    global_bleaching_stress_extent_contract: {
      product_version: requireText(extentText, /Version\s*([\d.]+)/i, 'bleaching stress extent product version'),
      history_start_year: requireNumber(extentText, /(1986)\s*[–-]\s*present/i, 'bleaching stress extent history start year'),
      rolling_window_days: 365,
      global_event_threshold_pct: requireNumber(extentText, /Thresholds of\s*(\d+)%/i, 'global bleaching event threshold'),
      basin_event_threshold_pct: requireNumber(extentText, /three tropical ocean basins[^.]*?annual bleaching stress extent of\s*(\d+)%/i, 'basin bleaching event threshold'),
      minimum_concurrent_duration_days: requireNumber(extentText, /at least\s*(\d+)\s*consecutive days/i, 'minimum concurrent duration'),
      update_cadence: 'daily',
      source_url: BLEACHING_STRESS_EXTENT_URL
    },
    products: [
      {
        id: 'bleaching_stress_extent_365d',
        label: 'Daily 365-day Bleaching Stress Extent',
        url: BLEACHING_STRESS_EXTENT_URL,
        type: 'daily_global_5km_rolling_365_day',
        access: 'open',
        notes: 'Global and basin reef-pixel share exposed to Alert Level 1 or higher, with a retained history beginning in 1986 and a documented global-event threshold.'
      },
      {
        id: 'bleaching_alert_area',
        label: 'Bleaching Alert Area',
        url: 'https://coralreefwatch.noaa.gov/product/5km/index_5km_baa-max-7d.php',
        type: 'daily_5km',
        access: 'open',
        current_image_url: fiveKmDefaultImage,
        notes: 'Daily 5km coral bleaching heat-stress alert surface.'
      },
      {
        id: 'degree_heating_week',
        label: 'Degree Heating Week',
        url: 'https://coralreefwatch.noaa.gov/product/5km/index_5km_dhw.php',
        type: 'daily_5km',
        access: 'open',
        notes: 'Accumulated thermal stress product widely used for bleaching context.'
      },
      {
        id: 'hotspot',
        label: 'HotSpot',
        url: 'https://coralreefwatch.noaa.gov/product/5km/index_5km_hs.php',
        type: 'daily_5km',
        access: 'open',
        notes: 'Near-real-time heat-stress anomaly product.'
      },
      {
        id: 'marine_heatwave_watch',
        label: 'Marine Heatwave Watch',
        url: MARINE_HEATWAVE_URL,
        type: 'daily_5km',
        access: 'open',
        current_image_url: marineHeatwaveImage,
        notes: 'Daily global 5km marine heatwave category product derived from CoralTemp SST.'
      },
      {
        id: 'five_km_methodology',
        label: '5km Products Methodology',
        url: METHODOLOGY_URL,
        type: 'methodology',
        access: 'open',
        notes: 'Canonical methodology reference for Coral Reef Watch 5km products.'
      },
      {
        id: 'five_km_tutorial',
        label: '5km Products Tutorial',
        url: TUTORIAL_URL,
        type: 'tutorial',
        access: 'open',
        notes: 'User-facing onboarding for interpreting CRW products.'
      }
    ],
    supported_questions: [
      'Which ocean nodes should inherit operational reef and marine-heat support rather than only report-style references?',
      'Which coral bleaching and marine heatwave surfaces should appear as evidence bundles on reef-sensitive nodes?',
      'Which ocean support layers are operational versus methodology or tutorial references?'
    ],
    provenance: 'Official NOAA Coral Reef Watch operational products and status statements. Event-wide satellite heat-stress exposure and field-documented mass bleaching are retained separately from colony mortality or structural reef loss.',
    uncertainty: 'Satellite reef masks, climatology, product versions, heat-stress thresholds, field-report coverage and event start/end adjudication affect estimates. Heat stress indicates bleaching risk and documented mass bleaching confirms the event, but 84.4 percent is not a direct colony-level bleaching or mortality fraction.',
    failure_behavior: 'Retain the last validated snapshot and mark stale; reject missing global-event criteria, changed units, invalid percentages, a truncated history or a basin denominator other than three. Never treat heat-stress area as coral mortality, infer reef structural collapse, or fill missing reef pixels with zero.'
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    product_count: snapshot.products.length,
    current_global_event_reef_area_pct: snapshot.current_global_bleaching_event.reef_area_with_bleaching_level_heat_stress_pct,
    five_km_title: snapshot.overview.five_km_title
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
