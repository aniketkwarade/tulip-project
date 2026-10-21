import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'road-stream-crossing-current-reference-snapshot.json');
const digest = (algorithm, value) => createHash(algorithm).update(value).digest('hex');
const normalize = value => String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

async function fetchBuffer(url, maximumBytes = 1_000_000) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(180_000),
      headers: {
        accept: '*/*',
        'user-agent': 'Mozilla/5.0 LostPlanet-TULIP/1.0 (+road-stream-crossing-evidence-ingestion; mailto:research@tulip.earth)',
      },
    });
    if (response.status === 429 && attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, 750 * (attempt + 1)));
      continue;
    }
    assert(response.ok, `Request failed (${response.status}) for ${url}`);
    const body = Buffer.from(await response.arrayBuffer());
    assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
    return body;
  }
  throw new Error(`Request retry loop exhausted for ${url}`);
}

async function crossref(doi) {
  const body = await fetchBuffer(`https://api.crossref.org/works/${doi}?mailto=research%40tulip.earth`, 250_000);
  const payload = JSON.parse(body.toString('utf8'));
  assert.equal(payload.status, 'ok');
  assert.equal(payload.message.DOI.toLowerCase(), doi.toLowerCase());
  return { body, record: payload.message };
}

function numericProperty(source, key) {
  const match = source.match(new RegExp(`(?:^|[,{}])${key}:([0-9]+(?:\\.[0-9]+)?)`));
  assert(match, `National Aquatic Barrier Inventory data no longer contains ${key}`);
  return Number(match[1]);
}

const sources = {
  usgsCulvertSynthesis2024: {
    id: 'usgs_culvert_connectivity_synthesis_2024',
    publisher: 'U.S. Geological Survey',
    title: 'Effects of culverts on habitat connectivity in streams—A science synthesis to inform National Environmental Policy Act analyses',
    publicationDate: '2024-01-31',
    doi: '10.3133/sir20235132',
    url: 'https://doi.org/10.3133/sir20235132',
    xmlUrl: 'https://pubs.usgs.gov/sir/2023/5132/sir20235132.xml',
    pdfUrl: 'https://pubs.usgs.gov/sir/2023/5132/sir20235132.pdf',
    pdf: {
      bytes: 9_638_862,
      sha256: '8a4929964b2e32bab3e3e671ce5d3ab8649ae5a7bee5f0b24bdae83abd322798',
    },
  },
  nationalAquaticBarrierInventory2026: {
    id: 'nacc_national_aquatic_barrier_inventory_2026',
    publisher: 'National Aquatic Connectivity Collaborative; Southeast Aquatic Resources Partnership',
    title: 'National Aquatic Barrier Inventory — Aquatic Barrier Statistics',
    publicationDate: '2026-07-30',
    version: '4.3.0',
    url: 'https://tool.aquaticbarriers.org/statistics/',
  },
  culvertRemovalReview2026: {
    id: 'mcclelland_grant_culvert_removal_review_2026',
    publisher: 'Oxford University Press, Fisheries Magazine',
    title: 'Effect of culvert removal on abundance of Pacific salmon: A review',
    publicationDate: '2026-07-23',
    doi: '10.1093/fshmag/vuag047',
    url: 'https://doi.org/10.1093/fshmag/vuag047',
  },
  perchedCulvertRemoval2023: {
    id: 'gido_perched_culvert_removal_2023',
    publisher: 'University of Chicago Press, Freshwater Science; U.S. Geological Survey Publications Warehouse',
    title: 'A perched culvert and natural obstructions limit fish dispersal in an intermittent prairie stream',
    publicationDate: '2023-03-01',
    doi: '10.1086/723046',
    url: 'https://pubs.usgs.gov/publication/70256633',
  },
  tidalCulvertRestoration2026: {
    id: 'kendall_tidal_culvert_restoration_2026',
    publisher: 'Wiley, Ecological Solutions and Evidence',
    title: 'Fish movements before, during, and after restoration of tidal flow through culverts in two southern Florida USA mangrove creeks',
    publicationDate: '2026-04-01',
    doi: '10.1002/2688-8319.70244',
    url: 'https://doi.org/10.1002/2688-8319.70244',
  },
};

const [usgsXml, usgsPdf, inventoryPage, perchedPage] = await Promise.all([
  fetchBuffer(sources.usgsCulvertSynthesis2024.xmlUrl, 250_000),
  fetchBuffer(sources.usgsCulvertSynthesis2024.pdfUrl, 10_000_000),
  fetchBuffer(sources.nationalAquaticBarrierInventory2026.url, 100_000),
  fetchBuffer(sources.perchedCulvertRemoval2023.url, 100_000),
]);
const removalReview = await crossref(sources.culvertRemovalReview2026.doi);
const perchedCrossref = await crossref(sources.perchedCulvertRemoval2023.doi);
const tidalStudy = await crossref(sources.tidalCulvertRestoration2026.doi);

assert.equal(usgsPdf.length, sources.usgsCulvertSynthesis2024.pdf.bytes);
assert.equal(usgsPdf.subarray(0, 5).toString(), '%PDF-');
assert.equal(digest('sha256', usgsPdf), sources.usgsCulvertSynthesis2024.pdf.sha256);

const usgsText = normalize(usgsXml.toString('utf8'));
for (const phrase of [
  'smaller barriers at road crossings, like culverts, are prevalent and collectively have a substantial effect on habitat connectivity',
  'Culverts serve as barriers to the daily and seasonal movements of fish',
  'lower fish species richness and abundance at affected sites',
  'Channel constriction, perched outlets, and extreme flow velocities',
]) assert(usgsText.includes(phrase), `USGS synthesis no longer contains: ${phrase}`);

const inventoryHtml = inventoryPage.toString('utf8');
const nodePaths = [...new Set(inventoryHtml.match(/_app\/immutable\/nodes\/[^"']+\.js/g) ?? [])];
assert(nodePaths.length, 'Could not discover the barrier-statistics application module');
const nodeModules = await Promise.all(nodePaths.map(async modulePath => ({
  modulePath,
  body: await fetchBuffer(new URL(`/${modulePath}`, sources.nationalAquaticBarrierInventory2026.url), 500_000),
})));
const statisticsNode = nodeModules.find(({ body }) => body.includes(Buffer.from('Aquatic Barrier Statistics')));
assert(statisticsNode, 'Could not identify the barrier-statistics application module');
const statisticsNodeText = statisticsNode.body.toString('utf8');
assert(statisticsNodeText.includes('as of 7/30/2026 (version 4.3.0)'));
assert(statisticsNodeText.includes('surveyed crossings that are likely to impact aquatic organisms based on their barrier severity'));

const chunkPaths = [...new Set([...statisticsNodeText.matchAll(/\.\.\/chunks\/([^"']+\.js)/g)].map(match => `_app/immutable/chunks/${match[1]}`))];
const chunkModules = await Promise.all(chunkPaths.map(async modulePath => ({
  modulePath,
  body: await fetchBuffer(new URL(`/${modulePath}`, sources.nationalAquaticBarrierInventory2026.url), 1_500_000),
})));
const statisticsData = chunkModules.find(({ body }) => body.includes(Buffer.from('total_road_crossings:')));
assert(statisticsData, 'Could not discover the source-native road-crossing counts');
const statisticsDataText = statisticsData.body.toString('utf8');

const inventory = {
  reportedTotalRoadCrossingsField: numericProperty(statisticsDataText, 'total_road_crossings'),
  unsurveyedRoadCrossings: numericProperty(statisticsDataText, 'unsurveyed_road_crossings'),
  surveyedRoadStreamCrossings: numericProperty(statisticsDataText, 'total_small_barriers'),
  surveyedCrossingsEverClassifiedLikelyImpact: numericProperty(statisticsDataText, 'small_barriers'),
  analyzedForConnectivity: numericProperty(statisticsDataText, 'ranked_small_barriers'),
  removedOrImproved: numericProperty(statisticsDataText, 'removed_small_barriers'),
  reconnectedRiverMiles: numericProperty(statisticsDataText, 'removed_small_barriers_gain_miles'),
  upstreamMilesBehindLikelyBarriers: numericProperty(statisticsDataText, 'total_small_barrier_upstream_miles'),
  crossingsInThreatenedOrEndangeredSpeciesSubwatersheds: numericProperty(statisticsDataText, 'te_spp_road_crossings'),
  crossingsOnDiadromousHabitatReaches: numericProperty(statisticsDataText, 'diadromous_habitat_road_crossings'),
  likelyBarriersWithNoSurveyedDownstreamBarrier: numericProperty(statisticsDataText, 'no_downstream_barrier_small_barriers'),
};
inventory.currentSurveyedCrossingsLikelyImpact = inventory.surveyedCrossingsEverClassifiedLikelyImpact - inventory.removedOrImproved;
inventory.renderedIdentifiedCrossings = inventory.surveyedRoadStreamCrossings + inventory.unsurveyedRoadCrossings;
inventory.reportedTotalFieldAccountingDifference = inventory.renderedIdentifiedCrossings - inventory.reportedTotalRoadCrossingsField;
inventory.currentLikelyImpactShareOfSurveyedPercent = Number((100 * inventory.currentSurveyedCrossingsLikelyImpact / inventory.surveyedRoadStreamCrossings).toFixed(1));
inventory.surveyedShareOfRenderedIdentifiedPercent = Number((100 * inventory.surveyedRoadStreamCrossings / inventory.renderedIdentifiedCrossings).toFixed(1));
assert.deepEqual(inventory, {
  reportedTotalRoadCrossingsField: 6_306_757,
  unsurveyedRoadCrossings: 5_952_652,
  surveyedRoadStreamCrossings: 365_439,
  surveyedCrossingsEverClassifiedLikelyImpact: 181_070,
  analyzedForConnectivity: 97_646,
  removedOrImproved: 17_302,
  reconnectedRiverMiles: 78_065.2,
  upstreamMilesBehindLikelyBarriers: 259_623.1,
  crossingsInThreatenedOrEndangeredSpeciesSubwatersheds: 1_058_204,
  crossingsOnDiadromousHabitatReaches: 532_690,
  likelyBarriersWithNoSurveyedDownstreamBarrier: 9_074,
  currentSurveyedCrossingsLikelyImpact: 163_768,
  renderedIdentifiedCrossings: 6_318_091,
  reportedTotalFieldAccountingDifference: 11_334,
  currentLikelyImpactShareOfSurveyedPercent: 44.8,
  surveyedShareOfRenderedIdentifiedPercent: 5.8,
});

assert.equal(removalReview.record.title[0], sources.culvertRemovalReview2026.title);
const removalReviewAbstract = normalize(removalReview.record.abstract);
for (const phrase of ['11 studies', 'paucity of appropriate quantitative data', 'responses were not consistent', 'remains difficult to quantify']) {
  assert(removalReviewAbstract.includes(phrase), `Culvert-removal review no longer contains: ${phrase}`);
}
assert.equal(perchedCrossref.record.title[0], sources.perchedCulvertRemoval2023.title);
const perchedText = normalize(perchedPage.toString('utf8'));
for (const phrase of ['3 y before and 3 y after removing a perched culvert', 'no upstream fish movement occurred through the culvert', 'all 3 species were detected above the road crossing in each of the 3 y following removal', 'limited by a natural waterfall']) {
  assert(perchedText.includes(phrase), `Perched-culvert study page no longer contains: ${phrase}`);
}
assert.equal(normalize(tidalStudy.record.title[0]), sources.tidalCulvertRestoration2026.title);
const tidalStudyAbstract = normalize(tidalStudy.record.abstract);
for (const phrase of ['Only 4% of fish conclusively passed through the new culverts', 'Grey snapper did not pass through culverts', 'downstream benefits']) {
  assert(tidalStudyAbstract.includes(phrase), `Tidal-culvert study no longer contains: ${phrase}`);
}

const payload = {
  version: 'tulip_road_stream_crossing_current_reference_2026_09_25_v1',
  generatedOn: '2026-09-25',
  status: 'current_inventory_synthesis_and_restoration_boundary_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace a 2001-only structured rating with current barrier inventory, ecosystem synthesis and restoration studies while separating passage obstruction, habitat access, organism response, recovery and human consequences.',
  appliesToNodeIds: ['road_stream_crossing_barriers'],
  sources: {
    usgsCulvertSynthesis2024: {
      ...sources.usgsCulvertSynthesis2024,
      xml: { bytes: usgsXml.length, sha256: digest('sha256', usgsXml) },
    },
    nationalAquaticBarrierInventory2026: {
      ...sources.nationalAquaticBarrierInventory2026,
      landingPageSha256AtIngestion: digest('sha256', inventoryPage),
      applicationModule: { path: statisticsNode.modulePath, bytes: statisticsNode.body.length, sha256: digest('sha256', statisticsNode.body) },
      dataModule: { path: statisticsData.modulePath, bytes: statisticsData.body.length, sha256: digest('sha256', statisticsData.body) },
    },
    culvertRemovalReview2026: {
      ...sources.culvertRemovalReview2026,
      crossrefSha256AtIngestion: digest('sha256', removalReview.body),
    },
    perchedCulvertRemoval2023: {
      ...sources.perchedCulvertRemoval2023,
      crossrefSha256AtIngestion: digest('sha256', perchedCrossref.body),
      usgsPage: { bytes: perchedPage.length, sha256: digest('sha256', perchedPage) },
    },
    tidalCulvertRestoration2026: {
      ...sources.tidalCulvertRestoration2026,
      crossrefSha256AtIngestion: digest('sha256', tidalStudy.body),
    },
  },
  evidence: {
    currentUnitedStatesInventory: {
      asOf: '2026-07-30',
      version: '4.3.0',
      ...inventory,
      interpretation: 'The inventory demonstrates widespread U.S. barrier pressure. It is incomplete, most identified crossings are unsurveyed, surveyed crossings are not a representative national sample, and neither crossing count nor upstream miles is a global ecosystem-condition denominator.',
      accountingNote: 'The application renders identified crossings as surveyed plus unsurveyed. Its separately exposed total_road_crossings field differs by 11,334, so TULIP retains both values and does not silently reconcile them.',
    },
    synthesis: {
      finding: 'Small road-crossing barriers are prevalent and can collectively have substantial habitat-connectivity effects. Culverts can interrupt daily and seasonal fish movement, reduce access to refuges and spawning habitat, and contribute to lower local richness and abundance.',
      mechanisms: ['channel constriction', 'perched outlets', 'extreme flow velocities'],
      interpretation: 'The synthesis establishes causal mechanisms and documented local ecological consequences. It does not estimate a representative global percentage of ecosystem function lost.',
    },
    restorationEvidence: {
      systematicReview: {
        studies: 11,
        attemptedMetaAnalysis: true,
        metaAnalysisCompleted: false,
        reason: 'Insufficient appropriate quantitative data; the authors used a narrative review.',
        finding: 'Removal often improved habitat access, survival or abundance, but responses were inconsistent and population-recovery contribution remains difficult to quantify.',
      },
      perchedCulvertCase: {
        yearsBefore: 3,
        yearsAfter: 3,
        fishSpecies: 3,
        upstreamMovementBeforeRemoval: false,
        allTrackedSpeciesDetectedAboveAfterRemovalEachYear: true,
        recoveryAlsoLimitedByNaturalWaterfall: true,
        interpretation: 'The before-after case supports a direct passage effect and partial reversibility. It also shows that removal does not isolate every cause of population recovery.',
      },
      tidalCulvertCase: {
        fishConclusivelyPassingNewCulvertsPercent: 4,
        greySnapperPassed: false,
        interpretation: 'A recent local case found limited direct passage and possible downstream benefits, showing that response depends on species, flow and site conditions.',
      },
    },
    domainBoundary: {
      compatibleCurrentHarmedPersonCount: null,
      compatibleCurrentEssentialServiceLoss: null,
      compatibleGlobalEcosystemConditionLossPercent: null,
      compatibleGlobalAffectedEcosystemDistributionPercent: null,
      compatibleRecoveryDurationDistribution: null,
      interpretation: 'The admitted evidence directly supports an ecosystem passage-and-connectivity node. Human health, service and economic outcomes remain in their own nodes unless a direct non-overlapping terminal endpoint is supplied.',
    },
  },
  ratingDecision: {
    change: 'revised',
    candidate: {
      prior: { value: 5.1, grade: 'C', lower: 2.9, upper: 7.4, confidence: 'C', domains: ['human', 'ecosystem'] },
      revised: { value: 4.8, grade: 'C', lower: 2.5, upper: 7, confidence: 'C', domains: ['ecosystem'] },
    },
    axes: {
      human: {
        severity: { lower: 0, central: 0, upper: 0 },
        reach: { lower: 0, central: 0, upper: 0 },
        persistence: { lower: 0, central: 0, upper: 0 },
        structuralZero: true,
      },
      ecosystem: {
        severity: { lower: 0, central: 1, upper: 2 },
        reach: { lower: 1, central: 2, upper: 3 },
        persistence: { lower: 1, central: 2, upper: 3 },
      },
    },
    excludedUses: [
      'Do not treat the U.S. crossing inventory as a global barrier or ecosystem-harm denominator.',
      'Do not treat the surveyed crossings as a representative sample of all crossings; inventory coverage and survey protocols vary by place.',
      'Do not convert crossing counts, upstream river length, threatened-species subwatersheds or diadromous-habitat crossings into percentages of ecosystem condition lost.',
      'Do not add overlapping threatened-species and diadromous-habitat counts or treat their presence as demonstrated harm.',
      'Do not use barrier age, study duration or monitoring duration as consequence persistence or recovery time.',
      'Do not treat removal or improvement as complete ecological recovery; responses vary by species, habitat and other natural or human barriers.',
      'Do not generalize local fish-passage effects into a global average severity or reach.',
      'Do not add reservoir, fisheries, flood, water-service or general river-fragmentation ratings to this node.',
    ],
    exactRemainingGaps: [
      'A representative current estimate of aquatic ecosystem condition loss attributable specifically to road-stream crossings.',
      'The affected share of relevant aquatic species or ecosystem distributions rather than crossing count, river miles or subwatershed overlap.',
      'A global or explicitly aggregated multi-region barrier-condition inventory with comparable survey protocols.',
      'A recovery-time distribution after repair or removal that separates passage restoration from population and ecosystem recovery.',
      'A direct non-overlapping human endpoint attributable specifically to passage barriers before activating the human domain.',
      'A compatible 2027–2036 SSP2-4.5 consequence projection; physical changes in flow alone do not establish terminal harm.',
    ],
  },
};

payload.snapshotDigest = digest('sha256', JSON.stringify(payload));
await writeFile(output, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ output, snapshotDigest: payload.snapshotDigest }, null, 2));
