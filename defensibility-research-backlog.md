# Defensibility Research Backlog

Generated: 2026-07-14

## Goal

Strengthen the platform's defensibility with research before evaluating, pruning, or downgrading nodes and edges.

This backlog is intentionally source-first:

- Prioritize anchors whose weak evidence status drags down many adjacent edges.
- Prefer primary or official sources over generic explainers.
- Use research to upgrade current `family_calibrated_reference` and `curated_anchor_inference` links into cleaner `curated_edge_reference` support where possible.
- Avoid treating research as automatic scoring calibration; first use it to improve anchor grounding and mechanism-level edge support.

## Current State

From the latest node defensibility audit:

- Total nodes: 507
- Total edges: 2444
- Tier A: 1
- Tier B: 40
- Tier C: 195
- Tier D: 271

The anchor layer is mixed rather than uniformly weak. The larger problem is that many important anchors still sit inside neighborhoods dominated by `family_calibrated_reference`, `curated_anchor_inference`, and generated topology.

## Research Tranche 1

These are the best first targets because they are both weak and central.

### 1. `aerosol_cooling_loss`

Why this matters:

- Rank 354 in the current audit.
- Anchor status is only `family_calibrated_reference`.
- Neighborhood includes 9 family edges, 8 inferred edges, and 30 generated edges.
- This node is central to anomaly, agriculture, and circulation-pattern logic.

Research direction:

- Upgrade the anchor itself from family-level support toward an explicit physical-science basis.
- Focus on aerosol masking, aerosol effective radiative forcing, and aerosol-driven changes to circulation and precipitation.

What current primary evidence already supports:

- IPCC AR6 WG1 Chapter 6 says aerosols and other short-lived climate forcers are a core climate-forcing class, not a fringe phenomenon.
- IPCC AR6 WG1 Chapter 6 says historical aerosol changes have primarily contributed to surface cooling, partly masking greenhouse-gas-driven warming.
- IPCC AR6 WG1 Chapter 6 also says aerosol-driven cooling has led to detectable large-scale water-cycle changes and altered circulation patterns.

Immediate edge upgrade candidates:

- `temp -> aerosol_cooling_loss`
- `carbon_emission -> aerosol_cooling_loss`
- `aerosol_cooling_loss -> environ_anomalies`
- `aerosol_cooling_loss -> industry_farming`

Suggested source set:

- IPCC AR6 WG1 Chapter 6: https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/
- IPCC AR6 WG1 main report portal: https://www.ipcc.ch/report/ar6/wg1/

### 2. `cooling_water_competition`

Why this matters:

- Rank 360 in the current audit.
- Anchor status is only `family_calibrated_reference`.
- Only 1 curated adjacent edge despite high centrality in energy, compute, and water stress pathways.
- This node is one of the clearest leverage points for the platform's data-center and semiconductor wedge.

Research direction:

- Gather direct support for industrial cooling demand competing with municipal, agricultural, and ecosystem water use.
- Use official energy and water sources plus applied infrastructure research.

What current evidence already supports:

- The IEA's 2025 `Energy and AI` report explicitly frames AI as an electricity-for-data-centres story and treats impacts on energy security, emissions, innovation, and affordability as material.
- Berkeley Lab's 2024 U.S. data center report establishes an official DOE-linked baseline for historical electricity consumption and near-term demand scenarios.
- WRI Aqueduct is already the repo's official water-risk registry path for location-based freshwater stress.

Immediate edge upgrade candidates:

- `data_centers -> cooling_water_competition`
- `ai_data_centers -> cooling_water_competition`
- `cooling_water_competition -> grid_peak_load_stress`
- `grid_peak_load_stress -> cooling_water_competition`

Suggested source set:

- IEA Energy and AI: https://www.iea.org/reports/energy-and-ai
- Berkeley Lab 2024 U.S. Data Center Energy Usage Report: https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report
- WRI Aqueduct: https://www.wri.org/aqueduct
- Aqueduct Water Risk Atlas: https://www.wri.org/data/aqueduct-water-risk-atlas

### 3. `grid_peak_load_stress`

Why this matters:

- Rank 367 in the current audit.
- Anchor status is `family_calibrated_reference`.
- Only 2 curated adjacent edges, despite being a major bridge between heat, water, digital infrastructure, and adaptation strain.

Research direction:

- Build a tighter evidence base around peak demand stress from heat and compute load.
- Separate true load-stress mechanisms from weaker modeled spillovers.

What current evidence already supports:

- The repo already has curated support for `wet_bulb_heat -> grid_peak_load_stress` and `grid_peak_load_stress -> wet_bulb_heat`.
- The IEA tracks road transport energy demand and transport CO2, and separately tracks electricity/data-centre pressure in the AI report.
- Berkeley Lab explicitly situates data-centre demand in a reliability and grid-analysis context.

Immediate edge upgrade candidates:

- `data_centers -> grid_peak_load_stress`
- `ai_data_centers -> grid_peak_load_stress`
- `grid_peak_load_stress -> critical_infrastructure_fragility`
- `grid_peak_load_stress -> adaptation_capital_shortfall`

Suggested source set:

- IEA Energy and AI: https://www.iea.org/reports/energy-and-ai
- Berkeley Lab 2024 U.S. Data Center Energy Usage Report: https://eta.lbl.gov/publications/2024-lbnl-data-center-energy-usage-report
- IEA Road transport page: https://www.iea.org/energy-system/transport/road

### 4. `aquifer_overdraft`

Why this matters:

- Rank 369 in the current audit.
- Anchor status is `family_calibrated_reference`.
- No curated adjacent edges.
- This node sits at the center of water, agriculture, displacement, and resilience pathways.

Research direction:

- Strengthen the anchor using groundwater observation systems rather than generic water scarcity framing.
- Build direct links between groundwater depletion, agricultural pressure, settlement stress, and water insecurity.

What current evidence already supports:

- NASA GRACE-FO is a direct observational system for groundwater and large-scale water storage change.
- NASA's public GRACE-FO material emphasizes tracking groundwater, surface mass change, and regional freshwater shifts.
- WRI Aqueduct provides a complementary risk lens for place-based water stress.

Immediate edge upgrade candidates:

- `resource_depletion -> aquifer_overdraft`
- `temp -> aquifer_overdraft`
- `aquifer_overdraft -> industry_farming`
- `aquifer_overdraft -> urbanization`

Suggested source set:

- GRACE-FO: https://gracefo.jpl.nasa.gov/
- PO.DAAC GRACE resources already used in repo calibration
- WRI Aqueduct: https://www.wri.org/aqueduct

### 5. `vector_borne_disease_expansion`

Why this matters:

- Rank 355 in the current audit.
- Anchor status is `family_calibrated_reference`.
- No curated adjacent edges.
- This anchor is conceptually important for the human-health side of climate risk, but currently leans too hard on family logic and modeled reroutes.

Research direction:

- Ground the anchor in health-system and disease-burden literature.
- Separate direct climate-sensitive disease mechanisms from looser social spillover claims.

What current evidence already supports:

- WHO says climate change increases risks from vector-borne, waterborne, and foodborne disease.
- IPCC AR6 WG2 Chapter 7 projects increased burdens for several climate-sensitive vector-borne diseases with no additional adaptation.
- IPCC AR6 WG2 Chapter 7 specifically identifies higher projected risk for malaria, Aedes-borne diseases, Lyme disease, and West Nile fever under future warming.

Immediate edge upgrade candidates:

- `environ_anomalies -> vector_borne_disease_expansion`
- `migration -> vector_borne_disease_expansion`
- `vector_borne_disease_expansion -> resource_depletion`
- `vector_borne_disease_expansion -> urbanization`

Edges to treat cautiously:

- Multiple incoming `hub_rebalanced` links from water-system derived nodes are currently too modeled to trust as-is.

Suggested source set:

- WHO Climate change and health: https://www.who.int/news-room/fact-sheets/detail/climate-change-and-health
- IPCC AR6 WG2 Chapter 7: https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-7/

### 6. `road_freight_diesel_lock_in`

Why this matters:

- Rank 365 in the current audit.
- Anchor status is `family_calibrated_reference`.
- No curated adjacent edges.
- This anchor is important for transport realism, but its current network is heavy on inferred and rebalanced relationships.

Research direction:

- Strengthen the anchor around road-freight activity, diesel dependence, and transport emissions using transport-sector sources.
- Be conservative about cross-domain spillovers until direct mechanisms are found.

What current evidence already supports:

- IEA maintains a dedicated road transport page with tracked indicators for road transport energy demand, road transport CO2 emissions, and heavy-duty truck activity.
- That makes the anchor researchable through official transport-sector evidence rather than generic transport summaries.

Immediate edge upgrade candidates:

- `urbanization -> road_freight_diesel_lock_in`
- `road_freight_diesel_lock_in -> freight_electrification_gap`
- `road_freight_diesel_lock_in -> shipping_lane_disruption`

Edges to treat cautiously:

- `grid_peak_load_stress -> road_freight_diesel_lock_in`
- `road_freight_diesel_lock_in -> grid_peak_load_stress`

Suggested source set:

- IEA Road transport page: https://www.iea.org/energy-system/transport/road
- IEA Transport sector page: https://www.iea.org/energy-system/transport

## Research Tranche 2

Once tranche 1 is better grounded, the next best anchors to research are:

- `aerosol_cooling_loss` adjacent circulation nodes like `madden_julian_oscillation`, `arctic_oscillation`, and `pacific_north_american_pattern`
- `critical_infrastructure_fragility`
- `public_health_heat_burden`
- `freshwater_ecosystem_collapse`
- `crop_yield_volatility`
- `insurance_retreat`

These appear repeatedly in important pathways, but the first tranche should come first because it can unlock multiple downstream upgrades.

## Working Rules For The Research Pass

- Do not add a source just because it mentions the topic.
- Prefer one high-quality source that explains the actual mechanism over five broad climate explainers.
- Upgrade anchors first when the current issue is weak anchor grounding.
- Upgrade edges first when the anchor is fine but the causal connection is still generic.
- Treat health, migration, and conflict links carefully; these often need explicit causal caveats.
- Treat generated spillover edges as hypotheses until a dedicated source supports them.

## Recommended Next Step

Convert tranche 1 into a structured evidence docket:

1. One subsection per target anchor.
2. For each anchor:
   - source quality
   - direct mechanism
   - candidate edge upgrades
   - candidate edges to downgrade or keep modeled
3. After that, patch `public/connection-research.json` and the calibration profiles only where the evidence is strong enough.
