let relationshipDetailsPromise = null;

function buildRelationshipDetailMap(payload) {
  const relationships = Array.isArray(payload?.relationships) ? payload.relationships : [];
  return new Map(relationships.map(detail => [
    `${detail.source_id}->${detail.target_id}`,
    detail
  ]));
}

export function loadRelationshipDetails(fetchImpl = globalThis.fetch) {
  if (relationshipDetailsPromise) return relationshipDetailsPromise;
  if (typeof fetchImpl !== 'function') return Promise.reject(new Error('Relationship detail fetch is unavailable'));

  relationshipDetailsPromise = fetchImpl('/relationship-descriptions.json')
    .then(response => {
      if (!response.ok) throw new Error(`Relationship detail request failed with ${response.status}`);
      return response.json();
    })
    .then(buildRelationshipDetailMap)
    .catch(error => {
      relationshipDetailsPromise = null;
      throw error;
    });

  return relationshipDetailsPromise;
}

export async function getRelationshipDetail(edgeKey, fetchImpl = globalThis.fetch) {
  if (!edgeKey) return null;
  const details = await loadRelationshipDetails(fetchImpl);
  return details.get(edgeKey) || null;
}

export function resetRelationshipDetailsForTests() {
  relationshipDetailsPromise = null;
}
