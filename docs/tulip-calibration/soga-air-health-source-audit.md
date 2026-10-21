# A real combined air-pollution consequence input

27 September 2026. Source ingestion and calibration diagnostic; public ratings unchanged.

The official [State of Global Air tool](https://www.stateofglobalair.org/data) supplies a **2023 global, both-sexes, all-ages, parent-risk DALY row**. Its CSV reports **232.5 million** years of healthy life lost, with limits of **194.0–264.1 million**. This closes the missing combined fatal-plus-nonfatal quantity gap identified in the [air-pollution admission example](./future-node-admission-example-air-pollution.md).

These are modeled health consequences, rather than people exposed, pollution concentration or a projected ten-year total. Use the 2023 outcome once. The fourteen annual rows from 2010–2023 provide historical context; summing them would change the current-harm construct.

## Extraction and what it proves

The request follows the global-chart and CSV-export routes present in the site's published client. The raw responses are preserved without editing in [the source directory](../../artifacts/tulip-consequence-rule-audit-2026-09-27/soga-2025-source/). The [source candidate](../../artifacts/tulip-consequence-rule-audit-2026-09-27/soga-air-health-source-candidate.json) records the URLs, source hashes, exact row ID, grain, values, metadata conflict and remaining admission gaps.

Python checks all fourteen CSV means against the separately returned official chart, verifies the scope fields and checks ordered bounds. JavaScript independently reconstructs the selected CSV row. Neither implementation evaluates the export's spreadsheet-shaped text cells. These are separate extraction checks, **not independent scientific review**.

The chart response omits uncertainty. The CSV supplies lower and upper fields, so the candidate retains those reported limits. The [SoGA methodology](https://www.stateofglobalair.org/data/estimate-burden) and GBD 2023 paper describe 95% model uncertainty intervals. No probability distribution, climate-change-only attribution or new joint confidence statement is invented by TULIP.

The [2025 report](https://www.stateofglobalair.org/sites/default/files/documents/2025-10/soga-2025-report.pdf), printed/PDF page 5, gives approximately 232 million DALYs and 7.9 million deaths. The chart returns 7.915 million deaths. This supports approximate consistency; it does not prove identical extraction precision or the exact model version.

## Two issues that remain explicit

**Conflicting source identity.** The live page identifies GBD 2023/IHME 2025 and the client identifies the 2025 edition with 2023 data. The CSV citation footer instead names State of Global Air 2023 and GBD 2021. The capture preserves both claims. The source version names the retrieved export, rather than falsely certifying a resolved GBD model version. Approximate report agreement does not resolve the conflict.

**Joint-risk and node scope.** The same tool returns 123.5 million DALYs for ambient PM₂.₅, 105.0 million for household pollution, 8.471 million for ozone and 0.2326 million for NO₂. Their sum is 237.2036 million, which exceeds the parent row by 4.7036 million. This is a diagnostic warning against adding marginals, not an independent reconstruction of the parent estimate. Use the parent row once; do not add deaths, years lost, pollutant marginals or connected-node scores to it.

The [GBD 2023 paper](https://ir.library.osaka-u.ac.jp/repo/ouka/all/103533/Lancet_406_10513_1873.pdf), PDF pages 8–9, describes mediation adjustments, outcome-specific attributable fractions and uncertainty propagation. Its page 16 places NO₂ under the air-pollution risk hierarchy. The exact parent-risk specification, included pollutant–disease pairs and risk-specific counterfactuals still need binding to this export. “All causes” means all **model-included** causes; it does not establish complete coverage of every pollutant or health outcome in TULIP's broader node and relationships.

## Candidate mapping, without promoting it to a public rating

Applying the existing [provisional human-health anchors](./human-health-anchor-candidate.md) produces a **9.2 diagnostic health reading**. The [calculation report](../../artifacts/tulip-consequence-rule-audit-2026-09-27/soga-air-calibration-diagnostic.json) keeps the unrounded reading, source-bound limits, outward-rounded display range and the unchanged current public value of 9.3.

This does not establish that 9.2 is the correct whole-node rating. The anchors remain policy candidates. Cross-model DALY comparability, the source identity conflict, exact included outcomes, full node coverage and genuinely separate scientific adjudication remain open. WHO 2021 and SoGA 2023 are alternative models/years/scopes, not two bounds of one observation.

The catalogue review ledger now links this concrete source-native candidate. It still reports zero admitted typed replacement node assessments; registration is not approval. The current app, native snapshots and public scoring files are unchanged.

## Reproduce

```sh
python3 scripts/extract-tulip-soga-air-burden.py
python3 scripts/test-tulip-soga-air-source.py
node scripts/analyze-tulip-soga-air-calibration.mjs
node scripts/build-tulip-consequence-review-ledger.mjs
```

Further work on this endpoint should resolve the named source/scope gaps. It should not repeat curve selection or interpret this point estimate as a completed method calibration.

The [edition-specific scope follow-up](./soga-edition-outcome-scope.md) now binds the report's clinical display classes, rejects an older general methodology page as the current model specification, and checks the NO₂ source separately. It preserves a negative reported uncertainty limit and the difference between report and export age scopes. The ledger has a named outcome proposal; it remains unapproved. Exact parent-model binding and the CSV-footer identity conflict are still open.
