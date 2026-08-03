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
const SNAPSHOT_PATH = 'public/global-atmospheric-hazard-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const round = value => Number(value.toFixed(6));
const n = (value, anchors) => round(normalizeWithAnchors(value, anchors, 'higher_is_worse'));

function make(nodeId, asOf, components, rawInputs, sourceIds, boundary, selectionReason) {
  const candidate = { quantitative_evidence: true, components };
  if (!qualifiesForImpactFallback(candidate)) throw new Error(`${nodeId}: impact fallback gate failed`);
  const receipt = buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(asOf),
    components,
    raw_inputs: {
      ...rawInputs,
      evidence_boundary: boundary,
      source_snapshot: {
        path: SNAPSHOT_PATH,
        version: snapshot.version,
        captured_at: snapshot.captured_at
      }
    },
    transformations: [
      { type: 'documented_anchor_normalization', formula: 'Normalize each retained quantitative burden against declared four-point anchors and clamp to [0,1].' },
      { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' },
      { type: 'boundary_preservation', formula: 'Keep atmospheric mass, exposure, observed concentration trend and comparative-risk burden distinct; missing values never become zero.' }
    ],
    source_ids: sourceIds,
    uncertainty: `${snapshot.uncertainty} ${boundary}`,
    freshness: `Latest retained assessment evidence through ${asOf}.`,
    selection_reason: selectionReason
  });
  const check = verifyTulipUrgencyReceipt(receipt);
  if (!check.valid) throw new Error(`${nodeId}: receipt verification failed`);
  return receipt;
}

const dust = snapshot.assessments.sand_and_dust_storm_burden;
const ozone = snapshot.assessments.tropospheric_ozone_burden;
const receipts = [
  make(
    'dust_storm_frequency',
    dust.assessment_year,
    {
      biophysical_burden: n(dust.airborne_sand_and_dust_million_tonnes_per_year, [0, 250, 1000, 2500]),
      human_economic_burden: n(dust.people_exposed_above_who_threshold_billion_2018_2022, [0, 0.5, 2, 4.5]),
      persistence: n(dust.current_assessment_end_year - dust.comparison_start_year + 1, [0, 5, 15, 30]),
      extent: dust.global_extent
    },
    dust,
    ['wmo_airborne_dust_bulletin_2025'],
    'This accumulated-impact score quantifies the global sand-and-dust burden and exposed population. It does not infer a global storm-event frequency from atmospheric mass or exposure.',
    {
      selected_method_passed: 'WMO supplies quantitative global atmospheric burden, WHO-threshold exposure, a repeated comparison period and broad geographic reach, satisfying all impact-fallback components.',
      higher_priority_failures: ['No complete global event-frequency observation supplies current magnitude plus threshold or momentum with at least 60% current-component coverage.']
    }
  ),
  make(
    'ozone_formation_pressure',
    ozone.observation_end_year,
    {
      biophysical_burden: n(ozone.average_free_troposphere_trend_ppb_per_decade, [0, 0.5, 1.5, 3]),
      human_economic_burden: n(ozone.attributable_dalys_2015_million, [0, 0.5, 2, 5]),
      persistence: n(ozone.observation_end_year - ozone.observation_start_year + 1, [0, 5, 15, 30]),
      extent: ozone.global_extent
    },
    ozone,
    ['noaa_global_tropospheric_ozone_trends_1990_2017', 'iarc_gbd_ambient_air_pollution_2015'],
    'The observation component is a monitored-site average with regional heterogeneity, while the health component is modeled ozone-attributable COPD burden. Neither is relabeled as a direct global precursor-emission measurement.',
    {
      selected_method_passed: 'Global monitoring quantifies a multi-decadal tropospheric ozone trend and comparative-risk assessment quantifies accumulated health burden, persistence and extent.',
      higher_priority_failures: ['The retained observation ends in 2017 and does not meet the project freshness gate for a current-data score.']
    }
  )
];

const registry = {
  version: '1.0.0',
  method_version: 'tulip_urgency_v2',
  campaign: 'accumulated_evidence_wave_42_global_atmospheric_hazards',
  generated_at: new Date().toISOString(),
  source_snapshots: [SNAPSHOT_PATH],
  promoted_node_count: receipts.length,
  receipts
};

await fs.writeFile(
  path.join(ROOT, 'public/tulip-accumulated-evidence-wave-42.json'),
  `${JSON.stringify(registry, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/tulip-accumulated-evidence-wave-42.json',
  promoted_node_count: receipts.length,
  receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method }))
}, null, 2));
