import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  buildTulipUrgencyReceipt,
  normalizeWithAnchors,
  qualifiesForImpactFallback,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-drinking-water-service-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const round = value => Number(value.toFixed(6));
const anchors = {
  service_gap_pct: [0, 5, 15, 35],
  people_lacking_billion: [0, 0.25, 1, 3],
  persistence_years: [0, 5, 15, 30]
};
const components = {
  biophysical_burden: round(normalizeWithAnchors(assessment.safely_managed_service_gap_pct, anchors.service_gap_pct, 'higher_is_worse')),
  human_economic_burden: round(normalizeWithAnchors(assessment.people_lacking_safely_managed_drinking_water_billion, anchors.people_lacking_billion, 'higher_is_worse')),
  persistence: round(normalizeWithAnchors(assessment.persistence_years, anchors.persistence_years, 'higher_is_worse')),
  extent: round(assessment.countries_with_safely_managed_estimates / 193)
};
if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) {
  throw new Error('WHO/UNICEF drinking-water service gap did not pass the accumulated-impact gate.');
}

function buildReceipt(nodeId, boundary, passed, failures) {
  const receipt = buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(assessment.observation_year),
    components,
    raw_inputs: {
      biophysical_burden: {
        safely_managed_drinking_water_coverage_pct: assessment.safely_managed_drinking_water_coverage_pct,
        safely_managed_service_gap_pct: assessment.safely_managed_service_gap_pct,
        normalization_anchors_pct: anchors.service_gap_pct,
        boundary
      },
      human_economic_burden: {
        people_lacking_safely_managed_drinking_water_billion: assessment.people_lacking_safely_managed_drinking_water_billion,
        people_drinking_surface_water_million: assessment.people_drinking_surface_water_million,
        normalization_anchors_billion_people: anchors.people_lacking_billion
      },
      persistence: {
        trend_start_year: assessment.trend_start_year,
        observation_year: assessment.observation_year,
        persistence_years: assessment.persistence_years,
        normalization_anchors_years: anchors.persistence_years
      },
      extent: {
        countries_with_safely_managed_estimates: assessment.countries_with_safely_managed_estimates,
        countries_areas_territories_covered: assessment.countries_areas_territories_covered,
        denominator_un_member_states: 193,
        normalized_value: components.extent
      },
      unscored_context: {
        global_population_billion: assessment.global_population_billion,
        people_with_basic_service_billion: assessment.people_with_basic_service_billion,
        people_with_limited_service_million: assessment.people_with_limited_service_million,
        people_using_unimproved_sources_million: assessment.people_using_unimproved_sources_million,
        people_gaining_safely_managed_service_2015_2024_million: assessment.people_gaining_safely_managed_service_2015_2024_million
      },
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at,
        source_locators: assessment.source_locators
      }
    },
    transformations: [
      { type: 'safely_managed_service_gap', formula: 'Use the source-reported global gap from 100 percent safely managed coverage; retain availability, accessibility and water-quality dimensions as a combined service outcome.' },
      { type: 'nonoverlapping_population_total', formula: 'Normalize only the top-level population lacking safely managed service; do not add nested service-ladder categories.' },
      { type: 'long_term_jmp_span', formula: 'Use the source-consistent 2000-2024 global monitoring interval as persistence evidence.' },
      { type: 'reporting_extent', formula: 'Divide countries with safely managed estimates by 193 UN Member States; retain the broader territories-covered count as context.' },
      { type: 'causal_boundary', formula: boundary },
      { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' }
    ],
    source_ids: [snapshot.source.id],
    uncertainty: snapshot.uncertainty,
    freshness: `JMP observation year ${assessment.observation_year}; report published ${snapshot.source.publication_year}; snapshot reviewed ${snapshot.captured_at}.`,
    selection_reason: {
      selected_method_passed: passed,
      higher_priority_failures: failures
    }
  });
  const verification = verifyTulipUrgencyReceipt(receipt);
  if (!verification.valid) throw new Error(`${nodeId}: receipt verification failed: ${verification.errors.join('; ')}`);
  return receipt;
}

const receipts = [
  buildReceipt(
    'urban_hydrologic_supply_shortfall',
    'The global service gap combines source hydrology, accessibility, availability, distribution and quality; it is not attributed wholly to hydrologic supply failure or urban utilities.',
    'WHO/UNICEF quantifies the global safely managed drinking-water service gap, affected population, 24-year persistence and country reporting extent under the node\'s reviewed global service-gap contract.',
    ['The JMP assessment does not isolate current hydrologic supply from accessibility, distribution or water-quality constraints.', 'No source-consistent current global utility supply-shortfall series covers magnitude, threshold and momentum.']
  ),
  buildReceipt(
    'urban_source_water_treatment_constraint',
    'The global service gap combines source, distribution, availability, accessibility and quality constraints; it is not attributed wholly to treatment capacity, raw-water quality or urban utilities.',
    'WHO/UNICEF quantifies the global safely managed drinking-water service gap, affected population, 24-year persistence and country reporting extent under the node\'s reviewed global service-gap contract.',
    ['The JMP assessment does not isolate current treatment-plant capacity, downtime or raw-water quality.', 'No source-consistent current global treatment-constraint series covers magnitude, threshold and momentum.']
  )
];

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_66_who_unicef_global_drinking_water_service_gap',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-66.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-66.json', receipts: receipts.map(({ node_id, value, band, method, components: scoreComponents }) => ({ node_id, value, band, method, components: scoreComponents })) }, null, 2));
