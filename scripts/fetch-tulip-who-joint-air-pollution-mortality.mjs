import { writeFileSync } from 'node:fs';

// One source-bound endpoint example for the experimental consequence review.
// This never updates the public node assessment or the app's score data.
const url = new URL('https://ghoapi.azureedge.net/api/AIR_35');
url.searchParams.set('$filter', "SpatialDim eq 'GLOBAL' and TimeDim eq 2021 and Dim1 eq 'SEX_BTSX' and Dim2 eq 'GHECAUSE_GHE000000'");
url.searchParams.set('$format', 'json');
const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(30_000) });
if (!response.ok) throw new Error(`WHO AIR_35 request failed (${response.status})`);
const rows = (await response.json()).value;
if (!Array.isArray(rows) || rows.length !== 1) throw new Error(`Expected one global all-cause row, received ${rows?.length}`);
const row = rows[0];
if (row.IndicatorCode !== 'AIR_35' || row.SpatialDimType !== 'GLOBAL' || row.SpatialDim !== 'GLOBAL'
  || row.TimeDim !== 2021 || row.Dim1 !== 'SEX_BTSX' || row.Dim2 !== 'GHECAUSE_GHE000000'
  || !Number.isFinite(row.Low) || !Number.isFinite(row.NumericValue) || !Number.isFinite(row.High)
  || row.Low <= 0 || row.Low > row.NumericValue || row.NumericValue > row.High) {
  throw new Error('WHO joint-mortality row has an unexpected scope or interval');
}
const artifact = {
  version: 'who_joint_air_pollution_mortality_2021_global_source_row_v1',
  fetchedAt: new Date().toISOString(),
  indicator: 'AIR_35',
  sourceUrl: url.href,
  metadataUrl: 'https://www.who.int/data/gho/data/indicators/indicator-details/GHO/ambient-and-household-air-pollution-attributable-deaths',
  sourceUpdatedAt: row.Date,
  scope: { geography: 'global', year: row.TimeDim, sex: 'both', cause: 'all included causes',
    endpoint: 'modeled deaths attributable to the joint effects of ambient and household air pollution' },
  sourceDisplayValue: row.Value,
  modeledDeaths: { lower95: row.Low, central: row.NumericValue, upper95: row.High },
  boundary: 'This is a modeled mortality endpoint. It is not the number of people exposed, does not include nonfatal burden, and cannot alone validate the full Air Pollution Health Burden node.',
};
writeFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-air-pollution-mortality-row.json', import.meta.url), JSON.stringify(artifact, null, 2) + '\n');
console.log(JSON.stringify({ source: artifact.indicator, value: artifact.modeledDeaths, sourceUpdatedAt: artifact.sourceUpdatedAt }, null, 2));
