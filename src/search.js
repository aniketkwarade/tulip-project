const CURATED_NODE_ALIASES = Object.freeze({
  temp: [
    'global warming',
    'climate change',
    'warming planet',
    'rising global temperatures',
    'why is earth getting hotter',
    'why is the planet getting hotter'
  ],
  carbon_emission: [
    'carbon emissions',
    'co2 emissions',
    'carbon dioxide pollution',
    'greenhouse gas emissions',
    'fossil fuel pollution'
  ],
  methane: ['methane emissions', 'natural gas leaks', 'short lived climate pollutant'],
  sea_level_rise: ['rising seas', 'coastal flooding', 'ocean levels rising'],
  wildfire_regime_shift: ['wildfires', 'forest fires', 'fire seasons getting worse'],
  water_stress: ['water scarcity', 'water shortage', 'drought water supply'],
  food_insecurity: ['food security', 'hunger', 'climate and food shortages'],
  biodiversity_intactness_loss: ['biodiversity loss', 'nature loss', 'species decline'],
  ocean_acidification: ['ocean acidity', 'acidifying oceans', 'co2 in the ocean'],
  air_pollution_health_burden: ['air pollution', 'dirty air', 'smog health effects'],
  wet_bulb_heat: ['dangerous heat', 'heat and humidity', 'heat stress'],
  marine_heatwaves: ['ocean heatwave', 'hot oceans', 'marine heat wave']
});

const DEFAULT_RECOVERY_NODE_IDS = Object.freeze([
  'temp',
  'carbon_emission',
  'sea_level_rise',
  'air_pollution_health_burden'
]);

export function normalizeSearchText(value) {
  return String(value || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function levenshteinDistance(left, right) {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  const current = new Array(right.length + 1);

  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const substitutionCost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + substitutionCost
      );
    }
    for (let index = 0; index < current.length; index += 1) previous[index] = current[index];
  }

  return previous[right.length];
}

export function scoreSearchTerm(term, rawQuery) {
  const value = normalizeSearchText(term);
  const query = normalizeSearchText(rawQuery);
  if (!value || !query) return 0;
  if (value === query) return 120;
  if (value.startsWith(query)) return 105;

  const valueWords = value.split(' ');
  const queryWords = query.split(' ');
  if (queryWords.every(queryWord => valueWords.some(valueWord => valueWord.startsWith(queryWord)))) {
    return 92 + Math.min(queryWords.length, 5);
  }
  if (value.includes(query)) return 78;
  if (valueWords.some(word => word.startsWith(query))) return 70;

  const fullDistance = levenshteinDistance(value, query);
  const fullThreshold = Math.max(value.length, query.length) >= 16 ? 3 : 2;
  if (fullDistance <= fullThreshold) return 64 - fullDistance;

  if (queryWords.length === 1 && query.length >= 4) {
    const nearestWordDistance = Math.min(...valueWords.map(word => levenshteinDistance(word, query)));
    const wordThreshold = query.length >= 8 ? 2 : 1;
    if (nearestWordDistance <= wordThreshold) return 54 - nearestWordDistance;
  }

  return 0;
}

export function getNodeSearchTerms(node) {
  return [
    node?.name,
    node?.id?.replaceAll('_', ' '),
    ...(node?.semanticAliases || []).flatMap(alias => [alias?.name, alias?.id?.replaceAll('_', ' ')]),
    ...(node?.metricAliases || []).flatMap(alias => [alias?.name, alias?.metric_name]),
    ...(CURATED_NODE_ALIASES[node?.id] || [])
  ].filter(Boolean);
}

export function searchNodes(nodes, rawQuery, limit = 15) {
  const query = normalizeSearchText(rawQuery);
  if (!query) return [];

  return nodes
    .map((node, index) => {
      const rankedTerms = getNodeSearchTerms(node)
        .map(term => ({ term, score: scoreSearchTerm(term, query) }))
        .sort((left, right) => right.score - left.score);
      return { node, index, score: rankedTerms[0]?.score || 0, matchedTerm: rankedTerms[0]?.term || null };
    })
    .filter(result => result.score > 0)
    .sort((left, right) => (
      right.score - left.score
      || (right.node.tulipScore || 0) - (left.node.tulipScore || 0)
      || right.index - left.index
    ))
    .slice(0, limit);
}

export function getSearchRecoverySuggestions(nodes, limit = 4) {
  const nodesById = new Map(nodes.map(node => [node.id, node]));
  return DEFAULT_RECOVERY_NODE_IDS
    .map(nodeId => nodesById.get(nodeId))
    .filter(Boolean)
    .slice(0, limit);
}
