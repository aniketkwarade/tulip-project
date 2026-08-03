import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildTulipUrgencyReceipt, normalizeWithAnchors, qualifiesForImpactFallback, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/global-freshwater-pressure-impact-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const n = (value, anchors) => Number(normalizeWithAnchors(value, anchors, 'higher_is_worse').toFixed(6));

function make(nodeId, asOf, components, rawInputs, sourceIds, boundary, higherPriorityFailure) {
  if (!qualifiesForImpactFallback({ quantitative_evidence: true, components })) throw new Error(`${nodeId}: impact gate failed`);
  const receipt = buildTulipUrgencyReceipt({
    node_id: nodeId,
    method: 'impact_fallback',
    as_of: String(asOf),
    components,
    raw_inputs: { ...rawInputs, evidence_boundary: boundary, source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at } },
    transformations: [
      { type: 'documented_anchor_normalization', formula: 'Normalize each source-native burden against declared four-point anchors and clamp to [0,1].' },
      { type: 'impact_composite', formula: '0.35B + 0.30H + 0.20P + 0.15E; convert to 1-10 with 1 + 9 × composite and round to one decimal.' },
      { type: 'water_accounting_boundary', formula: 'Keep storage, evaporation, withdrawal, depletion, generation and exposed-population measures separate; missing values never become zero.' }
    ],
    source_ids: sourceIds,
    uncertainty: `${snapshot.uncertainty} ${boundary}`,
    freshness: `Latest retained global assessment for this receipt through ${asOf}.`,
    selection_reason: { selected_method_passed: 'Quantitative global physical burden, human or economic burden, persistence and extent pass the accumulated-impact gate.', higher_priority_failures: [higherPriorityFailure] }
  });
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`${nodeId}: receipt verification failed`);
  return receipt;
}

const a = snapshot.assessments;
const receipts = [
  make('surface_water_evaporative_loss', a.surface_water_evaporation.observation_end_year,
    { biophysical_burden: n(a.surface_water_evaporation.annual_lake_evaporation_km3, [0, 250, 1000, 1750]), human_economic_burden: n(a.surface_water_evaporation.reservoir_evaporation_as_2010_municipal_withdrawal_pct, [0, 10, 40, 80]), persistence: n(a.surface_water_evaporation.observation_end_year - a.surface_water_evaporation.observation_start_year + 1, [0, 5, 20, 40]), extent: 1 },
    a.surface_water_evaporation, ['nature_global_lake_evaporation_1985_2018', 'journal_hydrology_global_reservoir_evaporation_1985_2016'],
    'The physical burden covers natural and artificial lakes; the municipal-withdrawal comparison applies only to estimated reservoir evaporation and is an equivalence, not water recoverable in every basin.',
    'The global observation ends in 2018 and does not meet the current-data freshness gate.'),
  make('reservoir_operating_shortfall', a.reservoir_operating_shortfall.assessment_year,
    { biophysical_burden: n(a.reservoir_operating_shortfall.historical_average_capacity_factor_pct - a.reservoir_operating_shortfall.recent_average_capacity_factor_pct, [0, 0.5, 1.5, 3]), human_economic_burden: n(a.reservoir_operating_shortfall.annual_generation_shortfall_twh, [0, 25, 100, 300]), persistence: n(10, [0, 2, 7, 15]), extent: 1 },
    a.reservoir_operating_shortfall, ['iea_electricity_market_update_2023_hydropower'],
    'The 240 TWh is the IEA global generation difference implied by lower hydropower capacity factors; it is not attributed entirely to reservoir operations or climate.',
    'The source reports multi-year averages rather than a complete fresh annual global operating series.'),
  make('reservoir_storage_instability', a.reservoir_storage.observation_end_year,
    { biophysical_burden: n(a.reservoir_storage.share_with_storage_decline_pct, [0, 10, 35, 60]), human_economic_burden: n(a.reservoir_storage.people_in_basin_of_drying_lake_billion, [0, 0.25, 1, 2.5]), persistence: n(a.reservoir_storage.observation_end_year - a.reservoir_storage.observation_start_year + 1, [0, 5, 20, 35]), extent: 1 },
    a.reservoir_storage, ['science_global_lake_storage_1992_2020', 'nature_diminishing_reservoir_storage_returns_2023'],
    'The 53% decline and two-billion-person exposure cover assessed large lakes and reservoirs; reservoir-specific decline and construction-driven capacity remain separate and are not netted together.',
    'The retained global satellite period ends in 2020 and does not pass the current-data freshness gate.'),
  make('aquifer_recharge_failure', a.groundwater_recharge_imbalance.observation_end_year,
    { biophysical_burden: n(a.groundwater_recharge_imbalance.groundwater_depletion_km3_per_year, [0, 50, 250, 650]), human_economic_burden: n(a.groundwater_recharge_imbalance.domestic_withdrawal_supplied_by_groundwater_pct, [0, 10, 30, 60]), persistence: n(a.groundwater_recharge_imbalance.observation_end_year - a.groundwater_recharge_imbalance.observation_start_year + 1, [0, 5, 15, 25]), extent: 1 },
    a.groundwater_recharge_imbalance, ['nature_global_groundwater_depletion_2002_2020', 'unesco_wwdr_groundwater_2022'],
    'Depletion quantifies the net withdrawal-recharge imbalance and cannot isolate recharge failure from pumping; the receipt therefore remains an accumulated-impact fallback.',
    'No fresh global recharge-only series supplies current magnitude plus threshold or momentum.'),
  make('surface_water_withdrawal_pressure', a.surface_water_withdrawal.assessment_year,
    { biophysical_burden: n(a.surface_water_withdrawal.calculated_surface_water_withdrawal_km3_per_year, [0, 500, 2000, 4000]), human_economic_burden: n(a.surface_water_withdrawal.global_population_experiencing_severe_water_scarcity_part_year_pct, [0, 10, 30, 60]), persistence: n(a.surface_water_withdrawal.persistence_years, [0, 5, 20, 50]), extent: 1 },
    a.surface_water_withdrawal, ['un_water_analytical_brief_2024', 'ipcc_ar6_synthesis_summary_for_policymakers'],
    'Surface-water withdrawal is calculated from the source-reported total and surface-water share. Severe-scarcity exposure has multiple climatic and non-climatic drivers and is not attributed solely to withdrawals.',
    'The assessment does not provide a complete fresh annual surface-withdrawal history with recognized thresholds or sufficient historical-percentile observations.')
];

const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'accumulated_evidence_wave_44_global_freshwater_pressure', generated_at: new Date().toISOString(), source_snapshots: [SNAPSHOT_PATH], promoted_node_count: receipts.length, receipts };
await fs.writeFile(path.join(ROOT, 'public/tulip-accumulated-evidence-wave-44.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-accumulated-evidence-wave-44.json', promoted_node_count: receipts.length, receipts: receipts.map(({ node_id, value, band, method }) => ({ node_id, value, band, method })) }, null, 2));
