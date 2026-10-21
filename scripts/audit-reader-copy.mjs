import fs from 'node:fs';
import { PUBLISHED_NODES as nodes, PUBLISHED_EDGES as edges } from '../src/data.js';
import { inspectorReaderCopy as copy, assertPublishedReaderCopy } from '../src/inspector-reader-copy.js';
assertPublishedReaderCopy(nodes, edges);
const flags = [], stats = {fields: 0, words: 0, sentences: 0};
const syllables = word => Math.max(1, (word.toLowerCase().replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '').match(/[aeiouy]{1,2}/g) || []).length);
function inspect(value, path) {
  if (Array.isArray(value)) return value.forEach((v,i) => inspect(v, `${path}[${i}]`));
  if (value && typeof value === 'object') return Object.entries(value).forEach(([k,v])=>inspect(v, `${path}.${k}`));
  if (typeof value !== 'string') return;
  const sentences = value.match(/[^.!?]+(?:[.!?]+|$)/g) || [value];
  const words = value.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
  if (words.length < 8) return; // Tags and labels are not paragraphs.
  stats.fields++; stats.words += words.length; stats.sentences += sentences.length;
  const longestSentence = Math.max(...sentences.map(s => (s.match(/\S+/g)||[]).length));
  const grade = 0.39 * words.length / sentences.length + 11.8 * words.reduce((s,w)=>s+syllables(w),0) / words.length - 15.59;
  if (longestSentence > 32 || grade > 10) flags.push({path,approximateGrade:Number(grade.toFixed(1)),longestSentence,text:value});
}
for (const [kind, records] of Object.entries(copy)) inspect(records,kind);
const report={nodes:nodes.length,relationships:edges.length,coverage:'complete',stats,flagCount:flags.length,note:'Heuristic flags for editorial review, not a reading-age certification or word limit. Scientific names, source agencies and numbers can inflate estimates. See docs/plain-english-inspectors.md for the review and validation record.',flags};
const output=new URL('../artifacts/plain-english-inspectors-2026-09-22/readability.json',import.meta.url);
fs.mkdirSync(new URL('.',output),{recursive:true});fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');
console.log(`Reader coverage complete: ${nodes.length} nodes, ${edges.length} relationships. ${stats.fields} prose fields; ${flags.length} editorial flags written to ${output.pathname}.`);
