# Footprint Actions Deep Research Prompt

Use this prompt with a deep-research model to produce a rigorous, source-backed action framework for every Footprint category currently active in TULIP.

The output should help translate each footprint from a descriptive climate burden into an actionable intervention surface across three levels:

1. Personal actions
2. Community or institutional actions
3. Policy or systems-level actions

The goal is not generic sustainability advice. The goal is to identify the most effective, evidence-backed actions for each footprint, explain how those actions work, quantify impact where possible, and flag what is well-supported versus weakly supported.

---

## Goal

I am building a climate and industrial-footprint interface called TULIP. The platform currently includes the following Footprint categories:

1. Diet
2. Industry Farming
3. Methane
4. Carbon
5. Electricity Generation
6. Conveyance
7. Road Freight + Logistics
8. Food Waste
9. Fertilizers
10. Mining
11. Housing
12. Building Operations
13. Deforestation + Land Use
14. Plastics + Petrochemicals
15. Data Centers
16. AI Compute
17. Aviation + Shipping
18. Cement + Steel
19. Refrigerants

I want a deep research report that answers, for every one of these footprints:

1. What the footprint actually represents in plain language
2. What the biggest drivers or subcomponents are
3. What the strongest actions are at:
   - personal level
   - community / local / organizational level
   - policy / regulatory / infrastructure level
4. How effective each action is
5. What evidence quality supports each action
6. What tradeoffs, rebound effects, political constraints, or measurement limitations exist
7. Which actions are realistic now versus aspirational or still uncertain

The final report should be strong enough that I can convert it into TULIP product content, action cards, policy layers, or implementation notes.

---

## Core Standard

Treat this as an intervention-ranking exercise, not a brainstorming exercise.

That means:

- prefer actions with measurable climate, methane, land, material, or energy impact
- distinguish high-confidence actions from plausible-but-thinly-supported ones
- avoid vague advice like "raise awareness" unless it is attached to a demonstrated program model
- avoid green-consumer fluff that has trivial effect relative to the scale of the footprint
- identify where individual action matters and where systems action matters far more
- explicitly say when the footprint is not meaningfully addressable at the personal level

Do not force symmetry. Some footprints will have strong policy levers and weak personal levers. Say that clearly.

---

## Important Framing Rules

### 1. Separate action levels clearly

For each footprint, classify actions into:

- `Personal`
  - household consumption choices
  - travel choices
  - purchasing choices
  - diet or home behavior
  - voting / civic pressure only if clearly separated from direct lifestyle action

- `Community / Institution`
  - schools
  - hospitals
  - campuses
  - city procurement
  - local utilities
  - business operations
  - cooperatives
  - waste systems
  - building managers
  - neighborhood or municipal programs

- `Policy / Systems`
  - national regulation
  - carbon pricing
  - building codes
  - industrial standards
  - methane rules
  - grid reform
  - shipping and aviation fuel mandates
  - refrigerant standards
  - land-use regulation
  - trade rules
  - agricultural subsidies
  - public investment

### 2. Name the actual mechanism

Do not say only "eat less meat."
Say what actually changes:

- lower beef demand
- reduced enteric methane
- lower pasture expansion pressure
- lower feed demand

Do not say only "retrofit buildings."
Say what actually changes:

- lower combustion heating demand
- lower cooling electricity demand
- lower peak load
- less refrigerant leakage if equipment is replaced

### 3. Quantify impact when defensible

For each action, provide one or more of the following when possible:

- estimated emissions reduction
- methane reduction
- energy reduction
- land reduction
- material reduction
- adoption potential
- cost range
- payback period
- policy effectiveness range

If exact cross-country comparability is weak, say so and provide a range or best-known directional finding.

### 4. Be honest about uncertainty

For categories like `AI Compute`, `Road Freight + Logistics`, `Building Operations`, or `Refrigerants`, public datasets may be fragmented or methodologically inconsistent.

That is acceptable.

In those cases:

- identify the best available evidence
- state whether the action evidence is direct or inferred
- mark indicative actions as indicative
- distinguish mature intervention evidence from emerging intervention evidence

### 5. Favor globally relevant interventions

Default to globally meaningful actions.

If an action is highly region-specific, label it clearly, for example:

- high-income grid context
- tropical agricultural context
- rapidly urbanizing context
- cold-climate building stock
- US / EU regulatory context

---

## Footprints To Cover

Cover all 19 current categories:

1. `Diet`
2. `Industry Farming`
3. `Methane`
4. `Carbon`
5. `Electricity Generation`
6. `Conveyance`
7. `Road Freight + Logistics`
8. `Food Waste`
9. `Fertilizers`
10. `Mining`
11. `Housing`
12. `Building Operations`
13. `Deforestation + Land Use`
14. `Plastics + Petrochemicals`
15. `Data Centers`
16. `AI Compute`
17. `Aviation + Shipping`
18. `Cement + Steel`
19. `Refrigerants`

Do not skip any.

---

## What To Research For Each Footprint

For every footprint, answer all of the following:

### A. Definition

Provide:

- a clean user-facing definition in 1-3 sentences
- what the footprint includes
- what it excludes
- why it matters climatically or systemically

### B. Main burden drivers

Identify:

- the main emissions or resource drivers
- the most important subcomponents
- the most actionable leverage points

Use product-friendly language whenever possible.

### C. Best actions by level

For each of the three levels, identify:

- top 3-8 strongest actions
- mechanism of change
- expected impact
- evidence strength
- feasibility
- major barriers
- co-benefits
- tradeoffs or rebound effects

### D. Action quality ranking

For each action, score:

- `impact`: very high / high / medium / low
- `evidence strength`: high / medium / low
- `time horizon`: short / medium / long
- `feasibility`: high / medium / low
- `equity considerations`: favorable / mixed / risky
- `measurement confidence`: high / medium / low

### E. Best available metrics

Where possible, identify metrics suitable for an eventual TULIP action interface, such as:

- kgCO2e avoided per household per year
- MtCO2e avoided per year
- MtCH4e avoided per year
- kWh reduced per square meter
- % leakage reduction
- % modal shift
- % waste diversion
- hectares avoided
- tonnes of clinker replaced
- tonnes of virgin plastic displaced
- liters or kWh saved per compute workload

### F. Sources

Provide exact sources with:

- institution / paper name
- underlying data year
- publication year
- URL

---

## Category-Specific Research Angles

Use these as mandatory emphasis areas for each footprint.

### 1. Diet

Research actions around:

- beef reduction
- lamb reduction
- dairy reduction
- protein substitution
- plant-forward procurement
- menu design
- school and hospital food standards
- public procurement
- dietary guidelines

### 2. Industry Farming

Research actions around:

- livestock intensity
- feed systems
- manure management
- land clearing tied to livestock
- irrigation stress
- monoculture dependency
- regenerative practices only where evidence is solid
- subsidy reform
- procurement reform

### 3. Methane

Research actions around:

- oil and gas leak detection and repair
- coal mine methane
- landfill methane capture
- wastewater methane
- rice cultivation changes
- enteric methane reduction
- manure lagoons
- methane fee or regulation design

### 4. Carbon

Research actions around:

- economy-wide decarbonization
- fossil fuel demand reduction
- industrial heat
- transport fuel use
- carbon pricing
- clean power standards
- electrification
- efficiency
- land carbon protection where relevant

### 5. Electricity Generation

Research actions around:

- coal retirement
- gas dependence reduction
- solar deployment
- wind deployment
- storage
- transmission
- grid flexibility
- demand response
- utility reform
- clean energy standards

### 6. Conveyance

Research actions around:

- car dependence reduction
- vehicle size
- EV shift
- transit mode shift
- biking and walking infrastructure
- parking reform
- land-use linkage
- fuel economy standards

### 7. Road Freight + Logistics

Research actions around:

- heavy-duty truck electrification
- freight efficiency
- route optimization
- rail substitution
- warehouse efficiency
- cold-chain efficiency
- zero-emission delivery fleets
- logistics procurement standards

### 8. Food Waste

Research actions around:

- household food waste reduction
- date-label reform
- cold storage
- redistribution
- commercial kitchen waste
- grocery loss reduction
- composting versus methane prevention
- landfill diversion policy

### 9. Fertilizers

Research actions around:

- ammonia production decarbonization
- nitrogen-use efficiency
- precision application
- fertilizer overuse reduction
- crop rotation
- nitrification inhibitors
- subsidy design
- fertilizer standards

### 10. Mining

Research actions around:

- material efficiency
- demand reduction
- recycling and circularity
- refining efficiency
- mine electrification
- tailings management
- water protection
- sourcing standards
- strategic mineral governance

### 11. Housing

Research actions around:

- sprawl reduction
- infill
- density
- materials efficiency
- smaller homes
- transit-oriented development
- zoning reform
- embodied carbon standards

### 12. Building Operations

Research actions around:

- insulation
- heat pumps
- district energy
- efficient cooling
- lighting and controls
- appliance standards
- retrofits
- building performance standards
- passive design
- peak demand reduction

### 13. Deforestation + Land Use

Research actions around:

- cattle-linked deforestation
- soy and oilseed expansion
- palm oil
- timber and plantations
- traceability
- import standards
- indigenous land protection
- deforestation-free procurement
- restoration versus avoided loss

### 14. Plastics + Petrochemicals

Research actions around:

- virgin plastic reduction
- polymer substitution
- reuse systems
- packaging redesign
- resin production controls
- petrochemical buildout constraints
- EPR policy
- recycled content mandates
- single-use reduction

### 15. Data Centers

Research actions around:

- compute efficiency
- server utilization
- cooling efficiency
- grid-aware siting
- renewable matching
- water use reduction
- waste heat reuse
- reporting standards
- utility interconnection policy

### 16. AI Compute

Research actions around:

- model efficiency
- inference efficiency
- hardware utilization
- training restraint
- smaller model substitution
- scheduling by grid conditions
- transparency standards
- compute disclosure
- procurement standards

Mark clearly where evidence is indicative or emerging.

### 17. Aviation + Shipping

Research actions around:

- demand reduction for flying
- frequent flyer policy
- business travel substitution
- shipping efficiency
- slower steaming
- fuel switching
- port electrification
- sustainable fuel standards
- international regulation

### 18. Cement + Steel

Research actions around:

- material efficiency
- clinker substitution
- low-carbon cement standards
- green steel procurement
- scrap use
- electrification
- hydrogen where credible
- industrial heat
- public procurement standards

### 19. Refrigerants

Research actions around:

- refrigerant leak prevention
- refrigerant recovery
- refrigerant reclamation
- better servicing practices
- low-GWP refrigerants
- cooling demand reduction
- appliance replacement
- Kigali-aligned policy
- building code and maintenance standards

---

## Required Output Format

Return results in this exact order.

### 1. Executive Summary

Provide:

- the 10-15 most powerful actions across the entire footprint set
- which actions are strongest for individuals
- which require community or institutional coordination
- which are overwhelmingly policy-driven
- where the current evidence is strongest
- where the current evidence is weakest

### 2. Cross-Footprint Action Ranking

Provide a ranked table:

| rank | action | footprint | level | mechanism | expected impact | evidence strength | feasibility | notes |
|---|---|---|---|---|---|---|---|---|
| 1 | ... | ... | personal/community/policy | ... | ... | high/medium/low | high/medium/low | ... |

Include at least 25 ranked actions.

### 3. Full Footprint Profiles

For each of the 19 footprints, use this exact template:

#### [Footprint Name]

`Definition:` [1-3 sentence user-facing definition]

`Why this footprint matters:` [2-4 sentences]

`What it mainly includes:` [bullets]

`What it does not include:` [bullets]

`Main burden drivers:` [bullets]

`Best leverage points:` [bullets]

`Action table:`

| action | level | mechanism | expected impact | evidence strength | feasibility | time horizon | equity considerations | measurement confidence | key tradeoffs / risks | best supporting sources |
|---|---|---|---|---|---|---|---|---|---|---|
| ... | personal/community/policy | ... | ... | ... | ... | ... | ... | ... | ... | ... |

`Best actions by level:`

`Personal`
- [action]
- [action]
- [action]

`Community / Institution`
- [action]
- [action]
- [action]

`Policy / Systems`
- [action]
- [action]
- [action]

`Metrics worth using in product:`
- [metric]
- [metric]
- [metric]

`What is realistically actionable now:`
- [bullet]

`What is promising but still uncertain:`
- [bullet]

`What is often overstated or misunderstood:`
- [bullet]

`Top sources:`
- [Institution or paper] - [data year] - [publication year] - [URL]
- [Institution or paper] - [data year] - [publication year] - [URL]
- [Institution or paper] - [data year] - [publication year] - [URL]

### 4. Product Translation Layer For TULIP

For each footprint, provide:

| footprint | best 1-line action summary | strongest personal action | strongest community action | strongest policy action | action confidence | notes for UI |
|---|---|---|---|---|---|---|
| ... | ... | ... | ... | ... | ... | ... |

### 5. Weak Spots And Research Gaps

List:

- footprints where action evidence is immature
- footprints where data is fragmented
- footprints where interventions are highly context-dependent
- footprints where personal action is weak relative to policy action
- footprints where current public narratives are misleading

### 6. Final Recommendation

End with:

- `Best immediate personal actions across the whole system:`
- `Best immediate community or institutional actions across the whole system:`
- `Best immediate policy priorities across the whole system:`
- `Highest-confidence footprints for action storytelling in TULIP:`
- `Most uncertain footprints that should be labeled carefully:`

---

## Source Priorities

Prefer sources in this order:

1. IPCC, IEA, UNEP, FAO, OECD, World Bank, WHO, WMO, IRENA, IMO, ICAO, UNECE
2. Peer-reviewed synthesis papers and major review papers
3. Official government and multilateral datasets
4. High-quality technical agencies, standards bodies, and transparent research institutes

For technology-specific categories like `Data Centers`, `AI Compute`, `Refrigerants`, and `Building Operations`, also allow:

- IEA special reports
- Lawrence Berkeley National Laboratory
- national building labs
- ASHRAE or other serious standards bodies
- official cooling / refrigerant assessments

Avoid:

- unsourced blogs
- advocacy claims without methods
- vendor marketing pages used as primary evidence

---

## Extra Instructions

- Always state the underlying data year, not just publication year.
- Use the latest defensible data available.
- If evidence differs by geography, say so explicitly.
- If no strong personal action exists, say that clearly.
- If the action is mostly symbolic, do not rank it highly.
- If the action works mainly through politics or procurement rather than personal consumption, say so.
- Distinguish direct emissions reduction from indirect long-run systems influence.
- Prefer concrete mechanisms over moral framing.
- Use ranges when they are more defensible than point estimates.
- Do not invent precision.
- Keep names product-friendly and readable by non-experts.

---

## Final Decision Standard

If you had to identify the strongest actions in the entire TULIP Footprint system, prioritize the ones with the best combination of:

- large real-world impact
- strong evidence
- understandable mechanism
- realistic adoption pathway
- usefulness for product storytelling

If a footprint has weak actionability at the personal level but strong actionability at the policy level, that is not a weakness. That is a finding. Say it directly.
