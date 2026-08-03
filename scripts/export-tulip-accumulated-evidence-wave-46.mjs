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
const SNAPSHOT_PATH = 'public/global-hab-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const shares = assessment.event_type_shares_pct;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(shares.mass_animal_or_plant_mortality, [0, 1, 5, 10]),
  human_economic_burden: n(shares.seafood_biotoxin, [0, 10, 33, 67]),
  persistence: n(assessment.observation_years_inclusive, [0, 5, 20, 35]),
  extent: n(assessment.global_regions_assessed, [0, 3, 8, 12])
};

if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) {
  throw new Error('harmful_algal_blooms: accumulated-impact gate failed');
}

const receipt = buildTulipUrgencyReceipt({
  node_id: 'harmful_algal_blooms',
  method: 'impact_fallback',
  as_of: String(assessment.observation_end_year),
  components,
  raw_inputs: {
    biophysical_burden: {
      mass_animal_or_plant_mortality_event_share_pct: shares.mass_animal_or_plant_mortality,
      normalization_anchors_pct: [0, 1, 5, 10],
      basis: 'Use only the documented mass-mortality share as the conservative ecological-burden indicator; do not treat every recorded HAB event as a mortality event.'
    },
    human_economic_burden: {
      seafood_biotoxin_event_share_pct: shares.seafood_biotoxin,
      high_counts_or_discoloration_with_socioeconomic_impact_share_pct: shares.high_counts_or_discoloration_with_socioeconomic_impact,
      normalization_anchors_pct: [0, 10, 33, 67],
      basis: 'Normalize only the 48% seafood-biotoxin share. The separate 43% socioeconomic-impact share is retained as corroboration and is not added because event categories can overlap.'
    },
    persistence: {
      observation_start_year: assessment.observation_start_year,
      observation_end_year: assessment.observation_end_year,
      observation_years_inclusive: assessment.observation_years_inclusive,
      normalization_anchors_years: [0, 5, 20, 35]
    },
    extent: {
      global_regions_assessed: assessment.global_regions_assessed,
      geographic_coverage: assessment.geographic_coverage,
      normalization_anchors_regions: [0, 3, 8, 12]
    },
    supporting_inventory: {
      haedat_event_count: assessment.haedat_event_count,
      harmful_marine_phytoplankton_taxa_approximate: assessment.harmful_marine_phytoplankton_taxa_approximate,
      ciguatera_people_affected_annually_range: assessment.ciguatera_people_affected_annually_range,
      records_with_multiple_event_types_pct: shares.records_with_multiple_event_types
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at
    }
  },
  transformations: [
    {
      type: 'conservative_event_share_normalization',
      formula: 'Normalize the rounded 7% mass-mortality share and 48% seafood-biotoxin share independently against declared four-point anchors.'
    },
    {
      type: 'overlap_guard',
      formula: 'Do not add event-category percentages because 11% of HAEDAT records carry multiple event types.'
    },
    {
      type: 'persistence_and_extent_normalization',
      formula: 'Normalize the inclusive 34-year observation period and coverage of all 12 assessed global marine regions.'
    },
    {
      type: 'impact_composite',
      formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1–10 with 1 + 9 × composite and round to one decimal.'
    }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Accumulated global marine HAB inventory covers ${assessment.observation_start_year}–${assessment.observation_end_year}; reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The peer-reviewed global HAEDAT assessment quantifies ecological mortality events, seafood-toxin events, multi-decadal persistence, and coverage across all 12 assessed marine regions.',
    higher_priority_failures: ['The study explicitly finds no uniform global trend after monitoring adjustment, and the retained inventory ends in 2018, so a current-data score would overstate freshness and momentum.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for harmful_algal_blooms.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_46_global_harmful_algal_blooms',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-46.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-46.json',
  promoted_node_count: registry.promoted_node_count,
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
