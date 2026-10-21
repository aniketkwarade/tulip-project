# What a TULIP 3, 5, 7 and 9 should mean

Prepared 27 September 2026. Version: `tulip_score_meaning_anchors_2026_09_27_v1`.

**Historical proposal.** The [28 September calibration decision](./calibration-closeout-2026-09-28.md) rejects treating the labels below as universal meanings of aggregate harm. Their hypothetical target values remain audit cases, not constraints for forcing a new formula. The internal health benchmark choice now uses fixed annual DALY amounts; nature and full composite calibration remain incomplete.

These are proposed internal calibration benchmarks for **current harm**. They define what we want the numbers to communicate before choosing a curve. They do not change the current scoring engine or assign new ratings to real nodes. The [machine-readable cases](./score-meaning-anchors.json) preserve the exact examples.

The [completed formula experiment](../../artifacts/tulip-score-meaning-test-2026-09-27/report.md) tests these frozen cases, mixed-domain combinations, mathematical invariants and the full catalogue. It confirms that closer benchmark fit does not resolve coarse inputs or inconsistent consequence mappings.

## Four reference points

TULIP should answer: **How much harm is this condition causing, considering how serious the consequences are, how many people or how much nature is affected, and how long the damage lasts?**

| Score | Intended meaning | Everyday explanation |
| --- | --- | --- |
| **3.0** | **Limited, recoverable harm** | Real damage, usually affecting a small group or area, with recovery relatively quick and little lasting loss. Think brief illness, a short disruption, or a small area of habitat that recovers. |
| **5.0** | **Substantial harm** | Damage that materially affects daily life or ecosystem health. Recovery is possible but takes meaningful time and effort. Think sustained difficulty getting basic services, or damaged habitat that takes years to recover. |
| **7.0** | **Severe harm** | A large burden of serious illness, major displacement, prolonged loss of basic services, or major damage to how an ecosystem supports life. Recovery is difficult; some losses can last for years. |
| **9.0** | **Extreme, enduring harm** | Very large losses of life, health, habitable places, or ecosystem function. The damage is extensive and much of it is permanent or takes generations to recover. |

These are reference profiles, not new public labels or four score bands. A 9 does not mean the end of all life; a 3 does not mean harmless. A 9 is not three times the harm of a 3. Decimal precision remains a display convention, not a claim that harm is known to a tenth of a point.

## Make the words testable

The following are **invented reference cases**, not observations about real nodes. Their values are explicit TULIP judgments, not scientific constants. The quantities place each case within the existing axis definitions so we can expose what changes when we choose these meanings. Reusing those definitions for the comparison does not independently validate their thresholds.

| Target | Hypothetical people case | Hypothetical nature case | Existing severity / reach / persistence levels |
| --- | --- | --- | --- |
| **3.0** | 5,000 people have mild, reversible symptoms for two weeks, with no lasting injury in this example. | A small condition loss affects 0.5% of a fixed ecosystem distribution; recovery takes three months. The condition indicator has moved 5% of the distance toward its defined collapse state. | 1 / 1 / 1 in each domain |
| **5.0** | 100,000 people experience documented material hardship from an essential-service interruption for six months, with managed alternatives and eventual recovery. | A condition indicator has moved 20% toward its collapse state over 5% of the fixed distribution; recovery takes five years. | 2 / 2 / 2 in each domain |
| **7.0** | 10 million people have severe illness whose consequences last five years before recovery. | A condition indicator has moved 50% toward its collapse state over 20% of the fixed distribution; recovery takes twenty years. | 3 / 3 / 3 in each domain |
| **9.0** | 10 million people have permanent disability attributable to the condition. | A condition indicator has moved 80% toward its collapse state over 20% of the fixed distribution, with irreversible loss of defining features in that area. | 4 / 3 / 4 in each domain |

Each people case refers to people currently affected at a fixed assessment date. Each nature case uses a fixed ecosystem type and its full declared distribution. The human and nature cases are separate component references; a combined reference has both components at that target. Equating them is a proposed TULIP value choice requiring challenge across other profiles. It is not a measured conversion between human disability and ecosystem loss.

For nature, “20% toward collapse” is **not** a 20% chance of collapse or 20% of habitat destroyed. It refers to a measured condition indicator, a documented reference state and a documented collapse state. Extent is a separate quantity. This distinction follows the [IUCN Red List of Ecosystems glossary](https://www.iucnrle.org/rle-glossary). The specific TULIP examples and target numbers are our choices, not IUCN ratings.

For actual nodes, record the attributable consequence, affected count or area, denominator, source period, duration or recovery, and evidence bounds. People exposed to a hazard are not automatically people harmed. A service outage and the illness it causes must not count the same health loss twice. Do not multiply a lifetime health-loss estimate by duration again. A hypothesis about future collapse does not establish current collapse.

## How the combined score should be read

Where both domains apply, retain 50% people and 50% nature. On the same linear component scale, that means `overall = (people score + nature score) / 2` before final rounding. A structurally single-domain outcome retains the existing full-scale treatment; lack of evidence in the other domain is not structural exclusion.

An overall **5** can therefore mean **people 5 / nature 5**, or **people 9 / nature 1**. It describes combined burden, not an assurance that every consequence is moderate. Score explanations must preserve the component context. If we instead want the worst component always to determine the headline, that would be a different aggregation policy, not a power-curve adjustment.

Keep the newest compatible evidence and source dates. Older records help establish context and attribution; their length is not an extra harm multiplier. WMO climate-normal conventions remain unchanged. The separate 2027–2036 outlook does not set these current-harm anchors. Evidence confidence remains separate from harm; uncertainty does not automatically lower a rating.

## What the current formula does to these cases

The current component is the average of three integer levels divided by four. Its public conversion is `1 + 9 × component`. For these matched-domain examples, a single-domain case and a 50/50 combined case have the same result.

The alternative shown below applies `1 + 9 × component^1.2` to the **unrounded** index. It does not transform an already rounded display value.

| Proposed target | Current linear result | With exponent 1.2 |
| --- | --- | --- |
| 3.0 | 3.3 | 2.7 |
| 5.0 | 5.5 | 4.9 |
| 7.0 | 7.8 | 7.4 |
| 9.0 | 9.3 | 9.1 |

This small, internally chosen set cannot establish which curve is best. It illustrates disagreement between proposed meanings and the present mapping. No acceptance tolerance or statistically validated equivalence has been established. Choosing a curve to fit these same four examples would be calibration, not independent validation.

There is a deeper test. The current average gives **7.75, displayed 7.8**, to all three ecosystem profiles below:

- **1 / 4 / 4:** slight condition loss over a very large area that persists more than fifty years.
- **3 / 3 / 3:** major condition loss over a substantial area, with recovery taking decades.
- **4 / 1 / 4:** very severe, permanent damage confined to a small part of the fixed distribution.

The 1.2 power curve gives all three **7.4**. Any transformation of the same aggregate preserves the tie. These cases might have comparable total burden, but the equality needs a reasoned trade-off; equal sums alone do not demonstrate it. Equally, mild effects across many people can add up to a large real burden, so a blanket cap for every mildly affected person would also need justification. The [OECD/JRC handbook, section 6.10](https://www.oecd.org/content/dam/oecd/en/publications/reports/2008/08/handbook-on-constructing-composite-indicators-methodology-and-user-guide_g1gh9301/9789264043466-en.pdf) explains how additive aggregation permits one dimension to compensate for another.

## Catalogue check and next calibration decision

An arithmetic comparison covers the current **354 issue candidates** and **27 response controls**. The issue catalogue has **16 distinct displayed scores**, with a median of **4.8**. Recomputing the existing results checks implementation consistency; it does not establish that the source-to-axis judgments are scientifically correct. The four reference cases are synthetic, so no real node has been newly assigned to a target in this document.

The check passed on 27 September 2026: independently recomputed lower, central and upper results matched the stored candidate and public record for every issue; all 27 responses retained null scores. The four reference calculations and both tied stress cases also matched the arithmetic shown above.

Use these meanings to challenge the next scoring version:

1. Compare consequence profiles before looking at their preferred final numbers. Include severe local harm, mild widespread harm, repeated short events, permanent losses, mixed people/nature effects and source-attributable contributions.
2. Document which trade-offs TULIP accepts. If different profiles must be distinguished, change the component rules or evidence-to-axis resolution; a final curve cannot recover information that was discarded earlier.
3. Freeze the benchmark version, then test any revised rules on additional cases that were not used to tune them. Check sensitivity to evidence bounds and weights, not just the distribution of scores.
4. Reassess existing node mappings before migration. Introduce a new method version only with an explicit before/after comparison. The current definitions are a calibration specification, not evidence that all existing numbers already have these meanings.

## Local evidence and reproducibility

- Current rules: [internal score logic](./internal-score-logic.md) and [evaluator](../../src/tulip-internal-calibration.js).
- Inputs: [reviewed catalogue candidates](../../artifacts/tulip-calibration-2026-09-22/internal-reviewed-catalogue-candidates.json) and [public assessment snapshot](../../public/tulip-assessments.json).
- Reference profiles: [versioned benchmark inputs](./score-meaning-anchors.json). Compute `index = sum(axis levels) / 12`, then apply either conversion above; round only at display.
- Validation scope: arithmetic, catalogue counts, response exclusion, public-record agreement and synthetic examples. No new source ingestion, empirical calibration or scientific re-review is claimed.
