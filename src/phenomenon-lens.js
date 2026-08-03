const DEFAULT_PHENOMENON_GROUP_LABELS = {
  primaryTitle: 'Top Drivers',
  secondaryTitle: 'Secondary Drivers'
};

const PHENOMENON_LENS_GROUP_CONFIG = {
  food: {
    primaryCount: 4,
    groupLabels: {
      primaryTitle: 'Highest Footprints',
      secondaryTitle: 'Lower Footprints'
    }
  },
  industry_farming: {
    primaryCount: 1,
    groupLabels: {
      primaryTitle: 'Core Annual Burden',
      secondaryTitle: 'Linked Annual Burdens'
    }
  },
  methane: {
    primaryCount: 3,
    groupLabels: {
      primaryTitle: 'Biggest Sources',
      secondaryTitle: 'Other Sources'
    }
  },
  carbon_emission: {
    primaryCount: 4,
    groupLabels: {
      primaryTitle: 'Core Sectors',
      secondaryTitle: 'Additional Sectors'
    }
  },
  temp: {
    primaryCount: 4,
    groupLabels: {
      primaryTitle: 'Primary Forcings',
      secondaryTitle: 'Amplifiers'
    }
  },
  migration: {
    primaryCount: 4,
    groupLabels: {
      primaryTitle: 'Direct Triggers',
      secondaryTitle: 'Compounding Stresses'
    }
  },
  data_centers: {
    primaryCount: 3,
    groupLabels: {
      primaryTitle: 'Leading Regions',
      secondaryTitle: 'Rest of World and Projection'
    }
  },
  ai_data_centers: {
    primaryCount: 4,
    groupLabels: {
      primaryTitle: 'Buildout Drivers',
      secondaryTitle: 'Infrastructure Consequences'
    }
  },
  food_waste: {
    primaryCount: 1,
    groupLabels: {
      primaryTitle: 'Biggest Source',
      secondaryTitle: 'Other Sources'
    }
  },
  aviation: {
    primaryCount: 1,
    groupLabels: {
      primaryTitle: 'Sector Total',
      secondaryTitle: 'Other Sources'
    }
  },
  shipping: {
    primaryCount: 3,
    groupLabels: {
      primaryTitle: 'Biggest Ship Types',
      secondaryTitle: 'Other Ships'
    }
  },
  cement_concrete: {
    primaryCount: 1,
    groupLabels: {
      primaryTitle: 'Chemistry',
      secondaryTitle: 'Fuel'
    }
  },
  steel: {
    primaryCount: 1,
    groupLabels: {
      primaryTitle: 'Main Route',
      secondaryTitle: 'Other Route'
    }
  },
  plastics_petrochemicals: {
    primaryCount: 4,
    groupLabels: {
      primaryTitle: 'Production Drivers',
      secondaryTitle: 'Leakage Pathways'
    }
  },
  air_conditioning_refrigerants: {
    primaryCount: 1,
    groupLabels: {
      primaryTitle: 'Older Refrigerants',
      secondaryTitle: 'Newer Refrigerants'
    }
  },
  fertilizer_production: {
    primaryCount: 1,
    groupLabels: {
      primaryTitle: 'Overall',
      secondaryTitle: 'By Fuel Type'
    }
  },
  mining_critical_minerals: {
    primaryCount: 1,
    groupLabels: {
      primaryTitle: 'Main Burden',
      secondaryTitle: 'Where It Happens'
    }
  },
  personal_conveyance: {
    primaryCount: 1,
    groupLabels: {
      primaryTitle: 'Main Source',
      secondaryTitle: 'Other Sources'
    }
  },
  urban_sprawl_housing: {
    primaryCount: 1,
    groupLabels: {
      primaryTitle: 'Main Source',
      secondaryTitle: 'Other Sources'
    }
  },
  water_stress: {
    primaryCount: 2,
    groupLabels: {
      primaryTitle: 'Strongest Pressures',
      secondaryTitle: 'Compounding Pressures'
    }
  },
  groundwater_depletion: {
    primaryCount: 2,
    groupLabels: {
      primaryTitle: 'Primary Drawdown Pressures',
      secondaryTitle: 'Amplifiers'
    }
  },
  heat_related_mortality_burden: {
    primaryCount: 2,
    groupLabels: {
      primaryTitle: 'Highest Mortality Drivers',
      secondaryTitle: 'Compounding Drivers'
    }
  },
  air_pollution_health_burden: {
    primaryCount: 2,
    groupLabels: {
      primaryTitle: 'Largest Exposure Sources',
      secondaryTitle: 'Additional Sources'
    }
  }
};

function clampPrimaryCount(primaryCount, itemCount) {
  return Math.min(Math.max(primaryCount || 3, 1), itemCount);
}

function buildLensGroups(items, config = {}) {
  if (!items.length) return [];

  const primaryCount = clampPrimaryCount(config.primaryCount, items.length);
  const groupLabels = {
    ...DEFAULT_PHENOMENON_GROUP_LABELS,
    ...(config.groupLabels || {})
  };
  const primaryItems = items.slice(0, primaryCount);
  const secondaryItems = items.slice(primaryCount);

  return [
    {
      key: 'primary',
      title: groupLabels.primaryTitle,
      meta: `${primaryItems.length} items`,
      items: primaryItems
    },
    secondaryItems.length > 0
      ? {
        key: 'secondary',
        title: groupLabels.secondaryTitle,
        meta: `${secondaryItems.length} items`,
        items: secondaryItems
      }
      : null
  ].filter(Boolean);
}

export const PHENOMENON_LENSES = {
  food: {
    title: 'Diet Footprint Comparison',
    eyebrow: 'Standalone phenomenon lens',
    intro: 'Diet works better as a direct food comparison, so this lens shows familiar foods on a common emissions scale instead of mixing them with annual farming-system totals.',
    unitLabel: 'kgCO2e per kg food',
    axisMax: 100,
    axisTicks: [0, 20, 40, 60, 80, 100],
    scaleNote: 'Measured as kilograms of CO2-equivalent per kilogram of food product. Bigger numbers mean a heavier climate footprint for the same amount of food.',
    takeaway: 'This makes the consumer-side difference legible immediately: ruminant meat and dairy sit far above staples and plant proteins on the same food basis.',
    items: [
      { label: 'Beef', value: 99.4, note: 'The standout outlier because methane, feed, and land-use pressure stack on top of each other.', emphasis: 'Outlier' },
      { label: 'Lamb', value: 39.7, note: 'Still extremely high because ruminant livestock carries a large methane and land burden.' },
      { label: 'Cheese', value: 23.9, note: 'Dairy remains heavy because milk is concentrated into a smaller finished product.' },
      { label: 'Chocolate', value: 18.7, note: 'High relative footprint driven by land pressure, processing, and supply-chain intensity.' },
      { label: 'Coffee', value: 15.3, note: 'A good example of a non-livestock food with a meaningful footprint once cultivation and processing are included.' },
      { label: 'Pork', value: 12.3, note: 'Lower than beef and lamb, but still materially heavier than most plant foods.' },
      { label: 'Chicken', value: 9.9, note: 'Much lower than ruminant meat, though still well above most legumes and grains.' },
      { label: 'Eggs', value: 4.7, note: 'Moderate footprint relative to other animal proteins.' },
      { label: 'Rice', value: 4.5, note: 'Rice stands out among staples because flooded cultivation creates methane.' },
      { label: 'Tofu', value: 3.2, note: 'A low-footprint protein benchmark that makes the diet comparison intuitive.' }
    ]
  },
  industry_farming: {
    title: 'Industrial Farming Annual Emissions',
    eyebrow: 'Annual source-attribution lens',
    intro: 'This version keeps farming on an annual emissions basis so the scale of industrial agriculture reads directly instead of hiding behind percentage shares.',
    unitLabel: 'MtCO2e per year',
    axisMax: 10000,
    axisTicks: [0, 2000, 4000, 6000, 8000, 10000],
    scaleNote: 'Research-backed annualized farming-heavy agrifood blocks using FAO synthesis, centered on 2019 accounting.',
    takeaway: 'This keeps the farming lens consistent with the rest of the heavy-emissions views while still showing which industrial agriculture blocks dominate.',
    items: [
      { label: 'Cattle ranching', value: 9400, note: 'Best current reference estimate for the biggest industrial-livestock-heavy block in the FAO agrifood synthesis.' },
      { label: 'Land clearing for cattle', value: 3300, note: 'Captures the annualized deforestation and conversion burden tied to livestock demand.' },
      { label: 'Farm energy', value: 2900, note: 'Keeps farm-gate activity linked to its large downstream fuel and electricity burden.' },
      { label: 'Land-clearing fires', value: 1300, note: 'A smaller but still material annual block in the farming-heavy emissions stack.' }
    ]
  },
  methane: {
    title: 'Methane Annual Emissions',
    eyebrow: 'Annual source-attribution lens',
    intro: 'Methane is explained here as a breakdown of its anthropogenic emissions sources, showing their relative share of the global baseline.',
    unitLabel: '% share of anthropogenic methane emissions',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Percentage share of the global anthropogenic methane baseline, estimated at approximately 390 MtCH₄/yr.',
    takeaway: 'This keeps methane in a standardized percentage share while preserving the source-attribution story users actually need.',
    items: [
      { label: 'Cattle', value: 28, note: 'Ruminant digestion and enteric fermentation remains the single largest agricultural source.' },
      { label: 'Oil and gas', value: 21, note: 'Fugitive emissions from extraction and transmission are the largest industrial source.' },
      { label: 'Landfills', value: 15, note: 'Municipal solid waste and wastewater decomposition generate significant methane.' },
      { label: 'Other anthropogenic sources', value: 15, note: 'Combustion, biofuels, and other smaller industrial processes combined.' },
      { label: 'Rice', value: 8, note: 'Anaerobic conditions in flooded rice paddies trigger methanogenesis.' },
      { label: 'Coal mines', value: 8, note: 'Venting and leakage from active and abandoned coal operations.' },
      { label: 'Manure', value: 5, note: 'Stored livestock manure adds a secondary agricultural release channel.' }
    ]
  },
  carbon_emission: {
    title: 'Carbon Emissions Composition',
    eyebrow: 'Sector decomposition lens',
    intro: 'Carbon emissions are explained here through a clean, normalized sector-by-sector share of tracked greenhouse gas emissions.',
    unitLabel: '% share of tracked carbon pressure',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Percentage share of the global tracked carbon pressure. These represent the key sectors contributing to total carbon emissions.',
    takeaway: 'This turns a broad atmospheric problem into an explainable portfolio of systems, showing how emissions distribute across major activities.',
    items: [
      { label: 'Power plants', value: 26, note: 'Electricity remains the anchor sector for long-lived carbon loading.' },
      { label: 'Cars and trucks', value: 18, note: 'Road transport, freight, and vehicle dependence drive persistent fossil demand.' },
      { label: 'Factories', value: 16, note: 'Steel, cement, heat, and process emissions stay hard to eliminate.' },
      { label: 'Buildings', value: 12, note: 'Heating, cooling, and embodied materials make the built environment visible.' },
      { label: 'Deforestation', value: 9, note: 'Forest loss and degraded land turn ecological damage into atmospheric carbon.' },
      { label: 'Planes and ships', value: 7.5, note: 'Global movement systems add a stubborn cross-border emissions channel.' },
      { label: 'Farming', value: 6.5, note: 'Not the largest CO2 slice, but still part of the broader carbon stack.' },
      { label: 'Materials', value: 5, note: 'Embedded emissions move through imported goods and industrial intermediates.' }
    ]
  },
  electricity_generation: {
    title: 'Electricity Generation',
    eyebrow: 'Global generation-mix lens',
    intro: 'Electricity generation belongs in Footprint because it is the upstream energy system behind cooling, heating, industry, EV charging, and digital infrastructure.',
    unitLabel: '% share of global electricity generation',
    axisMax: 40,
    axisTicks: [0, 10, 20, 30, 40],
    scaleNote: 'Research-backed global electricity composition using 2024 activity. This is a source-mix footprint lens rather than a direct emissions-intensity lens.',
    takeaway: 'This makes the power system legible in one glance: fossil generation still dominates globally even as low-carbon sources continue to grow.',
    items: [
      { label: 'Coal', value: 35, note: 'Largest single source of global electricity in 2024.' },
      { label: 'Natural gas', value: 22, note: 'Second-largest source globally in 2024.' },
      { label: 'Hydro', value: 14, note: 'Largest renewable source in the global mix.' },
      { label: 'Nuclear', value: 9, note: 'One of the largest low-carbon sources in annual electricity output.' },
      { label: 'Wind', value: 8, note: 'Wind remained ahead of solar in annual generation.' },
      { label: 'Solar', value: 7, note: 'Fastest-growing major source, but still smaller than wind and hydro in annual output.' },
      { label: 'Bioenergy + waste', value: 3, note: 'Small but still visible in the global generation mix.' },
      { label: 'Oil', value: 2, note: 'Residual thermal generation; only a few percent globally.' }
    ]
  },
  temp: {
    title: 'Warming Pressure Anatomy',
    eyebrow: 'Driver stack lens',
    intro: 'Global temperature warming pressure is decomposed below into normalized relative shares of observed warming forcing.',
    unitLabel: '% share of warming pressure',
    axisMax: 40,
    axisTicks: [0, 10, 20, 30, 40],
    scaleNote: 'Percentage share of the relative warming pressure contributing to the global temperature anomaly.',
    takeaway: 'This is useful to understand how CO2, short-lived climate pollutants, albedo loss, and feedbacks relative to one another drive warming.',
    items: [
      { label: 'Long-lived CO2 loading', value: 36, note: 'Carbon dioxide remains the dominant background warming load across decades.' },
      { label: 'Methane pulse', value: 20, note: 'Methane accelerates near-term warming and compresses the response window.' },
      { label: 'Land-use albedo and sink loss', value: 14, note: 'Deforestation weakens cooling sinks and changes surface-energy balance.' },
      { label: 'Aerosol masking loss', value: 10, note: 'Reduced aerosol cooling can expose more of the underlying greenhouse signal.' },
      { label: 'Feedback amplification', value: 7, note: 'Water vapor, snow loss, and ecosystem feedbacks compound the visible warming trend.' },
      { label: 'Urban heat contribution', value: 5, note: 'Local temperature experience is also intensified by built-environment heat retention.' },
      { label: 'Ocean heat release patterns', value: 4, note: 'Redistribution of stored heat changes how warming is felt year to year.' },
      { label: 'Cryosphere loss effects', value: 4, note: 'Snow and ice decline remove reflective surfaces that once buffered heat gain.' }
    ]
  },
  deforestation: {
    title: 'Deforestation + Land Use',
    eyebrow: 'Commodity-attribution lens',
    intro: 'This lens isolates forest conversion itself, so land clearing and associated carbon release are not blurred into the broader farming system.',
    unitLabel: 'million hectares converted (2001-2022)',
    axisMax: 55,
    axisTicks: [0, 10, 20, 30, 40, 50],
    scaleNote: 'Research-backed cumulative commodity-attribution lens using the strongest globally comparable deforestation dataset available. This is cumulative rather than annual and should be read that way.',
    takeaway: 'This shows the physical land-conversion story directly: cattle, oil crops, staple crops, plantations, and commodity expansion are the clearest forest-loss drivers.',
    items: [
      { label: 'Pasture expansion', value: 51.2, note: 'Mainly cattle-related conversion and the largest named block in the commodity-attribution dataset.' },
      { label: 'Oil palm + soy + other oilseeds', value: 19.5, note: 'Oilseed expansion is one of the clearest crop-linked forest conversion pathways.' },
      { label: 'Forest plantations', value: 17.1, note: 'Plantation expansion remains a material contributor in the long-run land-conversion total.' },
      { label: 'Other commodities', value: 14.6, note: 'Residual commodity pressure not cleanly broken out into named rows in the main study.' },
      { label: 'Staple crops', value: 13.4, note: 'Maize, rice, cassava, and related staples still account for meaningful cumulative forest loss.' },
      { label: 'Cocoa + coffee', value: 3.7, note: 'Smaller than pasture or oil crops, but still a visible and intuitive consumer-facing driver.' },
      { label: 'Rubber + fibre crops', value: 2.4, note: 'A smaller but still real commodity block in the cumulative total.' }
    ]
  },
  road_freight_logistics: {
    title: 'Road Freight + Logistics',
    eyebrow: 'Indicative transport-burden lens',
    intro: 'Road freight is a meaningful footprint category, but public global data is fragmented across trucks, vans, warehouses, fuel routes, and delivery chains.',
    unitLabel: 'share of freight burden',
    axisMax: 60,
    axisTicks: [0, 15, 30, 45, 60],
    scaleNote: 'Indicative data only. This view uses a burden decomposition rather than a single observed global table, because public logistics reporting is fragmented across vehicle classes and operations.',
    takeaway: 'This is useful as an indicative footprint because freight and logistics still represent one of the clearest transport-related industrial burdens outside passenger travel.',
    items: [
      { label: 'Heavy-duty trucks', value: 52, note: 'Long-haul and heavy freight remain the dominant diesel-intensive block.' },
      { label: 'Light commercial vans', value: 15, note: 'Regional and urban goods movement adds a second significant road-freight burden.' },
      { label: 'Warehousing + distribution', value: 12, note: 'Buildings, handling systems, and storage energy matter alongside vehicle exhaust.' },
      { label: 'Cold-chain logistics', value: 9, note: 'Temperature-controlled freight adds additional fuel, electricity, and refrigerant pressure.' },
      { label: 'Buses + coaches', value: 7, note: 'Passenger-heavy fleet segments overlap with freight infrastructure and fuel demand.' },
      { label: 'Last-mile delivery', value: 5, note: 'Small vehicles and dense urban routing create a growing but still smaller burden slice.' }
    ]
  },
  urbanization: {
    title: 'Urbanization System Load',
    eyebrow: 'Built environment lens',
    intro: 'Urbanization is explained below as a normalized breakdown of systems and loads intensified by rapid urban expansion.',
    unitLabel: '% share of urban pressure',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Percentage share of the global tracked pressure loads from rapid urban expansion.',
    takeaway: 'This shows the relative impact of construction materials, cooling energy, transport, and water systems on the urban footprint.',
    items: [
      { label: 'Construction materials', value: 26, note: 'Concrete, steel, and new building stock embed large upstream resource demand.' },
      { label: 'Cooling and electricity load', value: 19, note: 'Dense heat-exposed cities amplify power demand and outage sensitivity.' },
      { label: 'Transport dependency', value: 16, note: 'Road-heavy urban form hardens fuel use and pollution exposure.' },
      { label: 'Water and sanitation load', value: 13.5, note: 'Population concentration magnifies local water and wastewater stress.' },
      { label: 'Land-surface heat effect', value: 8, note: 'Impervious surfaces create their own climate signature through retained heat.' },
      { label: 'Housing expansion pressure', value: 7.5, note: 'Rapid growth can outpace affordable housing, driving sprawl and vulnerability.' },
      { label: 'Waste-system load', value: 5.5, note: 'Dense growth stresses collection, disposal, and pollution control systems.' },
      { label: 'Grid reliability strain', value: 4.5, note: 'Urban growth also shows up as local congestion and peak-load sensitivity.' }
    ]
  },
  fast_fashion: {
    title: 'Fast Fashion Lifecycle',
    eyebrow: 'Supply-chain lens',
    intro: 'Fast fashion is persuasive when the footprint is shown across fiber, manufacturing, logistics, and waste rather than as a vague consumption problem.',
    unitLabel: 'share of garment-system burden',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Illustrative lifecycle split for disposable apparel systems.',
    takeaway: 'This pattern can extend to electronics, plastics, furniture, and other high-turnover consumer systems.',
    items: [
      { label: 'Fabric production', value: 24, note: 'Fiber growing and synthetic feedstocks create the first large resource draw.' },
      { label: 'Dyeing and finishing', value: 19, note: 'Wet processing is one of the clearest water-pollution nodes in the chain.' },
      { label: 'Cut, sew, and assembly', value: 16, note: 'Labor-intensive manufacturing concentrates energy, labor, and chemical exposure.' },
      { label: 'Global freight and retail churn', value: 12, note: 'Rapid inventory cycles multiply logistics emissions and packaging waste.' },
      { label: 'Waste and disposal', value: 9, note: 'Short product life drives landfill, dumping, and open burning impacts.' },
      { label: 'Synthetic fiber petrochemicals', value: 8, note: 'Polyester and related fibers tie the sector directly to fossil feedstocks.' },
      { label: 'Water stress in cotton regions', value: 7, note: 'Natural fibers can still carry large irrigation and watershed burdens.' },
      { label: 'Microfiber leakage', value: 5, note: 'Garment use and washing extend the pollution footprint beyond the factory gate.' }
    ]
  },
  migration: {
    title: 'Displacement Trigger Mix',
    eyebrow: 'Human movement lens',
    intro: 'Migration is explained below as a normalized breakdown of displacement pressures, showing the relative share of each trigger.',
    unitLabel: '% share of displacement pressure',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Percentage share of the global tracked displacement pressure trigger mix.',
    takeaway: 'This highlights the relative influence of habitability loss, food-system shocks, water scarcity, and disasters on human movement.',
    items: [
      { label: 'Habitability loss', value: 26, note: 'Heat, flooding, and sea-level encroachment can steadily make places harder to remain in.' },
      { label: 'Food-system shocks', value: 20, note: 'Repeated harvest or livestock losses weaken household ability to stay put.' },
      { label: 'Water scarcity', value: 15, note: 'Chronic water stress pushes rural and peri-urban movement long before total system failure.' },
      { label: 'Storm and disaster damage', value: 13, note: 'Acute disasters turn exposure into immediate displacement.' },
      { label: 'Conflict and governance stress', value: 8.5, note: 'Political strain often converts environmental stress into durable migration.' },
      { label: 'Livelihood collapse', value: 7.5, note: 'Jobs, assets, and local economic stability often erode before physical evacuation begins.' },
      { label: 'Insurance and recovery failure', value: 6, note: 'Communities can become economically unviable even without total destruction.' },
      { label: 'Public-service overload', value: 4, note: 'School, clinic, and utility strain shapes whether receiving areas can absorb movement safely.' }
    ]
  },
  resource_depletion: {
    title: 'Resource Depletion Breakdown',
    eyebrow: 'Drawdown lens',
    intro: 'Resource depletion is represented below as a normalized share of depletion pressures across key natural capital stocks.',
    unitLabel: '% share of depletion pressure',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Percentage share of global tracked depletion pressure across key natural capital domains.',
    takeaway: 'This shows the relative extraction pressure on groundwater, topsoil, forests, and other essential systems.',
    items: [
      { label: 'Groundwater overdraft', value: 26, note: 'Aquifer drawdown is one of the clearest slow-moving limits in many regions.' },
      { label: 'Topsoil degradation', value: 20, note: 'Erosion and nutrient loss quietly reduce long-term agricultural resilience.' },
      { label: 'Forest and biomass loss', value: 15, note: 'Biological resource drawdown erodes both livelihoods and ecosystem buffering.' },
      { label: 'Energy and mineral extraction', value: 12.5, note: 'Industrial demand deepens extraction footprints across land and water systems.' },
      { label: 'Surface-water stress', value: 8.5, note: 'Rivers and reservoirs reveal the visible side of broader depletion pressure.' },
      { label: 'Fishery and coastal stock decline', value: 7, note: 'Marine depletion broadens the picture beyond land and freshwater resources.' },
      { label: 'Sand and construction material extraction', value: 6, note: 'Urban and infrastructure growth quietly consume huge physical stocks.' },
      { label: 'Ecological recharge failure', value: 5, note: 'The deeper problem is often that regeneration can no longer keep pace with withdrawal.' }
    ]
  },
  environ_anomalies: {
    title: 'Extreme Event Exposure Mix',
    eyebrow: 'Hazard cluster lens',
    intro: 'Extreme events are decomposed below into a normalized share of extreme-event burdens and hazards.',
    unitLabel: '% share of extreme-event burden',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Percentage share of global tracked extreme-event exposure and hazard burdens.',
    takeaway: 'This shows how exposure distributes across heatwaves, flooding, wildfires, and compound disasters.',
    items: [
      { label: 'Heatwaves', value: 27, note: 'Heat increasingly acts as the background amplifier for many other extremes.' },
      { label: 'Flooding and rainfall extremes', value: 20, note: 'Hydrologic volatility is becoming a central shared disaster channel.' },
      { label: 'Wildfire conditions', value: 18, note: 'Heat, dryness, and land management combine into wider fire exposure.' },
      { label: 'Storm intensification', value: 14, note: 'Stronger storm rainfall and surge deepen infrastructure and housing losses.' },
      { label: 'Compound events', value: 10, note: 'Multi-hazard overlap is where response systems often begin to fail.' },
      { label: 'Drought persistence', value: 7, note: 'Slow-moving extremes remain crucial because they quietly reorganize food and water systems.' },
      { label: 'Landslide and erosion bursts', value: 4, note: 'Secondary hazards often create much of the local damage footprint.' }
    ]
  },
  el_nino: {
    title: 'El Nino Teleconnection Map',
    eyebrow: 'Climate pattern lens',
    intro: 'El Nino is represented below as a normalized breakdown of downstream climate teleconnection impacts across regions and systems.',
    unitLabel: '% share of teleconnection impact',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Percentage share of global tracked teleconnection impacts associated with El Nino phases.',
    takeaway: 'This shows the relative influence of rainfall shifts, ocean heating, and agricultural exposure during El Nino events.',
    items: [
      { label: 'Rainfall disruption', value: 28, note: 'Shifts in precipitation patterns are one of the most visible global consequences.' },
      { label: 'Marine heat and fisheries stress', value: 21, note: 'Ocean heating and food-web changes make El Nino legible beyond land impacts.' },
      { label: 'Harvest volatility', value: 16.5, note: 'Agriculture absorbs teleconnections quickly through timing and water availability.' },
      { label: 'Disease-vector shifts', value: 11, note: 'Hydrologic and temperature changes also alter disease exposure zones.' },
      { label: 'Energy and hydropower instability', value: 7.5, note: 'Grid systems feel the pattern through water and cooling constraints.' },
      { label: 'Coral bleaching risk', value: 6.5, note: 'Marine heatwaves make reef impacts an especially visible El Nino consequence.' },
      { label: 'Food-price transmission', value: 5, note: 'Regional teleconnections eventually show up in household affordability.' },
      { label: 'Wildfire-prone dryness', value: 4.5, note: 'Some regions primarily experience El Nino through hotter, drier fire seasons.' }
    ]
  },
  la_nina: {
    title: 'La Nina Teleconnection Map',
    eyebrow: 'Climate pattern lens',
    intro: 'La Nina is represented below as a normalized breakdown of global climate teleconnection impacts, contrasting with El Nino phases.',
    unitLabel: '% share of teleconnection impact',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Percentage share of global tracked teleconnection impacts associated with La Nina phases.',
    takeaway: 'This shows the relative impact on flood risk, persistent drought, storm tracks, and crop yield volatility during La Nina.',
    items: [
      { label: 'Flood amplification in exposed basins', value: 25.5, note: 'Some regions experience sharper flood loading during La Nina conditions.' },
      { label: 'Drought persistence elsewhere', value: 21.5, note: 'The same phase can deepen dryness in other agricultural and water-stressed regions.' },
      { label: 'Storm-track reorganization', value: 15.5, note: 'Tropical and midlatitude storm behavior often shifts materially.' },
      { label: 'Crop yield instability', value: 12, note: 'Teleconnected rainfall changes quickly propagate into food markets.' },
      { label: 'Fisheries and coastal stress', value: 8, note: 'Ocean and coastal systems still feel meaningful secondary effects.' },
      { label: 'Cold-season anomaly shifts', value: 7, note: 'Some La Nina consequences show up through winter temperature and storm departures.' },
      { label: 'Reservoir management stress', value: 6, note: 'Water operators face sharper swings between too much and too little flow.' },
      { label: 'Regional flood-recovery burden', value: 4.5, note: 'Recovery systems often feel the phase through repeated wet-season losses.' }
    ]
  },
  wet_bulb_heat: {
    title: 'Wet-Bulb Exposure Anatomy',
    eyebrow: 'Survivability lens',
    intro: 'Wet-bulb heat risk is decomposed below into a normalized breakdown of compounding factors that create dangerous human-exposure events.',
    unitLabel: '% share of survivability pressure',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Percentage share of tracked factors contributing to combined heat-humidity survivability events.',
    takeaway: 'This shows the relative influence of baseline temperature, humidity, nighttime heat, and built-form factors on wet-bulb exposure.',
    items: [
      { label: 'Air temperature load', value: 26, note: 'Base heat sets the ceiling for whether humid conditions become dangerous.' },
      { label: 'Humidity saturation', value: 22, note: 'High humidity collapses the body’s ability to cool through sweating.' },
      { label: 'Nighttime recovery loss', value: 15.5, note: 'Without overnight relief, physical stress compounds across multiple days.' },
      { label: 'Power and cooling dependence', value: 11, note: 'Human safety becomes tightly coupled to reliable electricity and shelter.' },
      { label: 'Outdoor labor exposure', value: 8, note: 'Workers in exposed settings often feel the sharpest immediate toll.' },
      { label: 'Dense urban heat islands', value: 7.5, note: 'Built form can turn already dangerous heat into sustained survivability pressure.' },
      { label: 'Housing-quality inequality', value: 5.5, note: 'The burden is not evenly shared when cooling access and shelter quality differ.' },
      { label: 'Hospital and emergency load', value: 4.5, note: 'The medical system becomes part of the event pathway, not just the response.' }
    ]
  },
  monsoon_volatility: {
    title: 'Monsoon Volatility Profile',
    eyebrow: 'Seasonal instability lens',
    intro: 'Monsoon volatility is represented below as a normalized breakdown of seasonal hydrological and agricultural failure modes.',
    unitLabel: '% share of monsoon instability',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Percentage share of the global tracked seasonal failures associated with monsoon volatility.',
    takeaway: 'This highlights the relative impact of delayed onset, burst rainfall events, and seasonal dry breaks on volatility.',
    items: [
      { label: 'Late onset or failed onset', value: 24, note: 'Delayed seasonal arrival scrambles planting, storage, and labor decisions.' },
      { label: 'Burst rainfall extremes', value: 21.5, note: 'Too much rain in short windows can be as damaging as a weak monsoon.' },
      { label: 'Long dry breaks', value: 18.5, note: 'Intra-season dry spells destabilize crop development and water planning.' },
      { label: 'Retreat unpredictability', value: 11, note: 'Season-end uncertainty complicates second crops and infrastructure operations.' },
      { label: 'Reservoir mismatch', value: 8, note: 'Storage systems struggle when seasonal timing no longer behaves predictably.' },
      { label: 'Hydropower reliability shifts', value: 6.5, note: 'Energy systems feel monsoon instability through changed flow timing.' },
      { label: 'Urban drainage overwhelm', value: 5.5, note: 'Cities often experience variability through flooding rather than annual totals.' },
      { label: 'Price and labor volatility', value: 5, note: 'Seasonal instability eventually ripples into wages, markets, and migration.' }
    ]
  },
  permafrost_thaw: {
    title: 'Permafrost Feedback Stack',
    eyebrow: 'Cryosphere feedback lens',
    intro: 'Permafrost thaw is compelling when it is shown as both a carbon story and an infrastructure-collapse story.',
    unitLabel: 'share of thaw pressure',
    axisMax: 30,
    axisTicks: [0, 10, 20, 30],
    scaleNote: 'Illustrative split across the main consequences of widespread permafrost thaw.',
    takeaway: 'This format fits other threshold-like cryosphere phenomena where physical change creates multiple downstream consequences.',
    items: [
      { label: 'Methane release risk', value: 24, note: 'Abrupt thaw can open new fast-warming greenhouse release channels.' },
      { label: 'Carbon loss from soils', value: 20, note: 'Long-frozen carbon stores become newly mobile once thaw progresses.' },
      { label: 'Ground failure and infrastructure loss', value: 18, note: 'Roads, housing, and pipelines become physically unstable.' },
      { label: 'Ecosystem and hydrology shifts', value: 11, note: 'Thaw reorganizes wetlands, drainage, and northern habitats.' },
      { label: 'Settlement habitability strain', value: 8, note: 'Communities face growing repair, relocation, and service burdens.' },
      { label: 'Coastal Arctic erosion', value: 7, note: 'Frozen coasts can fail rapidly once thaw and wave exposure intensify together.' },
      { label: 'Pipeline and utility instability', value: 6, note: 'Critical infrastructure becomes a major secondary consequence of thaw.' },
      { label: 'Fire-susceptibility increase', value: 4, note: 'Thawing landscapes can also become more burnable in some northern regions.' }
    ]
  },
  amoc: {
    title: 'AMOC Disruption Channels',
    eyebrow: 'Circulation lens',
    intro: 'AMOC slowdown matters because it redistributes climate rather than simply adding one more warming metric.',
    unitLabel: 'share of circulation-disruption impact',
    axisMax: 28,
    axisTicks: [0, 7, 14, 21, 28],
    scaleNote: 'Illustrative downstream channels through which a weaker overturning circulation would be felt.',
    takeaway: 'Circulation-system risks often need a consequence map more than a score explanation.',
    items: [
      { label: 'Rainfall reorganization', value: 25, note: 'Large circulation changes can alter drought and flood probability across multiple regions.' },
      { label: 'Marine ecosystem stress', value: 18, note: 'Ocean productivity and temperature structure may be reshaped materially.' },
      { label: 'European climate disruption', value: 15, note: 'Regional weather patterns could be destabilized in politically sensitive ways.' },
      { label: 'Sea-level redistribution', value: 11, note: 'Changes in circulation can alter coastal exposure even without equal global effects.' },
      { label: 'Agricultural spillovers', value: 8, note: 'Food systems feel the pattern indirectly through changed seasons and hydrology.' },
      { label: 'Tropical Atlantic storm shifts', value: 7, note: 'Storm environments can also be altered by circulation reorganization.' },
      { label: 'Fisheries redistribution', value: 6, note: 'Species ranges and productivity may move with the circulation changes.' },
      { label: 'Policy and security sensitivity', value: 4, note: 'Abrupt regional shifts matter partly because institutions are not built for them.' }
    ]
  },
  personal_conveyance: {
    title: 'Personal Conveyance Annual Emissions',
    eyebrow: 'Annual mobility-burden lens',
    intro: 'This lens shifts personal transport out of per-kilometre comparisons and into annual emissions estimates so it reads on the same scale as the other system views.',
    unitLabel: 'MtCO2e per year',
    axisMax: 4000,
    axisTicks: [0, 1000, 2000, 3000, 4000],
    scaleNote: '',
    takeaway: 'The exact splits still need a direct transport-sector research pass, but this at least keeps personal conveyance on an annual emissions basis.',
    items: [
      { label: 'Cars and SUVs', value: 3300, note: 'Dominant annual burden estimate for personal conveyance pending a direct transport-sector extraction.' },
      { label: 'Flights', value: 300, note: 'Annual burden estimate representing the personal-travel slice of aviation demand.' },
      { label: 'Motorcycles', value: 200, note: 'Smaller than car dependence, but still a real recurring annual burden.' },
      { label: 'Rail', value: 40, note: 'Included as a lower-emissions annual comparator rather than a dominant burden source.' }
    ]
  },
  data_centers: {
    title: 'Data Center Electricity Demand',
    eyebrow: 'Regional distribution lens',
    intro: 'Data centers are one of the strongest current-system lenses because electricity demand is measurable, recent, and heavily concentrated by region.',
    unitLabel: 'TWh per year',
    axisMax: 200,
    axisTicks: [0, 50, 100, 150, 200],
    scaleNote: 'Research-backed regional split from IEA Energy and AI using 2024 activity, plus one 2030 projection marker.',
    takeaway: 'This framing turns a hidden infrastructure system into a readable map of where compute power is already landing and how fast it may grow.',
    items: [
      { label: 'United States', value: 187, note: 'About 45% of the 415 TWh global data-center electricity total in 2024.' },
      { label: 'China', value: 104, note: 'About 25% of the global total in 2024.' },
      { label: 'Europe', value: 62, note: 'About 15% of the global total in 2024.' },
      { label: 'Rest of world', value: 62, note: 'Residual 15% of global data-center electricity use in 2024.' },
      {
        label: 'Global total 2030',
        value: 945,
        note: 'A base-case projection rather than observed activity, included as a growth marker.',
        speculative: true,
        hideBar: true,
        excludeFromScale: true
      }
    ]
  },
  ai_data_centers: {
    title: 'AI Compute',
    eyebrow: 'Indicative infrastructure lens',
    intro: 'AI compute is represented below as a normalized breakdown of the electricity, cooling, hardware, and siting pressures it intensifies.',
    unitLabel: '% share of AI compute burden',
    axisMax: 40,
    axisTicks: [0, 10, 20, 30, 40],
    scaleNote: 'Percentage share of tracked resource and system burdens from rapid AI data center buildout.',
    takeaway: 'This highlights the relative pressure on electricity grids, cooling water, chip supply chains, and local grids from AI growth.',
    items: [
      { label: 'High-density electricity draw', value: 31.5, note: 'Training and inference clusters push much higher power density than typical enterprise compute.' },
      { label: 'Cooling intensity', value: 21, note: 'Heat removal becomes a major siting and water constraint as rack density climbs.' },
      { label: 'Chip and hardware supply chain', value: 14, note: 'Semiconductor and server manufacturing add upstream industrial burden.' },
      { label: 'Grid expansion and congestion', value: 10.5, note: 'Local networks can become the hidden bottleneck in rapid deployment.' },
      { label: 'Land and campus acceleration', value: 7, note: 'Speed of buildout changes how communities feel the infrastructure footprint.' },
      { label: 'Water and thermal rejection', value: 6, note: 'Advanced cooling still resolves into real local water and heat questions.' },
      { label: 'Backup resilience stack', value: 5.5, note: 'Reliability requirements can widen the onsite energy and fuel footprint.' },
      { label: 'Semiconductor material intensity', value: 4.5, note: 'AI scale-up also amplifies the upstream extraction and fabrication story.' }
    ]
  },
  building_operations: {
    title: 'Building Operations',
    eyebrow: 'Indicative buildings lens',
    intro: 'Buildings matter because operation, heating, cooling, and refurbishment tie together electricity use, onsite fuel combustion, and materials demand.',
    unitLabel: '% share of building-sector burden',
    axisMax: 60,
    axisTicks: [0, 15, 30, 45, 60],
    scaleNote: 'Indicative but source-backed framing based on the broadest building-sector split in the report. This is best read as a composition lens, not a direct annualized table.',
    takeaway: 'The key story is that buildings are not just direct fuel use: offsite electricity and heat dominate, while cement and steel remain a large embedded component.',
    items: [
      { label: 'Offsite electricity + heat', value: 57, note: 'Largest building-sector block and the clearest reason the power system and buildings are tightly linked.' },
      { label: 'Direct onsite fuels', value: 24, note: 'Combustion for heating, cooking, and operations still creates a major direct building burden.' },
      { label: 'Cement + steel refurbishment', value: 18, note: 'Materials remain a large embedded block even when the category is framed as building operations.' },
      { label: 'Other building sources', value: 1, note: 'Residual building-related burden outside the major named categories.' }
    ]
  },
  food_waste: {
    title: 'Food Waste Annual Emissions',
    eyebrow: 'Annual source-attribution lens',
    intro: 'Food waste is much easier to compare against the rest of the system once the discard chain is converted into annual climate burden.',
    unitLabel: 'MtCO2e per year',
    axisMax: 1400,
    axisTicks: [0, 300, 600, 900, 1200],
    scaleNote: 'Annualized from the 2.1 GtCO2e food-waste-disposal burden using the UNEP mass split across households, food service, and retail.',
    takeaway: 'This keeps food waste on the same annual-emissions scale as food, farming, and heavy industry.',
    items: [
      { label: 'Homes', value: 1260, note: 'Largest annualized emissions block after applying the UNEP waste-mass split to the 2.1 GtCO2e disposal burden.' },
      { label: 'Restaurants', value: 580, note: 'Commercial preparation and service losses create the second-largest annualized burden.' },
      { label: 'Grocery stores', value: 260, note: 'Smaller than households and restaurants, but still a material annual burden.' }
    ]
  },
  aviation: {
    title: 'Aviation Annual Emissions',
    eyebrow: 'Observed sector-burden lens',
    intro: 'Aviation now reads as an annual sector burden so it can sit next to shipping, cement, steel, and agriculture without switching units.',
    unitLabel: 'MtCO2e per year',
    axisMax: 1100,
    axisTicks: [0, 250, 500, 750, 1000],
    scaleNote: 'Observed global aviation-sector burden anchored to IEA 2023 aviation emissions context.',
    takeaway: 'This is deliberately simpler than the earlier flight-class view, but it keeps the unit system coherent across the product.',
    items: [
      { label: 'Passenger and cargo flights', value: 950, note: 'Observed annual aviation CO2 burden for 2023 based on the IEA sector context used in the research pack.' }
    ]
  },
  shipping: {
    title: 'Shipping Annual Emissions',
    eyebrow: 'Annual freight-burden lens',
    intro: 'Shipping now uses annualized emissions blocks so it reads in the same language as aviation and the major industrial sectors.',
    unitLabel: 'MtCO2e per year',
    axisMax: 700,
    axisTicks: [0, 200, 400, 600],
    scaleNote: 'Annualized from the Fourth IMO GHG Study 2018 total of 1.076 GtCO2e, with the dominant cargo classes grouped into the reported 55% combined share.',
    takeaway: 'This keeps shipping on the right unit while using ship categories people recognize immediately.',
    items: [
      { label: 'Container ships', value: 210, note: 'Annual burden estimate for container shipping within the dominant ship categories.' },
      { label: 'Bulk ships', value: 190, note: 'Annual burden estimate for dry-bulk freight within the dominant ship categories.' },
      { label: 'Oil tankers', value: 190, note: 'Annual burden estimate for tanker fleets within the dominant ship categories.' },
      { label: 'Other ships', value: 480, note: 'Residual annual burden from the rest of the shipping fleet using the same 2018 total-sector anchor.' }
    ]
  },
  cement_concrete: {
    title: 'Cement Annual Emissions',
    eyebrow: 'Annual process-burden lens',
    intro: 'Cement becomes much more legible here when the chemistry-versus-heat story is translated into annual emissions instead of percentage shares.',
    unitLabel: 'MtCO2e per year',
    axisMax: 2000,
    axisTicks: [0, 500, 1000, 1500, 2000],
    scaleNote: 'Annualized from a roughly 2.8 Gt cement-sector burden using the research-backed 65/35 calcination-versus-fuel split.',
    takeaway: 'The key point survives the unit cleanup: most cement emissions are still process emissions, not just heat demand.',
    items: [
      { label: 'Cement chemistry', value: 1820, note: 'Annualized process burden using the strongest 65% chemistry share from the cement research pack.' },
      { label: 'Kiln fuel', value: 980, note: 'Annualized kiln-energy burden using the same sector-total anchor.' }
    ]
  },
  steel: {
    title: 'Steel Annual Emissions',
    eyebrow: 'Annual route-burden lens',
    intro: 'Steel now reads as an annual sector burden so the dominant route problem is visible in the same unit system as the rest of the app.',
    unitLabel: 'MtCO2e per year',
    axisMax: 3000,
    axisTicks: [0, 1000, 2000, 3000],
    scaleNote: 'Annualized route estimate using a roughly 3.7 Gt steel-sector burden and the current worldsteel route-share context.',
    takeaway: 'This sacrifices some route-intensity nuance, but it makes the scale of conventional steel production impossible to miss.',
    items: [
      { label: 'Blast furnace steel', value: 2610, note: 'Annualized estimate based on BF-BOF dominance in global steel production.' },
      { label: 'Electric steel', value: 1080, note: 'Residual annual burden estimate covering DRI-EAF and scrap-EAF production pathways.' }
    ]
  },
  plastics_petrochemicals: {
    title: 'Plastics + Petrochemicals',
    eyebrow: 'Primary production lens',
    intro: 'This lens makes plastics legible as a fossil-industrial materials system rather than only a waste problem.',
    unitLabel: 'MtCO2e per year',
    axisMax: 500,
    axisTicks: [0, 100, 200, 300, 400, 500],
    scaleNote: 'Research-backed primary-plastics production lens using 2019 emissions composition. This should be read as industrial production burden rather than full downstream waste leakage.',
    takeaway: 'The pattern is clear: a small number of major polymers carry an enormous industrial carbon burden before the waste story even begins.',
    items: [
      { label: 'PET', value: 470, note: 'One of the largest named polymer burdens in primary plastic production.' },
      { label: 'Other plastics', value: 426, note: 'Residual polymer bucket showing how large the tail of primary plastics still is.' },
      { label: 'PP', value: 336, note: 'Polypropylene remains one of the biggest primary plastic burdens globally.' },
      { label: 'HDPE', value: 246, note: 'High-density polyethylene carries a very large industrial burden in annual terms.' },
      { label: 'PVC', value: 224, note: 'PVC remains one of the major named polymer burdens in primary production.' },
      { label: 'LLDPE', value: 157, note: 'Linear low-density polyethylene remains a significant production block.' },
      { label: 'PS', value: 134, note: 'Polystyrene is smaller than the top polymer groups but still material at global scale.' },
      { label: 'PU', value: 112, note: 'Polyurethane remains a meaningful annual industrial burden.' },
      { label: 'LDPE', value: 90, note: 'Low-density polyethylene adds another large polymer stream to the total footprint.' },
      { label: 'SAN + ABS', value: 45, note: 'Smaller named category, but still substantial in absolute annual burden.' }
    ]
  },
  air_conditioning_refrigerants: {
    title: 'Refrigerants Annual Emissions',
    eyebrow: 'Annual leakage-burden lens',
    intro: 'Refrigerants now sit on an annual emissions frame, with legacy gases carrying the largest burden and lower-GWP replacements shown as a smaller comparison tranche.',
    unitLabel: 'MtCO2e per year',
    axisMax: 1000,
    axisTicks: [0, 250, 500, 750, 1000],
    scaleNote: 'Annual burden estimate for cooling-sector refrigerant leakage, using the existing refrigerant hierarchy to separate legacy versus lower-GWP gases.',
    takeaway: 'This is the weakest annualization in the set and should be replaced once we pull a direct global refrigerant-emissions table.',
    items: [
      { label: 'Old refrigerants', value: 720, note: 'Annual burden estimate representing the dominant legacy HFC tranche in global cooling leakage.' },
      { label: 'New refrigerants', value: 180, note: 'Smaller annual burden estimate representing the lower-GWP replacement tranche.' }
    ]
  },
  fertilizer_production: {
    title: 'Fertilizer Production Annual Emissions',
    eyebrow: 'Annual ammonia-burden lens',
    intro: 'Fertilizer production now uses annual emissions so ammonia can be compared directly with cement, steel, and the food-system lenses.',
    unitLabel: 'MtCO2e per year',
    axisMax: 500,
    axisTicks: [0, 100, 200, 300, 400, 500],
    scaleNote: 'Annualized ammonia burden estimate centered on a roughly 0.44 GtCO2e global production total and current route-intensity benchmarks.',
    takeaway: 'This keeps fertilizer in the common annual unit while preserving route logic as a temporary estimate rather than a final source table.',
    items: [
      { label: 'Ammonia production', value: 440, note: 'Annual burden estimate for current fertilizer-feedstock ammonia production.' },
      { label: 'Coal-based fertilizer', value: 240, note: 'Higher-emissions route estimate consistent with the strongest ammonia intensity benchmark in the report.' },
      { label: 'Gas-based fertilizer', value: 200, note: 'Lower than the coal-route burden, but still materially emissions-intensive on an annual basis.' }
    ]
  },
  mining_critical_minerals: {
    title: 'Critical Minerals Refining Concentration',
    eyebrow: 'Supply-chain concentration lens',
    intro: 'Critical minerals are more defensible here as a concentration and chokepoint story than as a fabricated annual emissions total.',
    unitLabel: '% share of refining or processing',
    axisMax: 100,
    axisTicks: [0, 20, 40, 60, 80, 100],
    scaleNote: 'Research-backed concentration framing using the refining and processing shares surfaced in the research staging data.',
    takeaway: 'This keeps the real story intact: a small number of refining hubs dominate strategic mineral supply chains, creating systemic chokepoints.',
    items: [
      { label: 'Top 3 refining nations average share', value: 86, note: 'Average concentration across copper, lithium, nickel, cobalt, graphite, and rare-earth refining chains.' },
      { label: 'China average across 19 of 20 strategic mineral refining chains', value: 70, note: 'The clearest single-system concentration signal in the current research pack.' },
      { label: 'China projected battery-grade graphite share in 2035', value: 80, note: 'Graphite remains one of the most concentrated downstream processing chains.' },
      { label: 'China projected rare-earth refining share in 2035', value: 80, note: 'Rare-earth processing remains highly concentrated even in forward-looking scenarios.' },
      { label: 'China projected refined lithium share in 2035', value: 60, note: 'Lithium processing remains concentrated even after expected diversification.' },
      { label: 'China projected refined cobalt share in 2035', value: 60, note: 'Cobalt refining concentration also remains structurally high in the current outlook.' }
    ]
  },
  urban_sprawl_housing: {
    title: 'Housing Buildout Pressure',
    eyebrow: 'Provisional built-form lens',
    intro: 'Housing and sprawl are still better read here as overlapping construction pressures than as a clean annual emissions table.',
    unitLabel: 'indicative overlapping burden markers',
    axisMax: 4000,
    axisTicks: [0, 1000, 2000, 3000, 4000],
    scaleNote: 'Indicative only. These components overlap and should not be summed as a total annual emissions budget.',
    takeaway: 'This keeps the housing story visible while making the provisional, non-additive framing explicit until a cleaner decomposition is available.',
    items: [
      { label: 'New housing', value: 3700, note: 'Top-line indicative buildout marker rather than a stand-alone component that can be added to the others.' },
      { label: 'Concrete and steel', value: 2200, note: 'Materials-heavy subcomponent inside the broader housing-buildout story; shown for scale, not additivity.' },
      { label: 'Roads and utilities', value: 1500, note: 'Supporting infrastructure subcomponent inside the same buildout system; also non-additive.' }
    ]
  },
  water_stress: {
    title: 'Baseline Water Stress Drivers',
    eyebrow: 'Freshwater systems lens',
    intro: 'Water stress is most legible when it is shown as a demand-and-reliability system rather than as a single drought number.',
    unitLabel: 'indicative pressure score',
    axisMax: 100,
    axisTicks: [0, 25, 50, 75, 100],
    scaleNote: 'A bounded comparative lens for the major pressure channels that repeatedly show up in water-stress research and operational basin assessments.',
    takeaway: 'The core story is structural: irrigation demand, urban withdrawals, and climate-shifted flow timing compound into chronic water stress long before full supply failure.',
    items: [
      { label: 'Irrigation withdrawals', value: 92, note: 'The dominant structural pressure in many stressed basins because agriculture often controls the largest withdrawal share.' },
      { label: 'Urban and industrial demand', value: 74, note: 'Cities, power systems, and industry turn baseline stress into a multi-sector allocation problem.' },
      { label: 'Runoff timing change', value: 63, note: 'Shifted snowmelt and altered seasonality reduce how usable annual water totals really are.' },
      { label: 'Drought persistence', value: 58, note: 'Extended dry periods deepen the same baseline stress by reducing recovery windows.' }
    ]
  },
  groundwater_depletion: {
    title: 'Groundwater Depletion Pressures',
    eyebrow: 'Aquifer drawdown lens',
    intro: 'Groundwater depletion belongs in its own lens because hidden aquifer loss behaves differently from short-term surface-water stress.',
    unitLabel: 'indicative pressure score',
    axisMax: 100,
    axisTicks: [0, 25, 50, 75, 100],
    scaleNote: 'Comparative pressure framing for the most defensible channels that drive long-lived aquifer decline.',
    takeaway: 'The strongest pattern is substitution: when surface water gets less reliable, pumping rises and aquifer decline becomes the quiet buffer everyone spends down.',
    items: [
      { label: 'Irrigation pumping', value: 95, note: 'The main drawdown channel in heavily cultivated basins where pumping replaces unreliable surface supply.' },
      { label: 'Recharge deficit', value: 72, note: 'Depletion accelerates when recharge cannot keep pace with sustained withdrawals.' },
      { label: 'Industrial and urban wells', value: 54, note: 'Municipal and industrial demand deepens aquifer pressure where growth is concentrated.' },
      { label: 'Water-table decline lock-in', value: 49, note: 'Once drawdown is chronic, deeper wells and higher pumping costs reinforce the depletion cycle.' }
    ]
  },
  heat_related_mortality_burden: {
    title: 'Heat Mortality Risk Drivers',
    eyebrow: 'Public-health lens',
    intro: 'Heat mortality becomes clearer when we separate direct temperature exposure from the vulnerability and infrastructure failures that turn heat into death risk.',
    unitLabel: 'indicative mortality-risk score',
    axisMax: 100,
    axisTicks: [0, 25, 50, 75, 100],
    scaleNote: 'Comparative risk framing across the strongest drivers that repeatedly convert dangerous heat into observed mortality burden.',
    takeaway: 'Temperature matters, but outages, weak care access, and loss of overnight recovery are what make extreme heat lethal at population scale.',
    items: [
      { label: 'Extreme daytime heat', value: 94, note: 'The primary exposure driver behind acute heat-related mortality spikes.' },
      { label: 'Nighttime heat retention', value: 82, note: 'Mortality risk rises when people cannot physiologically recover overnight.' },
      { label: 'Cooling outages', value: 69, note: 'Power loss turns dangerous heat into a much sharper mortality threat, especially for medically vulnerable people.' },
      { label: 'Clinical access strain', value: 57, note: 'Transport, staffing, and care-system overload make the mortality burden much harder to contain.' }
    ]
  },
  air_pollution_health_burden: {
    title: 'Air Pollution Health Burden Sources',
    eyebrow: 'Public-health lens',
    intro: 'This lens keeps air pollution grounded in concrete exposure sources rather than blending all respiratory risk into a generic atmosphere node.',
    unitLabel: 'indicative exposure burden score',
    axisMax: 100,
    axisTicks: [0, 25, 50, 75, 100],
    scaleNote: 'Comparative source framing for major outdoor air-pollution pathways that drive health burden across transport, power, and combustion systems.',
    takeaway: 'Road traffic and fossil combustion remain the clearest upstream systems because they create repeated population exposure in the same places people live and work.',
    items: [
      { label: 'Road traffic exhaust', value: 88, note: 'Urban traffic remains one of the clearest direct pathways from transport systems to respiratory burden.' },
      { label: 'Power and industrial combustion', value: 77, note: 'Peaker plants, refineries, and industrial fuel use sustain concentrated exposure zones.' },
      { label: 'Ground-level ozone episodes', value: 61, note: 'Heat and precursor chemistry convert emissions into repeated ozone-health events.' },
      { label: 'Wildfire smoke overlap', value: 53, note: 'Smoke is not the whole air-pollution story, but it increasingly stacks on top of baseline urban burden.' }
    ]
  }
};

export function getPhenomenonLensById(id) {
  if (!id) return null;
  const lens = PHENOMENON_LENSES[id];

  if (!lens) return null;

  const items = Array.isArray(lens.items) ? lens.items : [];
  const groups = Array.isArray(lens.groups) && lens.groups.length > 0
    ? lens.groups
    : buildLensGroups(items, PHENOMENON_LENS_GROUP_CONFIG[id]);

  return {
    ...lens,
    items,
    groups
  };
}

export function getPhenomenonLens(node) {
  if (!node?.id) return null;
  return getPhenomenonLensById(node.id);
}
