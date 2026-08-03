import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ARCHIVE_URL = 'https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_COUNTRY_STATS_MT_GLOBE_R2024A/V1-0/GHS_COUNTRY_STATS_MT_GLOBE_R2024A.zip';
const WORKBOOK_NAME = 'GHS-COUNTRY-STATS_MT_GLOBE_R2024_V1_0.xlsx';

function decodeXml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

async function unzipText(archive, member, maxBuffer = 64 * 1024 * 1024) {
  const { stdout } = await execFileAsync('unzip', ['-p', archive, member], { encoding: 'utf8', maxBuffer });
  return stdout;
}

function parseSharedStrings(xml) {
  return [...xml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(match =>
    [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(part => decodeXml(part[1])).join('')
  );
}

function columnIndex(reference) {
  const letters = reference.match(/^[A-Z]+/)?.[0] || '';
  return [...letters].reduce((value, letter) => value * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function parseWorksheet(xml, sharedStrings) {
  const rows = [];
  for (const rowMatch of xml.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)) {
    const values = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\s+([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cellMatch[1];
      const body = cellMatch[2];
      const reference = attributes.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!reference) continue;
      const type = attributes.match(/\bt="([^"]+)"/)?.[1] || null;
      const raw = body.match(/<v>([\s\S]*?)<\/v>/)?.[1]
        ?? body.match(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/)?.[1]
        ?? '';
      let value = decodeXml(raw);
      if (type === 's') value = sharedStrings[Number(value)] ?? null;
      else if (type !== 'inlineStr' && value !== '') {
        const numeric = Number(value);
        if (Number.isFinite(numeric)) value = numeric;
      }
      values[columnIndex(reference)] = value;
    }
    rows.push(values);
  }
  return rows;
}

function relationshipMap(xml) {
  return new Map([...xml.matchAll(/<Relationship\s+([^>]+)\/?>(?:<\/Relationship>)?/g)].map(match => {
    const attributes = match[1];
    return [attributes.match(/\bId="([^"]+)"/)?.[1], attributes.match(/\bTarget="([^"]+)"/)?.[1]];
  }).filter(([id, target]) => id && target));
}

function sheetTargets(workbookXml, relationshipsXml) {
  const relationships = relationshipMap(relationshipsXml);
  return new Map([...workbookXml.matchAll(/<sheet\s+([^>]+)\/?>(?:<\/sheet>)?/g)].map(match => {
    const attributes = match[1];
    const name = decodeXml(attributes.match(/\bname="([^"]+)"/)?.[1]);
    const relationshipId = attributes.match(/\br:id="([^"]+)"/)?.[1];
    const target = relationships.get(relationshipId);
    return [name, target?.startsWith('/') ? target.slice(1) : `xl/${target}`];
  }).filter(([name, target]) => name && target));
}

function tableRecords(rows) {
  const [headers = [], ...data] = rows;
  return data.map(row => Object.fromEntries(headers.map((header, index) => [String(header), row[index] ?? null])));
}

function aggregateUrban(records) {
  const byCountry = new Map();
  for (const record of records) {
    if (!['UC', 'UCL'].includes(record.DEGURBA_L1)) continue;
    const key = String(record.GADM_ISO || '');
    if (!key) continue;
    if (!byCountry.has(key)) byCountry.set(key, { iso3: key, country_name: record.GADM_NAME, value_2015: 0, value_2020: 0, classes: [] });
    const aggregate = byCountry.get(key);
    aggregate.value_2015 += Number(record['2015'] || 0);
    aggregate.value_2020 += Number(record['2020'] || 0);
    aggregate.classes.push(record.DEGURBA_L1);
  }
  return byCountry;
}

const round = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

async function main() {
  const contracts = await readMetricContracts(ROOT);
  const nodeIds = ['urbanization', 'urban_sprawl_housing'];
  for (const nodeId of nodeIds) {
    if (!contracts[nodeId]) throw new Error(`Missing node metric contract for ${nodeId}`);
  }

  const response = await fetch(ARCHIVE_URL, { headers: { 'User-Agent': 'LostPlanet-Northstar/1.0 (+contract-bound snapshot ingestion)' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${ARCHIVE_URL}`);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lostplanet-ghsl-'));
  try {
    const archivePath = path.join(tempDir, 'ghsl-country-stats.zip');
    await fs.writeFile(archivePath, Buffer.from(await response.arrayBuffer()));
    await execFileAsync('unzip', ['-q', '-o', archivePath, '-d', tempDir]);
    const workbookPath = path.join(tempDir, WORKBOOK_NAME);
    const [workbookXml, relationshipsXml, sharedStringsXml] = await Promise.all([
      unzipText(workbookPath, 'xl/workbook.xml'),
      unzipText(workbookPath, 'xl/_rels/workbook.xml.rels'),
      unzipText(workbookPath, 'xl/sharedStrings.xml')
    ]);
    const sharedStrings = parseSharedStrings(sharedStringsXml);
    const targets = sheetTargets(workbookXml, relationshipsXml);
    const [builtXml, populationXml] = await Promise.all([
      unzipText(workbookPath, targets.get('BU_S_km2_L1')),
      unzipText(workbookPath, targets.get('POP_L1'))
    ]);
    const built = aggregateUrban(tableRecords(parseWorksheet(builtXml, sharedStrings)));
    const population = aggregateUrban(tableRecords(parseWorksheet(populationXml, sharedStrings)));

    const sourceCountryCount = built.size;
    const records = [...built.values()].map(area => {
      const people = population.get(area.iso3);
      const builtPerResident2015 = people?.value_2015 > 0 ? area.value_2015 * 1_000_000 / people.value_2015 : null;
      const builtPerResident2020 = people?.value_2020 > 0 ? area.value_2020 * 1_000_000 / people.value_2020 : null;
      const annualizedPerResidentChange = builtPerResident2015 > 0 && builtPerResident2020 > 0
        ? (Math.pow(builtPerResident2020 / builtPerResident2015, 1 / 5) - 1) * 100
        : null;
      return {
        record_id: `ghsl_${area.iso3}_urban_2015_2020`,
        iso3: area.iso3,
        country_name: area.country_name,
        settlement_classes: ['UC', 'UCL'],
        start_epoch: 2015,
        end_epoch: 2020,
        built_up_surface_2015_km2: round(area.value_2015),
        built_up_surface_2020_km2: round(area.value_2020),
        built_up_surface_expansion_hectares_per_year: round((area.value_2020 - area.value_2015) * 100 / 5),
        urban_population_2015: round(people?.value_2015, 0),
        urban_population_2020: round(people?.value_2020, 0),
        built_up_area_per_resident_2015_m2: round(builtPerResident2015),
        built_up_area_per_resident_2020_m2: round(builtPerResident2020),
        built_up_area_per_resident_annualized_change_pct: round(annualizedPerResidentChange),
        ghsl_release: 'GHS_COUNTRY_STATS_MT_GLOBE_R2024A V1.0',
        boundary_system: 'GADM 4.1 adapted for GHSL',
        degree_of_urbanisation_level: 'L1 Urban Centre plus Urban Cluster'
      };
    }).filter(record => record.iso3
      && Number.isFinite(record.built_up_surface_2020_km2)
      && Number.isFinite(record.built_up_area_per_resident_2020_m2));

    const snapshot = snapshotEnvelope({
      jobId: 'fetch_ghsl_country_urbanization_metrics',
      source: {
        id: 'global_human_settlement_layer',
        name: 'Global Human Settlement Layer',
        publisher: 'European Commission Joint Research Centre',
        product: 'GHS Country Statistics MT Globe R2024A V1.0',
        dataset_url: ARCHIVE_URL,
        documentation_url: 'https://human-settlement.emergency.copernicus.eu/ghs_buS2023.php',
        doi: '10.2905/9F06F36F-4B11-47EC-ABB0-4F8B7B1D72EA'
      },
      request: {
        archive: WORKBOOK_NAME,
        sheets: ['BU_S_km2_L1', 'POP_L1'],
        settlement_classes: ['UC', 'UCL'],
        epochs: [2015, 2020],
        aggregation: 'country or territory under the published GHSL/GADM boundary table'
      },
      contractIds: nodeIds.map(nodeId => contracts[nodeId].metric_id),
      contractBindings: nodeIds.map(nodeId => ({ node_id: nodeId, metric_id: contracts[nodeId].metric_id })),
      cadence: 'annual source check; refresh when JRC publishes a new harmonized GHSL country-statistics release',
      provenance: 'European Commission JRC GHSL country-statistics workbook; built-up surface and population are aggregated across Degree of Urbanisation L1 Urban Centre and Urban Cluster classes for harmonized 2015 and 2020 epochs.',
      uncertainty: 'Remote-sensing classification, population downscaling, GADM boundary adaptation, settlement-class transitions, epoch interpolation, and release revisions affect comparisons.',
      records,
      sourceSummary: {
        countries_or_territories: records.length,
        source_countries_or_territories: sourceCountryCount,
        excluded_without_positive_urban_population: sourceCountryCount - records.length,
        measurement_epochs: [2015, 2020],
        source_sheets: ['BU_S_km2_L1', 'POP_L1'],
        measurement_boundary: 'This snapshot measures built-up surface expansion and built-up area per resident. It does not measure urban tree canopy, building height, informal-settlement status, service access, or causal drivers of urbanization.'
      },
      caveats: [
        'GHSL epochs approximate temporal conditions and are not annual cadastral observations.',
        'The 2025 and 2030 columns are excluded because this snapshot is restricted to the 2015-2020 historical comparison.',
        'A change in Degree of Urbanisation class can move land and population between UC, UCL, and rural classes; UC and UCL are therefore aggregated together.',
        'Negative expansion values can occur through classification, boundary, or settlement-system change and must not be silently clamped to zero.'
      ],
      failureBehavior: 'Retain the last validated GHSL release, mark the artifact stale, expose the archive or schema failure, and never mix workbook releases or fill missing countries with zero.'
    });

    const output = await writeSnapshot(ROOT, 'ghsl-country-urbanization-snapshot.json', snapshot);
    console.log(JSON.stringify({ output, records: records.length, epochs: [2015, 2020] }, null, 2));
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
