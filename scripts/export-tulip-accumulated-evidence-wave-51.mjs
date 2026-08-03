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
const SNAPSHOT_PATH = 'public/us-climate-insurance-retreat-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const coverage = snapshot.assessment.coverage;
const availability = snapshot.assessment.availability;
const burden = snapshot.assessment.household_and_insurer_burden;
const extent = snapshot.assessment.geographic_extent;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(availability.highest_risk_zip_average_nonrenewal_rate_pct, [0, 0.5, 1, 2]),
  human_economic_burden: n(burden.highest_vs_lowest_risk_premium_increase_pct, [0, 10, 50, 100]),
  persistence: n(coverage.observation_years, [0, 1, 3, 10]),
  extent: n(extent.directly_assessed_country_count, [0, 1, 10, 50])
};

if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) {
  throw new Error('insurance_retreat: accumulated-impact gate failed');
}

const receipt = buildTulipUrgencyReceipt({
  node_id: 'insurance_retreat',
  method: 'impact_fallback',
  as_of: String(coverage.observation_end_year),
  components,
  raw_inputs: {
    biophysical_burden: {
      highest_risk_zip_average_nonrenewal_rate_pct: availability.highest_risk_zip_average_nonrenewal_rate_pct,
      highest_vs_lowest_risk_nonrenewal_rate_increase_pct: availability.highest_vs_lowest_risk_nonrenewal_rate_increase_pct,
      normalization_anchors_nonrenewal_rate_pct: [0, 0.5, 1, 2]
    },
    human_economic_burden: {
      highest_risk_zip_average_premium_usd: burden.highest_risk_zip_average_premium_usd,
      highest_vs_lowest_risk_premium_increase_pct: burden.highest_vs_lowest_risk_premium_increase_pct,
      highest_vs_lowest_risk_paid_loss_ratio_increase_pct: burden.highest_vs_lowest_risk_paid_loss_ratio_increase_pct,
      highest_risk_average_claim_severity_usd: burden.highest_risk_average_claim_severity_usd,
      lowest_risk_average_claim_severity_usd: burden.lowest_risk_average_claim_severity_usd,
      normalization_anchors_premium_increase_pct: [0, 10, 50, 100]
    },
    persistence: {
      observation_start_year: coverage.observation_start_year,
      observation_end_year: coverage.observation_end_year,
      observation_years: coverage.observation_years,
      highest_risk_nonrenewal_increased_more_over_period: availability.highest_risk_nonrenewal_increased_more_over_period,
      normalization_anchors_years: [0, 1, 3, 10]
    },
    extent: {
      directly_assessed_countries: extent.directly_assessed_countries,
      directly_assessed_country_count: extent.directly_assessed_country_count,
      us_regions: coverage.us_regions,
      regions_where_highest_risk_zip_nonrenewal_exceeded_lowest_risk_zip_nonrenewal: availability.regions_where_highest_risk_zip_nonrenewal_exceeded_lowest_risk_zip_nonrenewal,
      normalization_anchors_countries: [0, 1, 10, 50],
      scoring_boundary: extent.scoring_boundary
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      policy_years_lower_bound: coverage.policy_years_lower_bound,
      insurer_count_lower_bound: coverage.insurer_count_lower_bound
    }
  },
  transformations: [
    {
      type: 'observed_nonrenewal_burden_normalization',
      formula: 'Normalize the five-year average policy nonrenewal rate in the highest climate-peril-risk ZIP Code quintile; retain the reported 80 percent high-versus-low risk contrast as corroborating evidence.'
    },
    {
      type: 'household_cost_burden_normalization',
      formula: 'Normalize the reported premium difference between the highest and lowest climate-peril-risk ZIP Code quintiles; retain paid-loss and claim-severity differences without adding them as duplicate points.'
    },
    {
      type: 'observed_period_persistence_normalization',
      formula: 'Normalize the five-year observed reporting interval and retain the source finding that nonrenewal rates increased more in the highest-risk areas.'
    },
    {
      type: 'bounded_country_extent_normalization',
      formula: 'Normalize only the one directly assessed country; nationwide coverage across seven U.S. regions does not become global coverage.'
    },
    {
      type: 'impact_composite',
      formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1–10 with 1 + 9 × composite and round to one decimal.'
    }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `National policy records cover ${coverage.observation_start_year}–${coverage.observation_end_year}; Federal Insurance Office analysis released in 2025 and reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'A national administrative dataset directly quantifies policy nonrenewal, worsening availability, household premium burden and insurer loss pressure across more than 246 million policy-years.',
    higher_priority_failures: ['The public series contains five annual observations and therefore does not satisfy the 20-annual-observation historical-distribution gate required for current_data.', 'The evidence is nationally comprehensive for the United States but not global; the extent component remains explicitly bounded to one country.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for insurance_retreat.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_51_us_climate_insurance_retreat',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-51.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-51.json',
  promoted_node_count: registry.promoted_node_count,
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
