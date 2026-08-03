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
const SNAPSHOT_PATH = 'public/unep-who-heavy-metal-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(assessment.mercury.environmental_concentration_multiple_of_preindustrial, [1, 1.5, 2, 3]),
  human_economic_burden: n(assessment.lead.attributable_dalys_million, [0, 10, 35, 70]),
  persistence: 1,
  extent: assessment.global_extent.normalized_value
};

if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) {
  throw new Error('heavy_metal_bioaccumulation: accumulated-impact gate failed');
}

const receipt = buildTulipUrgencyReceipt({
  node_id: 'heavy_metal_bioaccumulation',
  method: 'impact_fallback',
  as_of: String(assessment.lead.assessment_year),
  components,
  raw_inputs: {
    biophysical_burden: {
      sentinel_metal: 'mercury',
      environmental_concentration_multiple_of_preindustrial: assessment.mercury.environmental_concentration_multiple_of_preindustrial,
      quantified_anthropogenic_release_to_water_and_land_tonnes_excluding_asgm: assessment.mercury.quantified_anthropogenic_release_to_water_and_land_tonnes_excluding_asgm,
      quantified_asgm_release_to_water_and_land_tonnes: assessment.mercury.quantified_asgm_release_to_water_and_land_tonnes,
      combined_quantified_release_tonnes: assessment.mercury.combined_quantified_release_tonnes,
      normalization_anchors_multiple_of_preindustrial: [1, 1.5, 2, 3]
    },
    human_economic_burden: {
      sentinel_metal: 'lead',
      attributable_deaths_million: assessment.lead.attributable_deaths_million,
      attributable_dalys_million: assessment.lead.attributable_dalys_million,
      normalization_anchors_dalys_million: [0, 10, 35, 70]
    },
    persistence: {
      normalized_value: 1,
      mercury_persistence_class: assessment.mercury.persistence_class,
      mercury_bioaccumulation_pathway: assessment.mercury.bioaccumulation_pathway,
      lead_storage_pathway: assessment.lead.storage_pathway,
      basis: 'Extreme persistence anchor: metals are elements that do not biodegrade; UNEP documents continuing mercury cycling and food-web concentration, and WHO documents lead storage in bone and accumulation over time.'
    },
    extent: assessment.global_extent,
    sentinel_boundary: assessment.node_boundary,
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at
    }
  },
  transformations: [
    {
      type: 'mercury_environmental_burden_normalization',
      formula: 'Map UNEP reported global environmental mercury concentration relative to preindustrial conditions through 1×, 1.5×, 2× and 3× documented anchors.'
    },
    {
      type: 'lead_health_burden_normalization',
      formula: 'Map WHO reported global lead-attributable DALYs through declared 0, 10, 35 and 70 million DALY anchors.'
    },
    {
      type: 'persistent_element_anchor',
      formula: 'Assign the extreme persistence anchor because UNEP documents mercury cycling and bioaccumulation after release and WHO documents lead storage and accumulation in the body.'
    },
    {
      type: 'sentinel_metal_boundary',
      formula: 'Keep mercury environmental burden separate from lead health burden; do not add them or infer an all-heavy-metal total.'
    },
    {
      type: 'impact_composite',
      formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1–10 with 1 + 9 × composite and round to one decimal.'
    }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: `${snapshot.uncertainty} The score is a sentinel-based global accumulated-impact index, not a current ambient concentration score.`,
  freshness: `Environmental mercury inventory year ${assessment.mercury.assessment_year}; WHO lead burden year ${assessment.lead.assessment_year}; reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNEP and WHO provide quantitative global environmental and health burdens, documented persistence and bioaccumulation, and global extent for two explicit sentinel heavy metals.',
    higher_priority_failures: ['No harmonized current global observation series supplies magnitude plus threshold or momentum for the full heavy-metal class.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for heavy_metal_bioaccumulation.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_45_unep_who_heavy_metal_burden',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-45.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-45.json',
  promoted_node_count: registry.promoted_node_count,
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
