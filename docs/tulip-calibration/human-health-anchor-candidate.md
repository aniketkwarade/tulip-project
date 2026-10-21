# Human-health absolute-burden anchor candidate

Prepared 27 September 2026. **Internal calibration candidate; no public or whole-node TULIP score changes.**

WHO's [Global Health Estimates 2021 download page](https://www.who.int/data/gho/data/themes/mortality-and-global-health-estimates/global-health-estimates-leading-causes-of-dalys/) defines a DALY as one equivalent full-health year lost and provides its global 2021 cause workbook. The [source-pinned extraction](../../scripts/extract-who-ghe2021-daly-benchmarks.py) checks the workbook digest, year, geography, cause code, label and cell. The resulting [ten reference rows](../../artifacts/tulip-consequence-rule-audit-2026-09-27/who-ghe2021-daly-benchmark-cases.json) span roughly 28,000 to 3.01 billion annual DALYs. These WHO cause estimates are **magnitude examples**, not climate-attributed TULIP scores or additive pieces of a new total.

The [candidate anchor record](./human-health-anchor-candidate.json) defines a proposed annual **human-health-only** ruler: verified zero maps to 1; 100,000 DALYs to 3; 1 million to 5; 10 million to 7; 100 million to 9; and WHO's 2021 global all-cause 3.013 billion to the 10 ceiling. Values between those points use the existing piecewise `log(1 + DALYs)` interpolation. The decade-spaced middle thresholds and score labels are **TULIP policy choices**, not numbers prescribed by WHO or a fitted percentile of current nodes. The fixed outer reference prevents a new node from moving everyone else's score; changing the anchor version would require rerunning all assessments.

The [executable comparison](../../scripts/analyze-who-human-health-anchor-candidate.mjs) maps external WHO examples to inspect what those choices imply:

| WHO global 2021 cause example | Modeled annual DALYs | Illustrative component reading |
| --- | ---: | ---: |
| Leprosy | 28,342 | 2.8 |
| Trachoma | 134,212 | 3.3 |
| Dengue | 1,755,926 | 5.5 |
| Drowning | 18,888,520 | 7.6 |
| Malaria | 52,059,168 | 8.4 |
| Lower respiratory infections | 105,642,423 | 9.0 |
| COVID-19 | 243,062,573 | 9.3 |
| All causes | 3,013,734,614 | 10.0 |

This table illustrates the ruler, **not ratings of those diseases**. It does not imply that dengue or COVID-19 is climate-attributable. The candidate maps a separately source-bound WHO 2021 joint ambient-and-household air-pollution estimate of 184 million DALYs to a **9.2 human-health endpoint reading**, with its WHO 142–228 million interval mapping to 9.1–9.2. That is neither the whole Air Pollution Health Burden node nor independent confirmation of its existing public 9.3. The cause table and risk-attributable air-pollution estimate can overlap and must not be added.

Anchor choice still matters: shifting every middle burden threshold by a factor of two, while keeping verified zero and the all-cause ceiling fixed, moves some external reference readings by **0.6 points**; the air-pollution endpoint's central reading becomes **8.9** with doubled thresholds or **9.3** with halved thresholds. This is policy sensitivity, not a statistical interval. The [analysis artifact](../../artifacts/tulip-consequence-rule-audit-2026-09-27/who-health-anchor-candidate-analysis.json) keeps all compared values.

This is a real magnitude ruler for **health DALYs only**. It does not yet convert essential-service disruption into DALYs or welfare years, give nature a compatible consequence measure, settle aggregation of unlike human harms, or establish complete node coverage. A locally catastrophic event could have a modest absolute annual DALY total; if TULIP intends to give such events an extra criticality premium, that is a separate value choice and must not be hidden in this health-loss scale. The next adjudication must judge these anchor meanings independently of desired current node scores and test other source-native endpoints and held-out mixed cases. Until then, `publicReady` is false.
