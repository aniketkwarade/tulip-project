import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'ozone-causal-chain-reference-snapshot.json');
const sources = {
  odgi: {
    id: 'noaa_ozone_depleting_gas_index_2024',
    publisher: 'NOAA Global Monitoring Laboratory',
    title: 'The NOAA Ozone Depleting Gas Index',
    url: 'https://gml.noaa.gov/odgi/',
    publicationDate: '2024-09-01',
    sha256: 'cdedfdf8f758fe01321181590e793747a8a692f23ca76b49365e13d4846a23fa',
  },
  ozoneBulletin: {
    id: 'wmo_ozone_uv_bulletin_2024',
    publisher: 'World Meteorological Organization',
    title: 'WMO Ozone and UV Bulletin No. 3: State of the ozone layer in 2024',
    url: 'https://wmo.int/sites/default/files/2025-09/Ozone-and-UV-Bulletin_3_en_0.pdf',
    publicationDate: '2025-09-16',
    sha256: '0edd16b384bf858352f5cd29edae85c5f38014a8d42377d691c5d27470065f67',
  },
  environmentalEffects: {
    id: 'unep_eeap_ozone_uv_environmental_effects_2024',
    publisher: 'UNEP Environmental Effects Assessment Panel; PubMed Central',
    title: 'Environmental consequences of interacting effects of changes in stratospheric ozone, ultraviolet radiation, and climate: Update 2024',
    publicationDate: '2025-03-17',
    doi: '10.1007/s43630-025-00687-x',
    pmcid: 'PMC11971163',
    url: 'https://pubmed.ncbi.nlm.nih.gov/40095356/',
    xmlUrl: 'https://www.ncbi.nlm.nih.gov/research/bionlp/RESTful/pmcoa.cgi/BioC_xml/PMC11971163/unicode',
    sha256: '27e0c462918f1b2650833afd7b1d1c33b87b0759cf4ddab8bb0e8e0a3957aa2e',
  },
  terrestrialCarbonModel: {
    id: 'young_montreal_protocol_terrestrial_carbon_sink_2021',
    publisher: 'Nature; Zenodo',
    title: 'The Montreal Protocol protects the terrestrial carbon sink',
    publicationDate: '2021-08-18',
    doi: '10.1038/s41586-021-03737-3',
    url: 'https://www.nature.com/articles/s41586-021-03737-3',
    crossrefUrl: 'https://api.crossref.org/works/10.1038%2Fs41586-021-03737-3',
    repositoryUrl: 'https://zenodo.org/records/4733883',
    repositoryApiUrl: 'https://zenodo.org/api/records/4733883',
    repositoryReadmeUrl: 'https://zenodo.org/api/records/4733883/files/README_first/content',
    repositoryReadmeMd5: 'f5cad5cb7e5fccefcf79645ee452b995',
    repositoryReadmeSha256: '78da014b542979d1c41c35fd3802ce25527856e5501d7be47596eaa1cfdf8ab4',
  },
  montrealProtocolBenefits: {
    id: 'chipperfield_montreal_protocol_ozone_uv_benefits_2015',
    publisher: 'Nature Communications',
    title: 'Quantifying the ozone and ultraviolet benefits already achieved by the Montreal Protocol',
    publicationDate: '2015-05-26',
    doi: '10.1038/ncomms8233',
    url: 'https://www.nature.com/articles/ncomms8233',
    crossrefUrl: 'https://api.crossref.org/works/10.1038%2Fncomms8233',
  },
  antarcticBiotaReview: {
    id: 'robinson_extended_ozone_hole_antarctic_biota_2024',
    publisher: 'Global Change Biology',
    title: 'Extended ozone depletion and reduced snow and ice cover—Consequences for Antarctic biota',
    publicationDate: '2024-04-01',
    doi: '10.1111/gcb.17283',
    url: 'https://onlinelibrary.wiley.com/doi/10.1111/gcb.17283',
    crossrefUrl: 'https://api.crossref.org/works/10.1111%2Fgcb.17283',
  },
  antarcticOzoneTrends: {
    id: 'he_antarctic_ozone_trends_2026',
    publisher: 'Atmospheric Chemistry and Physics',
    title: 'Analysis of Antarctic ozone trends from 1979 to 2023',
    publicationDate: '2026-07-23',
    doi: '10.5194/acp-26-9741-2026',
    url: 'https://acp.copernicus.org/articles/26/9741/2026/',
    xmlUrl: 'https://acp.copernicus.org/articles/26/9741/2026/acp-26-9741-2026.xml',
    sha256: 'fc5a7dcfa234d70268431d619a5e264bd6739da15d50e970ca503c21607795b6',
  },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const fetchUrlBytes = async (url, accept = '*/*') => {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        accept,
        'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)',
      },
      signal: AbortSignal.timeout(180_000),
    });
    if (response.status === 429 && attempt < 3) {
      await new Promise(resolve => setTimeout(resolve, 1_000 * (attempt + 1)));
      continue;
    }
    assert(response.ok, `Request failed (${response.status}) for ${url}`);
    return Buffer.from(await response.arrayBuffer());
  }
  throw new Error(`Request exhausted retries for ${url}`);
};
const fetchBytes = async source => {
  const url = source.xmlUrl ?? source.url;
  const bytes = await fetchUrlBytes(url, source.xmlUrl ? 'application/xml' : '*/*');
  assert.equal(sha256(bytes), source.sha256, `${source.id} changed`);
  return bytes;
};
const fetchJson = async url => JSON.parse((await fetchUrlBytes(url, 'application/json')).toString('utf8'));
const selectCrossrefMetadata = payload => {
  const message = payload.message;
  return {
    doi: message.DOI,
    title: message.title?.[0] ?? null,
    publisher: message.publisher ?? null,
    publicationDateParts: message.published?.['date-parts']?.[0] ?? null,
    abstract: message.abstract ?? null,
    url: message.URL ?? null,
  };
};

const odgiBytes = await fetchBytes(sources.odgi);
const ozoneBulletinBytes = await fetchBytes(sources.ozoneBulletin);
const environmentalEffectsBytes = await fetchBytes(sources.environmentalEffects);
const [
  terrestrialCarbonCrossrefRaw,
  terrestrialCarbonRepository,
  terrestrialCarbonReadmeBytes,
  montrealProtocolBenefitsCrossrefRaw,
  antarcticBiotaReviewCrossrefRaw,
  antarcticOzoneTrendsBytes,
] = await Promise.all([
  fetchJson(sources.terrestrialCarbonModel.crossrefUrl),
  fetchJson(sources.terrestrialCarbonModel.repositoryApiUrl),
  fetchUrlBytes(sources.terrestrialCarbonModel.repositoryReadmeUrl),
  fetchJson(sources.montrealProtocolBenefits.crossrefUrl),
  fetchJson(sources.antarcticBiotaReview.crossrefUrl),
  fetchBytes(sources.antarcticOzoneTrends),
]);

const terrestrialCarbonCrossref = selectCrossrefMetadata(terrestrialCarbonCrossrefRaw);
const montrealProtocolBenefitsCrossref = selectCrossrefMetadata(montrealProtocolBenefitsCrossrefRaw);
const antarcticBiotaReviewCrossref = selectCrossrefMetadata(antarcticBiotaReviewCrossrefRaw);
for (const [source, metadata] of [
  [sources.terrestrialCarbonModel, terrestrialCarbonCrossref],
  [sources.montrealProtocolBenefits, montrealProtocolBenefitsCrossref],
  [sources.antarcticBiotaReview, antarcticBiotaReviewCrossref],
]) {
  assert.equal(metadata.doi.toLowerCase(), source.doi.toLowerCase(), `${source.id} DOI changed`);
  assert.equal(metadata.title, source.title, `${source.id} title changed`);
}
assert.equal(terrestrialCarbonRepository.id, 4733883);
assert.equal(terrestrialCarbonRepository.doi, '10.5281/zenodo.4733883');
const terrestrialCarbonReadmeFile = terrestrialCarbonRepository.files.find(file => file.key === 'README_first');
assert(terrestrialCarbonReadmeFile, 'Young repository README_first is missing');
assert.equal(terrestrialCarbonReadmeFile.checksum, `md5:${sources.terrestrialCarbonModel.repositoryReadmeMd5}`);
assert.equal(terrestrialCarbonReadmeFile.size, terrestrialCarbonReadmeBytes.length);
assert.equal(md5(terrestrialCarbonReadmeBytes), sources.terrestrialCarbonModel.repositoryReadmeMd5);
assert.equal(sha256(terrestrialCarbonReadmeBytes), sources.terrestrialCarbonModel.repositoryReadmeSha256);

const terrestrialCarbonReadme = terrestrialCarbonReadmeBytes.toString('utf8');
for (const phrase of [
  'sen-c2-fODS: The second scenario is identical to worldProj, but with concentrations of CFCs fixed at their 1960 level',
  'refc1_wavd: The world avoided',
  '3% per year growth of CFCs is prescribed',
  '3% reduction in NPP per 10% increase in UV',
]) assert(terrestrialCarbonReadme.includes(phrase), `Expected Young archive phrase missing: ${phrase}`);

for (const phrase of [
  'much larger ozone depletion than observed has been avoided by the protocol',
  'beneficial impacts on surface ultraviolet',
  'Antarctic ozone hole would have grown in size by 40%',
]) assert(montrealProtocolBenefitsCrossref.abstract?.includes(phrase), `Expected Chipperfield abstract phrase missing: ${phrase}`);

for (const phrase of [
  'ozone depletion has persisted into December',
  'UV index up to 14',
  'field research conducted decades ago',
  'true magnitude and timing of current UV increases is needed',
]) assert(antarcticBiotaReviewCrossref.abstract?.includes(phrase), `Expected Robinson abstract phrase missing: ${phrase}`);

const antarcticOzoneTrendsXml = antarcticOzoneTrendsBytes.toString('utf8');
for (const phrase of [
  'Analysis of Antarctic ozone trends from 1979 to 2023',
  'peak rate reaching 51 %',
  'reduction of ODS is driving the expected recovery of the Antarctic ozone layer',
  'requiring further research and continued attention to the ozone hole and dynamical  processes',
]) assert(antarcticOzoneTrendsXml.includes(phrase), `Expected He et al. phrase missing: ${phrase}`);

const odgiHtml = odgiBytes.toString('utf8');
for (const phrase of [
  'ODGI-A at the beginning of 2024 was 72 (71.6)',
  'ODGI-ML was 45',
  'decreased  55%',
  'projected to decline to that 1980 value sometime around 2045',
]) assert(odgiHtml.includes(phrase), `Expected NOAA ODGI phrase missing: ${phrase}`);

const environmentalEffectsXml = environmentalEffectsBytes.toString('utf8');
for (const phrase of [
  'Montreal Protocol has protected aquatic organisms and ecosystems',
  'possible negative effects on phytoplankton productivity',
  'one cannot specifically ascribe how much of the responses were due to exposure to UV-B radiation',
  'deeper surface layer mixing and stratospheric ozone recovery will reduce exposure',
]) assert(environmentalEffectsXml.includes(phrase), `Expected UNEP EEAP phrase missing: ${phrase}`);
assert(ozoneBulletinBytes.length > 2_000_000, 'WMO bulletin download is unexpectedly small');

const payload = {
  version: 'tulip_ozone_causal_chain_2026_09_24_v2',
  retrievedOn: '2026-09-24',
  status: 'independent_causal_model_stress_test_completed_current_terminal_endpoint_still_missing',
  productionRatingsEnabled: 0,
  nodeIds: ['cfc_saturated_layers', 'stratospheric_chlorine_sinks'],
  sources,
  currentState: {
    ozoneDepletingSubstanceBurden: {
      observationYear: 2024,
      antarcticOdgi: 71.6,
      antarcticDeclineFromPeakToward1980BenchmarkPercent: 28.4,
      midLatitudeOdgi: 45.3,
      midLatitudeDeclineFromPeakToward1980BenchmarkPercent: 54.7,
      expectedAntarcticReturnTo1980EescYearApproximate: 2070,
      expectedMidLatitudeReturnTo1980EescYearApproximate: 2045,
      interpretation: 'ODGI measures the remaining ozone-depleting halogen burden relative to its peak and a 1980 benchmark. It is a physical causal stock, not a percentage of ecosystem condition lost or recovered.',
    },
    ozoneColumn: {
      observationYear: 2024,
      antarcticMaximumOzoneMassDeficitMillionTonnes: 46.1,
      relativeTo1990To2020Average: 'below',
      depletionPersistedThrough: 'mid-November 2024',
      vortexFinalBreakup: 'December 2024',
      recoveryInterpretation: 'The delayed onset is a robust indication of initial recovery, while short-term meteorology can mask the long-term signal.',
    },
    environmentalEffects: {
      excessUvBCanCauseDnaDamageAndMortality: true,
      polarAndAlpineExposureIncreasingWithEarlierSnowAndIceMelt: true,
      arcticPhytoplanktonDirection: 'mixed_due_to_more_open_water_but_deeper_mixing_and_ozone_recovery',
      currentGlobalCollapseEquivalentConditionLossPercent: null,
      currentAffectedEcosystemDistributionPercent: null,
      commonRecoveryTimeDistribution: null,
      ozoneSpecificAttributionAvailableForRecentCombinedUvClimateStudies: false,
      interpretation: 'The assessment documents mechanisms and selected organism responses but does not supply a global current percentage movement toward ecosystem collapse, affected-distribution denominator or recovery-time distribution attributable specifically to ozone-driven UV-B.',
    },
  },
  causalChainBoundary: {
    upstreamNode: 'cfc_saturated_layers',
    downstreamNode: 'stratospheric_chlorine_sinks',
    rule: 'The residual ODS stock and the resulting ozone-column condition are alternative locations in one causal chain. The same UV-B ecological consequence may inform uncertainty in both records but cannot be added across them or copied unchanged upstream.',
  },
  independentCausalModelStressTest: {
    atmosphericAttribution: {
      status: 'supported_with_dynamic_confounding',
      evidence: 'Chipperfield et al. reproduce the policy counterfactual with a three-dimensional chemistry-transport model. He et al. reproduce the 1979–2023 Antarctic ozone record with multiple observations and TOMCAT and show that circulation now explains substantial year-to-year variation while declining ozone-depleting substances drive the expected long-term recovery.',
      brewerDobsonCirculationPeakContributionToOctoberVariationPercent: 51,
      interpretation: 'The residual chemical burden is a real upstream driver, but an annual ozone state is not a pure readout of that burden. Dynamics, temperature, aerosols and other processes must remain explicit in any source-removal calculation.',
    },
    terrestrialCarbonModel: {
      status: 'future_world_avoided_model_not_current_endpoint',
      scenarios: {
        controlledWorld: 'refc1',
        fixed1960Cfc: 'sen-c2-fODS',
        worldAvoidedThreePercentAnnualCfcGrowth: 'refc1_wavd',
      },
      centralUvToNppSensitivity: '3% reduction in net primary productivity per 10% increase in UV',
      sensitivityVariants: [0.1, 0.5, 1, 1.5],
      archiveReadmeIntegrity: {
        bytes: terrestrialCarbonReadmeBytes.length,
        md5: md5(terrestrialCarbonReadmeBytes),
        sha256: sha256(terrestrialCarbonReadmeBytes),
      },
      interpretation: 'The model and open archive establish a plausible ozone–UV–plant-carbon pathway and support a future policy counterfactual. Their world-avoided and fixed-1960 scenarios do not estimate the present terminal ecosystem consequence of the measured residual 2024 ODS stock relative to a matched 1980 or no-anthropogenic-ODS atmosphere.',
    },
    currentAntarcticBiotaEvidence: {
      status: 'exposure_risk_supported_current_terminal_magnitude_unmeasured',
      ozoneDepletionPersistedIntoDecember: true,
      reportedUvIndexUpperContext: 14,
      modernFieldEndpointAvailable: false,
      interpretation: 'Robinson et al. identify a biologically vulnerable exposure window as snow and ice retreat and breeding begins, but explicitly report that much field work is decades old and that the magnitude and timing of current UV increases require new research. Exposure and vulnerability cannot substitute for measured ecosystem condition, reach or recovery.',
    },
    decision: {
      cfc_saturated_layers: 'score_unchanged_confidence_unchanged',
      stratospheric_chlorine_sinks: 'score_unchanged_confidence_unchanged',
      reason: 'The independent models strengthen the causal chain and the counterfactual logic but do not supply a current terminal-harm numerator, a compatible harmed-distribution denominator or ecological recovery duration. The added sources therefore defend the existing bounded candidates and prevent an unsupported upgrade rather than narrowing their score ranges.',
    },
    sourceIntegrity: {
      terrestrialCarbonCrossrefDigest: sha256(JSON.stringify(terrestrialCarbonCrossref)),
      montrealProtocolBenefitsCrossrefDigest: sha256(JSON.stringify(montrealProtocolBenefitsCrossref)),
      antarcticBiotaReviewCrossrefDigest: sha256(JSON.stringify(antarcticBiotaReviewCrossref)),
      antarcticOzoneTrendsXmlSha256: sha256(antarcticOzoneTrendsBytes),
    },
  },
  ratingDecisions: {
    cfc_saturated_layers: {
      previous: { value: 6.3, grade: 'C', lower: 4, upper: 8.5, confidence: 'B' },
      revised: { value: 3.3, grade: 'B', lower: 1.8, upper: 7, confidence: 'D' },
      axes: {
        ecosystem: {
          severity: { lower: 0, central: 1, upper: 2 },
          reach: { lower: 1, central: 1, upper: 3 },
          persistence: { lower: 0, central: 1, upper: 3 },
        },
      },
      reason: 'NOAA directly measures a large but declining residual halogen burden. The old C rating converted that atmospheric stock into substantial, broad ecosystem loss without a source-removal endpoint model. A conservative ecosystem-only B candidate preserves a possible current UV-B pathway while confidence falls to D and the broad upper case remains visible.',
      certaintyAudit: 'Independent chemistry, carbon-cycle and Antarctic-biota sources strengthen the causal pathway but do not measure current residual-stock-attributable terminal ecological harm. The value, bounds and confidence therefore remain unchanged.',
    },
    stratospheric_chlorine_sinks: {
      previous: { value: 6.3, grade: 'C', lower: 4, upper: 8.5, confidence: 'B' },
      revised: { value: 4, grade: 'B', lower: 1.8, upper: 7, confidence: 'C' },
      axes: {
        ecosystem: {
          severity: { lower: 0, central: 1, upper: 2 },
          reach: { lower: 1, central: 2, upper: 3 },
          persistence: { lower: 0, central: 1, upper: 3 },
        },
      },
      reason: 'WMO directly records a continuing but recovering ozone deficit, and UNEP documents ecological mechanisms and regional exposure. It does not quantify current global ecosystem collapse-equivalent loss, affected distribution or recovery attributable specifically to ozone-driven UV-B. The central candidate therefore moves from unsupported substantial global harm to bounded mild regional harm.',
      certaintyAudit: 'Multiple observations and a chemistry-transport model strengthen physical attribution, while the current biota review confirms that modern terminal effects remain poorly quantified. The value, bounds and confidence therefore remain unchanged.',
    },
  },
  admittedUses: [
    'Use NOAA ODGI to describe the present residual ODS burden and recovery progress, not ecosystem severity or reach.',
    'Use WMO ozone mass deficit and timing to describe the current Antarctic ozone-column state and event duration, not ecological recovery time.',
    'Use UNEP EEAP to establish that excess UV-B can affect organisms and ecosystems and that present effects interact with climate and vary by setting.',
    'Use the absence of a compatible collapse-equivalent condition, affected-distribution denominator and recovery distribution to retain broad uncertainty.',
    'Use Young et al. and Chipperfield et al. to confirm the modeled ozone–UV–biosphere causal pathway and policy counterfactual, while keeping future world-avoided scenarios separate from current harm.',
    'Use Robinson et al. to identify a current Antarctic exposure-risk window and the absence of modern field quantification, not to assign harm from UV Index alone.',
    'Use He et al. to keep chemical recovery separate from dynamic ozone variability and to require an explicit atmospheric source-removal counterfactual.',
  ],
  excludedUses: [
    'Do not convert ODGI, ozone mass deficit, ozone-hole area, Dobson Units or years until atmospheric recovery into ecosystem severity, reach or persistence.',
    'Do not assign the same UV-B consequence independently to both the upstream ODS burden and downstream ozone-column node and then add them.',
    'Do not treat all ecosystems under an ozone anomaly as damaged ecosystems.',
    'Do not convert possible phytoplankton effects, laboratory exposure studies or climate-interacting responses into a global affected-distribution percentage.',
    'Do not infer current human harm for either node from general UV-related skin or eye disease without an ozone-attributable current counterfactual.',
    'Do not convert the future world-avoided terrestrial-carbon result, its fixed-1960-CFC scenario or its UV-to-NPP sensitivity into current severity, reach or persistence.',
    'Do not convert UV Index 14, December ozone depletion or the area exposed to low ozone into the share of an ecosystem distribution that suffered terminal harm.',
    'Do not use atmospheric recovery years or the duration of an ozone-hole season as ecological recovery time.',
  ],
  exactRemainingGaps: [
    'A present-day source-removal model comparing the measured residual ODS burden with an otherwise matched 1980 or no-anthropogenic-ODS atmosphere and propagating the difference through ozone and UV to non-overlapping terminal ecological consequences.',
    'A modern observed ecological condition indicator, during the current extended Antarctic exposure window or another relevant current setting, calibrated to movement toward collapse and attributable to ozone-driven UV-B.',
    'The harmed numerator and compatible terrestrial or aquatic ecosystem-distribution denominator for that condition loss rather than the atmospheric exposure footprint.',
    'A consequence-specific ecological recovery-time distribution after exposure is removed, rather than atmospheric ozone, halogen-stock or snow-and-ice recovery time.',
    'A current ozone-attributable human health burden separated from behavior, climate, total solar UV and other exposure drivers.',
  ],
};

payload.digest = sha256(JSON.stringify({
  version: payload.version,
  sources: payload.sources,
  currentState: payload.currentState,
  causalChainBoundary: payload.causalChainBoundary,
  independentCausalModelStressTest: payload.independentCausalModelStressTest,
  ratingDecisions: payload.ratingDecisions,
  admittedUses: payload.admittedUses,
  excludedUses: payload.excludedUses,
  exactRemainingGaps: payload.exactRemainingGaps,
}));

await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output, digest: payload.digest, ratings: payload.ratingDecisions }, null, 2));
