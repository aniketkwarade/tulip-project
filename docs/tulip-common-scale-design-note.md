# A common scale for TULIP climate assessments

Date: 2026-09-21. Status: conceptual design; no production scoring changes.

## Recommendation

Keep a common comparison experience, but give the quantities precise meanings:

- **Anomaly:** how unusual a defined climate measurement is against a fixed, appropriate reference distribution.
- **Criticality:** the seriousness of documented or modeled consequences for specified people, ecosystems, or services.
- **Evidence:** whether the assessment is observed, modeled, uncertain, incomplete, or unavailable.

The first quantity has a straightforward dimensionless mathematical scale. The second requires a consequence model or a published assessment method. A single number combining unlike harms is possible as a TULIP priority index, provided its value judgments are explicit. It is not a universal physical unit of climate damage.

This note develops a usable comparison approach alongside the existing `tulip-score-v4-scientific-method-proposal.md`. It does not supersede that document's scientific-admissibility requirements or declare any method independently validated.

## What the current implementation establishes

The working-tree v3 registry contains 354 receipts: 96 current-data, 208 impact-fallback, and 50 modeled receipts. Version 3 explicitly retains the version 2 calculation. Current-data weights are 30% magnitude, 30% threshold, 25% momentum, and 15% extent. Impact-fallback weights use different constructs: biophysical burden, human/economic burden, persistence, and extent.

In 77 of 96 current-data receipts, magnitude and threshold have exactly equal normalized values. Equality alone does not establish duplicated evidence; the temperature receipt additionally confirms the same raw value, source, unit, and anchors for both fields. Its extent is observation coverage, and its momentum is another anomaly observation rather than an estimated rate. These facts explain why reproducible arithmetic alone cannot establish cross-phenomenon comparability.

The registry's scientific-validation status is `pilot_protocol_active_not_independently_validated`. This inspection verifies the stored definitions and calculations, not the underlying scientific observations or the live deployed apps.

Relevant files: `src/tulip-urgency-v2.js`, `src/tulip-urgency-v3.js`, `public/tulip-urgency-v3-scores.json`, `src/main.js`, `iOS/TULIPiOS/TULIPModels.swift`, and `iOS/scripts/export-native-data.mjs`.

## 1. Specify the object being assessed

An assessment needs a phenomenon, indicator, causal role, geography, and observation period. Specify a receptor when assessing harm or exposure. Projections also need a scenario, adaptation assumptions, and a horizon. Attributable impact claims need a counterfactual.

“Drought” is a topic. “Three-month precipitation deficit in this basin during this season” is a measurable condition. “Attributable loss of crop production in this basin over the same season” is a separate impact assessment.

Annual averages, event maxima, seasonal deficits, accumulated losses, emissions flows, and ecosystem states must not be substituted for one another. A global headline requires a declared aggregation rule and coverage; an average of a few cities cannot silently become global population risk.

## 2. Put eligible anomalies on a common scale

Let F be a validated reference cumulative distribution for the exact indicator, location, season, and averaging window. For a continuous indicator:

    q = F(x)       when the upper tail is being assessed
    q = 1 - F(x)   when the lower tail is being assessed
    Anomaly percentile = 100 × q

Larger q means further toward the declared adverse tail. A 99th-percentile value means it lies farther in that direction than approximately 99% of comparable reference observations. It does not mean 99% damage, a 99% chance of disaster, or a demonstrated human cause.

Worked mathematical equivalence, not current TULIP measurements:

| Assessment | Reference position | Adverse percentile |
| --- | --- | --- |
| Unusually high temperature | F(x) = 0.99 | 99 |
| Unusually low precipitation | F(x) = 0.01 | 99 |
| Unusually low sea-ice extent | F(x) = 0.01 | 99 |

All three have the same relative tail position. Their consequences can differ substantially. Prefer displaying the percentile directly. A 0–10 view could use `10 × q`; a preserved 1–10 view could use `1 + 9 × q`. Both are display conventions, and their old urgency bands must not be carried over. A median observation would be 50/100, 5/10, or 5.5 on the latter scale; it is not automatically moderate harm.

Probability-based standardization has an established climate precedent in the Standardized Precipitation Index. Extending the comparison to other eligible indicators is this proposal, not a claim that WMO validates a universal TULIP score. [WMO/GWP SPI overview](https://www.droughtmanagement.info/standardized-precipitation-index-spi/)

### Statistical rules

1. Freeze and version the reference for change monitoring. Update it only through an explicit method revision with a parallel comparison of old and new results. WMO distinguishes current operational normals from a fixed historical reference for climate-change monitoring. An operational normal is not automatically a safe ecological condition. [WMO baseline guidance](https://wmo.int/media/news/updated-30-year-reference-period-reflects-changing-climate)
2. Use an empirical or fitted distribution appropriate to the variable. Simple standard deviations have common tail-probability meanings only under suitable distributional assumptions. Handle ties, zeros, bounded variables, missingness, and measurement changes explicitly.
3. Do not use a short record to claim extreme tail precision. An observation above all historical observations is beyond the observed range; it is not an empirical 100% certainty. Tail extrapolation requires a justified model, diagnostics, and uncertainty.
4. Autocorrelation reduces information. Thirty years of daily measurements are not thousands of independent annual climate observations. Do not translate percentiles into return periods without an event definition, cadence, and occurrence model.
5. Specify the adverse direction in context. Where both tails matter, assess each separately or preregister a two-sided method. Neither ENSO phase is uniformly harmful everywhere.
6. Keep duration, affected extent, trend, and native value visible. Do not multiply a percentile by duration or area and continue calling the result a percentile.
7. A persistent directional change can exceed the old reference repeatedly. Preserve its native magnitude and trend; percentile saturation cannot measure how much further a chronic problem has worsened.

## 3. Assess criticality from consequences

Risk involves the interaction of a hazard with exposure and vulnerability. A large anomaly in one place need not cause more harm than a smaller anomaly elsewhere. [IPCC risk definition](https://www.ipcc.ch/report/ar6/wg2/chapter/annex-ii/)

For each applicable endpoint, use an externally supported impact assessment or a validated response model. The model can consume intensity, exposure, vulnerability, duration, and adaptation; these inputs must not subsequently earn extra points outside the model.

Examples of endpoint types are attributable health burden, a defined ecosystem's loss of condition or collapse risk, and disruption of a specified essential service. Compare outcomes quantitatively only when endpoint definition, unit, denominator, geography, period or horizon, scenario, and method are compatible. Distinguish total burden from burden per person or per unit area.

The strongest first release would show the framework-native criticality finding, its scope, source, and uncertainty alongside the anomaly percentile. Marine heatwave intensity categories illustrate a physical classification; they do not supply a conversion to human mortality or universal ecosystem damage. [NOAA marine heatwave methodology](https://www.coralreefwatch.noaa.gov/product/marine_heatwave/index.php)

If a common TULIP vocabulary is required, use a published, reviewed crosswalk and label it **TULIP criticality**. A provisional vocabulary might be Low, Moderate, High, Severe, and Critical. These words need endpoint-specific quantitative criteria and a stated likelihood/horizon convention before use. They cannot be assigned simply because an anomaly is at the 90th or 99th percentile. Neither an uncertain forecast nor a policy-target exceedance automatically establishes a realized impact.

## 4. If the product requires one overall impact score

A transparent theoretical formulation is:

    TULIP Priority = 10 × Σ [w_e × E(u_e(L_e))]
    w_e ≥ 0; Σ w_e = 1; 0 ≤ u_e ≤ 1

Here L_e is the attributable loss at endpoint e over the declared scope and horizon; u_e maps that loss to TULIP's published 0–1 consequence scale; and w_e declares the relative priority of the endpoints. For nonlinear u_e, transform each possible outcome before taking its expectation. Do not assume a probability distribution merely from a reported range, or average scenarios without justified scenario probabilities.

This formula has one meaning for all assessed phenomena: expected consequence under the same TULIP valuation policy. It must never switch to an anomaly-only formula when impact data are missing. The original climate units disappear through the impact model, not through arbitrary conversion of degrees to hectares.

This is a design family, not a calibrated operational model. The endpoints, response functions, consequence anchors, weights, risk tolerance, and classification cutoffs are not yet determined. Equal weighting is also a policy choice. A finite set of endpoints leaves some harms outside scope and must disclose those exclusions.

An additive index permits tradeoffs: a severe ecosystem result can be diluted by low results elsewhere. If TULIP wants a non-compensatory Critical alert, define a separate explicit endpoint-trigger rule with likelihood and evidence requirements. Do not silently replace the sum by a maximum. Duplicate indicators cannot add weight, and a causal chain cannot be counted repeatedly as independent harm.

Before displaying such an index, independently review the science, test the component models against appropriate held-out outcomes, and examine whether plausible changes to weights, thresholds, data, and dependence assumptions change the ranking. Publish rank ranges or ties when the evidence does not distinguish results. Composite-indicator guidance specifically addresses these modeling choices and robustness checks. [OECD/JRC handbook](https://www.oecd.org/en/publications/handbook-on-constructing-composite-indicators-methodology-and-user-guide_9789264043466-en.html)

## 5. Coverage without invented certainty

Every topic can receive an assessment record. A numeric anomaly requires a suitable reference distribution. A criticality result requires an applicable assessment method and evidence. An overall priority number requires the same mandatory endpoint coverage as its comparison group.

Use `Not evaluated`, `Insufficient evidence`, `Method ineligible`, or an uncertainty range as appropriate. Missing values must not become zero, low risk, a neighbor's score, or a reweighted partial total. Report incomplete criticality coverage explicitly; an assessed severe endpoint can remain visible even if another endpoint is unknown. Unknown evidence does not reduce the seriousness of a known consequence.

Broad activities and responses are not climate anomalies. Decompose drivers into attributable pathways when a suitable model exists, and evaluate responses through intervention-specific outcomes.

## 6. One calculation contract for web and iOS

Generate one canonical, versioned assessment artifact. Both platforms should consume the same record for the same assessment version; an offline iOS bundle can be older but must disclose its assessment date.

Each record should contain the native indicator and unit, scope, time window, baseline ID, adverse direction, anomaly method and uncertainty, endpoint findings and references, criticality rule version, optional priority-policy version, evidence status, source provenance, calculation version, and content hash.

The UI must render the stored value, label, and explanation from this record. It must not reconstruct bands or keep a separate hand-authored scoring explanation. Before rollout, verify source-to-result reproduction, missing-data handling, monotonicity where required, dependence handling, and identical interpretation across platforms.

The recommended immediate design is an anomaly percentile plus a separately grounded criticality finding. An overall TULIP Priority score remains possible after its scientific inputs and explicit valuation policy have been calibrated.

## 7. Supporting every current and future node

The current native catalog contains 381 nodes. The existing urgency registry has 354 issue receipts and explicitly excludes 27 response nodes. Registry membership does not establish scientific eligibility under this proposed method.

The coverage commitment should be: **every node receives an explicit assessment status; every published number satisfies its method's evidence requirements.** A future topic can be represented even if its consequences cannot yet be quantified. This is extensibility, not a promise that every possible phenomenon has a validated numerical model.

### Reusable methods with a common admission process

Route each atomic assessment by what it measures, rather than assigning a permanent numerical formula to a topic name:

| Assessment type | Calculation route | Example scope |
| --- | --- | --- |
| Climate condition or hazard | Native physical classification and an eligible anomaly distribution; impact models only where supported | Basin drought, regional heat exposure |
| Activity or pressure | Measured activity or load, followed by a validated attribution model where available | A defined emissions flow or land conversion |
| Realized or projected impact | A consistent endpoint assessment with its own unit, denominator, time scope, and uncertainty | Water-service disruption or ecosystem condition loss |
| Response or intervention | Benefits, costs, and tradeoffs against a declared counterfactual | Restoration or clean-electricity deployment |
| Broad or emerging topic | Decomposition into assessable claims, or a transparent unassessed status | A topic with several causal roles or inadequate evidence |

A topic may have several atomic assessments. An activity should not inherit its downstream hazard's score, and an intervention's benefit should not be presented as an environmental urgency score.

Maintain a versioned method registry. Each method needs:

- its exact construct, applicability domain, and evidence-admission rules;
- required inputs, units, denominators, geography, period or horizon, and applicable counterfactual;
- reference distributions, response functions, or framework-native classification rules;
- uncertainty, source-conflict, freshness, and missing-data rules;
- endpoint and comparison-group definitions;
- aggregation and dependence rules, with source lineage;
- validation evidence, review status, and reproducible reference cases;
- an optional, separately versioned TULIP priority policy.

Each node's assessment record references an eligible method and its inputs. Reuse a method only when its applicability conditions hold. A genuinely new construct may require a new method and independent review, after which other eligible assessments can reuse it. A method's output should not silently change meaning to accommodate missing inputs.

### New-node admission contract

Before assigning a number to a new assessment:

1. Define the node's atomic claim and causal role.
2. Identify the measured indicator or consequence, unit, scope, and time basis.
3. Select an applicable reviewed method, or record that method development or validation is pending.
4. Attach adequate evidence and uncertainty metadata; record failed requirements explicitly.
5. Check for overlap with existing claims and causal pathways.
6. Calculate an eligible result and emit the shared web/iOS assessment record.

Source ingestion, schema validation, deterministic calculation, provenance checks, export, and platform parity can be automated. Scientific applicability, new impact relationships, and cross-domain consequence valuations still require substantive review. A node addition must not generate undocumented anchors or an AI-authored substitute score.

### Stability as the catalog grows

- Adding an unrelated node must not alter existing assessment values. Never normalize scores against the current catalog's minimum, maximum, or ranking.
- Duplicating a node, indicator, or source must not increase a burden estimate or its weight. Emissions, warming, drought, and crop loss can describe one causal chain; graph membership does not make their impacts additive.
- Revisions to data, scientific methods, baselines, or priority policies must have distinct recorded versions. A changed score must disclose which input or rule changed.
- Preserve historical assessments so users can distinguish a changing condition from a changing method. Comparisons across versions need an explicit compatibility rule or recalculation under a common method.
- Invalid units, mismatched scopes, missing inputs, ineligible methods, and stale evidence must produce the appropriate status rather than an invented low value or a switch to another construct.
- Both platforms must render identical values, labels, evidence status, and explanations for the same assessment version.

These become acceptance checks when the engine is implemented. They are proposed requirements, not tests already run against a new engine.

### Migration sequence

First inventory all 381 current nodes and map their atomic claims, available evidence, applicable methods, and gaps. Then validate a deliberately varied pilot covering conditions, activities, impacts, responses, and an example with insufficient evidence. Include slow changes, episodic hazards, different geographic scales, and multiple affected systems. Use the results to finalize the method registry before migrating the remaining nodes.

Success is complete coverage of assessment status and scientifically justified coverage of numbers. The current registry's complete numerical coverage must not be treated as proof that all its receipts qualify for the new system.

## 8. Twenty-node pilot outcome — 21 September 2026

The [offline pilot report](../artifacts/tulip-score-pilot-20-2026-09-21/REPORT.md), [twenty-node results](../artifacts/tulip-score-pilot-20-2026-09-21/results.csv), and [executed notebook](../artifacts/tulip-score-pilot-20-2026-09-21/pilot.ipynb) test the framework against frozen candidate data. This is a feasibility and failure-mode audit, not independent scientific or predictive validation.

Eighteen issue nodes retain useful scoped numerical evidence; two response nodes require intervention-specific evaluation. The pilot does not establish a common cross-domain harm calibration. Four historical-rank diagnostics were recalculated, alongside source-native SPI classes. Sea ice's adverse rank changes from 93.3 to 73.3 under two different 30-year references. Ocean-pH ranks saturate beyond the old reference range. Local precipitation ranks differ substantially from the rank of the selected-location mean. Several node labels and measured quantities do not match.

The recommendation is therefore narrower: proceed with shared evidence assessments and reviewed indicator-family methods, but do not publish universal criticality numbers or universal High/Critical labels merely by translating those methods' outputs. Numerical consequence comparisons require compatible endpoints and scopes. A cross-domain TULIP priority index would additionally require explicit policy valuations, sensitivity checks and review.

The pilot also finds 18 numerical differences and two response-eligibility differences between the selected local v3 registry and bundled iOS inspector profiles. Those are serialized-data findings, not a live-screen test. A shared versioned assessment and platform parity checks are prerequisites for migration. Application code, public snapshots and deployed scores were not changed by this pilot.
