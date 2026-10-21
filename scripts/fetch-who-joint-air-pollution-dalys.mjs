import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';

const query = new URL('https://ghoapi.azureedge.net/api/AIR_60');
query.searchParams.set('$filter', "SpatialDim eq 'GLOBAL' and Dim1 eq 'SEX_BTSX' and Dim2 eq 'GHECAUSE_GHE000000'");
query.searchParams.set('$orderby', 'TimeDim desc');
query.searchParams.set('$top', '1');
const response = await fetch(query);
assert(response.ok, `WHO GHO request failed: ${response.status}`);
const payload = await response.json();
assert.equal(payload.value?.length, 1);
const row = payload.value[0];
assert.equal(row.IndicatorCode, 'AIR_60');
assert.equal(row.SpatialDimType, 'GLOBAL');
assert.equal(row.SpatialDim, 'GLOBAL');
assert.equal(row.Dim1, 'SEX_BTSX');
assert.equal(row.Dim2, 'GHECAUSE_GHE000000');
assert(Number.isInteger(row.TimeDim) && row.TimeDim <= 2026);
assert(Number.isFinite(row.Low) && Number.isFinite(row.NumericValue) && Number.isFinite(row.High));
assert(row.Low >= 0 && row.Low <= row.NumericValue && row.NumericValue <= row.High);

const result = {
  version: 'who_joint_air_pollution_dalys_latest_global_source_row_v1',
  retrievedAt: new Date().toISOString(),
  indicator: 'AIR_60',
  sourceUrl: query.href,
  metadataUrl: 'https://www.who.int/data/gho/data/indicators/indicator-details/GHO/ambient-air-pollution-attributable-dalys',
  sourceUpdatedAt: row.Date,
  scope: {
    geography: 'global', year: row.TimeDim, sex: 'both', cause: 'all included causes',
    endpoint: 'modeled disability-adjusted life years attributable to the joint effects of ambient and household air pollution',
  },
  sourceDisplayValue: row.Value,
  modeledDalys: { lower95: row.Low, central: row.NumericValue, upper95: row.High },
  boundary: 'This is one WHO-modeled joint health-burden endpoint. It includes fatal and nonfatal health loss for the causes included by WHO. Do not add a separate death count, ambient-only or household-only burden to it. It does not measure ecosystem harm, services, or every possible air-pollution outcome. Its latest available global API year is recorded above and must not be represented as a 2026 observation.',
};
writeFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/who-joint-air-pollution-dalys-row.json', import.meta.url), `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify({ year: result.scope.year, modeledDalys: result.modeledDalys, sourceUrl: query.href }, null, 2));
