import {
  buildTulipUrgencyReceipt,
  historicalDistributionAnchors,
  normalizeWithAnchors,
  qualifiesForCurrentData,
  verifyTulipUrgencyReceipt
} from '../../src/tulip-urgency-v2.js';

const round = (value, digits = 6) => Number(value.toFixed(digits));
const mean = values => values.reduce((sum, value) => sum + value, 0) / values.length;
const WET_BULB_ANCHORS_C = Object.freeze([26, 28, 32, 35]);
const INHABITED_CONTINENTS = 6;

function annualPanelSeries(snapshot, field, valueField) {
  const byYear = new Map();
  for (const record of snapshot.records || []) {
    for (const point of record[field] || []) {
      if (!Number.isFinite(point.year) || !Number.isFinite(point[valueField])) continue;
      const values = byYear.get(point.year) || [];
      values.push(point[valueField]);
      byYear.set(point.year, values);
    }
  }
  return [...byYear.entries()]
    .filter(([, values]) => values.length === snapshot.location_count)
    .map(([year, values]) => ({ year, value: mean(values), location_count: values.length }))
    .sort((left, right) => left.year - right.year);
}

function localMedianExtent(snapshot, field, valueField, latestYear) {
  const affectedContinents = new Set();
  for (const record of snapshot.records || []) {
    const current = (record[field] || []).find(point => point.year === latestYear)?.[valueField];
    const history = (record[field] || [])
      .filter(point => point.year < latestYear)
      .map(point => point[valueField]);
    const anchors = historicalDistributionAnchors(history, 'annual');
    if (Number.isFinite(current) && anchors && current > anchors[0]) affectedContinents.add(record.continent);
  }
  return {
    normalized: affectedContinents.size / INHABITED_CONTINENTS,
    affected_continents: [...affectedContinents].sort(),
    represented_continents: [...new Set(snapshot.records.map(record => record.continent))].sort()
  };
}

function historicalReceipt({
  snapshot,
  nodeId,
  field,
  valueField,
  metricLabel,
  unit,
  sourceId = 'nasa_power_open_api'
}) {
  const series = annualPanelSeries(snapshot, field, valueField);
  if (series.length < 21) throw new Error(`${nodeId} requires at least 21 complete annual panel values to normalize current momentum; found ${series.length}.`);
  const latest = series.at(-1);
  const previous = series.at(-2);
  const prior = series.slice(0, -1);
  const changes = series.slice(1).map((point, index) => ({
    year: point.year,
    value: point.value - series[index].value
  }));
  const magnitudeReference = mean(prior.map(point => point.value));
  const priorAnomalies = prior.map(point => point.value - magnitudeReference);
  const magnitudeAnchors = historicalDistributionAnchors(priorAnomalies, 'annual');
  const thresholdAnchors = historicalDistributionAnchors(prior.map(point => point.value), 'annual');
  const momentumAnchors = historicalDistributionAnchors(changes.slice(0, -1).map(point => point.value), 'annual');
  if (!magnitudeAnchors || !thresholdAnchors || !momentumAnchors) {
    throw new Error(`${nodeId} failed the historical-distribution coverage gate.`);
  }
  const latestAnomaly = latest.value - magnitudeReference;
  const latestChange = changes.at(-1).value;
  const extent = localMedianExtent(snapshot, field, valueField, latest.year);
  const components = {
    magnitude: round(normalizeWithAnchors(latestAnomaly, magnitudeAnchors, 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.value, thresholdAnchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
    extent: round(extent.normalized)
  };
  const gate = {
    direct_components: ['magnitude', 'threshold', 'momentum', 'extent'],
    global_scope: true,
    current_observation: true
  };
  if (!qualifiesForCurrentData(gate)) throw new Error(`${nodeId} did not pass the current-data coverage gate.`);
  const receipt = buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'current_data',
    as_of: String(latest.year),
    components,
    raw_inputs: {
      magnitude: {
        metric: metricLabel,
        latest_equal_location_panel_value: round(latest.value),
        historical_mean_reference: round(magnitudeReference),
        latest_anomaly_from_reference: round(latestAnomaly),
        historical_distribution_anchors: magnitudeAnchors.map(value => round(value)),
        unit,
        direction: 'higher_is_worse'
      },
      threshold: {
        latest_equal_location_panel_value: round(latest.value),
        historical_distribution_anchors: thresholdAnchors.map(value => round(value)),
        threshold_basis: 'historical_distribution_no_recognized_global_threshold',
        complete_prior_annual_observations: prior.length,
        unit,
        direction: 'higher_is_worse'
      },
      momentum: {
        latest_change: round(latestChange),
        from_year: previous.year,
        to_year: latest.year,
        historical_distribution_anchors: momentumAnchors.map(value => round(value)),
        complete_prior_annual_change_observations: changes.length - 1,
        unit: `${unit} per year`,
        direction: 'higher_is_worse'
      },
      extent: {
        affected_continents: extent.affected_continents,
        represented_continents: extent.represented_continents,
        rule: 'continent counts as affected when at least one sentinel location is above its prior annual median',
        normalized_value: round(extent.normalized)
      },
      source_snapshot: {
        path: 'public/power-heat-hazard-snapshot.json',
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        aggregation_boundary: snapshot.aggregation_boundary,
        complete_panel_years: series.length,
        location_count: snapshot.location_count
      },
      coverage_gate: gate
    },
    transformations: [
      {
        type: 'equal_location_annual_panel_aggregation',
        formula: `For each complete year, average ${valueField} across all ${snapshot.location_count} fixed sentinel locations; do not population- or area-weight.`
      },
      {
        type: 'historical_distribution_magnitude',
        formula: 'Subtract the prior-year mean reference from each annual panel value and map the latest anomaly through the prior median, p75, p90 and p97.5 anchors.'
      },
      {
        type: 'historical_distribution_threshold',
        formula: 'Because no recognized global threshold exists, map the latest annual panel value through the prior median, p75, p90 and p97.5 anchors.'
      },
      {
        type: 'annual_momentum',
        formula: 'Subtract the preceding complete-year panel value from the latest value and normalize against prior year-over-year changes.'
      },
      {
        type: 'sentinel_continent_extent',
        formula: 'Divide represented inhabited continents with at least one location above its local prior annual median by six.'
      }
    ],
    source_ids: [sourceId],
    uncertainty: `${snapshot.uncertainty} Equal-location results are a reproducible global sentinel index, not a population- or area-weighted global field.`,
    freshness: `Latest complete calendar year ${latest.year}; NASA POWER snapshot captured ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `${series.length} complete annual values across the fixed ${snapshot.location_count}-location, six-continent panel supply current magnitude, historical threshold position, momentum and extent.`,
      higher_priority_failures: []
    }
  });
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`Receipt verification failed for ${nodeId}.`);
  return receipt;
}

function wetBulbReceipt(powerSnapshot, heatHealthSnapshot) {
  const records = powerSnapshot.records || [];
  if (records.length !== powerSnapshot.location_count || records.some(record => record.hourly_completeness_pct < 95)) {
    throw new Error('wet_bulb_heat requires every declared sentinel location to pass 95 percent hourly completeness.');
  }
  const workLoss = (heatHealthSnapshot.records || [])
    .filter(record => record.metric_id === 'heat_related_working_hour_loss'
      && record.geography_name === 'World'
      && Number.isFinite(record.value))
    .sort((left, right) => left.observation_year - right.observation_year);
  const changes = workLoss.slice(1).map((record, index) => ({
    year: record.observation_year,
    value: record.value - workLoss[index].value
  }));
  const momentumAnchors = historicalDistributionAnchors(changes.slice(0, -1).map(point => point.value), 'annual');
  if (!momentumAnchors) throw new Error('wet_bulb_heat impact-filled momentum does not pass the historical-observation gate.');
  const latestWorkLoss = workLoss.at(-1);
  const latestWorkLossChange = changes.at(-1);
  const exposedContinents = [...new Set(records
    .filter(record => record.maximum_wet_bulb_c >= WET_BULB_ANCHORS_C[0])
    .map(record => record.continent))].sort();
  const components = {
    magnitude: round(mean(records.map(record => normalizeWithAnchors(record.maximum_wet_bulb_c, WET_BULB_ANCHORS_C, 'higher_is_worse')))),
    threshold: round(mean(records.map(record => normalizeWithAnchors(record.wet_bulb_p95_c, WET_BULB_ANCHORS_C, 'higher_is_worse')))),
    momentum: round(normalizeWithAnchors(latestWorkLossChange.value, momentumAnchors, 'higher_is_worse')),
    extent: round(exposedContinents.length / INHABITED_CONTINENTS)
  };
  const gate = {
    direct_components: ['magnitude', 'threshold', 'extent'],
    global_scope: true,
    current_observation: true
  };
  if (!qualifiesForCurrentData(gate)) throw new Error('wet_bulb_heat did not pass the current-data coverage gate.');
  const receipt = buildTulipUrgencyReceipt({
    node_id: 'wet_bulb_heat',
    method: 'current_data',
    as_of: String(powerSnapshot.observation_period.end),
    components,
    raw_inputs: {
      magnitude: {
        location_maximum_wet_bulb_c: records.map(record => ({ location_id: record.location_id, value: record.maximum_wet_bulb_c })),
        documented_anchors_c: WET_BULB_ANCHORS_C,
        aggregation: 'equal-location mean of locally normalized values',
        direction: 'higher_is_worse'
      },
      threshold: {
        location_p95_wet_bulb_c: records.map(record => ({ location_id: record.location_id, value: record.wet_bulb_p95_c })),
        documented_anchors_c: WET_BULB_ANCHORS_C,
        aggregation: 'equal-location mean of locally normalized values',
        direction: 'higher_is_worse'
      },
      momentum: {
        fill_type: 'quantitative_accumulated_impact_indicator',
        metric_id: 'heat_related_working_hour_loss',
        latest_observation_year: latestWorkLoss.observation_year,
        latest_global_potential_work_hours_lost: latestWorkLoss.value,
        latest_annual_change_hours: latestWorkLossChange.value,
        historical_distribution_anchors_annual_change_hours: momentumAnchors.map(value => round(value)),
        complete_prior_annual_change_observations: changes.length - 1,
        direction: 'higher_is_worse'
      },
      extent: {
        threshold_c: WET_BULB_ANCHORS_C[0],
        exposed_continents: exposedContinents,
        represented_inhabited_continents: INHABITED_CONTINENTS,
        normalized_value: round(exposedContinents.length / INHABITED_CONTINENTS)
      },
      source_snapshots: [
        { path: 'public/power-heat-hazard-snapshot.json', version: powerSnapshot.version, captured_at: powerSnapshot.captured_at },
        { path: 'public/heat-health-snapshot.json', version: heatHealthSnapshot.version, captured_at: heatHealthSnapshot.captured_at }
      ],
      coverage_gate: gate
    },
    transformations: [
      {
        type: 'recognized_wet_bulb_anchor_normalization',
        formula: 'Normalize each location maximum and p95 wet-bulb temperature through 26, 28, 32 and 35 degrees Celsius, then take the equal-location mean.'
      },
      {
        type: 'accumulated_impact_momentum_fill',
        formula: 'Normalize the latest annual change in global potential heat-related work hours lost through the prior annual-change median, p75, p90 and p97.5 distribution.'
      },
      {
        type: 'sentinel_continent_extent',
        formula: 'Divide inhabited continents with at least one sentinel location reaching 26 degrees Celsius maximum wet-bulb temperature by six.'
      }
    ],
    source_ids: ['nasa_power_open_api', 'lancet_countdown_data_explorer'],
    uncertainty: `${powerSnapshot.uncertainty} The momentum component is a quantitative accumulated-impact fill based on modeled potential work-hour loss and is not a direct wet-bulb trend.`,
    freshness: `Wet-bulb observations cover complete calendar year ${powerSnapshot.records[0].observation_year}; work-loss impact series extends through ${latestWorkLoss.observation_year}.`,
    selection_reason: {
      selected_method_passed: 'Current wet-bulb magnitude, recognized-threshold position and six-continent reach supply 75 percent direct weight; the remaining momentum component is filled by a quantitative global heat-work impact series.',
      higher_priority_failures: []
    }
  });
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for wet_bulb_heat.');
  return receipt;
}

export function buildPowerHeatCurrentReceipts(powerSnapshot, heatHealthSnapshot) {
  const receipts = [
    wetBulbReceipt(powerSnapshot, heatHealthSnapshot),
    historicalReceipt({
      snapshot: powerSnapshot,
      nodeId: 'humidity_amplification',
      field: 'annual_mean_column_water_vapour_series',
      valueField: 'value_kg_m2',
      metricLabel: 'annual mean total-column water vapour',
      unit: 'kilograms per square metre'
    }),
    historicalReceipt({
      snapshot: powerSnapshot,
      nodeId: 'extreme_precipitation_intensity',
      field: 'annual_maximum_precipitation_series',
      valueField: 'value_mm_day',
      metricLabel: 'annual maximum corrected daily precipitation',
      unit: 'millimetres per day'
    }),
    historicalReceipt({
      snapshot: powerSnapshot,
      nodeId: 'environ_anomalies',
      field: 'compound_hot_heavy_precip_annual_series',
      valueField: 'days',
      metricLabel: 'same-day local-p95 heat and heavy-precipitation co-occurrence',
      unit: 'days per location-year'
    }),
    historicalReceipt({
      snapshot: powerSnapshot,
      nodeId: 'atmospheric_dryness',
      field: 'annual_mean_daily_vapour_pressure_deficit_series',
      valueField: 'value_kpa',
      metricLabel: 'annual mean daily near-surface vapour-pressure deficit',
      unit: 'kilopascals'
    }),
    historicalReceipt({
      snapshot: powerSnapshot,
      nodeId: 'nocturnal_heat_stress',
      field: 'warm_night_annual_series',
      valueField: 'nights',
      metricLabel: 'night-time minimum-temperature days above the local 1991-2020 p95 threshold',
      unit: 'nights per location-year'
    }),
    historicalReceipt({
      snapshot: powerSnapshot,
      nodeId: 'compound_day_night_heat_extremes',
      field: 'compound_hot_day_night_annual_series',
      valueField: 'days',
      metricLabel: 'days in consecutive runs with both daily maximum and minimum temperature above local 1991-2020 p95 thresholds',
      unit: 'event-days per location-year'
    })
  ];
  const duplicates = receipts.filter((receipt, index) => receipts.findIndex(candidate => candidate.node_id === receipt.node_id) !== index);
  if (duplicates.length) throw new Error(`Duplicate POWER urgency receipts: ${duplicates.map(receipt => receipt.node_id).join(', ')}`);
  return receipts;
}
