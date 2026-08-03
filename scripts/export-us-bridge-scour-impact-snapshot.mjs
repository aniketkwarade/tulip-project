import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scourCriticalBridgeCount = 19775;
const totalBridgeCount = 624193;
const openScourCriticalBridgeCount = 19190;

const snapshot = {
  version: 'us_fhwa_nbi_bridge_scour_2025_v1',
  captured_at: '2026-08-01T00:00:00.000Z',
  sources: [
    {
      id: 'fhwa_nbi_highway_bridges_2025',
      name: '2025 National Bridge Inventory highway bridge files',
      publisher: 'U.S. Federal Highway Administration',
      url: 'https://www.fhwa.dot.gov/BRIDGE/nbi/ascii2025.cfm'
    },
    {
      id: 'fhwa_snbi_scour_code_mapping',
      name: 'Specifications for the National Bridge Inventory code mapping: scour condition and vulnerability',
      publisher: 'U.S. Federal Highway Administration',
      url: 'https://www.fhwa.dot.gov/bridge/snbi/codemapping.cfm'
    },
    {
      id: 'fhwa_nbis_scour_plan_of_action_2023',
      name: 'National Bridge Inspection Standards questions and answers: scour plans of action',
      publisher: 'U.S. Federal Highway Administration',
      url: 'https://www.fhwa.dot.gov/bridge/nbis2022/qanda/08.cfm'
    }
  ],
  assessment: {
    coverage: {
      inventory_year: 2025,
      inventory_page_updated: '2025-06-20',
      state_and_territory_file_count: 53,
      highway_bridge_count: totalBridgeCount,
      guam_submitted_data: false,
      aggregate_input_sha256: '08bee5f1fcaea42a9c8389c33eea7960d0987b5881df743133755558b343fee4',
      aggregate_hash_method: 'SHA-256 over each state or territory filename followed by its complete delimited file bytes, in ascending filename order.'
    },
    scour_critical_burden: {
      declared_item: 'SCOUR_CRITICAL_113',
      recognized_scour_critical_codes: ['0', '1', '2', '3'],
      scour_critical_code_counts: { '0': 85, '1': 56, '2': 685, '3': 18949 },
      scour_critical_bridge_count: scourCriticalBridgeCount,
      scour_critical_share_pct: Number((100 * scourCriticalBridgeCount / totalBridgeCount).toFixed(6)),
      unknown_foundation_bridge_count: 24250,
      unknown_foundations_excluded_from_scour_critical_count: true,
      bridge_condition_counts: { poor: 5251, fair: 12067, good: 2457 }
    },
    traffic_exposure: {
      open_scour_critical_bridge_count: openScourCriticalBridgeCount,
      open_scour_critical_share_pct: Number((100 * openScourCriticalBridgeCount / scourCriticalBridgeCount).toFixed(6)),
      closed_scour_critical_bridge_count: 585,
      open_scour_critical_adt_record_count: 19190,
      open_scour_critical_daily_vehicle_crossings: 76075755,
      interpretation: 'Sum of bridge-level average daily traffic for scour-critical bridges whose operating-status code indicates an open, posted, restricted, shored, or temporary crossing. It is not a count of unique people or realized service failures.'
    },
    management_persistence: {
      scour_critical_bridges_requiring_unique_plan_of_action: scourCriticalBridgeCount,
      scour_critical_bridges_requiring_plan_of_action_pct: 100,
      monitoring_alone_removes_scour_critical_status: false,
      interpretation: 'FHWA requires a bridge-specific scour plan of action for every scour-critical bridge; monitoring alone does not remove the classification.'
    },
    geographic_extent: {
      jurisdictions_with_scour_critical_bridges: 52,
      reporting_jurisdiction_count: 53,
      directly_assessed_countries: ['United States'],
      directly_assessed_country_count: 1,
      scoring_boundary: 'The inventory is nationally comprehensive for the United States and participating territories but is not extrapolated to other countries.'
    }
  },
  reproduction: {
    analysis_script: 'scripts/analyze-fhwa-nbi-2025.mjs',
    command: 'node scripts/analyze-fhwa-nbi-2025.mjs <directory containing the 53 official 2025 state and territory delimited files>',
    required_record_total: totalBridgeCount
  },
  uncertainty: 'The NBI is a United States inventory, not a global bridge census. Item 113 is an engineering appraisal category rather than a failure probability. Average daily traffic values have different underlying observation years, count bridge crossings rather than unique users, and may include estimation. Traffic exposure therefore does not imply that a service failure occurred. Guam did not submit 2025 data, and unknown-foundation bridges are reported separately rather than classified as scour critical.'
};

await fs.writeFile(
  path.join(ROOT, 'public/us-bridge-scour-impact-snapshot.json'),
  `${JSON.stringify(snapshot, null, 2)}\n`
);

console.log(JSON.stringify({
  output: 'public/us-bridge-scour-impact-snapshot.json',
  version: snapshot.version,
  source_count: snapshot.sources.length,
  scour_critical_bridge_count: scourCriticalBridgeCount
}, null, 2));
