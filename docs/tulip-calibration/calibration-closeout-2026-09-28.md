# Calibration decision, 28 September 2026

**The internal health benchmark choice is settled. Full TULIP calibration is not finished.** The remaining work is to establish compatible nature and non-health human consequence scales, then rebuild the node assessments. No new public ratings have been approved. This is an internal decision and source check, not an outside scientific review.

## What is settled

Keep one decimal from 1 to 10, current attributable harm, and equal people/nature emphasis. Keep source quantities continuous until each component is mapped. Average the unrounded component readings, then round once. Neither an extra node nor the catalogue's distribution changes the ruler.

For a compatible annual health endpoint, select the existing fixed DALY benchmarks for internal experiments:

| Health component | Attributable health burden assigned to one reporting year |
| --- | --- |
| 1.0 | Verified zero for that endpoint |
| 3.0 | 100,000 healthy years lost |
| 5.0 | 1 million healthy years lost |
| 7.0 | 10 million healthy years lost |
| 9.0 | 100 million healthy years lost |
| 10.0 | The fixed WHO 2021 global all-cause reference: approximately 3.014 billion DALYs |

The four middle amounts are **TULIP choices**. WHO supplies the unit and external magnitude references; it does not endorse our thresholds. Every middle two-point step represents ten times the health burden. The benchmark mapping is nonlinear, using the previously implemented piecewise log mapping. It is not a new exponent fitted to today's nodes.

A DALY represents a healthy year lost through disability or premature death. An annual DALY estimate can include future years lost because of deaths in that reporting year, alongside disability burden assigned to the year. Preserve the source's accounting convention; do not multiply the total by a person's lifetime or the observation period again. Climate attribution, causal comparison, age coverage, geography, endpoint coverage and source uncertainty still need to match.

**These are health component benchmarks, not automatic whole-node scores.** A complete people component must cover the material human outcomes within the node definition. A complete TULIP rating also needs nature. A people component of 5 and a nature component of 1 average to 3; a missing nature component cannot stand in for that verified 1.

## What the meanings needed to correct

The earlier descriptions of 3 as necessarily mild/recoverable and 9 as necessarily permanent were inconsistent with total harm. A small number of permanent injuries may produce less total harm than millions of brief illnesses. Severity and duration are retained in the consequence estimate; they are not separately awarded opinion points after DALYs have accounted for them.

The [earlier hypothetical profiles](./score-meaning-anchors.json) remain in the audit history. Their desired numbers are **not** constraints to force a new formula to meet. A component's new meaning follows its documented consequence benchmark. General descriptions of nature and combined numbers cannot be claimed calibrated while their consequence thresholds remain unresolved.

## What was actually checked

The [source check](../../artifacts/tulip-calibration-closeout-2026-09-28/health-benchmark-source-check.json) reads the pinned WHO workbook directly. It includes all **215** numeric cause rows from the global 2021 sheet: the original 10 reference cases and 205 additional magnitude challenges. Separate Python Decimal and JavaScript calculations reproduce their mappings and the named benchmarks.

These cases test scale coverage and magnitude ordering. They are not 215 climate assessments, mutually exclusive causes to sum, a blind validation sample, or an independent scientific review. The reference workbook contains point estimates; an absent interval is not a zero-width interval. A 50,490,441.770317-DALY difference between its all-cause row and the sum of three selected top-level category rows is preserved in the source report. Its explanation has not been established. No category sum is used to calculate the chosen anchors or an attributable node.

The public assessment check continues to reproduce all **354 issue ratings** and **27 response exclusions**, including shared platform data. No current score value changes in this decision.

## What is still missing

| Route | Specific unfinished decision/evidence |
| --- | --- |
| Nature condition | A common interpretation and explicit trade-offs across species composition, structure, function and connectivity. Separate normalized percentages do not establish equivalence. |
| Nature aggregation | A harmonized spatial reference with overlap allocation and full intended scope, followed by fixed consequence amounts for 3, 5, 7 and 9. Reef and mangrove reference areas alone cannot stand for all nature. |
| Services, displacement and livelihoods | A supported conversion for non-health wellbeing loss and an overlap rule with health. IDMC wellbeing life-years are not automatically DALYs; the worked-example parameter ambiguity remains unresolved. |
| Actual nodes | Current, attributable consequence estimates matching each node's definition, with source-bound joint cases and uncertainty. Numerical policy choices do not manufacture these inputs. |

Retain physical-area weighting **only for reviewed comparable condition losses**. It avoids giving a smaller ecosystem family an undeclared per-area premium. This is a provisional ecological policy choice, not evidence that coral cover, mangrove extent and extinction risk are interchangeable. Missing characteristics or ecosystems cannot be silently dropped. Current damaged stock is not multiplied by historical record length or projected recovery.

## Catalogue coverage correction

The old ledger has 518 applicable domain drafts because it excluded one domain for 190 nodes. The fixed 50/50 composite now requires **708 domain positions across 354 issue nodes**. The 190 previously omitted positions need either consequence evidence or a justified zero under the node's definition. They are not 190 additional nodes. No human-only or nature-only assessment can automatically get the other domain's half of the score.

The [coverage report](../../artifacts/tulip-calibration-closeout-2026-09-28/coverage.json) and [component docket](../../artifacts/tulip-calibration-closeout-2026-09-28/component-docket.csv) inventory both positions for every issue, plus all responses and the original 20 pilot cases. This is a docket derived from the existing review, not a claim that every source received another scientific review today.

The two rejected central water inputs and 132 rejected lower components on 110 nodes still require consequence evidence. Withholding an incoherent candidate is not the same as repairing it. There are **zero completed typed whole-node replacements**; existing public numerical ratings remain in place.

## Reproduce

```sh
python3 scripts/close-tulip-health-benchmark-choice.py
node scripts/test-tulip-selected-health-calibration.mjs
node scripts/build-tulip-calibration-closeout.mjs
node scripts/test-tulip-assessments.mjs
```

The [decision record](./calibration-decisions-2026-09-28.json) distinguishes the closed internal health benchmark choice from incomplete full calibration. The [selected health adapter](../../src/tulip-selected-health-calibration.js) keeps the ruler fixed and returns an endpoint diagnostic, no whole-node score and no publication approval. Production publishing and phone installation are separate requests.
