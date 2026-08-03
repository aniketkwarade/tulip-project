import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const OUTPUT_PATH = path.join(PUBLIC_DIR, 'noaa-gml-benchmarks.json');
const REFRESH_DAYS = 35;

const CO2_URL = 'https://gml.noaa.gov/ccgg/trends/';
const CH4_URL = 'https://gml.noaa.gov/ccgg/trends_ch4/';
const AGGI_URL = 'https://gml.noaa.gov/aggi/aggi.html';
const ODGI_URL = 'https://gml.noaa.gov/hats/odgi.html';
const ODGI_ANTARCTIC_CSV_URL = 'https://gml.noaa.gov/odgi/odgi_table1.csv';
const ODGI_MIDLATITUDE_CSV_URL = 'https://gml.noaa.gov/odgi/odgi_table2.csv';

async function fetchText(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'Mozilla/5.0 (compatible; TULIP/1.0; +https://github.com/)'
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }
  return response.text();
}

function normalizeWhitespace(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseGasTrend(text, gasLabel, unit) {
  const normalized = normalizeWhitespace(text);
  const valuePattern = gasLabel === 'co2'
    ? /Monthly Average Mauna Loa CO\s*2\s+([A-Za-z]+)\s+(\d{4}):\s+([0-9.]+)\s+ppm/i
    : /Global CH\s*4 Monthly Means\s+([A-Za-z]+)\s+(\d{4}):\s+([0-9.]+)\s+ppb/i;
  const updatedPattern = /Last updated:\s+([A-Za-z]{3,9}\s+\d{2},\s+\d{4})/i;

  const valueMatch = normalized.match(valuePattern);
  const updatedMatch = normalized.match(updatedPattern);

  if (!valueMatch) {
    throw new Error(`Unable to parse ${gasLabel.toUpperCase()} benchmark from NOAA GML page.`);
  }

  return {
    observed_month: `${valueMatch[2]}-${String(new Date(`${valueMatch[1]} 1, ${valueMatch[2]}`).getMonth() + 1).padStart(2, '0')}`,
    value: Number(valueMatch[3]),
    unit,
    updated_label: updatedMatch?.[1] || null
  };
}

function parseAggi(text) {
  const normalized = normalizeWhitespace(text);
  const updatedMatch = normalized.match(/Updated\s+([A-Za-z]+\s+\d{4})/i);
  const aggiMatch = normalized.match(/For 2024, the AGGI was\s+([0-9.]+)/i);
  const forcingIncreaseMatch = normalized.match(/radiative forcing from these gases since 1990\.\s*Most of this increase/i)
    ? normalized.match(/represents a\s+([0-9]+)% increase/i)
    : normalized.match(/radiative forcing from changes in atmospheric abundances of long-lived greenhouse gases is\s+([0-9]+)% greater in 2024 than it was in 1990/i);
  const co2ContributionMatch = normalized.match(/Most of this increase \(([0-9]+)%\) stems from the measured atmospheric increase in CO\s*2/i);
  const co2AnnualMatch = normalized.match(/reached\s+([0-9.]+)\s*[±\+\-0-9.\s]*ppm in 2024/i);
  const ch4AnnualMatch = normalized.match(/methane \(CH\s*4\) reached\s+([0-9.]+)\s*[±\+\-0-9.\s]*ppb in 2024/i);

  if (!aggiMatch) {
    throw new Error('Unable to parse AGGI benchmark from NOAA GML page.');
  }

  return {
    release_cycle: updatedMatch?.[1] || 'Fall 2025',
    benchmark_year: 2024,
    aggi: Number(aggiMatch[1]),
    forcing_increase_since_1990_pct: forcingIncreaseMatch ? Number(forcingIncreaseMatch[1]) : null,
    co2_share_of_increase_pct: co2ContributionMatch ? Number(co2ContributionMatch[1]) : null,
    global_co2_ppm_2024: co2AnnualMatch ? Number(co2AnnualMatch[1]) : null,
    global_ch4_ppb_2024: ch4AnnualMatch ? Number(ch4AnnualMatch[1]) : null,
    annual_radiative_forcing: parseAggiAnnualSeries(text)
  };
}

function parseAggiAnnualSeries(text) {
  const rows = [];
  for (const rowMatch of text.matchAll(/<tr(?:\s[^>]*)?>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...rowMatch[1].matchAll(/<(?:td|th)(?:\s[^>]*)?>([\s\S]*?)<\/(?:td|th)>/gi)]
      .map(match => normalizeWhitespace(match[1]));
    if (!/^\d{4}$/.test(cells[0] || '') || cells.length < 11) continue;
    const values = cells.slice(1, 11).map(value => Number(value.replace(/[^0-9.+-]/g, '')));
    if (!values.every(Number.isFinite)) continue;
    const [co2, ch4, n2o, cfcs, hcfcs, hfcs, total, co2Equivalent, aggi, annualPercentChange] = values;
    rows.push({
      year: Number(cells[0]),
      effective_radiative_forcing_w_m2: { co2, ch4, n2o, cfcs, hcfcs, hfcs, total },
      co2_equivalent_ppm: co2Equivalent,
      aggi_1990_equals_1: aggi,
      annual_percent_change: annualPercentChange
    });
  }
  if (rows.length < 20) throw new Error(`Unable to parse the complete NOAA AGGI annual table; found ${rows.length} rows.`);
  return rows.sort((left, right) => left.year - right.year);
}

function parseOdgiAnnualSeries(text, domain) {
  const rows = text
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map(line => line.split(',').map(value => value.trim()))
    .filter(cells => /^\d{4}$/.test(cells[0] || '') && cells.length >= 15)
    .map(cells => {
      const values = cells.slice(1, 15).map(Number);
      if (!values.every(Number.isFinite)) return null;
      const [
        cfc12, cfc11, ch3cl, ch3br, ccl4, ch3ccl3, halons, cfc113,
        hcfcs, wmoMinor, reactiveHalogenSum, eesc, legacyOdgi, odgi
      ] = values;
      return {
        year: Number(cells[0]),
        contributions_ppt: {
          cfc12,
          cfc11,
          ch3cl,
          ch3br,
          ccl4,
          ch3ccl3,
          halons,
          cfc113,
          hcfcs,
          wmo_minor: wmoMinor
        },
        reactive_halogen_sum_ppt: reactiveHalogenSum,
        eesc_ppt: eesc,
        legacy_odgi: legacyOdgi,
        odgi,
        domain
      };
    })
    .filter(Boolean)
    .sort((left, right) => left.year - right.year);

  if (rows.length < 20) {
    throw new Error(`Unable to parse the complete NOAA ODGI ${domain} annual table; found ${rows.length} rows.`);
  }
  return rows;
}

async function main() {
  const [co2Html, ch4Html, aggiHtml, odgiHtml, odgiAntarcticCsv, odgiMidlatitudeCsv] = await Promise.all([
    fetchText(CO2_URL),
    fetchText(CH4_URL),
    fetchText(AGGI_URL),
    fetchText(ODGI_URL),
    fetchText(ODGI_ANTARCTIC_CSV_URL),
    fetchText(ODGI_MIDLATITUDE_CSV_URL)
  ]);

  const odgiAntarctic = parseOdgiAnnualSeries(odgiAntarcticCsv, 'antarctic');
  const odgiMidlatitude = parseOdgiAnnualSeries(odgiMidlatitudeCsv, 'midlatitude');
  const odgiPage = normalizeWhitespace(odgiHtml);
  const odgiReleaseMatch = odgiPage.match(/Fall\s+(\d{4})/i);

  const registry = {
    updated_at: new Date().toISOString().slice(0, 10),
    version: new Date().toISOString(),
    benchmark_family: 'atmospheric_composition_concentrations_forcing_and_ozone_depleting_gas_burden',
    source: {
      id: 'noaa_gml_benchmarks',
      name: 'NOAA Global Monitoring Laboratory',
      access: 'open_html_benchmarks'
    },
    refresh_policy: {
      default_days: REFRESH_DAYS,
      notes: 'Refresh roughly monthly for CO2 and CH4 trend pages, and annually when NOAA updates AGGI.'
    },
    use_guidance: {
      primary_role: 'Operational atmospheric benchmark layer for CO2, CH4, greenhouse-gas radiative forcing, and ozone-depleting-gas burden.',
      caution: 'Treat AGGI and ODGI as annual benchmarks and trend pages as monthly observational updates rather than instant real-time telemetry.'
    },
    benchmarks: {
      co2: {
        ...parseGasTrend(co2Html, 'co2', 'ppm'),
        url: CO2_URL
      },
      ch4: {
        ...parseGasTrend(ch4Html, 'ch4', 'ppb'),
        url: CH4_URL
      },
      aggi: {
        ...parseAggi(aggiHtml),
        url: AGGI_URL
      },
      odgi: {
        release_cycle: odgiReleaseMatch ? `Fall ${odgiReleaseMatch[1]}` : null,
        benchmark_year: Math.min(odgiAntarctic.at(-1).year, odgiMidlatitude.at(-1).year),
        definition: 'NOAA defines ODGI as 100 at peak ozone-depleting halogen abundance and zero at the 1980 abundance benchmark.',
        measurement_boundary: 'Global mean lower-tropospheric abundances of long-lived chlorine- and bromine-containing chemicals, transformed by NOAA into present-day EESC and ODGI for the Antarctic and mid-latitude stratosphere.',
        annual_antarctic: odgiAntarctic,
        annual_midlatitude: odgiMidlatitude,
        url: ODGI_URL,
        antarctic_csv_url: ODGI_ANTARCTIC_CSV_URL,
        midlatitude_csv_url: ODGI_MIDLATITUDE_CSV_URL
      }
    }
  };

  await mkdir(PUBLIC_DIR, { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');

  console.log(JSON.stringify({
    output: OUTPUT_PATH,
    co2_month: registry.benchmarks.co2.observed_month,
    ch4_month: registry.benchmarks.ch4.observed_month,
    aggi_year: registry.benchmarks.aggi.benchmark_year,
    odgi_year: registry.benchmarks.odgi.benchmark_year,
    odgi_annual_records_per_domain: registry.benchmarks.odgi.annual_midlatitude.length
  }, null, 2));
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
