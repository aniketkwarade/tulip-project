import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const values = [
  82284.814768, 81977.583755, 84272.007569, 86815.836881, 86477.819437, 87236.77005,
  90109.506998, 92274.524066, 94083.873454, 95754.262987, 94958.557014, 94297.351348,
  94228.510698, 94416.874703, 96163.149474, 95890.633155, 98244.839052, 99738.651316,
  102033.703578, 103112.906168, 104745.066539, 105190.714154, 105968.53745, 105940.775435,
  106055.728078, 107140.510683, 107734.719513, 108688.224993, 108645.274117, 108639.886383,
  109250.557495, 109518.111604, 110279.016856, 112735.7917, 116111.772969, 118546.361052,
  119846.897648, 121335.566217, 122396.952908, 121793.38086, 125195.197133, 127209.703048,
  129123.49686, 129889.885088, 130594.330167, 130684.379006, 130364.927688, 131967.322359,
  133374.089134, 134557.990644, 132545.86664, 135891.837778, 138115.182136
];
const records = values.map((globalTotalGg, index) => ({ year: 1970 + index, global_total_gg: globalTotalGg }));
const snapshot = {
  version: 'edgar_v81_global_air_pollutant_2022_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  source: {
    id: 'edgar_global_air_pollutant_emissions_v81',
    name: 'EDGAR v8.1 Global Air Pollutant Emissions',
    publisher: 'European Commission Joint Research Centre',
    url: 'https://edgar.jrc.ec.europa.eu/index.php/dataset_ap81',
    archive_url: 'https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/EDGAR/datasets/v81_FT2022_AP_new/EDGAR_NMVOC_1970_2022.zip',
    archive_sha256: 'e25ceb744534609bc88f98d26bb1fd611cb3763e1e803a8287421a2b3ebffe5a',
    release: 'EDGAR v8.1 August 2024',
    workbook: 'EDGAR_NMVOC_1970_2022.xlsx',
    sheet: 'TOTALS BY COUNTRY',
    source_country_rows: 223,
    unit: 'Gg NMVOC per year'
  },
  metric_contract: {
    metric_id: 'global_anthropogenic_nmvoc_emissions',
    aggregation: 'Sum finite annual EDGAR country-total rows once; do not add sector sheets or regional groups.',
    coverage: 'Global anthropogenic emissions excluding large-scale biomass burning and LULUCF.',
    cadence: 'Annual, latest complete EDGAR release year',
    direction: 'higher_is_worse'
  },
  records,
  record_count: records.length,
  uncertainty: 'EDGAR emissions combine source activity data, technology penetration, abatement assumptions and emission factors. The series measures anthropogenic NMVOC emissions, not ambient VOC concentration or toxicity-weighted exposure. Large-scale biomass burning and LULUCF are excluded.',
  failure_behavior: 'Retain the last validated source release and mark stale. Never treat missing country-year values as zero outside the source-native aggregation or substitute carbon monoxide, methane, total hydrocarbons, or ozone concentration for NMVOC.'
};
await fs.writeFile(path.join(ROOT, 'public/edgar-global-air-pollutant-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/edgar-global-air-pollutant-snapshot.json', version: snapshot.version, records: snapshot.record_count, latest: records.at(-1) }, null, 2));
