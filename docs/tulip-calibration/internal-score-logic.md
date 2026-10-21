# TULIP internal scoring logic v6

**Retained public-method record, not the replacement calibration.** The replacement research rejects its capped ordinal inputs and single-domain reweighting. See the [28 September calibration decision](./calibration-closeout-2026-09-28.md). Public numerical values remain in place while source-native replacements are built; this document does not authorize reusing these axes under the replacement method.

Status: internally authored working method, applied catalogue-wide in the shared local assessment registry. Its current-harm ratings are consumed by the local web, mobile and native iOS builds; production publishing remains a separate release step. Outside review comes after TULIP has written the method, applied it consistently and documented its choices.

## What the score means

The TULIP Score compares the **current harm** attributable to a node. “Current” means the newest reliable evidence available for that node at the assessment cut-off. It may be a recent snapshot, several recent years, or a longer observation window such as 2015–2026. There is no fixed start year. The exact period is recorded with the score. TULIP is a policy index, not a natural unit. A higher number means broader, more severe or more persistent current harm according to TULIP's declared rules.

Different window lengths must be made comparable. A flow is expressed per year, a stock uses its latest measured state, prevalence uses a consistent denominator, and an event series uses a rate or distribution. Analysts cannot give a longer record a higher score merely because it contains more years of accumulated events. Every assessment records when newer evidence was last checked and why the selected evidence is the newest reliable match.

The evidence window does not replace the reference baseline. For a recent or current meteorological or climatological anomaly, TULIP uses the WMO climatological standard normal, currently 1991–2020. A 2026 observation can therefore be the newest evidence while its anomaly is still calculated against 1991–2020. For long-term climate-change monitoring, preserve WMO's fixed 1961–1990 reference when that is the reported convention. Global-temperature evidence tied to Paris Agreement or IPCC warming levels may retain the explicitly stated 1850–1900 pre-industrial baseline. A different baseline requires the source's reason and cannot be chosen to change the score.

WMO normals apply to climate variables such as temperature and precipitation. They are not a universal baseline for mortality, displacement, service interruption, habitat condition or other consequences. Those outcomes use their own documented counterfactual and denominator while retaining the relevant WMO-normalized climate exposure where the causal model uses one.

The 2027–2036 SSP2-4.5 assessment is a separate outlook. It says whether the evidence indicates the condition is improving, stable, worsening or mixed. The outlook does not change the current score.

Risk arises from a hazard interacting with exposure and vulnerability; it is not established by unusual weather alone. This follows the [IPCC risk framing](https://www.ipcc.ch/site/assets/uploads/2021/02/Risk-guidance-FINAL-5October2020.pdf). The rubric scores magnitude, pervasiveness and persistence. Cascades and ability to respond remain in the evidence record, but do not receive opinion-based points. The resulting thresholds are TULIP choices.

Every issue node receives two component assessments:

- **People:** health, safety and essential services.
- **Nature:** ecosystem condition, distribution, persistence and ecological function.

Responses remain outside danger scoring. Graph connections, source counts, media attention and historical unusualness are never scoring inputs.

## Complete coverage rule

Every published issue node receives one decimal score from 1.0 to 10.0. Missing a direct current estimate changes how the estimate is produced; it does not remove the score. TULIP uses the best available route in this order:

1. **Direct estimate:** compatible node-specific consequences for the current period and geography.
2. **Converted estimate:** a quantitative proxy or geographic aggregation with a documented conversion.
3. **Structured node estimate:** the node's historical evidence and relevant literature support bounded axis levels without a complete compatible estimate.
4. **Family-calibrated estimate:** use reviewed analogues from the same phenomenon family, then document every node-specific adjustment.

A family fallback must name its family, analogue nodes, evidence and rationale. It cannot copy a family median silently. The public inspector always shows the decimal score; the detailed explanation identifies the evidence basis, confidence in plain language and low-to-high score range. This gives users an at-a-glance result without pretending that every result has the same evidential precision.

## Historical foundation

Every current assessment must explain what happened historically. TULIP uses the following standard timeline for the first release:

| Purpose | Standard period | Use |
| --- | --- | --- |
| Full historical record | 1976–2025 | Estimate the long-term direction, variability and changes in exposure, vulnerability and adaptation |
| Early comparison | 1976–1995 | Establish an earlier 20-year state |
| Recent impact period | 2006–2025 | Measure the most recent two complete decades of conditions and consequences |
| Current assessment | Newest reliable evidence available | Calculate the current TULIP Score; record the source period, coverage and normalization method |
| Climate normal, when relevant | 1991–2020 | Report physical climate anomalies against the current WMO standard normal |
| Outlook | 2027–2036 | Report a separate direction under SSP2-4.5; do not change the current score |

The ten years from 1996–2005 remain in the full trend and model fitting; they are simply outside the two 20-year comparison blocks. Provisional or partial 2026 evidence may inform the current score when it is the newest reliable evidence, but its cut-off and incomplete coverage must be stated. Partial annual totals cannot be compared with full-year totals without a documented adjustment.

The [WMO defines climatological standard normals as consecutive 30-year periods](https://wmo.int/wmo-climatological-normals), currently including 1991–2020. TULIP's 50-year record serves a different purpose: showing change and testing whether the latest measured state is part of a longer pattern. It does not replace a source's required climate normal, pre-industrial reference or published model baseline.

Use the earliest **reliable and comparable** data, not merely the oldest value found. If a consistent record begins after 1976—for example, because a satellite instrument or health surveillance system began later—use the complete available record and document the reason, coverage and resulting limitation. Earlier reliable data may be used for model fitting and context, while the standard comparison windows stay fixed so nodes do not receive different scores merely because one archive is older.

For every node, record:

1. The observed metric, geography, units, start/end dates and breaks in measurement method.
2. The early state, recent 20-year state, newest reliable current state and trend over the complete usable record.
3. Observed consequences during 2006–2025, separated from changes in population, land use, wealth, vulnerability and adaptation.
4. Attribution: what portion is linked to the climate condition compared with a counterfactual without that change. The [IPCC distinguishes detecting a change from identifying its cause](https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-16/).
5. The current evidence window, whether it is complete, partial or provisional, how it is normalized, the date newer evidence was checked and why this is the newest reliable evidence.
6. The reference baseline and its purpose: WMO 1991–2020 for current climate anomalies, the applicable fixed long-term or pre-industrial reference, or an explained non-climate counterfactual.
7. The outlook direction for 2027–2036 under SSP2-4.5, its evidence basis and its own confidence. Historical observations alone must not be extended as a straight line when exposure, vulnerability, adaptation or physical relationships are changing.

History informs the current axis ratings and their uncertainty. It is not added as another axis. For example, observed heat mortality can anchor current severity, exposed populations can measure reach, and recovery after previous events can inform persistence. Adding separate “past damage points” on top would count those consequences twice.

## The calculation

Each component has three equally weighted axes rated 0–4 using evidence and an internal decision note:

`component = (severity/4 + reach/4 + persistence/4) ÷ 3`

When both domains are part of the phenomenon, the public-scale candidate is:

`TULIP = 1 + 9 × (0.5 × people + 0.5 × nature)`

This retains the agreed 50/50 emphasis. The minimum is 1 and maximum is 10. The calculation uses integer axis levels for the first calibration so the inputs do not imply unsupported precision. The combined result is rounded to one decimal after the low, central and high cases are calculated.

Analysts assign axis levels from evidence. Software derives the one-decimal number from those levels; an analyst cannot select the final score directly or promote it because a node feels important. There are no public letter bands or verbal severity tags.

If a narrowly defined phenomenon genuinely applies to only people or only nature, the applicable domain uses the full 1–10 scale. The other domain is marked structurally not applicable with a reason; it is not treated as missing and is not entered as zero into the average. This prevents a catastrophic human-only or nature-only outcome from being artificially capped at 5.5. A driver or hazard that can affect both domains must estimate both, using the fallback ladder when necessary.

Equal weighting is the first-release neutral convention. TULIP is not claiming that severity, reach and time are scientifically interchangeable. Sensitivity tests record how much the decimal result moves under reasonable alternative weights. The public score stays tied to the declared equal-weight method, while the low-to-high evidence range shows how firmly the evidence supports it.

### People anchors

| Level | Severity in the current assessment window | Reach in the current assessment window | Persistence of current consequences |
| --- | --- | --- | --- |
| 0 | No attributable adverse consequence | Nobody | None |
| 1 | Mild, short-lived symptoms or inconvenience | Fewer than 10,000 people | Less than one month |
| 2 | Material illness, economic loss, displacement or managed essential-service interruption | 10,000 to under 1 million | One month to under one year |
| 3 | Severe illness, major displacement or prolonged loss of an essential service | 1 million to under 100 million | One to ten years |
| 4 | Premature death, permanent disability or loss of basic survival needs at scale | 100 million or more | More than ten years, lifelong or permanent |

When compatible health results exist, use disability-adjusted life years to inform severity and duration: [WHO defines one DALY as one lost year of healthy life](https://www.who.int/docs/default-source/gho-documents/global-health-estimates/ghe2019_daly-methods.pdf). DALYs do not convert an electricity outage or loss of livelihood automatically. Those pathways need their own evidence and an overlap check so resulting illness is not counted twice.

### Nature anchors

| Level | Severity within the affected ecosystem | Extent of the ecosystem's distribution | Persistence or recovery |
| --- | --- | --- | --- |
| 0 | No attributable condition loss | None | None |
| 1 | Less than 10% movement toward collapse | Less than 1% | Recovers within one year |
| 2 | 10% to under 30% movement toward collapse | 1% to under 10% | One to under ten years |
| 3 | 30% to under 70% movement toward collapse | 10% to under 50% | Ten to fifty years |
| 4 | 70% or more movement toward collapse, or collapse | 50% or more | More than fifty years or irreversible |

“Movement toward collapse” uses a node-appropriate indicator relative to the state at which the ecosystem loses its defining features. This borrows the concept of relative severity from the [IUCN Red List of Ecosystems](https://www.iucnrle.org/rle-glossary), whose criteria separately consider distribution, environmental degradation, biotic disruption and collapse probability. TULIP is not assigning IUCN status.

Extent is measured against the relevant ecosystem type's distribution, with the denominator documented. Habitat area, species count and ecosystem condition cannot substitute for one another without a documented model.

### System effects and irreplaceability

System effects do not receive separate opinion points. If a cascade is quantified—for example, a power failure causes a documented number of people to lose water service for a measured duration—its terminal consequences enter severity, reach and persistence once. If the cascade is plausible but unquantified, record it as a limitation. It may reduce evidence confidence, and it may widen a bound only when evidence supports that bound. It does not change the score by itself.

Irreversibility is represented through persistence. Extinction or ecosystem collapse also affects evidence-based severity. It is not counted again as a separate modifier.

## Uncertainty and confidence

Analysts record a low, central and high integer value for every axis. These form transparent score bounds; they are not a probability interval. The central value must be a best-supported assessment, not an average chosen to avoid a decision.

Confidence is separate from harm:

- **High:** direct quantitative evidence matches the node, current period and geography.
- **Supported:** quantitative evidence needs a documented proxy, conversion or geographic aggregation.
- **Limited:** structured internal judgment is supported by relevant evidence but lacks a complete compatible estimate.
- **Provisional:** a family-calibrated estimate is used because node-specific current evidence is incomplete.

This separation prevents poor evidence from making a dangerous issue look safe. Direct and converted estimates need an analyst and independent internal checker. Structured estimates also need a second subject-matter reader and an explicit research gap. Family-calibrated estimates require named analogues, an adjustment rationale and wider bounds where the evidence supports them. All four routes produce a score.

## Rules for difficult nodes

1. **Define the causal question.** Compare the observed current world with a counterfactual in which the node's harmful condition is absent or held at the declared baseline. Record hazard, exposure, vulnerability and adaptation. Do not score the size of the physical anomaly as if it were harm.
2. **Use terminal consequences once.** Within one assessment, trace pathways to health, services or ecosystem condition and remove overlaps. If an outage causes illness, the same illness cannot appear in both a service estimate and health estimate.
3. **Scores are alternative views, not quantities to add.** Global Temperature, extreme heat and heat mortality may describe overlapping causal paths. Their scores may each be useful, but summing them is meaningless.
4. **An emissions source cannot inherit its aggregate's score.** Diesel freight, cement fuel and similar source nodes need a declared counterfactual, a compatible emissions denominator and a source-specific harm allocation. Until that allocation exists, they retain a numerical family-calibrated candidate with provisional confidence and wide bounds, and explicitly record that the Carbon Emissions or Methane score was not copied. Annual tonnes alone do not determine severity because the terminal response depends on accumulated forcing, timing, geography and the counterfactual emissions path.
   A source-specific sensitivity is also tested for **score responsiveness**. If substantially different modeled source contributions retain the same family score, TULIP records that tie as a calibration defect. The sensitivity may challenge the provisional rating without setting a new one when its geography, regional pattern, uncertainty or ecosystem endpoint is incomplete. Equal provisional scores must not be described as equal source-attributable harm.
   A source endpoint overwrites only the axes it actually measures. A fatal endpoint may support human severity and persistence after validation, but its death count is not automatically the reach of every fatal, nonfatal and essential-service consequence. A human-only model does not make nature structurally inapplicable to an emissions driver. If compatible source estimates still occupy the same predeclared axis levels, the ratings may remain tied; TULIP does not add catalogue-relative ranks or post-hoc thresholds merely to force separation.
5. **Structural non-applicability is different from missing evidence.** A node specifically naming a human outcome may use only the people component if the decision record explains why nature is outside the node definition. It can use the full scale. Missing nature evidence for a dual-domain hazard is not non-applicability.
6. **Drivers and hazards normally require both domains.** If a direct component is unsupported, use the structured-node or family-calibrated route with evidence and bounds. Do not omit it or silently enter zero.
7. **Responses receive no danger score.** Benefits, costs and trade-offs need a separate response assessment.

## Internal workflow

For each node, one analyst completes the six axes, citations, causal boundary, aggregation, overlap and system-effects notes. The analyst also records the separate outlook direction and basis. A second internal checker tries to reproduce the classification from the cited evidence. Disagreement is recorded and resolved by the TULIP method owner; the original and revised values remain in the audit history.

Start with the original 20 nodes. Before scaling, inspect rank reversals under 30/70 and 70/30 people/nature weights, disagreements of one level on every axis, single-domain caps, overlapping causal chains and the longest uncertainty ranges. Adjust the rubric only by issuing a new version and rescoring the entire pilot. Catalogue membership never changes an anchor.

After internal consistency and the numerical pilot are complete, outside reviewers challenge the already-defined method and reproduce selected cases. They may recommend changes, but they do not originate TULIP's values or quietly replace its product choices.
