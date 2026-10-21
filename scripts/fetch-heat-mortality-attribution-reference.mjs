import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const calibrationDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(calibrationDir, 'heat-mortality-attribution-reference-snapshot.json');
const fixturePath = path.join(root, 'scripts', 'fixtures', 'vicedo-cabrera-ten-city-reproduction.json');
const reproductionScriptPath = path.join(root, 'scripts', 'reproduce-vicedo-cabrera-ten-city.R');
const checkedOn = '2026-09-23';
const upstreamCommit = '5f719165ec26fa7c8913736af9ffc2067660d516';
const repository = 'https://github.com/anavica/mcc_ccattr_NCC';
const rawBase = `https://raw.githubusercontent.com/anavica/mcc_ccattr_NCC/${upstreamCommit}`;
const userAgent = 'LostPlanet-TULIP/1.0 (+heat-mortality-method-ingestion)';

const upstreamFiles = {
  'README.md': {
    url: `${rawBase}/README.md`,
    sha256: '88c35af5adecdde39f0c43dccbbae97157c2f7be369a22fda4c4769178a5ea58',
  },
  'MainAnalysis.R': {
    url: `${rawBase}/MainAnalysis.R`,
    sha256: 'c6323757424838252adf8764e32cfc5eb4750a36405a8c0d1564785a9a538336',
  },
  'fhempel_main.R': {
    url: `${rawBase}/fhempel_main.R`,
    sha256: 'e5dcc91cef1b8a9efad0ee98048083b62de79c0f56aeb2cd00a6b17d407029ff',
  },
  'fhempel_corr.R': {
    url: `${rawBase}/fhempel_corr.R`,
    sha256: '8b7b498be333004e86117aa22c5fb4bbc980e186a123de0bc4159ffa4cac6822',
  },
  '10cities_data.RData': {
    url: `${rawBase}/10cities_data.RData`,
    sha256: '8857181376273d65188beae2111c8a670cbfd456653102c81722e66d27d87665',
  },
  'TmeanModelled.RData': {
    url: `${rawBase}/TmeanModelled.RData`,
    sha256: '8902a8e6be093595ca1efa7ff1555f138e30bf6c6e7c4329a3e51e513052976f',
  },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url, accept = '*/*') {
  let lastFailure = 'request failed';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(120_000),
        headers: { Accept: accept, 'User-Agent': userAgent },
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

const upstreamEvidence = {};
const downloaded = {};
for (const [filename, descriptor] of Object.entries(upstreamFiles)) {
  const buffer = await fetchBuffer(descriptor.url);
  assert.equal(sha256(buffer), descriptor.sha256, `${filename}: upstream checksum changed`);
  downloaded[filename] = buffer;
  upstreamEvidence[filename] = {
    bytes: buffer.length,
    sha256: descriptor.sha256,
    sourceUrl: descriptor.url,
  };
}

const readme = downloaded['README.md'].toString('utf8');
const analysis = downloaded['MainAnalysis.R'].toString('utf8');
const normalizedReadme = readme.replace(/\s+/g, ' ');
assert.match(normalizedReadme, /simplified example using temperature-mortality data of 10 hypothetical cities/i);
assert.match(normalizedReadme, /factual \/ counterfactual/i);
assert.match(analysis, /scenario\s*<-\s*c\("fct",\s*"cnfact"\)/);
assert.match(analysis, /nsim\s*<-\s*1000/);
assert.match(analysis, /ancitysim\[,\s*,\s*3,\s*\]\s*<-\s*ancitysim\[,\s*,\s*1,\s*\]\s*-\s*ancitysim\[,\s*,\s*2,\s*\]/);
assert.match(analysis, /\(1\s*-\s*exp\(-bvarcen\s*%\*%\s*coef\)\)\s*\*\s*deathproj/);

const fixtureBuffer = await readFile(fixturePath);
const reproductionScriptBuffer = await readFile(reproductionScriptPath);
const reproduction = JSON.parse(fixtureBuffer.toString('utf8'));
assert.equal(reproduction.source.repository_commit, upstreamCommit);
assert.equal(reproduction.source.monte_carlo_iterations, 1000);
assert.equal(reproduction.input_counts.cities, 10);
assert.equal(reproduction.cities.length, 10);
assert.equal(reproduction.input_counts.observed_daily_rows, 57_710);
assert.equal(reproduction.input_counts.factual_modelled_daily_rows, 1_028_250);
assert.equal(reproduction.input_counts.counterfactual_modelled_daily_rows, 1_020_950);
assert(Math.abs(reproduction.total.anthropogenic_heat_deaths - 155_714.7000768875) < 1e-6);
assert(Math.abs(reproduction.total.anthropogenic_share_of_heat_deaths_percent - 32.838030339318394) < 1e-9);

const zenodoMetadata = JSON.parse((await fetchBuffer('https://zenodo.org/api/records/15569401', 'application/json')).toString('utf8'));
assert.equal(zenodoMetadata.id, 15569401);
assert.equal(zenodoMetadata.metadata.license.id, 'cc-by-4.0');
const carbonMajorsCodeFile = zenodoMetadata.files.find(file => file.key === 'extend_attrib-main.zip');
const carbonMajorsSynthesisFile = zenodoMetadata.files.find(file => file.key === 'synthesis.zip');
assert(carbonMajorsCodeFile);
assert(carbonMajorsSynthesisFile);
const carbonMajorsCode = await fetchBuffer(carbonMajorsCodeFile.links.self);
assert.equal(md5(carbonMajorsCode), carbonMajorsCodeFile.checksum.replace(/^md5:/, ''));
assert.equal(sha256(carbonMajorsCode), '9b6071d7354afde4f1d5a0a4422b9740f1c5959ce8a03b9d3291e8e3f212050d');

const cityIntervalsCrossingZero = reproduction.cities
  .filter(city => city.anthropogenic_heat_deaths_ci_low < 0 && city.anthropogenic_heat_deaths_ci_high > 0)
  .map(city => city.city);
assert.equal(cityIntervalsCrossingZero.length, 7);

const source = {
  id: 'vicedo_cabrera_heat_mortality_attribution_2021',
  title: 'The burden of heat-related mortality attributable to recent human-induced climate change',
  articleUrl: 'https://www.nature.com/articles/s41558-021-01058-x',
  doi: 'https://doi.org/10.1038/s41558-021-01058-x',
  studyPeriod: { start: 1991, end: 2018 },
  publishedCoverage: { locations: 732, countries: 43 },
  publishedCentralShareOfWarmSeasonHeatDeathsPct: 37,
  publishedResultRangePct: [20.5, 76.3],
  repository,
  repositoryCommit: upstreamCommit,
  repositoryCommitDate: '2025-02-13T16:50:26Z',
  repositoryFiles: upstreamEvidence,
};

const carbonMajorsReference = {
  id: 'quilcaille_carbon_majors_heatwave_attribution_2025',
  title: zenodoMetadata.metadata.title,
  articleUrl: 'https://www.nature.com/articles/s41586-025-09450-9',
  doi: 'https://doi.org/10.1038/s41586-025-09450-9',
  codeRecordUrl: zenodoMetadata.links.self_html,
  codeRecordDoi: `https://doi.org/${zenodoMetadata.metadata.doi}`,
  codeLicenseMetadata: zenodoMetadata.metadata.license.id,
  codeArchive: {
    filename: carbonMajorsCodeFile.key,
    bytes: carbonMajorsCodeFile.size,
    md5: carbonMajorsCodeFile.checksum.replace(/^md5:/, ''),
    sha256: sha256(carbonMajorsCode),
    embeddedArchiveCommit: 'c6a20a9084290afffd7632217554a5ce1fd1596e',
    sourceUrl: carbonMajorsCodeFile.links.self,
  },
  synthesisArchive: {
    filename: carbonMajorsSynthesisFile.key,
    bytes: carbonMajorsSynthesisFile.size,
    md5: carbonMajorsSynthesisFile.checksum.replace(/^md5:/, ''),
    sourceUrl: carbonMajorsSynthesisFile.links.self,
    ingestionStatus: 'not_downloaded_18_3_gb_archive_not_required_for_method_boundary',
  },
  observedScope: {
    heatwavesAnalysed: 213,
    eventPeriod: { start: 2000, end: 2023 },
    emitters: 180,
    allCarbonMajorsGmstContributionC2023: 0.67,
    top14GmstContributionC2023: 0.33,
    totalGmstC2023: 1.30,
    individualHeatwaveIntensityContributionRangeC: [0, 0.18],
  },
  availabilityBoundary: 'The code is open, but its README says the OSCAR computations are supplied on request and no laptop demo is provided. The study synthesis archive is 18.3 GB.',
  inferenceBoundary: 'The article says direct fractions of attributable hazard risk neglect complex, non-linear exposure and vulnerability. Its hazard results therefore cannot be multiplied by deaths or ecosystem loss.',
};

const snapshot = {
  version: 'tulip_heat_mortality_attribution_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'published_endpoint_algorithm_reproduced_on_authors_hypothetical_example',
  productionRatingsEnabled: 0,
  purpose: 'Validate a factual-versus-counterfactual terminal human endpoint method before attempting source-specific harm allocation for TULIP emission nodes.',
  source,
  reproduction: {
    scope: reproduction.source.sample_scope,
    checkedFixture: {
      path: 'scripts/fixtures/vicedo-cabrera-ten-city-reproduction.json',
      sha256: sha256(fixtureBuffer),
    },
    runner: {
      path: 'scripts/reproduce-vicedo-cabrera-ten-city.R',
      sha256: sha256(reproductionScriptBuffer),
      verification: 'The runner was executed against the pinned upstream repository and reproduced every total to less than 1e-8 absolute difference.',
    },
    runtime: reproduction.runtime,
    inputs: reproduction.input_counts,
    climateModels: reproduction.source.climate_models,
    monteCarloIterations: reproduction.source.monte_carlo_iterations,
    method: {
      endpointEquation: 'For each day and location, attributable deaths = (1 - exp(-temperature-response term)) × baseline deaths; sum heat days under each climate series.',
      causalContrast: 'Anthropogenic heat deaths = factual heat deaths - counterfactual heat deaths, evaluated with the same location-specific exposure-response function and mortality baseline.',
      uncertainty: 'Sample exposure-response coefficients 1,000 times and retain location and climate-model structure; do not convert the interval into an invented probability distribution.',
    },
    total: reproduction.total,
    cities: reproduction.cities,
    cityIntervalsCrossingZero,
    resultInterpretation: 'The authors’ code and sample data reproduce end to end. The sample result is not the article’s 732-location estimate because the ten cities are explicitly hypothetical.',
  },
  carbonMajorsReference,
  tulipUse: {
    admitted: [
      'Use the reproduced equation and factual-versus-counterfactual design as the required structure for a heat-mortality endpoint pilot.',
      'For each TULIP source, evaluate the same location-specific endpoint model under factual climate and a source-removal climate counterfactual.',
      'Carry source-emissions, climate-response, exposure-response and endpoint uncertainty as separate layers.',
      'Use attributable terminal outcomes and their denominators to inform TULIP human severity and reach only after geography and period compatibility checks pass.',
    ],
    prohibited: [
      'Do not multiply global heat deaths by an annual emissions share.',
      'Do not multiply global heat deaths by source-attributable GMST divided by total GMST.',
      'Do not multiply a heatwave probability ratio or intensity contribution by reported deaths.',
      'Do not transfer the ten-city 32.838% result to the 732-location study, the world, another period or a TULIP source node.',
      'Do not replace negative lower confidence limits with zero; retain the model result and explain the uncertainty.',
      'Do not use heat-mortality evidence for ecosystem severity, reach or persistence.',
    ],
    matchedSourceEndpointEquation: 'source attributable deaths = D(factual temperature, local exposure-response, matched baseline) - D(source-removal temperature, same local exposure-response, same baseline)',
    rejectedShortcut: 'source attributable deaths != total heat deaths × emissions share; source attributable deaths != total heat deaths × warming share',
  },
  unresolvedForTulip: [
    'Crosswalk each of the 28 TULIP source boundaries to a non-overlapping source-removal emissions history.',
    'Produce the full time-varying source-removal climate series; a single end-year GMST contribution is insufficient.',
    'Obtain or construct an allowed, matched location-year mortality, temperature and adaptation baseline for the TULIP current assessment window.',
    'Run the endpoint model for each source-removal counterfactual instead of transferring the article’s 37% estimate.',
    'Select separate, source-compatible terminal endpoints for non-heat human harm and ecosystem condition, extent and recovery.',
  ],
};

snapshot.snapshotDigest = digest({
  source: snapshot.source,
  reproduction: snapshot.reproduction,
  carbonMajorsReference: snapshot.carbonMajorsReference,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(calibrationDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  cities: snapshot.reproduction.inputs.cities,
  totalAnthropogenicHeatDeaths: snapshot.reproduction.total.anthropogenic_heat_deaths,
  sourceSpecificTulipEndpointsReady: 0,
  snapshotDigest: snapshot.snapshotDigest,
}, null, 2));
