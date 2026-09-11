# TULIP Score Scientific Validation Protocol

Status: active pilot protocol. TULIP’s existing **Scientifically approved** review status is retained. It means the declared evidence route, transformations, sources, and calculation passed TULIP’s recorded internal review checks. It is not the same claim as **scientifically validated**.

TULIP will not use “scientifically validated” for a score, model, or registry until both external domain review and independent reproduction are complete and the predeclared acceptance criteria below are met.

## 1. Constructs kept separate

Environmental urgency applies only to issue nodes. Its receipt must use one of three declared routes: current observations, accumulated-impact evidence, or a visibly labeled Modeled estimate.

Response and action nodes use a separate response assessment covering mitigation, adaptation, feasibility, co-benefits, and delivery risk. Response assessment fields are not environmental-impact vectors and response nodes do not receive an environmental urgency score.

Generated, inherited, and expert-profile vectors are excluded from TULIP urgency calculations. If an inherited impact profile is shown for explanatory context, it is labeled **Unvalidated expert profile**.

## 2. Transparent receipt requirements

Every published score must expose:

- source date;
- calculation method;
- uncertainty statement;
- evidence quality;
- review status;
- source identifiers and transformation lineage;
- exclusions and failure behavior.

Evidence-backed receipts receive no extra score label. Receipts without sufficient direct or accumulated-impact evidence are labeled **Modeled**.

## 3. Representative pilot

The first cohort contains 48 issue nodes: four from each of TULIP’s twelve issue spheres. Selection is deterministic within each sphere near the 8th, 38th, 68th, and 94th score quantiles so the pilot spans low-to-high urgency rather than concentrating on prominent nodes. The frozen cohort and its method and band distribution are published in `public/tulip-scientific-validation-pilot.json`.

The pilot begins when the cohort file is generated. Its current review and reproduction fields remain `not_started` until named external participants complete them; status must not be inferred from internal review.

## 4. External domain review

Each pilot node requires review by at least two qualified subject-matter experts who are independent of score authorship. Reviewers must disclose affiliation, relevant expertise, conflicts of interest, review date, sources inspected, and whether they recommend acceptance, revision, or rejection for each of these questions:

1. Does the score measure the stated construct?
2. Are the geography, population, and time boundaries defensible?
3. Are source assertions entailed by the cited material?
4. Are transformations and thresholds scientifically justified?
5. Is uncertainty stated at an appropriate level?
6. Is the selected evidence route the highest eligible route?

Disagreement requires a recorded adjudication by a third qualified reviewer. TULIP must publish reviewer comments and dispositions, with personal information limited to professional identity and disclosed conflicts.

## 5. Independent reproduction

An unaffiliated team must reproduce the pilot from a frozen input bundle without using TULIP’s generated output files. The reproduction must publish executable code, dependency lockfiles, source snapshots or immutable source locators, intermediate components, final scores, and a discrepancy report.

Reproduction passes only when:

- all 48 receipts are rebuilt;
- method selection matches for at least 46 of 48 nodes, with every mismatch adjudicated;
- component values agree within `1e-6` where identical source records are used;
- displayed scores agree within 0.1 points;
- no generated, inherited, or expert-profile vector enters any urgency calculation;
- all response nodes remain excluded from environmental urgency.

## 6. Reliability, validity, and sensitivity tests

The pilot report must include inter-reviewer agreement, test-retest stability across a frozen rerun, source-update sensitivity, weight sensitivity, leave-one-source-out sensitivity where possible, convergent checks against established domain indicators, and discriminant checks showing that response feasibility is not being measured as environmental harm.

Predeclared minimums are: Krippendorff’s alpha or weighted kappa of at least 0.67 for categorical review judgments; median absolute reproduced-score difference no greater than 0.1; 95th-percentile difference no greater than 0.3; and no critical construct-contamination finding left unresolved. These are pilot acceptance gates, not proof of universal validity.

## 7. Claim gate and governance

“Scientifically validated” remains prohibited until:

1. the 48-node pilot is complete;
2. external domain review is complete and conflicts are disclosed;
3. independent reproduction passes;
4. all material findings and corrective changes are published;
5. a versioned validation report is approved by a governance reviewer who did not author the model.

Any material change to evidence routes, modeled inputs, weights, transformations, or band thresholds invalidates the prior validation claim for the changed scope and triggers revalidation. Internal **Scientifically approved** status may continue to describe receipt-level review, but it must never be presented as external validation.
