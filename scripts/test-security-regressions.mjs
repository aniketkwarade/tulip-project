import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { escapeHtml, safeHttpsUrl } from '../src/security.js';
import {
  decodeSnapshotPng,
  isAllowedSnapshotOrigin,
  resolveSnapshotPath,
} from '../server/snapshot-security.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFile(path.join(root, relativePath), 'utf8');
const productionOrigin = 'https://tulip-project-six.vercel.app';

assert.equal(
  escapeHtml(`<img src=x onerror='globalThis.pwned=true'>`),
  '&lt;img src=x onerror=&#39;globalThis.pwned=true&#39;&gt;',
);
assert.equal(safeHttpsUrl('javascript:alert(1)', 'https://example.test/'), 'https://example.test/');
assert.equal(safeHttpsUrl('data:text/html,pwned', 'https://example.test/'), 'https://example.test/');
assert.equal(safeHttpsUrl('https://science.nasa.gov/path', 'https://example.test/'), 'https://science.nasa.gov/path');

const snapshotDir = path.join(root, 'tmp', 'snapshots');
assert.equal(resolveSnapshotPath(root, 'tmp/snapshots/preview.png'), path.join(snapshotDir, 'preview.png'));
assert.equal(resolveSnapshotPath(root, path.join(snapshotDir, 'preview.png')), path.join(snapshotDir, 'preview.png'));
for (const invalidPath of ['vite.config.js', 'tmp/snapshots/../vite.config.js', 'tmp/snapshots/nested/preview.png', 'tmp/snapshots/preview.js']) {
  assert.throws(() => resolveSnapshotPath(root, invalidPath));
}

const onePixelPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB';
assert.equal(decodeSnapshotPng(onePixelPng).subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
for (const invalidImage of ['data:text/plain;base64,UFdORUQ=', 'data:image/png;base64,UFdORUQ=', 'UFdORUQ=']) {
  assert.throws(() => decodeSnapshotPng(invalidImage));
}

const allowedOrigins = new Set(['http://127.0.0.1:5176', 'http://localhost:5176']);
assert.equal(isAllowedSnapshotOrigin(undefined, allowedOrigins), true);
assert.equal(isAllowedSnapshotOrigin('http://127.0.0.1:5176', allowedOrigins), true);
assert.equal(isAllowedSnapshotOrigin('https://attacker.example', allowedOrigins), false);

const [html, main, server, citation, securityText, robots, sitemap, vercelSource] = await Promise.all([
  read('index.html'),
  read('src/main.js'),
  read('server/index.mjs'),
  read('CITATION.cff'),
  read('public/.well-known/security.txt'),
  read('public/robots.txt'),
  read('public/sitemap.xml'),
  read('vercel.json'),
]);

assert.match(main, /escapeHtml\(entry\.fuel\)/);
assert.match(main, /escapeHtml\(entry\.title\)/);
assert.match(main, /safeHttpsUrl\(entry\.search_url \|\| entry\.access_url/);
assert.match(server, /resolveSnapshotPath\(ROOT, filepath\)/);
assert.match(server, /isAllowedSnapshotOrigin\(req\.headers\.origin/);
assert.match(server, /decodeSnapshotPng\(image\)/);

for (const source of [html, main, citation, securityText, robots, sitemap]) {
  assert.doesNotMatch(source, /tulip\.earth/);
  assert.match(source, new RegExp(productionOrigin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}

const vercel = JSON.parse(vercelSource);
const csp = vercel.headers
  .find(rule => rule.source === '/(.*)')
  .headers.find(header => header.key === 'Content-Security-Policy').value;
assert.match(csp, /script-src 'self'/);
assert.doesNotMatch(csp, /script-src[^;]*'unsafe-inline'/);
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert.ok(inlineScript, 'Expected the early splash initializer inline script');
const inlineScriptHash = `sha256-${createHash('sha256').update(inlineScript).digest('base64')}`;
assert.match(csp, new RegExp(inlineScriptHash.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));

console.log('Security regression checks passed: snapshot confinement, generated-data escaping, safe links, canonical URL, and CSP.');
