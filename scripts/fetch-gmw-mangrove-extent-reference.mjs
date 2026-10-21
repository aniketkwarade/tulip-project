import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { gunzipSync, unzipSync } from 'fflate';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'artifacts/tulip-calibration-2026-09-22/gmw-mangrove-extent-reference-snapshot.json');
const rawDir = process.env.TULIP_GMW_RAW_DIR;
const files = {
  extent: {
    name: 'gmw_v4_timeseries_4112_gmw_country_stats_corr_area_formatted.xlsx',
    url: 'https://zenodo.org/records/21346457/files/gmw_v4_timeseries_4112_gmw_country_stats_corr_area_formatted.xlsx?download=1',
    md5: '30800462dcd06a184df33aa66e0337a2',
  },
  change: {
    name: 'gmw_mng_chng_stats_v4112_corrected.tar.gz',
    url: 'https://zenodo.org/records/21346457/files/gmw_mng_chng_stats_v4112_corrected.tar.gz?download=1',
    md5: '49ba552f6c11aedc37e3d956f06a98d1',
  },
};

const md5 = bytes => createHash('md5').update(bytes).digest('hex');
const sha256 = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const round = (value, places = 6) => Number(value.toFixed(places));

async function loadSourceFile(file) {
  const bytes = rawDir
    ? await readFile(resolve(rawDir, file.name))
    : Buffer.from(await (await fetch(file.url)).arrayBuffer());
  const actual = md5(bytes);
  if (actual !== file.md5) throw new Error(`${file.name}: expected MD5 ${file.md5}, received ${actual}`);
  return bytes;
}

function decodeXml(value) {
  return value.replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"').replaceAll('&apos;', "'").replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

function columnIndex(reference) {
  const letters = reference.match(/[A-Z]+/)?.[0] ?? '';
  return [...letters].reduce((index, letter) => index * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function xlsxRows(bytes, sheetNumber = 1) {
  const archive = unzipSync(new Uint8Array(bytes));
  const decoder = new TextDecoder();
  const sharedXml = archive['xl/sharedStrings.xml'] ? decoder.decode(archive['xl/sharedStrings.xml']) : '';
  const sharedStrings = [...sharedXml.matchAll(/<si(?:\s[^>]*)?>([\s\S]*?)<\/si>/g)].map(match => (
    [...match[1].matchAll(/<t(?:\s[^>]*)?>([\s\S]*?)<\/t>/g)].map(part => decodeXml(part[1])).join('')
  ));
  const sheet = decoder.decode(archive[`xl/worksheets/sheet${sheetNumber}.xml`]);
  return [...sheet.matchAll(/<row(?:\s[^>]*)?>([\s\S]*?)<\/row>/g)].map(rowMatch => {
    const row = [];
    for (const cell of rowMatch[1].matchAll(/<c\s([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attributes = cell[1];
      const reference = attributes.match(/\br="([A-Z]+\d+)"/)?.[1];
      if (!reference) continue;
      const type = attributes.match(/\bt="([^"]+)"/)?.[1];
      const raw = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (raw == null) continue;
      const value = type === 's' ? sharedStrings[Number(raw)] : type === 'str' ? decodeXml(raw) : Number(raw);
      row[columnIndex(reference)] = value;
    }
    return row;
  });
}

function tarEntries(gzipBytes) {
  const tar = Buffer.from(gunzipSync(new Uint8Array(gzipBytes)));
  const entries = [];
  for (let offset = 0; offset + 512 <= tar.length;) {
    const header = tar.subarray(offset, offset + 512);
    if (header.every(byte => byte === 0)) break;
    const name = header.subarray(0, 100).toString('utf8').replace(/\0.*$/, '').replace(/^\.\//, '');
    const sizeText = header.subarray(124, 136).toString('ascii').replace(/\0.*$/, '').trim();
    const size = Number.parseInt(sizeText || '0', 8);
    const start = offset + 512;
    entries.push({ name, bytes: tar.subarray(start, start + size) });
    offset = start + Math.ceil(size / 512) * 512;
  }
  return entries;
}

function worksheetMatrixValue(bytes, startYear, endYear) {
  const rows = xlsxRows(bytes);
  const header = rows[0];
  const column = header.findIndex(value => value === endYear);
  const row = rows.find(values => values[0] === startYear);
  if (!row || column < 0 || !Number.isFinite(row[column])) throw new Error(`Missing ${startYear}–${endYear} matrix value`);
  return row[column];
}

function extentSheet(bytes, sheetNumber) {
  const rows = xlsxRows(bytes, sheetNumber);
  const years = rows[0].slice(2).filter(value => Number.isInteger(Number(value))).map(Number);
  const countries = rows.slice(1).filter(row => typeof row[0] === 'string' && row[0].trim());
  const totals = Object.fromEntries(years.map((year, index) => [year, countries.reduce((sum, row) => sum + Number(row[index + 2] ?? 0), 0)]));
  return { years, countries: countries.length, totals };
}

const [extentBytes, changeBytes] = await Promise.all([loadSourceFile(files.extent), loadSourceFile(files.change)]);
const extent = extentSheet(extentBytes, 1);
const lower95 = extentSheet(extentBytes, 2);
const upper95 = extentSheet(extentBytes, 3);
if (extent.years[0] !== 1985 || extent.years.at(-1) !== 2025 || extent.years.length !== 41) {
  throw new Error(`Unexpected GMW year coverage: ${extent.years[0]}–${extent.years.at(-1)} (${extent.years.length})`);
}
if (new Set([extent.countries, lower95.countries, upper95.countries]).size !== 1) throw new Error('GMW sheet country counts differ');

const changes = tarEntries(changeBytes).filter(entry => /_(?:losses|gains)_.*\.xlsx$/.test(entry.name)
  && !entry.name.split('/').at(-1).startsWith('._')
  && !entry.name.startsWith('PaxHeader/'));
const changeCountries = new Set(changes.map(entry => entry.name.split('_')[0]));
const windows = [[1985, 2025], [2000, 2025], [2016, 2025], [2020, 2025]].map(([start, end]) => {
  const lossesHa = changes.filter(entry => entry.name.includes('_losses_')).reduce((sum, entry) => sum + worksheetMatrixValue(entry.bytes, start, end), 0);
  const gainsHa = changes.filter(entry => entry.name.includes('_gains_')).reduce((sum, entry) => sum + worksheetMatrixValue(entry.bytes, start, end), 0);
  const baselineHa = extent.totals[start];
  const endingHa = extent.totals[end];
  return {
    start,
    end,
    completeCalendarYears: end - start + 1,
    baselineExtentHa: round(baselineHa, 3),
    endingExtentHa: round(endingHa, 3),
    grossLossHa: round(lossesHa, 3),
    grossGainHa: round(gainsHa, 3),
    netChangeHaFromGrossFlows: round(gainsHa - lossesHa, 3),
    netChangeHaFromExtent: round(endingHa - baselineHa, 3),
    grossLossPctOfBaseline: round(lossesHa / baselineHa * 100),
    grossGainPctOfBaseline: round(gainsHa / baselineHa * 100),
    netChangePctOfBaseline: round((endingHa - baselineHa) / baselineHa * 100),
  };
});

const extentSeries = extent.years.map(year => ({
  year,
  extentHa: round(extent.totals[year], 3),
  lower95Ha: round(lower95.totals[year], 3),
  upper95Ha: round(upper95.totals[year], 3),
}));
const currentWindow = windows.find(window => window.start === 2016 && window.end === 2025);
const snapshot = {
  version: 'tulip_gmw_mangrove_extent_reference_2026_09_23_v1',
  generatedOn: '2026-09-23',
  status: 'internal_reference_ingestion_not_public_rating_data',
  productionRatingsEnabled: 0,
  source: {
    id: 'global_mangrove_watch_v4112',
    title: 'Global Mangrove Watch: Timeseries of Mangrove Extent',
    version: '4.1.12',
    publisher: 'Aberystwyth University, solo Earth Observation, Wetlands International, The Nature Conservancy and JAXA',
    doi: 'https://doi.org/10.5281/zenodo.21346457',
    publicationDate: '2026-07-13',
    dataPeriod: { start: 1985, end: 2025, annualEpochs: 41 },
    spatialResolutionMetres: 30,
    projection: 'EPSG:4326',
    terms: 'Free public use under JAXA Terms of Use of Research Data, with the dataset-specific credit requirement.',
    termsUrl: 'https://earth.jaxa.jp/policy/en.html',
    requiredCredit: '©Global Mangrove Watch or ©Aberystwyth University, solo Earth Observation, Wetlands International, The Nature Conservancy and JAXA.',
    files: Object.fromEntries(Object.entries(files).map(([key, file]) => [key, { name: file.name, url: file.url, md5: file.md5 }])),
  },
  accuracy: {
    globalF1: 0.9276,
    globalF1Lower: 0.9220,
    globalF1Upper: 0.9330,
    omissionPct: 6.357,
    omissionRangePct: [5.648, 7.133],
    commissionPct: 8.093,
    commissionRangePct: [7.093, 9.128],
    referencePoints: 32569,
    sites: 120,
    caveat: 'Accuracy is an average for the product and varies by location and year. Pre-2000 imagery gaps required infilling in some areas.',
  },
  ingestion: {
    countryRows: extent.countries,
    changeCountryMatrices: changeCountries.size,
    extentUnits: 'hectares',
    correctionFactorAppliedBySource: 0.9775,
    sourceFilesVerifiedByMd5: true,
  },
  currentWindow,
  fullHistory: {
    start: 1985,
    end: 2025,
    earliestYearsCaveat: 'The source warns that imagery availability before 1999/2000 is reduced and some annual coverage is infilled.',
    window: windows.find(window => window.start === 1985),
  },
  comparisonWindows: windows,
  extentSeries,
  tulipUse: {
    nodeId: 'mangrove_buffer_loss',
    admissible: [
      'Use 2016–2025 gross mangrove loss divided by 2016 mangrove extent as a denominator-compatible ecosystem-reach measurement.',
      'Use the annual 1985–2025 extent series as historical context, with the source warning for pre-2000 infilling.',
      'Use the mapped mangrove-to-non-mangrove transition as evidence of local habitat removal, while retaining uncertainty about ecological condition and services.',
    ],
    excluded: [
      'Do not use net change alone: gains elsewhere do not restore the same local habitat, species assemblage or coastal protection.',
      'Do not treat the 41-year record as 41 years of consequence persistence or recovery time.',
      'Do not treat gross loss percentage as both ecosystem severity and reach without separating local outcome from global affected share.',
      'Do not infer the number of people harmed from mapped habitat area.',
      'Do not present historical extent change as climate attribution; the dataset maps change but does not assign causes.',
    ],
    proposedReachAnchor: {
      measuredGrossLossPct: currentWindow.grossLossPctOfBaseline,
      centralLevel: currentWindow.grossLossPctOfBaseline >= 10 ? 3 : currentWindow.grossLossPctOfBaseline >= 1 ? 2 : 1,
      lowerLevel: 1,
      upperLevel: 3,
      uncertaintyReason: 'The denominator is compatible, but map error, local accuracy variation and the difference between mapped cover loss and lost ecological function justify adjacent-level bounds.',
    },
  },
};
snapshot.snapshotDigest = sha256({ source: snapshot.source, accuracy: snapshot.accuracy, ingestion: snapshot.ingestion, comparisonWindows: windows, extentSeries, tulipUse: snapshot.tulipUse });

await writeFile(output, JSON.stringify(snapshot, null, 2) + '\n');
console.log(JSON.stringify({ output, currentWindow, ingestion: snapshot.ingestion, snapshotDigest: snapshot.snapshotDigest }, null, 2));
