export const PHENOMENON_SELECTOR_CONFIG = [
  { key: 'food', label: 'Diet', nodeIds: ['food'], iconKey: 'diet' },
  { key: 'industry_farming', label: 'Industry Farming', nodeIds: ['industry_farming'], iconKey: 'industryFarming' },
  { key: 'methane', label: 'Methane', nodeIds: ['methane'], iconKey: 'methane' },
  { key: 'carbon_emission', label: 'Carbon', nodeIds: ['carbon_emission'], iconKey: 'carbon' },
  {
    key: 'electricity_generation',
    label: 'Electricity',
    nodeIds: ['carbon_emission'],
    lensKey: 'electricity_generation',
    description: 'Electricity generation shows the upstream power mix behind many other footprints, especially coal- and gas-heavy grids that lock in large annual emissions.',
    iconKey: 'electricity'
  },
  { key: 'personal_conveyance', label: 'Conveyance', nodeIds: ['personal_conveyance'], iconKey: 'conveyance' },
  {
    key: 'freight_logistics',
    label: 'Freight & Logistics',
    nodeIds: ['road_freight_diesel_lock_in', 'shipping'],
    lensKey: 'freight_logistics',
    description: 'Freight and logistics connect road, sea, rail, inland-waterway, and air cargo movement while treating warehouses, cold chains, ports, and last-mile delivery as cross-cutting operations rather than extra transport modes.',
    iconKey: 'shipping'
  },
  { key: 'food_waste', label: 'Food Waste', nodeIds: ['food_waste'], iconKey: 'foodWaste' },
  { key: 'fertilizer_production', label: 'Fertilizers', nodeIds: ['fertilizer_production'], iconKey: 'fertilizers' },
  { key: 'mining_critical_minerals', label: 'Mining', nodeIds: ['mining_critical_minerals'], iconKey: 'mining' },
  {
    key: 'built_environment',
    label: 'Buildings & Housing',
    nodeIds: ['urban_sprawl_housing', 'cement_concrete', 'steel'],
    lensKey: 'built_environment',
    description: 'Buildings and housing combine residential and non-residential operating energy with construction materials, while keeping location, density, and sprawl visible as factors that shape demand rather than additive emissions rows.',
    iconKey: 'construction'
  },
  { key: 'deforestation_land_use', label: 'Deforestation', nodeIds: ['deforestation'], iconKey: 'deforestation' },
  { key: 'plastics_petrochemicals', label: 'Petroplastics', nodeIds: ['plastics_petrochemicals'], iconKey: 'petroplastics' },
  { key: 'data_centers', label: 'Data Centers', nodeIds: ['data_centers'], iconKey: 'dataCenters' },
  { key: 'ai_compute', label: 'AI Compute', nodeIds: ['ai_data_centers'], iconKey: 'aiCompute' },
  { key: 'aviation', label: 'Aviation', nodeIds: ['aviation'], iconKey: 'aviation' },
  { key: 'air_conditioning_refrigerants', label: 'Refrigerants', nodeIds: ['air_conditioning_refrigerants'], iconKey: 'refrigerants' }
];
