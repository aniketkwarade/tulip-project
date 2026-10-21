import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const calibrationDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const json = async filename => JSON.parse(await readFile(path.join(calibrationDir, filename), 'utf8'));
const [catalogue, endpointPilot] = await Promise.all([
  json('internal-reviewed-catalogue-candidates.json'),
  json('internal-emission-source-endpoint-pilot.json'),
]);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const round = (value, digits = 6) => Number(value.toFixed(digits));

assert.equal(endpointPilot.productionRatingsEnabled, 0);
assert.equal(endpointPilot.counts.sourceSpecificNonlinearHumanEndpointSensitivityNodes, 21);
const catalogueById = new Map(catalogue.issues.map(row => [row.nodeId, row]));
const rows = endpointPilot.rows
  .filter(row => row.humanEndpointStage?.sensitivity)
  .map(row => {
    const catalogueRow = catalogueById.get(row.nodeId);
    assert(catalogueRow, `${row.nodeId}: reviewed catalogue record missing`);
    const central = row.humanEndpointStage.sensitivity.patternCases.find(item => item.patternScale === 1);
    assert(central, `${row.nodeId}: central pattern case missing`);
    return {
      nodeId: row.nodeId,
      name: row.name,
      score: catalogueRow.result.value,
      grade: catalogueRow.result.grade.letter,
      confidence: catalogueRow.result.confidence,
      sourceGas: row.humanEndpointStage.sensitivity.sourceGas,
      physicalResponseBasis: row.humanEndpointStage.sensitivity.physicalResponseBasis,
      cumulativeGmstScreenC2022: row.humanEndpointStage.sensitivity.cumulativeGmstScreenC2022,
      centralSourceAttributableHeatDeaths: central.sourceAttributableHeatDeaths,
      scoreResponseStatus: catalogueRow.candidate.causalAllocation?.scoreResponseStatus ?? null,
      endpointAdmittedToAxes: catalogueRow.candidate.causalAllocation?.endpointSensitivity?.admittedToAxes ?? null,
    };
  })
  .sort((left, right) => right.centralSourceAttributableHeatDeaths - left.centralSourceAttributableHeatDeaths);

assert.equal(rows.length, 21);
assert(rows.every(row => row.confidence === 'D'));
assert(rows.every(row => row.scoreResponseStatus === 'provisional_family_candidate_not_yet_calibrated_to_source_specific_endpoint'));
assert(rows.every(row => row.endpointAdmittedToAxes === false));

const groupedByScore = new Map();
for (const row of rows) {
  if (!groupedByScore.has(row.score)) groupedByScore.set(row.score, []);
  groupedByScore.get(row.score).push(row);
}
const scoreGroups = [...groupedByScore.entries()]
  .map(([score, members]) => {
    const maximum = Math.max(...members.map(row => row.centralSourceAttributableHeatDeaths));
    const minimum = Math.min(...members.map(row => row.centralSourceAttributableHeatDeaths));
    return {
      score,
      grade: members[0].grade,
      nodes: members.length,
      nodeIds: members.map(row => row.nodeId),
      minimumCentralSourceAttributableHeatDeaths: round(minimum),
      maximumCentralSourceAttributableHeatDeaths: round(maximum),
      endpointDynamicRatio: round(maximum / minimum, 3),
    };
  })
  .sort((left, right) => right.nodes - left.nodes || right.score - left.score);

const pairDiagnostics = [];
for (let leftIndex = 0; leftIndex < rows.length; leftIndex += 1) {
  for (let rightIndex = leftIndex + 1; rightIndex < rows.length; rightIndex += 1) {
    const higherEndpoint = rows[leftIndex];
    const lowerEndpoint = rows[rightIndex];
    const relationship = higherEndpoint.score < lowerEndpoint.score
      ? 'score_inversion'
      : higherEndpoint.score === lowerEndpoint.score
        ? 'score_tie_across_distinct_endpoints'
        : 'score_order_agrees';
    pairDiagnostics.push({
      higherEndpointNodeId: higherEndpoint.nodeId,
      lowerEndpointNodeId: lowerEndpoint.nodeId,
      higherEndpointDeaths: round(higherEndpoint.centralSourceAttributableHeatDeaths),
      lowerEndpointDeaths: round(lowerEndpoint.centralSourceAttributableHeatDeaths),
      higherEndpointScore: higherEndpoint.score,
      lowerEndpointScore: lowerEndpoint.score,
      relationship,
    });
  }
}

const ties = pairDiagnostics.filter(row => row.relationship === 'score_tie_across_distinct_endpoints');
const inversions = pairDiagnostics.filter(row => row.relationship === 'score_inversion');
const largestGroup = scoreGroups[0];
const payload = {
  version: 'tulip_internal_emission_source_score_responsiveness_audit_2026_09_25_v2',
  auditedOn: '2026-09-25',
  status: 'provisional_scores_not_source_responsive',
  productionRatingsEnabled: 0,
  purpose: 'Challenge whether current confidence-D emission-source candidates respond to the source-specific nonlinear human endpoint already calculated for each node.',
  methodBoundary: {
    admittedUse: 'Detect ties, inversions and insufficient score resolution before endpoint calibration.',
    prohibitedUse: 'The 103-region central sensitivity is not a global harm estimate and cannot by itself set or rescale a TULIP rating.',
    comparisonRule: 'Compare current candidate values with the central 1× endpoint sensitivity only as a responsiveness diagnostic. Do not normalize by the largest catalogue node or convert ranks into scores.',
  },
  counts: {
    nodes: rows.length,
    uniqueScores: new Set(rows.map(row => row.score)).size,
    uniqueEndpointValues: new Set(rows.map(row => row.centralSourceAttributableHeatDeaths)).size,
    scoreGroups: scoreGroups.length,
    largestEqualScoreGroup: largestGroup.nodes,
    pairComparisons: pairDiagnostics.length,
    tiedPairsAcrossDistinctEndpoints: ties.length,
    scoreInversions: inversions.length,
    endpointAdmittedToAxes: rows.filter(row => row.endpointAdmittedToAxes).length,
  },
  principalFinding: {
    score: largestGroup.score,
    grade: largestGroup.grade,
    nodesSharingScore: largestGroup.nodes,
    minimumCentralSourceAttributableHeatDeaths: largestGroup.minimumCentralSourceAttributableHeatDeaths,
    maximumCentralSourceAttributableHeatDeaths: largestGroup.maximumCentralSourceAttributableHeatDeaths,
    endpointDynamicRatio: largestGroup.endpointDynamicRatio,
    interpretation: `The same ${largestGroup.grade} ${largestGroup.score.toFixed(1)} candidate covers ${largestGroup.nodes} sources whose central endpoint sensitivities differ by about ${largestGroup.endpointDynamicRatio.toLocaleString('en-US')} times. The current candidate therefore does not distinguish source-specific harm within this group.`,
  },
  decision: {
    currentRatings: 'retain_as_internal_confidence_d_candidates',
    publicationReadiness: 'not_ready_for_emission_source_claims',
    requiredNextGate: 'Calibrate the source-removal regional pattern and complete matched human and ecosystem endpoints before changing these ratings. Any replacement thresholds must be fixed independently of catalogue ranks and rerun across all emission-source nodes.',
    reason: 'Changing scores from the sensitivity now would overstate the 103-region result. Leaving the defect unrecorded would overstate the current ratings. The audit preserves the numbers while making their lack of source responsiveness explicit.',
  },
  scoreGroups,
  inversions,
  rows,
};
payload.digest = digest({
  methodBoundary: payload.methodBoundary,
  counts: payload.counts,
  principalFinding: payload.principalFinding,
  decision: payload.decision,
  scoreGroups: payload.scoreGroups,
  inversions: payload.inversions,
  rows: payload.rows,
});

const report = `# Emission-source score responsiveness audit

Status: **provisional scores are not yet source-responsive**. No production rating is enabled.

The repository has a source-specific nonlinear 2022 heat-endpoint sensitivity for 20 CO₂ nodes and one methane node. This audit does not treat that 103-region Italian sample as a global harm estimate. It uses the sensitivity only to ask whether the current provisional ratings react at all when the modeled source contribution changes.

## Finding

${payload.principalFinding.interpretation}

- Nodes tested: ${payload.counts.nodes}
- Distinct endpoint values: ${payload.counts.uniqueEndpointValues}
- Distinct TULIP candidates: ${payload.counts.uniqueScores}
- Tied node pairs with different endpoint values: ${payload.counts.tiedPairsAcrossDistinctEndpoints}
- Pairwise score inversions: ${payload.counts.scoreInversions}
- Endpoint results admitted into TULIP axes: ${payload.counts.endpointAdmittedToAxes}

| Node | Gas | Candidate | Central 103-region sensitivity | Partial 2022 GMST response |
| --- | --- | ---: | ---: | ---: |
${rows.map(row => `| ${row.name} | ${row.sourceGas} | ${row.grade} ${row.score.toFixed(1)} | ${row.centralSourceAttributableHeatDeaths.toFixed(2)} deaths | ${row.cumulativeGmstScreenC2022.toFixed(6)} °C |`).join('\n')}

## Decision

Retain the numerical candidates internally at confidence D, and label them as family-calibrated. Do not present the current equal scores as evidence that these sources cause equal harm. The next valid recalibration requires a validated regional source-removal pattern, the full matched human endpoint, a compatible ecosystem endpoint and thresholds chosen without using catalogue ranks.
`;

await mkdir(calibrationDir, { recursive: true });
await Promise.all([
  writeFile(path.join(calibrationDir, 'internal-emission-source-score-responsiveness-audit.json'), `${JSON.stringify(payload, null, 2)}\n`),
  writeFile(path.join(calibrationDir, 'internal-emission-source-score-responsiveness-audit-report.md'), report),
]);
console.log(JSON.stringify({
  status: payload.status,
  counts: payload.counts,
  principalFinding: payload.principalFinding,
  digest: payload.digest,
}, null, 2));
