import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WATER_PATH = 'public/global-drinking-water-service-impact-snapshot.json';
const LOSS_PATH = 'public/world-bank-global-non-revenue-water-impact-snapshot.json';
const [water, loss] = await Promise.all([WATER_PATH, LOSS_PATH].map(async file => JSON.parse(await fs.readFile(path.join(ROOT, file), 'utf8'))));
const w = water.assessment;
const l = loss.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

function receipt({ nodeId, asOf, components, rawInputs, transformations, sourceId, snapshot, snapshotPath, passed, failures }) {
  return buildTulipUrgencyReceipt({
    node_id: nodeId, method: 'impact_fallback', as_of: String(asOf), components,
    raw_inputs: { ...rawInputs, source_snapshot: { path: snapshotPath, version: snapshot.version, captured_at: snapshot.captured_at } },
    transformations, source_ids: [sourceId], uncertainty: snapshot.uncertainty,
    freshness: `Reviewed global assessment as of ${asOf}; snapshot captured ${snapshot.captured_at}.`,
    selection_reason: { selected_method_passed: passed, higher_priority_failures: failures }
  });
}

const receipts = [
  receipt({
    nodeId: 'drinking_water_treatment_stress', asOf: w.observation_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(w.safely_managed_service_gap_pct, [0, 5, 15, 35], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(w.people_lacking_safely_managed_drinking_water_billion, [0, 0.25, 1, 3], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(w.persistence_years, [0, 5, 15, 30], 'higher_is_worse')),
      extent: round(w.countries_with_safely_managed_estimates / 193)
    },
    rawInputs: {
      biophysical_burden: { safely_managed_drinking_water_coverage_pct: w.safely_managed_drinking_water_coverage_pct, service_gap_pct: w.safely_managed_service_gap_pct, anchors_pct: [0, 5, 15, 35], boundary: 'Service gap combines availability, accessibility and quality; it is not a plant-downtime count.' },
      human_economic_burden: { people_lacking_safely_managed_drinking_water_billion: w.people_lacking_safely_managed_drinking_water_billion, people_drinking_surface_water_million: w.people_drinking_surface_water_million, anchors_billion_people: [0, 0.25, 1, 3] },
      persistence: { trend_start_year: w.trend_start_year, observation_year: w.observation_year, years: w.persistence_years, anchors_years: [0, 5, 15, 30] },
      extent: { countries_with_safely_managed_estimates: w.countries_with_safely_managed_estimates, denominator: 193, normalized_value: round(w.countries_with_safely_managed_estimates / 193) }
    },
    transformations: [
      { type: 'safely_managed_service_gap', formula: 'Subtract JMP safely managed drinking-water coverage from 100 percent.' },
      { type: 'nonoverlapping_population_total', formula: 'Normalize only the top-level population lacking safely managed service; do not add nested service categories.' },
      { type: 'long_term_jmp_span', formula: 'Use the source-consistent 2000-2024 monitoring interval.' },
      { type: 'reporting_extent', formula: 'Divide countries with safely managed estimates by 193 UN Member States.' }
    ],
    sourceId: 'who_unicef_jmp_2025', snapshot: water, snapshotPath: WATER_PATH,
    passed: 'WHO/UNICEF quantifies the global safely managed drinking-water gap, affected population, 24-year persistence and country coverage.',
    failures: ['The report does not provide a complete annual global treatment-plant exceedance or downtime series.', 'The service gap is therefore accumulated impact rather than a current operational treatment score.']
  }),
  receipt({
    nodeId: 'urban_distribution_water_loss', asOf: l.assessment_year,
    components: {
      biophysical_burden: round(normalizeWithAnchors(l.global_non_revenue_water_billion_m3_per_year, [0, 25, 75, 150], 'higher_is_worse')),
      human_economic_burden: round(normalizeWithAnchors(l.global_economic_loss_usd_billion_per_year, [0, 5, 20, 50], 'higher_is_worse')),
      persistence: round(normalizeWithAnchors(l.persistence_years_to_2026, [0, 2, 5, 15], 'higher_is_worse')),
      extent: 1
    },
    rawInputs: {
      biophysical_burden: { global_non_revenue_water_billion_m3_per_year: l.global_non_revenue_water_billion_m3_per_year, anchors_billion_m3: [0, 25, 75, 150], boundary: 'Non-revenue water combines physical and apparent losses.' },
      human_economic_burden: { global_economic_loss_usd_billion_per_year: l.global_economic_loss_usd_billion_per_year, anchors_usd_billion: [0, 5, 20, 50] },
      persistence: { assessment_year: l.assessment_year, receipt_year: 2026, years: l.persistence_years_to_2026, anchors_years: [0, 2, 5, 15] },
      extent: { geography: l.geography_boundary, normalized_value: 1 }
    },
    transformations: [
      { type: 'source_reported_non_revenue_water', formula: 'Normalize the World Bank global annual volume without relabeling it as leakage.' },
      { type: 'source_reported_economic_loss', formula: 'Normalize the separate global annual waste and foregone-revenue estimate.' },
      { type: 'minimum_assessment_persistence', formula: 'Use elapsed years since the reviewed estimate as a conservative persistence floor.' },
      { type: 'global_utility_extent', formula: 'Use full extent for the source-reported global public-utility estimate.' }
    ],
    sourceId: 'world_bank_global_non_revenue_water_assessment', snapshot: loss, snapshotPath: LOSS_PATH,
    passed: 'World Bank quantifies global non-revenue-water volume, economic loss, persistent burden and global utility scope.',
    failures: ['No method-comparable 20-year annual global non-revenue-water series is available.', 'The assessment does not separate physical leakage from apparent and commercial losses.']
  })
];

for (const item of receipts) {
  const verification = verifyTulipUrgencyReceipt(item);
  if (!verification.valid) throw new Error(`Receipt verification failed for ${item.node_id}: ${verification.errors.join('; ')}`);
}
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_35_global_drinking_water_and_distribution_loss', generated_at: new Date().toISOString(), promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-35.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-35.json', receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
