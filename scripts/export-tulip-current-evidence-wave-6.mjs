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
const SNAPSHOT_PATH = 'public/faostat-agriculture-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function linearFit(points) {
  const meanYear = points.reduce((sum, point) => sum + point.year, 0) / points.length;
  const meanValue = points.reduce((sum, point) => sum + point.value, 0) / points.length;
  const denominator = points.reduce((sum, point) => sum + (point.year - meanYear) ** 2, 0);
  const slope = points.reduce((sum, point) => sum + (point.year - meanYear) * (point.value - meanValue), 0) / denominator;
  return { slope, intercept: meanValue - slope * meanYear };
}

function annualChanges(points, valueField = 'value') {
  return points.slice(1).map((point, index) => point[valueField] - points[index][valueField]);
}

function cropYieldVolatilityReceipt() {
  const cropNames = ['Wheat', 'Maize (corn)', 'Rice'];
  const cropSeries = cropNames.map(item => {
    const points = snapshot.records
      .filter(record => record.metric_id === 'crop_yield_interannual_variability'
        && record.component === 'crop_yield'
        && record.area === 'World'
        && record.item === item
        && Number.isFinite(record.value))
      .map(record => ({ year: record.year, value: record.value, record }))
      .sort((left, right) => left.year - right.year);
    if (points.length < 20) throw new Error(`${item} has only ${points.length} annual global yield observations.`);
    return { item, points, fit: linearFit(points) };
  });

  const completeYears = cropSeries
    .map(series => new Set(series.points.map(point => point.year)))
    .reduce((intersection, years) => new Set([...intersection].filter(year => years.has(year))));
  const annual = [...completeYears].sort((a, b) => a - b).map(year => {
    const crops = cropSeries.map(series => {
      const point = series.points.find(candidate => candidate.year === year);
      const trendYield = series.fit.intercept + series.fit.slope * year;
      return {
        item: series.item,
        yield_kg_ha: point.value,
        trend_yield_kg_ha: trendYield,
        absolute_anomaly_pct: Math.abs((point.value - trendYield) / trendYield * 100),
        source_flag: point.record.source_flag,
        source_locator: point.record.source_locator
      };
    });
    return {
      year,
      value: crops.reduce((sum, crop) => sum + crop.absolute_anomaly_pct, 0) / crops.length,
      crops
    };
  });
  if (annual.length < 20) throw new Error(`Only ${annual.length} complete global three-crop years are available.`);

  const values = annual.map(point => point.value);
  const changes = annualChanges(annual);
  const baseline = strictAnchors(values)[0];
  const magnitudeValues = values.map(value => value - baseline);
  const magnitudeAnchors = strictAnchors(magnitudeValues);
  const thresholdAnchors = strictAnchors(values);
  const momentumAnchors = strictAnchors(changes);
  const latest = annual.at(-1);
  const latestChange = changes.at(-1);
  const sourceLocator = latest.crops[0].source_locator;

  return buildTulipUrgencyReceipt({
    node_id: 'crop_yield_volatility',
    method: 'current_data',
    as_of: String(latest.year),
    components: {
      magnitude: round(normalizeWithAnchors(latest.value - baseline, magnitudeAnchors, 'higher_is_worse')),
      threshold: round(normalizeWithAnchors(latest.value, thresholdAnchors, 'higher_is_worse')),
      momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
      extent: 1
    },
    raw_inputs: {
      magnitude: {
        latest_mean_absolute_yield_anomaly_pct: round(latest.value),
        historical_median_baseline_pct: round(baseline),
        excess_over_baseline_percentage_points: round(latest.value - baseline),
        complete_annual_observations: annual.length,
        anchors: magnitudeAnchors.map(value => round(value)),
        source_locator: sourceLocator
      },
      threshold: {
        latest_mean_absolute_yield_anomaly_pct: round(latest.value),
        threshold_basis: 'historical_distribution_fallback',
        anchors: thresholdAnchors.map(value => round(value)),
        source_locator: sourceLocator
      },
      momentum: {
        latest_year_over_year_change_percentage_points: round(latestChange),
        annual_change_observations: changes.length,
        anchors: momentumAnchors.map(value => round(value)),
        source_locator: sourceLocator
      },
      extent: {
        global_crop_series_present: latest.crops.length,
        required_global_crop_series: cropNames.length,
        normalized_value: 1,
        definition: 'Complete FAOSTAT World aggregate coverage for wheat, maize and rice in the latest retained year.',
        source_locator: sourceLocator
      },
      crop_panel: latest.crops.map(crop => ({
        item: crop.item,
        yield_kg_ha: round(crop.yield_kg_ha),
        fitted_trend_yield_kg_ha: round(crop.trend_yield_kg_ha),
        absolute_anomaly_pct: round(crop.absolute_anomaly_pct),
        source_flag: crop.source_flag
      })),
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        release: snapshot.releases.find(release => release.dataset_code === 'QCL'),
        annual_panel_start: annual[0].year,
        annual_panel_end: latest.year
      }
    },
    transformations: [
      {
        type: 'crop_specific_fixed_window_detrending',
        formula: 'Fit a separate 1961–latest linear yield trend to each FAOSTAT World wheat, maize and rice series; calculate each annual absolute percent anomaly from its own trend.'
      },
      {
        type: 'unitless_global_staple_panel',
        formula: 'For complete years, take the equal-crop mean of the three crop-specific absolute percentage anomalies; raw crop yields are never added together.'
      },
      {
        type: 'historical_distribution_normalization',
        formula: 'Map annual panel volatility and its year-over-year change through median / p75 / p90 / p97.5 anchors.'
      }
    ],
    source_ids: ['faostat'],
    uncertainty: `${snapshot.uncertainty} The equal-crop panel is a global staple indicator, not a production-weighted estimate of every crop or an attribution of volatility to climate.`,
    freshness: `Annual FAOSTAT QCL World aggregates through ${latest.year}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `FAOSTAT supplies ${annual.length} complete annual World observations for each of wheat, maize and rice; the unitless detrended panel supplies current magnitude, historical position, momentum and complete panel extent.`,
      higher_priority_failures: []
    }
  });
}

function peatOxidationReceipt() {
  const records = snapshot.records
    .filter(record => record.metric_id === 'drained_peat_co2_flux'
      && record.component === 'agricultural_drained_organic_soil_total_co2'
      && record.area === 'World'
      && record.source_method === 'FAO TIER 1'
      && record.source_flag !== 'I'
      && Number.isFinite(record.value))
    .sort((left, right) => left.year - right.year);
  if (records.length < 20) throw new Error(`Only ${records.length} non-imputed annual global drained-organic-soil observations are available.`);
  const annual = records.map(record => ({ year: record.year, value: record.value, record }));
  const reference = annual[0].value;
  const values = annual.map(point => point.value);
  const magnitudeValues = values.map(value => value - reference);
  const changes = annualChanges(annual);
  const magnitudeAnchors = strictAnchors(magnitudeValues);
  const thresholdAnchors = strictAnchors(values);
  const momentumAnchors = strictAnchors(changes);
  const latest = annual.at(-1);
  const latestChange = changes.at(-1);

  return buildTulipUrgencyReceipt({
    node_id: 'peat_oxidation_pulse',
    method: 'current_data',
    as_of: String(latest.year),
    components: {
      magnitude: round(normalizeWithAnchors(latest.value - reference, magnitudeAnchors, 'higher_is_worse')),
      threshold: round(normalizeWithAnchors(latest.value, thresholdAnchors, 'higher_is_worse')),
      momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
      extent: 1
    },
    raw_inputs: {
      magnitude: {
        latest_global_agricultural_drained_organic_soil_co2_kt: round(latest.value),
        reference_year: annual[0].year,
        reference_global_co2_kt: round(reference),
        increase_against_reference_co2_kt: round(latest.value - reference),
        complete_non_imputed_annual_observations: annual.length,
        anchors: magnitudeAnchors.map(value => round(value)),
        source_locator: latest.record.source_locator
      },
      threshold: {
        latest_global_agricultural_drained_organic_soil_co2_kt: round(latest.value),
        threshold_basis: 'historical_distribution_fallback',
        anchors: thresholdAnchors.map(value => round(value)),
        source_locator: latest.record.source_locator
      },
      momentum: {
        latest_year_over_year_change_co2_kt: round(latestChange),
        annual_change_observations: changes.length,
        anchors: momentumAnchors.map(value => round(value)),
        source_locator: latest.record.source_locator
      },
      extent: {
        geography: 'World',
        normalized_value: 1,
        definition: 'The source supplies a World aggregate for its stated cropland-and-grassland drained-organic-soil boundary.',
        source_locator: latest.record.source_locator
      },
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        release: snapshot.releases.find(release => release.dataset_code === 'GV'),
        source_method: latest.record.source_method,
        measurement_boundary: latest.record.measurement_boundary,
        excluded_imputed_years: snapshot.records
          .filter(record => record.metric_id === 'drained_peat_co2_flux'
            && record.component === 'agricultural_drained_organic_soil_total_co2'
            && record.area === 'World'
            && record.source_method === 'FAO TIER 1'
            && record.source_flag === 'I')
          .map(record => record.year)
      }
    },
    transformations: [
      {
        type: 'official_world_inventory_series',
        formula: 'Retain FAOSTAT World annual Tier 1 carbon-dioxide emissions from drained agricultural organic soils; do not sum country rows with the World aggregate.'
      },
      {
        type: 'non_imputed_current_cutoff',
        formula: 'Use the latest source record not flagged I; retain later imputed records as metadata rather than treating repeated imputation as observed zero momentum.'
      },
      {
        type: 'historical_distribution_normalization',
        formula: 'Map annual global emissions, change since the first retained year and year-over-year momentum through median / p75 / p90 / p97.5 anchors.'
      }
    ],
    source_ids: ['faostat'],
    uncertainty: `${snapshot.uncertainty} The indicator covers oxidation emissions from agriculturally drained cropland and grassland organic soils; peat fire, intact peatlands and non-agricultural drainage are outside the measurement boundary.`,
    freshness: `Annual FAOSTAT GV Tier 1 World series through the latest non-imputed year ${latest.year}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `The official FAOSTAT World inventory supplies ${annual.length} non-imputed annual estimates of a direct peat-oxidation pathway, including magnitude, historical position, momentum and global extent for the stated agricultural boundary.`,
      higher_priority_failures: []
    }
  });
}

function agriculturalNitrogenApplicationReceipt() {
  const records = snapshot.records
    .filter(record => record.dataset_code === 'RFN'
      && record.component === 'fertilizer_nutrient_use_per_cropland'
      && record.area === 'World'
      && record.item === 'Nutrient nitrogen N (total)'
      && record.element === 'Use per area of cropland'
      && record.unit === 'kg/ha'
      && Number.isFinite(record.value))
    .sort((left, right) => left.year - right.year);
  if (records.length < 20) throw new Error(`Only ${records.length} annual global nitrogen-application-intensity observations are available.`);
  const values = records.map(record => record.value);
  const reference = values[0];
  const magnitudeValues = values.map(value => value - reference);
  const changes = values.slice(1).map((value, index) => value - values[index]);
  const magnitudeAnchors = strictAnchors(magnitudeValues);
  const thresholdAnchors = strictAnchors(values);
  const momentumAnchors = strictAnchors(changes);
  const latest = records.at(-1);
  const latestChange = changes.at(-1);

  return buildTulipUrgencyReceipt({
    node_id: 'agricultural_nitrogen_application',
    method: 'current_data',
    as_of: String(latest.year),
    components: {
      magnitude: round(normalizeWithAnchors(latest.value - reference, magnitudeAnchors, 'higher_is_worse')),
      threshold: round(normalizeWithAnchors(latest.value, thresholdAnchors, 'higher_is_worse')),
      momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
      extent: 1
    },
    raw_inputs: {
      magnitude: {
        latest_nitrogen_use_kg_per_cropland_ha: round(latest.value),
        reference_year: records[0].year,
        reference_nitrogen_use_kg_per_cropland_ha: round(reference),
        increase_against_reference_kg_per_ha: round(latest.value - reference),
        complete_annual_observations: records.length,
        anchors: magnitudeAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      threshold: {
        latest_nitrogen_use_kg_per_cropland_ha: round(latest.value),
        threshold_basis: 'historical_distribution_fallback',
        anchors: thresholdAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      momentum: {
        latest_year_over_year_change_kg_per_ha: round(latestChange),
        annual_change_observations: changes.length,
        anchors: momentumAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      extent: {
        geography: 'World',
        normalized_value: 1,
        definition: 'FAOSTAT source-reported World aggregate use per area of cropland for total nutrient nitrogen.',
        source_locator: latest.source_locator
      },
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        release: snapshot.releases.find(release => release.dataset_code === 'RFN'),
        measurement_boundary: 'Synthetic fertilizer nutrient nitrogen use per area of cropland; organic manure, crop-specific timing and farm-level application are outside this indicator.'
      }
    },
    transformations: [
      {
        type: 'source_reported_global_application_intensity',
        formula: 'Retain FAOSTAT World total nutrient nitrogen use per area of cropland in kg N/ha; do not substitute fertilizer production or sales.'
      },
      {
        type: 'historical_distribution_normalization',
        formula: 'Map application intensity, increase from 1961 and annual change through median / p75 / p90 / p97.5 anchors.'
      }
    ],
    source_ids: ['faostat'],
    uncertainty: `${snapshot.uncertainty} The source World aggregate is an estimated synthetic-fertilizer intensity and does not represent organic nitrogen inputs or individual farm application.`,
    freshness: `Annual FAOSTAT RFN World series through ${latest.year}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `FAOSTAT supplies ${records.length} complete annual World observations in the node contract's kg nitrogen per hectare unit, including magnitude, historical position, momentum and global scope for the stated synthetic-fertilizer boundary.`,
      higher_priority_failures: []
    }
  });
}

const receipts = [cropYieldVolatilityReceipt(), peatOxidationReceipt(), agriculturalNitrogenApplicationReceipt()];
for (const receipt of receipts) {
  const verification = verifyTulipUrgencyReceipt(receipt);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${receipt.node_id}.`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_6_faostat_global_histories',
  generated_at: new Date().toISOString(),
  promoted_node_count: receipts.length,
  rejected_candidates: [
    {
      node_id: 'feed_crop_dependency',
      reason: 'The current FAOSTAT Food Balance Sheet release supplies only 14 annual observations (2010–2023), below the 20-year historical-distribution gate.'
    },
    {
      node_id: 'food_import_exposure',
      reason: 'The current FAOSTAT Food Balance Sheet release supplies only 14 annual observations and no declared cross-commodity global weighting scheme.'
    },
    {
      node_id: 'fertilizer_production',
      reason: 'The product series has enough years, but recent reporting-country coverage falls too sharply to support a defensible current global aggregation without treating missing production as zero.'
    },
    {
      node_id: 'wetlands_drainage_scales',
      reason: 'The FAOSTAT series covers agricultural cropland and grassland organic soils only, not the broader global wetland-drainage node boundary.'
    }
  ],
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-6.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-6.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method })),
  rejected_candidates: registry.rejected_candidates
}, null, 2));
