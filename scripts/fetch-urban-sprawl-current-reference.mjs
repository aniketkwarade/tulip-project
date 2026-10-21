import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'urban-sprawl-current-reference-snapshot.json');
const urbanization = JSON.parse(await readFile(path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'urbanization-reference-snapshot.json'), 'utf8'));
const sha256 = value => createHash('sha256').update(value).digest('hex');

async function fetchBuffer(url, maximumBytes = 2_000_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: {
      accept: '*/*',
      'user-agent': 'Mozilla/5.0 LostPlanet-TULIP/1.0 (+urban-sprawl-evidence-ingestion)',
    },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

const sources = {
  wup2025: urbanization.sources.wup2025,
  goal11CurrentProgress2026: {
    id: 'un_sdg_goal11_land_consumption_2026',
    publisher: 'United Nations Department of Economic and Social Affairs',
    title: 'Goal 11: Make cities and human settlements inclusive, safe, resilient and sustainable',
    publicationDate: '2026',
    url: 'https://sdgs.un.org/goals/goal11',
    extendedReportUrl: 'https://unstats.un.org/sdgs/report/2026/extended-report/Extended-Report-2026_Goal-11.pdf',
    extendedReport: {
      bytes: 524_213,
      sha256: 'd2ae69b8f550ab68ba0cbc10bcdc2598ba90e01b26f712e5dda40879d4804404',
    },
  },
  ghsl: urbanization.sources.ghsl,
};

const [goalPage, extendedReport] = await Promise.all([
  fetchBuffer(sources.goal11CurrentProgress2026.url),
  fetchBuffer(sources.goal11CurrentProgress2026.extendedReportUrl),
]);
const goalHtml = goalPage.toString('utf8');
for (const text of [
  'global sample of 781 cities in 123 countries',
  'land consumption rates fall from 1.24% (2015–2020) to 0.83%',
  'measurable increase in global land-use efficiency',
]) assert(goalHtml.includes(text), `Goal 11 page no longer contains: ${text}`);
assert.equal(extendedReport.length, sources.goal11CurrentProgress2026.extendedReport.bytes);
assert.equal(sha256(extendedReport), sources.goal11CurrentProgress2026.extendedReport.sha256);
assert.equal(extendedReport.subarray(0, 5).toString(), '%PDF-');

const built = urbanization.endpoints.builtLandState;
assert.equal(built.worldBuiltUpAreaKm2['2000'], 315_657);
assert.equal(built.worldBuiltUpAreaKm2['2025'], 515_803.5);
assert.equal(built.worldBuiltUpAreaPerPersonM2['2000'], 51);
assert.equal(built.worldBuiltUpAreaPerPersonM2['2025'], 63);

const payload = {
  version: 'tulip_urban_sprawl_current_reference_2026_09_24_v1',
  generatedOn: '2026-09-24',
  status: 'current_built_land_and_land_use_efficiency_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Refresh Urban Sprawl / Housing with current official built-land and land-consumption evidence while separating physical expansion, low-density form, housing conditions, residents and terminal ecological harm.',
  appliesToNodeIds: ['urban_sprawl_housing'],
  sources,
  evidence: {
    globalBuiltLandState: {
      referenceSnapshotVersion: urbanization.version,
      referenceSnapshotDigest: urbanization.snapshotDigest,
      observationPeriod: { start: 2000, end: 2025 },
      worldBuiltUpAreaKm2: built.worldBuiltUpAreaKm2,
      worldBuiltUpAreaPerPersonM2: built.worldBuiltUpAreaPerPersonM2,
      builtAreaIncreaseKm2: built.increase2000To2025Km2,
      builtAreaIncreasePercent: built.increase2000To2025Percent,
      builtAreaPerPersonIncreasePercent: Number(((built.worldBuiltUpAreaPerPersonM2['2025'] / built.worldBuiltUpAreaPerPersonM2['2000'] - 1) * 100).toFixed(3)),
      interpretation: 'Built area per person helps distinguish outward land consumption from population growth. It does not identify the prior ecosystem in each converted cell, housing adequacy, or the number of people harmed.',
    },
    recentLandUseEfficiency: {
      dataYear: 2025,
      cities: 781,
      countries: 123,
      landConsumptionRatePercent: {
        '2015-2020': 1.24,
        '2020-2025': 0.83,
      },
      relativeRateChangePercent: Number(((0.83 / 1.24 - 1) * 100).toFixed(3)),
      direction: 'improving_but_land_consumption_continues',
      pageSha256AtIngestion: sha256(goalPage),
      extendedReportSha256: sha256(extendedReport),
      interpretation: 'The recent city sample indicates slower land consumption and improving land-use efficiency. It is not a complete global census, an ecosystem-condition measure or evidence that current land conversion has stopped.',
    },
    domainBoundary: {
      compatibleCurrentHarmedPersonCount: null,
      compatibleCurrentEcosystemConditionLossPercent: null,
      compatibleCurrentEcosystemDistributionAffectedPercent: null,
      compatibleCurrentRecoveryDuration: null,
      interpretation: 'Housing inadequacy, affordability, transport, heat, air pollution, water and service outcomes remain in their own nodes unless a non-overlapping sprawl-attributable endpoint is supplied.',
    },
  },
  ratingDecision: {
    change: 'revised',
    candidate: {
      prior: { value: 6.3, grade: 'C', lower: 4, upper: 7.8, confidence: 'B' },
      revised: { value: 5.5, grade: 'C', lower: 3.3, upper: 7.8, confidence: 'C' },
    },
    axes: {
      ecosystem: {
        severity: { lower: 1, central: 2, upper: 3 },
        reach: { lower: 0, central: 1, upper: 2 },
        persistence: { lower: 2, central: 3, upper: 4 },
      },
    },
    excludedUses: [
      'Do not treat total built surface or built-area growth as the affected share of a particular ecosystem distribution.',
      'Do not treat built area per person or the land-consumption rate as a percentage of ecosystem condition lost.',
      'Do not treat residents of cities and towns as people harmed by sprawl.',
      'Do not treat slower recent land consumption as restoration of previously converted ecosystems.',
      'Do not infer that every built cell replaced natural habitat; converted land can include agricultural or already modified land.',
      'Do not add housing inadequacy, transport, heat, pollution, water, construction, energy or climate ratings to this node.',
      'Do not use the 2000–2025 observation interval as ecological recovery time.',
    ],
    exactRemainingGaps: [
      'A global classification of newly built land by prior ecosystem type and condition.',
      'The affected share of each relevant ecosystem distribution rather than total built area or city coverage.',
      'A current sprawl-attributable ecosystem-condition change measured against a documented functional-loss reference.',
      'A recovery or reversibility distribution for converted ecosystems separated by prior land cover and development form.',
      'A current non-overlapping human endpoint attributable specifically to low-density outward expansion rather than housing, transport, heat, pollution, water or service conditions.',
    ],
  },
};

payload.snapshotDigest = sha256(JSON.stringify(payload));
await writeFile(output, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ output, snapshotDigest: payload.snapshotDigest }, null, 2));
