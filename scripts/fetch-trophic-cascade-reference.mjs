import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'artifacts/tulip-calibration-2026-09-22/trophic-cascade-reference-snapshot.json');
const checkedOn = '2026-09-23';

const endpoints = {
  coastalMarine: 'https://api.crossref.org/works/10.3354/meps13430',
  freshwater: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1002/ecy.3370&format=json&resultType=core',
  terrestrial: 'https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=DOI:10.1038/s41559-024-02327-6&format=json&resultType=core',
};

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0 (compatible; TULIP evidence ingestion; source verification)' } });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}

// These public metadata services rate-limit bursts, so keep the three small
// verification requests sequential and reproducible.
const marineResponse = await fetchJson(endpoints.coastalMarine);
const freshwaterResponse = await fetchJson(endpoints.freshwater);
const terrestrialResponse = await fetchJson(endpoints.terrestrial);
const marine = marineResponse.message;
const freshwater = freshwaterResponse.resultList.result[0];
const terrestrial = terrestrialResponse.resultList.result[0];
const clean = text => text?.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() ?? '';
const marineAbstract = clean(marine.abstract);
const freshwaterAbstract = clean(freshwater.abstractText);
const terrestrialAbstract = clean(terrestrial.abstractText);

assert.equal(marine.DOI, '10.3354/meps13430');
assert.match(marineAbstract, /experimental \(n = 17\) and observational \(n = 22\) studies/i);
assert.match(marineAbstract, /147 predator-herbivore-producer measurements/i);
assert.match(marineAbstract, /decreased herbivore populations between 2\.1-4\.76 times/i);
assert.match(marineAbstract, /increased producer populations by 1\.62-2\.83 times/i);

assert.equal(freshwater.doi, '10.1002/ecy.3370');
assert.match(freshwaterAbstract, /synthesized 161 global sites/i);
assert.match(freshwaterAbstract, /eutrophication, warming, and predator abundance strengthen/i);
assert.match(freshwaterAbstract, /experimental duration has an accumulative effect/i);

assert.equal(terrestrial.doi, '10.1038/s41559-024-02327-6');
assert.match(terrestrialAbstract, /297 studies and 5,990 individual observations across six continents/i);
assert.match(terrestrialAbstract, /Despite large variability in megafauna effects/i);
assert.match(terrestrialAbstract, /Other responses \(14 out of 26\).+were not significantly affected/i);

const snapshot = {
  version: 'tulip_trophic_cascade_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'internal_reference_ingestion_not_public_rating_data',
  productionRatingsEnabled: 0,
  nodeId: 'trophic_cascade_collapses',
  sources: [
    {
      id: 'eger_baum_coastal_trophic_cascade_meta_analysis_2020',
      title: marine.title[0],
      publisher: `${marine.publisher}; peer-reviewed meta-analysis`,
      doi: `https://doi.org/${marine.DOI}`,
      publicationDate: '2020-12-10',
      metric: 'conditional predator effects on herbivore and primary-producer biomass, abundance or density in coastal benthic systems',
      facts: {
        experimentalStudies: 17,
        observationalStudies: 22,
        independentLocations: 67,
        countries: 13,
        predatorHerbivoreProducerMeasurements: 147,
        herbivoreDecreaseFactor: { lower: 2.1, upper: 4.76 },
        producerIncreaseFactor: { lower: 1.62, upper: 2.83 },
        marineReserveHerbivoreDecreaseFactorAverage: 2.83,
        marineReserveProducerIncreaseFactorAverage: 1.9,
        boundary: 'The effect sizes compare systems with and without predators. They quantify conditional local cascade strength, not the share of the world ocean currently disrupted.',
      },
    },
    {
      id: 'su_freshwater_trophic_cascade_global_analysis_2021',
      title: freshwater.title,
      publisher: 'Ecology; peer-reviewed global meta-analysis',
      doi: `https://doi.org/${freshwater.doi}`,
      publicationDate: '2021-06-01',
      metric: 'strength and moderators of fish-driven consumer-resource interactions in freshwater systems',
      facts: {
        globalSites: 161,
        affectedResponses: ['zooplankton', 'water clarity', 'primary producers', 'water nutrients'],
        moderators: ['eutrophication', 'warming', 'predator abundance', 'predator trophic level', 'experimental duration'],
        finding: 'Cascade direction and strength vary with food-web structure and environmental context; warming and eutrophication can strengthen some phytoplankton responses.',
        boundary: 'The site synthesis demonstrates cross-site mechanisms and heterogeneity, not a global prevalence denominator or a continuous current-condition census.',
      },
    },
    {
      id: 'trepel_wild_megafauna_ecosystem_meta_analysis_2024',
      title: terrestrial.title,
      publisher: 'Nature Ecology & Evolution; peer-reviewed global meta-analysis',
      doi: `https://doi.org/${terrestrial.doi}`,
      publicationDate: '2024-02-09',
      metric: 'conditional effects of wild herbivorous megafauna on terrestrial ecosystem structure, processes and spatial heterogeneity',
      facts: {
        studies: 297,
        observations: 5990,
        continents: 6,
        responseCategories: 26,
        nonSignificantResponseCategories: 14,
        finding: 'Large herbivores significantly altered some soil, vegetation and smaller-animal responses, while more than half of the assessed response categories were not significantly affected.',
        boundary: 'The synthesis shows large response variability and taxon-specific effects. Study coverage across continents is not the proportion of terrestrial ecosystems currently disrupted.',
      },
    },
  ],
  evidenceSynthesis: {
    ecosystemSeverity: 'At documented sites, changing consumers can produce large shifts in herbivore and producer abundance or biomass. These are component responses rather than a universal percentage of ecosystem function lost or collapse.',
    ecosystemReach: 'Evidence spans marine, freshwater and terrestrial systems, but study counts, locations and continents are sampling coverage. None of the syntheses estimates the fraction of global ecosystems currently undergoing a harmful trophic disruption.',
    ecosystemPersistence: 'The freshwater synthesis finds that measured cascade strength can accumulate with experiment duration, but no source provides a comparable recovery-time distribution. Study duration is not consequence persistence.',
    humanDomain: 'The ingested sources do not quantify deaths, illness, displacement, essential-service interruption, food loss or material loss attributable directly to trophic-cascade disruption. Human pathways remain in separately scored downstream nodes.',
    directionBoundary: 'The effect of a consumer is not inherently beneficial or harmful. Harm must be judged against an ecosystem-specific reference condition; predator addition, predator removal and herbivore restoration can move different systems in different directions.',
  },
  tulipUse: {
    admissible: [
      'Use conditional herbivore and producer response magnitudes as ecosystem-severity evidence for documented systems.',
      'Use the three cross-ecosystem syntheses to establish that trophic cascades occur in marine, freshwater and terrestrial settings and that their strength is context dependent.',
      'Use the large response variability and non-significant response categories to keep severity bounds open.',
      'Use experiment-duration findings only as evidence that effects can persist or accumulate during observation, not as a recovery-time conversion.',
    ],
    excluded: [
      'Do not convert study counts, sites, countries, locations or continents into ecosystem reach.',
      'Do not treat a predator effect as harm without an ecosystem-specific reference condition and direction.',
      'Do not average marine, freshwater and terrestrial effect sizes into a single global loss percentage.',
      'Do not treat experimental or publication duration as ecological recovery time.',
      'Do not infer a harmed-person count or human severity from ecosystem-service pathways or graph connections.',
      'Do not interpret conditional effect sizes as the current prevalence of trophic-cascade disruption.',
    ],
    proposedAxes: {
      applicableDomains: ['ecosystem'],
      ecosystem: {
        severity: { lower: 2, central: 3, upper: 4 },
        reach: { lower: 0, central: 1, upper: 2 },
        persistence: { lower: 1, central: 2, upper: 3 },
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
