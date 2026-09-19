function getPhenomenonNodeIds(phenomenon) {
  return Array.isArray(phenomenon?.nodeIds) ? phenomenon.nodeIds : [];
}

function findPhenomenonForNodeId(phenomena, nodeId) {
  return phenomena.find(phenomenon => getPhenomenonNodeIds(phenomenon).includes(nodeId)) || null;
}

function buildAdjacency(edges, direction) {
  const adjacency = new Map();
  const add = (from, to, edge) => {
    if (!from || !to) return;
    if (!adjacency.has(from)) adjacency.set(from, []);
    adjacency.get(from).push({ nodeId: to, edge });
  };

  edges.forEach(edge => {
    if (!edge?.source || !edge?.target) return;
    if (direction === 'driver') add(edge.target, edge.source, edge);
    else if (direction === 'impact') add(edge.source, edge.target, edge);
    else {
      add(edge.source, edge.target, edge);
      add(edge.target, edge.source, edge);
    }
  });

  return adjacency;
}

function findNearestPhenomenon(
  phenomena,
  selectedNodeId,
  edges,
  relationship,
  preferredPhenomenonKey
) {
  const adjacency = buildAdjacency(edges, relationship);
  const visited = new Set([selectedNodeId]);
  let frontier = [{ nodeId: selectedNodeId, path: [], pathEdges: [] }];

  while (frontier.length) {
    const nextFrontier = [];
    const matches = [];

    frontier.forEach(entry => {
      (adjacency.get(entry.nodeId) || []).forEach(connection => {
        if (visited.has(connection.nodeId)) return;
        visited.add(connection.nodeId);
        const path = [...entry.path, connection.nodeId];
        const pathEdges = [...entry.pathEdges, connection.edge];
        const phenomenon = findPhenomenonForNodeId(phenomena, connection.nodeId);

        if (phenomenon) {
          matches.push({
            phenomenon,
            relationship,
            relatedNodeId: connection.nodeId,
            edge: pathEdges.length === 1 ? pathEdges[0] : null,
            distance: path.length,
            path,
            pathEdges
          });
        } else {
          nextFrontier.push({ nodeId: connection.nodeId, path, pathEdges });
        }
      });
    });

    if (matches.length) {
      return matches.find(match => match.phenomenon.key === preferredPhenomenonKey)
        || matches[0];
    }
    frontier = nextFrontier;
  }

  return null;
}

/**
 * Finds the nearest activity lens for a selected analysis topic.
 * Exact lenses win, followed by the nearest graph-connected activity lens.
 * Upstream activities win distance ties, while an editorial preference can
 * resolve cases where several lenses are equally close.
 */
export function findRelatedPhenomenon(
  phenomena,
  selectedNode,
  edges,
  { preferredPhenomenonKeyByNodeId = {} } = {}
) {
  if (!Array.isArray(phenomena) || !selectedNode?.id || !Array.isArray(edges)) return null;

  const exact = findPhenomenonForNodeId(phenomena, selectedNode.id);
  if (exact) {
    return {
      phenomenon: exact,
      relationship: 'exact',
      relatedNodeId: selectedNode.id,
      edge: null,
      distance: 0,
      path: [],
      pathEdges: []
    };
  }

  const preferredKey = preferredPhenomenonKeyByNodeId[selectedNode.id];
  const driver = findNearestPhenomenon(phenomena, selectedNode.id, edges, 'driver', preferredKey);
  const impact = findNearestPhenomenon(phenomena, selectedNode.id, edges, 'impact', preferredKey);
  const directionalMatches = [driver, impact]
    .filter(Boolean)
    .sort((a, b) => a.distance - b.distance || (a.relationship === 'driver' ? -1 : 1));

  if (directionalMatches.length) return directionalMatches[0];

  return findNearestPhenomenon(
    phenomena,
    selectedNode.id,
    edges,
    'connected',
    preferredKey
  );
}

export function describeJourneyBridge(topicName, match) {
  if (!topicName || !match?.phenomenon?.label) return '';
  if (match.relationship === 'exact') {
    return `${topicName} has a dedicated activity lens.`;
  }
  if (match.relationship === 'driver') {
    return match.distance > 1
      ? `${match.phenomenon.label} is the nearest upstream activity connected to ${topicName}.`
      : `${match.phenomenon.label} is an upstream activity connected to ${topicName}.`;
  }
  if (match.relationship === 'impact') {
    return match.distance > 1
      ? `${match.phenomenon.label} is the nearest downstream activity connected to ${topicName}.`
      : `${match.phenomenon.label} is a downstream activity connected to ${topicName}.`;
  }
  return `${match.phenomenon.label} is the nearest activity lens connected to ${topicName}.`;
}
