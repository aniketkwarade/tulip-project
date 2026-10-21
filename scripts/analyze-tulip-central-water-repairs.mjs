import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { NODE_METRIC_CONTRACTS } from '../src/northstar-contracts.js';
import { auditAnnualWaterScarcity } from '../src/tulip-water-scarcity-source-audit.js';

const root = new URL('../', import.meta.url);
const out = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/', import.meta.url);
const file = path => {
  const bytes = readFileSync(new URL(path, root));
  return { path, sha256: createHash('sha256').update(bytes).digest('hex'), data: JSON.parse(bytes) };
};
const publicScores = file('public/tulip-assessments.json');
const glacier = file('public/wmo-unesco-glacier-water-impact-snapshot.json');
const surface = file('public/unep-unwater-freshwater-impact-snapshot.json');
const regional = file('artifacts/tulip-consequence-rule-audit-2026-09-27/regional-meltwater-source-audit.json');
const sourceRegistry = file('public/tulip-source-registry.json');
const source = sourceRegistry.data.sources.find(item => item.id === glacier.data.source.id);
const contract = NODE_METRIC_CONTRACTS.glacier_meltwater_dependency;
assert.equal(contract.source_id, source.id);
assert.equal(contract.contract_status, 'direct_metric_observation_missing');
assert.equal(contract.observation_status, 'reference_context_only');
assert(!source.platform_integration.measurement_ready_metric_ids.includes(contract.metric_id));
assert(source.platform_integration.reference_only_metric_ids.includes(contract.metric_id));
assert.equal(glacier.data.contract_bindings[0].supports_direct_metric, false);
assert.equal(regional.data.currentHarmQuantity, null);

const syntheticYear = (withdrawal, availability) => Array.from({ length: 12 }, (_, index) => ({
  month: index + 1, year: 2020, catchmentId: 'invented_method_counterexample',
  scenarioId: 'invented_diagnostic_only', unit: 'm3', withdrawal: withdrawal[index], availability: availability[index],
}));
const methodCounterexamples = [
  syntheticYear([20, ...Array(11).fill(1)], [1, ...Array(11).fill(10)]),
  syntheticYear([0, ...Array(11).fill(105)], [1, ...Array(11).fill(100)]),
].map(input => ({ input, result: auditAnnualWaterScarcity(input), interpretation: 'Invented volumes; not a source basin or evidence of actual population reclassification' }));

const records = [{
  nodeId: 'glacier_meltwater_dependency',
  publicValueUnchanged: publicScores.data.records.glacier_meltwater_dependency.value,
  decision: 'reject_dependence_mass_loss_and_avoided_scarcity_as_current_human_harm',
  sourceContext: {
    globalGlacierMassLossGt: glacier.data.assessment.global_glacier_mass_loss_gt,
    peopleDependingOnGlacierPlusSnowMeltLowerBound: glacier.data.assessment.people_relying_on_glacier_and_snow_melt_billion_lower_bound * 1e9,
    contextOnlyForRequestedRunoffShare: true,
    regionalModeledAvoidanceBenefit: regional.path,
    scopeMismatch: 'Combined snow/glacier regional historical benefit versus a global current glacier-related harm node',
  },
  repair: {
    central: null, lower: null, upper: null, zeroSubstitutionAllowed: false,
    outcomeRequired: 'Current glacier-change-attributable water-service loss, livelihood loss or health loss in a unique bounded cohort',
    quantity: null,
    remaining: ['Matching geography and current period', 'Glacier-only attribution and an explicit counterfactual',
      'Actual consequence magnitude and overlap-safe affected cohort', 'Approved conversion to fixed human benchmarks'],
  },
}, {
  nodeId: 'surface_water_storage_instability',
  publicValueUnchanged: publicScores.data.records.surface_water_storage_instability.value,
  decision: 'reject_basin_residents_basin_count_and_observation_span_as_consequence_magnitude',
  sourceContext: {
    residentsInRecedingWaterBasins: surface.data.assessment.people_in_receding_surface_water_basins_million * 1e6,
    recedingBasins: surface.data.assessment.surface_water_basins_with_receding_permanent_water,
    assessedBasins: surface.data.assessment.total_surface_water_basins_assessed,
    baseline: [surface.data.assessment.permanent_water_baseline_start_year, surface.data.assessment.permanent_water_baseline_end_year],
    observationPeriod: [surface.data.assessment.permanent_water_observation_start_year, surface.data.assessment.permanent_water_observation_end_year],
    humanInterpretation: 'Residents exposed to physical change, not a verified number experiencing shortage',
    natureInterpretation: 'Basin-count fraction, not area-weighted biological-condition loss',
  },
  repair: {
    central: null, lower: null, upper: null, zeroSubstitutionAllowed: false,
    outcomeRequired: 'Attributable human service/health consequences and ecosystem condition/function consequences with compatible geography, periods and references',
    quantity: null,
    remaining: ['Unique affected users and water-service or health-loss magnitude',
      'Climate/withdrawal/operations attribution or explicitly unresolved causes',
      'Named ecological outcome with a compatible fixed area reference', 'Approved human and nature conversions; no single-component reweighting'],
  },
}];
for (const record of records) {
  assert(Number.isFinite(record.publicValueUnchanged));
  assert.equal(record.repair.quantity, null);
  record.publicReady = false;
  record.wholeNodeAdmitted = false;
}
const report = {
  version: 'tulip_central_water_source_repairs_2026_09_27_v1',
  status: 'proxy_and_readiness_errors_corrected_consequence_evidence_unresolved',
  inputs: [publicScores, glacier, surface, regional, sourceRegistry].map(({ path, sha256 }) => ({ path, sha256 })),
  records, methodCounterexamples,
  methodDiscrepancy: regional.data.source.methodFindings,
  sourceDataReproduction: { annualRows: regional.data.sourceRowsReproduced,
    observedVariabilityNotConfidenceInterval: true, actualCatchmentReclassification: false },
  publicScoresChanged: false, numericalReplacementNodesAdmitted: 0,
};
writeFileSync(new URL('central-water-source-repairs.json', out), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: report.status, nodes: records.length,
  sourceSummaryRowsReproduced: report.sourceDataReproduction.annualRows,
  actualCatchmentReclassification: false, numericalReplacementNodesAdmitted: 0,
  publicScoresChanged: false }, null, 2));
