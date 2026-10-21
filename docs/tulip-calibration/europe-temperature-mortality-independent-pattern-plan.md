# European temperature–mortality independent-pattern comparison plan

This plan fixes the independent comparison before the complete ERA5-Land result is visible. Its purpose is to challenge the regional temperature-to-global-warming pattern used by the emission-source endpoint. It cannot change a TULIP axis or rating on its own.

## Independent evidence

The primary comparison source is the frozen [IPCC AR6 Interactive Atlas CMIP6 dataset](https://cds.climate.copernicus.eu/datasets/projections-climate-atlas?tab=overview). The IPCC Atlas team harmonised the contributing models onto a common grid and published the exact model inventory and processing code in the [IPCC-WG1 Atlas repository](https://github.com/IPCC-WG1/Atlas). This source is independent of ERA5-Land and provides modelled regional temperature change relative to global warming.

The temporal-resolution challenge uses the [NASA NEX-GDDP-CMIP6 archive](https://www.nccs.nasa.gov/data-collections/nex-gddp-cmip6/). It contains daily, 0.25-degree, bias-corrected output for 35 CMIP6 models. Historical files cover 1950–2014 and SSP2-4.5 files cover 2015 onward. The method and archive are described by [Thrasher et al.](https://doi.org/10.1038/s41597-022-01393-4). A direct value check shows that the archive's `tas` values equal `(tasmin + tasmax) / 2` within 0.00002 K even though the `tas` file incorrectly inherits `cell_methods: time: maximum`; TULIP therefore calls this variable the daily temperature midpoint and retains the metadata defect in the audit record.

The two sources answer different checks. The IPCC Atlas ensemble is the primary forced-pattern comparison. NASA NEX tests whether the coarser monthly/seasonal result changes materially when the exact ISO-week window and finer topography are used. Agreement between them is evidence of robustness; disagreement remains visible and blocks promotion.

## Fixed model and time selection

- Use every IPCC Atlas CMIP6 model with the required temperature output. Do not select models after viewing their agreement with ERA5-Land.
- For the NASA challenge, start from all 35 entries listed in the NCCS catalogue snapshot. A model is eligible only if the same declared ensemble member has daily `tas` for every year from 1950 through 2014 under `historical` and from 2015 through 2022 under `ssp245`, and the source can return all 98 consecutive days in the declared Gregorian ISO-week 22–35 window. `GFDL-CM4_gr2` is a second grid variant of GFDL-CM4, so both variants are combined before GFDL-CM4 receives one model vote.
- Record every excluded model and the exact missing file or incompatible member. Do not replace an excluded model with a hand-picked alternative.
- Use 1950–2022, with the fixed early period 1950–1985 and late period 1986–2022.
- Use each model’s own four-year trailing global annual near-surface temperature anomaly, relative to its 1850–1900 mean, as the predictor. Observed HadCRUT5 is not used as the predictor for model output.
- Use SSP2-4.5 only for 2015–2022. Other pathways may be reported as sensitivity checks and cannot be mixed into the central comparison.

## Fixed regional calculation

- Preserve the same 971 mortality-panel region IDs and fixed official GISCO geometries used by the ERA5-Land analysis, including the five French overseas regions and the Azores.
- Build a separate area-intersection matrix for each independent grid. Reusing 0.1-degree ERA5-Land weights on a 0.25- or 1-degree grid is prohibited.
- NASA daily-midpoint data use ISO weeks 22–35 inclusive, exactly matching the ERA5-Land analysis. Every region-year must contain all 98 expected days and every day must retain at least 99% of that region's separately frozen finite source-mask area. Stable ocean-only cells are outside the admitted mask; missing values inside it fail the checkpoint. The comparison remains a declared variable-definition sensitivity because the NASA midpoint is not a true 24-hour mean.
- The IPCC monthly product uses its published seasonal temperature output. Because it cannot reproduce an exact ISO-week window, compare both June–August and a day-overlap-weighted May–September approximation. Treat the difference as a declared temporal-resolution sensitivity rather than merging the two values.
- For the monthly approximation, count the Gregorian days from each calendar month that overlap ISO weeks 22–35 in that year; the weights total 98 days. Every region-month must retain at least 99% of its exact intersected grid-cell area. Normalize only over finite intersected area and stop that model checkpoint if the threshold fails.
- Fit the same full, early and late ordinary least-squares regressions for every eligible model and region. Preserve negative slopes, low R², sign reversals and split-period disagreement.

## Predeclared comparison tests

For every region, summarize the eligible model slopes using the median and type-7 linear 5th–95th percentile interval. Report both one-model-one-vote and one-institution-one-vote results so closely related model families cannot dominate the ensemble. For the institution view, average model slopes within each institution first and then give every institution one equally weighted vote.

The pattern passes the independent challenge only if all of the following are true in both weighting views:

1. At least 90% of regions have the same slope sign in ERA5-Land and the ensemble median.
2. The spatial Spearman correlation between the 971 ERA5-Land slopes and ensemble-median slopes is at least 0.80.
3. At least 80% of ERA5-Land regional slopes fall inside the model 5th–95th percentile interval.
4. The median absolute ERA5-to-ensemble slope difference is no greater than 0.25 °C of local summer warming per 1 °C of global warming.
5. No region is evaluated with fewer than ten eligible models, and no country aggregate silently mixes an uncovered subregion with a covered one.
6. The exact-week NASA challenge does not reduce sign agreement below 90%, spatial correlation below 0.80, or interval coverage below 80%.

These are explicit TULIP promotion tolerances, not universal scientific constants. Report the continuous diagnostics alongside the pass/fail result. A failed threshold is not rounded into a pass and no region is removed because it weakens agreement.

The completed handoff is one explicit promotion record. It verifies the 20 monthly checks across both seasonal definitions and weighting views, then the 10 exact-week checks across both weighting views. Only a 30-of-30 pass admits the ERA5-Land full-period slopes as a regional-pattern input to the matched mortality calculation. This promotion changes no axis or rating by itself.

## Admission boundary

Passing this comparison admits only a regional temperature-pattern input for the human endpoint. It does not measure deaths, people harmed, ecosystem condition or recovery.

Before an emission-source rating can change, the compatible source-removal temperatures must pass through the complete daily mortality endpoint and all 100 fixed bootstrap fits. The resulting terminal human consequence must then map to the catalogue-wide severity, reach and persistence anchors. A separate compatible ecosystem endpoint, or a reviewed structural exclusion, remains required for the nature component.

No source rating changes because a model pattern looks plausible, because many models agree, or because the record is long.

## Access state

The NASA NCCS subset service is reachable and its fixed 600 × 1,440 daily grid is verified from a full-grid NetCDF subset. A frozen pre-result inventory identifies 33 of 35 catalogue entries with a complete 1950–2022 series, representing 32 candidate model votes after the GFDL grid variants are combined. CMCC-CM2-SR5 is excluded because its `tas` catalogues are empty; HadGEM3-GC31-MM is excluded because SSP2-4.5 is absent. Exact polygon weights cover all 971 regions, and a separately frozen reference land mask retains 11,842 weighted cells and non-zero admitted area for every region. The original six-tile candidate plan contains 2,409 atomic annual checkpoints, 14,454 tile requests and a 27.13 GB raw-float planning estimate before NetCDF overhead.

A pre-analysis calendar gate then tests whether the source represents the declared Gregorian window without altering its dates. HadGEM3-GC31-LL, KACE-1-0-G and UKESM1-0-LL use 360-day calendars and return only 95 source days for the 98-day Gregorian request. They are excluded rather than padded, duplicated, interpolated or remapped. The admitted exact-week execution therefore contains 30 catalogue entries, 29 canonical model votes, 2,190 annual checkpoints and 21 institutions. The frozen 33-entry inventory and 2,409-checkpoint plan remain unchanged as the audit record of the candidate universe; the downstream compatibility record fixes the smaller execution universe before regional results are analysed. The configured Copernicus token authenticates, but the CDS currently returns `required licences not accepted` for the frozen IPCC Atlas dataset. Retrieval of that primary comparison remains gated on acceptance of the dataset’s CC-BY terms in the account.

The model-global predictor is independently frozen from the checksum-pinned IPCC AR6 figure-data release on Zenodo. An exact model/member series is admitted only when one file supplies the entire 1850–1900 baseline and 1950–2022 analysis period. A shorter file, a different ensemble member, a model mean or HadCRUT5 cannot silently fill a gap. The resulting inventory records every unresolved identity before any regional-model result is calculated. Seventeen of the 32 independent identities pass this exact-file gate. Six have an exact SSP2-4.5 file beginning in 2015 but no historical segment in the frozen record, and nine are absent from that record.

The remaining 15 identities have frozen exact-member historical and SSP2-4.5 routes in the checksum-pinned Pangeo/ESGF cloud catalogue. Ten use exact same-grid `areacella`; five use one-dimensional latitude and longitude bounds from which spherical cell area is calculated without borrowing another grid. All 15 now pass monthly coverage, calendar, area, 1850–1900 baseline and 1950–2022 predictor checks. Together with the 17 immutable figure-data predictors, the merged independent global-predictor ensemble is complete for all 32 preselected model votes. No different member, model average or observed series fills a gap.

Where the immutable figure-data record contains the same exact-member SSP2-4.5 file, the executed 2015–2022 annual values are compared directly against that file. Six routes have this overlap; the minimum correlation is 0.999795 and the largest mean absolute difference is 0.009836 °C. The separate IPCC Figure 3.4 panel is retained as a continuous processing diagnostic because its published series can differ through ensemble or preprocessing choices; disagreement with that panel is reported and investigated rather than silently turning into a different member selection.

A separate pre-result Pangeo inventory now freezes monthly regional-temperature routes for all 32 model votes. Twenty-nine have one exact historical/SSP2-4.5 grid plus either published same-grid cell area or same-store coordinate bounds. ACCESS-ESM1-5 r1i1p1f1 and GISS-E2-1-G r1i1p1f2 have no exact-member SSP2-4.5 monthly store in the pinned cloud catalogue. CNRM-ESM2-1 r1i1p1f2 has compatible temperature stores but no exact area file or published coordinate bounds under the frozen rule. Those three are excluded from the monthly route before regional results are visible; they are not replaced with another member or inferred cell bounds. The separately frozen NASA daily route remains the exact-week challenge.

Published cell-bound geometry is independently admitted for 22 model votes across 17 unique grids. Seven additional temperature routes fail the fixed geometry gate because historical and scenario bounds differ, bounds are absent, or the published bounds do not meet the full-sphere tolerance. Together with the three unresolved temperature routes, they remain explicit monthly exclusions. Exact polygon intersections and 1950–2022 regional series are complete for every admitted grid and all 971 fixed mortality-panel regions, with no uncovered region. The frozen analysis contains 42,724 full-period model-region-season fits and matching early- and late-period diagnostics across 22 models and 17 institutions. No pass is claimed until the complete ERA5-Land pattern is compared under the predeclared tests and the exact-week NASA challenge is resolved.
