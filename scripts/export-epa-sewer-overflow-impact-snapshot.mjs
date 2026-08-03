import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const snapshot = {
  version: 'epa_echo_sewer_overflow_bypass_through_2025_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'epa_echo_national_cso_inventory_2026',
      name: 'EPA ECHO National Combined Sewer Overflow Inventory',
      publisher: 'U.S. Environmental Protection Agency',
      url: 'https://echo.epa.gov/tools/data-downloads/cso-inventory-summary',
      download_url: 'https://echo.epa.gov/files/echodownloads/ALL_CSO_downloads.zip',
      data_date: '2026-07-25',
      archive_sha256: 'ec42f85d95b769d93a145dbff2819efe464f2dfb28bf7e7b8eb6a3d30458e1f2',
      extracted_csv_sha256: 'f887b6d4dc2575f94fd17388caabc71c35476436245471e7f769c6e367282627'
    },
    {
      id: 'epa_echo_sewer_overflow_bypass_events_2026',
      name: 'EPA ECHO Sewer Overflow and Bypass Event Dataset',
      publisher: 'U.S. Environmental Protection Agency',
      url: 'https://echo.epa.gov/tools/data-downloads/sewer-overflow-download-summary',
      download_url: 'https://echo.epa.gov/files/echodownloads/current_sewer_overflow_and_collection_systems_tables.zip',
      data_date: '2026-07-30',
      archive_sha256: '8444df9ca6575c58d2ecacbd26c9abe6e010b27c833a6f1bcf61813bace1e601',
      event_csv_sha256: '83365d4af4468497d8b8aa7ab0d8260ca53db5c8016479d25d134df0a18890e6',
      type_csv_sha256: '444d9ce82f6e8476e335781514a7aea6786ddc2267d25939b1da5e4567a19485'
    },
    {
      id: 'epa_cso_annual_volume_and_population_assessment',
      name: 'EPA Urbanization — Wastewater Inputs',
      publisher: 'U.S. Environmental Protection Agency',
      url: 'https://www.epa.gov/caddis/urbanization-wastewater-inputs',
      validation: 'EPA reports approximately 850 billion gallons of untreated wastewater and stormwater released annually and about 40 million people served by combined sewer systems; these national estimates are retained as context rather than added to standardized event totals.'
    }
  ],
  metric_contract: {
    unit: 'reported events, gallons, duration-hours, documented impact records, permits, facilities and outfalls reported separately',
    geography: 'United States NPDES jurisdictions represented in EPA ECHO',
    cadence: 'event reports through complete calendar year 2025 plus the current CSO outfall inventory',
    type_codes: { CSO: 'Combined Sewer Overflow Event', SSO: 'Sanitary Sewer Overflow Event', BYP: 'Bypass Event' },
    failure_boundary: 'EPA states that the standardized event dataset is still developing and does not represent all events covered by the NPDES eRule. Volume and duration coverage are incomplete, older historical records are uneven, and the current inventory is an outfall inventory rather than an event-frequency series.'
  },
  current_cso_inventory: {
    total_rows: 9643,
    active_nonclosed_untreated_or_treated_outfalls: 7412,
    active_permits: 736,
    active_facilities: 728,
    states_and_jurisdictions_with_active_outfalls: 33
  },
  event_extraction: {
    current_version_event_rows: 4782,
    event_rows_through_2025: 2626,
    partial_2026_rows_excluded: 2156,
    cutoff: '2025-12-31',
    join_key: 'sewer_overflow_bypass_event_key',
    volume_rule: 'Sum only nonblank reported discharge-volume gallons; retain reported-volume coverage counts.',
    impact_rule: 'Count joined impact rows whose description is not No observable impacts; retain specific human-health and ecosystem categories separately.'
  },
  assessments: {
    combined_sewer_overflow: {
      node_id: 'combined_sewer_overflow',
      metric_id: 'combined_sewer_overflow_event',
      included_type_codes: ['CSO'],
      events: 215,
      volume_reported_events: 210,
      reported_discharge_volume_gallons: 2479625133,
      duration_reported_events: 211,
      reported_duration_hours: 4603.8,
      permit_count: 25,
      years_with_records: 4,
      first_record_year: 2022,
      last_record_year: 2025,
      observable_impact_records: 72,
      human_exposure_records: 2,
      building_backup_records: 15,
      shellfish_contamination_records: 1,
      aquatic_life_or_habitat_impairment_records: 45,
      directly_assessed_countries: ['United States'],
      directly_assessed_country_count: 1
    },
    wastewater_bypass_discharge: {
      node_id: 'wastewater_bypass_discharge',
      metric_id: 'untreated_wastewater_bypass_volume',
      included_type_codes: ['BYP'],
      events: 229,
      volume_reported_events: 169,
      reported_discharge_volume_gallons: 265145608.9,
      duration_reported_events: 180,
      reported_duration_hours: 47641.18,
      permit_count: 107,
      years_with_records: 7,
      first_record_year: 2019,
      last_record_year: 2025,
      observable_impact_records: 46,
      human_exposure_records: 1,
      building_backup_records: 2,
      beach_contamination_records: 1,
      aquatic_life_or_habitat_impairment_records: 8,
      directly_assessed_countries: ['United States'],
      directly_assessed_country_count: 1
    },
    wastewater_infrastructure_overflow: {
      node_id: 'wastewater_infrastructure_overflow',
      metric_id: 'sewer_overflow_volume_and_events',
      included_type_codes: ['CSO', 'SSO'],
      events: 2397,
      volume_reported_events: 1795,
      reported_discharge_volume_gallons: 2754124497.2,
      duration_reported_events: 2348,
      reported_duration_hours: 44178.64,
      permit_count: 440,
      years_with_records: 7,
      first_record_year: 2019,
      last_record_year: 2025,
      observable_impact_records: 1175,
      human_exposure_records: 258,
      building_backup_records: 150,
      drinking_water_contamination_records: 4,
      beach_contamination_records: 9,
      shellfish_contamination_records: 4,
      aquatic_life_or_habitat_impairment_records: 87,
      fish_kill_records: 1,
      directly_assessed_countries: ['United States'],
      directly_assessed_country_count: 1
    }
  },
  shared_normalization_anchors: {
    reported_discharge_volume_gallons: [0, 1000000, 100000000, 10000000000],
    observable_impact_records: [0, 10, 100, 1000],
    years_with_records: [0, 1, 5, 20],
    directly_assessed_country_count: [0, 1, 5, 25]
  },
  uncertainty: 'The standardized EPA event dataset is incomplete nationally and heavily reflects jurisdictions that have implemented electronic reporting. Partial 2026 is excluded, but 2019-2025 historical coverage is not uniform. Missing volume or duration is never converted to zero. Observable-impact rows are administrative classifications and can contain multiple impacts per event. The U.S.-only assessment is not extrapolated globally, and the separate national annual-volume estimate is contextual rather than added to event-reported gallons.'
};

await fs.writeFile(path.join(ROOT, 'public/epa-sewer-overflow-impact-snapshot.json'), `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: 'public/epa-sewer-overflow-impact-snapshot.json', version: snapshot.version, assessments: Object.keys(snapshot.assessments) }, null, 2));
