// Research queue only: these concepts are not live graph nodes until each has a
// metric contract, relationship-specific dossiers, and overlap review.
export const HUMANITARIAN_EXPANSION_DOCKET = Object.freeze([
  {
    id: 'humanitarian_response_funding_shortfall',
    proposed_name: 'Humanitarian Response Funding Shortfall',
    proposed_class: 'operational_indicator',
    target: 'humanitarian_resource_gaps',
    mechanism: 'Appeals that remain unfunded force reduction, delay, or termination of life-saving response activities.',
    sources: [
      'https://www.unhcr.org/about-unhcr/planning-funding-and-results/underfunding',
      'https://www.un.org/en/global-issues/crisis-and-emergency-response'
    ],
    metric_candidate: 'appeal_requirement_minus_funding_by_operation',
    scope: 'Named humanitarian operation and appeal cycle only.',
    status: 'research_ready_not_promoted'
  },
  {
    id: 'humanitarian_access_constraints',
    proposed_name: 'Humanitarian Access Constraints',
    proposed_class: 'phenomenon',
    target: 'humanitarian_resource_gaps',
    mechanism: 'Conflict, bureaucratic restrictions, and attacks on personnel can prevent aid from reaching crisis-affected communities.',
    sources: [
      'https://knowledge.base.unocha.org/wiki/spaces/imtoolbox/pages/1410072577/Humanitarian%2BAccess',
      'https://www.un.org/en/global-issues/crisis-and-emergency-response'
    ],
    metric_candidate: 'documented_access_constraints_and_affected_population',
    scope: 'Access-constrained emergency where OCHA monitoring is active.',
    status: 'research_ready_not_promoted'
  },
  {
    id: 'humanitarian_surge_demand',
    proposed_name: 'Humanitarian Surge Demand',
    proposed_class: 'phenomenon',
    target: 'humanitarian_resource_gaps',
    mechanism: 'Concurrent disasters, displacement, and conflict can raise the number of people requiring time-sensitive assistance faster than response capacity expands.',
    sources: [
      'https://www.un.org/en/annualreport/2025/humanitarian-assistance',
      'https://www.unhcr.org/publications/underfunded-report-2024'
    ],
    metric_candidate: 'people_in_need_and_response_capacity_gap',
    scope: 'Named crisis or multi-crisis portfolio with comparable needs estimates.',
    status: 'research_ready_not_promoted'
  }
]);
