import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'fish-landing-supply-disruption-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+fish-landing-supply-disruption-evidence-ingestion)';

const sources = {
  fishstat: {
    id: 'fao_fishstat_global_marine_capture_2026',
    publisher: 'Food and Agriculture Organization of the United Nations',
    title: 'FAO FishStat Global Capture Production 2026.1.0',
    publicationDate: '2026',
    url: 'https://www.fao.org/fishery/static/FishStatJ/FAO_FI_Global_Production_2026.1.0.fws',
    documentationUrl: 'https://www.fao.org/fishery/en/collection/capture',
  },
  bcrpAnnualReport: {
    id: 'bcrp_peru_annual_report_2025_fishing',
    publisher: 'Central Reserve Bank of Peru',
    title: 'Annual Report 2025, Annex 6: Marine fishing production by destination and principal species',
    publicationDate: '2026',
    url: 'https://www.bcrp.gob.pe/docs/Publicaciones/Memoria/2025/memoria-bcrp-2025-9.pdf',
    locator: 'Annex 6, page 255: industrial-use catch, direct-human-consumption catch and fishing GDP annual changes for 2016–2025.',
    retrievalMode: 'manual_primary_source_review',
    retrievalNote: 'The official origin blocks automated non-browser PDF retrieval. The numerical table was checked in the official document; reproducible BCRPData series below independently preserve the recent direction and heterogeneity.',
  },
  bcrpAnnualSeries: {
    id: 'bcrp_peru_marine_fishing_annual_change_api',
    publisher: 'Central Reserve Bank of Peru',
    title: 'Marine fishing extraction by destination and principal species, annual percentage change',
    publicationDate: '2026',
    url: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PM05115AA/json/2016/2025/esp',
    seriesCode: 'PM05115AA',
  },
  bcrpDirectConsumptionSeries: {
    id: 'bcrp_peru_direct_human_consumption_fishing_monthly_api',
    publisher: 'Central Reserve Bank of Peru',
    title: 'Marine fishing for direct human consumption, monthly year-on-year percentage change',
    publicationDate: '2026',
    url: 'https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PN01850AM/json/2023-1/2025-12/esp',
    seriesCode: 'PN01850AM',
  },
  faoRecovery: {
    id: 'fao_latin_america_aquatic_trade_2026_anchoveta_recovery',
    publisher: 'Food and Agriculture Organization of the United Nations',
    title: 'Latin America and the Caribbean records USD 21 billion in aquatic animal trade surplus',
    publicationDate: '2026-06-23',
    url: 'https://www.fao.org/americas/news/news-detail/sofi-2026/en',
  },
};

const expected = {
  fishstatSnapshot: { bytes: 4_864, sha256: '86ea108ade682535ecc7f3a54811f0cdeedd1f4ee5cef1299b85ce6b620b57c8' },
  bcrpAnnualSeries: { bytes: 796, sha256: '84f17f13781b0ed0651e65c888ef75475904fa0b89995d04ef89cc1720890017' },
  bcrpDirectConsumptionSeries: { bytes: 2_191, sha256: '998b15b7cdfd6326a8cb3da25bcd7513b27b1c281e6f9e451ad7eb5853379e8b' },
  faoRecoveryPage: { bytes: 84_556, sha256: '8603646a3726b18703d5063c53bbc8e400e2a0108cedbeff1510090307d04f6e' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '120',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: 2_000_000, timeout: 130_000 });
  return stdout;
}

const [fishstatBuffer, annualSeriesBuffer, directConsumptionBuffer, faoRecoveryBuffer] = await Promise.all([
  readFile(path.join(root, 'public', 'fao-fishstat-marine-capture-snapshot.json')),
  fetchBuffer(sources.bcrpAnnualSeries.url),
  fetchBuffer(sources.bcrpDirectConsumptionSeries.url),
  fetchBuffer(sources.faoRecovery.url),
]);
for (const [label, buffer, check] of [
  ['FAO FishStat snapshot', fishstatBuffer, expected.fishstatSnapshot],
  ['BCRP annual series', annualSeriesBuffer, expected.bcrpAnnualSeries],
  ['BCRP direct-consumption series', directConsumptionBuffer, expected.bcrpDirectConsumptionSeries],
  ['FAO recovery page', faoRecoveryBuffer, expected.faoRecoveryPage],
]) {
  assert.equal(buffer.length, check.bytes, `${label} byte count changed`);
  assert.equal(sha256(buffer), check.sha256, `${label} checksum changed`);
}

const fishstat = JSON.parse(fishstatBuffer.toString('utf8'));
const annualSeries = JSON.parse(annualSeriesBuffer.toString('utf8'));
const directConsumptionSeries = JSON.parse(directConsumptionBuffer.toString('utf8'));
const faoRecoveryHtml = faoRecoveryBuffer.toString('utf8');
assert.equal(fishstat.source.id, sources.fishstat.id);
assert.equal(annualSeries.config.series[0].name.includes('PBI Pesca'), true);
assert.equal(directConsumptionSeries.config.series[0].name.includes('Consumo Humano Directo'), true);
assert.match(faoRecoveryHtml, /catches increasing by nearly 65 percent, from 3\.5 million tonnes to 5\.7 million tonnes/i);

const globalSeries = fishstat.series;
const global2023 = globalSeries.find(row => row.year === 2023);
const global2024 = globalSeries.find(row => row.year === 2024);
assert.deepEqual(global2023, { year: 2023, tonnes: 78_372_507.279 });
assert.deepEqual(global2024, { year: 2024, tonnes: 79_619_643.538 });

const annualByYear = Object.fromEntries(annualSeries.periods.map(row => [Number(row.name), Number(row.values[0])]));
assert.equal(Number(annualByYear[2023].toFixed(1)), -34.4);
assert.equal(Number(annualByYear[2024].toFixed(1)), 63.1);
assert.equal(Number(annualByYear[2025].toFixed(1)), 6.7);
const directConsumptionByYear = Object.fromEntries([2023, 2024, 2025].map(year => {
  const values = directConsumptionSeries.periods.filter(row => row.name.endsWith(String(year))).map(row => Number(row.values[0]));
  assert.equal(values.length, 12);
  return [year, {
    months: values.length,
    negativeMonths: values.filter(value => value < 0).length,
    minimumYearOnYearPercent: Number(Math.min(...values).toFixed(1)),
    maximumYearOnYearPercent: Number(Math.max(...values).toFixed(1)),
  }];
}));

const snapshot = {
  version: 'tulip_fish_landing_supply_disruption_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'production_volume_separated_from_human_consequence_with_bounded_peru_case',
  productionRatingsEnabled: 0,
  purpose: 'Replace global catch tonnage as a false terminal-harm measure with a bounded case that separates industrial landings, direct-food landings, fishing-sector output and human consequences.',
  sources: {
    fishstat: { ...sources.fishstat, retrievedOn: fishstat.captured_at, localSnapshot: expected.fishstatSnapshot },
    bcrpAnnualReport: { ...sources.bcrpAnnualReport, checkedOn },
    bcrpAnnualSeries: { ...sources.bcrpAnnualSeries, retrievedOn: checkedOn, fetchedResponse: expected.bcrpAnnualSeries },
    bcrpDirectConsumptionSeries: { ...sources.bcrpDirectConsumptionSeries, retrievedOn: checkedOn, fetchedResponse: expected.bcrpDirectConsumptionSeries },
    faoRecovery: { ...sources.faoRecovery, retrievedOn: checkedOn, fetchedPage: expected.faoRecoveryPage },
  },
  currentWindow: {
    start: 2023,
    end: 2025,
    coverageStatus: 'partial',
    summaryMethod: 'event_distribution',
    coverageNote: 'The FAO series provides global production volume, while official Peru records provide a recent climate-linked disruption and recovery case. They do not provide a representative global distribution of people harmed, household food loss, income loss or recovery time.',
  },
  endpoints: {
    globalProductionContext: {
      metric: 'Global annual marine capture production',
      observation2023Tonnes: global2023.tonnes,
      observation2024Tonnes: global2024.tonnes,
      yearOnYearChangePercent: Number(((global2024.tonnes / global2023.tonnes - 1) * 100).toFixed(2)),
      interpretation: 'Global tonnage can remain stable while regions, species and landing chains experience severe disruption. It is production context, not a count of people harmed or the severity of a supply interruption.',
    },
    peruObservedDisruptionAndRecovery: {
      bcrpAnnualApiPercentageChanges: { '2023': annualByYear[2023], '2024': annualByYear[2024], '2025': annualByYear[2025] },
      bcrpLatestAnnualReport: {
        industrialUseCatchChangePercent: { '2023': -51.0, '2024': 133.6, '2025': -0.3 },
        directHumanConsumptionCatchChangePercent: { '2023': 7.1, '2024': -10.9, '2025': 6.7 },
        fishingGdpChangePercent: { '2023': -21.2, '2024': 27.2, '2025': 2.9 },
      },
      directHumanConsumptionMonthlyHeterogeneity: directConsumptionByYear,
      faoAnchovetaRecovery: { declineLinkedTo: '2023 El Niño event', catches2023MillionTonnes: 3.5, catches2024MillionTonnes: 5.7, increasePercentApproximate: 65 },
      interpretation: 'The 2023 shock was concentrated in industrial-use anchoveta landings and fishing-sector output. Direct-food landings followed a different path, and the strong 2024 recovery shows that the observed case was material but not permanent.',
    },
    humanConsequences: {
      compatibleUniqueHarmedPersonCount: null,
      compatibleHouseholdFoodShortfall: null,
      compatibleIncomeLossTotal: null,
      compatibleRecoveryDurationDistribution: null,
      interpretation: 'Fishing GDP and landing changes establish material economic disruption, but the sources do not count unique people with food insecurity, lost income or essential-service loss.',
    },
    ecosystemConsequences: {
      compatibleDirectEcosystemConditionLossPercent: null,
      compatibleDirectEcosystemDistributionAffectedPercent: null,
      compatibleRecoveryDuration: null,
      interpretation: 'This node covers the landing-to-market supply chain. Stock condition, overfishing, ocean warming, ecosystem change and bycatch remain with their dedicated nodes.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the Peru 2023–2025 record as a direct, bounded case of climate-linked landing disruption, material sector-output loss and recovery.',
      'Use the split between industrial and direct-human-consumption landings to prevent total catch from masquerading as food-access harm.',
      'Use global FAO tonnage only as production-volume context and as evidence that global aggregation can hide regional disruption.',
      'Retain the absence of harmed-person, household-shortfall, income-loss and recovery distributions in confidence and uncertainty.',
    ],
    prohibited: [
      'Do not convert global tonnes landed, percentage production change or fishing GDP change into people harmed.',
      'Do not treat industrial anchoveta landings, fishmeal output or export volume as direct household seafood availability.',
      'Do not transfer Peru’s percentage changes to all fisheries, years, species or landing chains.',
      'Do not treat the 1991–2024 global record length or repeated annual fluctuations as consequence persistence.',
      'Do not score fish-stock, ecosystem, bycatch, climate or overfishing effects again in this supply-chain node.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'fish_landing_supply_disruption',
      rating: 'C 4.8',
      uncertainty: 'B 3.3 to C 5.5',
      confidence: 'C',
      domains: ['human'],
      reason: 'The direct Peru case supports material economic disruption lasting across a fishing season, while the strong recovery and divergence between industrial and direct-food landings rule out a broad permanent food-supply interpretation. The central rating is retained, but the range narrows and confidence falls because no compatible harmed-person or household-loss denominator exists.',
    },
  },
  unresolvedForTulip: [
    'Build a multi-country cause-coded landing-disruption dataset that separates industrial reduction fisheries from direct human food supply.',
    'Link landing interruptions to unique fishing households, income loss, seafood availability, prices and food-security outcomes without double counting.',
    'Measure disruption and recovery duration at ports, processors and markets rather than using the production-series length.',
    'Keep stock condition and ecosystem consequences in their own nodes unless a non-overlapping terminal endpoint is demonstrated.',
  ],
};
snapshot.snapshotDigest = digest({ sources: snapshot.sources, currentWindow: snapshot.currentWindow, endpoints: snapshot.endpoints, tulipUse: snapshot.tulipUse, unresolvedForTulip: snapshot.unresolvedForTulip });
await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, status: snapshot.status, recommendation: snapshot.tulipUse.currentCatalogueRecommendation, digest: snapshot.snapshotDigest }, null, 2));
