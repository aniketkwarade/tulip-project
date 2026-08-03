import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const [html, css, main, server, preview] = await Promise.all([
  readFile(path.join(root, 'index.html'), 'utf8'),
  readFile(path.join(root, 'src/style.css'), 'utf8'),
  readFile(path.join(root, 'src/main.js'), 'utf8'),
  readFile(path.join(root, 'server/index.mjs'), 'utf8'),
  readFile(path.join(root, 'public/share-preview.png'))
]);

assert.match(html, /id="enter-tulip-btn"[^>]*>ENTER TULIP<\/button>/);
assert.match(main, /const splashHoldMs = 10000;/);
assert.match(css, /\.phenomena-selector\s*\{[\s\S]*?max-height:[\s\S]*?overflow-y: auto;/);
assert.equal((html.match(/data-close-footer-overlay/g) || []).length, 0);
assert.equal((html.match(/role="dialog"/g) || []).length, 5);
assert.match(main, /event\.key === 'Escape'[\s\S]*?closeFooterOverlays\(\)/);
assert.match(main, /event\.key !== 'Tab'/);
assert.match(main, /setBackgroundInert\(active, overlay\)/);
assert.match(main, /isOutsideOverlayContent\(e/);
assert.match(html, /<meta property="og:image:width" content="1200"/);
assert.match(html, /<meta property="og:image:height" content="630"/);
assert.equal(preview.readUInt32BE(16), 1200);
assert.equal(preview.readUInt32BE(20), 630);
assert.doesNotMatch(html, /formsubmit\.co\/[^"]+@gmail\.com/i);
assert.doesNotMatch(main, /const\s+(?:defaultEcmwfKey|defaultKey|oldKey)\s*=/);
assert.match(main, /import\('\.\/phenomenon-lens\.js'\)/);
assert.match(main, /import\('\.\/actions-data\.js'\)/);
assert.match(server, /url\.pathname === '\/api\/contact'/);
assert.match(server, /url\.pathname === '\/api\/telemetry'/);
assert.match(server, /contactRateLimited\(req\)/);
assert.match(server, /TULIP_ENABLE_SNAPSHOT_WRITES/);
assert.doesNotMatch(main, /scientific units and benchmark lines carry/);
assert.match(html, /carbon, water, land, and material footprints/i);
assert.doesNotMatch(html, /id="explore-guidance"/);
assert.match(html, /id="graph-canvas"[\s\S]*?role="img"[\s\S]*?aria-label=/);
assert.match(html, /id="contact-btn"[^>]*aria-disabled="true"[^>]*aria-describedby="contact-disabled-tooltip"/);
assert.match(html, /href="mailto:aniket1\.warade@gmail\.com"/);
assert.match(html, /id="contact-disabled-tooltip"[^>]*role="tooltip"[\s\S]*?<span>Contact:<\/span>/);
assert.doesNotMatch(html, /Disabled for Reddit/);
assert.match(css, /\.footer-contact-disabled:hover \.footer-contact-tooltip/);
assert.doesNotMatch(css, /\.footer-overlay-close(?:\s|,|\{)/);
assert.match(css, /\.sources-close-btn/);
assert.match(css, /\.personal-footprint-question-card\s*\{[\s\S]*?scroll-margin-top:\s*260px;/);
assert.match(css, /\.personal-footprint-pill\s*\{[\s\S]*?scroll-margin-top:\s*330px;/);
const undersizedPx = [...css.matchAll(/font-size:\s*(\d+(?:\.\d+)?)px/g)]
  .map(match => Number(match[1]))
  .filter(size => size < 12);
assert.deepEqual(undersizedPx, [], 'CSS contains font sizes below 9pt/12px');

console.log('Launch-readiness checks passed.');
