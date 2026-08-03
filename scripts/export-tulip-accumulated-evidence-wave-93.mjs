import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/kissimmee-channelization-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.lower_river_wetland_loss_square_kilometres_approximate, anchors.disconnected_wetland_area_square_kilometres),
  human_economic_burden: n(impact.federal_allocation_through_fy2024_usd, anchors.realized_public_allocation_usd),
  persistence: n(impact.persistence_years_to_backfill_milestone_derived, anchors.persistence_years),
  extent: n(impact.c38_engineered_channel_length_kilometres, anchors.engineered_channel_kilometres)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('levee_and_channelization_works: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'levee_and_channelization_works', method: 'impact_fallback', as_of: 'FY2024', components,
  raw_inputs: {
    biophysical_burden: { lower_river_wetland_loss_square_kilometres_approximate: impact.lower_river_wetland_loss_square_kilometres_approximate, lower_river_wetland_loss_share_approximate: impact.lower_river_wetland_loss_share_approximate, normalization_anchors_square_kilometres: anchors.disconnected_wetland_area_square_kilometres },
    human_economic_burden: { federal_allocation_through_fy2024_usd: impact.federal_allocation_through_fy2024_usd, estimated_total_project_cost_usd_unscored: impact.estimated_total_project_cost_usd_unscored, normalization_anchors_usd: anchors.realized_public_allocation_usd },
    persistence: { channelization_completion_year: impact.channelization_completion_year, canal_backfill_completion_year: impact.canal_backfill_completion_year, persistence_years_to_backfill_milestone_derived: impact.persistence_years_to_backfill_milestone_derived, normalization_anchors_years: anchors.persistence_years },
    extent: { engineered_channel_length_kilometres: impact.c38_engineered_channel_length_kilometres, engineered_channel_width_metres: impact.c38_engineered_channel_width_metres, engineered_channel_depth_metres: impact.c38_engineered_channel_depth_metres, normalization_anchors_kilometres: anchors.engineered_channel_kilometres },
    unscored_context: { restored_or_reconnected_wetland_hectares_more_than: impact.restored_or_reconnected_wetland_hectares_more_than, naturalized_channel_kilometres: impact.naturalized_channel_kilometres, completed_canal_backfill_miles_2022: impact.completed_canal_backfill_miles_2022, restored_continuous_river_miles_2022: impact.restored_continuous_river_miles_2022, restored_monitoring_site_count: impact.usgs_restored_monitoring_site_count, unrestored_reference_site_count: impact.usgs_unrestored_reference_site_count },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'mapped_floodplain_disconnection', formula: 'Normalize the approximately 120-square-kilometre historical wetland loss within the mapped lower-Kissimmee channelization boundary.' },
    { type: 'realized_restoration_response_burden', formula: 'Normalize $429,938,100 of federal allocations through FY2024; retain the $869,714,000 estimated total project cost as unscored context.' },
    { type: 'bounded_infrastructure_persistence', formula: 'Calculate 2022 - 1971 = 51 years from channelization completion to the full 22-mile canal-backfill milestone.' },
    { type: 'mapped_engineered_extent', formula: 'Normalize the source-reported 90-kilometre C-38 engineered channel length; retain width and depth without converting them to a volume.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical 1971–2022 Kissimmee channelization record and FY2024 allocation reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'A named engineered reach has quantified channel geometry, mapped floodplain-wetland loss, multi-decadal persistence and a realized public restoration allocation.', higher_priority_failures: ['This is a bounded river restoration case rather than a current global aggregation.', 'No universal channelization threshold or 20-year comparable global observation series is available for a current-data score.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`levee_and_channelization_works: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_93_kissimmee_channelization', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-93.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-93.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
