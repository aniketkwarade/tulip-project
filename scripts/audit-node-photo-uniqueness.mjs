import { readFile } from 'node:fs/promises';
import { PUBLISHED_NODES } from '../src/data.js';

const registry = JSON.parse(await readFile(new URL('../src/node-photos.json', import.meta.url))).photos;
const bySource = new Map();
const missing = [];
for (const node of PUBLISHED_NODES) {
  const photo = registry[node.id];
  if (!photo) {
    missing.push({ id: node.id, name: node.name });
    continue;
  }
  const key = photo.sourceSha256;
  if (!bySource.has(key)) bySource.set(key, []);
  bySource.get(key).push({ id: node.id, name: node.name, asset: photo.asset, sourceUrl: photo.sourceUrl });
}
const duplicateGroups = [...bySource.values()]
  .filter(nodes => nodes.length > 1)
  .sort((a, b) => b.length - a.length || a[0].id.localeCompare(b[0].id));
const report = {
  published: PUBLISHED_NODES.length,
  covered: PUBLISHED_NODES.length - missing.length,
  distinctSourcePhotographs: bySource.size,
  repeatedAssignments: duplicateGroups.reduce((total, nodes) => total + nodes.length - 1, 0),
  missing,
  duplicateGroups,
};
if (process.argv.includes('--json')) console.log(JSON.stringify(report, null, 2));
else console.log(`${report.covered}/${report.published} nodes covered; ${report.distinctSourcePhotographs} distinct source photographs; ${report.repeatedAssignments} repeated assignments; ${missing.length} missing.`);
if (process.argv.includes('--strict') && (missing.length || duplicateGroups.length)) process.exitCode = 1;
