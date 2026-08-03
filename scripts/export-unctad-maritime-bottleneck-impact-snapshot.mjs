import fs from 'node:fs/promises';
import path from 'node:path';

const OUTPUT_PATH = path.resolve('public/unctad-maritime-bottleneck-impact-snapshot.json');
const snapshot = {
  version: 'unctad_review_maritime_transport_2024_2025_bottleneck_v1',
  captured_at: new Date().toISOString(),
  source: {
    id: 'unctad_review_of_maritime_transport_2024',
    name: 'UNCTAD Review of Maritime Transport 2024 and 2025',
    publisher: 'UN Trade and Development',
    report_2024_url: 'https://unctad.org/publication/review-maritime-transport-2024',
    report_2025_url: 'https://unctad.org/publication/review-maritime-transport-2025',
    freight_update_url: 'https://unctad.org/news/high-freight-rates-strain-global-supply-chains-threaten-vulnerable-economies'
  },
  ingestion_job_id: 'export_unctad_maritime_bottleneck_impact_snapshot',
  metric_contract_ids: ['port_dwell_time_and_queue', 'seaborne_trade_and_ship_fuel_use', 'shipping_route_delay_and_diversion'],
  contract_bindings: [
    { node_id: 'supply_chain_port_bottlenecks', metric_id: 'port_dwell_time_and_queue', measurement_role: 'global_maritime_chokepoint_port_and_rerouting_burden_primary' },
    { node_id: 'shipping', metric_id: 'seaborne_trade_and_ship_fuel_use', measurement_role: 'global_current_shipping_activity_fuel_transition_and_emissions_primary' },
    { node_id: 'shipping_lane_disruption', metric_id: 'shipping_route_delay_and_diversion', measurement_role: 'global_accumulated_rerouting_ton_mile_freight_cost_persistence_and_trade_extent' }
  ],
  cadence: 'Annual Review of Maritime Transport release with quarterly UNCTAD freight and chokepoint update checks.',
  provenance: 'Official UNCTAD Review of Maritime Transport 2024 and 2025 findings, retaining seaborne-trade exposure, rerouting ton-mile effects, port congestion context and freight-rate comparisons separately.',
  uncertainty: 'Freight indices cover selected routes and prices; port calls are activity rather than congestion duration; rerouting attribution, vessel capacity, cargo mix, blank sailings, contracts, fuel, insurance and reporting timing affect comparisons.',
  failure_behavior: 'Retain the last reviewed report pair and mark stale; reject mixed freight-index dates or unreconciled trade and ton-mile growth. Never convert port calls to delay, attribute all freight inflation to ports, or score projected consumer-price effects as realized losses.',
  assessment: {
    latest_report_year: 2025,
    disruption_start_year: 2023,
    measured_burden_year: 2024,
    seaborne_share_of_world_trade_volume_pct: 80,
    vessel_ton_mile_growth_due_to_longer_routes_2023_pct: 4.2,
    vessel_ton_mile_growth_2024_pct: 5.9,
    maritime_trade_volume_growth_2024_pct: 2,
    shipping_carbon_emissions_growth_2024_pct: 5,
    active_fleet_conventional_fuel_share_pct_lower_bound: 90,
    world_fleet_vessels_january_2025: 112500,
    world_fleet_deadweight_tonnage_billion_january_2025: 2.44,
    ton_mile_growth_multiple_vs_trade_volume_growth_2024: 2.95,
    scfi_october_2024_above_pre_pandemic_average_pct: 115,
    scfi_october_2024_vs_2024_high_pct: -45,
    scfi_october_2024_vs_2023_average_multiple_lower_bound: 2,
    port_congestion_status: 'persistent in 2024 and into 2025',
    persistence_years: 2,
    source_locators: [
      'UNCTAD Review of Maritime Transport 2025 overview: 2024 ton-miles rose 5.9 percent, nearly three times trade-volume growth.',
      'UNCTAD Review of Maritime Transport 2025 chapter 2: shipping carbon emissions increased an estimated 5 percent in 2024 over 2023.',
      'UNCTAD Review of Maritime Transport 2025 overview: over 90 percent of the active fleet still runs on conventional fuels; January 2025 fleet counted 112,500 vessels and 2.44 billion deadweight tons.',
      'UNCTAD Review of Maritime Transport 2024: over 80 percent of world trade volume moves by sea and 2023 route disruptions raised ton-miles 4.2 percent.',
      'UNCTAD freight update, 18 October 2024: SCFI remained 115 percent above the pre-pandemic average and more than double the 2023 average.',
      'UNCTAD Review of Maritime Transport 2025 chapter 3: port congestion persisted through 2024 and into 2025.'
    ]
  },
  excluded_from_scoring: ['projected 2025 consumer-price changes', 'route-specific spot rates', 'projected future trade growth', 'port-call count treated as dwell time']
};
await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(snapshot, null, 2)}\n`);
console.log(JSON.stringify({ output: OUTPUT_PATH, report_years: [2024, 2025], ton_mile_growth_2024_pct: snapshot.assessment.vessel_ton_mile_growth_2024_pct }, null, 2));
