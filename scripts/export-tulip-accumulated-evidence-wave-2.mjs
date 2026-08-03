import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/imbie-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = (value, digits = 6) => Number(value.toFixed(digits));
const combined = snapshot.records.find(record => record.region === 'Greenland and Antarctic ice sheets combined');
if (!combined) throw new Error('IMBIE combined ice-sheet assessment record is missing.');
const componentRecords = snapshot.records.filter(record => ['Greenland Ice Sheet', 'Antarctic Ice Sheet'].includes(record.region));
if (componentRecords.length !== 2) throw new Error('IMBIE assessment does not contain both major ice-sheet component records.');

const lossGt = Math.abs(combined.cumulative_mass_change_gt);
const seaLevelMm = combined.sea_level_equivalent_mm;
const periodYears = combined.period_years;
const receipt = buildTulipUrgencyReceipt({
  node_id: 'ice_sheet_mass_loss',
  method: 'impact_fallback',
  as_of: String(combined.period_end),
  components: {
    biophysical_burden: round(normalizeWithAnchors(lossGt, [0, 1000, 5000, 10000], 'higher_is_worse')),
    human_economic_burden: round(normalizeWithAnchors(seaLevelMm, [0, 5, 15, 30], 'higher_is_worse')),
    persistence: round(Math.min(1, periodYears / 30)),
    extent: 1
  },
  raw_inputs: {
    biophysical_burden: {
      combined_cumulative_ice_sheet_mass_loss_gt: lossGt,
      uncertainty_gt: combined.cumulative_mass_change_uncertainty_gt,
      anchors_gt: [0, 1000, 5000, 10000],
      normalization_basis: 'Named global-assessment burden scale spanning no accumulated loss to ten thousand gigatonnes; retained as a fixed versioned impact range, not a recognized physical tipping threshold.',
      source_locator: combined.source_locator
    },
    human_economic_burden: {
      source_reported_sea_level_equivalent_mm: seaLevelMm,
      uncertainty_mm: combined.sea_level_equivalent_uncertainty_mm,
      anchors_mm: [0, 5, 15, 30],
      normalization_basis: 'Named assessment impact range in global mean sea-level equivalent; the component does not estimate damages or local relative sea level.',
      source_locator: combined.source_locator
    },
    persistence: {
      assessment_period_start: combined.period_start,
      assessment_period_end: combined.period_end,
      assessment_period_years: periodYears,
      reference_duration_years: 30,
      normalized_value: round(Math.min(1, periodYears / 30)),
      source_locator: combined.source_locator
    },
    extent: {
      assessed_major_ice_sheets: componentRecords.map(record => record.region),
      assessed_count: componentRecords.length,
      required_count: 2,
      normalized_value: 1,
      definition: 'Both Greenland and Antarctic ice sheets are included in the reconciled combined assessment.'
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      article_doi: snapshot.source?.article_doi,
      dataset_doi: snapshot.source?.dataset_doi
    }
  },
  transformations: [
    {
      type: 'loss_sign_normalization',
      formula: 'Take the absolute magnitude of source-reported negative cumulative mass change; retain the original sign and uncertainty in the snapshot.'
    },
    {
      type: 'fixed_assessment_impact_ranges',
      formula: 'Normalize cumulative gigatonne loss and source-reported global mean sea-level equivalent through fixed named ranges; these ranges are calibration scales, not tipping-point claims.'
    },
    {
      type: 'quantitative_persistence_and_extent',
      formula: 'Persistence is assessment years / 30 capped at one; extent is assessed major ice sheets / two.'
    }
  ],
  source_ids: ['ice_sheet_mass_balance_inter_comparison_exercise'],
  uncertainty: snapshot.uncertainty,
  freshness: `Reconciled IMBIE assessment spans ${combined.period_start}–${combined.period_end}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'The reconciled assessment quantifies cumulative mass loss, sea-level-equivalent burden, a 29-year persistence interval, uncertainty, and both major ice sheets.',
    higher_priority_failures: [
      'The operational snapshot contains assessment-period totals and average rates rather than at least 20 complete annual observations or 60 monthly observations.',
      'No current source series with magnitude plus threshold or momentum is bound to this node.'
    ]
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for ice_sheet_mass_loss.');
const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_2_imbie_ice_sheet_loss',
  generated_at: new Date().toISOString(),
  source_snapshot: SNAPSHOT_PATH,
  source_id: 'ice_sheet_mass_balance_inter_comparison_exercise',
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-2.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-2.json',
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
