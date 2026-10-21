import assert from 'node:assert/strict';
import { readFile, writeFile, unlink } from 'node:fs/promises';

const registryUrl = new URL('../src/node-photos.json', import.meta.url);
const decisionsUrl = new URL('../artifacts/unique-inspector-photos-2026-10-01/ownership-decisions.json', import.meta.url);
const registry = JSON.parse(await readFile(registryUrl));
const decisions = JSON.parse(await readFile(decisionsUrl));
const byAsset = new Map();
for (const [nodeId, photo] of Object.entries(registry.photos)) {
  const name = photo.asset.split('/').at(-1);
  if (!byAsset.has(name)) byAsset.set(name, []);
  byAsset.get(name).push(nodeId);
}
const sharedNames = [...byAsset].filter(([, ids]) => ids.length > 1).map(([name]) => name).sort();
assert.deepEqual(Object.keys(decisions).sort(), sharedNames,
  'Ownership decisions must cover exactly the currently shared photographs');
for (const [name, owner] of Object.entries(decisions)) {
  const ids = byAsset.get(name);
  assert(owner === null || ids.includes(owner), `Invalid owner for ${name}`);
}
const kept = {};
for (const [nodeId, photo] of Object.entries(registry.photos)) {
  const name = photo.asset.split('/').at(-1);
  if (!Object.hasOwn(decisions, name) || decisions[name] === nodeId) kept[nodeId] = photo;
}
const sources = new Set();
for (const [nodeId, photo] of Object.entries(kept)) {
  assert(!sources.has(photo.sourceSha256), `Repeated source after review: ${nodeId}`);
  sources.add(photo.sourceSha256);
}
for (const [name, owner] of Object.entries(decisions)) {
  if (owner === null) await unlink(new URL(`../public/node-photos/${name}`, import.meta.url));
}
const removedAssignments = Object.keys(registry.photos).length - Object.keys(kept).length;
registry.photos = kept;
await writeFile(registryUrl, JSON.stringify(registry, null, 2) + '\n');
console.log(`Kept ${Object.keys(kept).length} distinct photographs; removed ${removedAssignments} assignments and ${Object.values(decisions).filter(x => x === null).length} weak sources.`);
