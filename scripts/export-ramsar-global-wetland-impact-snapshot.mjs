import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/ramsar-global-wetland-impact-snapshot.json');
const snapshot = {
  version: 'ramsar_global_wetland_outlook_2025_impact_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'ramsar_global_wetland_outlook_2025',
    name: 'Convention on Wetlands Global Wetland Outlook 2025',
    publisher: 'Secretariat of the Convention on Wetlands',
    url: 'https://www.global-wetland-outlook.ramsar.org/',
    key_messages_url: 'https://www.global-wetland-outlook.ramsar.org/key-messages',
    technical_notes_url: 'https://www.ramsar.org/document/global-wetland-outlook-2025-technical-notes',
    doi: '10.69556/GWO-2025-eng'
  },
  ingestion_job_id: 'export_ramsar_global_wetland_impact_snapshot',
  metric_contract_ids: ['wetland_area_drained_or_converted'],
  contract_bindings: [{ node_id: 'wetlands_drainage_scales', metric_id: 'wetland_area_drained_or_converted', measurement_role: 'global_accumulated_wetland_loss_degradation_and_service_loss_assessment' }],
  cadence: 'Global Wetland Outlook release review with annual Convention status check.',
  provenance: 'Official Convention on Wetlands global assessment values. Historical area loss, ongoing decline, remaining-condition share and valuation of services already lost remain separate fields.',
  uncertainty: 'Wetland definitions, historical baselines, mapping and reporting coverage vary by type and region. Economic values use benefit-transfer and valuation models and are not market transactions. Global wetland extent remains uncertain.',
  failure_behavior: 'Retain the last reviewed assessment and mark stale; reject changed area, price-year or valuation boundaries. Never relabel all wetland loss as agricultural drainage, add degraded and lost area, or score projected 2050 losses as realized impacts.',
  assessment: {
    report_year: 2025,
    baseline_year: 1970,
    assessment_period_years: 55,
    wetland_area_lost_million_hectares: 411,
    wetland_share_lost_pct: 22,
    ongoing_annual_decline_pct: 0.52,
    remaining_wetland_area_million_hectares: 1425,
    remaining_wetlands_poor_condition_pct: 25,
    accumulated_services_lost_trillion_2023_intl_usd: 5.1,
    remaining_annual_services_value_trillion_2023_intl_usd_median: 7.98,
    remaining_annual_services_value_trillion_2023_intl_usd_mean: 39.01,
    assessed_natural_wetland_types: 11,
    geographic_scope: 'global assessment across all natural wetland types and regions',
    global_extent_normalized: 1,
    source_locators: [
      'Global Wetland Outlook 2025: 411 million hectares, approximately 22 percent of the global total, lost since 1970.',
      'Global Wetland Outlook 2025: ongoing average annual wetland decline of 0.52 percent.',
      'Global Wetland Outlook 2025: approximately 25 percent of remaining wetlands are in poor ecological condition.',
      'Global Wetland Outlook 2025 key messages: global value of wetlands lost over the last 50 years exceeds 5.1 trillion 2023 international dollars.'
    ]
  },
  excluded_from_scoring: ['projected 2050 wetland loss', 'future net-present-value benefits', 'restoration opportunity value', 'all remaining wetland service value as realized loss']
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, area_lost_million_hectares: snapshot.assessment.wetland_area_lost_million_hectares }, null, 2));
