# Bottom-Tail Research Campaign

Generated: 2026-07-15

Purpose: keep the bottom `111` long-tail nodes in discovery, but move them onto a structured evidence campaign so they can be upgraded from family-only placeholders into supported nodes.

## Principle

- Do not delete or hide the long tail.
- Do not present it with the same confidence as anchor-led canon.
- Upgrade it in batches by evidence family, because many weak nodes are really unsupported variants of the same underlying topic.

## Current State

- Long-tail target set: `111` nodes
- Common pattern: `generated` + `family_calibrated_reference` + score below `40` + connection rank `1`
- Main problem: not that the topics are necessarily false, but that the repo currently lacks direct node-level support and curated local topology

## Best Research Strategy

Work by cluster, not by individual node.

### Cluster 1: Ocean stress and coral / fisheries tail

Representative nodes:

- `Marine Heatwaves`
- `Coral Bleaching`
- `Coral Larval Mortality`
- `Coral Reef Fragmentation`
- `Fisheries Range Redistribution`
- `Phytoplankton Decline`
- `Shelf-Sea Hypoxia`
- `Estuarine Nursery Loss`
- `Mangrove Destruction`

Why this cluster is attractive:

- The repo already has adjacent ocean support for `marine_fisheries_collapse`, `reef_structural_collapse`, `coastal_hypoxia`, and `mangrove_buffer_loss`.
- Several weak long-tail nodes can inherit direct support once those bundles are expanded from anchor-level to node-level attachments.

Best current source path in-repo:

- `NOAA Coral Reef Watch`
- `FAO SOFIA 2024`
- `IPCC SROCC Chapter 5`
- `NOAA coastal hypoxia report`
- `Global Mangrove Watch`

Expected result:

- Promote a whole ocean tail from vague family-only status to supported sub-nodes with shared operational and reasoning bundles.

### Cluster 2: Cryosphere decline and glacier process tail

Representative nodes:

- `Arctic Sea Ice Thinning`
- `Sea Ice Extent Deficits`
- `Arctic Ice Retreat`
- `Greenland Glacier Melting`
- `Glacier Calving Events`
- `Ice Sheet Thinning Speeds`
- `Subglacial Lake Drainages`
- `Glacial Lake Outburst Floods`
- `Nunatak Habitat Shrinkage`

Why this cluster is attractive:

- The repo already has `ice_sheet_mass_loss`, `sea_ice_season_loss`, and `permafrost_thaw` in the evidence docket.
- Those anchor upgrades can be extended to weaker process nodes instead of creating isolated new research tracks.

Best current source path in-repo:

- `IMBIE publications and assessments`
- `IMBIE 1992–2020 mass balance paper`
- `NSIDC Sea Ice Today`
- `NOAA Arctic Report Card`
- `GTN-P`

Expected result:

- Strengthen the cryosphere tail with direct observational grounding instead of generic cryosphere-family spillover.

### Cluster 3: Aerosols, particulates, and atmospheric pollution tail

Representative nodes:

- `Aerosol Scattering Index`
- `Secondary Organic Aerosol Burden`
- `Particulate Soot Levels`
- `PM2.5 Particulates`
- `Stratospheric Water Vapor`
- `Stratospheric Cooling`
- `Acid Rain Deposition`
- `Aviation Sulphate Particle Layer`
- `Aerosolized Microplastics`

Why this cluster is attractive:

- The repo already has a live pathway for `aerosol_cooling_loss` plus atmospheric benchmark infrastructure.
- Many of these nodes are narrower mechanism variants that could be attached through a shared atmospheric chemistry bundle.

Best current source path in-repo:

- `IPCC AR6 WG1 Chapter 6`
- `IPCC AR6 WG1 Chapter 7`
- `NOAA GML benchmarks`
- `NOAA N2O trends`
- atmospheric chemistry and PM evidence already referenced around `nitrous_oxide` and `thermal_inversion_events`

Expected result:

- Replace loose aerosol-family placeholders with a smaller number of supported submechanisms.

### Cluster 4: Biodiversity, pollination, and habitat fragmentation tail

Representative nodes:

- `Pollinator Colony Collapse`
- `Seed Germination Drops`
- `Wildlife Habitat Patches`
- `Biodiversity Corridors Disruption`
- `Invasive Species Encroachment`
- `Monoculture Encroachments`
- `Macrofungal Mycelium Decay`
- `Lichen Layer Degradations`
- `Top Predator Extinctions`

Why this cluster is attractive:

- The repo already has support pathways for `forest_fragmentation` and `pollinator_service_decline`.
- A biodiversity expansion pass can convert many of these from isolated nouns into a more coherent supported ecology branch.

Best current source path in-repo:

- `IPBES Pollinators assessment`
- `FAO pollination services`
- `Haddad et al. habitat fragmentation`
- `GFW Biodiversity`

Expected result:

- Better ecological coherence and fewer “orphan” biodiversity nodes.

### Cluster 5: Infrastructure, transport, and industrial externalities tail

Representative nodes:

- `Supply Chain Port Bottlenecks`
- `Commuter Rail Transit Gaps`
- `Railroad Chemical Car Derailments`
- `Cargo Ship Fuel Combustion`
- `Aviation Condensation Trails`
- `Aviation Jet Fuel Emissions`
- `Transformer Heat Failure Risk`
- `Gas Pipeline Leak Points`
- `Pumped Hydro Land Inundations`

Why this cluster is attractive:

- These nodes are product-relevant, but they currently sit as isolated generated fragments.
- They should be grouped under stronger transport, shipping, grid, and aviation research tracks instead of remaining atomized.

Best current source path in-repo:

- `UNCTAD Review of Maritime Transport 2024`
- `UNCTAD Navigating Troubled Waters`
- `NERC 2025 LTRA`
- `DOE National Transmission Needs Study`
- `LBNL Queued Up 2025`
- `IEA Global EV Outlook 2025`

Expected result:

- Stronger transport and infrastructure sub-branches with fewer unsupported one-off nodes.

## Recommended Order

1. Ocean stress and coral / fisheries tail
2. Cryosphere decline and glacier process tail
3. Aerosols and atmospheric pollution tail
4. Biodiversity and pollination tail
5. Infrastructure, transport, and industrial externalities tail

## Upgrade Rule

A bottom-tail node can move out of the weakest bucket once it has:

- at least one direct reasoning or operational bundle tied to the node or a very tight sibling cluster
- at least one curated local edge or explicit cluster-level support note
- user-facing wording that does not overstate causal certainty

## Practical Next Step

The fastest high-yield move is to expand the existing evidence docket with cluster bundles rather than writing 111 bespoke source requests.

Best first expansion targets:

- ocean / coral / fisheries
- cryosphere / sea-ice / glacier
- aerosol / particulate / atmospheric chemistry
- biodiversity / pollination / fragmentation

## First Attachment Pass Landed

The first registry-backed rehabilitation pass has now been mapped into `public/node-source-attachments.json`.

### Ocean tail rule

- Rule id: `ocean_tail_rehabilitation_support`
- Bundles: `argo_snapshot`, `wod_snapshot`, `marine_heatwave_snapshot`, `coral_reef_watch_snapshot`, `mangrove_watch_snapshot`
- Nodes now covered:
  - `marine_heatwaves`
  - `coral_bleaching`
  - `coral_larval_mortality`
  - `coral_reef_fragmentation`
  - `fisheries_range_redistribution`
  - `phytoplankton_decline`
  - `shelf_sea_hypoxia`
  - `estuarine_nursery_loss`
  - `mangrove_destruction`

### Cryosphere tail rule

- Rule id: `cryosphere_tail_rehabilitation_support`
- Bundles: `nsidc_sea_ice_snapshot`, `imbie_assessment_snapshot`, `gcb_snapshot`
- Nodes now covered:
  - `arctic_sea_ice_thinning`
  - `sea_ice_extent_deficits`
  - `arctic_ice_retreat`
  - `greenland_glacier_melting`
  - `glacier_calving_events`
  - `ice_sheet_thinning_speeds`
  - `subglacial_lake_drainages`
  - `glacial_lake_outburst_floods`
  - `nunatak_habitat_shrinkage`

### What this does not mean yet

- These nodes are not magically promoted to strong canon.
- They now have explicit evidence inheritance paths instead of sitting as unsupported family-only residue.
- The next pass should tighten local curated edges and node-level wording for the newly attached tails.

## Bottom Line

The long tail should stay in the product if breadth matters. The right fix is not to hide it. The right fix is to convert it from unsupported procedural residue into a staged evidence program.
