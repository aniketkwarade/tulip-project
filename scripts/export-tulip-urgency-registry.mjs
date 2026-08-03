import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { EDGES, NODES } from '../src/data.js';
import {
  TULIP_URGENCY_WEIGHTS,
  buildTulipUrgencyReceipt,
  calculateComposite,
  clamp01,
  compositeToTulipScore,
  getTulipUrgencyBand,
  verifyTulipUrgencyReceipt
} from '../src/tulip-urgency-v2.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const METHOD_VERSION = 'tulip_urgency_v2';
const MODEL_VERSION = 'tulip_modeled_global_v1';
const isResponseNode = node => node.node_kind === 'response';
const issueNodes = NODES.filter(node => !isResponseNode(node));
const responseNodes = NODES.filter(isResponseNode);

async function readJson(filename) {
  return JSON.parse(await fs.readFile(path.join(PUBLIC, filename), 'utf8'));
}

const accumulatedEvidenceWave22 = await readJson('tulip-accumulated-evidence-wave-22.json');
const accumulatedEvidenceWave23 = await readJson('tulip-accumulated-evidence-wave-23.json');
const accumulatedEvidenceWave24 = await readJson('tulip-accumulated-evidence-wave-24.json');
const accumulatedEvidenceWave25 = await readJson('tulip-accumulated-evidence-wave-25.json');
const accumulatedEvidenceWave26 = await readJson('tulip-accumulated-evidence-wave-26.json');
const accumulatedEvidenceWave27 = await readJson('tulip-accumulated-evidence-wave-27.json');
const accumulatedEvidenceWave28 = await readJson('tulip-accumulated-evidence-wave-28.json');
const accumulatedEvidenceWave29 = await readJson('tulip-accumulated-evidence-wave-29.json');
const accumulatedEvidenceWave30 = await readJson('tulip-accumulated-evidence-wave-30.json');
const accumulatedEvidenceWave31 = await readJson('tulip-accumulated-evidence-wave-31.json');
const accumulatedEvidenceWave32 = await readJson('tulip-accumulated-evidence-wave-32.json');
const accumulatedEvidenceWave33 = await readJson('tulip-accumulated-evidence-wave-33.json');
const accumulatedEvidenceWave34 = await readJson('tulip-accumulated-evidence-wave-34.json');
const accumulatedEvidenceWave35 = await readJson('tulip-accumulated-evidence-wave-35.json');
const accumulatedEvidenceWave36 = await readJson('tulip-accumulated-evidence-wave-36.json');
const accumulatedEvidenceWave37 = await readJson('tulip-accumulated-evidence-wave-37.json');
const accumulatedEvidenceWave38 = await readJson('tulip-accumulated-evidence-wave-38.json');
const accumulatedEvidenceWave39 = await readJson('tulip-accumulated-evidence-wave-39.json');
const accumulatedEvidenceWave40 = await readJson('tulip-accumulated-evidence-wave-40.json');
const accumulatedEvidenceWave41 = await readJson('tulip-accumulated-evidence-wave-41.json');
const accumulatedEvidenceWave42 = await readJson('tulip-accumulated-evidence-wave-42.json');
const accumulatedEvidenceWave43 = await readJson('tulip-accumulated-evidence-wave-43.json');
const accumulatedEvidenceWave44 = await readJson('tulip-accumulated-evidence-wave-44.json');
const accumulatedEvidenceWave45 = await readJson('tulip-accumulated-evidence-wave-45.json');
const accumulatedEvidenceWave46 = await readJson('tulip-accumulated-evidence-wave-46.json');
const accumulatedEvidenceWave47 = await readJson('tulip-accumulated-evidence-wave-47.json');
const accumulatedEvidenceWave48 = await readJson('tulip-accumulated-evidence-wave-48.json');
const accumulatedEvidenceWave49 = await readJson('tulip-accumulated-evidence-wave-49.json');
const accumulatedEvidenceWave50 = await readJson('tulip-accumulated-evidence-wave-50.json');
const accumulatedEvidenceWave51 = await readJson('tulip-accumulated-evidence-wave-51.json');
const accumulatedEvidenceWave52 = await readJson('tulip-accumulated-evidence-wave-52.json');
const accumulatedEvidenceWave53 = await readJson('tulip-accumulated-evidence-wave-53.json');
const accumulatedEvidenceWave54 = await readJson('tulip-accumulated-evidence-wave-54.json');
const accumulatedEvidenceWave55 = await readJson('tulip-accumulated-evidence-wave-55.json');
const accumulatedEvidenceWave56 = await readJson('tulip-accumulated-evidence-wave-56.json');
const accumulatedEvidenceWave57 = await readJson('tulip-accumulated-evidence-wave-57.json');
const accumulatedEvidenceWave58 = await readJson('tulip-accumulated-evidence-wave-58.json');
const accumulatedEvidenceWave59 = await readJson('tulip-accumulated-evidence-wave-59.json');
const accumulatedEvidenceWave60 = await readJson('tulip-accumulated-evidence-wave-60.json');
const accumulatedEvidenceWave61 = await readJson('tulip-accumulated-evidence-wave-61.json');
const accumulatedEvidenceWave62 = await readJson('tulip-accumulated-evidence-wave-62.json');
const accumulatedEvidenceWave63 = await readJson('tulip-accumulated-evidence-wave-63.json');
const accumulatedEvidenceWave64 = await readJson('tulip-accumulated-evidence-wave-64.json');
const accumulatedEvidenceWave65 = await readJson('tulip-accumulated-evidence-wave-65.json');
const accumulatedEvidenceWave66 = await readJson('tulip-accumulated-evidence-wave-66.json');
const accumulatedEvidenceWave67 = await readJson('tulip-accumulated-evidence-wave-67.json');
const accumulatedEvidenceWave68 = await readJson('tulip-accumulated-evidence-wave-68.json');
const accumulatedEvidenceWave69 = await readJson('tulip-accumulated-evidence-wave-69.json');
const accumulatedEvidenceWave70 = await readJson('tulip-accumulated-evidence-wave-70.json');
const accumulatedEvidenceWave71 = await readJson('tulip-accumulated-evidence-wave-71.json');
const accumulatedEvidenceWave72 = await readJson('tulip-accumulated-evidence-wave-72.json');
const accumulatedEvidenceWave73 = await readJson('tulip-accumulated-evidence-wave-73.json');
const accumulatedEvidenceWave74 = await readJson('tulip-accumulated-evidence-wave-74.json');
const accumulatedEvidenceWave75 = await readJson('tulip-accumulated-evidence-wave-75.json');
const accumulatedEvidenceWave76 = await readJson('tulip-accumulated-evidence-wave-76.json');
const accumulatedEvidenceWave77 = await readJson('tulip-accumulated-evidence-wave-77.json');
const accumulatedEvidenceWave78 = await readJson('tulip-accumulated-evidence-wave-78.json');
const accumulatedEvidenceWave79 = await readJson('tulip-accumulated-evidence-wave-79.json');
const accumulatedEvidenceWave80 = await readJson('tulip-accumulated-evidence-wave-80.json');
const accumulatedEvidenceWave81 = await readJson('tulip-accumulated-evidence-wave-81.json');
const accumulatedEvidenceWave82 = await readJson('tulip-accumulated-evidence-wave-82.json');
const accumulatedEvidenceWave83 = await readJson('tulip-accumulated-evidence-wave-83.json');
const accumulatedEvidenceWave84 = await readJson('tulip-accumulated-evidence-wave-84.json');
const accumulatedEvidenceWave85 = await readJson('tulip-accumulated-evidence-wave-85.json');
const accumulatedEvidenceWave86 = await readJson('tulip-accumulated-evidence-wave-86.json');
const accumulatedEvidenceWave87 = await readJson('tulip-accumulated-evidence-wave-87.json');
const accumulatedEvidenceWave88 = await readJson('tulip-accumulated-evidence-wave-88.json');
const accumulatedEvidenceWave89 = await readJson('tulip-accumulated-evidence-wave-89.json');
const accumulatedEvidenceWave90 = await readJson('tulip-accumulated-evidence-wave-90.json');
const accumulatedEvidenceWave91 = await readJson('tulip-accumulated-evidence-wave-91.json');
const accumulatedEvidenceWave92 = await readJson('tulip-accumulated-evidence-wave-92.json');
const accumulatedEvidenceWave93 = await readJson('tulip-accumulated-evidence-wave-93.json');
const accumulatedEvidenceWave94 = await readJson('tulip-accumulated-evidence-wave-94.json');
const accumulatedEvidenceWave95 = await readJson('tulip-accumulated-evidence-wave-95.json');
const accumulatedEvidenceWave96 = await readJson('tulip-accumulated-evidence-wave-96.json');
const accumulatedEvidenceWave97 = await readJson('tulip-accumulated-evidence-wave-97.json');
const accumulatedEvidenceWave98 = await readJson('tulip-accumulated-evidence-wave-98.json');
const currentEvidenceWave30 = await readJson('tulip-current-evidence-wave-30.json');
const currentEvidenceWave31 = await readJson('tulip-current-evidence-wave-31.json');
const currentEvidenceWave32 = await readJson('tulip-current-evidence-wave-32.json');
const currentEvidenceWave33 = await readJson('tulip-current-evidence-wave-33.json');
const currentEvidenceWave34 = await readJson('tulip-current-evidence-wave-34.json');
const currentEvidenceWave35 = await readJson('tulip-current-evidence-wave-35.json');
const currentEvidenceWave36 = await readJson('tulip-current-evidence-wave-36.json');
const currentEvidenceWave37 = await readJson('tulip-current-evidence-wave-37.json');
const currentEvidenceWave38 = await readJson('tulip-current-evidence-wave-38.json');
const currentEvidenceWave39 = await readJson('tulip-current-evidence-wave-39.json');
const currentEvidenceWave40 = await readJson('tulip-current-evidence-wave-40.json');
const currentEvidenceWave41 = await readJson('tulip-current-evidence-wave-41.json');
const currentEvidenceWave42 = await readJson('tulip-current-evidence-wave-42.json');
const currentEvidenceWave43 = await readJson('tulip-current-evidence-wave-43.json');
const currentEvidenceWave44 = await readJson('tulip-current-evidence-wave-44.json');
const currentEvidenceWave45 = await readJson('tulip-current-evidence-wave-45.json');
const currentEvidenceWave46 = await readJson('tulip-current-evidence-wave-46.json');
const currentEvidenceWave47 = await readJson('tulip-current-evidence-wave-47.json');
const currentEvidenceWave48 = await readJson('tulip-current-evidence-wave-48.json');
const currentEvidenceWave49 = await readJson('tulip-current-evidence-wave-49.json');
const currentEvidenceWave50 = await readJson('tulip-current-evidence-wave-50.json');
const currentEvidenceWave51 = await readJson('tulip-current-evidence-wave-51.json');
const currentEvidenceWave52 = await readJson('tulip-current-evidence-wave-52.json');

const [pilotRegistry, accumulatedEvidenceWave1, accumulatedEvidenceWave2, accumulatedEvidenceWave3, accumulatedEvidenceWave4, accumulatedEvidenceWave5, accumulatedEvidenceWave6, accumulatedEvidenceWave7, accumulatedEvidenceWave8, accumulatedEvidenceWave9, accumulatedEvidenceWave10, accumulatedEvidenceWave11, accumulatedEvidenceWave12, accumulatedEvidenceWave13, accumulatedEvidenceWave14, accumulatedEvidenceWave15, accumulatedEvidenceWave16, accumulatedEvidenceWave17, accumulatedEvidenceWave18, accumulatedEvidenceWave19, accumulatedEvidenceWave20, accumulatedEvidenceWave21, currentEvidenceWave2, currentEvidenceWave3, currentEvidenceWave4, currentEvidenceWave5, currentEvidenceWave6, currentEvidenceWave7, currentEvidenceWave8, currentEvidenceWave9, currentEvidenceWave10, currentEvidenceWave11, currentEvidenceWave12, currentEvidenceWave13, currentEvidenceWave14, currentEvidenceWave15, currentEvidenceWave16, currentEvidenceWave17, currentEvidenceWave18, currentEvidenceWave19, currentEvidenceWave20, currentEvidenceWave21, currentEvidenceWave22, currentEvidenceWave23, currentEvidenceWave24, currentEvidenceWave25, currentEvidenceWave26, currentEvidenceWave27, currentEvidenceWave28, currentEvidenceWave29, lineage] = await Promise.all([
  readJson('tulip-urgency-pilot-scores.json'),
  readJson('tulip-accumulated-evidence-wave-1.json'),
  readJson('tulip-accumulated-evidence-wave-2.json'),
  readJson('tulip-accumulated-evidence-wave-3.json'),
  readJson('tulip-accumulated-evidence-wave-4.json'),
  readJson('tulip-accumulated-evidence-wave-5.json'),
  readJson('tulip-accumulated-evidence-wave-6.json'),
  readJson('tulip-accumulated-evidence-wave-7.json'),
  readJson('tulip-accumulated-evidence-wave-8.json'),
  readJson('tulip-accumulated-evidence-wave-9.json'),
  readJson('tulip-accumulated-evidence-wave-10.json'),
  readJson('tulip-accumulated-evidence-wave-11.json'),
  readJson('tulip-accumulated-evidence-wave-12.json'),
  readJson('tulip-accumulated-evidence-wave-13.json'),
  readJson('tulip-accumulated-evidence-wave-14.json'),
  readJson('tulip-accumulated-evidence-wave-15.json'),
  readJson('tulip-accumulated-evidence-wave-16.json'),
  readJson('tulip-accumulated-evidence-wave-17.json'),
  readJson('tulip-accumulated-evidence-wave-18.json'),
  readJson('tulip-accumulated-evidence-wave-19.json'),
  readJson('tulip-accumulated-evidence-wave-20.json'),
  readJson('tulip-accumulated-evidence-wave-21.json'),
  readJson('tulip-current-evidence-wave-2.json'),
  readJson('tulip-current-evidence-wave-3.json'),
  readJson('tulip-current-evidence-wave-4.json'),
  readJson('tulip-current-evidence-wave-5.json'),
  readJson('tulip-current-evidence-wave-6.json'),
  readJson('tulip-current-evidence-wave-7.json'),
  readJson('tulip-current-evidence-wave-8.json'),
  readJson('tulip-current-evidence-wave-9.json'),
  readJson('tulip-current-evidence-wave-10.json'),
  readJson('tulip-current-evidence-wave-11.json'),
  readJson('tulip-current-evidence-wave-12.json'),
  readJson('tulip-current-evidence-wave-13.json'),
  readJson('tulip-current-evidence-wave-14.json'),
  readJson('tulip-current-evidence-wave-15.json'),
  readJson('tulip-current-evidence-wave-16.json'),
  readJson('tulip-current-evidence-wave-17.json'),
  readJson('tulip-current-evidence-wave-18.json'),
  readJson('tulip-current-evidence-wave-19.json'),
  readJson('tulip-current-evidence-wave-20.json'),
  readJson('tulip-current-evidence-wave-21.json'),
  readJson('tulip-current-evidence-wave-22.json'),
  readJson('tulip-current-evidence-wave-23.json'),
  readJson('tulip-current-evidence-wave-24.json'),
  readJson('tulip-current-evidence-wave-25.json'),
  readJson('tulip-current-evidence-wave-26.json'),
  readJson('tulip-current-evidence-wave-27.json'),
  readJson('tulip-current-evidence-wave-28.json'),
  readJson('tulip-current-evidence-wave-29.json'),
  readJson('pipeline-lineage-registry.json')
]);

const receiptByNodeId = new Map(pilotRegistry.receipts.map(receipt => [receipt.node_id, receipt]));
for (const receipt of accumulatedEvidenceWave1.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave2.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave3.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave4.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave5.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave6.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave7.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave8.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave9.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave10.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave11.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave12.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave13.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave14.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave15.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave16.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave17.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave18.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave19.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave20.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave21.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave22.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave23.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave24.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave25.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave26.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave27.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave28.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave29.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave30.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave31.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave32.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave33.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave34.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave35.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave36.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave37.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave38.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave39.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave40.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave41.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave42.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave43.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave44.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave45.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave46.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave47.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave48.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave49.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave50.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave51.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave52.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave53.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave54.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave55.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave56.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave57.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave58.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave59.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave60.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave61.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave62.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave63.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave64.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave65.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave66.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave67.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave68.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave69.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave70.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave71.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave72.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave73.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave74.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave75.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave76.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave77.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave78.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave79.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave80.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave81.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave82.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave83.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave84.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave85.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave86.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave87.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave88.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave89.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave90.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave91.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave92.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave93.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave94.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave95.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave96.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave97.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of accumulatedEvidenceWave98.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave2.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave3.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave4.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave5.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave6.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave7.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave8.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave9.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave10.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave11.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave12.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave13.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave14.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave15.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave16.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave17.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave18.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave19.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave20.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave21.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave22.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave23.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave24.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave25.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave26.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave27.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave28.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave29.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave30.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave31.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave32.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave33.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave34.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave35.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave36.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave37.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave38.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave39.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave40.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave41.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave42.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave43.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave44.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave45.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave46.receipts) {
  const existing = receiptByNodeId.get(receipt.node_id);
  if (existing?.input_hash === receipt.input_hash) continue;
  const isPilotCurrentRefresh = existing?.method === 'current_data' && receipt.method === 'current_data' && receipt.node_id === 'environ_anomalies';
  if (existing && existing.method !== 'modeled' && !isPilotCurrentRefresh) throw new Error(`Evidence wave duplicates an existing non-modeled receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave47.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave48.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave49.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave50.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave51.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
for (const receipt of currentEvidenceWave52.receipts) {
  if (receiptByNodeId.has(receipt.node_id)) throw new Error(`Evidence wave duplicates an existing receipt for ${receipt.node_id}`);
  receiptByNodeId.set(receipt.node_id, receipt);
}
const nodeById = new Map(NODES.map(node => [node.id, node]));
const lineageBindingsByNodeId = new Map();
for (const pipeline of lineage.pipelines ?? []) {
  for (const binding of pipeline.bindings ?? []) {
    const nodeId = binding.canonical_node_id;
    if (!nodeId || !nodeById.has(nodeId)) continue;
    const list = lineageBindingsByNodeId.get(nodeId) ?? [];
    list.push({
      pipeline_id: pipeline.pipeline_id,
      metric_contract_id: binding.metric_contract_id,
      measurement_role: binding.measurement_role ?? null,
      source_id: pipeline.source?.id ?? null,
      snapshot_path: pipeline.snapshot?.path ?? null,
      snapshot_sha256: pipeline.snapshot?.sha256 ?? null,
      snapshot_observed_at: pipeline.snapshot?.observed_at ?? null
    });
    lineageBindingsByNodeId.set(nodeId, list);
  }
}

const anchorReceipts = pilotRegistry.receipts.filter(receipt => receipt.method !== 'modeled');
const anchorComposites = new Map(anchorReceipts.map(receipt => [receipt.node_id, (receipt.value - 1) / 9]));
const globalAnchorMean = [...anchorComposites.values()].reduce((sum, value) => sum + value, 0) / anchorComposites.size;
const pilotCalibrationShift = anchorReceipts.reduce((sum, receipt) => {
  const legacy = (nodeById.get(receipt.node_id).score.baseline - 1) / 9;
  return sum + ((receipt.value - 1) / 9 - legacy);
}, 0) / anchorReceipts.length;

const anchorIdsBySphere = new Map();
for (const [nodeId] of anchorComposites) {
  const sphere = nodeById.get(nodeId)?.sphere;
  if (!sphere) continue;
  const ids = anchorIdsBySphere.get(sphere) ?? [];
  ids.push(nodeId);
  anchorIdsBySphere.set(sphere, ids);
}

const SPEED_FACTOR = Object.freeze({ fast: 0.52, medium: 0.68, slow: 0.84 });
const REACH_FACTOR = Object.freeze({ local: 0.45, regional: 0.72, global: 0.95 });
const ROLE_FACTOR = Object.freeze({ operational_indicator: 0.62, phenomenon: 0.78, authored_root_driver: 0.72, response: 0.62 });

function relationshipPeerEstimate(node) {
  const relationships = EDGES
    .filter(edge => edge.source === node.id || edge.target === node.id)
    .map(edge => ({
      peer_node_id: edge.source === node.id ? edge.target : edge.source,
      influence: Number.isFinite(edge.influence) ? edge.influence : null
    }))
    .filter(item => anchorComposites.has(item.peer_node_id) && Number.isFinite(item.influence) && item.influence > 0);

  if (relationships.length) {
    const totalInfluence = relationships.reduce((sum, item) => sum + item.influence, 0);
    return {
      value: relationships.reduce((sum, item) => sum + anchorComposites.get(item.peer_node_id) * item.influence, 0) / totalInfluence,
      basis: 'reviewed_relationship_weighted_peer_mean',
      peers: relationships
    };
  }

  const spherePeerIds = anchorIdsBySphere.get(node.sphere) ?? [];
  if (spherePeerIds.length) {
    return {
      value: spherePeerIds.reduce((sum, id) => sum + anchorComposites.get(id), 0) / spherePeerIds.length,
      basis: 'same_domain_anchor_mean',
      peers: spherePeerIds.map(peer_node_id => ({ peer_node_id }))
    };
  }

  return {
    value: globalAnchorMean,
    basis: 'global_measured_and_impact_anchor_mean',
    peers: anchorReceipts.map(receipt => ({ peer_node_id: receipt.node_id }))
  };
}

function contractEstimate(node) {
  const speed = node.context?.speed ?? 'medium';
  const reach = node.context?.reach ?? 'regional';
  const role = node.graph_contract?.node_class ?? 'phenomenon';
  const factors = {
    persistence: SPEED_FACTOR[speed] ?? SPEED_FACTOR.medium,
    geographic_reach: REACH_FACTOR[reach] ?? REACH_FACTOR.regional,
    causal_role: ROLE_FACTOR[role] ?? ROLE_FACTOR.phenomenon
  };
  return {
    value: 0.40 * factors.persistence + 0.35 * factors.geographic_reach + 0.25 * factors.causal_role,
    factors,
    reviewed_contract_values: { speed, reach, node_class: role }
  };
}

function modeledReceipt(node) {
  const legacyComposite = (node.score.baseline - 1) / 9;
  const peer = relationshipPeerEstimate(node);
  const contract = contractEstimate(node);
  const modeledEstimate = clamp01(
    0.60 * legacyComposite
    + 0.22 * peer.value
    + 0.18 * contract.value
    + pilotCalibrationShift
  );
  const operationalLineage = lineageBindingsByNodeId.get(node.id) ?? [];
  const sourceIds = [...new Set([
    node.metric_contract?.source_id,
    ...operationalLineage.map(binding => binding.source_id)
  ].filter(Boolean))];
  const currentFailure = Number.isFinite(node.calibration?.metric?.current_value)
    ? 'A current indicator exists, but the full current-data receipt lacks defensible coverage for momentum and remaining components.'
    : 'No reviewed current global observation supplies the required magnitude-plus-threshold-or-momentum coverage.';
  const impactFailure = operationalLineage.length
    ? 'Operational data covers fewer than all four reviewed accumulated-impact components, so the binding remains model metadata rather than being mislabeled evidence-backed urgency.'
    : 'No reviewed four-component accumulated-impact contract is bound to this node.';

  return buildTulipUrgencyReceipt({
    node_id: node.id,
    method: 'modeled',
    model_version: MODEL_VERSION,
    as_of: node.update_policy?.last_updated ?? node.calibration?.reviewed_at ?? '2026-07-31',
    components: { modeled_estimate: Number(modeledEstimate.toFixed(6)) },
    raw_inputs: {
      reviewed_legacy_vector: {
        value: Number(legacyComposite.toFixed(6)),
        baseline_score: node.score.baseline,
        vector: node.vector,
        weight: 0.60
      },
      peer_calibration: {
        value: Number(peer.value.toFixed(6)),
        basis: peer.basis,
        peers: peer.peers,
        weight: 0.22
      },
      reviewed_contract_factors: {
        value: Number(contract.value.toFixed(6)),
        ...contract,
        weight: 0.18
      },
      pilot_calibration_shift: Number(pilotCalibrationShift.toFixed(6)),
      operational_lineage: operationalLineage
    },
    transformations: [{
      type: 'named_global_modeled_estimate',
      formula: 'clamp01(0.60 × reviewed legacy composite + 0.22 × relationship/same-domain peer estimate + 0.18 × reviewed persistence/reach/causal-role factor + pilot calibration shift)',
      exclusions: ['graph degree', 'node popularity', 'source count', 'research volume']
    }],
    source_ids: sourceIds,
    uncertainty: operationalLineage.length
      ? 'Modeled estimate. Operational lineage is retained, but available observations do not cover all required urgency components.'
      : 'Modeled estimate based on reviewed vectors, peer calibration and reviewed node contracts; no complete measured receipt is available.',
    freshness: operationalLineage.length ? 'model refreshed with operational lineage metadata' : 'model refreshed with graph contract release',
    selection_reason: {
      selected_method_passed: `Deterministic ${MODEL_VERSION} receipt passes the modeled fallback gate.`,
      higher_priority_failures: [currentFailure, impactFailure]
    }
  });
}

for (const node of issueNodes) {
  if (!receiptByNodeId.has(node.id)) receiptByNodeId.set(node.id, modeledReceipt(node));
}

const receipts = issueNodes.map(node => receiptByNodeId.get(node.id));
for (const receipt of receipts) {
  if (!verifyTulipUrgencyReceipt(receipt).valid) throw new Error(`Receipt verification failed for ${receipt.node_id}`);
}

const rankedLegacy = [...issueNodes].sort((a, b) => b.score.baseline - a.score.baseline).map(node => node.id);
const rankedV2 = [...receipts].sort((a, b) => b.value - a.value).map(receipt => receipt.node_id);

function sensitivityRange(receipt) {
  const scores = [];
  if (receipt.method === 'modeled') {
    if (receipt.model_version !== MODEL_VERSION) {
      return { minimum: receipt.value, maximum: receipt.value, max_delta: 0, rank_unstable: false, note: 'Named pilot model retained without global-weight perturbation.' };
    }
    const values = {
      legacy: receipt.raw_inputs.reviewed_legacy_vector?.value ?? receipt.raw_inputs.legacy_reviewed_composite?.value,
      peer: receipt.raw_inputs.peer_calibration?.value ?? receipt.raw_inputs.measured_atmosphere_peer_mean?.value,
      contract: receipt.raw_inputs.reviewed_contract_factors?.value ?? receipt.raw_inputs.reviewed_contract_factor_mean?.value
    };
    if (!Object.values(values).every(Number.isFinite)) throw new Error(`Modeled sensitivity inputs missing for ${receipt.node_id}`);
    const baseWeights = { legacy: 0.60, peer: 0.22, contract: 0.18 };
    for (const selected of Object.keys(baseWeights)) {
      for (const multiplier of [0.8, 1.2]) {
        const changed = { ...baseWeights, [selected]: baseWeights[selected] * multiplier };
        const total = Object.values(changed).reduce((sum, value) => sum + value, 0);
        const composite = Object.entries(changed).reduce((sum, [key, weight]) => sum + values[key] * weight / total, 0) + pilotCalibrationShift;
        scores.push(compositeToTulipScore(clamp01(composite)));
      }
    }
  } else {
    const baseWeights = TULIP_URGENCY_WEIGHTS[receipt.method];
    for (const selected of Object.keys(baseWeights)) {
      for (const multiplier of [0.8, 1.2]) {
        const changed = { ...baseWeights, [selected]: baseWeights[selected] * multiplier };
        const total = Object.values(changed).reduce((sum, value) => sum + value, 0);
        const normalized = Object.fromEntries(Object.entries(changed).map(([key, value]) => [key, value / total]));
        scores.push(compositeToTulipScore(calculateComposite(receipt.method, receipt.components, normalized)));
      }
    }
  }
  return {
    minimum: Math.min(...scores),
    maximum: Math.max(...scores),
    max_delta: Number(Math.max(...scores.map(score => Math.abs(score - receipt.value))).toFixed(1)),
    rank_unstable: false
  };
}

const comparison = receipts.map(receipt => {
  const node = nodeById.get(receipt.node_id);
  const legacyScore = node.score.baseline;
  const legacyBand = getTulipUrgencyBand(legacyScore);
  return {
    node_id: node.id,
    node_name: node.name,
    sphere: node.sphere,
    legacy_score: legacyScore,
    legacy_band: legacyBand,
    v2_score: receipt.value,
    v2_band: receipt.band,
    score_delta: Number((receipt.value - legacyScore).toFixed(1)),
    legacy_rank: rankedLegacy.indexOf(node.id) + 1,
    v2_rank: rankedV2.indexOf(node.id) + 1,
    rank_change: rankedLegacy.indexOf(node.id) - rankedV2.indexOf(node.id),
    band_change: legacyBand === receipt.band ? 'unchanged' : `${legacyBand} → ${receipt.band}`,
    method: receipt.method,
    model_version: receipt.model_version ?? null,
    has_operational_lineage: (lineageBindingsByNodeId.get(node.id) ?? []).length > 0,
    sensitivity: sensitivityRange(receipt)
  };
});

for (const row of comparison) {
  row.sensitivity.rank_unstable = comparison.some(other => other.node_id !== row.node_id
    && other.v2_score >= row.sensitivity.minimum
    && other.v2_score <= row.sensitivity.maximum);
}

const methodCounts = Object.fromEntries(['current_data', 'impact_fallback', 'modeled']
  .map(method => [method, receipts.filter(receipt => receipt.method === method).length]));
const registry = {
  version: '2.0.0',
  method_version: METHOD_VERSION,
  model_version: MODEL_VERSION,
  status: 'approved',
  generated_at: new Date().toISOString(),
  production_scores_replaced: true,
  scope: 'all_issue_nodes',
  issue_node_count: issueNodes.length,
  excluded_response_node_ids: responseNodes.map(node => node.id),
  method_counts: methodCounts,
  receipts
};
const rolloutReport = {
  version: '2.0.0',
  method_version: METHOD_VERSION,
  model_version: MODEL_VERSION,
  status: registry.status,
  generated_at: registry.generated_at,
  summary: {
    graph_nodes: NODES.length,
    scored_issue_nodes: issueNodes.length,
    excluded_response_nodes: responseNodes.length,
    operationally_bound_issue_nodes: issueNodes.filter(node => lineageBindingsByNodeId.has(node.id)).length,
    ...methodCounts
  },
  comparison
};

const tableRows = [...comparison]
  .sort((a, b) => a.v2_rank - b.v2_rank)
  .map(row => `| ${row.v2_rank} | ${row.node_name} | ${row.sphere} | ${row.legacy_score.toFixed(1)} | ${row.v2_score.toFixed(1)} | ${row.score_delta > 0 ? '+' : ''}${row.score_delta.toFixed(1)} | ${row.v2_band} | \`${row.method}\` |`)
  .join('\n');
const markdown = `# TULIP Urgency v2 — Full-Graph Rollout\n\nStatus: **approved**. V2 receipts are the production urgency source for every issue node. Response nodes remain excluded and retain leverage scoring.\n\n## Coverage\n\n- Graph nodes: ${NODES.length}\n- Scored issue nodes: ${issueNodes.length}\n- Excluded response nodes: ${responseNodes.length}\n- Current data: ${methodCounts.current_data}\n- Accumulated-impact fallback: ${methodCounts.impact_fallback}\n- Modeled: ${methodCounts.modeled}\n\n## All issue nodes\n\n| V2 rank | Node | Domain | Legacy | V2 | Delta | Band | Method |\n|---:|---|---|---:|---:|---:|---|---|\n${tableRows}\n`;

await Promise.all([
  fs.writeFile(path.join(PUBLIC, 'tulip-urgency-scores.json'), `${JSON.stringify(registry, null, 2)}\n`),
  fs.writeFile(path.join(PUBLIC, 'tulip-urgency-rollout-comparison.json'), `${JSON.stringify(rolloutReport, null, 2)}\n`),
  fs.writeFile(path.join(ROOT, 'docs', 'tulip-urgency-v2-rollout-report.md'), markdown)
]);

console.log(`Exported ${receipts.length} approved TULIP urgency v2 receipts; excluded ${responseNodes.length} response nodes.`);
console.log(`Methods: ${methodCounts.current_data} current, ${methodCounts.impact_fallback} impact fallback, ${methodCounts.modeled} modeled.`);
