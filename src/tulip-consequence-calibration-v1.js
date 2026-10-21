import authoredPolicy from './tulip-consequence-policy-v1.json' with { type: 'json' };
import combination from './tulip-domain-combination-decision.json' with { type: 'json' };
import { fixedBenchmarkPolicyKey } from './tulip-benchmark-score-experiment.js';
import { mapFixedBenchmarkMagnitude, roundBenchmarkDisplay,
  validateFixedBenchmarkPoints } from './tulip-fixed-benchmark-map.js';

const text = x => typeof x === 'string' && x.trim().length > 0;
const finite = x => typeof x === 'number' && Number.isFinite(x);
const nonnegative = x => finite(x) && x >= 0;
const classes = Object.freeze(['physical', 'chemical', 'composition', 'structure', 'function', 'connectivity']);
const freeze = x => {
  if (x && typeof x === 'object') { Object.values(x).forEach(freeze); Object.freeze(x); }
  return x;
};
const policy = freeze(structuredClone(authoredPolicy));
export const CONSEQUENCE_CALIBRATION_VERSION = policy.version;
export const CONSEQUENCE_CALIBRATION_POLICY_KEY = fixedBenchmarkPolicyKey(policy);
if (policy.combinationDecisionVersion !== combination.version
  || fixedBenchmarkPolicyKey(policy.weights) !== fixedBenchmarkPolicyKey(combination.weights)
  || validateFixedBenchmarkPoints(policy.human.points).length
  || validateFixedBenchmarkPoints(policy.ecosystem.points).length) throw new Error('fixed_consequence_policy_invalid');

export const describeConsequenceCalibrationPolicy = () => structuredClone(policy);

// Registry transcription/source review is a separate responsibility. A
// successful experiment below neither establishes causal validity nor admits
// a public rating. Node packets select fixed records; they cannot enter values.
export function createConsequenceCalibrationExperiment({ observations = {}, profiles = {},
  partitions = {}, counterfactuals = {} } = {}) {
  const registry = freeze(structuredClone({ observations, profiles, partitions, counterfactuals }));
  const own = (table, id) => text(id) && Object.hasOwn(table, id) ? table[id] : null;
  const reference = id => {
    const row = own(registry.observations, id);
    if (!row) throw new Error('unregistered_observation');
    return { id, sourceVersion: row.sourceVersion, artifactSha256: row.artifactSha256,
      definitionKey: fixedBenchmarkPolicyKey(row) };
  };
  const resolve = (ref, packet, errors) => {
    const row = own(registry.observations, ref?.id);
    if (!row) { errors.push('registered_observation_required'); return null; }
    if (ref.sourceVersion !== row.sourceVersion || ref.artifactSha256 !== row.artifactSha256
      || ref.definitionKey !== fixedBenchmarkPolicyKey(row)) errors.push('observation_binding_changed');
    if (Object.keys(ref).some(k => !['id', 'sourceVersion', 'artifactSha256', 'definitionKey'].includes(k))) {
      errors.push('observation_reference_override_forbidden');
    }
    if (!/^https:\/\//.test(row.sourceUrl ?? '') || !text(row.locator)
      || !/^[a-f0-9]{64}$/.test(row.artifactSha256 ?? '') || !text(row.sourceVersion)) {
      errors.push('observation_provenance_required');
    }
    if (!row.nodeIds?.includes(packet.nodeId)) errors.push('node_outcome_binding_mismatch');
    for (const field of ['geography', 'assessmentPeriod', 'counterfactualId']) {
      if (row[field] !== packet[field]) errors.push(`${field}_scope_mismatch`);
    }
    if (row.quantityRole !== 'current_attributable_consequence') errors.push('exposure_or_context_not_consequence');
    const cf = own(registry.counterfactuals, row.counterfactualId);
    if (!cf || !text(cf.definition) || !text(cf.version)
      || !/^[a-f0-9]{64}$/.test(cf.artifactSha256 ?? '') || cf.version !== row.counterfactualVersion
      || cf.artifactSha256 !== row.counterfactualArtifactSha256
      || fixedBenchmarkPolicyKey(cf) !== row.counterfactualDefinitionKey
      || !cf.observationIds?.includes(ref.id)) errors.push('registered_counterfactual_binding_required');
    return row;
  };
  const scopeErrors = packet => {
    const errors = [];
    if (packet?.policyVersion !== policy.version || packet?.policyKey !== CONSEQUENCE_CALIBRATION_POLICY_KEY) errors.push('fixed_policy_binding_required');
    if (!text(packet?.nodeId) || !['issue', 'response'].includes(packet?.nodeKind)) errors.push('node_identity_required');
    if (packet?.nodeKind !== 'response') {
      for (const field of ['geography', 'assessmentPeriod', 'counterfactualId']) if (!text(packet?.[field])) errors.push(`${field}_required`);
      if (!/^\d{4}$/.test(packet?.assessmentPeriod ?? '')) errors.push('reporting_year_required');
    }
    if (Object.keys(packet ?? {}).some(k => !['policyVersion', 'policyKey', 'nodeId', 'nodeKind',
      'geography', 'assessmentPeriod', 'counterfactualId', 'human', 'ecosystem'].includes(k))) errors.push('packet_override_forbidden');
    return errors;
  };
  const empty = (status, reasons = []) => ({ status, reasons: [...new Set(reasons)],
    methodVersion: policy.version, experimentalValue: null, value: null, publicReady: false,
    scientificCalibrationApproved: false });
  const caseKeys = (rows, errors) => {
    const keys = rows.map(row => Object.keys(row?.cases ?? {}).sort());
    if (!keys.length || keys.some(k => !k.includes('central')
      || k.some(x => !['central', 'lower', 'upper'].includes(x)))) errors.push('named_cases_required');
    const first = JSON.stringify(keys[0]);
    if (keys.some(k => JSON.stringify(k) !== first)) errors.push('incomplete_joint_cases');
    if (keys.some(k => k.length !== 1 && k.length !== 3)) errors.push('partial_bounds_forbidden');
    if (rows.some(row => !text(row?.caseSetId) || row.caseSetId !== rows[0]?.caseSetId)) errors.push('matched_joint_case_set_required');
    return keys[0] ?? [];
  };
  const mapComponent = (domain, values, caseSetId, errors) => {
    if (Object.values(values).some(x => !nonnegative(x))) errors.push('consequence_total_invalid');
    if ('lower' in values && !(values.lower <= values.central && values.central <= values.upper)) errors.push('aggregate_joint_cases_out_of_order');
    if (errors.length) return null;
    const calibration = policy[domain];
    const mapped = Object.fromEntries(Object.entries(values).map(([key, x]) =>
      [key, mapFixedBenchmarkMagnitude(x, calibration.points, calibration.logOffset)]));
    if (Object.values(mapped).some(x => x === null)) { errors.push('benchmark_mapping_failed'); return null; }
    return { kind: 'experimental_policy_component', unit: calibration.unit, quantities: values,
      mapped, caseSetId, outerDisplayCeilingReached: Object.values(values).some(x => x >= calibration.points.at(-1).burden),
      publicReady: false };
  };
  const humanComponent = (packet, errors) => {
    const ref = packet.human;
    if (!ref || Object.keys(ref).some(k => !['health', 'function', 'overlap', 'coverageReviewId'].includes(k))
      || !text(ref.coverageReviewId) || !Array.isArray(ref.health) || !ref.health.length
      || !Array.isArray(ref.function) || !ref.function.length || !ref.overlap) {
      errors.push('complete_human_consequence_and_overlap_references_required'); return null;
    }
    const references = [...ref.health, ...ref.function, ref.overlap];
    if (new Set(references.map(x => x?.id)).size !== references.length) errors.push('duplicate_human_observation');
    const rows = references.map(r => resolve(r, packet, errors));
    if (rows.some(x => !x)) return null;
    const hs = rows.slice(0, ref.health.length), ws = rows.slice(ref.health.length, -1), overlap = rows.at(-1);
    // Renaming an identical source row is not additional consequence evidence.
    // Different source rows can still overlap semantically; their accounting
    // boundary must be established in source review, not inferred from IDs.
    const evidenceKeys = rows.map(row => JSON.stringify([row.artifactSha256, row.locator, row.kind]));
    if (new Set(evidenceKeys).size !== evidenceKeys.length) errors.push('duplicate_human_source_evidence');
    const keys = caseKeys(rows, errors);
    const values = {};
    for (const key of keys) {
      let h = 0, w = 0;
      for (const row of hs) {
        const amount = row.cases[key];
        if (row.kind !== 'health_daly' || row.unit !== 'DALY'
          || row.timebase !== 'loss_assigned_to_reporting_year' || !nonnegative(amount)) errors.push('compatible_annual_health_endpoint_required');
        if (amount === 0 && row.zeroMeaning !== 'reviewed_zero_for_declared_outcome') errors.push('verified_human_zero_required');
        h += amount;
      }
      for (const row of ws) {
        let amount;
        const functionProfile = own(registry.profiles, row.profileId);
        if (row.kind === 'function_loss_years' && row.unit === 'function_loss_year'
          && text(row.functionProfileReviewId) && text(row.overlapBoundary)
          && functionProfile?.kind === 'source_specific_function_loss_years'
          && functionProfile.outputUnit === 'function_loss_year'
          && functionProfile.timebase === row.timebase && text(functionProfile.functionDefinition)
          && /^https:\/\//.test(functionProfile.sourceUrl ?? '')
          && /^[a-f0-9]{64}$/.test(functionProfile.artifactSha256 ?? '')
          && row.profileVersion === functionProfile.version
          && row.profileKey === fixedBenchmarkPolicyKey(functionProfile)) amount = row.cases[key];
        else if (row.kind === 'displacement_person_days' && row.unit === 'person_day'
          && row.profileId === 'idmc_disaster_displacement_proxy_0042'
          && row.populationBasis === 'unique_person_time_no_repeat_spell_overlap'
          && text(row.personTimeReviewId) && nonnegative(row.cases[key])) {
          amount = row.cases[key] * policy.human.displacementPrototype.reductionInFunction / 365;
        } else { errors.push('source_specific_function_conversion_required'); amount = NaN; }
        if (row.timebase !== 'loss_assigned_to_reporting_year' || !nonnegative(amount)) errors.push('compatible_function_loss_timebase_required');
        if (amount === 0 && row.zeroMeaning !== 'reviewed_zero_for_declared_outcome') errors.push('verified_human_zero_required');
        w += amount;
      }
      const o = overlap.cases[key];
      if (overlap.kind !== 'human_overlap_loss_years' || overlap.unit !== 'TULIP_human_loss_year'
        || !text(overlap.overlapModelReviewId) || !nonnegative(o) || o > Math.min(h, w)
        || (o === 0 && overlap.zeroMeaning !== 'reviewed_zero_for_declared_outcome')) errors.push('supported_overlap_amount_required');
      values[key] = h * policy.human.healthBridgeFactor + w * policy.human.functionBridgeFactor - o;
    }
    return mapComponent('human', values, rows[0].caseSetId, errors);
  };
  const natureComponent = (packet, errors) => {
    const ref = packet.ecosystem;
    if (!ref || Object.keys(ref).some(k => !['cohorts', 'coverageReviewId', 'partitionId', 'partitionKey'].includes(k))
      || !text(ref.coverageReviewId) || !Array.isArray(ref.cohorts) || !ref.cohorts.length) {
      errors.push('complete_ecological_profile_and_cohorts_required'); return null;
    }
    const partition = own(registry.partitions, ref.partitionId);
    if (!partition || ref.partitionKey !== fixedBenchmarkPolicyKey(partition)
      || !text(partition.nonOverlapReviewId) || !/^[a-f0-9]{64}$/.test(partition.geometryArtifactSha256 ?? '')) {
      errors.push('fixed_reviewed_spatial_partition_required'); return null;
    }
    if (new Set(ref.cohorts.map(x => x?.id)).size !== ref.cohorts.length) errors.push('duplicate_nature_observation');
    const rows = ref.cohorts.map(r => resolve(r, packet, errors));
    if (rows.some(x => !x)) return null;
    const keys = caseKeys(rows, errors);
    const values = Object.fromEntries(keys.map(k => [k, 0]));
    const usedAllocations = new Set(), footprints = new Map(), vectors = [];
    for (const row of rows) {
      const profile = own(registry.profiles, row.profileId);
      if (!profile || row.profileVersion !== profile.version || row.profileKey !== fixedBenchmarkPolicyKey(profile)
        || !text(profile.outcomeCoverageReviewId) || !text(profile.overlapReviewId)
        || !/^https:\/\//.test(profile.sourceUrl ?? '') || !/^[a-f0-9]{64}$/.test(profile.artifactSha256 ?? '')) {
        errors.push('fixed_source_supported_ecological_profile_required'); continue;
      }
      if (row.kind !== 'ecosystem_condition_cohort' || row.timebase !== 'current_condition_stock'
        || ['durationYears', 'recoveryYears', 'conditionLoss', 'weights'].some(k => Object.hasOwn(row, k))) errors.push('current_condition_profile_input_required');
      const allocation = own(partition.allocations ?? {}, row.allocationId);
      if (!allocation || usedAllocations.has(row.allocationId)) { errors.push('unique_registered_spatial_allocation_required'); continue; }
      usedAllocations.add(row.allocationId);
      if (!text(allocation.footprintId) || !nonnegative(allocation.areaKm2) || allocation.areaKm2 <= 0
        || !nonnegative(allocation.share) || allocation.share <= 0 || allocation.share > 1) { errors.push('allocation_area_or_share_invalid'); continue; }
      const previous = footprints.get(allocation.footprintId);
      if (previous && previous.areaKm2 !== allocation.areaKm2) errors.push('shared_footprint_area_mismatch');
      const accumulated = (previous?.share ?? 0) + allocation.share;
      if (accumulated > 1 + 1e-12) errors.push('overlapping_allocation_exceeds_one');
      footprints.set(allocation.footprintId, {areaKm2: allocation.areaKm2, share: accumulated});
      if (Object.keys(profile.classes ?? {}).sort().join('|') !== [...classes].sort().join('|')) {
        errors.push('all_six_ecological_characteristics_required'); continue;
      }
      if (classes.some(kind => !Array.isArray(profile.classes[kind]) || !profile.classes[kind].length)) {
        errors.push('complete_ecological_feature_arrays_required'); continue;
      }
      const seenFeatures = new Set(), seenOverlapGroups = new Set();
      const profileFeatureIds = [];
      for (const kind of classes) {
        const features = profile.classes[kind];
        if (!Array.isArray(features) || !features.length
          || Math.abs(features.reduce((s, f) => s + (f?.weight ?? NaN), 0) - 1) > 1e-12) errors.push('fixed_within_class_weights_required');
        for (const feature of features ?? []) {
          if (!feature || typeof feature !== 'object') {
            errors.push('ecological_feature_definition_or_overlap_invalid'); continue;
          }
          if (!text(feature.id) || seenFeatures.has(feature.id) || !finite(feature.weight) || feature.weight <= 0
            || !text(feature.overlapGroup) || seenOverlapGroups.has(feature.overlapGroup)
            || feature.role !== 'terminal_ecological_condition'
            || !finite(feature.intact) || !finite(feature.degraded) || feature.intact === feature.degraded
            || !text(feature.unit)) errors.push('ecological_feature_definition_or_overlap_invalid');
          seenFeatures.add(feature.id); seenOverlapGroups.add(feature.overlapGroup); profileFeatureIds.push(feature.id);
        }
      }
      if (errors.length) continue;
      for (const key of keys) {
        const observed = row.cases[key];
        if (!observed || Object.keys(observed).sort().join('|') !== profileFeatureIds.sort().join('|')) {
          errors.push('complete_ecological_characteristic_observations_required'); continue;
        }
        let deficit = 0;
        const vector = {};
        for (const kind of classes) {
          let classLoss = 0;
          for (const feature of profile.classes[kind]) {
            const x = observed[feature.id];
            const multiplier = feature.unit === x?.unit ? 1 : feature.inputUnits?.[x?.unit];
            if (!finite(multiplier) || multiplier <= 0 || !finite(x?.withNode) || !finite(x?.withoutNode)) {
              errors.push('ecological_measurement_unit_invalid'); continue;
            }
            const denominator = feature.intact - feature.degraded;
            const withQuality = (x.withNode * multiplier - feature.degraded) / denominator;
            const withoutQuality = (x.withoutNode * multiplier - feature.degraded) / denominator;
            if ([withQuality, withoutQuality].some(q => !finite(q) || q < 0 || q > 1)) {
              errors.push('out_of_reference_condition_requires_review'); continue;
            }
            const change = withoutQuality - withQuality;
            // Keep losses; preserve improvements in the vector. No netting of
            // different features or areas disguises a measured loss.
            classLoss += feature.weight * Math.max(0, change);
            vector[feature.id] = change;
          }
          deficit += policy.ecosystem.classWeights[kind] * classLoss;
        }
        // Normalize the fixed complete weight vector only for floating-point
        // closure. No missing class is dropped or assigned a new weight.
        deficit /= classes.reduce((sum, kind) => sum + policy.ecosystem.classWeights[kind], 0);
        if (deficit === 0 && row.zeroMeaning !== 'reviewed_zero_for_declared_outcome') errors.push('verified_ecological_zero_required');
        values[key] += allocation.areaKm2 * allocation.share * deficit;
        vectors.push({ observationId: row.id, case: key, deficit, signedFeatureChanges: vector });
      }
    }
    if ([...footprints.values()].reduce((sum, x) => sum + x.areaKm2 * x.share, 0) > policy.ecosystem.points.at(-1).burden) errors.push('allocated_area_exceeds_fixed_physical_reference');
    const component = mapComponent('ecosystem', values, rows[0]?.caseSetId, errors);
    return component ? {...component, vectors} : null;
  };
  const calculate = packet => {
    const errors = scopeErrors(packet);
    if (packet?.nodeKind === 'response' && !errors.length) return empty('outside_danger_scoring');
    if (errors.length) return empty('needs_consequence_inputs', errors);
    const humanErrors = [], ecosystemErrors = [];
    const human = humanComponent(packet, humanErrors), ecosystem = natureComponent(packet, ecosystemErrors);
    errors.push(...humanErrors.map(x => `human_${x}`), ...ecosystemErrors.map(x => `ecosystem_${x}`));
    if (errors.length) return {...empty('needs_consequence_inputs', errors), components: {human, ecosystem}};
    const unrounded = policy.weights.human * human.mapped.central + policy.weights.ecosystem * ecosystem.mapped.central;
    const result = { ...empty('experimental_complete_policy_calculation'), components: {human, ecosystem},
      unrounded, experimentalValue: roundBenchmarkDisplay(unrounded),
      limitation: 'Complete arithmetic under an internally authored policy is not complete scientific calibration, source review or approval of a public node rating.' };
    // Marginal bounds do not become a joint confidence interval by sharing
    // lower/upper labels. A source-matched case set is needed for a joint range.
    if (human.caseSetId === ecosystem.caseSetId && 'lower' in human.mapped && 'lower' in ecosystem.mapped) {
      result.range = {lower: 0.5 * human.mapped.lower + 0.5 * ecosystem.mapped.lower,
        upper: 0.5 * human.mapped.upper + 0.5 * ecosystem.mapped.upper,
        kind: 'matched_source_case_envelope_not_probability_interval'};
    } else result.range = null;
    return result;
  };
  return Object.freeze({policyVersion: policy.version, policyKey: CONSEQUENCE_CALIBRATION_POLICY_KEY,
    reference, calculate, describeRegistry: () => structuredClone(registry)});
}
