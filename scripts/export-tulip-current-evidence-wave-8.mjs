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
const SNAPSHOT_PATH = 'public/gcb-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictHigherAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'annual');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} annual observations.`);
  const magnitude = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function strictLowerAnchors(values) {
  const reversed = strictHigherAnchors(values.map(value => -value)).map(value => -value);
  const magnitude = Math.max(1, ...reversed.map(Math.abs));
  const epsilon = magnitude * 1e-9;
  return reversed.map((anchor, index) => index === 0 ? anchor : Math.min(anchor, reversed[index - 1] - epsilon));
}

function buildSinkReceipt({ nodeId, sinkField, metricName, sourceId }) {
  const points = snapshot.annual_global_budget
    .map(record => {
      const anthropogenicEmissions = record.fossil_emissions_excluding_carbonation_gtc_yr
        + record.land_use_change_emissions_gtc_yr;
      return {
        year: record.year,
        sink_gtc_yr: record[sinkField],
        anthropogenic_emissions_gtc_yr: anthropogenicEmissions,
        efficiency_pct: record[sinkField] / anthropogenicEmissions * 100
      };
    })
    .filter(point => Number.isFinite(point.efficiency_pct) && point.anthropogenic_emissions_gtc_yr > 0)
    .sort((left, right) => left.year - right.year);
  if (points.length < 20) throw new Error(`${nodeId} has only ${points.length} complete annual global budget observations.`);

  const efficiencies = points.map(point => point.efficiency_pct);
  const thresholdAnchors = strictLowerAnchors(efficiencies);
  const baseline = thresholdAnchors[0];
  const deficits = efficiencies.map(value => baseline - value);
  const changes = points.slice(1).map((point, index) => point.efficiency_pct - points[index].efficiency_pct);
  const magnitudeAnchors = strictHigherAnchors(deficits);
  const momentumAnchors = strictLowerAnchors(changes);
  const latest = points.at(-1);
  const latestChange = changes.at(-1);
  const sourceUrl = snapshot.downloads.find(download => download.label === 'Global Carbon Budget v2025')?.url
    ?? snapshot.source.url;

  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'current_data',
    as_of: String(latest.year),
    components: {
      magnitude: round(normalizeWithAnchors(baseline - latest.efficiency_pct, magnitudeAnchors, 'higher_is_worse')),
      threshold: round(normalizeWithAnchors(latest.efficiency_pct, thresholdAnchors, 'lower_is_worse')),
      momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'lower_is_worse')),
      extent: 1
    },
    raw_inputs: {
      magnitude: {
        latest_sink_efficiency_pct: round(latest.efficiency_pct),
        historical_median_efficiency_pct: round(baseline),
        deficit_from_historical_median_percentage_points: round(baseline - latest.efficiency_pct),
        complete_annual_observations: points.length,
        anchors: magnitudeAnchors.map(value => round(value)),
        source_locator: sourceUrl
      },
      threshold: {
        latest_sink_gtc_yr: round(latest.sink_gtc_yr),
        latest_anthropogenic_emissions_gtc_yr: round(latest.anthropogenic_emissions_gtc_yr),
        latest_sink_efficiency_pct: round(latest.efficiency_pct),
        threshold_basis: 'historical_distribution_fallback_lower_is_worse',
        anchors: thresholdAnchors.map(value => round(value)),
        source_locator: sourceUrl
      },
      momentum: {
        latest_year_over_year_efficiency_change_percentage_points: round(latestChange),
        annual_change_observations: changes.length,
        anchors: momentumAnchors.map(value => round(value)),
        direction: 'lower_is_worse',
        source_locator: sourceUrl
      },
      extent: {
        geography: 'global carbon budget',
        normalized_value: 1,
        definition: `The source reports the ${metricName.toLowerCase()} as a global annual budget component.`,
        source_locator: sourceUrl
      },
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        release_year: snapshot.release.release_year,
        annual_panel_start: points[0].year,
        annual_panel_end: latest.year,
        source_sheet: snapshot.annual_global_budget_boundary.source_sheet,
        source_uncertainty: snapshot.annual_global_budget_boundary.uncertainty
      }
    },
    transformations: [
      {
        type: 'global_sink_efficiency',
        formula: `${sinkField} / (fossil emissions excluding carbonation + land-use-change emissions) × 100 for each source year`,
        rationale: 'A sink-efficiency fraction distinguishes weakening relative to the growing anthropogenic carbon input from a simple increase in absolute sink flux.'
      },
      {
        type: 'historical_distribution_normalization_lower_is_worse',
        formula: 'Map annual efficiency, deficit from its historical median and year-over-year efficiency change through median / p25 / p10 / p2.5 lower-tail anchors.'
      }
    ],
    source_ids: [sourceId],
    uncertainty: `${snapshot.annual_global_budget_boundary.uncertainty} Sink efficiency additionally inherits uncertainty and covariance from fossil and land-use-change emissions. Annual variability is not by itself attributed to long-term climate-driven weakening.`,
    freshness: `Global Carbon Budget ${snapshot.release.release_year} consolidated annual history through ${latest.year}; snapshot refreshed ${snapshot.updated_at}.`,
    selection_reason: {
      selected_method_passed: `The official Global Carbon Budget supplies ${points.length} complete annual global ${metricName.toLowerCase()} observations and matching anthropogenic-emission totals, enabling current magnitude, historical lower-tail position, momentum and global extent without treating missing data as zero.`,
      higher_priority_failures: []
    }
  });
}

const receipts = [
  buildSinkReceipt({
    nodeId: 'land_carbon_sink_weakening',
    sinkField: 'land_sink_gtc_yr',
    metricName: 'Land carbon sink',
    sourceId: 'global_carbon_budget_2025'
  }),
  buildSinkReceipt({
    nodeId: 'ocean_carbon_uptake_weakening',
    sinkField: 'ocean_sink_gtc_yr',
    metricName: 'Ocean carbon sink',
    sourceId: 'global_carbon_budget'
  })
];
for (const receipt of receipts) {
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`Receipt verification failed for ${receipt.node_id}.`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_8_global_carbon_sink_efficiency',
  generated_at: new Date().toISOString(),
  promoted_node_count: receipts.length,
  receipts
};
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-8.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-8.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }))
}, null, 2));
