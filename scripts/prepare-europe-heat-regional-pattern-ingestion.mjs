import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.resolve(root, process.env.TULIP_REGIONAL_PATTERN_CACHE ?? 'tmp/tulip-regional-pattern');
const outputDir = path.resolve(root, 'artifacts/tulip-calibration-2026-09-22');
const outputPath = path.join(outputDir, 'internal-europe-heat-regional-pattern-ingestion.json');
const checkedOn = '2026-09-23';
const regionUniverse = JSON.parse(await readFile(path.join(outputDir, 'europe-heat-823-region-universe.json'), 'utf8'));
const populationPanel = JSON.parse(await readFile(path.join(outputDir, 'europe-heat-population-panel.json'), 'utf8'));
const populationBoundarySupplement = JSON.parse(await readFile(path.join(outputDir, 'europe-heat-population-boundary-supplement.json'), 'utf8'));
const nationalPopulationBenchmark = JSON.parse(await readFile(path.join(outputDir, 'europe-heat-national-population-benchmark.json'), 'utf8'));
assert.equal(regionUniverse.checks.regionCount, 823);
assert.equal(regionUniverse.checks.presentInEurostat2019Week22, 823);
assert.equal(populationPanel.checks.regions, 823);
assert.deepEqual(populationPanel.checks.completeYears, ['2017', '2018', '2019']);
assert.equal(populationPanel.checks.latestYearMissingRegions, 22);
assert.equal(populationBoundarySupplement.checks.officialUkSensitivityRegions, 12);
assert.equal(populationBoundarySupplement.checks.boundaryChangedRegionsReconstructed, 10);
assert.equal(populationBoundarySupplement.checks.boundaryChangedDirectLauAggregateRegions, 8);
assert.equal(populationBoundarySupplement.checks.boundaryChangedProportionalMergeSensitivityRegions, 2);
assert.equal(nationalPopulationBenchmark.checks.countries, 35);
assert.equal(nationalPopulationBenchmark.checks.latestNationalPopulation, 538_272_629);
assert.equal(nationalPopulationBenchmark.checks.publishedStatementMinusLatestNational, 4_727_371);

const sources = {
  publicWeeklyTemperatures: {
    file: 'data.csv',
    url: 'https://raw.githubusercontent.com/BallesterJoan/europe_summer_2022_heat/5c628ca7b8498ca71531e8e7e05168f8bc3a8619/data.csv',
    sha256: '311dea060298564226197a6310f0c9bb1768f3c788a7695cf163127e22508da9',
  },
  publicRegionMetadata: {
    file: 'metadata.csv',
    url: 'https://raw.githubusercontent.com/BallesterJoan/europe_summer_2022_heat/5c628ca7b8498ca71531e8e7e05168f8bc3a8619/metadata.csv',
    sha256: 'e70b2c55b73a5815f694d4eec912cb2a1cfd553e3f7dbff60651e343591a981c',
  },
  publicModelCode: {
    file: 'code.R',
    url: 'https://raw.githubusercontent.com/BallesterJoan/europe_summer_2022_heat/5c628ca7b8498ca71531e8e7e05168f8bc3a8619/code.R',
    sha256: '065d28dd43da11ac917641ecd8291729d6daaf08859635c2feb52900e30b09cc',
  },
  hadcrut5Annual: {
    file: 'HadCRUT.5.0.2.0.analysis.summary_series.global.annual.csv',
    url: 'https://www.metoffice.gov.uk/hadobs/hadcrut5/data/HadCRUT.5.0.2.0/analysis/diagnostics/HadCRUT.5.0.2.0.analysis.summary_series.global.annual.csv',
    sha256: 'a1441ab5aef8f3baf43cca417bca271f6d674d4f235ea01129f0432c948882e0',
  },
  nuts2010Boundaries: {
    file: 'nuts-2010-1m.geojson',
    url: 'https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2010_4326.geojson',
    sha256: '9912ef47b47a4aa40c2ac423a29f5c9f1357af40c69c1cb4278a87bbaa62cadd',
  },
  cdsCatalogue: {
    file: 'cds-derived-era5-land-daily-catalogue.json',
    url: 'https://cds.climate.copernicus.eu/api/catalogue/v1/collections/derived-era5-land-daily-statistics',
    sha256: 'ccd3c3d4e5236fce465fe11aa2e018d502ffd1bf1ef451370c4b7ec9f50a7859',
  },
  cdsForm: {
    file: 'cds-derived-era5-land-daily-form.json',
    url: 'https://object-store.os-api.cci2.ecmwf.int:443/cci2-prod-catalogue/resources/derived-era5-land-daily-statistics/form_3b9272cbb5bdd74a1ab9ac5ab0e8968f1f8cbca6638614db73918f692031dcf6.json',
    sha256: '3b9272cbb5bdd74a1ab9ac5ab0e8968f1f8cbca6638614db73918f692031dcf6',
  },
};

const sha256 = buffer => createHash('sha256').update(buffer).digest('hex');
const round = (value, digits = 6) => Number(value.toFixed(digits));

async function fetchBuffer(url) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(180_000),
    headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+regional-pattern-reconstruction)' },
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function pinnedInput(source) {
  const localPath = path.join(cacheDir, source.file);
  let buffer;
  try {
    buffer = await readFile(localPath);
  } catch {
    buffer = await fetchBuffer(source.url);
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, buffer);
  }
  const actualHash = sha256(buffer);
  if (source.sha256) assert.equal(actualHash, source.sha256, `${source.file}: source checksum changed`);
  return { ...source, localPath: path.relative(root, localPath), bytes: buffer.length, sha256: actualHash, buffer };
}

function parseCsv(text) {
  const [header, ...lines] = text.trim().split(/\r?\n/);
  const clean = value => value.startsWith('"') && value.endsWith('"') ? value.slice(1, -1).replaceAll('""', '"') : value;
  const columns = header.split(',').map(clean);
  return lines.map(line => Object.fromEntries(line.split(',').map((value, index) => [columns[index], clean(value)])));
}

function isoDate(year, week, weekday = 4) {
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const monday = new Date(januaryFourth);
  monday.setUTCDate(januaryFourth.getUTCDate() - ((januaryFourth.getUTCDay() + 6) % 7));
  monday.setUTCDate(monday.getUTCDate() + (week - 1) * 7 + weekday - 1);
  return monday.toISOString().slice(0, 10);
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

await mkdir(outputDir, { recursive: true });
const loaded = {};
for (const [id, source] of Object.entries(sources)) loaded[id] = await pinnedInput(source);

const publicData = parseCsv(loaded.publicWeeklyTemperatures.buffer.toString('utf8'));
const publicMetadata = parseCsv(loaded.publicRegionMetadata.buffer.toString('utf8'));
const modelCode = loaded.publicModelCode.buffer.toString('utf8');
assert.match(modelCode, /DATE1_SU22\s*=\s*as\.Date\(\s*"2022-06-02"\s*\)/);
assert.match(modelCode, /DATE2_SU22\s*=\s*as\.Date\(\s*"2022-09-01"\s*\)/);
assert.equal(publicData.length, 42_642);
assert.equal(publicMetadata.length, 103);
assert.equal(new Set(publicData.map(row => `${row.location}|${row.year}|${row.woy}`)).size, publicData.length);
assert.equal(new Set(publicData.map(row => row.location)).size, 103);

const hadcrutRows = parseCsv(loaded.hadcrut5Annual.buffer.toString('utf8')).map(row => ({
  year: Number(row.Time),
  anomalyC: Number(row['Anomaly (deg C)']),
  lower95C: Number(row['Lower confidence limit (2.5%)']),
  upper95C: Number(row['Upper confidence limit (97.5%)']),
}));
const baselineRows = hadcrutRows.filter(row => row.year >= 1850 && row.year <= 1900);
const baselineMean = mean(baselineRows.map(row => row.anomalyC));
const hadcrut2022 = hadcrutRows.find(row => row.year === 2022);
assert(hadcrut2022);
const warming2022 = hadcrut2022.anomalyC - baselineMean;
assert(Math.abs(warming2022 - 1.15) < 0.02);

const rolling4 = hadcrutRows
  .filter(row => row.year >= 1947 && row.year <= 2022)
  .map((row, index, rows) => {
    if (index < 3) return null;
    return { year: row.year, anomalyC: round(mean(rows.slice(index - 3, index + 1).map(item => item.anomalyC)), 7) };
  })
  .filter(Boolean);
assert.equal(rolling4.at(0).year, 1950);
assert.equal(rolling4.at(-1).year, 2022);

const boundaryGeoJson = JSON.parse(loaded.nuts2010Boundaries.buffer.toString('utf8'));
const metadataCodes = new Set(publicMetadata.map(row => row.location));
const italyNuts3 = boundaryGeoJson.features.filter(feature =>
  Number(feature.properties.LEVL_CODE) === 3 && feature.properties.CNTR_CODE === 'IT');
const directCodes = new Set(italyNuts3.map(feature => feature.properties.NUTS_ID));
const directMatches = [...metadataCodes].filter(code => directCodes.has(code)).sort();
const missingCodes = [...metadataCodes].filter(code => !directCodes.has(code)).sort();
const sardiniaComponents = [...directCodes].filter(code => /^ITG2[A-Z0-9]$/.test(code)).sort();
assert.equal(directMatches.length, 102);
assert.deepEqual(missingCodes, ['ITG2']);
assert.equal(sardiniaComponents.length, 8);

const cdsForm = JSON.parse(loaded.cdsForm.buffer.toString('utf8'));
const formFields = new Set(cdsForm.map(field => field.name));
for (const required of ['variable', 'year', 'month', 'day', 'daily_statistic', 'time_zone', 'frequency', 'area', 'licences']) {
  assert(formFields.has(required), `CDS form no longer exposes ${required}`);
}

const requestForYear = (year, timeZone = 'utc+00:00') => ({
  variable: ['2m_temperature'],
  year: String(year),
  month: ['05', '06', '07', '08', '09'],
  day: Array.from({ length: 31 }, (_, index) => String(index + 1).padStart(2, '0')),
  daily_statistic: 'daily_mean',
  time_zone: timeZone,
  frequency: '1_hourly',
  area: [48.3, 6.0, 35.3, 18.7],
});

const validationYears = Array.from({ length: 8 }, (_, index) => 2015 + index);
const reconstructionYears = Array.from({ length: 73 }, (_, index) => 1950 + index);
const sourceSummary = Object.fromEntries(Object.entries(loaded).map(([id, source]) => [id, {
  url: source.url,
  localPath: source.localPath,
  bytes: source.bytes,
  sha256: source.sha256,
}]));

const output = {
  version: 'tulip_europe_heat_regional_pattern_ingestion_2026_09_23_v8',
  generatedOn: checkedOn,
  status: 'open_inputs_region_universe_and_population_supplements_ingested_era5_land_licence_acceptance_required',
  productionRatingsEnabled: 0,
  purpose: 'Reconstruct and independently validate the regional temperature-to-global-warming pattern used by the European heat-mortality endpoint before it can affect any TULIP rating.',
  scope: {
    phase: 'Italian 103-region public-sample validation before full 823-region reconstruction',
    provesIfPassed: 'The ERA5-Land spatial and weekly aggregation plus the HadCRUT5 regression can reproduce the public temperature sample with declared tolerances.',
    doesNotProve: 'That the reconstructed 823-region universe is byte-for-byte identical to the authors’ unpublished metadata, the unpublished regional warming values, or the complete downstream mortality attribution.',
  },
  sourceSummary,
  fullRegionUniverse: {
    version: regionUniverse.version,
    digest: regionUniverse.digest,
    status: regionUniverse.status,
    countries: regionUniverse.checks.countryCount,
    regions: regionUniverse.checks.regionCount,
    uniqueRegionIds: regionUniverse.checks.uniqueRegionIds,
    presentInEurostat2019Week22: regionUniverse.checks.presentInEurostat2019Week22,
    presentInEurostat2022Week22: regionUniverse.checks.presentInEurostat2022Week22,
    boundaryDriftIds: regionUniverse.checks.boundaryDriftIds,
    boundary: regionUniverse.interpretation.boundary,
  },
  populationPanel: {
    version: populationPanel.version,
    digest: populationPanel.digest,
    status: populationPanel.status,
    sources: Object.fromEntries(Object.entries(populationPanel.sources)
      .filter(([id]) => ['primary', 'corroborating'].includes(id))
      .map(([id, source]) => [id, { dataset: source.dataset, url: source.url, updated: source.updated, sha256: source.sha256 }])),
    completeYears: populationPanel.checks.completeYears,
    latestYear: 2022,
    latestYearObservedRegions: populationPanel.checks.latestYearObservedRegions,
    latestYearMissingRegions: populationPanel.checks.latestYearMissingRegions,
    latestYearMissingIds: populationPanel.checks.latestYearMissingIds,
    nearestYearSensitivityTotal: populationPanel.checks.latestNearestYearCandidateTotal,
    publishedCoverageFloor: populationPanel.checks.publishedCoverageFloor,
    differenceFromPublishedCoverageFloor: populationPanel.checks.differenceFromPublishedCoverageFloor,
    rule: populationPanel.method.missingData,
    boundary: populationPanel.interpretation.unresolved,
    boundarySupplement: {
      version: populationBoundarySupplement.version,
      digest: populationBoundarySupplement.digest,
      status: populationBoundarySupplement.status,
      officialUkMidyearSensitivityRegions: populationBoundarySupplement.checks.officialUkSensitivityRegions,
      officialUkMidyearTotal: populationBoundarySupplement.checks.officialUkMidyearTotal,
      ukReferenceDate: populationBoundarySupplement.ukMid2022.referenceDate,
      exactEurostatReferenceDate: populationBoundarySupplement.ukMid2022.targetEurostatReferenceDate,
      boundaryChangedRegionsReconstructed: populationBoundarySupplement.checks.boundaryChangedRegionsReconstructed,
      directLauAggregateRegions: populationBoundarySupplement.checks.boundaryChangedDirectLauAggregateRegions,
      lauPopulationField: populationBoundarySupplement.belgiumEstoniaBoundaryChanges.lauPopulationField,
      proportionalMergeSensitivityRegions: populationBoundarySupplement.checks.boundaryChangedProportionalMergeSensitivityRegions,
      boundaryChangedRegionIds: populationBoundarySupplement.belgiumEstoniaBoundaryChanges.oldRegionIds,
      supplementedSensitivityTotal: populationBoundarySupplement.checks.fullySupplementedSensitivityTotal,
      differenceFromArticleStatedCoverageMinimum: populationBoundarySupplement.checks.differenceFromArticleStatedCoverageMinimum,
      boundary: populationBoundarySupplement.interpretation.limit,
    },
    nationalBenchmark: {
      version: nationalPopulationBenchmark.version,
      digest: nationalPopulationBenchmark.digest,
      status: nationalPopulationBenchmark.status,
      countries: nationalPopulationBenchmark.checks.countries,
      years: nationalPopulationBenchmark.checks.years,
      maximumNationalPopulationYear: nationalPopulationBenchmark.checks.maximumNationalPopulationYear,
      maximumNationalPopulation: nationalPopulationBenchmark.checks.maximumNationalPopulation,
      maximumNationalStillBelowPublishedStatementBy: nationalPopulationBenchmark.checks.maximumNationalStillBelowPublishedStatementBy,
      latestNationalPopulation: nationalPopulationBenchmark.checks.latestNationalPopulation,
      latestNationalMinusSupplementedRegionalSensitivity: nationalPopulationBenchmark.checks.latestNationalMinusSupplementedRegionalSensitivity,
      publishedStatementMinusLatestNational: nationalPopulationBenchmark.checks.publishedStatementMinusLatestNational,
      interpretation: nationalPopulationBenchmark.findings.remainingMismatch,
      ratingRule: nationalPopulationBenchmark.findings.ratingRule,
    },
  },
  inputAudit: {
    publicSample: {
      regions: publicMetadata.length,
      weeklyRows: publicData.length,
      years: [Math.min(...publicData.map(row => Number(row.year))), Math.max(...publicData.map(row => Number(row.year)))],
      duplicateLocationYearWeekRows: publicData.length - new Set(publicData.map(row => `${row.location}|${row.year}|${row.woy}`)).size,
      summer2022WindowFromPublicCode: { start: '2022-06-02', end: '2022-09-01', isoWeekday: 'Thursday' },
      isoWeek22ThursdayByYear: Object.fromEntries(validationYears.map(year => [year, isoDate(year, 22)])),
    },
    regionJoin: {
      boundaryRelease: 'GISCO NUTS 2010, 1:1 million, EPSG:4326',
      directMatches: directMatches.length,
      requestedRegions: metadataCodes.size,
      missingDirectCodes: missingCodes,
      documentedAggregate: {
        outputCode: 'ITG2',
        reason: 'The public mortality sample represents Sardinia as one region while official NUTS3 boundaries split the island.',
        componentCodes: sardiniaComponents,
        operation: 'Dissolve the eight official Sardinian NUTS3 polygons into one validation geometry.',
      },
      effectiveCoverageAfterAggregate: 103,
      silentCrosswalksAllowed: false,
    },
    hadcrut5: {
      productVersion: 'HadCRUT.5.0.2.0 analysis',
      regressionYears: [1950, 2022],
      preindustrialBaseline: [1850, 1900],
      baselineMeanCRelativeTo1961To1990: round(baselineMean, 7),
      anomaly2022CRelativeTo1961To1990: round(hadcrut2022.anomalyC, 7),
      warming2022CRelativeTo1850To1900: round(warming2022, 7),
      articleRoundedValueC: 1.15,
      fourYearRunningMeanPrimary: 'trailing, inclusive of assessment year',
      fourYearRunningMeanSensitivity: ['centered where defined', 'un-smoothed annual series'],
      trailingSeries1950To2022: rolling4,
    },
  },
  era5LandRetrieval: {
    dataset: 'derived-era5-land-daily-statistics',
    doi: 'https://doi.org/10.24381/cds.e9c9c792',
    catalogue: 'https://cds.climate.copernicus.eu/datasets/derived-era5-land-daily-statistics',
    rationale: 'The daily product computes daily means from the same hourly ERA5-Land source used by the study, while avoiding transfer of all 24 hourly fields.',
    licence: {
      id: 'cc-by',
      spdx: 'CC-BY-4.0',
      accountAcceptanceRequired: true,
      acceptanceUrl: 'https://cds.climate.copernicus.eu/datasets/derived-era5-land-daily-statistics?tab=download#manage-licences',
      latestAttempt: { date: checkedOn, result: 'HTTP 403 required licences not accepted' },
    },
    stage1ValidationRequests: validationYears.flatMap(year => ['utc+00:00', 'utc+01:00'].map(timeZone => ({
      output: `era5-land-daily-italy-${year}-${timeZone.replaceAll(':', '').replace('+', 'plus')}.zip`,
      request: requestForYear(year, timeZone),
    }))),
    stage2HistoricalRequests: reconstructionYears.map(year => ({
      output: `era5-land-daily-italy-${year}.zip`,
      request: requestForYear(year),
    })),
    selectionRule: 'Run the 2015-2022 validation first. Choose the timezone and spatial aggregation declared below from the public-sample error results, then retrieve 1950-2014 with that locked configuration.',
    accessRouteAudit: {
      checkedOn,
      noAnonymousCompatibleRouteFound: true,
      conclusion: 'Every identified route to the required ERA5-Land temperature data requires account-level access. The CDS daily-statistics route remains primary because it matches the declared product; alternatives may validate results but cannot silently replace it.',
      routes: [
        {
          id: 'copernicus_cds_daily_statistics',
          url: 'https://cds.climate.copernicus.eu/datasets/derived-era5-land-daily-statistics',
          compatibility: 'primary_declared_product',
          accountRequirement: 'CDS account, API token and dataset licence acceptance',
          status: 'blocked_until_account_licence_is_accepted',
        },
        {
          id: 'copernicus_arco_hourly',
          url: 'https://confluence.ecmwf.int/spaces/CKB/pages/536218894/ERA5-Land+hourly+Analysis+Ready+Cloud+Optimised+ARCO+data+on+single+levels+from+1950+to+present+Product+User+Guide+PUG',
          compatibility: 'same_0_1_degree_hourly_source_requires_tulip_daily_aggregation',
          accountRequirement: 'CDS API key supplied as a bearer token',
          status: 'compatible_fallback_after_account_access_and_cross_route_validation',
        },
        {
          id: 'google_earth_engine_daily_aggregate',
          url: 'https://developers.google.com/earth-engine/datasets/catalog/ECMWF_ERA5_LAND_DAILY_AGGR',
          compatibility: 'independent_daily_temperature_cross_check_google_aggregation',
          accountRequirement: 'Earth Engine registration and authenticated project',
          status: 'validation_only_not_primary_replacement',
        },
        {
          id: 'google_arco_era5',
          url: 'https://github.com/google-research/arco-era5',
          compatibility: 'incompatible_product_era5_not_era5_land',
          accountRequirement: 'public bucket access',
          status: 'rejected_for_primary_reconstruction',
        },
      ],
    },
  },
  reconstructionMethod: {
    temperatureUnitConversion: 'Kelvin to degrees Celsius by subtracting 273.15.',
    spatialCandidates: [
      'Area-weighted mean of grid-cell values intersecting each region.',
      'Cosine-latitude weighted mean of grid-cell centres inside each region.',
      'Unweighted mean of grid-cell centres inside each region.',
    ],
    spatialSelection: 'Select once using the public weekly temperatures; do not choose separately by region or year.',
    temporalAggregation: 'Compute daily regional means, aggregate them to ISO weeks identified by Thursday, and reproduce the public June 2 through September 1 summer window.',
    regression: 'For each region, regress annual summer mean regional temperature on the four-year running mean HadCRUT5 series for 1950-2022. Multiply the slope by 2022 GMST warming relative to 1850-1900.',
    sensitivityChecks: [
      'Trailing versus centered four-year HadCRUT5 running mean.',
      'June-August daily mean versus the public-code weekly summer window.',
      'Area-weighted versus cell-centre regional aggregation.',
      'UTC+00:00 versus UTC+01:00 daily aggregation during the 2015-2022 validation only.',
    ],
  },
  acceptanceCriteria: {
    statusIfAnyFails: 'method_not_validated',
    publicSampleComparison: {
      scope: 'All available Italian region-weeks between 2015 and 2022 that fall in the declared summer window.',
      minimumMatchedRegions: 103,
      minimumMatchedRegionWeeksFraction: 0.995,
      maximumAbsoluteOverallBiasC: 0.1,
      maximumMedianAbsoluteErrorC: 0.15,
      maximumP95AbsoluteErrorC: 0.4,
      minimumPearsonCorrelation: 0.995,
      note: 'These are internal reconstruction tolerances, not universal scientific constants. They are fixed before viewing the reconstruction result.',
    },
    integrity: [
      'Every raw file receives a SHA-256 checksum and retrieval timestamp.',
      'All 103 region identifiers resolve through a direct match or the declared Sardinia aggregate.',
      'No missing year may be treated as zero or silently interpolated.',
      'A changed source checksum requires an explicit assessment-version update.',
    ],
    promotion: 'Passing this phase validates the temperature-pattern method on the public Italian sample. It does not enable a TULIP rating until the full 823-region pattern or an independently reviewed equivalent endpoint is available.',
  },
  remainingDependencies: [
    'Account-level acceptance of the Copernicus CC-BY licence for ERA5-Land retrieval.',
    'Compare the reconstructed 823-region universe with the authors’ source metadata if that unpublished table becomes available.',
    'Replace the proportional Oudsbergen split between BE221 and BE222 with a date-defined direct Statbel 2022 population source for the two predecessor areas; secondary corroboration shows the present split changes the Europe-wide sensitivity total by only 30 people.',
    'Select and document a date-alignment rule before substituting the twelve official UK mid-2022 values for missing Eurostat 1 January values.',
    'Reconcile the authors’ population-panel vintage or calculation: current Eurostat national totals for the same 35 countries remain below the article’s over-543-million statement throughout 2015-2022.',
    'Reproduce the published 2.10 degrees C population-weighted European mean and 1.57-2.55 degrees C interval after the full regional warming pattern is reconstructed.',
    'An independently implemented calculation or source-provided regional slopes for comparison before score promotion.',
  ],
};

await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`);
const outputStat = await stat(outputPath);
console.log(JSON.stringify({ output: path.relative(root, outputPath), bytes: outputStat.size, status: output.status }, null, 2));
