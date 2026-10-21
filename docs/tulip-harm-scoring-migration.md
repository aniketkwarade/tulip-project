# TULIP Score: catalogue migration

Local implementation, 22 September 2026. Production has not been published.

All 381 published nodes now have one versioned assessment shared by web, mobile preview, native iOS and PDF exports. The previous urgency calculations remain in the archived registries and regression tests. They cannot provide a displayed score or severity band.

| Result | Nodes |
| --- | ---: |
| Supported numerical ratings | 0 |
| Issue nodes: Not yet scored | 354 |
| Response nodes: Response | 27 |
| Total assessment records | 381 |

This is the intended evidence-gated migration. None of the existing records supplies two independently reviewed, calibrated projections of human and ecosystem harm for the agreed period and scenario. No scores or probability distributions were invented.

The [complete coverage CSV](../artifacts/tulip-harm-migration-2026-09-22/coverage.csv) lists each node's status, previous route, available metric, missing projections and calibration, and source references. The [JSON report](../artifacts/tulip-harm-migration-2026-09-22/coverage.json) also preserves source-native inputs, historical pilot findings and sensitivity status. Rebuild these with `node scripts/report-tulip-harm-coverage.mjs`.

## Meaning of the score

Version `tulip_harm_2027_2036_v1` fixes the complete calendar years 2027–2036. It compares attributable global harm under SSP2-4.5. SSP1-2.6 and SSP3-7.0 are separate lower and higher emissions cases; no likelihood is assigned to any pathway. These labels follow the [IPCC scenario definitions](https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/). The formula, equal weights, time window and calibration choices are TULIP policy decisions, not IPCC recommendations or universal scientific constants.

`1 + 9 × (0.5 × human harm + 0.5 × ecosystem harm)`

Both components must use documented, reviewed 0–1 consequence scales. A genuinely supported zero is different from missing evidence. One missing component makes the entire rating unavailable; weights are never redistributed. Essential-service losses must have an explicit overlap review so their health consequences are not counted twice. Node scores describe separate attributable assessments and must not be added across a causal chain.

No severity bands have been approved. Old thresholds are not reused. Unsupported topics say **Not yet scored**, with a tap explanation. Interventions say **Response** and never receive danger scores. Heuristic human/planet severity headings are also removed from public inspectors and exports. The removed inspector assessment metadata block remains absent; method and limitations live in the score explanation and PDFs.

## What the evidence audit did

The migration inspected the stored evidence contracts for all 354 issues: 96 current-data routes, 208 impact-fallback routes and 50 modeled routes. It inventories the original observations and source references, excludes old normalized components, and records the missing human projection, ecosystem projection, impact models, attribution, aggregation, uncertainty and calibration for every issue.

This was a local contract and compatibility review, not a new independent scientific review of every linked publication. Observations and impact context can be considered as future model inputs after scope and source checks. Peer scores, graph connections, source counts and historical unusualness cannot establish projected harm.

The [20 original regression cases and all 50 modeled cases](../artifacts/tulip-harm-migration-2026-09-22/pilot-and-modeled-cases.md) are recorded individually. Pilot findings remain explicitly historical and carry checks against their pinned receipt and file hashes; changed inputs do not inherit a claim of fresh review.

## Admission of future numerical scores

`src/tulip-score-policy.json` owns the version, horizon, scenario, comparison group, weights, approved calibration definitions and candidate assessments. It intentionally contains no approved calibrations or candidates today.

Before admitting a candidate:

1. Supply both source-native consequence estimates with units, supported uncertainty bounds and their original interpretation, a model ID, attribution and counterfactual, global aggregation, and disjoint loss IDs with an overlap review. Each component must explicitly match the candidate's geography, period, scenario and comparison group.
2. Supply monotone calibration anchors spanning 0–1, a rationale, supporting evidence references, eligible model IDs and the exact policy version. Estimates outside the calibrated range remain unscored; no extrapolation or clipping is used.
3. Bind actual projection input files with SHA-256 hashes. The builder recomputes their hashes and a source digest from the archived receipt, metric contract, node sources and those files. A changed or missing file invalidates admission until reviewed again.
4. Obtain independent domain and statistical review of the policy, calibration definitions and complete candidate. Review records must identify external reviewers and supporting HTTPS review evidence, and contain the exact reviewed definitions. AI-assisted review alone does not satisfy the gate. Maintainers must verify the real review evidence; the validator checks the contract and cannot authenticate a person's expertise by itself.
5. Regenerate shared assessments, mobile and native snapshots; run parity, admission and build checks. Any edited estimate or definition invalidates its previous review. Future unassessed nodes receive explicit unscored records; publication checks reject missing or stale generated records.

The formula uses fixed anchors. Adding an unrelated node cannot change an existing score. Old urgency registries and source snapshots are retained for audit only.

## Sensitivity and uncertainty

Real catalogue rankings, scenario sensitivity and model sensitivity are **not evaluable** yet. There are no admitted scores or compatible alternative model/scenario outputs to compare. That limitation is recorded rather than replaced with artificial ranges.

Synthetic fixtures test the arithmetic, 30/50/70% human-weight sensitivity and an actual reversal in the order of a people-heavy versus nature-heavy pair. Separate lower/higher-scenario fixtures cannot enter the reference scenario. Unapproved models and incompatible forecasts are rejected. These are software regression tests, not climate evidence.

When real estimates are admitted, their lower/upper bounds are propagated as an envelope. The implementation does not invent probabilities, assume independent errors or label that envelope a confidence interval. Before enabling a real ranking, reviewers must examine alternate supported models and scenarios, overlapping uncertainty and weight-driven ranking changes.

## Validation

- All 381 web, mobile and native assessment records are byte-equivalent after JSON decoding. All 354 issue values and bands are null; all 27 responses are excluded. The shared plain-English method is identical in native data.
- Tests cover missing components, incompatible units, scenario, geography and periods, duplicate consequences and evidence, absent source references, missing uncertainty, invalid scales, changed sources, stale approvals, ineligible models and AI-only reviews.
- The full repository test suite, web build, mobile TypeScript/build and native simulator build pass. Protected mobile runtime checks pass.
- Browser and native previews show the new statuses. Web and native coastal PDFs include the shared explanation, formula, period and scenario; their rendered status and method pages were inspected for clipping and overlap.
- [Final preview and PDF verification details](../artifacts/tulip-harm-migration-2026-09-22/verification.md) are saved alongside the coverage artifacts.

Local previews: web at `http://127.0.0.1:5181/?node=coastal_inundation_risk`, mobile at `http://127.0.0.1:5182/#analyse`, plus the native iPhone simulator. Production publishing is separate.
