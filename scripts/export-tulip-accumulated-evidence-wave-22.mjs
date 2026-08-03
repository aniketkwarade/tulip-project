import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/pollinator-service-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const a = snapshot.assessment;
const round = (value, digits = 6) => Number(value.toFixed(digits));

const receipt = buildTulipUrgencyReceipt({
  node_id: 'pollinator_service_decline',
  method: 'impact_fallback',
  as_of: String(a.publication_year),
  components: {
    biophysical_burden: round(normalizeWithAnchors(a.headline_crop_production_loss_pct.midpoint, [0, 1, 3, 5], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(a.annual_excess_deaths.midpoint, [0, 100000, 300000, 700000], 'higher_is_worse')),
    persistence: round(normalizeWithAnchors(a.burden_period_years, [0, 1, 5, 10], 'higher_is_worse')),
    extent: a.global_extent_normalized
  },
  raw_inputs: {
    biophysical_burden: {
      headline_crop_production_loss_pct: a.headline_crop_production_loss_pct,
      crop_specific_loss_pct: { fruit: a.fruit_production_loss_pct, vegetables: a.vegetable_production_loss_pct, nuts: a.nut_production_loss_pct },
      anchors_pct: [0, 1, 3, 5],
      boundary: 'Modeled present production shortfall attributable to inadequate pollination; not the value of all production benefiting from pollination.'
    },
    human_economic_burden: {
      annual_excess_deaths: a.annual_excess_deaths,
      anchors_deaths_per_year: [0, 100000, 300000, 700000],
      boundary: 'Comparative-risk estimate of annual diet-associated mortality; uncertainty bounds remain metadata.'
    },
    persistence: {
      annual_burden_period_years: a.burden_period_years,
      anchors_years: [0, 1, 5, 10],
      boundary: 'One annual burden period only; no unobserved multi-year persistence is inferred.'
    },
    extent: {
      modeled_pollinator_dependent_crops: a.pollinator_dependent_crops_modeled,
      geographic_scope: a.geographic_scope,
      normalized_value: a.global_extent_normalized
    },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_locators: a.source_locators, excluded_from_scoring: snapshot.excluded_from_scoring }
  },
  transformations: [
    { type: 'midpoint_with_retained_interval', formula: 'Normalize the published 3-5% headline production-loss midpoint while preserving crop-specific 95% uncertainty intervals in metadata.' },
    { type: 'annual_health_burden', formula: 'Normalize the published annual excess-death midpoint; do not accumulate it across years or substitute an uncertainty bound.' },
    { type: 'bounded_persistence', formula: 'Score only the one-year burden period because the global study is cross-sectional and does not establish a complete global time trend.' }
  ],
  source_ids: ['global_pollinator_deficits_and_health_burden_study'],
  uncertainty: snapshot.uncertainty,
  freshness: `Peer-reviewed global burden study published ${a.publication_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'A peer-reviewed global assessment quantifies an attributable present crop-production shortfall, an annual human-health burden, a bounded annual period and global-by-country extent. Its modeled-estimate uncertainty remains explicit internal metadata.',
    higher_priority_failures: ['No complete current global pollinator visitation or fruit-set observation series supplies magnitude plus threshold or momentum; IPBES explicitly reports major geographic monitoring gaps.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for pollinator_service_decline.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_22_global_pollinator_service_burden',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'global_pollinator_deficits_and_health_burden_study',
  promoted_node_count: 1,
  receipts: [receipt]
};
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-22.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-22.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
