import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'urbanization-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+urbanization-evidence-ingestion)';

const sources = {
  wup2025: {
    id: 'un_world_urbanization_prospects_2025_summary',
    publisher: 'United Nations Department of Economic and Social Affairs, Population Division',
    title: 'World Urbanization Prospects 2025: Summary of Results',
    publicationDate: '2025-11-18',
    url: 'https://population.un.org/wup/assets/Publications/undesa_pd_2025_wup2025_summary_of_results_final.pdf',
    landingPage: 'https://population.un.org/wup/publications',
    citation: 'United Nations, Department of Economic and Social Affairs, Population Division (2025). World Urbanization Prospects: The 2025 Revision, Online Edition.',
  },
  ghsl: {
    id: 'ec_jrc_global_human_settlement_layer_r2023a',
    publisher: 'European Commission Joint Research Centre',
    title: 'Global Human Settlement Layer datasets',
    publicationDate: '2023',
    url: 'https://human-settlement.emergency.copernicus.eu/datasets.php',
    builtSurfaceDoi: 'https://doi.org/10.2905/9F06F36F-4B11-47EC-ABB0-4F8B7B1D72EA',
    settlementDoi: 'https://doi.org/10.2905/A0DF7A6F-49DE-46EA-9BDE-563437A6E2BA',
  },
};

const expected = {
  wup2025: { bytes: 37_678_803, sha256: 'e4839400f4dfed1329eeb7750caefc5266e9e75abb00f942c6f686614afbf4a1' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '180',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: 45_000_000, timeout: 190_000 });
  return stdout;
}

const report = await fetchBuffer(sources.wup2025.url);
assert.equal(report.length, expected.wup2025.bytes, 'WUP 2025 report byte count changed');
assert.equal(sha256(report), expected.wup2025.sha256, 'WUP 2025 report checksum changed');

const builtUpIncrease2000To2025Km2 = 515_803.5 - 315_657.0;
const builtUpIncrease2000To2025Percent = builtUpIncrease2000To2025Km2 / 315_657.0 * 100;

const snapshot = {
  version: 'tulip_urbanization_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'population_and_built_land_separated_from_harm',
  productionRatingsEnabled: 0,
  purpose: 'Replace an outdated generic urbanization trace with the latest official UN settlement and built-land estimates while preventing residents, settlements and built surface from becoming invented harmed-person counts or ecosystem-collapse percentages.',
  sources: {
    wup2025: {
      ...sources.wup2025,
      retrievedOn: checkedOn,
      fetchedDocument: { bytes: report.length, sha256: sha256(report) },
      verifiedLocations: [
        { section: 'Key messages', printedPage: 'IX', finding: 'Cities contain 45% of the 8.2 billion global population in 2025; towns contain 36%. These are residence categories.' },
        { section: 'Chapter III.A', printedPage: 36, finding: 'World built-up area grew from less than 200,000 km² in 1975 to about half a million km² in 2025 and grew almost twice as fast as population.' },
        { section: 'Table A2', printedPage: 89, finding: 'World total built-up area is 315,657.0 km² in 2000 and 515,803.5 km² in 2025; city built-up area is 79,132.7 km² and 132,887.9 km² respectively.' },
      ],
    },
    ghsl: {
      ...sources.ghsl,
      checkedOn,
      finding: 'GHSL provides harmonized gridded built surface, population and settlement class. The product measures the built environment and resident population, not adverse human consequences or ecosystem condition.',
    },
  },
  currentWindow: {
    start: 2025,
    end: 2025,
    coverageStatus: 'complete',
    summaryMethod: 'end_state_stock',
    coverageNote: 'The current state uses the 2025 UN estimate. Historical comparisons use 1975 and 2000 source-defined states; future years in the product are projections and do not enter current harm.',
  },
  endpoints: {
    settlementPopulationContext: {
      worldPopulation2025Approximate: 8_200_000_000,
      cityPopulationSharePercent: 45,
      townPopulationSharePercent: 36,
      ruralPopulationSharePercent: 19,
      cityAndTownPopulationSharePercent: 81,
      interpretation: 'These values classify where people live. They do not count illness, displacement, service loss, economic loss or any other adverse human consequence.',
    },
    builtLandState: {
      worldBuiltUpAreaKm2: { 2000: 315_657.0, 2025: 515_803.5 },
      cityBuiltUpAreaKm2: { 2000: 79_132.7, 2025: 132_887.9 },
      worldBuiltUpAreaPerPersonM2: { 2000: 51, 2025: 63 },
      increase2000To2025Km2: builtUpIncrease2000To2025Km2,
      increase2000To2025Percent: builtUpIncrease2000To2025Percent,
      interpretation: 'Built surface is a direct land-conversion stock and can support ecosystem-pressure and persistence judgments. It does not identify the prior habitat, the ecosystem condition lost, or the share of any particular ecosystem distribution affected.',
    },
    compatibleCurrentHarmedPersonCount: null,
    compatibleCurrentEcosystemConditionLossPercent: null,
    compatibleCurrentEcosystemDistributionAffectedPercent: null,
    compatibleCurrentRecoveryDuration: null,
  },
  tulipUse: {
    admitted: [
      'Use the 2025 built-surface stock and the 2000–2025 change as direct evidence of the physical land-conversion state.',
      'Use the 2025 settlement shares to describe the population context and global coverage of the source.',
      'Use the long-lived built environment to support bounded persistence judgment while keeping source observation length separate from consequence duration.',
      'Use the 2025 estimate as the current evidence window and keep later projected values in the separate outlook only.',
    ],
    prohibited: [
      'Do not treat people living in cities or towns as people harmed by urbanization.',
      'Do not treat city, town or rural population shares as severity or harmed-person reach.',
      'Do not treat total built surface as the share of a specific ecosystem lost or moved toward collapse.',
      'Do not infer the prior habitat or ecological condition of every built cell from built-surface area alone.',
      'Do not turn the 1975–2025 observation span into a fifty-year recovery duration.',
      'Do not score downstream heat, flood, air-pollution, transport, housing or water consequences again without a node-specific attributable endpoint and overlap review.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'urbanization',
      rating: 'C 5.1',
      uncertainty: 'B 2.9 to D 7.8',
      confidence: 'C',
      domain: 'human and ecosystem',
      reason: 'The UN record directly establishes a large and growing built-land stock, but its population totals are residence counts rather than harm. The central estimate therefore retains bounded human and ecosystem consequences without assigning 6.25 billion residents to harmed-person reach.',
    },
  },
  unresolvedForTulip: [
    'Join the physical expansion record to current health, displacement, essential-service or material-loss endpoints under a counterfactual without the harmful form of urban expansion.',
    'Classify converted land by prior ecosystem type and measure condition loss against each ecosystem distribution instead of total land or study coverage.',
    'Measure recovery or reversibility of converted ecosystems rather than using the age of the settlement record.',
    'Separate harms caused by urban form from benefits of settlement and from downstream heat, flood, air-pollution, transport, housing and water nodes.',
  ],
};

snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  worldBuiltUpArea2025Km2: snapshot.endpoints.builtLandState.worldBuiltUpAreaKm2['2025'],
  compatibleCurrentHarmedPersonCount: snapshot.endpoints.compatibleCurrentHarmedPersonCount,
  digest: snapshot.snapshotDigest,
}, null, 2));
