import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'coral-reef-fragmentation-reference-snapshot.json');
const sha256 = value => createHash('sha256').update(value).digest('hex');

const sources = {
  fragmentationStudy: {
    id: 'cumming_coral_reef_fragmentation_2025',
    publisher: 'Landscape Ecology; James Cook University ResearchOnline',
    title: 'Crown-of-thorns starfish promote additional fine-grained habitat fragmentation in a coral reef ecosystem',
    publicationDate: '2025-05-05',
    doi: '10.1007/s10980-025-02107-y',
    url: 'https://researchonline.jcu.edu.au/88093/',
    pdfUrl: 'https://researchonline.jcu.edu.au/88093/1/88093.pdf',
    pdfSha256: '25e1335f7ecb41dbba256cf443b82375955f3db3fa444fb576453c780e53e835',
  },
  globalReefMap: {
    id: 'lyons_global_coral_reef_area_2024',
    publisher: 'Cell Reports Sustainability',
    title: 'New global area estimates for coral reefs from high-resolution mapping',
    publicationDate: '2024-02-23',
    doi: '10.1016/j.crsus.2024.100015',
    url: 'https://doi.org/10.1016/j.crsus.2024.100015',
    pdfUrl: 'https://reefresilience.org/wp-content/uploads/New-global-area-estimates-for-coral-reefs-from-high-resolution-mapping_Lyons-2024.pdf',
    pdfSha256: '566880c9a7c87d474279c5353d6674cb47cee75b852fd8b14271a89e694c38e5',
  },
};

for (const source of Object.values(sources)) {
  const response = await fetch(source.pdfUrl, {
    headers: { accept: 'application/pdf', 'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)' },
    signal: AbortSignal.timeout(180_000),
  });
  assert(response.ok, `Request failed (${response.status}) for ${source.pdfUrl}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert(bytes.subarray(0, 5).equals(Buffer.from('%PDF-')), `${source.id} did not return a PDF`);
  assert.equal(sha256(bytes), source.pdfSha256, `${source.id} PDF changed`);
}

const candidate = {
  previous: { value: 6.6, grade: 'D', lower: 4.8, upper: 8.5, confidence: 'C' },
  revised: { value: 3.3, grade: 'B', lower: 1.8, upper: 6.3, confidence: 'C' },
  axes: {
    ecosystem: {
      severity: { lower: 0, central: 1, upper: 2 },
      reach: { lower: 1, central: 1, upper: 2 },
      persistence: { lower: 0, central: 1, upper: 3 },
    },
  },
  reason: 'A 2025 open study directly measured finer-grained coral-patch fragmentation at 17 sites on 15 reefs in one Papua New Guinea bay. Mean live-coral cover declined from 58.2% to 53.7% between 2012 and 2014; edge increased at 15 of 17 sites and cohesion declined on most reefs, but mean coral fragmentation metrics were not statistically significant across sites and rugosity did not change. The evidence supports mild local ecosystem-condition loss, not global severe harm. It contains no direct human terminal consequence and no recovery follow-up.',
};

const payload = {
  version: 'tulip_coral_reef_fragmentation_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'direct_local_fragmentation_change_ingested_global_prevalence_recovery_and_human_consequences_missing',
  productionRatingsEnabled: 0,
  nodeId: 'coral_reef_fragmentation',
  sources,
  currentWindow: {
    start: 2012,
    end: 2014,
    coverageStatus: 'two_observations_across_one_bay',
    summaryMethod: 'event_distribution',
    coverageNote: 'The source compares mapped 10 by 10 metre plots before and during a crown-of-thorns outbreak at 17 sites on 15 inshore reefs in Kimbe Bay, Papua New Guinea. It is not a current global census of reef fragmentation.',
  },
  evidence: {
    studyDesign: {
      sites: 17,
      reefs: 15,
      plotDimensionsMetres: { width: 10, length: 10 },
      mapResolutionCentimetres: 15,
      geography: 'Kimbe Bay, Papua New Guinea',
      comparisonYears: [2012, 2014],
      disturbance: 'crown-of-thorns starfish outbreak',
    },
    observedCondition: {
      meanCoralCover2012Percent: 58.2,
      meanCoralCover2014Percent: 53.7,
      absolutePercentagePointChange: -4.5,
      totalSampledCoralArea2012SquareMetres: 988,
      totalSampledCoralArea2014SquareMetres: 908,
      sitesWithNetCoralCoverDecline: 10,
      sitesWithNetCoralCoverIncrease: 7,
      sitesWithIncreasedCoralEdge: 15,
      patchCohesionDeclinedOnMostReefs: true,
      rugosityChanged: false,
      coralMetricMeanChangesStatisticallySignificantAcrossSites: false,
      interpretation: 'The mapped plots show a heterogeneous local shift toward more edges, more patches and less cohesion. Coral-cover loss and patch configuration are related observations and are not added as separate harms.',
    },
    globalDenominatorContext: {
      shallowCoralReefAreaSquareKilometres: 348361,
      coralHabitatAreaSquareKilometres: 80213,
      coralHabitatArea95PercentIntervalSquareKilometres: { lower: 46237, upper: 106319 },
      mapResolutionMetres: 5,
      interpretation: 'The global map defines a possible distribution denominator. The Kimbe Bay study does not measure what share of that global area is fragmented, so the denominator cannot be used to extrapolate the local result.',
    },
    boundaries: {
      compatibleGlobalFragmentedAreaPercent: null,
      compatibleRecoveryTimeDistribution: null,
      compatibleCurrentHumanConsequence: null,
      currentGlobalStatusMeasured: false,
    },
  },
  ratingDecision: {
    change: 'central_grade_reduced_after_replacing_generic_global_and_human_assumptions_with_direct_local_patch_configuration_evidence',
    candidate,
    admittedUses: [
      'Use the measured local patch-configuration changes to support mild central ecosystem severity.',
      'Use the one-bay study boundary to keep central ecosystem reach local.',
      'Use the absence of recovery follow-up to retain wide persistence bounds rather than converting the two-year comparison into recovery time.',
      'Use the global coral-habitat map only to define the missing distribution denominator.',
    ],
    excludedUses: [
      'Do not treat the 17 study sites, 15 reefs, mapped pixels or coral patches as people harmed.',
      'Do not convert one bay, a crown-of-thorns outbreak or global reef-map coverage into global fragmentation prevalence.',
      'Do not add coral-cover loss and patch fragmentation as independent consequences.',
      'Do not convert the 2012–2014 comparison interval into ecological recovery time.',
      'Do not copy coral bleaching, reef structural collapse, fishery, tourism or coastal-protection scores into this node.',
      'Do not infer current human harm from plausible downstream reef services without an attributable terminal-consequence source.',
    ],
    exactRemainingGaps: [
      'A representative multi-region or global estimate of coral-patch fragmentation using compatible edge, patch and cohesion metrics.',
      'A documented conversion from patch-configuration change to movement toward a reef-specific functional-collapse reference.',
      'Recovery-time observations for fragmented coral habitat after the disturbance ends.',
      'A current update showing whether the measured Kimbe Bay condition persisted beyond 2014.',
      'Current human health, livelihood, food-security or coastal-protection consequences attributable specifically to fragmentation rather than total coral loss.',
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
