import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PUBLISHED_NODES, PUBLISHED_EDGES } from '../src/data.js';
import { PHENOMENON_SELECTOR_CONFIG } from '../src/phenomenon-selector.js';
import { getPhenomenonLensById } from '../src/phenomenon-lens.js';
import { getActionProfileById } from '../src/actions-data.js';
import { getTulipUrgencyBandV3 } from '../src/tulip-urgency-v3.js';
import { containsImperialDisplayUnit } from '../src/metric-display.js';
import {
  PERSONAL_FOOTPRINT_QUESTIONS,
  PERSONAL_FOOTPRINT_BASELINE_SELECTIONS,
  calculatePersonalFootprint
} from '../src/personal-footprint-model.js';

const nodeIds = new Set(PUBLISHED_NODES.map(node => node.id));
assert.equal(nodeIds.size, PUBLISHED_NODES.length, 'Published node IDs must be unique');
for (const edge of PUBLISHED_EDGES) {
  assert(nodeIds.has(edge.source), `Published edge source is missing: ${edge.source}`);
  assert(nodeIds.has(edge.target), `Published edge target is missing: ${edge.target}`);
}

for (const item of PHENOMENON_SELECTOR_CONFIG) {
  const profileKey = item.lensKey || item.nodeIds?.[0] || item.key;
  assert(getPhenomenonLensById(profileKey), `Activity lens is missing: ${profileKey}`);
  assert(getActionProfileById(profileKey), `Activity action profile is missing: ${profileKey}`);
  for (const nodeId of item.nodeIds || []) {
    assert(nodeIds.has(nodeId), `Activity category ${item.key} references an unpublished node: ${nodeId}`);
  }
}

assert.equal(PERSONAL_FOOTPRINT_QUESTIONS.length, 11, 'The shared footprint questionnaire must retain all 11 desktop questions');
for (const question of PERSONAL_FOOTPRINT_QUESTIONS) {
  const selected = PERSONAL_FOOTPRINT_BASELINE_SELECTIONS[question.key];
  assert(selected, `Footprint baseline is missing for ${question.key}`);
  assert(question.options.some(option => option.value === selected), `Footprint baseline ${selected} is invalid for ${question.key}`);
}
const baselineResult = calculatePersonalFootprint({ ...PERSONAL_FOOTPRINT_BASELINE_SELECTIONS });
assert.equal(baselineResult.answeredTotalCount, PERSONAL_FOOTPRINT_QUESTIONS.length);
for (const key of ['carbonTotal','landTotalM2','waterTotalM3','materialTotalTonnes']) {
  assert(Number.isFinite(baselineResult[key]) && baselineResult[key] > 0, `Footprint result ${key} must be a positive number`);
}

for (const node of PUBLISHED_NODES) {
  const score = Number(node.score?.baseline ?? (typeof node.impactScore === 'number' ? node.impactScore / 10 : NaN));
  if (score >= 1 && score <= 10) assert(getTulipUrgencyBandV3(score), `Urgency band is missing for ${node.id}`);
}

const mobileSource = await readFile(new URL('../Stitch Import/tulip-mobile/src/Prototype.tsx', import.meta.url), 'utf8');
const mobileSnapshotSource = await readFile(new URL('../Stitch Import/tulip-mobile/scripts/generate-mobile-data-snapshot.mjs', import.meta.url), 'utf8');
const mobileInspectorProfiles = JSON.parse(await readFile(new URL('../Stitch Import/tulip-mobile/src/mobile-inspector-snapshot.json', import.meta.url), 'utf8'));
const mobileGraphSnapshot = JSON.parse(await readFile(new URL('../Stitch Import/tulip-mobile/src/mobile-graph-snapshot.json', import.meta.url), 'utf8'));
const mobileActivitySnapshot = JSON.parse(await readFile(new URL('../Stitch Import/tulip-mobile/src/mobile-activity-snapshot.json', import.meta.url), 'utf8'));
const mobileRelationshipSnapshot = JSON.parse(await readFile(new URL('../Stitch Import/tulip-mobile/src/mobile-relationship-content-snapshot.json', import.meta.url), 'utf8'));
const desktopSource = await readFile(new URL('../src/main.js', import.meta.url), 'utf8');
const nativeFootprintModel = JSON.parse(await readFile(new URL('../iOS/TULIPiOS/NativeData/personal-footprint-model.json', import.meta.url), 'utf8'));
const nativeFootprintModelsSource = await readFile(new URL('../iOS/TULIPiOS/TULIPModels.swift', import.meta.url), 'utf8');
const nativeFootprintScreensSource = await readFile(new URL('../iOS/TULIPiOS/TULIPNativeScreens.swift', import.meta.url), 'utf8');

for (const required of [
  'SharedFootprintModel.calculatePersonalFootprint',
  'getTulipUrgencyBandV3'
]) assert(mobileSource.includes(required), `Mobile is not wired to desktop source: ${required}`);
for (const required of [
  'PUBLISHED_NODES',
  'PUBLISHED_EDGES',
  'getTulipUrgencyBandV3(urgency)',
  'getNodeInspectorMeaning(node)',
  'getPhenomenonLensById(lensKey)',
  'getActionProfileById(item.lensKey || item.nodeIds?.[0] || item.key)',
  'getRecentOccurrenceProfile(node',
  'recentOccurrences:recentOccurrenceProfile',
  'edge.relationship_content'
]) assert(mobileSnapshotSource.includes(required), `Mobile snapshot is not wired to desktop source: ${required}`);
assert.equal(Object.keys(mobileInspectorProfiles).length, PUBLISHED_NODES.length, 'Every published node must have a mobile inspector profile');
for (const profile of Object.values(mobileInspectorProfiles)) {
  assert(profile.recentOccurrences?.occurrences?.length > 0, `Recent Major Events are missing for ${profile.name}`);
  assert(profile.recentOccurrences.occurrences.length <= 3, `Recent Major Events exceed the three-event limit for ${profile.name}`);
}

function assertMetricDisplayCopy(value, path = '') {
  if (typeof value === 'string') {
    const isSourceUrl = /^https?:\/\//i.test(value);
    const isVerbatimEventTitle = /recentOccurrences\.occurrences\[\d+\]\.title$/.test(path);
    const isLexicalMile = /\b(?:last|first)[-\s]mile\b/i.test(value);
    assert(
      isSourceUrl || isVerbatimEventTitle || isLexicalMile || !containsImperialDisplayUnit(value),
      `Imperial display unit leaked into ${path}: ${value}`
    );
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => assertMetricDisplayCopy(child, `${path}[${index}]`));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      assertMetricDisplayCopy(child, path ? `${path}.${key}` : key);
    }
  }
}

assertMetricDisplayCopy(mobileGraphSnapshot, 'mobileGraph');
assertMetricDisplayCopy(mobileInspectorProfiles, 'mobileInspector');
assertMetricDisplayCopy(mobileActivitySnapshot, 'mobileActivity');
assertMetricDisplayCopy(mobileRelationshipSnapshot, 'mobileRelationships');
assert(!mobileSource.includes('urgencyBand: node.score?.band'), 'Mobile must not display semantic response bands as urgency status');
for (const edge of PUBLISHED_EDGES) {
  assert(edge.relationship_content?.plain_language, `Plain-language relationship content is missing: ${edge.source}->${edge.target}`);
  assert(edge.relationship_content?.technical_detail, `Technical relationship content is missing: ${edge.source}->${edge.target}`);
  assert(edge.relationship_content?.confidence?.explanation, `Confidence relationship content is missing: ${edge.source}->${edge.target}`);
  assert(edge.relationship_content?.sources?.length, `Relationship sources are missing: ${edge.source}->${edge.target}`);
}
assert(desktopSource.includes("from './personal-footprint-model.js'"), 'Desktop must consume the shared footprint model');
assert(desktopSource.includes("from './metric-display.js'"), 'Desktop must enforce the shared metric display contract');
assert(mobileSource.includes('formatMetricDisplayText'), 'Mobile web must enforce the shared metric display contract');
assert(nativeFootprintScreensSource.includes('TULIPMetricDisplay.text'), 'Native iOS must enforce metric display copy');
assert(nativeFootprintScreensSource.includes('vehicleKilometres'), 'Native iOS footprint comparisons must use kilometres');
assert(desktopSource.includes('calculateSharedPersonalFootprint(state)'), 'Desktop must calculate footprints through the shared model');
assert.deepEqual(nativeFootprintModel.questions, PERSONAL_FOOTPRINT_QUESTIONS, 'Native iOS footprint questions and insight guidance must match the shared model');
assert.equal(nativeFootprintModel.questions.filter(question => question.insight).length, 7, 'Native iOS must retain all seven actionable insight categories');
assert(nativeFootprintModelsSource.includes('enum TULIPFootprintInsightGenerator'), 'Native iOS must generate personalized footprint insights from answers');
assert(nativeFootprintScreensSource.includes('"Five actions for you"'), 'Native iOS results must render the five-action section');
assert(nativeFootprintScreensSource.includes('TULIPFootprintInsightGenerator.generate(model: model, answers: answers)'), 'Native iOS results must derive insights from the completed answers');

console.log(`Mobile data parity passed: ${PUBLISHED_NODES.length} nodes, ${PUBLISHED_EDGES.length} relationships, ${PHENOMENON_SELECTOR_CONFIG.length} Activity categories, and ${PERSONAL_FOOTPRINT_QUESTIONS.length} Footprint questions.`);
