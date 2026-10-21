# Executable fixed-benchmark scoring experiment

27 September 2026. This implements the architecture from the [logic-review decision](./logic-review-verdict.md). It does not approve new benchmark meanings or change public ratings.

The [shared calculator](../../src/tulip-benchmark-score-experiment.js) now performs one versioned sequence:

1. Resolve each applicable component from a separately registered consequence observation and calibration.
2. Match its node binding, geography, assessment year, comparison case, outcome, units and timebase. Preserve source version, locator and artifact digest.
3. Convert to the calibration's canonical units. A nature fraction must match its frozen reference identity and version.
4. Map each component to its own fixed 1, 3, 5, 7, 9 and 10 benchmarks.
5. Average the unrounded people and nature values with the declared 50/50 emphasis. Round the final decimal once.

Between adjacent anchor quantities `a` and `b`, whose scores are `A` and `B`, the experimental mapping is:

`score = A + (B − A) × [log(1 + quantity / offset) − log(1 + a / offset)] / [log(1 + b / offset) − log(1 + a / offset)]`

The offset has the same canonical unit as the quantities, so the logarithm's argument is dimensionless. Anchors and offset are registered policy choices, not fitted to the catalogue. Verified zero maps to 1; values at or above the declared outer anchor map to 10. This ceiling does not justify capping a quantity before it reaches the mapping. The implementation uses an equivalent logarithm calculation to avoid overflow in `quantity / offset`.

## Future-node stability and source changes

The calculator snapshots and freezes policy definitions, source observations and reviewed scope exclusions. A node packet supplies references rather than weights, new anchors or entered quantities. Adding an unrelated observation or calibration case cannot refit the ruler. A source observation must be explicitly bound to a node's endpoint scope; identical-looking measures alone do not permit transfer.

Every packet records the exact canonical policy definition key. Every component pins its calibration version, source version and artifact digest. A changed policy definition or changed source binding rejects an old packet. The canonical key is an exact-content comparison, not a cryptographic signature. The registry's source values still need independent extraction checks; a syntactically valid digest does not prove that its claimed numbers occur in that artifact.

An absent component prevents a fixed people/nature combination. A separately registered endpoint scope permits a **domain-only diagnostic**, which returns `experimentalEndpointValue` and no comparable composite value. It cannot stand in for the whole-node rating. A composite always retains 50/50 weights; missing or excluded observations are not zero. A zero requires an explicit verified-zero consequence observation. This v2 correction resolves the [scope-weighting challenge](./domain-combination-scope-decision.md).

Source bounds remain source bounds. If both composite components report bounds, the calculator propagates an envelope with the original meanings; it does not claim a joint confidence level or construct a probability distribution. If any bounds are unreported, the composite range remains absent rather than being manufactured around the point estimate. An endpoint-only range is explicitly a component range, not a composite interval. All returned public `value` fields remain null and `publicReady` remains false.

The display range rounds outward to one decimal and contains both the unrounded envelope and the rounded central reading. Raw bounds remain available. This avoids presenting a rounded headline outside its own displayed range without changing the source interval's meaning.

## Completed checks

- All 36 combinations of the six component anchor scores produce the declared average.
- A rounding regression distinguishes the correct final **5.0** from premature component rounding's **5.1** for hypothetical component readings of 5.01 and 5.08.
- Twenty-nine rejection cases cover missing components, incompatible units and scopes, exposure substitution, incompatible timebases, stale source bindings, unsupported node transfers, changed references, packet-entered scoring parameters and ambiguous assessment kinds.
- 2,002 monotonic magnitude and equivalent-unit comparisons pass. Additional checks cover unrelated registry additions, ordering, mutation after compilation, response exclusion and unreported uncertainty.
- An independent Python implementation using 60-digit Decimal arithmetic reproduces 38 successful calculation cases, checks 225 component quantities and mappings, and verifies two refusal cases.

The [exported v2 report](../../artifacts/tulip-consequence-rule-audit-2026-09-27/benchmark-score-kernel-report.json) distinguishes synthetic composites from the real WHO 2021 joint-air-pollution health endpoint. That endpoint retains the previously proposed **9.2 health-only reading** in the separate endpoint field; it has no comparable composite value. It is neither a completed Air Pollution Health Burden node nor an approved public rating. The report rejects trying to substitute it for that broader node. The prior v1 report is retained as an audit artifact.

The nature anchors in these arithmetic fixtures are explicitly invented. They test a reusable calculation path and must not enter a real assessment registry. Real nature calibration, non-health human routes and whole-node outcome coverage remain unfinished. The existing catalogue ledger still has no completed typed replacement node assessments.

## Reproduce

```sh
node scripts/test-tulip-benchmark-score-experiment.mjs
node scripts/test-tulip-benchmark-domain-scope.mjs
node scripts/test-tulip-burden-scale-experiment.mjs
node scripts/test-tulip-source-native-burden.mjs
node scripts/analyze-tulip-benchmark-score-kernel.mjs
python3 scripts/verify-tulip-benchmark-score-kernel.py
```

Passing these checks establishes calculation mechanics. The [method acceptance contract](./future-node-acceptance-contract.md) still governs evidence, calibration meanings, held-out cases, reviewer disagreements and whole-node admission.

The [user-confirmed combination record](../../src/tulip-domain-combination-decision.json) fixes equal people/nature emphasis. The calculator binds its combination and weights to that decision and returns the decision version. This approves the combining rule only; it does not approve consequence calibration or whole-node replacement ratings.
