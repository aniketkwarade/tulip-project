import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AGRICULTURE_SNAPSHOT_PATH = 'public/faostat-agriculture-snapshot.json';
const agriculture = JSON.parse(await fs.readFile(path.join(ROOT, AGRICULTURE_SNAPSHOT_PATH), 'utf8'));
const meadowValuesThousandHa = [
  3178767.03, 3182070.8, 3181453.62, 3184926.09, 3191078.37, 3192351.57, 3195430.13, 3217754.12,
  3218093.51, 3202595.28, 3215053.83, 3219061.09, 3222094.46, 3226630.13, 3227567.4, 3217001.11,
  3211247.48, 3211161.42, 3207618.92, 3212440.1, 3208732.63, 3208925.32, 3205877.18, 3210782.66,
  3220486.77, 3211495, 3218515.82, 3230720.31, 3236575.9, 3238643.73, 3234178.5, 3270649.39,
  3247977.78, 3264500.88, 3262441.1, 3269742.42, 3283183.43, 3295561.18, 3292820.98, 3297896.79,
  3296418.31, 3288596.21, 3264109.29, 3216169.13, 3217336.01, 3214875.18, 3202354.8, 3187207.72,
  3175054.93, 3172424.47, 3182078.85, 3171900.9, 3155196.91, 3150035.84, 3120601.65, 3112020.1,
  3136156.56, 3118119.19, 3103286.91, 3078359.59, 3068421.6, 3063089.8, 3059474.36, 3058558.71
];
const meadowByYear = new Map(meadowValuesThousandHa.map((value, index) => [1961 + index, value]));
const cattle = agriculture.records
  .filter(record => record.area === 'World' && record.item === 'Cattle' && record.element === 'Stocks' && Number.isFinite(record.value))
  .sort((left, right) => left.year - right.year);
const records = cattle
  .filter(record => meadowByYear.has(record.year))
  .map(record => {
    const permanentMeadowsAndPasturesThousandHa = meadowByYear.get(record.year);
    return {
      year: record.year,
      cattle_head: record.value,
      permanent_meadows_and_pastures_thousand_ha: permanentMeadowsAndPasturesThousandHa,
      cattle_per_permanent_meadow_pasture_ha: Number((record.value / (permanentMeadowsAndPasturesThousandHa * 1000)).toFixed(9)),
      cattle_source_flag: record.source_flag,
      meadow_source_flag: 'E'
    };
  });
if (records.length !== 64) throw new Error(`Expected 64 complete FAOSTAT cattle/pasture years, received ${records.length}.`);

const qclRelease = agriculture.releases.find(release => release.dataset_code === 'QCL');
const snapshot = {
  version: 'faostat_world_cattle_stocking_density_1961_2024_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  source: {
    id: 'faostat_land_use_and_livestock_stock_density',
    name: 'FAOSTAT Production: Crops and livestock products + Land Use',
    publisher: 'Food and Agriculture Organization of the United Nations',
    manifest_url: agriculture.source.manifest_url,
    cattle_archive_url: qclRelease.source_url,
    cattle_release_date: qclRelease.release_date,
    land_use_archive_url: 'https://bulks-faostat.fao.org/production/Inputs_LandUse_E_All_Data_(Normalized).zip',
    land_use_release_date: '2026-07-17T00:00:00',
    land_use_archive_sha256: 'a74c87b4c5faf2d9d755ef6ff202bd06cf05e52a7385ae288dc5e188f12dfb0c',
    upstream_agriculture_snapshot: AGRICULTURE_SNAPSHOT_PATH,
    upstream_agriculture_snapshot_version: agriculture.version
  },
  metric_contract: {
    node_id: 'cattle_stocking_density',
    metric_id: 'world_cattle_head_per_permanent_meadow_and_pasture_hectare',
    aggregation: 'Divide each FAOSTAT World cattle Stocks observation by the same-year World Permanent meadows and pastures Area observation after converting 1000 ha to hectares.',
    coverage: 'FAOSTAT source-native World aggregates, 1961–2024.',
    direction: 'higher_is_worse',
    cadence: 'Annual after both FAOSTAT source releases are available'
  },
  records,
  record_count: records.length,
  uncertainty: 'This is a global system-density indicator, not a paddock stocking rate. The numerator includes cattle that are not grazing permanent pasture, while the denominator includes permanent meadow and pasture used by other livestock or not stocked in a given year. FAOSTAT marks the meadow-area series as estimated and the latest cattle values as estimated.',
  failure_behavior: 'Retain the last complete same-year joined series and mark stale. Never divide by missing area, replace missing stock or area with zero, mix country rows with the World aggregate, or interpret this world ratio as a local carrying-capacity exceedance.'
};
await fs.writeFile(path.join(ROOT, 'public/faostat-cattle-stocking-density-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/faostat-cattle-stocking-density-snapshot.json',
  version: snapshot.version,
  records: snapshot.record_count,
  latest: records.at(-1)
}, null, 2));
