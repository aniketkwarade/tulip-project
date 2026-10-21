import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createFixedBenchmarkScoreExperiment } from '../src/tulip-benchmark-score-experiment.js';
import { benchmarkCalibrationFixtures } from './lib/tulip-benchmark-calibration-fixtures.mjs';

const fixture = benchmarkCalibrationFixtures();
const engine = createFixedBenchmarkScoreExperiment(fixture);
const cases = [];
for (const human of [1, 3, 5, 7, 9, 10]) for (const ecosystem of [1, 3, 5, 7, 9, 10]) {
  const packet = structuredClone(fixture.packet);
  packet.components.human.observationId = `human_${human}`;
  packet.components.ecosystem.observationId = `ecosystem_${ecosystem}`;
  cases.push({ id: `synthetic_anchor_${human}_${ecosystem}`, interpretation: 'synthetic_mechanics_only',
    packet, result: engine.calculate(packet) });
}
const rounding = structuredClone(fixture.packet);
rounding.components.human.observationId = 'human_rounding_case';
rounding.components.ecosystem.observationId = 'ecosystem_rounding_case';
cases.push({ id: 'synthetic_rounding_counterexample', interpretation: 'synthetic_mechanics_only',
  packet: rounding, result: engine.calculate(rounding) });
cases.push({ id: 'who_joint_air_health_endpoint_only', interpretation: 'real_health_endpoint_not_complete_node',
  packet: fixture.whoPacket, result: engine.calculate(fixture.whoPacket) });
const missing = structuredClone(fixture.packet);
delete missing.components.ecosystem;
cases.push({ id: 'missing_ecosystem_not_reweighted', interpretation: 'synthetic_rejection_case',
  packet: missing, result: engine.calculate(missing) });
const broad = { ...fixture.whoPacket, nodeId: 'air_pollution_health_burden' };
cases.push({ id: 'health_endpoint_cannot_admit_full_air_node', interpretation: 'whole_node_scope_rejection',
  packet: broad, result: engine.calculate(broad) });
assert(cases.every(item => item.result.publicReady === false && item.result.value === null));
const report = {
  version: 'tulip_benchmark_score_kernel_report_2026_09_27_v2',
  scope: 'Mapping and combination mechanics; no nature calibration or whole-node admission',
  policy: engine.describePolicy(), observations: fixture.observations, exclusions: fixture.exclusions,
  cases,
  policySensitivity: [0.3, 0.5, 0.7].map(humanWeight => ({
    interpretation: 'declared_weight_sensitivity_not_evidence_uncertainty', humanWeight,
    human9Nature1: humanWeight * 9 + (1 - humanWeight),
    human1Nature9: humanWeight + (1 - humanWeight) * 9,
  })),
  numericalWholeNodeAdmissions: 0, publicScoresChanged: false,
};
const outDir = resolve('artifacts/tulip-consequence-rule-audit-2026-09-27');
mkdirSync(outDir, { recursive: true });
writeFileSync(resolve(outDir, 'benchmark-score-kernel-report.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: 'generated', cases: cases.length,
  numericalWholeNodeAdmissions: report.numericalWholeNodeAdmissions, publicScoresChanged: false }, null, 2));
