import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'artifacts/tulip-calibration-2026-09-22/mangrove-buffer-reference-snapshot.json');
const checkedOn = '2026-09-23';
const gmw = JSON.parse(await readFile(resolve(root, 'artifacts/tulip-calibration-2026-09-22/gmw-mangrove-extent-reference-snapshot.json'), 'utf8'));

const endpoints = {
  coastalProtectionIndex: 'https://api.crossref.org/works/10.1038/s41467-024-54349-0',
  floodProtection: 'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_xml/PMC7064529/unicode',
  restorationOutcomes: 'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_xml/PMC8376958/unicode',
  coastalWetlandRecovery: 'https://api.crossref.org/works/10.1038/s43247-025-03036-z',
};

async function fetchSource(url) {
  let lastFailure = 'request failed';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(30000),
        headers: { 'user-agent': 'Mozilla/5.0 (compatible; TULIP evidence ingestion; source verification)' },
      });
      if (response.ok) return response;
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

const fetchText = async url => (await fetchSource(url)).text();
const stripMarkup = value => value.replace(/<[^>]+>/g, ' ').replaceAll('&gt;', '>').replaceAll('&lt;', '<')
  .replaceAll('&amp;', '&').replaceAll('&#x02009;', ' ').replace(/\s+/g, ' ').trim();
const score = ({ human, ecosystem }) => Number((1 + 9 * (((human.severity + human.reach + human.persistence) / 12
  + (ecosystem.severity + ecosystem.reach + ecosystem.persistence) / 12) / 2)).toFixed(1));

const indexJson = await fetchText(endpoints.coastalProtectionIndex);
const [floodXml, restorationXml, recoveryJson] = await Promise.all([
  fetchText(endpoints.floodProtection),
  fetchText(endpoints.restorationOutcomes),
  fetchText(endpoints.coastalWetlandRecovery),
]);
const index = JSON.parse(indexJson).message;
const recovery = JSON.parse(recoveryJson).message;
const indexAbstract = stripMarkup(index.abstract);

assert.equal(index.DOI, '10.1038/s41467-024-54349-0');
assert.match(indexAbstract, /25% decrease in MCPI from 2007 to 2019/i);
assert.match(indexAbstract, /compared to a 2% decrease in area/i);
assert.match(indexAbstract, /800% increase in mangrove forests with characteristically low height, width, and MCPI/i);

for (const pattern of [
  /15 million more people would be flooded annually/i,
  /29% more land, 28% more people and 9% more property would be damaged every year/i,
  /700,000.{0,20}km of mangrove coastlines globally/i,
]) assert.match(stripMarkup(floodXml), pattern);

for (const pattern of [
  /188 articles with 395 cases/i,
  /88 studies \(representing 962 observations/i,
  /restored mangroves have on aggregate a lower ability to deliver different functions/i,
  /RR.{0,10}−0\.21.{0,30}−0\.34 to −0\.08/i,
  /wave dissipation.{0,500}RR.{0,10}−0\.69.{0,40}−1\.05 to −0\.34/i,
  /ranged between 1 and 70 years old/i,
  /require up to 40 years to reach the biomass levels and other structural characteristics/i,
]) assert.match(stripMarkup(restorationXml), pattern);

assert.equal(recovery.DOI, '10.1038/s43247-025-03036-z');
assert.equal(recovery.title[0], 'Ecosystem carbon and nitrogen recovery in restored coastal wetlands');
assert.deepEqual(recovery.published['date-parts'][0], [2025, 12, 9]);

assert.equal(gmw.currentWindow.start, 2016);
assert.equal(gmw.currentWindow.end, 2025);
assert.equal(gmw.currentWindow.grossLossPctOfBaseline, 6.183745);

const axisRecommendation = {
  lower: {
    human: { severity: 1, reach: 1, persistence: 1 },
    ecosystem: { severity: 2, reach: 2, persistence: 3 },
  },
  central: {
    human: { severity: 2, reach: 2, persistence: 2 },
    ecosystem: { severity: 2, reach: 2, persistence: 3 },
  },
  upper: {
    human: { severity: 3, reach: 3, persistence: 3 },
    ecosystem: { severity: 3, reach: 3, persistence: 4 },
  },
};

const snapshot = {
  version: 'tulip_mangrove_buffer_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'internal_reference_ingestion_not_public_rating_data',
  productionRatingsEnabled: 0,
  nodeId: 'mangrove_buffer_loss',
  extentReference: {
    sourceId: gmw.source.id,
    snapshotVersion: gmw.version,
    snapshotDigest: gmw.snapshotDigest,
    currentWindow: gmw.currentWindow,
  },
  sources: [
    {
      id: 'xu_global_mangrove_coastal_protection_index_2024',
      title: index.title[0],
      publisher: index.publisher,
      doi: `https://doi.org/${index.DOI}`,
      publicationDate: '2024-11-26',
      metric: 'process-based Mangrove Coastal Protection Index combining cross-shore width, canopy height and vegetation condition',
      facts: {
        evidencePeriod: { start: 2007, end: 2019 },
        globalMeanMcpiChangePct: -25.01,
        contemporaneousMeanAreaChangePct: -2.11,
        lowHeightWidthMcpiClusterIncreasePct: 800,
        primaryDriver: 'canopy-height and biomass change in the model',
        spatialCoverage: 'global mangrove distribution represented on a one-degree grid',
        finding: 'The modelled protection-capacity decline was substantially larger than contemporaneous area decline and varied strongly by region.',
        limitations: 'The authors identify canopy-height and transect-patchiness data issues and advise giving more credence to spatial variation than to the temporal trend.',
      },
    },
    {
      id: 'menendez_global_mangrove_flood_protection_2020',
      title: 'The Global Flood Protection Benefits of Mangroves',
      publisher: 'Scientific Reports; peer-reviewed open-access global modelling study',
      articleUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7064529/',
      doi: 'https://doi.org/10.1038/s41598-020-61136-6',
      publicationDate: '2020-03-10',
      metric: 'process-based expected annual coastal flooding with current mangroves versus a counterfactual with all current mangroves removed',
      facts: {
        modelledMangroveCoastKm: 700000,
        fullLossAdditionalPeopleFloodedPerYear: 15000000,
        fullLossAdditionalLandDamagedPct: 29,
        fullLossAdditionalPeopleDamagedPct: 28,
        fullLossAdditionalPropertyDamagedPct: 9,
        currentAnnualAvertedPropertyDamageUsd: 65000000000,
        fullLossCounterfactual: true,
        finding: 'Current mangroves provide a material global flood-protection service, with benefits concentrated unevenly by storm climate, coastal form and exposed population.',
        attributionBoundary: 'The full-loss counterfactual measures the service supplied by all current mangroves. It does not estimate people already harmed by observed 2016–2025 mangrove loss.',
      },
    },
    {
      id: 'su_mangrove_restoration_outcomes_meta_analysis_2021',
      title: 'A meta-analysis of the ecological and economic outcomes of mangrove restoration',
      publisher: 'Nature Communications; peer-reviewed open-access meta-analysis',
      articleUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8376958/',
      doi: 'https://doi.org/10.1038/s41467-021-25349-1',
      publicationDate: '2021-08-19',
      metric: 'paired ecosystem-function outcomes in restored mangroves relative to natural mangroves and other source-defined reference conditions',
      facts: {
        systematicReviewArticles: 188,
        cases: 395,
        metaAnalysisStudies: 88,
        metaAnalysisObservations: 962,
        countriesAndRegions: 22,
        restoredVersusNaturalOverallLogResponseRatio: -0.21,
        restoredVersusNaturalOverall95Ci: [-0.34, -0.08],
        restoredVersusNaturalWaveDissipationLogResponseRatio: -0.69,
        restoredVersusNaturalWaveDissipation95Ci: [-1.05, -0.34],
        studiedStandAgeYears: { minimum: 1, maximum: 70, mostCases: '1–15' },
        reportedUpperRecoveryContextYears: 40,
        finding: 'Restoration generally improves functions relative to unvegetated tidal flats, but restored stands remain below natural stands overall and wave dissipation is especially incomplete.',
        coverageBoundary: 'Article, case, country and observation counts describe evidence coverage, not the fraction of the global mangrove distribution recovering or degraded.',
      },
    },
    {
      id: 'chen_coastal_wetland_carbon_nitrogen_recovery_2025',
      title: recovery.title[0],
      publisher: recovery.publisher,
      doi: `https://doi.org/${recovery.DOI}`,
      primaryPdfUrl: 'https://www.nature.com/articles/s43247-025-03036-z.pdf',
      publicationDate: '2025-12-09',
      journalIssueYear: 2026,
      metric: 'global meta-analysis of plant-biomass carbon and soil carbon and nitrogen recovery in restored mangrove and salt-marsh sites',
      extraction: {
        method: 'manually verified against the official publisher PDF because Crossref supplies metadata but no abstract',
        checkedOn,
        location: 'page 1 abstract',
        automatedIdentityCheck: 'DOI, title, publisher and publication date verified through Crossref',
      },
      facts: {
        saltMarshSites: 110,
        mangroveSites: 190,
        restoredSoilCarbonRelativeToNaturalPct: [37, 76],
        restoredSoilNitrogenRelativeToNaturalPct: [43, 83],
        restoredPlantBiomassCarbonRelativeToNaturalPct: [34, 119],
        plantBiomassRecoveryYears: 20,
        soilCarbonNitrogenRecoveryYears: 40,
        finding: 'Plant biomass can require about two decades and soil carbon and nitrogen about four decades to reach natural comparison levels, with strong variation by restoration method and site conditions.',
        transferBoundary: 'The synthesis combines mangroves and salt marshes and measures carbon, nitrogen and biomass recovery, not every ecological function or coastal-protection service.',
      },
    },
  ],
  evidenceSynthesis: {
    currentExtent: `Global Mangrove Watch maps ${gmw.currentWindow.grossLossHa.toLocaleString('en-US')} hectares of gross loss from 2016 through 2025, equal to ${gmw.currentWindow.grossLossPctOfBaseline}% of 2016 global extent. Gains and net change remain separate.`,
    currentFunction: 'The global MCPI study estimates a 25.01% mean decline in modelled coastal-protection capacity from 2007 to 2019, much larger than its 2.11% area decline. Height-data and temporal-comparison limitations prevent treating 25.01% as an error-free global condition loss.',
    humanConsequence: 'The full-loss flood model establishes that the service is material and globally distributed. It does not estimate the fraction of its 15-million-person annual benefit lost during the observed 2016–2025 gross area change, so it cannot become current harmed-person reach.',
    recovery: 'Two independent global syntheses show that restored mangroves can remain below natural reference function and that important biomass and soil properties can take roughly 20–40 years to recover. Function, geography and restoration method remain material modifiers.',
    compatibilityBoundary: 'Extent loss, protection-capacity decline, full-loss flood benefits and restored-ecosystem recovery answer different questions. They are retained in separate axes and are never multiplied into an invented attributable burden.',
  },
  tulipUse: {
    admissible: [
      'Use GMW 2016–2025 gross loss divided by 2016 extent as a direct lower-bound anchor for ecosystem reach.',
      'Use the 2007–2019 MCPI change as direct evidence that coastal-protection function can decline materially beyond mapped area loss, while retaining the study’s height-data and temporal-trend caveats.',
      'Use the global flood model to establish material human protection-service consequences and geographic transfer, without treating protected people as people already harmed.',
      'Use the two restoration syntheses for ecosystem recovery-time and incomplete-function bounds, retaining their function and geography limits.',
    ],
    excluded: [
      'Do not use 15 million protected people as current harmed-person reach or as an observed burden from 2016–2025 mangrove loss.',
      'Do not use $65 billion in annual averted damage as current loss caused by observed mangrove decline.',
      'Do not use the 25.01% global mean MCPI decline as both ecosystem severity and reach.',
      'Do not use 6.183745% gross area loss as local severity or ecological recovery time.',
      'Do not use article, study, observation, country, site or coastline counts as harmed-person or ecosystem reach.',
      'Do not treat restored biomass, carbon or nitrogen recovery as proof that every mangrove function recovers on the same schedule.',
    ],
    axisRecommendation,
    scoreDisposition: {
      lower: score(axisRecommendation.lower),
      central: score(axisRecommendation.central),
      upper: score(axisRecommendation.upper),
      centralGrade: 'C',
      rangeGrades: ['C', 'D'],
      confidence: 'C',
      rationale: 'Direct global extent, function and recovery evidence narrows the nature component. Current attributable human outcomes from observed loss remain bounded rather than inferred from the full-loss service counterfactual.',
    },
  },
};

snapshot.snapshotDigest = createHash('sha256').update(JSON.stringify({
  extentReference: snapshot.extentReference,
  sources: snapshot.sources,
  evidenceSynthesis: snapshot.evidenceSynthesis,
  tulipUse: snapshot.tulipUse,
})).digest('hex');

await writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({
  output,
  sources: snapshot.sources.length + 1,
  currentValue: snapshot.tulipUse.scoreDisposition.central,
  range: [snapshot.tulipUse.scoreDisposition.lower, snapshot.tulipUse.scoreDisposition.upper],
  snapshotDigest: snapshot.snapshotDigest,
}, null, 2));
