# Draft calibration protocol

Version: `tulip_calibration_working_2026_09_22_v3`. Author: TULIP working draft prepared with AI assistance. **Research notes.** The operational first method is now [TULIP internal scoring logic v5](./internal-score-logic.md). This document preserves questions for future quantitative refinements; it does not hand authorship of the score to outside reviewers.

## Fixed product choices

One public TULIP Score from 1 to 10. Higher means greater current harm, assessed with the newest reliable evidence available for each node. The source period is recorded and normalized to a comparable rate, stock, prevalence or event distribution; no universal start year is imposed. People and nature each receive 50% weight. A separate 2027–2036 outlook under SSP2-4.5 reports direction and does not alter the current grade. Other scenarios remain separate, with no assigned probabilities. The 27 response nodes stay outside danger scoring. These constraints come from the agreed product specification, not from a scientific standard.

The candidate formula remains `S = 1 + 9 × (0.5H + 0.5E)`. `H` and `E` are calibrated consequence values from 0 to 1. A 6 does not mean twice the physical harm of a 3. A source being peer reviewed does not validate TULIP's combination or scale.

The [OECD/JRC composite-indicator handbook](https://doi.org/10.1787/9789264043466-en) is a methodological reference for constructing and checking an index. It does not supply TULIP's values, weights, thresholds or approval.

## Decisions to settle before fitting numbers

| ID | Decision | Working recommendation to evaluate | Required record |
| --- | --- | --- | --- |
| D1 | What loss is attributable to each node? | Specify the process, affected population/ecosystem and a defensible counterfactual. Distinguish total attributable harm during the window from the increase relative to today. Do not mix them. | Estimand, baseline, adaptation and direct/indirect pathway boundaries for each node class |
| D2 | How do drivers, hazards and endpoint nodes compare? | Test a common terminal-consequence ledger. A death can appear in several alternative causal views, but each view must disclose overlap and must not be summed with the others. Evaluate whether endpoint nodes can satisfy both components at all. | Eligibility rules, overlapping-node map and exclusions; no automatic zero for an absent domain |
| D3 | Which human consequences count? | Test healthy-life loss for health, with age-specific inputs where available. Keep essential-service deprivation as a separately measured endpoint until a reviewed conversion/aggregation exists. | Exact health and service units, overlap rules and conversion evidence |
| D4 | Which ecological consequences count? | Test persistent loss of ecosystem condition over area and time, with separate treatment of species extinction and irreversible loss. Area alone is not equivalent across habitats. | Reference condition, recovery, habitat importance and irreversible-loss rules; marine/land comparability |
| D5 | What do the 0–1 scales mean? | Start with TULIP's published 0–4 rubric anchors and test them on held-out cases. Catalogue membership must not move an anchor. | Axis levels, rationale, uncertainty and dissent |
| D6 | How are endpoints combined? | Test additive utility only where overlap and trade-offs are defensible. Examine whether severe harm to one domain is obscured by averaging. | Within-domain weights and preference assumptions; acceptance or rejection of compensability |
| D7 | What context must match? | Use the newest reliable current evidence and keep global coverage for the grade; regional studies may inform estimates but cannot be silently expanded to global totals. Use WMO 1991–2020 for current climate anomalies while keeping the evidence dates separate. Keep the fixed reference pathway for the outlook. | Geographic completeness, actual current-evidence dates, WMO or other declared baseline and purpose, recency check, normalization, and separately the 2027–2036 scenario, population and adaptation assumptions |
| D8 | What is sufficient evidence and review? | Require authored evidence plus an independent internal checker for the pilot. Add outside challenge after the internal method is stable. | Internal author/checker, artifacts, expiry/review triggers and per-node decisions |

These are operational decisions, not requests to invent values. Missing evidence may make a proposed endpoint or node class unsuitable.

## Candidate mathematics to test

1. For each compatible model/scenario realization, build a ledger of **non-overlapping terminal consequences** by geography and year. Document whether a value is an annual loss, an existing stock or an accumulated total; never sum an accumulated series again.
2. Summarize the newest reliable current evidence in a form that is comparable across window lengths: annualized flow, latest stock, period prevalence or event distribution. A duration-sensitive endpoint instead integrates severity over people/area and time. Deaths, DALYs, person-days without water and habitat-area-years remain distinct until their conversions are justified. Do not add the separate 2027–2036 outlook to current harm.
3. Map each raw consequence through a reviewed monotone function `u(L)`. A candidate piecewise-linear segment between anchors `(a_i, q_i)` and `(a_next, q_next)` is `q_i + (L-a_i)/(a_next-a_i) × (q_next-q_i)`. The endpoints and spacing are TULIP judgments informed by evidence. Out-of-range observations require review, not silent clamping.
4. If a domain contains several endpoints, any proposed `H = sum(w_j × u_j(L_j))` or analogous `E` needs nonnegative weights summing to one, an overlap check and a justification for the trade-offs. The present production engine takes one reviewed aggregate per domain; it does not perform this endpoint aggregation for us.
5. Apply the agreed equal people/nature formula only when both domain results are supported. Missing endpoints must not disappear through renormalization. A true, evidenced zero is different from a missing value.

The worksheet contains trial **utility positions** 0, 0.25, 0.5, 0.75 and 1. Their raw-unit values are intentionally unfilled. Even that spacing is a draft to test. It does not assert that loss is linear or that these positions are equally severe in nature. When `H = E`, the score is 1, 3.25, 5.5, 7.75 or 10 respectively: arithmetic only, not ratings for real nodes.

A global theoretical maximum can compress all plausible near-term harm near 1; a logarithm can spread values while changing their meaning. Test these effects openly before choosing anchors. Do not select anchors solely to make the launch catalogue look well distributed. Do not normalize each hazard family to its own maximum: that would make unrelated “worst cases” falsely equivalent.

## Internal calibration workshop

Start with the eight dossiers. Select externally documented benchmark consequences across the anticipated range; do not assume the eight nodes themselves form valid anchors. Separate evidence estimates from judgments about how serious they are.

Have the internal analyst and checker state their judgments independently, with rationale and uncertainty. Discuss disagreement, then record revised judgments and remaining dissent. Keep exploratory values in the research packet, outside the public assessment registry.

The original 20-node pilot is the first consistency test, not ground truth for harm. Hold out genuinely different endpoint and geographic cases when the method expands. Internal testing must be able to reject or revise the proposed common scale.

## Validation that answers scientific questions

- **Reproduction:** compare source-native outputs against the model's published validation target before converting units or utilities.
- **Sensitivity:** repeat rankings at 30/70, 50/50 and 70/30 people/nature weights; report changes among comparable assessed nodes, rank ranges and pairwise reversals. Treat these as robustness tests, not alternative approved public weights.
- **Scenario and model:** compare lower/higher pathways and defensible alternative models separately. Keep missing comparisons missing. Model ensembles are not automatically random samples of future probability.
- **Uncertainty:** preserve what reported ranges mean. Propagated endpoint bounds are not confidence intervals. Nonlinear transformations of expected losses are not generally expected utilities; choose and label the estimand before averaging realizations.
- **Challenge cases:** duplicate evidence, overlapping consequences, incompatible units, changed sources, missing components, out-of-range values, zero versus missing, geography mismatch and adaptation mismatch.
- **Catalogue independence:** adding an unrelated node must not change any existing calibrated value. No catalogue ranks or min/max scaling inside the method.
- **Publication precision:** do not infer that one decimal is scientifically resolved merely because the software can display it. Approve rounding, bands and explanation text after uncertainty testing.

## Evidence availability discovered during this screen

The [ISIMIP3 protocol](https://protocol.isimip.org/) lists SSP1-2.6, SSP3-7.0 and SSP5-8.5 for Group II, with fixed 2015 direct human forcing. SSP2-4.5 is not listed there. Each selected sector/model needs an actual matching data-product check. Averaging lower/higher pathways is not a substitute for a validated SSP2-4.5 run. This finding is about that experiment group, not every ISIMIP dataset.

The downloaded heat code provides a useful starting implementation but does not contain its required fitted model objects, future forcing tables or population tables. Acquisition and reproducibility work must therefore precede a TULIP calibration trial. See the source audit for the exact filenames and line references.
