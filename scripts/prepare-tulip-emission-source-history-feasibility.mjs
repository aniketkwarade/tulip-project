import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unzipSync, strFromU8 } from 'fflate';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const outputJson = path.join(outDir, 'internal-emission-source-history-feasibility.json');
const outputReport = path.join(outDir, 'internal-emission-source-history-feasibility-report.md');
const json = async filename => JSON.parse(await readFile(path.join(root, filename), 'utf8'));
const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
const round = (value, digits = 6) => Number(value.toFixed(digits));

const [allocation, assessments, edgar, climateTrace] = await Promise.all([
  json('artifacts/tulip-calibration-2026-09-22/internal-emission-source-allocation.json'),
  json('public/tulip-assessments.json'),
  json('public/edgar-snapshot.json'),
  json('public/climate-trace-land-emissions-snapshot.json'),
]);

const targetIds = [
  'construction_material_co2',
  'diesel_freight_co2',
  'fossil_hydrogen_co2',
  'fossil_power_backup_co2',
  'land_use_fire_co2',
  'passenger_road_fuel_co2',
];
const allocationById = new Map(allocation.rows.map(row => [row.nodeId, row]));
for (const nodeId of targetIds) {
  assert(allocationById.has(nodeId), `${nodeId}: allocation row missing`);
  assert(assessments.records[nodeId], `${nodeId}: assessment record missing`);
}

const ceds = {
  recordUrl: 'https://zenodo.org/records/10904361',
  archiveUrl: 'https://zenodo.org/records/10904361/files/CEDS_v_2024_04_01_aggregate.zip?download=1',
  archiveSha256: '913237080a65c9166a0270b9765bb1489701c125aebe0f512f0da2634098d04e',
  member: 'CEDS_v_2024_04_01_aggregate/CO2_CEDS_global_emissions_by_sector_fuel_v2024_04_01.csv',
  memberSha256: '5568aba2a7a83d5d8a2a658cc0e2e9956470cd70caf3c3bb640493afcb9e1fac',
};

function parseCsv(text) {
  const lines = text.trim().split(/\r?\n/);
  const cells = line => line.split(',').map(value => value.replace(/^"|"$/g, ''));
  const header = cells(lines[0]);
  return lines.slice(1).map(line => Object.fromEntries(cells(line).map((value, index) => [header[index], value])));
}

const response = await fetch(ceds.archiveUrl, {
  signal: AbortSignal.timeout(180_000),
  headers: { 'User-Agent': 'LostPlanet-TULIP/1.0 (+emission-source-boundary-audit)' },
});
assert(response.ok, `CEDS archive: HTTP ${response.status}`);
const archive = Buffer.from(await response.arrayBuffer());
assert.equal(sha256(archive), ceds.archiveSha256, 'CEDS archive checksum changed');
const entries = unzipSync(new Uint8Array(archive));
assert(entries[ceds.member], `CEDS member missing: ${ceds.member}`);
const memberBuffer = Buffer.from(entries[ceds.member]);
assert.equal(sha256(memberBuffer), ceds.memberSha256, 'CEDS member checksum changed');
const cedsRows = parseCsv(strFromU8(entries[ceds.member]));
assert.equal(cedsRows.length, 250);
const cedsYears = Array.from({ length: 2022 - 1750 + 1 }, (_unused, index) => 1750 + index);
const aggregate = rows => cedsYears.map(year => ({
  year,
  valueKtCO2: rows.reduce((sum, row) => sum + Number(row[`X${year}`]), 0),
}));
const summarizeCedsRows = rows => ({
  sectors: [...new Set(rows.map(row => row.sector))].sort(),
  fuels: [...new Set(rows.map(row => row.fuel))].sort(),
  selectedRows: rows.length,
  years: { start: cedsYears[0], end: cedsYears.at(-1), count: cedsYears.length },
  latestKtCO2: round(aggregate(rows).at(-1).valueKtCO2),
});

const roadRows = cedsRows.filter(row => /^1A3b(?:_|$)/.test(row.sector));
const constructionActivityRows = cedsRows.filter(row => /construction/i.test(row.sector));
const oilElectricityRows = cedsRows.filter(row => /^1A1a_(?:Electricity-autoproducer|Electricity-public)$/.test(row.sector)
  && ['diesel_oil', 'heavy_oil', 'light_oil'].includes(row.fuel));
assert(roadRows.length > 0, 'CEDS road rows missing');
assert(constructionActivityRows.length > 0, 'CEDS construction-activity rows missing');
assert(oilElectricityRows.length > 0, 'CEDS oil-electricity rows missing');

const edgarRoadRows2024 = edgar.records.filter(row => row.observation_year === 2024
  && row.category_code === '1.A.3.b_noRES' && row.substance === 'CO2' && row.fossil_bio === 'fossil');
const edgarIndustryRows2024 = edgar.records.filter(row => row.observation_year === 2024
  && row.category_code === '1.A.2' && row.substance === 'CO2' && row.fossil_bio === 'fossil');
assert(edgarRoadRows2024.length > 0, 'EDGAR 2024 road category missing');
assert(edgarIndustryRows2024.length > 0, 'EDGAR 2024 manufacturing/construction category missing');
const sumEdgarGg = rows => round(rows.reduce((sum, row) => sum + row.emission_gg_substance, 0));

const landFireRecords = climateTrace.records
  .filter(row => row.node_id === 'land_use_fire_co2')
  .sort((left, right) => left.observation_month.localeCompare(right.observation_month));
assert.equal(landFireRecords.length, 120);
const landFireByYear = new Map();
for (const record of landFireRecords) {
  const year = Number(record.observation_month.slice(0, 4));
  if (!landFireByYear.has(year)) landFireByYear.set(year, []);
  landFireByYear.get(year).push(record);
}
const landFireAnnual = [...landFireByYear.entries()].map(([year, records]) => ({
  year,
  months: records.length,
  annualMtCO2: round(records.reduce((sum, record) => sum + record.value, 0) / 1e6, 3),
  distinctMonthlyValues: new Set(records.map(record => record.value)).size,
}));
assert(landFireAnnual.every(row => row.months === 12));

const sharedSourceFacts = {
  cedsRoad: summarizeCedsRows(roadRows),
  cedsConstructionActivity: summarizeCedsRows(constructionActivityRows),
  cedsOilElectricity: summarizeCedsRows(oilElectricityRows),
  edgarRoad2024: {
    category: '1.A.3.b_noRES',
    countriesOrTerritories: edgarRoadRows2024.length,
    globalMtCO2: round(sumEdgarGg(edgarRoadRows2024) / 1000, 3),
  },
  edgarManufacturingAndConstruction2024: {
    category: '1.A.2',
    countriesOrTerritories: edgarIndustryRows2024.length,
    globalMtCO2: round(sumEdgarGg(edgarIndustryRows2024) / 1000, 3),
  },
  climateTraceLandFire: {
    snapshotVersion: climateTrace.version,
    period: { start: landFireAnnual[0].year, end: landFireAnnual.at(-1).year },
    annualRecords: landFireAnnual,
    yearsWithFlatMonthlyValues: landFireAnnual.filter(row => row.distinctMonthlyValues === 1).map(row => row.year),
  },
};

const evidenceBoundary = nodeId => assessments.records[nodeId].evidenceAudit.observations
  .find(observation => observation.role === 'evidence_boundary')?.value ?? null;
const latestMeasurement = nodeId => allocationById.get(nodeId).measurement;

const rows = [
  {
    nodeId: 'passenger_road_fuel_co2',
    status: 'aggregate_history_available_node_split_not_identified',
    candidateEvidence: ['CEDS 1A3b road CO2 by fuel, 1750–2022', 'EDGAR 1.A.3.b_noRES fossil CO2, 1970–2024', 'IEA 2024 passenger-car and van share'],
    finding: 'CEDS and EDGAR identify total road emissions. Neither identifies passenger vehicles separately through time. Gasoline-only CEDS rows would omit diesel passenger vehicles; all-oil road rows would include freight. The IEA 2024 share is a current lower bound, not a historical vehicle-by-fuel allocation.',
    admittedUse: 'Use the road histories as aggregate context and as a reconciliation check for any future passenger-specific series.',
    prohibitedUse: 'Do not label gasoline rows as all passenger road emissions or apply the 2024 passenger share to every historical year.',
    nextRequiredData: 'A global annual passenger-car and van CO2 series by propulsion or fuel, with heavy and light commercial vehicles separated and the boundary reconciled to the total-road inventory.',
  },
  {
    nodeId: 'diesel_freight_co2',
    status: 'aggregate_history_available_node_split_not_identified',
    candidateEvidence: ['CEDS 1A3b road CO2 by fuel, 1750–2022', 'EDGAR 1.A.3.b_noRES fossil CO2, 1970–2024', 'IEA 2024 truck share'],
    finding: 'CEDS isolates diesel used by the road sector but not freight vehicles. That diesel total also contains passenger and light-commercial use. EDGAR identifies road transport but not freight or fuel. The IEA truck estimate does not supply a diesel-only annual history.',
    admittedUse: 'Use total-road and road-diesel histories as upper-bound and reconciliation context for a future freight-specific series.',
    prohibitedUse: 'Do not equate all road diesel with freight or hold the 2024 truck share constant through history.',
    nextRequiredData: 'A global annual freight-truck CO2 series split by diesel and other propulsion, or vehicle activity and fuel-intensity inputs that reproduce a compatible total-road inventory.',
  },
  {
    nodeId: 'construction_material_co2',
    status: 'candidate_records_measure_wrong_or_overlapping_boundary',
    candidateEvidence: ['CEDS 1A2k construction-activity combustion, 1750–2022', 'EDGAR 1.A.2 manufacturing industries and construction CO2', 'IEA 2024 heavy-industry total'],
    finding: 'CEDS construction rows measure fuel burned by construction activity, not emissions embodied in cement, steel, chemicals and other materials. EDGAR 1.A.2 and the IEA heavy-industry total are broader aggregates that overlap existing cement, steel, chemical and industrial-heat nodes.',
    admittedUse: 'Use these records to define alternative system boundaries and to test overlap against component nodes.',
    prohibitedUse: 'Do not add cement, steel, chemical and heat histories into a second construction-material source score or substitute on-site construction fuel for embodied materials.',
    nextRequiredData: 'Choose one non-overlapping boundary: either treat this as an aggregate display of component nodes, or ingest a lifecycle material-production series with explicit exclusions for every separately scored component.',
  },
  {
    nodeId: 'fossil_hydrogen_co2',
    status: 'latest_mixed_co2e_only_gas_history_missing',
    candidateEvidence: ['IEA 2024 global hydrogen production and approximate lifecycle CO2e'],
    finding: 'The current record is a single approximate lifecycle CO2e total. It does not separate production-route CO2 from upstream methane and other gases, and CEDS or EDGAR sector categories do not isolate hydrogen production.',
    admittedUse: 'Use the IEA value as present-day scale and technology-boundary context.',
    prohibitedUse: 'Do not run a CO2 TCRE calculation on lifecycle CO2e or infer a historical series from stable recent production intensity.',
    nextRequiredData: 'Annual hydrogen production by route, route-specific direct CO2, captured CO2, upstream methane and system boundaries, reconciled to one global inventory.',
  },
  {
    nodeId: 'fossil_power_backup_co2',
    status: 'operation_mode_not_identified_in_global_inventory',
    candidateEvidence: ['CEDS oil electricity from public and autoproducer plants, 1750–2022', 'EDGAR main-activity electricity and heat production'],
    finding: 'Global power inventories classify fuel and sector, not whether a generator ran in standby or backup mode. CEDS autoproducer electricity includes routine self-generation, while public generation is not backup-specific. Installed backup capacity also does not establish runtime or emissions.',
    admittedUse: 'Use oil-electricity histories as a broad upper boundary and retain facility-specific backup studies as operating context.',
    prohibitedUse: 'Do not relabel autoproducer or oil-power emissions as backup-power emissions and do not convert installed capacity into annual CO2 without measured runtime and fuel use.',
    nextRequiredData: 'A global annual inventory of backup-generator fuel consumption or generated electricity, with operating mode, fuel, emission factor and overlap with public and autoproducer electricity documented.',
  },
  {
    nodeId: 'land_use_fire_co2',
    status: 'gross_history_available_net_anthropogenic_climate_input_missing',
    candidateEvidence: ['Climate TRACE forest-land, shrubgrass, wetland and cropland fire CO2, 2015–2024'],
    finding: `The repository contains ${landFireRecords.length} complete source records and ten annual sums for gross fire CO2. ${sharedSourceFacts.climateTraceLandFire.yearsWithFlatMonthlyValues.length} early years have flat within-year modeled monthly values. Gross combustion includes biogenic carbon that may be reabsorbed and fire with mixed human and natural causes, so it is not a net atmospheric addition attributable to land use.`,
    admittedUse: 'Use the source series to describe gross combustion flow and its inventory uncertainty.',
    prohibitedUse: 'Do not sum gross fire CO2 into cumulative fossil CO2, apply TCRE directly, or treat the global fire total as fully anthropogenic.',
    nextRequiredData: 'A source-removal history that separates anthropogenic land-use fire from natural fire and pairs gross combustion with regrowth, decay and other relevant removals on a compatible carbon-accounting boundary.',
  },
].map(row => ({
  ...row,
  name: allocationById.get(row.nodeId).name,
  currentCandidate: allocationById.get(row.nodeId).currentCandidate,
  latestMeasurement: latestMeasurement(row.nodeId),
  authoredBoundary: evidenceBoundary(row.nodeId),
  ratingEffect: 'none_candidate_retained_at_confidence_d',
}));

assert.equal(rows.length, targetIds.length);
assert.deepEqual(rows.map(row => row.nodeId).sort(), [...targetIds].sort());
assert(rows.every(row => Number.isFinite(row.currentCandidate.value) && row.currentCandidate.confidence === 'D'));

const counts = {
  nodesAudited: rows.length,
  nodeSpecificHistoriesAdmitted: 0,
  aggregateOrProxyHistoriesAvailable: rows.filter(row => row.status !== 'latest_mixed_co2e_only_gas_history_missing').length,
  exactBoundaryChangesRequired: rows.length,
  numericalCandidatesRetained: rows.filter(row => Number.isFinite(row.currentCandidate.value)).length,
  ratingChanges: rows.filter(row => row.ratingEffect !== 'none_candidate_retained_at_confidence_d').length,
};

const payload = {
  version: 'tulip_internal_emission_source_history_feasibility_2026_09_25_v1',
  preparedOn: '2026-09-25',
  status: 'six_remaining_source_histories_audited_no_false_splits_admitted',
  productionRatingsEnabled: 0,
  purpose: 'Determine which official histories can be assigned to the six remaining emission-source nodes without inventing vehicle, material, production-route, operating-mode or land-carbon splits.',
  sourceVerification: {
    ceds: {
      recordUrl: ceds.recordUrl,
      archive: { url: ceds.archiveUrl, bytes: archive.length, sha256: ceds.archiveSha256 },
      member: { path: ceds.member, bytes: memberBuffer.length, sha256: ceds.memberSha256 },
      rows: cedsRows.length,
    },
    edgar: { version: edgar.version, recordCount: edgar.record_count },
    climateTrace: { version: climateTrace.version, recordCount: climateTrace.record_count },
  },
  methodBoundary: {
    admissionRule: 'A history is node-specific only when its source category matches the node across sector, fuel or gas, operating mode, geography and time without overlap with another independently scored source node.',
    proxyRule: 'Aggregate, upper-bound, lower-bound and single-year records remain useful evidence but do not become a node-specific history by applying a constant share.',
    scoreRule: 'This audit improves provenance and the next-data specification. It does not convert source magnitude into harm or change any TULIP axis.',
  },
  counts,
  sharedSourceFacts,
  rows,
};
payload.digest = digest({ sourceVerification: payload.sourceVerification, methodBoundary: payload.methodBoundary, counts, sharedSourceFacts, rows });

const report = `# Emission-source history feasibility audit

Status: **the six remaining source histories were checked; no false sector split was admitted**.

Official CEDS, EDGAR and Climate TRACE records provide useful aggregate or proxy histories for five nodes. None yet matches a remaining node closely enough to enter the source-removal model as that node's own history. The hydrogen record remains a single mixed-gas lifecycle estimate. All six numerical candidates remain visible at confidence D.

| Node | Result | Why the available history is not node-specific | Exact next data |
| --- | --- | --- | --- |
${rows.map(row => `| ${row.name} | ${row.status.replaceAll('_', ' ')} | ${row.finding} | ${row.nextRequiredData} |`).join('\n')}

## Key boundary findings

- Total road CO2 is available, but neither CEDS nor EDGAR separates passenger vehicles from freight through time. Fuel is not a vehicle class.
- CEDS construction activity is not embodied construction materials. Broader industry totals overlap cement, steel, chemicals and industrial heat already represented elsewhere.
- Electricity inventories do not identify standby operating mode. Autoproducer generation cannot be relabelled as backup power.
- Gross land-fire CO2 is a combustion flow. It is not the net anthropogenic atmospheric addition after regrowth and other removals.
- Lifecycle CO2e from hydrogen cannot be passed through the CO2 physical model until gases and production routes are separated.

No rating changed in this audit. The result narrows the next ingestion work to six exact boundary problems instead of treating any available sector total as interchangeable with the node.
`;

await mkdir(outDir, { recursive: true });
await Promise.all([
  writeFile(outputJson, `${JSON.stringify(payload, null, 2)}\n`),
  writeFile(outputReport, report),
]);
console.log(JSON.stringify({ outputJson, outputReport, status: payload.status, counts, ceds: sharedSourceFacts, digest: payload.digest }, null, 2));
