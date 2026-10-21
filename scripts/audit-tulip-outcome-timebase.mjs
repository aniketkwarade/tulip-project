import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const assessments = JSON.parse(readFileSync(new URL('../public/tulip-assessments.json', import.meta.url)));
const routes = JSON.parse(readFileSync(new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/route-coverage.json', import.meta.url)));
const output = new URL('../artifacts/tulip-consequence-rule-audit-2026-09-27/timebase-conversion-audit.json', import.meta.url);

const requirements = {
  end_state_stock: 'Convert the latest physical state to attributable people/ecosystem consequences present in the assessment period; do not multiply by observation-history length.',
  annualized_flow: 'Determine whether the annual flow itself is terminal harm. If it is a physical driver, model the attributable consequences; do not treat tonnes, hectares or activity as harm units.',
  event_distribution: 'Bind event frequency to a matching consequence per event or use a source-reported aggregate consequence; exclude repeated counting of the same outcome.',
  period_prevalence: 'Bind the affected group and period to a measured or calibrated consequence intensity; normalize to a declared annual burden without multiplying a lifetime-loss measure by duration again.',
};
const routeById = new Map(routes.nodes.map(node => [node.nodeId, node]));
assert.equal(routeById.size, routes.nodes.length);
const records = Object.values(assessments.records);
const issues = records.filter(record => record.nodeKind === 'issue');
const responses = records.filter(record => record.nodeKind === 'response');
assert.equal(issues.length, routes.summary.issueNodes);
assert.equal(responses.length, routes.summary.responseNodesOutsideDangerScoring);

const nodes = issues.map(record => {
  const route = routeById.get(record.nodeId);
  assert(route, `Missing route inventory: ${record.nodeId}`);
  const window = record.currentWindow ?? {};
  assert(requirements[window.summaryMethod], `Unknown source timebase: ${record.nodeId}`);
  assert(Number.isInteger(window.start) && Number.isInteger(window.end)
    && window.start <= window.end, `Invalid evidence period: ${record.nodeId}`);
  assert(Number.isInteger(route.typedConsequenceEndpointsDefined)
    && route.typedConsequenceEndpointsDefined >= 0,
  `Invalid typed endpoint count: ${record.nodeId}`);
  return {
    nodeId: record.nodeId,
    sourceTimebase: window.summaryMethod,
    sourceEvidencePeriod: { startYear: window.start, endYear: window.end,
      coverageStatus: window.coverageStatus ?? null },
    sourceMetric: route.boundMetric,
    applicableDomains: route.applicableDomains,
    typedConsequenceEndpointsDefined: route.typedConsequenceEndpointsDefined,
    requiredConversion: requirements[window.summaryMethod],
    outcomeTimebaseStatus: 'not_verified_by_source_summary',
    candidatePublicValue: record.value,
    candidatePublicValueChangedByAudit: false,
  };
});
const bySourceTimebase = Object.fromEntries(Object.keys(requirements).map(method =>
  [method, nodes.filter(node => node.sourceTimebase === method).length]));
const report = {
  version: 'tulip_outcome_timebase_audit_2026_09_27_v1',
  status: 'source_timebases_catalogued_terminal_consequence_timebases_unverified',
  input: { assessmentVersion: assessments.version, assessmentRevision: assessments.revision,
    routeInventoryVersion: routes.version },
  constructCandidate: 'Current attributable consequences, separately assessed for people and nature in a declared assessment period; physical source histories are context, not extra harm.',
  summary: { issueNodes: nodes.length, responseNodesExcluded: responses.length,
    bySourceTimebase, typedConsequenceEndpointsDefined: nodes.reduce((sum, node) =>
      sum + node.typedConsequenceEndpointsDefined, 0),
    outcomeTimebasesVerifiedByThisAudit: 0,
    currentPublicValuesChanged: 0 },
  interpretation: 'The four labels normalize source records, not terminal consequences. Even a source reported per year may need a causal conversion to health, service or ecosystem harm. This audit does not itself verify any outcome timebase; no current public value is validated or changed by this inventory.',
  nodes,
};
writeFileSync(output, `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ status: 'written', ...report.summary }, null, 2));
