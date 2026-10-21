import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'wetland-peat-fire-current-reference-snapshot.json');
const previousIndonesianSnapshot = JSON.parse(await readFile(path.join(root, 'public', 'indonesian-peat-fire-impact-snapshot.json'), 'utf8'));
const sha256 = body => createHash('sha256').update(body).digest('hex');
const plainText = body => body.toString('utf8')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&(?:nbsp|#160);/g, ' ')
  .replace(/&gt;/g, '>')
  .replace(/&lt;/g, '<')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();

async function fetchBuffer(url, maximumBytes = 6_000_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: { accept: '*/*', 'user-agent': 'Mozilla/5.0' },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

const sources = {
  indonesianHealth2019: {
    id: 'grosvenor_indonesian_peat_fire_health_2024',
    publisher: 'Communications Earth & Environment; PubMed',
    title: 'Catastrophic impact of extreme 2019 Indonesian peatland fires on urban air quality and health',
    publicationDate: '2024-11-02',
    doi: '10.1038/s43247-024-01813-w',
    url: 'https://www.nature.com/articles/s43247-024-01813-w',
    fetchUrl: 'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pubmed.cgi/bioc_json/39497724/unicode',
  },
  indonesianExposure2023: {
    id: 'graham_indonesian_peat_fire_exposure_2024',
    publisher: 'GeoHealth; PubMed Central',
    title: 'Updated Smoke Exposure Estimate for Indonesian Peatland Fires Using a Network of Low-Cost PM2.5 Sensors and a Regional Air Quality Model',
    publicationDate: '2024-11-03',
    doi: '10.1029/2024GH001125',
    url: 'https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2024GH001125',
    fetchUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11532237/',
  },
  northernCarbonFunction2023: {
    id: 'wilkinson_northern_peatland_fire_carbon_2023',
    publisher: 'Nature Climate Change; University of Plymouth research repository',
    title: 'Wildfire and degradation accelerate northern peatland carbon release',
    publicationDate: '2023-04-20',
    doi: '10.1038/s41558-023-01657-w',
    url: 'https://www.nature.com/articles/s41558-023-01657-w',
    fetchUrl: 'https://pure.plymouth.ac.uk/ws/portalfiles/portal/39876681/Wilkinson_et_al_NCC_22071425A.pdf',
  },
  postFireCarbonRecovery2025: {
    id: 'schulze_permafrost_peatland_postfire_carbon_2025',
    publisher: 'Geophysical Research Letters; Canadian Conservation and Land Management Knowledge Network',
    title: 'Large Carbon Losses From Burned Permafrost Peatlands During Post-Fire Succession',
    publicationDate: '2025-10-07',
    doi: '10.1029/2025GL118344',
    url: 'https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2025GL118344',
    fetchUrl: 'https://www.cclmportal.ca/sites/default/files/2025-11/Geophysical%20Research%20Letters%20-%202025%20-%20Schulze%20-%20Large%20Carbon%20Losses%20From%20Burned%20Permafrost%20Peatlands%20During%20Post%E2%80%90Fire.pdf',
  },
  canadianPeatFireExtent2026: {
    id: 'zhong_canada_soil_peat_fire_carbon_2026',
    publisher: 'Geophysical Research Letters; Crossref',
    title: 'Three-Fourths of Carbon Emissions From 2023 Record-Breaking Wildfires in Canada Traced to Soil and Peat Combustion',
    publicationDate: '2026-07-27',
    doi: '10.1029/2026GL123393',
    url: 'https://agupubs.onlinelibrary.wiley.com/doi/10.1029/2026GL123393',
    fetchUrl: 'https://api.crossref.org/works/10.1029/2026GL123393',
  },
  globalPeatlandAreaContext2026: {
    id: 'fao_customary_lands_global_peatland_area_2026',
    publisher: 'Food and Agriculture Organization of the United Nations',
    title: 'Customary lands for people, nature, and climate',
    publicationDate: '2026-03-25',
    url: 'https://www.fao.org/in-action/aim4forests/news-and-events/news/news-detail/customary-lands-for-people--nature--and-climate/en',
  },
};

const entries = await Promise.all(Object.values(sources).map(async source => ({ source, body: await fetchBuffer(source.fetchUrl ?? source.url) })));
const byId = Object.fromEntries(entries.map(entry => [entry.source.id, entry]));
const healthText = plainText(byId[sources.indonesianHealth2019.id].body);
const exposureText = plainText(byId[sources.indonesianExposure2023.id].body);
const zhongText = plainText(byId[sources.canadianPeatFireExtent2026.id].body);
const faoText = plainText(byId[sources.globalPeatlandAreaContext2026.id].body);
const wilkinsonPdf = byId[sources.northernCarbonFunction2023.id].body;
const schulzePdf = byId[sources.postFireCarbonRecovery2025.id].body;

for (const phrase of ['over 1200 excess deaths', 'over 3200 across Central Kalimantan', 'more than 87,000 nationwide in 2019']) {
  assert(healthText.includes(phrase), `Indonesian health abstract no longer contains: ${phrase}`);
}
for (const phrase of ['network of 13 low', 'fires contributing 90', '1.62 million people', 'measured indoor and outdoor']) {
  assert(exposureText.includes(phrase), `Indonesian exposure article no longer contains: ${phrase}`);
}
for (const phrase of ['5.1 million hectares occurred in peatlands', '180', '15', '554']) {
  assert(zhongText.includes(phrase), `Canadian fire abstract no longer contains: ${phrase}`);
}
for (const phrase of ['80 percent of global peatlands', '390 million hectares']) {
  assert(faoText.includes(phrase), `FAO peatland-area context no longer contains: ${phrase}`);
}
assert.equal(wilkinsonPdf.subarray(0, 5).toString('ascii'), '%PDF-');
assert.equal(schulzePdf.subarray(0, 5).toString('ascii'), '%PDF-');
assert.equal(previousIndonesianSnapshot.assessment.assessed_health_burden.population_sumatra_and_kalimantan, 74_700_000);

const approximateGlobalPeatlandAreaMillionHa = 390 / 0.8;
const canadian2023BurnedPeatlandShareOfApproximateGlobalPeatlandAreaPercent = Number((5.1 / approximateGlobalPeatlandAreaMillionHa * 100).toFixed(2));

const payload = {
  version: 'tulip_wetland_peat_fire_current_reference_2026_09_25_v1',
  generatedOn: '2026-09-25',
  status: 'current_human_endpoint_ecosystem_function_extent_and_recovery_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Correct exposure-versus-harm reach, refresh the current physical record through 2023, and replace generic ecosystem judgments with direct peatland function, mapped extent and post-fire recovery evidence.',
  appliesToNodeIds: ['wetland_peat_fires'],
  sources: Object.fromEntries(Object.entries(sources).map(([key, source]) => {
    const body = byId[source.id].body;
    return [key, { ...source, bytes: body.length, sha256AtIngestion: sha256(body) }];
  })),
  evidence: {
    terminalHumanConsequence2019: {
      eventYear: 2019,
      modelledExcessDeathsPalangkaRayaMoreThan: 1_200,
      modelledExcessDeathsCentralKalimantanMoreThan: 3_200,
      modelledExcessDeathsIndonesiaMoreThan: 87_000,
      sumatraAndKalimantanPopulationContextOnly: previousIndonesianSnapshot.assessment.assessed_health_burden.population_sumatra_and_kalimantan,
      interpretation: 'The source reports modelled excess deaths, which are a terminal human consequence. The 74.7 million regional population is exposure context and cannot be substituted for the number of people harmed.',
    },
    currentExposureUpdate2023: {
      eventYear: 2023,
      sensorCount: 13,
      fireAttributedPm25IncreaseUgM3: 90,
      peopleExposedToUnhealthyOrWorseAir: 1_620_000,
      estimatedIndonesianDrySeasonPm25FireEmissionsTg: 1.62,
      interpretation: 'This independently confirms a recent peat-fire smoke episode and widespread exposure. Exposure and pollutant mass do not add to the 2019 death count or enter harmed-person reach.',
    },
    ecosystemFunction: {
      publicationYear: 2023,
      geography: 'northern non-permafrost boreal and temperate peatlands',
      wildfireReductionInPristinePeatlandCarbonUptakePercent: 35,
      additionalEmissionsFromDegradedPeatlandsPercent: 10,
      interpretation: 'The modelled changes establish material loss of peatland carbon-regulation function. A percentage change in carbon uptake is not automatically the same percentage movement toward whole-ecosystem collapse.',
    },
    postFireRecovery: {
      observationYears: [2019, 2020, 2021, 2022, 2023],
      recentlyBurnedSiteNetCarbonSourceYears: 4,
      olderBurnAgeYears: { lower: 13, upper: 15 },
      estimatedTotalCarbonLossKgPerM2Over20Years: 2.9,
      combustionShareOfTwentyYearImpactPercent: 58,
      postFireExchangeShareOfTwentyYearImpactPercent: 42,
      interpretation: 'A recent burned peat plateau remained a carbon source for four years, while a 13–15-year-old site returned to a weak sink but retained disturbed soil and vegetation. Twenty years is a source-modelled recovery assumption, not a universal measured recovery time.',
    },
    mappedCurrentExtent: {
      eventYear: 2023,
      canadaTotalBurnedAreaMillionHa: 15.1,
      canadaPeatlandBurnedAreaMillionHa: 5.1,
      peatlandCarbonReleasedTg: { central: 180, uncertainty: 15 },
      approximateGlobalPeatlandAreaContextMillionHa: approximateGlobalPeatlandAreaMillionHa,
      canadianEventShareOfApproximateGlobalPeatlandAreaPercent: canadian2023BurnedPeatlandShareOfApproximateGlobalPeatlandAreaPercent,
      denominatorDerivation: 'FAO states that approximately 80% of global peatlands equals around 390 million hectares; 390 / 0.8 gives an approximate 487.5-million-hectare context denominator.',
      interpretation: 'The approximate one-percent comparison supports a level-2 extent centrally but remains bounded because the numerator and denominator come from different mapping products and the Canadian event is not a complete global fire inventory.',
    },
    boundary: {
      uniqueHarmedPeople: 'Use modelled excess deaths for reach. Do not use all residents or people exposed to unhealthy air as harmed people.',
      ecosystemExtent: 'Use mapped burned peatland area against a declared peatland-area denominator. Do not use carbon mass, national land area or all wildfire area as ecosystem reach.',
      persistence: 'Use documented consequence or recovery duration. Do not use publication age, fire-record length, or peat age as persistence.',
      overlap: 'Do not add smoke-exposure, PM2.5, carbon-emission, wildfire-regime, peatland-degradation, permafrost-thaw or global-temperature node scores.',
    },
  },
  ratingDecision: {
    change: 'basis_corrected_and_interval_narrowed',
    candidate: {
      prior: { value: 7.4, grade: 'D', lower: 6.3, upper: 8.5, confidence: 'C', domains: ['human', 'ecosystem'] },
      revised: { value: 7.4, grade: 'D', lower: 6.3, upper: 8.1, confidence: 'C', domains: ['human', 'ecosystem'] },
    },
    axes: {
      human: {
        severity: { lower: 4, central: 4, upper: 4 },
        reach: { lower: 2, central: 2, upper: 2 },
        persistence: { lower: 4, central: 4, upper: 4 },
      },
      ecosystem: {
        severity: { lower: 1, central: 2, upper: 3 },
        reach: { lower: 1, central: 2, upper: 2 },
        persistence: { lower: 2, central: 3, upper: 4 },
      },
    },
    excludedUses: [
      'Do not convert the 74.7 million residents of Sumatra and Kalimantan or 1.62 million people exposed in Central Kalimantan into harmed-person reach.',
      'Do not add the 2019 excess-death estimate to a 2023 exposure count or treat repeated events as different severity points.',
      'Do not treat carbon emitted, PM2.5 concentration, sensor count, study years or carbon-stock age as people or ecosystem reach.',
      'Do not equate a 35% change in carbon uptake with 35% movement toward whole-ecosystem collapse.',
      'Do not treat a source-modelled twenty-year carbon-balance period as a universal measured recovery time.',
      'Do not inherit or add scores from PM2.5, Smoke Exposure, Carbon Emission, Wildfire Regime Shift, Peatland Degradation, Permafrost Thaw or Global Temperature.',
    ],
    exactRemainingGaps: [
      'A globally representative current peat-fire mortality and morbidity model with explicit peat-versus-other-landscape-fire attribution and non-overlapping population counts.',
      'A harmonized global annual peatland-fire perimeter joined to the same peatland distribution map and classification used for the denominator.',
      'A condition or functional-loss indicator explicitly calibrated to peatland ecosystem collapse across tropical, boreal and permafrost peatlands.',
      'A representative recovery-time distribution covering vegetation, hydrology, permafrost and carbon function after different peat-fire severities.',
      'A compatible global estimate of current direct water, livelihood and biodiversity consequences attributable specifically to peat combustion.',
      'A compatible 2027–2036 SSP2-4.5 terminal-consequence projection; the outlook remains separate from the current score.',
    ],
  },
};
payload.snapshotDigest = sha256(JSON.stringify(payload));
await writeFile(output, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ output, sources: Object.keys(payload.sources).length, digest: payload.snapshotDigest }, null, 2));
