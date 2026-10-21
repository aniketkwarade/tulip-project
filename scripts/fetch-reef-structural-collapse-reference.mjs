import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'reef-structural-collapse-reference-snapshot.json');
const pubmedId = '42717262';
const sourceUrl = `https://pubmed.ncbi.nlm.nih.gov/${pubmedId}/`;
const xmlUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pubmedId}&retmode=xml`;
const xmlSha256 = '155469ebfeeaaf6a9f970b95d599cec216e42286e9b178f619febfc99811a142';

const sha256 = value => createHash('sha256').update(value).digest('hex');
const response = await fetch(xmlUrl, {
  headers: {
    accept: 'application/xml',
    'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)',
  },
  signal: AbortSignal.timeout(180_000),
});
assert(response.ok, `Request failed (${response.status}) for ${xmlUrl}`);
const xmlBytes = Buffer.from(await response.arrayBuffer());
assert.equal(sha256(xmlBytes), xmlSha256, 'The PubMed XML record changed');
const xml = xmlBytes.toString('utf8');
for (const phrase of [
  '1.18-fold decline',
  '1.52-fold decline',
  'not to pre-heatwave levels',
  'recovery will take many years',
]) assert(xml.includes(phrase), `Expected PubMed abstract phrase missing: ${phrase}`);

const candidate = {
  previous: { value: 6.6, grade: 'D', lower: 4.8, upper: 8.5, confidence: 'C' },
  revised: { value: 4.8, grade: 'C', lower: 4.0, upper: 7.8, confidence: 'C' },
  axes: {
    ecosystem: {
      severity: { lower: 1, central: 2, upper: 3 },
      reach: { lower: 1, central: 1, upper: 3 },
      persistence: { lower: 2, central: 2, upper: 3 },
    },
  },
  reason: 'A 2026 longitudinal photogrammetry study directly measures rapid loss of three reef-complexity metrics and incomplete recovery several years later. This establishes material local ecosystem deterioration and one-to-under-ten-year persistence. The study contains 30 permanent quadrats at one central Pacific reef system, so it cannot support the former global reach or a worldwide collapse claim. No direct attributable human consequence is published.',
};

const payload = {
  version: 'tulip_reef_structural_collapse_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'direct_longitudinal_structural_complexity_loss_and_incomplete_recovery_ingested_global_extent_and_human_consequences_missing',
  productionRatingsEnabled: 0,
  nodeId: 'reef_structural_collapse',
  source: {
    id: 'bruce_reef_structural_complexity_heatwave_2026',
    publisher: 'Journal of Animal Ecology; PubMed record supplied by the U.S. National Library of Medicine',
    title: 'Rapid loss, and slow recovery, of coral reef structural complexity resulting from a prolonged marine heatwave',
    publicationDate: '2026-09-09',
    doi: '10.1111/1365-2656.70347',
    pubmedId,
    url: sourceUrl,
    xmlUrl,
    xmlSha256,
  },
  currentWindow: {
    start: 2015,
    end: 2019,
    coverageStatus: 'longitudinal_single_reef_system_case',
    summaryMethod: 'event_distribution',
    coverageNote: 'The study follows 30 permanent shallow-fore-reef quadrats before, during and after the 2015–2016 marine heatwave in the central equatorial Pacific. It is direct structural-condition evidence, not a global reef-area estimate.',
  },
  evidence: {
    studyDesign: {
      permanentQuadrats: 30,
      quadratDimensionsMetres: { width: 4, length: 4 },
      method: 'Structure-from-Motion photogrammetry',
      geography: 'central equatorial Pacific Ocean',
      heatwave: '2015–2016 El Niño marine heatwave',
    },
    structuralCondition: {
      surfaceComplexityFoldDecline: 1.18,
      vectorRuggednessMeasureFoldDecline: 1.52,
      fractalDimensionFoldDecline: 1.03,
      allMetricsDeclinedSignificantlyDuringHeatwave: true,
      noSubsequentErosionDrivenLossDetected: true,
      interpretation: 'The three metrics measure different dimensions of habitat structure and are not averaged or converted into one percentage movement toward ecosystem collapse.',
    },
    recovery: {
      allMetricsIncreasedSignificantlyFrom2017To2019: true,
      returnedToPreHeatwaveLevelsBy2019: false,
      authorsInferRecoveryWillTakeManyYears: true,
      interpretation: 'Incomplete recovery through 2019 directly supports one-to-under-ten-year persistence. It does not establish ten-to-fifty-year or irreversible loss.',
    },
    boundaries: {
      compatibleGlobalAffectedReefAreaPercent: null,
      compatibleCurrentHumanConsequence: null,
      morphologyAndMetricResponsesDiffer: true,
      interpretation: 'Local quadrat coverage, metric fold changes and the global bleaching-event label do not measure the share of the worldwide reef distribution affected.',
    },
  },
  ratingDecision: {
    change: 'central_grade_reduced_after_replacing_heat_exposure_and_false_human_count_with_direct_local_structure_and_recovery_evidence',
    candidate,
    admittedUses: [
      'Use the significant loss across three photogrammetric metrics to set central ecosystem severity at level 2.',
      'Use incomplete recovery from the 2015–2016 event through 2019 to set ecosystem persistence lower and central bounds at level 2.',
      'Use the single-system study boundary to keep central ecosystem reach at level 1 and retain a broader level-3 upper case only as uncertainty.',
    ],
    excludedUses: [
      'Do not interpret three complexity metrics, thirty quadrats or coral fragments as people harmed.',
      'Do not convert the 1.18-, 1.52- and 1.03-fold metric declines into a single percentage movement toward ecosystem collapse.',
      'Do not convert one reef system or the global bleaching-event label into the share of global reef distribution structurally collapsed.',
      'Do not treat the four-year observation interval as proof of ten-to-fifty-year or irreversible persistence.',
      'Do not add coral bleaching, heat exposure, fishery disruption, coastal-protection loss or human dependence unless a source isolates a non-overlapping terminal consequence for this node.',
      'Do not infer direct human harm from ecosystem structural complexity alone.',
    ],
    exactRemainingGaps: [
      'A representative global or multi-region distribution of directly measured three-dimensional reef-structure change using compatible metrics.',
      'A documented conversion from structural metrics to movement toward a reef-specific functional-collapse reference.',
      'A recovery-time distribution beyond 2019 across reef types and disturbance histories.',
      'Current human health, livelihood, food-security or coastal-protection consequences attributable specifically to structural collapse.',
      'A causal decomposition of heatwave mortality, chronic local disturbance, storms, acidification and other drivers of structural loss.',
    ],
  },
};

payload.digest = sha256(JSON.stringify({
  version: payload.version,
  source: payload.source,
  currentWindow: payload.currentWindow,
  evidence: payload.evidence,
  ratingDecision: payload.ratingDecision,
}));

await writeFile(output, `${JSON.stringify(payload, null, 2)}\n`);
console.log(JSON.stringify({ output, digest: payload.digest, xmlSha256, candidate: candidate.revised }, null, 2));
