# Driver allocations must come from fixed model records

27 September 2026. Internal experimental conversion correction; current public ratings unchanged.

An emissions or activity node needs a supported causal route to consequences. Its share of emissions is not automatically its share of health harm. Even a modeled harm fraction needs an identifiable source result, comparison case, geography, year and overlap treatment.

The [v1 challenge](../../artifacts/tulip-consequence-rule-audit-2026-09-27/modeled-allocation-v1-challenge.json) found that the experimental converter let a caller choose those quantities. With the same cited synthetic source and model-run identifiers, changing the central fraction from 2% to 90% changed the central burden from 3.68 million to 165.6 million DALYs. It also accepted a changed parent quantity when its copied case changed to match, and an altered baseline description. These examples are invented inputs demonstrating an integrity defect; neither figure is a real driver assessment.

The v2 converter accepts a reference to a separately registered allocation record. The reference fixes its source/model versions, artifact digest and exact derivation content. The node packet cannot supply fractions, model cases, parent quantities or a baseline description. The parent burden is reconstructed from the source-observation registry. Changing the parent source version, artifact, reporting basis or baseline identity fails. An allocation is usable only for a node explicitly bound to it.

Compiled model records are immutable. A changed derivation under unchanged citation metadata refuses the old packet. Adding an unrelated model or binding another equivalent case cannot refit the model or change existing arithmetic. Registering a genuinely changed model requires a new source/model revision and review of its source cases; an exact definition key is not a cryptographic signature or a substitute for checking the source.

The [synthetic fixture](../../artifacts/tulip-consequence-rule-audit-2026-09-27/synthetic-modeled-allocation-fixture.json) retains invented paired cases for mechanical testing. It labels their envelope as an invented test range, not a probability interval. The default registry has no validated real allocations and cannot manufacture a driver burden from an unregistered percentage. Registering a test fixture establishes input integrity only; it does not approve its causal model, transfer assumptions, counterfactual equivalence or calibrated rating.

The [audit](../../artifacts/tulip-consequence-rule-audit-2026-09-27/modeled-allocation-binding-audit.json) records the accepted v1 cases and their refusal under v2, alongside unchanged arithmetic for the explicitly registered fixture. The tests cover packet/source changes, wrong units and periods, altered parent observations, stale derivations, future-case and unrelated-model invariance, mutable input attempts and the empty default registry. No numerical whole-node replacement is admitted.

Reproduce with `node scripts/audit-tulip-modeled-allocation-binding.mjs` and `node scripts/test-tulip-burden-conversion-experiment.mjs`.

`python3 scripts/verify-tulip-modeled-allocation-binding.py` checks the pinned fixture, WHO parent and baseline identities and reproduces all 15 stored products with 60-digit Decimal arithmetic. This is a second calculation check, not independent scientific review of a real allocation model.
