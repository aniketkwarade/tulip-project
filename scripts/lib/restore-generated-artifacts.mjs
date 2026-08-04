import fs from 'node:fs';
import path from 'node:path';

export function restoreGeneratedArtifactsOnExit(root, relativePaths) {
  const snapshots = relativePaths.map(relativePath => {
    const absolutePath = path.join(root, relativePath);
    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Expected generated artifact to exist before the test: ${relativePath}`);
    }
    return [absolutePath, fs.readFileSync(absolutePath)];
  });

  process.once('exit', () => {
    snapshots.forEach(([absolutePath, contents]) => {
      fs.writeFileSync(absolutePath, contents);
    });
  });
}
