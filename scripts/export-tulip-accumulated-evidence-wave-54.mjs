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
const SNAPSHOT_PATH = 'public/us-mortgage-climate-exposure-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const exposure = snapshot.assessment.event_exposure;
const persistence = snapshot.assessment.observed_outcome_persistence;
const extent = snapshot.assessment.geographic_extent;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(exposure.enterprise_backed_single_family_loan_count, [0, 100000, 1000000, 5000000]),
  human_economic_burden: n(exposure.unpaid_principal_balance_millions_usd, [0, 25000, 250000, 1000000]),
  persistence: n(persistence.post_event_observation_months, [0, 3, 12, 24]),
  extent: n(extent.directly_assessed_country_count, [0, 1, 10, 50])
};

if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) {
  throw new Error('mortgage_market_exposure: accumulated-impact gate failed');
}

const receipt = buildTulipUrgencyReceipt({
  node_id: 'mortgage_market_exposure',
  method: 'impact_fallback',
  as_of: exposure.portfolio_as_of,
  components,
  raw_inputs: {
    biophysical_burden: {
      events: exposure.events,
      hazard_boundary: exposure.hazard_boundary,
      enterprise_backed_single_family_loan_count: exposure.enterprise_backed_single_family_loan_count,
      normalization_anchors_loans: [0, 100000, 1000000, 5000000]
    },
    human_economic_burden: {
      unpaid_principal_balance_millions_usd: exposure.unpaid_principal_balance_millions_usd,
      mean_unpaid_principal_balance_usd: exposure.mean_unpaid_principal_balance_usd,
      loans_in_special_flood_hazard_areas_at_origination_pct: exposure.loans_in_special_flood_hazard_areas_at_origination_pct,
      loans_60_plus_days_delinquent_before_events_pct: exposure.loans_60_plus_days_delinquent_before_events_pct,
      normalization_anchors_millions_usd: [0, 25000, 250000, 1000000],
      scoring_boundary: exposure.scoring_boundary
    },
    persistence: {
      hurricane_event_count: persistence.hurricane_event_count,
      post_event_observation_months: persistence.post_event_observation_months,
      average_90_day_delinquency_increase_percentage_points: persistence.average_90_day_delinquency_increase_percentage_points,
      additional_90_day_delinquency_increase_per_inch_rain_percentage_points: persistence.additional_90_day_delinquency_increase_per_inch_rain_percentage_points,
      delinquencies_modifications_and_foreclosures_increased: persistence.delinquencies_modifications_and_foreclosures_increased,
      normalization_anchors_months: [0, 3, 12, 24],
      scoring_boundary: persistence.scoring_boundary
    },
    extent: {
      directly_assessed_countries: extent.directly_assessed_countries,
      directly_assessed_country_count: extent.directly_assessed_country_count,
      normalization_anchors_countries: [0, 1, 10, 50],
      scoring_boundary: extent.scoring_boundary
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at
    }
  },
  transformations: [
    {
      type: 'hazard_threshold_mortgage_count_normalization',
      formula: 'Normalize Enterprise-backed loans in counties that crossed the declared FEMA Individual Assistance event threshold for Helene or Milton; do not treat every loan as physically damaged.'
    },
    {
      type: 'bounded_mortgage_balance_exposure_normalization',
      formula: 'Normalize the reported unpaid principal balance in the declared disaster counties. Keep exposure distinct from realized credit loss and retain the source warning that only a small portion may become loss.'
    },
    {
      type: 'observed_post_hurricane_outcome_duration_normalization',
      formula: 'Normalize the separate FHFA study’s twelve-month post-event observation window, which directly identified increases in delinquencies, modifications and foreclosures across 28 storms.'
    },
    {
      type: 'bounded_country_extent_normalization',
      formula: 'Normalize only the one directly assessed country; Enterprise portfolio breadth does not become global mortgage-market coverage.'
    },
    {
      type: 'impact_composite',
      formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1–10 with 1 + 9 × composite and round to one decimal.'
    }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Helene/Milton exposure uses the ${exposure.portfolio_as_of} servicing cycle; both FHFA analyses were published in 2024 and reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'FHFA administrative records quantify an event-threshold mortgage count and balance, while a separate 28-storm FHFA study quantifies adverse mortgage outcomes through twelve months after hurricanes.',
    higher_priority_failures: ['Both sources cover United States Enterprise-backed mortgages rather than a current global mortgage-market aggregation.', 'The event-specific exposure is one portfolio snapshot and does not satisfy the historical-distribution gate for current_data.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for mortgage_market_exposure.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_54_us_mortgage_climate_exposure',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-54.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-54.json',
  promoted_node_count: registry.promoted_node_count,
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
