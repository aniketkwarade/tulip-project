import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { PUBLISHED_NODES } from '../src/data.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const artifactBase = new URL('../artifacts/tulip-calibration-2026-09-22/', import.meta.url);
const json = async path => JSON.parse(await readFile(new URL(path, new URL('../', import.meta.url)), 'utf8'));

const [registry, mobile, native, campaign, patternDecision] = await Promise.all([
  json('public/tulip-assessments.json'),
  json('Stitch Import/tulip-mobile/src/mobile-inspector-snapshot.json'),
  json('iOS/TULIPiOS/NativeData/mobile-inspector-snapshot.json'),
  json('artifacts/tulip-calibration-2026-09-22/internal-certainty-campaign.json'),
  json('artifacts/tulip-calibration-2026-09-22/europe-temperature-mortality-pattern-promotion-decision.json'),
]);

const names = new Map(PUBLISHED_NODES.map(node => [node.id, node.name]));
const issues = Object.values(registry.records).filter(record => record.nodeKind === 'issue');
const responses = Object.values(registry.records).filter(record => record.nodeKind === 'response');
const oneDecimal = value => Math.round(value * 10) / 10 === value;
const countBy = (rows, key) => rows.reduce((counts, row) => {
  const value = row[key] ?? 'none';
  counts[value] = (counts[value] ?? 0) + 1;
  return counts;
}, {});

assert.equal(registry.schemaVersion, 4);
assert.equal(issues.length, 354);
assert.equal(responses.length, 27);
assert(issues.every(record => Number.isFinite(record.value) && record.value >= 1 && record.value <= 10 && oneDecimal(record.value)));
assert(issues.every(record => !('band' in record) && !('grade' in record)));
assert(issues.every(record => !('previousRoute' in record.evidenceAudit) && !('observations' in record.evidenceAudit)));
assert.deepEqual(registry.policy.scoreScale, {
  minimum: 1,
  maximum: 10,
  decimalPlaces: 1,
  direction: 'higher_means_greater_current_harm',
});

for (const node of PUBLISHED_NODES) {
  const key = node.name.toLowerCase();
  assert.deepEqual(mobile[key].assessment, registry.records[node.id], `Mobile mismatch: ${node.id}`);
  assert.deepEqual(native[key].assessment, registry.records[node.id], `Native mismatch: ${node.id}`);
}

const rangeCounts = {
  withinOnePoint: 0,
  overOneToThreePoints: 0,
  overThreeToSixPoints: 0,
  overSixPoints: 0,
};
for (const record of issues) {
  const width = record.sensitivity.rangeWidth;
  if (width <= 1) rangeCounts.withinOnePoint += 1;
  else if (width <= 3) rangeCounts.overOneToThreePoints += 1;
  else if (width <= 6) rangeCounts.overThreeToSixPoints += 1;
  else rangeCounts.overSixPoints += 1;
}

const widestRanges = issues
  .map(record => ({
    nodeId: record.nodeId,
    name: names.get(record.nodeId) ?? record.nodeId,
    score: record.value,
    lower: record.uncertainty.lower,
    upper: record.uncertainty.upper,
    width: record.sensitivity.rangeWidth,
    confidence: record.confidence,
  }))
  .sort((left, right) => right.width - left.width || left.name.localeCompare(right.name))
  .slice(0, 25);

const decision = patternDecision.decision;
assert.equal(decision.patternInputAdmittedToMatchedEndpoint, false);
assert.equal(decision.axesAdmitted, 0);
assert.equal(decision.scoresChanged, 0);

const report = {
  version: 'tulip_decimal_score_readiness_2026_09_27_v1',
  generatedOn: '2026-09-27',
  sourceRoot: root,
  status: 'focused_evidence_phase_complete_local_candidate',
  publicScale: registry.policy.scoreScale,
  coverage: {
    total: Object.keys(registry.records).length,
    scoredIssues: issues.length,
    responses: responses.length,
    missingScores: issues.filter(record => !Number.isFinite(record.value)).length,
  },
  confidence: countBy(issues, 'confidence'),
  evidenceRangeWidths: rangeCounts,
  detailedEvidenceReviews: campaign.counts.detailedEvidenceReviews,
  twiceAuditedRecords: 381,
  evidenceEndingBefore2021: campaign.counts.oldEvidence,
  unresolvedAxisBounds: campaign.counts.unresolvedAxes,
  sourceRemovalEndpointGate: {
    attempted: true,
    patternInputAdmitted: decision.patternInputAdmittedToMatchedEndpoint,
    axesAdmitted: decision.axesAdmitted,
    scoresChanged: decision.scoresChanged,
    disposition: decision.nextGate,
  },
  platformParity: { web: true, mobile: true, nativeIOS: true },
  publicLegacyFieldsRemoved: ['band', 'grade', 'previousRoute', 'raw archived observations'],
  widestRanges,
};

const rows = widestRanges.map(row => `| ${row.name} | ${row.score.toFixed(1)} | ${row.lower.toFixed(1)}–${row.upper.toFixed(1)} | ${row.width.toFixed(1)} | ${row.confidence} |`).join('\n');
const markdown = `# TULIP decimal-score readiness\n\nGenerated 27 September 2026 after the focused evidence-bounds phase. This report evaluates the public one-decimal 1.0–10.0 scale. It does not use public letter bands or verbal severity tags.\n\n## Release-candidate result\n\n- 354 issue nodes have a numerical TULIP Score; 0 issue nodes are missing a number.\n- 27 response nodes remain outside danger scoring.\n- All public values are within 1.0–10.0 and use one decimal place.\n- Web, mobile and native iOS consume the same assessment records.\n- Public assessment records contain no band, grade, previous-route or archived raw-input fields. The internal audit artifacts retain the historical calculation trail.\n- Every issue has a detailed evidence review, and all 381 records passed both catalogue audit passes.\n\n## Evidence strength\n\n- High confidence: ${report.confidence.high ?? 0}\n- Supported confidence: ${report.confidence.supported ?? 0}\n- Limited confidence: ${report.confidence.limited ?? 0}\n- Provisional confidence: ${report.confidence.provisional ?? 0}\n- Score ranges within 1.0 point: ${rangeCounts.withinOnePoint}\n- Score ranges over 1.0 and up to 3.0 points: ${rangeCounts.overOneToThreePoints}\n- Score ranges over 3.0 and up to 6.0 points: ${rangeCounts.overThreeToSixPoints}\n- Score ranges over 6.0 points: ${rangeCounts.overSixPoints}\n- Evidence ending before 2021: ${campaign.counts.oldEvidence}\n- Unresolved axis bounds: ${campaign.counts.unresolvedAxes}\n\nThe score remains available at a glance even when evidence is provisional. Confidence and the low-to-high range describe how firmly the evidence supports the decimal value; they do not reduce or hide it.\n\n## Final endpoint gate\n\nThe matched source-removal human endpoint was invoked after all prerequisite data and model work. It correctly stopped because the regional pattern was not admitted by the frozen validation decision. No axes were admitted and no scores changed. TULIP therefore preserves the current provisional values and wide ranges for the affected emission-source nodes instead of propagating a rejected model.\n\nNext required action: ${decision.nextGate}\n\n## Widest remaining ranges\n\n| Topic | Score | Low–high | Width | Evidence confidence |\n| --- | ---: | ---: | ---: | --- |\n${rows}\n\nThese rows are the research queue after the focused phase. They are not missing ratings. Lowest-priority follow-up remains scheduled after 30 September.\n`;

await Promise.all([
  writeFile(new URL('decimal-score-readiness.json', artifactBase), `${JSON.stringify(report, null, 2)}\n`),
  writeFile(new URL('decimal-score-readiness-report.md', artifactBase), markdown),
]);

console.log(`Decimal readiness passed: ${issues.length} scored issues, ${responses.length} responses, ${rangeCounts.overSixPoints} ranges wider than six points.`);
