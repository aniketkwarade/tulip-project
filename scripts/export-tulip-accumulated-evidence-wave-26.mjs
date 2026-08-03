import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/fao-unccd-global-dryland-degradation-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'desertification_frontiers',
  method: 'impact_fallback',
  as_of: String(a.assessment_as_of),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.global_desertification_area_billion_hectares, [0, 0.25, 0.75, 1.5], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.people_directly_affected_million, [0, 50, 200, 1000], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(a.desertification_annual_rate_million_hectares_per_year, [0, 1, 3, 6], 'higher_is_worse')),
    extent: a.affected_country_share_normalized
  },
  raw_inputs: {
    biophysical_burden: {
      global_desertification_area_billion_hectares: a.global_desertification_area_billion_hectares,
      source_year: a.global_desertification_area_source_year,
      anchors_billion_hectares: [0, 0.25, 0.75, 1.5],
      boundary: 'GLASOD/UNEP accumulated area affected by desertification; not current annual degradation, drought extent or all land degradation.'
    },
    human_economic_burden: {
      people_directly_affected_million: a.people_directly_affected_million,
      people_at_risk_million_context_only: a.people_at_risk_million,
      anchors_million_people: [0, 50, 200, 1000],
      boundary: 'Only the source-labelled directly affected population is normalized; the at-risk population is retained without addition.'
    },
    persistence: {
      desertification_annual_rate_million_hectares_per_year: a.desertification_annual_rate_million_hectares_per_year,
      source_year: a.desertification_annual_rate_source_year,
      anchors_million_hectares_per_year: [0, 1, 3, 6],
      independent_context: {
        annual_land_becoming_unproductive_from_desertification_and_drought_million_hectares: a.annual_land_becoming_unproductive_from_desertification_and_drought_million_hectares,
        annual_grain_production_loss_from_desertification_and_drought_million_tonnes: a.annual_grain_production_loss_from_desertification_and_drought_million_tonnes
      },
      boundary: 'The desertification-only annual rate is normalized. The newer combined desertification-and-drought estimate remains context and is not substituted.'
    },
    extent: {
      affected_countries_minimum: a.countries_affected_minimum,
      reference_country_count: a.reference_country_count,
      normalized_value: a.affected_country_share_normalized,
      global_dryland_area_billion_hectares: a.global_dryland_area_billion_hectares,
      global_dryland_land_share_pct: a.global_dryland_land_share_pct,
      global_dryland_population_billion: a.global_dryland_population_billion,
      boundary: 'Minimum affected-country count divided by 193 UN member states; no claim of uniform country area or severity.'
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      source_locators: a.source_locators,
      excluded_from_scoring: snapshot.excluded_from_scoring
    }
  },
  transformations: [
    { type: 'fixed_accumulated_desertification_area', formula: 'Normalize the FAO-synthesized 1.14 billion hectares affected through declared cross-scale area anchors.' },
    { type: 'directly_affected_population_only', formula: 'Normalize the source-labelled 200 million people directly affected; retain but do not add the population at risk.' },
    { type: 'documented_annual_desertification_rate', formula: 'Normalize the desertification-only 5.8 million hectares per year through declared annual-rate anchors; do not silently substitute the combined drought figure.' },
    { type: 'minimum_country_extent', formula: 'Divide the source minimum of 100 affected countries by 193 UN member states and retain the all-continent scope.' }
  ],
  source_ids: ['fao_unccd_global_dryland_degradation_impact'],
  uncertainty: snapshot.uncertainty,
  freshness: `UNCCD synthesis ${a.assessment_as_of}; underlying global desertification extent ${a.global_desertification_area_source_year} and annual-rate ${a.desertification_annual_rate_source_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'FAO and UNCCD quantify accumulated dryland desertification area, directly affected people, a recurring annual desertification rate and cross-continent country extent, while preserving the age and comparability limits of the underlying assessments.',
    higher_priority_failures: ['The UNCCD portal does not yet supply a source-consistent current global annual panel with magnitude plus threshold or momentum.', 'The accumulated estimates are older assessment syntheses and therefore are not mislabeled as current observations.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for desertification_frontiers.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_26_fao_unccd_global_dryland_degradation',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'fao_unccd_global_dryland_degradation_impact',
  promoted_node_count: 1,
  receipts: [receipt]
};
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-26.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-26.json',
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components }
}, null, 2));
