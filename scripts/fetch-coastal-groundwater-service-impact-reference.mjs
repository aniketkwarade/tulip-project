import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'coastal-groundwater-service-impact-reference-snapshot.json');

const projectUrl = 'https://www.capemaycity.com/media/City%20Manager/Project%20Narrative%20-%20Cape%20May%20Water%20Treatment%20Plant.pdf';
const utilityUrl = 'https://www.capemaycity.com/departments/watersewer';
const fetchBuffer = async url => {
  const response = await fetch(url, {
    headers: {
      accept: '*/*',
      'user-agent': 'TULIP-calibration/1.0 (mailto:research@tulip.earth)',
    },
  });
  assert(response.ok, `Request failed (${response.status}) for ${url}`);
  return Buffer.from(await response.arrayBuffer());
};
const sha256 = value => createHash('sha256').update(value).digest('hex');
const normalizedHtmlText = value => value.toString('utf8')
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#160;/gi, ' ')
  .replace(/&amp;/gi, '&')
  .replace(/\s+/g, ' ')
  .trim();

const [projectPdf, utilityPage, historicBytes] = await Promise.all([
  fetchBuffer(projectUrl),
  fetchBuffer(utilityUrl),
  readFile(path.join(root, 'public', 'cape-may-coastal-groundwater-impact-snapshot.json')),
]);
const utilityText = normalizedHtmlText(utilityPage);
const historic = JSON.parse(historicBytes.toString('utf8'));

assert(projectPdf.length > 500_000, 'Cape May project narrative PDF is unexpectedly small.');
assert.match(utilityText, /currently primarily supplied by the 2 MGD Desalination Facility/i);
assert.match(utilityText, /reverse osmosis technology to treat the brackish water to potable standards/i);
assert.match(utilityText, /over 4,300 water accounts/i);
assert.equal(historic.metric_contract.node_id, 'coastal_groundwater_withdrawal');
assert.equal(historic.accumulated_impact.total_supply_wells_closed_conservative_lower_bound, 120);

const candidate = {
  previous: { value: 4.8, grade: 'C', lower: 2.5, upper: 7.0, confidence: 'C' },
  revised: { value: 6.3, grade: 'C', lower: 4.8, upper: 7.4, confidence: 'C' },
  axes: {
    human: {
      severity: { lower: 2, central: 2, upper: 2 },
      reach: { lower: 1, central: 2, upper: 2 },
      persistence: { lower: 4, central: 4, upper: 4 },
    },
    ecosystem: {
      severity: { lower: 1, central: 2, upper: 3 },
      reach: { lower: 1, central: 2, upper: 3 },
      persistence: { lower: 1, central: 2, upper: 3 },
    },
  },
  reason: 'The 2025 city record converts a threatened-water-supply pathway into a current managed-service consequence. Brackish source water above drinking-water limits is being treated by reverse osmosis for a service population that rises from about 5,000 permanent residents to about 50,000 people in summer. A 27-year operating history and a new $12.6 million desalination-equipment phase directly support material severity and long persistence. The case does not establish global human reach or an ecosystem-condition endpoint, so confidence remains C and nature bounds stay wide.',
};

const payload = {
  version: 'tulip_coastal_groundwater_service_impact_2026_09_24_v1',
  retrievedOn: '2026-09-24',
  status: 'current_managed_water_service_consequence_ingested_global_and_ecosystem_denominators_missing',
  productionRatingsEnabled: 0,
  nodeId: 'coastal_groundwater_withdrawal',
  sources: {
    projectNarrative: {
      id: 'cape_may_water_treatment_project_narrative_2025',
      publisher: 'City of Cape May, New Jersey',
      title: 'Water Treatment Plant Project Narrative',
      publicationDate: '2025-04-25',
      url: projectUrl,
      pdfBytes: projectPdf.length,
      pdfSha256: sha256(projectPdf),
      verifiedClaims: [
        { pages: '3–4', finding: 'The system supplies about 5,000 permanent residents plus neighboring communities and a Coast Guard facility; the city population rises to about 50,000 in summer.' },
        { pages: '3, 5–7', finding: 'The 1998 reverse-osmosis facility remains in service and treats brackish water from three primary wells.' },
        { pages: '5–6', finding: 'Source-well sodium and chloride exceed New Jersey limits; the three primary wells report chloride from 380 to 750 mg/L.' },
        { pages: '8–9', finding: 'The new desalination building and equipment phases total $26 million, including $12.6 million specifically for desalination equipment.' },
      ],
    },
    utilityPage: {
      id: 'cape_may_water_and_sewer_current_service_2026',
      publisher: 'City of Cape May, New Jersey',
      title: 'Water & Sewer',
      publicationDate: null,
      url: utilityUrl,
      retrievedOn: '2026-09-24',
      htmlBytes: utilityPage.length,
      htmlSha256: sha256(utilityPage),
      finding: 'The city says the 2 MGD desalination facility is its primary supply, treats brackish water to potable standards and serves more than 4,300 water accounts.',
    },
    historicWellClosures: {
      sourceIds: historic.sources.map(source => source.id),
      localSnapshot: 'public/cape-may-coastal-groundwater-impact-snapshot.json',
      localSnapshotSha256: sha256(historicBytes),
      finding: 'USGS records at least 20 public and industrial well closures and more than 100 domestic well closures from withdrawal-linked saltwater intrusion. Those historical closures establish realized service loss but are not converted to people.',
    },
  },
  currentWindow: {
    start: 2018,
    end: 2025,
    coverageStatus: 'partial',
    summaryMethod: 'end_state_stock',
    coverageNote: 'The project narrative reports six annual demand years through 2023 and the operating and capital state in April 2025. It is not an annual global consequence series.',
  },
  evidence: {
    managedWaterService: {
      permanentResidentsApproximate: 5_000,
      summerPopulationApproximate: 50_000,
      waterAccountsMoreThan: 4_300,
      averageAnnualProductionMillionGallons: 350,
      averagePeakSummerProductionMgd: 2.20,
      maximumDayDemandMgd: 2.80,
      reverseOsmosisFacilityStartYear: 1998,
      reverseOsmosisFacilityAgeIn2025Years: 27,
      currentPrimaryBrackishWells: 3,
      reportedChlorideMgPerL: { well6: 490, well7: 380, well8: 750 },
      stateChlorideLimitMgPerL: 250,
      existingRoRatedCapacityMgd: 2.0,
      interpretation: 'Safe service is maintained through a specialized treatment system. This is a realized managed-service and material-cost consequence, not a count of untreated illness or uninterrupted deprivation.',
    },
    currentMaterialCommitment: {
      desalinationBuildingPhaseUsd: 13_400_000,
      desalinationEquipmentPhaseUsd: 12_600_000,
      desalinationBuildingAndEquipmentTotalUsd: 26_000_000,
      admittedMinimumDirectSalinityTreatmentCostUsd: 12_600_000,
      interpretation: 'Only the separately identified desalination-equipment phase is used as the minimum direct material-cost anchor. The shared building, iron removal, generator and site phases are not added to severity.',
    },
    historicalServiceLoss: {
      supplyWellsClosedConservativeLowerBound: historic.accumulated_impact.total_supply_wells_closed_conservative_lower_bound,
      publicAndIndustrialSupplyWellsClosedAtLeast: historic.accumulated_impact.public_and_industrial_supply_wells_closed_at_least,
      domesticSupplyWellsClosedMoreThan: historic.accumulated_impact.domestic_supply_wells_closed_more_than,
      interpretation: 'Well closures confirm realized loss of supply sources. A well is infrastructure, not a person; these counts do not set human reach.',
    },
  },
  ratingDecision: {
    change: 'revised_and_narrowed',
    candidate,
    admittedUses: [
      'Use current reverse-osmosis dependence and the direct desalination-equipment cost for material human severity.',
      'Use the reported permanent and summer service populations to bound the directly documented managed-service reach in this case only.',
      'Use continuous operation from 1998 through the 2025 project record for persistence of the managed-service consequence.',
      'Use historical well abandonment as evidence that service-source loss was realized, without converting wells into people.',
    ],
    excludedUses: [
      'Do not generalize the Cape May service population or project cost to global coastal aquifers.',
      'Do not count all 4,300 accounts as 4,300 people or add accounts to the service population.',
      'Do not treat people receiving safely treated water as having illness or loss of basic survival needs.',
      'Do not add the shared treatment-plant building, iron-removal, site or generator costs to the salinity-specific material anchor.',
      'Do not count reverse-osmosis concentrate or energy use as ecosystem harm from groundwater withdrawal.',
      'Do not add the separate Desalination Dependence, drinking-water, drought, sea-level or wetland ratings.',
    ],
    exactRemainingGaps: [
      'Comparable current managed-service and harmed-person estimates across coastal aquifer systems outside Cape May.',
      'A unique global affected-person denominator that separates treatment dependence, service interruption, unsafe supply, livelihood loss and displacement.',
      'Current ecosystem-condition loss, affected-distribution share and recovery time attributable to coastal groundwater withdrawal.',
      'A multi-case attribution model that separates pumping from sea-level rise, drought, geology and other salinity drivers.',
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
console.log(JSON.stringify({ output, digest: payload.digest, candidate: payload.ratingDecision.candidate.revised }, null, 2));
