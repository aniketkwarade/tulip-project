# TULIP consequence candidate — 28 September 2026

**The experimental rulebook is implemented. Full scientific calibration and the 354 replacement ratings are not complete.** Existing public decimal scores remain unchanged. The 381 new research records are assessment preparations, not newly measured scores. No outside reviewers were contacted.

## What the candidate does

Measure current harm attributable to the phenomenon, using the latest compatible evidence. Keep global catalogue scope distinct from regional evidence. Both domains in a complete calculation must have the same geography, reporting year and causal comparison. Preserve the source date and its lag; an old source does not become a 2026 measurement by changing its label. Climate history and WMO standard normals can inform a model but are not multiplied into harm. A future outlook remains separate.

Calculate consequences for people and nature separately. Map each amount against fixed 1–10 benchmarks, average with **50% people and 50% nature**, then round once to one decimal. This retains the confirmed combination rule: 10 and a supported 1 produce 5.5 in either order. An unknown domain is not a supported 1.

The [versioned policy](../../src/tulip-consequence-policy-v1.json) and [calculator](../../src/tulip-consequence-calibration-v1.js) are experimental modules. They are not connected to the public scoring pipeline. Their `experimentalValue` is explicitly separate from the public `value`, which remains null for this candidate. The default real-input registry is empty.

## People: health and other losses

Use a common **TULIP human loss-year index**:

`health DALYs + supported loss-of-function years − supported overlapping loss-years`

A DALY is a health burden unit. The new **1:1 numerical bridge** between a DALY and a full loss-of-function year is an explicit TULIP proposal, not a scientific identity. It extends the chosen health ruler to supported non-health outcomes. Its validity remains a calibration question.

Every service, displacement or livelihood route needs a fixed, source-specific function-loss definition. Money, people exposed and days without service do not automatically equal years of lost function. The accounting must remove losses already represented in health. Unknown overlap prevents a complete calculation. Multiple differently named copies of the same source row cannot increase the total; different source rows also need a substantive overlap review.

For displacement, the prototype uses `unique affected person-days × 0.042 / 365`. The [IDMC methodological note](https://api.internal-displacement.org/sites/default/files/publications/documents/2026_IDMC_A%20life-year%20approach%20for%20measuring%20the%20human%20cost%20of%20disaster%20displacement.pdf) proposes that approximate loss factor. TULIP requires supported person-time rather than automatically importing its ordinal recovery assumptions. This is a modeled proxy, does not reproduce the Bangladesh application, and cannot be applied to every service loss.

## Nature: area and condition

Use **TULIP condition-equivalent square kilometres**:

`sum of allocated area × attributable condition loss`

Each ecosystem type needs a fixed profile covering physical condition, chemical condition, species composition, structure, function and connectivity. The [UN SEEA typology](https://seea.un.org/en/content/common-typology-ecosystem-characteristics-and-ecosystem-condition-variables) supplies these characteristic classes. **Equal one-sixth weights are a new TULIP proposal**, not a UN scoring recommendation.

A profile needs supported intact and degraded reference states for each characteristic. Compare matched current outcomes with and without the phenomenon. Missing characteristics do not become zero or receive redistributed weights. Out-of-reference observations require review. Keep improvements visible separately; they cannot cancel unrelated losses. Shared spatial footprints need explicit allocation whose shares sum to at most one. Do not multiply current damaged stock by history or recovery duration.

This specifies how a compatible profile would be calculated. It does not establish that coral cover, forest extent and species extinction risk are interchangeable, or supply the real profiles needed to connect them.

## Proposed benchmark amounts

| Component reading | Human loss-year index, assigned to one year | Nature condition-equivalent km², current stock |
| --- | ---: | ---: |
| 1 | Verified zero | Verified zero |
| 3 | 100,000 | 1,000 |
| 5 | 1,000,000 | 10,000 |
| 7 | 10,000,000 | 100,000 |
| 9 | 100,000,000 | 1,000,000 |
| 10 | 3,013,734,614.04409 | 510,000,000 |

The four middle thresholds in each domain are TULIP choices. The human outer reference is the pinned WHO 2021 global all-cause DALY total, previously checked against 215 source rows. The nature outer reference is rounded spherical Earth surface area, derived from [NASA's 6,371 km mean radius](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html). It is a physical reference, **not a measured amount of living habitat**. The nature middle thresholds have not yet been calibrated against compatible real ecological losses.

Between adjacent anchors, interpolate using `log(quantity + 1)` in the declared canonical unit. Do not fit an exponent or thresholds to the catalogue. More compatible harm cannot lower the reading, and adding an unrelated node cannot move the ruler. Scores above the outer reference reach the explicit display ceiling of 10; raw quantities remain available. These numbers are an index, not percentage harm or a ratio scale.

A combined score does not imply one unique underlying amount. People 3/nature 7 and people 5/nature 5 both produce 5.0. That is the declared equal-emphasis compromise.

## What the challenge found

All examples in this section are **invented policy challenges**, not assessed real nodes.

- Losing the full condition profile across 1 km² produces a nature component near **1.2**, even if the loss is irreversible. This aggregate reading cannot stand for local severity or conservation priority.
- Losing all of one characteristic across 100,000 km² produces about **5.44** under equal class weights. Doubling that characteristic's weight and renormalizing produces about **5.91**. The class choice matters.
- A function-heavy case produces a combined **4.78–5.32** when the function-to-health bridge is varied from 0.5 to 2. This is policy sensitivity, not a probability interval.

These trade-offs are recorded, not declared solved because the formula runs. Cross-ecosystem equivalence, non-health equivalence and whether these trade-offs meet the intended public meaning remain substantive calibration gates. Rarity or permanence must not receive an undocumented bonus merely to force a desired number.

## Catalogue outcome

The [381-record research catalogue](../../artifacts/tulip-consequence-calibration-v1-2026-09-28/catalogue-assessments.json) and [readable status CSV](../../artifacts/tulip-consequence-calibration-v1-2026-09-28/catalogue-status.csv) preserve the existing evidence findings and specify missing consequence inputs for each node. The original 20 cases are included in the JSON's `originalTwenty` section.

| Coverage item | Result |
| --- | ---: |
| Issue nodes with both replacement domain positions prepared | 354 |
| Response nodes outside danger scoring | 27 |
| Required domain positions | 708 |
| Previously omitted positions now explicit | 190 |
| Invalid old lower components withdrawn from replacement drafts | 132, across 110 nodes |
| Rejected central water inputs carried forward | 2 |
| Complete replacement ratings admitted | **0** |
| Existing public score changes | **0** |

Withdrawing an invalid bound does not create a correct new bound. The two water cases still lack the necessary consequence quantities. Their exposed or dependent populations are not silently reused as harmed populations. The remaining 518 old applicable components also need source-native outcome review.

Three original source-bound partial packets are carried forward: the WHO joint air-pollution health endpoint, GCRMN event-associated coral-cover change and FAO forest-conversion extent context. The [completion pass](./completion-status-2026-09-28.md) adds four partial industrial-health reference attachments and explicit research routes for every node. Their exact limitations remain attached. Health alone is not complete human coverage; event association is not apportioned attribution; forest conversion flow is not a current condition stock; historical marginal plant-health models are not complete current node burdens. None supplies a complete replacement rating.

## Verification and remaining work

JavaScript checks all 36 people/nature anchor combinations and 31 rejection cases, including duplicate evidence, missing domains, changed sources and causal baselines, mismatched units and geography, unknown overlap, invalid zeroes and incomplete cases. Additional controls cover split/shared spatial area, gains, source-matched bounds, percent/fraction conversion, catalogue independence and response exclusion.

A separate 60-digit Python Decimal implementation reproduces the anchors, nine bridge-sensitivity readings, four ecological trade-offs, 24 class-weight readings and three matched envelope cases. It independently recounts all 381 prepared records and preserved public values. **This is separate arithmetic reproduction, not independent scientific review.**

The remaining work is specific: obtain and review compatible terminal consequence profiles, test the proposed ecological thresholds and function bridge on real cases, resolve attribution and overlap, and replace the rejected water and lower-bound quantities. Run the resulting complete assessments twice against their sources before admitting replacement ratings. A well-formed worksheet cannot substitute for those inputs. No estimated completion time is inferred from record counts.

```sh
node scripts/test-tulip-consequence-calibration-v1.mjs
node scripts/build-tulip-consequence-calibration-catalogue.mjs
python3 scripts/verify-tulip-consequence-calibration-v1.py
node scripts/test-tulip-assessments.mjs
```

The [candidate test results](../../artifacts/tulip-consequence-calibration-v1-2026-09-28/candidate-check.json) and [Decimal reproduction](../../artifacts/tulip-consequence-calibration-v1-2026-09-28/decimal-reproduction.json) make the limits reviewable. Publishing and phone installation are not part of this closeout.
