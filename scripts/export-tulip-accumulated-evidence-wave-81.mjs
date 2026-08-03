import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/whiskey-creek-shell-calcification-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.pacific_oyster_larval_culture_reduction_percent_at_least, anchors.larval_culture_reduction_percent),
  human_economic_burden: n(impact.derived_2008_eyed_larvae_production_shortfall, anchors.eyed_larvae_production_shortfall),
  persistence: n(impact.affected_production_season_count, anchors.affected_production_season_count),
  extent: n(impact.west_coast_oyster_operations_supplied_percent_min, anchors.supplied_operation_share_percent)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('shell_calcification_failures: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'shell_calcification_failures', method: 'impact_fallback', as_of: impact.assessment_end_date, components,
  raw_inputs: {
    biophysical_burden: { pacific_oyster_larval_culture_reduction_percent_at_least: impact.pacific_oyster_larval_culture_reduction_percent_at_least, reviewed_commercial_viability_aragonite_saturation_threshold: impact.reviewed_commercial_viability_aragonite_saturation_threshold, normalization_anchors_percent: anchors.larval_culture_reduction_percent },
    human_economic_burden: { actual_2008_eyed_larvae_production: impact.actual_2008_eyed_larvae_production, actual_2008_fraction_of_normal_production: impact.actual_2008_fraction_of_normal_production, derived_normal_season_eyed_larvae_production: impact.derived_normal_season_eyed_larvae_production, derived_2008_eyed_larvae_production_shortfall: impact.derived_2008_eyed_larvae_production_shortfall, normalization_anchors_larvae: anchors.eyed_larvae_production_shortfall, boundary: 'Realized hatchery output shortfall; not converted to dollars and not labeled total regional economic loss.' },
    persistence: { affected_production_season_count: impact.affected_production_season_count, first_failure_start: impact.first_failure_start, assessment_end_date: impact.assessment_end_date, normalization_anchors_seasons: anchors.affected_production_season_count },
    extent: { west_coast_oyster_operations_supplied_percent_min: impact.west_coast_oyster_operations_supplied_percent_min, west_coast_oyster_operations_supplied_percent_max: impact.west_coast_oyster_operations_supplied_percent_max, normalization_anchors_percent: anchors.supplied_operation_share_percent, boundary: 'Conservative lower end of the documented supply-share range; not a geographic global extent.' },
    unscored_context: { broader_industry_annual_value_usd: impact.broader_industry_annual_value_usd_unscored },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'paired_larval_failure', formula: 'Normalize the documented at-least-75-percent Pacific-oyster larval-culture reduction while retaining the hatchery-specific aragonite threshold as paired chemistry evidence.' },
    { type: 'production_shortfall_derivation', formula: 'Divide 2.5 billion actual larvae by 0.25 to derive 10 billion normal production, then subtract actual output to obtain a 7.5-billion-larvae shortfall; do not monetize it.' },
    { type: 'affected_season_count', formula: 'Normalize the two documented affected production seasons, 2007 and 2008, rather than treating the entire later monitoring period as failure.' },
    { type: 'conservative_supply_dependence', formula: 'Normalize 50 percent, the lower end of the hatchery\'s documented 50-85 percent supply share of West Coast oyster operations.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical hatchery failure assessed through ${impact.assessment_end_date}; state and NOAA records reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Oregon and NOAA records pair hatchery intake carbonate chemistry with Pacific-oyster larval survival and realized production, while quantifying duration and the bounded grower-supply footprint.', higher_priority_failures: ['The evidence is a historical hatchery and regional supply event, not a current global shellfish calcification aggregation.', 'No globally comparable current series pairs carbonate chemistry and species/life-stage biological outcomes with the required threshold or momentum coverage.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`shell_calcification_failures: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_81_whiskey_creek_shell_calcification', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-81.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-81.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
