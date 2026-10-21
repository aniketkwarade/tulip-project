# Ecological outcome coverage and the coral community challenge

Prepared 27 September 2026. **Internal consequence-rule research; public scores unchanged.**

The nature component must describe attributable ecological degradation over a defined distribution. An indicator is evidence about a particular characteristic. It becomes a whole-node component only after the assessment establishes that its coverage, causal attribution and calibration fit the node's stated meaning. No single percentage stands for every ecological consequence.

## Consequence rules to carry into calibration

1. **Declare material outcomes before choosing a convenient source.** Use a versioned, node-specific outcome profile. Name the ecological characteristics the node changes, the ecosystem types and spatial distribution, and the evidence needed to establish each change. Record why any other plausible outcome is outside the assessment. An indicator cannot redefine the node merely because it has accessible data.
2. **Keep extent, condition and pressure distinct.** Habitat area, organism cover, species composition, ecological processes and connectivity require different measurements. A temperature anomaly or emissions total needs a modeled route to consequences. It cannot enter as damaged habitat or biological harm.
3. **Retain the measured outcome vector.** A total can conceal changes among its constituents. Preserve relevant taxa, growth forms and spatial cohorts alongside an aggregate. A composition change needs an ecological interpretation and a reference condition before it can be called degradation; turnover alone is not a harm weight.
4. **Count each underlying measurement once in aggregation.** Total cover and the category covers that sum to it are overlapping observations. They can jointly inform interpretation, but adding total-cover loss to category-cover loss double counts shared evidence. A separate functional endpoint needs evidence that it measures an additional consequence and a reviewed aggregation rule.
5. **Freeze the measurement hierarchy.** Changes in category resolution must not create additional burden. Positive category-change sums are diagnostic, not an invariant harm unit: combining a declining category and an increasing category can eliminate the apparent loss. A calibrated characteristic must have a fixed category scheme or a tested parent/child transfer rule. This applies independently of how many TULIP nodes exist.
6. **Bind normalization to the actual characteristic.** A reference-to-collapse scale for live cover cannot automatically normalize larval survival, physical framework, community composition or habitat connectivity. Each characteristic needs its own supported reference, degraded endpoint and harm direction. A collapse value cannot be invented from a convenient minimum in the catalogue.
7. **Establish causality and timebase before magnitude.** A historical before/after difference is not automatically a current node-attributable difference. Survey intervals, depth changes, simultaneous pressures, recovery and sampling design require review. Area weighting needs a compatible mapped distribution; nearby reef area is not automatically the surveyed area or damaged area. Current stock is not multiplied by historical observation length.
8. **Calibrate only after coverage and overlap review.** A whole-node nature component needs the reviewed material-outcome profile, source-supported outcome values, matched causal scope and a fixed within-type aggregation policy. Cross-type aggregation and the benchmark-mapped display remain separate TULIP policy decisions. Missing outcomes are not zero and are not silently reweighted away.

This structure draws on [UN SEEA Ecosystem Accounting, sections 5.32–5.38](https://seea.un.org/sites/seea.un.org/files/documents/EA/seea_ea_f124_web_12dec24.pdf), which distinguishes physical, chemical, compositional, structural, functional and landscape/seascape characteristics. SEEA puts overlapping foundation-species composition/structure measurements in its structural class and reserves its functional class for processes not already represented elsewhere. Those classes help organize coverage; they do not establish equal weights, ecological exchange rates or a TULIP harm score.

## Real source challenge

[Mellin and colleagues' 2024 study](https://doi.org/10.1098/rspb.2024.1538) examines the 2016 marine heatwave using 262 Australian reef sites. The study compares pre-event surveys collected in 2010–2015 with post-event surveys collected in 2016–2019. The public [version-1 dataset](https://doi.org/10.25909/23584173.v1) contains 524 site/state rows with 119 coral-category cover columns, plus 524 matching covariate rows. These are **site-state means**, not exact repeated colony observations or mapped area estimates.

The [reproducible extraction](../../scripts/audit-coral-community-consequence-references.py) joins the two exports on explicit site and Pre/Post keys. It checks duplicate and orphan keys, coordinates, clusters, source-year identity, finite percentage values and substrate totals. It retains all 262 historical category vectors. Of the pairs, 140 have different reported mean survey depths. Equal mean depths also do not prove identical transects or comparable survey effort. No pair is promoted to a current whole-node assessment.

Three sites have unchanged aggregate coral cover but changes among their categories. The following values are recomputed from the pinned raw export; percentage-point changes are not relative percentages.

| Site | Pre total cover | Post total cover | Net difference | Sum of declining category differences | Sum of increasing category differences |
| --- | ---: | ---: | ---: | ---: | ---: |
| CS130 | 9.00% | 9.00% | 0.00 pp | 5.00 pp | 5.00 pp |
| CS23 | 27.00% | 26.50% | −0.50 pp | 10.50 pp | 10.00 pp |
| NWS71 | 23.00% | 23.85% | +0.85 pp | 15.50 pp | 16.35 pp |

All three have the same reported mean depths within each pair. Their survey-year means span several years, so the observations cannot isolate instantaneous heat injury or exclude every alternative cause. Category decrease sums measure differences of means within the study's category scheme. They are **not** gross mortality, destroyed habitat, a biodiversity loss fraction or an additional harm to add to total cover. The actual ecological importance of the replacement categories requires independent outcome evidence or an explicitly tested calibration profile.

The paper also finds a weak relationship between community turnover and absolute total-cover change. That supports retaining both measurements for interpretation; it does not establish a universal turnover-to-harm conversion. We do not reproduce the paper's transformed-community significance tests or infer probabilities from the source vector.

## Source summary discrepancy

The [published Supplementary Table S2, version 1](https://doi.org/10.6084/m9.figshare.27019623.v1) describes cluster-level pre/post category means. Its 570 numeric rows have internally consistent difference arithmetic, but **none** matches the same cluster/category means recomputed across all sites in the pinned raw export at an absolute tolerance of 0.0000001 percentage points. A further row has `ND` for the pre state and is not numeric. The report preserves each source row and both raw-export all-site and present-only means.

The source's [analysis code](https://github.com/camillemellin/NESP-coral-analysis-revised/tree/7a312bacdb49c128b063b595a220b3375656885f) includes both site-level aggregation and a separate calculation that excludes zero covers. That does **not** reproduce or explain the supplement as a whole. The exact export or aggregation difference remains unresolved. Do not label the source table wrong, silently repair it, average the exports, or substitute its values for raw site means.

The audit uses the raw dataset as its own explicitly declared descriptive route. It quarantines the supplement from pooled reference calculations. This matters for future nodes: a correct-looking subtraction cannot establish a correct denominator, sampling grain or source join.

## Application to current reef nodes

| Node | Evidence must establish | Cover alone cannot establish |
| --- | --- | --- |
| Coral Bleaching | The relevant biological stress response and its attributable consequences, with species, depth and event scope preserved | Death, permanent framework loss, or the whole global causal share |
| Reef Structural Collapse | Degradation of the hard reef framework and material consequences within the defined area | The rate or amount of framework breakdown |
| Coral Larval Survival and Recruitment Failure | Survival, settlement or recruitment outcomes at the relevant life stage, with their causal and observation boundaries | Death of larvae from adult bleaching or missing recruits alone |
| Coral Reef Fragmentation | Observed breakage, gaps or habitat configuration/connectivity change at the stated scale | Physical fragmentation from lower live cover |
| Marine Heatwaves | Named biological or functional consequences over the relevant affected ecosystem distributions | Ecosystem damage from temperature exposure, or whole-ocean harm from a reef-only study |

These requirements follow the nodes' existing published definitions and measurement boundaries. They are not completed coverage profiles or scoring approvals. The source pool improves the real calibration cases available to challenge future profiles. The remaining work is to select and source material endpoints, settle within-type and cross-type trade-offs, and rebuild the applicable nature assessments from attributable current evidence.

## Verification and provenance

The [audit artifact](../../artifacts/tulip-consequence-rule-audit-2026-09-27/coral-community-consequence-reference-audit.json) preserves the source digests and all 31,178 site/category comparisons. Source CSVs and the supplement are retained with their public version metadata. The [Python challenges](../../scripts/test-coral-community-consequence-references.py) exercise invalid measurements and source identities, cancellation, catalogue-addition stability and the taxonomy-dependent loss-sum failure. A [separate JavaScript verifier](../../scripts/test-coral-community-consequence-artifact.mjs) reproduces arithmetic across all pairs and verifies all three artifact hashes. These checks validate source handling and descriptive calculations; they do not validate a TULIP number.
