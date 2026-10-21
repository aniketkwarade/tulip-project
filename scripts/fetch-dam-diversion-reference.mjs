import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'artifacts/tulip-calibration-2026-09-22/dam-diversion-reference-snapshot.json');
const checkedOn = '2026-09-23';
const riverSnapshot = JSON.parse(await readFile(resolve(root, 'public/global-river-connectivity-impact-snapshot.json'), 'utf8'));

const endpoints = {
  fishConnectivity: 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC7035475/fullTextXML',
  nearbyPeopleAndEconomy: 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC8872755/fullTextXML',
  migrantMetaAnalysis: 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC12407043/fullTextXML',
  freshwaterBiodiversity: 'https://api.crossref.org/works/10.1038/s43247-026-03263-y',
};

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; TULIP evidence ingestion; source verification)' } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.text();
}

const [fishXml, humanXml, metaXml, biodiversityJson] = await Promise.all([
  fetchText(endpoints.fishConnectivity),
  fetchText(endpoints.nearbyPeopleAndEconomy),
  fetchText(endpoints.migrantMetaAnalysis),
  fetchText(endpoints.freshwaterBiodiversity),
]);
const biodiversity = JSON.parse(biodiversityJson).message;
const biodiversityAbstract = biodiversity.abstract.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

for (const pattern of [
  /9,794 lotic freshwater fish species/i,
  /39,912 large dams worldwide/i,
  /73 ± 28% for nondiadromous and 86 ± 19% for diadromous species/i,
]) assert.match(fishXml, pattern);

for (const pattern of [
  /631 recently built hydropower dams/i,
  /associated with reduced local economy, population, and greenness/i,
  /within 50 km of the dam sites/i,
  /more than one-third of global gross domestic production/i,
  /almost one-third of global population/i,
]) assert.match(humanXml, pattern);

for (const pattern of [
  /16 publications covering 38 fish species/i,
  /61 comparisons/i,
  /pooled estimate.{0,80}−0\.771/is,
  /between one and 11.{0,30}years/i,
]) assert.match(metaXml, pattern);

assert.equal(biodiversity.DOI, '10.1038/s43247-026-03263-y');
assert.match(biodiversityAbstract, /threatened freshwater species are consistently more common near dams than elsewhere/i);
assert.match(biodiversityAbstract, /Most species whose risk status changed between 1996 and 2022 shifted toward higher threat levels/i);

assert.equal(riverSnapshot.assessment.rivers_over_1000km_not_free_flowing_pct, 63);
assert.equal(riverSnapshot.assessment.inland_fisheries_population_service_scope_million, 158);

const snapshot = {
  version: 'tulip_dam_diversion_reference_2026_09_23_v2',
  generatedOn: checkedOn,
  status: 'internal_reference_ingestion_not_public_rating_data',
  productionRatingsEnabled: 0,
  nodeId: 'dam_and_diversion_infrastructure',
  appliesToNodeIds: ['dam_and_diversion_infrastructure', 'riverine_habitat_fragmentation'],
  sources: [
    {
      id: 'global_free_flowing_rivers_assessment_2019',
      title: riverSnapshot.source.name,
      publisher: riverSnapshot.source.publisher,
      articleUrl: riverSnapshot.source.study_url,
      pubMedUrl: riverSnapshot.source.pubmed_url,
      publicationDate: '2019-05-08',
      metric: 'connectivity status of the mapped global river network, with a reported subset for rivers longer than 1,000 kilometres',
      facts: {
        mappedRiverNetworkMillionKm: riverSnapshot.assessment.global_river_network_million_km,
        longRiversNotFreeFlowingPct: riverSnapshot.assessment.rivers_over_1000km_not_free_flowing_pct,
        longRiversUninterruptedToOceanPct: riverSnapshot.assessment.long_rivers_flowing_uninterrupted_to_ocean_pct,
        inlandFisheriesServiceExposureMillionPeople: riverSnapshot.assessment.inland_fisheries_population_service_scope_million,
        exposureIsNotHarm: true,
      },
    },
    {
      id: 'barbarossa_global_fish_range_connectivity_2020',
      title: 'Impacts of current and future large dams on the geographic range connectivity of freshwater fish worldwide',
      publisher: 'Proceedings of the National Academy of Sciences; peer-reviewed global geospatial analysis',
      articleUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7035475/',
      doi: 'https://doi.org/10.1073/pnas.1912776117',
      publicationDate: '2020-02-03',
      metric: 'species-level connectivity of mapped geographic ranges for lotic freshwater fishes',
      facts: {
        assessedLoticFishSpecies: 9794,
        mappedExistingLargeDams: 39912,
        nondiadromousMeanConnectivityPct: 73,
        nondiadromousConnectivityStandardDeviationPct: 28,
        diadromousMeanConnectivityPct: 86,
        diadromousConnectivityStandardDeviationPct: 19,
        impliedMeanConnectivityLossPct: { nondiadromous: 27, diadromous: 14 },
        smallDamBoundary: 'The global analysis omits the additional cumulative effect of small dams because no consistent global inventory was available.',
      },
    },
    {
      id: 'zhang_recent_hydropower_nearby_impacts_2022',
      title: 'Recently constructed hydropower dams were associated with reduced economic production, population, and greenness in nearby areas',
      publisher: 'Proceedings of the National Academy of Sciences; peer-reviewed global spatial study',
      articleUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8872755/',
      doi: 'https://doi.org/10.1073/pnas.2108038119',
      publicationDate: '2022-02-07',
      metric: 'changes in population, economic production, urban land and greenness within 50 kilometres of recently commissioned hydropower dams',
      facts: {
        impactStudyDams: 631,
        damConstructionStart: 2001,
        latestCommissioningYear: 2015,
        regions: ['Africa', 'Asia', 'Europe', 'North America', 'South America'],
        postCommissionComparisonYears: 3,
        finding: 'Recently constructed dams were associated with reduced local economic production, population and greenness, with important regional and dam-size differences.',
        nearbyGlobalPopulationShareIsExposureOnly: 'Almost one-third of the global population lived within 50 kilometres of the 7,155 mapped hydropower dams; the study did not identify that population as harmed.',
      },
    },
    {
      id: 'tamario_diadromous_fragmentation_meta_analysis_2025',
      title: 'Global consequences of dam-induced river fragmentation on diadromous migrants: a systematic review and meta-analysis',
      publisher: 'Biological Reviews; peer-reviewed open-access systematic review and meta-analysis',
      articleUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12407043/',
      doi: 'https://doi.org/10.1111/brv.70032',
      publicationDate: '2025-05-07',
      metric: 'abundance, richness, assemblage and genetic responses of diadromous animals to fragmentation, fish passes and dam removal',
      facts: {
        fragmentationMetaAnalysisPublications: 16,
        fragmentationMetaAnalysisFishSpecies: 38,
        fragmentationComparisons: 61,
        aboveVersusBelowPooledAbundanceAndGeneticDiversityEffect: -0.771,
        aboveVersusBelowEffect95PctCI: { lower: -1.195, upper: -0.348 },
        damRemovalPositiveResponseYears: { lower: 1, upper: 11 },
        geographicBoundary: 'Most evidence comes from temperate North America, Europe and Japan; tropical freshwater biodiversity hotspots remain poorly represented.',
      },
    },
    {
      id: 'zhang_global_hydropower_freshwater_biodiversity_2026',
      title: biodiversity.title[0],
      publisher: biodiversity.publisher,
      doi: `https://doi.org/${biodiversity.DOI}`,
      publicationDate: '2026-02-09',
      metric: 'spatial association between current and planned dams, freshwater-species distributions and IUCN threat status',
      facts: {
        assessedGroups: ['fish', 'mollusks', 'mammals', 'odonates', 'amphibians'],
        threatStatusPeriod: { start: 1996, end: 2022 },
        finding: 'Threatened freshwater species were more common near dams and most species with a changed IUCN category moved toward higher threat levels in dam-influenced areas.',
        causalBoundary: 'The study explicitly does not establish dams as the sole cause of each species-status change.',
      },
    },
  ],
  evidenceSynthesis: {
    humanSeverity: 'The 2022 study supports material local economic and population consequences around recently commissioned dams, but it reports associations and mixed regional outcomes rather than a globally attributable loss total.',
    humanReach: 'The 158 million people supported by inland fisheries and the population living near dams measure service dependence or proximity. Neither is a count of people harmed by dams.',
    humanPersistence: 'The 2022 comparison detects consequences three years after commissioning. It supports multi-year persistence without proving that every human consequence lasts decades.',
    ecosystemSeverity: 'Species-level modelling and the meta-analysis directly support reduced range connectivity, abundance and genetic diversity. Connectivity loss is not automatically equal to population loss or extinction.',
    ecosystemReach: 'Sixty-three percent of rivers longer than 1,000 kilometres are not free-flowing, supporting broad network reach. That subset does not describe every smaller river or every species.',
    ecosystemPersistence: 'Dam-removal studies report positive fish responses within one to eleven years, with substantial taxonomic and geographic gaps. This supports multi-year recovery while withholding a universal irreversibility claim.',
    attributionBoundary: 'Dams can provide water, energy and flood-management benefits. TULIP scores documented adverse consequences rather than net social value, and does not assign every freshwater decline near a dam to the dam.',
  },
  tulipUse: {
    admissible: [
      'Use the 63% long-river statistic as ecosystem reach with a smaller-river coverage caveat.',
      'Use fish-range connectivity and the diadromous-fish meta-analysis for ecosystem severity and persistence, retaining taxonomic and geographic limits.',
      'Use the 631-dam study for human severity and multi-year persistence, without converting proximity into harmed-person reach.',
      'Use the 2026 multi-taxon study as corroboration and an attribution boundary rather than a dam-only extinction count.',
    ],
    excluded: [
      'Do not count 158 million inland-fisheries beneficiaries as 158 million people harmed by dams.',
      'Do not count almost one-third of the global population living within 50 kilometres of a hydropower dam as harmed people.',
      'Do not reuse the 63% long-river share as ecosystem severity.',
      'Do not interpret fish-range connectivity loss as the same percentage decline in fish abundance, richness or ecosystem function.',
      'Do not use study duration, publication age or dam age as consequence persistence.',
      'Do not treat association near dams as proof that dams caused every observed human or species change.',
    ],
    proposedAxes: {
      applicableDomains: ['human', 'ecosystem'],
      human: {
        severity: { lower: 1, central: 2, upper: 3 },
        reach: { lower: 1, central: 2, upper: 3 },
        persistence: { lower: 2, central: 3, upper: 3 },
      },
      ecosystem: {
        severity: { lower: 1, central: 2, upper: 3 },
        reach: { lower: 3, central: 3, upper: 4 },
        persistence: { lower: 2, central: 3, upper: 3 },
      },
      confidence: 'C',
    },
    riverineHabitatFragmentationAxes: {
      applicableDomains: ['ecosystem'],
      ecosystem: {
        severity: { lower: 1, central: 2, upper: 3 },
        reach: { lower: 3, central: 3, upper: 4 },
        persistence: { lower: 2, central: 3, upper: 3 },
      },
      confidence: 'C',
      boundary: 'This node scores fragmentation and the directly measured freshwater-biota response. Nearby population, economic effects, fisheries dependence and the benefits of dams remain outside this ecosystem-only boundary.',
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
