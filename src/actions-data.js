export const ACTION_PROFILES = {
  food: {
    title: 'Diet Actions',
    definition: 'The diet footprint is driven most heavily by ruminant meat and dairy demand, so the strongest actions focus on protein swaps and procurement defaults rather than abstract food guilt.',
    whyItMatters: 'The report treats diet as one of the highest-confidence action surfaces in the whole system because the mechanism is intuitive and the emissions gap between beef, lamb, dairy, and plant proteins is large.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Strong evidence from diet studies, procurement interventions, and IPCC-style demand-side synthesis.',
    strongestAction: 'Replace beef and lamb first; supportive defaults are more effective than awareness campaigns alone.',
    personal: [
      'Replace beef first, then lamb, with legumes, soy, eggs, or poultry as easier substitutes.',
      'Reduce cheese-heavy and dairy-heavy patterns where it is practical.',
      'Treat food type as the main lever; local sourcing matters less than ruminant intensity.'
    ],
    community: [
      'Make plant-forward meals the default in schools, hospitals, campuses, and workplaces.',
      'Set procurement caps on beef and lamb instead of relying only on labels or nudges.',
      'Redesign menus and recipe defaults so lower-emission proteins are normal, not niche.'
    ],
    policy: [
      'Align dietary guidelines with climate and health evidence.',
      'Use public food procurement standards to shift meal volumes at scale.',
      'Reform agricultural support away from emissions-intensive livestock-heavy outcomes.'
    ],
    metrics: [
      'kgCO2e avoided per meal shifted',
      'share of beef and lamb meals replaced',
      'annual kgCO2e avoided per person'
    ],
    caution: 'Do not over-index on “local food” stories when the report shows food type matters more.'
  },
  industry_farming: {
    title: 'Industry Farming Actions',
    definition: 'Industry farming is a production-side footprint shaped by herd efficiency, manure, feed systems, land clearing, irrigation stress, and monoculture-dependent supply chains.',
    whyItMatters: 'The report argues that this category is important but less personal and more procurement- and policy-driven than the diet layer.',
    confidence: 'Medium-high confidence',
    confidenceNote: 'Production levers are credible, but results are more context-dependent than in diet or methane.',
    strongestAction: 'Focus on production efficiency, manure, feed, and land-use safeguards.',
    personal: [
      'Prefer lower-impact animal products only where credible sourcing or land-use standards exist.',
      'Reduce demand for opaque cattle and feed supply chains.',
      'Treat direct consumer leverage here as limited compared with diet or procurement.'
    ],
    community: [
      'Add manure, feed, water, and deforestation criteria to major food procurement contracts.',
      'Require soy and cattle traceability from large suppliers.',
      'Favor diversified sourcing over monoculture-dependent supply chains where possible.'
    ],
    policy: [
      'Repurpose agricultural support toward lower-emissions and biodiversity-safer production.',
      'Fund manure abatement, herd-efficiency, and land-protection programs.',
      'Enforce land-use and water constraints in intensive feed and livestock regions.'
    ],
    metrics: [
      'methane intensity per kg milk or meat',
      'share of sourced product under manure or land-use criteria',
      'farm-gate kgCO2e per kg product'
    ],
    caution: 'The report explicitly warns against treating broad “regenerative” claims as settled climate evidence.'
  },
  methane: {
    title: 'Methane Actions',
    definition: 'Methane is a fast-warming gas from fossil systems, waste, livestock, rice, and wastewater, so reducing it can slow near-term warming faster than many CO2 measures.',
    whyItMatters: 'This is one of the clearest policy surfaces in the report because the biggest reductions come from measured leaks, waste systems, and enforceable controls.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Especially strong for fossil methane, waste methane, and municipal systems.',
    strongestAction: 'Prioritize leaks and waste first; methane reduction is one of the fastest climate opportunities available.',
    personal: [
      'Replace beef with lower-emission proteins and prevent food waste that would become landfill methane.',
      'Use organics sorting where municipal systems actually capture the benefit.',
      'Support appliance and home choices that reduce food spoilage and unnecessary waste.'
    ],
    community: [
      'Implement organics diversion and landfill methane capture.',
      'Upgrade wastewater methane controls and institutional manure handling.',
      'Use local measurement and reporting instead of generic waste claims.'
    ],
    policy: [
      'Mandate methane MRV, LDAR, venting bans, and coal-mine capture where applicable.',
      'Use methane fees or performance standards for fossil operators.',
      'Back satellite and monitoring enforcement so methane rules are actually auditable.'
    ],
    metrics: [
      'MtCH4e reduced per year',
      'percent leak-rate reduction',
      'percent organic waste diverted from landfill'
    ],
    caution: 'The report is clear that upstream methane prevention is usually more effective than downstream cleanup.'
  },
  carbon_emission: {
    title: 'Carbon Actions',
    definition: 'Carbon is the economy-wide fossil dependence layer, spanning power, transport, buildings, industry, and land-use carbon loading.',
    whyItMatters: 'The report treats this as a systems map more than a household checklist: direct personal leverage exists, but the decisive levers are structural.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Best used as a system-level organizing category rather than a narrow lifestyle one.',
    strongestAction: 'Reduce direct fossil demand where you can, but design for economy-wide decarbonization.',
    personal: [
      'Replace direct fossil fuel use in transport, home energy, and major purchases where practical.',
      'Prioritize electrification where the alternative is long-lived fossil lock-in.',
      'Use fewer high-carbon materials and flights when there is a credible substitute.'
    ],
    community: [
      'Electrify buildings and fleets across managed portfolios.',
      'Use procurement and investment criteria that favor low-carbon operations and materials.',
      'Measure operational emissions directly instead of relying on branding claims.'
    ],
    policy: [
      'Use carbon pricing, green tax reform, fossil subsidy phaseout, clean-power rules, and industrial standards to change system defaults.',
      'Accelerate grid, building, and mobility transitions together rather than in isolation.',
      'Protect land carbon and sink integrity where it prevents additional fossil-equivalent burden.'
    ],
    metrics: [
      'MtCO2e reduced per year',
      'share of direct fossil demand displaced',
      'operational emissions per asset or system'
    ],
    caution: 'This category should not be reduced to trivial consumer tips when the report treats it as economy-wide.'
  },
  electricity_generation: {
    title: 'Electricity Generation Actions',
    definition: 'Electricity generation is the upstream power mix behind many other footprints, so clean power acts as a multiplier across buildings, mobility, industry, and digital infrastructure.',
    whyItMatters: 'The report ranks coal retirement, clean-power buildout, transmission, storage, and demand response among the most powerful actions in the entire system.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Evidence is especially strong for coal exit, renewables, grid expansion, and flexibility.',
    strongestAction: 'Retire coal, build clean power, and unblock the grid.',
    personal: [
      'Choose cleaner electricity tariffs or community power where the claims are credible.',
      'Shift flexible demand away from peak fossil-heavy periods where tools exist.',
      'Add rooftop solar or storage only when it complements wider grid decarbonization.'
    ],
    community: [
      'Deploy on-site solar, storage, and demand response across campuses and portfolios.',
      'Reduce peak loads in buildings and operations so cleaner grids are easier to run.',
      'Use procurement that values hourly or operational grid impact, not only annual claims.'
    ],
    policy: [
      'Retire unabated coal and reduce gas dependence over time with clean replacements.',
      'Build transmission, storage, and grid flexibility fast enough for renewable integration.',
      'Use clean-energy standards and market design that reward dispatch flexibility and low emissions.'
    ],
    metrics: [
      'coal share displaced',
      'clean electricity share',
      'peak demand reduced or shifted'
    ],
    caution: 'The report flags grids and interconnection as bottlenecks, so generation targets alone are not enough.'
  },
  personal_conveyance: {
    title: 'Conveyance Actions',
    definition: 'Conveyance is the personal mobility footprint driven by car dependence, vehicle size, fuel use, and travel demand.',
    whyItMatters: 'The report treats reduced car dependence and smaller, cleaner vehicles as stronger than simply swapping one high-use travel pattern for another.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'The biggest gains come from needing fewer car trips in the first place, then cleaning up the trips that remain.',
    strongestAction: 'Reduce car dependence first, then electrify the rest.',
    personal: [
      'Consolidate car trips and choose other modes where practical.',
      'Choose smaller EVs or efficient vehicles instead of oversizing the fleet.',
      'Replace discretionary car trips with transit, cycling, or walking when that is viable.'
    ],
    community: [
      'Use parking policy, commuter benefits, and transit programs to reduce car dependency.',
      'Electrify shared or managed fleets where duty cycles fit.',
      'Redesign campuses and large sites around access rather than parking expansion.'
    ],
    policy: [
      'Invest in transit, walking, and cycling infrastructure that changes mode share at scale.',
      'Pair mode-shift infrastructure with vehicle standards and electrification policy.',
      'Link mobility reform to land-use so fewer trips are required in the first place.'
    ],
    metrics: [
      'vehicle-km reduced',
      'share of trips shifted to active or transit modes',
      'tailpipe or lifecycle emissions per traveler'
    ],
    caution: 'The report explicitly favors trip avoidance and smaller vehicles over simple one-for-one car replacement narratives.'
  },
  road_freight_logistics: {
    title: 'Road Freight + Logistics Actions',
    definition: 'Road freight and logistics cover trucks, vans, warehouses, cold-chain systems, and the movement architecture behind goods delivery.',
    whyItMatters: 'The report frames this as a procurement and infrastructure-heavy category where organizations and regulators matter more than isolated consumer choices.',
    confidence: 'Medium-high confidence',
    confidenceNote: 'Promising and actionable, but more fragmented in data quality than power or buildings.',
    strongestAction: 'Optimize, electrify, and shift freight where the system allows it.',
    personal: [
      'Consolidate deliveries and avoid unnecessary rush shipping.',
      'Favor lower-frequency purchasing patterns over high-turnover parcel habits.',
      'Treat personal leverage as secondary to fleet, rail, and warehouse decisions.'
    ],
    community: [
      'Electrify regional and urban delivery fleets where routes fit.',
      'Require freight and logistics vendors to disclose emissions and efficiency metrics.',
      'Improve warehouse, routing, and cold-chain energy performance.'
    ],
    policy: [
      'Support truck ZEV corridors and charging infrastructure.',
      'Shift suitable freight toward rail and intermodal systems.',
      'Use performance standards and reporting rules for large logistics operators.'
    ],
    metrics: [
      'ton-km shifted from road',
      'fleet electrification share',
      'logistics emissions per delivery or ton-km'
    ],
    caution: 'The report treats this as policy- and procurement-shaped; avoid trivializing it into “order less stuff” alone.'
  },
  food_waste: {
    title: 'Food Waste Actions',
    definition: 'Food waste is both an upstream production burden and a downstream methane problem, so prevention matters more than disposal branding.',
    whyItMatters: 'The report ranks food-waste prevention among the highest-confidence household and institutional actions in the whole set.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Strong evidence and strong co-benefits, including cost savings.',
    strongestAction: 'Prevent waste before relying on disposal.',
    personal: [
      'Plan purchases, store food better, and actually eat leftovers.',
      'Learn which foods are being wasted repeatedly and fix that pattern first.',
      'Treat household waste reduction as both climate and money-saving action.'
    ],
    community: [
      'Measure waste by kitchen, site, or program instead of guessing.',
      'Redesign portions, forecasting, and storage in kitchens, schools, and institutions.',
      'Use redistribution where appropriate, but prioritize prevention first.'
    ],
    policy: [
      'Reform date labels and food-waste guidance.',
      'Build organics collection and methane-aware waste systems.',
      'Set reporting or reduction targets for major retailers and service providers.'
    ],
    metrics: [
      'kg food waste avoided',
      'percent waste reduction by site',
      'kgCO2e avoided from prevented waste'
    ],
    caution: 'The report is explicit that composting is weaker than not generating the waste in the first place.'
  },
  fertilizer_production: {
    title: 'Fertilizers Actions',
    definition: 'Fertilizers combine industrial ammonia production with field-level nitrogen overuse, making this both a manufacturing and land-management problem.',
    whyItMatters: 'The report highlights precision use and cleaner ammonia as the central levers, while warning that field performance is highly context-dependent.',
    confidence: 'Medium-high confidence',
    confidenceNote: 'Strong directionally, but more dependent on crop, soil, and regional practice than simpler sectors.',
    strongestAction: 'Match nitrogen application more precisely to crop needs and decarbonize ammonia production.',
    personal: [
      'Treat this as a weak direct-leverage category unless you directly manage land or procurement.',
      'Support food choices and suppliers that avoid fertilizer-intensive systems when that information is credible.',
      'Avoid simplistic claims that more fertilizer always means more resilience.'
    ],
    community: [
      'Use precision application, nutrient management, and better nitrogen accounting.',
      'Back procurement and farm programs that reward nitrogen-use efficiency.',
      'Pilot lower-emissions ammonia or nutrient alternatives where practical.'
    ],
    policy: [
      'Scale near-zero-emission ammonia production.',
      'Use nutrient standards, reporting, and support reform to reduce overapplication.',
      'Tie fertilizer policy to agronomic measurement instead of generic volume targets.'
    ],
    metrics: [
      'nitrogen-use efficiency',
      'kg N applied per unit output',
      'MtCO2e from ammonia production reduced'
    ],
    caution: 'The report stresses that fertilizer interventions are real, but not uniformly transferable across all geographies.'
  },
  mining_critical_minerals: {
    title: 'Mining Actions',
    definition: 'Mining is driven by virgin material demand, ore processing, energy use, water risk, and governance quality across extraction and refining chains.',
    whyItMatters: 'The report treats mining as important but weakly consumer-shaped; circularity and governance matter more than symbolic green purchasing.',
    confidence: 'Medium confidence',
    confidenceNote: 'Important, but more context-dependent and less mature than power or buildings.',
    strongestAction: 'Replace virgin material with reused or recycled inputs and improve extraction governance.',
    personal: [
      'Keep products longer and replace them less often.',
      'Choose repair, reuse, and longer-lifespan devices where possible.',
      'Treat direct personal leverage as limited compared with system procurement and regulation.'
    ],
    community: [
      'Use circular procurement, repair, and reuse requirements in institutions.',
      'Reduce unnecessary material throughput in equipment and infrastructure refresh cycles.',
      'Screen large purchases for sourcing, water, and refining risk where possible.'
    ],
    policy: [
      'Strengthen mineral governance, recycling systems, and refining standards.',
      'Support mine electrification and cleaner processing where credible.',
      'Use strategic material policy to reduce wasteful demand rather than only expanding extraction.'
    ],
    metrics: [
      'virgin material displaced',
      'recycled content share',
      'product lifetime extension'
    ],
    caution: 'The report is clear that this should not become a consumer-tip category when most leverage is upstream.'
  },
  urban_sprawl_housing: {
    title: 'Housing Actions',
    definition: 'Housing is the built-form and land-use footprint created by where and how homes are built, especially sprawl, size, material use, and transport dependence.',
    whyItMatters: 'The report separates this from building operations and pushes housing toward location, density, and material-efficiency choices.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Especially strong where land use, transport, and housing policy are linked.',
    strongestAction: 'Build in well-connected places, favoring compact development and material-efficient design.',
    personal: [
      'Choose smaller homes or better-located homes when real options exist.',
      'Favor renovation, reuse, and infill over greenfield buildout where practical.',
      'Treat location and travel implications as part of the housing decision.'
    ],
    community: [
      'Back infill, reuse, and transit-oriented project design.',
      'Set embodied-carbon and material-efficiency expectations in development programs.',
      'Preserve access to housing near jobs, transit, and daily services.'
    ],
    policy: [
      'Use zoning and land-use reform to reduce sprawl.',
      'Link housing growth to compact, transit-oriented development.',
      'Adopt embodied-carbon codes or standards for major housing projects.'
    ],
    metrics: [
      'housing growth near transit',
      'embodied carbon per dwelling',
      'travel demand induced per household'
    ],
    caution: 'The report warns against calling buildings “green” while ignoring size and location effects.'
  },
  building_operations: {
    title: 'Building Operations Actions',
    definition: 'Building operations cover heating, cooling, electricity use, controls, and the ongoing performance of the buildings that already exist.',
    whyItMatters: 'This is one of the strongest action categories in the report because the interventions are mature, measurable, and useful across portfolios.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'A clear “ready now” category for both product storytelling and real action.',
    strongestAction: 'Retrofit the building you already have.',
    personal: [
      'Weatherize, insulate, and reduce unnecessary heating and cooling demand.',
      'Replace fossil HVAC with heat pumps or efficient low-GWP systems at replacement.',
      'Reduce peak loads through controls, shading, and smarter operation.'
    ],
    community: [
      'Retrofit building portfolios rather than waiting for new construction to solve the problem.',
      'Use controls, commissioning, and maintenance to lock in savings.',
      'Adopt building-level standards for managed real estate and campuses.'
    ],
    policy: [
      'Scale building performance standards and retrofit finance.',
      'Strengthen codes, appliance standards, and peak-demand reform.',
      'Support heat-pump adoption and efficient cooling transitions.'
    ],
    metrics: [
      'kWh reduced per square meter',
      'heating fuel displaced',
      'peak demand reduced'
    ],
    caution: 'The report favors direct performance upgrades over vague “green building” narratives.'
  },
  deforestation: {
    title: 'Deforestation + Land Use Actions',
    definition: 'Deforestation and land use are driven by commodity-linked forest conversion, especially cattle, soy, palm, timber, and other frontier expansion pressures.',
    whyItMatters: 'The report treats traceability, due diligence, and indigenous land protection as central, not optional side notes.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Strong evidence, but success still depends heavily on enforcement and land tenure.',
    strongestAction: 'Prevent forest conversion upstream of commodities.',
    personal: [
      'Reduce demand linked to opaque cattle, palm, and forest-risk commodities.',
      'Prefer products with credible traceability where it actually exists.',
      'Treat consumption choices as secondary to enforcement and supply-chain governance.'
    ],
    community: [
      'Adopt deforestation-free sourcing requirements in procurement.',
      'Screen commodity supply chains for traceability and land-rights risk.',
      'Support restoration only as a complement to avoided forest loss, not a substitute.'
    ],
    policy: [
      'Use due-diligence laws and traceability requirements for forest-risk commodities.',
      'Protect indigenous land rights and local enforcement capacity.',
      'Align trade and agricultural policy with forest protection rather than frontier expansion.'
    ],
    metrics: [
      'hectares of forest conversion avoided',
      'share of sourced commodities traceable',
      'deforestation-linked emissions reduced'
    ],
    caution: 'The report treats indigenous rights as a core mechanism, not a communications add-on.'
  },
  plastics_petrochemicals: {
    title: 'Plastics + Petrochemicals Actions',
    definition: 'Plastics and petrochemicals are primarily a virgin-resin and fossil-feedstock footprint, not just a waste-sorting problem.',
    whyItMatters: 'The report repeatedly warns against letting recycling dominate the narrative when reuse, resin reduction, and policy shape the bigger outcome.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Policy and procurement evidence is strong, especially for virgin-resin reduction and reuse systems.',
    strongestAction: 'Reduce virgin resin demand through reuse and stronger rules.',
    personal: [
      'Avoid unnecessary single-use plastic where a durable alternative is realistic.',
      'Reduce consumption patterns that drive needless packaging throughput.',
      'Treat recycling as supportive, not sufficient on its own.'
    ],
    community: [
      'Adopt reuse systems and packaging redesign in large procurement environments.',
      'Set recycled-content and reuse expectations in institutional purchasing.',
      'Measure virgin plastic demand reduction, not only disposal outcomes.'
    ],
    policy: [
      'Use EPR, recycled-content mandates, and virgin-resin reduction rules.',
      'Constrain unnecessary petrochemical buildout where demand reduction is feasible.',
      'Support reuse infrastructure that changes market defaults.'
    ],
    metrics: [
      'tonnes of virgin plastic displaced',
      'reuse rate',
      'recycled content share'
    ],
    caution: 'The report is explicit that recycling alone does not solve the plastics story.'
  },
  data_centers: {
    title: 'Data Centers Actions',
    definition: 'Data centers are an operational infrastructure footprint shaped by electricity demand, utilization, cooling, siting, and local grid and water stress.',
    whyItMatters: 'The report treats this as an operational and policy-heavy category where transparency, efficiency, and siting matter more than cosmetic offset stories.',
    confidence: 'Medium-high confidence',
    confidenceNote: 'Important and increasingly measurable, but still more fragmented than buildings or power.',
    strongestAction: 'Efficiency, siting, and transparency matter more than offsets.',
    personal: [
      'Treat this as a very weak direct-leverage category for most individuals.',
      'Use digital services more intentionally, but do not oversell the household effect.',
      'Support stronger disclosure and accountability rather than symbolic “low-data” claims.'
    ],
    community: [
      'Improve server utilization, cooling efficiency, and demand management in managed facilities.',
      'Choose cleaner, less water-stressed, and less grid-constrained siting where possible.',
      'Require operational reporting from large compute vendors and facilities.'
    ],
    policy: [
      'Use large-load planning, utility coordination, and disclosure rules for major data-center development.',
      'Tie data-center growth to credible grid and water capacity assessments.',
      'Reward real operational efficiency rather than broad annual-matching claims alone.'
    ],
    metrics: [
      'electricity use per workload',
      'cooling efficiency',
      'local grid or water stress indicators'
    ],
    caution: 'The report flags annual renewable matching as an incomplete story for real operational impact.'
  },
  ai_data_centers: {
    title: 'AI Compute Actions',
    definition: 'AI compute is a fast-growing workload footprint shaped by model size, training intensity, inference demand, hardware utilization, cooling, and disclosure quality.',
    whyItMatters: 'The report treats AI compute as important but clearly more uncertain than mature sectors, so the UI should show emerging rather than absolute certainty.',
    confidence: 'Emerging action surface',
    confidenceNote: 'Evidence is useful but fragmented and moving quickly.',
    strongestAction: 'Use computing efficiently for each useful result.',
    personal: [
      'Use smaller tools for smaller tasks instead of assuming maximal compute is always necessary.',
      'Avoid unnecessary AI-heavy workflows where lighter alternatives work.',
      'Treat personal leverage here as limited and mostly indirect.'
    ],
    community: [
      'Right-size models, compress workloads, and improve inference efficiency.',
      'Schedule training and heavy workloads more intelligently against system conditions.',
      'Track utilization and useful output per unit of compute instead of prestige metrics alone.'
    ],
    policy: [
      'Require compute disclosure and clearer reporting standards for major AI deployments.',
      'Encourage workload scheduling and efficiency norms rather than pure scale races.',
      'Link AI infrastructure growth to grid, cooling, and transparency requirements.'
    ],
    metrics: [
      'energy per training run or inference workload',
      'useful output per compute unit',
      'disclosed versus undisclosed compute share'
    ],
    caution: 'The report repeatedly says this category should be labeled as emerging and uncertainty-aware.'
  },
  semiconductor_fabs: {
    title: 'Semiconductor Fabs Actions',
    definition: 'Semiconductor fabs tie advanced compute growth to ultrapure water demand, process energy, fluorinated gases, and concentrated industrial supply chains.',
    whyItMatters: 'This is a chokepoint industrial category where facility design, water stewardship, and process controls matter more than generic digital-efficiency slogans.',
    confidence: 'Medium-high confidence',
    confidenceNote: 'Good operational levers exist, but the footprint remains supply-chain- and geography-dependent.',
    strongestAction: 'Reduce process intensity and water stress at the facility level.',
    personal: [
      'Treat this as an indirect leverage category shaped mostly by product lifetimes and upstream procurement.',
      'Keep devices longer so replacement cycles do not accelerate fab demand unnecessarily.',
      'Avoid confusing chip scarcity with climate progress; the lever is better production, not simple shortage.'
    ],
    community: [
      'Require water, energy, and fluorinated-gas reporting from major fabrication and packaging suppliers.',
      'Prioritize water recycling, process-gas controls, and lower-emissions power in fab-heavy procurement.',
      'Treat siting and watershed stress as first-order decision criteria, not side constraints.'
    ],
    policy: [
      'Tie semiconductor incentives to water stewardship, clean power, and process-gas controls.',
      'Require stronger disclosure for fab water withdrawals, recycling rates, and F-gas emissions.',
      'Support cleaner process heat, abatement, and circular supply-chain standards in the chip sector.'
    ],
    metrics: [
      'water use per wafer or fab output',
      'fluorinated-gas emissions reduced',
      'share of fab power supplied by low-carbon electricity'
    ],
    caution: 'The main leverage is industrial and procurement-led, not household-scale behavior.'
  },
  digital_infrastructure: {
    title: 'Digital Infrastructure Actions',
    definition: 'Telecom backbone networks, exchange points, wireless access systems, and subsea cables are physical infrastructures whose footprint is shaped by reliability standards, redundancy, power use, and chokepoint concentration.',
    whyItMatters: 'The climate and fragility story here is mostly about operational resilience, efficient design, and smarter buildout rather than consumer abstinence narratives.',
    confidence: 'Medium confidence',
    confidenceNote: 'Important and actionable, though less standardized than power, buildings, or refrigerants.',
    strongestAction: 'Build for efficiency and resilience together.',
    personal: [
      'Treat this as a weak direct-leverage category for individuals outside device lifetime and data-demand choices.',
      'Use digital services intentionally, but do not overstate household abstinence as the core intervention.',
      'Support transparency from network operators and infrastructure-heavy vendors.'
    ],
    community: [
      'Improve network efficiency, redundancy planning, and backup-power quality across managed infrastructure.',
      'Reduce unnecessary always-on loads where reliability is not actually improved by wasteful overprovisioning.',
      'Screen major digital vendors for energy, siting, and resilience disclosures.'
    ],
    policy: [
      'Use reliability and disclosure standards that reward efficient, resilient network design.',
      'Tie major network expansion to credible energy and resilience planning rather than pure speed-to-deploy metrics.',
      'Require coastal, flood, and heat-risk planning for critical cable landings and interconnection hubs.'
    ],
    metrics: [
      'energy use per traffic carried',
      'backup-power intensity',
      'share of critical routes with resilient low-risk siting'
    ],
    caution: 'This is a physical-infrastructure problem first; avoid reducing it to abstract “use less internet” messaging.'
  },
  fast_fashion: {
    title: 'Fast Fashion Actions',
    definition: 'Fast fashion is a high-turnover apparel system driven by production speed, low durability, global freight churn, wet processing, and short product lifetimes.',
    whyItMatters: 'The strongest levers are simply buying fewer new garments, extending use, and changing institutional procurement standards.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Evidence is strong on longevity, reduced turnover, and procurement intervention.',
    strongestAction: 'Choose fewer new garments, keep clothes longer, and slow the turnover cycle.',
    personal: [
      'Reduce new-item turnover and keep garments in use longer.',
      'Repair, reuse, and buy second-hand where practical.',
      'Treat ultra-cheap volume buying as the main risk pattern, not isolated individual items.'
    ],
    community: [
      'Set durability, repair, and reuse expectations in uniform and institutional apparel procurement.',
      'Measure purchase volume and replacement frequency instead of relying only on recycled-fiber branding.',
      'Build repair, resale, and recirculation pathways that actually displace new production.'
    ],
    policy: [
      'Use EPR, durability standards, and anti-waste rules for apparel systems.',
      'Require better disclosure on material composition, wastewater, and production practices.',
      'Support repair and reuse markets instead of optimizing only end-of-life disposal.'
    ],
    metrics: [
      'new garments avoided',
      'average wear count per garment',
      'share of procurement covered by durability or reuse standards'
    ],
    caution: 'The key lever is lower throughput, not greener branding on the same disposable model.'
  },
  urbanization: {
    title: 'Urbanization Actions',
    definition: 'Urbanization is the systems pressure created when housing, transport, cooling, water, waste, and materials all intensify together in growing settlements.',
    whyItMatters: 'The real leverage is in urban form and infrastructure quality, not just city-versus-suburb rhetoric.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Especially strong when land use, transport, housing, and services are planned together.',
    strongestAction: 'Grow more compactly and with less forced travel.',
    personal: [
      'Choose locations that reduce forced driving and oversized housing demand when real options exist.',
      'Treat housing, transport, and service access as one decision rather than separate lifestyle buckets.',
      'Support neighborhood patterns that reduce infrastructure duplication and daily travel needs.'
    ],
    community: [
      'Back compact infill, transit-supportive development, and cooler urban design.',
      'Design growth around water, shade, drainage, and grid resilience instead of only raw expansion.',
      'Use procurement and planning standards that reduce material intensity per resident served.'
    ],
    policy: [
      'Reform zoning and infrastructure finance so growth does not default to sprawl.',
      'Link housing delivery to transit, cooling resilience, and service access.',
      'Adopt urban heat, stormwater, and embodied-carbon standards together.'
    ],
    metrics: [
      'housing or jobs added near transit',
      'vehicle-km induced per resident',
      'material or energy demand per resident served'
    ],
    caution: 'Urban growth is not automatically efficient; form and infrastructure quality decide the outcome.'
  },
  migration: {
    title: 'Migration Actions',
    definition: 'Climate-linked migration is a systems outcome shaped by habitability loss, food stress, water insecurity, disaster damage, and governance capacity.',
    whyItMatters: 'The strongest interventions reduce forced displacement pressure before crisis and improve the safety and absorbency of receiving systems.',
    confidence: 'Medium-high confidence',
    confidenceNote: 'Good evidence for resilience and protection levers, but migration remains context-heavy.',
    strongestAction: 'Reduce forced displacement pressure and plan for safe mobility.',
    personal: [
      'Support local resilience and aid efforts that reduce forced movement after climate shocks.',
      'Treat migration as an adaptation and justice issue, not just a border-management issue.',
      'Avoid narratives that frame displaced people as the problem rather than the upstream stressors.'
    ],
    community: [
      'Strengthen heat, water, housing, and recovery systems in exposed communities before crisis.',
      'Prepare receiving areas with housing, public services, and social support rather than improvising after shocks.',
      'Use relocation and recovery planning that is voluntary, safe, and dignity-preserving.'
    ],
    policy: [
      'Invest in adaptation, social protection, and anticipatory relocation planning.',
      'Protect displaced people through legal, housing, and service frameworks.',
      'Link climate finance to the places most likely to face recurrent displacement pressure.'
    ],
    metrics: [
      'people protected from repeat displacement',
      'housing and service capacity added in receiving areas',
      'time to safe recovery after major shocks'
    ],
    caution: 'The preferred outcome is reducing forced displacement and making mobility safer, not preventing people from moving.'
  },
  resource_depletion: {
    title: 'Resource Depletion Actions',
    definition: 'Resource depletion is a cross-system drawdown problem spanning groundwater, soils, biomass, minerals, fisheries, and ecological recharge limits.',
    whyItMatters: 'The strongest levers are demand reduction, efficiency, circularity, and regeneration in the specific systems under pressure.',
    confidence: 'Medium confidence',
    confidenceNote: 'The direction is robust even though this category remains broad.',
    strongestAction: 'Reduce extraction and improve regeneration.',
    personal: [
      'Choose lower-throughput alternatives for energy, water, and materials where real substitutes exist.',
      'Keep products longer and waste fewer food and household resources.',
      'Treat resource depletion as a systems issue, not a single consumer habit.'
    ],
    community: [
      'Track water, material, and land intensity directly in major operations and procurement.',
      'Prioritize reuse, repair, recycling, and regenerative land and water practices where credible.',
      'Focus on the biggest drawdown hotspots rather than symbolic conservation gestures.'
    ],
    policy: [
      'Set extraction, water, and land-use limits that reflect ecological recharge realities.',
      'Use fees, permits, pricing, or disposal charges where they reduce real overuse and make hidden depletion costs visible.',
      'Use circular-economy policy where it reduces real virgin demand rather than shifting waste around.',
      'Invest in watershed, soil, forest, and fishery recovery as core resilience infrastructure.'
    ],
    metrics: [
      'virgin resource demand reduced',
      'water withdrawals reduced',
      'regeneration or recharge rate improvements'
    ],
    caution: 'Because this category is broad, always tie actions back to the specific stressed system you are targeting.'
  },
  monsoon_volatility: {
    title: 'Monsoon Volatility Actions',
    definition: 'Monsoon volatility is a seasonal instability problem affecting planting calendars, reservoirs, flood control, hydropower reliability, and downstream food systems.',
    whyItMatters: 'The leverage is mostly adaptation and preparedness rather than pretending local action can directly stabilize the monsoon itself.',
    confidence: 'Medium confidence',
    confidenceNote: 'Useful and actionable, but strongly region-specific.',
    strongestAction: 'Adapt timing-sensitive systems to wider seasonal swings.',
    personal: [
      'Treat this mainly as an adaptation category unless you directly manage water, agriculture, or infrastructure systems.',
      'Support local preparedness, flood response, and water storage efforts in exposed regions.',
      'Avoid overclaiming that small household actions directly reduce monsoon instability itself.'
    ],
    community: [
      'Update planting, drainage, reservoir, and flood-management rules for less reliable seasonal timing.',
      'Invest in early warning, storage flexibility, and resilient urban drainage.',
      'Use climate services that help farmers and utilities respond to delayed onset and burst rainfall.'
    ],
    policy: [
      'Scale basin-specific climate services and seasonal forecasting capacity.',
      'Fund water, drainage, and agricultural systems that can handle larger timing swings.',
      'Link adaptation finance to monsoon-dependent food and infrastructure systems.'
    ],
    metrics: [
      'forecast lead time and uptake',
      'flood or crop losses reduced',
      'storage or drainage resilience improved'
    ],
    caution: 'This should stay adaptation-led unless the product adds a tighter basin-specific evidence base.'
  },
  critical_infrastructure_fragility: {
    title: 'Infrastructure Fragility Actions',
    definition: 'Critical infrastructure fragility reflects how power, water, transport, telecom, health, and logistics systems fail under repeated climate and economic stress.',
    whyItMatters: 'The strongest actions reduce cascading failure risk rather than optimizing a single asset in isolation.',
    confidence: 'Medium-high confidence',
    confidenceNote: 'Strong systems logic and good operational levers, though implementation varies by asset class.',
    strongestAction: 'Reduce cascade risk across essential systems.',
    personal: [
      'Support local resilience planning for power, water, communications, and emergency response systems.',
      'Treat infrastructure resilience as a public-good investment, not just a private backup problem.',
      'Prepare household emergency plans, but do not confuse them with system-level resilience.'
    ],
    community: [
      'Harden critical nodes, reduce single points of failure, and improve backup interoperability.',
      'Run joint planning across utilities, telecoms, hospitals, transport, and local government.',
      'Use maintenance and redundancy budgets where they meaningfully reduce outage or recovery risk.'
    ],
    policy: [
      'Require climate-risk planning and resilience standards for essential systems.',
      'Fund modernization where aging assets create repeated cascade risks.',
      'Use outage, recovery, and service-continuity metrics instead of only asset-age proxies.'
    ],
    metrics: [
      'outage duration reduced',
      'critical-service continuity maintained',
      'time to full recovery after shocks'
    ],
    caution: 'The goal is not infinite backup everywhere, but fewer cascading failures across interdependent systems.'
  },
  grid_peak_load_stress: {
    title: 'Peak Load Actions',
    definition: 'Grid peak load stress is driven by simultaneous cooling, heating, electrification, and large industrial or digital loads that push local grids toward congestion and outage risk.',
    whyItMatters: 'This is one of the clearest near-term infrastructure pressure points because heat and large-load growth are landing faster than grid upgrades.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Strong for efficiency, flexibility, storage, and load-shaping levers.',
    strongestAction: 'Reduce and shift peak demand before it becomes new fossil or outage lock-in.',
    personal: [
      'Reduce cooling and appliance peaks where comfort and safety allow.',
      'Use smart controls, shading, and pre-cooling where those tools are available.',
      'Treat peak demand timing as different from total annual energy use.'
    ],
    community: [
      'Deploy controls, storage, and demand response across building and fleet portfolios.',
      'Coordinate large flexible loads to avoid stacking onto the same stress windows.',
      'Use campus, district, and portfolio operations to flatten peaks rather than only reducing annual kWh.'
    ],
    policy: [
      'Expand demand response, storage, and grid modernization alongside electrification.',
      'Require large-load interconnection planning that reflects local congestion and reliability.',
      'Avoid meeting every new peak with fossil fallback when efficiency and flexibility can do better.'
    ],
    metrics: [
      'MW of peak demand reduced or shifted',
      'hours of demand response delivered',
      'peaker use avoided'
    ],
    caution: 'Peak-load relief is often more important than small annual energy reductions in this category.'
  },
  adaptation_capital_shortfall: {
    title: 'Adaptation Finance Actions',
    definition: 'Adaptation capital shortfall is the gap between known resilience needs and the money, institutions, and project pipelines required to fund them.',
    whyItMatters: 'Even strong technical resilience plans fail if financing, governance, and delivery systems lag behind the risk.',
    confidence: 'Medium-high confidence',
    confidenceNote: 'The finance gap is clear even if project effectiveness varies widely.',
    strongestAction: 'Turn resilience needs into fundable, shovel-ready programs.',
    personal: [
      'Support public investment and civic priorities that treat adaptation as core infrastructure.',
      'Treat adaptation finance as prevention, not optional cleanup after disaster.',
      'Back local institutions that can actually deliver resilience projects.'
    ],
    community: [
      'Build project pipelines with clear benefits, delivery plans, and maintenance capacity.',
      'Bundle smaller resilience measures so they become financeable at useful scale.',
      'Track who benefits from adaptation spending, not just how much was announced.'
    ],
    policy: [
      'Increase adaptation finance, especially for frontline communities and high-risk public systems.',
      'Simplify access to resilience funding for local governments and essential-service providers.',
      'Tie climate finance to measurable resilience outcomes, not only capital commitments.'
    ],
    metrics: [
      'adaptation dollars deployed',
      'projects moved from plan to implementation',
      'people or assets protected per dollar invested'
    ],
    caution: 'Announcements are not delivery; pipeline quality and execution matter as much as headline totals.'
  },
  insurance_retreat: {
    title: 'Insurance Retreat Actions',
    definition: 'Insurance retreat happens when repeated climate losses, rising uncertainty, and weak resilience make coverage unaffordable or unavailable.',
    whyItMatters: 'It is one of the clearest signals that risk is already crossing into market uninsurability and forced economic retreat.',
    confidence: 'Medium-high confidence',
    confidenceNote: 'The phenomenon is real and growing, though policy responses vary by market structure.',
    strongestAction: 'Lower physical risk and protect households before the market exits.',
    personal: [
      'Use insurance signals as a warning about physical risk, not just a pricing inconvenience.',
      'Reduce household exposure where real retrofit or relocation options exist.',
      'Treat premium spikes as a systems problem tied to land use and resilience, not only private shopping.'
    ],
    community: [
      'Invest in risk reduction where it can preserve coverage affordability and service continuity.',
      'Protect vulnerable households from disorderly coverage loss and displacement.',
      'Use local land-use and retrofit policy to reduce repeat-loss exposure.'
    ],
    policy: [
      'Reform insurance, disclosure, and resilience policy together rather than in isolation.',
      'Discourage repeat-loss rebuilding where the physical risk keeps worsening.',
      'Fund mitigation and adaptation measures that actually reduce losses, not only subsidize premiums.'
    ],
    metrics: [
      'coverage availability retained',
      'repeat-loss claims reduced',
      'households protected from unaffordable premium escalation'
    ],
    caution: 'Subsidizing premiums without reducing risk can delay, rather than solve, the underlying retreat problem.'
  },
  aviation_shipping: {
    title: 'Aviation + Shipping Actions',
    definition: 'Aviation and shipping combine high-emissions long-distance movement with difficult fuel transitions, making demand management and operational efficiency unusually important.',
    whyItMatters: 'The report is skeptical of overpromising fuels alone and instead emphasizes alternatives to avoidable flights, operational efficiency, and targeted regulation.',
    confidence: 'Medium-high confidence',
    confidenceNote: 'Good evidence on demand and efficiency; more uncertainty around some future fuel pathways.',
    strongestAction: 'Choose alternatives to avoidable flights, improve shipping operations, and treat cleaner fuels as a transition rather than a shortcut.',
    personal: [
      'Choose fewer discretionary flights, especially repeated frequent-flyer patterns.',
      'Substitute remote or rail options where they are real substitutes.',
      'Treat aviation demand as more important than offset language.'
    ],
    community: [
      'Replace business travel with remote participation where it works.',
      'Use travel policies and procurement that reduce high-frequency flying.',
      'Adopt slow steaming and operational efficiency in shipping-heavy institutions and vendors.'
    ],
    policy: [
      'Use frequent-flyer levies, efficiency mandates, and fuel standards where credible.',
      'Support port electrification and ship-efficiency requirements.',
      'Treat sustainable fuels as part of a larger strategy, not a permission slip for unlimited growth.'
    ],
    metrics: [
      'flights avoided or substituted',
      'shipping fuel use per tonne-km',
      'operational efficiency gains'
    ],
    caution: 'The report warns against offsets solving aviation and against fuel narratives outrunning evidence.'
  },
  cement_steel: {
    title: 'Cement + Steel Actions',
    definition: 'Cement and steel are foundational industrial materials whose footprint is shaped by process emissions, fuel use, design choices, and procurement standards.',
    whyItMatters: 'The report ranks low-carbon procurement and material specification among the most powerful institutional and policy actions available.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Especially strong for procurement, clinker reduction, scrap, and material-efficiency levers.',
    strongestAction: 'Specify lower-carbon materials and design for material efficiency.',
    personal: [
      'Favor smaller builds, reuse, and lower-material design where choices exist.',
      'Ask for lower-clinker concrete and recycled-content steel in projects.',
      'Understand that direct leverage is smaller than institutional specification and public procurement.'
    ],
    community: [
      'Require EPDs, embodied-carbon limits, low-clinker mixes, and recycled steel specifications.',
      'Design projects to use less concrete and steel up front.',
      'Use procurement to build real demand for cleaner materials.'
    ],
    policy: [
      'Create green public procurement standards for cement and steel.',
      'Support scrap-based steel, lower-clinker standards, and credible clean-process routes.',
      'Back industrial standards and finance that turn pilot technologies into markets.'
    ],
    metrics: [
      'kgCO2e per cubic meter of concrete',
      'clinker ratio',
      'scrap or recycled steel share'
    ],
    caution: 'The report is clear that offsets are not a substitute for lower-carbon material specification.'
  },
  air_conditioning_refrigerants: {
    title: 'Refrigerants Actions',
    definition: 'Refrigerants are a lifecycle cooling footprint driven by gas choice, leak rates, servicing quality, recovery, reclamation, and end-of-life handling.',
    whyItMatters: 'The report treats refrigerants as one of the clearest technical-action categories because the mechanism is direct and the evidence is mature.',
    confidence: 'High-confidence action surface',
    confidenceNote: 'Strong for leak prevention, recovery, reclamation, and Kigali-style phase-down pathways.',
    strongestAction: 'Prevent leaks and phase down high-GWP gases.',
    personal: [
      'Buy efficient low-GWP cooling equipment at replacement.',
      'Maintain AC and refrigeration systems so they do not leak unnecessarily.',
      'Reduce cooling load with shading, insulation, and passive design.'
    ],
    community: [
      'Run leak detection, technician training, and refrigerant recovery across portfolios.',
      'Track refrigerant handling during service and end-of-life replacement.',
      'Pair cooling upgrades with better maintenance, not just equipment swaps.'
    ],
    policy: [
      'Implement Kigali-aligned phase-down rules and servicing standards.',
      'Mandate refrigerant recovery and reclamation where systems are replaced or retired.',
      'Use cooling efficiency standards and passive-cooling codes to reduce future load.'
    ],
    metrics: [
      'percent refrigerant leakage reduction',
      'refrigerant recovered or reclaimed',
      'GWP-weighted charge reduction'
    ],
    caution: 'The report emphasizes that simply buying newer equipment is not enough if leaks and end-of-life recovery remain weak.'
  }
};

const ACTION_PROFILE_ALIASES = {
  aviation: 'aviation_shipping',
  shipping: 'aviation_shipping',
  aviation_demand_growth: 'aviation_shipping',
  shipping_lane_disruption: 'aviation_shipping',
  cement_concrete: 'cement_steel',
  steel: 'cement_steel',
  road_freight_diesel_lock_in: 'road_freight_logistics',
  telecom_backbone: 'digital_infrastructure',
  mobile_wireless_networks: 'digital_infrastructure',
  internet_exchange_points: 'digital_infrastructure',
  subsea_cables: 'digital_infrastructure'
};

export function getActionProfileById(id) {
  if (!id) return null;
  const resolvedId = ACTION_PROFILE_ALIASES[id] || id;
  return ACTION_PROFILES[resolvedId] || null;
}
