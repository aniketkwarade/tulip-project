# Phenomenon, Relationship, Context, and Ingestion Audit

Generated: 2026-07-17T13:47:27.252Z
Graph profile: northstar
Live export: 577 nodes / 1054 edges

## Executive Summary

- **The graph remains underdeveloped after semantic exemptions.** 366 of 531 applicable non-response nodes (68.9%) remain on research track; 403 are below three drivers in the raw topology.
- **The procedural expansion is still a one-anchor star model.** 276 of 378 generated nodes have exactly one incoming driver and 328 have no downstream effect.
- **The largest data gap is measurement, not labels.** 558 of 577 nodes have neither a calibration metric nor a defined metric contract; 14 API-ready contracts are now explicit.
- **Evidence volume is not the same as relationship evidence.** 274 of 1054 edges lack relationship-specific URLs even though every edge has at least one general source URL.
- **The source registry is ahead of graph ingestion.** 212 sources are catalogued, but only 225 graph nodes (39%) are covered by attachment rules.

## Coverage by Cohort

| Cohort | Nodes | Avg drivers | Avg effects | 0 drivers | 1 driver | 2 drivers | <3 raw | Gate failures | Gate failure rate | 0 effects |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| all nodes | 577 | 1.83 | 1.83 | 71 | 297 | 59 | 427 | 366 | 68.9% | 336 |
| phenomena or indicators | 550 | 1.85 | 1.72 | 65 | 283 | 55 | 403 | 366 | 68.9% | 336 |
| climate responses | 27 | 1.3 | 4.04 | 6 | 14 | 4 | 24 | 0 | 0% | 0 |
| non response anchors | 172 | 3.44 | 4.99 | 19 | 7 | 27 | 53 | 16 | 10.5% | 8 |
| generated phenomena | 378 | 1.13 | 0.23 | 46 | 276 | 28 | 350 | 350 | 92.6% | 328 |

## Coverage by Sphere (Non-Response Nodes)

| Sphere | Nodes | Avg drivers | <3 drivers | <3 rate | 0 effects |
| --- | ---: | ---: | ---: | ---: | ---: |
| agriculture | 47 | 1.38 | 36 | 76.6% | 30 |
| atmosphere | 85 | 2.61 | 56 | 65.9% | 42 |
| biosphere | 59 | 1.64 | 47 | 79.7% | 40 |
| cryosphere | 52 | 1.79 | 34 | 65.4% | 28 |
| digital | 35 | 0.83 | 35 | 100% | 27 |
| economy | 37 | 1.22 | 32 | 86.5% | 27 |
| energy | 51 | 1.61 | 42 | 82.4% | 34 |
| freshwater | 19 | 2.47 | 9 | 47.4% | 9 |
| health | 13 | 2.77 | 8 | 61.5% | 10 |
| oceans | 72 | 1.96 | 46 | 63.9% | 40 |
| sociopolitical | 39 | 2.54 | 26 | 66.7% | 21 |
| transport | 41 | 1.54 | 32 | 78% | 28 |

## Relationship Evidence

- Relationship levels: indirect=667, direct=113, extrapolated=5, inferred=269
- Evidence modes: curated_edge_reference=343, curated_local_reference=437, family_reference=5, curated_anchor_inference=269
- Direct or indirect edges: 780 (74%)
- Cross-sphere edges: 501 (47.5%)
- Relationship-specific URL missing: 274
- Missing confidence: 227
- Missing relationship type: 227

## Context and Measurement

- Missing calibration metric: 572
- Defined API-ready metric contracts: 14
- Missing both calibration metric and metric contract: 558
- Missing human-impact profile: 53
- Missing planetary-impact profile: 132
- Generic economic-context fallback: 35
- Generated nodes with anchor-inherited evidence: 311

## Highest-Priority Underconnected Anchors

| Node | Sphere | Drivers | Effects | Driver spheres | Score |
| --- | --- | ---: | ---: | ---: | ---: |
| Peak Glacier Runoff Passage | cryosphere | 1 | 0 | 1 | 5.3 |
| Marine Pathogen Range Expansion | oceans | 1 | 0 | 1 | 5.2 |
| Coastal Permafrost Erosion | cryosphere | 1 | 0 | 1 | 5.1 |
| Pyrocumulonimbus Smoke Injection | atmosphere | 1 | 2 | 1 | 4.7 |
| Thermal Stratification Intensification | oceans | 1 | 4 | 1 | 5.5 |
| Urban Sprawl / Housing | sociopolitical | 2 | 2 | 2 | 7.3 |
| Fertilizer Price Shock | agriculture | 2 | 4 | 2 | 8.7 |
| Personal Conveyance | transport | 2 | 11 | 1 | 6.6 |
| Cooling Water Competition | energy | 2 | 5 | 2 | 8 |
| Peat Oxidation Pulse | biosphere | 2 | 1 | 2 | 8 |
| Tidal Wetland Carbon Reversal | oceans | 2 | 1 | 2 | 7.8 |
| Forest Fragmentation | biosphere | 2 | 3 | 1 | 7.6 |
| Reef Structural Collapse | oceans | 2 | 5 | 1 | 7.4 |
| Black Carbon Darkening of Snow | atmosphere | 2 | 2 | 1 | 7 |
| Lightning Ignition under Fire Weather Conditions | atmosphere | 2 | 1 | 1 | 7 |
| Wastewater Bypass Discharge | freshwater | 2 | 4 | 1 | 6.7 |

## Existing Operational Sources Not Yet Active

| Source | Mode | Best fit |
| --- | --- | --- |
| EXIOBASE | download | lens_baseline, background_reasoning |
| USGS Thermoelectric Power Water Use | download | anchor_calibration, monitoring_registry |
| OECD Climate Finance Provided and Mobilised | download | background_reasoning, lens_baseline |
| IEA Global EV Outlook 2025 | download | background_reasoning, lens_baseline |
| NOAA Dynamics and Distribution of Natural and Human-Caused Coastal Hypoxia | download | anchor_calibration, monitoring_registry |
| Global Carbon Budget 2025 | download | anchor_calibration, lens_baseline |
| Lawrence Berkeley National Laboratory, Queued Up 2025 | download | anchor_calibration, monitoring_registry |
| NOAA IBTrACS | download | anchor_calibration, tropical_cyclone_tracks, rapid_intensification |
| WHO GHO OData API | api | anchor_calibration, health_surveillance, vector_borne_disease |

## Remediation Gates

1. Do not add an edge only to satisfy the three-driver gate; require a relationship-specific source and bounded mechanism.
2. Prioritize underconnected anchors before generated leaves, then rehabilitate generated nodes in evidence-family batches.
3. Require each anchor to expose a metric contract before connecting a new API to scoring.
4. Add structured geographic scope, time horizon, exposed populations/systems, moderators, and uncertainty to context.
5. Keep inferred and extrapolated relationships discoverable as research candidates until source entailment is read back.

