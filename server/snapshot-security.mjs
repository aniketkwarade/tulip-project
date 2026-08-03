import path from 'node:path';

const PNG_SIGNATURE = Buffer.from('89504e470d0a1a0a', 'hex');
const SNAPSHOT_RELATIVE_DIR = path.join('tmp', 'snapshots');
const SNAPSHOT_FILENAME = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.png$/;

export function resolveSnapshotPath(root, requestedPath) {
  const outputDirectory = path.join(root, SNAPSHOT_RELATIVE_DIR);
  const resolvedPath = path.resolve(root, String(requestedPath || ''));
  if (
    path.dirname(resolvedPath) !== outputDirectory
    || !SNAPSHOT_FILENAME.test(path.basename(resolvedPath))
  ) {
    throw new Error('Snapshot path must be a PNG directly inside tmp/snapshots.');
  }
  return resolvedPath;
}

export function decodeSnapshotPng(image, maxBytes = 6 * 1024 * 1024) {
  const match = /^data:image\/png;base64,([a-zA-Z0-9+/]+={0,2})$/.exec(String(image || ''));
  if (!match || match[1].length % 4 === 1) {
    throw new Error('Snapshot image must be a base64 PNG data URL.');
  }
  const buffer = Buffer.from(match[1], 'base64');
  if (buffer.length > maxBytes) throw new Error('Snapshot image is too large.');
  if (buffer.length < PNG_SIGNATURE.length || !buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
    throw new Error('Snapshot image does not contain a PNG signature.');
  }
  return buffer;
}

export function isAllowedSnapshotOrigin(origin, allowedOrigins) {
  if (!origin) return true;
  try {
    return allowedOrigins.has(new URL(origin).origin);
  } catch {
    return false;
  }
}
