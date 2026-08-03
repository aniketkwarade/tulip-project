# Digital Infrastructure Deep Research Prompt

Use this prompt with a deep-research model to evaluate whether TULIP should add a new landing-page filter for digital infrastructure and to build the research backbone for it in production-ready detail.

---

## Goal

I am building a climate systems and industrial-footprint product called TULIP.

The current landing-page filters are organized as broad system domains such as:

- Air & Skies
- Oceans & Water
- Ice & Glaciers
- Plants & Wildlife
- Power & Heat
- Farming & Food
- Travel & Shipping
- Markets & Money
- Society & Politics

I am considering adding a new domain-level filter for what may be called:

- `Digital Infrastructure`
- `Compute & Networks`
- `Digital Systems`
- or another better user-facing name if the evidence supports it

This proposed filter would likely include some combination of:

1. AI Compute
2. Data Centers
3. Cloud Infrastructure
4. Semiconductor Fabrication
5. Telecom Networks
6. Mobile Towers / Wireless Backbone
7. Subsea Cables
8. Satellites
9. Ground Stations
10. Mass Communications Backbone
11. Internet Exchange / Network Core Infrastructure
12. Backup Power for Digital Infrastructure
13. Cooling Water Competition from Digital Infrastructure
14. Critical Minerals for Compute Hardware
15. Surveillance / sensing systems only where they are part of physical infrastructure

I need a rigorous research brief that answers:

1. Does a distinct new filter actually make conceptual and product sense?
2. What should it be called?
3. What should be included and excluded?
4. What are the best anchor phenomena or nodes for this filter?
5. What climate, energy, water, materials, geopolitical, and infrastructure burdens matter most?
6. What sources are strong enough to support this as a serious category in TULIP rather than a trendy add-on?

The output must help me decide whether to implement this new domain in the product and how to structure it cleanly.

---

## Core Decision Standard

This is not a generic technology landscape summary.

Treat it as a product-architecture and evidence-quality exercise.

The research should determine whether this category:

- is materially important enough
- is distinct enough from `Power & Heat`, `Markets & Money`, and `Society & Politics`
- is understandable to users
- has a coherent internal logic
- has enough strong public research to justify a dedicated filter

If the answer is "yes, but only with a narrower scope," say that clearly.
If the answer is "not yet," say that clearly too.

---

## Important Framing Rules

### 1. Prioritize physical infrastructure over abstraction

The category should focus primarily on physical systems and real-world infrastructure, not vague concepts like "data" in the abstract.

Favor:

- servers
- compute clusters
- data centers
- chip fabs
- telecom hardware
- cable systems
- satellites
- power and cooling systems tied to digital infrastructure

Be cautious with:

- software platforms
- media companies
- generic internet culture
- abstract information ecosystems
- intelligence institutions unless they are relevant as physical infrastructure operators

### 2. Distinguish infrastructure from institutions

If a candidate belongs more naturally to governance, military, economic, or social systems than to infrastructure, flag that.

For example:

- a satellite constellation may belong
- a telecom regulator may not
- a cloud campus may belong
- a policy think tank probably does not

### 3. Separate direct burdens from indirect relevance

Distinguish between:

- direct burdens
  - electricity demand
  - cooling demand
  - water withdrawals
  - embodied materials
  - backup diesel use
  - land footprint
  - semiconductor fabrication intensity

- indirect or second-order relevance
  - surveillance power
  - public discourse effects
  - geopolitical control
  - information asymmetry

Both may matter, but they should not be conflated.

### 4. Make overlap explicit

This proposed domain likely overlaps with:

- `Power & Heat`
- `Markets & Money`
- `Society & Politics`
- possibly `Mining` and `AI Compute` already present in Footprint

You must explicitly map which parts overlap and whether the overlap is acceptable, redundant, or clarifiable.

### 5. Be honest about data quality

For some subdomains, public data will be strong and mature.

For others, especially:

- AI-specific compute loads
- private cloud energy splits
- defense-linked digital infrastructure
- exact global network backbone energy demand

the evidence may be incomplete, indicative, or based on synthesis rather than direct measurement.

That is acceptable, but it must be labeled clearly.

---

## Research Questions

Answer all of the following.

### A. Does the category belong in TULIP?

Assess whether a dedicated new filter is justified.

Evaluate:

1. conceptual coherence
2. distinctiveness from current filters
3. user clarity
4. evidence strength
5. future importance
6. product usefulness

Also answer:

- Is this a true peer category to the existing domain filters?
- Or is it better handled as a sub-layer inside `Energy`, `Economy`, or `Society`?

### B. What should the filter be called?

Evaluate possible names such as:

1. Digital Infrastructure
2. Compute & Networks
3. Digital Systems
4. Information Infrastructure
5. Compute, Networks & Satellites
6. another better recommendation

For each candidate label, assess:

- clarity
- seriousness
- user intuitiveness
- breadth
- risk of vagueness

Recommend one final label.

### C. What belongs in scope?

Build a recommended inclusion/exclusion map.

For each candidate component, classify it as:

- `include`
- `include later`
- `exclude`

Evaluate at minimum:

1. AI Compute
2. Data Centers
3. Cloud Infrastructure
4. Semiconductor Fabrication
5. Telecom Networks
6. Mobile / wireless infrastructure
7. Subsea Cables
8. Satellites
9. Ground Stations
10. Internet exchange / network core facilities
11. Backup power systems
12. Cooling water demand
13. Hardware supply chains
14. E-waste streams
15. Military / intelligence-linked digital systems
16. Consumer electronics
17. Streaming / mass communications load

### D. What are the best anchor phenomena or nodes?

Recommend the best 8-15 anchor concepts that could define a first version of this filter in TULIP.

For each proposed node:

1. give a user-facing name
2. give a short definition
3. explain why it belongs
4. identify the primary burden type:
   - electricity
   - water
   - materials
   - cooling
   - emissions
   - fragility
   - geopolitical concentration
   - waste
5. identify the best source base

### E. What are the most important burden dimensions?

Evaluate the major types of burden this category creates or depends on.

At minimum assess:

1. electricity demand
2. peak load stress
3. water consumption / withdrawal
4. cooling system burden
5. embodied carbon
6. operational emissions
7. refrigerant leakage relevance
8. semiconductor manufacturing intensity
9. mineral and metals dependence
10. land-use / local infrastructure footprint
11. backup generator dependence
12. e-waste burden
13. resilience and outage fragility
14. geopolitical chokepoints
15. concentration of control

Indicate which of these are:

- core to the category
- secondary but important
- weak / speculative / not mature enough yet

### F. What are the best sources?

Identify the strongest public source base for each major subdomain.

Prioritize sources such as:

1. IEA
2. IPCC where relevant
3. IRENA where relevant
4. OECD
5. ITU
6. World Bank
7. UNEP
8. US DOE / LBNL / EPA / EIA
9. peer-reviewed synthesis papers
10. NASA / ESA / WMO where relevant to satellite systems
11. reputable telecom and infrastructure datasets
12. transparent corporate disclosures only when needed and clearly labeled as disclosures

Flag where evidence depends heavily on:

- corporate sustainability reports
- consultancy estimates
- model-based synthesis
- sparse academic inference

### G. What is the implementation recommendation?

End with a direct product recommendation:

1. add now
2. research further before adding
3. do not add as a separate filter yet

If the answer is "add now," recommend:

- final filter name
- final scope
- best v1 node set
- top source backbone
- what should remain outside the category

If the answer is "research further," specify exactly what evidence gaps need to be closed.

---

## Required Output Format

Return results in this exact order.

### 1. Executive Verdict

Provide a concise verdict table:

| question | verdict | confidence | note |
|---|---|---|---|
| Should TULIP add this as a new filter? | yes / maybe / no | high / medium / low | ... |
| Is it distinct enough from current filters? | yes / partly / no | high / medium / low | ... |
| Is there enough evidence to support it? | yes / partly / no | high / medium / low | ... |
| Is it user-comprehensible? | yes / partly / no | high / medium / low | ... |

### 2. Best Name Recommendation

Provide a comparison table:

| candidate label | strengths | weaknesses | verdict |
|---|---|---|---|
| ... | ... | ... | recommend / acceptable / avoid |

Then provide:

`Final recommended label:` [label]

`Why this is the best label:` [2-5 sentences]

### 3. Scope Map

Provide:

| candidate component | include? | priority | why | overlap risk | evidence quality |
|---|---|---|---|---|---|
| ... | include / include later / exclude | high / medium / low | ... | low / medium / high | high / medium / low |

### 4. Recommended V1 Node Set

Provide 8-15 recommended v1 nodes.

For each node use this structure:

#### [Node Name]

`Short definition:` [1-3 sentences]

`Why it belongs:` [2-4 sentences]

`Primary burden type:` [electricity / water / materials / cooling / emissions / fragility / geopolitical concentration / waste]

`Best fit with current TULIP logic:` [brief note on how it behaves as a node or cluster]

`Top source candidates:`
- [Source name] - [data year] - [publication year] - [URL]
- [Source name] - [data year] - [publication year] - [URL]

`Evidence quality:` [high / medium / low]

`Implementation priority:` [now / later / avoid]

### 5. Burden Dimensions Ranked

Provide a table:

| burden dimension | how central is it? | why it matters | current evidence strength | notes |
|---|---|---|---|---|
| ... | core / secondary / weak | ... | high / medium / low | ... |

### 6. Overlap With Existing Filters

Provide:

| existing filter | overlap description | is this a problem? | recommended boundary |
|---|---|---|---|
| Power & Heat | ... | yes/no/partly | ... |

### 7. Source Backbone

Provide a prioritized source list:

| source | subdomain covered | source type | strength | limitations |
|---|---|---|---|---|
| ... | ... | ... | high / medium / low | ... |

### 8. Research Gaps

List the biggest unresolved research problems.

Use this structure:

| gap | why it matters | how severe is the gap? | what would resolve it? |
|---|---|---|---|
| ... | ... | low / medium / high | ... |

### 9. Direct TULIP Recommendation

End with:

- `Add now:` [yes/no/maybe]
- `Recommended filter label:` [label]
- `Recommended sphere key:` [suggest a product-friendly internal key]
- `Recommended v1 scope:` [short definition]
- `Recommended v1 nodes:` [comma-separated list]
- `Keep outside the category:` [comma-separated list]
- `Evidence confidence:` [high/medium/low]
- `What to research next:` [3-8 bullets]

---

## Source Priorities

Prefer sources in roughly this order:

1. Intergovernmental and multilateral institutions
   - IEA
   - ITU
   - OECD
   - UNEP
   - World Bank
   - IRENA
   - UN agencies where relevant
2. Peer-reviewed synthesis papers and major review papers
3. National laboratories and official datasets
   - LBNL
   - DOE
   - EPA
   - EIA
4. Space-agency and telecom infrastructure references
   - NASA
   - ESA
   - WMO
   - ITU-linked materials
5. Transparent corporate disclosures, only when necessary and clearly labeled as such

Avoid:

- unsourced blogs
- hype essays
- vendor marketing claims without methods
- trend-piece journalism without primary sourcing

---

## Extra Instructions

- Always state the year of the underlying data, not only the publication year.
- Use the most recent defensible data available.
- Do not invent precision.
- If the evidence base is fragmented, say so directly.
- If a narrower category is better than a broader one, recommend the narrower one.
- If `AI Compute` and `Data Centers` are better treated as subcomponents rather than peers, say that clearly.
- Keep names usable in a product UI.
- Optimize for product clarity, not comprehensiveness-for-its-own-sake.

---

## Final Standard

If you had to make the decision for TULIP today, would you:

1. add this category now,
2. prototype it but keep it internal,
3. or defer it until the evidence and boundaries are stronger?

Answer that directly and defend the choice.
