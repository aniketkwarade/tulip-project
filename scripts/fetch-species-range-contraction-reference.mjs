import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'species-range-contraction-reference-snapshot.json');
const checkedOn = '2026-09-24';
const execFileAsync = promisify(execFile);
const hash = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
const digest = value => hash('sha256', JSON.stringify(value));

const files = {
  wiensData: {
    url: 'https://journals.plos.org/plosbiology/article/file?type=supplementary&id=info:doi/10.1371/journal.pbio.2001104.s001',
    bytes: 77_583,
    sha256: '36e6428ae3b256b7a6517b20762cd1c9b6805582c487a6cf2958626ed1c65ae7',
  },
  mammalArticle: {
    url: 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC7275054/fullTextXML',
    bytes: 113_714,
    sha256: '453920b6a38ff0f3fb1b6b024e278fffcb0403f145febed713c1254fd6f51de0',
  },
  greatBritainArticle: {
    url: 'https://www.ebi.ac.uk/europepmc/webservices/rest/PMC10616271/fullTextXML',
    bytes: 105_337,
    sha256: 'd4475f575158723323fc850bebc32ea6d8d46682444ed099b59923932a1cbca9',
  },
};

async function fetchPinned(source, label) {
  const response = await fetch(source.url, {
    signal: AbortSignal.timeout(120_000),
    headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+species-range-evidence-ingestion)' },
  });
  assert(response.ok, `${label}: HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert.equal(body.length, source.bytes, `${label}: byte size changed`);
  assert.equal(hash('sha256', body), source.sha256, `${label}: checksum changed`);
  return body;
}

const [wiensWorkbook, mammalXmlBuffer, greatBritainXmlBuffer] = await Promise.all([
  fetchPinned(files.wiensData, 'Wiens supporting workbook'),
  fetchPinned(files.mammalArticle, 'Pacifici et al. full text'),
  fetchPinned(files.greatBritainArticle, 'Suggitt et al. full text'),
]);

const temporaryDirectory = await mkdtemp(path.join(tmpdir(), 'tulip-species-range-'));
const workbookPath = path.join(temporaryDirectory, 'wiens-local-extinctions.xlsx');
await writeFile(workbookPath, wiensWorkbook);
const [{ stdout: stringsXml }, { stdout: dataXml }] = await Promise.all([
  execFileAsync('unzip', ['-p', workbookPath, 'xl/sharedStrings.xml'], { encoding: 'utf8', maxBuffer: 5_000_000 }),
  execFileAsync('unzip', ['-p', workbookPath, 'xl/worksheets/sheet2.xml'], { encoding: 'utf8', maxBuffer: 5_000_000 }),
]);

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

const sharedStrings = [...stringsXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match =>
  decodeXml([...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(text => text[1]).join('')),
);
const rows = [...dataXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)].map(rowMatch => {
  const row = {};
  for (const cell of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
    const reference = cell[1].match(/\br="([A-Z]+)\d+"/)?.[1];
    const value = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
    if (!reference || value === undefined) continue;
    row[reference] = /\bt="s"/.test(cell[1]) ? sharedStrings[Number(value)] : Number(value);
  }
  return row;
});
assert.equal(rows.length, 977, 'Wiens workbook should contain one header row and 976 species rows');
assert.deepEqual(
  ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map(column => rows[0][column]),
  ['Reference', 'Species', 'Taxonomic group', 'Latitude or elevation', 'Warm edge', 'Local extinction', 'Cool edge'],
);
const speciesRows = rows.slice(1);
const count = (column, value) => speciesRows.filter(row => row[column] === value).length;
const wiensFacts = {
  species: speciesRows.length,
  studies: new Set(speciesRows.map(row => row.A)).size,
  localExtinction: count('F', 'Local extinction'),
  persistedAtWarmEdge: count('F', 'Persisting'),
  coolEdgeExpansion: count('G', 'Expansion') + count('G', 'Stable/Expansion'),
  coolEdgeStable: count('G', 'Stable'),
  coolEdgeContraction: count('G', 'Contraction'),
  coolEdgeMeasuredSpecies: count('G', 'Expansion') + count('G', 'Stable/Expansion') + count('G', 'Stable') + count('G', 'Contraction'),
};
assert.deepEqual(wiensFacts, {
  species: 976,
  studies: 27,
  localExtinction: 460,
  persistedAtWarmEdge: 516,
  coolEdgeExpansion: 367,
  coolEdgeStable: 371,
  coolEdgeContraction: 166,
  coolEdgeMeasuredSpecies: 904,
});

const mammalXml = mammalXmlBuffer.toString('utf8');
for (const phrase of [
  'past (1970s) and current (2017) distribution of 204 species',
  '40 species (20%) show a large decrease',
  '65 (32%) moderate decreases',
  '57 species (28%) remained relatively stable',
  'only about 5% of all terrestrial non-volant mammals',
]) assert(mammalXml.includes(phrase), `Pacifici et al. fact changed: ${phrase}`);

const greatBritainXml = greatBritainXmlBuffer.toString('utf8');
for (const phrase of [
  'n</italic>\u2009=\u20091192 species total',
  'increased persistence probability for 40% of species',
  'decreased it for 12%',
  '1930−1972 ‘historical’ and a 2000−2015 ‘modern’ period',
]) assert(greatBritainXml.includes(phrase), `Suggitt et al. fact changed: ${phrase}`);

const snapshot = {
  version: 'tulip_species_range_contraction_reference_2026_09_24_v1',
  generatedOn: checkedOn,
  status: 'direct_range_loss_and_sampling_limits_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Measure observed loss of occupied range while keeping sampled-species share, range-loss magnitude, ecosystem extent, attribution and recovery time separate.',
  sources: {
    globalMammals: {
      id: 'pacifici_global_mammal_range_change_2020',
      publisher: 'Nature Communications',
      title: 'Global correlates of range contractions and expansions in terrestrial mammals',
      publicationDate: '2020-06-05',
      doi: 'https://doi.org/10.1038/s41467-020-16684-w',
      pmcid: 'PMC7275054',
      file: files.mammalArticle,
      checkedOn,
    },
    localExtinctions: {
      id: 'wiens_climate_related_local_extinctions_2016',
      publisher: 'PLOS Biology',
      title: 'Climate-Related Local Extinctions Are Already Widespread among Plant and Animal Species',
      publicationDate: '2016-12-08',
      doi: 'https://doi.org/10.1371/journal.pbio.2001104',
      file: files.wiensData,
      checkedOn,
    },
    greatBritain: {
      id: 'suggitt_great_britain_range_change_2023',
      publisher: 'Nature Communications',
      title: "Linking climate warming and land conversion to species' range changes across Great Britain",
      publicationDate: '2023-10-30',
      doi: 'https://doi.org/10.1038/s41467-023-42475-0',
      pmcid: 'PMC10616271',
      file: files.greatBritainArticle,
      checkedOn,
    },
    ipcc: {
      id: 'ipcc_ar6_wgii_species_range_changes_2022',
      publisher: 'Intergovernmental Panel on Climate Change',
      title: 'Climate Change 2022: Impacts, Adaptation and Vulnerability, Chapter 2',
      publicationDate: '2022',
      url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/',
      checkedOn,
    },
  },
  currentWindow: {
    start: 2017,
    end: 2017,
    coverageStatus: 'partial',
    summaryMethod: 'end_state_stock',
    coverageNote: 'The latest compatible global range-loss endpoint located is the 2017 IUCN-map comparison for 204 terrestrial non-flying mammals. The 2023 Great Britain study uses a modern observation period ending in 2015. Publication year is not substituted for observation year.',
  },
  endpoints: {
    globalMammalRangeChange: {
      geography: 'All terrestrial biogeographic realms represented; 204 terrestrial non-volant mammal species.',
      reference: 'Expert-reviewed 1970s range maps.',
      currentState: '2017 IUCN range maps.',
      sampleShareOfTerrestrialNonVolantMammalsPercentApproximate: 5,
      species: 204,
      largeDecreaseOver50Percent: { species: 40, samplePercent: 20 },
      moderateDecrease5To49Percent: { species: 65, samplePercent: 32 },
      stableWithin5Percent: { species: 57, samplePercent: 28 },
      moderateIncrease5To49Percent: { species: 39, samplePercent: 19 },
      largeIncreaseOver50Percent: { species: 4, samplePercent: 2 },
      interpretation: 'This directly measures loss of former occupied range in a broad mammal sample. The sample share is not the fraction of global ecosystem area affected, and the range-loss distribution is not a recovery-duration measure.',
    },
    multiTaxonWarmEdgeLoss: {
      geography: 'Twenty-seven studies across Asia, Europe, North America, South America, Madagascar and Oceania.',
      ...wiensFacts,
      localExtinctionPercent: Number((100 * wiensFacts.localExtinction / wiensFacts.species).toFixed(1)),
      interpretation: 'The source records at least one warm-edge local extinction in 460 selected species. It does not show that 47.1% of all species, 47.1% of every species range or 47.1% of global habitat has been lost.',
    },
    greatBritainHeterogeneity: {
      geography: 'Great Britain, 2,911 ten-by-ten-kilometre grid squares.',
      modernObservationPeriod: { start: 2000, end: 2015 },
      species: 1_192,
      taxonomicGroups: ['birds', 'butterflies', 'macromoths', 'plants'],
      environmentalChangeAssociatedWithHigherPersistencePercent: 40,
      environmentalChangeAssociatedWithLowerPersistencePercent: 12,
      interpretation: 'Climate warming and land conversion were associated with both contractions and expansions. This regional result prevents a one-direction global assumption and cannot set global reach.',
    },
    compatibleDirectHumanConsequence: null,
    compatibleGlobalAffectedEcosystemAreaPercent: null,
    compatibleRecoveryTimeDistribution: null,
  },
  tulipUse: {
    admitted: [
      'Use the mammal comparison as direct evidence that material and large occupied-range losses occur within affected species.',
      'Use the warm-edge synthesis as corroboration that local population loss spans taxa, habitats and regions.',
      'Use the Great Britain study to retain response heterogeneity and the possibility of expansion as well as contraction.',
      'Use the IPCC assessment for the high-confidence climate-related range-change mechanism and attribution boundary.',
    ],
    prohibited: [
      'Do not use the share of sampled species with contraction or local extinction as the share of global ecosystem distribution affected.',
      'Do not use study count, continent count, map coverage, observation duration or publication year as severity, reach or persistence.',
      'Do not interpret range shifts as contractions; leading-edge expansion can occur with or without warm-edge loss.',
      'Do not copy downstream biodiversity-intactness, extinction, food, livelihood or cultural consequences into this node.',
      'Do not assign direct human harm without a compatible attributable terminal human consequence.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'species_range_compression',
      rating: 'C 5.5',
      uncertainty: 'B 3.3 to D 7.8',
      confidence: 'C',
      domains: ['ecosystem'],
      axes: {
        ecosystem: {
          lower: { severity: 1, reach: 1, persistence: 1 },
          central: { severity: 2, reach: 2, persistence: 2 },
          upper: { severity: 3, reach: 2, persistence: 4 },
        },
      },
      reason: 'Direct studies establish material to large loss of occupied range and local populations across taxa and regions. They do not provide a compatible global affected-area denominator or recovery-time distribution, so the previous D central rating is reduced and the upper reach level is capped.',
    },
  },
  unresolvedForTulip: [
    'Build repeated, method-compatible global range maps across representative species and ecosystems through a recent common endpoint.',
    'Report the fraction of each species distribution lost and the affected share of relevant ecosystem distributions without substituting sampled-species share.',
    'Measure recolonization or recovery duration after a contraction and distinguish temporary non-detection from local extinction.',
    'Allocate climate, land conversion, exploitation, invasive species and other pressures without counting their downstream endpoint nodes again.',
  ],
};
snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, status: snapshot.status, recommendation: snapshot.tulipUse.currentCatalogueRecommendation, digest: snapshot.snapshotDigest }, null, 2));
