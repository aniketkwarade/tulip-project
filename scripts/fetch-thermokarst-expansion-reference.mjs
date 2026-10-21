import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(
  root,
  'artifacts',
  'tulip-calibration-2026-09-22',
  'thermokarst-expansion-reference-snapshot.json',
);

const endpoints = {
  circumpolarArticleDoi: 'https://doi.org/10.1029/2024JF007675',
  circumpolarCrossref: 'https://api.crossref.org/works/10.1029%2F2024JF007675',
  circumpolarOfficialSummary: 'https://ngee-arctic.ornl.gov/publications/doi-10.1029/2024jf007675',
  circumpolarDatasetDoi: 'https://doi.org/10.5440/1834773',
  circumpolarDataOneResourceMap: 'ess-dive-90be6cba6ca24bd-20240716T193312219',
  pointLayArticleDoi: 'https://doi.org/10.1088/2752-664X/adf1ac',
  pointLayCrossref: 'https://api.crossref.org/works/10.1088%2F2752-664X%2Fadf1ac',
  pointLayNnaSummary: 'https://nna-co.org/publications/climate-change-and-infrastructure-development-drive-ice-rich-permafrost-thaw-point-lay',
  pointLayFieldReport: 'https://aidc.uaf.edu/project-reports/2022/permafrost-remote-sensing-studies-2022-field-report-for-point-lay-alaska/',
  tundraTransformationDoi: 'https://doi.org/10.1016/j.gloplacha.2022.103921',
  tundraTransformationCrossref: 'https://api.crossref.org/works/10.1016%2Fj.gloplacha.2022.103921',
  tundraTransformationNnaSummary: 'https://nna-co.org/index.php/publications/rapid-transformation-tundra-ecosystems-ice-wedge-degradation',
  lakeRecoveryDoi: 'https://doi.org/10.1007/s00442-025-05681-9',
  lakeRecoveryCrossref: 'https://api.crossref.org/works/10.1007%2Fs00442-025-05681-9',
  lakeRecoveryUsgs: 'https://www.usgs.gov/publications/rapid-recovery-arctic-lake-ecosystem-a-pulse-disturbance-caused-thermokarst-failure',
};

const fetchText = async url => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        accept: '*/*',
        'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)',
      },
    });
    if (response.ok) return response.text();
    if (response.status !== 429 || attempt === 4) {
      assert(response.ok, `Request failed (${response.status}) for ${url}`);
    }
    await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw new Error(`Request retry loop ended unexpectedly for ${url}`);
};

const fetchJson = async url => JSON.parse(await fetchText(url));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const plainText = value => value
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&ndash;|&#8211;/gi, '–')
  .replace(/&minus;/gi, '−')
  .replace(/&plusmn;|&#177;/gi, '±')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ')
  .trim();

const dataOneQuery = new URL('https://cn.dataone.org/cn/v2/query/solr/');
dataOneQuery.searchParams.set('q', `resourceMap:"${endpoints.circumpolarDataOneResourceMap}"`);
dataOneQuery.searchParams.set('fl', 'identifier,title,fileName,formatId,size,checksum,checksumAlgorithm');
dataOneQuery.searchParams.set('rows', '100');
dataOneQuery.searchParams.set('wt', 'json');

const circumpolarCrossref = await fetchJson(endpoints.circumpolarCrossref);
const pointLayCrossref = await fetchJson(endpoints.pointLayCrossref);
const tundraCrossref = await fetchJson(endpoints.tundraTransformationCrossref);
const lakeRecoveryCrossref = await fetchJson(endpoints.lakeRecoveryCrossref);
const [
  circumpolarOfficialHtml,
  dataOneResponse,
  pointLayNnaHtml,
  pointLayFieldReportHtml,
  tundraNnaHtml,
  lakeRecoveryUsgsHtml,
] = await Promise.all([
  fetchText(endpoints.circumpolarOfficialSummary),
  fetchJson(dataOneQuery.toString()),
  fetchText(endpoints.pointLayNnaSummary),
  fetchText(endpoints.pointLayFieldReport),
  fetchText(endpoints.tundraTransformationNnaSummary),
  fetchText(endpoints.lakeRecoveryUsgs),
]);

const circumpolarAbstract = plainText(circumpolarCrossref.message.abstract ?? '');
const circumpolarOfficialText = plainText(circumpolarOfficialHtml);
assert.equal(circumpolarCrossref.message.DOI.toLowerCase(), '10.1029/2024jf007675');
assert.match(circumpolarAbstract, /27 survey areas/i);
assert.match(circumpolarAbstract, /400 km\s*2 in total/i);
assert.match(circumpolarAbstract, /rapid expansion at 44% \(15%\)/i);
assert.match(circumpolarOfficialText, /2008 to 2020/i);
assert.match(circumpolarOfficialText, /27 survey areas/i);
assert.match(circumpolarOfficialText, /rapid expansion at 44%/i);

const dataOneFiles = dataOneResponse.response.docs.sort((left, right) => left.identifier.localeCompare(right.identifier));
assert.equal(dataOneResponse.response.numFound, 5);
const dataOneByName = new Map(dataOneFiles.map(file => [file.fileName, file]));
const metadataFile = dataOneByName.get('Maps_of_ice_wedge_thermokarst_pool_expansion_from.xml');
const readmeFile = dataOneByName.get('README.txt');
const workspaceFile = dataOneByName.get('workspace.zip');
const finalProductsFile = dataOneByName.get('final_products.zip');
assert(metadataFile && readmeFile && workspaceFile && finalProductsFile, 'Expected ESS-DIVE files were not returned');
assert.equal(metadataFile.size, 8_668);
assert.equal(metadataFile.checksum, 'cdffe95934fef2cefcb33e9989fcfc6a');
assert.equal(readmeFile.size, 4_488);
assert.equal(readmeFile.checksum, 'd825523a312eee2493e8ae94eaf3f2ae');
assert.equal(workspaceFile.size, 241_551_312);
assert.equal(workspaceFile.checksum, '98cc23935838273f06cf246cf3f0f844');
assert.equal(finalProductsFile.size, 7_142_285_512);
assert.equal(finalProductsFile.checksum, 'f04a8eed0396c427090f8b38abef8734');

const metadataText = await fetchText(`https://cn.dataone.org/cn/v2/resolve/${metadataFile.identifier}`);
const readmeText = await fetchText(`https://cn.dataone.org/cn/v2/resolve/${readmeFile.identifier}`);
assert.equal(Buffer.byteLength(metadataText), metadataFile.size);
assert.equal(md5(metadataText), metadataFile.checksum);
assert.equal(Buffer.byteLength(readmeText), readmeFile.size);
assert.equal(md5(readmeText), readmeFile.checksum);
assert.match(readmeText, /twenty seven survey areas in North America and Siberia/i);
assert.match(readmeText, /time series of thermokarst pool extent at each\s+survey area/i);

const pointLayAbstract = plainText(pointLayCrossref.message.abstract ?? '');
const pointLayNnaText = plainText(pointLayNnaHtml);
const pointLayFieldReportText = plainText(pointLayFieldReportHtml);
assert.equal(pointLayCrossref.message.DOI.toLowerCase(), '10.1088/2752-664x/adf1ac');
assert.match(pointLayAbstract, /field data from .*60 boreholes/i);
assert.match(pointLayAbstract, /field campaigns from 2022.?2024/i);
assert.match(pointLayAbstract, /structural damage to homes, failing utilities/i);
assert.match(pointLayNnaText, /60 boreholes/i);
assert.match(pointLayNnaText, /from <5% in 1949 to >60% in developed areas by 2019/i);
assert.match(pointLayNnaText, /alternative water and wastewater strategies/i);
assert.match(pointLayFieldReportText, /Permafrost & Remote Sensing Studies: 2022 Field Report for Point Lay, Alaska/i);

const tundraNnaText = plainText(tundraNnaHtml);
assert.equal(tundraCrossref.message.DOI.toLowerCase(), '10.1016/j.gloplacha.2022.103921');
assert.match(tundraNnaText, /0\.7% overall and 1\.6% in the oldest terrain/i);
assert.match(tundraNnaText, /increased from 2% in 1950 to 19% area in 2018/i);
assert.match(tundraNnaText, /Community composition completely shifted/i);
assert.match(tundraNnaText, /Recovery back to tussock tundra, however, is unlikely/i);

const lakeRecoveryUsgsText = plainText(lakeRecoveryUsgsHtml);
assert.equal(lakeRecoveryCrossref.message.DOI.toLowerCase(), '10.1007/s00442-025-05681-9');
assert.match(lakeRecoveryUsgsText, /did not observe any strong changes/i);
assert.match(lakeRecoveryUsgsText, /bacterioplankton and zooplankton communities/i);
assert.match(lakeRecoveryUsgsText, /rapid recovery within two years/i);

const candidate = {
  previous: { value: 7, grade: 'D', lower: 4.8, upper: 9.3, confidence: 'C' },
  revised: { value: 6.3, grade: 'C', lower: 4, upper: 8.1, confidence: 'C' },
  axes: {
    human: {
      severity: { lower: 2, central: 3, upper: 3 },
      reach: { lower: 0, central: 1, upper: 2 },
      persistence: { lower: 2, central: 3, upper: 4 },
    },
    ecosystem: {
      severity: { lower: 2, central: 3, upper: 4 },
      reach: { lower: 1, central: 1, upper: 2 },
      persistence: { lower: 1, central: 3, upper: 4 },
    },
  },
  reason: 'The former D score assigned level-3 reach to people and ecosystems because the node was authored as global. Direct evidence instead supports severe, persistent local and regional consequences without a compatible circumpolar harmed-person or ecosystem-condition denominator. The new sources lower central reach while raising the source-anchored consequence severity and retaining wide persistence bounds.',
};

const payload = {
  version: 'tulip_thermokarst_expansion_reference_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'direct_human_and_ecosystem_consequences_pinned_global_reach_denominators_missing',
  productionRatingsEnabled: 0,
  nodeId: 'thermokarst_expansion',
  sources: {
    circumpolarExpansion: {
      id: 'abolt_circumpolar_thermokarst_pool_expansion_2024',
      publisher: 'American Geophysical Union; U.S. Department of Energy NGEE Arctic; ESS-DIVE',
      title: circumpolarCrossref.message.title[0],
      articleDoi: endpoints.circumpolarArticleDoi,
      officialSummary: endpoints.circumpolarOfficialSummary,
      datasetDoi: endpoints.circumpolarDatasetDoi,
      publicationDate: '2024-09-18',
      crossrefSha256: sha256(JSON.stringify(circumpolarCrossref.message)),
      officialSummarySha256: sha256(circumpolarOfficialHtml),
      resourceMapId: endpoints.circumpolarDataOneResourceMap,
      files: dataOneFiles,
      metadataSha256: sha256(metadataText),
      readmeSha256: sha256(readmeText),
    },
    pointLayInfrastructure: {
      id: 'jones_point_lay_thermokarst_infrastructure_2025',
      publisher: 'IOP Publishing; Navigating the New Arctic Community Office; University of Alaska Fairbanks',
      title: pointLayCrossref.message.title[0],
      articleDoi: endpoints.pointLayArticleDoi,
      officialSummary: endpoints.pointLayNnaSummary,
      fieldReport: endpoints.pointLayFieldReport,
      publicationDate: '2025-08-04',
      crossrefSha256: sha256(JSON.stringify(pointLayCrossref.message)),
      officialSummarySha256: sha256(pointLayNnaHtml),
      fieldReportPageSha256: sha256(pointLayFieldReportHtml),
      openAccessPdf: {
        url: 'https://iopscience.iop.org/article/10.1088/2752-664X/adf1ac/pdf',
        bytes: 3_752_040,
        sha256: '565ee7a063a103517a916dbb7ff80e0d8919f45c0fe8b00736d0646ee157d912',
        verification: 'manually_downloaded_and_checked_2026_09_24; publisher_bot_protection_prevents_reliable_automated_refetch',
      },
    },
    tundraTransformation: {
      id: 'jorgenson_tundra_ecosystem_transformation_2022',
      publisher: 'Elsevier; Navigating the New Arctic Community Office',
      title: tundraCrossref.message.title[0],
      articleDoi: endpoints.tundraTransformationDoi,
      officialSummary: endpoints.tundraTransformationNnaSummary,
      publicationDate: '2022-09',
      crossrefSha256: sha256(JSON.stringify(tundraCrossref.message)),
      officialSummarySha256: sha256(tundraNnaHtml),
    },
    lakeRecovery: {
      id: 'budy_arctic_lake_thermokarst_recovery_2025',
      publisher: 'U.S. Geological Survey; Springer Nature',
      title: lakeRecoveryCrossref.message.title[0],
      articleDoi: endpoints.lakeRecoveryDoi,
      officialSummary: endpoints.lakeRecoveryUsgs,
      publicationDate: '2025-05-15',
      crossrefSha256: sha256(JSON.stringify(lakeRecoveryCrossref.message)),
      officialSummarySha256: sha256(lakeRecoveryUsgsHtml),
    },
  },
  evidence: {
    circumpolarPhysicalInventory: {
      observationPeriod: { start: 2008, end: 2020 },
      surveyAreas: 27,
      surveyAreaSizeSquareKm: { minimum: 10, maximum: 35 },
      totalMappedAreaSquareKm: 400,
      rapidExpansionSurveyAreaPercent: 44,
      reportedUncertaintyPercentagePoints: 15,
      finding: 'Rapid pool expansion occurred at 44% ± 15 percentage points of 27 selected survey areas. Topography and soil conditions explained between-site variation better than air-temperature departures alone.',
      boundary: 'The 27 sites were selected where polygonal troughs were visible, at least partly inundated and supported by adequate imagery. They are not a probability sample of all circumpolar tundra, and 44% is not an ecosystem-condition-loss percentage.',
    },
    directHumanConsequence: {
      location: 'Point Lay (Kali), Alaska',
      fieldCampaigns: { start: 2022, end: 2024 },
      approximateBoreholes: 60,
      interviews: 8,
      thermokarstShare: {
        yedomaTerrainPercent: { 1949: 2, 1974: 5, 2019: 22 },
        developedVillageBlocks2019PercentLowerBound: 60,
        adjacentNaturalBlocksTypicalAnnualExpansionPercent: 0.2,
      },
      observedConsequences: ['structural damage to homes', 'failing water and sewage utilities', 'road hazards', 'reduced emergency-response capacity', 'dependence on alternative water and wastewater services'],
      attribution: 'The study identifies climate warming, ice-rich ground, infrastructure, surface disturbance, drainage and snow/water redistribution as interacting drivers. The observed damage cannot be assigned to climate alone.',
      boundary: 'This is a severe direct consequence case in one community of about 330 residents, not a circumpolar harmed-person total. Housing defects reported in a broader survey are not all assumed to be thermokarst-attributable.',
      reproductionStatus: 'article_abstract_and_official_summary_machine_checked; detailed_interview_findings_checked_against_checksum_pinned_open_access_pdf_not_recalculated',
    },
    ecosystemTransformation: {
      location: 'Northeastern Alaska tundra',
      extensiveMappingAreaSquareKm: 30,
      advancedOpenWaterSharePercent: 0.7,
      oldestTerrainAdvancedOpenWaterSharePercent: 1.6,
      hotspotAreaSquareKm: 0.5,
      hotspotAllDegradationStagesPercent: { 1950: 2, 2018: 19 },
      communityChange: 'Vegetation shifted completely from shrub-dominated tussock tundra to aquatic mosses and forbs in advanced flooded depressions; stabilized areas retained wet-adapted communities.',
      recoveryFinding: 'Recovery to tussock tundra is unlikely in the mapped transformed patches.',
      boundary: 'The mapped shares describe one northeastern Alaska region and one concentrated hotspot. They do not establish the share of the circumpolar ecosystem distribution affected.',
    },
    recoveryContrast: {
      location: 'One affected Arctic lake compared with a reference lake',
      finding: 'Water transparency and some lower trophic levels changed substantially, but no strong statistically attributable total changes were observed in several higher trophic indicators, and the lake recovered rapidly within two years.',
      boundary: 'This pulse disturbance does not represent every thermokarst form. It establishes that ecosystem persistence cannot be assumed universally irreversible.',
    },
  },
  ratingDecision: {
    change: 'revised',
    candidate,
    admittedUses: [
      'Current human severity from observed infrastructure and essential-service failures in Point Lay.',
      'Human reach lower bound from the directly studied community, while preserving an upper bound for other documented Arctic settlements.',
      'Ecosystem severity from mapped vegetation, hydrology and soil transformation in northeastern Alaska.',
      'Regional ecosystem reach lower bound from mapped affected shares without extrapolating to all Arctic lands.',
      'Wide persistence bounds from unlikely tundra recovery and rapid two-year lake recovery in different thermokarst forms.',
      'Circumpolar physical occurrence and heterogeneity context from the 27-site survey.',
    ],
    excludedUses: [
      'Do not treat 44% of selected survey areas as 44% of circumpolar tundra or ecosystem condition lost.',
      'Do not count all residents, infrastructure or ecosystems on permafrost as currently harmed by thermokarst.',
      'Do not generalize Point Lay severity or the northeastern Alaska hotspot to every Arctic settlement or landscape.',
      'Do not assume every thermokarst disturbance is permanent; the lake case recovered within two years.',
      'Do not assume every thermokarst disturbance recovers quickly; transformed tussock tundra was assessed as unlikely to return.',
      'Do not add downstream permafrost, methane, infrastructure, lake, wetland, vegetation or carbon node scores.',
    ],
    exactRemainingGaps: [
      'A compatible circumpolar count or representative sample of people experiencing material thermokarst-attributable harm.',
      'A representative circumpolar ecosystem-condition survey with affected and unaffected denominator areas.',
      'A matched recovery distribution by thermokarst type, ecosystem and intervention status.',
      'A multi-site causal attribution model separating climate forcing from infrastructure and local ground controls.',
    ],
  },
};

payload.digest = sha256(JSON.stringify({
  version: payload.version,
  sources: payload.sources,
  evidence: payload.evidence,
  ratingDecision: payload.ratingDecision,
}));

await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({
  outputPath,
  status: payload.status,
  previous: candidate.previous,
  revised: candidate.revised,
  sourceCount: Object.keys(payload.sources).length,
  digest: payload.digest,
}, null, 2));
