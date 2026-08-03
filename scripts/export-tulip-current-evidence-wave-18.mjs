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
const SNAPSHOT_PATH = 'public/ocha-humanitarian-history-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

const CONFIG = Object.freeze({
  humanitarian_response_funding_shortfall: {
    value_field: 'reported_funding_shortfall_pct_complete_panel',
    value_label: 'reported plan-linked funding shortfall',
    extent: record => record.funding_plan_coverage_pct / 100,
    extent_definition: 'Plans with an explicit grouped FTS funding result divided by positive-requirement plans returned for the year.'
  },
  humanitarian_resource_gaps: {
    value_field: 'reported_funding_shortfall_pct_complete_panel',
    value_label: 'reported financial resource gap',
    extent: record => record.funding_plan_coverage_pct / 100,
    extent_definition: 'Plans with an explicit grouped FTS funding result divided by positive-requirement plans returned for the year.'
  },
  humanitarian_surge_demand: {
    value_field: 'positive_requirement_revision_pct_of_original',
    value_label: 'positive plan-requirement revision ratio',
    extent: record => record.countries_or_territories_in_plans > 0
      ? record.countries_or_territories_with_positive_revision / record.countries_or_territories_in_plans
      : 0,
    extent_definition: 'Countries or territories represented in plans with a positive requirement revision divided by all countries or territories represented in the annual plan panel.'
  }
});

function strictAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const scale = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = scale * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function buildReceipt(nodeId, config) {
  const records = snapshot.annual_summaries
    .filter(record => Number.isInteger(record.observation_year) && Number.isFinite(record[config.value_field]))
    .sort((left, right) => left.observation_year - right.observation_year);
  if (records.length < 20) throw new Error(`${nodeId} has only ${records.length} complete annual observations.`);
  const values = records.map(record => record[config.value_field]);
  const changes = values.slice(1).map((value, index) => value - values[index]);
  if (changes.length < 20) throw new Error(`${nodeId} has only ${changes.length} annual changes.`);
  const reference = records[0];
  const latest = records.at(-1);
  const magnitudeAnchors = strictAnchors(values.map(value => value - reference[config.value_field]));
  const thresholdAnchors = strictAnchors(values);
  const momentumAnchors = strictAnchors(changes);
  const latestChange = changes.at(-1);
  const extent = config.extent(latest);

  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'current_data',
    as_of: String(latest.observation_year),
    components: {
      magnitude: round(normalizeWithAnchors(latest[config.value_field] - reference[config.value_field], magnitudeAnchors, 'higher_is_worse')),
      threshold: round(normalizeWithAnchors(latest[config.value_field], thresholdAnchors, 'higher_is_worse')),
      momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
      extent: round(extent)
    },
    raw_inputs: {
      magnitude: {
        latest_value_pct: latest[config.value_field],
        reference_year: reference.observation_year,
        reference_value_pct: reference[config.value_field],
        change_against_reference_percentage_points: round(latest[config.value_field] - reference[config.value_field]),
        complete_annual_observations: records.length,
        anchors_percentage_points: magnitudeAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      threshold: {
        latest_value_pct: latest[config.value_field],
        threshold_basis: 'historical_distribution_fallback',
        anchors_pct: thresholdAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      momentum: {
        latest_annual_change_percentage_points: round(latestChange),
        annual_change_observations: changes.length,
        anchors_percentage_points_per_year: momentumAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      extent: {
        normalized_value: round(extent),
        definition: config.extent_definition,
        positive_requirement_plans: latest.positive_requirement_plans,
        plans_with_grouped_reported_funding: latest.plans_with_grouped_reported_funding,
        countries_or_territories_in_plans: latest.countries_or_territories_in_plans,
        countries_or_territories_with_positive_revision: latest.countries_or_territories_with_positive_revision,
        source_locator: latest.source_locator
      },
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        retained_history_start: reference.observation_year,
        retained_history_end: latest.observation_year,
        retained_history_record_count: records.length
      }
    },
    transformations: [
      {
        type: 'source_joined_global_annual_ratio',
        formula: `For each plan year, calculate the ${config.value_label} only from explicit OCHA plan requirements and explicit grouped FTS values; absent funding groups remain missing.`
      },
      {
        type: 'dimensionless_historical_comparison',
        formula: 'Use source-consistent annual percentages rather than nominal dollar totals so price-level change does not drive the historical position.'
      },
      {
        type: 'historical_distribution_threshold_fallback',
        formula: `Map the latest percentage through median / p75 / p90 / p97.5 anchors from ${reference.observation_year}-${latest.observation_year}.`
      },
      {
        type: 'year_over_year_momentum',
        formula: 'Map the latest percentage-point change through the distribution of complete annual changes.'
      }
    ],
    source_ids: ['ocha_humanitarian_programme_cycle_public_api'],
    uncertainty: snapshot.uncertainty,
    freshness: `OCHA completed plan-year history through ${latest.observation_year}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `The official OCHA plan and FTS endpoints supply ${records.length} complete annual global panels with current magnitude, historical position, momentum, and explicit reporting or geographic extent.`,
      higher_priority_failures: []
    }
  });
}

const receipts = Object.entries(CONFIG).map(([nodeId, config]) => buildReceipt(nodeId, config));
for (const receipt of receipts) {
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`Receipt verification failed for ${receipt.node_id}.`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_18_ocha_humanitarian_history',
  generated_at: new Date().toISOString(),
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-18.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-18.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }))
}, null, 2));
