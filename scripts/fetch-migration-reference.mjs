import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'migration-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+migration-evidence-ingestion)';

const sources = {
  primaryReport: {
    id: 'idmc_grid_2026_disaster_displacement',
    publisher: 'Internal Displacement Monitoring Centre',
    title: 'Global Report on Internal Displacement 2026',
    publicationDate: '2026-05-12',
    landingPageUrl: 'https://www.internal-displacement.org/global-report/grid2026/',
    reportUrl: 'https://api.internal-displacement.org/sites/default/files/2026-05/IDMC-GRID-2026-Global-Report-on-Internal-Displacement.pdf',
  },
  countrySeriesSnapshot: {
    id: 'idmc_world_bank_disaster_displacement',
    publisher: 'Internal Displacement Monitoring Centre, redistributed by World Bank',
    title: 'Annual country-level new internal displacement movements associated with disasters',
    publicationDate: '2026-09-23',
    indicatorCode: 'VC.IDP.NWDS',
    url: 'https://api.worldbank.org/v2/country/all/indicator/VC.IDP.NWDS?format=json&per_page=20000',
    localSnapshot: 'public/disaster-displacement-snapshot.json',
  },
};

const expected = {
  report: { bytes: 13_434_655, sha256: '91ce651436a1ac6f6cb2c2f396bac44b96d79eca4404bea9bf18ecacd5575f65' },
  countrySeriesSnapshot: { bytes: 10_273_000, sha256: '0ded4e3479ecddadd674b376efa5ee583fa2ee891c83ee0037ed9ad0451da0d5' },
  landingPageHeadlineValues: ['29.9m', '32.3m', '82.2m'],
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url, maxBuffer) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '180',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer, timeout: 190_000 });
  return stdout;
}

function extractHeadlineValues(buffer) {
  return [...buffer.toString('utf8').matchAll(/data-value="([^"]+)"/g)]
    .map(match => match[1])
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort();
}

const [report, landingPage, countrySnapshotBuffer] = await Promise.all([
  fetchBuffer(sources.primaryReport.reportUrl, 20_000_000),
  fetchBuffer(sources.primaryReport.landingPageUrl, 2_000_000),
  readFile(path.join(root, sources.countrySeriesSnapshot.localSnapshot)),
]);

assert.equal(report.length, expected.report.bytes, 'GRID 2026 report byte count changed');
assert.equal(sha256(report), expected.report.sha256, 'GRID 2026 report checksum changed');
assert.equal(report.subarray(0, 4).toString('utf8'), '%PDF', 'GRID 2026 report is not a PDF');
assert.deepEqual(extractHeadlineValues(landingPage), expected.landingPageHeadlineValues, 'GRID 2026 landing-page headline values changed');
assert.equal(countrySnapshotBuffer.length, expected.countrySeriesSnapshot.bytes, 'World Bank-IDMC snapshot byte count changed');
assert.equal(sha256(countrySnapshotBuffer), expected.countrySeriesSnapshot.sha256, 'World Bank-IDMC snapshot checksum changed');

const countrySnapshot = JSON.parse(countrySnapshotBuffer.toString('utf8'));
assert.equal(countrySnapshot.overview.displacement_latest_observation_year, 2023);
assert.equal(countrySnapshot.overview.displacement_latest_country_count, 217);
assert.equal(countrySnapshot.overview.displacement_latest_reported_movements, 26_375_278);
assert.deepEqual(countrySnapshot.overview.excluded_trailing_all_zero_years.map(row => row.year), [2025, 2024]);

const annualDisasterMovementSeries = [
  { year: 2016, movements: 24_200_000 },
  { year: 2017, movements: 18_700_000 },
  { year: 2018, movements: 17_500_000 },
  { year: 2019, movements: 25_300_000 },
  { year: 2020, movements: 31_000_000 },
  { year: 2021, movements: 23_700_000 },
  { year: 2022, movements: 32_600_000 },
  { year: 2023, movements: 26_800_000 },
  { year: 2024, movements: 45_800_000 },
  { year: 2025, movements: 29_900_000 },
];

const snapshot = {
  version: 'tulip_migration_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_disaster_displacement_flow_and_stock_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Measure recent internal displacement associated with disasters while keeping movements, unique people, end-year displacement stock, climate attribution, conflict displacement and protective evacuation distinct.',
  sources: {
    primaryReport: {
      ...sources.primaryReport,
      fetchedReport: { bytes: report.length, sha256: expected.report.sha256, retrievedOn: checkedOn },
      verifiedLandingPageHeadlineValues: expected.landingPageHeadlineValues,
      reviewedReportPages: {
        executiveSummary: 'PDF pages XII–XIII',
        displacementStock: 'report pages 3–4',
        disasterMovementFlow: 'report pages 7–8',
      },
    },
    countrySeriesSnapshot: {
      ...sources.countrySeriesSnapshot,
      fetchedSnapshot: { bytes: countrySnapshotBuffer.length, sha256: expected.countrySeriesSnapshot.sha256, retrievedOn: checkedOn },
    },
  },
  endpoints: {
    currentDisasterMovementFlow: {
      observationYear: 2025,
      newOrRepeatedInternalDisplacementMovements: 29_900_000,
      countriesAndTerritories: 140,
      weatherRelatedMovements: 27_200_000,
      geophysicalMovements: 2_500_000,
      mixedDisasterMovements: 297_000,
      preEmptiveEvacuationsReported: 2_400_000,
      preEmptiveEvacuationQualifier: 'significant underestimate',
      changeFrom2024Percent: -35,
      differenceFromDecadalAveragePercent: 13,
      definition: 'Forced movements within a country recorded during the year, including repeated and multiple movements by the same person.',
      interpretation: 'This is a movement flow, not a unique-person count. It includes non-climate hazards, mixed disasters and protective evacuations, so it cannot be used as a climate-attributed harmed-person total.',
    },
    currentDisasterDisplacementStock: {
      observationDate: '2025-12-31',
      peopleLivingInInternalDisplacementDueToDisasters: 13_600_000,
      countriesAndTerritories: 82,
      interpretation: 'This is the end-year count of people still internally displaced by disasters, including people displaced in earlier years. It is a unique-person reach proxy for disaster displacement, but the report does not isolate a climate-attributed subset or the broad phenomenon of migration.',
    },
    annualDisasterMovementSeries: {
      startYear: 2016,
      endYear: 2025,
      unit: 'new or repeated internal displacement movements associated with disasters',
      values: annualDisasterMovementSeries,
      interpretation: 'The annual series establishes recurring displacement flow and year-to-year variability. The ten-year observation span does not measure how long a person remains displaced.',
    },
    countrySeriesQualityControl: {
      latestAcceptedObservationYear: countrySnapshot.overview.displacement_latest_observation_year,
      latestAcceptedReportedMovements: countrySnapshot.overview.displacement_latest_reported_movements,
      latestAcceptedCountryRows: countrySnapshot.overview.displacement_latest_country_count,
      excludedTrailingAllZeroYears: countrySnapshot.overview.excluded_trailing_all_zero_years,
      interpretation: 'The World Bank redistribution supplies exact country-year values through 2023. Its all-zero 2024 and 2025 slices are treated as unreleased placeholders because the primary IDMC reports nonzero flows for both years.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the 13.6-million end-2025 disaster-displacement stock as a current directly reported human-reach proxy, with a lower bound for missing climate attribution and node-scope mismatch.',
      'Use the 29.9-million 2025 movement flow and 2016–2025 series as evidence that disaster-related displacement is recurrent and globally distributed.',
      'Use the report definition to keep repeated movements separate from unique people and end-year stock.',
      'Use the pre-emptive-evacuation evidence to avoid treating every movement as the same severity or as a policy failure.',
      'Confine the node to direct human consequences; no ecosystem endpoint is measured by these sources.',
    ],
    prohibited: [
      'Do not add the 29.9-million movement flow to the 13.6-million end-year stock.',
      'Do not describe movement counts as unique people or use repeated movements to inflate reach.',
      'Do not treat all disaster displacement as climate-attributed; the report includes geophysical and mixed disasters and does not provide event-level climate attribution.',
      'Do not import the 32.3-million conflict-displacement flow or 68.6-million conflict-displacement stock.',
      'Do not treat internal displacement as all migration or as cross-border migration.',
      'Do not use the 2016–2025 observation period as consequence persistence.',
      'Do not treat pre-emptive evacuation as inherently severe harm; it may reduce loss even though forced movement remains disruptive.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'migration',
      rating: 'C 6.3',
      uncertainty: 'B 4.0 to D 7.8',
      confidence: 'C',
      domain: 'human only',
      reason: 'The primary report provides a current end-year stock above ten million people and a recurring global movement flow. The central rating records material forced displacement, broad human reach and consequences that can outlast an event, while the bounds retain uncertainty about climate attribution, repeat movements, protective evacuations, duration and the broader migration construct.',
    },
  },
  unresolvedForTulip: [
    'Separate the climate-attributed share of disaster displacement from geophysical, mixed and non-attributed weather events using event-level attribution.',
    'Measure displacement conditions, service loss, material loss and health outcomes consistently enough to distinguish severity across temporary evacuation and prolonged displacement.',
    'Publish a duration distribution for disaster displacement and durable solutions rather than inferring persistence from observation years or an end-year stock.',
    'Define whether the catalogue node should remain broad Migration or be narrowed to Disaster-related internal displacement.',
  ],
};

snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  currentDisasterDisplacementStock: snapshot.endpoints.currentDisasterDisplacementStock.peopleLivingInInternalDisplacementDueToDisasters,
  currentDisasterMovementFlow: snapshot.endpoints.currentDisasterMovementFlow.newOrRepeatedInternalDisplacementMovements,
  digest: snapshot.snapshotDigest,
}, null, 2));
