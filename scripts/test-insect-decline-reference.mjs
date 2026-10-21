import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const snapshot = JSON.parse(await readFile(new URL('../artifacts/tulip-calibration-2026-09-22/insect-decline-reference-snapshot.json', import.meta.url), 'utf8'));

assert.equal(snapshot.productionRatingsEnabled, 0);
assert.equal(snapshot.nodeId, 'insect_biomass_decline');
assert.equal(snapshot.sources.length, 3);
const abundance = snapshot.sources.find(source => source.id === 'van_klink_terrestrial_insect_abundance_synthesis_2024');
const biomass = snapshot.sources.find(source => source.id === 'muehlethaler_german_flying_insect_biomass_2024');
const challenge = snapshot.sources.find(source => source.id === 'hallmann_insect_biomass_methodological_challenge_2025');
assert(abundance && biomass && challenge);
assert.match(abundance.metric, /abundance, not biomass/i);
assert.equal(abundance.facts.biomassOnlyDatasetsExcluded, true);
assert.equal(abundance.facts.annualAbundanceTrendPct.central, -1.49);
assert.equal(abundance.facts.studiesFromEuropeOrNorthAmericaPct.abundance, 69);
assert.equal(biomass.facts.selectedNatureReserves, 21);
assert.equal(biomass.facts.twoWeekSamples, 1621);
assert.equal(biomass.facts.globalRepresentativeness, false);
assert.equal(challenge.facts.role, 'uncertainty and attribution review, not a new global severity or reach denominator');
assert.deepEqual(snapshot.tulipUse.proposedAxes.applicableDomains, ['ecosystem']);
assert.deepEqual(snapshot.tulipUse.proposedAxes.ecosystem.severity, { lower: 2, central: 3, upper: 4 });
assert.deepEqual(snapshot.tulipUse.proposedAxes.ecosystem.reach, { lower: 1, central: 2, upper: 3 });
assert.deepEqual(snapshot.tulipUse.proposedAxes.ecosystem.persistence, { lower: 2, central: 3, upper: 4 });
assert.match(snapshot.tulipUse.excluded.join(' '), /Do not describe the -1\.49% annual abundance trend as a global insect-biomass trend/i);
assert.match(snapshot.tulipUse.excluded.join(' '), /Do not use 9–64 years of observation as consequence persistence/i);
assert.match(snapshot.evidenceSynthesis.humanBoundary, /downstream relationship evidence/i);

console.log('Insect decline reference passed: abundance, biomass, geography, record length and attribution remain separate.');
