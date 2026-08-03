import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rows = [
  [1989, 55184, 50685, 85215, 41, 36], [1990, 80297, 77085, 97819, 49, 41],
  [1991, 70353, 68109, 91417, 53, 41], [1992, 53406, 49964, 78166, 51, 42],
  [1993, 44949, 43923, 67757, 44, 37], [1994, 38517, 37233, 58165, 50, 37],
  [1995, 36742, 35683, 52199, 41, 33], [1996, 28885, 28442, 35071, 41, 32],
  [1997, 40340, 37143, 61984, 39, 33], [1998, 40218, 38126, 52215, 40, 35],
  [1999, 81047, 79661, 103429, 40, 36], [2000, 78671, 76410, 91466, 40, 34],
  [2001, 23592, 21216, 38988, 39, 34], [2002, 21106, 19055, 29279, 33, 28],
  [2003, 23194, 22760, 33522, 33, 25], [2004, 19646, 19131, 26589, 33, 30],
  [2005, 12322, 11908, 15464, 33, 27], [2006, 20163, 18939, 28780, 33, 26],
  [2007, 19214, 18231, 25320, 35, 27], [2008, 28741, 27897, 37027, 38, 29],
  [2009, 34606, 31381, 43329, 37, 26], [2010, 21088, 20118, 27870, 31, 24],
  [2011, 25080, 24072, 33675, 37, 28], [2012, 74071, 71713, 85418, 33, 26],
  [2013, 93488, 88942, 108339, 39, 29], [2014, 115972, 110981, 131396, 46, 31],
  [2015, 104435, 100148, 120004, 54, 37], [2016, 90624, 86024, 105943, 54, 38],
  [2017, 72023, 69257, 81884, 53, 35], [2018, 55031, 51988, 64820, 52, 37],
  [2019, 52610, 48577, 61679, 57, 39], [2020, 73228, 66999, 90301, 57, 41],
  [2021, 199789, 194505, 225697, 54, 36], [2022, 276893, 251922, 373007, 56, 43],
  [2023, 131061, 113899, 213124, 59, 37], [2024, 128439, 119160, 189525, 61, 41]
];
const records = rows.map(([year, battleDeathsBest, battleDeathsLow, battleDeathsHigh, conflictRows, battleLocations]) => ({
  year,
  battle_deaths_best: battleDeathsBest,
  battle_deaths_low: battleDeathsLow,
  battle_deaths_high: battleDeathsHigh,
  conflict_rows: conflictRows,
  unique_battle_locations: battleLocations
}));

const snapshot = {
  version: 'ucdp_battle_related_deaths_25_1_global_1989_2024_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  source: {
    id: 'ucdp_battle_related_deaths_25_1',
    name: 'UCDP Battle-related Deaths Dataset version 25.1 — conflict-level file',
    publisher: 'Uppsala Conflict Data Program, Uppsala University',
    source_page_url: 'https://ucdp.uu.se/downloads/',
    archive_url: 'https://ucdp.uu.se/downloads/brd/ucdp-brd-conf-251-csv.zip',
    archive_sha256: '1fd7dfbb182c13b88249a8cd3d2d3dce62e38631381d374dfa04958ba3a96bc4',
    csv_sha256: 'a8e734c13bf62230b4b27f31804374823fe14573fb599a1e2c607a3bc661bf05',
    csv_file: 'BattleDeaths_v25_1_conf.csv',
    codebook_url: 'https://ucdp.uu.se/downloads/brd/ucdp-brd-codebook-251.pdf',
    license: 'CC BY 4.0'
  },
  metric_contract: {
    node_id: 'conflict_risk_escalation',
    metric_id: 'global_annual_battle_related_deaths_and_conflict_extent',
    aggregation: 'For each year, sum every conflict-level bd_best, bd_low and bd_high value once; count conflict rows; split comma-separated battle_location values, trim, deduplicate and count.',
    coverage: 'UCDP state-based armed conflicts meeting its annual 25 battle-death definition; global conflict-level dataset.',
    direction: 'higher_is_worse',
    cadence: 'Annual UCDP release'
  },
  records,
  record_count: records.length,
  uncertainty: 'UCDP provides best, low and high estimates because public reporting from conflict areas is incomplete and revised retroactively. This series measures state-based battle-related deaths, not all conflict deaths, non-state conflict, one-sided violence, displacement, criminal violence or a forecast of future conflict.',
  failure_behavior: 'Retain the last checksum-verified release and mark stale. Never replace missing estimates with zero, add best/low/high estimates together, or relabel battle-related deaths as total conflict mortality.'
};

await fs.writeFile(path.join(ROOT, 'public/ucdp-global-conflict-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/ucdp-global-conflict-snapshot.json',
  version: snapshot.version,
  records: snapshot.record_count,
  latest: records.at(-1)
}, null, 2));
