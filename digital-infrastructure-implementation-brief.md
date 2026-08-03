# Digital Infrastructure Implementation Brief

This document converts the recent research dump into a single TULIP-ready implementation decision for a new landing-page filter.

It is intentionally narrower than the research source material.
The goal is not to capture every possible digital-system burden.
The goal is to define a clean, defensible v1 that fits TULIP's domain logic and can be supported with durable public evidence.

---

## Final Decision

**Add the filter now.**

The filter should be added only as a **physical infrastructure** category.
It should not become a catch-all bucket for software, media, governance, or abstract "data" concepts.

---

## Final Label

`User-facing label:` **Digital Infrastructure**

`Internal sphere key:` `digital`

Why this label wins:

- It is broad enough to cover compute, networks, and chip fabrication.
- It sounds physical rather than abstract.
- It avoids jargon like `Compute & Networks`.
- It matches the actual research consensus better than `Data`, `Digital Systems`, or `Information Infrastructure`.

---

## Final Scope

**Recommended scope sentence:**

Digital Infrastructure covers the physical facilities, hardware systems, and network assets that process, store, and move digital information at infrastructural scale, along with their directly attached power, cooling, water, and resilience dependencies.

In plain language:

- data centers
- AI compute clusters
- chip fabs
- telecom backbone systems
- wireless access infrastructure
- interconnection hubs
- subsea backbone assets

It does **not** include software platforms, social media ecosystems, digital policy institutions, or generic consumer devices.

---

## Why It Belongs In TULIP

This category is justified because it has a coherent internal physical logic and a real systems footprint:

- very large electricity demand
- rising AI-driven peak loads
- direct and indirect water burden
- cooling-system dependence
- backup power and local air pollution
- semiconductor manufacturing intensity
- subsea and network-core chokepoints
- infrastructure fragility and concentration

It is distinct from `Power & Heat` because that filter tracks energy **supply**, while Digital Infrastructure tracks major digital **demand sinks** and their supporting assets.

---

## Exact V1 Node Spine

These are the recommended **headline nodes** for v1.
They should be treated as the primary category spine.

### 1. Hyperscale Data Centers

Role:
- Anchor node for the category
- Primary large-load facility class

Why it is in:
- strongest evidence base
- strongest user clarity
- strongest direct tie to power, cooling, and local infrastructure strain

### 2. AI Compute Clusters

Role:
- Specialized compute sub-node
- Explains why digital infrastructure is newly urgent

Why it is in:
- high-density accelerator workloads materially change electricity and cooling demand
- strong strategic importance even if exact AI-only splits remain imperfect

Important note:
- this should remain a node **inside** Digital Infrastructure, not a separate macro-domain

### 3. Colocation and Cloud Campuses

Role:
- Extends the category beyond hyperscaler-owned sites
- Captures the physical layer of "cloud"

Why it is in:
- preserves infrastructure logic
- prevents "cloud" from being treated as software abstraction

### 4. Semiconductor Fabs

Role:
- Main upstream industrial node
- Connects digital infrastructure to water, energy, chemicals, fluorinated gases, and chokepoint supply chains

Why it is in:
- one of the strongest reasons this category is real and not just an operations overlay

### 5. Telecom Backbone Networks

Role:
- Core terrestrial communications infrastructure
- Long-haul and backbone transmission layer

Why it is in:
- measurable energy burden
- important resilience and outage logic

### 6. Mobile Towers and Wireless Backhaul

Role:
- Distributed access-network infrastructure
- Makes the category visible outside hyperscale regions

Why it is in:
- easy to understand
- clearly physical
- operationally exposed

### 7. Internet Exchange Points and Carrier Hotels

Role:
- Core interconnection and traffic exchange nodes

Why it is in:
- high leverage
- strong resilience and chokepoint value
- improves the network-layer logic of the category

### 8. Subsea Cables and Landing Stations

Role:
- Global backbone and connectivity chokepoint node

Why it is in:
- foundational infrastructure
- high geopolitical and resilience relevance

---

## Secondary Burden Layers

These should **not** be framed as equal peers to the main v1 node spine.
They work better as burden overlays, secondary nodes, or explanatory sub-layers.

### Cooling Water and Heat Rejection

Use as:
- burden layer
- attached to data centers and fabs

Why:
- critical to the category
- but better understood as an operational burden than a top-level infrastructure class

### Backup Power Systems

Use as:
- burden layer
- attached to data centers, telecom nodes, and fabs

Why:
- cross-cutting support system
- important for local air pollution and resilience
- too support-system-specific to be a top-tier headline node

### Critical Minerals and Specialty Inputs

Use as:
- upstream dependency layer
- cross-linked to Mining

Why:
- important and real
- but boundaries get blurry if it becomes a full standalone digital node in v1

### E-Waste and Refresh Cycles

Use as:
- lifecycle endpoint layer
- attached to servers, telecom hardware, and chip systems

Why:
- real burden
- but risks diluting the category into all electronics if elevated too early

---

## Later Expansion Nodes

These are valid future candidates, but they should not sit in the center of v1.

### Satellite Communications

Status:
- later

Why:
- real infrastructure
- stronger case on resilience and connectivity than on climate footprint
- burden quantification is still less mature than the core v1 node set

### Ground Stations

Status:
- later

Why:
- only becomes useful once the satellite layer is formalized

### Hardware Supply Chains

Status:
- later

Why:
- important but expands quickly into mining, logistics, and advanced manufacturing beyond the clean v1 boundary

---

## Explicit Exclusions

The following should stay out of the filter:

- software platforms
- social media companies
- streaming as a behavior category
- generic office buildings of tech firms
- abstract "data" metrics
- institutional tech policy
- military or intelligence systems as institutions
- consumer electronics such as phones, TVs, and laptops

Boundary rule:

If the object is a **physical digital asset** or a **direct physical dependency** of that asset, it belongs.
If it is a platform, institution, media behavior, or abstract digital phenomenon, it does not.

---

## Overlap Rules With Existing TULIP Filters

### Power & Heat

Rule:
- `Power & Heat` tracks supply
- `Digital Infrastructure` tracks demand sinks and attached systems

Implementation note:
- do not double-count grid emissions and digital demand burdens as independent additive totals

### Oceans & Water

Rule:
- Digital Infrastructure may use water heavily
- but water remains a dependency and burden flow, not a reason to move facilities into the water category

Implementation note:
- model cooling water and indirect water as burden outputs from digital assets

### Markets & Money

Rule:
- Markets tracks financing, capital flows, and investment logic
- Digital Infrastructure tracks the physical assets those flows build

### Mining

Rule:
- Mining tracks extraction and material systems broadly
- Digital Infrastructure only references its most relevant upstream inputs as dependencies

### Society & Politics

Rule:
- Digital Infrastructure should stop at physical systems
- governance, policy, surveillance institutions, and social consequences belong elsewhere unless a specific asset is the subject

---

## Source Backbone To Trust

These are the strongest source families to use for implementation-grade content.

### Tier 1: Core production sources

- IEA
  - data centers
  - AI electricity demand
  - critical minerals
- LBNL
  - U.S. data-center electricity and water
  - facility growth
- ITU
  - telecom energy
  - ICT footprint
  - e-waste
- OECD
  - communications resilience
  - infrastructure framing
  - semiconductors
- World Bank
  - digital infrastructure framing
  - telecom backbone / resilience
- NIST
  - semiconductor fab environmental burden

### Tier 2: Strong supporting sources

- UNITAR Global E-waste Monitor
- EPA
  - backup power / air quality / regulatory framing
- peer-reviewed semiconductor environmental synthesis papers
- peer-reviewed or institutional subsea resilience work

### Tier 3: Use carefully

- corporate sustainability reports
- think-tank explainers
- industry coalition reports
- satellite environmental-impact research that is still emerging

Rule:
- Tier 3 can support context
- Tier 1 and Tier 2 should drive actual TULIP content and modeling decisions

---

## Sources To Treat Carefully

Based on the current research dump, these source types should not be the backbone of production decisions by themselves:

- blogs
- local moratorium PDFs
- generic media explainers
- ResearchGate mirrors instead of original papers
- advocacy-style summaries without clear methods

They are useful as leads, not as the final authority.

---

## Final Recommended Data Model Shape

For TULIP, the category should be modeled like this:

### Primary nodes

- Hyperscale Data Centers
- AI Compute Clusters
- Colocation and Cloud Campuses
- Semiconductor Fabs
- Telecom Backbone Networks
- Mobile Towers and Wireless Backhaul
- Internet Exchange Points and Carrier Hotels
- Subsea Cables and Landing Stations

### Secondary burden overlays

- electricity demand
- peak load stress
- cooling burden
- direct water use
- indirect water use
- backup power emissions
- materials dependency
- e-waste / refresh cycles

### Later-expansion nodes

- Satellite Communications
- Ground Stations
- broader digital hardware supply chains

---

## Copy-Ready Product Definition

If we need one clean user-facing definition right now:

**Digital Infrastructure is the physical backbone of the digital world: data centers, AI compute clusters, telecom networks, chip fabs, and the cables and interconnection systems that move information, all of which depend on heavy electricity, cooling, water, and material inputs.**

---

## Final Recommendation

**Do this now:**

1. Add a new landing-page filter called `Digital Infrastructure`
2. Use a narrow physical-infrastructure definition
3. Launch with the 8-node v1 spine
4. Treat cooling, backup power, minerals, and e-waste as secondary burden layers
5. Defer satellites to a later pass
6. Use IEA, LBNL, ITU, OECD, World Bank, and NIST as the main evidence backbone

**Do not do this in v1:**

1. Do not call it `Data`
2. Do not include software or media ecosystems
3. Do not center the category on satellites
4. Do not let it absorb all digital behavior
5. Do not mix supply-side grid accounting with digital demand accounting without explicit boundary rules
