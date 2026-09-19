import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const [html, main, css] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/main.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/style.css', import.meta.url), 'utf8')
]);

const expectedActivityIcons = [
  'airplane.png',
  'arrow-up-right.png',
  'bolt-fill.png',
  'building-2-fill.png',
  'building-columns-fill.png',
  'bus-fill.png',
  'cloud-fill.png',
  'cpu-fill.png',
  'fork-knife.png',
  'hammer-fill.png',
  'industry-farming.svg',
  'person-3-fill.png',
  'person-fill.png',
  'server-rack.png',
  'shippingbox-fill.png',
  'smoke-fill.png',
  'snowflake.png',
  'sparkles.png',
  'takeoutbag-cup-straw-fill.png',
  'testtube-2.png',
  'trash-fill.png',
  'tree-fill.png',
  'tshirt-fill.png',
  'waterbottle-fill.png'
];

const activityIconFiles = (await readdir(new URL('../public/activity-icons/ios/', import.meta.url)))
  .filter(fileName => fileName.endsWith('.png') || fileName.endsWith('.svg'))
  .sort();

assert.match(html, /Search a topic or select a highlighted node to begin\./);
assert.doesNotMatch(html, /id="explore-start-guide"/);
assert.match(main, /View all \$\{matches\.length\} results/);
assert.match(main, /score\.textContent = Number\.isFinite\(numericScore\)\s*\? scoreBand\s*:\s*'Risk unavailable'/);
assert.match(main, /Risk assessment: \$\{scoreBand\}/);
assert.doesNotMatch(main, /Urgency \$\{numericScore\.toFixed\(1\)\} · \$\{scoreBand\}/);
assert.doesNotMatch(html, /CONTINUE THIS ANALYSIS/i);
assert.doesNotMatch(html, /FROM YOUR ANALYSIS/i);
assert.doesNotMatch(html, /Return to analysis/i);
assert.match(html, /id="urgency-trust-panel"/);
assert.match(html, /<template id="tulip-meta-data-template" data-feature-name="TULIP META DATA">[\s\S]*?id="urgency-trust-panel"[\s\S]*?<\/template>/);
assert.match(html, /id="urgency-evidence-date"/);
assert.match(html, /id="urgency-evidence-method"/);
assert.match(html, /id="urgency-evidence-quality"/);
assert.match(html, /id="urgency-review-status"/);
assert.match(html, /id="urgency-uncertainty-copy"/);
assert.match(html, /id="urgency-score-guide-button"[^>]*>See the full calculation<\/button>/);
assert(html.includes('Here is how TULIP calculates the score.'));
assert(html.includes('The formula is 1 + (9 × the weighted result).'));
assert(html.includes('TULIP then builds the vector and calculates the weighted result.'));
assert(html.includes('The vector is [current severity, distance to danger, speed of change, geographic reach].'));
assert(html.includes('The reviewed factor vector is [0.84 for persistence, 0.95 for geographic reach, and 0.62 for causal role].'));
assert(html.includes('TULIP does not use generated vectors, inherited vectors, expert-profile vectors, the legacy vector score'));
assert.match(main, /urgencyScoreGuideButton\.addEventListener\('click', handleTulipScoreClick\)/);
assert.match(css, /body\.footer-overlay-active #app-container\[data-view-mode="study"\] \.mobile-study-sheet\s*\{[\s\S]*?visibility:\s*hidden !important;/);
assert.doesNotMatch(html, /Private by design/i);
assert.doesNotMatch(html, /id="personal-footprint-progress-label"/);
assert.doesNotMatch(html, /id="personal-footprint-completion-status"/);
assert.doesNotMatch(html, /Assessment complete/);
assert.doesNotMatch(html, /Your two biggest opportunities/);
assert.match(html, /id="analyse-starter-picker"/);
assert.match(html, /id="analyse-starter-grid"/);
assert.match(html, /id="personal-footprint-download"/);
assert.doesNotMatch(html, /id="personal-footprint-share"/);
assert.doesNotMatch(html, />Share summary</);
assert.match(html, /id="personal-footprint-restart"/);
assert.match(html, /id="personal-footprint-results-start"[^>]*hidden/);
assert.doesNotMatch(html, /Your footprint estimate/);
assert.match(main, /pdf\.save\('tulip-your-footprint\.pdf'\)/);
assert.match(main, /title: 'TULIP - Your Footprint Summary'/);
assert.match(main, /const questionHeight = questionLines\.length \* 4\.1/);
assert.match(main, /const answerHeight = answerLines\.length \* 4\.7/);
assert.match(main, /const rowHeight = questionHeight \+ answerHeight \+ 9/);
assert.match(main, /pdf\.text\(answerLines, margin \+ 4, answerY/);
assert.match(main, /const dividerY = answerY \+ answerHeight \+ 1\.5/);
assert.match(main, /button\.addEventListener\('click', handler\)/);
assert.doesNotMatch(main, /button\.onclick = handler/);
assert.doesNotMatch(main, /phenomenon-row-speculative-tag">scenario range/);
assert.doesNotMatch(main, /tulip-footprint-summary\.txt/);
assert.match(main, /results\?\.scrollIntoView/);
assert.match(main, /resultsCard\.hidden = !progress\.complete/);
assert.match(css, /\.personal-footprint-results-card\[hidden\]\s*\{[\s\S]*?display:\s*none\s*!important/);
assert.doesNotMatch(main, /const defaultNode = NODE_BY_ID\.get\('temp'\)/);
assert.match(main, /data-analyse-starter-node/);
assert.match(main, /analyse_starter_selected/);
assert.match(main, /if \(mode !== 'explore'\) \{\s*hideAnalyseStarterPicker\(\{ resumeGraph: false \}\);\s*\}/);
assert.match(main, /const starterPickerIsVisible = \([\s\S]*?appContainer\?\.dataset\.viewMode === 'explore'[\s\S]*?!starterPicker\.hidden[\s\S]*?\);/);
assert.match(main, /function restoreStudyWorkspaceState\(\)/);
assert.match(main, /if \(restoreStudyWorkspaceState\(\)\) return;/);
assert.match(main, /if \(currentPhenomenonNode\) \{\s*setShellMode\('phenomena'\);\s*setPhenomenonMode\(currentPhenomenonMode\);/);
assert.match(main, /function getPhenomenaScrollContainer\(\)/);
assert.match(main, /shellScrollState\.phenomena = getPhenomenaScrollContainer\(\)\?\.scrollTop \|\| 0;/);
assert.match(main, /shellScrollState\.personalFootprint = personalFootprintView\.scrollTop;/);
assert.match(css, /\.personal-footprint-results-card\s*\{/);
assert.match(css, /#app-container\[data-view-mode="personal-footprint"\] \.personal-footprint-focus-name-text\s*\{[\s\S]*?font-weight:\s*400;/);
assert.match(css, /\.analyse-starter-picker\s*\{/);
assert.match(css, /\.phenomena-shell > \.phenomena-focus-card\s*\{[\s\S]*?overflow-y:\s*auto;/);
assert.match(css, /\.phenomena-selector::-webkit-scrollbar,[\s\S]*?\.phenomena-shell > \.phenomena-focus-card::-webkit-scrollbar\s*\{[\s\S]*?display:\s*none;/);
assert.deepEqual(activityIconFiles, expectedActivityIcons);
expectedActivityIcons.forEach(fileName => {
  assert.match(`${html}\n${main}`, new RegExp(fileName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
});
assert.match(css, /\.ios-symbol-icon\s*\{[\s\S]*?mask-image:\s*var\(--ios-symbol-url\);/);
assert.doesNotMatch(main, /class="phenomena-selector-icon"/);
assert.doesNotMatch(css, /\.phenomena-selector-icon\s*\{/);
assert.match(css, /\.phenomena-focus-icon > \.ios-symbol-icon\s*\{[\s\S]*?width:\s*28px;/);
assert.match(css, /\.phenomena-focus-icon > \.ios-symbol-industry-farming\s*\{[\s\S]*?width:\s*27px;/);
assert.match(css, /--activity-divider-padding:\s*57px;/);
assert.match(css, /padding-right:\s*var\(--activity-divider-padding,\s*31px\);/);
assert.match(css, /\.phenomena-selector-name\s*\{[\s\S]*?white-space:\s*nowrap;/);

console.log('Experience contract tests passed.');
