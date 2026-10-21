import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'river-flow-regime-reference-snapshot.json');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const md5 = value => createHash('md5').update(value).digest('hex');
const execFileAsync = promisify(execFile);

const sources = {
  unWater: {
    id: 'unep_un_water_progress_on_water_related_ecosystems_2024',
    publisher: 'UN-Water and United Nations Environment Programme',
    title: 'Progress on Water-related Ecosystems – 2024 Update',
    publicationDate: '2024-08-25',
    url: 'https://www.unwater.org/publications/progress-water-related-ecosystems-2024-update',
    localSnapshot: 'public/unep-unwater-freshwater-impact-snapshot.json',
    snapshotSha256: 'e78c5f6961ab985d3583f0edc657566640df7124ed3eb18f0107b17086777d84',
  },
  observedRegimes: {
    id: 'virkki_observed_flow_regime_classes_2024',
    publisher: 'Environmental Research Communications',
    title: 'Archetypal flow regime change classes and their associations with anthropogenic drivers of global streamflow alterations',
    publicationDate: '2024-11-29',
    doi: '10.1088/2515-7620/ad9439',
    url: 'https://doi.org/10.1088/2515-7620/ad9439',
    pdfUrl: 'https://pure.iiasa.ac.at/id/eprint/20170/1/Virkki_2024_Environ._Res._Commun._6_111007.pdf?download=1',
    pdfSha256: '8b35ef3d650db15a7f4381160a82ddb2d32ff8515ea8e3648833fdeeb8d94272',
  },
  biodiversityConversion: {
    id: 'mohan_environmental_flow_biodiversity_2022',
    publisher: 'Hydrology and Earth System Sciences',
    title: 'Poor correlation between large-scale environmental flow violations and freshwater biodiversity: implications for water resource management and the freshwater planetary boundary',
    publicationDate: '2022-12-13',
    doi: '10.5194/hess-26-6247-2022',
    url: 'https://hess.copernicus.org/articles/26/6247/2022/',
    pdfUrl: 'https://hess.copernicus.org/articles/26/6247/2022/hess-26-6247-2022.pdf',
    pdfSha256: '500e5ebf0c9b500ea35b6b00575fef33e3270990fabc654bd7c1e173d1dc361d',
  },
  riverImpactSynthesis: {
    id: 'sabater_river_extreme_event_meta_analysis_2023',
    publisher: 'Biological Reviews; Zenodo',
    title: 'Extreme weather events threaten biodiversity and functions of river ecosystems: evidence from a meta-analysis',
    publicationDate: '2023-04-01',
    doi: '10.1111/brv.12914',
    url: 'https://onlinelibrary.wiley.com/doi/10.1111/brv.12914',
    dataUrl: 'https://zenodo.org/records/7004412',
    files: {
      structural: {
        url: 'https://zenodo.org/api/records/7004412/files/structural_resp.txt/content',
        sha256: '80a41464973bf5721b2b333a3243a4255231f6894b7329f0b14f6054a0d33678',
        md5: '3935ce2609fd9936aa9f695ad0af1bba',
      },
      functional: {
        url: 'https://zenodo.org/api/records/7004412/files/functional_resp.txt/content',
        sha256: 'cba6173f87c15773ab65fdfac063ed106e992bf62ecae3055b411924109e1134',
        md5: '51f340de4163e656d2b702ba8ddc80de',
      },
    },
  },
};

async function fetchBytes(url, accept) {
  const args = [
    '--location',
    '--fail',
    '--silent',
    '--show-error',
    '--max-time',
    '180',
  ];
  if (accept) args.push('--header', `Accept: ${accept}`);
  args.push(url);
  const { stdout } = await execFileAsync('curl', args, { encoding: null, maxBuffer: 50_000_000, timeout: 190_000 });
  return stdout;
}

function rowsFromTabSeparated(bytes) {
  const text = bytes.toString('latin1').replaceAll('\r\n', '\n');
  const lines = text.split('\n').filter(Boolean);
  const headers = lines.shift().split('\t');
  return lines.map(line => Object.fromEntries(line.split('\t').map((value, index) => [headers[index], value])));
}

const unWaterBytes = await readFile(path.join(root, sources.unWater.localSnapshot));
assert.equal(sha256(unWaterBytes), sources.unWater.snapshotSha256, 'UN-Water source snapshot changed');
const unWaterSnapshot = JSON.parse(unWaterBytes.toString('utf8'));
assert.equal(unWaterSnapshot.version, 'unep_unwater_sdg_6_6_1_freshwater_2024_v1');
assert.equal(unWaterSnapshot.assessment.total_river_basins_assessed, 12_572);
assert.equal(unWaterSnapshot.assessment.river_basins_with_significantly_decreased_flow, 402);
assert.equal(unWaterSnapshot.assessment.people_in_reduced_flow_basins_million, 107.5);

for (const source of [sources.observedRegimes, sources.biodiversityConversion]) {
  const bytes = await fetchBytes(source.pdfUrl);
  assert(bytes.subarray(0, 5).equals(Buffer.from('%PDF-')), `${source.id} did not return a PDF`);
  assert.equal(sha256(bytes), source.pdfSha256, `${source.id} PDF changed`);
}

const structuralBytes = await fetchBytes(sources.riverImpactSynthesis.files.structural.url);
const functionalBytes = await fetchBytes(sources.riverImpactSynthesis.files.functional.url);
for (const [name, bytes] of [['structural', structuralBytes], ['functional', functionalBytes]]) {
  const expected = sources.riverImpactSynthesis.files[name];
  assert.equal(sha256(bytes), expected.sha256, `${name} meta-analysis file changed`);
  assert.equal(md5(bytes), expected.md5, `${name} meta-analysis file MD5 changed`);
}
const structuralRows = rowsFromTabSeparated(structuralBytes);
const functionalRows = rowsFromTabSeparated(functionalBytes);
assert.equal(structuralRows.length, 198);
assert.equal(functionalRows.length, 134);
assert.equal(new Set(structuralRows.map(row => row.study_ID)).size, 62);
assert.equal(new Set(functionalRows.map(row => row.study_ID)).size, 30);
assert(structuralRows.some(row => row['Climate.anomaly'] === 'Event' && row.env_factor === 'Flow'));
assert(structuralRows.some(row => row['Climate.anomaly'] === 'Trend' && row.env_factor === 'Flow'));

const decreasedFlowSharePercent = 100 * unWaterSnapshot.assessment.river_basins_with_significantly_decreased_flow
  / unWaterSnapshot.assessment.total_river_basins_assessed;

const candidate = {
  previous: { value: 6.6, grade: 'D', lower: 4.8, upper: 8.5, confidence: 'C' },
  revised: { value: 4.0, grade: 'B', lower: 1.8, upper: 7.0, confidence: 'C' },
  axes: {
    ecosystem: {
      severity: { lower: 0, central: 1, upper: 2 },
      reach: { lower: 1, central: 2, upper: 3 },
      persistence: { lower: 0, central: 1, upper: 3 },
    },
  },
  reason: 'The official global assessment finds significantly decreased flow in 402 of 12,572 basins, or about 3.2% by basin count. That supports material multi-regional reach, but basin count is not affected river length, ecosystem area or harmed population. Observational research finds widespread flow-regime change, while most classified trends are not statistically significant and the gauge network is geographically uneven. A global comparison also finds that large-scale environmental-flow violations do not reliably predict freshwater biodiversity indicators. Event studies support meaningful local ecological effects and an upper case, but they do not justify the previous broad terminal-harm central rating.',
};

const payload = {
  version: 'tulip_river_flow_regime_shift_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'global_flow_change_and_ecological_conversion_evidence_ingested_affected_river_distribution_and_recovery_missing',
  productionRatingsEnabled: 0,
  nodeId: 'river_flow_regime_shift',
  sources,
  currentWindow: {
    start: 2000,
    end: 2021,
    coverageStatus: 'global_basin_inventory_with_uneven_observation_and_non_area_weighted_denominator',
    summaryMethod: 'period_prevalence',
    coverageNote: 'The UN-Water assessment compares 2017–2021 with a 2000–2019 reference and reports basin counts. The observation-based study uses 1971–2010 gauges concentrated in Europe and the Americas. Neither source measures the share of global river length or ecosystem distribution with a compatible harm outcome.',
  },
  evidence: {
    currentGlobalFlowInventory: {
      referencePeriod: { start: 2000, end: 2019 },
      observationPeriod: { start: 2017, end: 2021 },
      assessedBasins: 12_572,
      significantlyDecreasedFlowBasins: 402,
      significantlyDecreasedFlowBasinSharePercent: Math.round(decreasedFlowSharePercent * 10_000) / 10_000,
      peopleLivingInThoseBasinsMillion: 107.5,
      comparisonIncreaseMultiple: 5,
      interpretation: 'The basin count measures significant flow decrease. The resident count is exposure context. Neither number is a direct human-harm endpoint or an area-weighted ecosystem-condition measure.',
    },
    observedRegimeClasses: {
      gauges: 3_293,
      recordPeriod: { start: 1971, end: 2010 },
      catchmentsAssignedDirectionalClass: 2_986,
      assignedDirectionalClassPercent: 91,
      sampleConcentration: 'Eighty-eight percent of catchments are in Europe, North America and South America.',
      significanceBoundary: 'Most individual flow-characteristic slopes in the classified catchments were not statistically significant. Classification prevalence is not harmed reach.',
    },
    biodiversityConversion: {
      basins: 3_906,
      result: 'No statistically significant global or ecoregion relationship was found between the large-scale environmental-flow violation metric and the admitted freshwater biodiversity indicators.',
      interpretation: 'A physical flow departure cannot be converted directly into biodiversity loss on one universal global scale. Local pathways and taxa remain heterogeneous.',
    },
    eventAndTrendSynthesis: {
      structuralRows: structuralRows.length,
      functionalRows: functionalRows.length,
      structuralStudyIds: new Set(structuralRows.map(row => row.study_ID)).size,
      functionalStudyIds: new Set(functionalRows.map(row => row.study_ID)).size,
      structuralFlowRows: structuralRows.filter(row => row.env_factor === 'Flow').length,
      functionalFlowRows: functionalRows.filter(row => row.env_fact === 'flow').length,
      structuralEventRows: structuralRows.filter(row => row['Climate.anomaly'] === 'Event').length,
      structuralTrendRows: structuralRows.filter(row => row['Climate.anomaly'] === 'Trend').length,
      interpretation: 'The synthesis supports ecological effects from hydrological extremes, with event and gradual changes behaving differently. Its study rows are effect estimates, not independent rivers or a global affected-distribution denominator.',
    },
    boundaries: {
      compatibleAffectedGlobalRiverDistributionPercent: null,
      compatibleCurrentHumanConsequence: null,
      flowChangeToEcosystemConditionConversion: null,
      recoveryTimeDistribution: null,
      attributionToClimateLandUseDamsAndWithdrawalsSeparated: false,
    },
  },
  ratingDecision: {
    change: 'central_grade_reduced_after_separating_physical_flow_change_and_resident_exposure_from_ecosystem_condition_and_human_harm',
    candidate,
    admittedUses: [
      'Use the official 402-of-12,572 basin count to bound the reach of statistically significant decreased flow, while preserving its non-area-weighted denominator.',
      'Use the observation-based flow-regime study to show that flow changes are heterogeneous and that gauge coverage and statistical significance limit global transfer.',
      'Use the biodiversity-conversion study to prevent physical environmental-flow violations from becoming direct biodiversity severity.',
      'Use the river meta-analysis to bound local ecological severity and distinguish acute events from gradual trends.',
    ],
    excludedUses: [
      'Do not treat 107.5 million basin residents as people harmed or use that exposure count as human reach.',
      'Do not treat 91% of classified catchments as affected ecosystem reach; classification includes non-significant slopes and a geographically uneven sample.',
      'Do not treat a physical discharge anomaly, environmental-flow violation or basin count as the same thing as ecological condition loss.',
      'Do not use the 15-year comparison, 40-year gauge record or study duration as recovery time.',
      'Do not add drought, flood, drinking-water, hydropower, reservoir, fishery or displacement consequences already represented by downstream nodes.',
      'Do not generalize event-study effect sizes or regional fish-loss models to the global central case.',
    ],
    exactRemainingGaps: [
      'A current global river-length or ecosystem-area distribution with compatible flow-regime change and ecological-condition endpoints.',
      'A calibrated conversion from the magnitude and seasonality of flow change to direct ecological condition loss across river types.',
      'A global recovery-time distribution after the causal flow pressure stops or restoration begins.',
      'A causal decomposition of climate, withdrawals, dams, land use and measurement change for the observed flow-regime shift.',
      'Any direct, non-overlapping current human health, service or material-loss consequence attributable specifically to this upstream river-condition state.',
    ],
  },
};

payload.digest = sha256(JSON.stringify({
  version: payload.version,
  sources: payload.sources,
  currentWindow: payload.currentWindow,
  evidence: payload.evidence,
  ratingDecision: payload.ratingDecision,
}));

await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output, digest: payload.digest, candidate: candidate.revised }, null, 2));
