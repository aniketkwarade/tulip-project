import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/who-cholera-emergency-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const [previous, latest] = snapshot.records;
const round = (value, digits = 6) => Number(value.toFixed(digits));
const caseRatio = latest.cases_reported / previous.cases_reported;
const deathGrowth = (latest.deaths_reported - previous.deaths_reported) / previous.deaths_reported;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'waterborne_pathogen_outbreaks',
  method: 'current_data',
  as_of: latest.observation_end,
  components: {
    magnitude: round(Math.max(0, Math.min(1, caseRatio))),
    threshold: round(normalizeWithAnchors(latest.case_fatality_rate_pct, [0, 0.5, snapshot.recognized_case_fatality_benchmark_pct, 5], 'higher_is_worse')),
    momentum: round(Math.max(0, Math.min(1, deathGrowth))),
    extent: round(latest.who_regions_reporting / snapshot.who_region_count)
  },
  raw_inputs: {
    magnitude: { latest_cases_reported: latest.cases_reported, previous_cases_reported: previous.cases_reported, latest_to_previous_case_ratio: round(caseRatio), boundary: snapshot.measurement_boundary },
    threshold: { latest_deaths_reported: latest.deaths_reported, latest_cases_reported: latest.cases_reported, latest_case_fatality_rate_pct: latest.case_fatality_rate_pct, recognized_case_fatality_benchmark_pct: snapshot.recognized_case_fatality_benchmark_pct, anchors_pct: [0, 0.5, snapshot.recognized_case_fatality_benchmark_pct, 5] },
    momentum: { latest_deaths_reported: latest.deaths_reported, previous_deaths_reported: previous.deaths_reported, year_over_year_death_growth: round(deathGrowth), formula: '(latest deaths - previous deaths) / previous deaths' },
    extent: { countries_reporting: latest.countries_reporting, who_regions_reporting: latest.who_regions_reporting, who_region_count: snapshot.who_region_count, normalized_value: round(latest.who_regions_reporting / snapshot.who_region_count) },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, previous_period: [previous.observation_start, previous.observation_end], latest_period: [latest.observation_start, latest.observation_end] }
  },
  transformations: [
    { type: 'complete_period_case_magnitude', formula: 'Divide latest reported cholera/AWD cases by the prior near-complete annual reporting period and cap at one.' },
    { type: 'recognized_case_fatality_threshold', formula: 'Calculate deaths divided by cases and normalize against the WHO under-one-percent benchmark, retaining five percent as the source-described vulnerable-setting extreme.' },
    { type: 'complete_period_death_momentum', formula: 'Calculate year-over-year reported death growth over compatible near-complete periods; improvements floor at zero rather than becoming negative urgency.' },
    { type: 'who_region_extent', formula: 'Divide regions reporting cases by all six WHO regions; countries remain a contextual count.' }
  ],
  source_ids: ['who_global_cholera_emergency_updates'],
  uncertainty: snapshot.uncertainty,
  freshness: `WHO update through ${latest.observation_end}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `WHO supplies compatible near-complete ${previous.observation_year} and ${latest.observation_year} global emergency-reporting periods, reported cases and deaths, a recognized under-${snapshot.recognized_case_fatality_benchmark_pct}% case-fatality benchmark, and quantified country and regional extent.`,
    higher_priority_failures: []
  }
});

const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`Receipt verification failed for waterborne_pathogen_outbreaks: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_23_who_cholera', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'who_global_cholera_emergency_updates', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-23.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-23.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
