# Air-health source scope: edition-specific review

27 September 2026. Input review only; current public ratings unchanged.

The [reviewed source profile](../../artifacts/tulip-consequence-rule-audit-2026-09-27/soga-edition-outcome-profile.json) now records the 2025 report's clinical scope separately from its broad discussion of possible health effects. Figure 18 identifies eight mortality-display classes. The report also documents ozone-linked COPD and NO₂-linked childhood-asthma burden. Display classes do not supply exact DALY model cause IDs or certify the global parent export's joint aggregation.

The publisher's [general methodology page](https://www.stateofglobalair.org/data/estimate-burden) omits dementia and NO₂ from its outcome list and links an older GBD paper. The [2025 report](https://www.stateofglobalair.org/resources/report/state-global-air-report-2025), pages 7 and 35, identifies GBD 2023; its new dementia coverage is also consistent with the GBD 2023 paper. Use the edition-specific material for scope review. These consistent declarations strengthen the publisher-release identity but do not remove the contradictory GBD 2021 CSV footer or certify the exact computation behind a row.

Two new source checks matter for future nodes:

- **Signed source limits:** the captured 2023 global NO₂ CSV reports a central value of 232,600 DALYs with limits of −250,000 and 956,000, under an “All Ages” label. The audit preserves the negative limit and all 34 annual rows. Its sign alone establishes neither protection nor verified zero harm. A harms-only conversion needs an explicit source/model interpretation and policy; no automatic clipping, absolute value or score is supplied.
- **Different age and display scopes:** the report's NO₂ example covers ages 5–14. It is not interchangeable with the all-ages export. The country cause-bar endpoint returns five rounded percentage rows without a year or age denominator. It cannot establish a global absolute burden, a complete risk/outcome specification, or zero harm for omitted causes.

This updates the [air-node review ledger](../../artifacts/tulip-consequence-rule-audit-2026-09-27/review-ledger.json) with a named human outcome proposal and its unresolved scope. It does not approve that proposal, introduce a replacement number or adjudicate the still-pending domain-combination policy.

Python and JavaScript separately reproduce the 34 exported means and signed limits. Scope, malformed-number, changed-year and reversed-bound challenges pass. These are source-handling checks, not independent scientific review.

```sh
python3 scripts/audit-soga-outcome-scope.py
python3 scripts/test-soga-outcome-scope.py
node scripts/test-soga-outcome-profile.mjs
node scripts/build-tulip-consequence-review-ledger.mjs
node scripts/test-tulip-consequence-review-ledger.mjs
```
