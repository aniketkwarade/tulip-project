import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { strFromU8, unzipSync } from 'fflate';

import { readMetricContracts, snapshotEnvelope, writeSnapshot } from './lib/contract-snapshot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EXPLORER_URL = 'https://lancetcountdown.org/explore-our-data/';
const REPORT_DOI = 'https://doi.org/10.1016/S0140-6736(25)01919-1';
const LICENSE_URL = 'https://creativecommons.org/licenses/by-nc-sa/4.0/';

const WORKBOOKS = Object.freeze({
  mortality: {
    indicator: '1.1.5',
    url: 'https://lancetcountdown.org/wp-content/uploads/2025/10/Indicator-1.1.5_Data-Download_2025-Lancet-Countdown-Report-1.xlsx'
  },
  labour: {
    indicator: '1.1.3',
    url: 'https://lancetcountdown.org/wp-content/uploads/2025/10/Indicator-1.1.3_PWHL_Data-Download_2025-Lancet-Countdown-Report_v2-1.xlsx'
  },
  dengue: {
    indicator: '1.3.1',
    url: 'https://lancetcountdown.org/wp-content/uploads/2025/10/Indicator-1.3.1_Data-Download_2025-Lancet-Countdown-Report_Oct-1.xlsx'
  },
  malaria: {
    indicator: '1.3.2',
    url: 'https://lancetcountdown.org/wp-content/uploads/2025/10/Indicator-1.3.2_Data-Download_2025-Lancet-Countdown-Report-1.xlsx'
  }
});

const BINDINGS = Object.freeze([
  { node_id: 'public_health_heat_burden', metric_id: 'heat_attributable_mortality_rate', measurement_role: 'global_and_who_region_modelled_heat_attributable_mortality' },
  { node_id: 'heatwave_excess_mortality_rates', metric_id: 'heat_attributable_mortality_rate', measurement_role: 'global_and_who_region_modelled_heat_attributable_mortality' },
  { node_id: 'heat_related_mortality_burden', metric_id: 'heat_attributable_deaths', measurement_role: 'global_and_who_region_modelled_heat_attributable_mortality' },
  { node_id: 'occupational_heat_exposure', metric_id: 'heat_related_working_hour_loss', measurement_role: 'global_time_series_and_latest_country_modelled_potential_work_hours_lost' },
  { node_id: 'farm_heat_stress', metric_id: 'agricultural_potential_work_hours_lost_to_heat', measurement_role: 'global_time_series_and_latest_country_agricultural_potential_work_hours_lost' },
  { node_id: 'vector_borne_disease_expansion', metric_id: 'vbd_climate_suitability_and_transmission_season', measurement_role: 'disease_specific_global_time_series_and_latest_who_region_modelled_climate_suitability' }
]);

function decodeXml(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
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
  const [headerRow = [], ...dataRows] = rows;
  const headers = headerRow.map(header => String(header ?? '').trim());
  return dataRows.map(row => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? null])));
}

async function fetchWorkbook(definition) {
  const response = await fetch(definition.url, {
    headers: { 'User-Agent': 'LostPlanet-Northstar/1.0 (+contract-bound Lancet Countdown ingestion)' }
  });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${definition.url}`);
  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
  const readText = member => {
    if (!archive[member]) throw new Error(`Workbook member missing: ${member} in indicator ${definition.indicator}`);
    return strFromU8(archive[member]);
  };
  const workbookXml = readText('xl/workbook.xml');
  const relationshipsXml = readText('xl/_rels/workbook.xml.rels');
  const sharedStrings = archive['xl/sharedStrings.xml'] ? parseSharedStrings(strFromU8(archive['xl/sharedStrings.xml'])) : [];
  const targets = sheetTargets(workbookXml, relationshipsXml);
  return {
    definition,
    sheet(name) {
      const target = targets.get(name);
      if (!target) throw new Error(`Worksheet ${name} missing in indicator ${definition.indicator}`);
      return tableRecords(parseWorksheet(readText(target), sharedStrings));
    }
  };
}

const finite = value => Number.isFinite(Number(value));
const round = (value, digits = 6) => Number.isFinite(Number(value)) ? Number(Number(value).toFixed(digits)) : null;
const slug = value => String(value || '').trim().toLowerCase().replaceAll(/[^a-z0-9]+/g, '_').replaceAll(/^_+|_+$/g, '');

function baseRecord({ id, metricId, nodeId, component, geographyType, geographyName, year, value, unit, workbook, sheet, method, extra = {} }) {
  return {
    record_id: id,
    metric_id: metricId,
    node_id: nodeId,
    indicator_component: component,
    geography_type: geographyType,
    geography_name: geographyName,
    observation_year: Number(year),
    value: round(value),
    unit,
    evidence_design: 'provider_modelled_indicator_estimate',
    method_boundary: method,
    uncertainty_status: 'modelled_point_estimate_without_observation_level_interval_in_download',
    source_locator: workbook.definition.url,
    source_table_locator: `${sheet}; source columns retained in component-specific fields`,
    source_indicator: workbook.definition.indicator,
    ...extra
  };
}

function mortalityRecords(workbook) {
  const sourceRows = [
    ...workbook.sheet('2025 Report Data_Global').map(row => ({ ...row, geography_type: 'global', geography_name: 'World', sheet: '2025 Report Data_Global' })),
    ...workbook.sheet('2025 Report Data_WHO').map(row => ({ ...row, geography_type: 'who_region', geography_name: row['WHO Region'], sheet: '2025 Report Data_WHO' }))
  ].filter(row => finite(row.Year) && finite(row.AF) && finite(row.AN) && row.geography_name);
  const method = 'Lancet Countdown three-stage heat-mortality model: location-specific quasi-Poisson distributed-lag nonlinear models, multilevel meta-regression, and meta-predicted exposure-response associations; AF is percent of all deaths attributable to heat and AN is attributable deaths.';
  return BINDINGS.filter(binding => ['public_health_heat_burden', 'heatwave_excess_mortality_rates', 'heat_related_mortality_burden'].includes(binding.node_id)).flatMap(binding =>
    sourceRows.map(row => baseRecord({
      id: `lancet_${binding.node_id}_${binding.metric_id}_${slug(row.geography_name)}_${row.Year}`,
      metricId: binding.metric_id,
      nodeId: binding.node_id,
      component: 'heat_attributable_mortality',
      geographyType: row.geography_type,
      geographyName: row.geography_name,
      year: row.Year,
      value: row.AN,
      unit: 'deaths',
      workbook,
      sheet: row.sheet,
      method,
      extra: {
        heat_attributable_deaths: round(row.AN, 0),
        heat_attributable_fraction_pct: round(row.AF),
        secondary_unit: 'percent_of_all_deaths'
      }
    }))
  );
}

function labourRecords(workbook) {
  const countryRows = workbook.sheet('2025 Report Data_Country').filter(row => Number(row.Year) === 2024 && row.ISO3);
  const globalRows = workbook.sheet('2025 Report Data_Global').map(row => ({ ...row, Country: 'World', ISO3: 'WLD' }));
  const sourceRows = [...globalRows, ...countryRows];
  const configs = [
    {
      node_id: 'occupational_heat_exposure', metric_id: 'heat_related_working_hour_loss', component: 'total_potential_work_hours_lost', source_fields: ['TotalSunAgCon', 'TotalsunAgCon'],
      method: 'Modeled potential work hours lost across service and manufacturing work in shade plus agriculture and construction work in sun, using WBGT, sector employment, population aged 15+, and sector-specific metabolic rates.'
    },
    {
      node_id: 'farm_heat_stress', metric_id: 'agricultural_potential_work_hours_lost_to_heat', component: 'agricultural_potential_work_hours_lost', source_fields: ['WHL400sunAgr'],
      method: 'Modeled agricultural potential work hours lost for formal agricultural employment under the source 400 W metabolic-rate, sun-exposure assumption; country-average sector distributions do not capture subnational variation.'
    }
  ];
  return configs.flatMap(config => sourceRows.map(row => ({ row, sourceValue: config.source_fields.map(field => row[field]).find(finite) }))
    .filter(({ row, sourceValue }) => finite(row.Year) && finite(sourceValue)).map(({ row, sourceValue }) => baseRecord({
    id: `lancet_${config.metric_id}_${slug(row.ISO3 || row.Country)}_${row.Year}`,
    metricId: config.metric_id,
    nodeId: config.node_id,
    component: config.component,
    geographyType: row.ISO3 === 'WLD' ? 'global' : 'country_or_area',
    geographyName: row.Country,
    year: row.Year,
    value: Number(sourceValue) * 1000,
    unit: 'potential_work_hours_lost_per_year',
    workbook,
    sheet: row.ISO3 === 'WLD' ? '2025 Report Data_Global' : '2025 Report Data_Country',
    method: config.method,
    extra: {
      iso3: row.ISO3,
      source_value_thousand_hours: round(sourceValue),
      employed_population_15_plus: finite(row['EmplPop 15+']) ? round(row['EmplPop 15+'], 0) : finite(row['EmplPop15+']) ? round(row['EmplPop15+'], 0) : null,
      source_unit: 'thousand_hours'
    }
  })));
}

function latestYear(rows) {
  return Math.max(...rows.map(row => Number(row.Year)).filter(Number.isFinite));
}

function dengueRecords(workbook) {
  const global = workbook.sheet('2025 Report Data_Global').map(row => ({ ...row, geography_type: 'global', geography_name: 'World', sheet: '2025 Report Data_Global' }));
  const who = workbook.sheet('2025 Report Data_WHO');
  const latest = latestYear(who);
  const regional = who.filter(row => Number(row.Year) === latest).map(row => ({ ...row, geography_type: 'who_region', geography_name: row.WHO, sheet: '2025 Report Data_WHO' }));
  return [...global, ...regional].filter(row => finite(row.Year) && finite(row.AbsoluteR0) && row.Species && row.geography_name).map(row => baseRecord({
    id: `lancet_vbd_dengue_${slug(row.Species)}_${slug(row.geography_name)}_${row.Year}`,
    metricId: 'vbd_climate_suitability_and_transmission_season',
    nodeId: 'vector_borne_disease_expansion',
    component: 'dengue_climate_defined_transmission_potential',
    geographyType: row.geography_type,
    geographyName: row.geography_name,
    year: row.Year,
    value: row.AbsoluteR0,
    unit: 'dimensionless_basic_reproduction_number',
    workbook,
    sheet: row.sheet,
    method: 'Mechanistic dengue transmission-potential model integrating temperature, rainfall, daylight duration, human population density, and mosquito species; humidity, mobility, social interaction, vector control, immunity, and observed cases are not included.',
    extra: { vector_species: row.Species, disease: 'dengue' }
  }));
}

function malariaRecords(workbook) {
  const global = workbook.sheet('2025 Report Data_Global').map(row => ({ ...row, geography_type: 'global', geography_name: 'World', sheet: '2025 Report Data_Global' }));
  const who = workbook.sheet('2025 Report Data_WHO');
  const latest = latestYear(who);
  const regional = who.filter(row => Number(row.Year) === latest).map(row => ({ ...row, geography_type: 'who_region', geography_name: row['WHO region'], sheet: '2025 Report Data_WHO' }));
  const rows = [...global, ...regional];
  const parasites = [
    { field: 'suitabilityFalciparum', parasite: 'Plasmodium falciparum' },
    { field: 'suitabilityVivax', parasite: 'Plasmodium vivax' }
  ];
  return rows.flatMap(row => parasites.filter(item => finite(row[item.field])).map(item => baseRecord({
    id: `lancet_vbd_malaria_${slug(item.parasite)}_${slug(row.geography_name)}_${row.Year}`,
    metricId: 'vbd_climate_suitability_and_transmission_season',
    nodeId: 'vector_borne_disease_expansion',
    component: 'malaria_climate_suitable_transmission_season',
    geographyType: row.geography_type,
    geographyName: row.geography_name,
    year: row.Year,
    value: row[item.field],
    unit: 'months_climatically_suitable_per_year',
    workbook,
    sheet: row.sheet,
    method: 'Grid-based climate-suitability model using temperature, precipitation, and relative-humidity thresholds for parasite-specific transmission-season length; it does not measure malaria cases, vector-control coverage, immunity, health access, or population exposure.',
    extra: { parasite: item.parasite, disease: 'malaria' }
  })));
}

async function main() {
  const contracts = await readMetricContracts(ROOT);
  for (const binding of BINDINGS) {
    if (!contracts[binding.node_id]) throw new Error(`Missing node metric contract for ${binding.node_id}`);
    if (contracts[binding.node_id].metric_id !== binding.metric_id) {
      throw new Error(`Metric mismatch for ${binding.node_id}: ${contracts[binding.node_id].metric_id} !== ${binding.metric_id}`);
    }
  }

  const [mortality, labour, dengue, malaria] = await Promise.all(Object.values(WORKBOOKS).map(fetchWorkbook));
  const records = [
    ...mortalityRecords(mortality),
    ...labourRecords(labour),
    ...dengueRecords(dengue),
    ...malariaRecords(malaria)
  ];
  const ids = new Set(records.map(record => record.record_id));
  if (ids.size !== records.length) throw new Error(`Duplicate record IDs: ${records.length - ids.size}`);
  if (records.some(record => !record.metric_id || !record.node_id || !record.indicator_component || !record.geography_name || !Number.isFinite(record.observation_year) || !Number.isFinite(record.value) || !record.unit || !record.source_locator)) {
    throw new Error('Required heat-health record field missing or invalid');
  }
  const componentCounts = Object.fromEntries([...new Set(records.map(record => record.indicator_component))].map(component => [
    component,
    records.filter(record => record.indicator_component === component).length
  ]));
  if ((componentCounts.heat_attributable_mortality || 0) < 400) throw new Error('Heat-mortality panel is unexpectedly small');
  if ((componentCounts.total_potential_work_hours_lost || 0) < 200 || (componentCounts.agricultural_potential_work_hours_lost || 0) < 200) throw new Error('Labour-capacity panel is unexpectedly small');
  if ((componentCounts.dengue_climate_defined_transmission_potential || 0) < 150 || (componentCounts.malaria_climate_suitable_transmission_season || 0) < 150) throw new Error('Vector-suitability panel is unexpectedly small');

  const latestGlobalMortality = records.find(record => record.metric_id === 'heat_attributable_deaths' && record.geography_type === 'global' && record.observation_year === 2021);
  const latestGlobalLabour = records.find(record => record.metric_id === 'heat_related_working_hour_loss' && record.geography_type === 'global' && record.observation_year === 2024);
  if (latestGlobalMortality?.heat_attributable_deaths !== 558304) throw new Error('Lancet global 2021 mortality check failed');
  if (!latestGlobalLabour || Math.abs(latestGlobalLabour.value - 639855005650) > 1) throw new Error('Lancet global 2024 labour-hours check failed');

  const snapshot = snapshotEnvelope({
    jobId: 'fetch_lancet_countdown_heat_health_metrics',
    source: {
      id: 'lancet_countdown_data_explorer',
      name: 'Lancet Countdown Data Explorer',
      publisher: 'Lancet Countdown',
      report: 'The 2025 report of the Lancet Countdown on health and climate change',
      report_doi: REPORT_DOI,
      explorer_url: EXPLORER_URL,
      license: 'CC BY-NC-SA 4.0',
      license_url: LICENSE_URL,
      commercial_use_permitted: false
    },
    request: {
      indicator_workbooks: Object.fromEntries(Object.entries(WORKBOOKS).map(([key, value]) => [key, value.url])),
      retained_geographies: 'Complete global time series; complete WHO-region mortality time series; latest WHO-region vector-suitability observations; latest country labour observations plus complete global labour time series.',
      country_labour_year: 2024,
      source_release: '2025 report downloads, published October 2025'
    },
    contractIds: BINDINGS.map(binding => binding.metric_id),
    contractBindings: BINDINGS.map(binding => ({ node_id: binding.node_id, metric_id: binding.metric_id, measurement_role: binding.measurement_role })),
    cadence: 'Annual release check with full workbook replacement after the Lancet Countdown report and indicator downloads are published.',
    provenance: 'Source-native Lancet Countdown 2025 indicator workbooks. The pipeline preserves disease, species or parasite, geography, year, source units, model boundary, and source workbook locator; thousand-hour labour values are converted exactly to hours.',
    uncertainty: 'The downloads provide modelled point estimates but no observation-level uncertainty intervals. Mortality meta-prediction, WBGT and employment assumptions, country-average sector allocation, disease-model omissions, reanalysis input, population data, and revisions affect estimates.',
    failureBehavior: 'Retain the last validated release and mark stale; reject missing workbooks, sheets, required columns, duplicate IDs, invalid values, truncated panels, or failed source-value checks; never infer deaths from heat exposure alone, cases from climate suitability, or agricultural exposure from all outdoor workers.',
    records,
    sourceSummary: {
      records: records.length,
      component_counts: componentCounts,
      latest_global_heat_attributable_deaths_2021: latestGlobalMortality.heat_attributable_deaths,
      latest_global_heat_attributable_fraction_pct_2021: latestGlobalMortality.heat_attributable_fraction_pct,
      latest_global_potential_work_hours_lost_2024: latestGlobalLabour.value,
      raw_workbook_unit_conversion: 'Labour workbook values reported in thousands of hours are multiplied by exactly 1000.',
      license_use_boundary: 'Redistribution and derived use must remain non-commercial and share-alike unless separately licensed.'
    },
    caveats: [
      'Heat-attributable mortality is modelled relative to a minimum-mortality-temperature counterfactual; it is not a death-certificate count and the download does not provide observation-level intervals.',
      'Potential work hours lost are modelled capacity loss, not observed absence, injury, productivity, wages, or every informal-work arrangement.',
      'Dengue R0 and malaria suitable-season length are climate-suitability indicators, not observed infections, incidence, geographic range occupation, or causal attribution to warming alone.',
      'The source workbook license is CC BY-NC-SA 4.0; this public snapshot must not be used commercially without separate permission.'
    ]
  });

  const output = await writeSnapshot(ROOT, 'heat-health-snapshot.json', snapshot);
  console.log(JSON.stringify({ output, records: records.length, component_counts: componentCounts, metric_contracts: snapshot.metric_contract_ids }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
