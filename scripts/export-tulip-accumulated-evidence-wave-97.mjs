import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/tongass-old-growth-logging-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.productive_old_growth_harvested_acres_estimated, anchors.harvested_old_growth_acres),
  human_economic_burden: n(impact.average_annual_net_public_cost_million_usd_derived, anchors.average_annual_net_public_cost_million_usd),
  persistence: n(impact.documented_harvest_span_years_derived, anchors.documented_harvest_span_years),
  extent: n(impact.productive_forest_share_harvested_percent_derived, anchors.productive_forest_share_harvested_percent)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('old_growth_forest_logging: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'old_growth_forest_logging', method: 'impact_fallback', as_of: '2014', components,
  raw_inputs: {
    biophysical_burden: { productive_old_growth_harvested_acres_estimated: impact.productive_old_growth_harvested_acres_estimated, inventory_based_1954_1995_acres: 405000, volume_derived_1909_1954_acres_estimated: 45000, normalization_anchors_acres: anchors.harvested_old_growth_acres },
    human_economic_burden: { average_annual_timber_program_expenditures_million_usd_fy2005_2014: impact.average_annual_timber_program_expenditures_million_usd_fy2005_2014, average_annual_timber_program_revenue_million_usd_fy2005_2014: impact.average_annual_timber_program_revenue_million_usd_fy2005_2014, average_annual_net_public_cost_million_usd_derived: impact.average_annual_net_public_cost_million_usd_derived, normalization_anchors_million_usd: anchors.average_annual_net_public_cost_million_usd },
    persistence: { first_harvest_year: impact.first_harvest_year, cumulative_assessment_year: impact.cumulative_assessment_year, documented_harvest_span_years_derived: impact.documented_harvest_span_years_derived, normalization_anchors_years: anchors.documented_harvest_span_years },
    extent: { productive_forest_acres: impact.productive_forest_acres, productive_forest_share_harvested_percent_derived: impact.productive_forest_share_harvested_percent_derived, normalization_anchors_percent: anchors.productive_forest_share_harvested_percent },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'explicit_old_growth_harvest_area', formula: 'Normalize the Forest Service estimate of 450,000 productive old-growth acres harvested, preserving the inventory-based and volume-derived portions separately.' },
    { type: 'realized_net_public_cost', formula: 'Calculate $12.5 million average annual expenditures - $1.1 million average annual revenues = $11.4 million from FY2005–2014; do not add unreported road costs.' },
    { type: 'documented_harvest_span', formula: 'Calculate 1995 - 1909 = 86 years for the cumulative old-growth harvest assessment.' },
    { type: 'productive_forest_share', formula: 'Calculate 450,000 / 5,600,000 × 100 = 8.035714 percent within the Tongass productive-forest boundary.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Cumulative 1909–1995 harvest assessment and FY2005–2014 program accounts reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Forest Service and GAO records provide an explicit old-growth definition, accumulated harvest area, duration, productive-forest extent and realized timber-program expenditure and revenue burden.', higher_priority_failures: ['The evidence is a named U.S. national forest rather than a defensible global current aggregation.', 'No globally comparable annual old-growth-harvest series with a stable old-growth definition and at least 20 complete years is available for the current-data method.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`old_growth_forest_logging: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_97_tongass_old_growth_logging', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-97.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-97.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
