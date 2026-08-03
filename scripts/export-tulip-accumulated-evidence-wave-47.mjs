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
const SNAPSHOT_PATH = 'public/global-amphibian-chytrid-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const inventory = snapshot.assessment.global_pathogen_inventory;
const health = snapshot.assessment.observed_human_health_effect;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(inventory.detected_species_share_pct, [0, 10, 33, 67]),
  human_economic_burden: n(health.peak_additional_cases_per_1000_people_per_year, [0, 0.1, 0.5, 2]),
  persistence: n(inventory.oldest_detection_record_age_years_minimum, [0, 10, 40, 80]),
  extent: n(inventory.countries_with_occurrence_share_pct, [0, 10, 40, 70])
};

if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) {
  throw new Error('amphibian_chytrid_fungus_spreads: accumulated-impact gate failed');
}

const receipt = buildTulipUrgencyReceipt({
  node_id: 'amphibian_chytrid_fungus_spreads',
  method: 'impact_fallback',
  as_of: String(inventory.compiled_through_year),
  components,
  raw_inputs: {
    biophysical_burden: {
      detected_species: inventory.detected_species,
      sampled_species: inventory.sampled_species,
      detected_species_share_pct: inventory.detected_species_share_pct,
      normalization_anchors_pct: [0, 10, 33, 67]
    },
    human_economic_burden: {
      geography: health.geography,
      peak_additional_malaria_cases_per_1000_people_per_year: health.peak_additional_cases_per_1000_people_per_year,
      elevated_incidence_duration_years: health.elevated_malaria_incidence_duration_years,
      normalization_anchors_cases_per_1000: [0, 0.1, 0.5, 2],
      causal_boundary: health.causal_boundary
    },
    persistence: {
      oldest_detection_record_age_years_minimum: inventory.oldest_detection_record_age_years_minimum,
      normalization_anchors_years: [0, 10, 40, 80]
    },
    extent: {
      countries_with_occurrence: inventory.countries_with_occurrence,
      sampled_countries: inventory.sampled_countries,
      countries_with_occurrence_share_pct: inventory.countries_with_occurrence_share_pct,
      normalization_anchors_pct: [0, 10, 40, 70]
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at
    }
  },
  transformations: [
    {
      type: 'global_detection_burden_normalization',
      formula: 'Normalize the published share of sampled amphibian species with Bd detections; do not convert detections into deaths or infer prevalence among untested species.'
    },
    {
      type: 'regional_human_health_normalization',
      formula: 'Normalize the causal peak additional malaria incidence measured in Costa Rica and Panama; retain its regional boundary and do not extrapolate a global case count.'
    },
    {
      type: 'documented_persistence_and_extent_normalization',
      formula: 'Normalize the minimum age of the oldest detection records and the observed share of sampled countries with Bd occurrence.'
    },
    {
      type: 'impact_composite',
      formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1–10 with 1 + 9 × composite and round to one decimal.'
    }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Global occurrence compilation through ${inventory.compiled_through_year}; regional malaria records through ${health.study_period_end_year}; reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'Peer-reviewed global surveillance quantifies host-species burden, multi-decadal persistence and country extent, while a separate causal study quantifies a bounded human-health burden after amphibian collapse.',
    higher_priority_failures: ['The global source explicitly cautions that accumulated detections do not measure a temporal prevalence trend, so the current-data momentum gate does not pass.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for amphibian_chytrid_fungus_spreads.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_47_global_amphibian_chytrid',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-47.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-47.json',
  promoted_node_count: registry.promoted_node_count,
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
