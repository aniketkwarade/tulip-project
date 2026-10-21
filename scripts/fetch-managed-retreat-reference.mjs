import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'managed-retreat-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+managed-retreat-evidence-ingestion)';
const source = {
  id: 'gao_26_109045_fema_flood_property_acquisitions',
  publisher: 'U.S. Government Accountability Office',
  title: 'Flood Risk Mitigation: Reducing Fiscal Exposure and Improving Affordability',
  publicationDate: '2026-03-26',
  landingUrl: 'https://www.gao.gov/products/gao-26-109045',
  accessibleReportUrl: 'https://files.gao.gov/reports/GAO-26-109045/index.html',
};
const expected = {
  reportBytes: 84_697,
  reportSha256: 'e9c598be8596f956079cc7e108dfb040384fd36ff71a10d6895f9528f53766bd',
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

const { stdout: reportBuffer } = await execFileAsync('curl', [
  '--location', '--fail', '--silent', '--show-error',
  '--header', `User-Agent: ${userAgent}`,
  '--header', 'Accept: text/html',
  source.accessibleReportUrl,
], { encoding: null, maxBuffer: 2_000_000, timeout: 120_000 });

assert.equal(reportBuffer.length, expected.reportBytes, 'GAO accessible report byte count changed');
assert.equal(sha256(reportBuffer), expected.reportSha256, 'GAO accessible report checksum changed');
const report = reportBuffer.toString('utf8').replace(/\s+/g, ' ');
assert.match(report, /69,415 \(about 72\.5 percent\) of the 95,762 properties FEMA mitigated from 1989 through 2025/i);
assert.match(report, /average federal cost per property for mitigation was \$136,000 for acquisitions/i);
assert.match(report, /typically takes at least 2 to 3 years, and often longer/i);
assert.match(report, /on average, states took 16 months after a disaster declaration/i);
assert.match(report, /approved 82 acquisitions of properties affected by Hurricane Helene/i);
assert.match(report, /More than 575 additional acquisition applications had been submitted but not yet approved/i);
assert.match(report, /Acquired properties are converted to open space in perpetuity/i);

const snapshot = {
  version: 'tulip_managed_retreat_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_us_property_acquisition_pipeline_and_process_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace generic global reach and ecosystem assumptions with a reproducible current case of households formally considering voluntary flood-risk relocation and the documented time required to complete that process.',
  source: {
    ...source,
    fetchedReport: {
      url: source.accessibleReportUrl,
      bytes: reportBuffer.length,
      sha256: expected.reportSha256,
      retrievedOn: checkedOn,
    },
  },
  endpoints: {
    historicalProgramContext: {
      period: { start: 1989, end: 2025 },
      completedAcquisitions: 69_415,
      totalFemaMitigatedProperties: 95_762,
      acquisitionSharePercent: 72.5,
      averageFederalAcquisitionCostUsd2008To2014: 136_000,
      interpretation: 'Completed acquisitions establish that voluntary relocation occurs at material scale in one national program. They are a cumulative property count, not the number of people currently under decision pressure.',
    },
    currentDecisionCase: {
      event: 'Hurricane Helene',
      jurisdiction: 'North Carolina, United States',
      statusAsOf: '2026-02',
      approvedProperties: 82,
      submittedNotYetApprovedPropertiesLowerBound: 575,
      identifiedPropertyCaseloadLowerBound: 657,
      interpretation: 'The 657-property lower bound measures a current documented acquisition pipeline. A property is used only as a household-scale reach proxy; it is not converted into a person count.',
    },
    processDuration: {
      averageStateApplicationSubmissionDelayMonths: 16,
      typicalTotalProcessYearsLowerBound: 2,
      typicalTotalProcessYearsUpperDescription: 'at least 2 to 3 years, and often longer',
      interpretation: 'The process duration supports the persistence of the relocation decision burden. It does not describe how long flood damage lasts or how long acquired land remains open space.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the current 657-property lower bound as a household-scale reach proxy for a documented U.S. case.',
      'Use the documented two-to-three-year process as the central persistence anchor for decision and relocation burden.',
      'Use voluntary acquisition and demolition as evidence of a material household relocation decision, with uncertainty because the report does not quantify health, livelihood or service outcomes.',
      'Confine the direct adverse endpoint to people. Permanent open space is a program outcome and possible environmental benefit, not ecosystem harm from decision pressure.',
    ],
    prohibited: [
      'Do not treat 69,415 historical completed acquisitions as the number of people currently harmed.',
      'Do not multiply the historical average acquisition cost by the current or historical property count to invent a loss total.',
      'Do not convert properties into people using an assumed household size.',
      'Do not count the flood hazard, disaster damage, insurance pressure or later governance delay again inside this node.',
      'Do not use permanent open-space status as adverse ecosystem severity or persistence.',
      'Do not present one U.S. program or one North Carolina disaster as global prevalence.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'managed_retreat_pressure',
      rating: 'C 5.5',
      uncertainty: 'B 4.0 to D 7.0',
      confidence: 'B',
      domain: 'human only',
      reason: 'A current official case directly establishes household-scale reach and a multi-year process, while material severity remains a converted property-relocation proxy and global prevalence is unresolved.',
    },
  },
  unresolvedForTulip: [
    'Obtain a harmonized current national or global count of households formally considering or undergoing managed retreat.',
    'Obtain direct measures of attributable financial loss, livelihood disruption, mental-health burden and essential-service interruption during relocation decisions.',
    'Compare voluntary acquisitions with other managed-retreat pathways and with households unable or unwilling to participate.',
    'Add location-specific ecosystem endpoints only when the relocation decision itself causes measured ecological harm; do not infer harm from post-acquisition open space.',
  ],
};

snapshot.snapshotDigest = digest({
  source: snapshot.source,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  currentPropertyCaseloadLowerBound: snapshot.endpoints.currentDecisionCase.identifiedPropertyCaseloadLowerBound,
  processYearsLowerBound: snapshot.endpoints.processDuration.typicalTotalProcessYearsLowerBound,
  digest: snapshot.snapshotDigest,
}, null, 2));
