import registry from './node-photos.json' with { type: 'json' };

export const NODE_PHOTOS = Object.freeze(registry.photos);

/** Only reviewed, locally packaged photographs enter inspector payloads. */
export function getNodePhoto(nodeId) {
  return NODE_PHOTOS[nodeId] || null;
}
