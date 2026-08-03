import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFile(path.join(root, relativePath), 'utf8');

const [
  readme,
  dataNotice,
  notice,
  packageSource,
  gitignore,
  vercelignore,
  vercelSource,
  html,
  main,
  telemetry,
  securityText,
  robots,
  sitemap,
] = await Promise.all([
  read('README.md'),
  read('DATA_AND_ATTRIBUTION.md'),
  read('NOTICE'),
  read('package.json'),
  read('.gitignore'),
  read('.vercelignore'),
  read('vercel.json'),
  read('index.html'),
  read('src/main.js'),
  read('src/telemetry.js'),
  read('public/.well-known/security.txt'),
  read('public/robots.txt'),
  read('public/sitemap.xml'),
]);

const packageJson = JSON.parse(packageSource);
const vercel = JSON.parse(vercelSource);
const trackedFiles = execFileSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' })
  .trim()
  .split('\n');

assert.equal(packageJson.license, 'Apache-2.0');
assert.match(readme, /Apache License 2\.0/);
assert.match(readme, /telemetry is disabled\s+by\s+default/i);
assert.match(dataNotice, /third-party datasets/i);
assert.match(notice, /Copyright 2026 Aniket Warade/);

for (const forbidden of ['.env.local', '.vercel/project.json']) {
  assert.equal(trackedFiles.includes(forbidden), false, `${forbidden} must not be tracked`);
}
for (const ignored of ['.env.*', '.vercel/', '*.pem', '*.key', '*.p12', '*.pfx']) {
  assert.match(gitignore, new RegExp(ignored.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
for (const excluded of ['.env*', 'macOS/', 'experiments/', 'Reference_PDF Output/', 'tmp-*']) {
  assert.match(vercelignore, new RegExp(excluded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
}
assert.match(vercelignore, /^!scripts\/local-dev-config\.mjs$/m);

const globalHeaders = Object.fromEntries(
  vercel.headers.find(rule => rule.source === '/(.*)').headers.map(({ key, value }) => [key, value]),
);
for (const header of [
  'Content-Security-Policy',
  'Permissions-Policy',
  'Referrer-Policy',
  'X-Content-Type-Options',
  'X-Frame-Options',
  'Strict-Transport-Security',
  'Cross-Origin-Opener-Policy',
]) {
  assert.ok(globalHeaders[header], `Missing Vercel security header: ${header}`);
}

assert.match(html, /<link rel="canonical" href="https:\/\/tulip\.earth\/"/);
assert.match(html, /id="contact-btn"[^>]*aria-disabled="true"/);
assert.match(main, /if \(import\.meta\.env\.PROD\) \{[\s\S]*?loadFallback\(\)/);
assert.match(main, /VITE_TULIP_REMOTE_REFRESH_ENABLED === 'true'/);
assert.match(main, /if \(!REMOTE_REFRESH_ENABLED\) return/);
assert.match(telemetry, /VITE_TULIP_TELEMETRY_ENABLED === 'true'/);
assert.match(telemetry, /export function trackEvent[\s\S]*?if \(!TELEMETRY_ENABLED\) return/);
assert.match(telemetry, /export function initTelemetry[\s\S]*?if \(!TELEMETRY_ENABLED\) return/);

assert.match(securityText, /^Contact: https:\/\/github\.com\/aniketkwarade\/tulip-project\/security\/advisories\/new/m);
assert.match(securityText, /^Expires: 2027-08-03T00:00:00Z$/m);
assert.match(robots, /^Allow: \/$/m);
assert.match(sitemap, /<loc>https:\/\/tulip\.earth\/<\/loc>/);

console.log('Public-release checks passed: licensing, ignored secrets, static production, privacy, metadata, and security headers.');
