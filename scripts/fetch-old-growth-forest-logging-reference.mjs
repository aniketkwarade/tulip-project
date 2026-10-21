import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'old-growth-forest-logging-reference-snapshot.json');
const checkedOn = '2026-09-24';
const hash = value => createHash('sha256').update(value).digest('hex');
const digest = value => hash(JSON.stringify(value));

const files = {
  fra2025: {
    url: 'https://openknowledge.fao.org/server/api/core/bitstreams/12322cae-5b20-4be2-927a-72a86fd319e9/content',
    bytes: 8_585_230,
    sha256: '9b77d433587bec0c6882a3f9e06c96ad6eb33ffe823bfe910e4f6a418cc68d27',
  },
  loggingThresholdsSupplement: {
    url: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-024-07657-w/MediaObjects/41586_2024_7657_MOESM1_ESM.pdf',
    bytes: 1_397_539,
    sha256: '34f45d4f69ef0e186d0cecd5a62edbde79938eb991400cb5f164674d62afdcdb',
  },
};

async function fetchPinned(source, label) {
  const response = await fetch(source.url, {
    signal: AbortSignal.timeout(120_000),
    headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+old-growth-logging-evidence-ingestion)' },
  });
  assert(response.ok, `${label}: HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert.equal(body.subarray(0, 5).toString(), '%PDF-', `${label}: expected a PDF`);
  assert.equal(body.length, source.bytes, `${label}: byte size changed`);
  assert.equal(hash(body), source.sha256, `${label}: checksum changed`);
  return body;
}

await Promise.all([
  fetchPinned(files.fra2025, 'FAO FRA 2025'),
  fetchPinned(files.loggingThresholdsSupplement, 'logging thresholds supplement'),
]);

const snapshot = {
  version: 'tulip_old_growth_forest_logging_reference_2026_09_24_v1',
  generatedOn: checkedOn,
  status: 'current_global_primary_forest_context_and_direct_logging_effects_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Measure ecological damage directly attributable to old-growth or primary-forest logging while keeping global primary-forest area change, logging intensity, human dependence and downstream climate effects separate.',
  sources: {
    fra2025: {
      id: 'fao_global_forest_resources_assessment_2025',
      publisher: 'Food and Agriculture Organization of the United Nations',
      title: 'Global Forest Resources Assessment 2025',
      publicationDate: '2025-10-21',
      doi: 'https://doi.org/10.4060/cd6709en',
      file: files.fra2025,
      checkedOn,
    },
    loggingThresholds2024: {
      id: 'ewers_logged_tropical_forest_thresholds_2024',
      publisher: 'Nature',
      title: 'Thresholds for adding degraded tropical forest to the conservation estate',
      publicationDate: '2024-07-17',
      doi: 'https://doi.org/10.1038/s41586-024-07657-w',
      articleUrl: 'https://www.nature.com/articles/s41586-024-07657-w',
      supplement: files.loggingThresholdsSupplement,
      checkedOn,
    },
  },
  currentWindow: {
    start: 2024,
    end: 2025,
    coverageStatus: 'partial',
    summaryMethod: 'end_state_stock',
    coverageNote: 'FAO supplies the latest global primary-forest stock and 2015-2025 net-change context. The 2024 logging study supplies a direct multi-taxon severity gradient at one Sabah landscape. The sources do not supply a global logging-attributable affected-area denominator.',
  },
  endpoints: {
    globalPrimaryForestContext: {
      reportingCountriesAndAreasFor2025Stock: 168,
      reportingCoveragePercentOfGlobalForestArea: 85,
      primaryForestArea2025Ha: 1_176_142_000,
      primaryForestShareOfReportingForestAreaPercent: 33,
      trendReportingCountriesAndAreas: 162,
      trendReportingCoveragePercentOfGlobalForestArea: 77,
      comparableTrendSubsetPrimaryForestArea1990Ha: 1_237_667_000,
      comparableTrendSubsetPrimaryForestArea2025Ha: 1_127_945_000,
      globalNetDecrease1990To2025HaApproximate: 110_000_000,
      annualNetLoss2015To2025Ha: 1_609_000,
      causeResolution: 'FAO states that the trend data do not show whether primary-forest decreases came from deforestation or conversion to other forest types. They therefore do not quantify the share attributable to logging.',
    },
    directLoggingEffects: {
      geography: 'SAFE Project landscape, Sabah, Malaysia',
      surveyPeriodYears: 11,
      biodiversitySurveys: 127,
      taxaObserved: 4_689,
      taxaModelled: 1_681,
      functionalGroups: 126,
      taxaAffectedFromOnsetPercent: 24,
      functionalGroupsAffectedFromOnsetPercent: 34,
      taxaNegativelyAffected: 425,
      taxaPositivelyAffected: 330,
      lightlyLoggedBiomassRemovalThresholdPercent: 29,
      heavilyDegradedBiomassRemovalThresholdPercent: 68,
      interpretation: 'The study directly establishes that logging intensity changes biodiversity and function, but responses are mixed and the thresholds come from one tropical landscape. Biomass loss is not a global area denominator and is not identical to timber extraction.',
    },
    compatibleGlobalLoggingAttributableEcosystemAreaPercent: null,
    compatibleCurrentHumanConsequence: null,
    compatibleRecoveryTimeDistribution: null,
  },
  tulipUse: {
    admitted: [
      'Use the 2024 multi-taxon study to establish direct ecological change from logging and to bound local severity by logging intensity.',
      'Use the FAO 2025 assessment to establish the size and continuing net decline of the primary-forest resource at risk.',
      'Use the eleven-year field program and natural-regeneration findings as qualitative evidence that consequence duration varies with logging intensity.',
      'Use the FAO reporting-coverage and definition limitations to keep the global reach bound wide.',
    ],
    prohibited: [
      'Do not attribute all global primary-forest net loss to logging.',
      'Do not treat the FAO primary-forest share, country coverage or trend-reporting coverage as ecosystem reach harmed by logging.',
      'Do not turn the Sabah shares of taxa or functional groups responding into a percentage of global ecosystem area.',
      'Do not treat biomass removed as timber extracted; collateral damage and subsequent regrowth are included in the study gradient.',
      'Do not infer a global harmed-person count or current human severity from cultural value, employment or resource dependence alone.',
      'Do not add carbon emissions, climate change, fire, hunting, fragmentation or downstream biodiversity-node scores to this node.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'old_growth_forest_logging',
      rating: 'C 4.8',
      uncertainty: 'B 2.9 to D 7.4',
      confidence: 'C',
      domains: ['human', 'ecosystem'],
      axes: {
        human: {
          lower: { severity: 0, reach: 0, persistence: 1 },
          central: { severity: 1, reach: 1, persistence: 2 },
          upper: { severity: 2, reach: 2, persistence: 3 },
        },
        ecosystem: {
          lower: { severity: 1, reach: 1, persistence: 2 },
          central: { severity: 2, reach: 1, persistence: 3 },
          upper: { severity: 3, reach: 3, persistence: 4 },
        },
      },
      reason: 'Direct field evidence supports material and persistent ecological change, but neither source measures global logging-attributable ecosystem reach or current terminal human harm. The former D rating imported a regional Tongass area share into a global node and is therefore reduced.',
    },
  },
  unresolvedForTulip: [
    'Measure annual old-growth or primary-forest logging area globally with a consistent definition and a denominator for the relevant forest distribution.',
    'Link logging intensity to comparable current biodiversity-condition loss across tropical, temperate and boreal old-growth forests.',
    'Measure attributable current human consequences for Indigenous Peoples and local communities without substituting dependence, employment or cultural importance for harm.',
    'Measure ecological and human recovery time after different logging practices rather than using study duration or forest age.',
    'Produce a compatible 2027-2036 SSP2-4.5 outlook, or document why policy and commodity-demand pathways are more appropriate than a climate scenario for this activity node.',
  ],
};
snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  currentWindow: snapshot.currentWindow,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(`Wrote ${output}`);
console.log(JSON.stringify(snapshot.tulipUse.currentCatalogueRecommendation, null, 2));
