# TULIP Risk Assessment v4: scientific method proposal

Status: proposal for external review · Date: 2026-09-11 · Scope: replacement for the current cross-domain TULIP Urgency score

## Decision

TULIP should retire the claim that one decimal number from 1 to 10 is an objective scientific measure of urgency.

The observations can be factual. The source methods can be scientific. A universal total is not value-free, because it requires TULIP to decide how much one kind of harm is worth relative to another. No scientific framework supplies a value-free universal conversion between a planetary-boundary position, a human DALY, ecosystem collapse risk, and loss of an essential service. Indicator selection, normalization, weighting, missing-data treatment, and aggregation all change the answer; equal weights are still weights.[^1] External scientific frameworks can also embed choices about endpoints, horizons, reference populations, precaution, and acceptable risk. Citing them makes those choices traceable; it does not make them value-free. IPBES likewise treats values of nature as plural and explicitly accommodates different disciplines, stakeholders, and knowledge systems rather than assuming one universal exchange rate.[^12]

The defensible replacement has three visibly separate layers:

1. **Evidence receipts:** traceable observations or model results that pass a scientific-admissibility review.
2. **Framework-based findings:** results in the units and categories of the applicable external framework, labeled by assessment class and by whether the source published the finding, TULIP reproduced it, or TULIP applied the external rule.
3. **TULIP governance:** optional product alerts or priorities, explicitly labeled as TULIP policy rather than objective science.

The primary product should therefore be a **TULIP Evidence and Risk Profile**, not a weighted score. A short headline may use a source-published classification, a clearly labeled TULIP reproduction/application of a framework-native rule, or a factual statement such as **The reported estimate is above the named reference**. Name the observation, reference type, comparison rule, place, period, finding origin, and uncertainty. A source-published classification may be displayed exactly as published while retaining its uncertainty or category range. When TULIP reproduces or applies a rule, it may report one category only when the comparison is compatible and the framework’s applicable uncertainty treatment resolves a single category. Otherwise show only the estimate/reference relation and state that uncertainty is not quantified, or show a possible status range. This does not rank unlike harms.

### What “objective” means here

No empirical result is assumption-free. For TULIP, an evidence-based result must mean that the construct, unit, source, inclusion rule, transformation, comparator, direction, scope, and uncertainty are explicit and testable; the method is fixed before the result is inspected; and another qualified analyst can reproduce it from the same inputs. Any scientific classifier or causal response model must be valid for that exact construct and application domain. If those conditions cannot be met, TULIP reports the observation without a risk class or assigns the TULIP evidence status **Insufficient Evidence**. It does not fill the gap with an expert rating, a neighboring issue’s score, or a TULIP-created anchor.

## What this changes

The current score should not be repaired by changing the weights or adding more generic vectors. It has a construct-validity problem before it has a weighting problem.

The current calculation is implemented in `src/tulip-urgency-v2.js`. Including component clamping, composite clamping, and one-decimal display rounding, it is:

\[
C_{current}=\operatorname{clamp}_{0,1}(0.30\operatorname{clamp}_{0,1}(M)+0.30\operatorname{clamp}_{0,1}(T)+0.25\operatorname{clamp}_{0,1}(P)+0.15\operatorname{clamp}_{0,1}(E))
\]

for current-data receipts, and:

\[
C_{impact}=\operatorname{clamp}_{0,1}(0.35\operatorname{clamp}_{0,1}(B)+0.30\operatorname{clamp}_{0,1}(H)+0.20\operatorname{clamp}_{0,1}(R)+0.15\operatorname{clamp}_{0,1}(E)).
\]

The displayed value for either route is:

\[
S=\operatorname{round}_{0.1}(1+9C).
\]

The modeled route uses \(S=\operatorname{round}_{0.1}(1+9\operatorname{clamp}_{0,1}(m))\), where \(m\) is the supplied modeled estimate. Version 3 retains the version 2 calculation and changes the display bands and assurance metadata; `src/tulip-urgency-v3.js` declares `tulip_urgency_v2` as its calculation version.

A registry-wide audit of `public/tulip-urgency-v3-scores.json` found:

- There are 354 issue-node receipts: 96 `current_data`, 208 `impact_fallback`, and 50 `modeled`.
- `magnitude` and `threshold` together carry 60% of the nominal current-data weight. Some receipts duplicate or relabel one raw signal; temperature, methane, and CO₂ use the same scalar observation, source, unit, and anchors for both fields.
- In 77 of the 96 current-data receipts, the normalized `magnitude` and `threshold` values are exactly equal. Across all 96, their Pearson correlation is 0.934.
- `extent` equals 1.0 in 79 of the 96 current-data receipts and 110 of the 208 impact-fallback receipts. It often records observation or reporting coverage, not the share of a receptor actually affected.
- Most current-data threshold records rely on historical distributions or otherwise note the absence of a recognized threshold, although the public footer describes this input as distance to a documented danger point.
- All 354 top-level uncertainty fields are unstructured free-text strings, and the generic composite neither consumes them nor outputs an uncertainty interval. Some exporters use a conservative uncertainty endpoint or lower-bound input to form a point component, but there is no general interval/distribution or dependence propagation to the final score. One-decimal precision is therefore not backed by a propagated score interval.
- Mean published receipt values differ materially by route: 6.16 for current data, 8.53 for impact fallback, and 7.57 for modeled receipts. Node selection contributes to that difference, but the routes also measure different constructs with different formulas, so their common scale has not been demonstrated.
- Version 3 changed zero numerical scores but changed 274 of 354 band labels. The seven version 3 bands have no external empirical calibration in the implementation.
- None of the 50 TULIP-modeled receipts has operational source lineage; the model assurance file describes the factors as expert-authored assumptions and the model as not externally validated.
- The repository correctly states that external domain review and independent reproduction are still pending in `docs/tulip-scientific-validation-protocol.md` and `docs/tulip-urgency-v3-public-rollout.md`.

Concrete examples show why correct arithmetic is not enough:

- `temp` uses the same 1.43 °C observation and the same four anchors for both magnitude and threshold. Its extent value of 1 means global observation coverage. Its so-called momentum input is a separate monthly anomaly against a different reference period, not an estimated rate of change.
- `deforestation` labels net forest-loss rate as human/economic burden, loss per decade as persistence, and global assessment coverage as extent.
- `industry_farming` labels commodity demand as human/economic burden, drained-organic-soil area as persistence, and FAOSTAT geography coverage as extent.
- `food` uses demand and demand growth as impact and persistence measures even though its own uncertainty note says apparent demand does not directly measure nutrition, waste, or affordability.
- `air_pollution_health_burden` uses the same 99% guideline-exposure figure as both biophysical burden and extent, while an interval between report years stands in for persistence.
- `oceanic_upwelling_disruptions` is produced from other TULIP scores plus hand-rated persistence, reach, and causal-role factors. That is a TULIP analogy, not an independently validated scientific model of upwelling disruption.

These records may contain reusable source facts. Their current totals should not be grandfathered into the new method.

### Why the four vectors cannot be made universal

| Current vector | Factual form worth keeping | Why it is not a universal score component |
| --- | --- | --- |
| Magnitude | a defined observation or estimate in its native unit | °C, hectares, people, DALYs, and dollars have no value-free common 0–1 scale; TULIP-selected anchors create the conversion rather than discover it |
| Threshold proximity | an observation compared with a compatible, typed external reference | it is usually derived from magnitude rather than independent evidence; scientific, legal, policy, historical, and distributional references mean different things |
| Momentum | a specified trend, rate, acceleration, or forecast in native units per time | the estimator, window, baseline, and horizon matter; trend may already be an input to an endpoint forecast and does not have one universal relation to harm |
| Extent | the affected share of a defined receptor, area, or population | dataset coverage is not affected extent, and actual extent is often already embedded in an attributable count, rate, or burden model |

The factual versions survive as evidence, comparison status, or context. They do not receive fixed weights and are not added together.

## The construct TULIP can defend

TULIP must stop assigning one causal role to a broad topic. A node such as deforestation can be a pressure, a measured loss of ecosystem extent, a contributor to climate forcing, and a cause of health or livelihood outcomes. Those are different claims.

The atomic unit of assessment is:

> **phenomenon × causal role × geography × observation period**, plus a **receptor** when the claim concerns exposure, condition, or harm, a **scenario/horizon** for projections, and a **counterfactual** for attributable causal claims

Receptor, scenario, horizon, and counterfactual remain null when they do not apply; they must never be supplied merely to make a schema look complete.

Examples of valid atomic claims are:

- annual gross loss of a defined forest type in a named geography;
- population exposure to a defined PM2.5 concentration distribution in a stated year;
- deaths or DALYs attributable to that exposure under a named comparative-risk method;
- probability that a defined ecosystem reaches its stated collapse endpoint within 50 years.

“Industrial farming is 8.2” is not an atomic scientific claim.

Every atomic receipt must declare its causal role. The minimum useful ontology is adapted from established pressure–state–impact frameworks:[^2]

- **Driver:** an activity or demand that can generate pressure.
- **Pressure:** an emission, extraction, land conversion, disturbance, or other direct load.
- **State:** a measured environmental condition.
- **Hazard:** a process or event capable of producing harm.
- **Exposure:** a receptor present in the affected place and time.
- **Impact or outcome:** attributable realized or expected harm.
- **Response:** an intervention; responses do not receive environmental-risk scores.

Receipts from different causal stages may be linked in TULIP’s graph, but they must not be added as independent components. OECD environmental-indicator guidance distinguishes pressures, environmental state, and responses, and warns that an indicator set must be chosen for a defined purpose rather than treated as universally interchangeable.[^2]

## The replacement for the four current vectors

There is no fixed four-vector replacement. Use the smallest nonredundant set of **assessment modules** that applies to the atomic claim. Each module keeps its own construct, units, reference rules, eligibility criteria, and uncertainty convention. Adding an extra applicable module creates another visible result; it does not add points.

### 0. Descriptive causal-stage evidence

Drivers, pressures, environmental states, hazards, and exposures may be important facts even when no endpoint-risk assessment exists. Report them in their native units and causal stage. They receive no endpoint-risk category unless an eligible external framework directly classifies that exact construct.

Examples include tonnes of emissions per year, hectares converted, pollutant concentration, material throughput, people exposed, and a source-defined climate index. TULIP may compare such a value with a legal limit, policy target, historical baseline, or distribution, but it must label the comparison class and must not translate unusualness or target performance into scientific harm.

### 1. Earth-system guardrails

Report the current value of the exact control variable, its reference condition, externally published boundary or risk zone, spatial scale, and uncertainty.

This module is eligible only when the atomic claim matches a defined control variable. The planetary-boundaries framework, for example, normalizes process-specific control variables around a Holocene reference and a precautionary boundary, but those boundaries are not generic scales for local or unrelated issue nodes.[^3]

Required outputs include:

- raw control-variable value and unit;
- reference state and reference type;
- published boundary and any published increasing/high-risk zone;
- framework-native status or zone and the finding’s origin;
- measurement and threshold uncertainty;
- assessment date and global or regional scope.

### 2. Human-health burden

Report attributable deaths, years of life lost (YLLs), years lived with disability (YLDs), DALYs, and population rates when an accepted causal method supports them. DALYs equal YLLs plus YLDs, and deaths overlap with the fatal component, so none of these may be added without first defining a non-overlapping estimand. Label crude per-capita rates separately from age-standardized rates.

WHO comparative risk assessment combines population exposure, an exposure-response relationship, a counterfactual exposure distribution, and background disease burden to estimate a population-attributable fraction and resulting deaths or DALYs.[^4]

Required outputs include:

- exposure distribution and population denominator;
- outcome and counterfactual;
- exposure-response function and provenance;
- attributable burden in native units and per-population rate;
- uncertainty interval and dependence assumptions;
- assessment year, geography, age/sex coverage where relevant.

### 3. Ecosystem burden

Report loss of ecosystem extent, condition relative to a documented ecosystem-specific reference, disruption of composition/structure/function, or probability/category of a defined collapse endpoint.

SEEA Ecosystem Accounting separates ecosystem extent from ecosystem condition, defines extent spatially, and requires ecosystem-type-specific characteristics and reference levels for condition indicators.[^5] The IUCN Red List of Ecosystems uses five rule-based criteria for a defined ecosystem unit and explicitly supports Data Deficient and Not Evaluated states. Within that native framework, the overall category is the highest risk category obtained through any assessed criterion.[^6]

Required outputs include:

- precisely defined ecosystem type and assessment area;
- spatial extent and change over a stated interval;
- condition variables and reference levels;
- collapse endpoint if collapse risk is claimed;
- native SEEA indicator or IUCN category/probability;
- plausible bounds or numerical uncertainty.

### 4. Population disruption

Report distinct people affected, evacuated, displaced, or otherwise disrupted. Define the event, person-counting unit, population denominator, deduplication rule, geography, and period. A count of displacement movements is not automatically a count of unique people.

### 5. Essential-service disruption

Report the service, affected users, duration, severity, and denominator. Useful endpoints include person-hours without potable water, customer-hours without electricity, or bed-days of unavailable care. Do not combine different services until a native service-reliability framework supplies a common outcome.

### 6. Physical-asset loss

Report units damaged, replacement quantity, or share of a clearly defined asset stock. Preserve asset class, damage state, geography, event or horizon, and valuation basis if a monetary companion estimate is shown.

### 7. Economic loss

Report direct and indirect loss separately, in constant currency with price base, exchange-rate method, geography, and period. Economic loss does not include an implicit monetary value for deaths, health, ecosystems, or culture unless a separate, explicit valuation study is presented in the governance layer.

### 8. Disaster risk

Report a framework-native risk result such as average annual loss or return-period loss from a validated hazard, exposure, and vulnerability model. State whether the source published the result or TULIP reproduced/applied the external method. Do not add that output to the same model’s hazard, exposure, vulnerability, or asset-loss inputs.

UNDRR treats quantitative risk as the interaction of hazard, exposure, and vulnerability/capacity for a defined area and period.[^7] TULIP must not silently convert a life, an ecosystem, and a dollar into one common value.

New modules may be added only with a defined construct, native method, source hierarchy, uncertainty rule, and comparison key. Calling several unlike outcomes one burden would recreate the current construct problem at a different level.

## Supporting facts, not extra weighted vectors

The following fields are useful, but they are not automatically independent harms:

- **Trajectory:** a source-published or preregistered, method-validated trend estimate in native units per time, with estimator, window, diagnostics, and interval.
- **Threshold-crossing outlook:** probability of crossing a named threshold by a named horizon, from an independently validated model and scenario.
- **Persistence or reversibility:** recovery time, fraction remaining impaired after pressure removal, or a framework-defined irreversibility result.
- **Actual affected share:** the fraction of a defined receptor population or area beyond a defined condition—not dataset coverage.
- **Measurement basis:** observed, derived, estimated, or modeled.
- **Inference status:** descriptive or causally attributed.
- **Temporal status:** historical, current, or projected, with any scenario named separately.

These fields may already be inputs to an endpoint result. Exposure may already be inside attributable DALYs; ecosystem extent decline may already determine an IUCN category; current level and trend may both determine a threshold-crossing probability. A derived or downstream value may be shown for explanation but cannot trigger a second independent result.

Adding more vectors does not create objectivity. It creates more researcher choices, more correlated inputs, and more opportunities for data-rich topics to look more severe.

## Scientific calculation contract

### Endpoint burden

When a validated causal risk model exists, a schematic expected-burden model for endpoint \(e\) over horizon \(T\) can be represented using a receptor-time exposure measure:

\[
B_e(T)=\int_{G\times[0,T]}\left[\int f_e(i,g,t;c)\,p(i\mid g,t)\,di\right]dR_e(g,t)
\]

where:

- \(p(i\mid g,t)\) is the conditional distribution of hazard or stressor intensity at place \(g\) and time \(t\);
- \(dR_e(g,t)\) is the receptor-time exposure measure over place and time, with units declared;
- \(f_e(i,g,t;c)\) is incremental endpoint loss per unit of receptor-time exposure relative to the declared counterfactual \(c\);
- \(B_e(T)\) is expected burden in the endpoint’s native unit.

This equation is a dimensional template, not a universal estimator. Health, ecosystem, and event-risk frameworks may prescribe different formulas, and those formulas control. Every implementation must show dimensional consistency and prove that exposure is not represented twice; an already aggregated receptor count cannot also be spatially or temporally integrated. A causal calculation is not an arithmetic average of hazard, exposure, trend, and persistence ratings. If the source publishes an accepted burden estimate directly, TULIP should reproduce that result rather than rebuild it with a different method.

### Reference status

Prefer source-published categories and classifiers. In general:

\[
L_j=h_j(X_j,T_j),
\]

where \(h_j\) is the source-prescribed classification algorithm. It may be multivariate, two-sided, nonnumeric, or nonnested. Only when a native framework uses ordered, nested, one-dimensional thresholds may a draw-level rule be written as:

\[
L_j^{(b)}=\max\left(\{0\}\cup\{k:d_jX_j^{(b)}\ge d_jT_{jk}^{(b)}\}\right),
\]

where \(d_j\) represents the adverse direction. If a source supplies only one threshold, apply only its framework-native status rule. Calculate a probability of exceedance only when the inputs and threshold have a justified probability model. A binary classification is allowed only when the source published it or the applicable external uncertainty rule resolves a compatible comparison. With an uncertain point estimate but no quantified uncertainty, state only that the **reported estimate** is above or below the reference and disclose that uncertainty is not quantified. If bounds overlap, show the possible status range. Do not invent three more anchors to fill a four-point interpolation.

A continuous transformation in the scientific layer is allowed only when the exact transformation is prescribed by the applicable external method. Any TULIP-authored normalization, curvature, clipping, anchor, or 1–10 remapping belongs in the governance layer, must retain the native result beside it, and cannot be used as scientific arithmetic or evidence. A linear distance between a favorable reference and a critical reference is not automatically a linear distance in harm.

### Reference types

Every reference must declare `reference_kind`:

- `physical_boundary`;
- `scientific_risk_threshold`;
- `health_guideline`;
- `ecological_reference_condition`;
- `legal_limit`;
- `policy_target`;
- `historical_baseline`;
- `distributional_reference`.

Every result must also declare `status_class`: `scientific_assessment`, `legal_compliance`, `policy_progress`, or `descriptive_baseline`. These labels are not interchangeable. Compliance with a statutory limit is a factual legal status, but the limit is not automatically a scientific harm threshold. A historical percentile measures unusualness, not danger. A policy target expresses a collective choice, not a physical discontinuity.

The reference record must include its value/category, unit, adverse direction, comparison operator, applicable receptor, geography, period, source locator and version, framework-native classifier, and uncertainty treatment. Before any status is calculated, the observation and reference must match in operational definition, unit, baseline/reference period, averaging statistic, receptor, spatial support, scenario, and measurement method. A mismatch is allowed only when an externally published, validated harmonization supplies the conversion and its uncertainty is propagated; otherwise no reference status is issued. Legal, policy, historical, and distributional comparisons receive their own accurately named status.

### Uncertainty

Estimated and modeled results must carry the framework-native or preregistered, method-validated quantitative uncertainty when it is estimable. Exact constants or complete counts may record `not_applicable` with a rationale. When an authoritative framework provides only plausible bounds or qualitative uncertainty, preserve that form; when it provides no quantification, record `not_quantified`. Never invent a distribution. Shared inputs and derived quantities must preserve their justified joint dependence structure—covariance when adequate, otherwise joint draws, a posterior, or another documented dependence model. Scenario-specific results remain separate unless an external method justifies scenario probabilities; scenario spread is not silently pooled into a probabilistic interval. The BIPM/JCGM measurement guide provides a foundation for measurement uncertainty and covariance, while its supplement covers Monte Carlo propagation; domain-native uncertainty rules still control.[^8]

The output should include:

- point estimate and its estimator type, such as source-published estimate, mean, median, or maximum-likelihood estimate;
- interval with its exact type—confidence, credible, prediction, tolerance, or plausible range—and its source-published or preregistered level;
- probability of each framework-native category only when inputs and thresholds have justified probability distributions or joint samples;
- measurement, sampling/parameter, and model-form uncertainty distinguished where possible;
- separate outputs for each scenario unless justified scenario probabilities exist;
- sensitivity to defensible alternative baselines, windows, and source choices.

Scientific confidence is separate. IPCC confidence concerns the type, amount, quality, consistency, and agreement of evidence; likelihood is a quantitative statement about probability.[^9] TULIP must not multiply a confidence label into harm or urgency.

### Dependence and double counting

Every assessment needs a causal and evidence dependency graph. Each observation receives a lineage ID. Every relationship between two displayed quantities requires a justified treatment as independent, shared-input, derived, or causally downstream; a label alone is not evidence of independence.

Release must fail when:

- one observation is counted as two independent criteria;
- reporting coverage is treated as affected extent;
- exposure and an attributable burden already containing that exposure are combined;
- deaths and DALYs for the same outcome are combined;
- a pressure, state change, and downstream impact are added outside a validated causal model estimating one declared endpoint;
- a redundant indicator increases aggregate influence without a construct-level aggregation rule or justified joint dependence/error model.

## Evidence-admission gate

An atomic receipt may display a scientific assessment finding only when all applicable requirements pass:

1. **Atomicity:** one phenomenon, causal role, geography, and period; receptor is required when the construct involves exposure, condition, or harm, scenario/horizon is required for projections or when the framework requires it, and a counterfactual is required for attributable causal claims.
2. **Module eligibility:** the assessed entity is within the external framework’s intended scope.
3. **Construct match:** every input directly measures the named construct or enters through a validated causal model.
4. **Stage consistency:** no unmodeled additive aggregation across driver, pressure, state, exposure, and outcome; cross-stage inputs may combine only through a validated causal model estimating one declared endpoint.
5. **Traceable provenance:** source, dataset/version, locator, retrieval date, and method are reproducible.
6. **Complete metadata:** raw value, unit, direction, denominator, geography, timestamp/window, and baseline are present.
7. **Source validity:** external origin alone is insufficient. The source hierarchy, method transparency, construct validity, data quality, standards or peer review, conflicts of interest, applicability domain, independent supporting evidence, and credible disagreements are reviewed.
8. **External reference:** any scientific-layer threshold, response function, or classifier comes from an eligible external framework, is versioned, and is labeled by reference and status class.
9. **Reference compatibility:** observation and reference match in construct definition, unit, baseline/reference period, averaging statistic, receptor, spatial support, scenario, and measurement method, or use an externally published, validated harmonization with propagated uncertainty.
10. **No TULIP scientific anchors:** a TULIP-created severity anchor or cross-domain exchange rate is prohibited from the scientific layer. It may appear only in the separately labeled governance layer.
11. **Causal attribution:** impact claims declare their counterfactual and accepted causal or exposure-response method.
12. **Uncertainty treatment:** the framework-native interval, distribution, bounded range, qualitative convention, or documented reason uncertainty is not quantified is present; TULIP does not manufacture a distribution or pool scenarios without justified probabilities.
13. **Dependence control:** lineage and the justified dependency graph or joint dependence model are present; reused observations are not independent evidence.
14. **Missingness:** no peer-score, graph-neighbor, popularity, relationship-count, source-count, or renamed-proxy imputation.
15. **Statistical-method validity:** every TULIP-authored estimator, trend method, uncertainty/dependence model, or permitted imputation method documents its assumptions, diagnostics, failure conditions, applicability domain, and independent statistical-method review; preregistration alone is not validation.
16. **Model validity:** a modeled result identifies model, version, scenario, validation domain, calibration evidence, prediction uncertainty, and independent validation on data and conditions relevant to the application domain.
17. **Conflict handling:** credible conflicting estimates remain visible and follow a preregistered source-selection rule.
18. **Reference-set declaration:** each atomic assessment/module has a versioned, predeclared mandatory reference set for its stated purpose; assessed, missing, and inapplicable references are disclosed, and adding a redundant or optional indicator cannot silently change the finding.
19. **Comparability key:** ranking is possible only within one versioned comparison group whose endpoint definition, unit, denominator, standard population, spatial support, horizon, scenario, method version, uncertainty convention, construct equivalence, measurement invariance, and data-quality requirements pass.
20. **Independent reproduction:** another implementation recreates the receipt and framework-based finding from source inputs.

UN statistical-quality guidance reinforces the need for accuracy, reliability, timeliness, coherence, comparability, accessible metadata, and clarity.[^10] The UN SDG metadata model similarly expects exact definitions, methods, units, sources, coverage, validation, missing-data treatment, aggregation, and limitations.[^11]

If the gate does not pass, the result is not estimated from a neighboring node. The receipt records every failed gate and one or more explicit reason codes:

- **Insufficient Evidence:** the source and method could be eligible, but a required observation, denominator, uncertainty input, or other evidence item is absent or inadequate.
- **Reference Incompatible:** the observation and proposed reference do not match and no eligible harmonization resolves the mismatch; the observation may still be displayed without that reference status.
- **Method Ineligible:** the construct, source, estimator, classifier, or model fails its applicability or validity requirements.
- **Validation Pending:** the candidate method/evidence is present, but required review, independent validation, or reproduction is unfinished.
- **Indeterminate:** evidence definitions or credible sources conflict and cannot be synthesized under the preregistered method. Ordinary threshold overlap is reported as a probability or plausible category range when the native uncertainty method supports one.
- **Not Applicable:** the module does not apply to this atomic claim.
- **Not Evaluated:** the assessment has not yet been performed.

These are TULIP evidence/validation statuses, not scientific risk categories, and multiple failure reasons may coexist. If an external framework itself uses a category such as IUCN `Data Deficient`, preserve that native label separately with its finding origin. None of the TULIP statuses receives a number, green color, rank, or fallback score. Absence of evidence is not low risk.

## What the headline can and cannot be

### Recommended primary display

Show all applicable framework-based findings in a compact profile:

| Module | Example output form |
| --- | --- |
| Earth-system | control variable, boundary/risk zone, source, interval |
| Human health | attributable DALYs and rate, method, interval |
| Ecosystem | extent/condition result or IUCN category, plausible bounds |
| Population disruption | unique people affected or displaced, denominator and period |
| Essential service | affected users and service-hours lost |
| Physical assets | units or share of a defined asset stock damaged |
| Economic loss | direct or indirect loss in stated constant currency |
| Disaster risk | AAL or return-period loss from a validated framework-native model |

For a consistent interface, every result card can answer the same four questions:

1. **What is the result?** The observed or estimated value/category in the framework’s unit.
2. **Compared with what?** The exact compatible external reference or rule, if one applies.
3. **Who, where, and when?** The receptor, geography, observation period, horizon, and scenario that apply.
4. **How was it established?** The source, method, finding origin, uncertainty/status range, and evidence-gate state.

These are explanation fields, not weighted vectors. They tell the reader how the result was reached and are never averaged together.

Comparisons and rankings are allowed only within the same versioned `comparison_group_id` after validated construct equivalence or measurement invariance and comparable data quality are demonstrated. The group record must publish its definition, rationale, version, and review. Endpoint definition, unit, denominator, standard population, spatial support, horizon, scenario, method version, and uncertainty convention must match. For uncertain estimates, show rank probabilities/ranges or `not distinguishable`; do not infer an exact order from point estimates alone. Production sorting must fail across different group IDs.

### Auditable observation-to-reference statement

Across unlike modules, TULIP may report the observation/reference relation without converting it into common severity:

> **Reported estimate: [value or range] is [above/below/within] [named reference].**
>
> Scope: [receptor/place/period], under [method/version]. Uncertainty: [interval, possible status range, or not quantified].

This statement is only about the reported estimate and is conditional on the named measurement, method, and compatible reference; it is not a value-free risk score. The reference must include adverse direction and comparison operator. If a justified probability model exists, report the estimated probability of exceedance. If bounds overlap the reference, show the possible status range. Reserve “crossed between [date 1] and [date 2]” for a compatible time series that establishes a transition. Use `Indeterminate` only when conflicting definitions or evidence cannot be synthesized under the preregistered method.

Preserve whether a framework-based finding describes a condition, hazard, exposure, burden, risk, compliance result, policy-progress result, or descriptive comparison. Legal limits, policy targets, historical baselines, and distributional references receive accurately named legal, policy, or descriptive statuses. A named reference may be reported as not exceeded once that reference has been assessed; the aggregate statement “no mandatory reference was exceeded” requires every mandatory reference to be assessed.

Choosing to elevate any finding into a product alert is a TULIP governance decision, not a scientific output. Every alert needs a published governance-policy ID, version, eligibility basis, and exact decision rule while the framework-based finding remains visible separately. A versioned, predeclared reference set limits post-hoc selection but cannot eliminate unequal monitoring density or unequal numbers of eligible native criteria. TULIP must disclose assessed, missing, and inapplicable references and must not sort or color cross-domain severity from the presence or count of findings or alerts.

### When a native highest-category rule is allowed

A maximum rule is permitted only inside a framework that defines comparable criteria and prescribes that rule. IUCN Red List of Ecosystems is one example: its overall ecosystem status follows the highest risk category reached by any assessed IUCN criterion.[^6] TULIP can inherit that native result; it must not extend the rule across WHO, IUCN, planetary-boundary, and infrastructure results.

### Conditions for any future numeric score

A decimal or continuous number is defensible only if all nodes being compared share:

- one defined endpoint;
- one `comparison_group_id` with compatible units, denominator, standard population, geography, horizon, scenario, method version, and uncertainty convention;
- an empirically validated measurement model converting inputs to that endpoint;
- inputs combined through a validated model estimating one endpoint, without double counting;
- framework-native or preregistered uncertainty and the full justified dependence structure propagated;
- held-out calibration and discrimination for predictive or probabilistic models;
- construct, convergent, discriminant, and criterion validity appropriate to a descriptive estimand;
- suppression when mandatory inputs are missing;
- published sensitivity results and, if a pass/fail robustness gate is used, a preregistered decision-specific robustness criterion.

If those conditions hold, the number should remain in the endpoint’s meaningful native unit whenever possible. A source-prescribed scale may be shown as part of its framework. Any TULIP-authored 1–10 remapping is a governance display, not a scientific result, and cannot justify arithmetic or ranking across groups.

If TULIP deliberately creates cross-domain weights or exchange rates, the result may be a useful **TULIP Priority Index**. It must be labeled as a governance instrument, publish its value judgments, and never be called an objective scientific score.

## Representative migration results

| Existing node | Facts that may survive review | What is retired | Provisional v4 state |
| --- | --- | --- | --- |
| `temp` | annual temperature anomaly and its source-native reference period | duplicated magnitude/threshold, hand anchors, coverage-as-extent, 7.3 total | observation can remain; current threshold comparison is Reference Incompatible until period compatibility and uncertainty treatment pass |
| `deforestation` | gross and net forest-area change in hectares/year | human-burden and persistence labels, reporting extent, 7.7 total | pressure/extent receipts; downstream impacts require separate attribution |
| `industry_farming` | specific emissions, land, input, or exposure observations after pathway decomposition | broad-node 8.2, commodity-demand-as-harm, coverage-as-extent | broad total is Method Ineligible; split pathways can be assessed separately |
| `food` | source-defined production, demand, nutrition, waste, affordability, or footprint metrics when separately defined | demand-growth-as-urgency, 9.3 total | broad total is Method Ineligible; defined constructs can be assessed separately |
| `air_pollution_health_burden` | WHO guideline exposure and the current snapshot’s joint ambient-and-household attributable-death estimate, kept as separate linked facts | duplicated 99% exposure, report-span persistence, 9.1 blend | human-health module pending numerical uncertainty; add DALYs only from a separately audited source |
| `oceanic_upwelling_disruptions` | direct observations or outputs of a validated upwelling model, if obtained | peer-score average, hand-rated factors, 8.1 estimate | Insufficient Evidence until an eligible assessment exists |

Migration should mark all 354 current values as `legacy_noncomparable` and reassess them. This does not mean all underlying sources are unusable; it means no old composite is accepted without passing the new gate. The 50 TULIP peer-modeled receipts should lose their numeric headline immediately under the new rule.

## Validation and release contract

Before a v4 result appears in production:

1. Publish the construct, atomic assessment unit, module eligibility, and exclusion rules.
2. Preregister the exact source-selection, trend, baseline, threshold, counterfactual, uncertainty, and revision methods.
3. Obtain independent statistical-method review of every TULIP-authored estimator, trend, uncertainty/dependence model, or permitted imputation method, including assumptions, diagnostics, failure conditions, and application domain.
4. Apply the source-validity review: method transparency, construct validity, data quality, review status, conflicts, applicability domain, independent evidence, and source conflicts.
5. Obtain independent domain review of every endpoint, denominator, reference, direction, and applicability decision.
6. Have independent reviewers—blinded to prior TULIP decisions and one another’s decisions, but not to source identity when assessing source quality—classify node decomposition, causal role, module eligibility, reference selection, and source inclusion; publish agreement statistics and adjudication. Agreement measures reproducibility of these judgments, not their validity.
7. Reproduce source-to-result calculations and framework-based classifications independently.
8. Test convergent validity against independent established assessments that did not supply the inputs.
9. Test discriminant validity against popularity, graph degree, reporting coverage, source volume, and intervention feasibility.
10. Backtest predictive models on held-out outcomes for calibration and discrimination.
11. Verify that redundant or optional indicators cannot change a reference statement merely by being added.
12. Preserve frozen source snapshots and test revision stability.
13. Run sensitivity analysis over source inclusion, measurement error, dependence structure, threshold uncertainty, trend window, horizon, model, and missing-data choices.
14. Enforce the comparison-group key in every ranking and sort path.
15. Publish failed gates, reason codes, category ranges, unassessed criteria, coverage limits, and material revisions.

The OECD/JRC handbook treats uncertainty and sensitivity analysis as necessary for understanding how subjective modeling choices shape a composite result.[^1] TULIP’s existing computational hashes and replay checks remain useful, but they prove reproducibility of the encoded method, not construct validity or scientific truth.

## Receipt contract

Every result should expose at least this machine-readable structure:

```json
{
  "assessment_id": "stable versioned id",
  "node_id": "display node",
  "atomic_claim": {
    "phenomenon": "...",
    "causal_role": "driver|pressure|state|hazard|exposure|impact|response",
    "receptor": null,
    "geography": { "definition": "...", "spatial_support": "..." },
    "observation_period": { "start": "...", "end": "..." },
    "horizon": null,
    "scenario": null,
    "counterfactual": null
  },
  "evidence": [
    {
      "evidence_id": "stable observation or model-output id",
      "construct": "...",
      "role": "primary_observation|model_input|denominator|counterfactual|supporting_context",
      "value": null,
      "unit": "...",
      "denominator": "...",
      "geography": "...",
      "period": { "start": "...", "end": "..." },
      "measurement_method": "...",
      "source": {
        "organization": "...",
        "title": "...",
        "dataset_id": "...",
        "version": "...",
        "locator": "...",
        "published_at": "...",
        "retrieved_at": "...",
        "snapshot_hash": "..."
      },
      "uncertainty_components": [
        {
          "type": "measurement|sampling|parameter|model_form|other",
          "representation": "...",
          "level": null,
          "low": null,
          "high": null,
          "method": "..."
        }
      ]
    }
  ],
  "assessment_module": "descriptive_evidence|earth_system|human_health|ecosystem|population_disruption|essential_service|physical_asset|economic_loss|disaster_risk",
  "finding_origin": "source_published|tulip_reproduction|tulip_application_of_external_rule",
  "assessor": { "organization": "...", "name": "...", "version": "..." },
  "finding_type": "condition|hazard|exposure|burden|risk|compliance|progress|descriptive",
  "status_class": "scientific_assessment|legal_compliance|policy_progress|descriptive_baseline",
  "comparison_group": {
    "id": null,
    "version": null,
    "rationale": null,
    "review_ref": null,
    "construct_equivalence_evidence": null,
    "measurement_invariance_evidence": null,
    "data_quality_rule": null
  },
  "result": {
    "finding_id": "...",
    "evidence_ids": ["..."],
    "estimate": null,
    "estimator": "source_published_estimate",
    "unit": "...",
    "denominator": { "value": null, "unit": "...", "definition": "..." },
    "native_category": null,
    "category_range": { "low": null, "high": null },
    "category_probabilities": [],
    "uncertainty_components": [
      {
        "type": "measurement|sampling|parameter|model_form|other",
        "representation": "confidence_interval|credible_interval|prediction_interval|tolerance_interval|plausible_range|qualitative|not_quantified|not_applicable",
        "level": null,
        "low": null,
        "high": null,
        "method": "...",
        "source": "..."
      }
    ]
  },
  "references": [
    {
      "reference_id": "...",
      "mandatory": true,
      "assessment_status": "assessed|missing|not_applicable",
      "estimate": null,
      "category": null,
      "unit": "...",
      "kind": "scientific_risk_threshold",
      "status_class": "scientific_assessment",
      "adverse_direction": "higher|lower|two_sided|source_defined",
      "operator": "greater_than|greater_than_or_equal|less_than|less_than_or_equal|source_defined",
      "receptor": "...",
      "geography": "...",
      "period": "...",
      "native_status_eligible": false,
      "compatibility": {
        "status": "matched|validated_harmonization|incompatible|not_evaluated",
        "dimensions": {
          "construct_definition": "...",
          "unit": "...",
          "baseline_or_reference_period": "...",
          "averaging_statistic": "...",
          "receptor": "...",
          "spatial_support": "...",
          "scenario": "...",
          "measurement_method": "..."
        },
        "harmonization_method_ref": null,
        "harmonization_uncertainty_ref": null
      },
      "uncertainty_components": [
        {
          "type": "measurement|parameter|model_form|other",
          "representation": "...",
          "level": null,
          "low": null,
          "high": null,
          "method": "..."
        }
      ],
      "source": {
        "organization": "...",
        "title": "...",
        "locator": "...",
        "version": "...",
        "published_at": "..."
      },
      "classifier": {
        "method_id": "...",
        "version": "...",
        "executable_ref": "...",
        "hash": "..."
      }
    }
  ],
  "method": {
    "source_method": "...",
    "model": {
      "name": "...",
      "version": "...",
      "scenario": "...",
      "validation_domain": "...",
      "calibration_evidence": "...",
      "independent_validation": {
        "team": "...",
        "held_out_data": "...",
        "performance_criteria": "...",
        "result": "...",
        "applicability_domain": "...",
        "source": "..."
      }
    },
    "transformation": {
      "executable_ref": "...",
      "hash": "..."
    },
    "statistical_method_review": {
      "status": "pass|conditional|fail|pending|not_applicable",
      "reviewer": "...",
      "assumptions_ref": "...",
      "diagnostics_ref": "...",
      "failure_conditions_ref": "...",
      "applicability_domain": "...",
      "reviewed_at": "..."
    },
    "lineage_ids": ["..."],
    "dependency_model_ref": null,
    "dependency_edges": [
      {
        "from_evidence_id": "...",
        "to_evidence_id": "...",
        "relationship": "shared_input|derived_from|covariance|joint_samples|posterior|other",
        "parameter_ref": null,
        "justification": "..."
      }
    ]
  },
  "context": {
    "trajectory": {
      "estimate": null,
      "estimator": "...",
      "unit": "... per year",
      "observation_window": "...",
      "uncertainty_components": [],
      "source": "..."
    },
    "threshold_crossing": {
      "estimate": null,
      "unit": "probability",
      "horizon": "...",
      "scenario": "...",
      "uncertainty_components": [],
      "source": "..."
    },
    "persistence_or_recovery": {
      "estimate": null,
      "estimator": "...",
      "unit": "...",
      "counterfactual": "...",
      "uncertainty_components": [],
      "source": "..."
    },
    "measurement_basis": "observed|derived|estimated|modeled",
    "inference_status": "descriptive|causally_attributed",
    "temporal_status": "historical|current|projected",
    "scenario_status": "observed_conditions|named_scenario|not_applicable"
  },
  "governance": {
    "alert": {
      "policy_id": null,
      "policy_version": null,
      "decision": "not_evaluated|show|do_not_show",
      "finding_id": null,
      "eligibility_basis": null,
      "decision_rule_hash": null
    },
    "priority_index": null
  },
  "quality": {
    "gate_statuses": ["pass|insufficient_evidence|reference_incompatible|method_ineligible|validation_pending|indeterminate|not_applicable|not_evaluated"],
    "failed_gate_ids": [],
    "status_reasons": [],
    "reference_set": {
      "id": "...",
      "version": "...",
      "purpose": "...",
      "required_reference_ids": ["..."],
      "assessments": [
        { "reference_id": "...", "status": "assessed|missing|not_applicable", "reason": "..." }
      ]
    },
    "source_validity": [
      {
        "criterion": "method_transparency|construct_validity|data_quality|review_status|conflicts|applicability|independent_support",
        "status": "pass|conditional|fail|unresolved",
        "evidence": "...",
        "reviewer": "...",
        "reviewed_at": "..."
      }
    ],
    "limitations": ["..."],
    "independent_review": "...",
    "independent_reproduction": "..."
  }
}
```

Context fields that do not pass their native contract remain `null`; they are never filled with peer scores or prose ratings.

## Dead-simple footer copy

### Short version

> **How TULIP reaches a result**
>
> TULIP does not combine unlike harms into one scientific score. Each result shows what was measured, where and when, the source, and any published rule used to interpret it. Different harms stay separate. If TULIP cannot support a result, it says why instead of guessing. Any TULIP priority or alert shown beside the result is a published product policy, not part of the scientific assessment.

### Three-step expanded version

> **1. Define the exact claim.**
>
> TULIP states exactly what is being measured, who or what it affects, where, when, and what it is compared with.
>
> **2. Check real evidence.**
>
> TULIP checks that the source and method fit the question. When a published scientific rule applies, TULIP uses that rule. It does not invent cutoffs or borrow scores from similar issues.
>
> **3. Show the result honestly.**
>
> TULIP shows the result in the unit the source uses, with uncertainty or a possible status range. Any classification names the external rule applied, whether the source published the result or TULIP calculated it. If a result cannot be supported, TULIP says why. Any separate TULIP priority or alert is labeled as product policy.

### One-sentence explanation of the old score

> The previous 1–10 score blended unlike measurements using TULIP-selected anchors and weights; it is being replaced because that blend could be reproducible without being objectively scientific.

## Product decisions required

1. Retire the universal decimal 1–10 score, or relabel it as a TULIP policy index with explicit governance.
2. Use the framework-based evidence and risk profile as the primary display.
3. Treat every product badge or alert as a versioned TULIP governance policy; keep the framework-based finding visible and do not turn the badge into a universal severity rank.
4. Split broad nodes into atomic receipts while preserving the graph for causal navigation.
5. Treat explicit TULIP evidence/validation reason codes—such as `Insufficient Evidence`, `Reference Incompatible`, `Method Ineligible`, `Validation Pending`, `Indeterminate`, `Not Applicable`, and `Not Evaluated`—as first-class states while preserving any source-published missing-data category separately.
6. Require external domain review and independent reproduction before using “scientifically validated.”

The central rule is simple:

> **Facts belong in receipts. Classifications remain conditional on their cited framework and disclosed assumptions. TULIP-created trade-offs, alerts, and priorities belong in the governance layer.**

## Sources

[^1]: OECD, European Union, and European Commission Joint Research Centre, *Handbook on Constructing Composite Indicators: Methodology and User Guide* (2008), especially the sections on indicator selection, normalization, weighting, aggregation, missing data, and uncertainty/sensitivity analysis. <https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators-methodology-and-user-guide_9789264043466-en.html>

[^2]: OECD, “OECD approach to environmental indicators,” including the pressure–state–response framework and the criteria of policy relevance, analytical soundness, and measurability. <https://www.oecd.org/en/publications/monitoring-progress-towards-a-resource-efficient-and-circular-economy_3b644b83-en/full-report/component-14.html>

[^3]: Richardson, K. et al., “Earth beyond six of nine planetary boundaries,” *Science Advances* 9 (2023), eadh2458. <https://pmc.ncbi.nlm.nih.gov/articles/PMC10499318/>

[^4]: World Health Organization, “Methods for estimating health impacts: Comparative Risk Assessment,” and *Assessing the Environmental Burden of Disease at National and Local Levels*. <https://www.who.int/teams/environment-climate-change-and-health/monitoring/methods> and <https://www.who.int/publications/i/item/9241546204>

[^5]: United Nations System of Environmental Economic Accounting, *Ecosystem Accounting* and its extent/condition methodology. <https://seea.un.org/en/methodology/ecosystem-accounting> and <https://seea.un.org/en/content/selection-criteria-ecosystem-condition-indicators>

[^6]: IUCN, *Guidelines for the Application of IUCN Red List of Ecosystems Categories and Criteria*, version 2.0 (2024), including the five criteria, highest-native-risk rule, uncertainty treatment, Data Deficient, and Not Evaluated categories. <https://portals.iucn.org/library/sites/library/files/documents/2024-021-En.pdf>

[^7]: United Nations Office for Disaster Risk Reduction, Sendai Framework terminology for exposure and disaster risk. <https://www.undrr.org/terminology/exposure> and <https://www.undrr.org/terminology/disaster-risk>

[^8]: Joint Committee for Guides in Metrology, *Evaluation of Measurement Data—Guide to the Expression of Uncertainty in Measurement* (JCGM 100:2008) and Supplement 1 on Monte Carlo propagation (JCGM 101:2008). <https://www.bipm.org/en/committees/jc/jcgm/publications>

[^9]: Intergovernmental Panel on Climate Change, AR6 WGII glossary definitions of risk, exposure, vulnerability, confidence, likelihood, and uncertainty; AR6 WGI Chapter 1 uncertainty framework. <https://www.ipcc.ch/report/ar6/wg2/chapter/annex-ii/> and <https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-1/>

[^10]: United Nations Statistics Division, *United Nations National Quality Assurance Frameworks Manual for Official Statistics* (2019). <https://unstats.un.org/UNSDWebsite/nqaf/Attachment%20B-UNNAQF%20Manual%20in%20PDF.pdf>

[^11]: United Nations Statistics Division, SDG indicator metadata guidance and metadata repository. <https://unstats.un.org/sdgs/metadata/>

[^12]: Intergovernmental Science-Policy Platform on Biodiversity and Ecosystem Services, “Conceptual Framework,” including its treatment of diverse disciplines, stakeholders, knowledge systems, and values of nature. <https://www.ipbes.net/conceptual-framework>
