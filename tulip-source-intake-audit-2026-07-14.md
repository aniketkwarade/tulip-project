# TULIP Source Intake Audit

Generated: 2026-07-14

## Purpose

Audit the proposed source list for:

- usable open datasets
- usable open APIs
- login-gated or token-gated APIs
- reasoning/report sources that improve defensibility but are not ingestion targets

## How to read this

Status values:

- `open_api` = directly usable API or query surface without a private key
- `open_download` = bulk download or open file-based dataset
- `open_portal` = open site or explorer, but not obviously a clean API target
- `mixed_or_gated` = useful source, but programmatic access is partly gated, tokened, rate-limited, or account-bound
- `reference_only` = strong reasoning / calibration / evidence source, but not a direct ingestion target

Fit values:

- `anchor_calibration`
- `edge_evidence`
- `monitoring_registry`
- `lens_baseline`
- `background_reasoning`
- `solution_evidence`

Notes:

- `verified_now` means I checked the official page or a directly related official page this turn.
- `repo_known` means the repo already carries a catalog, script, or registry note for that source family.
- Otherwise the classification is a careful portal-type inference and should be rechecked before building automation.

## Existing repo coverage

These source families are already partly represented in the repo:

- NOAA climate signals: `repo_known`
- NASA Earthdata / GRACE / POWER: `repo_known`
- WRI Aqueduct: `repo_known`
- OWID: `repo_known`
- FAOSTAT: `repo_known`
- WMO datasets: `repo_known`
- IEA Energy and AI / data-center context: `repo_known`
- EDGAR: `repo_known`
- EM-DAT: `repo_known`

## Intake table

### Scientific foundations

1. IPCC Sixth Assessment Report — https://www.ipcc.ch/assessment-report/ar6/ — `reference_only` — fit: `background_reasoning`, `anchor_calibration`, `edge_evidence` — `verified_now` — Best top-level scientific backbone, but not a machine-ingestion source.
2. IPCC AR6 Synthesis Report — https://www.ipcc.ch/report/ar6/syr/ — `reference_only` — fit: `background_reasoning` — `verified_now` — Excellent defensibility source for summaries and system framing.
3. IPBES Global Biodiversity Assessment — https://ict.ipbes.net/ipbes-ict-guide/data-and-knowledge-management/citations-of-ipbes-assessments/global-assessment — `reference_only` — fit: `background_reasoning`, `anchor_calibration` — `verified_now` — Strong biodiversity framing and evidence synthesis; not an API target.
4. IPBES Nexus Assessment — https://ict.ipbes.net/ipbes-ict-guide/data-and-knowledge-management/citations-of-ipbes-assessments/nexus-assessment — `reference_only` — fit: `background_reasoning`, `edge_evidence` — `verified_now` — Strong for cross-domain links between biodiversity, water, food, and health.
5. UNEP Global Environment Outlook 7 — https://www.unep.org/resources/global-environment-outlook-7 — `reference_only` — fit: `background_reasoning` — UNEP resource page returned `403` to script fetch, so treat as readable in browser but not a direct ingestion surface.
6. WMO State of the Global Climate 2025 — https://wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025 — `reference_only` — fit: `background_reasoning`, `anchor_calibration` — Likely report-first, not API-first.
7. Safe and Just Earth-System Boundaries — https://www.nature.com/articles/s41586-023-06083-8 — `reference_only` — fit: `background_reasoning` — High-value conceptual source, not direct dataset plumbing.
8. Earth Commission — https://earthcommission.org/safe-and-just-earth-system-boundaries/ — `reference_only` — fit: `background_reasoning` — Good explanatory companion to the Nature paper.
9. Global Tipping Points Report — https://global-tipping-points.org/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — Useful for tipping-pathway logic; likely report / explainer first.
10. UNEP Emissions Gap Report 2025 — https://www.unep.org/resources/emissions-gap-report-2025 — `reference_only` — fit: `background_reasoning`, `lens_baseline` — Strong scenario and policy-gap framing.
11. UNEP Adaptation Gap Report 2025 — https://www.unep.org/resources/adaptation-gap-report-2025 — `reference_only` — fit: `background_reasoning`, `solution_evidence` — Strong adaptation strain and underinvestment framing.
12. World Weather Attribution — https://www.worldweatherattribution.org/ — `open_portal` — fit: `edge_evidence`, `monitoring_registry` — Best for event attribution evidence; not a stable general-purpose API target.
13. World Weather Attribution Methodology — https://www.worldweatherattribution.org/methods/ — `reference_only` — fit: `edge_evidence` — Useful for method transparency, not ingestion.

### Climate, atmosphere and emissions

14. NOAA Global Monitoring Laboratory — https://gml.noaa.gov/ — `open_api` — fit: `anchor_calibration`, `monitoring_registry` — `verified_now` via existing NOAA pages and repo usage — Core operational climate source.
15. NASA GISS Surface Temperature Analysis — https://data.giss.nasa.gov/gistemp/ — `open_download` — fit: `anchor_calibration`, `lens_baseline` — Strong open baseline source.
16. Berkeley Earth Temperature Data — https://berkeleyearth.org/data/ — `open_download` — fit: `anchor_calibration`, `lens_baseline` — Open benchmark source for temperature cross-checks.
17. Copernicus Climate Change Service — https://climate.copernicus.eu/ — `mixed_or_gated` — fit: `monitoring_registry`, `anchor_calibration` — High-value datasets, but programmatic CDS access typically needs account / token flow.
18. Global Carbon Budget — https://globalcarbonbudget.org/ — `open_download` — fit: `anchor_calibration`, `background_reasoning` — Strong reference and downloadable tables; already used in repo reasoning.
19. EDGAR Global Emissions Database — https://edgar.jrc.ec.europa.eu/ — `open_download` — fit: `lens_baseline`, `anchor_calibration` — `repo_known` — Good sectoral emissions context, especially for industry/materials.
20. Climate TRACE — https://climatetrace.org/ — `open_portal` — fit: `monitoring_registry`, `lens_baseline` — High-value facility and sector context; check API/export terms before ingestion.
21. UNEP International Methane Emissions Observatory — https://www.unep.org/explore-topics/energy/what-we-do/imeo-action — `reference_only` — fit: `anchor_calibration`, `background_reasoning` — Strategic methane evidence source; likely not a simple open API.
22. IEA Global Methane Tracker 2026 — https://www.iea.org/reports/global-methane-tracker-2026 — `reference_only` — fit: `anchor_calibration`, `lens_baseline` — Strong open report, not an operational API.
23. Copernicus Atmosphere Monitoring Service — https://atmosphere.copernicus.eu/ — `mixed_or_gated` — fit: `monitoring_registry`, `anchor_calibration` — Valuable for atmospheric observations; programmatic access often routes through Copernicus/ECMWF account systems.
24. WHO Air Quality Database — https://www.who.int/data/gho/data/themes/air-pollution/who-air-quality-database — `open_portal` — fit: `anchor_calibration`, `lens_baseline` — Strong public-health air baseline, but likely portal/download before API.
25. Global Energy Monitor — https://globalenergymonitor.org/ — `open_portal` — fit: `monitoring_registry`, `lens_baseline` — Useful asset-level context; verify dataset export terms case by case.

### Oceans and cryosphere

26. NOAA Ocean Carbon and Acidification Data System — https://www.ncei.noaa.gov/products/ocean-carbon-acidification-data-system — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — High-value ocean-acidification anchor source.
27. NOAA World Ocean Database — https://www.ncei.noaa.gov/products/world-ocean-database — `open_download` — fit: `anchor_calibration`, `lens_baseline` — Strong ocean baseline source.
28. Global Ocean Acidification Observing Network — https://www.goa-on.org/ — `open_portal` — fit: `monitoring_registry`, `anchor_calibration` — Excellent network and station-discovery layer.
29. Argo Ocean Observing Network — https://argo.ucsd.edu/ — `open_api` — fit: `monitoring_registry`, `anchor_calibration` — Strong open ocean-observing backbone.
30. Copernicus Marine Service — https://marine.copernicus.eu/ — `mixed_or_gated` — fit: `monitoring_registry`, `anchor_calibration` — Valuable marine products, but likely account/token mediated for scripted downloads.
31. NOAA Marine Heatwaves — https://psl.noaa.gov/marine-heatwaves/ — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — Strong open MHW evidence layer.
32. NOAA Coral Reef Watch — https://coralreefwatch.noaa.gov/ — `open_portal` — fit: `monitoring_registry`, `anchor_calibration` — High-value live reef stress source; API details should be checked before automation.
33. National Snow and Ice Data Center — https://nsidc.org/ — `open_portal` — fit: `monitoring_registry`, `anchor_calibration` — Rich cryosphere source family; some data products may be Earthdata-account linked.
34. NSIDC Sea Ice Today — https://nsidc.org/sea-ice-today — `open_portal` — fit: `monitoring_registry`, `anchor_calibration` — Great monitoring surface; likely page-first rather than API-first.
35. World Glacier Monitoring Service — https://wgms.ch/ — `open_portal` — fit: `monitoring_registry`, `anchor_calibration` — Strong glacier source; likely downloadable reports/tables.
36. Global Terrestrial Network for Permafrost — https://gtnp.arcticportal.org/ — `open_portal` — fit: `monitoring_registry`, `anchor_calibration` — High-value permafrost evidence network.
37. Ice Sheet Mass Balance Inter-comparison Exercise — https://imbie.org/ — `open_portal` — fit: `anchor_calibration`, `background_reasoning` — Strong ice-sheet evidence source; likely paper/data package flow.
38. NASA Sea Level Change Portal — https://sealevel.nasa.gov/ — `open_portal` — fit: `monitoring_registry`, `anchor_calibration` — Strong monitoring and explainer surface.
39. Allen Coral Atlas — https://allencoralatlas.org/ — `open_portal` — fit: `monitoring_registry`, `lens_baseline` — High-value coral spatial context; verify export/API options separately.

### Biodiversity, forests, land and soil

40. IUCN Red List — https://www.iucnredlist.org/ — `mixed_or_gated` — fit: `anchor_calibration`, `monitoring_registry` — Important biodiversity source; API/data access is not fully frictionless.
41. Living Planet Index — https://www.livingplanetindex.org/ — `open_portal` — fit: `anchor_calibration`, `background_reasoning` — Good biodiversity trend layer.
42. Protected Planet — https://www.protectedplanet.net/en — `open_portal` — fit: `monitoring_registry`, `lens_baseline` — Strong protected-area coverage source.
43. Map of Life — https://mol.org/ — `open_portal` — fit: `monitoring_registry`, `anchor_calibration` — Good species-distribution context.
44. Group on Earth Observations Biodiversity Observation Network — https://geobon.org/ — `reference_only` — fit: `background_reasoning`, `monitoring_registry` — Strategic network source more than simple ingestion endpoint.
45. FAO Global Forest Resources Assessment — https://www.fao.org/forest-resources-assessment/ — `open_download` — fit: `anchor_calibration`, `lens_baseline` — Strong official forestry baseline.
46. NASA FIRMS — https://www.earthdata.nasa.gov/data/tools/firms — `mixed_or_gated` — fit: `monitoring_registry` — `repo_known` — Public docs, but treat API access as key-gated rather than fully open.
47. Global Forest Watch — https://www.globalforestwatch.org/ — `open_portal` — fit: `monitoring_registry`, `anchor_calibration` — Already central to deforestation context.
48. SoilGrids — https://soilgrids.org/ — `open_download` — fit: `anchor_calibration`, `lens_baseline` — Valuable for soils and land-pressure grounding.
49. UNCCD Data — https://data.unccd.int/ — `open_portal` — fit: `monitoring_registry`, `anchor_calibration` — Strong desertification / land degradation source family.
50. Global Mangrove Watch — https://www.globalmangrovewatch.org/ — `open_portal` — fit: `monitoring_registry`, `anchor_calibration` — Strong coastal ecosystem monitoring surface.
51. Global Wetland Outlook — https://www.global-wetland-outlook.ramsar.org/ — `reference_only` — fit: `background_reasoning`, `anchor_calibration` — Strong wetland synthesis, not likely a primary API.
52. Conservation Evidence — https://www.conservationevidence.com/ — `open_portal` — fit: `solution_evidence` — Good intervention evidence layer, not environmental telemetry.

### Agriculture, food and water

53. FAOSTAT — https://www.fao.org/faostat/en/ — `open_download` — fit: `anchor_calibration`, `lens_baseline` — `repo_known` — One of the strongest ingestion candidates.
54. FAO AQUASTAT — https://www.fao.org/aquastat/ — `open_portal` — fit: `anchor_calibration`, `lens_baseline` — Strong official water baseline source.
55. FAO GLEAM — https://www.fao.org/gleam/en/ — `open_portal` — fit: `lens_baseline`, `anchor_calibration` — Valuable livestock emissions model/source, likely export-oriented not API-first.
56. EDGAR-FOOD — https://edgar.jrc.ec.europa.eu/edgar_food — `open_download` — fit: `lens_baseline`, `anchor_calibration` — High-value agrifood emissions layer.
57. SOFI 2025 — https://www.fao.org/agrifood-economics/publications/detail/en/c/1740904/ — `reference_only` — fit: `background_reasoning`, `lens_baseline` — Good narrative and synthesis, not telemetry.
58. Food Systems Dashboard — https://www.foodsystemsdashboard.org/ — `open_portal` — fit: `lens_baseline`, `background_reasoning` — Strong cross-country food-system context.
59. WRI Aqueduct — https://www.wri.org/aqueduct — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — `verified_now`, `repo_known` — Core global water-risk baseline.
60. UN-Water SDG 6 Data Portal — https://www.sdg6data.org/ — `open_portal` — fit: `anchor_calibration`, `lens_baseline` — Strong water/sanitation country baseline.
61. WHO/UNICEF JMP — https://washdata.org/ — `open_portal` — fit: `anchor_calibration`, `lens_baseline` — Strong WASH baseline.
62. Global Dietary Database — https://www.globaldietarydatabase.org/ — `mixed_or_gated` — fit: `lens_baseline`, `background_reasoning` — Valuable but may have access friction for raw programmatic data.
63. Poore and Nemecek Food Impact Study — https://www.science.org/doi/10.1126/science.aaq0216 — `reference_only` — fit: `lens_baseline`, `background_reasoning` — Strong methodological reference, not live data feed.
64. Water Footprint Network — https://www.waterfootprint.org/resources/waterstat/ — `open_download` — fit: `lens_baseline`, `anchor_calibration` — Strong resource-use baseline.

### Energy, transport, industry and materials

65. IEA Data and Statistics — https://www.iea.org/data-and-statistics — `mixed_or_gated` — fit: `lens_baseline`, `anchor_calibration` — `repo_known` — Important but many datasets are subscription-bound or awkward for direct client ingestion.
66. IEA Global Energy Review 2026 — https://www.iea.org/reports/global-energy-review-2026 — `reference_only` — fit: `background_reasoning`, `lens_baseline` — Strong annual framing source.
67. IRENA Data — https://www.irena.org/Data — `open_portal` — fit: `lens_baseline`, `monitoring_registry` — Strong renewable-energy data family.
68. Ember Electricity Data Explorer — https://ember-energy.org/data/electricity-data-explorer/ — `open_portal` — fit: `lens_baseline`, `anchor_calibration` — `repo_known` — Strong national power-mix and trend context.
69. IPCC WGIII Energy Systems — https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-6/ — `reference_only` — fit: `background_reasoning`, `solution_evidence` — Best for system framing, not direct ingestion.
70. UNEP Global Resources Outlook 2024 — https://www.unep.org/resources/Global-Resource-Outlook-2024 — `reference_only` — fit: `background_reasoning`, `lens_baseline` — Strong material-use framing.
71. International Resource Panel — https://www.resourcepanel.org/ — `reference_only` — fit: `background_reasoning`, `solution_evidence` — Strategic source family more than operational dataset API.
72. MaterialFlows.net — https://www.materialflows.net/ — `open_portal` — fit: `lens_baseline` — Useful materials-flow context.
73. EXIOBASE — https://www.exiobase.eu/ — `open_download` — fit: `lens_baseline`, `background_reasoning` — Powerful but heavy; good for supply-chain modelling, not lightweight UI fetches.
74. Global E-waste Monitor — https://ewastemonitor.info/ — `open_portal` — fit: `lens_baseline`, `background_reasoning` — Strong e-waste context.
75. UNEP Global Waste Management Outlook 2024 — https://www.unep.org/resources/global-waste-management-outlook-2024 — `reference_only` — fit: `background_reasoning`, `lens_baseline` — Strong report source.
76. OECD Plastics Data and Research — https://www.oecd.org/en/topics/sub-issues/plastics.html — `open_portal` — fit: `lens_baseline`, `background_reasoning` — Good plastics evidence family.
77. ITF Transport Outlook — https://www.itf-oecd.org/transport-outlook — `reference_only` — fit: `background_reasoning`, `solution_evidence` — Better for strategy and scenario context than for ingestion.
78. ICAO Environmental Reports — https://www.icao.int/environmental-protection/pages/envrep.aspx — `reference_only` — fit: `background_reasoning`, `lens_baseline` — Aviation-sector evidence source.
79. IMO Greenhouse Gas Studies — https://www.imo.org/en/OurWork/Environment/Pages/Fourth-IMO-Greenhouse-Gas-Study-2020.aspx — `reference_only` — fit: `background_reasoning`, `lens_baseline` — Strong shipping reference.
80. NREL Life-Cycle Assessment — https://www.nrel.gov/analysis/life-cycle-assessment.html — `reference_only` — fit: `solution_evidence`, `background_reasoning` — Useful methods and factors, not a primary live data feed.

### Human health, disasters and society

81. Lancet Countdown Data Explorer — https://lancetcountdown.org/explore-our-data/ — `open_download` — fit: `anchor_calibration`, `background_reasoning`, `metric_ingestion` — Annual indicator workbooks support bounded non-commercial heat-health, labour-capacity, and disease-suitability measurements under CC BY-NC-SA 4.0; modeled suitability is not observed incidence.
82. WHO Climate Change and Health — https://www.who.int/health-topics/climate-change — `reference_only` — fit: `background_reasoning`, `edge_evidence` — `verified_now` via WHO climate fact sheet and VBD evidence.
83. IHME Global Burden of Disease — https://www.healthdata.org/research-analysis/gbd — `open_portal` — fit: `lens_baseline`, `anchor_calibration` — Powerful health-burden baseline.
84. ILO Heat Stress and Labour Productivity — https://www.ilo.org/publications/working-warmer-planet-impact-heat-stress-labour-productivity-and-decent — `reference_only` — fit: `background_reasoning`, `edge_evidence` — High-value for labor/heat pathways.
85. EM-DAT — https://www.emdat.be/ — `mixed_or_gated` — fit: `monitoring_registry`, `lens_baseline` — `repo_known` — Important disaster dataset, but confirm current access/export workflow before automation.
86. IDMC — https://www.internal-displacement.org/ — `open_portal` — fit: `lens_baseline`, `background_reasoning` — Strong displacement evidence source.
87. World Bank Groundswell — https://openknowledge.worldbank.org/entities/publication/2c9150df-52c3-58ed-9075-d78ea56c3267 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — Strong migration scenario framing.
88. UNHCR Climate Change, Conflict and Displacement — https://www.unhcr.org/publications/no-escape-frontlines-climate-change-conflict-and-forced-displacement — `reference_only` — fit: `background_reasoning`, `edge_evidence` — Good displacement/conflict framing.
89. UNICEF Children’s Climate Risk Index — https://www.unicef.org/reports/climate-crisis-child-rights-crisis — `reference_only` — fit: `background_reasoning`, `lens_baseline` — Strong vulnerability framing.
90. World Bank Climate Change Knowledge Portal — https://climateknowledgeportal.worldbank.org/ — `open_portal` — fit: `monitoring_registry`, `lens_baseline` — Good country-level climate context.

### Economics, inequality, finance and policy

91. World Bank Changing Wealth of Nations — https://www.worldbank.org/en/publication/changing-wealth-of-nations — `reference_only` — fit: `background_reasoning`, `lens_baseline` — Good wealth depletion framing.
92. UNEP Inclusive Wealth Report — https://www.unep.org/resources/inclusive-wealth-report-2023 — `reference_only` — fit: `background_reasoning` — Good inequality / wealth framing.
93. OECD Climate Action Monitor 2025 — https://www.oecd.org/en/publications/2025/11/the-climate-action-monitor-2025_aed0c4bb.html — `reference_only` — fit: `background_reasoning`, `solution_evidence` — Policy progress framing.
94. NGFS Scenarios Portal — https://www.ngfs.net/ngfs-scenarios-portal/ — `open_portal` — fit: `background_reasoning`, `lens_baseline` — Strong scenario context for finance and transition risk.
95. IMF Climate Change Dashboard — https://climatedata.imf.org/ — `open_portal` — fit: `lens_baseline`, `monitoring_registry` — Likely useful macro climate-economy data portal.
96. World Bank Carbon Pricing Dashboard — https://carbonpricingdashboard.worldbank.org/ — `open_portal` — fit: `monitoring_registry`, `background_reasoning` — Good policy and pricing registry.
97. UNFCCC NDCs — https://unfccc.int/process-and-meetings/the-paris-agreement/nationally-determined-contributions-ndcs — `open_portal` — fit: `monitoring_registry`, `background_reasoning` — Good policy tracking source.
98. Climate Watch — https://www.climatewatchdata.org/ — `open_portal` — fit: `monitoring_registry`, `lens_baseline` — Strong emissions and policy context.
99. Climate Action Tracker — https://climateactiontracker.org/ — `reference_only` — fit: `background_reasoning`, `solution_evidence` — Strong interpretation and ambition tracking, not raw source telemetry.
100. Climate Policy Initiative — https://www.climatepolicyinitiative.org/ — `reference_only` — fit: `background_reasoning`, `solution_evidence` — Strong finance and policy evidence.
101. World Inequality Database — https://wid.world/ — `open_portal` — fit: `lens_baseline`, `background_reasoning` — Strong inequality baseline.
102. Climate Inequality Report — https://wid.world/news-article/climate-inequality-report-2023/ — `reference_only` — fit: `background_reasoning` — Strong narrative/report source.
103. Carbon Majors — https://carbonmajors.org/ — `open_portal` — fit: `lens_baseline`, `background_reasoning` — Strong attribution context.
104. OECD Environmental Statistics — https://www.oecd.org/en/topics/environmental-statistics.html — `open_portal` — fit: `lens_baseline`, `background_reasoning` — Good multi-domain stats family.

### Solutions and intervention evidence

105. IPCC Working Group III — https://www.ipcc.ch/report/ar6/wg3/ — `reference_only` — fit: `solution_evidence`, `background_reasoning` — Best strategic mitigation evidence source.
106. International Energy Agency — https://www.iea.org/ — `mixed_or_gated` — fit: `solution_evidence`, `lens_baseline` — Core energy authority, but access varies strongly by dataset/report.
107. International Renewable Energy Agency — https://www.irena.org/ — `open_portal` — fit: `solution_evidence`, `lens_baseline` — Strong renewable deployment and transition data family.
108. Conservation Evidence — https://www.conservationevidence.com/ — `open_portal` — fit: `solution_evidence` — Strong intervention evidence source.
109. UNEP International Resource Panel — https://www.resourcepanel.org/ — `reference_only` — fit: `solution_evidence`, `background_reasoning` — Strong resource-policy evidence.
110. C40 Knowledge Hub — https://www.c40knowledgehub.org/ — `open_portal` — fit: `solution_evidence` — Good city-level case and action evidence.
111. Global Covenant of Mayors — https://www.globalcovenantofmayors.org/ — `open_portal` — fit: `solution_evidence` — Good city-policy / commitments context.
112. Project Drawdown Solutions Library — https://drawdown.org/solutions — `reference_only` — fit: `solution_evidence` — Use as discovery and hypothesis generation, not as a scoring ground truth.
113. Campbell Collaboration — https://www.campbellcollaboration.org/ — `open_portal` — fit: `solution_evidence` — Strong systematic-review source for interventions.
114. IPCC AR6 WG1 Chapter 6 — https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-6/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Detailed scientific assessment of short-lived climate forcers and aerosol cooling masking.
115. IPCC AR6 WG1 Chapter 7 — https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-7/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Detailed assessments of Earth's energy budget, climate feedbacks, and aerosol-cloud albedo effects.
116. NERC 2025 Long-Term Reliability Assessment — https://www.nerc.com/globalassets/our-work/assessments/nerc_ltra_2025.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Comprehensive North American grid peak load and reliability risk assessment.
117. LBNL 2024 United States Data Center Energy Usage Report — https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Pivotal study of U.S. data center energy consumption and compute load growth projections.
118. DOE The Water-Energy Nexus — https://www.energy.gov/sites/prod/files/2014/07/f17/Water%20Energy%20Nexus%20Full%20Report%20July%202014.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Technical report outlining water usage, cooling competition, and energy system tradeoffs.
119. USGS Thermoelectric Power Water Use — https://www.usgs.gov/mission-areas/water-resources/science/thermoelectric-power-water-use — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Open datasets on power plant cooling withdrawals and basin water consumption.
120. World Bank Lifelines Resilient Infrastructure — https://openknowledge.worldbank.org/entities/publication/c3a753a6-2310-501b-a37e-5dcab3e96a0b — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Analysis of cost and resilience requirements for critical infrastructure systems.
121. IPCC AR6 WG2 Chapter 6 — https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-6/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Vulnerability assessment for cities, settlements, and critical transport/utility networks.
122. UNEP Adaptation Gap Report 2025 — https://www.unep.org/resources/adaptation-gap-report-2025 — `reference_only` — fit: `background_reasoning`, `solution_evidence` — verified_now — Assesses public/private adaptation capital shortfalls and investment needs.
123. OECD Climate Finance Provided and Mobilised — https://www.oecd.org/en/publications/climate-finance-provided-and-mobilised-by-developed-countries-in-2013-2022_19150727-en.html — `open_download` — fit: `background_reasoning`, `lens_baseline` — verified_now — Tabular datasets tracking developed country adaptation and mitigation finance contributions.
124. U.S. Treasury Analyses of U.S. Homeowners Insurance Markets — https://home.treasury.gov/news/press-releases/jy2791 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Review of insurer premium increases and withdrawals in high-hazard locations.
125. Federal Insurance Office 2025 Annual Report — https://home.treasury.gov/system/files/311/Final%20FIO%202025%20Annual%20Report.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Analyses of property coverage availability, rate shifts, and market stability.
126. FHFA The Need to Address Climate Risk — https://www.fhfa.gov/blog/statistics/the-need-to-address-climate-risk — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Blog and statistical summaries of climate exposure in housing finance.
127. FHFA Overview of Key Initiatives to Address Climate-Related Financial Risks — https://www.fhfa.gov/blog/insights/an-overview-of-fhfas-key-initiatives-to-address-climate-related-financial-risks — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Policy insight on Fannie Mae, Freddie Mac, and home loan bank climate frameworks.
128. UNCTAD Review of Maritime Transport 2024 — https://unctad.org/system/files/official-document/rmt2024_en.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Primary maritime trade report tracking chokepoints, canal transits, and shipping costs.
129. UNCTAD Navigating Troubled Waters — https://unctad.org/system/files/official-document/osginf2024d2_en.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Case study of Suez, Panama, and Black Sea shipping lane disruptions.
130. IEA Global EV Outlook 2025 — https://www.iea.org/reports/global-ev-outlook-2025 — `open_download` — fit: `background_reasoning`, `lens_baseline` — verified_now — Tracks electric truck sales, charging station buildouts, and heavy-duty diesel lock-in.
131. ICCT Global Heavy-Duty Vehicle Market Development — https://theicct.org/heavy-duty-vehicles/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Analysis of commercial freight diesel dependencies and zero-emission vehicle targets.
132. FAO The State of Agricultural Commodity Markets 2018 — https://www.fao.org/3/I9542EN/i9542en.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Focuses on agricultural trade, crop disruptions, and national food import dependencies.
133. FAO Trade, Food Security and Climate Change — https://www.fao.org/3/CA2370EN/ca2370en.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Conceptual linkages between trade policy and food exposure under climate shocks.
134. IPCC AR6 WG2 Chapter 5 — https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-5/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Detailed assessment of climate impacts on food, crop yields, and agricultural systems.
135. Ray et al. Climate Variation Explains Crop Yield Variability — https://doi.org/10.1038/ncomms6989 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Academic study attributing one-third of global crop yield volatility to climate variance.
136. ILO Working on a Warmer Planet — https://www.ilo.org/sites/default/files/wcmsp5/groups/public/%40dgreports/%40dcomm/%40publ/documents/publication/wcms_711919.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Assessment of labor-hour losses and heat stress effects on productivity.
137. Lancet Countdown Heat and Health — https://lancetcountdown.org/heat-and-health/ — `open_portal` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Open interactive data explorer mapping heat stress vulnerability, exposure, and impacts.
138. WHO Climate Change and Vector-Borne Diseases — https://iris.who.int/bitstreams/9dafdc1d-31c9-47ea-aff3-fa0ad526f9ab/download — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — WHO facts on malaria, dengue, and other vector transmission changes.
139. WHO El Niño–Southern Oscillation and Health — https://www.who.int/news-room/fact-sheets/detail/el-nino-southern-oscillation-%28enso%29 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Fact sheet outlining regional ENSO teleconnections to water, disease, and health risk.
140. WHO Heat and Health — https://www.who.int/news-room/fact-sheets/detail/climate-change-heat-and-health — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Fact sheet outlining public health heat burdens and health system strain.
141. Lancet Countdown 2025 Visual Summary — https://lancetcountdown.org/2025-report-visual-summary/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Synthesis report detailing mortality trends, heat-exposure hours, and care capacity.
142. U.S. GAO Disaster Recovery Additional Actions Needed — https://www.gao.gov/assets/720/718175.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — GAO report highlighting barriers in recovery aid access for vulnerable populations.
143. U.S. GAO Better Data Needed for HUD Block Grant Funds — https://www.gao.gov/assets/gao-22-104452.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Study on socioeconomic disparities in federal disaster relief allocations.
144. World Bank Groundswell Part II Acting on Internal Climate Migration — https://documents1.worldbank.org/curated/en/540941631203608570/pdf/Overview.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Focuses on internal migration projections, governance capacity, and managed retreat.
145. IOM Planned Relocation — https://environmentalmigration.iom.int/planned-relocation — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Policy and case repository tracking planned resettlement and legal frameworks.
146. IPCC AR6 WG2 Chapter 8 — https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-8/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Assessment linking climate stress to poverty, livelihood loss, and conflict risk.
147. Ide et al. Climate Disasters and Armed Conflict Risk — https://doi.org/10.1016/j.gloenvcha.2020.102063 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Quantitative analysis of disaster impacts on conflict risk in fragile states.
148. UNECE Handbook on Water Allocation in a Transboundary Context — https://unece.org/sites/default/files/2021-12/ECE_MP.WAT_64_Handbook%20on%20water%20allocation%20in%20a%20the%20transboundary%20context.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Legal and operational guidelines for transboundary river water sharing.
149. UNECE Progress on Transboundary Water Cooperation SDG 6.5.2 — https://unece.org/sites/default/files/2021-12/SDG652_2021_2nd_Progress_Report_ENG_web.pdf — `open_portal` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Tracks transboundary basin agreements and cooperation indicator scores.
150. IPCC AR6 WG2 Chapter 2 — https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-2/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Terrestrial and freshwater ecosystem collapse, warming limits, and biodeposits.
151. UNEP Progress on Freshwater Ecosystems Indicator 6.6.1 — https://wedocs.unep.org/bitstream/handle/20.500.11822/36691/PFE6.6.1.pdf — `open_portal` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Global indicator tracking wetland, lake, and river basin extent changes.
152. Copernicus Climate Data Store Satellite Soil Moisture — https://cds.climate.copernicus.eu/datasets/satellite-soil-moisture — `mixed_or_gated` — fit: `monitoring_registry`, `anchor_calibration` — verified_now — `needs_login` — Active global soil-moisture datasets; requires a Copernicus account.
153. NASA SMAP Data — https://smap.jpl.nasa.gov/data/ — `mixed_or_gated` — fit: `monitoring_registry`, `anchor_calibration` — verified_now — `needs_login` — Direct soil-moisture telemetry downloads; requires NASA Earthdata login.
154. Copernicus European and Global Drought Observatories — https://drought.emergency.copernicus.eu/ — `open_portal` — fit: `monitoring_registry`, `edge_evidence` — verified_now — Portal serving global drought indices, soil moisture deficits, and vegetation stress.
155. IPCC AR6 WG1 Chapter 11 — https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-11/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Core chapter on weather and climate extreme events, including drought persistence.
156. U.S. EPA Climate Resilience Evaluation and Awareness Tool for Water Utilities — https://www.epa.gov/crwu — `open_portal` — fit: `solution_evidence`, `edge_evidence` — verified_now — Utility resilience tools and salinity/turbidity treatment vulnerability metrics.
157. U.S. EPA Cyanobacterial Harmful Algal Blooms in Water — https://www.epa.gov/cyanohabs — `open_portal` — fit: `monitoring_registry`, `edge_evidence` — verified_now — Tracks algal bloom occurrences, toxins, and drinking-water treatment impacts.
158. World Bank The Role of Desalination in an Increasingly Water-Scarce World — https://documents1.worldbank.org/curated/en/476041552622967264/pdf/135312-WP-PUBLIC-14-3-2019-12-3-35-W.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Physical/energy/tradeoff limits of coastal desalination.
159. Jones et al. The State of Desalination and Brine Production — https://doi.org/10.1016/j.scitotenv.2018.12.076 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Global quantitative review of desalination capacities and brine disposal footprints.
160. NOAA Dynamics and Distribution of Natural and Human-Caused Coastal Hypoxia — https://coastalscience.noaa.gov/data_reports/dynamics-and-distribution-of-natural-and-human-caused-coastal-hypoxia/ — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Open datasets tracking coastal dead zones, nutrient loads, and oxygen depletion.
161. Breitburg et al. Declining Oxygen in the Global Ocean — https://doi.org/10.1126/science.aam7240 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Synthesis of open-ocean and coastal deoxygenation and marine habitat compression.
162. FAO The State of World Fisheries and Aquaculture 2024 — https://www.fao.org/publications/fao-flagship-publications/the-state-of-world-fisheries-and-aquaculture/2024/en — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Official biannual assessment of overfished stocks and marine aquaculture limits.
163. IPCC SROCC Chapter 5 — https://www.ipcc.ch/srocc/chapter/chapter-5/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Chapter on ocean warming, acidification, deoxygenation, and fisheries collapse.
164. NOAA Coral Reef Watch — https://coralreefwatch.noaa.gov/ — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Open NetCDF and text datasets for regional thermal bleaching stress.
165. Perry et al. Loss of Coral Reef Growth Capacity to Track Future Increases in Sea Level — https://doi.org/10.1038/s41586-018-0194-z — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Quantifies reef calcification loss, structural flattening, and wave buffering decline.
166. Global Mangrove Watch — https://www.globalmangrovewatch.org/ — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Open spatial datasets mapping mangrove extent changes and carbon storage.
167. Menéndez et al. The Global Flood Protection Benefits of Mangroves — https://doi.org/10.1038/s41598-020-61136-6 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Models flood damage reduction, wave attenuation, and coastal protection values.
168. Global Carbon Budget 2025 — https://globalcarbonbudget.org/gcb-2025/the-global-carbon-budget-faqs-2025/ — `open_download` — fit: `anchor_calibration`, `lens_baseline` — verified_now — Key metrics on land and ocean carbon sink efficiency and saturation.
169. Surface Ocean CO2 Atlas — https://www.socat.info/ — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Open bulk download of surface ocean carbon fugacity (fCO2) measurements.
170. IMBIE Publications and Assessments — https://imbie.org/publications/ — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Open consolidated datasets for Greenland and Antarctic ice sheet mass loss.
171. IMBIE, Ice Sheet Mass Balance 1992–2020 — https://doi.org/10.5194/essd-15-1597-2023 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Landmark paper reconciling satellite altimetry/gravity measurements of ice loss.
172. NSIDC, Sea Ice Today — https://nsidc.org/sea-ice-today — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Open daily and monthly Arctic/Antarctic sea ice extent and concentration records.
173. NOAA Arctic Report Card — https://arctic.noaa.gov/report-card/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Annual report tracking sea ice season loss, tundra greening, and warming feedbacks.
174. Global Terrestrial Network for Permafrost — https://gtnp.arcticportal.org/ — `open_portal` — fit: `monitoring_registry`, `edge_evidence` — verified_now — Open database tracking borehole temperature and active layer thickness.
175. IPCC SROCC Chapter 3: Polar Regions — https://www.ipcc.ch/srocc/chapter/chapter-3-2/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Synthesis of permafrost thaw, infrastructure hazards, and habitat changes.
176. IPCC AR6 WG1 Chapter 8: Water Cycle Changes — https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-8/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Assessment of changes in global water cycle, precipitation, and monsoon dynamics.
177. IPCC AR6 WG1 Annex V: Monsoons — https://www.ipcc.ch/report/ar6/wg1/downloads/report/IPCC_AR6_WGI_AnnexV.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Detailed regional profiles and models for global monsoon volatility.
178. NOAA, Understanding El Niño — https://www.noaa.gov/understanding-el-nino — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Explainer on ENSO mechanics, ocean warming, and downstream impacts.
179. NOAA Physical Sciences Laboratory, ENSO — https://psl.noaa.gov/enso/ — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Open datasets tracking ONI, SOI, and Pacific sea surface temperatures.
180. NOAA, What Are El Niño and La Niña? — https://oceanservice.noaa.gov/facts/ninonina.html — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Fact sheet outlining La Nina oceanic and atmospheric contrasts.
181. Jong et al., ENSO Teleconnections and U.S. Summertime Temperature During a Multiyear La Niña — https://doi.org/10.1175/JCLI-D-19-0701.1 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Academic study detailing multiyear La Nina teleconnections to drought.
182. Haddad et al., Habitat Fragmentation and Its Lasting Impact on Earth’s Ecosystems — https://doi.org/10.1126/sciadv.1500052 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Landmark paper quantifying species loss and carbon decay in fragmented patches.
183. Global Forest Watch, Biodiversity — https://www.globalforestwatch.org/topics/biodiversity/ — `open_portal` — fit: `monitoring_registry`, `edge_evidence` — verified_now — Interactive maps tracking forest fragmentation and biodiversity intactness.
184. IPBES, Assessment Report on Pollinators, Pollination and Food Production — https://www.ipbes.net/assessment-reports/pollinators — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Details status, drivers, and economic value of global pollinator services.
185. FAO, Global Action on Pollination Services for Sustainable Agriculture — https://www.fao.org/pollination/en/ — `open_portal` — fit: `solution_evidence`, `edge_evidence` — verified_now — Focuses on agrifood pollination dependencies and management practices.
186. UNEP, Global Peatlands Assessment 2022 — https://www.unep.org/resources/global-peatlands-assessment-2022 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Comprehensive global assessment of peatland extent, degradation, and emissions.
187. IPCC, 2013 Wetlands Supplement — https://www.ipcc-nggip.iges.or.jp/public/wetlands/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Methodological guidelines for estimating emissions from degraded peatlands.
188. NASA FIRMS — https://firms.modaps.eosdis.nasa.gov/ — `mixed_or_gated` — fit: `monitoring_registry`, `anchor_calibration` — verified_now — `needs_login` — Active thermal anomaly maps and API; requires a free API map key.
189. Niinimäki et al., The Environmental Price of Fast Fashion — https://doi.org/10.1038/s43017-020-0039-9 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Review of resource consumption, wastewater, and waste in fast fashion.
190. UNEP, Sustainability and Circularity in the Textile Value Chain: Global Roadmap — https://www.unep.org/resources/publication/sustainability-and-circularity-textile-value-chain-global-roadmap — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — UNEP roadmap tracking global textile supply chain footprints.
191. IPCC AR6 WG2 Chapter 4: Water — https://www.ipcc.ch/report/ar6/wg2/chapter/chapter-4/ — `reference_only` — fit: `background_reasoning`, `edge_evidence`, `monitoring_registry` — verified_now — Assessment of glacier peak water, mountain runoff, snowpack change, and downstream water-system exposure; basin attribution remains required.
192. NOAA AOML, Environmental Suitability of Vibrio Infections in a Warming Climate — https://www.aoml.noaa.gov/early-warning-waterborne-disease/ — `reference_only` — fit: `edge_evidence`, `monitoring_registry` — verified_now — Documents SST and salinity suitability for Vibrio and an environmental early-warning approach; suitability is not synonymous with disease incidence.
193. FAO Global Soil Partnership, Soil Salinity — https://www.fao.org/global-soil-partnership/areas-of-work/soil-salinity/en/ — `reference_only` — fit: `monitoring_registry`, `edge_evidence` — verified_now — Documents salt-affected soil extent, drivers, and productivity implications; field salinity remains geography and crop specific.
191. U.S. EPA, Air Quality Modeling Technical Support — https://www.epa.gov/scram — `open_portal` — fit: `monitoring_registry`, `edge_evidence` — verified_now — Meteorological data and models tracking atmospheric stability and inversion events.
192. Whiteman et al., Breakup of Temperature Inversions in Deep Mountain Valleys — https://doi.org/10.1175/1520-0450(2004)043%3C0259:BOTIID%3E2.0.CO;2 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Study on thermal structures and pollutant accumulation during inversion breakup.
193. NOAA Global Monitoring Laboratory, Nitrous Oxide Trends — https://gml.noaa.gov/ccgg/trends_n2o/ — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Open datasets tracking global atmospheric N2O flask measurements.
194. Global Nitrous Oxide Budget 1980–2020 — https://doi.org/10.5194/essd-16-2543-2024 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Quantitative analysis of agricultural, industrial, and natural N2O sources.
195. UNEP and FAO, Sustainable Food Cold Chains — https://www.unep.org/resources/report/sustainable-food-cold-chains-opportunities-food-security-climate-action — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Report outlining cold chain energy requirements and climate vulnerabilities.
196. WHO, Temperature-Controlled Transport Operations by Road and Air — https://www.who.int/publications/m/item/Annex-9-k-trs-961 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Guidelines for shipping vaccines and medicines under extreme heat stress.
197. Lawrence Berkeley National Laboratory, Queued Up 2025 — https://eta-publications.lbl.gov/sites/default/files/2025-12/queued_up_2025_edition_12.15.2025.pdf — `open_download` — fit: `anchor_calibration`, `monitoring_registry` — verified_now — Open datasets tracking electricity transmission interconnection queues and wait times.
198. DOE, National Transmission Needs Study 2023 — https://www.energy.gov/sites/default/files/2023-10/National_Transmission_Needs_Study_2023.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Assessment of transmission capacity deficits, constraints, and buildout lags.
199. Roussilhe et al., Environmental Impacts of Digital Technologies — https://arxiv.org/abs/2209.12523 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Study on the raw material, water, and energy footprints of semiconductor fabs.
200. TSMC 2024 Sustainability Report — https://esg.tsmc.com/en-US/file/public/2024-TSMC-Sustainability-Report-e.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Environmental disclosures showing ultrapure water recycle rates and electricity intensities.
201. WMO/UNEP, Scientific Assessment of Ozone Depletion 2022 — https://csl.noaa.gov/assessments/ozone/2022/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Assesses stratospheric chlorine sinks, CFC concentrations, and ozone layer healing.
202. FHWA, Highway Traffic Noise Regulations and Guidance — https://www.fhwa.dot.gov/environment/noise/regulations_and_guidance/ — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Noise level standards and acoustic barrier regulations for highways.
203. IEA, Hydropower Special Market Report — https://www.iea.org/reports/hydropower-special-market-report — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Analyzes pumped storage reservoir footprints and land inundation risks.
204. FAA Advisory Circular 150/5300-13, Airport Design — https://www.faa.gov/airports/resources/advisory_circulars/index.cfm/go/document.current/documentnumber/150_5300-13 — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — FAA regulations on runway clearance and physical safety zones.
205. FAO, Ecosystem Approach to Bivalve Aquaculture — https://www.fao.org/4/i1750e/i1750e.pdf — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Analyzes organic deposition and biodeposits loss in shellfish farming.
206. IMO, Revised Guidelines for Reduction of Underwater Radiated Noise from Shipping — https://www.imo.org/en/MediaCentre/PressBriefings/pages/Underwater-radiated-noise-guidelines.aspx — `reference_only` — fit: `background_reasoning`, `edge_evidence` — verified_now — Recommendations for reducing propeller cavitation and acoustic impacts on marine life.

## Highest-value open ingestion candidates

These are the best near-term dataset/API targets for TULIP because they are open enough and map well to current graph needs:

- NOAA GML
- NASA GISS
- Berkeley Earth
- Global Carbon Budget
- EDGAR
- NOAA OCADS
- NOAA World Ocean Database
- Argo
- NOAA Marine Heatwaves
- FAOSTAT
- EDGAR-FOOD
- WRI Aqueduct
- Water Footprint Network
- Global Forest Watch
- SoilGrids
- World Bank Climate Knowledge Portal
- Climate Watch

## High-value but likely gated / account-mediated

These are worth using, but should be treated as requiring manual credential or workflow review before automation:

- Copernicus Climate Change Service
- Copernicus Atmosphere Monitoring Service
- Copernicus Marine Service
- IEA Data and Statistics
- IEA broader data surfaces
- IUCN Red List
- NASA FIRMS
- EM-DAT
- Global Dietary Database

## Best report/evidence sources for defensibility without ingestion

- IPCC AR6
- IPCC AR6 Synthesis Report
- IPBES assessments
- UNEP GEO / Emissions Gap / Adaptation Gap
- Global Tipping Points Report
- IEA Global Methane Tracker
- IPCC WGIII
- WHO Climate Change and Health
- ILO heat stress report
- World Bank Groundswell
- UNHCR climate displacement report
- Climate Action Tracker
- Project Drawdown, but discovery-only

## Recommended next repo steps

1. Convert the highest-value open ingestion candidates into a machine-readable registry with:
   - `source_id`
   - `domain`
   - `url`
   - `status`
   - `fit`
   - `api_or_download`
   - `refresh_style`
   - `credential_requirement`
2. Split sources into:
   - `operational_open`
   - `catalog_or_portal`
   - `manual_auth_needed`
   - `evidence_only`
3. Wire only `operational_open` sources into refresh scripts first.
4. Use `evidence_only` sources to strengthen anchor notes and curated edge evidence without pretending they are live data feeds.
