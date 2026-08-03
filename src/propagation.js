/**
 * THE TULIP PROJECT - Ecological Impact Propagation Loop
 * Propagates changes dynamically through causal connections.
 */

import { isCausalRelationship } from './relationship-semantics.js';

/**
 * Propagates a change in one node to all connected nodes recursively.
 * Uses a dampened queue-based relaxation to prevent infinite runaway loops.
 * 
 * @param {Array} nodes - The array of node objects
 * @param {Array} edges - The array of edge/relationship objects
 * @param {string} startNodeId - The ID of the node that was manually changed
 * @param {number} delta - The amount by which the node was changed
 * @returns {Array} List of changes made in this propagation round
 */
export function propagateChange(nodes, edges, startNodeId, delta) {
  const values = {};
  const nodeById = new Map();
  const outgoingEdgesBySource = new Map();

  nodes.forEach(n => {
    values[n.id] = n.value;
    nodeById.set(n.id, n);
  });

  edges.filter(isCausalRelationship).forEach(edge => {
    if (!outgoingEdgesBySource.has(edge.source)) {
      outgoingEdgesBySource.set(edge.source, []);
    }
    outgoingEdgesBySource.get(edge.source).push(edge);
  });

  // Apply the manual delta to the starting node
  const startNode = nodeById.get(startNodeId);
  if (!startNode) return [];
  const oldVal = values[startNodeId];
  values[startNodeId] = Math.max(0, Math.min(100, values[startNodeId] + delta));
  const actualStartDelta = values[startNodeId] - oldVal;

  if (Math.abs(actualStartDelta) < 0.01) {
    return []; // No actual change took place (e.g. already capped at 0 or 100)
  }

  // Queue holds elements to propagate: { nodeId, incomingDelta }
  const queue = [{ nodeId: startNodeId, delta: actualStartDelta }];
  let queueIndex = 0;
  const maxIterations = 60; // Safety cap to avoid infinite feedback loops
  let count = 0;

  // Damping factor reduces effect propagation speed and prevents endless amplification
  const DAMPING = 0.6;

  while (queueIndex < queue.length && count < maxIterations) {
    const current = queue[queueIndex];
    queueIndex += 1;
    count++;

    // Find outgoing edges
    const outgoing = outgoingEdgesBySource.get(current.nodeId) || [];
    
    outgoing.forEach(edge => {
      // Calculate target delta: current delta * edge influence coefficient * global damping
      const targetDelta = current.delta * edge.influence * DAMPING;
      
      if (Math.abs(targetDelta) < 0.2) return; // Threshold to prevent infinite micro-updates

      const prevVal = values[edge.target];
      const newVal = Math.max(0, Math.min(100, prevVal + targetDelta));
      const actualChange = newVal - prevVal;

      // Only queue further propagation if the change is significant
      if (Math.abs(actualChange) > 0.1) {
        values[edge.target] = newVal;
        queue.push({ nodeId: edge.target, delta: actualChange });
      }
    });
  }

  // Commit values and build changes summary log
  const changes = [];
  nodes.forEach(n => {
    const prev = n.value;
    const curr = values[n.id];
    const diff = curr - prev;
    
    if (Math.abs(diff) > 0.05) {
      n.value = curr;
      changes.push({
        id: n.id,
        name: n.name,
        prev: prev,
        curr: curr,
        diff: diff
      });
    }
  });

  return changes;
}
