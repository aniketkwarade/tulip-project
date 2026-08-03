import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/rapid-amoc-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const monthly = snapshot.records.filter(record => record.complete_for_scoring && Number.isFinite(record.mean_transport_sverdrups));
const latest = monthly.at(-1);
const history = monthly.slice(0, -1);
const baseline = snapshot.source_summary.documented_long_term_mean_transport_sverdrups;
const shortfalls = monthly.map(record => baseline - record.mean_transport_sverdrups);
const declines = monthly.slice(1).map((record, index) => monthly[index].mean_transport_sverdrups - record.mean_transport_sverdrups);
const magnitudeAnchors = historicalDistributionAnchors(shortfalls.slice(0, -1), 'monthly');
const inverseTransportAnchors = historicalDistributionAnchors(history.map(record => -record.mean_transport_sverdrups), 'monthly');
const thresholdAnchors = inverseTransportAnchors?.map(value => -value);
const momentumAnchors = historicalDistributionAnchors(declines.slice(0, -1), 'monthly');
const round = (value, digits = 6) => Number(value.toFixed(digits));

if (history.length < 60 || !magnitudeAnchors || !thresholdAnchors || !momentumAnchors || latest.observation_period !== snapshot.source_summary.latest_complete_month) {
  throw new Error('RAPID AMOC monthly historical-distribution gate failed.');
}

const latestShortfall = shortfalls.at(-1);
const latestDecline = declines.at(-1);
const components = {
  magnitude: round(normalizeWithAnchors(latestShortfall, magnitudeAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.mean_transport_sverdrups, thresholdAnchors, 'lower_is_worse')),
  momentum: round(normalizeWithAnchors(latestDecline, momentumAnchors, 'higher_is_worse')),
  extent: 1
};
const gate = { direct_components: ['magnitude', 'threshold', 'momentum', 'extent'], global_scope: true, current_observation: true };
if (!qualifiesForCurrentData(gate)) throw new Error('amoc did not pass the current-data coverage gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'amoc',
  method: 'current_data',
  as_of: latest.observation_period,
  components,
  raw_inputs: {
    magnitude: {
      latest_complete_month: latest.observation_period,
      latest_monthly_mean_transport_sverdrups: latest.mean_transport_sverdrups,
      documented_long_term_mean_transport_sverdrups: baseline,
      latest_shortfall_from_long_term_mean_sverdrups: round(latestShortfall),
      complete_prior_monthly_observations: history.length,
      historical_distribution_anchors_shortfall_sverdrups: magnitudeAnchors.map(value => round(value))
    },
    threshold: {
      latest_monthly_mean_transport_sverdrups: latest.mean_transport_sverdrups,
      threshold_basis: 'historical_distribution_fallback',
      direction: 'lower_is_worse',
      historical_distribution_anchors_transport_sverdrups_in_worsening_order: thresholdAnchors.map(value => round(value))
    },
    momentum: {
      prior_complete_month: monthly.at(-2).observation_period,
      latest_month_over_month_decline_sverdrups: round(latestDecline),
      complete_prior_monthly_change_observations: declines.length - 1,
      historical_distribution_anchors_monthly_decline_sverdrups: momentumAnchors.map(value => round(value))
    },
    extent: {
      normalized_value: 1,
      definition: 'Complete coverage of the reviewed node contract at the declared 26.5N full-basin-width Atlantic section; this does not imply direct observation at every latitude.'
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      source_publication_date: snapshot.source_summary.source_publication_date,
      source_end_date: snapshot.source_summary.source_end_date,
      source_sha256: snapshot.source_summary.source_sha256,
      valid_half_daily_observations: latest.valid_half_daily_observations,
      coverage_fraction: latest.coverage_fraction
    },
    coverage_gate: gate
  },
  transformations: [
    { type: 'coverage_qualified_monthly_aggregation', formula: 'Average only finite RAPID moc_mar_hc10 half-daily values; require at least 80 percent of expected twice-daily observations for a calendar month and never impute missing values.' },
    { type: 'long_term_mean_shortfall', formula: 'Subtract monthly mean AMOC transport from RAPID’s documented 16.9 Sv long-term mean so larger shortfall maps upward.' },
    { type: 'reverse_direction_historical_distribution', formula: 'Map monthly transport through prior-month median / p25 / p10 / p2.5 anchors expressed in worsening order because lower transport is worse.' },
    { type: 'monthly_decline_momentum', formula: 'Subtract the latest complete monthly mean from the preceding complete monthly mean and normalize the decline through prior complete monthly changes.' },
    { type: 'contract_domain_extent', formula: 'Assign full extent only for the full-basin-width 26.5N section declared in the reviewed AMOC metric contract.' }
  ],
  source_ids: ['rapid_amoc_26n_transport_time_series'],
  uncertainty: `${snapshot.uncertainty} Sub-annual variability is large, and a low monthly value is not evidence of collapse or a persistent secular decline.`,
  freshness: `Latest authoritative RAPID release published ${snapshot.source_summary.source_publication_date}, with the latest coverage-qualified observation month ${latest.observation_period}; snapshot captured ${snapshot.captured_at}. The mooring-recovery and quality-control lag is explicit internal metadata.`,
  selection_reason: {
    selected_method_passed: `RAPID supplies ${monthly.length} coverage-qualified monthly observations of full-basin-width AMOC transport at the contract’s declared 26.5N section, directly supporting current magnitude, historical position, monthly momentum and node-domain extent.`,
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for amoc.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_42_rapid_amoc_26n_transport', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'rapid_amoc_26n_transport_time_series', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-42.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-42.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
