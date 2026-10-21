import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'anaerobic-manure-lagoon-current-reference-snapshot.json');
const sha256 = body => createHash('sha256').update(body).digest('hex');
const text = body => body.toString('utf8').replace(/<[^>]+>/g, ' ').replace(/&(?:nbsp|#160);/g, ' ').replace(/\s+/g, ' ').trim();

async function fetchBuffer(url, maximumBytes = 3_000_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: { accept: '*/*', 'user-agent': 'Mozilla/5.0 LostPlanet-TULIP/1.0 (+manure-lagoon-evidence-ingestion; mailto:research@tulip.earth)' },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

const sources = {
  epaAfo2025: {
    id: 'epa_animal_feeding_operations_environmental_considerations_2025',
    publisher: 'U.S. Environmental Protection Agency',
    title: 'Animal Feeding Operations (AFOs)',
    publicationDate: '2025-12-12',
    url: 'https://www.epa.gov/npdes/animal-feeding-operations-afos',
  },
  epaWynja2025: {
    id: 'epa_wynja_feedlot_settlement_2025',
    publisher: 'U.S. Environmental Protection Agency',
    title: 'Wynja Feedlot Settlement Information Sheet',
    publicationDate: '2025-11-17',
    url: 'https://www.epa.gov/enforcement/wynja-feedlot-settlement-information-sheet',
  },
  epaGroundwaterStudy2025: {
    id: 'lawrinenko_cafo_groundwater_remediation_2025',
    publisher: 'Journal of Environmental Management; U.S. Environmental Protection Agency; PubMed Central',
    title: 'Long-term field study of nitrate and ammonium remediation using a permeable reactive barrier at a livestock feeding operation',
    publicationDate: '2025-03-17',
    doi: '10.1016/j.jenvman.2025.124962',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40101484/',
    fetchUrl: 'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pubmed.cgi/bioc_json/40101484/unicode',
  },
  usdaLagoonMapping2025: {
    id: 'usda_ars_swine_lagoon_mapping_2025',
    publisher: 'U.S. Department of Agriculture, Agricultural Research Service',
    title: 'Learning-based filtering algorithm to recognize and retrieve features of swine lagoons in agricultural landscapes using aerial ortho-imagery',
    publicationDate: '2025-08-21',
    doi: '10.1016/j.atech.2025.101347',
    url: 'https://www.ars.usda.gov/research/publications/publication/?seqNo115=424083',
  },
};

const entries = await Promise.all(Object.values(sources).map(async source => ({ source, body: await fetchBuffer(source.fetchUrl ?? source.url) })));
const byId = Object.fromEntries(entries.map(entry => [entry.source.id, entry]));
const afoText = text(byId[sources.epaAfo2025.id].body);
const wynjaText = text(byId[sources.epaWynja2025.id].body);
const groundwaterText = text(byId[sources.epaGroundwaterStudy2025.id].body);
const mappingText = text(byId[sources.usdaLagoonMapping2025.id].body);

for (const phrase of ['nitrogen and phosphorus', 'pathogens', 'hormones', 'antibiotics']) {
  assert(afoText.includes(phrase), `EPA AFO page no longer contains: ${phrase}`);
}
for (const phrase of ['three consecutive days in March 2021', '4.5 million gallons of wastewater per year', '137,000 pounds per year', 'unsafe for recreation']) {
  assert(wynjaText.includes(phrase), `EPA settlement page no longer contains: ${phrase}`);
}
for (const phrase of ['continued risk for eutrophication even ten years after installation', 'failed manure containment', 'toxic concentrations of ammonium and nitrate']) {
  assert(groundwaterText.includes(phrase), `Groundwater study no longer contains: ${phrase}`);
}
for (const phrase of ['two agricultural watersheds in North Carolina', 'accuracy at detecting lagoon-based swine farms was above 98%', 'sources of harmful gas emissions']) {
  assert(mappingText.includes(phrase), `USDA lagoon study no longer contains: ${phrase}`);
}

const payload = {
  version: 'tulip_anaerobic_manure_lagoon_current_reference_2026_09_25_v1',
  generatedOn: '2026-09-25',
  status: 'current_direct_consequence_and_scope_boundary_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace a 2001-only structured classification with current direct water-quality, groundwater-remediation and facility-mapping evidence while keeping lagoon operation separate from downstream methane, nutrient-pollution and climate scores.',
  appliesToNodeIds: ['anaerobic_manure_lagoon_operation'],
  sources: Object.fromEntries(Object.entries(sources).map(([key, source]) => {
    const body = byId[source.id].body;
    return [key, { ...source, bytes: body.length, sha256AtIngestion: sha256(body) }];
  })),
  evidence: {
    currentOperationalBoundary: {
      pollutants: ['nitrogen', 'phosphorus', 'organic matter', 'sediments', 'pathogens', 'hormones', 'antibiotics'],
      interpretation: 'EPA identifies plausible pollutants from animal feeding operations. This establishes pathways and regulatory relevance, not the fraction of lagoons leaking or the number of people or ecosystems harmed.',
    },
    directSurfaceWaterCase: {
      observedDischargeDays: 3,
      observationYear: 2021,
      publicationYear: 2025,
      annualWastewaterPreventedBySettlementGallons: 4_500_000,
      annualPollutantReductionPounds: 137_000,
      directConsequences: ['downstream water-quality degradation', 'water unsafe for recreation from disease-causing bacteria', 'ammonia toxic to aquatic life'],
      interpretation: 'This is a bounded U.S. facility case. Prevented volume and pollutant mass measure control scale, not people harmed or ecosystem-distribution reach.',
    },
    longTermGroundwaterCase: {
      publicationYear: 2025,
      monitoringYears: 10,
      initialGroundwaterContaminants: ['ammonium', 'nitrate'],
      continuedSurfaceWaterEutrophicationRiskAfterYears: 10,
      directConsequence: 'Failed containment produced toxic ammonium and nitrate concentrations; remediation reduced nitrogen while phosphorus still placed surface water at continued eutrophication risk after ten years.',
      interpretation: 'The study supports persistent local water-quality consequences and incomplete remediation. It is one contaminated site and cannot supply global prevalence, harmed-person reach or a universal recovery time.',
    },
    currentMappingBoundary: {
      validationWatersheds: 2,
      detectionAccuracyPercentAbove: 98,
      interpretation: 'The 2025 USDA study demonstrates that lagoon systems can be mapped at high accuracy in two North Carolina watersheds. It does not estimate global lagoon prevalence or terminal harm.',
    },
    domainBoundary: {
      compatibleCurrentUniqueHarmedPersonCount: null,
      compatibleGlobalAffectedEcosystemDistributionPercent: null,
      compatibleRepresentativeLagoonFailureRate: null,
      compatibleGlobalRecoveryDistribution: null,
      interpretation: 'Direct local human water-use impairment and ecosystem water-quality consequences are admitted. Airport, global methane, warming and generic nutrient-pollution consequences remain in their own nodes and are not added.',
    },
  },
  ratingDecision: {
    change: 'revised',
    candidate: {
      prior: { value: 5.1, grade: 'C', lower: 2.9, upper: 7.4, confidence: 'C', domains: ['human', 'ecosystem'] },
      revised: { value: 4.0, grade: 'B', lower: 2.1, upper: 6.3, confidence: 'C', domains: ['human', 'ecosystem'] },
    },
    axes: {
      human: {
        severity: { lower: 0, central: 1, upper: 2 },
        reach: { lower: 0, central: 1, upper: 2 },
        persistence: { lower: 0, central: 1, upper: 2 },
      },
      ecosystem: {
        severity: { lower: 1, central: 1, upper: 2 },
        reach: { lower: 0, central: 1, upper: 2 },
        persistence: { lower: 2, central: 3, upper: 4 },
      },
    },
    excludedUses: [
      'Do not treat every animal feeding operation as using an anaerobic lagoon or as leaking.',
      'Do not convert wastewater volume, pollutant mass, facility count, livestock count or mapped lagoon area into harmed-person or ecosystem-distribution reach.',
      'Do not generalize one facility discharge or one remediation site into a national or global average severity.',
      'Do not treat monitoring duration as consequence persistence unless the study documents a continuing consequence.',
      'Do not add Methane Emissions, Nutrient Pollution, Global Temperature or Airport Climate Exposure scores to this node.',
      'Do not count potential pathogens or toxic pollutants as demonstrated illness without a measured human outcome.',
    ],
    exactRemainingGaps: [
      'A representative current distribution of lagoon leakage, overflow or harmful operating conditions.',
      'A compatible count of unique people with direct health, water-service or material consequences attributable specifically to lagoon operation.',
      'The affected share of relevant freshwater or terrestrial ecosystem distributions with lagoon-attributable condition loss.',
      'A multi-site recovery-time distribution after containment repair, closure or remediation.',
      'A comparable multi-country inventory separating lagoon systems from deep pits, tanks, digesters and land application.',
      'A compatible 2027–2036 SSP2-4.5 terminal-consequence projection.',
    ],
  },
};
payload.snapshotDigest = sha256(JSON.stringify(payload));
await writeFile(output, JSON.stringify(payload, null, 2) + '\n');
console.log(JSON.stringify({ output, sources: Object.keys(payload.sources).length, digest: payload.snapshotDigest }, null, 2));
