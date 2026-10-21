import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactPath = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'ocean-acidification-reference-snapshot.json');

const endpoints = {
  findlayPmcXml: 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pmc&id=12147064',
  findlayArticleDoi: 'https://doi.org/10.1111/gcb.70238',
  findlayDatasetApi: 'https://api.figshare.com/v2/articles/28861832',
  findlayDatasetDoi: 'https://doi.org/10.6084/m9.figshare.28861832.v2',
  barrettRepository: 'https://repository.library.noaa.gov/view/noaa/70538',
  barrettPdf: 'https://repository.library.noaa.gov/view/noaa/70538/noaa_70538_DS1.pdf',
  barrettArticleDoi: 'https://doi.org/10.1029/2024GB008358',
};

const fetchBuffer = async url => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        accept: '*/*',
        'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)',
      },
    });
    if (response.ok) return Buffer.from(await response.arrayBuffer());
    if (response.status !== 429 || attempt === 4) assert(response.ok, `Request failed (${response.status}) for ${url}`);
    await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
  }
  throw new Error(`Request retry loop ended unexpectedly for ${url}`);
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const sha512 = value => createHash('sha512').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const text = value => value.toString('utf8')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&ndash;|&#8211;/gi, '–')
  .replace(/&minus;/gi, '−')
  .replace(/&plusmn;|&#177;/gi, '±')
  .replace(/&Omega;|&#937;/gi, 'Ω')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ')
  .trim();

const [findlayXml, figshareBytes, barrettPage, barrettPdf, copernicusBytes, whiskeyCreekBytes] = await Promise.all([
  fetchBuffer(endpoints.findlayPmcXml),
  fetchBuffer(endpoints.findlayDatasetApi),
  fetchBuffer(endpoints.barrettRepository),
  fetchBuffer(endpoints.barrettPdf),
  readFile(path.join(root, 'public', 'copernicus-global-ocean-ph-snapshot.json')),
  readFile(path.join(root, 'public', 'whiskey-creek-shell-calcification-impact-snapshot.json')),
]);

const findlayText = text(findlayXml);
const figshare = JSON.parse(figshareBytes.toString('utf8'));
const barrettText = text(barrettPage);
const copernicus = JSON.parse(copernicusBytes.toString('utf8'));
const whiskeyCreek = JSON.parse(whiskeyCreekBytes.toString('utf8'));

assert.match(findlayText, /Ocean Acidification: Another Planetary Boundary Crossed/i);
assert.match(findlayText, /10\.1111\/gcb\.70238/i);
assert.match(findlayText, /17\.3% ± 5\.0%/i);
assert.match(findlayText, /40% of the global surface ocean/i);
assert.match(findlayText, /43% reduction in habitat for tropical and subtropical coral reefs/i);
assert.match(findlayText, /61% for polar pteropods/i);
assert.match(findlayText, /13% for coastal bivalves/i);
assert.match(findlayText, /79\.5%\s+60\.8%\s+13% ± 16%/i);
assert.match(findlayText, /54\.0%\s+42\.8%\s+15% ± 9%/i);

assert.equal(figshare.id, 28_861_832);
assert.equal(figshare.doi, '10.6084/m9.figshare.28861832.v2');
assert.equal(figshare.version, 2);
assert.equal(figshare.license.name, 'CC BY 4.0');

const requiredFiles = new Map([
  ['Findlay_OAPB_areaweighted_means_and_SD.csv', { id: 53_965_625, md5: '5f387a5c9e84eb2c75c4748d08929b45', size: 1_650 }],
  ['summary_statistics.csv', { id: 54_121_157, md5: '4d2bec433946884d7200878757a9b225', size: 841 }],
  ['MytilusC_stats.csv', { id: 54_121_181, md5: '6bd7721a3e806cdb526b089e1c118414', size: 841 }],
  ['pteropod_stats.csv', { id: 54_121_199, md5: '125193a91e006ce79bedc84b69b5d7d8', size: 845 }],
]);
const files = [];
for (const [name, expected] of requiredFiles) {
  const metadata = figshare.files.find(file => file.name === name);
  assert(metadata, `Missing Figshare file ${name}`);
  assert.equal(metadata.id, expected.id);
  assert.equal(metadata.size, expected.size);
  assert.equal(metadata.computed_md5, expected.md5);
  const bytes = await fetchBuffer(metadata.download_url);
  assert.equal(bytes.length, expected.size);
  assert.equal(md5(bytes), expected.md5);
  files.push({ id: metadata.id, name, size: metadata.size, md5: expected.md5, downloadUrl: metadata.download_url, sha256: sha256(bytes) });
}

assert.equal(copernicus.contract_bindings[0].node_id, 'ocean_acidification');
assert.equal(copernicus.start_year, 1985);
assert.equal(copernicus.end_year, 2024);
assert.equal(copernicus.record_count, 40);
const firstPh = copernicus.observations.at(0);
const latestPh = copernicus.observations.at(-1);
assert.deepEqual(firstPh, { year: 1985, ph: 8.107793, uncertainty: 0.015011 });
assert.deepEqual(latestPh, { year: 2024, ph: 8.042169, uncertainty: 0.014035 });

assert.match(barrettText, /Biological Responses to Ocean Acidification Are Changing the Global Ocean Carbon Cycle/i);
assert.match(barrettText, /0\.072.*0\.023/i);
assert.match(barrettText, /20 Tmol/i);
assert.equal(
  sha512(barrettPdf),
  '1708f548eb38b8d0f35a980969e6247b0eb528bd19192243e2e52a97c0cb784899541c8bb37c3e499bb562d48d3c8b51aa696fb046e758e2792c0942f97d2758',
);

assert.equal(whiskeyCreek.metric_contract.node_id, 'shell_calcification_failures');
assert.equal(whiskeyCreek.accumulated_impact.pacific_oyster_larval_culture_reduction_percent_at_least, 75);
assert.equal(whiskeyCreek.accumulated_impact.affected_production_season_count, 2);
assert.equal(whiskeyCreek.accumulated_impact.derived_2008_eyed_larvae_production_shortfall, 7_500_000_000);
assert.equal(whiskeyCreek.accumulated_impact.broader_industry_annual_value_usd_unscored, 270_000_000);

const candidate = {
  previous: { value: 8.1, grade: 'D', lower: 5.9, upper: 9.6, confidence: 'C' },
  revised: { value: 6.3, grade: 'C', lower: 4.4, upper: 8.1, confidence: 'C' },
  axes: {
    human: {
      severity: { lower: 1, central: 2, upper: 2 },
      reach: { lower: 1, central: 1, upper: 2 },
      persistence: { lower: 1, central: 2, upper: 3 },
    },
    ecosystem: {
      severity: { lower: 2, central: 3, upper: 4 },
      reach: { lower: 2, central: 3, upper: 4 },
      persistence: { lower: 2, central: 3, upper: 4 },
    },
  },
  reason: 'The former D score treated a global chemical signal as global harmed-person and ecosystem reach. The revised candidate keeps current chemistry as the causal state, uses a bounded observed hatchery consequence for people, and uses organism-habitat thresholds plus global biotic-pattern evidence for nature. These sources support material harm but not a global count of harmed people or a measured global movement toward ecosystem collapse.',
};

const payload = {
  version: 'tulip_ocean_acidification_reference_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'chemistry_habitat_and_bounded_human_consequences_pinned_global_terminal_denominators_missing',
  productionRatingsEnabled: 0,
  nodeId: 'ocean_acidification',
  sources: {
    globalChemistry: {
      id: copernicus.source.id,
      publisher: copernicus.source.publisher,
      title: copernicus.source.name,
      doi: `https://doi.org/${copernicus.source.doi}`,
      publicationDate: '2025-11',
      localSnapshot: 'public/copernicus-global-ocean-ph-snapshot.json',
      localSnapshotSha256: sha256(copernicusBytes),
      nativeFileSha256: copernicus.source.native_file_sha256,
    },
    planetaryBoundary: {
      id: 'findlay_ocean_acidification_planetary_boundary_2025',
      publisher: 'Global Change Biology; PubMed Central; Figshare',
      title: 'Ocean Acidification: Another Planetary Boundary Crossed',
      articleDoi: endpoints.findlayArticleDoi,
      datasetDoi: endpoints.findlayDatasetDoi,
      publicationDate: '2025-06-09',
      pmcId: 'PMC12147064',
      pmcXmlSha256: sha256(findlayXml),
      figshareApiSha256: sha256(figshareBytes),
      files,
    },
    globalBioticFeedback: {
      id: 'barrett_global_biotic_calcification_feedback_2025',
      publisher: 'American Geophysical Union; NOAA Institutional Repository',
      title: 'Biological Responses to Ocean Acidification Are Changing the Global Ocean Carbon Cycle',
      articleDoi: endpoints.barrettArticleDoi,
      repositoryUrl: endpoints.barrettRepository,
      publicationDate: '2025-03',
      pdfUrl: endpoints.barrettPdf,
      pdfBytes: barrettPdf.length,
      pdfSha512: sha512(barrettPdf),
      repositoryPageSha256: sha256(barrettPage),
    },
    hatcheryConsequence: {
      id: 'noaa_oap_pacific_northwest_shellfish_acidification_2015',
      publisher: 'NOAA Ocean Acidification Program',
      title: 'Impacts of Coastal Acidification on the Pacific Northwest Shellfish Industry and Adaptation Strategies Implemented in Response',
      url: whiskeyCreek.sources.find(source => source.id === 'noaa_oap_pacific_northwest_shellfish_acidification_2015').url,
      publicationDate: '2015-10-02',
      localSnapshot: 'public/whiskey-creek-shell-calcification-impact-snapshot.json',
      localSnapshotSha256: sha256(whiskeyCreekBytes),
    },
  },
  evidence: {
    globalChemistry: {
      record: { startYear: copernicus.start_year, endYear: copernicus.end_year, annualObservations: copernicus.record_count },
      firstAnnualMeanPh: firstPh,
      latestAnnualMeanPh: latestPh,
      decline1985To2024: Number((firstPh.ph - latestPh.ph).toFixed(6)),
      boundary: 'Annual global surface-ocean pH establishes the chemical state. It does not count harmed people, ecosystem condition loss or recovery time, and aragonite saturation is not inferred from pH alone.',
    },
    ecosystemHabitatAndExtent: {
      comparison: { preindustrialYear: 1750, presentDayYear: 2020 },
      globalSurfaceAragoniteSaturation: { preindustrial: 3.5715, 2020: 2.895, declinePercent: 17.3, propagatedErrorPercentagePoints: 5.0 },
      surfaceOceanAreaCrossingTwentyPercentBoundaryUsingPrecautionaryReferencePercent: 40,
      biologicalThresholds: {
        coastalBivalves: { threshold: 1.8, preindustrialAreaPastThresholdPercent: 6.4, areaPastThreshold2020Percent: 18.6, expansionPercentagePoints: 12.2 },
        polarPteropods: { threshold: 1.5, preindustrialAreaPastThresholdPercent: 18.7, areaPastThreshold2020Percent: 79.5, expansionPercentagePoints: 60.8 },
        tropicalAndSubtropicalCorals: { threshold: 3.5, preindustrialAreaPastThresholdPercent: 11.2, areaPastThreshold2020Percent: 54.0, expansionPercentagePoints: 42.8 },
      },
      interpretation: 'The threshold maps estimate expansion of marginal carbonate habitat for three calcifying groups. They support broad, heterogeneous biological reach. They do not measure observed global ecosystem collapse, species-population loss, or the same ecosystem denominator across groups.',
    },
    globalBioticPattern: {
      observationYearsApproximate: 30,
      surfaceTotalAlkalinityTrendMicromolPerKgPerYear: { estimate: 0.072, uncertainty: 0.023 },
      additionalSurfaceTotalAlkalinityTmolApproximate: 20,
      finding: 'Repeat hydrography and seawater-property algorithms detect a global alkalinity pattern consistent with reduced biotic calcification under rising carbon dioxide.',
      boundary: 'This is evidence of planetary-scale biological-pattern disruption, not a direct estimate of ecosystem condition loss or collapse. The authors require more observations to characterize regional effects.',
    },
    boundedHumanConsequence: {
      geography: whiskeyCreek.metric_contract.geography,
      period: whiskeyCreek.metric_contract.assessment_period,
      larvalCultureReductionPercentAtLeast: whiskeyCreek.accumulated_impact.pacific_oyster_larval_culture_reduction_percent_at_least,
      eyedLarvaeProductionShortfall2008: whiskeyCreek.accumulated_impact.derived_2008_eyed_larvae_production_shortfall,
      affectedProductionSeasons: whiskeyCreek.accumulated_impact.affected_production_season_count,
      adaptationFinding: 'Paired intake chemistry and larval survival linked low aragonite saturation to commercial hatchery failures. Monitoring, treatment and timing changes restored billions of larvae, showing both material loss and meaningful adaptation.',
      boundary: 'This case supports material economic and livelihood consequences at a bounded hatchery and regional supply chain. It supplies no unique harmed-person count and does not convert the full West Coast industry value or job count into realized harm.',
    },
  },
  ratingDecision: {
    change: 'revised',
    candidate,
    admittedUses: [
      'Use the Copernicus series for current global surface-ocean chemical state and trend only.',
      'Use the Findlay threshold maps to bound the share of selected calcifier habitats entering marginal carbonate conditions, preserving organism, depth and region denominators.',
      'Use the Barrett result as corroboration of a global biotic-pattern response, without converting alkalinity change into ecosystem collapse.',
      'Use the Whiskey Creek case for bounded material human severity and persistence, with successful adaptation retained.',
    ],
    excludedUses: [
      'Do not convert global pH coverage or boundary-crossed ocean area into a harmed-person count.',
      'Do not treat threshold-crossed habitat area as observed mortality, ecosystem collapse or uniform damage.',
      'Do not combine coral, pteropod and bivalve percentages into one global affected-area total.',
      'Do not count the full shellfish industry value, all jobs or all people dependent on marine food as currently harmed.',
      'Do not use the 40-year chemistry record as human or ecosystem recovery time.',
      'Do not add scores from coral bleaching, shell calcification, fisheries, food-web or carbon-cycle nodes.',
    ],
    exactRemainingGaps: [
      'A current, compatible global count of people experiencing ocean-acidification-attributable health, livelihood, food or service consequences.',
      'A global observed marine-ecosystem condition indicator tied to a documented functional-loss or collapse reference.',
      'A common affected-area denominator across marine ecosystem types rather than separate indicator-species habitat thresholds.',
      'Observed recovery-time distributions for affected ecosystems and livelihoods under adaptation and emissions pathways.',
    ],
  },
};

payload.digest = sha256(JSON.stringify({
  version: payload.version,
  sources: payload.sources,
  evidence: payload.evidence,
  ratingDecision: payload.ratingDecision,
}));

await writeFile(artifactPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({
  artifactPath,
  status: payload.status,
  previous: candidate.previous,
  revised: candidate.revised,
  sources: Object.keys(payload.sources).length,
  digest: payload.digest,
}, null, 2));
