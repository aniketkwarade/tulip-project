import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/fao-fishstat-marine-capture-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));
const quantile = (sorted, p) => { const position = (sorted.length - 1) * p; const low = Math.floor(position); const f = position - low; return sorted[low] + (sorted[Math.min(low + 1, sorted.length - 1)] - sorted[low]) * f; };
const baseline = snapshot.series.filter(row => row.year >= snapshot.baseline.start_year && row.year <= snapshot.baseline.end_year).map(row => row.tonnes).sort((a, b) => a - b);
if (baseline.length !== snapshot.baseline.complete_annual_observations || baseline.length < 20) throw new Error('FishStat baseline coverage gate failed.');
const anchors = [0.5, 0.25, 0.10, 0.025].map(p => quantile(baseline, p));
const latest = snapshot.series.at(-1);
const prior = snapshot.series.at(-2);
const baselineMedian = anchors[0];
const shortfallPct = Math.max(0, (baselineMedian - latest.tonnes) / baselineMedian * 100);
const annualChangePct = (latest.tonnes / prior.tonnes - 1) * 100;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'fish_landing_supply_disruption',
  method: 'current_data',
  as_of: String(latest.year),
  components: {
    magnitude: round(normalizeWithAnchors(shortfallPct, [0, 2, 5, 10], 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(latest.tonnes, anchors, 'lower_is_worse')),
    momentum: round(normalizeWithAnchors(annualChangePct, [0, -2, -5, -10], 'lower_is_worse')),
    extent: 1
  },
  raw_inputs: {
    magnitude: { latest_global_marine_capture_tonnes: latest.tonnes, baseline_median_tonnes: round(baselineMedian, 3), shortfall_pct: round(shortfallPct, 6), anchors_shortfall_pct: [0, 2, 5, 10] },
    threshold: { latest_global_marine_capture_tonnes: latest.tonnes, historical_distribution_anchors_tonnes: anchors.map(value => round(value, 3)), percentiles: ['median', '25th', '10th', '2.5th'], direction: 'lower_is_worse' },
    momentum: { latest_year: latest.year, prior_year: prior.year, latest_tonnes: latest.tonnes, prior_tonnes: prior.tonnes, annual_change_pct: round(annualChangePct, 6), anchors_pct: [0, -2, -5, -10] },
    extent: { geographic_scope: 'All FAO marine fishing areas aggregated globally', normalized_value: 1 },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, extraction: snapshot.extraction, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'global_marine_only_aggregation', formula: 'Sum FishStat Q_tlw records in FAO marine areas for the SOFIA fish, crustaceans and molluscs category; exclude inland capture and aquaculture.' },
    { type: 'fixed_baseline_shortfall', formula: 'Compare 2024 with the median of 30 complete annual observations from 1991-2020; a value above the median is an observed zero shortfall, not missing data.' },
    { type: 'reverse_historical_distribution', formula: 'Map median, 25th, 10th and 2.5th percentile production to reference, concerning, critical and extreme because lower landings are worse.' },
    { type: 'year_over_year_momentum', formula: 'Normalize the 2023-2024 percent change with negative change as worse; positive change maps to reference.' }
  ],
  source_ids: ['fao_fishstat_global_marine_capture_2026'],
  uncertainty: snapshot.uncertainty,
  freshness: `FAO FishStat release 2026.1.0 through ${latest.year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'FAO FishStat supplies 34 complete global marine-only annual observations, a current magnitude against a fixed baseline, a valid reverse-direction historical distribution, current momentum and complete marine-area extent.',
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for fish_landing_supply_disruption.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_31_fao_fishstat_marine_capture', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'fao_fishstat_global_marine_capture_2026', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-31.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-31.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
