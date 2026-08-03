import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, historicalDistributionAnchors, normalizeWithAnchors, qualifiesForCurrentData, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/noaa-florida-current-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const annual = snapshot.source_summary.annual_means;
const latest = annual.at(-1);
const history = annual.slice(0, -1);
const round = (value, digits = 6) => Number(value.toFixed(digits));

if (annual.length < 20 || history.length < 20 || latest.observation_year !== new Date().getUTCFullYear() - 1) {
  throw new Error('NOAA Florida Current annual historical-distribution gate failed.');
}

const referenceTransport = snapshot.source_summary.long_term_reference_transport_sverdrups;
const shortfalls = annual.map(point => referenceTransport - point.mean_transport_sverdrups);
const priorShortfalls = shortfalls.slice(0, -1);
const annualTransports = annual.map(point => point.mean_transport_sverdrups);
const priorTransports = annualTransports.slice(0, -1);
const annualDeclines = annualTransports.slice(1).map((value, index) => annualTransports[index] - value);
const magnitudeAnchors = historicalDistributionAnchors(priorShortfalls, 'annual');
const inverseTransportAnchors = historicalDistributionAnchors(priorTransports.map(value => -value), 'annual');
const thresholdAnchors = inverseTransportAnchors?.map(value => -value);
const momentumAnchors = historicalDistributionAnchors(annualDeclines.slice(0, -1), 'annual');
if (!magnitudeAnchors || !thresholdAnchors || !momentumAnchors) throw new Error('NOAA Florida Current anchors unavailable.');

const latestShortfall = shortfalls.at(-1);
const latestDecline = annualDeclines.at(-1);
const components = {
  magnitude: round(normalizeWithAnchors(latestShortfall, magnitudeAnchors, 'higher_is_worse')),
  threshold: round(normalizeWithAnchors(latest.mean_transport_sverdrups, thresholdAnchors, 'lower_is_worse')),
  momentum: round(normalizeWithAnchors(latestDecline, momentumAnchors, 'higher_is_worse')),
  extent: 1
};
const gate = { direct_components: ['magnitude', 'threshold', 'momentum', 'extent'], global_scope: true, current_observation: true };
if (!qualifiesForCurrentData(gate)) throw new Error('gulf_stream_slowdown did not pass the current-data gate.');

const receipt = buildTulipUrgencyReceipt({
  node_id: 'gulf_stream_slowdown',
  method: 'current_data',
  as_of: String(latest.observation_year),
  components,
  raw_inputs: {
    magnitude: {
      latest_complete_year: latest.observation_year,
      latest_annual_mean_transport_sverdrups: latest.mean_transport_sverdrups,
      noaa_long_term_reference_transport_sverdrups: referenceTransport,
      latest_shortfall_from_reference_sverdrups: round(latestShortfall),
      complete_prior_annual_observations: history.length,
      historical_distribution_anchors_shortfall_sverdrups: magnitudeAnchors.map(value => round(value))
    },
    threshold: {
      latest_annual_mean_transport_sverdrups: latest.mean_transport_sverdrups,
      threshold_basis: 'historical_distribution_fallback',
      direction: 'lower_is_worse',
      historical_distribution_anchors_transport_sverdrups_in_worsening_order: thresholdAnchors.map(value => round(value))
    },
    momentum: {
      latest_year_over_year_decline_sverdrups: round(latestDecline),
      complete_prior_annual_change_observations: annualDeclines.length - 1,
      historical_distribution_anchors_decline_sverdrups: momentumAnchors.map(value => round(value))
    },
    extent: {
      normalized_value: 1,
      definition: 'Complete coverage of the node contract’s declared Florida Straits 27N section; this does not imply worldwide spatial coverage or represent the full AMOC.'
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at,
      product_versions: snapshot.request.product_versions,
      latest_valid_daily_observations: latest.valid_daily_observations
    },
    coverage_gate: gate
  },
  transformations: [
    { type: 'complete_calendar_year_aggregation', formula: 'Average only NOAA daily v3 transport values with valid quality flags 0, 1 or 3; require at least 300 valid days per year and never impute missing days.' },
    { type: 'reference_shortfall', formula: 'Subtract the annual mean transport from NOAA’s documented 32 Sv long-term mean so a larger shortfall means greater slowdown urgency.' },
    { type: 'reverse_direction_historical_distribution', formula: 'Map annual transport through prior-year median / p25 / p10 / p2.5 anchors expressed in worsening order because lower transport is worse.' },
    { type: 'annual_decline_momentum', formula: 'Subtract the latest annual mean from the preceding annual mean and normalize that decline through prior complete annual changes.' },
    { type: 'bounded_node_domain_extent', formula: 'Assign full extent only for the exact 27N section specified by the reviewed node contract; retain explicit exclusions for downstream path and AMOC.' }
  ],
  source_ids: ['noaa_florida_current_transport_time_series_data_products'],
  uncertainty: `${snapshot.uncertainty} The section includes wind-driven and overturning contributions, and annual section transport must not be interpreted as a basin-wide AMOC observation.`,
  freshness: `NOAA daily v3 transport through complete calendar year ${latest.observation_year}; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: `NOAA supplies ${annual.length} complete annual observations of the exact 27N section contract, including current magnitude, historical position, annual momentum and full node-domain extent.`,
    higher_priority_failures: []
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for gulf_stream_slowdown.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_40_noaa_florida_current_transport', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'noaa_florida_current_transport_time_series_data_products', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-40.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-40.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method, components: receipt.components } }, null, 2));
