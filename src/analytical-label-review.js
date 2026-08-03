const reviewedAt = '2026-07-18';

function decision(canonicalName, disposition, canonicalClass, rationale, sourceLocators) {
  return Object.freeze({
    canonical_name: canonicalName,
    disposition,
    canonical_class: canonicalClass,
    rationale,
    source_locators: Object.freeze(sourceLocators.map(item => Object.freeze(item))),
    reviewed_at: reviewedAt
  });
}

export const ANALYTICAL_LABEL_REVIEW = Object.freeze({
  marine_heatwaves: decision('Marine Heatwaves', 'canonical_term_confirmed', 'phenomenon', 'Marine heatwave is an established event term with duration and threshold-based definitions.', [
    { url: 'https://www.ipcc.ch/srocc/chapter/chapter-5/', locator: 'IPCC SROCC Chapter 5 assessment of marine heatwaves' },
    { url: 'https://www.noaa.gov/education/resource-collections/ocean-coasts/ocean-heat', locator: 'NOAA ocean heat and marine heatwave context' }
  ]),
  sea_level_rise: decision('Sea-Level Rise', 'canonical_term_confirmed', 'phenomenon', 'Sea-level rise is a canonical physical climate term; the hyphenated compound is used for display consistency.', [
    { url: 'https://sealevel.nasa.gov/', locator: 'NASA Sea Level Change science and observations' },
    { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/', locator: 'IPCC AR6 WGI Chapter 9 sea-level change assessment' }
  ]),
  humanitarian_resource_gaps: decision('Humanitarian Response Capacity Gap', 'normalized_operational_term', 'operational_indicator', 'The original label mixed funding, personnel, logistics, and access. Capacity gap keeps the construct operational and explicitly multidimensional.', [
    { url: 'https://humanitarianaction.info/', locator: 'UN OCHA humanitarian needs and response planning' },
    { url: 'https://www.undrr.org/', locator: 'UNDRR response capacity and disaster-risk governance context' }
  ]),
  hydrological_runoff_surges: decision('Rapid Runoff Response', 'normalized_operational_term', 'operational_indicator', 'The revised term describes a measurable hydrograph response without implying that all runoff increases share one causal mechanism.', [
    { url: 'https://www.usgs.gov/mission-areas/water-resources', locator: 'USGS streamflow and watershed response observations' },
    { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/', locator: 'IPCC water-cycle extremes and runoff assessment' }
  ]),
  floodplain_exposure: decision('Population and Asset Exposure in Floodplains', 'normalized_operational_term', 'operational_indicator', 'Exposure is a measurable property of people and assets within a mapped hazard footprint, not a freestanding hazard.', [
    { url: 'https://www.wri.org/aqueduct', locator: 'Aqueduct flood-risk exposure indicators' },
    { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/', locator: 'IPCC cities, settlements, infrastructure, and flood exposure' }
  ]),
  emergency_response_overload: decision('Emergency Response Capacity Exceedance', 'normalized_operational_term', 'operational_indicator', 'Capacity exceedance is a bounded comparison between incident demand and available response resources.', [
    { url: 'https://www.who.int/emergencies', locator: 'WHO emergency preparedness and response capacity' },
    { url: 'https://www.undrr.org/', locator: 'UNDRR disaster preparedness and response capacity' }
  ]),
  coastal_erosion: decision('Coastal Erosion', 'canonical_term_confirmed', 'phenomenon', 'Coastal erosion is an established geomorphic process term.', [
    { url: 'https://www.usgs.gov/programs/cmhrp/science/coastal-change-hazards', locator: 'USGS Coastal Change Hazards science' },
    { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp2/', locator: 'IPCC coastal erosion and sea-level risk assessment' }
  ]),
  managed_retreat_pressure: decision('Managed-Retreat Decision Pressure', 'retained_analytical_concept', 'analytical_concept', 'No single canonical observable captures the combined social, fiscal, and hazard pressure to consider retreat. The label is retained with an explicit analytical disclosure.', [
    { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp2/', locator: 'IPCC managed retreat and planned relocation pathways' },
    { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-17/', locator: 'IPCC adaptation decision-making options' }
  ]),
  arctic_amplification_rates: decision('Arctic Amplification', 'canonical_term_normalized', 'phenomenon', 'Rate was removed because amplification is the phenomenon; rates or ratios belong in the metric contract.', [
    { url: 'https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-10/', locator: 'IPCC regional climate change and Arctic amplification' },
    { url: 'https://www.noaa.gov/education/resource-collections/climate/climate-change-impacts', locator: 'NOAA Arctic warming context' }
  ]),
  asphalt_pavement_heat_absorbers: decision('Asphalt Surface Heat Storage', 'normalized_operational_term', 'operational_indicator', 'The original agent noun sounded synthetic. Surface heat storage is measurable through temperature, albedo, and heat flux.', [
    { url: 'https://www.epa.gov/heatislands/using-cool-pavements-reduce-heat-islands', locator: 'EPA pavement thermal and albedo mechanisms' },
    { url: 'https://www.epa.gov/heatislands', locator: 'EPA urban heat-island measurement and mitigation' }
  ]),
  heatwave_excess_mortality_rates: decision('Heat-Attributable Excess Mortality', 'normalized_operational_term', 'operational_indicator', 'Mortality rate is a metric; the node represents the attributable health burden estimated against an expected baseline.', [
    { url: 'https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health', locator: 'WHO heat-related morbidity and mortality' },
    { url: 'https://www.who.int/europe/publications/i/item/9789289062930', locator: 'WHO heat-health action plan surveillance and evaluation' }
  ]),
  ambient_air_quality_deficit: decision('Ambient Air-Quality Standard Exceedance', 'normalized_operational_term', 'operational_indicator', 'Deficit was ambiguous. Exceedance can be evaluated pollutant-by-pollutant against a named guideline or legal standard.', [
    { url: 'https://www.who.int/publications/i/item/9789240034228', locator: 'WHO global air-quality guidelines' },
    { url: 'https://www.who.int/data/gho/data/themes/air-pollution', locator: 'WHO ambient air-pollution observations' }
  ]),
  early_warning_coverage_gaps: decision('Early-Warning Coverage Gap', 'normalized_operational_term', 'operational_indicator', 'The singular construct measures the gap between at-risk populations and effective end-to-end warning coverage.', [
    { url: 'https://wmo.int/activities/early-warnings-all', locator: 'WMO Early Warnings for All coverage framework' },
    { url: 'https://www.undrr.org/early-warning-for-all', locator: 'UNDRR end-to-end multi-hazard early-warning framework' }
  ]),
  coastal_saltwater_intrusion: decision('Coastal Saltwater Intrusion', 'canonical_term_confirmed', 'phenomenon', 'Saltwater intrusion is an established coastal-groundwater process term.', [
    { url: 'https://www.usgs.gov/mission-areas/water-resources/science/saltwater-intrusion', locator: 'USGS saltwater intrusion science' },
    { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp2/', locator: 'IPCC coastal groundwater and salinization risk' }
  ]),
  riverine_habitat_fragmentation: decision('River Network Fragmentation', 'canonical_term_normalized', 'phenomenon', 'River network fragmentation is the broader canonical construct; habitat and connectivity effects remain in edge mechanisms and indicators.', [
    { url: 'https://www.usgs.gov/publications/fish-guidance-and-passage-barriers', locator: 'USGS barrier, passage, and aquatic connectivity evidence' },
    { url: 'https://www.nature.com/articles/s41586-019-1111-9', locator: 'Global river connectivity and fragmentation assessment' }
  ]),
  compound_coastal_flooding: decision('Compound Coastal Flooding', 'canonical_term_confirmed', 'phenomenon', 'Compound coastal flooding is an established term for interacting coastal, fluvial, pluvial, and surge drivers.', [
    { url: 'https://oceanservice.noaa.gov/facts/nuisance-flooding.html', locator: 'NOAA coastal flooding context' },
    { url: 'https://www.ipcc.ch/report/ar6/wg2/chapter/ccp2/', locator: 'IPCC compound coastal risk assessment' }
  ])
});

export function applyAnalyticalLabelReview(nodes) {
  return nodes.map(node => {
    const review = ANALYTICAL_LABEL_REVIEW[node.id];
    if (!review) return node;
    const exact = review.disposition.startsWith('canonical_term');
    return {
      ...node,
      name: review.canonical_name,
      authenticity: {
        ...(node.authenticity || {}),
        status: exact ? 'reviewed_phenomenon' : review.disposition === 'retained_analytical_concept' ? 'source_backed_concept_label' : 'source_backed_operational_concept',
        label: exact ? 'Canonical term verified' : review.disposition === 'retained_analytical_concept' ? 'Reviewed analytical concept' : 'Reviewed operational term',
        exact_label_validated: exact,
        source_scope: 'label_specific_review',
        note: review.rationale
      },
      terminology_review: review,
      graph_contract: {
        ...(node.graph_contract || {}),
        label_status: review.disposition === 'retained_analytical_concept' ? 'retain_as_analytical_concept' : review.disposition,
        reviewed_node_class: review.canonical_class
      }
    };
  });
}
