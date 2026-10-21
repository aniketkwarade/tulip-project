import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'subsea-cable-landing-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+subsea-cable-evidence-ingestion)';

const sources = {
  itu: {
    id: 'itu_submarine_cable_resilience_2026',
    publisher: 'International Telecommunication Union',
    title: 'International Advisory Body on Submarine Cable Resilience: Report of the Working Groups 2026',
    publicationDate: '2026-07-10',
    landingPageUrl: 'https://www.itu.int/en/publications/gs/pages/publications.aspx?media=electronic&parent=S-IAB-WG-2026',
    reportUrl: 'https://www.itu.int/dms_pub/itu-s/opb/iab/S-IAB-WG-2026-PDF-E.pdf',
  },
  oecd: {
    id: 'oecd_communication_network_resilience_2025',
    publisher: 'Organisation for Economic Co-operation and Development',
    title: 'Enhancing the Resilience of Communication Networks',
    publicationDate: '2025-05-06',
    doi: 'https://doi.org/10.1787/d6920477-en',
    reportUrl: 'https://www.oecd.org/content/dam/oecd/en/publications/reports/2025/05/enhancing-the-resilience-of-communication-networks_a47d78a1/d6920477-en.pdf',
  },
  worldBank: {
    id: 'world_bank_cloud_cybersecurity_2024',
    publisher: 'World Bank',
    title: 'Unpacking Cloud Cybersecurity',
    publicationDate: '2024-11-01',
    reportUrl: 'https://documents1.worldbank.org/curated/en/099103124193527496/pdf/P1778521dda0ba08e19fcb1f0d251cdb786.pdf',
  },
};

const expected = {
  itu: { bytes: 4_367_059, sha256: 'c5761c88fd1aa2ad0479d67e0122a9d9ae960c4abf0d34256674d9931ce61003' },
  oecd: { bytes: 3_873_082, sha256: '49d4d31cc295bd77b702301fd4bf8543a5dfc3aa36bf1300f4fab2eca399d912' },
  worldBank: { bytes: 1_736_045, sha256: 'bfe6233d22ad638dcc83869ce52ee00259117c756672372424119808ab949cad' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url, maxBuffer = 12_000_000) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '180',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer, timeout: 190_000 });
  return stdout;
}

const [ituBuffer, oecdBuffer, worldBankBuffer] = await Promise.all([
    fetchBuffer(sources.itu.reportUrl),
    fetchBuffer(sources.oecd.reportUrl),
    fetchBuffer(sources.worldBank.reportUrl),
]);

for (const [key, buffer] of Object.entries({ itu: ituBuffer, oecd: oecdBuffer, worldBank: worldBankBuffer })) {
  assert.equal(buffer.subarray(0, 4).toString('utf8'), '%PDF', `${key} source is not a PDF`);
  assert.equal(buffer.length, expected[key].bytes, `${key} source byte count changed`);
  assert.equal(sha256(buffer), expected[key].sha256, `${key} source checksum changed`);
}

const snapshot = {
    version: 'tulip_subsea_cable_landing_reference_2026_09_23_v1',
    generatedOn: checkedOn,
    status: 'current_service_disruption_and_structural_concentration_evidence_ingested',
    productionRatingsEnabled: 0,
    purpose: 'Measure realized human service and material consequences of concentrated submarine-cable routes and landing dependencies while keeping network scale, traffic, faults, repair work, redundancy and people harmed distinct.',
    sources: {
      itu: {
        ...sources.itu,
        fetchedReport: { bytes: ituBuffer.length, sha256: expected.itu.sha256, retrievedOn: checkedOn },
        reviewedReportPages: ['PDF pages 69–70', 'PDF pages 127–130'],
      },
      oecd: {
        ...sources.oecd,
        fetchedReport: { bytes: oecdBuffer.length, sha256: expected.oecd.sha256, retrievedOn: checkedOn },
        reviewedReportPages: ['PDF pages 4 and 8'],
      },
      worldBank: {
        ...sources.worldBank,
        fetchedReport: { bytes: worldBankBuffer.length, sha256: expected.worldBank.sha256, retrievedOn: checkedOn },
        reviewedReportPages: ['PDF pages 34–35'],
      },
    },
    endpoints: {
      realizedHumanConsequences: {
        tonga2022: {
          infrastructureBoundary: 'The country’s sole international submarine cable was severed at two locations.',
          serviceConsequence: 'Near-total digital isolation',
          durationDays: 61,
          estimatedDamageAndEconomicLossUsd: 182_000_000,
          shareOf2021GdpPercent: 38.7,
          remittancesShareOfGdpPercent: 40,
          remittancesShareOfHouseholdConsumptionPercent: 30,
          interpretation: 'This is direct evidence of a severe national material and communications consequence from single-route dependence. It is one country case, not a global average or a unique affected-person count.',
        },
        aae1Cut2022: {
          countriesNamed: ['Ethiopia', 'Somalia'],
          internationalBandwidthLostPercent: 85,
          duration: 'several hours',
          interpretation: 'This is direct evidence of a short-duration multi-country service loss. It reports bandwidth rather than unique people or downstream health harm.',
        },
      },
      concentrationAndFaultContext: {
        shareOfIntercontinentalDataTrafficPercent: 99,
        annualGlobalFaultRange: { lower: 150, upper: 200 },
        shareAttributedToHumanMaritimeActivitiesPercentLowerBound: 80,
        babElMandeb: { cablesLowerBound: 17, shareOfGlobalInternetTrafficPercent: { lower: 17, upper: 20 }, corridorWidthMilesUpperBound: 14 },
        suez: { shareOfEuropeAsiaCommunicationsPercent: 90, shallowWaterDistanceMilesLowerBound: 100 },
        interpretation: 'Traffic shares, cable counts, corridor dimensions and global fault counts describe dependence and physical exposure. They do not count harmed people and cannot be added to a consequence score.',
      },
      repairAndPersistenceContext: {
        meanResponseToCommenceRepairDays2012UpperBound: 20,
        meanResponseToCommenceRepairDays2024LowerBound: 50,
        averageRepairDays2015: 22,
        averageRepairDays2023: 40,
        southeastAsia2023: { cablesDamagedSimultaneously: 5, capacityLossPercent: 75, repairCompletionMonths: 9, emergencyTerrestrialCapacityUsed: true },
        interpretation: 'Repair delay can bound how long physical vulnerability remains, but it is not automatically the duration of a user outage because traffic may be rerouted and emergency capacity may be purchased.',
      },
      redundancyBoundary: {
        finding: 'Lack of redundancy across submarine segments, terrestrial backhaul and landing stations creates localized single points of failure; alternate routes can maintain service after a fault.',
        interpretation: 'A cable fault is not equivalent to a landing-site failure or service outage. Consequence depends on shared-risk concentration, spare capacity, backhaul, power, rerouting and repair access.',
      },
    },
    tulipUse: {
      admitted: [
        'Use the Tonga and AAE-1 cases to establish that concentrated or single-route dependence can cause direct human service and material consequences.',
        'Use the documented hours-to-61-day consequence durations to bound current human persistence; retain longer repair cases as upper context only when service degradation is demonstrated.',
        'Use the Tonga material-loss estimate to support level-2 human severity without converting GDP share into people harmed.',
        'Use global fault, repair, traffic and chokepoint figures as mechanism and exposure context only.',
        'Confine the current node to direct human consequences; cable construction and seabed effects belong to separately defined environmental nodes.',
      ],
      prohibited: [
        'Do not treat 99% of intercontinental traffic as 99% of people harmed.',
        'Do not convert cables, faults, repairs, traffic capacity, corridor width, countries served or bandwidth percentage into unique affected-person reach.',
        'Do not treat every cable fault as a landing-site failure, a service outage or a consequence of geographic concentration.',
        'Do not add Tonga, AAE-1 and other case-study consequences into a synthetic global burden without compatible denominators and overlap controls.',
        'Do not use repair duration as user-outage persistence when rerouting or emergency capacity maintains service.',
        'Do not extrapolate the Tonga single-cable case to countries with diverse routes and backhaul.',
        'Do not add downstream finance, emergency response, cloud, health or livelihood pathways without measured terminal outcomes and overlap review.',
      ],
      currentCatalogueRecommendation: {
        nodeId: 'subsea_cable_landing_chokepoint',
        rating: 'B 4.0',
        uncertainty: 'B 3.3 to C 6.3',
        confidence: 'C',
        domain: 'human only',
        reason: 'Direct cases establish material service and economic consequences, but the available global totals describe infrastructure rather than harmed people. The central rating records material disruption with local reach and acute duration; its upper bound allows documented national reach and multi-month recovery without turning repair work or traffic shares into harm.',
      },
    },
    unresolvedForTulip: [
      'Build a current event register that distinguishes cable faults, landing-station failures, rerouted degradation and realized outages.',
      'Obtain unique people, households or essential-service users experiencing attributable consequences for each documented outage.',
      'Separate route concentration from other causes through shared-risk and counterfactual routing analysis.',
      'Measure user-facing outage duration and material loss consistently rather than substituting repair completion time.',
      'Develop a global denominator for populations dependent on non-redundant international routes without equating dependence with current harm.',
    ],
  };

snapshot.snapshotDigest = digest({
  sources: snapshot.sources,
  endpoints: snapshot.endpoints,
  tulipUse: snapshot.tulipUse,
  unresolvedForTulip: snapshot.unresolvedForTulip,
});

await mkdir(outputDir, { recursive: true });
await writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output,
  status: snapshot.status,
  rating: snapshot.tulipUse.currentCatalogueRecommendation.rating,
  uncertainty: snapshot.tulipUse.currentCatalogueRecommendation.uncertainty,
  digest: snapshot.snapshotDigest,
}, null, 2));
