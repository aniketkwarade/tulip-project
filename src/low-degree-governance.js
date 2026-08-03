export const LOW_DEGREE_POLICY = Object.freeze({
  version: 'research_track_governance_v1',
  default_exploration_degree_floor: 3,
  policy: 'Low degree is a triage signal, not permission to invent relationships. Generated low-degree concepts remain in the research registry but are excluded from default causal exploration until independently rehabilitated.'
});

export const CONTRACT_DEPENDENCY_RESEARCH_IDS = new Set([
  'staple_food_price_volatility', 'invasive_species_encroachment', 'ice_albedo_feedback_loops',
  'sea_ice_extent_deficits', 'palm_oil_canopy_clearance',
  'estuary_eutrophication', 'nitrogen_oxide_saturation', 'blue_carbon_habitat_loss'
]);

export function classifyLowDegreeGovernance(node, totalDegree) {
  const nodeClass = node.graph_contract?.node_class;
  const role = node.calibration?.role;
  const lowDegree = totalDegree < LOW_DEGREE_POLICY.default_exploration_degree_floor;
  const labelStatus = node.authenticity?.status === 'source_backed_concept_label'
    ? 'retain_as_analytical_concept'
    : node.authenticity?.status === 'source_backed_operational_concept'
      ? 'operational_concept_disclosed'
      : 'canonical_or_normalized';
  if (!lowDegree) return { publication_status: 'live', visibility: 'default_exploration', triage_action: 'retain', label_status: labelStatus };
  if (nodeClass === 'authored_root_driver') return { publication_status: 'live_exempt_root_driver', visibility: 'default_exploration', triage_action: 'authored_root_driver_exemption', label_status: labelStatus };
  if (nodeClass === 'operational_indicator') return { publication_status: 'live_exempt_operational_indicator', visibility: 'default_exploration', triage_action: 'operational_indicator_exemption', label_status: labelStatus };
  if (role === 'anchor') return { publication_status: 'priority_repair', visibility: 'hidden_from_default_exploration', triage_action: 'repair_or_merge_before_expansion', label_status: labelStatus };
  if (role === 'generated') return {
    publication_status: 'research_track', visibility: 'hidden_from_default_exploration',
    triage_action: CONTRACT_DEPENDENCY_RESEARCH_IDS.has(node.id) ? 'research_contract_dependency' : 'research_track_or_merge',
    label_status: labelStatus
  };
  return { publication_status: 'research_track', visibility: 'hidden_from_default_exploration', triage_action: 'manual_triage_required', label_status: labelStatus };
}

export function buildSearchAliases(node) {
  return [...new Set([node.name, String(node.id || '').replaceAll('_', ' ').trim()].filter(Boolean))];
}
