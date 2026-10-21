import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'gas-power-dependence-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+gas-power-dependence-evidence-ingestion)';

const sources = {
  ember: {
    id: 'ember_global_electricity_data',
    publisher: 'Ember',
    title: 'Yearly Electricity Data',
    publicationDate: '2026-06-23',
    url: 'https://storage.googleapis.com/emb-prod-bkt-publicdata/public-downloads/yearly_full_release_long_format.csv',
    methodologyUrl: 'https://files.ember-energy.org/public-downloads/ember_electricity_data_methodology.pdf',
    sourcePageUrl: 'https://ember-energy.org/data/electricity-data-explorer/',
    license: 'CC BY 4.0',
  },
  iea: {
    id: 'iea_world_energy_outlook_2022_gas_power_affordability',
    publisher: 'International Energy Agency',
    title: 'World Energy Outlook 2022',
    publicationDate: '2022-10',
    url: 'https://iea.blob.core.windows.net/assets/7e42db90-d8ea-459d-be1e-1256acd11330/WorldEnergyOutlook2022.pdf',
    reportPageUrl: 'https://www.iea.org/reports/world-energy-outlook-2022',
    license: 'CC BY 4.0',
  },
};

const expected = {
  emberSnapshot: { bytes: 76_104, sha256: 'b034648510ba6c5e9af5e6bc2bf0fe22b8526c59baa693ffef6061e0274abc61' },
  ieaReport: { bytes: 14_316_974, sha256: '060beaef95f0fb86ffc758631ced295a3cbdc80aadbfe6bf52c36fe45c1829f4' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '240',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: 20_000_000, timeout: 250_000 });
  return stdout;
}

const [emberBuffer, ieaPdf] = await Promise.all([
  readFile(path.join(root, 'public', 'ember-global-power-snapshot.json')),
  fetchBuffer(sources.iea.url),
]);

assert.equal(emberBuffer.length, expected.emberSnapshot.bytes, 'Ember snapshot byte count changed');
assert.equal(sha256(emberBuffer), expected.emberSnapshot.sha256, 'Ember snapshot checksum changed');
assert.equal(ieaPdf.length, expected.ieaReport.bytes, 'IEA report byte count changed');
assert.equal(sha256(ieaPdf), expected.ieaReport.sha256, 'IEA report checksum changed');

const emberSnapshot = JSON.parse(emberBuffer.toString('utf8'));
assert.equal(emberSnapshot.source.id, sources.ember.id);
assert.equal(emberSnapshot.source.data_url, sources.ember.url);
const gasRows = emberSnapshot.records
  .filter(record => record.node_id === 'gas_power_dependence')
  .sort((a, b) => a.observation_year - b.observation_year);
assert.equal(gasRows.length, 26);
assert.deepEqual(gasRows.map(record => record.observation_year), Array.from({ length: 26 }, (_, index) => 2000 + index));
assert(gasRows.every(record => record.unit === '%' && record.metric_id === 'gas_fired_generation_share'));

const first = gasRows[0];
const latest = gasRows.at(-1);
const peak = gasRows.reduce((best, record) => record.value > best.value ? record : best);
assert.deepEqual({ year: first.observation_year, value: first.value }, { year: 2000, value: 17.97 });
assert.deepEqual({ year: latest.observation_year, value: latest.value }, { year: 2025, value: 21.73 });
assert.deepEqual({ year: peak.observation_year, value: peak.value }, { year: 2020, value: 23.89 });

const snapshot = {
  version: 'tulip_gas_power_dependence_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'generation_share_separated_from_realized_harm_with_observed_affordability_shock',
  productionRatingsEnabled: 0,
  purpose: 'Correct the false conversion of gas-fired generation share into harmed people or ecosystems while retaining an observed, source-bounded affordability pathway from a major gas-price shock.',
  sources: {
    ember: {
      ...sources.ember,
      retrievedOn: emberSnapshot.captured_at,
      localSnapshot: expected.emberSnapshot,
      sourceLastModified: emberSnapshot.source.source_last_modified,
      sourceEtag: emberSnapshot.source.source_etag,
    },
    iea: {
      ...sources.iea,
      retrievedOn: checkedOn,
      fetchedDocument: expected.ieaReport,
      locators: {
        worldwideGenerationCostPressure: 'Chapter 1, pages 36–37: natural gas alone accounted for more than half of the rise in average electricity-generation costs worldwide in 2022.',
        euWholesaleTransmission: 'Chapter 6, page 300: higher natural-gas prices accounted for about half of the EU wholesale electricity-price increase in the first half of 2022; gas plants set the price in close to half of hours.',
        euRetailOutcome: 'Chapter 6, page 300: average EU residential retail electricity prices were about 30% higher in the first half of 2022 than one year earlier.',
        broadAffordabilityOutcome: 'Executive summary, page 21: the broader global energy crisis was estimated to make electricity unaffordable for about 75 million people who had recently gained access.',
      },
    },
  },
  currentWindow: {
    start: 2022,
    end: 2025,
    coverageStatus: 'partial',
    summaryMethod: 'period_prevalence',
    coverageNote: 'Ember supplies a complete annual world gas-generation-share series through 2025. The IEA consequence evidence is a 2022 crisis episode, not a representative global annual harm series or a gas-dependence-only counterfactual.',
  },
  endpoints: {
    electricitySystemDependence: {
      metric: 'World gas-fired share of electricity generation',
      firstYear: first.observation_year,
      firstPercent: first.value,
      latestYear: latest.observation_year,
      latestPercent: latest.value,
      peakYear: peak.observation_year,
      peakPercent: peak.value,
      changeFirstToLatestPercentagePoints: Number((latest.value - first.value).toFixed(2)),
      changePeakToLatestPercentagePoints: Number((latest.value - peak.value).toFixed(2)),
      interpretation: 'Generation share measures reliance within the electricity system. It is not the share of people harmed, the severity of an outage or price shock, or the share of ecosystems damaged.',
    },
    observedAffordabilityShock: {
      observationPeriod: 'first half of 2022',
      geography: 'European Union for the price-transmission estimates; global for generation-cost pressure and the broad affordability estimate',
      naturalGasShareOfWorldwideAverageGenerationCostRise: 'more_than_50_percent',
      euWholesaleElectricityPriceIncreaseVersusFirstHalf2021: 'more_than_threefold',
      naturalGasShareOfEuWholesaleElectricityPriceIncreaseApproximatePercent: 50,
      euResidentialRetailElectricityPriceIncreasePercentApproximate: 30,
      broadEnergyCrisisPeopleAtRiskOfLosingAbilityToPayForElectricityApproximate: 75_000_000,
      attributionLimit: 'The 75 million estimate covers the broader energy crisis and cannot be multiplied by the gas contribution or relabelled as people harmed by gas-power dependence. Market design, import exposure, hedging, policy support, other fuels, network costs and household protections changed the observed outcome.',
    },
    humanConsequences: {
      compatibleCurrentHarmedPersonCount: null,
      compatibleCurrentGasDependenceOnlyMaterialLoss: null,
      compatibleCurrentRecoveryDuration: null,
      interpretation: 'The evidence establishes a real affordability pathway and a severe observed episode, but it does not supply a globally compatible count, loss total or duration attributable to the continuing 2025 level of gas-fired power dependence alone.',
    },
    ecosystemConsequences: {
      compatibleDirectEcosystemConditionLossPercent: null,
      compatibleDirectEcosystemDistributionAffectedPercent: null,
      compatibleRecoveryDuration: null,
      interpretation: 'The admitted records do not measure a direct ecosystem consequence of electricity-system dependence. Combustion emissions and their climate effects remain assigned to gas-power emissions and carbon nodes to prevent double counting.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the 2025 world generation share as current electricity-system reliance context.',
      'Use the 2000–2025 Ember series to describe the direction and variability of that reliance without converting record length into persistence.',
      'Use the IEA 2022 episode to establish that gas-price exposure can transmit to wholesale and retail electricity affordability.',
      'Use the geographic, market-design and multi-cause limitations to keep the central rating conservative and the uncertainty explicit.',
    ],
    prohibited: [
      'Do not treat gas-fired generation share as the share of people harmed.',
      'Do not treat the 75 million broad energy-crisis affordability estimate as harm attributable solely to gas-power dependence.',
      'Do not multiply or combine the gas cost-contribution percentage with the broad affordability population.',
      'Do not treat the 2000–2025 observation period as consequence or recovery duration.',
      'Do not transfer the 2022 European price episode unchanged to every electricity market.',
      'Do not score carbon emissions, climate effects or ecosystem harm again in this node; those consequences remain with emissions and climate nodes.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'gas_power_dependence',
      rating: 'B 3.3',
      uncertainty: 'A 1.0 to C 5.5',
      confidence: 'C',
      domains: ['human'],
      reason: 'Gas power dependence is a current system vulnerability with an observed affordability pathway. The previous B 4.4 rating treated generation share as regional human reach and added an unsupported ecosystem component. Direct harmed-person, loss and recovery denominators remain absent, so the corrected central rating is lower and the bounds remain wide.',
    },
  },
  unresolvedForTulip: [
    'Join comparable electricity-price, disconnection, energy-poverty and essential-service outcomes to country-level gas-generation exposure using an explicit counterfactual.',
    'Separate fuel-price exposure from electricity-market design, imports, hedging, taxes, subsidies, contracts, network costs and contemporaneous coal-price shocks.',
    'Measure the duration and distribution of household or service consequences rather than the duration of the generation-share record.',
    'Test whether the 2022 European episode transfers to gas-producing, gas-importing, regulated and non-marginal-pricing systems.',
  ],
};

snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  latestGasGenerationSharePercent: snapshot.endpoints.electricitySystemDependence.latestPercent,
  compatibleCurrentHarmedPersonCount: snapshot.endpoints.humanConsequences.compatibleCurrentHarmedPersonCount,
  recommendation: snapshot.tulipUse.currentCatalogueRecommendation,
  digest: snapshot.snapshotDigest,
}, null, 2));
