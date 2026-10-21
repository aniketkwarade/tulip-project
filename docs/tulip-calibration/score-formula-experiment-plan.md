# Test plan: score meanings and candidate conversions

Prepared 27 September 2026 before running the expanded comparison. This is an internal experiment, not a runtime scoring change.

## Fixed inputs and candidates

- Keep `score-meaning-anchors.json` version 1 unchanged: four hypothetical targets at 3, 5, 7 and 9, plus its two stress profiles.
- Use all current reviewed issue candidates and response controls. Pin the input files with SHA-256 in the results.
- Test the current linear conversion, exponent 1.2 after domain averaging, exponent 1.2 within each domain, and a benchmark-mapped conversion in both positions.
- The benchmark-mapped conversion is piecewise linear through index/score points `(0,1), (.25,3), (.5,5), (.75,7), (11/12,9), (1,10)`. This is equivalent to `1 + 8x` up to `.75` and `7 + 12(x - .75)` above it. Exact agreement with the four defining cases is by construction, not independent evidence of accuracy.
- Do not fit another exponent, alter a reference case, invent empirical target ratings, or adjust the catalogue's distribution to select a winner.

## Checks

1. Recompute current lower, central and upper scores independently from axis sums; reconcile with the evaluator and public records. Confirm all response controls remain unscored. Check current web/mobile/native snapshot parity.
2. Report unrounded anchor error and displayed values. Show counts within 0.25 and 0.5 points as descriptive tolerance sensitivity, not scientific pass criteria.
3. Test all sixteen human/nature pairings of the four reference profiles against the declared mean of their target domain scores. These pairings follow from the same anchors and are not an independent empirical validation set.
4. Test range, endpoints and monotonicity on all 125 single-domain integer profiles and 15,625 two-domain combinations. This grid is mathematical; some zero/nonzero combinations do not represent coherent consequences.
5. Recompute all catalogue scores and bounds for each candidate. Compare score distribution, rounding ties, strict rank reversals and splitting of existing ties. Distinguish better display spread from improved measurement.
6. Apply one-level perturbations to every active axis and test 30/70 and 70/30 domain weights. Preserve evidence ranges as structured bounds; do not manufacture probability distributions.
7. Test catalogue independence by adding an unrelated case. Transform existing bounds using the same candidate as the central score.
8. Retain the two unresolved stress-profile trade-offs. Also test information loss within a reach bin, a crossing of a reach threshold, and whether a no-harm component can gain points from positive reach or duration. Inspect any matching current catalogue case before interpreting it.
9. Quantify the effect of applying each nonlinear conversion before versus after domain averaging. Do not call equal weights on raw indices the same interpretation as averaging the newly calibrated domain scores.
10. Independently reproduce the principal calculations in a second implementation. Present the results with their limits and retain a per-node comparison for inspection.

## Decision standard

Passing arithmetic and invariants makes a conversion mathematically usable. Closer agreement with the hypothetical anchors supports those internal product choices only. It does not validate source-to-axis mappings, the trade-offs among severity/extent/duration, or the empirical accuracy of a real node's rating.

A candidate that fits the anchors but preserves unexplained ties cannot be described as a completed harm-calibration method. No public data, app score policy, phone installation or production deployment is part of this experiment.
