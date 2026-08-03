import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/unep-peatlands-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const assessment = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));
const persistenceYearsEquivalent = assessment.drained_or_degraded_current_peatlands_pct / assessment.intact_peatland_destroyed_annually_pct;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'peatland_degradations',
  method: 'impact_fallback',
  as_of: String(assessment.atlas_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(assessment.drained_or_degraded_current_peatlands_pct, [0, 5, 10, 20], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(assessment.annual_conservation_and_restoration_investment_need_usd_billion_upper_bound, [0, 10, 25, 50], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(persistenceYearsEquivalent, [0, 25, 50, 100], 'higher_is_worse')),
    extent: round(assessment.countries_with_peatlands / assessment.un_member_states)
  },
  raw_inputs: {
    biophysical_burden: {
      drained_or_degraded_current_peatlands_pct: assessment.drained_or_degraded_current_peatlands_pct,
      anchors_pct: [0, 5, 10, 20],
      annual_human_induced_emissions_share_pct_context_only: assessment.annual_human_induced_emissions_share_pct,
      global_soil_carbon_share_upper_bound_context_only: assessment.global_soil_carbon_share_upper_bound
    },
    human_economic_burden: {
      annual_conservation_and_restoration_investment_need_usd_billion_upper_bound: assessment.annual_conservation_and_restoration_investment_need_usd_billion_upper_bound,
      anchors_usd_billion: [0, 10, 25, 50],
      boundary: 'UNEP-assessed annual remediation financing requirement; not observed monetary damage or a financing shortfall.'
    },
    persistence: {
      intact_peatland_destroyed_annually_hectares: assessment.intact_peatland_destroyed_annually_hectares,
      intact_peatland_destroyed_annually_pct: assessment.intact_peatland_destroyed_annually_pct,
      damaged_share_to_annual_loss_rate_years_equivalent: persistenceYearsEquivalent,
      anchors_years_equivalent: [0, 25, 50, 100]
    },
    extent: {
      countries_with_peatlands: assessment.countries_with_peatlands,
      un_member_states: assessment.un_member_states,
      normalized_value: round(assessment.countries_with_peatlands / assessment.un_member_states),
      geography_boundary: assessment.geography_boundary
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      source_locators: assessment.source_locators
    }
  },
  transformations: [
    {
      type: 'fixed_global_assessment_ranges',
      formula: 'Normalize the UNEP-assessed degraded share and annual remediation financing requirement through named fixed impact ranges.'
    },
    {
      type: 'quantitative_persistence_ratio',
      formula: 'Current drained-or-degraded share divided by the atlas-reported annual intact-peatland destruction rate; capped through the 100-year-equivalent extreme anchor.'
    },
    {
      type: 'country_extent_ratio',
      formula: '177 source-reported countries with peatlands / 193 UN Member States.'
    }
  ],
  source_ids: ['unep_global_peatlands_assessment_2022'],
  uncertainty: snapshot.uncertainty,
  freshness: `UNEP 2022 assessment with 2024 hotspot-atlas extent and annual-loss update; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'UNEP assessments quantify global damaged share, ongoing annual loss, emissions contribution, remediation financing and peatland presence across UN Member States.',
    higher_priority_failures: [
      'The assessment and atlas provide benchmark totals rather than at least 20 complete annual or 60 monthly global observations.',
      'No source-consistent series supplies current magnitude plus threshold proximity or momentum at the current-data coverage gate.'
    ]
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for peatland_degradations.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_4_unep_peatlands',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'unep_global_peatlands_assessment_2022',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-4.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-4.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
