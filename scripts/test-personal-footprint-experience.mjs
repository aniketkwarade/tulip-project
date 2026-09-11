import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import {
  buildPersonalFootprintSummary,
  getPersonalFootprintInsights,
  getPersonalFootprintOpportunities,
  getPersonalFootprintProgress
} from '../src/personal-footprint-experience.js';
import {
  PERSONAL_FOOTPRINT_BASELINE_SELECTIONS,
  PERSONAL_FOOTPRINT_QUESTIONS
} from '../src/personal-footprint-model.js';

const appSource = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
assert.match(appSource, /Five actions for you/, 'The web results view should include the personalized five-action section');
assert.match(appSource, /getPersonalFootprintInsights\(personalFootprintState, 5\)/);

const emptyProgress = getPersonalFootprintProgress({});
assert.equal(emptyProgress.answered, 0);
assert.equal(emptyProgress.total, 11);
assert.equal(emptyProgress.complete, false);
assert.equal(emptyProgress.nextQuestion.key, 'geography');

const highImpactState = {
  ...PERSONAL_FOOTPRINT_BASELINE_SELECTIONS,
  everyday_travel: 'multiple_cars',
  flights: 'very_frequent',
  diet: 'meat_heavy',
  new_clothes: 'frequent',
  other_stuff: 'heavy'
};
const completeProgress = getPersonalFootprintProgress(highImpactState);
assert.equal(completeProgress.complete, true);
assert.equal(completeProgress.percent, 100);

const opportunities = getPersonalFootprintOpportunities(highImpactState);
assert.equal(opportunities.length, 2);
assert(opportunities.every(item => item.carbonReduction > 0));
assert(opportunities.some(item => item.questionKey === 'flights'));

const summary = buildPersonalFootprintSummary(highImpactState);
assert.match(summary, /Carbon:/);
assert.match(summary, /Biggest opportunities:/);

const guidedQuestions = PERSONAL_FOOTPRINT_QUESTIONS.filter(question => question.insight);
assert.equal(guidedQuestions.length, 7, 'Only behaviorally actionable categories should carry insight guidance');

for (const [profileName, profile] of Object.entries({
  baseline: { ...PERSONAL_FOOTPRINT_BASELINE_SELECTIONS },
  highImpact: {
    ...highImpactState,
    home_energy: 'very_high_area',
    food_waste: 'high'
  },
  lowImpact: {
    ...PERSONAL_FOOTPRINT_BASELINE_SELECTIONS,
    geography: 'clean_transit',
    hvac: 'rarely',
    household_size: 'five_plus',
    home_type: 'small_apt',
    home_energy: 'lower_area',
    everyday_travel: 'walk_transit',
    flights: 'rare',
    diet: 'vegan',
    food_waste: 'very_low',
    new_clothes: 'rare',
    other_stuff: 'rare'
  }
})) {
  const insights = getPersonalFootprintInsights(profile);
  assert.equal(insights.length, 5, `${profileName} profile should receive exactly five insights`);
  assert.equal(new Set(insights.map(item => item.questionKey)).size, 5, `${profileName} insights must not repeat categories`);
  assert(insights.every(item => item.title && item.action && item.rationale), `${profileName} insights must contain actionable copy and rationale`);
  assert(insights.every(item => item.rationale.includes(item.currentLabel)), `${profileName} insights must cite the answer that personalized them`);
}

const highImpactInsights = getPersonalFootprintInsights({
  ...highImpactState,
  home_energy: 'very_high_area',
  food_waste: 'high'
});
assert(highImpactInsights.every(item => !item.isMaintenance), 'High-impact profile should receive five reduction actions');
assert(highImpactInsights.some(item => item.questionKey === 'flights'), 'High-impact flying should be surfaced');

const lowImpactInsights = getPersonalFootprintInsights({
  ...PERSONAL_FOOTPRINT_BASELINE_SELECTIONS,
  geography: 'clean_transit',
  hvac: 'rarely',
  household_size: 'five_plus',
  home_type: 'small_apt',
  home_energy: 'lower_area',
  everyday_travel: 'walk_transit',
  flights: 'rare',
  diet: 'vegan',
  food_waste: 'very_low',
  new_clothes: 'rare',
  other_stuff: 'rare'
});
assert(lowImpactInsights.every(item => item.isMaintenance), 'Low-impact profile should receive relevant maintenance actions instead of impossible reductions');

console.log('Personal footprint experience tests passed.');
