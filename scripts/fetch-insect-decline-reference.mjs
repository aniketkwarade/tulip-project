import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'artifacts/tulip-calibration-2026-09-22/insect-decline-reference-snapshot.json');
const checkedOn = '2026-09-23';

const endpoints = {
  abundanceArticle: 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11006610/fullTextXML',
  abundanceRepository: 'https://zenodo.org/api/records/10115304',
  biomassArticle: 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC10961242/fullTextXML',
  methodologicalChallenge: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=40075186&retmode=xml',
};

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; TULIP evidence ingestion; source verification)' } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

const [abundanceHtml, abundanceRepositoryJson, biomassXml, challengeHtml] = await Promise.all([
  fetchText(endpoints.abundanceArticle),
  fetchText(endpoints.abundanceRepository),
  fetchText(endpoints.biomassArticle),
  fetchText(endpoints.methodologicalChallenge),
]);
const abundanceRepository = JSON.parse(abundanceRepositoryJson);

const expectedAbundanceStatements = [
  /923 terrestrial insect assemblages monitored in 106 studies/i,
  /spanning between 9 and 64 years/i,
  /overall change in abundance was [−-]1\.49% per year \(95% CI: [−-]2\.18, [−-]0\.79\)/i,
  /69% of studies providing abundance data, and 74% of studies providing compositional data/i,
  /not a representative global sample/i,
  /estimated mean trends cannot be geographically extrapolated/i,
  /excluded datasets that had only biomass measurements/i,
];
for (const pattern of expectedAbundanceStatements) assert.match(abundanceHtml, pattern);
assert.equal(abundanceRepository.id, 10115304);
assert.equal(abundanceRepository.metadata.version, 'V2.3');
assert.equal(abundanceRepository.files[0].checksum, 'md5:e512a80d8c6e4691c0d5cdb3db4f9177');

const expectedBiomassStatements = [
  /21 selected nature reserves across Germany in the years 2020 and 2021/i,
  /1621 data points of two.{0,8}week emptying intervals/i,
  /measured insect biomass remained at low levels, consistent with previous findings from the years 2007.{0,3}2016/i,
  /same methods and protocols for trapping and measuring the biomass of flying insects/i,
];
for (const pattern of expectedBiomassStatements) assert.match(biomassXml, pattern);

const expectedChallengeStatements = [
  /Weather anomalies cannot explain insect decline/i,
  /10\.1038\/s41586-024-08528-0/i,
  /No recovery in the biomass of flying insects over the last decade/i,
];
for (const pattern of expectedChallengeStatements) assert.match(challengeHtml, pattern);

const snapshot = {
  version: 'tulip_insect_decline_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'internal_reference_ingestion_not_public_rating_data',
  productionRatingsEnabled: 0,
  nodeId: 'insect_biomass_decline',
  sources: [
    {
      id: 'van_klink_terrestrial_insect_abundance_synthesis_2024',
      title: 'Disproportionate declines of formerly abundant species underlie insect loss',
      publisher: 'Nature; peer-reviewed open-access synthesis',
      articleUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11006610/',
      doi: 'https://doi.org/10.1038/s41586-023-06861-4',
      publicationDate: '2023-12-20',
      dataRepository: 'https://doi.org/10.5281/zenodo.10115304',
      repositoryVersion: abundanceRepository.metadata.version,
      repositoryFileChecksum: abundanceRepository.files[0].checksum,
      metric: 'terrestrial insect abundance, not biomass',
      facts: {
        studies: 106,
        assemblages: 923,
        timeSeriesDurationYears: { minimum: 9, maximum: 64, median: 20 },
        annualAbundanceTrendPct: { central: -1.49, lower95: -2.18, upper95: -0.79 },
        fullCommunityAnnualAbundanceTrendPct: { central: -1.22, lower95: -2.01, upper95: -0.42, studies: 57 },
        annualSpeciesRichnessTrendPct: { central: -0.29, lower95: -0.64, upper95: 0.06 },
        studiesFromEuropeOrNorthAmericaPct: { abundance: 69, composition: 74 },
        geographicSensitivity: 'When Europe and North America were excluded, the study found no abundance or richness trend; limited data and high variation prevent geographic extrapolation.',
        biomassOnlyDatasetsExcluded: true,
      },
    },
    {
      id: 'muehlethaler_german_flying_insect_biomass_2024',
      title: 'No recovery in the biomass of flying insects over the last decade in German nature protected areas',
      publisher: 'Ecology and Evolution; peer-reviewed open-access observational study',
      articleUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10961242/',
      doi: 'https://doi.org/10.1002/ece3.11182',
      publicationDate: '2024-03-24',
      metric: 'flying-insect biomass measured with standardized Malaise-trap protocols',
      facts: {
        observationYears: [2020, 2021],
        selectedNatureReserves: 21,
        twoWeekSamples: 1621,
        geography: 'Germany',
        comparisonPeriod: { start: 2007, end: 2016 },
        finding: 'Measured biomass remained at low levels consistent with the 2007–2016 observations. Protected-area interiors generally had more biomass than adjacent farmland.',
        globalRepresentativeness: false,
      },
    },
    {
      id: 'hallmann_insect_biomass_methodological_challenge_2025',
      title: 'Weather anomalies cannot explain insect decline',
      publisher: 'Nature; peer-reviewed Matters Arising and reanalysis',
      articleUrl: 'https://www.nature.com/articles/s41586-024-08528-0',
      doi: 'https://doi.org/10.1038/s41586-024-08528-0',
      publicationDate: '2025-03-12',
      metric: 'methodological reanalysis of German flying-insect biomass records',
      facts: {
        geography: 'Germany',
        earlierReportedBiomassDeclinePct: 76,
        earlierRecordYears: 27,
        finding: 'The authors dispute that weather anomalies explain the long-term decline and report evidence that biomass continued to decline.',
        verification: 'The article text was reviewed on 2026-09-23; PubMed metadata and cited data lineage are validated automatically by this ingestion.',
        role: 'uncertainty and attribution review, not a new global severity or reach denominator',
      },
    },
  ],
  evidenceSynthesis: {
    currentState: 'Direct recent biomass measurements show continued low flying-insect biomass at 21 German protected areas in 2020–2021. A broader synthesis shows declining terrestrial insect abundance across the available long-term studies, but it excludes biomass-only records and is geographically biased.',
    metricBoundary: 'Abundance counts individuals; biomass measures their combined mass. They are related but not interchangeable. Neither is a direct measure of all insect ecological functions.',
    geographicBoundary: 'The broad abundance synthesis cannot be extrapolated to a global mean condition. The direct biomass studies are regional German evidence.',
    methodologicalBoundary: 'Published analyses disagree about how much weather explains the German time series. TULIP uses the observed condition as evidence and does not assign the decline to one driver.',
    temporalBoundary: 'Study duration and monitoring-record length are not ecosystem recovery time. Annual trend rates are not converted into a global current-loss percentage.',
    humanBoundary: 'These sources do not quantify direct human illness, lost basic needs, displacement or material loss attributable to this node. Pollination and food effects remain downstream relationship evidence.',
  },
  tulipUse: {
    admissible: [
      'Use the recent standardized German biomass observations as direct regional ecosystem-condition evidence.',
      'Use the abundance synthesis as corroborating trend evidence while keeping abundance distinct from biomass.',
      'Use the geographic and methodological limitations to bound severity and reach rather than as reasons to erase the numerical score.',
      'Use the repeated low German biomass state as support for multi-year persistence, without equating monitoring span with recovery time.',
    ],
    excluded: [
      'Do not describe the -1.49% annual abundance trend as a global insect-biomass trend.',
      'Do not compound the annual abundance trend into a global current-loss percentage.',
      'Do not use the 69% or 74% study-location shares as ecosystem reach.',
      'Do not use 9–64 years of observation as consequence persistence or recovery time.',
      'Do not generalize the German 76% historical decline to every ecosystem or use it as global reach.',
      'Do not score indirect crop, food or livelihood pathways as direct human harm in this node.',
      'Do not attribute the observed decline to climate, farming or weather without a compatible counterfactual attribution model.',
    ],
    proposedAxes: {
      applicableDomains: ['ecosystem'],
      ecosystem: {
        severity: { lower: 2, central: 3, upper: 4 },
        reach: { lower: 1, central: 2, upper: 3 },
        persistence: { lower: 2, central: 3, upper: 4 },
      },
      confidence: 'C',
    },
  },
};
snapshot.snapshotDigest = createHash('sha256').update(JSON.stringify({
  sources: snapshot.sources,
  evidenceSynthesis: snapshot.evidenceSynthesis,
  tulipUse: snapshot.tulipUse,
})).digest('hex');

await writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({ output, sources: snapshot.sources.length, snapshotDigest: snapshot.snapshotDigest }, null, 2));
