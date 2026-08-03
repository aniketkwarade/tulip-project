# TULIP Urgency v2 — Full-Graph Rollout

Status: **approved**. V2 receipts are the production urgency source for every issue node. Response nodes remain excluded and retain leverage scoring.

## Coverage

- Graph nodes: 381
- Scored issue nodes: 354
- Excluded response nodes: 27
- Current data: 96
- Accumulated-impact fallback: 208
- Modeled: 50

## All issue nodes

| V2 rank | Node | Domain | Legacy | V2 | Delta | Band | Method |
|---:|---|---|---:|---:|---:|---|---|
| 1 | Occupational Heat Exposure | health | 4.7 | 10.0 | +5.3 | Critical | `impact_fallback` |
| 2 | Ocean Acidification | oceans | 7.2 | 10.0 | +2.8 | Critical | `current_data` |
| 3 | Southern Annular Mode | atmosphere | 6.9 | 10.0 | +3.1 | Critical | `current_data` |
| 4 | Heavy-Metal Bioaccumulation | oceans | 7.2 | 10.0 | +2.8 | Critical | `impact_fallback` |
| 5 | Food Waste | agriculture | 7.0 | 9.9 | +2.9 | Critical | `impact_fallback` |
| 6 | Humanitarian Response Capacity Gap | sociopolitical | 6.2 | 9.8 | +3.6 | Critical | `current_data` |
| 7 | Levee and Channelization Works | freshwater | 6.2 | 9.8 | +3.6 | Critical | `impact_fallback` |
| 8 | Humanitarian Response Funding Shortfall | sociopolitical | 4.8 | 9.8 | +5.0 | Critical | `current_data` |
| 9 | Topsoil Erosion Acceleration | agriculture | 8.6 | 9.7 | +1.1 | Critical | `impact_fallback` |
| 10 | Estuary Eutrophication | oceans | 7.2 | 9.7 | +2.5 | Critical | `impact_fallback` |
| 11 | Nutrient Pollution | freshwater | 7.2 | 9.7 | +2.5 | Critical | `impact_fallback` |
| 12 | Anaerobic Manure Lagoon Operation | agriculture | 6.8 | 9.7 | +2.9 | Critical | `impact_fallback` |
| 13 | Cold Chain Failure Risk | economy | 8.4 | 9.6 | +1.2 | Critical | `impact_fallback` |
| 14 | Fishery Protein Dependence | sociopolitical | 7.1 | 9.6 | +2.5 | Critical | `impact_fallback` |
| 15 | Adaptation Capital Shortfall | economy | 7.5 | 9.6 | +2.1 | Critical | `current_data` |
| 16 | Cattle Grazing Overcompaction | agriculture | 8.8 | 9.6 | +0.8 | Critical | `impact_fallback` |
| 17 | Coastal Groundwater Withdrawal | freshwater | 6.2 | 9.6 | +3.4 | Critical | `impact_fallback` |
| 18 | Greenhouse Gas Effective Radiative Forcing | atmosphere | 7.1 | 9.5 | +2.4 | Critical | `current_data` |
| 19 | Aviation | transport | 6.6 | 9.4 | +2.8 | Critical | `current_data` |
| 20 | Transmission Buildout Lag | energy | 7.8 | 9.4 | +1.6 | Critical | `impact_fallback` |
| 21 | Agricultural Labor Exposure | agriculture | 8.7 | 9.4 | +0.7 | Critical | `impact_fallback` |
| 22 | Topsoil Salinization Fields | agriculture | 8.0 | 9.4 | +1.4 | Critical | `impact_fallback` |
| 23 | Coastal Hypoxic Dead Zones | oceans | 7.4 | 9.4 | +2.0 | Critical | `impact_fallback` |
| 24 | Ambient Air-Quality Standard Exceedance | atmosphere | 7.3 | 9.4 | +2.1 | Critical | `impact_fallback` |
| 25 | Civil Aviation Fossil CO2 Output | economy | 7.1 | 9.4 | +2.3 | Critical | `current_data` |
| 26 | Agricultural Demand | agriculture | 7.0 | 9.3 | +2.3 | Critical | `impact_fallback` |
| 27 | Marine Pathogen Range Expansion | oceans | 5.2 | 9.3 | +4.1 | Critical | `impact_fallback` |
| 28 | Delta Salt Intrusion Fronts | oceans | 5.3 | 9.3 | +4.0 | Critical | `impact_fallback` |
| 29 | Freshwater Lens Thinning in Small Islands | freshwater | 7.2 | 9.3 | +2.1 | Critical | `impact_fallback` |
| 30 | Oceanic Deoxygenation | oceans | 7.2 | 9.3 | +2.1 | Critical | `impact_fallback` |
| 31 | Coastal Storm-Surge Exposure | oceans | 7.2 | 9.3 | +2.1 | Critical | `impact_fallback` |
| 32 | Black Carbon Darkening of Snow | atmosphere | 7.0 | 9.3 | +2.3 | Critical | `impact_fallback` |
| 33 | Grid Peak Load Stress | energy | 8.0 | 9.3 | +1.3 | Critical | `impact_fallback` |
| 34 | Reef Structural Collapse | oceans | 7.4 | 9.3 | +1.9 | Critical | `impact_fallback` |
| 35 | Nitrogen Fertilizer Runoff | agriculture | 8.1 | 9.3 | +1.2 | Critical | `impact_fallback` |
| 36 | Tropospheric Ozone | atmosphere | 7.2 | 9.3 | +2.1 | Critical | `impact_fallback` |
| 37 | Persistent Pesticide Residues in Sediment and Biota | agriculture | 8.7 | 9.3 | +0.6 | Critical | `impact_fallback` |
| 38 | Ice Albedo Feedback Loops | cryosphere | 7.9 | 9.3 | +1.4 | Critical | `impact_fallback` |
| 39 | Forest Dieback Areas | biosphere | 8.4 | 9.3 | +0.9 | Critical | `impact_fallback` |
| 40 | Coastal Erosion | oceans | 7.2 | 9.3 | +2.1 | Critical | `impact_fallback` |
| 41 | Pesticide Residues in Surface Water | agriculture | 8.7 | 9.3 | +0.6 | Critical | `impact_fallback` |
| 42 | Palm Oil-Driven Forest Clearance | agriculture | 8.7 | 9.3 | +0.6 | Critical | `impact_fallback` |
| 43 | Coral Reef Fragmentation | oceans | 7.3 | 9.3 | +2.0 | Critical | `impact_fallback` |
| 44 | Pesticide Spray Drift | agriculture | 8.6 | 9.3 | +0.7 | Critical | `impact_fallback` |
| 45 | Mineral Dust Deposition on Snow | cryosphere | 7.2 | 9.3 | +2.1 | Critical | `impact_fallback` |
| 46 | Coastal Saltwater Intrusion | oceans | 7.4 | 9.3 | +1.9 | Critical | `impact_fallback` |
| 47 | Compound Coastal Flooding | oceans | 7.3 | 9.3 | +2.0 | Critical | `impact_fallback` |
| 48 | Coastal Aquifer Salinization | freshwater | 7.6 | 9.3 | +1.7 | Critical | `impact_fallback` |
| 49 | Surface-Water Evaporative Loss | freshwater | 5.6 | 9.3 | +3.7 | Critical | `impact_fallback` |
| 50 | Telecom Backbone | digital | 6.2 | 9.2 | +3.0 | Critical | `impact_fallback` |
| 51 | Subsea Cables | digital | 5.9 | 9.2 | +3.3 | Critical | `impact_fallback` |
| 52 | Reservoir Storage Instability | freshwater | 7.4 | 9.2 | +1.8 | Critical | `impact_fallback` |
| 53 | Shift in Snowmelt Timing | cryosphere | 7.3 | 9.2 | +1.9 | Critical | `impact_fallback` |
| 54 | Glacial Lake Outburst Flood Risk | cryosphere | 7.2 | 9.2 | +2.0 | Critical | `impact_fallback` |
| 55 | Snow Drought | cryosphere | 7.2 | 9.2 | +2.0 | Critical | `impact_fallback` |
| 56 | Marine Food-Web Reorganization | oceans | 7.3 | 9.2 | +1.9 | Critical | `impact_fallback` |
| 57 | Species Range Contraction | biosphere | 7.5 | 9.2 | +1.7 | Critical | `impact_fallback` |
| 58 | Insect Biomass Decline | biosphere | 7.6 | 9.2 | +1.6 | Critical | `impact_fallback` |
| 59 | Alpine Snowpack Declines | cryosphere | 7.8 | 9.2 | +1.4 | Critical | `impact_fallback` |
| 60 | Submarine Cable Landing-Site Concentration and Exposure | digital | 6.2 | 9.2 | +3.0 | Critical | `impact_fallback` |
| 61 | Trophic Cascade Disruption | biosphere | 7.8 | 9.2 | +1.4 | Critical | `impact_fallback` |
| 62 | Population Genetic Bottlenecks | biosphere | 7.7 | 9.2 | +1.5 | Critical | `impact_fallback` |
| 63 | Shell Calcification Failures | oceans | 7.4 | 9.2 | +1.8 | Critical | `impact_fallback` |
| 64 | Glacier Hydrologic System Floods | cryosphere | 7.2 | 9.2 | +2.0 | Critical | `impact_fallback` |
| 65 | Shelf-Sea Hypoxia | oceans | 7.3 | 9.2 | +1.9 | Critical | `impact_fallback` |
| 66 | Agricultural Groundwater Withdrawal | freshwater | 6.1 | 9.2 | +3.1 | Critical | `impact_fallback` |
| 67 | Air Pollution Health Burden | health | 5.7 | 9.1 | +3.4 | Critical | `impact_fallback` |
| 68 | Cement / Concrete | energy | 7.1 | 9.1 | +2.0 | Critical | `impact_fallback` |
| 69 | Aerosol Cooling Loss | atmosphere | 7.0 | 9.1 | +2.1 | Critical | `current_data` |
| 70 | Rail Heat Buckling | transport | 7.3 | 9.1 | +1.8 | Critical | `impact_fallback` |
| 71 | Climate Litigation Pressure | sociopolitical | 6.0 | 9.1 | +3.1 | Critical | `impact_fallback` |
| 72 | Deepwater Petroleum Operations | energy | 8.2 | 9.1 | +0.9 | Critical | `impact_fallback` |
| 73 | Groundwater Recharge Decline | freshwater | 7.4 | 9.1 | +1.7 | Critical | `impact_fallback` |
| 74 | Fossil-Hydrogen CO2 Output | economy | 7.1 | 9.1 | +2.0 | Critical | `impact_fallback` |
| 75 | Aquifer Overdraft | freshwater | 7.5 | 9.0 | +1.5 | Critical | `impact_fallback` |
| 76 | Irrigation Water Inefficiency | agriculture | 8.2 | 9.0 | +0.8 | Critical | `impact_fallback` |
| 77 | Arctic Shipping Expansion | transport | 7.4 | 9.0 | +1.6 | Critical | `current_data` |
| 78 | Smoke Exposure Burden | atmosphere | 6.8 | 9.0 | +2.2 | Critical | `impact_fallback` |
| 79 | Transformer Supply Bottleneck | energy | 7.9 | 9.0 | +1.1 | Critical | `impact_fallback` |
| 80 | Shipping Lane Disruption | transport | 7.4 | 9.0 | +1.6 | Critical | `impact_fallback` |
| 81 | Freight Electrification Gap | transport | 7.3 | 9.0 | +1.7 | Critical | `impact_fallback` |
| 82 | Road Freight Diesel Lock-In | transport | 7.3 | 9.0 | +1.7 | Critical | `impact_fallback` |
| 83 | Volatile Organic Compounds | atmosphere | 7.2 | 9.0 | +1.8 | Critical | `current_data` |
| 84 | Rapid Runoff Response | cryosphere | 7.5 | 9.0 | +1.5 | Critical | `impact_fallback` |
| 85 | Wetland Drainage | biosphere | 7.8 | 9.0 | +1.2 | Critical | `impact_fallback` |
| 86 | Amphibian Chytrid Infection Prevalence and Mortality | biosphere | 7.0 | 9.0 | +2.0 | Critical | `impact_fallback` |
| 87 | Municipal Groundwater Withdrawal | freshwater | 6.1 | 9.0 | +2.9 | Critical | `impact_fallback` |
| 88 | Urban Distribution Water Loss | sociopolitical | 5.3 | 9.0 | +3.7 | Critical | `impact_fallback` |
| 89 | Wildfire Smoke PM2.5 Exposure | sociopolitical | 5.1 | 9.0 | +3.9 | Critical | `impact_fallback` |
| 90 | Surface-Water Withdrawal Pressure | freshwater | 5.6 | 9.0 | +3.4 | Critical | `impact_fallback` |
| 91 | Peak Glacier Runoff Passage | cryosphere | 5.3 | 8.9 | +3.6 | Critical | `impact_fallback` |
| 92 | Ice Sheet Mass Loss | cryosphere | 7.1 | 8.9 | +1.8 | Critical | `impact_fallback` |
| 93 | Antarctic Bottom Water Decline | oceans | 7.3 | 8.9 | +1.6 | Critical | `impact_fallback` |
| 94 | Industrial Heat Decarbonization Gap | energy | 8.1 | 8.9 | +0.8 | Critical | `impact_fallback` |
| 95 | Renewable Curtailment Losses | energy | 7.9 | 8.9 | +1.0 | Critical | `impact_fallback` |
| 96 | Phytoplankton Decline | oceans | 7.1 | 8.9 | +1.8 | Critical | `impact_fallback` |
| 97 | Invasive Species Encroachment | biosphere | 7.7 | 8.9 | +1.2 | Critical | `impact_fallback` |
| 98 | Ocean Heat Content | oceans | 7.2 | 8.9 | +1.7 | Critical | `current_data` |
| 99 | Peatland Degradation | biosphere | 7.7 | 8.9 | +1.2 | Critical | `impact_fallback` |
| 100 | Glacier Calving Events | cryosphere | 7.3 | 8.9 | +1.6 | Critical | `impact_fallback` |
| 101 | Transboundary Fisheries Conflict | sociopolitical | 6.8 | 8.9 | +2.1 | Critical | `impact_fallback` |
| 102 | Dust Storm Frequency | atmosphere | 6.7 | 8.9 | +2.2 | Critical | `impact_fallback` |
| 103 | Coal Industrial-Heat CO2 Output | economy | 7.1 | 8.9 | +1.8 | Critical | `impact_fallback` |
| 104 | Gas Industrial-Heat CO2 Output | economy | 7.1 | 8.9 | +1.8 | Critical | `impact_fallback` |
| 105 | Cement-Kiln Fuel CO2 Output | economy | 7.1 | 8.9 | +1.8 | Critical | `impact_fallback` |
| 106 | Permafrost Thaw | cryosphere | 7.0 | 8.8 | +1.8 | Critical | `impact_fallback` |
| 107 | Mobile Towers / Wireless | digital | 5.8 | 8.8 | +3.0 | Critical | `impact_fallback` |
| 108 | Shipping | transport | 6.6 | 8.8 | +2.2 | Critical | `current_data` |
| 109 | Plastics / Petrochemicals | economy | 7.7 | 8.8 | +1.1 | Critical | `impact_fallback` |
| 110 | Mining / Critical Minerals | economy | 7.7 | 8.8 | +1.1 | Critical | `impact_fallback` |
| 111 | Basin Treaty Breakdown | sociopolitical | 6.7 | 8.8 | +2.1 | Critical | `impact_fallback` |
| 112 | Coastal Inundation Risk | oceans | 7.5 | 8.8 | +1.3 | Critical | `impact_fallback` |
| 113 | Harmful Algal Blooms | oceans | 7.4 | 8.8 | +1.4 | Critical | `impact_fallback` |
| 114 | Pelagic Species Redistribution | oceans | 7.2 | 8.8 | +1.6 | Critical | `impact_fallback` |
| 115 | Critical Mineral Extraction Pressure | energy | 7.9 | 8.8 | +0.9 | Critical | `impact_fallback` |
| 116 | Kelp Forest Collapse | oceans | 8.3 | 8.8 | +0.5 | Critical | `impact_fallback` |
| 117 | Fisheries Range Redistribution | oceans | 7.1 | 8.8 | +1.7 | Critical | `impact_fallback` |
| 118 | Thermal Stratification Intensification | oceans | 5.5 | 8.7 | +3.2 | Critical | `current_data` |
| 119 | Reservoir Operating Shortfall | freshwater | 7.5 | 8.7 | +1.2 | Critical | `impact_fallback` |
| 120 | Drinking Water Treatment Stress | freshwater | 6.6 | 8.7 | +2.1 | Critical | `impact_fallback` |
| 121 | Climate Penalty on Surface Ozone | atmosphere | 7.1 | 8.7 | +1.6 | Critical | `impact_fallback` |
| 122 | Aviation Demand Growth | transport | 7.3 | 8.7 | +1.4 | Critical | `impact_fallback` |
| 123 | Disaster Recovery Inequality | sociopolitical | 6.0 | 8.7 | +2.7 | Critical | `impact_fallback` |
| 124 | Relocation Governance Capacity | sociopolitical | 6.2 | 8.7 | +2.5 | Critical | `impact_fallback` |
| 125 | Particulate Soot Levels | atmosphere | 7.1 | 8.7 | +1.6 | Critical | `impact_fallback` |
| 126 | Riparian Bank Erosion | biosphere | 7.7 | 8.7 | +1.0 | Critical | `impact_fallback` |
| 127 | Urban Hydrologic Supply Shortfall | sociopolitical | 5.3 | 8.7 | +3.4 | Critical | `impact_fallback` |
| 128 | Urban Source-Water Treatment Constraint | sociopolitical | 5.3 | 8.7 | +3.4 | Critical | `impact_fallback` |
| 129 | Construction-Material CO2 Output | economy | 7.1 | 8.7 | +1.6 | Critical | `impact_fallback` |
| 130 | Drought Persistence | atmosphere | 7.1 | 8.6 | +1.5 | Critical | `impact_fallback` |
| 131 | Semiconductor Fabrication Footprint | energy | 7.8 | 8.6 | +0.8 | Critical | `impact_fallback` |
| 132 | Forest Fragmentation | biosphere | 7.6 | 8.6 | +1.0 | Critical | `impact_fallback` |
| 133 | Wildlife Habitat Patches | biosphere | 7.6 | 8.6 | +1.0 | Critical | `impact_fallback` |
| 134 | Zoonotic Disease Outbreaks | sociopolitical | 6.3 | 8.6 | +2.3 | Critical | `impact_fallback` |
| 135 | Rainforest Savannization | biosphere | 8.4 | 8.6 | +0.2 | Critical | `modeled` |
| 136 | Urban Water Rationing | sociopolitical | 6.9 | 8.6 | +1.7 | Critical | `impact_fallback` |
| 137 | Jellyfish Bloom Frequency and Biomass | oceans | 7.3 | 8.6 | +1.3 | Critical | `impact_fallback` |
| 138 | Old-Growth Forest Logging | biosphere | 8.5 | 8.6 | +0.1 | Critical | `impact_fallback` |
| 139 | Estuarine Nursery Loss | oceans | 7.4 | 8.6 | +1.2 | Critical | `impact_fallback` |
| 140 | Functional Habitat Connectivity Loss | biosphere | 7.6 | 8.6 | +1.0 | Critical | `impact_fallback` |
| 141 | Mountain Forest Cover and Treeline Contraction | biosphere | 8.5 | 8.6 | +0.1 | Critical | `modeled` |
| 142 | Passenger Road-Fuel CO2 Output | economy | 7.1 | 8.6 | +1.5 | Critical | `impact_fallback` |
| 143 | Resource Depletion | biosphere | 7.1 | 8.5 | +1.4 | Critical | `impact_fallback` |
| 144 | Rain-on-Snow Flood Risk | cryosphere | 5.7 | 8.5 | +2.8 | Critical | `impact_fallback` |
| 145 | Steel | energy | 7.2 | 8.5 | +1.3 | Critical | `impact_fallback` |
| 146 | Thermokarst Expansion | cryosphere | 7.3 | 8.5 | +1.2 | Critical | `impact_fallback` |
| 147 | Polar Infrastructure Failure | cryosphere | 7.2 | 8.5 | +1.3 | Critical | `impact_fallback` |
| 148 | Tidal Wetland Carbon Reversal | oceans | 7.8 | 8.5 | +0.7 | Critical | `impact_fallback` |
| 149 | Steel Decarbonization Gap | economy | 8.1 | 8.5 | +0.4 | Critical | `impact_fallback` |
| 150 | Battery Supply Chain Pressure | energy | 7.8 | 8.5 | +0.7 | Critical | `impact_fallback` |
| 151 | Coral Bleaching | oceans | 7.4 | 8.5 | +1.1 | Critical | `current_data` |
| 152 | Wildfire Smoke Hospitalization Burden | health | 4.7 | 8.5 | +3.8 | Critical | `impact_fallback` |
| 153 | Early-Warning Coverage Gap | sociopolitical | 6.1 | 8.5 | +2.4 | Critical | `impact_fallback` |
| 154 | Blue Carbon Habitat Loss | oceans | 8.2 | 8.5 | +0.3 | Critical | `impact_fallback` |
| 155 | Wildfire Smoke Exposure Duration | sociopolitical | 5.1 | 8.5 | +3.4 | Critical | `impact_fallback` |
| 156 | Diesel Freight CO2 Output | economy | 7.1 | 8.5 | +1.4 | Critical | `impact_fallback` |
| 157 | Monsoon Volatility | atmosphere | 6.5 | 8.4 | +1.9 | Critical | `impact_fallback` |
| 158 | Baseline Water Stress | freshwater | 6.9 | 8.4 | +1.5 | Critical | `current_data` |
| 159 | AI Data Centers | digital | 6.9 | 8.4 | +1.5 | Critical | `impact_fallback` |
| 160 | Lightning Ignition under Fire Weather Conditions | atmosphere | 7.0 | 8.4 | +1.4 | Critical | `impact_fallback` |
| 161 | Freshwater Ecosystem Collapse | biosphere | 7.6 | 8.4 | +0.8 | Critical | `impact_fallback` |
| 162 | Emergency Response Capacity Exceedance | health | 4.6 | 8.4 | +3.8 | Critical | `current_data` |
| 163 | Rice Paddy Methane Emissions | agriculture | 8.0 | 8.4 | +0.4 | Critical | `current_data` |
| 164 | Savanna Tree-Cover Decline | biosphere | 7.7 | 8.4 | +0.7 | Critical | `modeled` |
| 165 | Fjord Sedimentation Pulses | cryosphere | 7.7 | 8.4 | +0.7 | Critical | `modeled` |
| 166 | Data Centers | digital | 6.3 | 8.3 | +2.0 | Critical | `impact_fallback` |
| 167 | Soil Moisture Collapse | agriculture | 8.0 | 8.3 | +0.3 | Critical | `modeled` |
| 168 | Glacier-Fed Water Dependence | sociopolitical | 6.4 | 8.3 | +1.9 | Critical | `impact_fallback` |
| 169 | Livestock Disease Pressure | agriculture | 8.6 | 8.3 | -0.3 | Critical | `impact_fallback` |
| 170 | Fracking Wastewater Lakes | energy | 7.2 | 8.3 | +1.1 | Critical | `impact_fallback` |
| 171 | Tundra Methane Outgassing | cryosphere | 7.6 | 8.3 | +0.7 | Critical | `modeled` |
| 172 | PM2.5 Particulates | atmosphere | 7.1 | 8.3 | +1.2 | Critical | `current_data` |
| 173 | Ice Algae Pigmentation | cryosphere | 7.8 | 8.3 | +0.5 | Critical | `modeled` |
| 174 | Nunatak Habitat Shrinkage | cryosphere | 7.7 | 8.3 | +0.6 | Critical | `modeled` |
| 175 | Transformer Heat Failure Risk | energy | 8.3 | 8.3 | 0.0 | Critical | `modeled` |
| 176 | Freeze-Thaw Rock Fracturing | cryosphere | 7.7 | 8.3 | +0.6 | Critical | `modeled` |
| 177 | Tundra Shrub Expansion | cryosphere | 7.7 | 8.3 | +0.6 | Critical | `modeled` |
| 178 | River Network Fragmentation | biosphere | 7.7 | 8.3 | +0.6 | Critical | `impact_fallback` |
| 179 | Seagrass Meadow Decline | oceans | 6.9 | 8.3 | +1.4 | Critical | `impact_fallback` |
| 180 | Dam and Diversion Infrastructure | freshwater | 6.2 | 8.3 | +2.1 | Critical | `impact_fallback` |
| 181 | Peatland Drainage CO2 Release | economy | 7.1 | 8.3 | +1.2 | Critical | `current_data` |
| 182 | Industry Farming | agriculture | 8.6 | 8.2 | -0.4 | Critical | `impact_fallback` |
| 183 | Watershed Forest Loss | biosphere | 7.5 | 8.2 | +0.7 | Critical | `impact_fallback` |
| 184 | Soil Humus Decline | biosphere | 7.7 | 8.2 | +0.5 | Critical | `impact_fallback` |
| 185 | Soil Microbial Depletion | biosphere | 8.1 | 8.2 | +0.1 | Critical | `impact_fallback` |
| 186 | Deep-Sea Mining Sediment Plumes | oceans | 7.4 | 8.2 | +0.8 | Critical | `modeled` |
| 187 | Migratory Bird Timing, Route, and Stopover Disruption | biosphere | 7.8 | 8.2 | +0.4 | Critical | `modeled` |
| 188 | Arctic Pack Ice Drift | cryosphere | 7.6 | 8.2 | +0.6 | Critical | `modeled` |
| 189 | Cryoconite Hole Expansion | cryosphere | 7.6 | 8.2 | +0.6 | Critical | `modeled` |
| 190 | Ice Cap Decapitation | cryosphere | 7.6 | 8.2 | +0.6 | Critical | `modeled` |
| 191 | Coral Larval Survival and Recruitment Failure | oceans | 7.3 | 8.2 | +0.9 | Critical | `modeled` |
| 192 | Fast Fashion | economy | 7.2 | 8.1 | +0.9 | Critical | `impact_fallback` |
| 193 | Ocean Circulation Regime Shifts | oceans | 7.3 | 8.1 | +0.8 | Critical | `modeled` |
| 194 | Coastal Hypoxia | oceans | 7.2 | 8.1 | +0.9 | Critical | `current_data` |
| 195 | Ocean Salinity Stratification | oceans | 7.3 | 8.1 | +0.8 | Critical | `modeled` |
| 196 | Peaker Plant Lock-In | energy | 7.9 | 8.1 | +0.2 | Critical | `modeled` |
| 197 | Backup Generator Dependence | energy | 7.9 | 8.1 | +0.2 | Critical | `modeled` |
| 198 | Inland Waterway Fuel Spills | transport | 6.7 | 8.1 | +1.4 | Critical | `impact_fallback` |
| 199 | Wetland Peat Fires | biosphere | 7.8 | 8.1 | +0.3 | Critical | `impact_fallback` |
| 200 | Freshwater Mussel Population Decline | biosphere | 7.3 | 8.1 | +0.8 | Critical | `impact_fallback` |
| 201 | Urban Heat Island | atmosphere | 6.3 | 8.1 | +1.8 | Critical | `impact_fallback` |
| 202 | Urban Water-Demand Peak | sociopolitical | 5.3 | 8.1 | +2.8 | Critical | `impact_fallback` |
| 203 | AMOC Slowdown | oceans | 6.4 | 8.0 | +1.6 | Critical | `current_data` |
| 204 | Loss of Firn Meltwater Storage Capacity | cryosphere | 7.3 | 8.0 | +0.7 | Critical | `modeled` |
| 205 | Hail Hazard Shift | atmosphere | 6.9 | 8.0 | +1.1 | Critical | `impact_fallback` |
| 206 | Cloud Radiative Effect Change | atmosphere | 7.3 | 8.0 | +0.7 | Critical | `current_data` |
| 207 | Glacial Siltation Streams | cryosphere | 7.0 | 8.0 | +1.0 | Critical | `modeled` |
| 208 | Nighttime Heat Retention | atmosphere | 7.2 | 8.0 | +0.8 | Critical | `impact_fallback` |
| 209 | Metal Industry Fossil CO2 Output | economy | 7.1 | 8.0 | +0.9 | Critical | `current_data` |
| 210 | Personal Conveyance | transport | 6.6 | 7.9 | +1.3 | Critical | `impact_fallback` |
| 211 | Air Conditioning / Refrigerants | energy | 6.6 | 7.9 | +1.3 | Critical | `impact_fallback` |
| 212 | Flash Flood Regime | atmosphere | 7.2 | 7.9 | +0.7 | Critical | `impact_fallback` |
| 213 | Energy Affordability Crisis | sociopolitical | 7.0 | 7.9 | +0.9 | Critical | `impact_fallback` |
| 214 | Airport Climate Exposure | transport | 7.4 | 7.9 | +0.5 | Critical | `impact_fallback` |
| 215 | Bridge Scour Exposure | transport | 7.3 | 7.9 | +0.6 | Critical | `impact_fallback` |
| 216 | Insurance Retreat | economy | 7.6 | 7.9 | +0.3 | Critical | `impact_fallback` |
| 217 | Talik Expansion | cryosphere | 7.1 | 7.9 | +0.8 | Critical | `modeled` |
| 218 | Pollinator Colony Collapse | biosphere | 7.6 | 7.9 | +0.3 | Critical | `impact_fallback` |
| 219 | Antarctic Shelf Instability | cryosphere | 7.1 | 7.9 | +0.8 | Critical | `modeled` |
| 220 | Population and Asset Exposure in Floodplains | freshwater | 6.9 | 7.9 | +1.0 | Critical | `impact_fallback` |
| 221 | Supply Chain Port Bottlenecks | transport | 7.3 | 7.9 | +0.6 | Critical | `impact_fallback` |
| 222 | Dryland Degradation | biosphere | 7.3 | 7.9 | +0.6 | Critical | `impact_fallback` |
| 223 | Ice Shelf Grounding Line Retreat | cryosphere | 7.1 | 7.9 | +0.8 | Critical | `modeled` |
| 224 | Bark Beetle Epidemics | biosphere | 7.7 | 7.9 | +0.2 | Critical | `impact_fallback` |
| 225 | Atmospheric Hydroxyl Sink Weakening | atmosphere | 7.4 | 7.9 | +0.5 | Critical | `modeled` |
| 226 | Chemical Industry Fossil CO2 Output | economy | 7.1 | 7.9 | +0.8 | Critical | `current_data` |
| 227 | El Niño | oceans | 4.9 | 7.8 | +2.9 | Critical | `current_data` |
| 228 | Groundwater Depletion | freshwater | 7.0 | 7.8 | +0.8 | Critical | `current_data` |
| 229 | Wastewater Infrastructure Overflow | freshwater | 6.5 | 7.8 | +1.3 | Critical | `impact_fallback` |
| 230 | Pacific Decadal Oscillation | oceans | 7.2 | 7.8 | +0.6 | Critical | `current_data` |
| 231 | Atlantic Niño/Niña | oceans | 7.4 | 7.8 | +0.4 | Critical | `modeled` |
| 232 | Marine Fisheries Collapse | oceans | 7.1 | 7.8 | +0.7 | Critical | `current_data` |
| 233 | Atmospheric Moisture Amplification | atmosphere | 6.9 | 7.8 | +0.9 | Critical | `current_data` |
| 234 | Urban Tree Canopy Loss | sociopolitical | 6.7 | 7.8 | +1.1 | Critical | `impact_fallback` |
| 235 | Nitrous Oxide | atmosphere | 7.4 | 7.8 | +0.4 | Critical | `current_data` |
| 236 | Convective Available Potential Energy and Inhibition Anomaly | atmosphere | 7.3 | 7.8 | +0.5 | Critical | `modeled` |
| 237 | Atmospheric River Intensification | atmosphere | 6.6 | 7.8 | +1.2 | Critical | `impact_fallback` |
| 238 | Aviation Condensation Trails | atmosphere | 7.3 | 7.8 | +0.5 | Critical | `modeled` |
| 239 | Cattle Stocking Density | agriculture | 5.3 | 7.8 | +2.5 | Critical | `current_data` |
| 240 | Gas Power CO2 Output | economy | 7.1 | 7.8 | +0.7 | Critical | `current_data` |
| 241 | Petroleum Refining and Other Energy Industries Fossil CO2 Output | economy | 7.1 | 7.8 | +0.7 | Critical | `current_data` |
| 242 | Deforestation | biosphere | 8.7 | 7.7 | -1.0 | Critical | `impact_fallback` |
| 243 | Peat Oxidation Pulse | biosphere | 8.0 | 7.7 | -0.3 | Critical | `current_data` |
| 244 | Pollinator Service Decline | biosphere | 7.6 | 7.7 | +0.1 | Critical | `impact_fallback` |
| 245 | Managed-Retreat Decision Pressure | sociopolitical | 5.3 | 7.7 | +2.4 | Critical | `impact_fallback` |
| 246 | Agricultural Nitrogen Application | agriculture | 7.0 | 7.7 | +0.7 | Critical | `current_data` |
| 247 | Fossil Backup-Power CO2 Output | economy | 7.1 | 7.7 | +0.6 | Critical | `modeled` |
| 248 | Methane Emissions | atmosphere | 7.4 | 7.6 | +0.2 | Critical | `current_data` |
| 249 | Urbanization | sociopolitical | 7.0 | 7.6 | +0.6 | Critical | `impact_fallback` |
| 250 | Migration | sociopolitical | 5.0 | 7.6 | +2.6 | Critical | `impact_fallback` |
| 251 | Carbon Emission | atmosphere | 8.2 | 7.6 | -0.6 | Critical | `current_data` |
| 252 | Desalination Dependence | energy | 7.5 | 7.6 | +0.1 | Critical | `impact_fallback` |
| 253 | Persistent Atmospheric Blocking | atmosphere | 6.9 | 7.6 | +0.7 | Critical | `modeled` |
| 254 | Marine Low-Cloud Decline | atmosphere | 7.0 | 7.6 | +0.6 | Critical | `modeled` |
| 255 | Cooling Water Competition | energy | 8.0 | 7.6 | -0.4 | Critical | `impact_fallback` |
| 256 | Farm Heat Stress | agriculture | 8.5 | 7.6 | -0.9 | Critical | `impact_fallback` |
| 257 | Critical Infrastructure Fragility | sociopolitical | 6.2 | 7.6 | +1.4 | Critical | `impact_fallback` |
| 258 | Black Carbon Deposition | atmosphere | 7.0 | 7.6 | +0.6 | Critical | `modeled` |
| 259 | Pacific Walker Circulation Variability | atmosphere | 7.1 | 7.6 | +0.5 | Critical | `modeled` |
| 260 | Airborne Microplastic Concentration and Deposition | atmosphere | 6.9 | 7.6 | +0.7 | Critical | `modeled` |
| 261 | North Atlantic Subpolar Gyre Circulation Strength | oceans | 6.6 | 7.6 | +1.0 | Critical | `modeled` |
| 262 | Equatorial Pacific Trade-Wind Anomaly | atmosphere | 7.1 | 7.6 | +0.5 | Critical | `modeled` |
| 263 | Road-Stream Crossing Barriers | freshwater | 6.2 | 7.6 | +1.4 | Critical | `impact_fallback` |
| 264 | Residential Gas-Heating CO2 Output | economy | 7.1 | 7.6 | +0.5 | Critical | `current_data` |
| 265 | Commercial Gas-Heating CO2 Output | economy | 7.1 | 7.6 | +0.5 | Critical | `current_data` |
| 266 | Coastal Permafrost Erosion | cryosphere | 5.1 | 7.5 | +2.4 | Critical | `impact_fallback` |
| 267 | Semiconductor Fabs | digital | 7.1 | 7.5 | +0.4 | Critical | `modeled` |
| 268 | Urban Sprawl / Housing | sociopolitical | 7.3 | 7.5 | +0.2 | Critical | `current_data` |
| 269 | Persistent Rossby Wave Patterns | atmosphere | 6.9 | 7.5 | +0.6 | Critical | `modeled` |
| 270 | Port Heat-Related Operational Vulnerability | transport | 7.3 | 7.5 | +0.2 | Critical | `modeled` |
| 271 | Jet Stream Volatility | atmosphere | 6.7 | 7.5 | +0.8 | Critical | `modeled` |
| 272 | Stratospheric Cooling | atmosphere | 7.0 | 7.5 | +0.5 | Critical | `current_data` |
| 273 | Pollen Allergen Spikes | atmosphere | 7.4 | 7.5 | +0.1 | Critical | `impact_fallback` |
| 274 | Overstory Tree Mortality | biosphere | 6.8 | 7.5 | +0.7 | Critical | `modeled` |
| 275 | Coal Power CO2 Output | economy | 7.1 | 7.5 | +0.4 | Critical | `current_data` |
| 276 | Sea-Level Rise | oceans | 7.3 | 7.4 | +0.1 | Critical | `current_data` |
| 277 | Global Temperature | atmosphere | 7.7 | 7.3 | -0.4 | Critical | `current_data` |
| 278 | Mortgage Market Exposure | economy | 7.6 | 7.3 | -0.3 | Critical | `impact_fallback` |
| 279 | Asphalt Surface Heat Storage | transport | 6.8 | 7.3 | +0.5 | Critical | `modeled` |
| 280 | Food Insecurity | health | 5.5 | 7.3 | +1.8 | Critical | `impact_fallback` |
| 281 | Hydropower Reliability Decline | energy | 7.7 | 7.2 | -0.5 | Critical | `current_data` |
| 282 | Surface Water Storage Instability | freshwater | 7.0 | 7.2 | +0.2 | Critical | `impact_fallback` |
| 283 | Groundwater Depletion Wells | freshwater | 8.1 | 7.2 | -0.9 | Critical | `current_data` |
| 284 | Industrial Groundwater Withdrawal | freshwater | 6.1 | 7.2 | +1.1 | Critical | `modeled` |
| 285 | Agricultural Soil Compaction | agriculture | 6.5 | 7.2 | +0.7 | Critical | `impact_fallback` |
| 286 | Biodiversity Intactness Loss | biosphere | 7.6 | 7.1 | -0.5 | Critical | `impact_fallback` |
| 287 | Coastal Property Insurance Nonrenewal | sociopolitical | 6.3 | 7.1 | +0.8 | Critical | `modeled` |
| 288 | Oceanic Upwelling Disruptions | oceans | 5.4 | 7.0 | +1.6 | Critical | `modeled` |
| 289 | River Flow Regime Change | biosphere | 7.6 | 7.0 | -0.6 | Critical | `impact_fallback` |
| 290 | Utility Disconnection Risk | sociopolitical | 7.1 | 7.0 | -0.1 | Critical | `impact_fallback` |
| 291 | Surface-Water Inflow Deficit | freshwater | 5.6 | 7.0 | +1.4 | Critical | `impact_fallback` |
| 292 | Acid Rain Deposition | atmosphere | 7.0 | 6.9 | -0.1 | Rising | `impact_fallback` |
| 293 | Surface-Water Groundwater-Exchange Shift | freshwater | 5.6 | 6.9 | +1.3 | Rising | `modeled` |
| 294 | Water-Borne Navigation Fossil CO2 Output | economy | 7.1 | 6.8 | -0.3 | Rising | `current_data` |
| 295 | Waste Incineration and Open-Burning Fossil CO2 Output | economy | 7.1 | 6.8 | -0.3 | Rising | `current_data` |
| 296 | Internet Exchange Points | digital | 5.7 | 6.7 | +1.0 | Rising | `modeled` |
| 297 | Quasi-Biennial Oscillation | atmosphere | 6.9 | 6.7 | -0.2 | Rising | `current_data` |
| 298 | Mangrove Buffer Loss | biosphere | 7.8 | 6.7 | -1.1 | Rising | `impact_fallback` |
| 299 | Waterborne Pathogen Outbreaks | freshwater | 6.7 | 6.7 | 0.0 | Rising | `current_data` |
| 300 | Cooling Equity Gaps | sociopolitical | 6.4 | 6.7 | +0.3 | Rising | `impact_fallback` |
| 301 | Humanitarian Access Constraints | sociopolitical | 4.8 | 6.6 | +1.8 | Rising | `current_data` |
| 302 | Nocturnal Heat Stress | atmosphere | 6.9 | 6.5 | -0.4 | Rising | `current_data` |
| 303 | Combined Sewer Overflow | freshwater | 6.7 | 6.4 | -0.3 | Rising | `impact_fallback` |
| 304 | Atlantic Multidecadal Oscillation | oceans | 7.3 | 6.3 | -1.0 | Rising | `current_data` |
| 305 | Compound Climate Hazards | atmosphere | 7.2 | 6.2 | -1.0 | Rising | `current_data` |
| 306 | Pyrocumulonimbus Smoke Injection | atmosphere | 4.7 | 6.2 | +1.5 | Rising | `modeled` |
| 307 | Airport Operational Disruption | transport | 7.4 | 6.2 | -1.2 | Rising | `impact_fallback` |
| 308 | Wastewater Bypass Discharge | freshwater | 6.7 | 6.1 | -0.6 | Rising | `impact_fallback` |
| 309 | Compound Day-Night Heat Extremes | atmosphere | 7.1 | 6.1 | -1.0 | Rising | `current_data` |
| 310 | Atmospheric Ozone-Depleting Substance Burden | atmosphere | 7.2 | 5.9 | -1.3 | Rising | `current_data` |
| 311 | Heat-Related Mortality Burden | health | 4.6 | 5.8 | +1.2 | Rising | `impact_fallback` |
| 312 | Cement Process Emissions | economy | 8.3 | 5.8 | -2.5 | Rising | `current_data` |
| 313 | Public Health Heat Burden | health | 6.2 | 5.8 | -0.4 | Rising | `impact_fallback` |
| 314 | Vector-Borne Disease Expansion | health | 6.3 | 5.8 | -0.5 | Rising | `current_data` |
| 315 | Conflict Risk Escalation | sociopolitical | 6.3 | 5.8 | -0.5 | Rising | `current_data` |
| 316 | Heat-Attributable Excess Mortality | sociopolitical | 6.4 | 5.8 | -0.6 | Rising | `impact_fallback` |
| 317 | Wet-Bulb Heat | atmosphere | 6.4 | 5.6 | -0.8 | Rising | `current_data` |
| 318 | Feed Crop Dependency | agriculture | 8.5 | 5.6 | -2.9 | Rising | `current_data` |
| 319 | Fertilizer Price Shock | agriculture | 8.7 | 5.5 | -3.2 | Rising | `current_data` |
| 320 | Extreme Precipitation Intensity | atmosphere | 6.0 | 5.4 | -0.6 | Rising | `current_data` |
| 321 | North Atlantic Oscillation | atmosphere | 7.0 | 5.4 | -1.6 | Rising | `current_data` |
| 322 | Food Import Exposure | sociopolitical | 7.0 | 5.0 | -2.0 | Rising | `current_data` |
| 323 | Lightning Flash Density and Seasonality Anomaly | atmosphere | 7.3 | 4.9 | -2.4 | Elevated | `impact_fallback` |
| 324 | Wildfire Regime Shift | biosphere | 7.7 | 4.7 | -3.0 | Elevated | `current_data` |
| 325 | Oil and Natural Gas Sector Fossil CO2 Output | economy | 7.1 | 4.7 | -2.4 | Elevated | `current_data` |
| 326 | Land Carbon Sink Weakening | biosphere | 8.1 | 4.2 | -3.9 | Elevated | `current_data` |
| 327 | Atmospheric Evaporative Demand | atmosphere | 6.9 | 4.0 | -2.9 | Elevated | `current_data` |
| 328 | Crop Yield Volatility | agriculture | 8.5 | 4.0 | -4.5 | Elevated | `current_data` |
| 329 | Pacific-North American Pattern | atmosphere | 6.9 | 3.9 | -3.0 | Elevated | `current_data` |
| 330 | Gulf Stream Transport and Position | oceans | 6.6 | 3.6 | -3.0 | Elevated | `current_data` |
| 331 | Marine Heatwaves | oceans | 7.2 | 3.5 | -3.7 | Elevated | `current_data` |
| 332 | Sea Ice Season Loss | cryosphere | 7.3 | 3.4 | -3.9 | Elevated | `current_data` |
| 333 | Carbon Monoxide | atmosphere | 8.1 | 3.4 | -4.7 | Elevated | `current_data` |
| 334 | Fish Landing Supply Disruption | sociopolitical | 6.4 | 3.3 | -3.1 | Elevated | `current_data` |
| 335 | Sulfur Dioxide | atmosphere | 7.2 | 3.2 | -4.0 | Elevated | `current_data` |
| 336 | Oil-Fired Power CO2 Output | economy | 7.1 | 3.0 | -4.1 | Elevated | `current_data` |
| 337 | Railway Fossil CO2 Output | economy | 7.1 | 3.0 | -4.1 | Elevated | `current_data` |
| 338 | Deforestation CO2 Release | economy | 7.1 | 3.0 | -4.1 | Elevated | `current_data` |
| 339 | Oil Building-Heat CO2 Output | economy | 7.1 | 2.9 | -4.2 | Low | `current_data` |
| 340 | Fertilizer Production | agriculture | 7.7 | 2.8 | -4.9 | Low | `current_data` |
| 341 | Mountain Pass Avalanches | cryosphere | 7.6 | 2.7 | -4.9 | Low | `impact_fallback` |
| 342 | Coal-Power Sulfur Emissions | atmosphere | 6.1 | 2.5 | -3.6 | Low | `current_data` |
| 343 | La Niña | oceans | 4.3 | 2.3 | -2.0 | Low | `current_data` |
| 344 | Indian Ocean Dipole | oceans | 7.2 | 2.3 | -4.9 | Low | `current_data` |
| 345 | Ocean Carbon Uptake Weakening | oceans | 7.7 | 2.3 | -5.4 | Low | `current_data` |
| 346 | Madden-Julian Oscillation | atmosphere | 6.9 | 2.3 | -4.6 | Low | `current_data` |
| 347 | Arctic Oscillation | atmosphere | 6.9 | 2.3 | -4.6 | Low | `current_data` |
| 348 | Gas Power Dependence | energy | 7.9 | 2.3 | -5.6 | Low | `current_data` |
| 349 | Staple Food Price Volatility | sociopolitical | 6.1 | 2.3 | -3.8 | Low | `current_data` |
| 350 | Land-Use Fire CO2 Release | economy | 7.1 | 2.3 | -4.8 | Low | `current_data` |
| 351 | Arctic Amplification | cryosphere | 7.8 | 2.2 | -5.6 | Low | `current_data` |
| 352 | Stratospheric Ozone Column Depletion and Recovery | atmosphere | 7.1 | 1.9 | -5.2 | Low | `current_data` |
| 353 | Tropical Cyclone Rapid Intensification | atmosphere | 5.3 | 1.7 | -3.6 | Low | `current_data` |
| 354 | Humanitarian Surge Demand | sociopolitical | 4.8 | 1.1 | -3.7 | Low | `current_data` |
