import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/bsee-deepwater-petroleum-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact_through_2025;
const anchors = snapshot.source_backed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(impact.deepwater_horizon_release_barrels, anchors.documented_release_barrels),
  human_economic_burden: n(impact.total_civil_resolution_usd, anchors.civil_resolution_usd),
  persistence: n(impact.restoration_payment_period_years, anchors.restoration_payment_period_years),
  extent: n(impact.directly_assessed_country_count, anchors.directly_assessed_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('deepwater_petroleum_spill_risk: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'deepwater_petroleum_spill_risk',
  method: 'impact_fallback',
  as_of: String(impact.end_year),
  components,
  raw_inputs: {
    biophysical_burden: { deepwater_horizon_release_barrels: impact.deepwater_horizon_release_barrels, pollution_or_spill_tagged_investigations: impact.pollution_or_spill_tagged_investigations, normalization_anchors_barrels: anchors.documented_release_barrels },
    human_economic_burden: { fatality_tagged_investigations: impact.fatality_tagged_investigations, injury_lost_time_or_restricted_work_tagged_investigations: impact.injury_lost_time_or_restricted_work_tagged_investigations, incident_or_collision_over_25000_usd_tagged_investigations: impact.incident_or_collision_over_25000_usd_tagged_investigations, deepwater_horizon_deaths: impact.deepwater_horizon_deaths, deepwater_horizon_injuries: impact.deepwater_horizon_injuries, natural_resource_restoration_settlement_usd: impact.natural_resource_restoration_settlement_usd, total_civil_resolution_usd: impact.total_civil_resolution_usd, normalization_anchors_usd: anchors.civil_resolution_usd },
    persistence: { start_year: impact.start_year, end_year: impact.end_year, complete_calendar_years: impact.complete_calendar_years, restoration_payment_period_years: impact.restoration_payment_period_years, normalization_anchors_years: anchors.restoration_payment_period_years },
    extent: { directly_assessed_countries: impact.directly_assessed_countries, directly_assessed_country_count: impact.directly_assessed_country_count, normalization_anchors_countries: anchors.directly_assessed_country_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, incident_archive_sha256: snapshot.sources[0].archive_sha256, depth_archive_sha256: snapshot.sources[1].archive_sha256, raw_investigation_rows: snapshot.extraction.raw_investigation_rows, rows_with_lease_depth_match: snapshot.extraction.rows_with_lease_depth_match }
  },
  transformations: [
    { type: 'lease_depth_join', formula: 'Join formal investigation records to the BSEE offshore-depth table on trimmed lease number; exclude 52 unmatched investigations.' },
    { type: 'deepwater_filter', formula: 'Retain joined leases whose maximum block water depth is at least 305 metres, corresponding to BSEE\'s greater-than-1,000-foot deepwater convention at whole-metre resolution.' },
    { type: 'complete_year_boundary', formula: 'Aggregate 1996-2025; exclude one partial-year deepwater record in 1995 and 11 incomplete 2026 records.' },
    { type: 'bounded_category_counts', formula: 'Count investigation records tagged pollution/spill, fatality, injury/lost-time/restricted-work, or incident/collision above $25,000 without treating tags as exact casualties, dollars or release volume.' },
    { type: 'landmark_assessed_burden', formula: 'Use official Deepwater Horizon release, casualty, civil-resolution and restoration-period observations for quantitative burden; do not multiply burden by evidence volume.' },
    { type: 'bounded_country_extent', formula: 'Normalize the one directly assessed country; 267 depth-qualified leases do not become global coverage.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `BSEE raw files updated ${snapshot.sources[0].data_last_updated}; scored formal-investigation record ends with complete calendar year ${impact.end_year}; snapshot reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'Depth-qualified BSEE investigations and official Deepwater Horizon assessments quantify pollution burden, casualties and economic liability, persistent restoration obligations, and one-country extent under the exact deepwater petroleum contract.',
    higher_priority_failures: ['The source is restricted to the United States Outer Continental Shelf rather than a defensible current global aggregation.', 'Formal investigations are selected cases and the lease-depth join does not provide a global current magnitude, threshold and momentum series.']
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('deepwater_petroleum_spill_risk receipt verification failed.');

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_56_bsee_deepwater_petroleum', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-56.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-56.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
