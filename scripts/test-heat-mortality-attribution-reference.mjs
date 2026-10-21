import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/heat-mortality-attribution-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.status, 'published_endpoint_algorithm_reproduced_on_authors_hypothetical_example');
assert.equal(snapshot.source.repositoryCommit, '5f719165ec26fa7c8913736af9ffc2067660d516');
assert.equal(snapshot.source.publishedCoverage.locations, 732);
assert.equal(snapshot.source.publishedCoverage.countries, 43);
assert.equal(snapshot.reproduction.inputs.cities, 10);
assert.equal(snapshot.reproduction.checkedFixture.sha256.length, 64);
assert.equal(snapshot.reproduction.runner.path, 'scripts/reproduce-vicedo-cabrera-ten-city.R');
assert.equal(snapshot.reproduction.runner.sha256.length, 64);
assert.match(snapshot.reproduction.runner.verification, /reproduced every total/i);
assert.equal(snapshot.reproduction.inputs.observed_daily_rows, 57_710);
assert.equal(snapshot.reproduction.inputs.factual_modelled_daily_rows, 1_028_250);
assert.equal(snapshot.reproduction.inputs.counterfactual_modelled_daily_rows, 1_020_950);
assert.equal(snapshot.reproduction.monteCarloIterations, 1000);
assert.equal(snapshot.reproduction.climateModels.length, 10);
assert.equal(snapshot.reproduction.cities.length, 10);
assert.equal(snapshot.reproduction.cityIntervalsCrossingZero.length, 7);
assert(Math.abs(snapshot.reproduction.total.anthropogenic_heat_deaths - 155_714.7000768875) < 1e-6);
assert(Math.abs(snapshot.reproduction.total.anthropogenic_share_of_heat_deaths_percent - 32.838030339318394) < 1e-9);
assert(snapshot.reproduction.total.anthropogenic_heat_deaths_ci_low > 0);
assert(snapshot.reproduction.total.anthropogenic_heat_deaths_ci_high > snapshot.reproduction.total.anthropogenic_heat_deaths);
assert.equal(snapshot.carbonMajorsReference.observedScope.heatwavesAnalysed, 213);
assert.equal(snapshot.carbonMajorsReference.observedScope.emitters, 180);
assert.equal(snapshot.carbonMajorsReference.codeArchive.sha256, '9b6071d7354afde4f1d5a0a4422b9740f1c5959ce8a03b9d3291e8e3f212050d');
assert(snapshot.carbonMajorsReference.synthesisArchive.bytes > 18_000_000_000);
assert.match(snapshot.carbonMajorsReference.inferenceBoundary, /cannot be multiplied by deaths or ecosystem loss/i);
assert.match(snapshot.tulipUse.rejectedShortcut, /!= total heat deaths × emissions share/i);
assert(snapshot.tulipUse.prohibited.some(rule => /ten-city 32\.838% result/i.test(rule)));
assert(snapshot.tulipUse.prohibited.some(rule => /negative lower confidence limits/i.test(rule)));
assert.equal(snapshot.snapshotDigest.length, 64);

console.log('Heat-mortality attribution reference passed: the published endpoint algorithm is reproduced on the authors’ hypothetical example, while source-specific shortcuts remain prohibited.');
