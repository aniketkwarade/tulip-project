import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cacheDir = path.resolve(root, process.env.TULIP_REGIONAL_PATTERN_CACHE ?? 'tmp/tulip-regional-pattern');
const outputPath = path.join(root, 'artifacts/tulip-calibration-2026-09-22/europe-heat-823-region-universe.json');
const checkedOn = '2026-09-23';
const userAgent = 'LostPlanet-TULIP/1.0 (+europe-heat-region-universe)';

const sources = {
  nuts2016: {
    file: 'nuts-2016-1m.geojson',
    url: 'https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2016_4326.geojson',
    sha256: 'c7af4f0f486abd5ec0ede13596fb0ac516e5d0bae11287ea93d6283c8c1aa650',
  },
  nuts2021: {
    file: 'nuts-2021-1m.geojson',
    url: 'https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_01M_2021_4326.geojson',
    sha256: '3ae24a9aa32b95e06488c0c4dd080979e5b927d554b1fe35d8be83bb63cd6e97',
  },
};
const eurostatQuery = time => `https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data/demo_r_mweek3?lang=EN&time=${time}&sex=T&age=TOTAL`;
const sha256 = value => createHash('sha256').update(value).digest('hex');

async function fetchBuffer(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(180_000), headers: { 'User-Agent': userAgent } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

async function pinnedSource(source) {
  const localPath = path.join(cacheDir, source.file);
  let buffer;
  try {
    buffer = await readFile(localPath);
  } catch {
    buffer = await fetchBuffer(source.url);
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, buffer);
  }
  const actual = sha256(buffer);
  assert.equal(actual, source.sha256, `${source.file}: source checksum changed`);
  return { ...source, localPath: path.relative(root, localPath), bytes: buffer.length, buffer };
}

function categoryValues(dimension) {
  const index = dimension.category.index;
  if (Array.isArray(index)) return index;
  return Object.entries(index).sort((left, right) => left[1] - right[1]).map(([value]) => value);
}

function presentGeographies(payload) {
  const dimensions = payload.id;
  const sizes = payload.size;
  const categories = dimensions.map(id => categoryValues(payload.dimension[id]));
  const geographyIndex = dimensions.indexOf('geo');
  assert(geographyIndex >= 0);
  const present = new Set();
  for (const flatIndex of Object.keys(payload.value ?? {})) {
    let remainder = Number(flatIndex);
    const coordinates = new Array(sizes.length);
    for (let index = sizes.length - 1; index >= 0; index -= 1) {
      coordinates[index] = remainder % sizes[index];
      remainder = Math.floor(remainder / sizes[index]);
    }
    present.add(categories[geographyIndex][coordinates[geographyIndex]]);
  }
  return present;
}

const countrySpecs = [
  ['AL', 'Albania', 12, 3], ['AT', 'Austria', 35, 3], ['BE', 'Belgium', 44, 3],
  ['BG', 'Bulgaria', 28, 3], ['HR', 'Croatia', 1, 0], ['CY', 'Cyprus', 1, 0],
  ['CZ', 'Czechia', 14, 3], ['DK', 'Denmark', 11, 3], ['EE', 'Estonia', 5, 3],
  ['FI', 'Finland', 19, 3], ['FR', 'France', 96, 'france_mainland_and_corsica'],
  ['DE', 'Germany', 16, 1], ['EL', 'Greece', 52, 3], ['HU', 'Hungary', 20, 3],
  ['IS', 'Iceland', 2, 3], ['IE', 'Ireland', 1, 0], ['IT', 'Italy', 103, 'italy_sardinia_aggregate'],
  ['LV', 'Latvia', 6, 3], ['LI', 'Liechtenstein', 1, 0], ['LT', 'Lithuania', 10, 3],
  ['LU', 'Luxembourg', 1, 0], ['MT', 'Malta', 1, 0], ['ME', 'Montenegro', 1, 0],
  ['NL', 'Netherlands', 40, 3], ['NO', 'Norway', 11, 'norway_2021_mainland'],
  ['PL', 'Poland', 73, 3], ['PT', 'Portugal', 25, 3], ['RO', 'Romania', 42, 3],
  ['RS', 'Serbia', 25, 3], ['SK', 'Slovakia', 8, 3], ['SI', 'Slovenia', 1, 0],
  ['ES', 'Spain', 59, 3], ['SE', 'Sweden', 21, 3], ['CH', 'Switzerland', 26, 3],
  ['UK', 'United Kingdom', 12, 1],
].map(([code, name, expectedRegions, selection]) => ({ code, name, expectedRegions, selection }));

const [nuts2016Source, nuts2021Source, eurostat2019Response, eurostat2022Response] = await Promise.all([
  pinnedSource(sources.nuts2016),
  pinnedSource(sources.nuts2021),
  fetchBuffer(eurostatQuery('2019-W22')),
  fetchBuffer(eurostatQuery('2022-W22')),
]);
const nuts2016 = JSON.parse(nuts2016Source.buffer.toString('utf8'));
const nuts2021 = JSON.parse(nuts2021Source.buffer.toString('utf8'));
const eurostat2019 = JSON.parse(eurostat2019Response.toString('utf8'));
const eurostat2022 = JSON.parse(eurostat2022Response.toString('utf8'));
assert.equal(eurostat2019.label, 'Deaths by week, sex, 5-year age group and NUTS 3 region');
const present2019 = presentGeographies(eurostat2019);
const present2022 = presentGeographies(eurostat2022);

function properties(feature) {
  return feature.properties ?? {};
}

function featuresFor(collection, code, level) {
  return collection.features.filter(feature => properties(feature).CNTR_CODE === code && Number(properties(feature).LEVL_CODE) === level);
}

function regionRecord(feature, boundaryRelease, selectionRule) {
  const value = properties(feature);
  return {
    id: value.NUTS_ID,
    name: value.NAME_LATN || value.NUTS_NAME || value.NAME_ENGL || value.NUTS_ID,
    nutsLevel: Number(value.LEVL_CODE),
    boundaryRelease,
    selectionRule,
    presentInEurostat2019Week22: present2019.has(value.NUTS_ID),
    presentInEurostat2022Week22: present2022.has(value.NUTS_ID),
  };
}

const countries = countrySpecs.map(spec => {
  let selected;
  let selectionRule;
  if (spec.selection === 'france_mainland_and_corsica') {
    selectionRule = 'NUTS 2016 level 3, excluding the five FRY outermost-region codes because the study reports 96 French regions.';
    selected = featuresFor(nuts2016, 'FR', 3)
      .filter(feature => !properties(feature).NUTS_ID.startsWith('FRY'))
      .map(feature => regionRecord(feature, 'NUTS 2016', selectionRule));
  } else if (spec.selection === 'italy_sardinia_aggregate') {
    selectionRule = 'NUTS 2016 level 3 outside Sardinia plus the NUTS 2 whole-island code ITG2, matching the public 103-region Italian sample.';
    const mainlandAndSicily = featuresFor(nuts2016, 'IT', 3)
      .filter(feature => !properties(feature).NUTS_ID.startsWith('ITG2'))
      .map(feature => regionRecord(feature, 'NUTS 2016', selectionRule));
    const sardinia = featuresFor(nuts2016, 'IT', 2).find(feature => properties(feature).NUTS_ID === 'ITG2');
    assert(sardinia);
    selected = [...mainlandAndSicily, regionRecord(sardinia, 'NUTS 2016', selectionRule)];
  } else if (spec.selection === 'norway_2021_mainland') {
    selectionRule = 'NUTS 2021 level 3, excluding Jan Mayen (NO0B1) and Svalbard (NO0B2), matching the study count of 11.';
    selected = featuresFor(nuts2021, 'NO', 3)
      .filter(feature => !['NO0B1', 'NO0B2'].includes(properties(feature).NUTS_ID))
      .map(feature => regionRecord(feature, 'NUTS 2021', selectionRule));
  } else {
    selectionRule = `NUTS 2016 level ${spec.selection}, the published study count for this country.`;
    selected = featuresFor(nuts2016, spec.code, spec.selection)
      .map(feature => regionRecord(feature, 'NUTS 2016', selectionRule));
  }
  selected.sort((left, right) => left.id.localeCompare(right.id));
  assert.equal(selected.length, spec.expectedRegions, `${spec.code}: region count differs from the article`);
  return { ...spec, selectionRule, regions: selected };
});

const allRegions = countries.flatMap(country => country.regions.map(region => ({ countryCode: country.code, country: country.name, ...region })));
assert.equal(countries.length, 35);
assert.equal(allRegions.length, 823);
assert.equal(new Set(allRegions.map(region => region.id)).size, 823);
assert(allRegions.every(region => region.presentInEurostat2019Week22));
const present2022Count = allRegions.filter(region => region.presentInEurostat2022Week22).length;
const boundaryDriftIds = allRegions.filter(region => !region.presentInEurostat2022Week22).map(region => region.id);
assert.equal(present2022Count, 789);
assert.equal(boundaryDriftIds.length, 34);

const payload = {
  version: 'tulip_europe_heat_823_region_universe_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'complete_candidate_universe_counts_and_historical_api_presence_validated_author_metadata_comparison_pending',
  productionRatingsEnabled: 0,
  purpose: 'Reconstruct the 823 regional identifiers needed for the European heat-pattern calculation from the study country counts, official GISCO boundaries and the Eurostat weekly-death collection.',
  publishedCoverage: { countries: 35, regions: 823 },
  sources: {
    article: {
      url: 'https://www.nature.com/articles/s41612-024-00783-2',
      method: 'The article reports the 35 country names and per-country region counts but does not publish the complete region identifier table.',
    },
    nuts2016: { url: nuts2016Source.url, localPath: nuts2016Source.localPath, bytes: nuts2016Source.bytes, sha256: nuts2016Source.sha256 },
    nuts2021: { url: nuts2021Source.url, localPath: nuts2021Source.localPath, bytes: nuts2021Source.bytes, sha256: nuts2021Source.sha256 },
    eurostat2019: {
      url: eurostatQuery('2019-W22'),
      dataset: 'demo_r_mweek3',
      time: '2019-W22',
      updated: eurostat2019.updated,
      bytes: eurostat2019Response.length,
      sha256: sha256(eurostat2019Response),
      role: 'Historical presence check during the study calibration period.',
    },
    eurostat2022: {
      url: eurostatQuery('2022-W22'),
      dataset: 'demo_r_mweek3',
      time: '2022-W22',
      updated: eurostat2022.updated,
      bytes: eurostat2022Response.length,
      sha256: sha256(eurostat2022Response),
      role: 'Boundary-drift check, not a replacement region universe.',
    },
  },
  checks: {
    countryCount: countries.length,
    regionCount: allRegions.length,
    uniqueRegionIds: new Set(allRegions.map(region => region.id)).size,
    presentInEurostat2019Week22: allRegions.filter(region => region.presentInEurostat2019Week22).length,
    presentInEurostat2022Week22: present2022Count,
    boundaryDriftIds,
    countryCountsMatchArticle: countries.every(country => country.regions.length === country.expectedRegions),
  },
  interpretation: {
    strength: 'All 823 selected identifiers are unique, reproduce every published country count and have a non-null all-age, all-sex weekly-death record in Eurostat for 2019-W22.',
    boundary: 'This is a transparent reconstruction, not the authors’ unpublished metadata table. It must be compared with source-provided metadata if that table becomes available.',
    drift: 'Thirty-four NUTS 2016 identifiers are absent from the 2022-W22 API view because later boundary releases replace them. They remain in this candidate universe because the study calibration data and public Italian sample use the earlier regional structure.',
  },
  countries,
  regions: allRegions,
};
payload.digest = sha256(Buffer.from(JSON.stringify({ sources: payload.sources, checks: payload.checks, countries: payload.countries })));
await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output: path.relative(root, outputPath), status: payload.status, checks: payload.checks, digest: payload.digest }, null, 2));
