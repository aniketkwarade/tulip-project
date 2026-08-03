# Footprint High-Impact Research Prompt

Use this prompt with a deep-research model to identify the best additional high-impact categories for the TULIP `Footprint` view and to collect source-backed numbers in a UI-ready format.

## Goal

I am building a climate and industrial-footprint interface called TULIP. The current footprint categories are:

1. Diet
2. Industry Farming
3. Methane
4. Carbon
5. Conveyance
6. Food Waste
7. Fertilizers
8. Mining
9. Housing
10. Aviation + Shipping
11. Cement + Steel
12. Refrigerants

I want to know:

1. Which additional categories are most worth adding next if the priority is **high impact**, **clear explanatory value**, and **strong available data**.
2. What the best quantitative lens is for each recommended addition.
3. What exact numbers, sources, and units should power the UI.

## What Counts As A Good Addition

Prioritize categories that are:

- globally material in emissions, resource use, or system burden
- meaningfully distinct from the existing footprint categories
- understandable to users without heavy explanation
- supported by strong public source material
- easy to render as a ranked footprint chart with 6-10 items

Do **not** recommend categories that are mostly duplicates of what is already covered unless there is a strong case that the split makes the product much clearer.

## Candidate Additions To Evaluate First

Evaluate these as the top candidate additions:

1. Power / Electricity Generation
2. Plastics / Petrochemicals
3. Buildings Operations (heating, cooling, electricity use)
4. Road Freight / Logistics
5. Data Centers
6. AI Data Centers
7. Deforestation / Land-Use Change

You may recommend other categories too, but only if they are stronger than the list above.

## Research Tasks

For each candidate addition:

1. Decide whether it should be added to the Footprint view.
2. Give it a recommended user-facing name.
3. Choose the best single lens for the UI:
   - source attribution
   - sector breakdown
   - lifecycle breakdown
   - regional concentration
   - process-stage breakdown
   - resource intensity
   - emissions intensity
   - infrastructure burden
4. Recommend the best unit.
5. Build a ranked chart structure with 6-10 items when possible.
6. Provide exact sources and dates.
7. Flag overlaps with existing categories.

## Important Product Constraints

The result needs to work in a UI with:

- one category title
- one short definition
- one line explaining the unit
- one source line
- a simple axis
- 6-10 ranked rows
- optional grouped sections if needed

Prefer global values when possible.
If no clean global number exists, use the best defensible global proxy and explain why.
If multiple credible estimates disagree, include 2-3 candidates briefly and recommend one.

## Required Output Format

Return results in this exact order.

### 1. Recommended Additions Ranked

Provide a ranked table:

| rank | candidate | should add? | recommended label | why it matters | overlap risk | evidence strength |
|---|---|---|---|---|---|---|
| 1 | ... | yes/no | ... | ... | low/medium/high | high/medium/low |

### 2. Production-Ready Additions

Pick the top 3-5 additions that are strongest **right now** for implementation.

For each one, use this structure:

#### [Category Name]

`Recommended UI label:` [label]

`Recommended lens type:` [example: source attribution]

`Recommended unit:` [example: MtCO2e per year, TWh per year, % share]

`Why this belongs in Footprint:` [2-4 sentences]

`Overlap with current categories:` [brief explanation]

`Suggested axis:`
- `axis_max:` [number]
- `axis_ticks:` [array]

`Suggested grouped sections:`
- `primary:` [label]
- `secondary:` [label]

`Ranked items:`

| item | value | unit | group | note | source |
|---|---:|---|---|---|---|
| ... | ... | ... | primary/secondary | ... | ... |

`Top candidate sources:`
- [Source name] - [data year] - [publication year] - [URL]
- [Source name] - [data year] - [publication year] - [URL]

`Confidence and caveats:`
- [brief bullet]
- [brief bullet]

### 3. Not Worth Adding Yet

List the candidates that should **not** be added yet, and explain whether the problem is:

- too much overlap
- weak data
- weak user clarity
- better handled as a sub-lens inside an existing category

### 4. Direct Recommendation For TULIP

End with a concise implementation recommendation:

- `Add now:` [top 3-5]
- `Research later:` [next 2-4]
- `Do not add yet:` [remainder]

## Source Priorities

Prefer sources in this order:

1. IPCC, IEA, UNEP, FAO, OECD, World Bank, WHO, WMO, IMO, ICAO, IRENA
2. Peer-reviewed synthesis papers and major review papers
3. Official government and multilateral datasets
4. Reputable research institutes with transparent methodology

Avoid unsourced blogs, advocacy pages without methods, and corporate marketing pages unless they are only being used for narrow operational context.

## Extra Instructions

- Always state the year of the underlying data, not just the publication year.
- Use the most recent defensible data available.
- Do not invent precision.
- If ranges are more defensible than point values, use ranges.
- Normalize names into product-friendly labels.
- Keep row labels readable by non-experts.
- If a candidate is already partially present in the codebase but missing from the active selector, mention that explicitly.

## Final Decision Standard

If you had to recommend only **three** additions for immediate implementation in TULIP Footprint, pick the three with the best combination of:

- scale
- clarity
- source strength
- low overlap with the current set
