import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-groundwater-level-trends-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const wells = a.source_data_figure_1;
const round = (value, digits = 6) => Number(value.toFixed(digits));

if (wells.well_trends_total !== 169717) throw new Error('Groundwater Figure 1 well-level denominator changed.');
if (wells.wells_deepening_over_0_1_m_per_year + wells.wells_shallowing_over_0_1_m_per_year > wells.well_trends_total) {
  throw new Error('Groundwater well-level threshold counts exceed the source-data denominator.');
}

const receipt = buildTulipUrgencyReceipt({
  node_id: 'groundwater_depletion_wells',
  method: 'current_data',
  as_of: String(a.publication_year),
  components: {
    magnitude: round(normalizeWithAnchors(wells.wells_deepening_over_0_1_m_per_year_pct, [0, 10, 25, 50], 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(wells.wells_deepening_over_0_5_m_per_year_pct, [0, 2, 8, 20], 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(a.accelerated_decline_share_pct, [a.random_acceleration_null_share_pct, 20, 30, 50], 'higher_is_worse')),
    extent: round(a.global_groundwater_withdrawal_coverage_pct_approx / 100)
  },
  raw_inputs: {
    magnitude: {
      wells_deepening_over_0_1_m_per_year: wells.wells_deepening_over_0_1_m_per_year,
      denominator: wells.well_trends_total,
      derived_share_pct: wells.wells_deepening_over_0_1_m_per_year_pct,
      direction: 'positive source slope means groundwater level becomes deeper',
      anchors_pct: [0, 10, 25, 50]
    },
    threshold: {
      wells_deepening_over_0_5_m_per_year: wells.wells_deepening_over_0_5_m_per_year,
      denominator: wells.well_trends_total,
      derived_share_pct: wells.wells_deepening_over_0_5_m_per_year_pct,
      study_rapid_decline_threshold_m_per_year: 0.5,
      anchors_pct: [0, 2, 8, 20]
    },
    momentum: {
      measurement_boundary: 'Aquifer-system comparison companion; it is not represented as a change in the well share.',
      accelerated_decline_share_pct: a.accelerated_decline_share_pct,
      comparison_aquifer_systems: a.long_history_aquifer_systems,
      null_expectation_pct: a.random_acceleration_null_share_pct,
      anchors_pct: [a.random_acceleration_null_share_pct, 20, 30, 50],
      counterevidence: { decelerated_pct: a.decelerated_decline_share_pct, reversed_pct: a.reversed_decline_share_pct, continued_rise_pct: a.continued_rise_share_pct }
    },
    extent: {
      global_groundwater_withdrawal_coverage_pct_approx: a.global_groundwater_withdrawal_coverage_pct_approx,
      countries_count_lower_bound: a.countries_count_lower_bound,
      normalized_value: round(a.global_groundwater_withdrawal_coverage_pct_approx / 100),
      boundary: 'Country withdrawal coverage, not a randomized share of global wells, aquifers, land or population.'
    },
    source_data: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      archive_url: wells.url,
      archive_sha256: wells.archive_sha256,
      csv_file: wells.file,
      csv_sha256: wells.csv_sha256,
      derivation: wells.derivation,
      counterevidence: {
        wells_shallowing_over_0_1_m_per_year: wells.wells_shallowing_over_0_1_m_per_year,
        wells_shallowing_over_0_1_m_per_year_pct: wells.wells_shallowing_over_0_1_m_per_year_pct,
        wells_shallowing_over_0_5_m_per_year: wells.wells_shallowing_over_0_5_m_per_year,
        wells_shallowing_over_0_5_m_per_year_pct: wells.wells_shallowing_over_0_5_m_per_year_pct
      },
      excluded_from_scoring: snapshot.excluded_from_scoring
    }
  },
  transformations: [
    { type: 'checksum_bound_well_filter', formula: 'Count each Figure 1 source-data row with Theil-Sen slope > 0.1 m/year and divide by all 169,717 complete well slopes.' },
    { type: 'checksum_bound_rapid_well_filter', formula: 'Count each Figure 1 source-data row with Theil-Sen slope > 0.5 m/year and divide by the unchanged source-data denominator.' },
    { type: 'bounded_aquifer_acceleration_companion', formula: 'Use the published 542-system long-history acceleration result only for momentum; do not relabel it as a changing well share.' },
    { type: 'withdrawal_weighted_scope', formula: 'Use the study-reported approximate withdrawal coverage and preserve its non-random monitoring boundary.' }
  ],
  source_ids: ['global_in_situ_groundwater_level_trends_study'],
  uncertainty: snapshot.uncertainty,
  freshness: `Primary global in-situ study published ${a.publication_year}; well-level Figure 1 source data checksum ${wells.csv_sha256}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The checksum-bound source data directly supply well-level current magnitude and rapid-threshold exceedance across 169,717 monitoring wells. The same global study supplies multi-decadal aquifer acceleration and country withdrawal coverage, so the current-data gate passes without substituting aquifer prevalence for well prevalence.',
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for groundwater_depletion_wells.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_34_groundwater_well_thresholds', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'global_in_situ_groundwater_level_trends_study', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-34.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-34.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
