import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'food-waste-reference-snapshot.json');
const sourceSnapshotPath = path.join(root, 'public', 'unep-food-waste-impact-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+food-waste-evidence-ingestion)';
const expected = {
  unepClaimBytes: 692,
  unepClaimSha256: '0a3a63d9b93538150036b5a0328826040459b88b1cf29d3a72858e0727e39eaf',
  faoPdfBytes: 2_913_369,
  faoPdfSha256: 'c104e2e61f3cf29fd8c34c6ca4e8642ffb8e45162f7a7c564a0068359fd90af8',
  sourceSnapshotBytes: 3_140,
  sourceSnapshotSha256: '6c806a4718cddf0278dd91193fa691e5f1b28f18daf75ab0d9fcfe6f0f527f08',
};
const sources = {
  unep: {
    id: 'unep_food_waste_index',
    publisher: 'United Nations Environment Programme and WRAP',
    title: 'Food Waste Index Report 2024',
    publicationDate: '2024-03-27',
    reportPageUrl: 'https://www.unep.org/resources/publication/food-waste-index-report-2024',
    reportUrl: 'https://wedocs.unep.org/bitstream/handle/20.500.11822/45230/food_waste_index_report_2024.pdf',
    officialFindingsUrl: 'https://www.unep.org/events/unep-event/towards-zero-waste-and-circular-cities-key-findings-food-waste-index-report-2024',
  },
  fao: {
    id: 'fao_food_wastage_footprint_2013',
    publisher: 'Food and Agriculture Organization of the United Nations',
    title: 'Food wastage footprint: Impacts on natural resources — Summary report',
    publicationDate: '2013-09-11',
    pdfUrl: 'https://www.fao.org/4/i3347e/i3347e.pdf',
  },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
async function fetchBuffer(url, accept) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error',
    '--header', `User-Agent: ${userAgent}`,
    '--header', `Accept: ${accept}`,
    url,
  ], { encoding: null, maxBuffer: 10_000_000, timeout: 120_000 });
  return stdout;
}

const [unepPage, faoPdf, sourceSnapshotBuffer] = await Promise.all([
  fetchBuffer(sources.unep.officialFindingsUrl, 'text/html'),
  fetchBuffer(sources.fao.pdfUrl, 'application/pdf'),
  readFile(sourceSnapshotPath),
]);
assert.equal(faoPdf.length, expected.faoPdfBytes, 'FAO footprint PDF byte count changed');
assert.equal(sha256(faoPdf), expected.faoPdfSha256, 'FAO footprint PDF checksum changed');
assert.equal(sourceSnapshotBuffer.length, expected.sourceSnapshotBytes, 'Existing UNEP extracted snapshot byte count changed');
assert.equal(sha256(sourceSnapshotBuffer), expected.sourceSnapshotSha256, 'Existing UNEP extracted snapshot checksum changed');

const rawPage = unepPage.toString('utf8');
const claimMatch = rawPage.match(/<p>In 2022,[\s\S]*?<\/p>/i);
assert(claimMatch, 'UNEP official findings paragraph is missing');
const claim = claimMatch[0]
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ')
  .replace(/&rsquo;/g, '’')
  .replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ')
  .trim();
assert.equal(Buffer.byteLength(claim), expected.unepClaimBytes, 'UNEP official findings claim byte count changed');
assert.equal(sha256(claim), expected.unepClaimSha256, 'UNEP official findings claim checksum changed');
const page = claim;
for (const claim of [
  /In 2022, the world wasted 1\.05 billion tonnes of food/i,
  /cost the global economy over 1 trillion dollars annually/i,
  /responsible for 8-10% of total greenhouse gas/i,
  /squanders 28% of the world’s agricultural land/i,
  /one-fourth of agriculture’s freshwater/i,
]) assert.match(page, claim);

const extracted = JSON.parse(sourceSnapshotBuffer.toString('utf8'));
assert.equal(extracted.assessment.observation_year, 2022);
assert.equal(extracted.assessment.global_food_waste_million_tonnes, 1_052);
assert.equal(extracted.assessment.share_of_food_available_to_consumers_pct, 19);
assert.equal(extracted.assessment.estimated_annual_economic_cost_usd_trillion_lower_bound, 1);
assert.deepEqual(extracted.assessment.global_ghg_emissions_share_range_pct, [8, 10]);
assert.equal(extracted.assessment.global_agricultural_land_squandered_pct, 28);
assert.equal(extracted.assessment.agriculture_freshwater_squandered_pct, 25);

const snapshot = {
  version: 'tulip_food_waste_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_global_food_waste_flow_and_environmental_context_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace a generic ecological score with a source-bounded assessment that separates discarded-food mass, direct economic value, environmental pressure, food loss and downstream harm.',
  sources: {
    unep: {
      ...sources.unep,
      fetchedOfficialFindingsPage: {
        bytes: unepPage.length,
        sha256: sha256(unepPage),
        claimBytes: Buffer.byteLength(claim),
        claimSha256: expected.unepClaimSha256,
        retrievedOn: checkedOn,
      },
      extractedSnapshot: { path: 'public/unep-food-waste-impact-snapshot.json', bytes: sourceSnapshotBuffer.length, sha256: expected.sourceSnapshotSha256 },
      reportRetrievalBoundary: 'The UNEP repository document is linked and independently text-checked, but direct command-line retrieval is blocked by the repository Cloudflare challenge. The official UNEP findings page and the existing source-extraction snapshot are checksum-pinned here.',
    },
    fao: {
      ...sources.fao,
      fetchedDocument: { bytes: faoPdf.length, sha256: expected.faoPdfSha256, retrievedOn: checkedOn },
    },
  },
  endpoints: {
    currentWasteFlow: {
      observationYear: 2022,
      globalFoodWasteMillionTonnes: 1_052,
      globalFoodWasteKgPerCapitaYear: 132,
      shareOfFoodAvailableToConsumersPercent: 19,
      householdMillionTonnes: 631,
      foodServiceMillionTonnes: 290,
      retailMillionTonnes: 131,
      boundary: 'Retail, food service and household waste, including inedible parts. The separate 13% supply-chain food-loss estimate is outside this mass total.',
    },
    directHumanMaterialProxy: {
      annualFoodValueLostUsdTrillionLowerBound: 1,
      interpretation: 'This is a global value-of-food estimate and supports material economic severity. It is not a household-loss distribution, an affected-person count or evidence that people experiencing hunger would automatically receive the discarded food.',
    },
    environmentalPressureContext: {
      foodLossAndWasteGlobalGhgSharePercentRange: [8, 10],
      foodLossAndWasteAgriculturalLandSharePercent: 28,
      foodLossAndWasteAgriculturalFreshwaterSharePercent: 25,
      footprintReferenceYear: 2007,
      interpretation: 'These environmental shares apply to the broader food loss-and-waste system and measure emissions or resource use, not ecosystem condition, affected habitat distribution or recovery time. They are upper context for the narrower Food Waste Index mass boundary.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the annual value of discarded food as a converted proxy for direct human material-loss severity.',
      'Use the current global mass estimate and official all-country construction to establish evidence scope, without converting tonnes or country coverage into harmed people.',
      'Use the land, water and greenhouse-gas shares as environmental-pressure context and upper bounds only because they cover food loss and waste together and do not measure ecosystem condition.',
      'Treat the current observation as an annual operational flow. Do not convert daily recurrence or the 2007–2022 evidence span into consequence persistence.',
    ],
    prohibited: [
      'Do not treat one billion meals as one billion people harmed or fed.',
      'Do not add hunger or food-insecurity prevalence to the Food Waste score.',
      'Do not treat 19% of consumer food wasted as 19% ecosystem collapse or reach.',
      'Do not treat 28% of agricultural land or one-quarter of agricultural freshwater as the affected share of ecosystem distribution.',
      'Do not assign the full 8–10% food-loss-and-waste emissions share to consumer and retail food waste alone.',
      'Do not add Methane, Carbon Emissions, Agricultural Demand, Food Insecurity, Water Stress or Landfill scores.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'food_waste',
      rating: 'B 3.6',
      uncertainty: 'B 2.9 to C 5.1',
      confidence: 'B',
      domain: 'human and ecosystem',
      reason: 'The global annual flow and economic value are directly quantified, but people harmed, ecosystem condition and recovery time are not. Environmental footprint shares are broader pressure measures and cannot become terminal harm axes.',
    },
  },
  unresolvedForTulip: [
    'Obtain the distribution of direct household, business and municipal material loss attributable specifically to food waste.',
    'Obtain a compatible count of people materially harmed rather than using meals, tonnes or all-country model coverage.',
    'Obtain food-waste-specific ecosystem-condition and affected-distribution estimates separated from upstream food loss and downstream climate nodes.',
    'Obtain recovery or consequence duration for the direct environmental footprint rather than using recurrence or observation length.',
  ],
};

snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});
await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  currentWasteMillionTonnes: snapshot.endpoints.currentWasteFlow.globalFoodWasteMillionTonnes,
  directAnnualValueUsdTrillionLowerBound: snapshot.endpoints.directHumanMaterialProxy.annualFoodValueLostUsdTrillionLowerBound,
  digest: snapshot.snapshotDigest,
}, null, 2));
