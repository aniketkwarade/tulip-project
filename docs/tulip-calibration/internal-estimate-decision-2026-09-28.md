# Internal estimates and ecological priority — 28 September 2026

The user confirmed three choices:

1. Where the evidence does not support a complete consequence calculation, use a **labelled internal estimate** rather than retaining an existing number as its replacement.
2. Give **rare, irreversible ecosystem losses extra score weight**.
3. Cap the adjustment at **1 point on nature**, adding at most **0.5 points overall** before rounding.

The [versioned decision](../../src/tulip-estimate-policy-decision.json) records all three answers. It does not claim that a new assessment has already been completed, that the existing public numbers have been recalculated, or that scientific calibration is complete.

## What an internal estimate must contain

Define the human and ecological outcomes being estimated, their geography and period, source evidence, missing evidence and authored assumptions. Keep the 50/50 average and one decimal. Map each domain separately against the fixed benchmark ruler. Use an estimate in canonical consequence units only as an **authored estimate**, with its derivation visible; do not insert it into a source registry as an observed measurement. A justified estimated absence is different from a verified zero. A missing domain must be assessed explicitly and cannot receive zero automatically.

Source-based calculations and published models can inform an internal estimate, with their boundaries preserved. Sources need not supply a complete model in order to inform a documented judgment. The final number is still an internal estimate when that judgment is required. Source counts, graph connections, existing public values and desired catalogue distributions cannot determine it.

Do not copy the rejected water exposure counts into harmed populations or revive invalid lower bounds. If no source-supported bounds exist, leave them absent. A later optional estimate range must be identified as a judgment or sensitivity range, not a confidence interval or a manufactured probability distribution.

The new score record must carry `valueKind: internal_estimate`, the short label **Internal estimate**, and an explanation identifying the missing evidence and influential assumptions. Carry that record into the score presentation, accessibility text, search details and PDF output. This disclosure requirement applies when the replacement records are integrated; it is not currently visible on the retained scores.

## Ecological priority adjustment

The base nature reading continues to describe area and condition. The new priority adjustment addresses a different consideration: loss of something rare that cannot be restored. Keep the adjustment distinct from measured consequence quantities and add it to nature **before** the fixed 50/50 average. Cap the nature component at 10.

The agreed bounded rule is:

`nature bonus = 1 × estimated irreversible loss fraction of the defined rare ecological asset`

The irreversible loss fraction is itself source-supported or explicitly estimated. Its denominator must be the defined ecological asset, not the node catalogue or the area exposed to a climate anomaly. Repeated sources cannot create repeated bonuses. An unusual event, prolonged stress or slow recovery alone is insufficient to establish an irreversible ecological loss.

The user selected **1 nature point**, raising the overall score by at most **0.5**. For example, an estimated 25% irreversible loss earns a 0.25-point nature adjustment and a 0.125-point increase before final rounding. A base nature score of 9.8 can rise only to 10, so its overall contribution rises by 0.1. The choice is a TULIP policy judgment, not a scientific constant. Eligibility, attribution and the defined rare asset still need to be authored in each applicable assessment. Repeated references never stack additional bonuses.

The resulting score includes ecological priority as well as aggregate current harm. Its explanation must say so. The strict consequence-only experiment remains available separately for research and audit; its scientific admission flags are not changed by this decision.

No production publication or phone installation is authorized by these answers.
