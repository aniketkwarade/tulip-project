import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { strFromU8, unzipSync } from 'fflate';

const PUBLIC_DIR = path.resolve('public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'world-bank-fertilizer-price-snapshot.json');
const SOURCE_ID = 'world_bank_commodity_price_data_the_pink_sheet';
const INGESTION_JOB_ID = 'fetch_world_bank_fertilizer_price_index';
const METRIC_ID = 'world_bank_fertilizer_price_index_change';
const GRAINS_METRIC_ID = 'world_bank_grains_price_index_volatility';
const LANDING_URL = 'https://thedocs.worldbank.org/en/doc/18675f1d1639c7a34d463f59263ba0a2-0050012025/worldbank-commodities-price-data-the-pink-sheet';
const WORKBOOK_URL = 'https://thedocs.worldbank.org/en/doc/18675f1d1639c7a34d463f59263ba0a2-0050012025/related/CMO-Historical-Data-Monthly.xlsx';
const RETAIN_START_YEAR = 2000;

const decodeXml = value => String(value || '').replaceAll('&amp;', '&').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&quot;', '"').replaceAll('&#39;', "'");
const round = (value, digits = 3) => Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
const percentChange = (value, reference) => Number.isFinite(value) && Number.isFinite(reference) && reference !== 0
  ? round((value / reference - 1) * 100, 2) : null;

function parseSharedStrings(xml) {
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map(match => decodeXml(
    [...match[1].matchAll(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g)].map(item => item[1]).join('')
  ));
}

function parseCellMap(rowXml, strings) {
  const cells = new Map();
  for (const cell of rowXml.matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
    const column = cell[1].match(/\br="([A-Z]+)\d+"/)?.[1];
    const value = cell[2].match(/<v>([\s\S]*?)<\/v>/)?.[1];
    if (!column || value == null) continue;
    cells.set(column, cell[1].match(/\bt="([^"]+)"/)?.[1] === 's' ? strings[Number(value)] : value);
  }
  return cells;
}

function parseMonthlyIndices(sheetXml, strings) {
  const rows = [];
  for (const row of sheetXml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells = parseCellMap(row[1], strings);
    const period = String(cells.get('A') || '').trim();
    const match = period.match(/^(20\d{2})M(0[1-9]|1[0-2])$/);
    const fertilizer = Number(cells.get('N'));
    const grains = Number(cells.get('I'));
    if (!match || !Number.isFinite(fertilizer) || fertilizer <= 0 || !Number.isFinite(grains) || grains <= 0) continue;
    rows.push({ period, year: Number(match[1]), month: Number(match[2]), fertilizer, grains });
  }
  return rows.filter(row => row.year >= RETAIN_START_YEAR).sort((a, b) => a.period.localeCompare(b.period));
}

async function main() {
  const response = await fetch(WORKBOOK_URL, { headers: { Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'User-Agent': 'LostPlanet-Northstar/1.0' }, signal: AbortSignal.timeout(180_000) });
  if (!response.ok) throw new Error(`World Bank Pink Sheet request failed: ${response.status} ${response.statusText}`);
  const archive = unzipSync(new Uint8Array(await response.arrayBuffer()));
  if (!archive['xl/worksheets/sheet3.xml'] || !archive['xl/sharedStrings.xml']) throw new Error('World Bank workbook is missing the Monthly Indices worksheet or shared strings.');
  const strings = parseSharedStrings(strFromU8(archive['xl/sharedStrings.xml']));
  const sourceRows = parseMonthlyIndices(strFromU8(archive['xl/worksheets/sheet3.xml']), strings);
  if (sourceRows.length < 240) throw new Error(`Expected at least 240 retained monthly observations; received ${sourceRows.length}.`);
  for (let index = 1; index < sourceRows.length; index += 1) {
    const previous = sourceRows[index - 1];
    const current = sourceRows[index];
    if (current.year * 12 + current.month !== previous.year * 12 + previous.month + 1) throw new Error(`Missing month between ${previous.period} and ${current.period}.`);
  }
  const latest = sourceRows.at(-1);
  const ageMonths = (new Date().getUTCFullYear() - latest.year) * 12 + new Date().getUTCMonth() + 1 - latest.month;
  if (ageMonths > 18) throw new Error(`World Bank fertilizer index is unexpectedly stale at ${latest.period}.`);

  const records = sourceRows.flatMap((row, index) => [{
      record_id: `world_bank_fertilizer_index_${row.period.toLowerCase()}`,
      metric_id: METRIC_ID,
      measurement_role: 'global_nominal_usd_commodity_group_index_primary',
      observation_month: `${row.year}-${String(row.month).padStart(2, '0')}`,
      observation_year: row.year,
      observation_month_number: row.month,
      fertilizer_price_index_2010_100: round(row.fertilizer),
      month_over_month_change_pct: percentChange(row.fertilizer, sourceRows[index - 1]?.fertilizer),
      three_month_change_pct: percentChange(row.fertilizer, sourceRows[index - 3]?.fertilizer),
      year_over_year_change_pct: percentChange(row.fertilizer, sourceRows[index - 12]?.fertilizer),
      index_base: '2010=100',
      price_basis: 'monthly index based on nominal US dollars',
      geography: 'global World Bank commodity-price index',
      source_locator: { landing_page_url: LANDING_URL, workbook_url: WORKBOOK_URL, workbook_sheet: 'Monthly Indices', period_column: 'A', source_column: 'N', source_header: 'Fertilizers' }
    }, {
      record_id: `world_bank_grains_index_${row.period.toLowerCase()}`,
      metric_id: GRAINS_METRIC_ID,
      measurement_role: 'global_nominal_usd_grains_index_primary',
      observation_month: `${row.year}-${String(row.month).padStart(2, '0')}`,
      observation_year: row.year,
      observation_month_number: row.month,
      grains_price_index_2010_100: round(row.grains),
      month_over_month_change_pct: percentChange(row.grains, sourceRows[index - 1]?.grains),
      three_month_change_pct: percentChange(row.grains, sourceRows[index - 3]?.grains),
      year_over_year_change_pct: percentChange(row.grains, sourceRows[index - 12]?.grains),
      index_base: '2010=100',
      price_basis: 'monthly index based on nominal US dollars',
      geography: 'global World Bank grains commodity-price index',
      source_locator: { landing_page_url: LANDING_URL, workbook_url: WORKBOOK_URL, workbook_sheet: 'Monthly Indices', period_column: 'A', source_column: 'I', source_header: 'Grains' }
    }]);

  const snapshot = {
    version: `world_bank_fertilizer_price_monthly_through_${latest.period.toLowerCase()}_v1`,
    captured_at: new Date().toISOString(),
    source: { id: SOURCE_ID, name: 'World Bank Commodity Price Data (The Pink Sheet)', url: LANDING_URL, workbook_url: WORKBOOK_URL, access: 'open_authoritative_xlsx', workbook_release_label: [...strings].reverse().find(value => /^Updated as of:/i.test(value.trim())) || null },
    ingestion_job_id: INGESTION_JOB_ID,
    metric_contract_ids: [METRIC_ID, GRAINS_METRIC_ID],
    cadence: 'monthly World Bank Pink Sheet workbook check with complete retained-series replacement',
    provenance: `Official World Bank Monthly Indices worksheet, Fertilizers column N and Grains column I, nominal US-dollar indices with 2010=100. Source values from ${RETAIN_START_YEAR} onward are retained; one-, three- and twelve-month percentage changes are transparent derivations.`,
    uncertainty: 'The workbook does not publish observation-level uncertainty intervals. Commodity composition and weights, quoted-market coverage, nominal-dollar conditions, estimated components, revisions and product substitutions affect comparison.',
    failure_behavior: 'Retain the last validated complete series and mark stale; reject missing months, schema changes, non-positive values or an unexpectedly old latest period; never infer local farm-gate prices, affordability, scarcity or downstream food effects.',
    measurement_boundary: 'These are global fertilizer and grains commodity-group price indices in nominal US dollars, not volumes, country or household prices, farm input-cost shares, shortages, inflation-adjusted prices, causal food-security effects or forecasts.',
    derivations: { month_over_month_change_pct: '(current / prior month - 1) * 100', three_month_change_pct: '(current / three months prior - 1) * 100', year_over_year_change_pct: '(current / twelve months prior - 1) * 100' },
    retained_period_start: records[0].observation_month,
    retained_period_end: records.at(-1).observation_month,
    record_count: records.length,
    records
  };
  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify({ output: OUTPUT_PATH, records: records.length, monthly_periods: sourceRows.length, latest_period: latest.period, latest_fertilizer_index: round(latest.fertilizer), latest_grains_index: round(latest.grains), release_label: snapshot.source.workbook_release_label }, null, 2));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
