import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { PUBLISHED_NODES } from '../src/data.js';
import { NODE_PHOTOS } from '../src/node-photos.js';
import { projectRuntimeNodeDetail } from '../src/runtime-data-projection.js';

const root = new URL('../', import.meta.url);
const verifyOriginals = process.argv.includes('--originals');
const mobile = JSON.parse(await readFile(new URL('Stitch Import/tulip-mobile/src/mobile-inspector-snapshot.json', root)));
const native = JSON.parse(await readFile(new URL('iOS/TULIPiOS/NativeData/mobile-inspector-snapshot.json', root)));
const ids = new Set(PUBLISHED_NODES.map(n => n.id));
const assets = new Map();
const sourceHashes = new Map();
const assetHashes = new Map();
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// Read JPEG SOF dimensions and EXIF orientation. Full pixel decoding is also
// performed by verify-node-photo-pixels.py when a selection is installed.
function jpegDimensions(bytes) {
  assert.equal(bytes.readUInt16BE(0), 0xffd8, 'Expected JPEG');
  let size, orientation = 1;
  for (let offset = 2; offset < bytes.length;) {
    assert.equal(bytes[offset++], 0xff, 'Invalid JPEG marker');
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || marker >= 0xd0 && marker <= 0xd7) continue;
    const length = bytes.readUInt16BE(offset);
    assert(length >= 2 && offset + length <= bytes.length, 'Truncated JPEG');
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker)) {
      size = [bytes.readUInt16BE(offset + 5), bytes.readUInt16BE(offset + 3)];
    }
    if (marker === 0xe1 && bytes.subarray(offset + 2, offset + 8).toString() === 'Exif\0\0') {
      const tiff = offset + 8;
      const little = bytes.toString('ascii', tiff, tiff + 2) === 'II';
      const u16 = p => little ? bytes.readUInt16LE(p) : bytes.readUInt16BE(p);
      const u32 = p => little ? bytes.readUInt32LE(p) : bytes.readUInt32BE(p);
      const ifd = tiff + u32(tiff + 4);
      for (let i = 0; i < u16(ifd); i++) {
        const entry = ifd + 2 + i * 12;
        if (u16(entry) === 0x112) orientation = u16(entry + 8);
      }
    }
    offset += length;
  }
  assert(size, 'JPEG dimensions missing');
  return orientation >= 5 && orientation <= 8 ? size.reverse() : size;
}

for (const [id, photo] of Object.entries(NODE_PHOTOS)) {
  assert(ids.has(id), `Unpublished photo ID: ${id}`);
  assert.match(photo.asset, /^\/node-photos\/[a-z0-9-]+\.jpg$/);
  assert.equal(photo.width, 2400); assert.equal(photo.height, 1350);
  assert(photo.sourceWidth >= 2400 && photo.sourceHeight >= 1350, `Upscaling required: ${id}`);
  for (const key of ['alt','caption','credit','license']) assert(photo[key]?.trim(), `Missing ${key}: ${id}`);
  for (const key of ['sourceUrl','sourceImageUrl','licenseUrl']) assert.equal(new URL(photo[key]).protocol, 'https:');
  if (photo.creditUrl) assert.equal(new URL(photo.creditUrl).protocol, 'https:');
  assert(['Direct photograph','Context photograph'].includes(photo.matchType));
  const hybritEditorial = id === 'green_steel'
    && photo.license === 'HYBRIT editorial permission'
    && photo.licenseUrl === 'https://www.hybritdevelopment.se/en/contact/media-bank/'
    && photo.sourceUrl === 'https://www.hybritdevelopment.se/en/media/hybrit-pilot-plant-direct-reduction-lulea-2/'
    && photo.sourceImageUrl === 'https://www.hybritdevelopment.se/wp-content/uploads/2023/08/pilotanlaggning-20-06-02.jpg'
    && photo.caption.includes('HYBRIT');
  assert(hybritEditorial || /^(CC BY(?:-SA)?(?: \d(?:\.\d)?(?: [A-Za-z]+)?)?|CC0(?: 1\.0)?|Public domain|Unsplash License|Pexels License)$/.test(photo.license), `Unsupported reuse license: ${id}`);
  assert(!assets.has(photo.asset), `Photograph asset reused by ${id}`);
  assert(!sourceHashes.has(photo.sourceSha256), `Original photograph reused by ${id} and ${sourceHashes.get(photo.sourceSha256)}`);
  assert(!assetHashes.has(photo.assetSha256), `Shipped photograph reused by ${id} and ${assetHashes.get(photo.assetSha256)}`);
  assets.set(photo.asset, photo);
  sourceHashes.set(photo.sourceSha256, id);
  assetHashes.set(photo.assetSha256, id);
}
for (const node of PUBLISHED_NODES) {
  const expected = NODE_PHOTOS[node.id] || null;
  assert.deepEqual(projectRuntimeNodeDetail(node).photo, expected, `Desktop metadata: ${node.id}`);
  assert.deepEqual(mobile[node.name.toLowerCase()].photo ?? null, expected, `Mobile metadata: ${node.id}`);
  assert.deepEqual(native[node.name.toLowerCase()].photo ?? null, expected, `Native metadata: ${node.id}`);
}
for (const [asset, photo] of assets) {
  const name = asset.split('/').at(-1);
  // Original publisher downloads are an import-time audit (2.5 GB), not release assets.
  if (verifyOriginals) {
    const original = await readFile(new URL(`artifacts/inspector-photographs-2026-09-28/originals/${name}`, root));
    // Publishers also supply TIFF and PNG originals; only shipped assets must be JPEG.
    const originalSize = original.readUInt16BE(0) === 0xffd8
      ? jpegDimensions(original)
      : JSON.parse(execFileSync('python3', ['-c', 'import io,json,sys; from PIL import Image,ImageOps; print(json.dumps(ImageOps.exif_transpose(Image.open(io.BytesIO(sys.stdin.buffer.read()))).size))'], {input: original, maxBuffer: 1024 * 1024}).toString());
    assert.deepEqual(originalSize, [photo.sourceWidth, photo.sourceHeight], `Original pixels: ${name}`);
    assert.equal(hash(original), photo.sourceSha256);
  }
  for (const folder of ['public', 'Stitch Import/tulip-mobile/public']) {
    const bytes = await readFile(new URL(`${folder}${asset}`, root));
    assert.deepEqual(jpegDimensions(bytes), [2400, 1350], `Shipped pixels: ${folder}/${name}`);
    assert.equal(hash(bytes), photo.assetSha256, `Asset parity: ${folder}/${name}`);
  }
}
for (const folder of ['public','Stitch Import/tulip-mobile/public']) {
  const files = await readdir(new URL(`${folder}/node-photos/`, root));
  assert.deepEqual(files.sort(), [...assets.keys()].map(a => a.split('/').at(-1)).sort(), `Unexpected derivatives or orphaned photos: ${folder}`);
}
console.log(`Photo contract passed: ${assets.size} photographs, ${Object.keys(NODE_PHOTOS).length} nodes; ${verifyOriginals ? "source pixels, " : ""}2400×1350 JPEG assets, attribution and web/mobile parity.`);
