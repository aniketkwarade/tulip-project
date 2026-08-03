import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { buildTulipUrgencyReceipt, normalizeWithAnchors, verifyTulipUrgencyReceipt } from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SNAPSHOT_PATH = 'public/ghsl-country-urbanization-snapshot.json';
const snapshot = JSON.parse(await fs.readFile(path.join(ROOT, SNAPSHOT_PATH), 'utf8'));
const sum = key => snapshot.records.reduce((total, row) => total + Number(row[key] || 0), 0);
const round = (value, digits = 6) => Number(value.toFixed(digits));
const built2015 = sum('built_up_surface_2015_km2');
const built2020 = sum('built_up_surface_2020_km2');
const pop2015 = sum('urban_population_2015');
const pop2020 = sum('urban_population_2020');
const builtGrowthPct = ((built2020 / built2015) - 1) * 100;
const populationGrowthPct = ((pop2020 / pop2015) - 1) * 100;
const landConsumptionToPopulationGrowthRatio = builtGrowthPct / populationGrowthPct;
const perResident2015 = built2015 * 1_000_000 / pop2015;
const perResident2020 = built2020 * 1_000_000 / pop2020;
const perResidentChangePct = ((perResident2020 / perResident2015) - 1) * 100;
const annualizedPerResidentChangePct = (Math.pow(perResident2020 / perResident2015, 1 / 5) - 1) * 100;

const receipt = buildTulipUrgencyReceipt({
  node_id: 'urban_sprawl_housing',
  method: 'current_data',
  as_of: '2020',
  components: {
    magnitude: round(normalizeWithAnchors(perResidentChangePct, [0, 1, 3, 8], 'higher_is_worse')),
    threshold: round(normalizeWithAnchors(landConsumptionToPopulationGrowthRatio, [1, 1.1, 1.5, 2], 'higher_is_worse')),
    momentum: round(normalizeWithAnchors(annualizedPerResidentChangePct, [0, 0.25, 0.5, 1], 'higher_is_worse')),
    extent: 1
  },
  raw_inputs: {
    magnitude: { global_built_up_surface_2015_km2: round(built2015, 3), global_built_up_surface_2020_km2: round(built2020, 3), global_urban_population_2015: round(pop2015, 0), global_urban_population_2020: round(pop2020, 0), built_up_area_per_urban_resident_2015_m2: round(perResident2015), built_up_area_per_urban_resident_2020_m2: round(perResident2020), per_resident_change_pct: round(perResidentChangePct), anchors_pct: [0, 1, 3, 8] },
    threshold: { built_up_surface_growth_pct: round(builtGrowthPct), urban_population_growth_pct: round(populationGrowthPct), land_consumption_to_population_growth_ratio: round(landConsumptionToPopulationGrowthRatio), sdg_reference_ratio: 1, anchors_ratio: [1, 1.1, 1.5, 2], boundary: 'GHSL built-up surface growth divided by GHSL urban population growth; an analytical implementation of the SDG 11.3.1 direction, not an official UN country score.' },
    momentum: { annualized_global_built_up_area_per_resident_change_pct: round(annualizedPerResidentChangePct), period_years: 5, anchors_pct_per_year: [0, 0.25, 0.5, 1] },
    extent: { countries_or_territories: snapshot.records.length, settlement_classes: ['Urban Centre', 'Urban Cluster'], normalized_value: 1, boundary: 'Global sum across published GHSL country/territory records; no unweighted country averaging.' },
    source_snapshot: { path: SNAPSHOT_PATH, version: snapshot.version, captured_at: snapshot.captured_at, source_summary: snapshot.source_summary }
  },
  transformations: [
    { type: 'global_sum_before_ratio', formula: 'Sum GHSL built-up surface and urban population across all valid country/territory records for each epoch before calculating per-resident values.' },
    { type: 'sdg_directional_threshold', formula: 'Divide global built-up-surface percentage growth by global urban-population percentage growth; ratio above one means land consumption outpaces population.' },
    { type: 'five_year_annualization', formula: 'Annualize the change in globally aggregated built-up area per urban resident over exactly five years.' }
  ],
  source_ids: ['global_human_settlement_layer'],
  uncertainty: snapshot.uncertainty,
  freshness: `GHSL R2024A harmonized 2015-2020 historical epochs; snapshot captured ${snapshot.captured_at}.`,
  selection_reason: {
    selected_method_passed: 'GHSL supplies complete 2015 and 2020 built-up surface and urban population numerators for 230 country/territory records, a defensible summed global aggregation and an SDG-consistent land-versus-population threshold.',
    higher_priority_failures: []
  }
});
if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error('Receipt verification failed for urban_sprawl_housing.');
const registry = { version: '1.0.0', method_version: 'tulip_urgency_v2', campaign: 'current_evidence_wave_28_ghsl_global_urban_sprawl', generated_at: new Date().toISOString(), source_snapshot: SNAPSHOT_PATH, source_id: 'global_human_settlement_layer', promoted_node_count: 1, receipts: [receipt] };
await fs.writeFile(path.join(ROOT, 'public/tulip-current-evidence-wave-28.json'), `${JSON.stringify(registry, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/tulip-current-evidence-wave-28.json', receipt: { node_id: receipt.node_id, value: receipt.value, band: receipt.band, method: receipt.method } }, null, 2));
