# Ecosystem severity: a source-defined normalization candidate

Prepared 27 September 2026. **Experimental input rule; public TULIP scores unchanged.** This advances the nature-side consequence rules but does not approve a cross-ecosystem score.

## Replace an entered severity level with a defined biological scale

The [IUCN Red List of Ecosystems guidelines v2.0](https://portals.iucn.org/library/sites/library/files/documents/2024-021-En.pdf), section 7.3.4, printed pages 97–99, describes indicator change relative to an initial and a collapsed state. For a suitable continuous indicator, range-standardization is bounded between zero and one. Fluctuating or categorical observations can require a different frequency-based approach. The guidelines use these inputs to assess collapse risk; their categories are not current-harm TULIP scores.

The [experimental calculation](../../src/tulip-ecosystem-severity-experiment.js) implements the bounded continuous-state rule in either harmful direction:

`raw degradation = (observed value − reference value) / (collapse value − reference value)`

`bounded degradation = min(1, max(0, raw degradation))`

The direction and threshold must agree. The reference, collapse threshold, indicator and physical unit must be named. This removes the freedom to enter an arbitrary “severity 3” while leaving the underlying indicator unchanged. It also exposes an assumption: a range-standardized indicator is not necessarily a linear measure of all ecological function. Threshold validity and the chosen indicator still need source and model review.

For example, in a **synthetic** indicator where higher values mean better function, reference = 100, collapse threshold = 20 and current value = 50, the result is **62.5%** of the reference-to-collapse range. A simple 50% decline would use a different denominator. A 10% decline in another indicator cannot be declared equally harmful without its own reference, collapse threshold and ecological interpretation.

## Historical change and node-attributable harm remain different

A past observation is not automatically the present without-node counterfactual. The scenario-comparison function requires separate with-node and without-node cases with matching indicator, units, reference, threshold, geography, assessment period, causal-model version and joint source. It computes the difference between their bounded degradation values and preserves both signed improvement and positive degradation. Response nodes are rejected from this attributable danger-input route.

In the same **synthetic** example, a present without-node value of 80 has degradation of 25%; a with-node value of 50 has degradation of 62.5%. Their difference is **37.5 percentage points** of this indicator's reference-to-collapse range. The larger 62.5% includes degradation present even without the node. Matching record fields is a necessary mechanical check, not proof that the counterfactual model is valid.

For current coral bleaching, this rule cannot assume that zero live-coral cover is the collapse threshold of every reef function. Nor can it make 2023 observed cover the 2024 no-bleaching state. Those are source/model inputs to establish, not convenient constants to supply in code.

## Published arithmetic check and detected discrepancy

The [checksum-pinned extraction](../../scripts/extract-iucn-rle-severity-benchmarks.py) checks the guideline PDF and its table rows, then writes [three benchmark cases](../../artifacts/tulip-consequence-rule-audit-2026-09-27/iucn-rle-relative-severity-benchmarks.json). These are historical worked examples, with no current-period or TULIP-node attribution.

| Indian Sundarbans worked site | Initial value | Present value | Printed severity | Calculation from printed inputs |
| --- | ---: | ---: | ---: | ---: |
| A | 219.5 | 149.8 | 31.8% | 31.8% |
| B | 667.9 | 320.9 | 51.9% | **52.0%** |
| C | 790.3 | 338.2 | 57.2% | 57.2% |

The source's worked example uses a zero threshold for this indicator. The source table does not specify the physical unit or observation years. Site B's unrounded calculation is approximately 51.954%; its printed 51.9% differs from rounding the printed inputs to one decimal. The reason is not documented. The extraction preserves the source number, the derived number and their discrepancy; it does not silently substitute one for the other. This source table cannot be used as a current, full mangrove-harm assessment.

The [tests](../../scripts/test-tulip-ecosystem-severity-experiment.mjs) reproduce the input arithmetic, retain the discrepancy, and check rescaled/offset units, reversed orientation, monotonicity, threshold boundaries and nonfinite arithmetic. They reject historical-as-counterfactual shortcuts, incompatible scenario scopes, unmatched model runs and response nodes. Reusing a compatible packet under a future node ID leaves the indicator result unchanged. All outputs retain `score: null` and `publicReady: false`.

## Decision for the next candidate

Retain this as a **candidate evidence-to-indicator normalization rule**, with explicit reference/collapse endpoints, rather than an assessor-entered ordinal severity level. It is useful only where an indicator's degradation pathway and collapse threshold are defensible. Categorical, fluctuating and nonmonotone responses need their own specified routes.

Whole-node nature calibration still needs attributable extent, compatible current timebases, other material biological outcomes, spatial overlap resolution, and a frozen policy for comparing unlike ecosystem losses. Bounded indicator saturation can be meaningful at a validated collapse threshold, but it must not erase additional harm to other indicators or ecosystems. The previous ordinal product's premature saturation is not repaired merely by naming an ecological threshold.
