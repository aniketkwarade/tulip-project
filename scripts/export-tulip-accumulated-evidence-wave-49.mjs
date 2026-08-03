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
const SNAPSHOT_PATH = 'public/indonesian-peat-fire-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const air = snapshot.assessment.observed_air_quality;
const health = snapshot.assessment.assessed_health_burden;
const recurrence = snapshot.assessment.recurrence_and_extent;
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));

const components = {
  biophysical_burden: n(air.guideline_exceedance_ratio, [1, 2, 4, 6]),
  human_economic_burden: n(health.landscape_fire_attributable_deaths_sumatra_and_kalimantan, [0, 1000, 10000, 100000]),
  persistence: n(recurrence.years_with_recurrent_fire_pm25_exposure_share_pct, [0, 10, 50, 90]),
  extent: n(recurrence.documented_affected_country_count, [0, 1, 10, 50])
};

if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) {
  throw new Error('wetland_peat_fires: accumulated-impact gate failed');
}

const receipt = buildTulipUrgencyReceipt({
  node_id: 'wetland_peat_fires',
  method: 'impact_fallback',
  as_of: String(air.event_year),
  components,
  raw_inputs: {
    biophysical_burden: {
      city_mean_pm25_ug_m3: air.mean_pm25_ug_m3,
      contemporaneous_who_24h_guideline_ug_m3: air.contemporaneous_who_24h_guideline_ug_m3,
      guideline_exceedance_ratio: air.guideline_exceedance_ratio,
      normalization_anchors_ratio: [1, 2, 4, 6],
      observation_window: [air.sensor_deployment_start, air.sensor_deployment_end],
      sensor_count: air.sensor_count
    },
    human_economic_burden: {
      assessed_geography: 'Sumatra and Kalimantan',
      assessed_population: health.population_sumatra_and_kalimantan,
      attributable_deaths: health.landscape_fire_attributable_deaths_sumatra_and_kalimantan,
      normalization_anchors_deaths: [0, 1000, 10000, 100000],
      scoring_boundary: health.scoring_boundary
    },
    persistence: {
      observation_record_start_year: recurrence.cams_record_start_year,
      observation_record_end_year: recurrence.cams_record_end_year,
      years_with_recurrent_fire_pm25_exposure_share_pct: recurrence.years_with_recurrent_fire_pm25_exposure_share_pct,
      normalization_anchors_pct: [0, 10, 50, 90]
    },
    extent: {
      directly_assessed_country: recurrence.directly_assessed_country,
      documented_downwind_countries: recurrence.documented_downwind_countries,
      documented_affected_country_count: recurrence.documented_affected_country_count,
      normalization_anchors_countries: [0, 1, 10, 50]
    },
    source_snapshot: {
      path: SNAPSHOT_PATH,
      version: snapshot.version,
      captured_at: snapshot.captured_at
    }
  },
  transformations: [
    {
      type: 'observed_air_quality_burden_normalization',
      formula: 'Divide the observed fire-season city mean PM2.5 by the contemporaneous WHO 24-hour guideline, then normalize the exceedance ratio.'
    },
    {
      type: 'bounded_health_burden_normalization',
      formula: 'Normalize the study-reported attributable-death estimate for Sumatra and Kalimantan; do not substitute the broader nationwide estimate or extrapolate beyond the assessed population.'
    },
    {
      type: 'observed_recurrence_normalization',
      formula: 'Normalize the reported share of years with recurrent peat-fire PM2.5 exposure in the 2003–2019 CAMS record.'
    },
    {
      type: 'documented_geographic_extent_normalization',
      formula: 'Normalize only the three countries directly assessed or documented as downwind receptors; peatland presence elsewhere is not counted as fire impact.'
    },
    {
      type: 'impact_composite',
      formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1–10 with 1 + 9 × composite and round to one decimal.'
    }
  ],
  source_ids: snapshot.sources.map(source => source.id),
  uncertainty: snapshot.uncertainty,
  freshness: `Observed 2019 event with recurrence context through ${recurrence.cams_record_end_year}; peer-reviewed in 2024 and reviewed ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'A peer-reviewed study combines direct in-situ PM2.5 observations from a severe peat-fire episode with bounded attributable-mortality estimates, a 17-year recurrence record and documented transboundary reach.',
    higher_priority_failures: ['The evidence is a severe regional event and retrospective impact assessment, not a current global observation or defensible global time series, so current_data does not pass.']
  }
});

if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for wetland_peat_fires.');

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_49_indonesian_peat_fire_impact',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: 1,
  receipts: [receipt]
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-49.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-49.json',
  promoted_node_count: registry.promoted_node_count,
  receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method }
}, null, 2));
