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
  'isimip-ecosystem-counterfactual-inventory.json',
);
const apiRoot = 'https://data.isimip.org/api/v1/datasets/';

const queryUrl = (tree, climateScenario, pageSize = 100) => {
  const url = new URL(apiRoot);
  url.searchParams.set('tree', tree);
  if (climateScenario) url.searchParams.set('climate_scenario', climateScenario);
  url.searchParams.set('page_size', String(pageSize));
  return url.href;
};

const fetchJson = async url => {
  const response = await fetch(url, {
    headers: { accept: 'application/json' },
  });
  assert(response.ok, `ISIMIP request failed (${response.status}) for ${url}`);
  return response.json();
};

const fetchAll = async url => {
  const rows = [];
  let currentUrl = url;
  let reportedCount = null;
  while (currentUrl) {
    const page = await fetchJson(currentUrl);
    reportedCount ??= page.count;
    rows.push(...page.results);
    currentUrl = page.next;
  }
  assert.equal(rows.length, reportedCount, `ISIMIP pagination mismatch for ${url}`);
  return { count: reportedCount, rows };
};

const unique = (rows, key) => [...new Set(rows.map(row => row.specifiers[key]).filter(Boolean))].sort();
const compactResource = resource => ({
  doi: resource.doi,
  doiUrl: resource.doi_url,
  title: resource.title_with_version ?? resource.title,
  citation: resource.citation,
  publicationYear: resource.publication_year,
  publisher: resource.publisher,
});
const compactFile = file => ({
  id: file.id,
  name: file.name,
  size: file.size,
  checksum: file.checksum,
  checksumType: file.checksum_type,
  fileUrl: file.file_url,
});
const compactDataset = dataset => ({
  id: dataset.id,
  name: dataset.name,
  version: dataset.version,
  size: dataset.size,
  public: dataset.public,
  restricted: dataset.restricted,
  metadataUrl: dataset.metadata_url,
  rights: dataset.rights?.short ?? null,
  specifiers: dataset.specifiers,
  files: dataset.files.map(compactFile).sort((left, right) => left.name.localeCompare(right.name)),
  resources: dataset.resources.map(compactResource).sort((left, right) => left.doi.localeCompare(right.doi)),
});

const biodiversityTree = 'ISIMIP3a/OutputData/biodiversity';
const biomesTree = 'ISIMIP3a/OutputData/biomes';
const urls = {
  biodiversityAll: queryUrl(biodiversityTree),
  biodiversityObservedClimate: queryUrl(biodiversityTree, 'obsclim'),
  biodiversityCounterfactualClimate: queryUrl(biodiversityTree, 'counterclim'),
  biomesObservedClimate: queryUrl(biomesTree, 'obsclim', 1),
  biomesCounterfactualClimate: queryUrl(biomesTree, 'counterclim', 1),
};

const [biodiversityAll, biodiversityObserved, biodiversityCounterfactual, biomesObserved, biomesCounterfactual] = await Promise.all([
  fetchAll(urls.biodiversityAll),
  fetchAll(urls.biodiversityObservedClimate),
  fetchAll(urls.biodiversityCounterfactualClimate),
  fetchJson(urls.biomesObservedClimate),
  fetchJson(urls.biomesCounterfactualClimate),
]);

assert.equal(biodiversityAll.count, biodiversityObserved.count + biodiversityCounterfactual.count);
assert(biodiversityObserved.rows.every(row => row.specifiers.climate_scenario === 'obsclim'));
assert(biodiversityCounterfactual.rows.every(row => row.specifiers.climate_scenario === 'counterclim'));

const datasets = biodiversityAll.rows
  .map(compactDataset)
  .sort((left, right) => left.name.localeCompare(right.name));
const counts = {
  terrestrialBiodiversityDatasets: biodiversityAll.count,
  terrestrialBiodiversityObservedClimateDatasets: biodiversityObserved.count,
  terrestrialBiodiversityCounterfactualClimateDatasets: biodiversityCounterfactual.count,
  terrestrialBiodiversityImpactModels: unique(biodiversityAll.rows, 'model').length,
  terrestrialBiodiversityVariables: unique(biodiversityAll.rows, 'variable').length,
  terrestrialBiodiversitySocialForcingCases: unique(biodiversityAll.rows, 'soc_scenario').length,
  biomesObservedClimateDatasets: biomesObserved.count,
  biomesCounterfactualClimateDatasets: biomesCounterfactual.count,
  sourceSpecificEcosystemEndpoints: 0,
};

const payload = {
  version: 'tulip_isimip_ecosystem_counterfactual_inventory_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'paired_biodiversity_counterfactual_outputs_not_published',
  productionRatingsEnabled: 0,
  purpose: 'Pin the public ISIMIP3a ecosystem inventory and test whether a matched factual-versus-counterfactual biodiversity endpoint is available for TULIP calibration.',
  source: {
    repository: 'ISIMIP Repository',
    api: apiRoot,
    protocol: 'https://protocol.isimip.org/',
    repositoryGuide: 'https://www.isimip.org/outputdata/isimip-repository/',
    biodiversityDoi: datasets.flatMap(dataset => dataset.resources).find(resource => resource.doi === '10.48364/ISIMIP.390777') ?? null,
    queryUrls: urls,
  },
  counts,
  dimensions: {
    impactModels: unique(biodiversityAll.rows, 'model'),
    variables: unique(biodiversityAll.rows, 'variable'),
    socialForcingCases: unique(biodiversityAll.rows, 'soc_scenario'),
    climateForcings: unique(biodiversityAll.rows, 'climate_forcing'),
    climateScenarios: unique(biodiversityAll.rows, 'climate_scenario'),
    periods: unique(biodiversityAll.rows, 'period'),
    regions: unique(biodiversityAll.rows, 'region'),
    timeSteps: unique(biodiversityAll.rows, 'time_step'),
    versions: [...new Set(datasets.map(dataset => dataset.version))].sort(),
  },
  evidenceDecision: {
    admittedUse: 'Authoritative availability audit and a reproducible ingestion target for future paired biodiversity outputs.',
    ratingUse: 'No ecosystem axis or TULIP rating changes.',
    reason: 'The factual biodiversity simulations have no published counterclim partners in the repository. Factual output alone cannot isolate harm caused by climate change, much less harm caused by one TULIP emissions source.',
    biomesBoundary: 'The biomes sector contains paired obsclim and counterclim simulations, but its model variables are ecosystem-process states rather than the published terrestrial-biodiversity endpoint family. They can support aggregate climate attribution only after variable-specific review and cannot be copied into species loss, ecosystem reach or source-specific TULIP scores.',
    prohibitedShortcuts: [
      'Treating an obsclim biodiversity surface as climate-attributable harm without a matched counterclim run.',
      'Treating the count of modelled species, cells or taxa as a harmed-ecosystem denominator.',
      'Converting a future IPCC warming-level risk category into current source-specific biodiversity loss.',
      'Multiplying a paired global biome response by an emissions share or global-warming share for a TULIP source node.',
    ],
    promotionGate: 'Require matched obsclim and counterclim output from the same biodiversity impact model, taxon, geography, time window, climate forcing, social forcing and sensitivity case. Then require a defensible source-removal climate perturbation, uncertainty propagation, endpoint extent and recovery evidence before mapping to TULIP ecosystem axes.',
  },
  datasets,
};
payload.digest = createHash('sha256').update(JSON.stringify({
  version: payload.version,
  source: payload.source,
  counts,
  dimensions: payload.dimensions,
  evidenceDecision: payload.evidenceDecision,
  datasets,
})).digest('hex');

await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ outputPath, status: payload.status, counts, digest: payload.digest }, null, 2));
