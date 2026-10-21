import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'shell-calcification-current-reference-snapshot.json');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');

async function fetchBuffer(url, maximumBytes = 5_000_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: {
      accept: '*/*',
      'user-agent': 'Mozilla/5.0 LostPlanet-TULIP/1.0 (+shell-calcification-evidence-ingestion)',
    },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

const crossref = async doi => JSON.parse(await fetchBuffer(`https://api.crossref.org/works/${doi}?mailto=research%40tulip.earth`, 1_000_000)).message;
const decodeXml = value => value
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&apos;', "'");

function parseWorkbook(buffer) {
  const archive = unzipSync(new Uint8Array(buffer));
  const xml = name => Buffer.from(archive[name]).toString('utf8');
  const shared = [...xml('xl/sharedStrings.xml').matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map(match => decodeXml([...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(item => item[1]).join('')));
  const cells = {};
  for (const match of xml('xl/worksheets/sheet2.xml').matchAll(/<c\s+([^>]*)>([\s\S]*?)<\/c>/g)) {
    const ref = match[1].match(/\br="([A-Z]+\d+)"/)?.[1];
    const value = match[2].match(/<v>([^<]+)<\/v>/)?.[1];
    if (!ref || value == null) continue;
    cells[ref] = /\bt="s"/.test(match[1]) ? shared[Number(value)] : Number(value);
  }
  const row = number => ({
    organism: cells[`A${number}`],
    threshold: cells[`B${number}`],
    preindustrialPercent: cells[`C${number}`] * 100,
    preindustrialMinus10Percent: cells[`D${number}`] * 100,
    preindustrialMinus20Percent: cells[`E${number}`] * 100,
    year2020Percent: cells[`F${number}`] * 100,
    expansionPercentagePoints: cells[`G${number}`] * 100,
  });
  return {
    globalCoastalBivalves: row(7),
    polarPteropodsMildDissolution: row(8),
    polarPteropodsSevereDissolution: row(9),
    californiaCurrentPteropodsMildDissolution: row(10),
    californiaCurrentPteropodsSevereDissolution: row(11),
  };
}

const sources = {
  globalBiologicalThresholds2025: {
    id: 'findlay_ocean_acidification_boundary_2025',
    title: 'Ocean Acidification: Another Planetary Boundary Crossed',
    publisher: 'Global Change Biology',
    publicationDate: '2025-06-09',
    doi: '10.1111/gcb.70238',
    url: 'https://onlinelibrary.wiley.com/doi/10.1111/gcb.70238',
  },
  thresholdData2025: {
    id: 'findlay_ocean_acidification_boundary_data_2025',
    title: 'Findlay et al. Ocean acidification planetary boundary datasets',
    publisher: 'Figshare',
    publicationDate: '2025-05-01',
    doi: '10.6084/m9.figshare.28861832.v2',
    url: 'https://doi.org/10.6084/m9.figshare.28861832.v2',
    apiUrl: 'https://api.figshare.com/v2/articles/28861832',
    workbook: {
      id: 54_090_560,
      name: 'Findlayetal_Table1_and_Table2.xlsx',
      bytes: 12_789,
      md5: '613f90733f930eebe1b4edcedabb7f69',
      downloadUrl: 'https://ndownloader.figshare.com/files/54090560',
    },
  },
  pacificIndustryAdaptation2025: {
    id: 'lewis_smith_pacific_shellfish_adaptation_2025',
    title: 'Navigating ocean acidification in shellfish aquaculture: Stakeholder perspectives of developing strategies in the U.S. Pacific Region',
    publisher: 'Aquaculture Reports',
    publicationDate: '2025-07-01',
    doi: '10.1016/j.aqrep.2025.102858',
    url: 'https://doi.org/10.1016/j.aqrep.2025.102858',
    pdfUrl: 'https://repository.library.noaa.gov/view/noaa/70558/noaa_70558_DS1.pdf',
    pdf: {
      bytes: 2_612_491,
      sha256: '7bfe024a9318075b0fbde919f75c28c0006e066227936cc5bd02444686829553',
    },
  },
};

const [globalCrossref, industryCrossref, figshare, workbook, industryPdf] = await Promise.all([
  crossref(sources.globalBiologicalThresholds2025.doi),
  crossref(sources.pacificIndustryAdaptation2025.doi),
  fetchBuffer(sources.thresholdData2025.apiUrl, 1_000_000).then(value => JSON.parse(value)),
  fetchBuffer(sources.thresholdData2025.workbook.downloadUrl, 100_000),
  fetchBuffer(sources.pacificIndustryAdaptation2025.pdfUrl),
]);

assert.equal(globalCrossref.title[0], sources.globalBiologicalThresholds2025.title);
assert.equal(industryCrossref.title[0], sources.pacificIndustryAdaptation2025.title);
assert.equal(figshare.title, sources.thresholdData2025.title);
assert.equal(figshare.version, 2);
assert.equal(figshare.license.name, 'CC BY 4.0');
const workbookMetadata = figshare.files.find(file => file.id === sources.thresholdData2025.workbook.id);
assert(workbookMetadata, 'Findlay Table 1 and Table 2 workbook missing');
assert.equal(workbookMetadata.name, sources.thresholdData2025.workbook.name);
assert.equal(workbookMetadata.size, sources.thresholdData2025.workbook.bytes);
assert.equal(workbookMetadata.supplied_md5, sources.thresholdData2025.workbook.md5);
assert.equal(workbook.length, sources.thresholdData2025.workbook.bytes);
assert.equal(md5(workbook), sources.thresholdData2025.workbook.md5);
assert.equal(industryPdf.length, sources.pacificIndustryAdaptation2025.pdf.bytes);
assert.equal(sha256(industryPdf), sources.pacificIndustryAdaptation2025.pdf.sha256);
assert.equal(industryPdf.subarray(0, 5).toString(), '%PDF-');

const habitat = parseWorkbook(workbook);
assert.equal(habitat.globalCoastalBivalves.year2020Percent, 18.6);
assert.equal(habitat.globalCoastalBivalves.expansionPercentagePoints, 12.2);
assert.equal(habitat.polarPteropodsMildDissolution.year2020Percent, 79.5);
assert.equal(habitat.polarPteropodsSevereDissolution.year2020Percent, 15.5);
assert.equal(habitat.californiaCurrentPteropodsMildDissolution.year2020Percent, 42);
assert.equal(habitat.californiaCurrentPteropodsSevereDissolution.year2020Percent, 4);

const payload = {
  version: 'tulip_shell_calcification_current_reference_2026_09_24_v1',
  generatedOn: '2026-09-24',
  status: 'current_biological_habitat_thresholds_and_industry_consequences_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace a stale hatchery-only rating with current source-native habitat and industry evidence while keeping chemical marginality, organism condition, population loss, business disruption and human harm as separate quantities.',
  appliesToNodeIds: ['shell_calcification_failures'],
  sources,
  evidence: {
    biologicalHabitatThresholds: {
      modeledYear: 2020,
      comparisonYear: 1750,
      workbook: {
        bytes: workbook.length,
        md5: md5(workbook),
        sha256: sha256(workbook),
      },
      ...habitat,
      interpretation: 'The source maps the share of each organism group’s defined habitat that has passed an aragonite-saturation threshold associated with marginal conditions. It does not report the same share of individuals failing to form shells, population loss, ecosystem collapse or global ocean area.',
    },
    currentPacificIndustryConsequences: {
      interviewPeriod: { start: 2023, end: 2024 },
      respondentsReportingNegativeEffectsPercent: 54,
      respondentsReportingNoEffectsPercent: 32,
      respondentsUnsurePercent: 14,
      hatcheryOnlyAndCombinedHatcheryNurseryRespondentsReportingNegativeEffects: 'all',
      interpretation: 'The stakeholder sample shows continuing operational consequences and adaptation needs in the U.S. Pacific shellfish industry. It is not a census of all operations, a count of unique people harmed, a monetary loss estimate or a global reach denominator.',
      adaptationBoundary: 'The study reports that hatchery-stage effects can often be reduced through monitoring and buffering. Respondents also identified warming, harmful algal blooms, disease and low oxygen as competing concerns, so TULIP does not attribute every operational problem to shell calcification failure.',
    },
    historicalHatcheryCalibration: {
      eventPeriod: { start: 2007, end: 2008 },
      larvalCultureReductionPercentAtLeast: 75,
      observedProductionFractionOfNormal2008: 0.25,
      affectedProductionSeasons: 2,
      regionalOperationsSuppliedByHatcheriesPercentRange: { lower: 50, upper: 85 },
      interpretation: 'This remains a direct severe hatchery event. Two affected seasons measure event recurrence, not two people, and the regional supply share measures dependence on hatcheries, not the share of the global ecosystem harmed.',
    },
  },
  ratingDecision: {
    change: 'revised',
    candidate: {
      prior: { value: 7, grade: 'D', lower: 5.1, upper: 8.9, confidence: 'C' },
      revised: { value: 5.9, grade: 'C', lower: 3.6, upper: 7.8, confidence: 'C' },
    },
    axes: {
      human: {
        severity: { lower: 1, central: 2, upper: 2 },
        reach: { lower: 0, central: 1, upper: 2 },
        persistence: { lower: 1, central: 2, upper: 3 },
      },
      ecosystem: {
        severity: { lower: 1, central: 2, upper: 3 },
        reach: { lower: 2, central: 3, upper: 4 },
        persistence: { lower: 2, central: 3, upper: 4 },
      },
    },
    excludedUses: [
      'Do not interpret habitat past a chemical or biological threshold as the same percentage of organisms with shell failure, population loss or ecosystem collapse.',
      'Do not combine bivalve and pteropod habitat percentages into a single global-ocean denominator.',
      'Do not include the coral row; coral condition, bleaching and reef structure are scored in separate nodes.',
      'Do not treat the percentage of survey respondents reporting effects as the percentage of the global industry, workers or public harmed.',
      'Do not treat two affected production seasons as two harmed people or as a two-year recovery time for every consequence.',
      'Do not treat the share of West Coast operations supplied by hatcheries as the affected share of global ecosystems.',
      'Do not add ocean-acidification chemistry, food-web, fisheries, coral or downstream livelihood ratings to this score.',
    ],
    exactRemainingGaps: [
      'Representative organism- or population-condition observations matched to the modeled bivalve and pteropod habitat thresholds.',
      'A compatible current global shell-former distribution denominator that avoids adding different taxa and regions.',
      'A representative current count of unique people or operations with attributable material loss, including a documented sampling frame.',
      'Consequence and recovery-time distributions for affected shell-former populations and shellfish operations.',
      'A 2027–2036 SSP2-4.5 impact projection that reports terminal consequences rather than chemistry alone.',
    ],
  },
};

payload.snapshotDigest = sha256(JSON.stringify(payload));
await writeFile(output, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ output, snapshotDigest: payload.snapshotDigest }, null, 2));
