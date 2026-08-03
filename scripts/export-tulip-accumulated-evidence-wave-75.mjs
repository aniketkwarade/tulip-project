import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/blacktail-creek-fracking-wastewater-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.enforcement_reported_release_gallons, anchors.release_gallons),
  human_economic_burden: n(impact.criminal_fines_and_civil_penalties_usd, anchors.fines_and_penalties_usd),
  persistence: n(impact.measured_geochemical_signature_persistence_years, anchors.measured_persistence_years),
  extent: n(impact.represented_country_count, anchors.represented_country_count)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('fracking_wastewater_lakes: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'fracking_wastewater_lakes',
  method: 'impact_fallback',
  as_of: snapshot.sources[0].publication_date,
  components,
  raw_inputs: {
    biophysical_burden: { enforcement_reported_release_gallons: impact.enforcement_reported_release_gallons, release_duration_days: impact.release_duration_days, affected_tributary_miles_more_than: impact.affected_tributary_miles_more_than, earlier_scientific_study_release_estimate_litres: impact.earlier_scientific_study_release_estimate_litres, earlier_scientific_study_release_estimate_gallons_approx: impact.earlier_scientific_study_release_estimate_gallons_approx, normalization_anchors_gallons: anchors.release_gallons },
    human_economic_burden: { criminal_fines_and_civil_penalties_usd: impact.criminal_fines_and_civil_penalties_usd, normalization_anchors_usd: anchors.fines_and_penalties_usd, boundary: 'Enforcement penalties are a direct economic consequence but not a total-damage or cleanup-cost valuation.' },
    persistence: { measured_geochemical_signature_persistence_years: impact.measured_geochemical_signature_persistence_years, normalization_anchors_years: anchors.measured_persistence_years },
    extent: { affected_tributary_miles_more_than: impact.affected_tributary_miles_more_than, represented_country: impact.represented_country, represented_country_count: impact.represented_country_count, normalization_anchors_countries: anchors.represented_country_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'actual_release_only', formula: 'Use the later EPA/DOJ enforcement estimate of 29 million released gallons; retain the earlier approximately 11-million-litre scientific estimate as an explicit discrepancy and do not infer releases from production or capacity.' },
    { type: 'enforcement_economic_burden', formula: 'Normalize the source-reported USD 35 million criminal fines and civil penalties without labeling it total cleanup or ecological damage.' },
    { type: 'measured_signature_persistence', formula: 'Use the USGS maximum sampling interval of 2.5 years with detected wastewater geochemical signatures; do not claim all constituents persisted everywhere.' },
    { type: 'bounded_extent', formula: 'Normalize the one represented country while retaining the more-than-30-mile receiving-water footprint as a lower-bound case descriptor.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Historical release with enforcement resolution ${snapshot.sources[0].publication_date}; persistence study ${snapshot.sources[1].publication_date}.`,
  selection_reason: {
    selected_method_passed: 'Federal enforcement and USGS records quantify a named hydraulic-fracturing produced-water release, duration, receiving-water footprint, penalties and measured multi-year geochemical persistence.',
    higher_priority_failures: ['The evidence is a severe site-specific accumulated-impact case, not a current global wastewater-containment aggregation.', 'No method-comparable global annual or monthly series supplies current magnitude plus threshold or momentum coverage.']
  }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`fracking_wastewater_lakes: receipt verification failed: ${verification.errors.join('; ')}`);

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_75_blacktail_creek_fracking_wastewater', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-75.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-75.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
