# Experimental consequence-to-score rules

Prepared 27 September 2026. Version: `tulip_consequence_2026_09_27_v1`. These rules are an **internal trial**, separate from the published v6 TULIP Score. No website, iOS, search or PDF rating has been replaced.

**Subsequent internal decision:** The [mixed-case review](./mixed-case-calibration-decision.md) found the 50/25/25 arithmetic combination failed two stated ordering judgments. An equal-weight geometric experiment passed those judgments but later failed the chosen aggregate-current-harm construct by losing measured magnitude and reversing a compatible hypothetical burden ordering. Both remain diagnostic comparators, not replacement scoring rules. This document remains the v1 audit trail.

**Evidence admission added after the geometric diagnostic:** The geometric calculator remains available to show what a supplied axis vector would produce. Its [evidence-bound gate](../../src/tulip-consequence-scoring-v2.js) now withholds a numerical node candidate from structured prose estimates, family analogues without an executable transfer, and converted estimates without a source-bound calculation. It currently recognizes one registered WHO mortality endpoint as an **endpoint-only experimental candidate**, not a publishable whole-node score. The [identifiability diagnostic](../../artifacts/tulip-consequence-rule-audit-2026-09-27/structured-identifiability.json) still shows that the permissive calculator yields 3.0 and 10.0 for identical recorded evidence; the stricter gate rejects both. This preserves the failure evidence while preventing that ambiguity from counting as a method pass. Adding evidence routes requires a versioned derivation rule and independently stored source observations, rather than another free-text field.

## The question before the calculation

For each applicable domain, name the actual harmful outcome first. Describe who experienced it, or which ecosystem type deteriorated, in a defined place and assessment period. State the comparison without the node's harmful condition. Then assess the seriousness of that **same outcome for that same affected group**, the number of harmed people or portion of the ecosystem distribution affected, and how long the consequence or recovery lasts.

A population living in a drought-affected basin is exposed, but is not automatically a count of people who lost water service. A long-lived glacier change is not automatically a ten-year human consequence. A severe outcome in a small subgroup cannot supply severity while everybody mildly affected supplies reach. If multiple outcomes matter, explain which are represented and remove overlap; do not count an outage and the illness it caused as two copies of the same health loss. A cumulative measure such as lost healthy-life years must not be multiplied by duration again.

The versioned assessment record requires an outcome identifier, affected group, geography, period, counterfactual, evidence references, severity aggregation, outcome coverage and overlap note. Each axis must refer to that same group, geography and period. Direct, converted, structured and family estimates are allowed, but bounded judgments require a cited rationale. Numeric reach can interpolate between frozen people and nature benchmarks. It must be a count or bounded estimate of people **with the stated harm**, not all people exposed or dependent. For nature, it must refer to a named condition indicator and the affected share of a declared ecosystem distribution. The duration must concern the consequence or recovery, not merely the hazard's age. A zero on all three axes needs an affirmative absence-of-harm finding; an unknown outcome cannot be assigned zero. The other domain may be omitted only when structurally outside the node definition, with a reason. Response nodes retain no danger score.

## Experimental conversion

Within people and nature separately, the trial gives seriousness 50%, affected reach 25%, and consequence duration 25%:

`index = 0.50 × severity/4 + 0.25 × reach/4 + 0.25 × duration/4`

The [frozen hypothetical reference cases](./score-meaning-anchors.json) place levels 1/1/1 at 3.0, 2/2/2 at 5.0, 3/3/3 at 7.0, and 4/3/4 at 9.0. All-zero verified harm maps to 1.0, and 4/4/4 maps to 10.0. A piecewise linear map passes through these points. TULIP then averages the **converted** people and nature results 50/50, where both apply, and rounds once to a decimal. A single structurally applicable domain keeps the full scale. Evidence uncertainty gives lower and upper structured bounds, not a probability distribution.

This weighting is a declared TULIP value judgment, not a physical law. It stops the old equal-average tie between slight widespread persistent deterioration (1/4/4), the severe reference (3/3/3), and severe local permanent deterioration (4/1/4): the trial gives them 6.0, 7.0 and 7.7. A 1.2 power curve of the old equal average could not separate them. Smooth interpolation reduces threshold jumps when actual harmed counts or ecosystem percentages are available. Existing catalogue candidates largely contain only ordinal levels, so this benefit is not yet realized in their conditional comparison.

## What the catalogue assessment says

The [reproducible audit](../../artifacts/tulip-consequence-rule-audit-2026-09-27/report.md) checks all 354 issue candidates and 27 response controls. **352** issue central axis sets are mathematically usable for a *conditional* comparison. They have not passed the new outcome, cohort, period and source-evidence contract. **Two** current human components are incoherent: Glacier-Fed Water Dependence and Surface Water Storage Instability have zero stated severity alongside positive reach and duration derived from dependence or exposure. **110** nodes have lower-bound components that combine a zero axis with positive axes and need joint-bound review. No new public rating follows from this audit.

The 50/25/25 experiment changes 331 of the 352 comparable displayed values and reverses 326 previously ordered pairs. Its median falls from 4.8 to 4.0. Global Temperature moves from 9.3 to 8.3 on reused 3/4/4 inputs; this reflects the stronger severity weight, not new physical evidence. One-axis classification differences can move a candidate by as much as 1.67 points. The [weight sensitivity data](../../artifacts/tulip-consequence-rule-audit-2026-09-27/weight-sensitivity.json) show that four different severity weights all fit the four reference targets, while their mixed-profile rankings differ. The reference targets alone therefore cannot justify 50/25/25.

| Seriousness / reach / duration | Slight, widespread, lasting case | Severe, local, permanent case | Conditional catalogue median | Reversed pairs versus current method |
| --- | ---: | ---: | ---: | ---: |
| Equal thirds | 7.0 | 7.0 | 4.3 | 0 |
| 40 / 30 / 30 | 6.6 | 7.3 | 4.2 | 20 |
| **50 / 25 / 25 trial** | **6.0** | **7.7** | **4.0** | **326** |
| 60 / 20 / 20 | 5.4 | 8.0 | 4.2 | 1,718 |

Every row refits the same four benchmark scores and reuses the old ordinal judgments. Zero reversals for equal thirds reflect the old ordering; they do not validate it. The 40/30/30 and 50/25/25 versions reverse **264** ordered pairs relative to each other despite agreeing on all four reference targets. The differing counts reveal how much the chosen trade-off matters.

The trial is **not yet suitable for a catalogue-wide public score replacement**. The next calibration decision is to judge mixed cases independently of their desired numbers, settle the acceptable severity/reach/duration trade-offs, and then rebuild the affected node assessments from consequence evidence. The two central failures and 110 lower-bound failures need explicit correction. The rest also need the new typed outcome review before any conditional values can be presented as measured ratings. This is an evidence and semantics gate, not a request to remove their current public numbers.

## Reproduce

Run `node scripts/test-tulip-consequence-scoring.mjs`, `node scripts/assess-tulip-consequence-rules.mjs`, `node scripts/assess-tulip-consequence-weight-sensitivity.mjs`, then `python3 scripts/verify-tulip-consequence-audit.py`. The [experimental scorer](../../src/tulip-consequence-scoring.js) is intentionally separate from the [current evaluator](../../src/tulip-internal-calibration.js). The catalogue report includes one row per issue, source links and the two rejected records' stored reasoning.
