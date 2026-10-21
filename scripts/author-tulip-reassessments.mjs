import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { PUBLISHED_NODES } from '../src/data.js';
import { canonicalJSON } from '../src/tulip-assessment-core.js';
import { digestRouteDefinition } from './lib/tulip-consequence-route-contract.mjs';
import { evaluateInternalEstimateAssessment } from '../src/tulip-internal-estimate-assessment.js';

// Authoring is explicit. Export/build commands only consume the frozen result;
// they cannot silently approve a changed definition, source or assumption.
if (!process.argv.includes('--author')) throw new Error('Use --author after reviewing the authored worksheet and source context.');
const read = async path => JSON.parse(await readFile(new URL(`../${path}`, import.meta.url), 'utf8'));
const [archive, decision, benchmark, pilot, release] = await Promise.all([
  read('src/tulip-legacy-score-archive.json'), read('src/tulip-estimate-policy-decision.json'),
  read('src/tulip-consequence-policy-v1.json'), read('src/tulip-assessment-pilot.json'), read('src/tulip-score-release.json'),
]);
const sha = value => createHash('sha256').update(canonicalJSON(value)).digest('hex');
const sourceBinding = node => sha({ definitionDigest: digestRouteDefinition(node), metric: node.metric_contract, sources: node.source_urls });
const tsv = await readFile(new URL('../src/tulip-reassessments/authored-outcomes-v1.tsv', import.meta.url), 'utf8');
const [header, ...lines] = tsv.trimEnd().split('\n').map(line => line.split('\t'));
const rows = lines.map(line => {
  if (line.length !== header.length) throw new Error('Malformed authored row');
  return Object.fromEntries(header.map((key, i) => [key, line[i]]));
});
const byId = new Map(rows.map(row => [row.node_id, row]));
const issues = PUBLISHED_NODES.filter(node => node.node_kind !== 'response');
if (byId.size !== rows.length || rows.length !== issues.length || issues.some(node => !byId.has(node.id))) throw new Error('Authored issue coverage differs from the published catalogue');
const quantity = (row, key) => {
  const value = Number(row[key]);
  if (!Number.isFinite(value) || value < 0 || row[key] === '') throw new Error(`Invalid ${key}: ${row.node_id}`);
  return value;
};
const records = Object.fromEntries(issues.map(node => {
  const row = byId.get(node.id);
  const people = quantity(row, 'harmed_people_estimate'), perPerson = quantity(row, 'loss_years_per_person_estimate');
  const area = quantity(row, 'affected_area_km2_estimate'), deficit = quantity(row, 'condition_deficit_estimate');
  if (people > 8.3e9 || area > 510e6 || deficit > 1) throw new Error(`Impossible input: ${node.id}`);
  // Only bibliographic context is reused from the archive. No legacy numeric
  // value, ordinal axis, rejected bound, or confidence enters the reassessment.
  const seen = new Set();
  const context = archive.assessmentRegistry.records[node.id].evidenceReferences.filter(ref => {
    const key = `${ref.url}|${ref.locator ?? ''}`;
    if (seen.has(key)) return false; seen.add(key); return true;
  }).map(ref => ({ ...ref, supports: 'context', relevance: `Context for ${node.name}; does not establish the authored global harmed population, loss rate, affected area or integrated condition deficit.` }));
  const assumptions = (id, statement) => ({ id, statement, kind: 'authored_assumption' });
  const common = {
    kind: 'internal_estimate', coverage: 'whole_domain_estimate', geography: 'global', assessmentPeriod: '2026',
    attribution: row.boundary,
    overlapReview: 'One consolidated consequence estimate within this node boundary; no addition of parent, child or neighbour scores. Human health and service losses are not separate copies. Nature area is assumed allocated once across overlapping habitats.',
    limitations: 'Order-of-magnitude internal judgment, not a measured global total or validated impact model. Older and regional context is carried to the assessment cut-off by assumption. Local attribution, coverage and conversion remain uncertain. No probability interval is asserted.',
    evidenceReferences: context,
  };
  const human = { ...common, unit: benchmark.human.unit, quantityEstimate: people * perPerson,
    outcomeDefinition: row.human_outcome,
    estimationMethod: 'Estimated people actually experiencing the named harm × mean attributable health/function loss-years per person, annual-equivalent at the assessment cut-off. One full function-loss year and one health DALY receive equal index contribution by TULIP choice.',
    derivation: { kind: 'people_times_loss', harmedPeopleEstimate: people, lossYearsPerPersonEstimate: perPerson },
    assumptions: [assumptions(`${node.id}_harmed_people`, `${people.toLocaleString('en-US')} actually harmed people is an authored magnitude assumption, not the exposed/dependent population or a source observation.`),
      assumptions(`${node.id}_loss_per_person`, `${perPerson} attributable loss-years per harmed person includes duration and degree of impairment once. It is an authored consequence-equivalence assumption, not a measured disability weight.`)],
    ...(people * perPerson === 0 ? { estimatedAbsenceReason: `No independent present human loss is estimated within this narrowly defined outcome: ${row.human_outcome}. This scoped assumption is not a claim of zero harm outside the boundary.` } : {}),
  };
  if (node.id === 'air_pollution_health_burden') {
    human.quantityEstimate = 184000000;
    human.derivation = { kind: 'source_endpoint_proxy', amount: 184000000, sourceYear: 2021,
      sourceId: 'who_joint_air_dalys_2021_reported_2026', transferFactor: 1 };
    human.estimationMethod = 'WHO joint ambient/household air-pollution health burden for 2021 is used as a 2026 whole-human-domain proxy with a transfer factor of 1. The year transfer and endpoint-coverage substitution are internal assumptions; this is not a measured 2026 total.';
    human.assumptions = [assumptions('who_2021_to_current_proxy', 'Assume the reported 184 million 2021 health DALYs are a current annual-equivalent proxy at the 2026 cut-off; no claimed 2026 observation.'),
      assumptions('who_health_coverage_proxy', 'Use joint ambient/household health burden as this human-health node’s whole-domain proxy; other pollutants and uncovered non-health consequences remain unmeasured.')];
    delete human.estimatedAbsenceReason;
    human.evidenceReferences = [{ id: 'who_joint_air_dalys_2021_reported_2026', label: 'WHO World Health Statistics 2026', url: 'https://www.who.int/publications/i/item/9789240122482',
      locator: '2021 joint ambient and household air pollution: 184 million DALYs; source-native verification retained in artifacts/tulip-consequence-rule-audit-2026-09-27/who-joint-air-pollution-dalys-2021-report.json',
      supports: 'endpoint', relevance: 'Supports only the stated 2021 joint health endpoint, not the assumed 2026 transfer or whole-domain coverage.' }, ...context.filter(ref => ref.url !== 'https://www.who.int/publications/i/item/9789240122482')];
  }
  const ecosystem = { ...common, unit: benchmark.ecosystem.unit, quantityEstimate: area * deficit,
    outcomeDefinition: row.ecosystem_outcome,
    estimationMethod: 'Estimated allocated non-overlapping affected area × mean attributable present integrated condition deficit. This integrated proxy is not a measured six-class SEEA profile. No history or recovery-duration multiplier.',
    derivation: { kind: 'area_times_deficit', affectedAreaKm2Estimate: area, conditionDeficitEstimate: deficit },
    assumptions: [assumptions(`${node.id}_affected_area`, `${area.toLocaleString('en-US')} km² of actually impaired, allocated habitat is an authored magnitude assumption, not anomaly exposure, a basin count, annual conversion flow or source measurement.`),
      assumptions(`${node.id}_condition_deficit`, `${deficit} mean attributable integrated condition deficit is an internal profile-equivalence judgment. It is not inferred from a single species-loss or physical-anomaly percentage.`)],
    ...(area * deficit === 0 ? { estimatedAbsenceReason: `No separate ecological condition loss is assigned within this node's specified outcome: ${row.ecosystem_outcome}. This is a scoped internal absence estimate, not missing evidence converted to measured zero.` } : {}),
  };
  const record = {
    nodeId: node.id, name: node.name, nodeKind: 'issue', policyVersion: decision.version,
    valueKind: 'internal_estimate', assessmentId: `tulip_current_estimate_2026_09_28_v1_${node.id}`,
    authoredOn: '2026-09-28', assessorType: 'internally_authored_ai_assisted', geography: 'global', assessmentPeriod: '2026',
    assessmentCutoff: '2026-09-28', sourceBinding: sourceBinding(node), definitionDigest: digestRouteDefinition(node),
    missingEvidence: `Compatible current global outcome aggregation and counterfactual attribution for ${row.human_outcome.toLowerCase()} and ${row.ecosystem_outcome.toLowerCase()}; independently supported consequence conversion and uncertainty.`,
    components: { human, ecosystem },
    irreplaceability: { status: 'not_assigned', reason: area === 0 ? 'No independent ecological loss is assigned within this endpoint boundary.' : 'No source-bound estimate of permanently lost rare assets with a fixed denominator is available. Rare or slow-recovering damage alone does not establish permanent loss; no automatic bonus is assigned.' },
    priorPilotCase: pilot.nodes.some(item => item.node_id === node.id),
    boundaryReview: row.boundary,
  };
  const result = evaluateInternalEstimateAssessment(record);
  if (result.status !== 'internal_estimate') throw new Error(`${node.id}: ${result.reasons.join(', ')}`);
  return [node.id, record];
}));
const payload = { schemaVersion: 1, version: release.assessmentVersion, authoredOn: '2026-09-28',
  evidenceStandard: 'labelled_internal_estimates_not_measured_totals',
  benchmarkDigest: sha(benchmark), decisionDigest: sha(decision), worksheetSha256: createHash('sha256').update(tsv).digest('hex'), records };
payload.revision = `sha256:${sha(payload)}`;
const target = new URL(`../${release.assessmentFile}`, import.meta.url);
let previous;
try { previous = JSON.parse(await readFile(target, 'utf8')); } catch (error) { if (error.code !== 'ENOENT') throw error; }
if (previous && previous.revision !== payload.revision) throw new Error('Existing assessment versions are immutable. Select a new assessmentFile and assessmentVersion in the release config; retain the previous file.');
await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Authored ${issues.length} consequence estimates; no legacy numerical inputs; all estimates explicitly provisional.`);
