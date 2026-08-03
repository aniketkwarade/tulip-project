import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');

const INPUTS = {
  facilities: 'data-center-facilities-osm.json',
  aqueduct: 'data-center-aqueduct-context.json',
  electricityMaps: 'data-center-electricitymaps-us-zones.json',
  eiaGrid: 'eia-hourly-grid-snapshot.json',
  heat: 'power-heat-hazard-snapshot.json',
  drought: 'copernicus-drought-persistence-snapshot.json',
  coastalFlood: 'noaa-coops-high-tide-flood-snapshot.json',
  urbanHeat: 'urban-heat-island-snapshot.json',
  wildfire: 'gwis-wildfire-regime-snapshot.json'
};

const OUTPUT_PATH = path.join(PUBLIC_DIR, 'data-center-environment-context.json');
const SOURCE_IDS = Object.freeze({
  facilities: 'openstreetmap_data_center_facilities',
  aqueduct: 'wri_aqueduct_4_baseline_annual',
  electricityMaps: 'electricity_maps',
  eiaGrid: 'eia_hourly_electric_grid_monitor',
  heat: 'nasa_power_open_api',
  drought: 'copernicus_european_and_global_drought_observatories',
  coastalFlood: 'noaa_co_ops_derived_product_api',
  urbanHeat: 'eea_urban_heat_island_arcgis',
  wildfire: 'ec_jrc_global_wildfire_information_system_mcd64a1_burned_area'
});

const STATE_NAME_TO_CODE = Object.freeze({
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS',
  Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK',
  Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT',
  Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY', 'District of Columbia': 'DC'
});

const GRID_MARKETS = Object.freeze([
  {
    respondent_id: 'PJM',
    zone: 'US-MIDA-PJM',
    states: ['DE', 'IL', 'IN', 'KY', 'MD', 'MI', 'NJ', 'NC', 'OH', 'PA', 'TN', 'VA', 'WV', 'DC']
  },
  {
    respondent_id: 'MISO',
    zone: 'US-MIDW-MISO',
    states: ['AR', 'IL', 'IN', 'IA', 'KY', 'LA', 'MI', 'MN', 'MS', 'MO', 'MT', 'ND', 'SD', 'TX', 'WI']
  },
  {
    respondent_id: 'ERCO',
    zone: 'US-TEX-ERCO',
    states: ['TX']
  },
  {
    respondent_id: 'CISO',
    zone: 'US-CAL-CISO',
    states: ['CA']
  },
  {
    respondent_id: 'NYIS',
    zone: 'US-NY-NYIS',
    states: ['NY']
  },
  {
    respondent_id: 'ISNE',
    zone: 'US-NE-ISNE',
    states: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT']
  },
  {
    respondent_id: 'SWPP',
    zone: 'US-CENT-SWPP',
    states: ['AR', 'IA', 'KS', 'LA', 'MN', 'MO', 'MT', 'NE', 'NM', 'ND', 'OK', 'SD', 'TX', 'WY']
  }
]);

function round(value, digits = 2) {
  return Number(value.toFixed(digits));
}

function haversineKm(a, b) {
  const toRadians = degrees => (degrees * Math.PI) / 180;
  const earthRadiusKm = 6371.0088;
  const latitudeDelta = toRadians(b.latitude - a.latitude);
  const longitudeDelta = toRadians(b.longitude - a.longitude);
  const latitudeA = toRadians(a.latitude);
  const latitudeB = toRadians(b.latitude);
  const h =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(latitudeA) * Math.cos(latitudeB) * Math.sin(longitudeDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function nearestContext(facility, candidates, { latitude, longitude, maximumDistanceKm, sourceId, select }) {
  const point = facility.coordinates;
  let nearest = null;
  for (const candidate of candidates) {
    const candidatePoint = {
      latitude: Number(candidate[latitude]),
      longitude: Number(candidate[longitude])
    };
    if (!Number.isFinite(candidatePoint.latitude) || !Number.isFinite(candidatePoint.longitude)) continue;
    const distanceKm = haversineKm(point, candidatePoint);
    if (!nearest || distanceKm < nearest.distanceKm) nearest = { candidate, distanceKm };
  }

  if (!nearest) {
    return {
      status: 'source_has_no_valid_points',
      source_id: sourceId,
      method: 'nearest_source_point_with_maximum_distance',
      maximum_distance_km: maximumDistanceKm,
      nearest_distance_km: null,
      context: null
    };
  }

  const matched = nearest.distanceKm <= maximumDistanceKm;
  return {
    status: matched ? 'matched_nearby_context' : 'outside_supported_distance',
    source_id: sourceId,
    method: 'nearest_source_point_with_maximum_distance',
    maximum_distance_km: maximumDistanceKm,
    nearest_distance_km: round(nearest.distanceKm),
    context: matched ? select(nearest.candidate) : null
  };
}

function countMatched(records, accessor) {
  return records.filter(record => accessor(record).startsWith('matched')).length;
}

function distribution(records, accessor) {
  const counts = new Map();
  for (const record of records) {
    const value = accessor(record);
    const key = value === null || value === undefined ? 'missing' : String(value);
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return Object.fromEntries([...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

async function loadJson(fileName) {
  return JSON.parse(await readFile(path.join(PUBLIC_DIR, fileName), 'utf8'));
}

async function main() {
  const [
    facilities,
    aqueduct,
    electricityMaps,
    eiaGrid,
    heat,
    drought,
    coastalFlood,
    urbanHeat,
    wildfire
  ] = await Promise.all(Object.values(INPUTS).map(loadJson));

  const aqueductByFacility = new Map(aqueduct.records.map(record => [record.facility_record_id, record]));
  const electricityByZone = new Map(electricityMaps.zones.map(record => [record.zone, record]));
  const eiaByRespondent = new Map(eiaGrid.records.map(record => [record.respondent_id, record]));
  const wildfireByCountry = new Map(wildfire.records.map(record => [record.country_code, record]));

  const records = facilities.records.map(facility => {
    const aqueductJoin = aqueductByFacility.get(facility.record_id);
    if (!aqueductJoin) throw new Error(`Missing Aqueduct join record for ${facility.record_id}`);
    const water = aqueductJoin.match;
    const admin = water.aqueduct;
    const stateCode = admin?.gid_0 === 'USA' ? STATE_NAME_TO_CODE[admin.name_1] || null : null;
    const candidateMarkets = stateCode
      ? GRID_MARKETS.filter(market => market.states.includes(stateCode))
      : [];

    const gridContext = {
      status: candidateMarkets.length ? 'matched_candidate_markets' : 'outside_supported_us_market_panel',
      method: 'aqueduct_admin1_to_candidate_market_panel',
      assignment_status: 'candidate_context_not_verified_serving_territory',
      country_code: admin?.gid_0 || null,
      admin1_name: admin?.name_1 || null,
      state_code: stateCode,
      candidates: candidateMarkets.map(market => ({
        respondent_id: market.respondent_id,
        electricity_maps: electricityByZone.get(market.zone) || null,
        eia_hourly_grid: eiaByRespondent.get(market.respondent_id) || null
      }))
    };

    const heatContext = nearestContext(facility, heat.records, {
      latitude: 'latitude',
      longitude: 'longitude',
      maximumDistanceKm: 75,
      sourceId: heat.source.id,
      select: record => ({
        record_id: record.record_id,
        location_name: record.location_name,
        observation_year: record.observation_year,
        maximum_wet_bulb_c: record.maximum_wet_bulb_c,
        wet_bulb_p95_c: record.wet_bulb_p95_c,
        hours_ge_28c: record.hours_ge_28c,
        hours_ge_30c: record.hours_ge_30c,
        maximum_vapour_pressure_deficit_kpa: record.maximum_vapour_pressure_deficit_kpa,
        annual_maximum_precipitation_anomaly_pct: record.annual_maximum_precipitation_anomaly_pct
      })
    });

    const droughtContext = nearestContext(facility, drought.records, {
      latitude: 'requested_latitude',
      longitude: 'requested_longitude',
      maximumDistanceKm: 50,
      sourceId: drought.source.id,
      select: record => ({
        record_id: record.record_id,
        location_name: record.location_name,
        observation_year: record.observation_year,
        grid_latitude: record.grid_latitude,
        grid_longitude: record.grid_longitude,
        drought_months: record.drought_months,
        longest_consecutive_drought_months: record.longest_consecutive_drought_months,
        minimum_spi6: record.minimum_spi6,
        minimum_spi6_month: record.minimum_spi6_month
      })
    });

    const coastalFloodContext = nearestContext(facility, coastalFlood.records, {
      latitude: 'latitude',
      longitude: 'longitude',
      maximumDistanceKm: 50,
      sourceId: coastalFlood.source.id,
      select: record => ({
        record_id: record.record_id,
        station_id: record.station_id,
        station_name: record.station_name,
        observation_year: record.observation_year,
        datum: record.datum,
        minor_flood_days: record.minor_flood_days,
        moderate_flood_days: record.moderate_flood_days,
        major_flood_days: record.major_flood_days,
        maximum_daily_water_level_m: record.maximum_daily_water_level_m,
        maximum_daily_water_level_date: record.maximum_daily_water_level_date
      })
    });

    const urbanHeatContext = nearestContext(facility, urbanHeat.records, {
      latitude: 'latitude',
      longitude: 'longitude',
      maximumDistanceKm: 30,
      sourceId: urbanHeat.source.id,
      select: record => ({
        feature_id: record.feature_id,
        model_period: record.model_period,
        statistic: record.statistic,
        urban_heat_island_intensity_c: record.uhi_intensity_c
      })
    });

    const wildfireRecord = admin ? wildfireByCountry.get(admin.gid_0) : null;
    const wildfireContext = {
      status: wildfireRecord ? 'matched_country_context' : 'outside_supported_country_panel',
      source_id: wildfire.source.id,
      method: 'aqueduct_country_code_to_gwis_country_record',
      country_code: admin?.gid_0 || null,
      context: wildfireRecord
        ? {
            record_id: wildfireRecord.record_id,
            country_name: wildfireRecord.country_name,
            observation_year: wildfireRecord.observation_year,
            observation_non_cropland_burned_area_ha: wildfireRecord.observation_non_cropland_burned_area_ha,
            baseline_period: wildfireRecord.baseline_period,
            burned_area_anomaly_pct: wildfireRecord.burned_area_anomaly_pct,
            observation_season_span_months: wildfireRecord.observation_season_span_months
          }
        : null
    };

    return {
      facility: {
        record_id: facility.record_id,
        name: facility.name,
        operator: facility.operator,
        owner: facility.owner,
        lifecycle: facility.lifecycle,
        facility_classes: facility.facility_classes,
        coordinates: facility.coordinates,
        address: facility.address,
        source_record: facility.source_record
      },
      water_context: water,
      grid_context: gridContext,
      heat_context: heatContext,
      drought_context: droughtContext,
      coastal_flood_gauge_context: coastalFloodContext,
      urban_heat_context: urbanHeatContext,
      wildfire_context: wildfireContext
    };
  });

  const summary = {
    facility_count: records.length,
    water_context_matched: records.filter(record => record.water_context.status === 'matched').length,
    water_context_coverage_pct: round(
      (records.filter(record => record.water_context.status === 'matched').length / records.length) * 100
    ),
    baseline_water_stress_category: distribution(records, record => record.water_context.aqueduct?.bws_label),
    grid_candidate_context_matched: countMatched(records, record => record.grid_context.status),
    nearby_heat_context_matched: countMatched(records, record => record.heat_context.status),
    nearby_drought_context_matched: countMatched(records, record => record.drought_context.status),
    nearby_coastal_flood_gauge_context_matched: countMatched(
      records,
      record => record.coastal_flood_gauge_context.status
    ),
    nearby_urban_heat_context_matched: countMatched(records, record => record.urban_heat_context.status),
    wildfire_country_context_matched: countMatched(records, record => record.wildfire_context.status)
  };

  const output = {
    version: 'data_center_environment_context_v1',
    captured_at: new Date().toISOString(),
    summary,
    join_contracts: {
      water_context: {
        source_id: aqueduct.source.id,
        method: 'point_within_polygon',
        interpretation: 'Modeled basin/admin water-risk context, not measured facility water use or impact.'
      },
      grid_context: {
        source_ids: [SOURCE_IDS.electricityMaps, SOURCE_IDS.eiaGrid],
        method: 'Aqueduct country/admin1 to overlapping candidate market panel',
        interpretation: 'Candidate market context only. A state can overlap several balancing authorities; no serving utility is assigned.'
      },
      heat_context: {
        source_id: heat.source.id,
        method: 'nearest source panel point within 75 km',
        interpretation: 'Nearby gridded city-panel context only; values are not evaluated at the facility coordinate.'
      },
      drought_context: {
        source_id: drought.source.id,
        method: 'nearest source panel point within 50 km',
        interpretation: 'Nearby SPI-6 grid-cell context only; values are not evaluated at the facility coordinate.'
      },
      coastal_flood_gauge_context: {
        source_id: coastalFlood.source.id,
        method: 'nearest source gauge within 50 km',
        interpretation: 'Nearby coastal gauge history only; it does not establish facility inundation or floodplain exposure.'
      },
      urban_heat_context: {
        source_id: urbanHeat.source.id,
        method: 'nearest EEA city point within 30 km',
        interpretation: 'Modeled city-scale UHI context only; it is not a facility-site temperature measurement.'
      },
      wildfire_context: {
        source_id: wildfire.source.id,
        method: 'Aqueduct country code to bounded GWIS country panel',
        interpretation: 'National burned-area regime context only; it is not local facility wildfire exposure.'
      }
    },
    exclusions: [
      'No composite risk, environmental-impact, resilience, or suitability score is calculated.',
      'No electricity use, emissions, water consumption, cooling method, or load is inferred from facility presence.',
      'Unmatched and out-of-range contexts remain explicit rather than being filled from a distant observation.',
      'Campus, building, and operator records are not collapsed because the source inventory does not prove physical equivalence.'
    ],
    source_snapshots: Object.fromEntries(
      Object.entries({
        facilities,
        aqueduct,
        electricityMaps,
        eiaGrid,
        heat,
        drought,
        coastalFlood,
        urbanHeat,
        wildfire
      }).map(([key, snapshot]) => [
        key,
        {
          version: snapshot.version || null,
          captured_at: snapshot.captured_at || snapshot.updated_at || null,
          source_id: snapshot.source?.id || SOURCE_IDS[key]
        }
      ])
    ),
    records
  };

  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`Wrote ${records.length} joined data-center context records to ${OUTPUT_PATH}`);
  console.log(JSON.stringify(summary, null, 2));
}

await main();
