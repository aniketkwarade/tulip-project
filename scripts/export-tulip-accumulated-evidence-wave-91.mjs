import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/london-nighttime-heat-retention-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const impact = snapshot.accumulated_impact;
const anchors = snapshot.reviewed_normalization_anchors;
const n = (value, scale) => Number(normalizeWithAnchors(value, scale, 'higher_is_worse').toFixed(6));
const components = {
  biophysical_burden: n(impact.london_2022_mean_urban_nonurban_temperature_difference_celsius, anchors.urban_nonurban_temperature_difference_celsius),
  human_economic_burden: n(impact.london_2018_uhi_attributable_social_cost_gbp_millions, anchors.uhi_attributable_social_cost_gbp_millions),
  persistence: n(impact.independently_assessed_summer_or_heatwave_period_count, anchors.independently_assessed_period_count),
  extent: n(impact.london_census_population_millions_2021, anchors.population_millions)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error('nighttime_heat_retention: accumulated-impact gate failed.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'nighttime_heat_retention', method: 'impact_fallback', as_of: '2022', components,
  raw_inputs: {
    biophysical_burden: { mean_urban_nonurban_temperature_difference_celsius: impact.london_2022_mean_urban_nonurban_temperature_difference_celsius, maximum_urban_nonurban_temperature_difference_celsius_unscored: impact.london_2022_maximum_urban_nonurban_temperature_difference_celsius, normalization_anchors_celsius: anchors.urban_nonurban_temperature_difference_celsius },
    human_economic_burden: { uhi_attributable_deaths_estimate_2018: impact.london_2018_uhi_attributable_deaths_estimate, uhi_attributable_social_cost_gbp_millions_2018: impact.london_2018_uhi_attributable_social_cost_gbp_millions, normalization_anchors_gbp_millions: anchors.uhi_attributable_social_cost_gbp_millions },
    persistence: { independently_assessed_period_count: impact.independently_assessed_summer_or_heatwave_period_count, assessed_periods: ['summer 2018', '10–25 July 2022'], normalization_anchors_periods: anchors.independently_assessed_period_count },
    extent: { london_census_population_millions_2021: impact.london_census_population_millions_2021, normalization_anchors_population_millions: anchors.population_millions },
    unscored_context: { analysis_days_2022: impact.london_2022_analysis_days, total_deaths_2022: impact.london_2022_total_deaths, heat_attributable_deaths_2022: impact.london_2022_heat_attributable_deaths_estimate, uhi_attributable_deaths_2022: impact.london_2022_uhi_attributable_deaths_estimate, uhi_share_of_heat_deaths_percent_2022: impact.london_2022_uhi_share_of_heat_deaths_percent, total_heat_social_cost_gbp_millions_2018: impact.london_2018_total_heat_social_cost_gbp_millions_unscored },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: snapshot.sources.flatMap(source => source.source_locators) }
  },
  transformations: [
    { type: 'bounded_urban_temperature_increment', formula: 'Normalize the population-weighted 2.3-degree-Celsius mean modeled urban-minus-non-urban increment; retain the 7.2-degree maximum as unscored context.' },
    { type: 'uhi_specific_social_burden', formula: 'Normalize only the £987-million summer-2018 social cost attributed to the UHI; retain total heat cost and death estimates separately.' },
    { type: 'independent_period_persistence', formula: 'Count the separately assessed summer-2018 and July-2022 periods without adding their mortality estimates.' },
    { type: 'bounded_population_extent', formula: 'Normalize the 8.8-million 2021 Census population inside the Greater London analysis boundary; do not extrapolate to other cities.' },
    { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
  ],
  source_ids: snapshot.sources.map(source => source.id), uncertainty: snapshot.uncertainty,
  freshness: `Historical summer-2018 and July-2022 London impact studies reviewed ${snapshot.captured_at}.`,
  selection_reason: { selected_method_passed: 'Validated urban-climate counterfactual studies quantify the temperature increment, nighttime concentration of that increment, attributable mortality and monetized burden across the Greater London population.', higher_priority_failures: ['The evidence is one metropolitan region rather than a defensible global aggregation.', 'The declared current-data contract requires comparable paired canopy-layer urban and reference observations; this evidence instead uses a validated model counterfactual and therefore remains accumulated-impact evidence.'] }
});
const verification = verifyTulipUrgencyReceipt(receipt);
if (!verification.valid) throw new Error(`nighttime_heat_retention: receipt verification failed: ${verification.errors.join('; ')}`);
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_91_london_nighttime_heat_retention', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-91.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-91.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
