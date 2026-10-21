# European temperature–mortality long-record analysis plan

This plan fixes the analysis before the complete 1950–2022 result is available. It prevents TULIP from choosing periods or diagnostics after seeing the full regional pattern.

## Fixed input

- ERA5-Land hourly temperature aggregated to the 971 mortality-panel regions with the checksum-pinned equal-area weights.
- ISO weeks 22–35 for every year from 1950 through 2022: 2,352 hours per region-year.
- Exactly 70,883 region-year summer means. Missing years, regions or hours are not imputed.
- HadCRUT5.0.2.0 global anomaly, using the already pinned four-year trailing mean inclusive of each assessment year.

The analysis must refuse to run until every annual checkpoint, checkpoint digest, source identity, combined-file hash and coverage invariant passes.

## Fixed calculations

For each region, fit ordinary least squares of its annual summer mean temperature against the four-year trailing HadCRUT5 global anomaly.

- **Full period:** 1950–2022, 73 observations.
- **Early challenge period:** 1950–1985, 36 observations.
- **Late challenge period:** 1986–2022, 37 observations.

Record the slope, intercept, slope standard error, R² and implied 2022 local warming for the full fit. Record both split-period slopes, their absolute difference and whether their signs disagree. Summarize the 971 regional results without weighting them by catalogue scores, population, graph position or the size of an emissions source.

The split boundary is fixed because it divides the 73-year record as evenly as possible. It is not a climate-normal boundary and must not be described as one.

## Interpretation rules

- A long record improves the estimate of a regional temperature response; it does not measure deaths, affected people, ecosystem condition or recovery.
- A positive regional slope is not automatic evidence that the pattern is suitable for source-removal attribution.
- A negative slope, a confidence interval that includes zero, a split-period sign reversal or a large split-period difference remains visible as instability. No result is deleted as an outlier merely because it weakens the pattern.
- The 1991–2020 WMO climatological normal remains the reference for describing current climate anomalies. The 1950–2022 record serves trend and stability analysis and does not replace that normal.
- The same full and split calculations apply to all 971 regions. No region-specific tuning is allowed.

## Admission boundary

This analysis alone changes zero TULIP axes and zero ratings. Before any source-specific human score can change, the regional pattern must also be compared with an independent model or author output and propagated through the complete matched mortality endpoint, including all 100 epidemiological bootstrap fits. A compatible ecosystem endpoint remains separately required for the nature half of an emissions-source score.

Thresholds for converting terminal consequences into TULIP severity, reach and persistence remain the fixed catalogue-wide TULIP anchors. They cannot be fitted to the ranking produced by this analysis.
