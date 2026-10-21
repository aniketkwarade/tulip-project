import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const output = path.join(outputDir, 'rapid-runoff-response-reference-snapshot.json');
const checkedOn = '2026-09-23';
const execFileAsync = promisify(execFile);
const userAgent = 'LostPlanet-TULIP/1.0 (+rapid-runoff-response-evidence-ingestion)';

const expected = {
  globalFloodAbstract: { bytes: 1_713, sha256: '4d0c55a230d916bb4d3aefe50d1571929207f085598f05183580ce69d37badd8' },
  globalFloodTable: { bytes: 104_868, sha256: '2425ba64941c03ebac484ffb16b776199fe57627eed268ab955ca668e6ccb7bb' },
  riverStructureData: { bytes: 36_815, sha256: '80a41464973bf5721b2b333a3243a4255231f6894b7329f0b14f6054a0d33678' },
  riverFunctionData: { bytes: 29_231, sha256: 'cba6173f87c15773ab65fdfac063ed106e992bf62ecae3055b411924109e1134' },
  riverMetaAnalysisCode: { bytes: 15_279, sha256: 'd4ac2b874c3827c4ce6bf9327d1abf2a1e2806ca19534f53f5d5824a99c67268' },
  futureAreaClaim: { bytes: 591, sha256: '225f417c51308436c9738004a2d9196c10b39005556fa41fb9d1df84997b8cfa' },
  futureAttributionClaim: { bytes: 648, sha256: '717daaff343f3f84380a0f648c792834ea139902eb9b84aee639d5e27c14d902' },
  futureRegionalClaim: { bytes: 815, sha256: '0bf716502c3e0f5d089578fb9a222df8f400cda1cb6e5a8d2560f4326013b3ca' },
};

const sources = {
  globalFloodDatabase: {
    id: 'tellman_global_flood_database_2021',
    publisher: 'Nature',
    title: 'Satellite imaging reveals increased proportion of population exposed to floods',
    publicationDate: '2021-08-04',
    articleUrl: 'https://www.nature.com/articles/s41586-021-03695-w',
    doi: 'https://doi.org/10.1038/s41586-021-03695-w',
    supplementaryTableUrl: 'https://media.springernature.com/original/springer-static/esm/art%3A10.1038%2Fs41586-021-03695-w/MediaObjects/41586_2021_3695_MOESM2_ESM.xlsx',
  },
  riverMetaAnalysis: {
    id: 'sabater_river_extremes_meta_analysis_2023',
    publisher: 'Biological Reviews',
    title: 'Extreme weather events threaten biodiversity and functions of river ecosystems: evidence from a meta-analysis',
    publicationDate: '2023-04',
    articleUrl: 'https://onlinelibrary.wiley.com/doi/10.1111/brv.12914',
    doi: 'https://doi.org/10.1111/brv.12914',
    dataUrl: 'https://zenodo.org/records/7004412',
    dataDoi: 'https://doi.org/10.5281/zenodo.7004412',
  },
  futureFloodModel: {
    id: 'rogers_global_flood_exposure_ssp245_2025',
    publisher: 'Nature Communications',
    title: 'The role of climate and population change in global flood exposure and vulnerability',
    publicationDate: '2025-02-03',
    articleUrl: 'https://www.nature.com/articles/s41467-025-56654-8',
    doi: 'https://doi.org/10.1038/s41467-025-56654-8',
  },
};

const zenodoFiles = {
  structural: 'https://zenodo.org/api/records/7004412/files/structural_resp.txt/content',
  functional: 'https://zenodo.org/api/records/7004412/files/functional_resp.txt/content',
  code: 'https://zenodo.org/api/records/7004412/files/metaanalysis_GlobalEvidenceRivers_Rscript.R/content',
};

const sha256 = value => createHash('sha256').update(value).digest('hex');
const digest = value => sha256(JSON.stringify(value));
const decodeHtml = value => value
  .replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;|&#xA0;/gi, ' ')
  .replace(/&ndash;|&#8211;|&#x2013;/gi, '–')
  .replace(/&mdash;|&#8212;|&#x2014;/gi, '—')
  .replace(/&plusmn;|&#177;|&#xB1;/gi, '±')
  .replace(/&minus;|&#8722;|&#x2212;/gi, '−')
  .replace(/&deg;|&#176;/gi, '°')
  .replace(/&amp;/gi, '&')
  .replace(/&lt;/gi, '<')
  .replace(/&gt;/gi, '>')
  .replace(/&quot;/gi, '"')
  .replace(/&#x27;|&#39;/gi, "'")
  .replace(/\s+/g, ' ')
  .trim();

async function fetchBuffer(url, accept) {
  const args = [
    '--location', '--fail', '--silent', '--show-error', '--max-time', '120',
    '--header', `User-Agent: ${userAgent}`,
  ];
  if (accept) args.push('--header', `Accept: ${accept}`);
  args.push(url);
  const { stdout } = await execFileAsync('curl', args, { encoding: null, maxBuffer: 200_000_000, timeout: 130_000 });
  return stdout;
}

function paragraphContaining(buffer, needle) {
  const html = buffer.toString('utf8');
  const paragraphs = [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map(match => decodeHtml(match[1]));
  const paragraph = paragraphs.find(value => value.includes(needle));
  assert(paragraph, `Official source paragraph is missing: ${needle}`);
  return paragraph;
}

function verify(name, buffer, pinned) {
  assert.equal(buffer.length, pinned.bytes, `${name} byte count changed`);
  assert.equal(sha256(buffer), pinned.sha256, `${name} checksum changed`);
}

function verifyClaim(name, value, pinned) {
  assert.equal(Buffer.byteLength(value), pinned.bytes, `${name} byte count changed`);
  assert.equal(sha256(value), pinned.sha256, `${name} checksum changed`);
}

const [globalFloodPage, globalFloodTable, structuralData, functionalData, metaAnalysisCode, futureFloodPage] = await Promise.all([
  fetchBuffer(sources.globalFloodDatabase.articleUrl, 'text/html'),
  fetchBuffer(sources.globalFloodDatabase.supplementaryTableUrl, 'application/octet-stream'),
  fetchBuffer(zenodoFiles.structural),
  fetchBuffer(zenodoFiles.functional),
  fetchBuffer(zenodoFiles.code),
  fetchBuffer(sources.futureFloodModel.articleUrl, 'text/html'),
]);

const claims = {
  globalFloodAbstract: paragraphContaining(globalFloodPage, 'Here we use daily satellite imagery'),
  futureArea: paragraphContaining(futureFloodPage, 'Considering all sources of flooding'),
  futureAttribution: paragraphContaining(futureFloodPage, 'Of this 19.0% increase'),
  futureRegional: paragraphContaining(futureFloodPage, 'Generally, coastal areas and pluvial-dominated areas'),
};
verifyClaim('Global flood abstract', claims.globalFloodAbstract, expected.globalFloodAbstract);
verifyClaim('Future inundated-area claim', claims.futureArea, expected.futureAreaClaim);
verifyClaim('Future attribution claim', claims.futureAttribution, expected.futureAttributionClaim);
verifyClaim('Future regional claim', claims.futureRegional, expected.futureRegionalClaim);
verify('Global flood supplementary table', globalFloodTable, expected.globalFloodTable);
verify('River structural-response data', structuralData, expected.riverStructureData);
verify('River function-response data', functionalData, expected.riverFunctionData);
verify('River meta-analysis code', metaAnalysisCode, expected.riverMetaAnalysisCode);
assert.equal(globalFloodTable.subarray(0, 2).toString('hex'), '504b', 'Global flood table is not an XLSX ZIP archive');

const workDir = await mkdtemp(path.join(os.tmpdir(), 'tulip-runoff-'));
const workbookPath = path.join(workDir, 'global-flood-table.xlsx');
await writeFile(workbookPath, globalFloodTable);
const parser = String.raw`
import collections, datetime, json, statistics, sys, xml.etree.ElementTree as ET, zipfile

path = sys.argv[1]
ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
with zipfile.ZipFile(path) as archive:
    shared_root = ET.fromstring(archive.read('xl/sharedStrings.xml'))
    shared = [''.join(node.text or '' for node in item.findall('.//m:t', ns)) for item in shared_root.findall('m:si', ns)]
    sheet = ET.fromstring(archive.read('xl/worksheets/sheet1.xml'))

def column_index(reference):
    letters = ''.join(character for character in reference if character.isalpha())
    value = 0
    for character in letters:
        value = value * 26 + ord(character.upper()) - 64
    return value - 1

rows = []
for row in sheet.findall('.//m:sheetData/m:row', ns):
    values = [None] * 16
    for cell in row.findall('m:c', ns):
        value_node = cell.find('m:v', ns)
        if value_node is None:
            continue
        value = value_node.text
        if cell.attrib.get('t') == 's':
            value = shared[int(value)]
        else:
            number = float(value)
            value = int(number) if number.is_integer() else number
        values[column_index(cell.attrib['r'])] = value
    rows.append(values)

headers = rows[0]
records = [dict(zip(headers, row)) for row in rows[1:]]
excel_epoch = datetime.datetime(1899, 12, 30)
for record in records:
    for key in ('dfo_began', 'dfo_ended'):
        record[key] = excel_epoch + datetime.timedelta(days=float(record[key]))

accepted_causes = {'Heavy rain', 'Snowmelt, Ice, Rain'}
selected = [record for record in records if record['dfo_cause'] in accepted_causes]

def summarize(records):
    annual = collections.defaultdict(lambda: {'events': 0, 'deaths': 0, 'displaced': 0, 'satellite_exposed_event_people': 0, 'inundated_area_km2': 0.0})
    durations = []
    for record in records:
        year = record['dfo_began'].year
        values = annual[year]
        values['events'] += 1
        values['deaths'] += record['dfo_dead'] or 0
        values['displaced'] += record['dfo_displaced'] or 0
        values['satellite_exposed_event_people'] += record['gfd_population_exposed'] or 0
        values['inundated_area_km2'] += record['gfd_area_km2'] or 0
        durations.append((record['dfo_ended'] - record['dfo_began']).days + 1)
    ordered = [annual[year] for year in sorted(annual)]
    metrics = {}
    for key in ordered[0]:
        series = [item[key] for item in ordered]
        metrics[key] = {
            'total': sum(series),
            'annual_median': statistics.median(series),
            'annual_mean': sum(series) / len(series),
            'annual_min': min(series),
            'annual_max': max(series),
        }
    durations.sort()
    return {
        'start_year': min(annual),
        'end_year': max(annual),
        'years': len(annual),
        'events': len(records),
        'metrics': metrics,
        'event_duration_days': {
            'median': statistics.median(durations),
            'p90_nearest_rank': durations[int(0.9 * (len(durations) - 1))],
            'maximum': max(durations),
        },
        'events_without_reported_deaths': sum(1 for record in records if not record['dfo_dead']),
        'events_without_reported_displacement': sum(1 for record in records if not record['dfo_displaced']),
    }

result = {
    'workbook_rows': len(records),
    'cause_counts': dict(collections.Counter(str(record['dfo_cause']) for record in records)),
    'runoff_linked_all': summarize(selected),
    'runoff_linked_latest_five_years': summarize([record for record in selected if record['dfo_began'].year >= 2014]),
}
print(json.dumps(result, separators=(',', ':')))
`;

let floodTable;
try {
  const { stdout } = await execFileAsync('python3', ['-c', parser, workbookPath], { maxBuffer: 20_000_000, timeout: 60_000 });
  floodTable = JSON.parse(stdout);
} finally {
  await rm(workDir, { recursive: true, force: true });
}

assert.equal(floodTable.workbook_rows, 913);
assert.deepEqual(floodTable.cause_counts, { 'Heavy rain': 751, 'Tropical Storm, Surge': 97, 'Snowmelt, Ice, Rain': 52, Dam: 13 });
assert.equal(floodTable.runoff_linked_all.events, 803);
assert.equal(floodTable.runoff_linked_latest_five_years.events, 139);
assert.equal(floodTable.runoff_linked_latest_five_years.metrics.deaths.total, 2_652);
assert.equal(floodTable.runoff_linked_latest_five_years.metrics.displaced.total, 6_518_086);
assert.equal(floodTable.runoff_linked_latest_five_years.metrics.displaced.annual_median, 1_297_231);
assert.equal(floodTable.runoff_linked_latest_five_years.metrics.satellite_exposed_event_people.total, 153_406_662);
assert.equal(floodTable.runoff_linked_latest_five_years.event_duration_days.median, 13);

function parseTabRows(buffer) {
  const lines = buffer.toString('latin1').trim().split(/\r?\n/);
  const headers = lines.shift().split('\t');
  return lines.map(line => Object.fromEntries(line.split('\t').map((value, index) => [headers[index], value])));
}

const structuralRows = parseTabRows(structuralData);
const functionalRows = parseTabRows(functionalData);
const highFlowStructure = structuralRows.filter(row => row['Anomaly.type'] === 'Flow.increase');
const highFlowFunction = functionalRows.filter(row => row['Anomaly.type'] === 'Flow.increase');
const highFlowVariables = Object.fromEntries([...new Set(highFlowStructure.map(row => row.variable))]
  .sort().map(variable => [variable, highFlowStructure.filter(row => row.variable === variable).length]));
assert.equal(structuralRows.length, 198);
assert.equal(functionalRows.length, 134);
assert.equal(highFlowStructure.length, 32);
assert.equal(new Set(highFlowStructure.map(row => row.authors)).size, 10);
assert.deepEqual(highFlowVariables, { Biomass: 4, Density: 14, Richness: 14 });
assert.equal(highFlowFunction.length, 0);

const snapshot = {
  version: 'tulip_rapid_runoff_response_reference_2026_09_23_v1',
  generatedOn: checkedOn,
  status: 'current_human_consequences_and_ecosystem_limitations_ingested',
  productionRatingsEnabled: 0,
  purpose: 'Replace a 1978 single-event fallback and generic global reach and persistence assumptions with a reproducible multi-event human-consequence distribution, a source-specific river-ecology evidence boundary and an SSP2-4.5 outlook.',
  sources: {
    globalFloodDatabase: {
      ...sources.globalFloodDatabase,
      abstractClaim: { ...expected.globalFloodAbstract, retrievedOn: checkedOn },
      supplementaryTable: { ...expected.globalFloodTable, retrievedOn: checkedOn, rows: floodTable.workbook_rows },
    },
    riverMetaAnalysis: {
      ...sources.riverMetaAnalysis,
      structuralData: { ...expected.riverStructureData, retrievedOn: checkedOn },
      functionalData: { ...expected.riverFunctionData, retrievedOn: checkedOn },
      analysisCode: { ...expected.riverMetaAnalysisCode, retrievedOn: checkedOn },
    },
    futureFloodModel: {
      ...sources.futureFloodModel,
      inundatedAreaClaim: { ...expected.futureAreaClaim, retrievedOn: checkedOn },
      attributionClaim: { ...expected.futureAttributionClaim, retrievedOn: checkedOn },
      regionalVariationClaim: { ...expected.futureRegionalClaim, retrievedOn: checkedOn },
    },
  },
  endpoints: {
    globalEventRecord: {
      observationPeriod: { start: 2000, end: 2018 },
      qualityControlledLargeFloodEvents: floodTable.workbook_rows,
      satelliteMappedInundatedAreaKm2: 2_230_000,
      sourceEstimatedDirectlyAffectedPeopleRange: [255_000_000, 290_000_000],
      boundary: 'The article-wide totals cover all retained flood causes. They measure event exposure or direct affected status, not unique people, rapid-runoff attribution, severity, recovery time or a current annual prevalence.',
    },
    runoffLinkedEvents: {
      acceptedCauseLabels: ['Heavy rain', 'Snowmelt, Ice, Rain'],
      excludedCauseLabels: ['Tropical Storm, Surge', 'Dam'],
      fullRecord: floodTable.runoff_linked_all,
      latestFiveYears: floodTable.runoff_linked_latest_five_years,
      boundary: 'The filter identifies events whose reported cause is consistent with rainfall or snowmelt runoff. It does not prove that every death or displacement was caused only by fast runoff, and annual event-person counts can include the same person in more than one event.',
    },
    riverEcosystemEvidence: {
      structuralResponseRows: structuralRows.length,
      functionalResponseRows: functionalRows.length,
      highFlowStructuralEffectSizes: highFlowStructure.length,
      highFlowStructuralStudies: new Set(highFlowStructure.map(row => row.authors)).size,
      highFlowStructuralVariables: highFlowVariables,
      highFlowFunctionalEffectSizes: highFlowFunction.length,
      sourceConclusion: 'The peer-reviewed meta-analysis reports that floods did not show consistent effects on species richness or biomass, even though some catastrophic floods caused large local changes. The database contains no high-flow ecosystem-function effect sizes.',
      transferBoundary: 'The evidence is dominated by temperate river studies, has only ten high-flow structural studies, supplies no fraction of global river ecosystems harmed and does not provide a comparable post-flood recovery distribution.',
    },
    outlook: {
      scenario: 'SSP2-4.5',
      modelPeriod: { start: 2020, end: 2100 },
      presentCombinedFloodExposedPeople: 1_600_000_000,
      presentFluvialFloodExposedPeople: 1_100_000_000,
      presentFluvialExposureSharePercent: 14.1,
      presentPluvialExposureSharePercent: 9.0,
      projectedRelativeInundatedAreaChangePercent: { coastal: 16.7, pluvial: 4.8, fluvial: 1.4 },
      totalExposureChangeAttributionPercent: { climate: 21.1, population: 76.8, joint: 2.1 },
      direction: 'worsening',
      boundary: 'The study supports a small positive global direction for pluvial and fluvial inundation under SSP2-4.5, with strong regional variation. Its 2020–2100 change cannot be converted into a numerical 2027–2036 TULIP increment, and people living in modeled flood zones are exposure rather than demonstrated harm.',
    },
  },
  tulipUse: {
    admitted: [
      'Use the 2014–2018 runoff-linked subset as an event distribution for current human severity and reach, while retaining incomplete event reporting and causal attribution as confidence limits.',
      'Use annual event-displacement summaries as a bounded affected-person flow; do not add five years of displacement into a unique-person prevalence.',
      'Use reported deaths to establish severe human consequences, without promoting the node to level 4 severity merely because any fatality occurred.',
      'Use the river meta-analysis to keep ecosystem severity low and bounded because high-flow responses were inconsistent and ecosystem-function evidence was absent.',
      'Use the SSP2-4.5 model for outlook direction only, with regional variation and the different roles of climate and population retained.',
    ],
    prohibited: [
      'Do not treat 255–290 million flood-exposed event-people as unique people harmed by rapid runoff.',
      'Do not include tropical-storm surge or dam-failure events in the rapid-runoff event subset.',
      'Do not use satellite inundated area as ecosystem condition loss or ecosystem-distribution reach.',
      'Do not use the 2000–2018 observation record as human or ecosystem persistence.',
      'Do not use event duration as displacement recovery time; it only establishes that the sampled hazards are generally acute.',
      'Do not add Bridge Scour Exposure, floodplain exposure, river-flow change or connected flood-node scores.',
      'Do not translate the 2020–2100 SSP2-4.5 change directly into a 2027–2036 magnitude.',
    ],
    currentCatalogueRecommendation: {
      rating: 'C 4.8',
      uncertainty: 'B 2.9 to D 7.0',
      confidence: 'C',
      centralAxes: { human: [3, 3, 1], ecosystem: [1, 1, 1] },
      lowerAxes: { human: [2, 2, 1], ecosystem: [0, 0, 0] },
      upperAxes: { human: [4, 3, 2], ecosystem: [2, 2, 3] },
      finding: 'The former D 7.0 candidate treated assumed global reach and chronic persistence as evidence. Current direct human consequences remain serious, but ecological response, ecosystem reach and recovery are not globally demonstrated. The corrected central rating is C 4.8 with a B–D range and confidence C.',
    },
  },
  unresolvedForTulip: [
    'A current global event dataset that directly distinguishes rapid runoff from other flood mechanisms and carries audited deaths, displacement and service interruption.',
    'A deduplicated current affected-person denominator or compatible annual incidence estimate.',
    'A representative distribution of displacement and essential-service recovery time after runoff-driven floods.',
    'A global river-ecosystem denominator, condition-loss measure and recovery distribution for harmful high-flow events.',
    'A near-term 2027–2036 SSP2-4.5 projection that isolates rapid runoff and keeps climate, population, land use and adaptation effects separate.',
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
console.log(`Wrote ${path.relative(root, output)} (${snapshot.snapshotDigest})`);
