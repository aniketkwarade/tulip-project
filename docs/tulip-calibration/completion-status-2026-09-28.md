# TULIP calibration completion status — 28 September 2026

**The supported implementation work is complete within this pass. The replacement calibration and 354 whole-node numerical ratings are not complete.** This distinction cannot be removed by another arithmetic check. Current public numbers remain exactly as they were.

## What changed

All 381 published nodes now have an explicit, versioned consequence research route: 354 issue nodes and 27 response exclusions. The previously unclassified 69 routes have an internal semantic interpretation based on their published definitions and actual metric contracts. The other 285 classifications are carried forward from the previous source inventory; they have not been given new scientific approval. No route is treated as an impact model or numerical calibration.

The normal shared assessment export and build check require these records. A changed definition, node kind, unit, geography or source contract requires a route review. New published nodes cannot silently receive a generic route. This validation does not generate a score or authorize new values.

The [381-record catalogue](../../artifacts/tulip-consequence-calibration-v1-2026-09-28/catalogue-assessments.json) now includes the explicit route, source interpretation and consequence requirements. It retains both domains under the agreed 50/50 rule, including 190 previously omitted domain positions. It carries forward the rejection of the two water inputs and withdrawal of 132 incoherent lower components across 110 nodes. Correct replacement quantities for those cases remain missing.

A supported DALY amount can be mapped without a separate harmed-person count, an extra persistence multiplier, or a fatal/nonfatal decomposition solely for mapping the combined health amount. These redundant requirements have been removed from the new research requirements. An observed death count, exposure estimate or service interruption still needs its own justified conversion. Existing historical audit files have been preserved.

## New source work

The original [industrial emissions and health study](https://www.nature.com/articles/s41598-023-38075-z) and its supplementary workbook provide six historical model reference cases. Python reads the raw spreadsheet XML with 60-digit Decimal arithmetic; a separate JavaScript implementation reads the same source independently. All 26 rows and four direct particulate-health columns agree. Missing health cells are rejected, not filled with zero. CO2 health columns are excluded from the direct particulate totals because their pathways and accounting differ.

| Source category | Direct modeled particulate-health DALYs per year, approximately |
| --- | ---: |
| Coal power plants | 641,312 |
| Gas power plants | 64,957 |
| Oil power plants | 211,677 |
| Steel mills | 91,579 |
| Oil refineries | 59,320 |
| Cement plants | 261,597 |

These estimates use **2016 industrial inventories** and source-specific fate/effect characterization. They are historical magnitude references, not admitted current full-removal burden estimates or whole-node ratings. Marginal versus full causal accounting, time basis and coverage need review. A source year does not become 2026 by relabeling; older evidence is not rejected merely for being older when it is the latest compatible evidence available.

The catalogue attaches partial references to cement, steel and gas-power dependence, and a **SO2-only** coal-health reference to coal sulfur emissions. The broad plant totals are not copied to the CO2-only nodes. Each attachment identifies its incomplete boundary and missing nature coverage. Together with the earlier WHO air-health, coral-cover and forest-extent packets, seven nodes now carry explicit partial endpoint or context packets. This is not seven completed replacement ratings.

The official ISIMIP3a biodiversity inventory was queried again on 28 September: **24 obsclim datasets and no counterclim datasets** under the declared filter, with no additional page. This route therefore still lacks matched biodiversity counterfactual outputs. It does not prove that every possible ecological model is unavailable. The query responses and hashes are preserved in the [availability record](../../artifacts/tulip-calibration-completion-2026-09-28/isimip-availability-recheck.json).

The [latest WMO water release](https://public.wmo.int/news/media-centre/wmo-recent-water-trends-have-serious-future-implications) adds 2025 physical context: 36% of basin area had below-normal modeled river discharge; glacier mass loss was 408 ±132 gigatonnes for hydrological year 2025. River comparisons use 1991–2020. The satellite terrestrial-water-storage figure uses 2002–2020; its shorter source baseline is kept explicit. These observations do not supply the missing health, service or ecosystem consequences for the two water cases.

## Decisions resolved after this research pass

The user approved labelled internal estimates and extra priority for rare, irreversible ecosystem losses. The adjustment is capped at **1 nature point**, adding at most **0.5 points overall**, under the unchanged 50/50 combination. Model results may inform these estimates without being presented as observed harm. The [confirmed decision](../../src/tulip-estimate-policy-decision.json) and [estimate requirements](internal-estimate-decision-2026-09-28.md) supersede the earlier pending policy questions.

No policy question remains open. Actual authored node estimates and platform integration remain to be completed. The stricter measured-consequence branch below is retained as a scientific evidence track; its missing inputs do not prevent an explicit, documented internal estimate.

## Remaining scientific evidence limitations

The candidate is a fixed calculation protocol. It does not create the real ecosystem profiles, causal comparisons and human function-loss quantities needed to populate it. Every issue node still needs a complete compatible pair of domain assessments. Health-only evidence cannot be reweighted into a whole score; exposure cannot be converted to harm by renaming its column; missing nature evidence cannot become zero. The experimental ecological thresholds and non-health bridge also remain proposed internal index choices, not empirically established equivalences.

The two water cases need source-supported consequences with compatible cohorts and periods. The 132 invalid lower components need real bounds or an explicit absence of reported bounds; they have not been replaced with invented ranges. Other routes likewise need typed outcome, attribution and overlap review. The confirmed permission for internal judgment estimates changes the standard; it does not retroactively validate a measurement.

**Complete whole-node replacement ratings: 0. Existing public scores changed: 0.** All 354 existing public numbers remain visible. No publication, outside outreach or phone installation occurred.

## Checks completed

The route guard, 381-record coverage, separate source arithmetic, candidate arithmetic, unchanged shared assessments and mobile/native snapshot parity pass. The web build also passes, with its existing bundle-size warning. Checks cover all 381 nodes and 1,290 relationships for shared data parity. No new iOS app build or PDF layout was needed for these research records and build-time guards; this pass does not claim fresh visual verification or a numerical rollout.

The [source workbook reproduction](../../artifacts/tulip-calibration-completion-2026-09-28/industrial-health-reproduction.json), [research routes](../../src/tulip-consequence-routes-v1.json) and [status CSV](../../artifacts/tulip-consequence-calibration-v1-2026-09-28/catalogue-status.csv) retain the calculation and per-node evidence trail.
