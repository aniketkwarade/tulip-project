import {
  PERSONAL_FOOTPRINT_QUESTIONS,
  calculatePersonalFootprint,
  getPersonalFootprintOption
} from './personal-footprint-model.js';

const OPPORTUNITY_KEYS = new Set([
  'home_energy',
  'everyday_travel',
  'flights',
  'diet',
  'food_waste',
  'new_clothes',
  'other_stuff'
]);

export function getPersonalFootprintProgress(state = {}) {
  const total = PERSONAL_FOOTPRINT_QUESTIONS.length;
  const answered = PERSONAL_FOOTPRINT_QUESTIONS.filter(question => Boolean(state[question.key])).length;
  const nextQuestion = PERSONAL_FOOTPRINT_QUESTIONS.find(question => !state[question.key]) || null;
  return {
    answered,
    total,
    complete: answered === total,
    percent: total > 0 ? Math.round((answered / total) * 100) : 0,
    nextQuestion
  };
}

function positiveReduction(current, alternative) {
  return Math.max(0, current - alternative);
}

function opportunityValue(reductions) {
  return (
    reductions.carbonReduction
    + (reductions.materialReduction * 0.35)
    + (reductions.waterReduction / 1400)
    + (reductions.landReduction / 1900)
  );
}

function lowerImpactAlternatives(question, state, currentResult) {
  const selectedIndex = question.options.findIndex(option => option.value === state[question.key]);
  if (selectedIndex <= 0) return [];
  return question.options
    .slice(0, selectedIndex)
    .filter(option => !option.isUnsure)
    .map(option => {
      const alternativeResult = calculatePersonalFootprint({ ...state, [question.key]: option.value });
      const reductions = {
        carbonReduction: positiveReduction(currentResult.carbonTotal, alternativeResult.carbonTotal),
        waterReduction: positiveReduction(currentResult.waterTotalM3, alternativeResult.waterTotalM3),
        landReduction: positiveReduction(currentResult.landTotalM2, alternativeResult.landTotalM2),
        materialReduction: positiveReduction(currentResult.materialTotalTonnes, alternativeResult.materialTotalTonnes)
      };
      return { option, ...reductions, value: opportunityValue(reductions) };
    })
    .filter(item => item.value > 0);
}

export function getPersonalFootprintInsights(state = {}, limit = 5) {
  const currentResult = calculatePersonalFootprint(state);
  if (!currentResult.rankReady) return [];

  const currentCarbon = new Map(currentResult.breakdown.map(item => [item.key, item.carbon]));
  return PERSONAL_FOOTPRINT_QUESTIONS
    .filter(question => OPPORTUNITY_KEYS.has(question.key) && state[question.key] && question.insight)
    .map(question => {
      const currentOption = getPersonalFootprintOption(question.key, state[question.key]);
      const alternatives = lowerImpactAlternatives(question, state, currentResult);
      const nextStep = alternatives[alternatives.length - 1] || null;
      const isMaintenance = !nextStep;
      const carbonReduction = nextStep?.carbonReduction || 0;
      const rationale = isMaintenance
        ? `Based on “${currentOption?.label || 'your current answer'}”. You are already at the model’s lowest-impact option in this category; this action helps you hold that advantage.`
        : carbonReduction > 0
          ? `Based on “${currentOption?.label || 'your current answer'}”. Moving toward “${nextStep.option.label}” could lower this estimate by about ${carbonReduction.toFixed(1)} tCO2e/year.`
          : `Based on “${currentOption?.label || 'your current answer'}”. This next step lowers modeled resource demand even where the rounded carbon estimate is unchanged.`;

      return {
        id: question.key,
        questionKey: question.key,
        title: isMaintenance ? question.insight.maintainTitle : question.insight.title,
        action: isMaintenance ? question.insight.maintainAction : question.insight.action,
        rationale,
        currentLabel: currentOption?.label || 'Current answer',
        alternativeLabel: nextStep?.option.label || null,
        carbonReduction,
        value: nextStep?.value || 0,
        currentCarbon: currentCarbon.get(question.key) || 0,
        isMaintenance
      };
    })
    .sort((left, right) => (
      Number(left.isMaintenance) - Number(right.isMaintenance)
      || right.value - left.value
      || right.currentCarbon - left.currentCarbon
      || left.questionKey.localeCompare(right.questionKey)
    ))
    .slice(0, Math.max(0, limit));
}

export function getPersonalFootprintOpportunities(state = {}, limit = 2) {
  const currentResult = calculatePersonalFootprint(state);
  if (!currentResult.rankReady) return [];

  return PERSONAL_FOOTPRINT_QUESTIONS
    .filter(question => OPPORTUNITY_KEYS.has(question.key) && state[question.key])
    .map(question => {
      const currentOption = getPersonalFootprintOption(question.key, state[question.key]);
      const alternatives = question.options
        .filter(option => option.value !== state[question.key] && !option.isUnsure)
        .map(option => {
          const alternativeResult = calculatePersonalFootprint({ ...state, [question.key]: option.value });
          return {
            option,
            carbonReduction: positiveReduction(currentResult.carbonTotal, alternativeResult.carbonTotal),
            waterReduction: positiveReduction(currentResult.waterTotalM3, alternativeResult.waterTotalM3),
            landReduction: positiveReduction(currentResult.landTotalM2, alternativeResult.landTotalM2),
            materialReduction: positiveReduction(currentResult.materialTotalTonnes, alternativeResult.materialTotalTonnes)
          };
        })
        .sort((left, right) => (
          right.carbonReduction - left.carbonReduction
          || right.materialReduction - left.materialReduction
          || right.waterReduction - left.waterReduction
          || right.landReduction - left.landReduction
        ));
      const best = alternatives[0];
      if (!best) return null;
      const value = opportunityValue(best);
      if (value <= 0) return null;
      return {
        questionKey: question.key,
        questionTitle: question.title,
        currentLabel: currentOption?.label || 'Current answer',
        alternativeLabel: best.option.label,
        carbonReduction: best.carbonReduction,
        waterReduction: best.waterReduction,
        landReduction: best.landReduction,
        materialReduction: best.materialReduction,
        value
      };
    })
    .filter(Boolean)
    .sort((left, right) => right.value - left.value)
    .slice(0, Math.max(0, limit));
}

export function buildPersonalFootprintSummary(state = {}) {
  const result = calculatePersonalFootprint(state);
  const opportunities = getPersonalFootprintOpportunities(state);
  const lines = [
    'TULIP — My Footprint summary',
    '',
    `Carbon: ${result.carbonTotal.toFixed(1)} tCO2e/year`,
    `Water: ${result.waterTotalM3.toLocaleString('en-US')} m³/year`,
    `Land: ${result.landTotalM2.toLocaleString('en-US')} m²·year`,
    `Materials: ${result.materialTotalTonnes.toFixed(1)} t RME/year`,
    `Confidence: ${result.confidence}`
  ];
  if (opportunities.length) {
    lines.push('', 'Biggest opportunities:');
    opportunities.forEach((item, index) => {
      lines.push(`${index + 1}. ${item.alternativeLabel} — up to ${item.carbonReduction.toFixed(1)} tCO2e/year lower than your current answer.`);
    });
  }
  lines.push('', 'This is a benchmark-calibrated estimate, not a measured inventory.');
  return lines.join('\n');
}
