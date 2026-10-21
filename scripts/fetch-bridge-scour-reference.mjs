import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'bridge-scour-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+bridge-scour-evidence-ingestion)';

const sources = {
  inventory: {
    id: 'fhwa_nbi_highway_bridges_2025',
    publisher: 'U.S. Federal Highway Administration',
    title: '2025 National Bridge Inventory highway bridge files',
    publicationDate: '2025-06-20',
    url: 'https://www.fhwa.dot.gov/BRIDGE/nbi/ascii2025.cfm',
    localSnapshot: 'public/us-bridge-scour-impact-snapshot.json',
  },
  classification: {
    id: 'fhwa_scour_critical_code_definition',
    publisher: 'U.S. Federal Highway Administration',
    title: 'Implementation of Scour Countermeasures',
    publicationDate: '1997-03-20',
    url: 'https://www.fhwa.dot.gov/engineering/hydraulics/policymemo/coescour.cfm',
  },
  schoharie: {
    id: 'ntsb_schoharie_creek_bridge_collapse_1987',
    publisher: 'U.S. National Transportation Safety Board',
    title: 'Collapse of New York Thruway (I-90) Bridge over the Schoharie Creek',
    eventDate: '1987-04-05',
    url: 'https://www.ntsb.gov/investigations/Pages/DCA87MH005.aspx',
  },
  hatchie: {
    id: 'ntsb_hatchie_river_bridge_collapse_1989',
    publisher: 'U.S. National Transportation Safety Board',
    title: 'Collapse of the Northbound U.S. Route 51 Bridge Spans over the Hatchie River',
    eventDate: '1989-04-01',
    url: 'https://www.ntsb.gov/investigations/Pages/DCA89MH006.aspx',
  },
};

const expected = {
  inventory: { bytes: 4_219, sha256: '167eafa976fb37c76edf29d4654e12b3961217e5dc96167aef15294c7d97c142' },
  classificationClaim: { bytes: 400, sha256: '36a368076018d5abf313d504856dca7b99d70a1b4fdf56d7d617c5deae7a53d7' },
  schoharieFatalityClaim: { bytes: 108, sha256: '74573686c5e9b2e3155fd76307db88e9ca05b145a6abf099af2e83a1c23cf91b' },
  schoharieCauseClaim: { bytes: 261, sha256: '30c3ffa4316561a75e588e78816f335bafdbbfe177c025f32045fe7c096e9577' },
  hatchieFatalityClaim: { bytes: 61, sha256: '41120bf9a09da2c94db3003711596c89c5f724ef8f1700c4388c4353db41b265' },
  hatchieCauseClaim: { bytes: 214, sha256: '6250ceec537428e0a384df1b8455c5c91d890471eddd0707259f729a6fa45e81' },
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));

async function fetchBuffer(url) {
  const { stdout } = await execFileAsync('curl', [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '120',
    '--header', `User-Agent: ${userAgent}`,
    url,
  ], { encoding: null, maxBuffer: 2_000_000, timeout: 130_000 });
  return stdout;
}

function verify(name, buffer, pinned) {
  assert.equal(buffer.length, pinned.bytes, `${name} byte count changed`);
  assert.equal(sha256(buffer), pinned.sha256, `${name} checksum changed`);
}

function extractClaim(name, text, pattern, pinned) {
  const value = text.match(pattern)?.[0];
  assert(value, `${name} is missing`);
  assert.equal(Buffer.byteLength(value), pinned.bytes, `${name} byte count changed`);
  assert.equal(sha256(value), pinned.sha256, `${name} checksum changed`);
  return { text: value, bytes: pinned.bytes, sha256: pinned.sha256 };
}

function pageText(buffer) {
  return buffer.toString('utf8')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replaceAll('&nbsp;', ' ')
    .replaceAll('&#160;', ' ')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&apos;', "'")
    .replaceAll('&quot;', '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const inventoryBuffer = await readFile(path.join(root, sources.inventory.localSnapshot));
const [classificationBuffer, schoharieBuffer, hatchieBuffer] = await Promise.all([
  fetchBuffer(sources.classification.url),
  fetchBuffer(sources.schoharie.url),
  fetchBuffer(sources.hatchie.url),
]);

verify('FHWA inventory snapshot', inventoryBuffer, expected.inventory);

const inventory = JSON.parse(inventoryBuffer.toString('utf8'));
const classificationText = pageText(classificationBuffer);
const schoharieText = pageText(schoharieBuffer);
const hatchieText = pageText(hatchieBuffer);
const verifiedClaims = {
  classification: extractClaim('FHWA classification claim', classificationText,
    /Codes 0 through 3 indicate that a bridge is scour critical \(i\.e\., bridge foundations[\s\S]*?closed to traffic\)\./i,
    expected.classificationClaim),
  schoharieFatalities: extractClaim('NTSB Schoharie fatality claim', schoharieText,
    /Four passenger cars and one tractor-semitrailer[\s\S]*?10 persons were fatally injured\./i,
    expected.schoharieFatalityClaim),
  schoharieCause: extractClaim('NTSB Schoharie cause claim', schoharieText,
    /We determined that the probable cause of the collapse of the Schoharie Creek Bridge[\s\S]*?spread footings\./i,
    expected.schoharieCauseClaim),
  hatchieFatalities: extractClaim('NTSB Hatchie fatality claim', hatchieText,
    /All eight vehicle occupants died as a result of the collapse\./i,
    expected.hatchieFatalityClaim),
  hatchieCause: extractClaim('NTSB Hatchie cause claim', hatchieText,
    /The probable cause of the collapse of the northbound U\.S\. Route 51 Bridge spans[\s\S]*?evaluate and correct\./i,
    expected.hatchieCauseClaim),
};
assert.equal(inventory.assessment.coverage.highway_bridge_count, 624_193);
assert.equal(inventory.assessment.scour_critical_burden.scour_critical_bridge_count, 19_775);
assert.equal(inventory.assessment.traffic_exposure.open_scour_critical_daily_vehicle_crossings, 76_075_755);

const snapshot = {
  version: 'tulip_bridge_scour_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_us_inventory_and_historical_terminal_cases_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace a generic bridge-risk estimate with a reproducible current engineering census while preventing bridge count, traffic crossings and historical collapse cases from becoming invented current harm.',
  sources: {
    inventory: {
      ...sources.inventory,
      fetchedSnapshot: { bytes: inventoryBuffer.length, sha256: expected.inventory.sha256, retrievedOn: checkedOn },
      aggregateInputSha256: inventory.assessment.coverage.aggregate_input_sha256,
    },
    classification: {
      ...sources.classification,
      retrievedOn: checkedOn,
      verifiedClaim: verifiedClaims.classification,
    },
    schoharie: {
      ...sources.schoharie,
      retrievedOn: checkedOn,
      verifiedClaims: [verifiedClaims.schoharieFatalities, verifiedClaims.schoharieCause],
    },
    hatchie: {
      ...sources.hatchie,
      retrievedOn: checkedOn,
      verifiedClaims: [verifiedClaims.hatchieFatalities, verifiedClaims.hatchieCause],
    },
  },
  endpoints: {
    currentEngineeringState: {
      inventoryYear: inventory.assessment.coverage.inventory_year,
      assessedHighwayBridges: inventory.assessment.coverage.highway_bridge_count,
      scourCriticalBridges: inventory.assessment.scour_critical_burden.scour_critical_bridge_count,
      scourCriticalSharePercent: inventory.assessment.scour_critical_burden.scour_critical_share_pct,
      unknownFoundationBridgesExcluded: inventory.assessment.scour_critical_burden.unknown_foundation_bridge_count,
      jurisdictionsWithScourCriticalBridges: inventory.assessment.geographic_extent.jurisdictions_with_scour_critical_bridges,
      interpretation: 'This is a nationally comprehensive U.S. engineering-vulnerability census. A scour-critical designation is not a failure probability, a service interruption, or a count of harmed people.',
    },
    currentExposureContext: {
      openScourCriticalBridges: inventory.assessment.traffic_exposure.open_scour_critical_bridge_count,
      closedScourCriticalBridges: inventory.assessment.traffic_exposure.closed_scour_critical_bridge_count,
      dailyVehicleCrossingsOnOpenScourCriticalBridges: inventory.assessment.traffic_exposure.open_scour_critical_daily_vehicle_crossings,
      interpretation: 'The traffic total counts bridge crossings, not unique people. Open status shows that vulnerability is not the same as a realized outage. The inventory does not establish that closure status was caused by scour.',
    },
    managementState: {
      bridgesRequiringUniquePlanOfAction: inventory.assessment.management_persistence.scour_critical_bridges_requiring_unique_plan_of_action,
      monitoringAloneRemovesScourCriticalStatus: inventory.assessment.management_persistence.monitoring_alone_removes_scour_critical_status,
      interpretation: 'The plan requirement establishes an ongoing engineering-management burden. It does not measure how long a human consequence lasts.',
    },
    historicalTerminalCases: [
      {
        sourceId: sources.schoharie.id,
        eventDate: sources.schoharie.eventDate,
        fatalities: 10,
        finding: 'NTSB attributed the collapse to failure to maintain riprap, leading to severe erosion beneath the bridge footings.',
      },
      {
        sourceId: sources.hatchie.id,
        eventDate: sources.hatchie.eventDate,
        fatalities: 8,
        finding: 'NTSB attributed the collapse to uncorrected migration of the river channel during prolonged flood conditions.',
      },
    ],
  },
  tulipUse: {
    admitted: [
      'Use the current 19,775-bridge census to establish U.S. engineering prevalence and evidence coverage.',
      'Use the 3.168091% bridge share as engineering-system prevalence context, not as the share of people harmed.',
      'Use the two NTSB cases only to show that collapse can produce fatal terminal consequences and to bound possible severity.',
      'Use the plan-of-action requirement as management-state evidence, not as duration of human harm.',
      'Confine the current rating to the human domain because the admitted sources measure no ecosystem-condition consequence from bridge scour exposure itself.',
    ],
    prohibited: [
      'Do not treat 76,075,755 daily vehicle crossings as unique people, exposed population or harmed-person reach.',
      'Do not treat 19,775 scour-critical bridges as failures, outages or imminent collapses.',
      'Do not sum 1987 and 1989 fatalities into current annual harm or infer a current failure rate from two selected cases.',
      'Do not infer that the 585 closed bridges were closed because of scour without a cause-specific record.',
      'Do not use years since the historical collapses, the inventory year or plan duration as consequence persistence.',
      'Do not extrapolate the U.S. inventory to global bridge prevalence.',
      'Do not import flood deaths, ecosystem inundation or connected-node scores into this node.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'bridge_scour_exposure',
      rating: 'B 3.3',
      uncertainty: 'A 1.0 to C 5.5',
      confidence: 'C',
      domain: 'human only',
      reason: 'A current national census directly measures engineering vulnerability, but no compatible current failure probability, attributable service-loss count, harmed-person denominator or recovery distribution exists. Historical fatal cases bound possible consequence severity without becoming current burden.',
    },
  },
  unresolvedForTulip: [
    'Obtain a current cause-coded bridge-failure and closure series linked to the same bridge inventory.',
    'Estimate unique users experiencing attributable service interruption, including detour duration and essential-service effects.',
    'Measure bridge-specific annual failure probabilities rather than assigning one rate to every scour-critical code.',
    'Add comparable inventories outside the United States before describing global prevalence.',
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
  scourCriticalBridges: snapshot.endpoints.currentEngineeringState.scourCriticalBridges,
  historicalFatalCases: snapshot.endpoints.historicalTerminalCases.length,
  digest: snapshot.snapshotDigest,
}, null, 2));
