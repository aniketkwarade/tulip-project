# Future-node admission example: air-pollution health burden

Prepared 27 September 2026. This is a **source-scope audit**, not a new TULIP rating. It applies the [future-node acceptance contract](./future-node-acceptance-contract.md) to one existing node as though it were newly proposed. The current public decimal rating is unchanged.

## Declare the node before looking for a number

The catalogue describes `air_pollution_health_burden` as chronic respiratory, cardiovascular and mortality harm from ambient ozone, particles and combustion by-products. Its candidate assessment marks **people** as the applicable domain, but leaves its causal role unclassified. For this audit, the proposed outcome is annual **attributable human health loss**, fatal and nonfatal, worldwide. A reviewer still has to settle the node boundary and causal role in the versioned assessment; a source cannot redefine the node just because it measures a convenient subset.

## Source-scope check

| Evidence | What it actually measures | Why it cannot by itself certify the full node |
| --- | --- | --- |
| [WHO World health statistics 2026](https://www.who.int/publications/i/item/9789240122482), section 1.4.4 | A modeled **2021** global joint ambient-and-household *particulate-matter* estimate: 184 million DALYs, 142–228 million uncertainty interval, rounded to millions. | Covers fatal and nonfatal loss for specified particulate-matter-linked causes, but omits ambient ozone and other pollutants named or implied by the node. A 2021 source is not a 2026 observation. |
| [State of Global Air 2025 report](https://www.stateofglobalair.org/sites/default/files/documents/2025-10/soga-2025-report.pdf), PDF pages 22, 29 and 31 | For **2023**, 7.9 million modeled deaths attributed jointly to ambient and household PM₂.₅ and ground-level ozone (6.4–9.4 million); 124 million DALYs attributed to ambient PM₂.₅ alone (101–147 million); 8.5 million DALYs attributed to ozone-linked COPD (1.9–14.6 million). | The 7.9 million is death-only; the 124 million and 8.5 million are separate pollutant/cause results, not a documented joint total. Adding those DALYs or adding a death count to DALYs would ignore overlap and incompatible outcomes. The report says NO₂ is modeled only for childhood-asthma DALYs, with no total NO₂ death estimate. |
| [State of Global Air data tool](https://www.stateofglobalair.org/data) and [methodology](https://www.stateofglobalair.org/data/estimate-burden) | The current tool identifies GBD 2023 as its data source and offers pollutant-specific and “Air Pollution” burden views. The methodology lists which pollutant–disease pairs are modeled. | A tool category or a total returned by its API still needs a source-pinned global, all-ages DALY row, a verified joint/overlap rule, uncertainty and an explicit match to the node boundary. The site’s [how-to page](https://www.stateofglobalair.org/data/how-to) still describes a 2019 app, so it is not a 2023 methodological specification by itself. |

**Ingestion update:** the [captured official global CSV](./soga-air-health-source-audit.md) now provides that parent-risk 2023 row: **232.5 million DALYs, with reported bounds of 194.0–264.1 million**. Its fourteen annual means match the official chart and the selected row has been extracted separately in Python and JavaScript. The missing-row and missing-bounds gaps are closed. Source identity remains conflicted: the live site/client identify GBD 2023/2025, while the CSV footer cites GBD 2021/2023. Exact parent-risk aggregation, node-scope coverage and calibration approval remain open. The point estimate is not an approved whole-node rating.

The newer report is valuable evidence and may support a more complete modeled route after extraction and review. It does **not** repair the WHO endpoint by changing its year, adding pollutant estimates, or labeling the death count as a full DALY measure. The 2021 WHO and 2023 GBD estimates use different years and modeling systems; they are alternative evidence candidates, not low and high bounds of one estimate.

## Admission decision and exact remaining work

**Decision: source-bound human endpoint and a newer combined-row candidate available; whole-node numerical admission not yet passed.** The experimental WHO endpoint already returns `coverage: endpoint_only` and `publicReady: false`. The captured SoGA row advances the evidence binding but retains the provenance and scope gaps above. This is a real-world test of the rule that a source value must match the scored outcome, not merely share its topic.

To pass this node under a frozen method, the assessment must:

1. Resolve whether the node includes household air pollution, NO₂ and other combustion gases, and formally classify its causal role. Record any exclusions in the public definition before choosing the source.
2. Bind a current, global, annual fatal-plus-nonfatal attributable-health-loss estimate to the exact included pollutants and causes, with its counterfactual, uncertainty and source/model versions. If several results are combined, use a documented joint method that avoids duplicate people and outcomes; do not sum marginal uncertainty limits.
3. If a material part of the declared node lacks a direct outcome, use a documented compatible model or transferable analogue with a node-specific adjustment and sensitivity range. A silent assumption that missing harm is zero fails.
4. Apply the **same frozen** human-harm anchors used for other nodes. Keep the unrounded calculation, one-decimal display, source bounds and separate policy-anchor sensitivity. A later unrelated node must leave all of these unchanged.
5. Have two internal reviewers independently reproduce the source extraction, scope match and overlap decision. Resolve disagreements before the packet is admitted. Passing mechanical schema checks alone is not scientific validation.

This example also shows the limit of a universal formula: it can guarantee **consistent treatment of evidence**, but cannot guarantee a truthful numerical rating for a future node that lacks relevant consequence evidence or a defensible transfer route. The publication workflow must obtain that evidence or narrow the node boundary explicitly. It must not create precision from an exposure proxy or a familiar neighboring score.
