# Historical coral references: source integrity before calibration

Prepared 27 September 2026. **Historical observational reference pool; public scores unchanged.**

The [HeatCRD descriptor](https://doi.org/10.1038/s41597-024-03221-3) and its [version-1 SQLite dataset](https://doi.org/10.6084/m9.figshare.25488724.v1) provide repeated live-coral-cover observations from 1977–2020. Cover describes reef-substrate occupancy. The dataset supports testing how a conversion rule handles real magnitudes; it does not supply current node-attributable harm or a complete ecological condition measure.

The [audit script](../../scripts/audit-heatcrd-calibration-inputs.py) checks the published file size and MD5, pins its SHA-256, opens SQLite read-only, records exact SQL and preserves source row/sample identifiers. The 82 MB database stays outside the repository; the [published metadata](../../artifacts/tulip-consequence-rule-audit-2026-09-27/heatcrd-v1-published-metadata.json) identifies the file needed to reproduce extraction.

## The relational export cannot be joined safely

File integrity returns `ok`, but it does not establish correct scientific record linkage:

| Observed check | Result | Consequence for this extraction |
| --- | ---: | --- |
| Declared base-table foreign-key violations | 51,548 | Some include missing-value codes; the total alone does not identify a cause. Base-table joins are not admitted. |
| Base samples disagreeing with stored query samples on site or year at a shared sample ID | 24,086 | Matching an ID can attach an observation to a different site or period. |
| Base sites disagreeing with stored query sites on coordinates at a shared site ID | 1,658 | Raw site IDs do not reliably identify the query's geographic record. |
| Stored cover-query rows with no matching query sample | 0 | Query-record coverage is complete for these fields. |
| Stored cover/sample-query disagreements on site, coordinates, date, depth or citation | 0 | Their consumed fields are internally consistent. |
| Stored sample/site-query disagreements on coordinates or citation, including missing query sites | 0 | The query snapshots support a consistent descriptive reference route. |

For example, query site **709** represents an Orpheus Island location at approximately −18.581181, 146.497442. Base site 709 has different coordinates. Base site **1** has the first location's coordinates. A renumbering during export is a plausible explanation, but the cause is unverified. We do not relabel IDs or repair joins by assuming row order or matching coordinates.

The self-contained `Query_3_All_Cover` records, cross-checked against `Query_2_All_Samples` and `Query_1_All_Sites`, are used only for historical observations. Internal agreement is not independent scientific validation. The native Access dataset and original studies remain routes to verify the underlying identities and survey methods.

## Conflicting measurements and route coverage

The cover query contains **29,208 rows for 29,205 sample IDs**. Three sample IDs have conflicting cover values: 42146 has 3% and 9%, 42208 has 5% and 8%, and 42215 has 7% and 12%. All six rows are quarantined; the extractor neither averages them nor picks a preferred value. Separately, 243 rows share an ambiguous site/date/depth grain. Repeated sampling may be legitimate, but the export alone cannot resolve its measurement unit.

The route excludes 8,154 rows overall, leaving 21,054 eligible observations. Exclusion reasons overlap: 6,826 lack depth; 3,538 lack month; 241 have coordinates outside this route's precision requirement; and two lack cover values. These are limitations of this matching route, not a blanket declaration that the observations are invalid for all research.

Eligible records form **2,078 consecutive comparisons across 719 sites**, matching stored site, known depth, calendar month and citation, with the later observation in a different year. Same-year adjacent comparisons are skipped. Unknown survey days remain unknown; no exact disruption duration is derived. Matching these fields reduces obvious scope mismatches but does not prove unchanged field methods or identify the intervening disturbance.

The [pair artifact](../../artifacts/tulip-consequence-rule-audit-2026-09-27/heatcrd-historical-cover-reference-pairs.json) retains absolute and relative changes separately: 992 pairs decline, 999 increase and 87 are unchanged. Eight pairs start at zero cover, so relative change remains undefined instead of receiving a denominator substitute. No average is interpreted as a global loss or probability distribution.

A Maldives reference has **83.3% to 12.3%** live-coral cover: **71 percentage points** of substrate cover and approximately **85.2% relative decline**. An Indonesian reference with **41.25% to 0%** cover has **41.25 percentage points** loss and **100% relative decline**. These are different measurements. Neither a common percent symbol nor a complete relative decline establishes equal total ecosystem harm. Site footprint, ecological reference and community/function consequences still matter.

## Rule carried forward to future nodes

Source admission must validate the actual joins and fields used in the assessment, including counts before and after joining, conflicting measurements and the identity of the affected group/place/period. A checksum, valid units and a numeric percentage cannot establish that lineage. Unrelated missing lookup codes should not disqualify an otherwise independent observation route; a conflict in consumed measurement identity must.

Retain observed indicator change separately from an attributed consequence. A historical before-value is not a current no-node counterfactual. Area weights, causal attribution, current persistence and a complete condition interpretation remain unresolved here. [Mellin et al. 2024](https://doi.org/10.1098/rspb.2024.1538) also finds that total-cover change can miss community restructuring; this is a reason to review additional ecological outcomes rather than assign an unsupported bonus or equate cover with all nature harm.

The [Python tests](../../scripts/test-heatcrd-calibration-inputs.py) challenge conflicting sample IDs, ambiguous grain, missing fields, dates, source/depth/season changes, zero baselines and changed site coordinates. The [independent JavaScript check](../../scripts/test-heatcrd-reference-pairs.mjs) reproduces arithmetic for every retained pair and verifies the pinned artifact, exclusions and scope. These checks pass. They do not establish a calibrated score; this pool contains **zero completed current node assessments**.
