// Domain combination policies, not scientific exchange rates. These consume
// already mapped component readings; they never derive harm or admit a node.
export const DOMAIN_COMBINATION_EXPERIMENT_VERSION = 'tulip_domain_combination_2026_09_27_v1_experimental';
export const DOMAIN_COMBINATION_POLICIES = Object.freeze({
  fixed_average: 'A blended 50/50 index. High harm in one domain can be offset by verified low harm in the other.',
  worse_domain: 'The greater domain impact determines the reading. Less severe additional harm is not reflected until it exceeds that impact.',
  bounded_accumulation: 'A symmetric policy index accumulates mapped impacts without exceeding 10. This is not a probability, empirical overlap estimate or physical burden sum.',
});

export function combineMappedDomainCandidate({ human, ecosystem, policyId }) {
  const valid = value => typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 10;
  if (!Object.hasOwn(DOMAIN_COMBINATION_POLICIES, policyId) || !valid(human) || !valid(ecosystem)) {
    return { status: 'needs_both_mapped_domains', experimentalValue: null, value: null, publicReady: false };
  }
  let unrounded;
  if (policyId === 'fixed_average') unrounded = (human + ecosystem) / 2;
  else if (policyId === 'worse_domain') unrounded = Math.max(human, ecosystem);
  else {
    const h = (human - 1) / 9, n = (ecosystem - 1) / 9;
    unrounded = 1 + 9 * (h + n - h * n);
  }
  return { status: 'experimental_policy_comparison', methodVersion: DOMAIN_COMBINATION_EXPERIMENT_VERSION,
    policyId, unrounded, experimentalValue: Math.round((unrounded + 1e-9) * 10) / 10,
    value: null, publicReady: false, meaning: DOMAIN_COMBINATION_POLICIES[policyId] };
}
