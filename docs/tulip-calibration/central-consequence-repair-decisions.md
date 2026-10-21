# Two central consequence repairs

Prepared 27 September 2026. These are **source-bound rejection and repair decisions for the experimental method**, not new public scores. Both existing decimal ratings stay in place.

## Glacier-Fed Water Dependence

- Current public score: **5.5**. The old central human vector is seriousness **0**, reach **4**, duration **2**. It cannot represent one realized harmful consequence: zero current harm is combined with a large dependent population and a long physical dependency.
- [UNESCO's 2025 World Water Development Report](https://www.unesco.org/en/reports/wwdr/2025) reports that over two billion people depend on mountain waters. Its dependent-population figure is a vulnerability denominator, not people with an attributable shortage. A [2026 regional meltwater study](https://www.nature.com/articles/s41467-026-73245-3) models scarcity **alleviated** by meltwater for a regional group; it cannot be inverted into a global harmed count.
- **Experimental correction:** the human central component has no admitted consequence vector. Do not turn dependence into harm, set the unknown result to zero, or borrow harm from a downstream water-scarcity node.
- **Evidence needed for a numerical replacement:** define one current water-service, livelihood or health outcome attributable to changed glacier contribution; count the unique group experiencing it; specify place, period, without-change comparison and how long the consequence lasted or will take to recover. If only a regional outcome is available, do not claim it represents the global node without a justified geographic model.

## Surface Water Storage Instability

- Current public score: **4.4**. The old central human vector is seriousness **0**, reach **3**, duration **2**. The reach came from residents in basins with receding water, while the duration came from the physical observation window. Neither is a count or duration of realized human loss.
- [UN-Water's 2024 ecosystem update](https://www.unwater.org/publications/progress-water-related-ecosystems-2024-update) reports **93.1 million residents** in basins with receding permanent surface water and **364 of 13,894 basins** with that trend. Those are exposure and physical-change measures. The basin count is not automatically the percentage of a named ecosystem's full distribution with biological condition loss.
- **Experimental correction:** withhold the central human vector. The old ecosystem **1/1/2** is also unvalidated under the typed condition rule; the basin trend alone does not establish severity relative to a defined ecological reference and collapse state or a recovery period. Do not promote the ecosystem component alone to a whole-node replacement.
- **Evidence needed for a numerical replacement:** human shortage, service interruption or health outcome among a bounded affected cohort, with attributable duration; and, for nature, a named freshwater ecosystem condition indicator, its full distribution denominator, attribution and recovery evidence. Keep climate, extraction, land use and storage operations distinct where the source cannot attribute their shares.

Both cases are tracked in the [full typed review ledger](../../artifacts/tulip-consequence-rule-audit-2026-09-27/review-ledger.json). Their old v6 ratings are an audit and continuity measure, **not** evidence that the rejected experimental vectors measure current harm.

## Executable source repair, 27 September update

The [source-repair record](../../artifacts/tulip-consequence-rule-audit-2026-09-27/central-water-source-repairs.json) now binds both rejection decisions to captured source quantities and hashes. Unknown central and bound quantities remain absent; neither dependence nor missing evidence becomes zero. The ledger links these explicit decisions while retaining the original vectors for audit.

The glacier metric contract incorrectly named NASA's sea-level portal. It now names the actual WMO/UNESCO context source and explicitly marks its **glacier-only seasonal runoff observation missing**. The source registry, operational source list, snapshot and generators no longer claim that mass loss and glacier-plus-snow dependence measure seasonal runoff share. The source remains useful context; the existing public 5.5 stays unchanged.

The regional meltwater source workbook reproduces its historical summary across 31 annual rows. Its ± figures describe year-to-year variability, not confidence bounds. Its published notebook uses a mean of monthly scarcity ratios, whereas the paper defines annual scarcity through annual withdrawal and availability totals. The [method diagnostic](../../src/tulip-water-scarcity-source-audit.js) demonstrates that these rules can classify the same invented volumes differently in either direction. Missing months, unmatched scopes and incompatible units are refused; undefined zero-supply ratios are retained without an epsilon.

This finding does **not** establish the size of any error in the study's results: the original catchment-month volumes and population joins are unavailable in the captured source bundle. Nor can historical regional scarcity avoided by snow-plus-glacier melt establish present global glacier-related harm. The [source audit](../../artifacts/tulip-consequence-rule-audit-2026-09-27/regional-meltwater-source-audit.json) retains those boundaries.

For surface-water storage, the 93.1 million residents, basin counts and declared observation periods remain context. No human shortage magnitude, biological-condition magnitude or duration of realized loss is inferred from them. The current public 4.4 stays unchanged.

Reproduction commands:

```sh
node scripts/test-tulip-water-scarcity-source-audit.mjs
python3 scripts/extract-tulip-meltwater-source.py
node scripts/analyze-tulip-central-water-repairs.mjs
node scripts/build-tulip-consequence-review-ledger.mjs
node scripts/test-tulip-central-water-repairs.mjs
```

The Python extraction requires the bundled environment's `openpyxl`. These checks close identified proxy and ingestion-readiness errors; they do not approve replacement numerical ratings or ecological conversion anchors.

## Preserving public values without refreshing their scientific approval

Correcting the glacier source contract invalidated its previous input fingerprint. The build now reproduces that one existing public assessment from an explicit [frozen continuity record](../../artifacts/tulip-consequence-rule-audit-2026-09-27/public-score-continuity.json). Its old metric contract, candidate, policy and complete public record are pinned separately from the corrected live source contract. The live contract remains context-only and missing its direct measurement.

This is not a new approval or a generic fallback for stale assessments. Any further change to the source inputs, candidate, policy or public record fails the continuity check. Its replacement remains unadmitted. The public 5.5 is retained under the user's continuity instruction; the rejected consequence interpretation remains unresolved. Both the continuity test and the complete assessment reproduction/parity test pass.
