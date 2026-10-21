import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { PUBLISHED_NODES } from '../../src/data.js';
import { canonicalJSON } from '../../src/tulip-assessment-core.js';
import { CURRENT_SCORE_METHOD_COPY } from '../../src/tulip-score-method.js';
import { evaluateInternalEstimateAssessment } from '../../src/tulip-internal-estimate-assessment.js';
import { mapFixedBenchmarkMagnitude, roundBenchmarkDisplay } from '../../src/tulip-fixed-benchmark-map.js';
import { requireCatalogueConsequenceRoutes, digestRouteDefinition } from './tulip-consequence-route-contract.mjs';

const sha = value => createHash('sha256').update(canonicalJSON(value)).digest('hex');
export const currentSourceBinding = node => sha({ definitionDigest: digestRouteDefinition(node), metric: node.metric_contract, sources: node.source_urls });
export function requireAuthoredCatalogue(nodes, authored, benchmark, decision, worksheet) {
  const { revision, ...payload } = authored;
  if (revision !== `sha256:${sha(payload)}` || authored.benchmarkDigest !== sha(benchmark)
    || authored.decisionDigest !== sha(decision)
    || authored.worksheetSha256 !== createHash('sha256').update(worksheet).digest('hex')) throw new Error('Reassessment inputs or policy changed: explicitly re-author and review a new assessment version.');
  const issues = nodes.filter(node => node.node_kind !== 'response');
  if (new Set(nodes.map(node => node.id)).size !== nodes.length
    || Object.keys(authored.records).length !== issues.length
    || issues.some(node => !Object.hasOwn(authored.records, node.id))) throw new Error('Missing authored reassessment; publication cannot supply a generic or legacy rating.');
  for (const node of issues) {
    const row = authored.records[node.id];
    if (row.name !== node.name || row.sourceBinding !== currentSourceBinding(node)
      || row.definitionDigest !== digestRouteDefinition(node)) throw new Error(`Changed definition or source: reassess ${node.id} before publication.`);
    for (const domain of ['human', 'ecosystem']) {
      const component = row.components[domain], d = component?.derivation;
      const expected = d?.kind === 'people_times_loss' ? d.harmedPeopleEstimate * d.lossYearsPerPersonEstimate
        : d?.kind === 'area_times_deficit' ? d.affectedAreaKm2Estimate * d.conditionDeficitEstimate
          : d?.kind === 'source_endpoint_proxy' ? d.amount * d.transferFactor : NaN;
      if (!Number.isFinite(expected) || expected !== component.quantityEstimate) throw new Error(`Incorrect consequence derivation: ${node.id}/${domain}`);
    }
  }
}

export function restoreLegacyRegistry(archive, release) {
  const { revision, ...payload } = archive.assessmentRegistry;
  if (archive.label !== 'TULIP Legacy Score' || archive.sourceRevision !== release.legacyRevision
    || revision !== release.legacyRevision || revision !== `sha256:${sha(payload)}`) throw new Error('Legacy score archive integrity failed');
  return structuredClone(archive.assessmentRegistry);
}

export async function buildCurrentTulipAssessments(root, { active } = {}) {
  const read = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
  const release = await read('src/tulip-score-release.json');
  const mode = active ?? release.active;
  if (mode === 'legacy_archive') return restoreLegacyRegistry(await read(release.legacyArchive), release);
  if (mode !== 'internal_estimates_v1') throw new Error(`Unknown score release: ${mode}`);
  const [authored, benchmark, decision, routes, pilot, worksheet] = await Promise.all([
    read(release.assessmentFile), read('src/tulip-consequence-policy-v1.json'),
    read('src/tulip-estimate-policy-decision.json'), read('src/tulip-consequence-routes-v1.json'),
    read('src/tulip-assessment-pilot.json'), readFile(resolve(root, 'src/tulip-reassessments/authored-outcomes-v1.tsv'), 'utf8'),
  ]);
  if (release.assessmentVersion !== authored.version) throw new Error('Score release version mismatch');
  requireCatalogueConsequenceRoutes(PUBLISHED_NODES, routes);
  requireAuthoredCatalogue(PUBLISHED_NODES, authored, benchmark, decision, worksheet);
  const pilotIds = new Set(pilot.nodes.map(row => row.node_id));
  const scope = { horizon: { start: 2026, end: 2026 }, scenario: 'current_harm_no_forecast', geography: 'global',
    comparisonGroup: 'current_harm_internal_estimates_at_2026_09_28_cutoff', assessmentCutoff: '2026-09-28' };
  const records = Object.fromEntries(PUBLISHED_NODES.map(node => {
    const row = authored.records[node.id];
    const response = node.node_kind === 'response';
    const result = evaluateInternalEstimateAssessment(response ? { nodeId: node.id, nodeKind: 'response' } : row);
    if (!response && result.status !== 'internal_estimate') throw new Error(`${node.id}: incomplete reassessment ${result.reasons.join(', ')}`);
    const components = response ? { human: null, ecosystem: null } : Object.fromEntries(Object.entries(result.components).map(([domain, component]) => [domain,
      { ...component, derivation: row.components[domain].derivation, confidence: 'provisional' }]));
    const refs = new Map();
    for (const c of Object.values(components)) for (const ref of c?.evidenceReferences ?? []) refs.set(`${ref.id}|${ref.url}`, ref);
    const sensitivity = response ? { status: 'not_applicable' } : {
      status: 'illustrative_assumption_sensitivity_not_uncertainty',
      weightCases: [0.3, 0.5, 0.7].map(humanWeight => ({ humanWeight,
        value: roundBenchmarkDisplay(humanWeight * components.human.baseValue + (1 - humanWeight) * components.ecosystem.adjustedValue) })),
      quantityCases: [0.5, 1, 2].map(factor => {
        const h = mapFixedBenchmarkMagnitude(components.human.quantityEstimate * factor, benchmark.human.points, benchmark.human.logOffset);
        const n = mapFixedBenchmarkMagnitude(components.ecosystem.quantityEstimate * factor, benchmark.ecosystem.points, benchmark.ecosystem.logOffset);
        return { factor, value: roundBenchmarkDisplay(0.5 * h + 0.5 * Math.min(10, n + components.ecosystem.priorityBonus)) };
      }),
      note: 'Halving/doubling amounts and changing weights are hypothetical stress tests, not confidence bounds, probability distributions or validated model alternatives.',
    };
    return [node.id, { ...result, ...scope, version: authored.version,
      assessmentBasis: response ? 'response_excluded' : 'current_harm_with_explicit_ecological_priority',
      components, domainWeights: { human: 0.5, ecosystem: 0.5 }, confidence: response ? null : 'provisional',
      evidenceReferences: [...refs.values()], methodCopy: CURRENT_SCORE_METHOD_COPY,
      explanation: response ? 'This topic describes a response. Its benefits, costs and trade-offs need a separate assessment; it does not receive a danger score.'
        : `Internal estimate for ${node.name}: ${result.value.toFixed(1)} out of 10. `
          + `People: ${row.components.human.outcomeDefinition}. Nature: ${row.components.ecosystem.outcomeDefinition}. `
          + `The people component is ${components.human.baseValue.toFixed(1)} and the nature component is ${components.ecosystem.adjustedValue.toFixed(1)}; each receives half the weight. `
          + 'We use assumptions about how many people are harmed, how much their health or daily life is affected, and how much habitat is damaged. These amounts are not measured worldwide totals. '
          + (components.ecosystem.priorityBonus > 0 ? 'A documented permanent loss of rare nature adds a small extra amount to the nature component. ' : 'No extra points for permanent loss of rare nature are assigned without enough information about what was lost and how much. ')
          + 'Assessed on 28 September 2026 using the available study evidence, which may come from earlier years. This describes estimated current impact, not a ten-year forecast.',
      sourceDigest: response ? currentSourceBinding(node) : sha(row),
      assessmentInputsRevision: authored.revision,
      evidenceAudit: { kind: response ? 'response_exclusion_control' : 'explicit_internal_consequence_estimate',
        sourceBinding: response ? currentSourceBinding(node) : row.sourceBinding,
        required: response ? ['No danger score for response nodes.'] : [row.missingEvidence],
        reuse: 'Bibliographic and physical context only, except explicitly identified source endpoints. Citations do not validate authored magnitude assumptions.',
        pilotFinding: pilotIds.has(node.id) ? { kind: 'original_pilot_reassessment', reviewedOn: '2026-09-28', numericalBasis: 'new_authored_consequences_not_legacy_axes' } : null,
        boundaryReview: response ? 'Response excluded' : row.boundaryReview,
        assessorType: response ? null : row.assessorType,
      }, sensitivity, scenarioChecks: [],
      outlook: { horizon: { start: 2027, end: 2036 }, scenario: 'SSP2-4.5', changesCurrentScore: false,
        status: 'separate_not_reassessed', basis: 'No future scenario number or historic trend multiplier enters this current estimate.' },
    }];
  }));
  const issues = Object.values(records).filter(row => row.nodeKind === 'issue');
  const payload = { schemaVersion: 5, version: authored.version, rollout: 'catalogue_wide_labelled_internal_estimates',
    policy: { assessmentBasis: 'current_harm_with_explicit_ecological_priority', weights: { human: 0.5, ecosystem: 0.5 },
      scoreScale: { minimum: 1, maximum: 10, decimalPlaces: 1, direction: 'higher_means_greater_current_harm_and_declared_priority' },
      benchmarkVersion: benchmark.version, decisionVersion: decision.version, assessmentCutoff: '2026-09-28',
      interpolation: benchmark.interpolation, scientificCalibrationApproved: false, measuredHarmClaim: false,
      outlook: { horizon: { start: 2027, end: 2036 }, scenario: 'SSP2-4.5', changesCurrentScore: false } },
    methodCopy: CURRENT_SCORE_METHOD_COPY,
    coverage: { total: PUBLISHED_NODES.length, assessed: issues.length, internalEstimates: issues.length,
      measuredWholeNodeRatings: 0, responses: PUBLISHED_NODES.length - issues.length, unscored: 0,
      priorityAdjustments: issues.filter(row => row.components.ecosystem.priorityBonus > 0).length,
      originalPilotReassessed: issues.filter(row => row.evidenceAudit.pilotFinding).length,
      rankings: 'available_for_all_issue_nodes_as_internal_estimates' }, records };
  return { ...payload, revision: `sha256:${sha(payload)}` };
}
