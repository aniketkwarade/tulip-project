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
const SNAPSHOT_PATH = 'public/enso-monitoring-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));

function strictMonthlyAnchors(values) {
  const anchors = historicalDistributionAnchors(values, 'monthly');
  if (!anchors) throw new Error(`Historical distribution gate failed for ${values.length} overlapping seasonal observations.`);
  const scale = Math.max(1, ...anchors.map(Math.abs));
  const epsilon = scale * 1e-9;
  return anchors.map((anchor, index) => index === 0 ? anchor : Math.max(anchor, anchors[index - 1] + epsilon));
}

function buildReceipt({ nodeId, metricId, phase }) {
  const records = snapshot.records.filter(record => record.metric_id === metricId && Number.isFinite(record.oni_anomaly_degC));
  if (records.length < 60) throw new Error(`${nodeId} has only ${records.length} complete overlapping ONI seasons.`);
  const phaseIntensity = records.map(record => phase === 'warm'
    ? Math.max(0, record.oni_anomaly_degC)
    : Math.max(0, -record.oni_anomaly_degC));
  const changes = phaseIntensity.slice(1).map((value, index) => value - phaseIntensity[index]);
  const magnitudeAnchors = strictMonthlyAnchors(phaseIntensity);
  const thresholdAnchors = strictMonthlyAnchors(phaseIntensity);
  const momentumAnchors = strictMonthlyAnchors(changes);
  const latest = records.at(-1);
  const latestIntensity = phaseIntensity.at(-1);
  const latestChange = changes.at(-1);

  return buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'current_data',
    as_of: latest.observation_period,
    components: {
      magnitude: round(normalizeWithAnchors(latestIntensity, magnitudeAnchors, 'higher_is_worse')),
      threshold: round(normalizeWithAnchors(latestIntensity, thresholdAnchors, 'higher_is_worse')),
      momentum: round(normalizeWithAnchors(latestChange, momentumAnchors, 'higher_is_worse')),
      extent: 1
    },
    raw_inputs: {
      magnitude: {
        latest_oni_anomaly_degC: latest.oni_anomaly_degC,
        latest_phase_intensity_degC: latestIntensity,
        phase,
        complete_overlapping_season_observations: records.length,
        anchors: magnitudeAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      threshold: {
        latest_phase_intensity_degC: latestIntensity,
        noaa_threshold_met_this_season: latest.threshold_met_this_season,
        noaa_episode_criterion_met: latest.episode_criterion_met,
        consecutive_qualifying_overlapping_seasons: latest.consecutive_qualifying_overlapping_seasons,
        noaa_episode_criterion: latest.episode_criterion,
        normalization_basis: 'historical_distribution_fallback over phase-specific intensity; NOAA episode status retained separately and never inferred from one crossing',
        anchors: thresholdAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      momentum: {
        latest_overlapping_season_change_degC: round(latestChange),
        complete_change_observations: changes.length,
        anchors: momentumAnchors.map(value => round(value)),
        source_locator: latest.source_locator
      },
      extent: {
        normalized_value: 1,
        definition: 'ONI is the complete NOAA-defined Niño 3.4 rolling three-month domain measure for this phase; complete node-domain coverage does not mean uniform global impact.',
        source_locator: latest.source_locator
      },
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        measurement_boundary: snapshot.measurement_boundary,
        source_history_start: records[0].observation_period,
        source_history_end: latest.observation_period
      }
    },
    transformations: [
      {
        type: 'phase_specific_oni_intensity',
        formula: phase === 'warm' ? 'max(ONI anomaly, 0)' : 'max(-ONI anomaly, 0)'
      },
      {
        type: 'historical_distribution_normalization',
        formula: 'Map phase-specific ONI intensity and its overlapping-season change through median / p75 / p90 / p97.5 anchors across the complete source history.'
      }
    ],
    source_ids: ['noaa_physical_sciences_laboratory_enso'],
    uncertainty: `${snapshot.uncertainty} ONI measures the coupled Pacific state; downstream harm varies by season and geography, and one threshold crossing is not labeled an episode.`,
    freshness: `Official NOAA CPC ONI table through ${latest.observation_period}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `NOAA supplies ${records.length} complete source-native rolling three-month observations for the exact ${phase}-phase contract, including phase-specific magnitude, historical position, momentum, official episode metadata and complete node-domain coverage.`,
      higher_priority_failures: []
    }
  });
}

const receipts = [
  buildReceipt({ nodeId: 'el_nino', metricId: 'noaa_oni_warm_phase', phase: 'warm' }),
  buildReceipt({ nodeId: 'la_nina', metricId: 'noaa_oni_cool_phase', phase: 'cool' })
];
for (const receipt of receipts) {
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`Receipt verification failed for ${receipt.node_id}.`);
}

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_17_noaa_oni_phase_intensity',
  generated_at: new Date().toISOString(),
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-17.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-current-evidence-wave-17.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(receipt => ({ node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }))
}, null, 2));
