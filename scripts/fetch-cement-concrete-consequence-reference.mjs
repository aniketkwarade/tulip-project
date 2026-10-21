import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { strFromU8, unzipSync } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'cement-concrete-consequence-reference-snapshot.json');
const doi = '10.1038/s41598-023-38075-z';
const articleUrl = `https://doi.org/${doi}`;
const crossrefUrl = `https://api.crossref.org/works/${doi}`;
const workbookUrl = 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41598-023-38075-z/MediaObjects/41598_2023_38075_MOESM2_ESM.xlsx';
const workbookSha256 = 'a7f081e214c1a32f884cef0c2dca7ade5d2c392b74bb328f251d63f3c431d044';
const table24Member = 'xl/worksheets/sheet25.xml';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const fetchBuffer = async url => {
  const response = await fetch(url, {
    headers: {
      accept: '*/*',
      'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)',
    },
    signal: AbortSignal.timeout(180_000),
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  return Buffer.from(await response.arrayBuffer());
};

const decodeXml = value => String(value ?? '')
  .replaceAll('&amp;', '&')
  .replaceAll('&lt;', '<')
  .replaceAll('&gt;', '>')
  .replaceAll('&quot;', '"')
  .replaceAll('&apos;', "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

const cellColumn = reference => {
  const letters = reference.match(/^[A-Z]+/)?.[0] ?? '';
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
};

function sharedStrings(xml) {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match =>
    decodeXml([...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(item => item[1]).join('')),
  );
}

function worksheetRows(xml, strings) {
  return [...xml.matchAll(/<row\b[^>]*r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)].map(match => {
    const values = [];
    for (const cell of match[2].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const reference = cell[1].match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!reference) continue;
      const type = cell[1].match(/\bt="([^"]+)"/)?.[1];
      const raw = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (raw == null) continue;
      values[cellColumn(reference)] = type === 's' ? strings[Number(raw)] : Number(raw);
    }
    return { row: Number(match[1]), values };
  });
}

const [crossrefBytes, workbook] = await Promise.all([
  fetchBuffer(crossrefUrl),
  fetchBuffer(workbookUrl),
]);
assert.equal(sha256(workbook), workbookSha256, 'The Springer Nature supplementary workbook changed');
const crossref = JSON.parse(crossrefBytes.toString('utf8'));
const article = crossref.message;
assert.equal(article.DOI.toLowerCase(), doi.toLowerCase());
assert.equal(article.title[0], 'Global site-specific health impacts of fossil energy, steel mills, oil refineries and cement plants');

const entries = unzipSync(new Uint8Array(workbook));
assert(entries['xl/sharedStrings.xml'], 'Missing workbook shared strings');
assert(entries[table24Member], 'Missing supplementary table 24');
const strings = sharedStrings(strFromU8(entries['xl/sharedStrings.xml']));
const rows = worksheetRows(strFromU8(entries[table24Member]), strings);
const header = rows.find(row => row.row === 4)?.values;
assert(header, 'Missing supplementary table 24 header');
const table = rows.filter(row => row.row >= 5).map(row => Object.fromEntries(header.map((key, index) => [key, row.values[index]])));
const cementRows = table.filter(row => row.EMISSION_SOURCE === 'Cement plants');
assert.equal(cementRows.length, 5);
assert.deepEqual(cementRows.map(row => row.SOURCE_SUBCATEGORY), ['Fossil fuels', 'Waste fuels', 'Biogenic fuels', 'Clinker cooling', 'CaCO3 calcination']);

const directPollutantColumns = [
  'HEALTH_IMPACTS_PM2.5_DALY_PER_YEAR',
  'HEALTH_IMPACTS_SO2_DALY_PER_YEAR',
  'HEALTH_IMPACTS_NOX_DALY_PER_YEAR',
  'HEALTH_IMPACTS_NH3_DALY_PER_YEAR',
];
const climateColumn = 'HEALTH_IMPACTS_CO2_DALY_PER_YEAR';
const sum = (rowsToSum, columns) => rowsToSum.reduce((total, row) =>
  total + columns.reduce((rowTotal, column) => rowTotal + Number(row[column] ?? 0), 0), 0);
const byPollutant = Object.fromEntries(directPollutantColumns.map(column => [column, sum(cementRows, [column])]));
const directNonCo2DalyPerYear = sum(cementRows, directPollutantColumns);
const excludedCo2DalyPerYear = sum(cementRows, [climateColumn]);
assert(Math.abs(directNonCo2DalyPerYear - 261_597.29556045894) < 1e-6);
assert(Math.abs(excludedCo2DalyPerYear - 1_161_311.8360117965) < 1e-6);

const candidate = {
  previous: { value: 6.6, grade: 'D', lower: 4.4, upper: 8.1, confidence: 'C' },
  revised: { value: 7.0, grade: 'D', lower: 5.1, upper: 8.5, confidence: 'C' },
  axes: {
    human: {
      severity: { lower: 3, central: 3, upper: 4 },
      reach: { lower: 1, central: 2, upper: 3 },
      persistence: { lower: 3, central: 4, upper: 4 },
    },
    ecosystem: {
      severity: { lower: 0, central: 1, upper: 2 },
      reach: { lower: 1, central: 2, upper: 3 },
      persistence: { lower: 3, central: 4, upper: 4 },
    },
  },
  reason: 'A peer-reviewed plant-level model with near-global cement-kiln coverage quantifies 261,597 disability-adjusted life years per year from PM2.5, SO2, NOx and NH3 emissions. This directly supports severe human health harm and long-lived or fatal outcomes. The published table does not report unique affected people, does not split fatal from nonfatal DALYs, uses a 2016 plant state and supplies no compatible global quarry-ecosystem condition or recovery denominator. The central rating therefore rises modestly while confidence remains C and the C–E range stays visible.',
};

const payload = {
  version: 'tulip_cement_concrete_consequence_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'near_global_modeled_direct_plant_health_burden_ingested_unique_people_current_update_and_ecosystem_denominators_missing',
  productionRatingsEnabled: 0,
  nodeId: 'cement_concrete',
  source: {
    id: 'oberschelp_global_cement_plant_health_impacts_2023',
    publisher: 'Nature Portfolio, Scientific Reports',
    title: article.title[0],
    publicationDate: '2023-08-22',
    doi,
    url: articleUrl,
    crossrefUrl,
    crossrefResponseSha256: sha256(crossrefBytes),
    supplementaryWorkbookUrl: workbookUrl,
    supplementaryWorkbookSha256: workbookSha256,
    supplementaryTable: 24,
    supplementaryTableDescription: 'Annual emissions and human health impacts per technology',
  },
  currentWindow: {
    start: 2016,
    end: 2016,
    coverageStatus: 'modeled_annual_global_plant_inventory',
    summaryMethod: 'annualized_flow',
    coverageNote: 'The study models the 2016 plant state, with some inputs extrapolated from 2015 or 2017, and covers more than 3,500 cement kilns with near-complete global coverage.',
  },
  evidence: {
    systemBoundary: {
      included: ['Direct cement-site PM2.5, SO2, NOx and NH3 emissions and their modeled human health impacts.'],
      excluded: ['Upstream and downstream emissions and impacts.', 'CO2-related health burden, which belongs to separately scored cement-process, kiln-fuel and climate pathways.', 'On-site cement grinding mills, omitted by the study as minor direct PM2.5 contributors.'],
      modelDiseases: ['Ischemic heart disease', 'Stroke', 'Lung cancer', 'Chronic obstructive pulmonary disease', 'Lower respiratory infections'],
      monteCarloRuns: 1_000,
    },
    cementPlantRows: cementRows.map(row => ({
      sourceSubcategory: row.SOURCE_SUBCATEGORY,
      directNonCo2DalyPerYear: directPollutantColumns.reduce((total, column) => total + Number(row[column] ?? 0), 0),
      excludedCo2DalyPerYear: Number(row[climateColumn] ?? 0),
    })),
    directHumanHealth: {
      unit: 'disability-adjusted life years per year',
      directNonCo2DalyPerYear,
      byPollutant,
      excludedCo2DalyPerYear,
      uniqueAffectedPeoplePublished: false,
      fatalAndNonfatalBurdenPublishedSeparately: false,
      sourceUncertaintyIntervalForCementTotalPublished: false,
      interpretation: 'The direct non-CO2 total is a terminal health-burden estimate for serious diseases. DALYs are not a count of unique people and cannot set the reach axis.',
    },
    ecosystemConsequences: {
      compatibleGlobalConditionLossPercentPublished: false,
      compatibleAffectedDistributionSharePublished: false,
      compatibleRecoveryTimePublished: false,
      interpretation: 'The source models human health and cannot narrow quarry-related ecosystem severity, reach or recovery.',
    },
  },
  ratingDecision: {
    change: 'central_value_revised_human_severity_and_persistence_source_anchored',
    candidate,
    admittedUses: [
      'Use the direct non-CO2 DALY total to establish severe current human health harm from cement-plant air pollution.',
      'Use the five modeled disease endpoints and DALY unit to support long-lived and potentially fatal human consequences.',
      'Use the near-global plant coverage to establish evidence coverage only, not affected-person reach.',
      'Use the source boundary to exclude upstream, downstream and CO2-related health impacts from this node calculation.',
    ],
    excludedUses: [
      'Do not add the 1.16 million CO2-related DALYs; cement-process emissions, kiln fuel and downstream climate harm have separate node pathways.',
      'Do not convert DALYs, plants, kilns, countries or modeled population exposure into a unique harmed-person count.',
      'Do not add PM2.5, SO2, NOx and NH3 columns as separate harms after using their summed direct DALY total.',
      'Do not infer quarry ecosystem condition, affected-distribution share or recovery duration from the human-health model.',
      'Do not treat the 2016 inventory year or study publication date as consequence persistence.',
    ],
    exactRemainingGaps: [
      'A current update to the global cement-plant inventory and health model for the 2006–2025 recent-impact period.',
      'A unique affected-person count or population share, with uncertainty, tied to the direct cement-plant health burden.',
      'A fatal versus nonfatal decomposition or another source-native consequence-duration distribution.',
      'A cement- and quarry-specific ecosystem-condition estimate against a documented functional-loss or collapse reference.',
      'A global affected-ecosystem distribution denominator and a measured recovery-time distribution for quarry impacts.',
      'An independent reproduction or compatible model family for the global cement-specific burden.',
    ],
  },
};

payload.digest = sha256(JSON.stringify({
  version: payload.version,
  source: payload.source,
  currentWindow: payload.currentWindow,
  evidence: payload.evidence,
  ratingDecision: payload.ratingDecision,
}));

await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output, digest: payload.digest, directNonCo2DalyPerYear, candidate: candidate.revised }, null, 2));
