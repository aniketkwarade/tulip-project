import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildTulipUrgencyReceipt,
  historicalDistributionAnchors,
  normalizeWithAnchors,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(ROOT, relativePath), 'utf8'));
}

const [fish, fertilizer, seaLevel, oceanHeat] = await Promise.all([
  readJson('public/fao-fish-stock-sustainability-snapshot.json'),
  readJson('public/world-bank-fertilizer-price-snapshot.json'),
  readJson('public/noaa-global-mean-sea-level-snapshot.json'),
  readJson('public/noaa-ocean-heat-content-snapshot.json')
]);

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

function strictAnchors(values, cadence) {
  const anchors = historicalDistributionAnchors(values, cadence);
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} ${cadence} observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function rollingSlopes(points, window = 1) {
  const slopes = [];
  for (let index = window; index < points.length; index += 1) {
    const elapsed = points[index].time - points[index - window].time;
    if (elapsed > 0) slopes.push((points[index].value - points[index - window].value) / elapsed);
  }
  return slopes;
}

function monthlyMeans(points) {
  const groups = new Map();
  for (const point of points) {
    const year = Math.floor(point.time);
    const month = Math.min(11, Math.max(0, Math.floor((point.time - year) * 12)));
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;
    const group = groups.get(key) ?? { time: year + month / 12, values: [] };
    group.values.push(point.value);
    groups.set(key, group);
  }
  return [...groups.values()].map(group => ({
    time: group.time,
    value: group.values.reduce((sum, value) => sum + value, 0) / group.values.length
  })).sort((left, right) => left.time - right.time);
}

function annualMeans(points) {
  const groups = new Map();
  for (const point of points) {
    const year = Math.floor(point.time);
    const values = groups.get(year) ?? [];
    values.push(point.value);
    groups.set(year, values);
  }
  return [...groups].map(([time, values]) => ({
    time,
    value: values.reduce((sum, value) => sum + value, 0) / values.length
  })).sort((left, right) => left.time - right.time);
}

function currentReceipt({
  nodeId,
  sourceId,
  snapshotPath,
  snapshot,
  cadence,
  points,
  magnitudeReference,
  unit,
  extentDefinition,
  asOf,
  sourceLocator,
  uncertainty,
  freshness
}) {
  if (points.length < (cadence === 'monthly' ? 60 : 20)) throw new Error(`${nodeId} history is incomplete.`);
  const values = points.map(point => point.value);
  const magnitudeValues = values.map(value => value - magnitudeReference);
  const magnitudeAnchors = strictAnchors(magnitudeValues, cadence);
  const thresholdAnchors = strictAnchors(values, cadence);
  const annual = cadence === 'monthly' ? annualMeans(points) : points;
  const slopes = rollingSlopes(annual, 1);
  if (slopes.length < 20) throw new Error(`${nodeId} has only ${slopes.length} complete year-over-year momentum observations.`);
  const momentumAnchors = strictAnchors(slopes, 'annual');
  const latest = points.at(-1);
  const latestSlope = slopes.at(-1);
  const components = {
    magnitude: round(normalizeWithAnchors(latest.value - magnitudeReference, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.value, thresholdAnchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(latestSlope, momentumAnchors, 'higher_is_worse')),
    extent: 1
  };
  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'current_data',
    as_of: asOf,
    components,
    raw_inputs: {
      magnitude: {
        latest_value: round(latest.value),
        reference_value: magnitudeReference,
        value_against_reference: round(latest.value - magnitudeReference),
        unit,
        observation_count: points.length,
        cadence,
        anchors: magnitudeAnchors.map(value => round(value)),
        source_locator: sourceLocator
      },
      threshold: {
        latest_value: round(latest.value),
        unit,
        threshold_basis: 'historical_distribution_fallback',
        observation_count: points.length,
        cadence,
        anchors: thresholdAnchors.map(value => round(value)),
        source_locator: sourceLocator
      },
      momentum: {
        latest_year_over_year_change: round(latestSlope),
        unit: `${unit} per year`,
        annual_observations: annual.length,
        rolling_slope_observations: slopes.length,
        anchors: momentumAnchors.map(value => round(value)),
        source_locator: sourceLocator
      },
      extent: {
        value: 1,
        definition: extentDefinition,
        source_locator: sourceLocator
      },
      source_snapshot: {
        path: snapshotPath,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        updated_at: snapshot.updated_at ?? null,
        record_count: snapshot.record_count
      }
    },
    transformations: [
      {
        type: 'magnitude_against_reference_historical_normalization',
        formula: 'latest value minus documented reference, mapped through median / p75 / p90 / p97.5 anchors'
      },
      {
        type: 'historical_distribution_threshold_fallback',
        formula: 'latest source value mapped through median / p75 / p90 / p97.5 anchors'
      },
      {
        type: 'year_over_year_momentum',
        formula: 'latest one-year slope mapped through the historical distribution of complete year-over-year slopes'
      },
      {
        type: 'source_global_extent',
        formula: '1 when the retained source series is itself a documented global aggregate'
      }
    ],
    source_ids: [sourceId],
    uncertainty,
    freshness,
    selection_reason: {
      selected_method_passed: `The source supplies ${points.length} complete ${cadence} global observations, current magnitude, historical-distribution threshold position, year-over-year momentum and a documented global aggregate.`,
      higher_priority_failures: []
    }
  });
}

const fishRows = fish.records
  .filter(record => record.geo_area_name === 'World' && Number.isFinite(record.biologically_unsustainable_stock_share_pct_derived))
  .sort((left, right) => left.observation_year - right.observation_year);
const fishReceipt = currentReceipt({
  nodeId: 'marine_fisheries_collapse',
  sourceId: 'unsd_sdg_api_fao_fish_stock_status',
  snapshotPath: 'public/fao-fish-stock-sustainability-snapshot.json',
  snapshot: fish,
  cadence: 'annual',
  points: fishRows.map(record => ({ time: record.observation_year, value: record.biologically_unsustainable_stock_share_pct_derived })),
  magnitudeReference: fishRows[0].biologically_unsustainable_stock_share_pct_derived,
  unit: 'percent of assessed marine fish stocks biologically unsustainable',
  extentDefinition: 'FAO/UNSD World aggregate for assessed marine fish stocks.',
  asOf: String(fishRows.at(-1).observation_year),
  sourceLocator: fishRows.at(-1).source_locator,
  uncertainty: fish.uncertainty,
  freshness: `Annual FAO/UNSD assessment; snapshot captured ${fish.captured_at}.`
});

const fertilizerRows = fertilizer.records
  .filter(record => Number.isFinite(record.fertilizer_price_index_2010_100))
  .sort((left, right) => left.observation_month.localeCompare(right.observation_month));
const fertilizerReceipt = currentReceipt({
  nodeId: 'fertilizer_price_shock',
  sourceId: 'world_bank_commodity_price_data_the_pink_sheet',
  snapshotPath: 'public/world-bank-fertilizer-price-snapshot.json',
  snapshot: fertilizer,
  cadence: 'monthly',
  points: fertilizerRows.map(record => ({ time: record.observation_year + (record.observation_month_number - 1) / 12, value: record.fertilizer_price_index_2010_100 })),
  magnitudeReference: 100,
  unit: 'World Bank fertilizer price index, 2010=100',
  extentDefinition: 'World Bank global commodity-group index.',
  asOf: fertilizerRows.at(-1).observation_month,
  sourceLocator: fertilizerRows.at(-1).source_locator.workbook_url,
  uncertainty: fertilizer.uncertainty,
  freshness: `Monthly World Bank release; snapshot captured ${fertilizer.captured_at}.`
});

const grainsRows = fertilizer.records
  .filter(record => Number.isFinite(record.grains_price_index_2010_100))
  .sort((left, right) => left.observation_month.localeCompare(right.observation_month));
const grainLogReturns = grainsRows.slice(1).map((record, index) => ({
  record,
  value: Math.log(record.grains_price_index_2010_100 / grainsRows[index].grains_price_index_2010_100)
}));
const grainVolatilityPoints = grainLogReturns.slice(11).map((item, index) => {
  const window = grainLogReturns.slice(index, index + 12).map(point => point.value);
  const mean = window.reduce((sum, value) => sum + value, 0) / window.length;
  const variance = window.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (window.length - 1);
  return {
    time: item.record.observation_year + (item.record.observation_month_number - 1) / 12,
    value: Math.sqrt(variance) * Math.sqrt(12) * 100,
    record: item.record
  };
});
const sortedGrainVolatility = grainVolatilityPoints.map(point => point.value).sort((left, right) => left - right);
const grainVolatilityMedian = sortedGrainVolatility[Math.floor((sortedGrainVolatility.length - 1) * 0.5)];
const stapleFoodPriceReceipt = currentReceipt({
  nodeId: 'staple_food_price_volatility',
  sourceId: 'world_bank_commodity_price_data_the_pink_sheet',
  snapshotPath: 'public/world-bank-fertilizer-price-snapshot.json',
  snapshot: fertilizer,
  cadence: 'monthly',
  points: grainVolatilityPoints,
  magnitudeReference: grainVolatilityMedian,
  unit: 'trailing 12-month annualized volatility of monthly World Bank grains-index log returns, percent',
  extentDefinition: 'World Bank global grains commodity-group price index; the indicator is a global market benchmark rather than a household affordability measure.',
  asOf: grainVolatilityPoints.at(-1).record.observation_month,
  sourceLocator: grainVolatilityPoints.at(-1).record.source_locator.workbook_url,
  uncertainty: `${fertilizer.uncertainty} The grains basket is a global nominal-dollar market index and does not measure local retail prices, calorie affordability or every staple commodity.`,
  freshness: `Monthly World Bank release; snapshot captured ${fertilizer.captured_at}.`
});

const seaLevelRows = seaLevel.records
  .filter(record => Number.isFinite(record.mean_sea_level_anomaly_mm))
  .sort((left, right) => left.decimal_year - right.decimal_year);
const seaLevelMonthly = monthlyMeans(seaLevelRows.map(record => ({
  time: record.decimal_year,
  value: record.mean_sea_level_anomaly_mm
})));
const seaLevelReceipt = currentReceipt({
  nodeId: 'sea_level_rise',
  sourceId: 'noaa_laboratory_for_satellite_altimetry',
  snapshotPath: 'public/noaa-global-mean-sea-level-snapshot.json',
  snapshot: seaLevel,
  cadence: 'monthly',
  points: seaLevelMonthly,
  magnitudeReference: 0,
  unit: 'millimetres of global mean sea-level anomaly',
  extentDefinition: 'Satellite-altimetry global mean across the ocean between 66°S and 66°N.',
  asOf: String(seaLevelRows.at(-1).decimal_year),
  sourceLocator: seaLevelRows.at(-1).source_locator,
  uncertainty: seaLevel.uncertainty,
  freshness: `Source series latest decimal year ${seaLevelRows.at(-1).decimal_year}; snapshot captured ${seaLevel.captured_at}.`
});

const oceanHeatRows = oceanHeat.records
  .filter(record => Number.isFinite(record.ocean_heat_content_anomaly_zj))
  .sort((left, right) => left.analysis_year - right.analysis_year);
const oceanHeatReceipt = currentReceipt({
  nodeId: 'ocean_heat_content',
  sourceId: 'noaa_global_ocean_heat_content_cdr',
  snapshotPath: 'public/noaa-ocean-heat-content-snapshot.json',
  snapshot: oceanHeat,
  cadence: 'annual',
  points: oceanHeatRows.map(record => ({ time: record.analysis_year, value: record.ocean_heat_content_anomaly_zj })),
  magnitudeReference: 0,
  unit: 'zettajoules of 0–2000 m global ocean heat-content anomaly',
  extentDefinition: 'NOAA World Ocean 0–2000 m aggregate with both hemispheres retained.',
  asOf: String(oceanHeatRows.at(-1).analysis_year),
  sourceLocator: oceanHeatRows.at(-1).source_locator,
  uncertainty: oceanHeat.uncertainty,
  freshness: `Annual NOAA analysis through ${oceanHeatRows.at(-1).analysis_year}; snapshot captured ${oceanHeat.captured_at}.`
});

const receipts = [fishReceipt, fertilizerReceipt, stapleFoodPriceReceipt, seaLevelReceipt, oceanHeatReceipt];
for (const receipt of receipts) {
  const verification = verifyTulipUrgencyReceipt(receipt);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${receipt.node_id}`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_2_global_histories',
  generated_at: new Date().toISOString(),
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-2.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-2.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }))
}, null, 2));
