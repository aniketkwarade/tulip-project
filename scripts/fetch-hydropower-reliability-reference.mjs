import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'hydropower-reliability-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+hydropower-reliability-evidence-ingestion)';

const sources = {
  ember: {
    id: 'ember_global_electricity_data', publisher: 'Ember', title: 'Yearly Electricity Data', publicationDate: '2026-06-23',
    url: 'https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/yearly_full_release_long_format.csv',
    sourcePageUrl: 'https://ember-energy.org/data/electricity-data-explorer/', license: 'CC BY 4.0',
  },
  iea2024: {
    id: 'iea_electricity_2024_hydropower_reliability', publisher: 'International Energy Agency', title: 'Electricity 2024', publicationDate: '2024-01',
    url: 'https://iea.blob.core.windows.net/assets/18f3ed24-4b26-4c83-a3d2-8a1be51c8cc8/Electricity2024-Analysisandforecastto2026.pdf',
    reportPageUrl: 'https://www.iea.org/reports/electricity-2024', license: 'CC BY 4.0',
  },
  iea2025: {
    id: 'iea_electricity_2025_ecuador_hydropower_outages', publisher: 'International Energy Agency', title: 'Electricity 2025', publicationDate: '2025-02',
    url: 'https://iea.blob.core.windows.net/assets/501f74d2-ba32-414c-9aa8-a41b69ae1fc2/Electricity2025.pdf',
    reportPageUrl: 'https://www.iea.org/reports/electricity-2025', license: 'CC BY 4.0',
  },
};

const expected = {
  emberSnapshot: { bytes: 76_104, sha256: 'b034648510ba6c5e9af5e6bc2bf0fe22b8526c59baa693ffef6061e0274abc61' },
  iea2024: { bytes: 6_591_657, sha256: '3a7e400827e2c53c62ea711d565f57be6162a5821687386ef1d4732d9d605162' },
  iea2025: { bytes: 7_579_119, sha256: '7ec25aab1f06ed7e6e20aff4e5e3a02bfc0c657114eca712968534eb88673b1c' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', ['--location', '--fail', '--silent', '--show-error', '--max-time', '240', '--header', `User-Agent: ${userAgent}`, url], { encoding: null, maxBuffer: 12_000_000, timeout: 250_000 });
  return stdout;
}

const [emberBuffer, iea2024Pdf, iea2025Pdf] = await Promise.all([
  readFile(path.join(root, 'public', 'ember-global-power-snapshot.json')),
  fetchBuffer(sources.iea2024.url),
  fetchBuffer(sources.iea2025.url),
]);
for (const [label, buffer, check] of [
  ['Ember snapshot', emberBuffer, expected.emberSnapshot],
  ['IEA Electricity 2024', iea2024Pdf, expected.iea2024],
  ['IEA Electricity 2025', iea2025Pdf, expected.iea2025],
]) {
  assert.equal(buffer.length, check.bytes, `${label} byte count changed`);
  assert.equal(sha256(buffer), check.sha256, `${label} checksum changed`);
}

const emberSnapshot = JSON.parse(emberBuffer.toString('utf8'));
const hydroRows = emberSnapshot.records.filter(record => record.node_id === 'hydropower_reliability_decline').sort((a, b) => a.observation_year - b.observation_year);
assert.equal(hydroRows.length, 26);
assert(hydroRows.every(record => record.unit === 'TWh' && record.metric_id === 'hydropower_availability_and_generation_shortfall'));
const first = hydroRows[0];
const latest = hydroRows.at(-1);
const previous = hydroRows.at(-2);
assert.deepEqual({ year: first.observation_year, value: first.value }, { year: 2000, value: 2629.67 });
assert.deepEqual({ year: latest.observation_year, value: latest.value }, { year: 2025, value: 4432.3 });

const snapshot = {
  version: 'tulip_hydropower_reliability_reference_2026_09_23_v1', generatedOn: checkedOn,
  status: 'generation_volume_separated_from_reliability_with_direct_outage_case', productionRatingsEnabled: 0,
  purpose: 'Replace total hydropower generation as a false reliability and harm proxy with direct capacity-factor evidence and a bounded, attributable electricity-service disruption case.',
  sources: {
    ember: { ...sources.ember, retrievedOn: emberSnapshot.captured_at, localSnapshot: expected.emberSnapshot, sourceLastModified: emberSnapshot.source.source_last_modified, sourceEtag: emberSnapshot.source.source_etag },
    iea2024: { ...sources.iea2024, retrievedOn: checkedOn, fetchedDocument: expected.iea2024, locator: 'Pages 14 and 55: global hydropower generation fell more than 2% in 2023; capacity factor fell below 40%, the lowest in at least three decades and below the 2015–2022 average of 42%.' },
    iea2025: { ...sources.iea2025, retrievedOn: checkedOn, fetchedDocument: expected.iea2025, locator: 'Page 108: Ecuador hydropower reservoirs supplied 75% of electricity; drought and lost Colombian imports led to nationwide cuts up to 8 hours per day in April and 14 hours per day in November 2024, with industry estimating USD 12 million lost per outage hour.' },
  },
  currentWindow: { start: 2023, end: 2025, coverageStatus: 'partial', summaryMethod: 'event_distribution', coverageNote: 'IEA supplies global 2023 capacity-factor evidence and a direct 2024 Ecuador outage case. Ember supplies complete global generation volume through 2025, but total TWh is not a reliability, shortage or harm measure.' },
  endpoints: {
    generationVolumeContext: {
      firstYear: first.observation_year, firstTWh: first.value, latestYear: latest.observation_year, latestTWh: latest.value,
      previousYear: previous.observation_year, previousTWh: previous.value,
      latestYearChangePercent: Number(((latest.value / previous.value - 1) * 100).toFixed(2)),
      interpretation: 'Total generation combines capacity, demand, inflow and utilisation. Rising long-run TWh does not disprove regional reliability loss, and one-year volume change does not count outages or harm.',
    },
    globalReliabilityState2023: {
      generationYearOnYearChangePercentLessThan: -2,
      capacityFactorPercentLessThan: 40,
      comparison2015To2022AveragePercent: 42,
      comparison2004To2014AveragePercent: 44,
      affectedCountriesNamed: ['Canada', 'China', 'Colombia', 'Costa Rica', 'India', 'Mexico', 'Türkiye', 'United States', 'Viet Nam'],
      interpretation: 'Capacity factor is a direct utilisation and availability indicator. Named countries establish multi-region occurrence, not people harmed or a global outage rate.',
    },
    ecuadorServiceConsequence2024: {
      hydropowerShareElectricityPercent: 75,
      aprilPowerCutsHoursPerDayUpTo: 8,
      novemberPowerCutsHoursPerDayUpTo: 14,
      estimatedIndustryLossUsdPerOutageHour: 12_000_000,
      coDrivers: ['El Niño drought', 'critically low reservoir levels', 'halted electricity imports from drought-affected Colombia'],
      interpretation: 'This is a direct national service and material-loss case. It does not establish a representative global harmed-person count, loss total or outage-duration distribution.',
    },
    humanConsequences: { compatibleGlobalHarmedPersonCount: null, compatibleGlobalAnnualMaterialLoss: null, compatibleGlobalRecoveryDuration: null },
    ecosystemConsequences: {
      compatibleDirectEcosystemConditionLossPercent: null, compatibleDirectEcosystemDistributionAffectedPercent: null, compatibleRecoveryDuration: null,
      interpretation: 'The node measures reliability of electricity generation. Dam, river-flow, fossil-substitution emissions and aquatic-ecosystem consequences remain with their dedicated nodes.',
    },
  },
  tulipUse: {
    admitted: [
      'Use IEA capacity factor and year-on-year generation change as direct evidence of a 2023 global reliability stress state.',
      'Use Ecuador’s 2024 rationing and material-loss estimate as a direct bounded human-consequence case.',
      'Use Ember total generation only as system-volume history and to expose why TWh alone cannot measure reliability.',
      'Keep the Ecuador co-drivers and non-representative geography in the uncertainty bounds.',
    ],
    prohibited: [
      'Do not treat total global hydropower generation as a generation shortfall, outage rate or harmed-person count.',
      'Do not treat named affected countries, hydropower market share or capacity-factor coverage as people harmed.',
      'Do not transfer Ecuador’s outage hours, dependence or loss rate unchanged to all hydropower systems.',
      'Do not treat the thirty-year capacity-factor comparison or 2000–2025 Ember record as consequence persistence.',
      'Do not score dam impacts, river ecology, replacement-fuel emissions or climate consequences again in this node.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'hydropower_reliability_decline', rating: 'C 4.8', uncertainty: 'B 3.3 to D 7.0', confidence: 'C', domains: ['human'],
      reason: 'A direct national outage and economic-loss case supports material human consequences, while the global capacity-factor decline establishes multi-region reliability stress. The previous C 4.8 result happens to retain its number, but it loses an unsupported ecosystem component, replaces total TWh as the harm proxy and widens the interpretation around a non-representative direct case.',
    },
  },
  unresolvedForTulip: [
    'Build a cause-coded international hydropower shortfall, load-shedding and outage-duration dataset with unique users and service consequences.',
    'Join country capacity-factor anomalies to backup supply, imports, demand response and electricity-market conditions before estimating attributable loss.',
    'Test the Ecuador consequence conversion against other highly dependent and diversified electricity systems.',
    'Keep hydropower reliability separate from dam construction, river ecology and fossil-replacement emissions.',
  ],
};
snapshot.snapshotDigest = digest({ sources: snapshot.sources, currentWindow: snapshot.currentWindow, endpoints: snapshot.endpoints, tulipUse: snapshot.tulipUse, unresolvedForTulip: snapshot.unresolvedForTulip });
await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output, status: snapshot.status, recommendation: snapshot.tulipUse.currentCatalogueRecommendation, digest: snapshot.snapshotDigest }, null, 2));
