import assert from 'node:assert/strict';
import fs from 'node:fs';
import { PHENOMENON_SELECTOR_CONFIG } from '../src/phenomenon-selector.js';
import { getPhenomenonLensById } from '../src/phenomenon-lens.js';
import { getActionProfileById } from '../src/actions-data.js';
import { getActivityReaderCopy, applyActivityLensReaderCopy, applyActivityActionReaderCopy } from '../src/activity-reader-copy.js';
import { formatMetricDisplayText } from '../src/metric-display.js';

const read = path => JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const fixture = read('./fixtures/activity-scientific-baseline.json');
const mobile = read('../Stitch Import/tulip-mobile/src/mobile-activity-snapshot.json');
const native = read('../iOS/TULIPiOS/NativeData/mobile-activity-snapshot.json');
const records = read('../src/reader-copy/activities.json');
const display = value => {
  if (typeof value === 'string') return /^https?:/.test(value) ? value : formatMetricDisplayText(value);
  if (Array.isArray(value)) return value.map(display);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,display(v)]));
  return value;
};
// The existing native exporter repairs this moved source URL; prose must remain identical.
const nativeURLs = value => JSON.parse(JSON.stringify(value).replaceAll('https://sca.coffee/s/2017-SCA-CHB-Program-Requirements-ba6g.pdf','https://sca.coffee/store/p/the-coffee-brewing-handbook-afhpy'));
const excluded = new Set(['title','eyebrow','intro','scaleNote','takeaway','groups']);
let rows=0, actions=0;
assert.deepEqual(Object.keys(records).sort(), PHENOMENON_SELECTOR_CONFIG.map(p=>p.key).sort(), 'Every Activity category must have authored reader copy');
assert.equal(mobile.length, PHENOMENON_SELECTOR_CONFIG.length);
assert.equal(native.length, mobile.length);
for (const selector of PHENOMENON_SELECTOR_CONFIG) {
  const id = selector.lensKey || selector.nodeIds[0];
  const lens = getPhenomenonLensById(id), profile = getActionProfileById(id);
  const scientific = Object.fromEntries(Object.entries(lens).filter(([k])=>!excluded.has(k)).map(([k,v])=>[k,k==='items'?v.map(({label,note,...row})=>row):v]));
  assert.deepEqual(scientific, fixture.find(p=>p.key===selector.key).lens, `${selector.key}: values, units, order, portions, sources or projection flags changed`);
  const expected = display({key:selector.key,label:selector.label,description:selector.description,lens,actions:profile,lensKey:id});
  assert.deepEqual(mobile.find(p=>p.key===selector.key), expected, `${selector.key}: mobile copy drift`);
  assert.deepEqual(native.find(p=>p.key===selector.key), nativeURLs(expected), `${selector.key}: native copy drift`);
  for (const tier of ['personal','community','policy']) {
    assert.equal(profile[tier].length, 3);
    actions+=profile[tier].length;
  }
  rows+=lens.items.length;
  assert.deepEqual(lens.groups.flatMap(g=>g.items), lens.items, `${selector.key}: group rows lost or reordered`);
  const copy=getActivityReaderCopy(selector.key);
  assert.equal(profile.definition, copy.actions.definition);
  assert(!/\b(?:the report|action surface|levers|anthropogenic|enteric fermentation|MRV|LDAR|EPR|high-GWP)\b/i.test(JSON.stringify(copy)), `${selector.key}: unexplained technical or editorial wording`);
}
assert.equal(rows,95);
assert.equal(actions,144);
assert.throws(()=>getActivityReaderCopy('unwritten_activity'), /Missing Activity reader copy/);
const food=getPhenomenonLensById('food');
assert.throws(()=>applyActivityLensReaderCopy('food',{...food,items:[...food.items,{id:'new_food',value:1}]}), /coverage changed/);
assert.throws(()=>applyActivityLensReaderCopy('food',{...food,items:food.items.map((row,i)=>i?row:{...row,id:'renamed_without_copy'})}), /Missing Activity reader copy/);
const foodActions=getActionProfileById('food');
assert.throws(()=>applyActivityActionReaderCopy('food',{...foodActions,personal:[...foodActions.personal,'new action']}), /coverage changed/);
console.log(`Activity reader-copy checks passed: ${mobile.length} categories, ${rows} comparisons, ${actions} actions. Scientific values and all three platform copies match.`);
