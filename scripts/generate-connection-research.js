import fs from 'node:fs/promises';
import path from 'node:path';

// Helper to define source objects
function createSource(title, url, publisher, year) {
  return { title, url, publisher, year };
}

// Global sources pool
const SOURCES = {
  ipcc_ar6_wg1: createSource("IPCC Climate Change 2021: The Physical Science Basis", "https://www.ipcc.ch/report/ar6/wg1/", "Intergovernmental Panel on Climate Change", "2021"),
  ipcc_ar6_wg2: createSource("IPCC Climate Change 2022: Impacts, Adaptation and Vulnerability", "https://www.ipcc.ch/report/ar6/wg2/", "Intergovernmental Panel on Climate Change", "2022"),
  ipcc_ar6_wg3: createSource("IPCC Climate Change 2022: Mitigation of Climate Change", "https://www.ipcc.ch/report/ar6/wg3/", "Intergovernmental Panel on Climate Change", "2022"),
  ipcc_srocc: createSource("IPCC Special Report on the Ocean and Cryosphere in a Changing Climate", "https://www.ipcc.ch/srocc/", "Intergovernmental Panel on Climate Change", "2019"),
  ipcc_land: createSource("IPCC Special Report on Climate Change and Land", "https://www.ipcc.ch/srccl/", "Intergovernmental Panel on Climate Change", "2019"),
  iea_weo_2024: createSource("World Energy Outlook 2024", "https://www.iea.org/reports/world-energy-outlook-2024", "International Energy Agency", "2024"),
  iea_ai_2024: createSource("Energy and AI", "https://www.iea.org/reports/energy-and-ai", "International Energy Agency", "2024"),
  iea_transport: createSource("Transport Sector Tracking", "https://www.iea.org/energy-system/transport", "International Energy Agency", "2024"),
  noaa_co2: createSource("Trends in Atmospheric Carbon Dioxide", "https://gml.noaa.gov/ccgg/trends/", "National Oceanic and Atmospheric Administration", "2026"),
  noaa_ch4: createSource("Trends in Atmospheric Methane", "https://gml.noaa.gov/ccgg/trends_ch4/", "National Oceanic and Atmospheric Administration", "2026"),
  noaa_aggi: createSource("The NOAA Annual Greenhouse Gas Index", "https://gml.noaa.gov/aggi/aggi.html", "National Oceanic and Atmospheric Administration", "2025"),
  noaa_pmel: createSource("What is Ocean Acidification?", "https://www.pmel.noaa.gov/co2/story/Ocean+Acidification", "National Oceanic and Atmospheric Administration", "2025"),
  fao_sofi_2024: createSource("The State of Food Security and Nutrition in the World 2024", "https://www.fao.org/publications/home/fao-flagship-publications/the-state-of-food-security-and-nutrition-in-the-world", "Food and Agriculture Organization", "2024"),
  fao_emissions: createSource("FAO Emissions Database", "https://www.fao.org/faostat/en/#data/GT", "Food and Agriculture Organization", "2023"),
  unep_methane: createSource("Global Methane Assessment", "https://www.unep.org/resources/report/global-methane-assessment-benefits-and-costs-mitigating-methane-emissions", "United Nations Environment Programme", "2021"),
  unep_fashion: createSource("Putting the brakes on fast fashion", "https://www.unep.org/news-and-stories/story/putting-brakes-fast-fashion", "United Nations Environment Programme", "2018"),
  wri_aqueduct: createSource("Aqueduct Water Risk Atlas", "https://www.wri.org/aqueduct", "World Resources Institute", "2023"),
  nasa_grace: createSource("GRACE-FO Science Mission", "https://gracefo.jpl.nasa.gov/", "NASA Jet Propulsion Laboratory", "2024"),
  usgs_groundwater: createSource("Groundwater Decline and Depletion", "https://www.usgs.gov/special-topics/water-science-school/science/groundwater-decline-and-depletion", "United States Geological Survey", "2025"),
  usgs_ecoflows: createSource("Ecological Flows", "https://www.usgs.gov/mission-areas/water-resources/science/ecological-flows", "United States Geological Survey", "2025"),
  nature_reservoir_storage: createSource("Global satellite assessment of declining reservoir storage", "https://doi.org/10.1038/s41467-023-38843-5", "Nature Communications", "2023"),
  idmc_grid: createSource("Global Report on Internal Displacement 2024", "https://www.internal-displacement.org/global-report/grid2024/", "Internal Displacement Monitoring Centre", "2024"),
  iom_climate: createSource("Climate Change and Migratory Pressures", "https://www.iom.int/migration-and-climate-change", "International Organization for Migration", "2024"),
  unhcr_disaster: createSource("Disaster Displacement and Climate Change", "https://www.unhcr.org/climate-change-and-disasters.html", "United Nations High Commissioner for Refugees", "2024"),
  science_deoxygenation: createSource("Declining oxygen in the global ocean and coastal waters", "https://www.science.org/doi/10.1126/science.aam7240", "Science", "2018"),
  nature_abw: createSource("Antarctic Bottom Water decline and deep ocean ventilation", "https://www.nature.com/articles/s41558-023-01667-8", "Nature Climate Change", "2023"),
  treasury_insurance: createSource("Treasury report on climate-related insurance availability and affordability", "https://home.treasury.gov/news/press-releases/jy2791", "United States Department of the Treasury", "2024"),
  naic_climate: createSource("Climate Risk and Resiliency", "https://content.naic.org/insurance-topics/climate-risk-and-resiliency", "National Association of Insurance Commissioners", "2025"),
  fema_nfip: createSource("National Flood Insurance Program risk rating resources", "https://www.fema.gov/flood-insurance/work-with-nfip/risk-rating/single-family-home", "Federal Emergency Management Agency", "2025"),
  unep_peatlands: createSource("Global Peatlands Assessment 2022", "https://www.unep.org/resources/global-peatlands-assessment-2022", "United Nations Environment Programme", "2022"),
  global_peatlands: createSource("Global Peatlands Initiative", "https://globalpeatlands.org/", "Global Peatlands Initiative", "2025"),
  ipcc_wg2_terrestrial: createSource("IPCC AR6 WG2 Chapter 2", "https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/", "Intergovernmental Panel on Climate Change", "2022"),
  gfw: createSource("Global Forest Watch", "https://www.globalforestwatch.org/", "World Resources Institute", "2025"),
  epa_ozone: createSource("Ground-level ozone basics", "https://www.epa.gov/ground-level-ozone-pollution/ground-level-ozone-basics", "United States Environmental Protection Agency", "2025"),
  epa_nep: createSource("National Estuary Program", "https://www.epa.gov/nep", "United States Environmental Protection Agency", "2025")
};

// Curated base connection research database
const CURATED_BASE_RESEARCH = {
  // Food & Farming
  'industry_farming->methane': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Industrial livestock farming and commercial crop production release methane through animal digestion and manure management. Flooded agricultural systems like rice paddies create low-oxygen soils that promote methane-producing microbes.",
    why_it_matters: "Livestock and agriculture are the largest sources of human-caused methane emissions globally.",
    research_notes: "Enteric fermentation in ruminants and anaerobic decomposition in rice paddies are major sources of global methane.",
    sourceKeys: ['unep_methane', 'fao_emissions']
  },
  'food->industry_farming': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Rising consumer demand for meat, dairy, and crops drives the expansion and intensification of industrial agricultural systems.",
    why_it_matters: "Dietary preferences directly shape global agricultural practices and land footprint.",
    research_notes: "Global demand for agricultural products is the primary driver of industrial scale and input intensity.",
    sourceKeys: ['fao_sofi_2024', 'ipcc_land']
  },
  'industry_farming->food': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Industrial farming supplies high volumes of agricultural output, feeding global food markets through monocultures and intensive animal operations.",
    why_it_matters: "Most of the calories consumed in advanced and emerging economies are supplied by industrial agricultural practices.",
    research_notes: "Monoculture cropping and feedlots are optimized for yield and calorie delivery.",
    sourceKeys: ['fao_sofi_2024', 'fao_emissions']
  },
  'food->deforestation': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Expanding food systems clear forests to create pasture for cattle grazing and arable land for feed and oil crops like soy and palm.",
    why_it_matters: "Agricultural expansion causes the vast majority of global forest loss.",
    research_notes: "Forest clearing is primary driven by land conversion for commercial pasture and cropland.",
    sourceKeys: ['ipcc_land', 'fao_emissions']
  },
  'deforestation->food': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Clearing forests yields temporary crop and pasture land, but local soil quality and rainfall patterns deteriorate after the canopy is removed.",
    why_it_matters: "Deforestation provides short-term cropland at the cost of long-term climate stability and agricultural viability.",
    research_notes: "Tropical soils often experience rapid nutrient depletion and erosion after canopy clearing.",
    sourceKeys: ['ipcc_land', 'fao_emissions']
  },
  'food->resource_depletion': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Food production draws heavily on groundwater reserves for irrigation and exhausts soil nutrients to maximize seasonal crop yields.",
    why_it_matters: "Agricultural demand is the largest global consumer of freshwater, pushing aquifers to depletion.",
    research_notes: "Overwatering and intensive tillage deplete soil organic carbon and draw down water tables.",
    sourceKeys: ['fao_sofi_2024', 'wri_aqueduct']
  },
  'food->carbon_emission': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Food supply chains release greenhouse gases through chemical fertilizers, farm machinery fuel, transportation, and cold-storage operations.",
    why_it_matters: "The modern food system accounts for a significant portion of global greenhouse gas emissions.",
    research_notes: "Emissions occur throughout the post-farm-gate lifecycle, including transport, processing, and distribution.",
    sourceKeys: ['fao_emissions', 'ipcc_land']
  },

  // Deforestation & Urbanization
  'deforestation->urbanization': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Clearing forest canopies opens remote land to road access and initial settlements, making later urban development and infrastructure expansion much easier.",
    why_it_matters: "Initial forest loss often acts as a precursor to permanent urban sprawl.",
    research_notes: "Road carving and land speculation are common transition steps between forest clearing and urban sprawl.",
    sourceKeys: ['ipcc_land', 'ipcc_ar6_wg3']
  },
  'urbanization->deforestation': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Growing cities clear surrounding forests for suburban housing, roads, utilities, and commercial development.",
    why_it_matters: "Suburban sprawl permanently replaces active ecosystems with asphalt and buildings.",
    research_notes: "Urban land consumption often expands faster than urban population growth.",
    sourceKeys: ['ipcc_land', 'ipcc_ar6_wg3']
  },
  'fast_fashion->urbanization': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "The fast fashion industry concentrates manufacturing plants and logistics hubs near expanding urban centers, pulling workers into urban industrial zones.",
    why_it_matters: "Textile manufacturing demands concentrate workers in cities, accelerating local urban infrastructure stress.",
    research_notes: "Concentrations of low-cost manufacturing plants drive migration and rapid housing buildout in urban fringes.",
    sourceKeys: ['unep_fashion', 'ipcc_ar6_wg3']
  },
  'urbanization->migration': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Expanding cities pull rural populations in search of jobs and services, while rising urban housing costs can push lower-income households outward.",
    why_it_matters: "Urban growth changes socioeconomic access, shaping population redistribution and movement.",
    research_notes: "Urban economic centers act as strong migration magnets, concentrating population density.",
    sourceKeys: ['idmc_grid', 'ipcc_ar6_wg2']
  },
  'migration->resource_depletion': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Large population movements place heavy demands on receiving region aquifers, waste management, and localized land assets.",
    why_it_matters: "Sudden population growth can overwhelm local water and land resources before systems can adapt.",
    research_notes: "Local resource stress occurs when population growth exceeds municipal water and sanitation capacities.",
    sourceKeys: ['idmc_grid', 'wri_aqueduct']
  },
  'resource_depletion->migration': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "When local water sources dry up and agricultural lands fail, families are forced to relocate to survive.",
    why_it_matters: "Environmental degradation is a leading cause of displacement and migration worldwide.",
    research_notes: "Aquifer collapse and soil loss undermine rural livelihoods, triggering displacement to cities.",
    sourceKeys: ['idmc_grid', 'iom_climate']
  },

  // Carbon & Temperature
  'carbon_emission->resource_depletion': {
    relationship_type: 'indirect',
    confidence: 'high',
    mechanism: "Carbon emissions drive global warming, which alters rainfall, speeds up glacier melt, and reduces soil moisture.",
    why_it_matters: "greenhouse gas emissions undermine the natural systems that provide water and support agriculture.",
    research_notes: "Radiative forcing dries soils and shifts precipitation, reducing freshwater and crop resilience.",
    sourceKeys: ['ipcc_ar6_wg1', 'wri_aqueduct']
  },
  'resource_depletion->carbon_emission': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "As water and soil resources decline, industries rely on energy-intensive solutions like desalination and chemical fertilizers, raising emissions.",
    why_it_matters: "Resource scarcity forces systems to use more energy to get the same outputs.",
    research_notes: "Falling water tables raise aquifer pumping energy demands, while degraded soils require more fertilizer production.",
    sourceKeys: ['ipcc_ar6_wg3', 'wri_aqueduct']
  },
  'personal_conveyance->carbon_emission': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Private cars and motorcycles burn fossil fuels like petrol and diesel, releasing carbon dioxide directly from tailpipes.",
    why_it_matters: "Passenger vehicles are a primary driver of urban air pollution and global transportation emissions.",
    research_notes: "Internal combustion engine vehicles dominate passenger transport energy use.",
    sourceKeys: ['iea_transport', 'ipcc_ar6_wg3']
  },
  'carbon_emission->personal_conveyance': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Emissions regulations and climate policies shape transportation planning, incentivizing vehicle efficiency and cleaner options.",
    why_it_matters: "Climate feedback and rules influence consumer choices and automotive development.",
    research_notes: "Emissions targets drive government subsidies and regulations for clean vehicle adoption.",
    sourceKeys: ['iea_transport', 'ipcc_ar6_wg3']
  },
  'temp->urbanization': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Rising temperatures amplify heat retention in paved surfaces and buildings, raising the demand for cooling infrastructure in cities.",
    why_it_matters: "Background warming makes concrete-heavy urban centers increasingly hot and dangerous.",
    research_notes: "The urban heat island effect is reinforced by global baseline warming and structural heat trapping.",
    sourceKeys: ['ipcc_ar6_wg2', 'ipcc_ar6_wg1']
  },
  'temp->carbon_emission': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Higher temperatures trigger natural feedbacks like wildfires and soil decomposition, which release stored carbon into the atmosphere.",
    why_it_matters: "Global heating can cause ecosystems to release greenhouse gases, accelerating warming beyond human emissions alone.",
    research_notes: "Warming reduces the efficiency of natural carbon sinks, creating positive climate feedbacks.",
    sourceKeys: ['ipcc_ar6_wg1', 'noaa_co2']
  },
  'temp->deforestation': {
    relationship_type: 'indirect',
    confidence: 'high',
    mechanism: "Warming climates dry out forest understory and soils, increasing the frequency and intensity of destructive wildfires.",
    why_it_matters: "Heat-driven drought kills trees and makes forests highly vulnerable to catastrophic fires.",
    research_notes: "Temperature increases vapor pressure deficit, drying forests and promoting fire weather conditions.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_land']
  },
  'temp->methane': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Warming temperatures accelerate microbial activity in tropical wetlands and thaw permafrost soils, releasing trapped methane.",
    why_it_matters: "Rising temperatures can trigger biological feedbacks that release potent greenhouse gases.",
    research_notes: "Wetland methanogenesis and permafrost decay are highly temperature-sensitive climate feedback loops.",
    sourceKeys: ['ipcc_ar6_wg1', 'noaa_ch4']
  },
  'temp->industry_farming': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Extreme heat reduces crop growth, stresses livestock health, and limits field labor hours during harvest.",
    why_it_matters: "Warming temperatures make global food production less stable and harder to manage.",
    research_notes: "Heat stress suppresses photosynthesis and increases animal mortality, disrupting agricultural yields.",
    sourceKeys: ['ipcc_ar6_wg2', 'ipcc_land']
  },
  'temp->environ_anomalies': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Warming climates load the atmosphere with extra energy and moisture, making severe storms, heatwaves, and droughts more frequent.",
    why_it_matters: "A warmer atmosphere directly translates to more volatile and destructive extreme weather events.",
    research_notes: "Clausius-Clapeyron scaling enables a warmer atmosphere to hold ~7% more water vapor per degree of warming.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_ar6_wg2']
  },
  'carbon_emission->temp': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Carbon emissions trap outgoing infrared radiation in the atmosphere, creating a warming blanket that heats the planet.",
    why_it_matters: "Carbon dioxide is the principal driver of long-term human-caused global warming.",
    research_notes: "Greenhouse forcing results from atmospheric CO2 trapping outgoing longwave radiation.",
    sourceKeys: ['ipcc_ar6_wg1', 'noaa_co2']
  },
  'methane->temp': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Methane gas absorbs heat radiation in the atmosphere, creating a strong near-term warming effect before decaying into carbon dioxide.",
    why_it_matters: "Methane is a powerful warming gas, trapping dozens of times more heat than carbon dioxide over a 20-year timeline.",
    research_notes: "Methane has a high radiative efficiency, with a GWP-20 value over 80 times that of CO2.",
    sourceKeys: ['ipcc_ar6_wg1', 'noaa_ch4']
  },
  'methane->environ_anomalies': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Methane releases accelerate near-term global warming, which increases the frequency and severity of extreme weather events such as intense heatwaves, storm events, and droughts.",
    why_it_matters: "Methane causes rapid short-term changes in weather extremes due to its potent radiative forcing.",
    research_notes: "Short-lived climate pollutants like methane drive near-term thermal anomalies and increase extreme weather conditions.",
    sourceKeys: ['unep_methane', 'noaa_aggi']
  },
  'methane->wet_bulb_heat': {
    relationship_type: 'indirect',
    confidence: 'high',
    mechanism: "Methane emissions speed up global warming, elevating baseline temperatures and increasing humid heat waves that push wet-bulb temperatures toward dangerous thresholds.",
    why_it_matters: "Rapid methane-driven warming increases the immediate threat of lethal humid heat waves in tropical regions.",
    research_notes: "Near-term radiative forcing from methane raises surface temperatures, multiplying humid heat exposure risk.",
    sourceKeys: ['unep_methane', 'ipcc_ar6_wg1']
  },
  'methane->monsoon_volatility': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Rapid near-term warming from methane emissions alters atmospheric moisture levels and ocean-land temperature differences, destabilizing seasonal monsoon cycles.",
    why_it_matters: "Methane-driven warming increases the variability of monsoons, endangering agriculture in South Asia.",
    research_notes: "Near-term temperature increases alter convective rainfall systems and monsoon moisture circulation.",
    sourceKeys: ['unep_methane', 'ipcc_ar6_wg1']
  },

  // ENSO (El Nino / La Nina)
  'temp->el_nino': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Rising global ocean temperatures alter ocean heat content, which can affect the background conditions and intensity of El Niño cycles.",
    why_it_matters: "Warming oceans can shift atmospheric circulation patterns, affecting global weather cycles.",
    research_notes: "Ocean warming modulates ENSO teleconnections and increases the likelihood of extreme sea surface temperature anomalies.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_srocc']
  },
  'carbon_emission->el_nino': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Emissions trap atmospheric heat, warming the tropical Pacific and influencing the temperature gradients that drive ENSO events.",
    why_it_matters: "Carbon-driven ocean warming could shift the behaviors of global climate patterns.",
    research_notes: "Greenhouse forcing changes tropical Pacific wind patterns and thermocline slope, modulating ENSO dynamics.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_srocc']
  },
  'el_nino->environ_anomalies': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "El Niño shifts warm Pacific waters eastward, reorganizing jet streams and causing heavy rainfall in some regions and severe droughts in others.",
    why_it_matters: "El Niño is a major driver of seasonal weather extremes, including floods and wildfires, across the globe.",
    research_notes: "ENSO ocean-atmosphere coupling alters regional atmospheric circulation, driving teleconnected weather extremes.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_ar6_wg2']
  },
  'el_nino->monsoon_volatility': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "El Niño changes air circulation over the Indian and Pacific Oceans, often weakening or delaying summer monsoonal rains.",
    why_it_matters: "Weakened monsoons threaten water and food security for billions of people in South Asia.",
    research_notes: "Altered Walker Circulation during El Niño suppresses convective precipitation over typical monsoon sectors.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_ar6_wg2']
  },
  'el_nino->food': {
    relationship_type: 'indirect',
    confidence: 'high',
    mechanism: "ENSO-linked droughts and floods damage major crop harvests, disrupting global supply chains and causing food price spikes.",
    why_it_matters: "Weather disruptions from El Niño can cause sudden regional food shortages and price shocks.",
    research_notes: "ENSO-driven precipitation failures directly impact regional crop yields and marine fisheries productivity.",
    sourceKeys: ['ipcc_ar6_wg2', 'fao_sofi_2024']
  },
  'el_nino->migration': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Harvest failures, water shortages, and severe floods during El Niño push vulnerable farming and fishing communities to migrate.",
    why_it_matters: "Severe weather events can trigger temporary or permanent displacement in resource-dependent regions.",
    research_notes: "Extreme weather shocks during ENSO cycles reduce agricultural income, forcing outward migration.",
    sourceKeys: ['ipcc_ar6_wg2', 'idmc_grid']
  },
  'carbon_emission->la_nina': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Greenhouse warming alters thermal gradients across the Pacific ocean surface, influencing the atmospheric pressures that sustain La Niña.",
    why_it_matters: "Warming climates can alter the frequency and behavior of cool-phase Pacific anomalies.",
    research_notes: "Greenhouse gas loading alters trade wind strengths and thermocline depth, modulating La Niña dynamics.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_srocc']
  },
  'la_nina->environ_anomalies': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "La Niña gathers cold water in the eastern Pacific, strengthening trade winds and driving wet conditions in Australia and droughts in the southern US.",
    why_it_matters: "La Niña cycles drive persistent droughts and active hurricane seasons, causing billions in damages.",
    research_notes: "La Niña ocean-atmosphere coupling alters planetary wave patterns, shifting storm tracks and regional precipitation.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_ar6_wg2']
  },
  'la_nina->monsoon_volatility': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "La Niña intensifies atmospheric pressure differences over the Indian Ocean, often bringing unusually heavy monsoon rains and flooding.",
    why_it_matters: "Severe monsoon flooding can devastate local communities, crops, and infrastructure.",
    research_notes: "Enhanced convection over the western Pacific and Indian ocean basins strengthens monsoon moisture transport.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_ar6_wg2']
  },
  'la_nina->resource_depletion': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "La Niña-induced droughts dry up reservoirs and deplete groundwater in agricultural regions like the American Southwest.",
    why_it_matters: "Persistent dry periods stretch local water supplies and aquifers to their limits.",
    research_notes: "Extended dry conditions suppress groundwater recharge while increasing irrigation withdrawals, depleting aquifers.",
    sourceKeys: ['ipcc_ar6_wg2', 'wri_aqueduct']
  },
  'la_nina->food': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Droughts in key growing zones like South America reduce harvests of staples like soy and corn, affecting global food markets.",
    why_it_matters: "Crop failures in major exporter countries raise food prices for consumers worldwide.",
    research_notes: "Precipitation deficits in North and South America during La Niña reduce grain yields, affecting food markets.",
    sourceKeys: ['ipcc_ar6_wg2', 'fao_sofi_2024']
  },

  // Humid Heat & Health
  'temp->wet_bulb_heat': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Warming temperatures increase water evaporation, creating combinations of extreme heat and high humidity that prevent sweat from cooling the human body.",
    why_it_matters: "Extreme wet-bulb temperatures represent a direct physical threshold for human survival.",
    research_notes: "Warming baseline temperatures raise absolute atmospheric humidity, leading to extreme thermodynamic stress events.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_ar6_wg2']
  },
  'carbon_emission->wet_bulb_heat': {
    relationship_type: 'indirect',
    confidence: 'high',
    mechanism: "Carbon emissions raise background global temperatures, making dangerous heat-humidity combinations more frequent and intense.",
    why_it_matters: "Emissions lock in higher base temperatures, increasing the range of dangerous humid heat.",
    research_notes: "Radiative forcing elevates global base temperatures, raising the occurrence of extreme wet-bulb thresholds.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_ar6_wg2']
  },
  'wet_bulb_heat->migration': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "When local temperatures frequently exceed safety limits, outdoor work and daily life become impossible, forcing people to move.",
    why_it_matters: "Extreme humid heat can make entire tropical and subtropical regions uninhabitable, driving migration.",
    research_notes: "Loss of physiological habitability and labor capacity due to heat index thresholds pushes population displacement.",
    sourceKeys: ['ipcc_ar6_wg2', 'idmc_grid']
  },
  'wet_bulb_heat->food': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Extreme heat and humidity make outdoor agricultural work unsafe, reducing planting and harvesting capacity.",
    why_it_matters: "Farming labor becomes dangerous during heat waves, directly reducing food supply and raising prices.",
    research_notes: "Humid heat exposure limits safe physical work capacity in agriculture, reducing harvest productivity.",
    sourceKeys: ['ipcc_ar6_wg2', 'ipcc_land']
  },
  'wet_bulb_heat->resource_depletion': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Extreme humid heat spikes the demand for electricity and water for air conditioning and cooling.",
    why_it_matters: "Heatwaves strain drinking water networks and power grids exactly when they are most needed.",
    research_notes: "Surges in cooling load drive rapid municipal water and utility drawdowns during extreme heat events.",
    sourceKeys: ['ipcc_ar6_wg2', 'wri_aqueduct']
  },
  'wet_bulb_heat->grid_peak_load_stress': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Surges in air conditioning use during extreme heat waves overwhelm local electricity distribution systems.",
    why_it_matters: "Cooling demands can cause regional power outages during severe heatwaves.",
    research_notes: "Simultaneous consumer cooling demands create sharp peaks in electricity draw, straining grid margins.",
    sourceKeys: ['ipcc_ar6_wg2', 'iea_weo_2024']
  },
  'grid_peak_load_stress->wet_bulb_heat': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "If electrical grids fail under peak load, consumers lose air conditioning, exposing them to dangerous indoor temperatures.",
    why_it_matters: "Blackouts during extreme heat waves can quickly lead to widespread heat illness and death.",
    research_notes: "Power outages eliminate mechanical cooling, exposing vulnerable urban populations to ambient indoor heat.",
    sourceKeys: ['ipcc_ar6_wg2', 'iea_weo_2024']
  },

  // Monsoon & Permafrost
  'temp->monsoon_volatility': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Rising land temperatures change atmospheric pressure differences, making monsoon rains more erratic and hard to predict.",
    why_it_matters: "Erratic monsoons alternate between severe droughts and extreme floods, causing agricultural disasters.",
    research_notes: "Enhanced land-ocean thermal contrast and moisture levels destabilize monsoon wind and rain patterns.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_ar6_wg2']
  },
  'carbon_emission->monsoon_volatility': {
    relationship_type: 'indirect',
    confidence: 'high',
    mechanism: "Greenhouse gases warm the atmosphere, increasing its moisture capacity and altering the wind systems that drive monsoon cycles.",
    why_it_matters: "Emissions increase the uncertainty of seasonal rainfall that feeds billions of people.",
    research_notes: "Carbon forcing alters atmospheric circulation and water storage, driving monsoon variations.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_ar6_wg2']
  },
  'monsoon_volatility->industry_farming': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Erratic monsoon rains disrupt traditional planting schedules, flood fields, or dry out crops early in the growing season.",
    why_it_matters: "Monsoon instability threatens agricultural yields and the livelihoods of farming communities.",
    research_notes: "Precipitation timing anomalies directly disrupt planting windows and crop development phases.",
    sourceKeys: ['ipcc_ar6_wg2', 'fao_emissions']
  },
  'monsoon_volatility->resource_depletion': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Unpredictable monsoon rains make it difficult to manage surface reservoirs and replenish underground aquifers.",
    why_it_matters: "Erratic rainfall patterns lead to water scarcity during the dry seasons.",
    research_notes: "Variability in runoff patterns reduces storage efficiency and aquifer recharge rates.",
    sourceKeys: ['ipcc_ar6_wg2', 'wri_aqueduct']
  },
  'monsoon_volatility->food': {
    relationship_type: 'indirect',
    confidence: 'high',
    mechanism: "Failed monsoon seasons lead to crop losses, reducing food supply and triggering price hikes in local markets.",
    why_it_matters: "Monsoon failures can cause immediate regional food insecurity and economic distress.",
    research_notes: "Harvest failures from monsoonal disruptions lead to grain price spikes and localized shortages.",
    sourceKeys: ['ipcc_ar6_wg2', 'fao_sofi_2024']
  },
  'monsoon_volatility->migration': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Repeated crop losses and severe floods during volatile monsoons force farming families to move to cities for work.",
    why_it_matters: "Agricultural failures driven by shifting monsoons are a key driver of rural-to-urban migration.",
    research_notes: "Income shocks from monsoonal farming failures accelerate migration trends.",
    sourceKeys: ['ipcc_ar6_wg2', 'idmc_grid']
  },
  'temp->permafrost_thaw': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Warming temperatures melt the frozen ground in Arctic regions, causing the soil structure to collapse and thaw.",
    why_it_matters: "Permafrost thaw collapses ground stability, damaging homes, pipelines, and roads across the Arctic.",
    research_notes: "Rising surface temperatures increase active layer thickness, thawing organic-rich soils.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_srocc']
  },
  'permafrost_thaw->methane': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "As permafrost thaws, microbes decompose the newly exposed organic matter, releasing methane in wet, oxygen-poor soils.",
    why_it_matters: "Methane release from thawing ground acts as a feedback loop that accelerates global warming.",
    research_notes: "Anaerobic decomposition in thermokarst lakes releases substantial volumes of biogenic methane.",
    sourceKeys: ['ipcc_ar6_wg1', 'noaa_ch4']
  },
  'permafrost_thaw->carbon_emission': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Thawing soils release stored carbon dioxide and methane as organic materials rot after thousands of years of deep freeze.",
    why_it_matters: "Permafrost holds massive carbon reserves that could be released, undermining emissions reduction efforts.",
    research_notes: "Aerobic and anaerobic decomposition of thawed organic carbon releases CO2 and CH4.",
    sourceKeys: ['ipcc_ar6_wg1', 'noaa_co2']
  },
  'permafrost_thaw->migration': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Ground collapse from thawing permafrost destroys coastal villages and municipal networks, forcing communities to relocate.",
    why_it_matters: "Arctic indigenous communities face displacement as the land beneath their homes softens.",
    research_notes: "Thermokarst subsidence and erosion undermine foundations and municipal utilities, forcing retreat.",
    sourceKeys: ['ipcc_ar6_wg2', 'idmc_grid']
  },
  'permafrost_thaw->resource_depletion': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Ground subsidence fractures water and sewage pipelines and collapses transportation routes built on frozen ground.",
    why_it_matters: "Softening ground ruins vital utility systems and supply lines in northern communities.",
    research_notes: "Infrastructure failure occurs as ground load-bearing capacity collapses due to thaw subsidence.",
    sourceKeys: ['ipcc_ar6_wg2', 'ipcc_srocc']
  },

  // Ocean Circulation & Acidification
  'carbon_emission->amoc': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Warming seas and freshwater runoff from melting land ice alter seawater density, weakening the ocean currents that drive AMOC.",
    why_it_matters: "A weakened AMOC circulation could severely disrupt climates and weather systems across Europe and West Africa.",
    research_notes: "Freshwater influx and ocean warming reduce density in the subpolar North Atlantic, slowing overturning.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_srocc']
  },
  'sea_ice_season_loss->amoc': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Melting sea ice adds freshwater to the ocean, lowering its salinity and density, which disrupts the deep sinking process that drives circulation.",
    why_it_matters: "Cryosphere loss in the Arctic directly influences major global ocean currents.",
    research_notes: "Freshing of subpolar surface waters suppresses deep convection, slowing the ocean conveyor belt.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_srocc']
  },
  'amoc->environ_anomalies': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Slowdowns in ocean circulation shift heat distribution, changing storm tracks and bringing colder winters to Europe and drought to the tropics.",
    why_it_matters: "AMOC disruption acts as a climate wild card, potentially bringing rapid weather extremes to millions.",
    research_notes: "Reduced ocean heat transport shifts global precipitation belts and reorganizes North Atlantic storm tracks.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_ar6_wg2']
  },
  'ocean_acidification->marine_fisheries_collapse': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Acidity from absorbed carbon dioxide prevents shellfish, corals, and plankton from building shells, collapsing marine food webs.",
    why_it_matters: "Acidifying oceans threaten the survival of fish species that feed hundreds of millions of people.",
    research_notes: "Lower pH and carbonate ion concentrations stress calcification, disrupting marine food chains and habitats.",
    sourceKeys: ['ipcc_srocc', 'noaa_pmel']
  },

  // Transport, Fashion, & Industry
  'aviation_demand_growth->carbon_emission': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Rising demand for flights increases jet-fuel combustion, releasing carbon dioxide directly into the high atmosphere.",
    why_it_matters: "Aviation is one of the fastest-growing sources of greenhouse gas emissions globally.",
    research_notes: "Kerosene combustion in jet engines accounts for rising transportation CO2 emissions.",
    sourceKeys: ['iea_transport', 'ipcc_ar6_wg3']
  },
  'fast_fashion->carbon_emission': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Mass garment production relies on fossil-fuel-powered factories and global transport routes, creating a massive carbon footprint.",
    why_it_matters: "Cheap, fast-turnover clothing generates significant global carbon emissions before it ever reaches stores.",
    research_notes: "Synthetic fiber production (like polyester) and coal-powered textile mills are highly carbon-intensive.",
    sourceKeys: ['unep_fashion', 'ipcc_ar6_wg3']
  },
  'fast_fashion->resource_depletion': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Growing cotton and manufacturing synthetic fibers consume large quantities of water and agricultural chemicals, polluting local rivers.",
    why_it_matters: "Textile production drains local freshwater sources and pollutes water systems in producing countries.",
    research_notes: "Water-intensive crops and industrial textile wastewater treatment stress local watersheds.",
    sourceKeys: ['unep_fashion', 'wri_aqueduct']
  },
  'fast_fashion->deforestation': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "The production of wood-based fabrics like rayon and viscose drives forest logging to harvest wood pulp.",
    why_it_matters: "High demand for pulp fabrics leads to logging and land clearing in ancient forest ecosystems.",
    research_notes: "Wood-pulp harvesting for cellulosic fibers can drive deforestation if sourcing is uncertified.",
    sourceKeys: ['unep_fashion', 'ipcc_land']
  },

  // Extremes & Impact
  'environ_anomalies->industry_farming': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Catastrophic droughts, floods, and heatwaves destroy crop fields, stress livestock, and disrupt agricultural labor.",
    why_it_matters: "Extreme weather events threaten food security by wiping out harvests and farming infrastructure.",
    research_notes: "Extreme meteorological events lead to crop damage, soil erosion, and harvest volatility.",
    sourceKeys: ['ipcc_ar6_wg2', 'ipcc_land']
  },
  'environ_anomalies->resource_depletion': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Extreme flooding pollutes freshwater sources, while prolonged droughts dry up reservoirs and deplete groundwater supplies.",
    why_it_matters: "Extreme weather ruins local water resources, creating severe shortages for communities.",
    research_notes: "Extreme weather events contaminate surface water and deplete hydrological reserves, compounding water stress.",
    sourceKeys: ['ipcc_ar6_wg2', 'wri_aqueduct']
  },
  'environ_anomalies->migration': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Sudden disasters like hurricanes and fires, as well as slow droughts, destroy homes and make relocation necessary.",
    why_it_matters: "Natural disasters displace millions of people annually, forcing emergency migrations.",
    research_notes: "Weather disasters cause acute damage to housing and livelihoods, triggering displacement.",
    sourceKeys: ['ipcc_ar6_wg2', 'idmc_grid']
  },
  'environ_anomalies->food': {
    relationship_type: 'indirect',
    confidence: 'high',
    mechanism: "Extreme weather shocks destroy food crops, disrupt transportation networks, and cause spikes in food prices.",
    why_it_matters: "Severe weather events cause sudden regional food shortages and price shocks.",
    research_notes: "Harvest failures and logistics disruptions during extreme weather drive regional food market instability.",
    sourceKeys: ['ipcc_ar6_wg2', 'fao_sofi_2024']
  },
  'environ_anomalies->urbanization': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Repeated extreme storms and floods damage urban roads, grids, and buildings, straining municipal budgets.",
    why_it_matters: "Weather disasters force cities to spend heavily on repairs, slowing down structural upgrades.",
    research_notes: "Extreme event damage increases urban repair liabilities, straining municipal capital reserves.",
    sourceKeys: ['ipcc_ar6_wg2', 'ipcc_ar6_wg3']
  },

  // Digital Infrastructure
  'data_centers->carbon_emission': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Data centers draw continuous electrical power, raising emissions when grids rely on fossil fuels like coal and gas.",
    why_it_matters: "Digital services carry a physical carbon footprint through the electricity that powers computing centers.",
    research_notes: "Continuous baseload electricity demands of compute servers contribute to grid emissions.",
    sourceKeys: ['iea_ai_2024', 'ipcc_ar6_wg3']
  },
  'data_centers->resource_depletion': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Data centers require large volumes of water for cooling and utilize metals, land, and energy grids.",
    why_it_matters: "Concentrated data center hubs compete with local communities for scarce water and power.",
    research_notes: "Evaporative cooling water draw and grid interconnection loads create localized resource strain.",
    sourceKeys: ['iea_ai_2024', 'wri_aqueduct']
  },
  'ai_data_centers->data_centers': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "AI workloads run on high-power chips that require much denser power and specialized cooling systems, scaling data center demands.",
    why_it_matters: "The growth of AI is driving a massive expansion in global data center size and power use.",
    research_notes: "AI servers require up to 5-10 times the rack density and cooling support of standard cloud servers.",
    sourceKeys: ['iea_ai_2024', 'iea_weo_2024']
  },
  'ai_data_centers->carbon_emission': {
    relationship_type: 'indirect',
    confidence: 'high',
    mechanism: "AI computing surges increase the electricity load of data centers, raising emissions when clean energy supply lags compute growth.",
    why_it_matters: "Rapid adoption of AI could slow down the decarbonization of electricity grids.",
    research_notes: "Surges in computing power demand keep older fossil fuel peaker plants running, raising grid carbon intensity.",
    sourceKeys: ['iea_ai_2024', 'ipcc_ar6_wg3']
  },
  'ai_data_centers->semiconductor_fabs': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "The deployment of AI clusters creates a high demand for advanced computer chips, pushing chip manufacturing factories to run at full capacity.",
    why_it_matters: "AI demand accelerates advanced semiconductor manufacturing, driving up its industrial footprint.",
    research_notes: "AI hardware demands dictate manufacturing priority and capacity expansion in advanced semiconductor fabs.",
    sourceKeys: ['iea_ai_2024', 'iea_weo_2024']
  },
  'semiconductor_fabs->resource_depletion': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Chip manufacturing consumes extreme volumes of ultrapure water, electricity, and rare metals, stressing local resources.",
    why_it_matters: "Semiconductor factories are heavy industrial operations that drain local water and energy supplies.",
    research_notes: "Advanced logic lithography requires massive water purification operations and continuous high-voltage power.",
    sourceKeys: ['iea_ai_2024', 'wri_aqueduct']
  },
  'semiconductor_fabs->cooling_water_competition': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Chip factories withdraw millions of gallons of water daily, competing with municipal drinking water and farming networks.",
    why_it_matters: "Semiconductor water demand can lead to local shortages and political conflicts during dry periods.",
    research_notes: "Fabrication facilities rely on continuous supplies of high-grade process water, reducing local water availability.",
    sourceKeys: ['iea_ai_2024', 'wri_aqueduct']
  },
  'semiconductor_fabs->carbon_emission': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Semiconductor manufacturing releases greenhouse gases through process energy use and synthetic fluorinated gases.",
    why_it_matters: "The fabrication process embeds carbon emissions into the chips that power electronics.",
    research_notes: "Process heating and lithography emissions are accompanied by fugitive PFC and HFC leakages.",
    sourceKeys: ['iea_ai_2024', 'ipcc_ar6_wg3']
  },
  'telecom_backbone->carbon_emission': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Internet transport networks rely on always-on routers, optical switches, and amplifiers that draw grid electricity.",
    why_it_matters: "The backbone of the global internet contributes to emissions through its continuous power demand.",
    research_notes: "Active network transmission devices demand continuous power to maintain low-latency traffic routing.",
    sourceKeys: ['iea_ai_2024', 'ipcc_ar6_wg3']
  },
  'telecom_backbone->critical_infrastructure_fragility': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Concentrating communication lines into a few physical routes and hubs means a localized failure can cause widespread internet outages.",
    why_it_matters: "A small number of network chokepoints increases the risk of regional communication failures.",
    research_notes: "High routing concentration increases vulnerability to cascade failure across interdependent utility grids.",
    sourceKeys: ['iea_ai_2024', 'iea_weo_2024']
  },
  'mobile_wireless_networks->telecom_backbone': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Cell towers and mobile transmitters gather user data traffic and direct it into the core optical fiber backbone network.",
    why_it_matters: "Cellular networks depend on physical fiber lines to carry data across long distances.",
    research_notes: "Last-mile wireless networks transport user data to core backhaul fiber switching nodes.",
    sourceKeys: ['iea_ai_2024', 'iea_weo_2024']
  },
  'mobile_wireless_networks->carbon_emission': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "The operation of thousands of cellular towers and wireless radio transmitters draws constant electricity from power grids.",
    why_it_matters: "Mobile networks generate emissions through the distributed electricity footprint of cell towers.",
    research_notes: "Distributed cellular base station transceivers consume significant grid electricity to maintain signals.",
    sourceKeys: ['iea_ai_2024', 'ipcc_ar6_wg3']
  },
  'internet_exchange_points->telecom_backbone': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Internet exchange points link different networks together, allowing data to be routed smoothly through the telecom backbone.",
    why_it_matters: "These core connection hubs keep web traffic moving quickly and reliably between providers.",
    research_notes: "IXPs provide the physical routing infrastructure for transit exchange between global network providers.",
    sourceKeys: ['iea_ai_2024', 'iea_weo_2024']
  },
  'internet_exchange_points->critical_infrastructure_fragility': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Concentrating digital traffic at a small number of physical exchange points increases vulnerability to outages or attacks.",
    why_it_matters: "Interconnection chokepoints represent a key vulnerability in regional communications infrastructure.",
    research_notes: "Physical concentration of exchange routers creates high-impact hubs for systemic network failures.",
    sourceKeys: ['iea_ai_2024', 'iea_weo_2024']
  },
  'subsea_cables->telecom_backbone': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Undersea fiber cables land at coastal stations, connecting terrestrial networks across oceans.",
    why_it_matters: "Undersea cables carry nearly all international digital traffic, forming the foundation of global communications.",
    research_notes: "Subsea cable landing terminals connect global deepwater routes to terrestrial network backbones.",
    sourceKeys: ['iea_ai_2024', 'iea_weo_2024']
  },
  'subsea_cables->critical_infrastructure_fragility': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Undersea cables concentrate along a few physical routes and landing zones, exposing them to disruption from anchors, seismic events, or sabotage.",
    why_it_matters: "International communication lines are vulnerable to physical damage in marine corridors.",
    research_notes: "Landing site and deepwater transit concentrations create physical risks of communication disruption.",
    sourceKeys: ['iea_ai_2024', 'iea_weo_2024']
  },
  'insurance_retreat->coastal_property_insurance_redlines': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Broad climate-linked insurance retreat becomes visible in exposed property markets as nonrenewal, withdrawal, or sharp repricing of coverage.",
    why_it_matters: "Coverage loss turns abstract insurance stress into concrete household and property-market instability.",
    research_notes: "Primary insurers often narrow availability first in catastrophe-exposed property lines when climate losses and capital pressure rise.",
    sourceKeys: ['naic_climate', 'treasury_insurance']
  },
  'reinsurance_withdrawal->coastal_property_insurance_redlines': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "When reinsurance becomes scarcer or more expensive, primary insurers respond by limiting, repricing, or withdrawing high-risk property coverage.",
    why_it_matters: "Upstream reinsurance stress can quickly propagate into local insurance availability problems.",
    research_notes: "Reinsurance capital and pricing feed directly into the affordability and persistence of primary catastrophe coverage.",
    sourceKeys: ['naic_climate', 'treasury_insurance']
  },
  'coastal_property_insurance_redlines->mortgage_market_exposure': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "When property insurance is withdrawn or becomes unaffordable, mortgages become riskier because homes are harder to finance, refinance, or keep insurable.",
    why_it_matters: "Insurance withdrawal can propagate into property values, loan performance, and broader housing-market instability.",
    research_notes: "Mortgage markets depend on insurable collateral, so climate-linked coverage loss can become a financial-system stressor.",
    sourceKeys: ['treasury_insurance', 'fema_nfip']
  },
  'peatland_degradations->wetland_peat_fires': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Drainage, extraction, and altered peatland hydrology lower water tables and leave peat soils vulnerable to long-duration smouldering fires.",
    why_it_matters: "Degraded peatlands can become outsized fire and carbon-emission sources once they dry out.",
    research_notes: "Fire resistance depends heavily on peatland water status, which degradation undermines.",
    sourceKeys: ['unep_peatlands', 'global_peatlands']
  },
  'temp->forest_dieback_areas': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Higher temperatures intensify drought and vapor-pressure deficit, increasing tree stress and mortality risk across vulnerable forests.",
    why_it_matters: "Hotter drought is a major pathway through which warming drives large-scale canopy loss and reduced carbon uptake.",
    research_notes: "Tree mortality rises when persistent heat and drought exceed physiological tolerance and recovery capacity.",
    sourceKeys: ['ipcc_wg2_terrestrial', 'gfw']
  },
  'wildfire_regime_shift->forest_dieback_areas': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Repeated or more severe wildfire can deepen forest dieback by causing canopy loss, post-fire mortality, and regeneration failure.",
    why_it_matters: "Disturbance compounding can convert episodic fire damage into longer-term forest decline.",
    research_notes: "Dieback risk grows when fire interacts with heat, drought, pests, and weakened recovery conditions.",
    sourceKeys: ['ipcc_wg2_terrestrial', 'gfw']
  },
  'volatile_organic_compounds->ozone_formation_pressure': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Non-methane volatile organic compounds react with nitrogen oxides under sunlight to generate ground-level ozone.",
    why_it_matters: "VOC control is one of the clearest direct levers for reducing ozone episodes in polluted airsheds.",
    research_notes: "Tropospheric ozone formation depends on precursor chemistry and meteorological conditions rather than on a single pollutant alone.",
    sourceKeys: ['epa_ozone']
  },
  'aquifer_overdraft->urban_water_rationing_zones': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Persistent groundwater overdraft can force cities and utilities to restrict water use when aquifer supply becomes unreliable or too costly to maintain.",
    why_it_matters: "Aquifer stress often shows up socially as rationing or restriction rather than as an invisible subsurface problem only.",
    research_notes: "Cities that lean on stressed groundwater often move toward demand controls as reliability deteriorates.",
    sourceKeys: ['usgs_groundwater', 'wri_aqueduct']
  },
  'reservoir_storage_instability->urban_water_rationing_zones': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Declining or highly variable reservoir storage can trigger municipal water restrictions to preserve essential supplies during drought and inflow volatility.",
    why_it_matters: "Observed storage stress frequently translates into visible household and utility restrictions.",
    research_notes: "Utilities use storage decline as a key operational signal for tightening urban water use.",
    sourceKeys: ['nature_reservoir_storage', 'wri_aqueduct']
  },
  'river_flow_regime_shift->estuary_eutrophication': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Altered river flow changes nutrient delivery, flushing time, salinity, and stratification in estuaries, which can reshape eutrophication risk.",
    why_it_matters: "Hydrologic changes upstream can materially alter estuarine nutrient and oxygen conditions downstream.",
    research_notes: "Estuarine eutrophication depends not only on nutrient load but also on the timing and structure of freshwater inflows.",
    sourceKeys: ['usgs_ecoflows', 'epa_nep']
  },

  // Additional Curated Edges
  'deforestation->urbanization': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Clearing forests opens land for initial roads and settlements, facilitating subsequent permanent urban expansion and building construction.",
    why_it_matters: "Forest loss frequently serves as a precursor to permanent suburban sprawl.",
    research_notes: "Road carving and land speculation act as intermediary steps between logging and urban sprawl.",
    sourceKeys: ['ipcc_land', 'ipcc_ar6_wg3']
  },
  'fast_fashion->urbanization': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "The clothing industry centers factory production and transport hubs in urban fringes, drawing workers into dense industrial zones.",
    why_it_matters: "Garment manufacturing concentrates population density in cities, raising municipal infrastructure demands.",
    research_notes: "Industrial textile operations create employment hubs that drive rapid suburban building expansion.",
    sourceKeys: ['unep_fashion', 'ipcc_ar6_wg3']
  },
  'resource_depletion->carbon_emission': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "As water and soil resources degrade, industries deploy energy-intensive alternatives like water pumping, desalination, and synthetic fertilizers, raising emissions.",
    why_it_matters: "Depleted natural resources force society to burn more energy to secure water and food.",
    research_notes: "Falling water tables raise aquifer pumping energy demands, while degraded soils require more fertilizer production.",
    sourceKeys: ['ipcc_ar6_wg3', 'wri_aqueduct']
  },
  'carbon_emission->personal_conveyance': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Climate policies and emissions regulations shape automotive manufacturing, encouraging transit development and efficient car options.",
    why_it_matters: "Regulatory responses to carbon emissions shape passenger transport technology and vehicle choices.",
    research_notes: "Government carbon caps drive automotive electrification and fuel economy standards.",
    sourceKeys: ['iea_transport', 'ipcc_ar6_wg3']
  },
  'temp->monsoon_volatility': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Warming base temperatures disrupt atmospheric pressure patterns, leading to erratic monsoon onset and rainfall distribution.",
    why_it_matters: "Monsoon instability brings alternating periods of extreme drought and severe flood, affecting farming.",
    research_notes: "Increasing land-sea thermal contrasts destabilize pressure dynamics, causing erratic monsoons.",
    sourceKeys: ['ipcc_ar6_wg1', 'ipcc_ar6_wg2']
  },
  'mobile_wireless_networks->carbon_emission': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "The operation of cell towers and data transmitters draws electricity continuously from power grids.",
    why_it_matters: "Mobile wireless networks contribute to emissions through the electrical draw of active transmitters.",
    research_notes: "Distributed network transmitters consume electricity to support wireless connectivity.",
    sourceKeys: ['iea_ai_2024', 'ipcc_ar6_wg3']
  },
  'internet_exchange_points->critical_infrastructure_fragility': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Concentrating regional internet traffic routing at a few exchange hubs creates single points of potential system failure.",
    why_it_matters: "Interconnection chokepoints create vulnerabilities where a single outage can disable multiple web services.",
    research_notes: "Physical consolidation of network routing creates vulnerable hubs prone to cascading outages.",
    sourceKeys: ['iea_ai_2024', 'iea_weo_2024']
  },
  'subsea_cables->critical_infrastructure_fragility': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Transoceanic cables follow a small number of underwater pathways and land at shared coastal hubs, creating geographic vulnerabilities.",
    why_it_matters: "Physical cable concentrations are exposed to accidental damage from marine traffic or natural events.",
    research_notes: "Marine routing bottlenecks make international telecom backbones vulnerable to physical cut events.",
    sourceKeys: ['iea_ai_2024', 'iea_weo_2024']
  },
  'food->resource_depletion': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Intensive farming for global food demand depletes local groundwater tables and strips soil organic carbon reserves.",
    why_it_matters: "Crop production consumes the majority of human water withdrawals, exhausting aquifers.",
    research_notes: "Irrigation demands draw down groundwater levels, while tillage accelerates topsoil degradation.",
    sourceKeys: ['fao_sofi_2024', 'wri_aqueduct']
  },
  'food->carbon_emission': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Supply chains for food produce greenhouse gases through tractor fuel, nitrogen fertilizer synthesis, logistics transport, and waste.",
    why_it_matters: "Food production and transport represent a major share of total human emissions.",
    research_notes: "Post-farm logistics, fertilizer manufacturing, and processing release significant carbon dioxide.",
    sourceKeys: ['fao_emissions', 'ipcc_land']
  },
  'urbanization->personal_conveyance': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Low-density urban design and suburban sprawl lock in a dependency on private cars for daily commuting and activities.",
    why_it_matters: "Sprawling development patterns require driving, making public transit harder to run.",
    research_notes: "Built density and parking policy shape automobile reliance and passenger transport energy demand.",
    sourceKeys: ['iea_transport', 'ipcc_ar6_wg3']
  },
  'urbanization->data_centers': {
    relationship_type: 'direct',
    confidence: 'medium',
    mechanism: "Expanding cities concentrate massive populations, businesses, and digital services, driving the buildout of nearby data centers.",
    why_it_matters: "Urban digital demand concentrates data center clusters near major metropolitan electricity grids.",
    research_notes: "Concentrations of population and enterprise operations require localized high-speed data exchanges and data center hubs.",
    sourceKeys: ['iea_ai_2024', 'iea_weo_2024']
  },
  'urbanization->resource_depletion': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Expanding cities demand large quantities of freshwater, construction concrete, sand, and gravel, exhausting local watersheds and quarries.",
    why_it_matters: "Metropolitan consumption accelerates the extraction and depletion of water and sand resources.",
    research_notes: "Concentrated municipal demand and construction material sourcing deplete local resources.",
    sourceKeys: ['wri_aqueduct', 'ipcc_ar6_wg3']
  },
  'environ_anomalies->migration': {
    relationship_type: 'direct',
    confidence: 'high',
    mechanism: "Severe weather events like floods, wildfires, and droughts destroy homes and assets, forcing families to relocate.",
    why_it_matters: "Natural disasters displace millions of people annually, forcing emergency migrations.",
    research_notes: "Meteorological disasters destroy physical shelter and local livelihoods, driving displacement.",
    sourceKeys: ['ipcc_ar6_wg2', 'idmc_grid']
  },
  'environ_anomalies->food': {
    relationship_type: 'indirect',
    confidence: 'high',
    mechanism: "Extreme weather shocks ruin agricultural harvests and damage transport routes, leading to food scarcity and price increases.",
    why_it_matters: "Severe weather events cause sudden regional food shortages and price shocks.",
    research_notes: "Crop yield losses and supply chain damages during extreme weather events destabilize food markets.",
    sourceKeys: ['ipcc_ar6_wg2', 'fao_sofi_2024']
  },
  'environ_anomalies->urbanization': {
    relationship_type: 'indirect',
    confidence: 'medium',
    mechanism: "Repeated extreme storms and floods damage urban roads, grids, and buildings, straining municipal maintenance budgets.",
    why_it_matters: "Weather disasters force cities to spend heavily on repairs, slowing down structural upgrades.",
    research_notes: "Extreme event damage increases urban repair liabilities, straining municipal capital reserves.",
    sourceKeys: ['ipcc_ar6_wg2', 'ipcc_ar6_wg3']
  }
};

// Main process
async function run() {
  const REGISTRY_PATH = path.resolve('public/graph-reference-registry.json');
  const OUTPUT_PATH = path.resolve('public/connection-research.json');

  console.log(`Reading registry from: ${REGISTRY_PATH}`);
  const rawRegistry = await fs.readFile(REGISTRY_PATH, 'utf8');
  const registry = JSON.parse(rawRegistry);

  const results = [];
  let baseCount = 0;
  let procCount = 0;

  for (const edge of registry.edges) {
    const isCuratedBase = edge.topology_rule === 'curated_base';
    const defensibility = edge.defensibility || { score: 1, label: 'weak_modeled', review_priority: 'high' };
    
    // Extract source and target node names
    const sourceNode = registry.nodes.find(n => n.id === edge.source);
    const targetNode = registry.nodes.find(n => n.id === edge.target);
    const sourceName = sourceNode ? sourceNode.name : edge.source;
    const targetName = targetNode ? targetNode.name : edge.target;

    const key = `${edge.source}->${edge.target}`;
    const curatedData = CURATED_BASE_RESEARCH[key];

    if (isCuratedBase && curatedData) {
      baseCount++;
      const resolvedSources = (curatedData.sourceKeys || []).map(k => SOURCES[k]).filter(Boolean);
      results.push({
        source_id: edge.source,
        source_name: sourceName,
        target_id: edge.target,
        target_name: targetName,
        relationship_type: curatedData.relationship_type,
        confidence: curatedData.confidence,
        mechanism: curatedData.mechanism,
        why_it_matters: curatedData.why_it_matters,
        research_notes: curatedData.research_notes,
        sources: resolvedSources,
        flag_for_review: false,
        review_note: "",
        edge_defensibility_score: defensibility.score,
        edge_defensibility_label: defensibility.label,
        edge_review_priority: defensibility.review_priority
      });
    } else {
      if (defensibility.label === 'curated_direct' || defensibility.label === 'curated_local') {
        baseCount++;
      } else {
        procCount++;
      }
      const confidenceMap = {
        5: 'high',
        4: 'medium',
        3: 'medium',
        2: 'low',
        1: 'low'
      };
      const evidence = edge.evidence || {};
      const isDirect = defensibility.label === 'curated_direct';
      const isCuratedLocal = defensibility.label === 'curated_local';
      const hasRelationshipEvidence = (isDirect || isCuratedLocal)
        && evidence.relationship_source_urls?.length;
      const isFamilyReference = defensibility.label === 'family_supported' && evidence.family_source_urls?.length;
      const evidenceUrls = hasRelationshipEvidence
        ? evidence.relationship_source_urls
        : isFamilyReference
          ? evidence.family_source_urls
          : (evidence.source_urls || []);
      const evidenceSources = evidenceUrls.map(url => ({
        title: evidence.source_status || 'Edge evidence stack',
        url,
        publisher: 'Inherited evidence stack',
        year: ''
      }));
      const reviewNoteByLabel = {
        curated_direct: '',
        family_supported: 'Family-supported edge. Plausible local topology, but it still lacks a dedicated relationship citation.',
        modeled_local: 'Modeled local edge. Useful for navigation, but it should be reviewed before being treated as a strong factual claim.',
        weak_modeled: 'Broad modeled edge. Treat as exploratory graph residue until tighter local evidence or a better intermediate node is attached.',
        curated_local: 'Curated local chain edge. Stronger than generic modeled links, but still not a dedicated direct-edge citation.'
      };
      results.push({
        source_id: edge.source,
        source_name: sourceName,
        target_id: edge.target,
        target_name: targetName,
        relationship_type: isDirect ? 'direct' : (evidence.relationship_type || 'indirect'),
        confidence: confidenceMap[defensibility.score] || "low",
        mechanism: evidence.notes || `Modeled coupling between ${sourceName} and ${targetName} generated by the active network topology.`,
        why_it_matters: isDirect
          ? 'This connection has relationship-specific evidence and is retained as a direct mechanism in the product graph.'
          : hasRelationshipEvidence
          ? 'This connection has relationship-specific evidence but remains a local or multi-step mechanism rather than a hard direct claim.'
          : defensibility.score >= 3
          ? "This connection is locally plausible in the active graph, but it still benefits from tighter edge-specific evidence."
          : "This connection remains a modeled pathway that warrants tighter empirical support or a more operational intermediate node.",
        research_notes: isDirect
          ? `Relationship-specific evidence mode: ${evidence.evidence_mode || evidence.source_status || 'curated_edge_reference'}.`
          : hasRelationshipEvidence
          ? `Relationship-specific local evidence mode: ${evidence.evidence_mode || evidence.source_status || 'curated_local_reference'}.`
          : `Topology rule: ${edge.topology_rule || 'unknown'}. Evidence mode: ${evidence.evidence_mode || evidence.source_status || 'none'}.`,
        sources: evidenceSources.length ? evidenceSources.map(source => ({
          ...source,
          publisher: hasRelationshipEvidence
            ? 'Edge-specific evidence'
            : isFamilyReference
              ? 'Family-specific evidence'
              : source.publisher
        })) : [
          SOURCES.ipcc_ar6_wg1 || {
            title: "IPCC Climate Change 2021: The Physical Science Basis",
            url: "https://www.ipcc.ch/report/ar6/wg1/",
            publisher: "Intergovernmental Panel on Climate Change",
            year: "2021"
          }
        ],
        flag_for_review: !isDirect && defensibility.score <= 2,
        review_note: Object.hasOwn(reviewNoteByLabel, defensibility.label)
          ? reviewNoteByLabel[defensibility.label]
          : "Modeled edge pending stronger relationship-specific evidence.",
        edge_defensibility_score: defensibility.score,
        edge_defensibility_label: defensibility.label,
        edge_review_priority: defensibility.review_priority
      });
    }
  }

  console.log(`Writing connection research JSON to: ${OUTPUT_PATH}`);
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(results, null, 2)}\n`, 'utf8');

  console.log('Research compilation complete!');
  console.log(`Curated base edges processed: ${baseCount}`);
  console.log(`Procedurally generated edges flagged: ${procCount}`);
  console.log(`Total edges compiled: ${results.length}`);

  // Delete the temporary file
  try {
    await fs.unlink('extracted-profiles.js');
    console.log('Cleaned up temporary extracted-profiles.js file.');
  } catch (err) {
    // Ignore error if already deleted
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
