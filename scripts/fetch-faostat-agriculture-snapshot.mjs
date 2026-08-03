import { createWriteStream } from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import readline from 'node:readline';
import { spawn, execFileSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const MANIFEST_URL = 'https://bulks-faostat.fao.org/production/datasets_E.json';
const DATASET_CODES = ['QCL', 'RFN', 'FBS', 'RFB', 'GV'];
const START_YEAR = 1961;
const CROP_ITEMS = new Set(['Wheat', 'Maize (corn)', 'Rice']);
const LIVESTOCK_ITEMS = new Set(['Cattle', 'Chickens', 'Pigs']);
const FERTILIZER_ITEMS = new Set([
  'Nutrient nitrogen N (total)',
  'Nutrient phosphate P2O5 (total)',
  'Nutrient potash K2O (total)'
]);
const FOOD_BALANCE_ITEMS = new Map([
  ['Cereals - Excluding Beer', '2905'],
  ['Meat', '2943'],
  ['Milk - Excluding Butter', '2848']
]);
const FOOD_BALANCE_ELEMENTS = new Set([
  'Domestic supply quantity',
  'Production',
  'Import quantity',
  'Export quantity',
  'Stock Variation',
  'Food',
  'Feed'
]);

function parseCsvLine(line) {
  const fields = [];
  let value = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === ',' && !quoted) {
      fields.push(value);
      value = '';
    } else {
      value += char;
    }
  }
  fields.push(value);
  return fields;
}

function stableIdToken(value, fallback = 'not-reported') {
  const token = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return token || fallback;
}

async function download(url, target) {
  const response = await fetch(url, { headers: { 'user-agent': 'TULIP-Northstar/1.0 (source snapshot)' } });
  if (!response.ok || !response.body) throw new Error(`FAOSTAT download failed: ${response.status} ${url}`);
  await pipeline(Readable.fromWeb(response.body), createWriteStream(target));
}

function normalizedCsvEntry(archivePath) {
  const entries = execFileSync('unzip', ['-Z1', archivePath], { encoding: 'utf8' })
    .split(/\r?\n/)
    .filter(Boolean);
  const entry = entries.find(name => name.endsWith('_All_Data_(Normalized).csv'));
  if (!entry) throw new Error(`No normalized data CSV found in ${archivePath}`);
  return entry;
}

async function readSelectedRows(archivePath, entryName, datasetCode, releaseDate, sourceUrl) {
  const child = spawn('unzip', ['-p', archivePath, entryName], { stdio: ['ignore', 'pipe', 'inherit'] });
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  let headers = null;
  const records = [];
  const foodImportComponents = [];
  for await (const line of lines) {
    if (!headers) {
      headers = parseCsvLine(line);
      continue;
    }
    const fields = parseCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, fields[index] ?? '']));
    const year = Number(row.Year);
    if (!Number.isInteger(year) || year < START_YEAR) continue;
    const isWorld = row.Area === 'World';
    const areaCodeM49 = String(row['Area Code (M49)'] || '').replace(/^'/, '');
    const isReportedGeography = Boolean(areaCodeM49) && !isWorld;

    if (datasetCode === 'GV'
      && (isReportedGeography || isWorld)
      && row.Item === 'Drained organic soils'
      && ['Area', 'Emissions (CO2)'].includes(row.Element)) {
      const numericValue = Number(row.Value);
      if (!Number.isFinite(numericValue)) continue;
      const isArea = row.Element === 'Area';
      const sourceMethod = row.Source || 'not reported';
      const sourceMethodId = stableIdToken(sourceMethod);
      const isFaoTier1 = sourceMethod === 'FAO TIER 1';
      const isUnfccc = sourceMethod === 'UNFCCC';
      records.push({
        record_id: `gv-drained-organic-soils-${isArea ? 'area' : 'co2'}-${areaCodeM49 || 'world'}-${year}-${sourceMethodId}`,
        metric_id: isArea ? 'wetland_area_drained_or_converted' : 'drained_peat_co2_flux',
        component: isArea ? 'agricultural_drained_organic_soil_area' : 'agricultural_drained_organic_soil_total_co2',
        area_code_m49: areaCodeM49,
        area: row.Area,
        geography_class: isWorld ? 'world_aggregate' : areaCodeM49.includes('.') ? 'faostat_aggregate_region' : 'country_or_territory',
        item_code: row['Item Code'],
        item: row.Item,
        element_code: row['Element Code'],
        element: row.Element,
        year,
        unit: isArea ? 'hectares under drained agricultural use' : 'kilotonnes CO2 per year',
        value: numericValue,
        source_unit: row.Unit,
        source_value: numericValue,
        source_flag: row.Flag || 'not_reported',
        source_note: row.Note || null,
        source_method: sourceMethod,
        source_method_id: sourceMethodId,
        dataset_code: datasetCode,
        dataset_release_date: releaseDate,
        measurement_boundary: isArea
          ? `${isFaoTier1 ? 'FAOSTAT Tier 1 estimated' : isUnfccc ? 'UNFCCC inventory-reported' : 'Source-reported'} annual area of cropland and grassland organic soils under agricultural drainage; not all wetland drainage and not newly drained area during the year.`
          : `${isFaoTier1 ? 'FAOSTAT Tier 1 estimated' : isUnfccc ? 'UNFCCC inventory-reported' : 'Source-reported'} annual carbon-dioxide emissions from cropland and grassland organic soils under agricultural drainage; fire and non-agricultural wetland drainage are outside this record.`,
        source_locator: sourceUrl
      });
      continue;
    }

    if (datasetCode === 'RFB'
      && areaCodeM49
      && row.Element === 'Production'
      && row.Unit === 't') {
      const numericValue = Number(row.Value);
      if (!Number.isFinite(numericValue)) continue;
      records.push({
        record_id: `rfb-fertilizer-product-output-${areaCodeM49.replace(/[^0-9a-z]+/gi, '-')}-${row['Item Code']}-${year}`,
        metric_id: 'fertilizer_product_output',
        component: 'fertilizer_product_production',
        area_code_m49: areaCodeM49,
        area: row.Area,
        geography_class: areaCodeM49 === '001' ? 'world_aggregate' : areaCodeM49.includes('.') ? 'faostat_aggregate_region' : 'country_or_territory',
        item_code: row['Item Code'],
        item: row.Item,
        element_code: row['Element Code'],
        element: row.Element,
        year,
        unit: 'tonnes product per year',
        value: numericValue,
        source_unit: row.Unit,
        source_value: numericValue,
        source_flag: row.Flag || 'not_reported',
        source_note: row.Note || null,
        dataset_code: datasetCode,
        dataset_release_date: releaseDate,
        measurement_boundary: 'Source-reported fertilizer product mass; not nutrient content. Country and regional aggregate rows must not be summed together.',
        source_locator: sourceUrl
      });
      continue;
    }

    if (datasetCode === 'FBS'
      && (isReportedGeography || isWorld)
      && FOOD_BALANCE_ITEMS.get(row.Item) === row['Item Code']
      && FOOD_BALANCE_ELEMENTS.has(row.Element)) {
      const numericValue = Number(row.Value);
      if (!Number.isFinite(numericValue)) continue;
      foodImportComponents.push({
        area_code_m49: areaCodeM49,
        area: row.Area,
        item_code: row['Item Code'],
        item: row.Item,
        element_code: row['Element Code'],
        element: row.Element,
        year,
        unit: row.Unit,
        value: numericValue,
        source_flag: row.Flag || 'not_reported',
        source_note: row.Note || null,
        dataset_release_date: releaseDate,
        source_locator: sourceUrl
      });
      if (isWorld) {
        records.push({
          record_id: `fbs-food_balance_${row.Element.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}-${row['Item Code']}-${year}`,
          metric_id: 'apparent_agricultural_commodity_demand',
          component: `food_balance_${row.Element.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`,
          area_code_m49: areaCodeM49,
          area: row.Area,
          item_code: row['Item Code'],
          item: row.Item,
          element_code: row['Element Code'],
          element: row.Element,
          year,
          unit: row.Unit === '1000 t' ? 'tonnes per year' : row.Unit,
          value: row.Unit === '1000 t' ? numericValue * 1000 : numericValue,
          source_unit: row.Unit,
          source_value: numericValue,
          source_flag: row.Flag || 'not_reported',
          source_note: row.Note || null,
          dataset_code: datasetCode,
          dataset_release_date: releaseDate,
          source_locator: sourceUrl
        });
      }
      continue;
    }

    if (!isWorld) continue;

    let metricId = null;
    let component = null;
    if (datasetCode === 'QCL' && CROP_ITEMS.has(row.Item) && row.Element === 'Yield') {
      metricId = 'crop_yield_interannual_variability';
      component = 'crop_yield';
    } else if (datasetCode === 'QCL' && CROP_ITEMS.has(row.Item) && row.Element === 'Production') {
      metricId = 'faostat_input_intensity_profile';
      component = 'crop_production';
    } else if (datasetCode === 'QCL' && LIVESTOCK_ITEMS.has(row.Item) && row.Element === 'Stocks') {
      metricId = 'faostat_input_intensity_profile';
      component = 'livestock_stocks';
    } else if (datasetCode === 'RFN' && FERTILIZER_ITEMS.has(row.Item) && row.Element === 'Use per area of cropland') {
      metricId = 'faostat_input_intensity_profile';
      component = 'fertilizer_nutrient_use_per_cropland';
    } else if (datasetCode === 'FBS'
      && FOOD_BALANCE_ITEMS.get(row.Item) === row['Item Code']
      && FOOD_BALANCE_ELEMENTS.has(row.Element)) {
      metricId = 'apparent_agricultural_commodity_demand';
      component = `food_balance_${row.Element.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
    }
    if (!metricId) continue;
    const numericValue = Number(row.Value);
    if (!Number.isFinite(numericValue)) continue;
    const normalizedValue = datasetCode === 'FBS' && row.Unit === '1000 t' ? numericValue * 1000 : numericValue;
    const normalizedUnit = datasetCode === 'FBS' && row.Unit === '1000 t' ? 'tonnes per year' : row.Unit;
    records.push({
      record_id: `${datasetCode.toLowerCase()}-${component}-${row['Item Code']}-${year}`,
      metric_id: metricId,
      component,
      area_code_m49: areaCodeM49,
      area: row.Area,
      item_code: row['Item Code'],
      item: row.Item,
      element_code: row['Element Code'],
      element: row.Element,
      year,
      unit: normalizedUnit,
      value: normalizedValue,
      source_unit: row.Unit,
      source_value: numericValue,
      source_flag: row.Flag || 'not_reported',
      source_note: row.Note || null,
      dataset_code: datasetCode,
      dataset_release_date: releaseDate,
      source_locator: sourceUrl
    });
  }
  const exitCode = await new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', resolve);
  });
  if (exitCode !== 0) throw new Error(`unzip exited ${exitCode} for ${archivePath}`);
  return { records, foodImportComponents };
}

function deriveFoodImportDependency(componentRows) {
  const groups = new Map();
  for (const row of componentRows) {
    const key = `${row.area_code_m49}:${row.item_code}:${row.year}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const derived = [];
  for (const rows of groups.values()) {
    if (rows[0]?.area === 'World') continue;
    const byElement = new Map(rows.map(row => [row.element, row]));
    const domesticSupply = byElement.get('Domestic supply quantity');
    const imports = byElement.get('Import quantity');
    const exports = byElement.get('Export quantity');
    if (!domesticSupply || !imports || !exports || domesticSupply.value <= 0) continue;
    if (![domesticSupply, imports, exports].every(row => row.unit === '1000 t')) continue;
    const base = rows[0];
    const importsTonnes = imports.value * 1000;
    const exportsTonnes = exports.value * 1000;
    const domesticSupplyTonnes = domesticSupply.value * 1000;
    const netImportsTonnes = importsTonnes - exportsTonnes;
    const ratio = netImportsTonnes / domesticSupplyTonnes * 100;
    const production = byElement.get('Production');
    const stockVariation = byElement.get('Stock Variation');
    derived.push({
      record_id: `fbs-food-import-dependency-${base.area_code_m49}-${base.item_code}-${base.year}`,
      metric_id: 'food_import_dependency_ratio',
      component: 'net_imports_over_domestic_supply',
      area_code_m49: base.area_code_m49,
      area: base.area,
      item_code: base.item_code,
      item: base.item,
      element_code: 'derived_import_dependency',
      element: 'Net imports divided by domestic supply',
      year: base.year,
      unit: 'percent',
      value: Number(ratio.toFixed(3)),
      food_import_dependency_ratio_pct: Number(ratio.toFixed(3)),
      imports_tonnes: importsTonnes,
      exports_tonnes: exportsTonnes,
      net_imports_tonnes: netImportsTonnes,
      domestic_supply_tonnes: domesticSupplyTonnes,
      production_tonnes: production?.unit === '1000 t' ? production.value * 1000 : null,
      stock_variation_tonnes: stockVariation?.unit === '1000 t' ? stockVariation.value * 1000 : null,
      source_unit: '1000 t components',
      source_value: null,
      source_flag: [...new Set([domesticSupply.source_flag, imports.source_flag, exports.source_flag])].join('|'),
      source_note: [domesticSupply.source_note, imports.source_note, exports.source_note].filter(Boolean).join(' | ') || null,
      dataset_code: 'FBS',
      dataset_release_date: base.dataset_release_date,
      calculation: '(Import Quantity - Export Quantity) / Domestic supply quantity * 100',
      calculation_boundary: 'Mass-based ratio for one FAOSTAT Food Balance Sheet aggregate commodity group and source-reported geography; negative values and values above 100 percent are retained.',
      source_locator: base.source_locator
    });
  }
  return derived.sort((a, b) => a.area.localeCompare(b.area)
    || a.item.localeCompare(b.item)
    || a.year - b.year);
}

function deriveFeedCropDependency(componentRows) {
  const groups = new Map();
  for (const row of componentRows.filter(item => item.item === 'Cereals - Excluding Beer')) {
    const key = `${row.area_code_m49}:${row.item_code}:${row.year}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const derived = [];
  for (const rows of groups.values()) {
    const byElement = new Map(rows.map(row => [row.element, row]));
    const domesticSupply = byElement.get('Domestic supply quantity');
    const feed = byElement.get('Feed');
    if (!domesticSupply || !feed || domesticSupply.value <= 0) continue;
    if (domesticSupply.unit !== '1000 t' || feed.unit !== '1000 t') continue;
    const base = rows[0];
    const domesticSupplyTonnes = domesticSupply.value * 1000;
    const feedTonnes = feed.value * 1000;
    const feedShare = feedTonnes / domesticSupplyTonnes * 100;
    derived.push({
      record_id: `fbs-feed-crop-dependency-${base.area_code_m49}-${base.item_code}-${base.year}`,
      metric_id: 'livestock_feed_crop_use_share',
      component: 'cereal_feed_over_domestic_supply',
      area_code_m49: base.area_code_m49,
      area: base.area,
      item_code: base.item_code,
      item: base.item,
      element_code: 'derived_feed_dependency',
      element: 'Feed use divided by domestic supply quantity',
      year: base.year,
      unit: 'percent of cereal domestic supply used as feed',
      value: Number(feedShare.toFixed(3)),
      feed_crop_use_share_pct: Number(feedShare.toFixed(3)),
      feed_tonnes: feedTonnes,
      domestic_supply_tonnes: domesticSupplyTonnes,
      source_unit: '1000 t components',
      source_value: null,
      source_flag: [...new Set([domesticSupply.source_flag, feed.source_flag])].join('|'),
      source_note: [domesticSupply.source_note, feed.source_note].filter(Boolean).join(' | ') || null,
      dataset_code: 'FBS',
      dataset_release_date: base.dataset_release_date,
      calculation: 'Feed / Domestic supply quantity * 100',
      calculation_boundary: 'Mass-based cereal aggregate for one source-reported geography and year. It does not identify livestock species, embedded feed in imported animal products, forage, grazing, processing by-products, or calorie and protein quality.',
      source_locator: base.source_locator
    });
  }
  return derived.sort((a, b) => a.area.localeCompare(b.area) || a.year - b.year);
}

function deriveDrainedOrganicSoilIntensity(records) {
  const groups = new Map();
  for (const row of records.filter(record => record.dataset_code === 'GV')) {
    const key = `${row.area_code_m49}:${row.year}:${row.source_method_id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  const derived = [];
  for (const rows of groups.values()) {
    const area = rows.find(row => row.component === 'agricultural_drained_organic_soil_area');
    const emissions = rows.find(row => row.component === 'agricultural_drained_organic_soil_total_co2');
    if (!area || !emissions || area.value <= 0) continue;
    derived.push({
      ...emissions,
      record_id: `gv-drained-organic-soils-co2-intensity-${emissions.area_code_m49 || 'world'}-${emissions.year}-${emissions.source_method_id}`,
      component: 'agricultural_drained_organic_soil_co2_intensity',
      unit: 'tonnes CO2 per hectare per year',
      value: Number((emissions.value * 1000 / area.value).toFixed(6)),
      source_value: null,
      source_unit: 'derived from source-reported kilotonnes CO2 and hectares',
      drained_organic_soil_area_ha: area.value,
      total_co2_emissions_kt: emissions.value,
      calculation: 'FAOSTAT Emissions (CO2) in kilotonnes multiplied by 1000 divided by FAOSTAT Area in hectares',
      measurement_boundary: `Derived only within the same FAOSTAT geography, year, total drained-organic-soils item, source method (${emissions.source_method}) and release. This is an agricultural cropland-and-grassland average, not an IPCC land-use-class emission factor.`
    });
  }
  return derived;
}

function linearTrend(values) {
  const n = values.length;
  if (n === 0) {
    return {
      start_year: null,
      end_year: null,
      observations: 0,
      trend_kg_ha_per_year: null,
      detrended_residual_cv_pct: null,
      latest_yield_kg_ha: null,
      latest_anomaly_from_trend_pct: null
    };
  }
  const meanX = values.reduce((sum, item) => sum + item.year, 0) / n;
  const meanY = values.reduce((sum, item) => sum + item.value, 0) / n;
  const denominator = values.reduce((sum, item) => sum + (item.year - meanX) ** 2, 0);
  const slope = denominator
    ? values.reduce((sum, item) => sum + (item.year - meanX) * (item.value - meanY), 0) / denominator
    : 0;
  const intercept = meanY - slope * meanX;
  const residuals = values.map(item => item.value - (intercept + slope * item.year));
  const residualSd = Math.sqrt(residuals.reduce((sum, value) => sum + value ** 2, 0) / Math.max(1, n - 2));
  const latest = values.at(-1);
  const latestTrend = intercept + slope * latest.year;
  return {
    start_year: values[0].year,
    end_year: latest.year,
    observations: n,
    trend_kg_ha_per_year: Number(slope.toFixed(3)),
    detrended_residual_cv_pct: Number((residualSd / meanY * 100).toFixed(3)),
    latest_yield_kg_ha: latest.value,
    latest_anomaly_from_trend_pct: Number(((latest.value - latestTrend) / latestTrend * 100).toFixed(3))
  };
}

const temporaryDirectory = await fs.mkdtemp(path.join(os.tmpdir(), 'tulip-faostat-'));
try {
  const manifestResponse = await fetch(MANIFEST_URL, { headers: { 'user-agent': 'TULIP-Northstar/1.0 (source manifest)' } });
  if (!manifestResponse.ok) throw new Error(`FAOSTAT manifest failed: ${manifestResponse.status}`);
  const manifest = await manifestResponse.json();
  const datasets = manifest?.Datasets?.Dataset || [];
  const selected = DATASET_CODES.map(code => datasets.find(dataset => dataset.DatasetCode === code));
  if (selected.some(dataset => !dataset?.FileLocation)) throw new Error('Required FAOSTAT dataset missing from manifest');

  const records = [];
  const foodImportComponents = [];
  const releases = [];
  for (const dataset of selected) {
    const archivePath = path.join(temporaryDirectory, `${dataset.DatasetCode}.zip`);
    await download(dataset.FileLocation, archivePath);
    const entryName = normalizedCsvEntry(archivePath);
    const selectedRows = await readSelectedRows(
      archivePath,
      entryName,
      dataset.DatasetCode,
      dataset.DateUpdate,
      dataset.FileLocation
    );
    records.push(...selectedRows.records);
    foodImportComponents.push(...selectedRows.foodImportComponents);
    releases.push({
      dataset_code: dataset.DatasetCode,
      dataset_name: dataset.DatasetName,
      release_date: dataset.DateUpdate,
      file_rows: Number(dataset.FileRows),
      file_size: dataset.FileSize,
      source_url: dataset.FileLocation
    });
  }

  const foodImportDependencyRecords = deriveFoodImportDependency(foodImportComponents);
  const feedCropDependencyRecords = deriveFeedCropDependency(foodImportComponents);
  const drainedOrganicSoilIntensityRecords = deriveDrainedOrganicSoilIntensity(records);
  records.push(...foodImportDependencyRecords);
  records.push(...feedCropDependencyRecords);
  records.push(...drainedOrganicSoilIntensityRecords);

  records.sort((a, b) => a.metric_id.localeCompare(b.metric_id)
    || a.component.localeCompare(b.component)
    || a.item.localeCompare(b.item)
    || a.year - b.year);
  const cropYieldSummaries = [...CROP_ITEMS].map(item => {
    const values = records.filter(record => record.component === 'crop_yield' && record.item === item);
    return { item, unit: 'kg/ha', ...linearTrend(values) };
  });
  const demandSummaries = [...FOOD_BALANCE_ITEMS.keys()].map(item => {
    const values = records
      .filter(record => record.metric_id === 'apparent_agricultural_commodity_demand'
        && record.item === item
        && record.element === 'Domestic supply quantity')
      .sort((a, b) => a.year - b.year);
    const latest = values.at(-1);
    const earliest = values[0];
    if (!earliest || !latest) {
      return {
        item,
        start_year: null,
        end_year: null,
        observations: 0,
        latest_apparent_demand_tonnes: null,
        change_since_start_pct: null,
        source_element: 'Domestic supply quantity'
      };
    }
    return {
      item,
      start_year: earliest.year,
      end_year: latest.year,
      observations: values.length,
      latest_apparent_demand_tonnes: latest.value,
      change_since_start_pct: Number(((latest.value - earliest.value) / earliest.value * 100).toFixed(3)),
      source_element: 'Domestic supply quantity'
    };
  });
  const capturedAt = new Date().toISOString();
  const snapshot = {
    version: 'faostat_agriculture_metrics_v4',
    captured_at: capturedAt,
    source: {
      id: 'faostat',
      name: 'FAOSTAT',
      manifest_url: MANIFEST_URL,
      access: 'official open bulk-download manifest and normalized CSV releases'
    },
    ingestion_job_id: 'fetch_faostat_agriculture_metrics',
    metric_contract_ids: ['faostat_input_intensity_profile', 'crop_yield_interannual_variability', 'apparent_agricultural_commodity_demand', 'food_import_dependency_ratio', 'fertilizer_product_output', 'livestock_feed_crop_use_share', 'wetland_area_drained_or_converted', 'drained_peat_co2_flux'],
    cadence: 'annual release check with release-triggered snapshot refresh',
    provenance: 'Official FAOSTAT QCL crops and livestock production, RFN fertilizer-by-nutrient use, FBS Food Balance Sheet, RFB Fertilizers by Product, and GV Emissions from Drained Organic Soils normalized bulk releases. Records from 1961 onward where the source series exists retain FAOSTAT M49 codes, source flags, product, land-use and emissions boundaries, and release locators. Feed dependency and drained-organic-soil emission intensity are derived only from matching source-reported components.',
    uncertainty: 'FAOSTAT flags combine official, estimated, imputed, and aggregate values. World and regional records inherit reporting and estimation uncertainty. Fertilizer product tonnes are not nutrient tonnes. Food import dependency depends on food-balance conventions, stock variation, re-exports, commodity aggregation, and mass rather than calorie weighting. Yield detrending is descriptive, not climate attribution. Drained-organic-soil estimates use Tier 1 geospatial area and emission-factor methods and cover agricultural cropland and grassland rather than all wetlands.',
    failure_behavior: 'Retain the last validated release, mark stale, expose the failed dataset code, and never treat missing countries, years, feed inputs, land-use classes, or commodities as zero. Reject derived feed shares or drained-organic-soil emission intensity unless the source components share geography, item, year, unit boundary and release.',
    coverage_boundary: 'This snapshot operationalizes global crop-yield variability, agricultural input-intensity components, apparent demand, mass-based food import dependency, fertilizer output, cereal feed use, and FAOSTAT agricultural drained-organic-soil area and carbon-dioxide emissions. The wetland records cover cropland and grassland organic soils only; they are not global observations of every drained wetland, newly drained area, peat fire or non-agricultural conversion. Country rows must not be summed with regional aggregates.',
    releases,
    record_count: records.length,
    records,
    derived_metrics: {
      crop_yield_interannual_variability: cropYieldSummaries,
      apparent_agricultural_commodity_demand: demandSummaries,
      food_import_dependency_ratio: {
        records: foodImportDependencyRecords.length,
        geographies: new Set(foodImportDependencyRecords.map(record => record.area_code_m49)).size,
        commodity_groups: [...FOOD_BALANCE_ITEMS.keys()],
        start_year: Math.min(...foodImportDependencyRecords.map(record => record.year)),
        end_year: Math.max(...foodImportDependencyRecords.map(record => record.year)),
        calculation: '(Import Quantity - Export Quantity) / Domestic supply quantity * 100',
        weighting_boundary: 'Each record is one mass-based commodity-group ratio; records are not combined across commodities without a declared weighting scheme.'
      },
      fertilizer_product_output: {
        records: records.filter(record => record.metric_id === 'fertilizer_product_output').length,
        geographies: new Set(records.filter(record => record.metric_id === 'fertilizer_product_output').map(record => record.area_code_m49)).size,
        products: new Set(records.filter(record => record.metric_id === 'fertilizer_product_output').map(record => record.item_code)).size,
        start_year: Math.min(...records.filter(record => record.metric_id === 'fertilizer_product_output').map(record => record.year)),
        end_year: Math.max(...records.filter(record => record.metric_id === 'fertilizer_product_output').map(record => record.year)),
        measurement_boundary: 'FAOSTAT source-reported tonnes of fertilizer product by geography, product, and year; not nutrient content.'
      },
      livestock_feed_crop_use_share: {
        records: feedCropDependencyRecords.length,
        geographies: new Set(feedCropDependencyRecords.map(record => record.area_code_m49)).size,
        start_year: Math.min(...feedCropDependencyRecords.map(record => record.year)),
        end_year: Math.max(...feedCropDependencyRecords.map(record => record.year)),
        calculation: 'Feed / Domestic supply quantity * 100 for Cereals - Excluding Beer',
        measurement_boundary: 'Mass-based cereal feed-use share by source-reported geography and year; excludes forage, grazing, by-products, livestock-species allocation, embedded feed trade, and nutritional quality.'
      },
      drained_organic_soils: {
        area_records: records.filter(record => record.component === 'agricultural_drained_organic_soil_area').length,
        total_co2_records: records.filter(record => record.component === 'agricultural_drained_organic_soil_total_co2').length,
        derived_intensity_records: drainedOrganicSoilIntensityRecords.length,
        geographies: new Set(records.filter(record => record.dataset_code === 'GV').map(record => record.area_code_m49)).size,
        start_year: Math.min(...records.filter(record => record.dataset_code === 'GV').map(record => record.year)),
        end_year: Math.max(...records.filter(record => record.dataset_code === 'GV').map(record => record.year)),
        measurement_boundary: 'FAOSTAT agricultural cropland-and-grassland drained organic soils only; area is annual mapped drained area, total emissions are Tier 1 carbon dioxide, and intensity is a same-geography same-year arithmetic ratio.'
      }
    }
  };
  await fs.writeFile(path.resolve('public/faostat-agriculture-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({
    file: 'public/faostat-agriculture-snapshot.json',
    records: records.length,
    releases,
    crop_yield_summaries: cropYieldSummaries,
    demand_summaries: demandSummaries,
    food_import_dependency_records: foodImportDependencyRecords.length,
    food_import_dependency_geographies: new Set(foodImportDependencyRecords.map(record => record.area_code_m49)).size,
    fertilizer_product_output_records: records.filter(record => record.metric_id === 'fertilizer_product_output').length,
    feed_crop_dependency_records: feedCropDependencyRecords.length,
    feed_crop_dependency_geographies: new Set(feedCropDependencyRecords.map(record => record.area_code_m49)).size,
    drained_organic_soil_intensity_records: drainedOrganicSoilIntensityRecords.length
  }, null, 2));
} finally {
  await fs.rm(temporaryDirectory, { recursive: true, force: true });
}
