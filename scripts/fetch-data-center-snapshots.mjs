import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const ENV_PATH = path.join(ROOT, '.env.local');

function loadEnvFile(filePath) {
  return readFile(filePath, 'utf8')
    .then(contents => {
      for (const line of contents.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx === -1) continue;
        const key = trimmed.slice(0, idx).trim();
        const value = trimmed.slice(idx + 1).trim();
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }
    })
    .catch(() => {});
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 400)}`);
  }
  return response.json();
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await mapper(items[current], current);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

function round(value, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) return null;
  return Number(value.toFixed(digits));
}

function topMixEntries(mix = {}, count = 4) {
  return Object.entries(mix)
    .filter(([, value]) => typeof value === 'number' && value > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([fuel, value]) => ({ fuel, value }));
}

const DATA_CENTER_STATES = [
  { code: 'VA', label: 'Virginia', hub: 'Northern Virginia' },
  { code: 'TX', label: 'Texas', hub: 'Texas Triangle' },
  { code: 'CA', label: 'California', hub: 'Northern California' },
  { code: 'OR', label: 'Oregon', hub: 'Hillsboro / Portland' },
  { code: 'WA', label: 'Washington', hub: 'Quincy / Central Washington' },
  { code: 'AZ', label: 'Arizona', hub: 'Phoenix Metro' },
  { code: 'GA', label: 'Georgia', hub: 'Atlanta Metro' },
  { code: 'NC', label: 'North Carolina', hub: 'Research Triangle / Charlotte' },
  { code: 'OH', label: 'Ohio', hub: 'Columbus / New Albany' },
  { code: 'IA', label: 'Iowa', hub: 'Des Moines Corridor' },
  { code: 'IL', label: 'Illinois', hub: 'Chicago Metro' },
  { code: 'NV', label: 'Nevada', hub: 'Reno / Tahoe' }
];

const ELECTRICITY_MAPS_PRIORITY_ZONES = [
  { zone: 'US-MIDA-PJM', label: 'PJM Interconnection', hubs: ['Northern Virginia', 'Columbus'], states: ['VA', 'OH'] },
  { zone: 'US-TEX-ERCO', label: 'ERCOT', hubs: ['Dallas-Fort Worth', 'Austin-San Antonio'], states: ['TX'] },
  { zone: 'US-CAL-CISO', label: 'CAISO', hubs: ['Northern California'], states: ['CA'] },
  { zone: 'US-NW-BPAT', label: 'Bonneville Power Administration', hubs: ['Central Washington'], states: ['WA'] },
  { zone: 'US-NW-PGE', label: 'Portland General Electric', hubs: ['Hillsboro / Portland'], states: ['OR'] },
  { zone: 'US-NW-PSEI', label: 'Puget Sound Energy', hubs: ['Puget Sound'], states: ['WA'] },
  { zone: 'US-SW-AZPS', label: 'Arizona Public Service', hubs: ['Phoenix Metro'], states: ['AZ'] },
  { zone: 'US-SW-SRP', label: 'Salt River Project', hubs: ['Phoenix Metro'], states: ['AZ'] },
  { zone: 'US-SE-SOCO', label: 'Southern Company', hubs: ['Atlanta Metro'], states: ['GA'] },
  { zone: 'US-CAR-DUK', label: 'Duke Energy Carolinas', hubs: ['Charlotte / Triad'], states: ['NC'] },
  { zone: 'US-CAR-CPLE', label: 'Duke Energy Progress East', hubs: ['Research Triangle'], states: ['NC'] },
  { zone: 'US-MIDW-MISO', label: 'MISO', hubs: ['Chicago Fringe / Iowa'], states: ['IL', 'IA'] },
  { zone: 'US-NE-ISNE', label: 'ISO New England', hubs: ['New England'], states: ['MA'] },
  { zone: 'US-NY-NYIS', label: 'New York ISO', hubs: ['New York'], states: ['NY'] },
  { zone: 'US-TEN-TVA', label: 'Tennessee Valley Authority', hubs: ['Memphis / Nashville orbit'], states: ['TN'] },
  { zone: 'US-NW-NEVP', label: 'Nevada Power', hubs: ['Reno / Tahoe'], states: ['NV'] }
];

const CORPORATE_DISCLOSURES = [
  {
    operator: 'Google',
    operator_key: 'google',
    cadence: 'annual_or_periodic',
    excluded_from_operational_scoring: true,
    source_urls: ['https://datacenters.google/', 'https://datacenters.google/water/'],
    fields: {
      sustainability_report: 'linked_from_operator_portal',
      dedicated_water_page: 'present',
      portfolio_data_center_directory: 'present',
      data_center_specific_water_context: 'present',
      ai_specific_operational_disclosure: 'limited',
      third_party_assurance: 'unknown',
      comparability: 'limited'
    },
    notes: 'Use for operator context and stewardship claims only, not for core operational scoring.'
  },
  {
    operator: 'Microsoft',
    operator_key: 'microsoft',
    cadence: 'annual',
    excluded_from_operational_scoring: true,
    source_urls: ['https://www.microsoft.com/en-us/corporate-responsibility/sustainability/report'],
    fields: {
      sustainability_report: 'present',
      dedicated_water_page: 'unknown',
      portfolio_data_center_directory: 'not_in_primary_source',
      data_center_specific_water_context: 'mixed',
      ai_specific_operational_disclosure: 'limited',
      third_party_assurance: 'unknown',
      comparability: 'limited'
    },
    notes: 'Normalize as corporate disclosure metadata; keep separate from grid and water-risk layers.'
  },
  {
    operator: 'Meta',
    operator_key: 'meta',
    cadence: 'annual_or_periodic',
    excluded_from_operational_scoring: true,
    source_urls: ['https://sustainability.atmeta.com/'],
    fields: {
      sustainability_report: 'present',
      dedicated_water_page: 'unknown',
      portfolio_data_center_directory: 'mixed',
      data_center_specific_water_context: 'mixed',
      ai_specific_operational_disclosure: 'limited',
      third_party_assurance: 'unknown',
      comparability: 'limited'
    },
    notes: 'Useful for contextual disclosure and operator claims; not used for core operational scoring.'
  },
  {
    operator: 'Amazon',
    operator_key: 'amazon',
    cadence: 'annual_or_periodic',
    excluded_from_operational_scoring: true,
    source_urls: ['https://sustainability.aboutamazon.com/'],
    fields: {
      sustainability_report: 'present',
      dedicated_water_page: 'unknown',
      portfolio_data_center_directory: 'not_in_primary_source',
      data_center_specific_water_context: 'mixed',
      ai_specific_operational_disclosure: 'limited',
      third_party_assurance: 'unknown',
      comparability: 'limited'
    },
    notes: 'Normalize as disclosure metadata only; avoid treating CSR narrative as operational telemetry.'
  }
];

async function fetchEiaStateProfile(state, apiKey) {
  const params = new URLSearchParams();
  params.set('api_key', apiKey);
  params.set('frequency', 'annual');
  params.append('data[0]', 'generation');
  params.append('facets[location][]', state.code);
  params.append('facets[sectorid][]', '99');
  params.append('sort[0][column]', 'period');
  params.append('sort[0][direction]', 'desc');
  params.set('offset', '0');
  params.set('length', '500');

  const url = `https://api.eia.gov/v2/electricity/electric-power-operational-data/data/?${params.toString()}`;
  const payload = await fetchJson(url);
  const rows = payload.response?.data || [];

  const latestYear = rows.reduce((max, row) => Math.max(max, Number(row.period || 0)), 0);
  const latestRows = rows.filter(row => Number(row.period) === latestYear);
  const byFuel = Object.fromEntries(latestRows.map(row => [row.fueltypeid, Number(row.generation)]));
  const total = byFuel.ALL || null;

  const mix = total
    ? {
        fossil_pct: round(((byFuel.FOS || 0) / total) * 100),
        nuclear_pct: round(((byFuel.NUC || 0) / total) * 100),
        renewables_pct: round(((byFuel.AOR || 0) / total) * 100),
        gas_pct: round(((byFuel.NG || 0) / total) * 100),
        coal_pct: round(((byFuel.COL || 0) / total) * 100),
        solar_pct: round(((byFuel.SUN || 0) / total) * 100),
        wind_pct: round(((byFuel.WND || 0) / total) * 100),
        hydro_pct: round(((byFuel.HYC || 0) / total) * 100),
        biomass_pct: round(((byFuel.BIO || 0) / total) * 100),
        petroleum_pct: round(((byFuel.PET || 0) / total) * 100)
      }
    : {};

  return {
    state_code: state.code,
    state_name: state.label,
    data_center_hub: state.hub,
    latest_year: String(latestYear),
    annual_generation_thousand_mwh: total ? round(total, 3) : null,
    annual_generation_mix_pct: mix,
    source: 'EIA Electric Power Operations (Form EIA-923)'
  };
}

async function fetchElectricityMapsZone(zoneMeta, token) {
  const headers = { 'auth-token': token };
  const zone = zoneMeta.zone;

  const latestCarbon = await fetchJson(`https://api.electricitymaps.com/v3/carbon-intensity/latest?zone=${zone}`, { headers });
  await sleep(120);
  const latestRenewable = await fetchJson(`https://api.electricitymaps.com/v3/renewable-energy/latest?zone=${zone}`, { headers });
  await sleep(120);
  const latestCarbonFree = await fetchJson(`https://api.electricitymaps.com/v3/carbon-free-energy/latest?zone=${zone}`, { headers });
  await sleep(120);

  let history = null;
  let powerBreakdown = null;

  try {
    history = await fetchJson(`https://api.electricitymaps.com/v3/carbon-intensity/history?zone=${zone}`, { headers });
  } catch (error) {
    history = { error: error.message };
  }
  await sleep(120);

  try {
    powerBreakdown = await fetchJson(`https://api.electricitymaps.com/v3/power-breakdown/latest?zone=${zone}`, { headers });
  } catch (error) {
    powerBreakdown = { error: error.message };
  }

  const historyValues = Array.isArray(history?.history)
    ? history.history.map(item => item.carbonIntensity).filter(value => typeof value === 'number')
    : [];

  return {
    zone: zoneMeta.zone,
    label: zoneMeta.label,
    hubs: zoneMeta.hubs,
    mapped_states: zoneMeta.states,
    snapshot: {
      captured_at: latestCarbon.updatedAt || latestCarbon.datetime || null,
      carbon_intensity_gco2eq_kwh: latestCarbon.carbonIntensity ?? null,
      carbon_intensity_24h_avg_gco2eq_kwh: historyValues.length ? round(historyValues.reduce((sum, value) => sum + value, 0) / historyValues.length) : null,
      carbon_intensity_24h_min_gco2eq_kwh: historyValues.length ? Math.min(...historyValues) : null,
      carbon_intensity_24h_max_gco2eq_kwh: historyValues.length ? Math.max(...historyValues) : null,
      renewable_percentage: latestRenewable.value ?? null,
      carbon_free_percentage: latestCarbonFree.value ?? null,
      emission_factor_type: latestCarbon.emissionFactorType ?? null,
      temporal_granularity: latestCarbon.temporalGranularity ?? null,
      top_power_sources_mw: powerBreakdown?.powerConsumptionBreakdown ? topMixEntries(powerBreakdown.powerConsumptionBreakdown) : [],
      power_consumption_total_mw: powerBreakdown?.powerConsumptionTotal ?? null,
      power_production_total_mw: powerBreakdown?.powerProductionTotal ?? null
    },
    raw: {
      latest_carbon_intensity: latestCarbon,
      latest_renewable_energy: latestRenewable,
      latest_carbon_free_energy: latestCarbonFree,
      carbon_intensity_history: history,
      power_breakdown_latest: powerBreakdown
    }
  };
}

async function fetchElectricityMapsUsCurrent(token) {
  const headers = { 'auth-token': token };
  const zoneCatalog = await fetchJson('https://api.electricitymaps.com/v3/zones', { headers });
  const usZones = Object.entries(zoneCatalog)
    .filter(([key, value]) => key.startsWith('US') && Array.isArray(value.subZoneKeys) && value.subZoneKeys.length === 0)
    .map(([key, value]) => ({ key, zoneName: value.zoneName, parent: value.zoneParentKey, tier: value.tier }));

  const latestZoneMetrics = await mapWithConcurrency(usZones, 4, async zone => {
    const base = { zone: zone.key, zone_name: zone.zoneName, parent_zone: zone.parent, tier: zone.tier };
    try {
      const [carbon, renewable, carbonFree] = await Promise.all([
        fetchJson(`https://api.electricitymaps.com/v3/carbon-intensity/latest?zone=${zone.key}`, { headers }),
        fetchJson(`https://api.electricitymaps.com/v3/renewable-energy/latest?zone=${zone.key}`, { headers }),
        fetchJson(`https://api.electricitymaps.com/v3/carbon-free-energy/latest?zone=${zone.key}`, { headers })
      ]);
      return {
        ...base,
        snapshot_at: carbon.updatedAt || carbon.datetime || null,
        carbon_intensity_gco2eq_kwh: carbon.carbonIntensity ?? null,
        renewable_percentage: renewable.value ?? null,
        carbon_free_percentage: carbonFree.value ?? null,
        emission_factor_type: carbon.emissionFactorType ?? null,
        temporal_granularity: carbon.temporalGranularity ?? null
      };
    } catch (error) {
      return {
        ...base,
        error: error.message
      };
    }
  });

  return { usZones, latestZoneMetrics };
}

async function main() {
  await loadEnvFile(ENV_PATH);

  const eiaKey = process.env.EIA_API_KEY;
  const electricityMapsKey = process.env.ELECTRICITY_MAPS_API_KEY;

  if (!eiaKey) throw new Error('Missing EIA_API_KEY in .env.local');
  if (!electricityMapsKey) throw new Error('Missing ELECTRICITY_MAPS_API_KEY in .env.local');

  await mkdir(PUBLIC_DIR, { recursive: true });

  const [eiaStates, electricityMapsPriority, electricityMapsUs] = await Promise.all([
    mapWithConcurrency(DATA_CENTER_STATES, 3, state => fetchEiaStateProfile(state, eiaKey)),
    mapWithConcurrency(ELECTRICITY_MAPS_PRIORITY_ZONES, 2, zone => fetchElectricityMapsZone(zone, electricityMapsKey)),
    fetchElectricityMapsUsCurrent(electricityMapsKey)
  ]);

  const snapshotCapturedAt = new Date().toISOString();

  const summary = {
    version: '2026-06-27',
    captured_at: snapshotCapturedAt,
    cadence_days: 42,
    caveats: [
      'Electricity Maps trial access was used to freeze current snapshots only; no short-cycle live feed is wired into the UI.',
      'Electricity Maps historical access appears limited to short-range history on the current trial, so the frozen operational layer is treated as a snapshot, not an annual baseline.',
      'Corporate disclosures are normalized into a separate context layer and are explicitly excluded from core operational scoring.'
    ],
    iea_energy_and_ai: {
      source: 'https://www.iea.org/reports/energy-and-ai',
      source_section: 'Executive summary; Energy demand from AI; AI and climate change',
      publication_date: '2025-04-10',
      observed_2024: {
        data_center_electricity_twh: 415,
        share_of_global_electricity_pct: 1.5,
        indirect_electricity_co2_mt: 180,
        emissions_share_of_global_fuel_combustion_co2_pct: 0.5
      },
      base_case: {
        data_center_electricity_2030_twh: 945,
        indirect_electricity_co2_2030_peak_mt: 320,
        indirect_electricity_co2_2035_mt: 300
      },
      sensitivity: {
        data_center_electricity_2035_low_twh: 700,
        data_center_electricity_2035_high_twh: 1700,
        high_efficiency_electricity_reduction_2035_pct: 20
      },
      ai_boundary: 'The observed electricity and emissions totals cover all data-centre workloads; AI is a subset. IEA identifies accelerated servers, mainly driven by AI adoption, as almost half of projected net data-centre electricity growth from 2024 to 2030.',
      emissions_boundary: 'Indirect carbon dioxide from consumed electricity only; backup generation, construction, hardware manufacturing and other lifecycle emissions are excluded.',
      uncertainty: 'Future electricity demand depends on AI adoption, hardware and software efficiency, data-centre utilisation, deployment bottlenecks and energy-system supply. Scenario values are not confidence intervals.'
    },
    eia: {
      source: 'https://api.eia.gov/v2/electricity/electric-power-operational-data/',
      latest_year: eiaStates[0]?.latest_year || null,
      state_profiles: eiaStates
    },
    electricity_maps: {
      source: 'https://api.electricitymaps.com/v3/',
      latest_snapshot_at: snapshotCapturedAt,
      priority_zone_snapshots: electricityMapsPriority.map(item => ({
        zone: item.zone,
        label: item.label,
        hubs: item.hubs,
        mapped_states: item.mapped_states,
        snapshot: item.snapshot
      })),
      current_us_zone_count: electricityMapsUs.latestZoneMetrics.length
    },
    disclosures: {
      excluded_from_operational_scoring: true,
      cadence_days: 56,
      operators: CORPORATE_DISCLOSURES
    }
  };

  await Promise.all([
    writeFile(path.join(PUBLIC_DIR, 'data-center-platform-summary.json'), JSON.stringify(summary, null, 2)),
    writeFile(
      path.join(PUBLIC_DIR, 'data-center-electricitymaps-us-zones.json'),
      JSON.stringify(
        {
          captured_at: snapshotCapturedAt,
          source: 'https://api.electricitymaps.com/v3/',
          zones: electricityMapsUs.latestZoneMetrics
        },
        null,
        2
      )
    ),
    writeFile(
      path.join(PUBLIC_DIR, 'data-center-operational-snapshots.json'),
      JSON.stringify(
        {
          captured_at: snapshotCapturedAt,
          eia_state_profiles: eiaStates,
          electricity_maps_priority_zones: electricityMapsPriority
        },
        null,
        2
      )
    ),
    writeFile(
      path.join(PUBLIC_DIR, 'data-center-disclosures.json'),
      JSON.stringify(
        {
          captured_at: snapshotCapturedAt,
          excluded_from_operational_scoring: true,
          operators: CORPORATE_DISCLOSURES
        },
        null,
        2
      )
    )
  ]);

  console.log(
    JSON.stringify(
      {
        ok: true,
        captured_at: snapshotCapturedAt,
        eia_states: eiaStates.length,
        electricity_maps_priority_zones: electricityMapsPriority.length,
        electricity_maps_us_zones: electricityMapsUs.latestZoneMetrics.length
      },
      null,
      2
    )
  );
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
