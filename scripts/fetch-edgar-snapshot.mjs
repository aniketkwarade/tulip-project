import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

import { readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const execFileAsync = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DATASET_URL = 'https://edgar.jrc.ec.europa.eu/dataset_ghg2025';
const CO2_ARCHIVE_URL = 'https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/EDGAR/datasets/EDGAR_2025_GHG/IEA_EDGAR_CO2_1970_2024.zip';
const CO2_WORKBOOK_NAME = 'IEA_EDGAR_CO2_1970_2024.xlsx';
const CH4_ARCHIVE_URL = 'https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/EDGAR/datasets/EDGAR_2025_GHG/EDGAR_CH4_1970_2024.zip';
const CH4_WORKBOOK_NAME = 'EDGAR_CH4_1970_2024.xlsx';
const N2O_ARCHIVE_URL = 'https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/EDGAR/datasets/EDGAR_2025_GHG/EDGAR_N2O_1970_2024.zip';
const N2O_WORKBOOK_NAME = 'EDGAR_N2O_1970_2024.xlsx';
const AIR_POLLUTANT_DATASET_URL = 'https://edgar.jrc.ec.europa.eu/dataset_ap81';
const CO_ARCHIVE_URL = 'https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/EDGAR/datasets/v81_FT2022_AP_new/EDGAR_CO_1970_2022.zip';
const CO_WORKBOOK_NAME = 'EDGAR_CO_1970_2022.xlsx';
const SO2_ARCHIVE_URL = 'https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/EDGAR/datasets/v81_FT2022_AP_new/EDGAR_SO2_1970_2022_v2.zip';
const SO2_WORKBOOK_NAME = 'EDGAR_SO2_1970_2022.xlsx';
const OBSERVATION_YEAR = 2024;
const OBSERVATION_YEARS = Object.freeze(Array.from({ length: OBSERVATION_YEAR - 1970 + 1 }, (_, index) => 1970 + index));

const DIRECT_BINDINGS = Object.freeze({
  '2.A.1': { node_id: 'cement_process_emissions', metric_id: 'cement_calcination_co2_emissions', measurement_role: 'direct_edgar_cement_production_process_co2_category' },
  '1.A.3.a': { node_id: 'aviation_jet_fuel_co2', metric_id: 'carbon_pathway_aviation_jet_fuel_co2', measurement_role: 'direct_edgar_civil_aviation_fossil_co2_category' },
  '1.A.1.bc': { node_id: 'refinery_combustion_co2', metric_id: 'carbon_pathway_refinery_combustion_co2', measurement_role: 'direct_edgar_refining_and_energy_industries_fossil_co2_category' },
  '2.B': { node_id: 'chemical_process_co2', metric_id: 'carbon_pathway_chemical_process_co2', measurement_role: 'direct_edgar_chemical_industry_fossil_co2_category' },
  '4.C': { node_id: 'waste_incineration_co2', metric_id: 'carbon_pathway_waste_incineration_co2', measurement_role: 'direct_edgar_waste_incineration_and_open_burning_fossil_co2_category' },
  '1.A.3.d': { node_id: 'shipping_bunker_fuel_co2', metric_id: 'carbon_pathway_shipping_bunker_fuel_co2', measurement_role: 'direct_edgar_water_borne_navigation_fossil_co2_category' },
  '1.A.3.c': { node_id: 'rail_diesel_co2', metric_id: 'carbon_pathway_rail_diesel_co2', measurement_role: 'direct_edgar_railway_fossil_co2_category' },
  '2.C': { node_id: 'iron_steel_process_co2', metric_id: 'carbon_pathway_iron_steel_process_co2', measurement_role: 'direct_edgar_metal_industry_fossil_co2_category' },
  '1.B.2': { node_id: 'oil_gas_flaring_co2', metric_id: 'carbon_pathway_oil_gas_flaring_co2', measurement_role: 'direct_edgar_oil_and_natural_gas_fossil_co2_category' }
});

const METHANE_DIRECT_BINDINGS = Object.freeze({
  '3.C.7': { node_id: 'rice_paddy_methane_bubbles', metric_id: 'rice_cultivation_methane_emission', measurement_role: 'direct_edgar_rice_cultivation_methane_category' }
});

const SUPPORTING_BINDINGS = Object.freeze({});

function decodeXml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

async function unzipText(archive, member, maxBuffer = 128 * 1024 * 1024) {
  const { stdout } = await execFileAsync('unzip', ['-p', archive, member], { encoding: 'utf8', maxBuffer });
  return stdout;
}

async function unzipTextOptional(archive, member, maxBuffer = 128 * 1024 * 1024) {
  try {
    return await unzipText(archive, member, maxBuffer);
  } catch (error) {
    if (error?.code === 11 || String(error?.stderr || '').includes('filename not matched')) return '';
    throw error;
  }
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
  const headerIndex = rows.findIndex(row => row[0] === 'IPCC_annex');
  if (headerIndex < 0) throw new Error('EDGAR IPCC 2006 header row not found');
  const headers = rows[headerIndex];
  return rows.slice(headerIndex + 1).map(row => Object.fromEntries(
    headers.map((header, index) => [String(header), row[index] ?? null])
  ));
}

async function fetchWorkbookRows(tempDir, { archiveUrl, archiveName, workbookName }) {
  const response = await fetch(archiveUrl, {
    headers: { 'User-Agent': 'LostPlanet-Northstar/1.0 (+contract-bound snapshot ingestion)' }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${archiveUrl}`);
  const archivePath = path.join(tempDir, archiveName);
  await fs.writeFile(archivePath, Buffer.from(await response.arrayBuffer()));
  await execFileAsync('unzip', ['-q', '-o', archivePath, '-d', tempDir]);
  const workbookPath = path.join(tempDir, workbookName);
  const [workbookXml, relationshipsXml, sharedStringsXml] = await Promise.all([
    unzipText(workbookPath, 'xl/workbook.xml'),
    unzipText(workbookPath, 'xl/_rels/workbook.xml.rels'),
    unzipTextOptional(workbookPath, 'xl/sharedStrings.xml')
  ]);
  const targets = sheetTargets(workbookXml, relationshipsXml);
  const worksheetTarget = targets.get('IPCC 2006');
  if (!worksheetTarget) throw new Error(`EDGAR IPCC 2006 worksheet missing in ${workbookName}`);
  return tableRecords(parseWorksheet(
    await unzipText(workbookPath, worksheetTarget),
    parseSharedStrings(sharedStringsXml)
  ));
}

const round = (value, digits = 6) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const idToken = value => String(value || 'not_applicable').trim().replaceAll(/[^A-Za-z0-9]+/g, '_').replaceAll(/^_+|_+$/g, '');

function globalAnnualSeries(rows, {
  nodeId,
  metricId,
  measurementRole,
  substance,
  workbookName,
  categoryCode = 'TOTAL_DERIVED',
  datasetUrl = DATASET_URL
}) {
  return OBSERVATION_YEARS.map(observationYear => {
    let value = 0;
    const countries = new Set();
    let sourceRowCount = 0;
    for (const row of rows) {
      const observation = Number(row[`Y_${observationYear}`]);
      if (!Number.isFinite(observation)) continue;
      value += observation;
      sourceRowCount += 1;
      const countryCode = String(row.Country_code_A3 || '').trim();
      if (countryCode) countries.add(countryCode);
    }
    if (!sourceRowCount) return null;
    return {
      record_id: `edgar_2025_${idToken(substance)}_${idToken(nodeId)}_WORLD_${observationYear}`,
      node_id: nodeId,
      metric_id: metricId,
      measurement_role: measurementRole,
      geography: 'World aggregate derived from source country and territory rows',
      observation_year: observationYear,
      emission_gg_substance: round(value),
      source_unit: `Gg ${substance} per year`,
      substance,
      category_code: categoryCode,
      countries_or_territories_reporting: countries.size,
      source_row_count: sourceRowCount,
      source_reported_uncertainty: null,
      uncertainty_status: 'not_reported_in_source_workbook',
      source_locator: `${datasetUrl}; workbook ${workbookName}; sheet IPCC 2006; ${categoryCode === 'TOTAL_DERIVED' ? 'derived global sum across source categories and country or territory rows' : `category ${categoryCode}, derived global sum across country or territory rows`}; Y_${observationYear}`
    };
  }).filter(Boolean);
}

async function main() {
  const contracts = await readMetricContracts(ROOT);
  const bindingEntries = [
    { node_id: 'carbon_emission', metric_id: 'territorial_fossil_and_industrial_co2_emissions', measurement_role: 'country_total_derived_from_disjoint_ipcc_2006_categories' },
    { node_id: 'methane', metric_id: 'anthropogenic_methane_emissions', measurement_role: 'country_total_derived_from_disjoint_edgar_ch4_ipcc_2006_categories' },
    { node_id: 'nitrous_oxide', metric_id: 'anthropogenic_nitrous_oxide_emissions', measurement_role: 'country_total_derived_from_disjoint_edgar_n2o_ipcc_2006_categories' },
    { node_id: 'carbon_monoxide', metric_id: 'carbon_monoxide_emission_or_concentration', measurement_role: 'global_total_derived_from_disjoint_edgar_co_ipcc_2006_categories' },
    { node_id: 'sulfur_dioxide', metric_id: 'sulfur_dioxide_emission_or_ambient_concentration', measurement_role: 'global_total_derived_from_disjoint_edgar_so2_ipcc_2006_categories' },
    ...Object.values(DIRECT_BINDINGS),
    ...Object.values(METHANE_DIRECT_BINDINGS),
    ...Object.values(SUPPORTING_BINDINGS)
  ];
  for (const binding of bindingEntries) {
    if (!contracts[binding.node_id]) throw new Error(`Missing node metric contract for ${binding.node_id}`);
    if (contracts[binding.node_id].metric_id !== binding.metric_id) {
      throw new Error(`Metric mismatch for ${binding.node_id}: ${contracts[binding.node_id].metric_id} !== ${binding.metric_id}`);
    }
  }

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lostplanet-edgar-'));
  try {
    const [sourceRows, methaneSourceRows, nitrousOxideSourceRows, carbonMonoxideSourceRows, sulfurDioxideSourceRows] = await Promise.all([
      fetchWorkbookRows(tempDir, { archiveUrl: CO2_ARCHIVE_URL, archiveName: 'edgar-co2.zip', workbookName: CO2_WORKBOOK_NAME }),
      fetchWorkbookRows(tempDir, { archiveUrl: CH4_ARCHIVE_URL, archiveName: 'edgar-ch4.zip', workbookName: CH4_WORKBOOK_NAME }),
      fetchWorkbookRows(tempDir, { archiveUrl: N2O_ARCHIVE_URL, archiveName: 'edgar-n2o.zip', workbookName: N2O_WORKBOOK_NAME }),
      fetchWorkbookRows(tempDir, { archiveUrl: CO_ARCHIVE_URL, archiveName: 'edgar-co.zip', workbookName: CO_WORKBOOK_NAME }),
      fetchWorkbookRows(tempDir, { archiveUrl: SO2_ARCHIVE_URL, archiveName: 'edgar-so2.zip', workbookName: SO2_WORKBOOK_NAME })
    ]);

    const sectorRecords = [];
    const totalsByCountry = new Map();
    for (const row of sourceRows) {
      const value = Number(row[`Y_${OBSERVATION_YEAR}`]);
      const countryCode = String(row.Country_code_A3 || '').trim();
      const countryName = String(row.Name || '').trim();
      const categoryCode = String(row.ipcc_code_2006_for_standard_report || '').trim();
      const categoryName = String(row.ipcc_code_2006_for_standard_report_name || '').trim();
      if (!countryCode || !countryName || !categoryCode || !Number.isFinite(value)) continue;
      const direct = DIRECT_BINDINGS[categoryCode] || null;
      const supporting = SUPPORTING_BINDINGS[categoryCode] || null;
      const binding = direct || supporting;
      sectorRecords.push({
        record_id: `edgar_2025_co2_${countryCode}_${idToken(categoryCode)}_${idToken(row.fossil_bio || 'fossil')}_${OBSERVATION_YEAR}`,
        metric_id: binding?.metric_id || 'edgar_fossil_co2_by_ipcc_2006_category',
        measurement_role: binding?.measurement_role || 'source_category_context_only',
        country_code: countryCode,
        country_name: countryName,
        country_group: row.C_group_IM24_sh || null,
        ipcc_annex: row.IPCC_annex || null,
        category_code: categoryCode,
        category_name: categoryName,
        observation_year: OBSERVATION_YEAR,
        emission_gg_co2: round(value),
        emission_gg_substance: round(value),
        source_unit: 'Gg fossil CO2 per year',
        substance: row.Substance || 'CO2',
        fossil_bio: row.fossil_bio || 'fossil',
        source_reported_uncertainty: null,
        uncertainty_status: 'not_reported_in_source_workbook',
        source_locator: `${DATASET_URL}#p1; workbook ${CO2_WORKBOOK_NAME}; sheet IPCC 2006; category ${categoryCode}; fossil_bio ${row.fossil_bio || 'fossil'}; Y_${OBSERVATION_YEAR}`
      });
      if (!totalsByCountry.has(countryCode)) {
        totalsByCountry.set(countryCode, {
          country_code: countryCode,
          country_name: countryName,
          country_group: row.C_group_IM24_sh || null,
          ipcc_annex: row.IPCC_annex || null,
          value: 0,
          category_count: 0
        });
      }
      const total = totalsByCountry.get(countryCode);
      total.value += value;
      total.category_count += 1;
    }

    const totalRecords = [...totalsByCountry.values()].map(total => ({
      record_id: `edgar_2025_co2_${total.country_code}_TOTAL_${OBSERVATION_YEAR}`,
      metric_id: 'territorial_fossil_and_industrial_co2_emissions',
      measurement_role: 'country_total_derived_from_disjoint_ipcc_2006_categories',
      country_code: total.country_code,
      country_name: total.country_name,
      country_group: total.country_group,
      ipcc_annex: total.ipcc_annex,
      category_code: 'TOTAL_DERIVED',
      category_name: 'Sum of source-reported IPCC 2006 fossil CO2 categories in the workbook',
      observation_year: OBSERVATION_YEAR,
      emission_gg_co2: round(total.value),
      emission_gg_substance: round(total.value),
      source_unit: 'Gg fossil CO2 per year',
      substance: 'CO2',
      fossil_bio: 'fossil',
      source_category_count: total.category_count,
      source_reported_uncertainty: null,
      uncertainty_status: 'not_reported_in_source_workbook',
      source_locator: `${DATASET_URL}#p1; workbook ${CO2_WORKBOOK_NAME}; sheet IPCC 2006; derived sum across source categories; Y_${OBSERVATION_YEAR}`
    }));

    const methaneSectorRecords = [];
    const methaneTotalsByCountry = new Map();
    for (const row of methaneSourceRows) {
      const value = Number(row[`Y_${OBSERVATION_YEAR}`]);
      const countryCode = String(row.Country_code_A3 || '').trim();
      const countryName = String(row.Name || '').trim();
      const categoryCode = String(row.ipcc_code_2006_for_standard_report || '').trim();
      const categoryName = String(row.ipcc_code_2006_for_standard_report_name || '').trim();
      if (!countryCode || !countryName || !categoryCode || !Number.isFinite(value)) continue;
      const direct = METHANE_DIRECT_BINDINGS[categoryCode] || null;
      methaneSectorRecords.push({
        record_id: `edgar_2025_ch4_${countryCode}_${idToken(categoryCode)}_${idToken(row.fossil_bio || 'not_applicable')}_${OBSERVATION_YEAR}`,
        metric_id: direct?.metric_id || 'edgar_methane_by_ipcc_2006_category',
        measurement_role: direct?.measurement_role || 'source_category_context_for_anthropogenic_methane_total',
        country_code: countryCode,
        country_name: countryName,
        country_group: row.C_group_IM24_sh || null,
        ipcc_annex: row.IPCC_annex || null,
        category_code: categoryCode,
        category_name: categoryName,
        observation_year: OBSERVATION_YEAR,
        emission_gg_substance: round(value),
        emission_mt_ch4: round(value / 1000),
        source_unit: 'kton CH4 per year',
        substance: row.Substance || 'CH4',
        fossil_bio: row.fossil_bio || 'not_applicable',
        source_reported_uncertainty: null,
        uncertainty_status: 'not_reported_in_source_workbook',
        source_locator: `${DATASET_URL}#p1; workbook ${CH4_WORKBOOK_NAME}; sheet IPCC 2006; category ${categoryCode}; fossil_bio ${row.fossil_bio || 'not_applicable'}; Y_${OBSERVATION_YEAR}`
      });
      if (!methaneTotalsByCountry.has(countryCode)) methaneTotalsByCountry.set(countryCode, {
        country_code: countryCode,
        country_name: countryName,
        country_group: row.C_group_IM24_sh || null,
        ipcc_annex: row.IPCC_annex || null,
        value: 0,
        category_count: 0
      });
      const total = methaneTotalsByCountry.get(countryCode);
      total.value += value;
      total.category_count += 1;
    }

    const methaneTotalRecords = [...methaneTotalsByCountry.values()].map(total => ({
      record_id: `edgar_2025_ch4_${total.country_code}_TOTAL_${OBSERVATION_YEAR}`,
      metric_id: 'anthropogenic_methane_emissions',
      measurement_role: 'country_total_derived_from_disjoint_edgar_ch4_ipcc_2006_categories',
      country_code: total.country_code,
      country_name: total.country_name,
      country_group: total.country_group,
      ipcc_annex: total.ipcc_annex,
      category_code: 'TOTAL_DERIVED',
      category_name: 'Sum of source-reported IPCC 2006 methane categories in the workbook',
      observation_year: OBSERVATION_YEAR,
      emission_gg_substance: round(total.value),
      emission_mt_ch4: round(total.value / 1000),
      source_unit: 'kton CH4 per year',
      substance: 'CH4',
      fossil_bio: 'not_applicable',
      source_category_count: total.category_count,
      source_reported_uncertainty: null,
      uncertainty_status: 'not_reported_in_source_workbook',
      source_locator: `${DATASET_URL}#p1; workbook ${CH4_WORKBOOK_NAME}; sheet IPCC 2006; derived sum across source categories; Y_${OBSERVATION_YEAR}`
    }));

    const nitrousOxideSectorRecords = [];
    const nitrousOxideTotalsByCountry = new Map();
    for (const row of nitrousOxideSourceRows) {
      const value = Number(row[`Y_${OBSERVATION_YEAR}`]);
      const countryCode = String(row.Country_code_A3 || '').trim();
      const countryName = String(row.Name || '').trim();
      const categoryCode = String(row.ipcc_code_2006_for_standard_report || '').trim();
      const categoryName = String(row.ipcc_code_2006_for_standard_report_name || '').trim();
      if (!countryCode || !countryName || !categoryCode || !Number.isFinite(value)) continue;
      nitrousOxideSectorRecords.push({
        record_id: `edgar_2025_n2o_${countryCode}_${idToken(categoryCode)}_${idToken(row.fossil_bio || 'not_applicable')}_${OBSERVATION_YEAR}`,
        metric_id: 'edgar_nitrous_oxide_by_ipcc_2006_category',
        measurement_role: 'source_category_context_for_anthropogenic_nitrous_oxide_total',
        country_code: countryCode,
        country_name: countryName,
        country_group: row.C_group_IM24_sh || null,
        ipcc_annex: row.IPCC_annex || null,
        category_code: categoryCode,
        category_name: categoryName,
        observation_year: OBSERVATION_YEAR,
        emission_gg_substance: round(value),
        emission_mt_n2o: round(value / 1000),
        source_unit: 'kton N2O per year',
        substance: row.Substance || 'N2O',
        fossil_bio: row.fossil_bio || 'not_applicable',
        source_reported_uncertainty: null,
        uncertainty_status: 'not_reported_in_source_workbook',
        source_locator: `${DATASET_URL}#p1; workbook ${N2O_WORKBOOK_NAME}; sheet IPCC 2006; category ${categoryCode}; fossil_bio ${row.fossil_bio || 'not_applicable'}; Y_${OBSERVATION_YEAR}`
      });
      if (!nitrousOxideTotalsByCountry.has(countryCode)) nitrousOxideTotalsByCountry.set(countryCode, {
        country_code: countryCode,
        country_name: countryName,
        country_group: row.C_group_IM24_sh || null,
        ipcc_annex: row.IPCC_annex || null,
        value: 0,
        category_count: 0
      });
      const total = nitrousOxideTotalsByCountry.get(countryCode);
      total.value += value;
      total.category_count += 1;
    }

    const nitrousOxideTotalRecords = [...nitrousOxideTotalsByCountry.values()].map(total => ({
      record_id: `edgar_2025_n2o_${total.country_code}_TOTAL_${OBSERVATION_YEAR}`,
      metric_id: 'anthropogenic_nitrous_oxide_emissions',
      measurement_role: 'country_total_derived_from_disjoint_edgar_n2o_ipcc_2006_categories',
      country_code: total.country_code,
      country_name: total.country_name,
      country_group: total.country_group,
      ipcc_annex: total.ipcc_annex,
      category_code: 'TOTAL_DERIVED',
      category_name: 'Sum of source-reported IPCC 2006 nitrous-oxide categories in the workbook',
      observation_year: OBSERVATION_YEAR,
      emission_gg_substance: round(total.value),
      emission_mt_n2o: round(total.value / 1000),
      source_unit: 'kton N2O per year',
      substance: 'N2O',
      fossil_bio: 'not_applicable',
      source_category_count: total.category_count,
      source_reported_uncertainty: null,
      uncertainty_status: 'not_reported_in_source_workbook',
      source_locator: `${DATASET_URL}#p1; workbook ${N2O_WORKBOOK_NAME}; sheet IPCC 2006; derived sum across source categories; Y_${OBSERVATION_YEAR}`
    }));

    const globalTimeSeries = [
      ...Object.entries(DIRECT_BINDINGS).flatMap(([categoryCode, binding]) => globalAnnualSeries(
        sourceRows.filter(row => String(row.ipcc_code_2006_for_standard_report || '').trim() === categoryCode),
        {
          nodeId: binding.node_id,
          metricId: binding.metric_id,
          measurementRole: `${binding.measurement_role}_global_annual_history`,
          substance: 'CO2',
          workbookName: CO2_WORKBOOK_NAME,
          categoryCode
        }
      )),
      ...globalAnnualSeries(nitrousOxideSourceRows, {
        nodeId: 'nitrous_oxide',
        metricId: 'anthropogenic_nitrous_oxide_emissions',
        measurementRole: 'global_total_derived_from_disjoint_edgar_n2o_ipcc_2006_categories',
        substance: 'N2O',
        workbookName: N2O_WORKBOOK_NAME
      }),
      ...Object.entries(METHANE_DIRECT_BINDINGS).flatMap(([categoryCode, binding]) => globalAnnualSeries(
        methaneSourceRows.filter(row => String(row.ipcc_code_2006_for_standard_report || '').trim() === categoryCode),
        {
          nodeId: binding.node_id,
          metricId: binding.metric_id,
          measurementRole: `${binding.measurement_role}_global_annual_history`,
          substance: 'CH4',
          workbookName: CH4_WORKBOOK_NAME,
          categoryCode
        }
      )),
      ...globalAnnualSeries(carbonMonoxideSourceRows, {
        nodeId: 'carbon_monoxide',
        metricId: 'carbon_monoxide_emission_or_concentration',
        measurementRole: 'global_total_derived_from_disjoint_edgar_co_ipcc_2006_categories',
        substance: 'CO',
        workbookName: CO_WORKBOOK_NAME,
        datasetUrl: AIR_POLLUTANT_DATASET_URL
      }),
      ...globalAnnualSeries(sulfurDioxideSourceRows, {
        nodeId: 'sulfur_dioxide',
        metricId: 'sulfur_dioxide_emission_or_ambient_concentration',
        measurementRole: 'global_total_derived_from_disjoint_edgar_so2_ipcc_2006_categories',
        substance: 'SO2',
        workbookName: SO2_WORKBOOK_NAME,
        datasetUrl: AIR_POLLUTANT_DATASET_URL
      })
    ];

    const records = [...sectorRecords, ...totalRecords, ...methaneSectorRecords, ...methaneTotalRecords, ...nitrousOxideSectorRecords, ...nitrousOxideTotalRecords].sort((a, b) =>
      a.country_code.localeCompare(b.country_code) || String(a.substance).localeCompare(String(b.substance)) || a.category_code.localeCompare(b.category_code)
    );
    const snapshot = snapshotEnvelope({
      jobId: 'fetch_edgar_2025_sector_country_ghg',
      source: {
        id: 'edgar_global_emissions_database',
        name: 'EDGAR 2025 GHG and v8.1 air-pollutant histories',
        publisher: 'European Commission Joint Research Centre and International Energy Agency',
        product: 'IEA-EDGAR fossil CO2, EDGAR CH4 and EDGAR N2O annual totals through 2024 plus EDGAR v8.1 CO and SO2 annual totals through 2022',
        dataset_url: DATASET_URL,
        documentation_url: DATASET_URL,
        report_url: 'https://edgar.jrc.ec.europa.eu/report_2025',
        release: 'EDGAR_2025_GHG'
      },
      request: {
        workbooks: [CO2_WORKBOOK_NAME, CH4_WORKBOOK_NAME, N2O_WORKBOOK_NAME, CO_WORKBOOK_NAME, SO2_WORKBOOK_NAME],
        sheet: 'IPCC 2006',
        observation_year: OBSERVATION_YEAR,
        source_unit: 'Gg substance per year',
        selected_substances: ['CO2', 'CH4', 'N2O', 'CO', 'SO2'],
        selected_fossil_bio: 'fossil for CO2; not applicable to the methane and nitrous-oxide workbooks'
      },
      contractIds: [...new Set(bindingEntries.map(binding => binding.metric_id))],
      contractBindings: bindingEntries.map(binding => ({
        node_id: binding.node_id,
        metric_id: binding.metric_id,
        measurement_role: binding.measurement_role
      })),
      cadence: 'annual release check with full workbook replacement when EDGAR publishes a new GHG release',
      provenance: 'Official EDGAR_2025_GHG fossil CO2, methane and nitrous-oxide workbooks and official EDGAR v8.1 carbon-monoxide and sulfur-dioxide workbooks, IPCC 2006 sheets, country or territory rows and source-reported category values. Global histories are transparent sums of disjoint source category rows.',
      uncertainty: 'The workbooks do not report observation-level numeric uncertainty. Activity data, emission factors, country allocation, sector classification, international bunker treatment, revisions and category coverage affect values. Air-pollutant emissions are inventories, not ambient concentrations or attributable health burdens.',
      records,
      sourceSummary: {
        source_row_count: sourceRows.length + methaneSourceRows.length + nitrousOxideSourceRows.length + carbonMonoxideSourceRows.length + sulfurDioxideSourceRows.length,
        co2_source_row_count: sourceRows.length,
        methane_source_row_count: methaneSourceRows.length,
        nitrous_oxide_source_row_count: nitrousOxideSourceRows.length,
        carbon_monoxide_source_row_count: carbonMonoxideSourceRows.length,
        sulfur_dioxide_source_row_count: sulfurDioxideSourceRows.length,
        sector_record_count: sectorRecords.length + methaneSectorRecords.length + nitrousOxideSectorRecords.length,
        co2_sector_record_count: sectorRecords.length,
        methane_sector_record_count: methaneSectorRecords.length,
        nitrous_oxide_sector_record_count: nitrousOxideSectorRecords.length,
        derived_country_total_record_count: totalRecords.length + methaneTotalRecords.length + nitrousOxideTotalRecords.length,
        co2_country_total_record_count: totalRecords.length,
        methane_country_total_record_count: methaneTotalRecords.length,
        nitrous_oxide_country_total_record_count: nitrousOxideTotalRecords.length,
        country_or_territory_count: new Set([...totalsByCountry.keys(), ...methaneTotalsByCountry.keys(), ...nitrousOxideTotalsByCountry.keys()]).size,
        category_count: new Set([...sectorRecords, ...methaneSectorRecords, ...nitrousOxideSectorRecords].map(record => `${record.substance}:${record.category_code}`)).size,
        observation_year: OBSERVATION_YEAR,
        source_reported_uncertainty_available: false,
        global_time_series_record_count: globalTimeSeries.length,
        global_time_series_node_count: new Set(globalTimeSeries.map(record => record.node_id)).size,
        direct_metric_binding_count: Object.keys(DIRECT_BINDINGS).length + Object.keys(METHANE_DIRECT_BINDINGS).length + 5,
        supporting_metric_binding_count: Object.keys(SUPPORTING_BINDINGS).length
      },
      additional: {
        global_time_series: globalTimeSeries,
        version: 'edgar_2025_ghg_contract_bound_v1',
        license_note: 'EDGAR page states CC BY 4.0 unless otherwise noted; IEA-EDGAR CO2 carries additional CC BY-NC-ND 4.0 terms. Preserve attribution and consult the source terms for reuse.',
        data_boundary: 'Fossil CO2, anthropogenic CH4 and anthropogenic N2O in the official 1970–2024 annual workbooks, plus anthropogenic CO and SO2 in the official 1970–2022 air-pollutant workbooks. Large-scale biomass burning, forest fires and LULUCF sources and sinks are excluded.',
        value_semantics: 'One Gg equals one kilotonne. Source values remain in Gg or kton substance per year; methane and nitrous-oxide totals expose the exact division by 1000 to million tonnes substance per year. No fabricated uncertainty interval is added.'
      }
    });
    await writeSnapshot(ROOT, 'edgar-snapshot.json', snapshot);
    console.log(JSON.stringify({
      output: path.join(ROOT, 'public', 'edgar-snapshot.json'),
      records: records.length,
      sector_records: sectorRecords.length + methaneSectorRecords.length,
      country_totals: totalRecords.length + methaneTotalRecords.length,
      countries_or_territories: snapshot.source_summary.country_or_territory_count,
      categories: snapshot.source_summary.category_count,
      metric_contracts: snapshot.metric_contract_ids.length,
      global_time_series_records: snapshot.global_time_series.length,
      global_time_series_nodes: new Set(snapshot.global_time_series.map(record => record.node_id)).size
    }, null, 2));
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
