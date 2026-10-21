# Domain scope and the meaning of the combined rating

27 September 2026. Internal policy challenge; current public scores unchanged.

## A gap in the previous comparison

The v1 experimental calculator applied 50/50 weights when both domains were present, but gave the remaining domain full weight after a scope exclusion. That produces readings under different rulers. In a hypothetical test, a human component of 9 gives a health-only reading of 9; the same human component plus a nature component of 3 gives a blended reading of 6. Nothing became safer. The assessed scope and effective weights changed.

The [captured v1 challenge](../../artifacts/tulip-consequence-rule-audit-2026-09-27/scope-weighting-challenge.json) retains the old result. Fifteen of 36 anchor pairs have a lower blended reading than the corresponding human-only endpoint. This is a comparability failure if both readings are presented as the same whole-node TULIP rating, not a failure of monotonicity within a fixed two-domain formula.

The existing catalogue drafts contain 164 two-domain, 93 human-only and 97 nature-only cases. Those counts describe prior scope judgments, not completed replacement assessments. They show that the issue affects a substantial part of the catalogue rather than an unusual future case.

## Implemented correction

The v2 experimental calculator requires an explicit assessment kind. A domain endpoint can retain its diagnostic component reading, but returns no comparable composite value. A fixed people/nature composite requires both source-bound components and always retains its declared 50/50 weights. An endpoint scope exclusion cannot fill the other component. A missing domain is not zero, and a zero still needs its separately registered, verified-zero consequence observation.

The real WHO health-only example remains a 9.2 **health-component candidate**, with no whole-node or composite value. Its source arithmetic has not changed. It is not a newly admitted Air Pollution Health Burden assessment.

The [scope tests](../../scripts/test-tulip-benchmark-domain-scope.mjs) exercise all 36 anchor combinations, verified zero versus missing evidence, and attempts to relabel an endpoint as a composite. Adding nature harm to the same complete two-domain case cannot reduce its value. The main kernel tests and a separate 60-digit Decimal implementation reproduce the corrected result types and arithmetic. No public assessment or iPhone installation changes.

## Confirmed policy decision: 28 September 2026

A fixed average has an unavoidable meaning: a component of 10 paired with verified zero harm in the other domain (mapped to 1) gives **5.5**. A composite of 9 requires the other component to be at least 8, even if the first is 10. No power curve fixes that while preserving the declared average and the component anchors.

Three symmetric policies expose the choice. All component profiles below are hypothetical; they are not new node ratings.

| People component | Nature component | Fixed average | Worse domain | Bounded accumulation |
| ---: | ---: | ---: | ---: | ---: |
| 9 | 1 | 5.0 | 9.0 | 9.0 |
| 9 | 3 | 6.0 | 9.0 | 9.2 |
| 5 | 5 | 5.0 | 5.0 | 7.2 |
| 9 | 9 | 9.0 | 9.0 | 9.9 |

- **Fixed average** means blended harm with equal weights. Low harm in one domain offsets high harm in the other. It preserves the current experimental averaging instruction, but cannot also promise 9–10 for a one-domain case.
- **Worse domain** means the greater domain impact controls the reading. It allows severe one-domain harm to remain high, but ignores increases in the lesser domain until they exceed the greater one. It changes the construct from blended aggregate impact to dominant impact.
- **Bounded accumulation** combines normalized component readings as `h + n − h*n`, where `h = (people − 1)/9` and `n = (nature − 1)/9`, then maps the result back with `1 + 9*result`. It preserves a severe single-domain reading and increases when the other domain worsens below the ceiling. This is an explicit TULIP policy convention, not a probability, an independently calibrated exchange rate, or an estimate of overlapping damage. Two moderate components can produce a substantially higher combined value.

The [comparison](../../artifacts/tulip-consequence-rule-audit-2026-09-27/domain-combination-comparison.json) retains all 14 profiles and formula definitions. Symmetry, boundedness, missing-input refusal and monotonicity checks pass; [separate Decimal arithmetic](../../scripts/verify-tulip-domain-combination.py) reproduces all 42 policy readings. These checks establish algebra, not a scientifically correct preference among the policies.

The user confirmed **fixed 50/50 averaging** on 28 September 2026, giving equal emphasis to people and ecosystem consequences. The [versioned decision](../../src/tulip-domain-combination-decision.json) records this choice, its rationale and the accepted 10-and-1 → 5.5 trade-off in either order. The alternatives remain audit comparisons. The benchmark calculator uses this selected decision; a domain-only endpoint remains a separate diagnostic and cannot receive the absent domain's weight.

People are part of ecosystems. The two components are separate accounting views: people's health and wellbeing, and ecosystem condition, biodiversity and ecological functions. A shared cause can produce distinct consequences in both views. The same human health or wellbeing loss must not be entered again as a nature outcome; overlapping pathways within either view must also be counted once. These outcome boundaries require source review and do not claim the two domains are scientifically independent.

This settles the combination meaning. It does not approve the proposed anchors, cross-ecosystem exchanges, node attribution or replacement numerical ratings. Current public scores remain unchanged during calibration.
