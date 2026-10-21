import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22', 'ice-sheet-mass-loss-reference-snapshot.json');
const checkedOn = '2026-09-24';
const hash = value => createHash('sha256').update(value).digest('hex');
const digest = value => hash(JSON.stringify(value));

const files = {
  greenlandMassBalance: {
    url: 'https://ramadda.data.bas.ac.uk/repository/entry/get/imbie3_greenland_Gt_partitioned.csv?entryid=synth%3A128c5e33-5224-4197-82f0-19dcc95b80a0%3AL2ltYmllM19ncmVlbmxhbmRfR3RfcGFydGl0aW9uZWQuY3N2',
    bytes: 101_046,
    sha256: '1d4df7c73845ab9194fd07999ce7a7716d01ef5c9fbc2d4a464be5afc6b52a26',
  },
  antarcticaMassBalance: {
    url: 'https://ramadda.data.bas.ac.uk/repository/entry/get/imbie3_antarctica_Gt_partitioned.csv?entryid=synth%3A128c5e33-5224-4197-82f0-19dcc95b80a0%3AL2ltYmllM19hbnRhcmN0aWNhX0d0X3BhcnRpdGlvbmVkLmNzdg%3D%3D',
    bytes: 83_257,
    sha256: 'cdb5f37c703af3fb36ccbf89f6ca0ba8b444817cb48ff34cc77ca7a9d9a525b2',
  },
  zooplanktonWorkbook: {
    url: 'https://ndownloader.figshare.com/files/40861166',
    bytes: 126_359,
    sha256: '2598952131f9fa116b450d49ea182d8001e37249e911a6603e87cb9a40221f1b',
    md5: '68c9d680b9e28ce743f458558c4bf7c1',
  },
  biogeochemicalWorkbook: {
    url: 'https://ndownloader.figshare.com/files/40861604',
    bytes: 14_316,
    sha256: 'c6acecb724a47ee20c5a828dc0a5cf811e7eb0205898e7e50b6d9c4a8926779d',
    md5: '5c3db9b18c83cce606d746db3433cc26',
  },
  greenlandProjectionPdf: {
    url: 'https://tc.copernicus.org/articles/19/1205/2025/tc-19-1205-2025.pdf',
    bytes: 5_157_604,
    sha256: '9cb3d1e2f7c98657149eba87669407926ff210bd259b5e2fc3959151e919d410',
  },
};

async function fetchPinned(source, label) {
  const response = await fetch(source.url, {
    signal: AbortSignal.timeout(120_000),
    headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+ice-sheet-mass-loss-evidence-ingestion)' },
  });
  assert(response.ok, `${label}: HTTP ${response.status}`);
  const body = Buffer.from(await response.arrayBuffer());
  assert.equal(body.length, source.bytes, `${label}: byte size changed`);
  assert.equal(hash(body), source.sha256, `${label}: checksum changed`);
  return body;
}

function parseImbieCsv(body, expectedType) {
  const lines = body.toString('utf8').trim().split(/\r?\n/);
  assert(lines.some(line => line === `# data_type: ${expectedType}`), `${expectedType}: data type changed`);
  const headerIndex = lines.findIndex(line => line.startsWith('Date,Mass balance (Gt/yr),'));
  assert(headerIndex > 0, `${expectedType}: missing expected CSV header`);
  const rows = lines.slice(headerIndex + 1).map(line => {
    const [date, rate, rateUncertainty, cumulative, cumulativeUncertainty] = line.split(',');
    return {
      date,
      massBalanceGtPerYear: Number(rate),
      massBalanceUncertaintyGtPerYear: Number(rateUncertainty),
      cumulativeMassBalanceAnomalyGt: Number(cumulative),
      cumulativeMassBalanceAnomalyUncertaintyGt: Number(cumulativeUncertainty),
    };
  });
  assert(rows.length > 500, `${expectedType}: unexpectedly short monthly series`);
  assert(rows.every(row => Number.isFinite(row.massBalanceGtPerYear)), `${expectedType}: invalid mass-balance value`);
  return rows;
}

const [greenlandCsv, antarcticaCsv, zooplanktonWorkbook, biogeochemicalWorkbook, greenlandProjectionPdf] = await Promise.all([
  fetchPinned(files.greenlandMassBalance, 'IMBIE Greenland CSV'),
  fetchPinned(files.antarcticaMassBalance, 'IMBIE Antarctica CSV'),
  fetchPinned(files.zooplanktonWorkbook, 'Greenland fjord zooplankton workbook'),
  fetchPinned(files.biogeochemicalWorkbook, 'Greenland fjord biogeochemistry workbook'),
  fetchPinned(files.greenlandProjectionPdf, 'Greenland SSP projection PDF'),
]);
assert.equal(greenlandProjectionPdf.subarray(0, 5).toString(), '%PDF-');
assert.equal(hash(zooplanktonWorkbook).slice(0, 8), files.zooplanktonWorkbook.sha256.slice(0, 8));
assert.equal(hash(biogeochemicalWorkbook).slice(0, 8), files.biogeochemicalWorkbook.sha256.slice(0, 8));

const greenlandRows = parseImbieCsv(greenlandCsv, 'Greenland Gt');
const antarcticaRows = parseImbieCsv(antarcticaCsv, 'Antarctica Gt');
assert.equal(greenlandRows[0].date, '1971-07-01');
assert.equal(greenlandRows.at(-1).date, '2023-12-01');
assert.equal(antarcticaRows[0].date, '1979-01-01');
assert.equal(antarcticaRows.at(-1).date, '2023-12-01');

const periodMean = (rows, start, end) => {
  const period = rows.filter(row => row.date >= start && row.date <= end);
  assert(period.length > 0, `No rows in ${start} to ${end}`);
  return period.reduce((sum, row) => sum + row.massBalanceGtPerYear, 0) / period.length;
};
const greenland2020To2023DerivedMean = periodMean(greenlandRows, '2020-01-01', '2023-12-01');
const antarctica2020To2023DerivedMean = periodMean(antarcticaRows, '2020-01-01', '2023-12-01');
assert(Math.abs(greenland2020To2023DerivedMean + 198.0011) < 0.001);
assert(Math.abs(antarctica2020To2023DerivedMean + 58.8295) < 0.001);

const snapshot = {
  version: 'tulip_ice_sheet_mass_loss_reference_2026_09_24_v1',
  generatedOn: checkedOn,
  status: 'current_physical_state_local_ecosystem_effects_and_outlook_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Assess current harm attributable to Greenland and Antarctic ice-sheet mass loss while keeping the physical mass signal, sea-level pathway, local fjord effects, downstream coastal outcomes and future projections separate.',
  sources: {
    imbie2026: {
      id: 'imbie_mass_balance_1970s_to_2023_2026',
      publisher: 'IMBIE Team; NERC EDS UK Polar Data Centre; Scientific Data',
      title: 'Mass balance of the Greenland and Antarctic ice sheets from the 1970s to 2023',
      publicationDate: '2026-09-16',
      articleDoi: 'https://doi.org/10.1038/s41597-026-08088-0',
      datasetDoi: 'https://doi.org/10.5285/128c5e33-5224-4197-82f0-19dcc95b80a0',
      files: {
        greenlandMassBalance: files.greenlandMassBalance,
        antarcticaMassBalance: files.antarcticaMassBalance,
      },
      checkedOn,
    },
    fjordEcosystems2023: {
      id: 'meire_greenland_fjord_ecosystem_retreat_2023',
      publisher: 'Nature Geoscience; Figshare',
      title: 'Glacier retreat alters downstream fjord ecosystem structure and function in Greenland',
      publicationDate: '2023-06-29',
      doi: 'https://doi.org/10.1038/s41561-023-01218-y',
      dataDoi: 'https://doi.org/10.6084/m9.figshare.23153741.v1',
      files: {
        zooplanktonWorkbook: files.zooplanktonWorkbook,
        biogeochemicalWorkbook: files.biogeochemicalWorkbook,
      },
      checkedOn,
    },
    greenlandProjection2025: {
      id: 'rahlves_greenland_ssp245_projection_2025',
      publisher: 'The Cryosphere',
      title: 'Historically consistent mass loss projections of the Greenland ice sheet',
      publicationDate: '2025-03-14',
      doi: 'https://doi.org/10.5194/tc-19-1205-2025',
      file: files.greenlandProjectionPdf,
      checkedOn,
    },
  },
  currentWindow: {
    start: 2020,
    end: 2023,
    coverageStatus: 'partial',
    summaryMethod: 'annualized_flow',
    coverageNote: 'The newest peer-reviewed reconciled assessment supplies monthly physical mass balance through December 2023 for both ice sheets. It does not supply a matched global count of people harmed, a global ecosystem-condition denominator or a recovery-time distribution.',
  },
  endpoints: {
    physicalState: {
      assessmentCoverage: {
        greenland: '1971-07-01 through 2023-12-01',
        antarctica: '1979-01-01 through 2023-12-01',
        independentSatelliteEstimatesInArticle: 42,
        satelliteMissions: 27,
      },
      combinedIceLoss1979To2023Gt: { central: 11_309, uncertaintyPlusMinus: 565 },
      combinedGlobalMeanSeaLevelContribution1979To2023Mm: { central: 31.4, uncertaintyPlusMinus: 1.6 },
      combinedLossAttributionPercent: { glacierDynamicalImbalance: 84, reducedSurfaceMassBalance: 16 },
      antarcticaIceLoss1979To2023Gt: { central: 4_780, uncertaintyPlusMinus: 513 },
      antarcticaGlobalMeanSeaLevelContribution1979To2023Mm: { central: 13.3, uncertaintyPlusMinus: 1.4 },
      greenlandIceLoss1972To2023Gt: { central: 6_215, uncertaintyPlusMinus: 467 },
      greenlandAverageLoss1972To2023GtPerYear: { central: 119, uncertaintyPlusMinus: 9 },
      greenlandLoss2020To2023GtPerYear: { central: 199, uncertaintyPlusMinus: 29 },
      checksumReproduction: {
        greenlandMonthlyRows: greenlandRows.length,
        antarcticaMonthlyRows: antarcticaRows.length,
        greenlandDerivedMeanMassBalance2020To2023GtPerYear: Number(greenland2020To2023DerivedMean.toFixed(4)),
        antarcticaDerivedMeanMassBalance2020To2023GtPerYear: Number(antarctica2020To2023DerivedMean.toFixed(4)),
        greenlandLastRow: greenlandRows.at(-1),
        antarcticaLastRow: antarcticaRows.at(-1),
      },
      interpretation: 'This is a strong physical-state record. Gigatonnes, satellite coverage and millimetres of global mean sea-level contribution are not themselves counts of people harmed or percentages of ecosystem condition lost.',
    },
    localEcosystemConsequences: {
      geography: 'Nuup Kangerlua and Ameralik fjords, southwest Greenland',
      samplingYear: 2016,
      design: 'Monthly observations at one station in each of two neighbouring fjords, comparing marine-terminating and land-terminating glacier settings.',
      annualPrimaryProductionGramsCarbonPerSquareMetre: { marineTerminatingFjord: 90, landTerminatingFjord: 30 },
      aprilToSeptemberCarbonDioxideUptakeGramsCarbonPerSquareMetre: { marineTerminatingFjord: 42, landTerminatingFjord: 24 },
      observedCommunityChange: 'The land-terminating setting had lower productivity and a shift from diatoms and larger zooplankton toward bacteria, smaller phytoplankton and smaller grazers.',
      interpretation: 'The paired-fjord study supports a potentially substantial local ecological consequence of glacier retreat. It is a one-year, two-fjord space-for-time comparison and does not establish a global affected-area share or isolate all current ice-sheet mass loss as the cause.',
    },
    outlookContext: {
      scenario: 'SSP2-4.5',
      modelHorizon: 2100,
      projectedGreenlandGlobalMeanSeaLevelContributionMm: { lower: 44, upper: 119 },
      interpretation: 'The model supports a worsening direction under SSP2-4.5. Its 2100 range is not a 2027-2036 terminal-harm estimate and does not enter the current rating.',
    },
    compatibleCurrentHarmedPersonCount: null,
    compatibleGlobalEcosystemConditionLossPercent: null,
    compatibleGlobalAffectedEcosystemDistributionPercent: null,
    compatibleCurrentRecoveryTimeDistribution: null,
  },
  tulipUse: {
    admitted: [
      'Use the reconciled monthly records and reported totals to establish the current physical mass-loss state, its uncertainty and long-lived sea-level pathway.',
      'Use the paired Greenland fjord observations to bound local ecosystem severity and to preserve the study-design limitation.',
      'Use the SSP2-4.5 model ensemble for outlook direction only because the reported range ends in 2100 rather than the fixed 2027-2036 TULIP horizon.',
      'Use the missing person, ecosystem-distribution and recovery denominators to keep reach and terminal consequence bounds explicit.',
    ],
    prohibited: [
      'Do not convert ice lost in gigatonnes, satellite coverage or millimetres of global mean sea-level rise into human or ecosystem reach.',
      'Do not add Sea Level Rise, Coastal Inundation Risk, Coastal Erosion, Saltwater Intrusion, AMOC or other connected-node scores.',
      'Do not treat the two fjords as a representative sample of all Greenland, Antarctic or global polar ecosystems.',
      'Do not interpret the one-third productivity comparison as a global ecosystem-collapse percentage.',
      'Do not use the 1970s-to-2023 observation span as the persistence or recovery time of human or ecosystem harm.',
      'Do not use the 2100 SSP2-4.5 projection as the current state or as a numerical 2027-2036 consequence.',
      'Do not assign all observed mass loss to anthropogenic forcing without a matched attribution analysis.',
    ],
    currentCatalogueRecommendation: {
      nodeId: 'ice_sheet_mass_loss',
      rating: 'C 5.1',
      uncertainty: 'B 3.3 to D 7.4',
      confidence: 'C',
      domains: ['human', 'ecosystem'],
      axes: {
        human: {
          lower: { severity: 0, reach: 0, persistence: 2 },
          central: { severity: 1, reach: 1, persistence: 3 },
          upper: { severity: 2, reach: 2, persistence: 4 },
        },
        ecosystem: {
          lower: { severity: 1, reach: 1, persistence: 2 },
          central: { severity: 2, reach: 1, persistence: 3 },
          upper: { severity: 3, reach: 2, persistence: 4 },
        },
      },
      reason: 'The physical state and long-lived pathway are strongly measured, and a paired-fjord study supports material local ecological change. The former D rating nevertheless used global measurement coverage as global harm reach. Current sources do not count attributable human harm or measure the global share of ecosystems damaged, so the central rating falls to C while retaining a wide B-D range.',
    },
  },
  unresolvedForTulip: [
    'Estimate current human consequences attributable specifically to the observed ice-sheet contribution to sea level without adding the Sea Level Rise or coastal-hazard node scores.',
    'Measure the affected share and condition change of fjord, shelf and other polar ecosystems using a common denominator across Greenland and Antarctica.',
    'Separate the anthropogenic share of recent mass loss from internal variability and natural forcing in a source-compatible counterfactual.',
    'Estimate consequence and recovery duration for people and ecosystems rather than using the satellite record length or ice-sheet response time.',
    'Produce a source-reported 2027-2036 SSP2-4.5 ice-loss and matched terminal-consequence outlook with comparable lower and higher pathways.',
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
