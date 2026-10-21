// Reader presentation only. The assessment remains the authority for all values.
function describeOutcome(text) {
  if (!text) return 'The assessed impact has not been described yet.';
  const copy = text
    .replace(/^(Current|Present)\s+/i, '')
    .replace(/\bclimate-attributable\b/g, 'climate-related')
    .replace(/\battributable to\b/g, 'linked to')
    .replace(/\ballocated to\b/g, 'attributed to')
    .replace(/\bhealth and (?:essential-)?function loss(?:es)?\b/g, 'harm to health and daily life')
    .replace(/\bessential-function loss(?:es)?\b/g, 'disruption to daily life')
    .replace(/\bloss of habitat condition\b/g, 'habitat damage')
    .replace(/\bhabitat condition (?:loss|deficits?)\b/g, 'habitat damage')
    .replace(/\bcondition deficit of\b/g, 'damage to')
    .replace(/\bcondition deficits?\b/g, 'damage')
    .replace(/\bcondition loss\b/g, 'damage')
    .replace(/\briparian\b/g, 'riverbank')
    .replace(/\bhydrologic\b/g, 'water-system');
  return copy.charAt(0).toUpperCase() + copy.slice(1).replace(/[.\s]+$/, '') + '.';
}

export function buildTulipScoreBreakdown(topic, assessment) {
  const human = assessment?.components?.human;
  const nature = assessment?.components?.ecosystem;
  const humanValue = human?.baseValue;
  const natureValue = nature?.adjustedValue;
  const scored = assessment?.nodeKind !== 'response'
    && [assessment?.value, humanValue, natureValue].every(Number.isFinite);
  if (!scored) {
    return {
      topic,
      summary: assessment?.explanation || `A current-impact score for ${topic} is not available yet.`,
      components: [], formula: null, note: null,
    };
  }
  const humanDisplay = humanValue.toFixed(2);
  const natureDisplay = natureValue.toFixed(2);
  return {
    topic,
    summary: 'Human and nature impacts count equally. Each is scored out of 10.',
    components: [
      { id: 'human', label: 'Human impact', weight: '50%', value: humanDisplay,
        explanation: describeOutcome(human.outcomeDefinition) },
      { id: 'nature', label: 'Nature impact', weight: '50%', value: natureDisplay,
        explanation: describeOutcome(nature.outcomeDefinition)
          + (nature.priorityBonus > 0
            ? ` Includes ${nature.priorityBonus.toFixed(2)} extra points for permanent loss of rare nature.` : '') },
    ],
    formula: `(${humanDisplay} × 50%) + (${natureDisplay} × 50%) ≈ ${assessment.value.toFixed(1)}`,
    note: 'Estimated current impact. Higher means more harm. Values are rounded.',
  };
}
