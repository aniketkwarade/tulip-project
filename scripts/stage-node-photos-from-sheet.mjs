// Export the sourcing tab as CSV. Stage selected rows for documentary review;
// only import-node-photo-selections.py can approve pixels and install assets.
import { readFile, writeFile } from 'node:fs/promises';
import { PUBLISHED_NODES } from '../src/data.js';
import { NODE_PHOTOS } from '../src/node-photos.js';
const [input, output] = process.argv.slice(2);
if (!input || !output) throw new Error('Usage: node scripts/stage-node-photos-from-sheet.mjs sheet.csv reviewed-selections.json');
function csvRows(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"' && text[i+1] === '"' && quoted) { cell += '"'; i++; }
    else if (c === '"') quoted = !quoted;
    else if (!quoted && (c === ',' || c === '\n')) {
      row.push(cell); cell = '';
      if (c === '\n') { rows.push(row); row = []; }
    } else if (c !== '\r') cell += c;
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
const rows = csvRows(await readFile(input, 'utf8'));
const headerIndex = rows.findIndex(row => row[0] === 'Node ID');
if (headerIndex < 0) throw new Error('Sourcing header missing');
const headers = rows[headerIndex];
const get = (row, name) => row[headers.indexOf(name)]?.trim() || '';
const ids = new Set(PUBLISHED_NODES.map(n => n.id));
const selected = [];
const seen = new Set();
const chosenSources = new Map();
const pageOnly = !headers.includes('Status') && headers.includes('Your decision') && headers.includes('Candidate page URL');
for (const row of rows.slice(headerIndex+1)) {
  if (pageOnly ? !get(row,'Candidate page URL') : !['Candidate','Ready'].includes(get(row,'Status'))) continue;
  const id = get(row,'Node ID');
  if (!ids.has(id)) throw new Error(`Unpublished node ID: ${id}`);
  if (seen.has(id)) throw new Error(`Duplicate node ID: ${id}`);
  seen.add(id);
  // Verified links take precedence. Candidate links remain unapproved here.
  const imageUrl = get(row,'Image file URL') || get(row,'Candidate image URL');
  const sourceUrl = get(row,'Photo page URL') || get(row,'Candidate page URL');
  const details = { imageUrl:pageOnly?'':imageUrl, sourceUrl,
    credit:get(row,'Photographer / organization'), license:get(row,'License'),
    licenseUrl:get(row,'License URL'), caption:get(row,'Caption'), alt:get(row,'Alt text'),
    matchType:pageOnly?'Undecided':get(row,'Photo approach') };
  if (pageOnly && new URL(sourceUrl).protocol !== 'https:') throw new Error(`Use an HTTPS original photo page: ${id}`);
  const existing = NODE_PHOTOS[id];
  if (get(row,'Status')==='Ready' && existing && Object.entries(details).every(([key,value])=>existing[key==='imageUrl'?'sourceImageUrl':key]===value)) continue;
  const sourceKey = (imageUrl || sourceUrl).split('?')[0];
  if (chosenSources.has(sourceKey)) throw new Error(`Photograph already selected for ${chosenSources.get(sourceKey)}; ${id} needs its own source`);
  chosenSources.set(sourceKey, id);
  selected.push({nodeIds:[id],id:id.replaceAll('_','-'),...details,reviewed:false,...(pageOnly?{pageOnly:true}:{})});
}
await writeFile(output, JSON.stringify(selected,null,2)+'\n');
console.log(`Staged ${selected.length} selections. Review subject, provenance, license and crop before setting reviewed:true. Sheet status alone cannot approve a photograph.`);
if(pageOnly) console.log('Page-only choices require a verified original image URL, attribution, license, caption, alt text and direct/context choice before installation.');
