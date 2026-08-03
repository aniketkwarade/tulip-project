# Node Evidence Docket

Generated: 2026-07-15

Purpose: map the new source pack onto weak or under-supported TULIP nodes.

- Total targeted nodes: 44
- High priority nodes: 38
- Medium priority nodes: 6
- Nodes with no current attachment bundles: 16

## Priority Nodes

### `aerosol_cooling_loss`
- Priority: high
- Target outcome: upgrade anchor grounding and replace family-only aerosol logic with explicit forcing evidence
- Next action: attach_reasoning_bundle
- Current bundles: none
- Recommended sources:
  - [IPCC AR6 WG1 Chapter 6] via intake id 1 (anchor_reasoning)
  - [IPCC AR6 WG1 Chapter 7] via intake id 2 (anchor_reasoning)
  - [IPCC AR6 WG1 Chapter 11] via intake id 42 (anchor_reasoning)

### `grid_peak_load_stress`
- Priority: high
- Target outcome: strengthen grid reliability and heat-load mechanism support
- Next action: attach_reasoning_bundle
- Current bundles: none
- Recommended sources:
  - [NERC 2025 LTRA] via intake id 3 (anchor_reasoning)
  - [LBNL 2024 data center energy report] via intake id 4 (anchor_reasoning)
  - [LBNL Queued Up 2025] via intake id 84 (anchor_reasoning)
  - [DOE National Transmission Needs Study] via intake id 85 (anchor_reasoning)

### `cooling_water_competition`
- Priority: high
- Target outcome: add direct industrial cooling and thermoelectric water-use support
- Next action: snapshot_or_reasoning_mix
- Current bundles: `aqueduct_snapshot`, `grace_freshwater_snapshot`, `water_footprint_snapshot`
- Recommended sources:
  - [LBNL 2024 data center energy report] via intake id 4 (anchor_reasoning)
  - [DOE Water-Energy Nexus] via intake id 5 (anchor_reasoning)
  - [USGS Thermoelectric Power Water Use] via intake id 6 (operational_open)

### `critical_infrastructure_fragility`
- Priority: high
- Target outcome: ground infrastructure-failure pathways in climate resilience assessments
- Next action: attach_reasoning_bundle
- Current bundles: `disaster_displacement_snapshot`, `heat_health_snapshot`
- Recommended sources:
  - [NERC 2025 LTRA] via intake id 3 (anchor_reasoning)
  - [World Bank Lifelines] via intake id 7 (anchor_reasoning)
  - [IPCC AR6 WG2 Chapter 6] via intake id 8 (anchor_reasoning)

### `adaptation_capital_shortfall`
- Priority: high
- Target outcome: ground adaptation-finance gap with dated official assessments
- Next action: attach_reasoning_bundle
- Current bundles: `disaster_displacement_snapshot`, `finance_governance_snapshot`
- Recommended sources:
  - [UNEP Adaptation Gap Report 2025] via intake id 9 (anchor_reasoning)
  - [OECD climate finance report] via intake id 10 (anchor_reasoning)

### `insurance_retreat`
- Priority: high
- Target outcome: replace generic retreat framing with regulator and market evidence
- Next action: attach_reasoning_bundle
- Current bundles: `disaster_displacement_snapshot`, `finance_governance_snapshot`
- Recommended sources:
  - [U.S. Treasury insurance market analysis] via intake id 11 (anchor_reasoning)
  - [FIO 2025 annual report] via intake id 12 (anchor_reasoning)

### `mortgage_market_exposure`
- Priority: high
- Target outcome: strengthen housing-finance climate-risk mechanisms
- Next action: attach_reasoning_bundle
- Current bundles: `disaster_displacement_snapshot`, `finance_governance_snapshot`
- Recommended sources:
  - [FHFA climate risk page] via intake id 13 (anchor_reasoning)
  - [FHFA climate financial risk initiatives] via intake id 14 (anchor_reasoning)

### `shipping_lane_disruption`
- Priority: high
- Target outcome: ground maritime chokepoint and climate-disruption claims
- Next action: attach_reasoning_bundle
- Current bundles: none
- Recommended sources:
  - [UNCTAD Review of Maritime Transport 2024] via intake id 15 (anchor_reasoning)
  - [UNCTAD Navigating Troubled Waters] via intake id 16 (anchor_reasoning)

### `road_freight_diesel_lock_in`
- Priority: high
- Target outcome: ground heavy-duty diesel dependence and electrification barriers
- Next action: operational_plus_reasoning
- Current bundles: none
- Recommended sources:
  - [IEA Global EV Outlook 2025] via intake id 17 (anchor_reasoning)
  - [ICCT heavy-duty vehicles] via intake id 18 (operational_open)

### `food_import_exposure`
- Priority: high
- Target outcome: ground trade-linked food vulnerability in FAO evidence
- Next action: attach_reasoning_bundle
- Current bundles: `food_security_snapshot`, `disaster_displacement_snapshot`
- Recommended sources:
  - [FAO Agricultural Commodity Markets 2018] via intake id 19 (anchor_reasoning)
  - [FAO Trade, Food Security and Climate Change] via intake id 20 (anchor_reasoning)

### `crop_yield_volatility`
- Priority: high
- Target outcome: ground crop-yield instability in IPCC and observational crop studies
- Next action: attach_reasoning_bundle
- Current bundles: none
- Recommended sources:
  - [IPCC AR6 WG2 Chapter 5] via intake id 21 (anchor_reasoning)
  - [Ray et al. crop yield variability] via intake id 22 (anchor_reasoning)

### `farm_heat_stress`
- Priority: high
- Target outcome: upgrade farm labor and agricultural heat-stress support
- Next action: operational_plus_reasoning
- Current bundles: `heat_health_snapshot`, `labor_heat_support`
- Recommended sources:
  - [ILO Working on a Warmer Planet] via intake id 23 (anchor_reasoning)
  - [Lancet Countdown Heat and Health] via intake id 24 (operational_open)

### `vector_borne_disease_expansion`
- Priority: high
- Target outcome: ground disease range and transmission risk in health evidence
- Next action: attach_reasoning_bundle
- Current bundles: `heat_health_snapshot`, `labor_heat_support`
- Recommended sources:
  - [WHO vector-borne diseases] via intake id 25 (anchor_reasoning)
  - [IPCC AR6 WG2 Chapter 8] via intake id 33 (anchor_reasoning)

### `public_health_heat_burden`
- Priority: high
- Target outcome: strengthen heat-health burden with health indicators and public-health assessments
- Next action: operational_plus_reasoning
- Current bundles: `heat_health_snapshot`, `labor_heat_support`
- Recommended sources:
  - [Lancet Countdown Heat and Health] via intake id 24 (operational_open)
  - [WHO Heat and Health] via intake id 27 (anchor_reasoning)
  - [Lancet Countdown 2025 visual summary] via intake id 28 (anchor_reasoning)

### `disaster_recovery_inequality`
- Priority: high
- Target outcome: ground unequal disaster recovery outcomes in public accountability sources
- Next action: attach_reasoning_bundle
- Current bundles: `disaster_displacement_snapshot`, `displacement_anchor_support`
- Recommended sources:
  - [GAO disaster recovery barriers] via intake id 29 (anchor_reasoning)
  - [GAO HUD block grant vulnerability report] via intake id 30 (anchor_reasoning)

### `relocation_governance_capacity`
- Priority: high
- Target outcome: ground planned relocation and internal migration governance claims
- Next action: attach_reasoning_bundle
- Current bundles: `disaster_displacement_snapshot`, `displacement_anchor_support`
- Recommended sources:
  - [Groundswell Part II] via intake id 31 (anchor_reasoning)
  - [IOM Planned Relocation] via intake id 32 (anchor_reasoning)

### `conflict_risk_escalation`
- Priority: high
- Target outcome: replace generic conflict framing with careful risk-multiplier evidence
- Next action: attach_reasoning_bundle
- Current bundles: `disaster_displacement_snapshot`, `conflict_governance_support`
- Recommended sources:
  - [Ide et al. conflict-risk paper] via intake id 34 (anchor_reasoning)

### `basin_treaty_breakdown`
- Priority: high
- Target outcome: ground transboundary water treaty strain and allocation conflict
- Next action: attach_reasoning_bundle
- Current bundles: `aqueduct_snapshot`, `grace_freshwater_snapshot`
- Recommended sources:
  - [UNECE water allocation handbook] via intake id 35 (anchor_reasoning)
  - [UNECE SDG 6.5.2 transboundary water cooperation] via intake id 36 (anchor_reasoning)

### `freshwater_ecosystem_collapse`
- Priority: high
- Target outcome: strengthen freshwater ecosystem decline with IPCC and UNEP ecosystem evidence
- Next action: attach_reasoning_bundle
- Current bundles: `aqueduct_snapshot`, `grace_freshwater_snapshot`
- Recommended sources:
  - [IPCC AR6 WG2 Chapter 2] via intake id 37 (anchor_reasoning)
  - [UNEP freshwater ecosystems update] via intake id 38 (anchor_reasoning)

### `soil_moisture_collapse`
- Priority: high
- Target outcome: promote true soil-moisture observational support
- Next action: snapshot_candidate_requires_auth_review
- Current bundles: `aqueduct_snapshot`, `grace_freshwater_snapshot`, `soilgrids_snapshot`
- Recommended sources:
  - [Copernicus satellite soil moisture] via intake id 39 (operational_gated)
  - [NASA SMAP Data] via intake id 40 (operational_gated_or_manual)
  - [Copernicus drought observatories] via intake id 41 (operational_open)

### `drought_persistence`
- Priority: high
- Target outcome: strengthen drought persistence with observatory and soil-moisture evidence
- Next action: snapshot_candidate_requires_auth_review
- Current bundles: `aqueduct_snapshot`, `grace_freshwater_snapshot`
- Recommended sources:
  - [Copernicus satellite soil moisture] via intake id 39 (operational_gated)
  - [NASA SMAP Data] via intake id 40 (operational_gated_or_manual)
  - [Copernicus drought observatories] via intake id 41 (operational_open)
  - [IPCC AR6 WG1 Chapter 11] via intake id 42 (anchor_reasoning)

### `drinking_water_treatment_stress`
- Priority: high
- Target outcome: ground water-treatment burden in utility resilience and HAB evidence
- Next action: operational_plus_reasoning
- Current bundles: `aqueduct_snapshot`, `grace_freshwater_snapshot`
- Recommended sources:
  - [EPA CRWU] via intake id 43 (operational_open)
  - [EPA cyanobacterial HABs] via intake id 44 (operational_open)

### `desalination_dependence`
- Priority: medium
- Target outcome: ground desalination dependence in water-scarcity infrastructure evidence
- Next action: attach_reasoning_bundle
- Current bundles: `aqueduct_snapshot`, `grace_freshwater_snapshot`
- Recommended sources:
  - [World Bank desalination report] via intake id 45 (anchor_reasoning)
  - [Jones et al. desalination/brine paper] via intake id 46 (anchor_reasoning)

### `coastal_hypoxia`
- Priority: high
- Target outcome: strengthen low-oxygen coastal-state reasoning
- Next action: attach_reasoning_bundle
- Current bundles: `argo_snapshot`, `wod_snapshot`
- Recommended sources:
  - [NOAA coastal hypoxia report] via intake id 47 (anchor_reasoning)
  - [Breitburg et al. oxygen decline] via intake id 48 (anchor_reasoning)

### `marine_fisheries_collapse`
- Priority: high
- Target outcome: ground fishery decline and protein dependency in fisheries assessments
- Next action: attach_reasoning_bundle
- Current bundles: `argo_snapshot`, `wod_snapshot`, `coral_reef_watch_snapshot`
- Recommended sources:
  - [FAO SOFIA 2024] via intake id 49 (anchor_reasoning)
  - [IPCC SROCC Chapter 5] via intake id 50 (anchor_reasoning)

### `reef_structural_collapse`
- Priority: high
- Target outcome: add structural reef-growth and bleaching intelligence
- Next action: operational_plus_reasoning
- Current bundles: `coral_reef_watch_snapshot`, `marine_heatwave_snapshot`, `coral_reef_watch_snapshot`, `ocads_catalog`
- Recommended sources:
  - [NOAA Coral Reef Watch] via intake id 51 (operational_open)
  - [Perry et al. reef growth capacity] via intake id 52 (anchor_reasoning)

### `mangrove_buffer_loss`
- Priority: high
- Target outcome: promote mangrove protection from generic coastal support to direct evidence
- Next action: operational_plus_reasoning
- Current bundles: none
- Recommended sources:
  - [Global Mangrove Watch] via intake id 53 (operational_open)
  - [Menéndez et al. mangrove protection paper] via intake id 54 (anchor_reasoning)

### `oceanic_carbon_sink_saturation`
- Priority: high
- Target outcome: add direct ocean carbon sink support instead of indirect ocean-state spillover
- Next action: operational_plus_reasoning
- Current bundles: none
- Recommended sources:
  - [Global Carbon Budget 2025] via intake id 55 (operational_open)
  - [SOCAT] via intake id 56 (operational_open)

### `ice_sheet_mass_loss`
- Priority: high
- Target outcome: replace generic cryosphere support with direct mass-balance evidence
- Next action: operational_plus_reasoning
- Current bundles: `nsidc_sea_ice_snapshot`, `gcb_snapshot`
- Recommended sources:
  - [IMBIE publications and assessments] via intake id 57 (operational_open)
  - [IMBIE 1992–2020 mass balance paper] via intake id 58 (anchor_reasoning)

### `sea_ice_season_loss`
- Priority: high
- Target outcome: strengthen seasonal sea-ice decline with direct Arctic monitoring
- Next action: operational_plus_reasoning
- Current bundles: `nsidc_sea_ice_snapshot`, `gcb_snapshot`
- Recommended sources:
  - [NSIDC Sea Ice Today] via intake id 59 (operational_open)
  - [NOAA Arctic Report Card] via intake id 60 (anchor_reasoning)

### `permafrost_thaw`
- Priority: high
- Target outcome: strengthen permafrost thaw with direct network support and polar assessment reasoning
- Next action: operational_plus_reasoning
- Current bundles: `gtnp_snapshot`, `gcb_snapshot`
- Recommended sources:
  - [GTN-P] via intake id 61 (operational_open)
  - [IPCC SROCC Chapter 3] via intake id 62 (anchor_reasoning)

### `monsoon_volatility`
- Priority: high
- Target outcome: replace broad climate forcing spillover with monsoon-specific evidence
- Next action: attach_reasoning_bundle
- Current bundles: `noaa_gml_benchmarks`, `gcb_snapshot`
- Recommended sources:
  - [IPCC AR6 WG1 Chapter 8] via intake id 63 (anchor_reasoning)
  - [IPCC AR6 WG1 Annex V Monsoons] via intake id 64 (anchor_reasoning)

### `el_nino`
- Priority: medium
- Target outcome: add direct ENSO monitoring support
- Next action: operational_plus_context
- Current bundles: none
- Recommended sources:
  - [NOAA PSL ENSO] via intake id 66 (operational_open)
  - [NOAA What Are El Niño and La Niña?] via intake id 67 (context_only)

### `la_nina`
- Priority: medium
- Target outcome: add direct La Niña monitoring and teleconnection support
- Next action: operational_plus_reasoning
- Current bundles: none
- Recommended sources:
  - [NOAA PSL ENSO] via intake id 66 (operational_open)
  - [Jong et al. ENSO teleconnections] via intake id 68 (anchor_reasoning)

### `forest_fragmentation`
- Priority: high
- Target outcome: upgrade fragmentation from generic forest loss to biodiversity-aware evidence
- Next action: operational_plus_reasoning
- Current bundles: `gfw_forest_snapshot`, `fra_forest_snapshot`
- Recommended sources:
  - [Haddad et al. habitat fragmentation] via intake id 69 (anchor_reasoning)
  - [GFW Biodiversity] via intake id 70 (operational_open)

### `pollinator_service_decline`
- Priority: high
- Target outcome: ground pollinator decline and crop-service risk
- Next action: attach_reasoning_bundle
- Current bundles: none
- Recommended sources:
  - [IPBES Pollinators assessment] via intake id 71 (anchor_reasoning)
  - [FAO pollination services] via intake id 72 (anchor_reasoning)

### `peatland_degradation`
- Priority: high
- Target outcome: ground peat degradation in global peatland and wetlands accounting evidence
- Next action: attach_reasoning_bundle
- Current bundles: none
- Recommended sources:
  - [UNEP Global Peatlands Assessment] via intake id 73 (anchor_reasoning)
  - [IPCC Wetlands Supplement] via intake id 74 (anchor_reasoning)

### `wildfire_regime_shift`
- Priority: high
- Target outcome: add direct fire-detection and fire-regime support
- Next action: auth_gated_snapshot_candidate
- Current bundles: `gfw_forest_snapshot`, `firms_snapshot`
- Recommended sources:
  - [NASA FIRMS] via intake id 75 (operational_gated)

### `fast_fashion`
- Priority: medium
- Target outcome: strengthen apparel-system burden with direct textile evidence
- Next action: attach_reasoning_bundle
- Current bundles: `exiobase_snapshot`
- Recommended sources:
  - [Niinimäki et al. fast fashion paper] via intake id 76 (anchor_reasoning)
  - [UNEP textile roadmap] via intake id 77 (anchor_reasoning)

### `thermal_inversion_events`
- Priority: medium
- Target outcome: ground inversion dynamics and pollution trapping
- Next action: attach_reasoning_bundle
- Current bundles: none
- Recommended sources:
  - [EPA air quality modeling support] via intake id 78 (context_only)
  - [Whiteman et al. inversions paper] via intake id 79 (anchor_reasoning)

### `nitrous_oxide`
- Priority: high
- Target outcome: promote N2O from generic chemistry node to benchmarked atmospheric support
- Next action: operational_plus_reasoning
- Current bundles: none
- Recommended sources:
  - [NOAA N2O trends] via intake id 80 (operational_open)
  - [Global Nitrous Oxide Budget] via intake id 81 (anchor_reasoning)

### `cold_chain_failure_risk`
- Priority: medium
- Target outcome: ground cold-chain vulnerability in food and medical logistics sources
- Next action: attach_reasoning_bundle
- Current bundles: none
- Recommended sources:
  - [UNEP/FAO sustainable food cold chains] via intake id 82 (anchor_reasoning)
  - [WHO temperature-controlled transport operations] via intake id 83 (anchor_reasoning)

### `transmission_buildout_lag`
- Priority: high
- Target outcome: ground transmission delay and queue stress in official grid studies
- Next action: attach_reasoning_bundle
- Current bundles: none
- Recommended sources:
  - [LBNL Queued Up 2025] via intake id 84 (anchor_reasoning)
  - [DOE National Transmission Needs Study] via intake id 85 (anchor_reasoning)

### `semiconductor_fabrication_footprint`
- Priority: high
- Target outcome: ground fab water, power, and materials burden in direct sector evidence
- Next action: attach_reasoning_bundle
- Current bundles: none
- Recommended sources:
  - [Environmental impacts of digital technologies] via intake id 86 (anchor_reasoning)
  - [TSMC 2024 sustainability report] via intake id 87 (anchor_reasoning)

