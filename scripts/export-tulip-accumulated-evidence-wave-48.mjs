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
const SNAPSHOT_PATH = 'public/global-airport-coastal-flood-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const study = snapshot.assessment.study;
const exposure = snapshot.assessment.present_coastal_flood_exposure;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(exposure.airports_at_risk_share_pct, [0, 1, 5, 10]),
  human_economic_burden: n(exposure.routes_connected_to_at_risk_airports_share_pct, [0, 1, 5, 10]),
  persistence: n(study.adaptation_design_life_years, [0, 10, 40, 80]),
  extent: n(exposure.regions_with_at_risk_airports, [0, 2, 5, 8])
};

if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) {
  throw new Error('airport_climate_exposure: accumulated-impact gate failed');
}

const receipt = buildTulipUrgencyReceipt({
  node_id: 'airport_climate_exposure',
  method: 'impact_fallback',
  as_of: String(study.publication_year),
  components,
  raw_inputs: {
    biophysical_burden: {
      airports_at_present_coastal_flood_risk: exposure.airports_at_risk,
      global_airport_and_helipad_locations: study.airport_and_helipad_locations,
      airports_at_risk_share_pct: exposure.airports_at_risk_share_pct,
      normalization_anchors_pct: [0, 1, 5, 10]
    },
    human_economic_burden: {
      routes_connected_to_at_risk_airports: exposure.routes_connected_to_at_risk_airports,
      global_commercial_routes: study.commercial_routes,
      routes_connected_to_at_risk_airports_share_pct: exposure.routes_connected_to_at_risk_airports_share_pct,
      expected_annual_route_disruptions: exposure.expected_annual_route_disruptions,
      normalization_anchors_route_share_pct: [0, 1, 5, 10]
    },
    persistence: {
      assessed_adaptation_horizon_start_year: 2020,
      assessed_adaptation_horizon_end_year: study.future_assessment_end_year,
      adaptation_design_life_years: study.adaptation_design_life_years,
      normalization_anchors_years: [0, 10, 40, 80]
    },
    extent: {
      regions_with_at_risk_airports: exposure.regions_with_at_risk_airports,
      global_regions_reported: study.global_regions_reported,
      normalization_anchors_regions: [0, 2, 5, 8]
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at
    }
  },
  transformations: [
    {
      type: 'present_airport_exposure_normalization',
      formula: 'Normalize the published share of all assessed airport and helipad locations with non-zero present coastal-flood risk.'
    },
    {
      type: 'network_exposure_normalization',
      formula: 'Normalize the published share of global commercial routes connected to airports with non-zero present coastal-flood risk; retain expected annual route disruptions as corroborating burden without adding it a second time.'
    },
    {
      type: 'assessment_horizon_normalization',
      formula: 'Normalize the 2020–2100 adaptation design horizon used by the study; this encodes persistence of the infrastructure exposure, not realized disruption.'
    },
    {
      type: 'global_region_extent_normalization',
      formula: 'Normalize the number of study regions containing at least one airport with non-zero present coastal-flood risk.'
    },
    {
      type: 'impact_composite',
      formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1–10 with 1 + 9 × composite and round to one decimal.'
    }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Peer-reviewed global airport-network and coastal-flood assessment published in ${study.publication_year}; reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'A peer-reviewed global assessment quantifies present airport-site exposure, route-network exposure, expected annual route disruption, long-lived adaptation requirements and geographic extent.',
    higher_priority_failures: ['The study models present coastal-flood risk from airport locations, extreme-water levels and protection standards; it does not provide a current observed multi-hazard time series with the magnitude-plus-threshold-or-momentum coverage required for current_data.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for airport_climate_exposure.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_48_global_airport_coastal_flood_exposure',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-48.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-48.json',
  promoted_node_count: registry.promoted_node_count,
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
