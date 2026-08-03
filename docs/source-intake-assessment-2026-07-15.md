# Source Intake Assessment

Generated: 2026-07-15

Purpose: classify the newly provided source pack into:

- `operational_open`: reusable dataset, portal, or machine-usable surface suitable for snapshots or catalogs
- `operational_gated`: useful operational source, but needs login, key, or manual auth validation
- `anchor_reasoning`: strong report, assessment, or paper for anchor notes and curated edge evidence
- `context_only`: guidance, standards, or sector framing that may help copy or logic, but is not a priority ingestion target

## Best Immediate Ingestion Targets

These are the strongest next candidates for real TULIP snapshot or catalog wiring.

| ID | Source | Classification | Usable Surface | Access Notes | Best TULIP Use |
| --- | --- | --- | --- | --- | --- |
| 3 | NERC 2025 Long-Term Reliability Assessment | `anchor_reasoning` | PDF tables and regional reliability findings | Open PDF | Grid reliability, peak load, infrastructure fragility support |
| 4 | LBNL 2024 United States Data Center Energy Usage Report | `anchor_reasoning` | PDF/report tables | Open report page | Data centers, AI load, grid stress, cooling-water competition |
| 6 | USGS Thermoelectric Power Water Use | `operational_open` | Official water-use science page and downloadable/public data ecosystem | Open web surface | Cooling-water competition, power-water coupling |
| 11 | U.S. Treasury analyses of homeowners insurance markets | `anchor_reasoning` | Treasury analysis/report surface | Open | Insurance retreat |
| 12 | Federal Insurance Office 2025 Annual Report | `anchor_reasoning` | PDF/report | Open PDF | Insurance retreat, financial exposure |
| 15 | UNCTAD Review of Maritime Transport 2024 | `anchor_reasoning` | PDF/report tables | Open PDF | Shipping lane disruption, trade stress |
| 18 | ICCT Global Heavy-Duty Vehicle Market Development | `operational_open` | Sector tracker / market development page | Open | Road freight diesel lock-in, electrification gap |
| 24 | Lancet Countdown Heat and Health | `operational_open` | Indicator program / data-facing web surface | Open | Heat-health burden |
| 38 | UNEP Global Indicator 6.6.1 Freshwater Ecosystems update | `anchor_reasoning` | PDF/report | Open PDF | Freshwater ecosystem collapse |
| 39 | Copernicus Satellite Soil Moisture 1978-present | `operational_gated` | Dataset portal with downloadable gridded data, STAC/CSW metadata | Login/Register shown on dataset page | Soil moisture collapse, drought persistence |
| 40 | NASA SMAP Data | `operational_gated_or_manual` | Mission data catalog surface via ASF/NSIDC | Public discovery page; downstream Earthdata validation may be needed | Soil moisture collapse, drought persistence |
| 41 | Copernicus Drought Observatories | `operational_open` | Monitoring portal | Open portal; API not obvious from cited page | Drought persistence, soil moisture, basin stress context |
| 43 | EPA Climate Resilience Evaluation and Awareness Tool for Water Utilities | `operational_open` | Tool/program surface | Open | Drinking-water treatment stress |
| 44 | EPA Cyanobacterial Harmful Algal Blooms in Water | `operational_open` | Official program/reference surface | Open | Drinking-water treatment stress, HAB support |
| 47 | NOAA Coastal Hypoxia report | `anchor_reasoning` | NOAA science report | Open | Coastal hypoxia |
| 49 | FAO State of World Fisheries and Aquaculture 2024 | `anchor_reasoning` | FAO flagship report | Open | Marine fisheries collapse |
| 51 | NOAA Coral Reef Watch | `operational_open` | Near-real-time products, data files, product catalog | Open product portal | Reef structural collapse, marine heat stress |
| 53 | Global Mangrove Watch | `operational_open` | Monitoring portal / dataset program | Open | Mangrove buffer loss |
| 55 | Global Carbon Budget 2025 | `operational_open` | Official release/FAQ and budget release surface | Open | Ocean carbon sink saturation, carbon budget support |
| 56 | SOCAT | `operational_open` | Public data access and downloadable observations | Open | Ocean carbon sink saturation, ocean acidification support |
| 57 | IMBIE Publications and Assessments | `operational_open` | Official assessment/publications hub | Open | Ice sheet mass loss |
| 59 | NSIDC Sea Ice Today | `operational_open` | Monitoring portal | Open | Sea ice season loss |
| 60 | NOAA Arctic Report Card | `anchor_reasoning` | Annual assessment/report portal | Open | Sea ice, permafrost, Arctic systems support |
| 61 | GTN-P | `operational_open` | Data download, data mining, central database | Public data area exists; intranet is separate | Permafrost thaw |
| 66 | NOAA PSL ENSO | `operational_open` | ENSO monitoring/diagnostics page | Open | El Niño / La Niña mechanism support |
| 70 | Global Forest Watch Biodiversity | `operational_open` | Topic portal on top of GFW | Open | Forest fragmentation |
| 71 | IPBES Pollinators assessment | `anchor_reasoning` | Assessment report | Open | Pollinator service decline |
| 73 | UNEP Global Peatlands Assessment 2022 | `anchor_reasoning` | Assessment/report | Open | Peatland degradation |
| 75 | NASA FIRMS | `operational_gated` | API and map services | Free MAP_KEY required by official API page | Wildfire regime shift |
| 80 | NOAA GML Nitrous Oxide Trends | `operational_open` | Benchmark trend page | Open | Nitrous oxide anchor support |
| 81 | Global Nitrous Oxide Budget 1980–2020 | `anchor_reasoning` | Peer-reviewed budget paper | Open DOI | Nitrous oxide system support |
| 82 | UNEP/FAO Sustainable Food Cold Chains | `anchor_reasoning` | Report | Open | Cold-chain failure risk |
| 84 | LBNL Queued Up 2025 | `anchor_reasoning` | PDF/report | Open PDF | Transmission buildout lag |
| 85 | DOE National Transmission Needs Study 2023 | `anchor_reasoning` | PDF/report | Open PDF | Transmission buildout lag |
| 87 | TSMC 2024 Sustainability Report | `anchor_reasoning` | Company sustainability PDF | Open PDF | Semiconductor fabrication footprint |

## Operational But Gated Or Auth-Mediated

These are useful, but not clean zero-friction ingestion surfaces from the cited page alone.

| ID | Source | Why Gated / Manual | Notes |
| --- | --- | --- | --- |
| 39 | Copernicus Satellite Soil Moisture | Dataset page shows `Login - Register` on the official CDS page. | Strong candidate if you want authenticated dataset pulls or scheduled downloads. |
| 40 | NASA SMAP Data | Discovery is open, but actual retrieval path runs through NASA data centers and likely needs manual auth validation. | Good candidate for a later Earthdata-mediated fetch. |
| 75 | NASA FIRMS | Official API page exists, but FIRMS says API/map services require a free `MAP_KEY` by email. | High-value if you want live-ish fire snapshots. |

## Strong Anchor / Edge Reasoning Sources

These are not live feeds, but they are exactly the kind of evidence that improves defensibility.

| IDs | Source Family | Best TULIP Use |
| --- | --- | --- |
| 1, 2, 42, 63, 64 | IPCC WG1 physical climate chapters and annex | Aerosol cooling, monsoon volatility, water cycle, ENSO, extremes, forcing |
| 8, 21, 33, 37 | IPCC WG2 chapters | Infrastructure, food systems, poverty/livelihoods, terrestrial/freshwater ecosystems |
| 5, 7, 9, 10 | DOE / World Bank / UNEP / OECD system reports | Water-energy nexus, infrastructure resilience, adaptation finance shortfall |
| 13, 14 | FHFA climate-risk pages | Mortgage and housing-finance exposure framing |
| 19, 20 | FAO trade and commodity reports | Food import exposure and trade vulnerability |
| 22 | Ray et al. crop variability paper | Crop yield volatility |
| 23, 27, 28 | ILO / WHO / Lancet heat-health sources | Public health heat burden and labor stress |
| 25, 26 | WHO vector-borne disease / ENSO-health sources | Vector-borne disease expansion and ENSO-health links |
| 29, 30 | U.S. GAO disaster recovery studies | Disaster recovery inequality |
| 31, 32 | World Bank Groundswell / IOM Planned Relocation | Relocation governance capacity |
| 34 | Ide et al. conflict-risk paper | Conflict risk escalation |
| 35, 36 | UNECE transboundary water sources | Basin treaty breakdown |
| 45, 46 | Desalination report + paper | Desalination dependence |
| 48 | Breitburg et al. oxygen decline paper | Coastal hypoxia |
| 50 | IPCC SROCC Chapter 5 | Marine ecosystems and dependent communities |
| 52 | Perry et al. reef growth capacity paper | Reef structural collapse |
| 54 | Menéndez et al. mangrove flood protection paper | Mangrove buffer loss |
| 58 | IMBIE ice-sheet mass balance paper | Ice sheet mass loss |
| 62 | IPCC SROCC Chapter 3 | Polar-region reasoning |
| 68 | ENSO teleconnection paper | La Niña mechanism support |
| 69 | Haddad et al. fragmentation paper | Forest fragmentation |
| 72 | FAO pollination program | Pollinator service decline support |
| 74 | IPCC Wetlands Supplement | Peatland degradation accounting / emissions context |
| 76, 77 | Fast fashion / textile circularity sources | Fast fashion node support |
| 79 | Temperature inversion paper | Thermal inversion events |
| 83 | WHO temperature-controlled transport guidance | Cold-chain operations support |
| 86 | Digital technology environmental impacts paper | Semiconductor/digital footprint support |
| 88 | WMO/UNEP ozone depletion assessment | Stratospheric chemistry / ozone-side support |
| 90 | IEA Hydropower report | Pumped hydro / hydropower context |
| 92 | FAO bivalve aquaculture guidance | Marine/bivalve context only |
| 93 | IMO underwater radiated noise guidance | Shipping noise context only |

## Context / Guidance Only

These are useful for framing, wording, or low-priority nodes, but they are not top ingestion targets.

| ID | Source | Why Lower Priority |
| --- | --- | --- |
| 65 | NOAA Understanding El Niño | Good explainer, but weaker than diagnostic or assessment sources for defensibility. |
| 67 | NOAA What Are El Niño and La Niña? | Same issue; useful public framing, not strong enough alone. |
| 78 | EPA Air Quality Modeling Technical Support | Good technical background, but not a direct dataset target. |
| 89 | FHWA Highway Traffic Noise Regulations and Guidance | Primarily standards/guidance. |
| 91 | FAA Airport Design circular | Primarily standards/guidance. |
| 92 | FAO Ecosystem Approach to Bivalve Aquaculture | Domain context, not a clear TULIP-wide snapshot target. |
| 93 | IMO underwater radiated noise guidance | Guidance, not a data feed. |

## Per-Source Intake Notes

One-line disposition for the full pack.

| ID | Source | Intake Disposition |
| --- | --- | --- |
| 1 | IPCC AR6 WG1 Chapter 6 | `anchor_reasoning` |
| 2 | IPCC AR6 WG1 Chapter 7 | `anchor_reasoning` |
| 3 | NERC 2025 LTRA | `anchor_reasoning` |
| 4 | LBNL 2024 data center energy report | `anchor_reasoning` |
| 5 | DOE Water-Energy Nexus | `anchor_reasoning` |
| 6 | USGS Thermoelectric Power Water Use | `operational_open` |
| 7 | World Bank Lifelines | `anchor_reasoning` |
| 8 | IPCC AR6 WG2 Chapter 6 | `anchor_reasoning` |
| 9 | UNEP Adaptation Gap Report 2025 | `anchor_reasoning` |
| 10 | OECD climate finance report | `anchor_reasoning` |
| 11 | U.S. Treasury insurance market analysis | `anchor_reasoning` |
| 12 | FIO 2025 annual report | `anchor_reasoning` |
| 13 | FHFA climate risk page | `anchor_reasoning` |
| 14 | FHFA climate financial risk initiatives | `anchor_reasoning` |
| 15 | UNCTAD Review of Maritime Transport 2024 | `anchor_reasoning` |
| 16 | UNCTAD Navigating Troubled Waters | `anchor_reasoning` |
| 17 | IEA Global EV Outlook 2025 | `anchor_reasoning` |
| 18 | ICCT heavy-duty vehicles | `operational_open` |
| 19 | FAO Agricultural Commodity Markets 2018 | `anchor_reasoning` |
| 20 | FAO Trade, Food Security and Climate Change | `anchor_reasoning` |
| 21 | IPCC AR6 WG2 Chapter 5 | `anchor_reasoning` |
| 22 | Ray et al. crop yield variability | `anchor_reasoning` |
| 23 | ILO Working on a Warmer Planet | `anchor_reasoning` |
| 24 | Lancet Countdown Heat and Health | `operational_open` |
| 25 | WHO vector-borne diseases | `anchor_reasoning` |
| 26 | WHO ENSO and health | `anchor_reasoning` |
| 27 | WHO Heat and Health | `anchor_reasoning` |
| 28 | Lancet Countdown 2025 visual summary | `anchor_reasoning` |
| 29 | GAO disaster recovery barriers | `anchor_reasoning` |
| 30 | GAO HUD block grant vulnerability report | `anchor_reasoning` |
| 31 | Groundswell Part II | `anchor_reasoning` |
| 32 | IOM Planned Relocation | `anchor_reasoning` |
| 33 | IPCC AR6 WG2 Chapter 8 | `anchor_reasoning` |
| 34 | Ide et al. conflict-risk paper | `anchor_reasoning` |
| 35 | UNECE water allocation handbook | `anchor_reasoning` |
| 36 | UNECE SDG 6.5.2 transboundary water cooperation | `anchor_reasoning` |
| 37 | IPCC AR6 WG2 Chapter 2 | `anchor_reasoning` |
| 38 | UNEP freshwater ecosystems update | `anchor_reasoning` |
| 39 | Copernicus satellite soil moisture | `operational_gated` |
| 40 | NASA SMAP Data | `operational_gated_or_manual` |
| 41 | Copernicus drought observatories | `operational_open` |
| 42 | IPCC AR6 WG1 Chapter 11 | `anchor_reasoning` |
| 43 | EPA CRWU | `operational_open` |
| 44 | EPA cyanobacterial HABs | `operational_open` |
| 45 | World Bank desalination report | `anchor_reasoning` |
| 46 | Jones et al. desalination/brine paper | `anchor_reasoning` |
| 47 | NOAA coastal hypoxia report | `anchor_reasoning` |
| 48 | Breitburg et al. oxygen decline | `anchor_reasoning` |
| 49 | FAO SOFIA 2024 | `anchor_reasoning` |
| 50 | IPCC SROCC Chapter 5 | `anchor_reasoning` |
| 51 | NOAA Coral Reef Watch | `operational_open` |
| 52 | Perry et al. reef growth capacity | `anchor_reasoning` |
| 53 | Global Mangrove Watch | `operational_open` |
| 54 | Menéndez et al. mangrove protection paper | `anchor_reasoning` |
| 55 | Global Carbon Budget 2025 | `operational_open` |
| 56 | SOCAT | `operational_open` |
| 57 | IMBIE publications and assessments | `operational_open` |
| 58 | IMBIE 1992–2020 mass balance paper | `anchor_reasoning` |
| 59 | NSIDC Sea Ice Today | `operational_open` |
| 60 | NOAA Arctic Report Card | `anchor_reasoning` |
| 61 | GTN-P | `operational_open` |
| 62 | IPCC SROCC Chapter 3 | `anchor_reasoning` |
| 63 | IPCC AR6 WG1 Chapter 8 | `anchor_reasoning` |
| 64 | IPCC AR6 WG1 Annex V Monsoons | `anchor_reasoning` |
| 65 | NOAA Understanding El Niño | `context_only` |
| 66 | NOAA PSL ENSO | `operational_open` |
| 67 | NOAA What Are El Niño and La Niña? | `context_only` |
| 68 | Jong et al. ENSO teleconnections | `anchor_reasoning` |
| 69 | Haddad et al. habitat fragmentation | `anchor_reasoning` |
| 70 | GFW Biodiversity | `operational_open` |
| 71 | IPBES Pollinators assessment | `anchor_reasoning` |
| 72 | FAO pollination services | `anchor_reasoning` |
| 73 | UNEP Global Peatlands Assessment | `anchor_reasoning` |
| 74 | IPCC Wetlands Supplement | `anchor_reasoning` |
| 75 | NASA FIRMS | `operational_gated` |
| 76 | Niinimäki et al. fast fashion paper | `anchor_reasoning` |
| 77 | UNEP textile roadmap | `anchor_reasoning` |
| 78 | EPA air quality modeling support | `context_only` |
| 79 | Whiteman et al. inversions paper | `anchor_reasoning` |
| 80 | NOAA N2O trends | `operational_open` |
| 81 | Global Nitrous Oxide Budget | `anchor_reasoning` |
| 82 | UNEP/FAO sustainable food cold chains | `anchor_reasoning` |
| 83 | WHO temperature-controlled transport operations | `anchor_reasoning` |
| 84 | LBNL Queued Up 2025 | `anchor_reasoning` |
| 85 | DOE National Transmission Needs Study | `anchor_reasoning` |
| 86 | Environmental impacts of digital technologies | `anchor_reasoning` |
| 87 | TSMC 2024 sustainability report | `anchor_reasoning` |
| 88 | WMO/UNEP ozone depletion assessment | `anchor_reasoning` |
| 89 | FHWA traffic noise guidance | `context_only` |
| 90 | IEA Hydropower Special Market Report | `anchor_reasoning` |
| 91 | FAA airport design circular | `context_only` |
| 92 | FAO bivalve aquaculture | `context_only` |
| 93 | IMO underwater radiated noise guidelines | `context_only` |

## Verified Access Notes

Verified from the cited pages during this pass:

- Copernicus satellite soil moisture shows `Login - Register` on the official dataset page, while also exposing structured metadata like STAC/CSW and download tabs.
- FIRMS has an official API page and explicitly says a free `MAP_KEY` is required for API and mapservices.
- Coral Reef Watch exposes near-real-time products, data files, and product methodology on its public portal.
- SOCAT explicitly states its data are publicly available and has a dedicated `Data Access` area with latest-version downloads.
- GTN-P exposes public `Data Download`, `Data Mining`, and a database link, while keeping separate supplementary material in a login-gated intranet.
