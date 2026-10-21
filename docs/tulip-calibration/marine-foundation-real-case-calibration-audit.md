# Real marine reference cases: metric and aggregation audit

Prepared 27 September 2026. **Source-checked historical calibration evidence; no replacement ratings.**

The [Smith et al. 2024 study](https://doi.org/10.1038/s41467-024-49307-9) examines marine-heatwave responses across shallow coastal ecosystems. The [extractor](../../scripts/extract-mhw-foundation-calibration-cases.py) checks both publisher workbooks by SHA-256, retains their source cells, and produces [94 regional summaries representing 1,322 localized-area/event observations](../../artifacts/tulip-consequence-rule-audit-2026-09-27/mhw-foundation-typed-reference-cases.json). Figure count tables independently reproduce the observation totals. The records preserve source periods and post-event response windows rather than labeling publication year as a current assessment.

## Five endpoint types, not one percentage of harm

| Typed source endpoint | Observations | Meaning limit |
| --- | ---: | --- |
| Hard-coral bleaching prevalence | 1,047 | A biological stress response; not coral mortality, habitat destruction or all reef-function loss. |
| Gorgonian mortality-event affected-population prevalence | 76 | Population affected by reported mortality events; not an ecosystem-wide collapse fraction or count of individual deaths. |
| Seagrass relative cover change | 60 | Relative change in a foundation-species indicator, with losses and gains; not mapped area of habitat lost. |
| Macroalgal relative density change | 57 | Relative change in abundance density; not the same physical observation as cover change. |
| Macroalgal relative cover change | 82 | Relative change in cover; not a source-defined collapse-relative condition scale. |

The source uses different statistical treatments for plant-abundance change and coral-response prevalence. Its coral observations can include conservative category replacements; the extracted workbook records **191 category-coded observations**, while other reported analytical subsets apply their own exclusions. These codes must not be treated as exact continuous harm estimates. Three single-category coral rows have positive source values representing inhibition, not ecological gains. The extractor preserves that encoding explicitly.

Two macroalgal density labels continue onto the next spreadsheet row. The extractor joins those printed labels and preserves their source locations, correctly identifying twelve observations that a first-line-only import would leave ambiguous. Missing SD or category-count values stay missing; they never become zero harm.

## Real cases that challenge the candidate rules

These are regional multi-event references, not rankings of current global TULIP nodes:

| Regional reference | Native result | What the score must not infer |
| --- | --- | --- |
| Fiji Islands, hard corals | Source mean magnitude 18.3% bleaching; 72 observations | 18.3% of the ecosystem was destroyed or 18.3% of corals died. |
| Western Mediterranean, gorgonians | Source mean magnitude 44% affected by mortality-event responses; 59 observations | Equal ecological harm to a 44% decrease in seagrass cover, or an independently measured climate-attributable fraction. |
| Southern Norway, macroalgal cover | Mean signed change **+6.5%**, yet **2 of 9** observations had at least 10% loss | An average gain proves zero gross damage. The other areas' gains do not reveal how much condition was lost in the damaged places. |
| Tweed–Moreton, seagrass cover | Mean signed change **−28.6%**, with **13 of 20** observations showing at least 10% loss; responses span 100% loss to greater than 100% gain | 65% of habitat area was damaged; the mean or its SD supplies gross loss, a confidence interval or a probability forecast. |

Counts are sampled area/event records, not area weights. The paper's plant response bins have a mild category containing **both loss and gain**. A midpoint substitution cannot recover continuous positive loss from those bins. The SD describes variation across observations, not uncertainty in a global attributable-harm estimate. No probability distribution is manufactured from the reported response ranges.

The group source datasets run through 2020 for coral/gorgonian records, 2021 for macroalgal records and 2022 for seagrass records, with much earlier starting years. These are envelopes from the article's Table 2, not event dates for individual summary rows. Plant changes are measured 6–12 months after events, while coral responses use a shorter window. The summaries do not establish the present condition or recovery status in 2026.

## Rule correction prompted by the real cases

For the experimental **gross current attributable-loss** endpoint, preserve disjoint spatial losses before aggregation. Do not take a regional net change, clip it to zero and label that the total positive harm. This is an explicit TULIP construct choice: ecological gains may be reported separately, while damage to other cohorts remains counted.

The [aggregation evaluator](../../src/tulip-nature-aggregation-experiment.js) now requires a loss-preserving spatial-cohort basis and rejects a declared signed-net response mean. A [new adversarial case](../../scripts/test-tulip-nature-aggregation-experiment.mjs) has equally sized damaged and improved patches whose native signed indicator changes cancel. The separate-loss calculation retains the damaged patch; the net-mean substitution is rejected. Its fields cannot prove that an actual source has the required spatial detail; the source review must establish that detail. Nineteen rejection cases now pass.

The [reference-pool checks](../../scripts/test-mhw-foundation-calibration-cases.mjs) verify both source hashes, all counts, five distinct metric types, the wrapped labels, category encoding and the real gain-with-loss example. The sources are checked by Python extraction and JavaScript validation. Every reference retains no score, no current assessment period, no inferred damaged area and no quantified node-attributable fraction.

## What this evidence can support next

Use these records to challenge proposed conversion rules and select source-native analogues within the **same metric and compatible ecological setting**. They do not yet supply current whole-node assessments or the cross-ecosystem weights. Real scoring needs raw, spatially resolved paired observations or validated model cases, compatible habitat extent, a no-node counterfactual and a defined biological condition/collapse interpretation. The regional summaries alone cannot reconstruct those inputs. The article links processed records separately; further retrieval and model review are required before transferring their responses to new conditions or current global nodes.

The processed-data short link returned an empty HTTP 202 response on 27 September 2026; browser inspection and focused public Figshare searches did not retrieve that dataset. This is an access result, not evidence that the dataset never existed. The separate [HeatCRD audit](./heatcrd-calibration-input-quality-audit.md) successfully retrieved the publisher-linked coral-recovery database and extracted 2,078 internally matched historical cover comparisons. It also detected base-table linkage conflicts and ambiguous measurements. The two source pools are not merged or treated as independent estimates of the same current harm.
