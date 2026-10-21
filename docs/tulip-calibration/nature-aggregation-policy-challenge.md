# Nature aggregation: fixed-policy challenge

Prepared 27 September 2026. **Synthetic policy experiment; no public or whole-node rating changes.** Two source-pinned mapped extents support the reference arithmetic, but the degradation and attribution cases are invented. Neither policy is approved.

## The candidate rule

For a compatible current-condition endpoint within a fixed ecosystem family:

`family loss fraction = sum(disjoint cohort area × node-attributable degradation fraction) / fixed family extent`

Then, under an explicitly named policy:

`experimental index = sum(fixed family weight × family loss fraction)`

This retains source-native extent through the calculation rather than first compressing reach into a capped ordinal category. The input degradation is the difference between matched with-node and without-node cases on a named reference-to-collapse indicator scale. It is not an entered severity level or a percentage of heat exposure. The [scenario rule](./ecosystem-severity-normalization-candidate.md) still needs source/model validation for real use.

The denominator and policy are registered separately from each node packet in the [experimental aggregator](../../src/tulip-nature-aggregation-experiment.js). Its universe deliberately contains only mapped reefs and mapped mangroves: **260,433.73766 km²** and **147,283.6426 km²**, respectively, from the existing [pinned references](../../src/tulip-nature-burden-experiment.js). This is not a complete global nature denominator. The index is not converted to a TULIP Score.

## Trade-offs declared before outputs

The [analysis script](../../scripts/analyze-tulip-nature-aggregation-policy.mjs) states these directional judgments before calculating the policy outputs. They are internal synthetic checks, not blind independent review:

- Within the same ecosystem and current timebase, 30% of its distribution losing 10% of the assumed condition scale exceeds 1% losing 90%, when no unique-patch premium is declared: 3% versus 0.9% of the fixed type's condition distribution.
- The 30% × 10% case equals a 10% × 30% case under the same assumed linear indicator. Local intensity remains different and must stay visible in the explanation.
- Across different ecosystem types, a 10% reef loss versus a 15% mangrove loss has no predeclared accepted ordering. Equal emphasis and physical-area emphasis test different TULIP value choices.

Recovery and persistence remain important evidence, but a current damaged stock is not multiplied by the number of historical years or an assumed future recovery duration in this test. Doing so would change the timebase and could count the same continuing damage repeatedly. A future-loss or lifetime-impact endpoint requires a separately specified rule.

## Results and meaning limits

| Synthetic current-condition case | Equal family emphasis | Fixed mapped-area emphasis |
| --- | ---: | ---: |
| 1% reef extent × 90% degradation | 0.45% | 0.57% |
| 30% reef extent × 10% degradation | 1.50% | 1.92% |
| 10% reef extent × 30% degradation | 1.50% | 1.92% |
| Entire reef reference × 10% degradation | 5.00% | 6.39% |
| Entire mangrove reference × 15% degradation | 7.50% | 5.42% |

These percentages describe an **assumed two-family policy index**, not observed harm, probability, the percentage of nature lost, or a TULIP rating. Equal family emphasis uses weights of 0.5 and 0.5. Fixed mapped-area emphasis uses approximately 0.63876 for reef and 0.36124 for mangrove. Both preserve the same-type aggregate judgments, but reverse the last cross-type pair.

Equal family emphasis implicitly gives each unit of relative type loss equal importance even when the types have different sizes. Mapped-area emphasis implicitly treats a collapse-relative indicator loss over one square kilometre as exchangeable between these families. Neither implication is established by the source areas or by IUCN's indicator normalization. The [SEEA Ecosystem Accounting standard, section 5.87](https://seea.un.org/sites/seea.un.org/files/documents/EA/seea_ea_f124_web_12dec24.pdf), cautions against aggregating unlike realms or reference conditions. TULIP can adopt a cross-type policy after testing its meanings, but cannot label this exchange rate a universal ecological measurement.

## Future-node and taxonomy checks

The [challenge tests](../../scripts/test-tulip-nature-aggregation-experiment.mjs) verify catalogue-addition invariance, equivalent area units, more-area/more-degradation responsiveness, and inherited subtype accounting. Subtype labels keep their canonical parent's extent and weight; splitting a disjoint cohort into two equal pieces leaves the index unchanged. Unknown canonical ecosystems require a versioned reference/policy review rather than a weight recalculation based on newly listed types.

Every fixed family needs an explicit complete-distribution review or reviewed unaffected-distribution record. A missing or unsupported family returns no experimental index, rather than being dropped and reweighted. The evaluator rejects assessor-entered weights, changed policy/reference versions, inconsistent node/period fields, mixed indicator profiles, duplicate spatial identifiers, excess affected area, unknown units, duration multiplication and response nodes. Review IDs cannot prove that polygons are disjoint, a remaining area is unaffected, or a causal model is valid; those remain source-review duties.

Nineteen rejection cases and the invariants pass. A separate Python arithmetic check reproduces all ten policy outputs in the [analysis artifact](../../artifacts/tulip-consequence-rule-audit-2026-09-27/nature-aggregation-policy-analysis.json). Neither policy receives a calibration pass. In particular, the site-level toy indicators are not the source datasets' actual live-coral-cover or mapped-mangrove-extent measures.

The [real marine-reference audit](./marine-foundation-real-case-calibration-audit.md) now supplies 94 source-checked historical summaries representing 1,322 observations. It shows that a signed average gain can coexist with substantial loss observations. The evaluator consequently requires loss-preserving spatial cohorts and rejects a signed-net mean as a substitute for gross positive loss. Bleaching prevalence, mortality-event response, relative cover and relative density remain separate endpoints; their shared percent symbol does not establish a common harm unit.

## Calibration decision

The subsequent [internal weighting decision](./nature-aggregation-selection.md) selects fixed physical area as the **provisional experimental default** for comparable condition loss, consistent with aggregate total harm. It preserves this report's alternative-policy results. That choice does not approve the ecological exchange between the real indicators, the incomplete two-family denominator, or numerical nature anchors.

Retain the fixed-family, inherited-denominator architecture as an experimental candidate. It corrects the earlier unweighted type-sum and changing-listed-type-mean defects, and it preserves continuous within-type magnitude. **Do not select the cross-type weights from catalogue score distribution or from whichever policy makes familiar nodes look right.**

Next, judge matched real ecosystem-loss reference cases against TULIP's intended current-harm meaning, independently of their desired scores. Specify whether and how ecological uniqueness, lost functions and physical extent enter the nature endpoint, and validate a complete fixed hierarchy and condition interpretation. Only then choose weights and 1–10 anchors. The [IUCN Global Ecosystem Typology](https://global-ecosystems.org/page/typology) provides a classification hierarchy, including transitional realms; it does not prescribe the required TULIP exchange rates. These two families cannot stand in for all nature endpoints on the 354 issues.
