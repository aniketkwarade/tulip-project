import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PERSONAL_FOOTPRINT_ANNUAL_REFERENCES,
  PERSONAL_FOOTPRINT_BASELINE_SELECTIONS,
  PERSONAL_FOOTPRINT_BENCHMARKS,
  PERSONAL_FOOTPRINT_LABELS,
  PERSONAL_FOOTPRINT_MODULES,
  PERSONAL_FOOTPRINT_PHYSICAL_FACTORS,
  PERSONAL_FOOTPRINT_QUESTIONS,
} from '../../src/personal-footprint-model.js';

const scriptRoot = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(scriptRoot, '../..');
const mobileSourceRoot = resolve(repositoryRoot, 'Stitch Import/tulip-mobile/src');
const destinationRoot = resolve(repositoryRoot, 'iOS/TULIPiOS/NativeData');

await mkdir(destinationRoot, { recursive: true });

for (const fileName of [
  'mobile-node-catalog.json',
  'mobile-inspector-snapshot.json',
  'mobile-activity-snapshot.json',
]) {
  await copyFile(resolve(mobileSourceRoot, fileName), resolve(destinationRoot, fileName));
}

const inspectorProfiles = JSON.parse(
  await readFile(resolve(mobileSourceRoot, 'mobile-inspector-snapshot.json'), 'utf8'),
);
const searchProfiles = Object.fromEntries(
  Object.entries(inspectorProfiles).map(([key, profile]) => [
    key,
    {
      name: profile.name,
      sphere: profile.sphere,
      description: profile.description,
      incoming: (profile.incoming ?? []).slice(0, 12),
      outgoing: (profile.outgoing ?? []).slice(0, 12),
      human: profile.human
        ? {
            summary: profile.human.summary,
            consequences: (profile.human.consequences ?? []).slice(0, 2),
          }
        : null,
      planet: profile.planet
        ? {
            summary: profile.planet.summary,
            consequences: (profile.planet.consequences ?? []).slice(0, 2),
          }
        : null,
      response: profile.response
        ? {
            defaultDriver: profile.response.defaultDriver,
            levers: (profile.response.levers ?? []).slice(0, 2),
          }
        : null,
      measurement: profile.measurement
        ? {
            metric: profile.measurement.metric,
            geography: profile.measurement.geography,
            cadence: profile.measurement.cadence,
          }
        : null,
      recentOccurrences: profile.recentOccurrences
        ? {
            occurrences: (profile.recentOccurrences.occurrences ?? []).slice(0, 1).map((occurrence) => ({
              id: occurrence.id,
              date: occurrence.date,
              place: occurrence.place,
              title: occurrence.title,
              summary: occurrence.summary,
              sources: [],
            })),
          }
        : null,
    },
  ]),
);

await writeFile(
  resolve(destinationRoot, 'mobile-search-snapshot.json'),
  `${JSON.stringify(searchProfiles)}\n`,
  'utf8',
);

const footprintModel = {
  questions: PERSONAL_FOOTPRINT_QUESTIONS,
  baselineSelections: PERSONAL_FOOTPRINT_BASELINE_SELECTIONS,
  labels: PERSONAL_FOOTPRINT_LABELS,
  benchmarks: PERSONAL_FOOTPRINT_BENCHMARKS,
  physicalFactors: PERSONAL_FOOTPRINT_PHYSICAL_FACTORS,
  annualReferences: PERSONAL_FOOTPRINT_ANNUAL_REFERENCES,
  modules: PERSONAL_FOOTPRINT_MODULES,
};

await writeFile(
  resolve(destinationRoot, 'personal-footprint-model.json'),
  `${JSON.stringify(footprintModel)}\n`,
  'utf8',
);

console.log(`Exported shared TULIP native data to ${destinationRoot}`);
