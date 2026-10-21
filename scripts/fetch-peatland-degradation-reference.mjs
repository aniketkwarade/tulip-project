import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'artifacts/tulip-calibration-2026-09-22/peatland-degradation-reference-snapshot.json');
const checkedOn = '2026-09-23';
const unepSnapshot = JSON.parse(await readFile(resolve(root, 'public/unep-peatlands-impact-snapshot.json'), 'utf8'));

const endpoints = {
  restorationArticle: 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC11599035/fullTextXML',
  restorationRepository: 'https://zenodo.org/api/records/13929067',
};

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; TULIP evidence ingestion; source verification)' } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

const [restorationXml, repositoryJson] = await Promise.all([
  fetchText(endpoints.restorationArticle),
  fetchText(endpoints.restorationRepository),
]);
const repository = JSON.parse(repositoryJson);

assert.equal(unepSnapshot.assessment.drained_or_degraded_current_peatlands_pct, 12);
assert.equal(unepSnapshot.assessment.intact_peatland_destroyed_annually_hectares, 500000);
assert.match(unepSnapshot.uncertainty, /mapping and condition inventories remain incomplete/i);

for (const pattern of [
  /data comprise 151 sites, representing six ecosystem types/i,
  /before, two, five, and ten years after restoration/i,
  /not restoring leads to further degradation/i,
  /ten-year study period is insufficient to capture the restoration effects in slow-recovering ecosystems/i,
  /species abundances did not equal those in the reference pristine controls/i,
]) assert.match(restorationXml, pattern);

assert.equal(repository.id, 13929067);
const speciesFile = repository.files.find(file => file.key === 'species_data.csv');
assert(speciesFile);
assert.equal(speciesFile.checksum, 'md5:6d1545a85319ccdb1568ba0a14444927');

const snapshot = {
  version: 'tulip_peatland_degradation_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'internal_reference_ingestion_not_public_rating_data',
  productionRatingsEnabled: 0,
  nodeId: 'peatland_degradations',
  sources: [
    {
      id: 'unep_global_peatlands_assessment_2022',
      title: 'Global Peatlands Assessment: The State of the World’s Peatlands',
      publisher: unepSnapshot.source.publisher,
      url: unepSnapshot.source.assessment_url,
      publicationDate: '2022-11-17',
      metric: 'global share of current peatlands reported as drained or degraded',
      facts: {
        sourceSnapshotVersion: unepSnapshot.version,
        assessmentYear: unepSnapshot.assessment.assessment_year,
        drainedOrDegradedCurrentPeatlandsPct: unepSnapshot.assessment.drained_or_degraded_current_peatlands_pct,
        intactPeatlandDestroyedAnnuallyHectares: unepSnapshot.assessment.intact_peatland_destroyed_annually_hectares,
        countriesWithPeatlands: unepSnapshot.assessment.countries_with_peatlands,
        mappingBoundary: unepSnapshot.uncertainty,
      },
    },
    {
      id: 'elo_boreal_peatland_restoration_2024',
      title: 'Restoration of forestry-drained boreal peatland ecosystems can effectively stop and reverse ecosystem degradation',
      publisher: 'Communications Earth & Environment; peer-reviewed open-access controlled experiment',
      articleUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11599035/',
      doi: 'https://doi.org/10.1038/s43247-024-01844-3',
      publicationDate: '2024-11-26',
      dataRepository: 'https://doi.org/10.5281/zenodo.13929067',
      repositoryFileChecksum: speciesFile.checksum,
      metric: 'peatland vegetation-community recovery after restoration compared with drained and pristine controls',
      facts: {
        sites: 151,
        ecosystemTypes: 6,
        geography: 'Finland across southern, central and northern boreal zones',
        observationsAfterRestorationYears: [0, 2, 5, 10],
        completeFourSamplingSeriesSites: 144,
        finding: 'Restoration generally stopped and reversed further vegetation-community degradation, but recovery varied by ecosystem type and did not reach pristine reference composition after ten years.',
        globalRepresentativeness: false,
      },
    },
  ],
  evidenceSynthesis: {
    currentState: 'UNEP reports about 12% of current peatlands as drained or degraded. That is an affected-area measure, not the percentage of ecological function lost at every affected site.',
    severityBoundary: 'Drainage and degradation can materially alter peatland hydrology, vegetation and carbon function, but the global 12% statistic does not measure local condition magnitude.',
    reachBoundary: 'The 12% global peatland share is compatible with ecosystem reach, subject to UNEP’s incomplete global mapping and condition inventories.',
    persistenceBoundary: 'A controlled boreal experiment found only partial community recovery after ten years. It supports slow recovery, but does not prove a universal 120-year duration or irreversibility.',
    geographicBoundary: 'The recovery experiment covers boreal Finnish peatlands and cannot establish recovery time for every tropical, mountain or permafrost peatland.',
    humanBoundary: 'The admitted sources describe ecosystem condition and restoration. They do not quantify direct illness, displacement, basic-needs loss or material loss attributable to this node.',
  },
  tulipUse: {
    admissible: [
      'Use the UNEP 12% drained-or-degraded share as ecosystem reach with uncertainty for incomplete inventories.',
      'Use the controlled ten-year restoration experiment to support multi-year ecosystem persistence and an open upper bound.',
      'Use documented drainage-related ecosystem alteration as qualitative severity evidence without converting the reach percentage into severity.',
    ],
    excluded: [
      'Do not use the 12% affected share as a 12% loss of condition within each peatland.',
      'Do not divide the 12% affected share by the annual 0.1% loss estimate to create a 120-year recovery or consequence duration.',
      'Do not use the 4% emissions share as ecosystem severity or add the Carbon Emissions score.',
      'Do not use countries containing peatland as the fraction of peatland harmed.',
      'Do not generalize the Finnish recovery result to every peatland type without retaining geographic and ecosystem-type uncertainty.',
      'Do not score ecosystem services as direct human harm without a compatible measured human consequence.',
    ],
    proposedAxes: {
      applicableDomains: ['ecosystem'],
      ecosystem: {
        severity: { lower: 2, central: 3, upper: 4 },
        reach: { lower: 2, central: 3, upper: 3 },
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
