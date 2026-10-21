import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'rain-on-snow-current-reference-snapshot.json');
const checkedOn = '2026-09-24';
const sha256 = value => createHash('sha256').update(value).digest('hex');

const sources = {
  hydrologicMechanisms2025: {
    id: 'giovando_yellowstone_rain_on_snow_mechanisms_2025',
    title: 'Hydrologic Mechanisms for 2022 Yellowstone River Flood and Comparisons to Recent Historic Floods',
    publisher: 'Hydrological Processes; U.S. Geological Survey',
    publicationDate: '2025-03-13',
    doi: 'https://doi.org/10.1002/hyp.70099',
    usgsUrl: 'https://www.usgs.gov/publications/hydrologic-mechanisms-2022-yellowstone-river-flood-and-comparisons-recent-historic',
    crossrefUrl: 'https://api.crossref.org/works/10.1002/hyp.70099?mailto=research%40tulip.earth',
  },
  usgsFloodSurvey2024: {
    id: 'usgs_upper_yellowstone_flood_survey_2024',
    title: 'June 2022 Floods in the Upper Yellowstone River Basin',
    publisher: 'U.S. Geological Survey',
    publicationDate: '2024-07-22',
    doi: 'https://doi.org/10.3133/fs20243035',
    url: 'https://pubs.usgs.gov/fs/2024/3035/fs20243035.pdf',
    file: {
      bytes: 5_501_024,
      sha256: '567bea00272f745ef90f0a84c58d067a96292734897d4988727ed982d17cdf64',
    },
  },
  npsOneYear2023: {
    id: 'nps_yellowstone_flood_one_year_2023',
    title: 'Yellowstone Flooding: One Year Later',
    publisher: 'U.S. National Park Service',
    publicationDate: '2023-10-18',
    url: 'https://www.nps.gov/articles/000/yell-flooding.htm',
    file: {
      bytes: 38_639,
      sha256: '4fbf39b4fa3d60f205ca1fcd0e37b2c11180d6e3393fb27ff0525eb90cbf1c18',
    },
  },
  npsRecovery2026: {
    id: 'nps_yellowstone_flood_recovery_2026',
    title: 'Flood Recovery & Operations',
    publisher: 'U.S. National Park Service',
    publicationDate: '2026-01-07',
    url: 'https://www.nps.gov/yell/planyourvisit/flood-recovery.htm',
    file: {
      bytes: 67_753,
      sha256: 'b9a9fd3a79ccf4e2fc8c5ba09a5151eecc81d7599ce35903d8ef7d8d41295f7d',
    },
  },
  usgsEventAccount2022: {
    id: 'usgs_yellowstone_flood_event_account_2022',
    title: 'How might the devastating June 2022 floods in and around Yellowstone National Park influence seismic and hydrothermal activity?',
    publisher: 'U.S. Geological Survey',
    publicationDate: '2022-06-20',
    url: 'https://www.usgs.gov/observatories/yvo/news/how-might-devastating-june-2022-floods-and-around-yellowstone-national-park',
  },
};

async function fetchBuffer(url, maximumBytes = 8_000_000) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(120_000),
    headers: {
      accept: '*/*',
      'user-agent': 'Mozilla/5.0 LostPlanet-TULIP/1.0 (+rain-on-snow-evidence-ingestion)',
    },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert(body.length <= maximumBytes, `${url} exceeds the download limit`);
  return body;
}

function textFromHtml(body) {
  return body.toString('utf8')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&(?:#\d+|#x[\da-f]+|\w+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertPinned(body, source, label) {
  assert.equal(body.length, source.file.bytes, `${label}: byte size changed`);
  assert.equal(sha256(body), source.file.sha256, `${label}: checksum changed`);
}

const [crossrefBody, usgsPdf, npsOneYearBody, npsRecoveryBody, usgsEventBody] = await Promise.all([
  fetchBuffer(sources.hydrologicMechanisms2025.crossrefUrl, 1_000_000),
  fetchBuffer(sources.usgsFloodSurvey2024.url),
  fetchBuffer(sources.npsOneYear2023.url, 1_000_000),
  fetchBuffer(sources.npsRecovery2026.url, 1_000_000),
  fetchBuffer(sources.usgsEventAccount2022.url, 1_000_000),
]);

assertPinned(usgsPdf, sources.usgsFloodSurvey2024, 'USGS 2024 flood fact sheet');
assertPinned(npsOneYearBody, sources.npsOneYear2023, 'NPS one-year flood account');
assertPinned(npsRecoveryBody, sources.npsRecovery2026, 'NPS flood recovery page');
assert.equal(usgsPdf.subarray(0, 5).toString(), '%PDF-');

const crossref = JSON.parse(crossrefBody).message;
assert.equal(crossref.title[0], sources.hydrologicMechanisms2025.title);
assert.deepEqual(crossref.published['date-parts'][0].slice(0, 2), [2025, 3]);
assert.equal(crossref['container-title'][0], 'Hydrological Processes');
const mechanismText = textFromHtml(Buffer.from(crossref.abstract));
assert.match(mechanismText, /high discharge was primarily due to the combination of hydrologic mechanisms initiated by rain.on.snow/i);
assert.match(mechanismText, /contributions of each hydrologic driver, rain and snow, have not been quantified/i);

const npsOneYearText = textFromHtml(npsOneYearBody);
const npsRecoveryText = textFromHtml(npsRecoveryBody);
const usgsEventText = textFromHtml(usgsEventBody);
assert.match(npsOneYearText, /Approximately 10,000 visitors and 2,200 concessions employees were accounted for and evacuated/i);
assert.match(npsOneYearText, /Mammoth area was without power for over 24 hours/i);
assert.match(npsOneYearText, /wastewater line had been severed and wastewater was flowing into the Gardner River/i);
assert.match(npsOneYearText, /August 8, 2023, marked the reopening of the Mammoth Hotel Dining Room/i);
assert.match(npsRecoveryText, /combined 7\.5.9\.5 inches of rain and snowmelt in a 24.hour period/i);
assert.match(npsRecoveryText, /Within 36 hours of the event, the park evacuated all visitors in developed areas/i);
assert.match(npsRecoveryText, /south loop of the park reopened on June 22, 2022, nine days after the flood event/i);
assert.match(npsRecoveryText, /road opened to public travel on October 15, 2022/i);
assert.match(usgsEventText, /communities adjacent to Yellowstone National Park.*were completely isolated by floodwaters and damage to roads/i);
assert.match(usgsEventText, /Power was lost in many places, as was access to clean drinking water/i);
assert.match(usgsEventText, /Recovery will probably take years/i);

const snapshot = {
  version: 'tulip_rain_on_snow_current_reference_2026_09_24_v1',
  generatedOn: checkedOn,
  status: 'current_event_mechanism_consequences_and_recovery_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace a 1996-only rating with a recent event whose rain-on-snow mechanism, evacuations, service interruption and recovery milestones are directly documented, while keeping event attribution and ecosystem-condition gaps explicit.',
  sources: Object.fromEntries(Object.entries(sources).map(([key, source]) => [key, {
    id: source.id,
    title: source.title,
    publisher: source.publisher,
    publicationDate: source.publicationDate,
    url: source.doi ?? source.url,
    ...(source.usgsUrl ? { articleUrl: source.usgsUrl } : {}),
    ...(source.file ? { fetchedFile: source.file } : {}),
  }])),
  evidence: {
    eventMechanism: {
      eventPeriod: { start: '2022-06-10', end: '2022-06-15' },
      geography: 'Upper Yellowstone River Basin, Wyoming and Montana, United States',
      finding: 'The 2025 peer-reviewed hydrologic analysis reports that the high discharge was primarily caused by interacting mechanisms initiated by rain on snow, including a late-peaking high-elevation snowpack.',
      driverAllocation: 'The paper states that the separate contributions of rain and snow have not been quantified. TULIP therefore treats the event as a matched rain-on-snow pathway but does not claim a precise rain-only, melt-only or climate-change fraction.',
      rainAndSnowmeltTwentyFourHourInches: { lower: 7.5, upper: 9.5 },
    },
    humanConsequences: {
      visitorsEvacuatedApproximate: 10_000,
      concessionsEmployeesEvacuated: 2_200,
      compatibleUniqueEvacuatedPeopleApproximate: 12_200,
      communitiesIsolated: true,
      cleanDrinkingWaterAccessLostInMultipleLocations: true,
      mammothPowerLossHoursLowerBound: 24,
      southLoopClosureDays: 9,
      northAndNortheastEntranceClosureMonthsApproximate: 4,
      lastConcessionFacilityReopeningDate: '2023-08-08',
      lastConcessionFacilityClosureDurationMonthsApproximate: 14,
      compatibleCurrentReachClassification: '10000_to_under_1000000_people',
      endpointBoundary: 'Evacuated visitors and employees are separate reported groups and sum to about 12,200 people. Wider community populations, future visitors, traffic counts and annual park visitation are not added. Recovery milestones describe different services and are not summed into extra severity.',
    },
    ecosystemAndPhysicalConsequences: {
      directObservations: ['significant regional ecosystem impact reported by NPS', 'roads, bridges, wastewater systems, facilities and trails damaged', 'severed wastewater line discharged into the Gardner River', 'multiple northern rivers changed course after the flood'],
      compatibleBiologicalConditionLossPercent: null,
      compatibleAffectedEcosystemDistributionPercent: null,
      compatibleRecoveryTimeDistribution: null,
      endpointBoundary: 'The sources establish a regional physical and pollution disturbance but do not quantify biological condition loss, the affected share of a defined mountain-river ecosystem distribution, or representative ecological recovery time.',
    },
    historicalContext: {
      priorReferenceEventYear: 1996,
      use: 'historical calibration only',
      boundary: 'Fatalities and affected-person counts from the 1996 Pennsylvania event do not enter the 2022 current event total. They remain evidence that the pathway can produce severe outcomes.',
    },
  },
  ratingDecision: {
    change: 'revised',
    candidate: {
      prior: { value: 7, grade: 'D', lower: 5.9, upper: 8.5, confidence: 'C' },
      revised: { value: 5.5, grade: 'C', lower: 3.6, upper: 6.6, confidence: 'C' },
    },
    axes: {
      human: {
        severity: { lower: 2, central: 3, upper: 3 },
        reach: { lower: 2, central: 2, upper: 2 },
        persistence: { lower: 2, central: 3, upper: 3 },
      },
      ecosystem: {
        severity: { lower: 0, central: 1, upper: 2 },
        reach: { lower: 0, central: 1, upper: 2 },
        persistence: { lower: 1, central: 2, upper: 3 },
      },
    },
    excludedUses: [
      'Do not use the flood magnitude, recurrence classification, rainfall, snowmelt volume or streamflow as human or ecosystem severity.',
      'Do not count annual park visitors, regional residents, roads, bridges or monitored streamgages as people harmed.',
      'Do not add 1996 fatalities or evacuations to the 2022 current event.',
      'Do not treat the full fourteen-month facility recovery as the duration experienced by every evacuated person or every essential service.',
      'Do not convert changed river courses, miles of road or the size of Yellowstone into an affected ecosystem-distribution percentage.',
      'Do not assign the full flood consequence to rain alone, snowmelt alone or anthropogenic climate change because the matched source does not quantify those fractions.',
      'Do not add Mountain Pass Avalanches, Critical Infrastructure Fragility, river-flood, wastewater or ecosystem-node scores to this rating.',
    ],
    exactRemainingGaps: [
      'A multi-event current rain-on-snow loss panel with consistent unique-person, injury, displacement, service-duration and recovery fields.',
      'A source-removal event attribution that quantifies the contribution of rain on snow relative to rain-only, snowmelt-only and other basin conditions.',
      'Measured biological condition change joined to the flood footprint and a defined mountain-river or floodplain ecosystem distribution.',
      'Representative ecological recovery observations after current rain-on-snow floods.',
    ],
  },
};

snapshot.snapshotDigest = sha256(Buffer.from(JSON.stringify(snapshot)));
await writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({ output, snapshotDigest: snapshot.snapshotDigest }, null, 2));
