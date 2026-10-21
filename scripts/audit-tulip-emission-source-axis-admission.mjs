import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const calibrationDir = path.join(root, 'artifacts', 'tulip-calibration-2026-09-22');
const json = async filename => JSON.parse(await readFile(path.join(calibrationDir, filename), 'utf8'));
const [responsiveness, sensitivity] = await Promise.all([
  json('internal-emission-source-score-responsiveness-audit.json'),
  json('internal-emission-source-heat-endpoint-sensitivity.json'),
]);
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const round = (value, digits = 6) => Number(value.toFixed(digits));
const component = axes => (axes.severity / 4 + axes.reach / 4 + axes.persistence / 4) / 3;
const publicScale = normalized => 1 + 9 * normalized;

assert.equal(responsiveness.productionRatingsEnabled, 0);
assert.equal(sensitivity.productionRatingsEnabled, 0);
assert.equal(responsiveness.counts.nodes, 21);
assert.equal(sensitivity.results.length, 21);
assert.equal(sensitivity.inputCounts.regions, 103);
assert(sensitivity.factual.heat_deaths > 0);
assert(sensitivity.factual.represented_population > 0);

const sensitivityById = new Map(sensitivity.results.map(row => [row.node_id, row]));
const literalAxes = { severity: 4, reach: 1, persistence: 4 };
const literalPeopleComponent = component(literalAxes);
const literalPeopleOnlyScaleScreen = publicScale(literalPeopleComponent);

const rows = responsiveness.rows.map(row => {
  const source = sensitivityById.get(row.nodeId);
  assert(source, `${row.nodeId}: heat-endpoint sensitivity missing`);
  assert.equal(source.sensitivity.length, 4, `${row.nodeId}: expected four pattern cases`);
  const patternCases = source.sensitivity.map(item => {
    const deaths = item.source_attributable_heat_deaths;
    assert(deaths > 0, `${row.nodeId}: expected a positive endpoint sensitivity`);
    assert(deaths < 10_000, `${row.nodeId}: literal reach diagnostic no longer maps to level 1`);
    return {
      patternScale: item.pattern_scale,
      sourceAttributableHeatDeaths: deaths,
      attributableDeathsPerMillionRepresentedPeople: item.attributable_deaths_per_million_represented_people,
      fractionOfFactualSampleHeatDeaths: deaths / sensitivity.factual.heat_deaths,
      literalHumanAxisDiagnostic: literalAxes,
    };
  });
  const central = patternCases.find(item => item.patternScale === 1);
  assert(central, `${row.nodeId}: central pattern case missing`);
  return {
    nodeId: row.nodeId,
    name: row.name,
    sourceGas: row.sourceGas,
    retainedCandidate: { value: row.score, grade: row.grade, confidence: row.confidence },
    centralDiagnostic: {
      sourceAttributableHeatDeaths: central.sourceAttributableHeatDeaths,
      attributableDeathsPerMillionRepresentedPeople: central.attributableDeathsPerMillionRepresentedPeople,
      fractionOfFactualSampleHeatDeaths: central.fractionOfFactualSampleHeatDeaths,
    },
    literalAnchorApplication: {
      axes: literalAxes,
      peopleComponent: literalPeopleComponent,
      peopleOnlyScaleScreen: literalPeopleOnlyScaleScreen,
      status: 'diagnostic_only_rejected_for_score_setting',
      reason: 'Premature death is terminal severity and permanent for each decedent, but the death count is not the number of people experiencing all source-attributable harms. The regional sensitivity therefore cannot establish the reach axis or a complete people component.',
    },
    axisAdmission: {
      humanSeverity: {
        status: 'semantically_relevant_but_not_admitted',
        reason: 'The endpoint is premature mortality, but the source-removal regional pattern, full endpoint universe and uncertainty are not yet validated.',
      },
      humanReach: {
        status: 'not_measured',
        reason: 'Deaths are a terminal outcome count, not the unique number of people with fatal, nonfatal or essential-service consequences. The public sample covers 103 regions rather than a compatible global reach denominator.',
      },
      humanPersistence: {
        status: 'semantically_relevant_but_not_admitted',
        reason: 'Death is permanent for each decedent, but the same unvalidated and incomplete endpoint prevents admission.',
      },
      ecosystemSeverity: {
        status: 'not_measured',
        reason: 'The human heat-mortality model contains no ecosystem-condition endpoint.',
      },
      ecosystemReach: {
        status: 'not_measured',
        reason: 'The human heat-mortality model contains no affected ecosystem-distribution denominator.',
      },
      ecosystemPersistence: {
        status: 'not_measured',
        reason: 'The human heat-mortality model contains no ecosystem recovery or irreversibility endpoint.',
      },
    },
    admittedAxes: 0,
    scoreEffect: 'none',
    patternCases,
  };
}).sort((left, right) => right.centralDiagnostic.sourceAttributableHeatDeaths - left.centralDiagnostic.sourceAttributableHeatDeaths);

const allPatternCases = rows.flatMap(row => row.patternCases);
const literalVectors = new Set(allPatternCases.map(row => JSON.stringify(row.literalHumanAxisDiagnostic)));
const centralFractions = rows.map(row => row.centralDiagnostic.fractionOfFactualSampleHeatDeaths);
const centralDeaths = rows.map(row => row.centralDiagnostic.sourceAttributableHeatDeaths);

const payload = {
  version: 'tulip_internal_emission_source_axis_admission_audit_2026_09_25_v1',
  auditedOn: '2026-09-25',
  status: 'partial_endpoint_fails_axis_admission_and_literal_anchors_collapse',
  productionRatingsEnabled: 0,
  purpose: 'Test whether the existing fixed people and nature anchors can admit the 21 source-specific heat-mortality sensitivities without changing definitions after seeing the results.',
  inputs: {
    responsivenessVersion: responsiveness.version,
    responsivenessDigest: responsiveness.digest,
    heatSensitivityVersion: sensitivity.version,
    heatSensitivityDigest: sensitivity.digest,
    publicSampleRegions: sensitivity.inputCounts.regions,
    representedPopulation: sensitivity.factual.represented_population,
    factualSampleHeatDeaths: sensitivity.factual.heat_deaths,
  },
  fixedAnchorTest: {
    severity: 'A fatal endpoint describes premature death, which is level 4 severity when the estimate is compatible and admitted.',
    reach: 'Fewer than 10,000 demonstrated harmed people maps to level 1. For this diagnostic only, each modeled death is treated as one demonstrated harmed person; that is a lower bound, not total reach.',
    persistence: 'A fatal endpoint is permanent for the decedent, which is level 4 persistence when the estimate is compatible and admitted.',
    literalAxisVector: literalAxes,
    literalPeopleComponent,
    literalPeopleOnlyScaleScreen,
    boundary: 'The people-only 1–10 screen is shown only to expose anchor behavior. These emission drivers affect both people and nature, so the missing nature component cannot be declared structurally inapplicable or entered as zero.',
  },
  counts: {
    nodes: rows.length,
    patternCases: allPatternCases.length,
    distinctEndpointValues: new Set(allPatternCases.map(row => row.sourceAttributableHeatDeaths)).size,
    distinctLiteralHumanAxisVectors: literalVectors.size,
    nodesWithAnyAxisAdmitted: rows.filter(row => row.admittedAxes > 0).length,
    nodesWithCompletePeopleComponent: 0,
    nodesWithCompleteNatureComponent: 0,
    nodesWithCompleteTulipCandidate: 0,
    currentCandidatesChanged: 0,
  },
  endpointRange: {
    minimumCentralDeaths: round(Math.min(...centralDeaths)),
    maximumCentralDeaths: round(Math.max(...centralDeaths)),
    dynamicRatio: round(Math.max(...centralDeaths) / Math.min(...centralDeaths), 3),
    minimumFractionOfFactualSampleHeatDeaths: round(Math.min(...centralFractions), 9),
    maximumFractionOfFactualSampleHeatDeaths: round(Math.max(...centralFractions), 9),
  },
  principalFinding: {
    result: 'The fixed anchors map all 84 pattern cases to the same literal human-axis diagnostic of severity 4, reach 1 and persistence 4, despite 21 distinct central endpoint values.',
    interpretation: 'The six-axis method is deliberately categorical. A different modeled death count does not deserve a different TULIP score unless it crosses a predeclared reach threshold or changes another measured axis. Forcing more score spread from this sample would add a new, post-hoc scale rather than apply the agreed method.',
  },
  rejectedShortcuts: [
    'Do not use catalogue rank or the largest source as the denominator for a new score.',
    'Do not invent percentage-of-sample-deaths bands after observing this distribution.',
    'Do not treat deaths per million as the reach of all people harmed.',
    'Do not declare nature structurally inapplicable to an emissions driver because the current model measures only people.',
    'Do not add source-specific heat deaths to family-level human harm that may already contain overlapping heat consequences.',
  ],
  decision: {
    currentRatings: 'retain_as_internal_confidence_d_candidates',
    endpointAdmission: 'none',
    scoreChange: 'none',
    nextGate: 'Run a compatible full-universe source-removal endpoint with uncertainty, measure unique fatal and nonfatal human consequences against the fixed reach anchors, and add a matched ecosystem condition, distribution and recovery endpoint. Reapply the same predeclared axes. If compatible results still occupy the same levels, retain the tie rather than manufacture differentiation.',
    calibrationImplication: 'The next refinement is evidence completion, not a new multiplier. Any proposed source-attributable burden subscale must be declared as a new TULIP method version and tested across the full catalogue before it can replace the six fixed axes.',
  },
  rows,
};
payload.digest = digest({
  inputs: payload.inputs,
  fixedAnchorTest: payload.fixedAnchorTest,
  counts: payload.counts,
  endpointRange: payload.endpointRange,
  principalFinding: payload.principalFinding,
  rejectedShortcuts: payload.rejectedShortcuts,
  decision: payload.decision,
  rows: payload.rows,
});

const report = `# Emission-source axis-admission audit

Status: **the partial endpoint fails admission, and a literal use of the fixed anchors collapses to one human-axis result**. No production rating is enabled.

The 21 source sensitivities produce distinct central heat-mortality values, ranging from ${payload.endpointRange.minimumCentralDeaths.toFixed(2)} to ${payload.endpointRange.maximumCentralDeaths.toFixed(2)} deaths in the public 103-region 2022 sample. This audit applies the already-declared TULIP anchors without adding a new curve or ranking the sources.

## Fixed-anchor result

All ${payload.counts.patternCases} temperature-pattern cases map to the same literal diagnostic:

- human severity 4 because the modeled endpoint is premature death
- human reach 1 because each case contains fewer than 10,000 modeled deaths
- human persistence 4 because death is permanent for the decedent

That vector gives a human component of ${payload.fixedAnchorTest.literalPeopleComponent.toFixed(2)}. A people-only scale screen would be ${payload.fixedAnchorTest.literalPeopleOnlyScaleScreen.toFixed(2)}, but it is not a TULIP candidate. Deaths are not the full unique harmed-person count, the sample is not a compatible global reach denominator, and emissions drivers require a nature component.

## Why no axes are admitted

The fatal endpoint is relevant to human severity and persistence, but its regional source-removal pattern, full endpoint universe and uncertainty remain incomplete. It does not measure nonfatal or service consequences, total unique harmed people, ecosystem condition, affected ecosystem distribution or recovery. Therefore ${payload.counts.nodesWithAnyAxisAdmitted} of ${payload.counts.nodes} nodes receive an admitted axis change and ${payload.counts.currentCandidatesChanged} candidates change.

## Calibration decision

Keep the confidence-D numerical candidates for continuity while their explanation states that they are family-calibrated. Complete a compatible full-universe human endpoint and a matched ecosystem endpoint, then apply the same thresholds again. If the complete evidence still falls into the same fixed levels, the tie is a real feature of the coarse A–E method. TULIP should not create extra separation simply because the underlying estimates differ.

The audit rejects catalogue-relative ranks, post-hoc percentage bands, deaths-per-million as total reach, a zero nature component and adding overlapping heat consequences twice.
`;

await mkdir(calibrationDir, { recursive: true });
await Promise.all([
  writeFile(path.join(calibrationDir, 'internal-emission-source-axis-admission-audit.json'), `${JSON.stringify(payload, null, 2)}\n`),
  writeFile(path.join(calibrationDir, 'internal-emission-source-axis-admission-audit-report.md'), report),
]);

console.log(JSON.stringify({
  status: payload.status,
  counts: payload.counts,
  endpointRange: payload.endpointRange,
  fixedAnchorTest: payload.fixedAnchorTest,
  digest: payload.digest,
}, null, 2));
