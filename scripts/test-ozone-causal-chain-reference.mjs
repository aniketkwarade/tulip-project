import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/ozone-causal-chain-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_ozone_causal_chain_2026_09_24_v2');
assert.equal(payload.status, 'independent_causal_model_stress_test_completed_current_terminal_endpoint_still_missing');
assert.equal(payload.productionRatingsEnabled, 0);
assert.deepEqual(payload.nodeIds, ['cfc_saturated_layers', 'stratospheric_chlorine_sinks']);
assert.equal(payload.sources.odgi.sha256, 'cdedfdf8f758fe01321181590e793747a8a692f23ca76b49365e13d4846a23fa');
assert.equal(payload.sources.ozoneBulletin.sha256, '0edd16b384bf858352f5cd29edae85c5f38014a8d42377d691c5d27470065f67');
assert.equal(payload.sources.environmentalEffects.sha256, '27e0c462918f1b2650833afd7b1d1c33b87b0759cf4ddab8bb0e8e0a3957aa2e');
assert.equal(payload.sources.terrestrialCarbonModel.repositoryReadmeMd5, 'f5cad5cb7e5fccefcf79645ee452b995');
assert.equal(payload.sources.terrestrialCarbonModel.repositoryReadmeSha256, '78da014b542979d1c41c35fd3802ce25527856e5501d7be47596eaa1cfdf8ab4');
assert.equal(payload.sources.montrealProtocolBenefits.doi, '10.1038/ncomms8233');
assert.equal(payload.sources.antarcticBiotaReview.doi, '10.1111/gcb.17283');
assert.equal(payload.sources.antarcticOzoneTrends.sha256, 'fc5a7dcfa234d70268431d619a5e264bd6739da15d50e970ca503c21607795b6');
assert.equal(payload.currentState.ozoneDepletingSubstanceBurden.antarcticOdgi, 71.6);
assert.equal(payload.currentState.ozoneDepletingSubstanceBurden.midLatitudeOdgi, 45.3);
assert.equal(payload.currentState.ozoneColumn.antarcticMaximumOzoneMassDeficitMillionTonnes, 46.1);
assert.equal(payload.currentState.environmentalEffects.currentGlobalCollapseEquivalentConditionLossPercent, null);
assert.equal(payload.currentState.environmentalEffects.currentAffectedEcosystemDistributionPercent, null);
assert.equal(payload.currentState.environmentalEffects.commonRecoveryTimeDistribution, null);
assert.equal(payload.independentCausalModelStressTest.atmosphericAttribution.brewerDobsonCirculationPeakContributionToOctoberVariationPercent, 51);
assert.equal(payload.independentCausalModelStressTest.terrestrialCarbonModel.scenarios.worldAvoidedThreePercentAnnualCfcGrowth, 'refc1_wavd');
assert.equal(payload.independentCausalModelStressTest.terrestrialCarbonModel.centralUvToNppSensitivity, '3% reduction in net primary productivity per 10% increase in UV');
assert.equal(payload.independentCausalModelStressTest.currentAntarcticBiotaEvidence.reportedUvIndexUpperContext, 14);
assert.equal(payload.independentCausalModelStressTest.currentAntarcticBiotaEvidence.modernFieldEndpointAvailable, false);
assert.equal(payload.independentCausalModelStressTest.decision.cfc_saturated_layers, 'score_unchanged_confidence_unchanged');
assert.equal(payload.independentCausalModelStressTest.decision.stratospheric_chlorine_sinks, 'score_unchanged_confidence_unchanged');

const cfc = payload.ratingDecisions.cfc_saturated_layers;
assert.deepEqual(cfc.previous, { value: 6.3, grade: 'C', lower: 4, upper: 8.5, confidence: 'B' });
assert.deepEqual(cfc.revised, { value: 3.3, grade: 'B', lower: 1.8, upper: 7, confidence: 'D' });
assert.deepEqual(cfc.axes.ecosystem.severity, { lower: 0, central: 1, upper: 2 });
assert.deepEqual(cfc.axes.ecosystem.reach, { lower: 1, central: 1, upper: 3 });
assert.deepEqual(cfc.axes.ecosystem.persistence, { lower: 0, central: 1, upper: 3 });
assert.match(cfc.certaintyAudit, /remain unchanged/i);

const ozone = payload.ratingDecisions.stratospheric_chlorine_sinks;
assert.deepEqual(ozone.previous, { value: 6.3, grade: 'C', lower: 4, upper: 8.5, confidence: 'B' });
assert.deepEqual(ozone.revised, { value: 4, grade: 'B', lower: 1.8, upper: 7, confidence: 'C' });
assert.deepEqual(ozone.axes.ecosystem.severity, { lower: 0, central: 1, upper: 2 });
assert.deepEqual(ozone.axes.ecosystem.reach, { lower: 1, central: 2, upper: 3 });
assert.deepEqual(ozone.axes.ecosystem.persistence, { lower: 0, central: 1, upper: 3 });
assert.match(ozone.certaintyAudit, /remain unchanged/i);
assert.match(payload.causalChainBoundary.rule, /cannot be added/i);
assert(payload.excludedUses.some(item => /ODGI.*ozone mass deficit.*ecosystem severity/i.test(item)));
assert(payload.excludedUses.some(item => /future world-avoided terrestrial-carbon result/i.test(item)));
assert(payload.excludedUses.some(item => /UV Index 14/i.test(item)));
assert(payload.exactRemainingGaps.some(item => /present-day source-removal model/i.test(item)));
assert(payload.exactRemainingGaps.some(item => /harmed numerator/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('Ozone causal-chain reference passed: independent models strengthen physical attribution, while future policy counterfactuals and exposure measures remain separate from unmeasured current terminal ecosystem harm.');
