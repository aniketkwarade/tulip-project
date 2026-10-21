import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const payload = JSON.parse(await readFile(
  new URL('../artifacts/tulip-calibration-2026-09-22/staple-food-price-volatility-reference-snapshot.json', import.meta.url),
  'utf8',
));

assert.equal(payload.version, 'tulip_staple_food_price_volatility_2026_09_24_v1');
assert.equal(payload.productionRatingsEnabled, 0);
assert.equal(payload.nodeId, 'staple_food_price_volatility');
assert.equal(payload.source.pdfSha256, 'e951247b1884aaddc983e2d1553b4754b10c852538613b3af99e82e3ac3d3c66');
assert.equal(payload.source.doi, '10.4060/cd6008en');
assert.equal(payload.evidence.foodInsecurityAssociation.foodPriceIncreasePercent, 10);
assert.equal(payload.evidence.foodInsecurityAssociation.moderateOrSevereFoodInsecurityIncreasePercent, 3.5);
assert.equal(payload.evidence.foodInsecurityAssociation.severeFoodInsecurityIncreasePercent, 1.8);
assert.deepEqual(payload.evidence.childWastingAssociation.wastingPrevalenceIncreasePercentRange, { lower: 2.7, upper: 4.3 });
assert.deepEqual(payload.evidence.childWastingAssociation.severeWastingPrevalenceIncreasePercentRange, { lower: 4.8, upper: 6.1 });
assert.equal(payload.evidence.childWastingAssociation.approximateCountries, 150);
assert.equal(payload.evidence.recentInflationContextExcludedFromReach.populationLivingInThoseIncomeGroupsLowerBound, 1_500_000_000);
assert.equal(payload.evidence.causalLimits.attributableCaseCountPublished, false);
assert.equal(payload.evidence.causalLimits.consequenceDurationPublished, false);
assert.equal(payload.evidence.causalLimits.stapleOnlyPriceMetricPublished, false);

const { candidate } = payload.ratingDecision;
assert.deepEqual(candidate.previous, { value: 4.8, grade: 'C', lower: 2.5, upper: 7, confidence: 'B' });
assert.deepEqual(candidate.revised, { value: 4.8, grade: 'C', lower: 4, upper: 7.8, confidence: 'B' });
assert.deepEqual(candidate.axes.human.severity, { lower: 2, central: 2, upper: 3 });
assert.deepEqual(candidate.axes.human.reach, { lower: 1, central: 1, upper: 3 });
assert.deepEqual(candidate.axes.human.persistence, { lower: 1, central: 2, upper: 3 });
assert(payload.ratingDecision.excludedUses.some(item => /1\.5 billion/i.test(item)));
assert(payload.ratingDecision.excludedUses.some(item => /1983–2023 model period/i.test(item)));
assert(payload.ratingDecision.exactRemainingGaps.some(item => /deduplicated count/i.test(item)));
assert.equal(payload.digest.length, 64);

console.log('Staple-food price-volatility reference passed: direct nutrition outcomes narrow severity while exposed populations remain separate from harmed-person reach.');
