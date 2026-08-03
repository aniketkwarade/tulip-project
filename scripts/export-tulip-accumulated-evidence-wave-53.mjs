import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildTulipUrgencyReceipt,
  normalizeWithAnchors,
  qualifiesForImpactFallback,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-fisheries-conflict-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const coverage = snapshot.assessment.coverage;
const burden = snapshot.assessment.accumulated_conflict_burden;
const human = snapshot.assessment.human_security_burden;
const persistence = snapshot.assessment.persistence;
const extent = snapshot.assessment.geographic_extent;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(burden.unique_event_count, [0, 50, 250, 750]),
  human_economic_burden: n(human.high_intensity_event_share_pct, [0, 1, 5, 15]),
  persistence: n(persistence.inclusive_observation_years, [0, 5, 20, 50]),
  extent: n(extent.represented_continent_count, [0, 1, 3, 6])
};

if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) {
  throw new Error('fishery_border_dispute_zones: accumulated-impact gate failed');
}

const receipt = buildTulipUrgencyReceipt({
  node_id: 'fishery_border_dispute_zones',
  method: 'impact_fallback',
  as_of: String(coverage.last_year),
  components,
  raw_inputs: {
    biophysical_burden: {
      unique_event_count: burden.unique_event_count,
      actor_event_row_count: coverage.actor_event_row_count,
      intensity_scale_min: burden.intensity_scale_min,
      intensity_scale_max: burden.intensity_scale_max,
      event_counts_by_intensity: burden.event_counts_by_intensity,
      normalization_anchors_events: [0, 50, 250, 750]
    },
    human_economic_burden: {
      high_intensity_levels: human.high_intensity_levels,
      high_intensity_event_count: human.high_intensity_event_count,
      high_intensity_event_share_pct: human.high_intensity_event_share_pct,
      death_associated_action_event_count: human.death_associated_action_event_count,
      normalization_anchors_high_intensity_event_share_pct: [0, 1, 5, 15],
      scoring_boundary: human.scoring_boundary
    },
    persistence: {
      first_year: coverage.first_year,
      last_year: coverage.last_year,
      inclusive_observation_years: persistence.inclusive_observation_years,
      years_with_recorded_events: coverage.years_with_recorded_events,
      source_reported_frequency_increased_over_period: persistence.source_reported_frequency_increased_over_period,
      normalization_anchors_years: [0, 5, 20, 50],
      scoring_boundary: persistence.scoring_boundary
    },
    extent: {
      unique_actor_code_count: extent.unique_actor_code_count,
      represented_continents: extent.represented_continents,
      represented_continent_count: extent.represented_continent_count,
      intercontinental_event_count: extent.intercontinental_event_count,
      intercontinental_event_share_pct: extent.intercontinental_event_share_pct,
      normalization_anchors_inhabited_continents: [0, 1, 3, 6],
      scoring_boundary: extent.scoring_boundary
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      reproduction: snapshot.reproduction,
      quality_checks: {
        event_id_blank_row_count: coverage.event_id_blank_row_count,
        inconsistent_event_year_count: coverage.inconsistent_event_year_count,
        inconsistent_event_intensity_count: coverage.inconsistent_event_intensity_count
      }
    }
  },
  transformations: [
    {
      type: 'deduplicated_accumulated_event_burden_normalization',
      formula: 'Deduplicate actor-event rows by Event ID, verify one year and one intensity per event, and normalize the 542 resulting conflict events. Do not add points for workbook rows or source volume.'
    },
    {
      type: 'high_intensity_human_security_burden_normalization',
      formula: 'Normalize the share of unique events at action-intensity levels 4 or 5. Retain the 13 death-associated actions as corroborating severity evidence without converting events into casualty counts.'
    },
    {
      type: 'observed_phenomenon_duration_normalization',
      formula: 'Normalize the inclusive 1974–2016 observation interval as persistence of the recorded global phenomenon. Do not convert the year without a recorded event into zero.'
    },
    {
      type: 'inhabited_continent_extent_normalization',
      formula: 'Normalize the six represented inhabited continents; retain the actor-code and intercontinental-event totals as coverage evidence without treating every code as a sovereign country.'
    },
    {
      type: 'impact_composite',
      formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1–10 with 1 + 9 × composite and round to one decimal.'
    }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `The global event record covers ${coverage.first_year}–${coverage.last_year}; the deposited 2020 workbook and 2021 peer-reviewed analysis were directly reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The deposited global event workbook directly quantifies 542 deduplicated fisheries-conflict events, categorical human-security severity, 43 years of persistence and coverage across all six inhabited continents.',
    higher_priority_failures: ['The event record ends in 2016 and cannot represent current global urgency in 2026.', 'No reviewed post-2016 continuation supplies a current endpoint, recent momentum and comparable global coverage.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for fishery_border_dispute_zones.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_53_global_fisheries_conflict',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-53.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-53.json',
  promoted_node_count: registry.promoted_node_count,
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
