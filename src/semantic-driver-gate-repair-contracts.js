const SOURCES = Object.freeze({
  species_range: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/',
    'https://www.ipcc.ch/report/ar6/wg1/figures/chapter-2/figure-2-31'
  ],
  fertilizer_gas: [
    'https://www.iea.org/reports/gas-market-report-q2-2022/executive-summary',
    'https://www.worldbank.org/en/news/press-release/2022/04/26/food-and-energy-price-shocks-from-ukraine-war'
  ],
  stratification_productivity: [
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/',
    'https://www.gfdl.noaa.gov/research_highlight/reconciling-ocean-productivity-and-fisheries-yields/'
  ],
  marine_heatwave_productivity: [
    'https://www.nature.com/articles/s43247-024-01805-w',
    'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-3/'
  ],
  insurance_retreat: [
    'https://www.naturalhazards.govt.nz/resilience-and-research/research/search-all-research-reports/managed-retreat-private-insurance-retreat-public-insurance-and-the-connections-between-them/',
    'https://www.gao.gov/products/gao-20-488'
  ],
  floodplain_relocation: [
    'https://www.fema.gov/sites/default/files/documents/fema_mit-FY2023_BRIC_Mitigation_Action_Portfolio.pdf',
    'https://www.gao.gov/products/gao-20-488'
  ],
  wildfire_black_carbon: [
    'https://nepis.epa.gov/Exe/ZyPURL.cgi?Dockey=P100EIUR.TXT',
    'https://ntrs.nasa.gov/citations/20240016219'
  ],
  pesticide_pollinator: [
    'https://www.epa.gov/pollinator-protection/policy-mitigating-acute-risk-bees-pesticide-products',
    'https://www.epa.gov/pollinator-protection/tools-and-strategies-pollinator-protection'
  ]
});

function edge({ source, target, family, verb, adverb, level = 'indirect', mechanism, geography, time, moderators, alternatives, counterevidence, locators }) {
  const sourceUrls = SOURCES[family];
  const indicator = {
    metric_id: `semantic_gate_${source}_${target}`,
    metric_name: `Bounded ${source} to ${target} relationship observation`,
    unit: 'source-defined endpoint measurements with a declared contrast and interval',
    geography,
    cadence: 'updated when either relationship source or endpoint dataset changes',
    source_id: family,
    transformation: 'Preserve endpoint definitions, source direction, geography, period, and uncertainty; never substitute graph influence for an effect size.',
    uncertainty: 'Local attribution and magnitude remain conditional on the listed moderators and alternatives.',
    threshold_provenance: 'No universal threshold; retain only source-defined thresholds.',
    failure_behavior: 'Do not estimate or promote a magnitude when the bounded source observation is unavailable.'
  };
  const sourceLocators = sourceUrls.map((url, index) => ({
    url,
    locator: locators[index],
    source_type: index === 0 ? 'primary_or_authoritative_mechanism' : 'independent_corroboration'
  }));
  return {
    source,
    target,
    verb,
    adverb,
    influence: level === 'direct' ? 0.55 : 0.43,
    topology_rule: 'semantic_driver_gate_repair',
    evidence: {
      source_status: 'curated_edge_reference',
      evidence_mode: 'curated_edge_reference',
      relationship_level: level,
      relationship_type: 'bounded_semantic_driver_pathway',
      confidence: 'moderate',
      source_urls: sourceUrls,
      relationship_source_urls: sourceUrls,
      mechanism,
      geographic_scope: geography,
      temporal_scope: time,
      notes: 'Added only after semantic node-class triage showed that a real causal-driver relationship, rather than a class exemption, was required.',
      source_readback: {
        status: 'confirmed_bounded',
        reviewed_at: '2026-07-19',
        reviewer: 'semantic_driver_gate_repair',
        family,
        exact_claim: `${verb} ${adverb}`,
        source_locators: sourceLocators,
        geographic_temporal_scope: `${geography} ${time}`,
        moderators_and_counterevidence: `${moderators.join('; ')}. ${counterevidence}`,
        qualification: 'The cited sources support this bounded mechanism; they do not establish a universal local magnitude or single-cause attribution.'
      },
      dossier: {
        version: 'semantic_driver_gate_repair_v1',
        promotion_status: 'promoted',
        reviewed_at: '2026-07-19',
        source,
        target,
        mechanism,
        geographic_scope: geography,
        temporal_scope: time,
        moderators,
        alternative_explanations: alternatives,
        confidence: 'medium',
        counterevidence,
        indicator,
        source_locators: sourceLocators,
        evidence_basis: level
      }
    }
  };
}

export const SEMANTIC_DRIVER_GATE_REPAIR_RELATIONSHIPS = Object.freeze([
  edge({
    source: 'temp', target: 'species_range_compression', family: 'species_range', verb: 'can contract range margins',
    adverb: 'where warming exceeds local thermal tolerance and dispersal or habitat availability cannot offset losses', level: 'direct',
    mechanism: 'Warming can reduce performance and persistence at warm range margins; when colonization at cooler margins cannot compensate, the occupied range contracts.',
    geography: 'Named terrestrial or marine population with observed range boundaries, thermal exposure, habitat availability, and detection effort.',
    time: 'Multi-year to multi-decadal observations or projections; short weather anomalies alone do not establish contraction.',
    moderators: ['species thermal tolerance', 'dispersal capacity', 'habitat connectivity', 'microclimate refugia', 'biotic interactions', 'survey effort'],
    alternatives: ['land-use change', 'harvest', 'invasive species', 'disease', 'observation bias'],
    counterevidence: 'Many species shift or expand rather than contract, and IPCC finds heterogeneous direction and magnitude across taxa and regions.',
    locators: ['IPCC AR6 WGII Chapter 2 documents observed and projected climate-related range change, including contractions and local extirpations with taxonomic and regional heterogeneity.', 'IPCC AR6 WGI Figure 2.31 provides the observation boundary and shows that marine biological trends are spatially variable rather than uniformly declining.']
  }),
  edge({
    source: 'gas_power_dependence', target: 'fertilizer_price_shock', family: 'fertilizer_gas', verb: 'can transmit gas-price shocks into',
    adverb: 'where nitrogen fertilizer production is gas-based and supply cannot substitute quickly',
    mechanism: 'Natural gas is both a feedstock and a major operating cost for ammonia and urea production, so sharp gas-price increases can curtail output and raise nitrogen-fertilizer prices.',
    geography: 'Gas-based ammonia and nitrogen-fertilizer markets with named production regions and trade exposure.',
    time: 'Monthly commodity-price and plant-operation changes through crop-season purchasing decisions.',
    moderators: ['feedstock route', 'gas contracts', 'plant utilization', 'trade restrictions', 'inventories', 'subsidies', 'exchange rates'],
    alternatives: ['potash or phosphate supply shocks', 'export restrictions', 'shipping disruption', 'crop-price-driven demand', 'currency depreciation'],
    counterevidence: 'Coal-based ammonia, long-term gas contracts, inventories, and trade substitution can weaken or reverse the short-run local relationship.',
    locators: ['IEA Gas Market Report Q2-2022 states that natural gas supplies about 70% of global ammonia production and documents price-sensitive gas demand.', 'World Bank Commodity Markets Outlook reporting explicitly links high natural-gas prices to fertilizer-price increases while also identifying war and trade disruptions.']
  }),
  edge({
    source: 'thermal_stratification_intensification', target: 'phytoplankton_decline', family: 'stratification_productivity', verb: 'can suppress',
    adverb: 'in nutrient-limited low- and mid-latitude waters where stronger layering reduces vertical nutrient supply',
    mechanism: 'Stronger upper-ocean stratification can isolate sunlit surface waters from deeper nutrient inventories, reducing nutrient supply and phytoplankton productivity in nutrient-limited regions.',
    geography: 'Named ocean region with mixed-layer structure, nutrient profiles, chlorophyll or primary-production measurements, and declared depth range.',
    time: 'Seasonal to multi-decadal stratification and productivity changes; bloom timing and long-term trend remain separate.',
    moderators: ['latitude', 'light limitation', 'upwelling', 'wind mixing', 'nutrient inventory', 'community composition', 'river inputs'],
    alternatives: ['grazing pressure', 'iron limitation', 'cloud and light change', 'circulation shifts', 'satellite algorithm drift'],
    counterevidence: 'Stratification can enhance light exposure and productivity in light-limited high latitudes, so a universal global decline is not supported.',
    locators: ['IPCC AR6 WGII Chapter 3 assesses stronger stratification, reduced surface nitrate, and regionally variable primary production with explicit confidence bounds.', 'NOAA GFDL explains the nutrient-separation mechanism and explicitly notes that high-latitude light limitation can produce the opposite response.']
  }),
  edge({
    source: 'marine_heatwaves', target: 'phytoplankton_decline', family: 'marine_heatwave_productivity', verb: 'can reduce biomass and shift communities toward smaller cells',
    adverb: 'during bounded eastern-boundary upwelling-system events with weakened nutrient supply',
    mechanism: 'Marine heatwaves can coincide with wind and upwelling anomalies that reduce nutrient delivery, lowering phytoplankton biomass and changing size structure.',
    geography: 'Eastern-boundary upwelling systems and other named marine-heatwave regions with matched satellite or in-situ biomass and circulation observations.',
    time: 'Event duration of weeks to months, assessed against a declared climatology; not a global secular trend.',
    moderators: ['heatwave intensity', 'event duration', 'upwelling winds', 'nutrient supply', 'season', 'community baseline'],
    alternatives: ['El Nino circulation', 'cloud contamination', 'grazing', 'river nutrients', 'ordinary seasonal succession'],
    counterevidence: 'Some warm anomalies increase chlorophyll or reorganize communities without lowering total biomass; the reported effect is region- and event-specific.',
    locators: ['The 2024 primary study reports about 50% lower biomass and smaller community structure during marine heatwaves in eastern-boundary upwelling systems, tied to weakened nutrient supply.', 'IPCC AR6 WGII Chapter 3 assesses marine heatwaves and primary-production change as spatially heterogeneous and conditioned by multiple drivers.']
  }),
  edge({
    source: 'insurance_retreat', target: 'managed_retreat_pressure', family: 'insurance_retreat', verb: 'can intensify',
    adverb: 'when loss of affordable coverage changes financing, property value, or relocation feasibility in hazard-prone places',
    mechanism: 'Private insurance withdrawal or unaffordable coverage can make continued occupancy and mortgage finance harder, while public insurance design can either support or delay relocation decisions.',
    geography: 'Named hazard-exposed housing market or community with insurance availability, premiums, property finance, and relocation policy observed together.',
    time: 'Policy-renewal and housing-market intervals through multi-year adaptation planning.',
    moderators: ['public insurance backstop', 'mortgage status', 'household wealth', 'buyout funding', 'tenant status', 'risk disclosure'],
    alternatives: ['direct disaster damage', 'property-tax change', 'employment migration', 'zoning', 'amenity demand'],
    counterevidence: 'Insurance withdrawal can trap households by reducing property value and liquidity rather than enabling retreat; public coverage can also sustain occupancy.',
    locators: ['New Zealand Natural Hazards Commission research directly examines how private and public insurance retreat can support or complicate managed retreat and relocation finance.', 'GAO-20-488 assesses climate migration and relocation as a resilience tool while documenting governance and equity constraints.']
  }),
  edge({
    source: 'floodplain_exposure', target: 'managed_retreat_pressure', family: 'floodplain_relocation', verb: 'can increase',
    adverb: 'after repeated or severe losses where voluntary acquisition and relocation programs are available',
    mechanism: 'Repeated flood exposure and damage can make acquisition, demolition, or relocation a preferred risk-reduction option for households and public agencies.',
    geography: 'Named floodplain community with mapped exposure, damage history, voluntary participation, and funded relocation program.',
    time: 'Post-disaster decisions through multi-year buyout and relocation implementation.',
    moderators: ['damage severity', 'repeat-loss history', 'buyout timing', 'offer value', 'community ties', 'replacement housing', 'local fiscal capacity'],
    alternatives: ['structural flood protection', 'elevation', 'rebuilding assistance', 'unrelated housing-market change'],
    counterevidence: 'Exposure alone does not cause retreat; many residents rebuild, cannot access buyouts, or reject offers because of delay, valuation, or community ties.',
    locators: ['FEMA mitigation portfolio documents voluntary floodplain relocation and buyout programs for repeatedly exposed structures.', 'GAO-20-488 concludes that retreat or relocation can become unavoidable under higher climate projections but identifies major program-design and equity constraints.']
  }),
  edge({
    source: 'wildfire_regime_shift', target: 'particulate_soot_levels', family: 'wildfire_black_carbon', verb: 'can elevate',
    adverb: 'within smoke plumes where combustion phase, fuel, and atmospheric processing are measured', level: 'direct',
    mechanism: 'Incomplete biomass combustion emits black carbon and other light-absorbing fine particles; more or larger smoke-producing fires increase the opportunity for elevated downwind soot concentration.',
    geography: 'Named wildfire plume and downwind airshed with fire attribution, black-carbon or absorption measurements, and transport analysis.',
    time: 'Hourly plume evolution through seasonal fire-regime observations; deposition and concentration are kept separate.',
    moderators: ['fuel type', 'combustion phase', 'fire intensity', 'plume height', 'wind', 'precipitation scavenging', 'chemical aging'],
    alternatives: ['diesel combustion', 'residential biomass burning', 'industrial combustion', 'agricultural fire', 'source-apportionment error'],
    counterevidence: 'Black-carbon fraction varies strongly by fuel and combustion conditions, and wildfire smoke can be dominated by organic rather than black carbon.',
    locators: ['EPA Report to Congress identifies black carbon as fine particulate matter formed by incomplete fossil-fuel, biofuel, and biomass combustion.', 'NASA primary satellite analysis retrieves black- and brown-carbon mass in wildfire and agricultural-burning smoke and reports strong geographic and combustion-type variation.']
  }),
  edge({
    source: 'pesticide_spray_drift_zones', target: 'pollinator_colony_collapse', family: 'pesticide_pollinator', verb: 'can increase colony stress and loss risk',
    adverb: 'when bee-toxic spray or dust reaches foraging bees, attractive plants, or colonies during a susceptible exposure window', level: 'direct',
    mechanism: 'Off-target pesticide spray or dust can expose adult bees and brood through direct contact, contaminated forage, and residues returned to colonies.',
    geography: 'Named application area and nearby pollinator habitat with product, rate, timing, drift conditions, residue or exposure observations, and colony outcome.',
    time: 'Application and residue-toxicity interval through seasonal colony assessment; acute exposure is not equated with annual colony loss.',
    moderators: ['active ingredient', 'toxicity and persistence', 'application timing', 'wind and droplet size', 'distance', 'foraging activity', 'colony health'],
    alternatives: ['Varroa mites', 'pathogens', 'nutrition', 'queen failure', 'heat and drought', 'other pesticide routes'],
    counterevidence: 'Drift exposure does not establish colony collapse by itself; compliant timing, buffers, low-toxicity products, and healthy colonies can prevent or limit harm.',
    locators: ['EPA policy explicitly addresses acute bee risk from agricultural pesticide spray and dust applications and exposure at and beyond the application site.', 'EPA pollinator-protection guidance lists spray-drift controls and explains that pollinator risk depends on product, exposure, application method, and mitigation.']
  })
]);

export const SEMANTIC_DRIVER_GATE_REJECTED_EDGE_KEYS = new Set([
  // Planned relocation is the response to decision pressure in this ontology;
  // keeping the reverse arrow created an unsupported two-node causal loop.
  'planned_relocation->managed_retreat_pressure'
]);
