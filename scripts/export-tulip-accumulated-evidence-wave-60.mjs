import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/epa-sewer-overflow-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const anchors = snapshot.shared_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));

const receipts = Object.values(snapshot.assessments).map(impact => {
  const components = {
    biophysical_burden: n(impact.reported_discharge_volume_gallons, anchors.reported_discharge_volume_gallons),
    human_economic_burden: n(impact.observable_impact_records, anchors.observable_impact_records),
    persistence: n(impact.years_with_records, anchors.years_with_records),
    extent: n(impact.directly_assessed_country_count, anchors.directly_assessed_country_count)
  };
  if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error(`${impact.node_id}: accumulated-impact gate failed.`);
  const receipt = buildTulipUrgencyReceipt({
    node_id: impact.node_id,
    method: 'impact_fallback',
    as_of: String(impact.last_record_year),
    components,
    raw_inputs: {
      biophysical_burden: { included_type_codes: impact.included_type_codes, events: impact.events, volume_reported_events: impact.volume_reported_events, reported_discharge_volume_gallons: impact.reported_discharge_volume_gallons, duration_reported_events: impact.duration_reported_events, reported_duration_hours: impact.reported_duration_hours, normalization_anchors_gallons: anchors.reported_discharge_volume_gallons },
      human_economic_burden: { observable_impact_records: impact.observable_impact_records, human_exposure_records: impact.human_exposure_records, building_backup_records: impact.building_backup_records, drinking_water_contamination_records: impact.drinking_water_contamination_records ?? 0, beach_contamination_records: impact.beach_contamination_records ?? 0, shellfish_contamination_records: impact.shellfish_contamination_records ?? 0, aquatic_life_or_habitat_impairment_records: impact.aquatic_life_or_habitat_impairment_records, fish_kill_records: impact.fish_kill_records ?? 0, normalization_anchors_impact_records: anchors.observable_impact_records },
      persistence: { first_record_year: impact.first_record_year, last_record_year: impact.last_record_year, years_with_records: impact.years_with_records, normalization_anchors_years: anchors.years_with_records },
      extent: { permit_count: impact.permit_count, directly_assessed_countries: impact.directly_assessed_countries, directly_assessed_country_count: impact.directly_assessed_country_count, normalization_anchors_countries: anchors.directly_assessed_country_count },
      current_cso_inventory_context: snapshot.current_cso_inventory,
      source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, cso_inventory_archive_sha256: snapshot.sources[0].archive_sha256, sewer_event_archive_sha256: snapshot.sources[1].archive_sha256, event_rows_through_2025: snapshot.event_extraction.event_rows_through_2025 }
    },
    transformations: [
      { type: 'current_version_event_join', formula: 'Join the EPA current-version event, type and impact tables on sewer_overflow_bypass_event_key.' },
      { type: 'complete_year_boundary', formula: 'Retain events starting on or before 2025-12-31 and exclude 2,156 partial-2026 rows.' },
      { type: 'exact_type_filter', formula: `Select only EPA event type codes ${impact.included_type_codes.join(' + ')} for this node.` },
      { type: 'reported_volume_accounting', formula: 'Sum only nonblank discharge-volume gallons; missing volume and duration never become zero.' },
      { type: 'observable_impact_accounting', formula: 'Count joined impact classifications other than No observable impacts; retain specific health and ecosystem categories separately.' },
      { type: 'bounded_country_extent', formula: 'Normalize the one directly assessed country; permits, facilities, outfalls and jurisdictions do not become independent countries.' },
      { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
    ],
    source_ids: snapshot.sources.map(source => source.id),
    uncertainty: snapshot.uncertainty,
    freshness: `EPA current-version event dataset dated ${snapshot.sources[1].data_date}; scored through complete calendar year ${impact.last_record_year}; snapshot reviewed ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: `EPA event records quantify ${impact.included_type_codes.join('/')} discharge volume, duration, documented impacts, persistence and one-country extent under the exact node contract.`,
      higher_priority_failures: ['EPA states that the standardized event dataset is still developing and does not provide defensible current global coverage.', 'Uneven jurisdictional electronic-reporting history prevents a global current magnitude, threshold and momentum series.']
    }
  });
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`${impact.node_id}: receipt verification failed.`);
  return receipt;
});

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_60_epa_sewer_overflow', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-60.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-60.json', promoted_node_count: receipts.length, receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
