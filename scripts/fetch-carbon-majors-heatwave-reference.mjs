import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { strFromU8, unzipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const calibrationDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(calibrationDir, 'carbon-majors-heatwave-reference-snapshot.json');
const checkedOn = '2026-09-23';
const articleUrl = 'https://www.nature.com/articles/s41586-025-09450-9';
const supplementaryUrl = 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-025-09450-9/MediaObjects/41586_2025_9450_MOESM1_ESM.xlsx';
const expectedSha256 = '9e8bd0d4c0c77df12f58103f00bc29af1588b8ede3568f3e1acd7f95b190c728';
const userAgent = 'LostPlanet-TULIP/1.0 (+carbon-majors-heatwave-data-ingestion)';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url) {
  let lastFailure = 'request failed';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(120_000),
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'User-Agent': userAgent,
        },
      });
      if (response.ok) return Buffer.from(await response.arrayBuffer());
      lastFailure = `HTTP ${response.status}`;
      if ((response.status < 500 && response.status !== 429) || attempt === 3) break;
    } catch (error) {
      lastFailure = error instanceof Error ? error.message : String(error);
      if (attempt === 3) break;
    }
    await new Promise(resolveRetry => setTimeout(resolveRetry, attempt * 1000));
  }
  throw new Error(`${url}: ${lastFailure}`);
}

function decodeXml(value = '') {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&')
    .replace(/&#(\d+);/g, (_match, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code) => String.fromCodePoint(Number.parseInt(code, 16)));
}

function columnNumber(reference) {
  return [...reference].reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0);
}

function parseWorksheet(xml) {
  const rows = new Map();
  const rowPattern = /<row\b[^>]*\br="(\d+)"[^>]*>([\s\S]*?)<\/row>/g;
  for (const rowMatch of xml.matchAll(rowPattern)) {
    const rowNumber = Number(rowMatch[1]);
    const cells = new Map();
    const cellPattern = /<c\b([^>]*?)\br="([A-Z]+)\d+"([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g;
    for (const cellMatch of rowMatch[2].matchAll(cellPattern)) {
      const column = columnNumber(cellMatch[2]);
      const body = cellMatch[4] ?? '';
      const text = [...body.matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)]
        .map(match => decodeXml(match[1]))
        .join('');
      const rawValue = body.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      cells.set(column, text || (rawValue == null ? null : decodeXml(rawValue)));
    }
    rows.set(rowNumber, cells);
  }
  return rows;
}

function numeric(value, unit = '') {
  if (value == null) return null;
  const normalized = String(value).replace(unit, '').trim();
  if (normalized.startsWith('>')) return null;
  const parsed = Number(normalized.replaceAll("'", ''));
  return Number.isFinite(parsed) ? parsed : null;
}

function interval(value, unit = '') {
  if (value == null) return null;
  const normalized = String(value).replaceAll(unit, '').replaceAll("'", '').trim();
  const match = normalized.match(/^(-?[\d.]+|>[\d.]+)\s+-\s+(-?[\d.]+|>[\d.]+)$/);
  assert(match, `Cannot parse interval: ${value}`);
  const parseBound = bound => bound.startsWith('>') ? Number(bound.slice(1)) : Number(bound);
  return {
    lower: parseBound(match[1]),
    upper: parseBound(match[2]),
    lowerCensored: match[1].startsWith('>'),
    upperCensored: match[2].startsWith('>'),
    reported: String(value),
  };
}

function quantile(sorted, probability) {
  assert(sorted.length > 0);
  const index = (sorted.length - 1) * probability;
  const lower = Math.floor(index);
  const fraction = index - lower;
  const upper = sorted[lower + 1];
  return upper == null ? sorted[lower] : sorted[lower] + fraction * (upper - sorted[lower]);
}

function distribution(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return {
    count: sorted.length,
    minimum: sorted[0],
    p25: quantile(sorted, 0.25),
    median: quantile(sorted, 0.5),
    p75: quantile(sorted, 0.75),
    p90: quantile(sorted, 0.9),
    p95: quantile(sorted, 0.95),
    p99: quantile(sorted, 0.99),
    maximum: sorted.at(-1),
  };
}

const workbook = await fetchBuffer(supplementaryUrl);
assert.equal(sha256(workbook), expectedSha256, 'The official supplementary workbook checksum changed');
const archive = unzipSync(new Uint8Array(workbook));
assert(archive['xl/workbook.xml']);
assert(archive['xl/worksheets/sheet1.xml']);
const workbookXml = strFromU8(archive['xl/workbook.xml']);
const worksheetXml = strFromU8(archive['xl/worksheets/sheet1.xml']);
assert.match(workbookXml, /<sheet name="Sheet"/);
assert.match(worksheetXml, /<dimension ref="A1:PN379"/);
const rows = parseWorksheet(worksheetXml);
const cell = (row, column) => rows.get(row)?.get(column) ?? null;

assert.match(cell(5, 1), /213 heatwaves reported to the disaster database EM-DAT over 2000-2023/);
assert.match(cell(5, 1), /emissions of 180 carbon majors/);
assert.match(cell(8, 1), /not as the quantification of legal responsibilities/i);
assert.match(cell(8, 1), /Scope 1, 2 and 3/);

const eventMedianColumns = Array.from({ length: 213 }, (_value, index) => 5 + index * 2);
let eventRegion = null;
let eventCountry = null;
const events = eventMedianColumns.map(column => {
  eventRegion = cell(11, column) ?? eventRegion;
  eventCountry = cell(12, column) ?? eventCountry;
  const id = cell(13, column);
  const climateIntensityMedianC = numeric(cell(17, column), '°C');
  const climateProbabilityRatioReported = cell(18, column);
  return {
    id,
    region: eventRegion,
    country: eventCountry,
    reportedLocation: cell(14, column),
    reportedPeriod: cell(15, column),
    anthropogenicClimateChange: {
      intensityMedianC: climateIntensityMedianC,
      intensity95IntervalC: interval(cell(17, column + 1), '°C'),
      probabilityRatioMedian: numeric(climateProbabilityRatioReported),
      probabilityRatioMedianCensoredAbove10000: String(climateProbabilityRatioReported).startsWith('>'),
      probabilityRatioReported: climateProbabilityRatioReported,
      probabilityRatio95Interval: interval(cell(18, column + 1)),
    },
  };
});

let headquarterRegion = null;
let headquarterCountry = null;
const carbonMajors = [];
const contributionRecords = [];
for (let row = 20; row <= 378; row += 2) {
  headquarterRegion = cell(row, 1) ?? headquarterRegion;
  headquarterCountry = cell(row, 2) ?? headquarterCountry;
  const name = cell(row, 3);
  assert(name, `Missing carbon major at row ${row}`);
  carbonMajors.push({ name, headquarterRegion, headquarterCountry });
  for (let index = 0; index < eventMedianColumns.length; index += 1) {
    const column = eventMedianColumns[index];
    const intensityC = numeric(cell(row, column), '°C');
    const probabilityRatioReported = cell(row + 1, column);
    assert(Number.isFinite(intensityC));
    assert(probabilityRatioReported != null);
    contributionRecords.push({
      carbonMajor: name,
      headquarterCountry,
      eventId: events[index].id,
      eventCountry: events[index].country,
      intensityC,
      probabilityRatio: numeric(probabilityRatioReported),
      probabilityRatioCensoredAbove10000: String(probabilityRatioReported).startsWith('>'),
    });
  }
}

assert.equal(events.length, 213);
assert.equal(new Set(events.map(event => event.id)).size, 213);
assert.equal(carbonMajors.length, 180);
assert.equal(new Set(carbonMajors.map(major => major.name)).size, 180);
assert.equal(contributionRecords.length, 38_340);

const years = events.map(event => Number(event.id.slice(0, 4)));
const annualEventCounts = Object.fromEntries([...new Set(years)].sort((a, b) => a - b).map(year => [year, years.filter(value => value === year).length]));
const climateIntensityValues = events.map(event => event.anthropogenicClimateChange.intensityMedianC);
const finiteClimateProbabilityRatios = events.map(event => event.anthropogenicClimateChange.probabilityRatioMedian).filter(Number.isFinite);
const contributionIntensityValues = contributionRecords.map(record => record.intensityC);
const finiteContributionProbabilityRatios = contributionRecords.map(record => record.probabilityRatio).filter(Number.isFinite);
const topIntensityContributions = [...contributionRecords]
  .sort((left, right) => right.intensityC - left.intensityC || left.carbonMajor.localeCompare(right.carbonMajor) || left.eventId.localeCompare(right.eventId))
  .slice(0, 10);

const snapshot = {
  version: 'tulip_carbon_majors_heatwave_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'published_213_event_180_emitter_hazard_matrix_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Pin and validate the published source-to-heat-hazard evidence before any TULIP source-boundary crosswalk or terminal harm calculation.',
  source: {
    id: 'quilcaille_carbon_majors_heatwave_attribution_2025_supplementary_table',
    title: 'Systematic attribution of historical heatwaves to the emissions of carbon majors',
    articleUrl,
    doi: 'https://doi.org/10.1038/s41586-025-09450-9',
    supplementaryUrl,
    workbook: {
      bytes: workbook.length,
      sha256: expectedSha256,
      worksheet: 'Sheet',
      dimension: 'A1:PN379',
      format: 'Office Open XML workbook with inline string cells',
    },
    eventDatabase: 'EM-DAT',
    reportedEventPeriod: { start: 2000, end: 2023 },
    workbookDescriptionBoundary: 'The workbook description says all 213 events span 2000–2023 and separately says event attribution over 2000–2022 is extended to carbon-major emissions. The matrix nevertheless contains emitter values for every event, including 2023. TULIP retains this wording discrepancy rather than resolving it by assumption.',
    legalBoundary: 'The authors say the results are scientific information and do not quantify legal responsibility. Scope 1, 2 and 3 are allocated to carbon majors because of data availability.',
  },
  coverage: {
    events: events.length,
    eventRegions: new Set(events.map(event => event.region)).size,
    eventCountries: new Set(events.map(event => event.country)).size,
    carbonMajors: carbonMajors.length,
    headquarterRegions: new Set(carbonMajors.map(major => major.headquarterRegion)).size,
    headquarterCountries: new Set(carbonMajors.map(major => major.headquarterCountry)).size,
    emitterEventPairs: contributionRecords.length,
    missingIntensityMedians: contributionRecords.filter(record => !Number.isFinite(record.intensityC)).length,
    annualEventCounts,
  },
  fields: {
    climateChange: ['change in heatwave intensity in °C', 'probability ratio relative to preindustrial conditions', 'median', '95% confidence interval'],
    carbonMajor: ['contribution to heatwave intensity in °C', 'multiplication of preindustrial probability', 'median', '95% confidence interval'],
    interpretation: 'The values describe a change in heatwave hazard. They do not by themselves describe deaths, illness, infrastructure loss, ecosystem condition, affected population or recovery time.',
  },
  statistics: {
    anthropogenicClimateIntensityMedianC: distribution(climateIntensityValues),
    anthropogenicClimateProbabilityRatioMedianFinite: distribution(finiteClimateProbabilityRatios),
    anthropogenicClimateProbabilityRatioMedianCensoredAbove10000: events.length - finiteClimateProbabilityRatios.length,
    eventIntensity95IntervalLowerAboveZero: events.filter(event => event.anthropogenicClimateChange.intensity95IntervalC.lower > 0).length,
    eventIntensity95IntervalIncludesZero: events.filter(event => {
      const range = event.anthropogenicClimateChange.intensity95IntervalC;
      return range.lower <= 0 && range.upper >= 0;
    }).length,
    carbonMajorIntensityContributionC: distribution(contributionIntensityValues),
    carbonMajorIntensityContributionZero: contributionIntensityValues.filter(value => value === 0).length,
    carbonMajorProbabilityMultiplierFinite: distribution(finiteContributionProbabilityRatios),
    carbonMajorProbabilityMultiplierCensoredAbove10000: contributionRecords.length - finiteContributionProbabilityRatios.length,
    topIntensityContributions,
  },
  events,
  carbonMajors,
  tulipUse: {
    admitted: [
      'Use the matrix to validate that a source-removal climate response can be propagated into event-specific heatwave intensity and likelihood.',
      'Use its reported medians and 95% intervals without inventing probability distributions beyond the reported information.',
      'Use carbon-major names and source boundaries as candidates for an explicit, non-overlapping TULIP crosswalk.',
      'Require an exact event, geography and period match before joining a hazard result to an exposure-response or ecosystem endpoint.',
    ],
    prohibited: [
      'Do not treat an actor as equivalent to a TULIP sector merely because their names appear related.',
      'Do not sum overlapping Scope 1, 2 and 3 actor values into a sector total without a reviewed allocation rule.',
      'Do not multiply reported deaths, illness or ecosystem loss by a heatwave probability ratio or intensity fraction.',
      'Do not use a probability ratio as a measure of severity, reach or persistence.',
      'Do not infer legal responsibility from this scientific attribution dataset.',
    ],
    currentEffectOnTulipRatings: 'none',
    reasonRatingsUnchanged: 'This ingestion validates a source-to-hazard dataset. TULIP axes require matched terminal human and ecosystem outcomes plus denominators and recovery evidence.',
  },
  unresolvedForTulip: [
    'Construct a non-overlapping mapping from 180 carbon-major actor boundaries to the relevant TULIP source nodes; many TULIP nodes are sectors or processes rather than producers.',
    'Reconcile the workbook wording about 2000–2022 source extension with the populated 2023 actor-event values using author documentation or correspondence.',
    'Join compatible event-level temperature histories to location-specific exposure-response, population, mortality and adaptation baselines.',
    'Select separate compatible ecosystem endpoints for condition, extent and recovery; heatwave hazard cannot supply those outcomes.',
    'Define and independently review conversion thresholds only after terminal endpoints and denominators are available.',
  ],
};

snapshot.snapshotDigest = digest({
  source: snapshot.source,
  coverage: snapshot.coverage,
  fields: snapshot.fields,
  statistics: snapshot.statistics,
  events: snapshot.events,
  carbonMajors: snapshot.carbonMajors,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(calibrationDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);

console.log(JSON.stringify({
  output,
  status: snapshot.status,
  coverage: snapshot.coverage,
  maximumActorEventIntensityContributionC: snapshot.statistics.carbonMajorIntensityContributionC.maximum,
  digest: snapshot.snapshotDigest,
}, null, 2));
