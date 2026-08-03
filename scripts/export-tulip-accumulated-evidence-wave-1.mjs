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
const SNAPSHOT_PATH = path.join(ROOT, 'public/heat-health-snapshot.json');
const OUTPUT_PATH = path.join(ROOT, 'public/tulip-accumulated-evidence-wave-1.json');
const snapshot = JSON.parse(await fs.readFile(SNAPSHOT_PATH, 'utf8'));

const NODE_CONTRACTS = Object.freeze({
  public_health_heat_burden: {
    burden_kind: 'mortality',
    metric_id: 'heat_attributable_mortality_rate',
    biophysical_label: 'heat-attributable fraction of all deaths',
    human_label: 'heat-attributable deaths'
  },
  heat_related_mortality_burden: {
    burden_kind: 'mortality',
    metric_id: 'heat_attributable_deaths',
    biophysical_label: 'heat-attributable fraction of all deaths',
    human_label: 'heat-attributable deaths'
  },
  occupational_heat_exposure: {
    burden_kind: 'labour',
    metric_id: 'heat_related_working_hour_loss',
    biophysical_label: 'potential working hours lost per employed person',
    human_label: 'total potential working hours lost'
  },
  farm_heat_stress: {
    burden_kind: 'labour',
    metric_id: 'agricultural_potential_work_hours_lost_to_heat',
    biophysical_label: 'agricultural potential working hours lost per employed person',
    human_label: 'agricultural potential working hours lost'
  }
});

function round(value, digits = 6) {
  return Number(value.toFixed(digits));
}

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function strictAnchors(values, cadence = 'annual') {
  const anchors = historicalDistributionAnchors(values, cadence);
  if (!anchors) throw new Error(`Historical distribution gate failed with ${values.length} complete ${cadence} observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function globalSeries(nodeId, contract) {
  return snapshot.records
    .filter(record => record.node_id === nodeId && record.metric_id === contract.metric_id && record.geography_type === 'global')
    .sort((left, right) => left.observation_year - right.observation_year);
}

function intensityValue(record, contract) {
  if (contract.burden_kind === 'mortality') return record.heat_attributable_fraction_pct;
  if (!Number.isFinite(record.employed_population_15_plus) || record.employed_population_15_plus <= 0) return null;
  return record.value / record.employed_population_15_plus;
}

function extentRows(nodeId, contract, latestYear) {
  const geographyType = contract.burden_kind === 'mortality' ? 'who_region' : 'country_or_area';
  return snapshot.records.filter(record => (
    record.node_id === nodeId
    && record.metric_id === contract.metric_id
    && record.geography_type === geographyType
    && record.observation_year === latestYear
  ));
}

function buildReceipt(nodeId, contract) {
  const series = globalSeries(nodeId, contract);
  if (series.length < 20) throw new Error(`${nodeId} has only ${series.length} complete global annual observations.`);
  const humanSeries = series.map(record => record.value).filter(Number.isFinite);
  const biophysicalSeries = series.map(record => intensityValue(record, contract)).filter(Number.isFinite);
  if (humanSeries.length !== series.length || biophysicalSeries.length !== series.length) {
    throw new Error(`${nodeId} has incomplete accumulated-impact inputs.`);
  }
  const humanAnchors = strictAnchors(humanSeries);
  const biophysicalAnchors = strictAnchors(biophysicalSeries);
  const latest = series.at(-1);
  const latestHuman = latest.value;
  const latestBiophysical = intensityValue(latest, contract);
  const historicalMedian = median(humanSeries);
  const persistenceWindow = series.slice(-10);
  const persistentYears = persistenceWindow.filter(record => record.value > historicalMedian).length;
  const extent = extentRows(nodeId, contract, latest.observation_year);
  if (!extent.length) throw new Error(`${nodeId} has no latest-year geographic extent rows.`);
  const affectedGeographies = extent.filter(record => Number.isFinite(record.value) && record.value > 0).length;
  const components = {
    biophysical_burden: round(normalizeWithAnchors(latestBiophysical, biophysicalAnchors, 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(latestHuman, humanAnchors, 'higher_is_worse')),
    persistence: round(persistentYears / persistenceWindow.length),
    extent: round(affectedGeographies / extent.length)
  };
  const sourceLocators = [...new Set(series.map(record => record.source_locator).filter(Boolean))];
  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(latest.observation_year),
    components,
    raw_inputs: {
      biophysical_burden: {
        indicator: contract.biophysical_label,
        latest_value: round(latestBiophysical),
        latest_year: latest.observation_year,
        unit: contract.burden_kind === 'mortality' ? 'percent of all deaths' : 'potential work hours lost per employed person',
        historical_observations: biophysicalSeries.length,
        historical_anchors: biophysicalAnchors.map(value => round(value)),
        source_metric_id: contract.metric_id
      },
      human_economic_burden: {
        indicator: contract.human_label,
        latest_value: round(latestHuman),
        latest_year: latest.observation_year,
        unit: latest.unit,
        historical_observations: humanSeries.length,
        historical_anchors: humanAnchors.map(value => round(value)),
        source_metric_id: contract.metric_id
      },
      persistence: {
        definition: 'Share of the latest ten complete global annual observations above the full-history median burden.',
        window_years: persistenceWindow.map(record => record.observation_year),
        historical_median: round(historicalMedian),
        years_above_median: persistentYears,
        window_observations: persistenceWindow.length
      },
      extent: {
        definition: contract.burden_kind === 'mortality'
          ? 'Share of WHO regions with a positive source-reported burden in the latest common year.'
          : 'Share of retained countries or areas with a positive source-reported burden in the latest common year.',
        latest_year: latest.observation_year,
        affected_geographies: affectedGeographies,
        retained_geographies: extent.length
      },
      source_snapshot: {
        path: 'public/heat-health-snapshot.json',
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        source_locators: sourceLocators
      }
    },
    transformations: [
      {
        type: 'historical_distribution_normalization',
        components: ['biophysical_burden', 'human_economic_burden'],
        anchors: 'median, 75th percentile, 90th percentile, 97.5th percentile across complete global annual observations',
        direction: 'higher_is_worse'
      },
      {
        type: 'quantitative_persistence_ratio',
        formula: 'latest ten annual observations above full-history median / ten'
      },
      {
        type: 'quantitative_geographic_extent_ratio',
        formula: 'latest-year retained geographies with positive burden / all retained latest-year geographies'
      }
    ],
    source_ids: ['lancet_countdown_data_explorer'],
    uncertainty: snapshot.uncertainty,
    freshness: `Annual source release; snapshot captured ${snapshot.captured_at}. Latest complete global burden year is ${latest.observation_year}.`,
    selection_reason: {
      selected_method_passed: `The source supplies ${series.length} complete global annual burden observations plus quantitative persistence and geographic extent; all four accumulated-impact components are source-backed.`,
      higher_priority_failures: [
        'The source labels these as provider-modelled impact estimates rather than direct current physical observations, so they are not promoted as empirical/current-data scores.',
        'No recognized current-condition threshold contract is available for the full current-data method.'
      ]
    }
  });
}

const receipts = Object.entries(NODE_CONTRACTS).map(([nodeId, contract]) => buildReceipt(nodeId, contract));
for (const receipt of receipts) {
  const verification = verifyTulipUrgencyReceipt(receipt);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${receipt.node_id}`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_1_heat_health',
  generated_at: new Date().toISOString(),
  source_snapshot: 'public/heat-health-snapshot.json',
  source_id: 'lancet_countdown_data_explorer',
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-1.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }))
}, null, 2));
