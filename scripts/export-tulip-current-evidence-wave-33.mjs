import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/faostat-agriculture-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const rows = snapshot.records
  .filter(row => row.metric_id === 'drained_peat_co2_flux' && row.area === 'World' && row.component === 'agricultural_drained_organic_soil_total_co2')
  .sort((a, b) => a.year - b.year);
const completeEstimated = rows.filter(row => row.year <= 2022 && row.source_flag !== 'I');
const latest = completeEstimated.at(-1);
if (!latest || latest.year !== 2022) throw new Error('Expected 2022 as the latest non-imputed FAOSTAT global drained-organic-soil CO2 estimate.');
const history = completeEstimated.filter(row => row.year >= 1990 && row.year <= 2019);
const reference = completeEstimated.filter(row => row.year >= 1990 && row.year <= 1999).map(row => row.value).sort((a, b) => a - b);
if (history.length !== 30 || reference.length !== 10) throw new Error('FAOSTAT peat CO2 history coverage gate failed.');
const anchors = historicalDistributionAnchors(history.map(row => row.value), 'annual');
const median = values => (values[values.length / 2 - 1] + values[values.length / 2]) / 2;
const referenceMedian = median(reference);
const magnitudeIncreasePct = (latest.value / referenceMedian - 1) * 100;
const momentumStart = completeEstimated.find(row => row.year === 2017);
const momentumYears = latest.year - momentumStart.year;
const annualizedMomentumPct = (Math.pow(latest.value / momentumStart.value, 1 / momentumYears) - 1) * 100;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'peatland_drainage_co2',
  method: 'current_data',
  as_of: String(latest.year),
  components: {
    magnitude: round(normalizeWithAnchors(magnitudeIncreasePct, [0, 5, 10, 20], 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.value, anchors, 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(annualizedMomentumPct, [0, 0.1, 0.25, 0.5], 'higher_is_worse')),
    extent: 1
  },
  raw_inputs: {
    magnitude: { latest_global_kilotonnes_co2_per_year: latest.value, latest_source_flag: latest.source_flag, reference_period: [1990, 1999], reference_median_kilotonnes_co2_per_year: round(referenceMedian, 6), increase_pct: round(magnitudeIncreasePct, 6), anchors_pct: [0, 5, 10, 20] },
    threshold: { latest_global_kilotonnes_co2_per_year: latest.value, historical_period: [1990, 2019], complete_annual_observations: history.length, historical_distribution_anchors_kilotonnes: anchors.map(value => round(value, 6)), percentiles: ['median', '75th', '90th', '97.5th'] },
    momentum: { start_year: momentumStart.year, start_kilotonnes_co2_per_year: momentumStart.value, end_year: latest.year, end_kilotonnes_co2_per_year: latest.value, annualized_change_pct: round(annualizedMomentumPct, 6), anchors_pct_per_year: [0, 0.1, 0.25, 0.5] },
    extent: { source_geography: 'World', normalized_value: 1, boundary: 'FAOSTAT agricultural cropland-and-grassland drained organic soils only.' },
    excluded_imputed_rows: rows.filter(row => row.year > latest.year).map(row => ({ year: row.year, value: row.value, source_flag: row.source_flag })),
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, coverage_boundary: snapshot.coverage_boundary }
  },
  transformations: [
    { type: 'latest_non_imputed_world_estimate', formula: 'Select the latest World total whose FAOSTAT flag is not I; retain 2023-2024 imputed repeats as excluded metadata.' },
    { type: 'fixed_reference_increase', formula: 'Compare 2022 with the median of the complete 1990-1999 global annual inventory.' },
    { type: 'historical_distribution', formula: 'Normalize 2022 through median, 75th, 90th and 97.5th percentiles of 30 complete annual values from 1990-2019.' },
    { type: 'five_year_annualized_momentum', formula: 'Calculate compound annual change from 2017 to 2022 without extrapolating beyond the inventory.' }
  ],
  source_ids: ['faostat'],
  uncertainty: snapshot.uncertainty,
  freshness: `FAOSTAT release ${latest.dataset_release_date}; latest non-imputed global estimate ${latest.year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'FAOSTAT supplies a source-reported World total, 33 complete non-imputed annual values through 2022, a valid 30-year historical distribution and a five-year observed inventory trend.',
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for peatland_drainage_co2.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_33_faostat_peatland_drainage_co2', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'faostat', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-33.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-33.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
