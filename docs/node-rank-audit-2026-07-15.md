# Node Rank Audit

Generated: 2026-07-15

Purpose: normalize the existing graph-internal defensibility audit into a 1-to-5 ranking for node truth and connection strength.

## Inputs

- `tmp-node-defensibility-audit.md`
- `tmp-connection-consumer-audit.md`
- `docs/node-evidence-docket-2026-07-15.md`

## Scale

- `5`: highly defensible; strong official or primary grounding and/or multiple curated edges
- `4`: defensible with caveats; real node, but some topology is still inferred or generated
- `3`: mixed; plausible and often source-backed, but the local graph neighborhood is mostly modeled
- `2`: weak in the current repo; family-calibrated or lightly grounded and not yet well-supported by explicit edge evidence
- `1`: weakest; mostly generated or family-only with sparse or procedural topology

## Mapping Used

### Node truth rank

- `5`: anchor nodes with `primary_research_link`, or anchor nodes with `web_verified_official` / `official_registry_link` and internal score `>= 68`
- `4`: official, web-verified, or primary-research nodes with score `>= 58`
- `3`: official, web-verified, or primary-research nodes below that threshold
- `2`: `family_calibrated_reference` nodes with score `>= 40`
- `1`: the remaining family-only generated nodes

### Connection rank

- `5`: `>= 4` curated edges
- `4`: `2-3` curated edges
- `3`: `1` curated edge, or a dense family-supported neighborhood
- `2`: mostly generated or inferred topology
- `1`: sparse local topology with no curated support, or `D` tier nodes with no curated edges

### Overall rank

- `5`: internal score `>= 76`
- `4`: internal score `68-75.9`
- `3`: internal score `56-67.9`
- `2`: internal score `40-55.9`
- `1`: internal score `< 40`

## Repo-Wide Result

- Total nodes audited: `501`
- Overall rank counts: `5=8`, `4=36`, `3=87`, `2=259`, `1=111`
- Node truth rank counts: `5=43`, `4=62`, `3=192`, `2=93`, `1=111`
- Connection rank counts: `5=17`, `4=10`, `3=41`, `2=127`, `1=306`

## Read This Carefully

- The graph has far more nodes that are conceptually plausible than nodes that are well-supported at the edge level.
- The biggest weakness is connections, not the existence of many top-level topics.
- The most urgent cleanup target is the large set of `family_calibrated_reference` anchors that still read like important canon, but are only weakly grounded in the current repo.

## Strongest Nodes Right Now

- `Semiconductor Fabs`
- `Global Temperature`
- `Environ. Anomalies`
- `Altered River Flow Regime`
- `Carbon Emission`
- `Ground-Level Ozone Formation`
- `Resource Depletion`
- `Migration`
- `Urbanization`
- `Methane Emissions`
- `Industry Farming`
- `AMOC Weakening`
- `Deforestation`
- `Wet-Bulb Heat`
- `Groundwater Overdraft`

## Weak Anchors That Most Need Evidence Upgrades

- `Wildfire Regime Shift`
- `Public Health Heat Burden`
- `Critical Infrastructure Fragility`
- `Insurance Retreat`
- `Shipping Lane Disruption`
- `Adaptation Capital Shortfall`
- `Mortgage Market Exposure`
- `Cooling Water Competition`
- `Conflict Risk Escalation`
- `Food Import Exposure`
- `Road Freight Diesel Lock-In`
- `Grid Peak Load Stress`
- `Freshwater Ecosystem Collapse`
- `Desalination Dependence`
- `Basin Treaty Breakdown`

## Full Ranking Source

The complete ordered ranking for all `501` nodes remains in `tmp-node-defensibility-audit.md`.
