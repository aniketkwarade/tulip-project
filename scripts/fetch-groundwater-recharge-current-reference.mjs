import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'groundwater-recharge-current-reference-snapshot.json');
const digest = (algorithm, value) => createHash(algorithm).update(value).digest('hex');

async function fetchBuffer(url, maximumBytes) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(180_000),
    headers: {
      accept: '*/*',
      'user-agent': 'Mozilla/5.0 LostPlanet-TULIP/1.0 (+groundwater-recharge-evidence-ingestion)',
    },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

async function crossref(doi) {
  const body = await fetchBuffer(`https://api.crossref.org/works/${doi}`, 200_000);
  const payload = JSON.parse(body.toString('utf8'));
  assert.equal(payload.status, 'ok');
  assert.equal(payload.message.DOI.toLowerCase(), doi.toLowerCase());
  return { body, record: payload.message };
}

const sources = {
  globalRechargeStudy2025: {
    id: 'nazari_global_rainfed_groundwater_recharge_2025',
    publisher: 'Elsevier, Journal of Hydrology',
    title: 'Spatiotemporal dynamics of global rain-fed groundwater recharge from 2001 to 2020',
    publicationDate: '2025-04-01',
    doi: '10.1016/j.jhydrol.2024.132490',
    url: 'https://doi.org/10.1016/j.jhydrol.2024.132490',
    openArticleUrl: 'http://cris.leibniz-zmt.de/id/eprint/5519/1/Nazari2025.pdf',
    openArticle: {
      bytes: 7_572_883,
      sha256: 'a90ff801c4a187c3069c0e004cfb7d55f04be6ea10da941ac412087b2ce3e1fa',
    },
  },
  globalRechargeData2024: {
    id: 'nazari_pangaea_global_rainfed_groundwater_recharge_2024',
    publisher: 'PANGAEA',
    title: 'Grid-based rain-fed annual global groundwater recharge',
    publicationDate: '2024-12-09',
    doi: '10.1594/PANGAEA.957447',
    url: 'https://doi.pangaea.de/10.1594/PANGAEA.957447',
    archiveUrl: 'https://download.pangaea.de/dataset/957447/files/GGR_Rainfed_Groundwater_Recharge_Basin_yearly_2001_2020.zip',
    archive: {
      bytes: 30_122_290,
      md5: '33e602cf67981316ebb6b872de59f51c',
      sha256: '257fe7ea402cfd0cebef702f550cb551d8e7d36597a9a984b6837fc96f315ba1',
    },
  },
  rechargeAriditySensitivity2024: {
    id: 'berghuijs_groundwater_recharge_aridity_sensitivity_2024',
    publisher: 'Springer Nature, Nature Climate Change',
    title: 'Groundwater recharge is sensitive to changing long-term aridity',
    publicationDate: '2024-03-12',
    doi: '10.1038/s41558-024-01953-z',
    url: 'https://doi.org/10.1038/s41558-024-01953-z',
  },
};

const [studyCrossref, aridityCrossref, articlePdf, pangaeaPage, pangaeaArchive] = await Promise.all([
  crossref(sources.globalRechargeStudy2025.doi),
  crossref(sources.rechargeAriditySensitivity2024.doi),
  fetchBuffer(sources.globalRechargeStudy2025.openArticleUrl, 8_000_000),
  fetchBuffer(`${sources.globalRechargeData2024.url}?format=html`, 500_000),
  fetchBuffer(sources.globalRechargeData2024.archiveUrl, 31_000_000),
]);

assert.equal(studyCrossref.record.title[0], sources.globalRechargeStudy2025.title);
assert.equal(aridityCrossref.record.title[0], sources.rechargeAriditySensitivity2024.title);
assert.equal(articlePdf.length, sources.globalRechargeStudy2025.openArticle.bytes);
assert.equal(articlePdf.subarray(0, 5).toString(), '%PDF-');
assert.equal(digest('sha256', articlePdf), sources.globalRechargeStudy2025.openArticle.sha256);
assert.equal(pangaeaArchive.length, sources.globalRechargeData2024.archive.bytes);
assert.equal(digest('md5', pangaeaArchive), sources.globalRechargeData2024.archive.md5);
assert.equal(digest('sha256', pangaeaArchive), sources.globalRechargeData2024.archive.sha256);
assert.equal(pangaeaArchive.subarray(0, 2).toString(), 'PK');

const pangaeaHtml = pangaeaPage.toString('utf8');
for (const required of [
  'Grid-based rain-fed annual global groundwater recharge',
  'GGR_Rainfed_Groundwater_Recharge_Basin_yearly_2001_2020.zip',
  'river basin (hydroBASINS level 4)',
  '33e602cf67981316ebb6b872de59f51c',
  '2001',
  '2020',
]) assert(pangaeaHtml.includes(required), `PANGAEA page no longer contains: ${required}`);

const payload = {
  version: 'tulip_groundwater_recharge_current_reference_2026_09_24_v1',
  generatedOn: '2026-09-24',
  status: 'current_global_recharge_model_and_attribution_boundary_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Refresh Groundwater Recharge Decline with direct global rain-fed recharge evidence while keeping recharge, storage depletion, pumping, exposed residents and demonstrated consequences as separate quantities.',
  appliesToNodeIds: ['aquifer_recharge_failure'],
  sources: {
    ...sources,
    globalRechargeStudy2025: {
      ...sources.globalRechargeStudy2025,
      crossrefSha256AtIngestion: digest('sha256', studyCrossref.body),
    },
    globalRechargeData2024: {
      ...sources.globalRechargeData2024,
      landingPageSha256AtIngestion: digest('sha256', pangaeaPage),
    },
    rechargeAriditySensitivity2024: {
      ...sources.rechargeAriditySensitivity2024,
      crossrefSha256AtIngestion: digest('sha256', aridityCrossref.body),
    },
  },
  evidence: {
    globalRainFedRecharge: {
      observationPeriod: { start: 2001, end: 2020 },
      spatialCoverage: { longitude: [-180, 180], latitude: [-60, 60] },
      spatialResolutionDegrees: 0.1,
      temporalModelStep: 'daily',
      aggregationUnit: 'HydroBASINS level 4 river basin',
      globalAverageRechargeMmPerYear: 176,
      globalTrendMmPerYear: 0.2,
      basinRechargeTrendRangeMmPerYear: { minimum: -24, maximum: 9 },
      riverBasinsWithDecliningRechargePercent: 40,
      secondDecadeAverageRechargeMmPerYear: { '2001-2010': 173, '2011-2020': 178 },
      secondDecadeTrendMmPerYear: { '2001-2010': 1.3, '2011-2020': -0.8 },
      basinsWithPersistentOrNewDeclinePercent: 50,
      populationLivingInThoseBasinsBillions: 3.6,
      interpretation: 'The global mean increased slightly while many basins declined. A global average therefore cannot be used to erase regional decline, and basin count is not the share of a groundwater-dependent ecosystem distribution harmed.',
    },
    storageAttributionBoundary: {
      storageDecliningRechargeIncreasingBasinsPercent: 26,
      residentsBillions: 2.6,
      interpretation: 'Declining storage alongside increasing recharge points toward withdrawal or other anthropogenic pressures. These basins must not be counted as recharge-failure harm.',
      rechargeAndStorageDecliningBasinsPercent: 22,
      residentsInJointDeclineBasinsBillions: 1.7,
      interpretationForJointDecline: 'Joint decline identifies climatic groundwater-sustainability hotspots. Residents are exposed by location; the study does not report that all 1.7 billion experienced attributable illness, service failure or material loss.',
    },
    sensitivityMechanism: {
      rechargeLocations: 5_237,
      finding: 'Recharge is especially sensitive where long-term potential evapotranspiration slightly exceeds precipitation, so future recharge change can be amplified relative to precipitation change.',
      interpretation: 'This supports a climate mechanism and outlook boundary. It does not provide a current global terminal-harm total or a recovery-time distribution.',
    },
    domainBoundary: {
      compatibleCurrentHarmedPersonCount: null,
      compatibleCurrentEssentialServiceLoss: null,
      compatibleCurrentEcosystemConditionLossPercent: null,
      compatibleCurrentGroundwaterDependentEcosystemShareAffected: null,
      compatibleCurrentRecoveryDuration: null,
      interpretation: 'Recharge rate is a physical water-flow measure. Storage loss, well failure, water-service disruption, ecosystem condition and pumping attribution require separate evidence.',
    },
  },
  ratingDecision: {
    change: 'revised',
    candidate: {
      prior: { value: 5.9, grade: 'C', lower: 3.6, upper: 8.1, confidence: 'C' },
      revised: { value: 4.4, grade: 'B', lower: 2.1, upper: 7, confidence: 'C' },
    },
    axes: {
      human: {
        severity: { lower: 0, central: 1, upper: 2 },
        reach: { lower: 0, central: 1, upper: 3 },
        persistence: { lower: 1, central: 2, upper: 3 },
      },
      ecosystem: {
        severity: { lower: 0, central: 1, upper: 2 },
        reach: { lower: 1, central: 2, upper: 3 },
        persistence: { lower: 1, central: 2, upper: 3 },
      },
    },
    excludedUses: [
      'Do not treat groundwater storage decline as recharge decline; pumping can lower storage while recharge increases.',
      'Do not treat people living in a basin as people demonstrably harmed by recharge decline.',
      'Do not treat the percentage of river basins with decline as the share of people or ecosystems harmed.',
      'Do not treat millimetres per year of recharge change as a percentage of human or ecosystem condition lost.',
      'Do not use the 2001–2020 observation interval as consequence or recovery duration.',
      'Do not add downstream drought, groundwater depletion, well failure, water scarcity, food or ecosystem ratings to this node.',
      'Do not interpret a slightly positive global mean trend as evidence that regional recharge decline is absent.',
    ],
    exactRemainingGaps: [
      'A current count of people experiencing attributable well, drinking-water, sanitation or essential-service loss specifically from recharge decline.',
      'A current estimate of groundwater-dependent ecosystem condition loss attributable to recharge decline.',
      'The affected share of each relevant groundwater-dependent ecosystem distribution rather than basin count or land area.',
      'Consequence and recovery-duration distributions for human services and groundwater-dependent ecosystems.',
      'A harmonized attribution analysis separating recharge change, pumping, managed recharge, land cover and surface-water interaction at the consequence endpoint.',
    ],
  },
};

payload.snapshotDigest = digest('sha256', JSON.stringify(payload));
await writeFile(output, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ output, snapshotDigest: payload.snapshotDigest }, null, 2));
