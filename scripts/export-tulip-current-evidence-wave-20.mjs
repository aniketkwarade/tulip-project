import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/coral-reef-watch-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const event = snapshot.current_global_bleaching_event;
const contract = snapshot.global_bleaching_stress_extent_contract;
const round = (value, digits = 6) => Number(value.toFixed(digits));

if (contract.history_start_year > 2006) throw new Error('Coral bleaching history no longer passes the 20-year gate.');
if (event.tropical_ocean_basins_affected !== event.tropical_ocean_basin_count) throw new Error('Latest global event does not cover all three tropical ocean basins.');
if (event.reef_area_with_bleaching_level_heat_stress_pct < contract.global_event_threshold_pct) throw new Error('Latest global event does not exceed the documented global-event threshold.');

const recordIncreasePct = 100 * (event.reef_area_with_bleaching_level_heat_stress_pct - event.previous_record_reef_area_pct) / event.previous_record_reef_area_pct;
const remainingHeadroomCaptured = (event.reef_area_with_bleaching_level_heat_stress_pct - event.previous_record_reef_area_pct) / (100 - event.previous_record_reef_area_pct);

const receipt = buildTulipUrgencyReceipt({
  node_id: 'coral_bleaching',
  method: 'current_data',
  as_of: event.source_updated_at,
  components: {
    magnitude: round(normalizeWithAnchors(event.reef_area_with_bleaching_level_heat_stress_pct, [0, contract.global_event_threshold_pct, event.previous_record_reef_area_pct, 100], 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(event.reef_area_with_bleaching_level_heat_stress_pct, [0, contract.global_event_threshold_pct / 2, contract.global_event_threshold_pct, contract.global_event_threshold_pct * 2], 'higher_is_worse')),
    momentum: round(Math.max(0, Math.min(1, remainingHeadroomCaptured))),
    extent: round(event.tropical_ocean_basins_affected / event.tropical_ocean_basin_count)
  },
  raw_inputs: {
    magnitude: {
      latest_global_event_reef_area_with_bleaching_level_heat_stress_pct: event.reef_area_with_bleaching_level_heat_stress_pct,
      previous_record_reef_area_pct: event.previous_record_reef_area_pct,
      anchors_pct: [0, contract.global_event_threshold_pct, event.previous_record_reef_area_pct, 100],
      observation_start: event.observation_start,
      observation_end: event.observation_end,
      measurement_boundary: event.measurement_boundary
    },
    threshold: {
      latest_global_event_reef_area_pct: event.reef_area_with_bleaching_level_heat_stress_pct,
      recognized_global_event_threshold_pct: contract.global_event_threshold_pct,
      recognized_basin_event_threshold_pct: contract.basin_event_threshold_pct,
      minimum_concurrent_duration_days: contract.minimum_concurrent_duration_days,
      threshold_multiple: round(event.reef_area_with_bleaching_level_heat_stress_pct / contract.global_event_threshold_pct),
      anchors_pct: [0, contract.global_event_threshold_pct / 2, contract.global_event_threshold_pct, contract.global_event_threshold_pct * 2]
    },
    momentum: {
      latest_global_event_reef_area_pct: event.reef_area_with_bleaching_level_heat_stress_pct,
      previous_record_reef_area_pct: event.previous_record_reef_area_pct,
      previous_event_period: `${event.previous_global_event_start_year}-${event.previous_global_event_end_year}`,
      record_increase_pct: round(recordIncreasePct),
      share_of_remaining_physical_headroom_captured: round(remainingHeadroomCaptured),
      formula: '(latest event area - previous record area) / (100 - previous record area)'
    },
    extent: {
      affected_tropical_ocean_basins: event.tropical_ocean_basins_affected,
      tropical_ocean_basin_count: event.tropical_ocean_basin_count,
      normalized_value: round(event.tropical_ocean_basins_affected / event.tropical_ocean_basin_count),
      jurisdictions_with_documented_mass_bleaching_lower_bound: event.jurisdictions_with_documented_mass_bleaching_lower_bound
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      updated_at: snapshot.updated_at,
      source_updated_at: event.source_updated_at,
      product_version: contract.product_version,
      history_start_year: contract.history_start_year,
      rolling_window_days: contract.rolling_window_days
    }
  },
  transformations: [
    { type: 'recognized_threshold_and_record_anchors', formula: 'Normalize global reef-area heat-stress extent using zero, the NOAA global-event threshold, the previous global-event record and the physical 100-percent ceiling.' },
    { type: 'recognized_threshold_exceedance', formula: 'Normalize current extent against zero, half the NOAA global-event threshold, the threshold and twice the threshold; cap exceedance at one.' },
    { type: 'record_headroom_momentum', formula: 'Express the new record increment as the share of physical headroom remaining above the previous record.' },
    { type: 'global_basin_extent', formula: 'Divide tropical reef-containing ocean basins affected by the fixed three-basin denominator.' }
  ],
  source_ids: ['noaa_coral_reef_watch'],
  uncertainty: snapshot.uncertainty,
  freshness: `NOAA status updated ${event.source_updated_at}; operational daily 365-day product v${contract.product_version}; snapshot refreshed ${snapshot.updated_at}.`,
  selection_reason: {
    selected_method_passed: `NOAA supplies an operational daily global 5 km bleaching-stress product with history since ${contract.history_start_year}, a documented ${contract.global_event_threshold_pct}% global-event threshold, ${event.reef_area_with_bleaching_level_heat_stress_pct}% latest-event reef-area exposure, a ${event.previous_record_reef_area_pct}% previous-event record and coverage of all ${event.tropical_ocean_basin_count} tropical reef-containing basins.`,
    higher_priority_failures: []
  }
});

const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`Receipt verification failed for coral_bleaching: ${verification.errors.join('; ')}`);
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'current_evidence_wave_20_noaa_global_coral_bleaching',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'noaa_coral_reef_watch',
  promoted_node_count: 1,
  rejected_candidates: [{
    node_id: 'reef_structural_collapse',
    reason: 'Bleaching-level heat stress and documented mass bleaching do not quantify loss of reef rugosity, carbonate accretion balance or structural collapse.'
  }],
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-20.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-20.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }, rejected_candidates: registry.rejected_candidates }, null, 2));
