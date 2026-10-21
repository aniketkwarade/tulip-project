import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'tropospheric-ozone-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

const source = {
  id: 'state_of_global_air_2024_gbd_2021_ozone',
  publishers: ['Health Effects Institute', 'Institute for Health Metrics and Evaluation', 'UNICEF'],
  title: 'State of Global Air 2024',
  publicationYear: 2024,
  reportUrl: 'https://www.stateofglobalair.org/sites/default/files/documents/2024-06/soga-2024-report_0.pdf',
  methodologyRecordUrl: 'https://ghdx.healthdata.org/record/ihme-data/gbd-2021-burden-by-risk-1990-2021',
  underlyingAssessment: 'Global Burden of Diseases, Injuries, and Risk Factors Study 2021',
};
const expected = {
  reportBytes: 5_587_043,
  reportSha256: 'cb8bfaefcf9b705c56974119703f14c0c68a92a5e0f5e5aab4480dd3d67acd77',
};

const { stdout: report } = await execFileAsync('curl', [
  '--location', '--fail', '--silent', '--show-error', '--max-time', '180',
  '--header', 'User-Agent: LostPlanet-TULIP/1.0 (+tropospheric-ozone-evidence-ingestion)',
  source.reportUrl,
], { encoding: null, maxBuffer: 10_000_000, timeout: 190_000 });

assert.equal(report.subarray(0, 4).toString('utf8'), '%PDF', 'State of Global Air report is not a PDF');
assert.equal(report.length, expected.reportBytes, 'State of Global Air report byte count changed');
assert.equal(sha256(report), expected.reportSha256, 'State of Global Air report checksum changed');

const snapshot = {
  version: 'tulip_tropospheric_ozone_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_global_human_endpoint_ingested',
  productionRatingsEnabled: 0,
  nodeId: 'tropospheric_ozone',
  purpose: 'Replace the 2015 ozone burden input with a current global terminal human endpoint while preserving the modelled nature, uncertainty interval, disease boundary and absence of a compatible ecosystem endpoint.',
  source: {
    ...source,
    fetchedReport: {
      bytes: report.length,
      sha256: expected.reportSha256,
      retrievedOn: checkedOn,
    },
    reviewedReportPages: {
      exposureDefinition: 'report page 12',
      uncertaintyDefinition: 'report page 6',
      humanEndpoint: 'report page 18',
      geographicDistribution: 'report page 19',
    },
  },
  endpoints: {
    humanBurden2021: {
      observationYear: 2021,
      geography: 'global',
      pollutant: 'ground-level ozone',
      outcome: 'deaths from chronic obstructive pulmonary disease attributable to long-term exposure',
      deaths: { central: 490_000, lower95Ui: 107_200, upper95Ui: 837_000 },
      shareOfGlobalCopdDeathsPercent: { central: 13, lower95Ui: 2.9, upper95Ui: 22 },
      disabilityAdjustedLifeYears: 8_700_000,
      interpretation: 'The estimate is a comparative-risk model result. It is not a count of death certificates that identify ozone as the cause.',
    },
    exposureDefinition: {
      metric: 'Population-weighted average of the daily maximum eight-hour ozone concentration during the warmest six consecutive months of the year.',
      unit: 'parts per billion',
      interpretation: 'This definition separates harmful ground-level ozone from protective stratospheric ozone and prevents mixing annual, hourly and peak-season concentrations.',
    },
    trendContext: {
      startYear: 2010,
      endYear: 2021,
      reportedChangeInOzoneLinkedCopdDeaths: 'increased by nearly 20%',
      qualifier: 'The report states that population ageing contributes to the increasing number of COPD deaths; the change is not interpreted as an ozone-concentration trend or used as a separate harm input.',
    },
  },
  tulipMapping: {
    applicableDomains: ['human'],
    confidence: 'B',
    humanAxes: {
      severity: {
        lower: 4,
        central: 4,
        upper: 4,
        basis: 'The admitted endpoint is attributable premature death, which maps to terminal severity level 4 across the reported uncertainty interval.',
      },
      reach: {
        lower: 2,
        central: 2,
        upper: 2,
        basis: 'The 95% uncertainty interval of 107,200 to 837,000 deaths remains wholly within the TULIP level-2 reach anchor of 10,000 to fewer than 1 million people.',
      },
      persistence: {
        lower: 4,
        central: 4,
        upper: 4,
        basis: 'Death is a permanent terminal consequence and maps to persistence level 4.',
      },
    },
    currentCatalogueRecommendation: {
      rating: 'E 8.5',
      uncertainty: 'E 8.5 to E 8.5',
      confidence: 'B',
      reason: 'The newer global endpoint raises the burden estimate from the old 422,000 figure to 490,000 and supplies a 95% uncertainty interval, but the lower, central and upper estimates all map to the same TULIP axes. Certainty improves while the rating remains unchanged.',
    },
  },
  limitations: [
    'The mortality burden is modelled from exposure, baseline COPD mortality and exposure-response relationships; it is not a direct census of ozone-caused deaths.',
    'The GBD ozone risk estimate covers COPD mortality. Short-term asthma exacerbation and other possible outcomes are described but are not added to this endpoint.',
    'The 95% uncertainty interval is retained as source uncertainty and is not treated as a probability distribution for the TULIP rating.',
    'State of Global Air reports the GBD 2021 result. It is a presentation of the same underlying assessment, not an independent replication.',
    'The report describes crop and biodiversity harm, but does not provide a compatible current global ecosystem-condition endpoint for this node. Ecosystem effects remain outside this rating until separately measured.',
    'The nearly 20% increase in ozone-linked COPD deaths since 2010 is not added to the 2021 burden because that would double count the same terminal outcome.',
  ],
  admissionDecision: {
    admittedUse: 'Use the 2021 global COPD mortality endpoint and its 95% uncertainty interval to set the human severity, reach and persistence axes for tropospheric_ozone.',
    prohibitedUse: 'Do not count the uncertainty bounds as additional deaths, add the reported trend to the 2021 burden, infer ecosystem severity from the human endpoint, or describe this source as independent confirmation of GBD 2021.',
  },
};
snapshot.snapshotDigest = digest({
  source: snapshot.source,
  endpoints: snapshot.endpoints,
  tulipMapping: snapshot.tulipMapping,
  limitations: snapshot.limitations,
  admissionDecision: snapshot.admissionDecision,
});

await mkdir(path.dirname(output), { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  rating: snapshot.tulipMapping.currentCatalogueRecommendation.rating,
  confidence: snapshot.tulipMapping.confidence,
  digest: snapshot.snapshotDigest,
}, null, 2));
