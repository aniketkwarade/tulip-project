export const UNSUPPORTED_FAMILY_RELATIONSHIP_DECISIONS = Object.freeze({
  'aviation->aviation_demand_growth': 'Demand is an upstream activity driver, not a demonstrated downstream effect of flight operations as represented by this direction.',
  'biodiversity_intactness_loss->wetland_peat_fires': 'Shared ecosystem degradation does not establish that aggregate intactness loss directly causes ignition or peat combustion.',
  'carbon_emission->soil_microbial_depletion': 'An emissions total does not directly specify the warming, moisture, chemistry, land management, or microbial response needed for this outcome.',
  'data_centers->ai_data_centers': 'This is a subtype membership statement, not a causal relationship between two independent system states.',
  'environ_anomalies->cfc_saturated_layers': 'The broad analytical label does not provide a physical source, transport mechanism, or chemically defined atmospheric reservoir.',
  'heat_related_mortality_burden->wildfire_smoke_hospitalization_burden': 'These are parallel health outcomes with overlapping vulnerability, not a defensible causal sequence.',
  'methane->tundra_methane_outgassing': 'The direction is reversed: an emitting landscape can contribute to the atmospheric burden, while the burden alone does not establish local outgassing.',
  'monsoon_volatility->jet_stream_volatility': 'Coupled circulation can covary in both directions, but this edge asserts a one-way mechanism without a bounded basin, season, or circulation diagnostic.',
  'ocean_acidification->coastal_erosion': 'Carbonate chemistry can affect organisms and materials, but it is not a general driver of shoreline sediment loss.',
  'ocean_acidification->coastal_saltwater_intrusion': 'Aquifer salinization is governed primarily by hydraulic head, pumping, recharge, sea level, and connectivity rather than open-ocean carbonate chemistry.',
  'ocean_acidification->compound_coastal_flooding': 'Flood coincidence and magnitude are controlled by water level, surge, waves, rainfall, river flow, and drainage; carbonate chemistry is not a general forcing.',
  'ocean_acidification->estuary_eutrophication': 'Nutrient and organic-matter loading drive eutrophication; low pH may co-occur but does not establish the asserted direction.',
  'ocean_acidification->storm_surge_floods': 'Storm surge is a meteorological and hydrodynamic process and is not driven by seawater acidity.',
  'personal_conveyance->battery_supply_chain_pressure': 'The broad mobility system includes many powertrains; battery demand requires a technology-specific fleet and material-intensity pathway.',
  'reservoir_operating_shortfall->reservoir_storage_instability': 'Low or volatile storage can constrain operations, but an operating shortfall is not a general upstream cause of the storage condition; the original edge reverses or conflates the measured states.',
  'river_flow_regime_shift->hydrological_runoff_surges': 'Catchment runoff helps create river-flow change; this edge reverses or conflates the measured driver and downstream hydrograph response.'
});

export const UNSUPPORTED_FAMILY_RELATIONSHIP_EDGE_KEYS = Object.freeze(
  Object.keys(UNSUPPORTED_FAMILY_RELATIONSHIP_DECISIONS).sort()
);
