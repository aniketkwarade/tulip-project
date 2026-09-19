let nodeDetailsPromise = null;

export function loadRuntimeNodeDetails(fetchImpl = globalThis.fetch) {
  if (nodeDetailsPromise) return nodeDetailsPromise;
  if (typeof fetchImpl !== 'function') return Promise.reject(new Error('Node detail fetch is unavailable'));

  nodeDetailsPromise = fetchImpl('/runtime-node-details.json')
    .then(response => {
      if (!response.ok) throw new Error(`Node detail request failed with ${response.status}`);
      return response.json();
    })
    .then(payload => new Map(
      (Array.isArray(payload?.nodes) ? payload.nodes : []).map(detail => [detail.id, detail])
    ))
    .catch(error => {
      nodeDetailsPromise = null;
      throw error;
    });

  return nodeDetailsPromise;
}

export async function hydrateRuntimeNodeDetails(nodes, fetchImpl = globalThis.fetch) {
  const detailsById = await loadRuntimeNodeDetails(fetchImpl);
  nodes.forEach(node => {
    const detail = detailsById.get(node.id);
    if (detail) Object.assign(node, detail);
  });
  return detailsById;
}

export function resetNodeDetailsForTests() {
  nodeDetailsPromise = null;
}
