import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [
  tokens,
  productStyles,
  launchStyles,
  main,
  graph,
  index,
  privacy,
  support,
  guide,
  typographyGuide
] = await Promise.all([
  readFile(new URL('../src/design-system.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/style.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/launch-experience.css', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/graph.js', import.meta.url), 'utf8'),
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/privacy.html', import.meta.url), 'utf8'),
  readFile(new URL('../public/support.html', import.meta.url), 'utf8'),
  readFile(new URL('../docs/design-system.md', import.meta.url), 'utf8'),
  readFile(new URL('../docs/typography-guide.md', import.meta.url), 'utf8')
]);

const requiredTokens = [
  'surface-canvas',
  'surface-panel',
  'text-primary',
  'text-secondary',
  'accent-color',
  'border-default',
  'type-body',
  'type-heading',
  'weight-display',
  'weight-display-emphasis',
  'weight-display-supporting',
  'weight-display-secondary',
  'weight-display-primary',
  'weight-title',
  'weight-ui',
  'weight-emphasis',
  'space-md',
  'radius-pill',
  'control-height-md',
  'motion-standard',
  'layer-overlay'
];

for (const token of requiredTokens) {
  assert.match(tokens, new RegExp(`--${token}\\s*:`), `Missing design token --${token}`);
}

for (const primitive of ['.ds-stack', '.ds-cluster', '.ds-card', '.ds-button', '.ds-pill', '.ds-field']) {
  assert.ok(tokens.includes(primitive), `Missing design-system primitive ${primitive}`);
}

const tokenImport = main.indexOf("import './design-system.css';");
const productImport = main.indexOf("import './style.css';");
assert.ok(tokenImport >= 0, 'main.js must import design-system.css');
assert.ok(productImport > tokenImport, 'design-system.css must load before style.css');

for (const token of requiredTokens) {
  assert.doesNotMatch(
    productStyles,
    new RegExp(`--${token}\\s*:`),
    `Core token --${token} must only be defined in design-system.css`
  );
}

assert.match(productStyles, /\.relationship-evidence-select\s*\{[\s\S]*?var\(--control-height-md\)/);
assert.match(productStyles, /\.relationship-evidence-prompt\s*\{[\s\S]*?var\(--control-gap\)/);
assert.match(productStyles, /\.relationship-trigger-word,[\s\S]*?var\(--text-primary\)/);
assert.match(guide, /src\/design-system\.css/);
assert.match(guide, /Do not add a raw color, radius, shadow, or type size/);
assert.match(typographyGuide, /Inter Display Light/);
assert.match(typographyGuide, /Regular is the platform ceiling/);
assert.match(typographyGuide, /Do not use `500`, `600`, `700`, `800`, `900`/);

const styleSources = [
  ['src/design-system.css', tokens],
  ['src/style.css', productStyles],
  ['src/launch-experience.css', launchStyles],
  ['src/main.js', main],
  ['src/graph.js', graph],
  ['index.html', index],
  ['public/privacy.html', privacy],
  ['public/support.html', support]
];

for (const [name, source] of styleSources) {
  const numericWeights = [...source.matchAll(/font-weight\s*(?::|=)\s*["']?(\d+)/g)].map((match) => Number(match[1]));
  const variationWeights = [...source.matchAll(/font-variation-settings\s*:\s*["']wght["']\s*(\d+)/g)].map((match) => Number(match[1]));
  const canvasWeights = [...source.matchAll(/(?:`|["'])(\d{3})\s+[^`"']*Inter Display/g)].map((match) => Number(match[1]));
  const violations = [...numericWeights, ...variationWeights, ...canvasWeights].filter((weight) => weight > 400);
  assert.deepEqual(violations, [], `${name} contains typography weights above the Inter Display Regular ceiling`);
}

assert.match(tokens, /--weight-light:\s*300/);
assert.match(tokens, /--weight-regular:\s*400/);
for (const alias of ['medium', 'semibold', 'bold', 'extrabold', 'title', 'ui', 'emphasis']) {
  assert.match(tokens, new RegExp(`--weight-${alias}:\\s*var\\(--weight-regular\\)`));
}
assert.match(tokens, /--weight-display-supporting:\s*var\(--weight-light\)/);
assert.match(tokens, /--weight-display-secondary:\s*350/);
assert.match(tokens, /--weight-display-primary:\s*var\(--weight-regular\)/);
assert.match(tokens, /--weight-display:\s*var\(--weight-display-supporting\)/);
assert.match(tokens, /--weight-display-emphasis:\s*var\(--weight-display-secondary\)/);
assert.match(index, /Inter\+Display:wght@300;350;400/);
assert.match(privacy, /font-family:\s*"Inter Display"/);
assert.match(support, /font-family:\s*"Inter Display"/);

assert.match(productStyles, /font-weight:\s*var\(--weight-display\)\s*!important/);
assert.match(productStyles, /font-weight:\s*var\(--weight-display-secondary\)\s*!important/);
assert.match(productStyles, /font-weight:\s*var\(--weight-display-primary\)\s*!important/);
assert.match(productStyles, /font-weight:\s*var\(--weight-title\)\s*!important/);
assert.match(productStyles, /font-weight:\s*var\(--weight-ui\)\s*!important/);
for (const primaryHeading of [
  'analyse-starter-title',
  'console-node-name',
  'phenomena-focus-name-text',
  'personal-footprint-focus-name-text'
]) {
  assert.match(productStyles, new RegExp(`#${primaryHeading}`), `Missing primary display mapping for #${primaryHeading}`);
}
for (const secondaryHeading of ['phenomenon-lens-title']) {
  assert.match(productStyles, new RegExp(`#${secondaryHeading}`), `Missing secondary display mapping for #${secondaryHeading}`);
}
assert.match(productStyles, /body #personal-footprint-results-title\s*\{[\s\S]*?font-weight:\s*var\(--weight-regular\)\s*!important;[\s\S]*?font-variation-settings:\s*"wght" 400\s*!important;/);
assert.match(typographyGuide, /Navigation tab labels are controls, not display headings/);

console.log('Design system contract tests passed.');
