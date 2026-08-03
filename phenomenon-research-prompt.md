# Phenomenon Research Prompt

Use this prompt with a deep-research model to gather real, current, source-backed numbers for the TULIP `Phenomena` view.

## Prompt

You are helping build a climate systems product called TULIP. I need source-backed quantitative research for a set of environmental and industrial phenomena so I can replace illustrative values in a UI with real numbers.

Your job:

1. Research each phenomenon below using high-quality primary or near-primary sources.
2. Extract real numeric values that can support a ranked or grouped explanatory lens.
3. Prefer globally representative numbers when possible.
4. If a global number is not available, use a clearly labeled regional or sector-leading proxy.
5. Include exact source links, publication dates, and brief notes on methodology.
6. Flag uncertainty, outdated data, or cases where only rough estimates exist.
7. Do not invent precision. If ranges are more defensible than point estimates, use ranges.
8. When multiple credible estimates disagree, include 2-3 candidates and explain the difference.

Important output goal:
I need numbers that can drive a UI with:
- a title
- an intro
- an axis maximum
- axis ticks
- 6-10 ranked items
- optional grouped sections such as "Primary Drivers" and "Secondary Drivers"

For each phenomenon, identify the best quantitative framing:
- sector share
- lifecycle breakdown
- source attribution
- process-stage breakdown
- regional distribution
- emissions intensity
- resource intensity
- loss chain
- infrastructure burden

If a phenomenon is better explained by percentages, use percentages.
If it is better explained by absolute intensity, use intensity.
If it is better explained by multiple units, recommend the best single unit for a simple UI.

## Phenomena To Research

1. Food
2. Industrial Farming
3. Methane
4. Carbon Emissions
5. Personal Conveyance
6. Food Waste
7. Aviation
8. Shipping
9. Cement / Concrete
10. Steel
11. Plastics / Petrochemicals
12. Air Conditioning / Refrigerants
13. Fertilizer Production
14. Mining / Critical Minerals
15. Urban Sprawl / Housing Construction
16. Global Temperature
17. Deforestation
18. Urbanization
19. Fast Fashion
20. Migration
21. Resource Depletion
22. Environmental Anomalies / Extreme Events
23. El Nino
24. La Nina
25. Wet-Bulb Heat
26. Monsoon Volatility
27. Permafrost Thaw
28. Data Centers
29. AI Data Centers
30. AMOC Slowdown

## Required Output Format

Return one section per phenomenon using this exact structure:

### [Phenomenon Name]

`Recommended lens type:` [example: source attribution, lifecycle breakdown, emissions intensity]

`Recommended unit:` [example: % share of total, kg CO2e per unit, MtCO2e/year, TWh/year, million hectares/year]

`Why this framing works:` [2-4 sentences]

`Suggested axis:`  
- `axis_max:` [number]  
- `axis_ticks:` [array of numbers]

`Suggested grouped sections:`  
- `primary:` [label]  
- `secondary:` [label]

`Ranked items:`  
| item | value | unit | group | note | source |
|---|---:|---|---|---|---|
| ... | ... | ... | primary/secondary | ... | ... |

`Optional components for stacked bars:`  
Only include this if a row is best explained by sub-components.
| parent_item | component | value | unit | note | source |
|---|---|---:|---|---|---|

`Top candidate sources:`  
- [Source name] - [date] - [URL]
- [Source name] - [date] - [URL]

`Confidence and caveats:`  
- [brief bullet]
- [brief bullet]

## Source Priorities

Prefer sources in roughly this order:

1. Intergovernmental and scientific assessments
   - IPCC
   - UNEP
   - IEA
   - FAO
   - IRENA
   - OECD
   - World Bank
   - WHO
   - WMO
   - IMO
   - ICAO
   - NOAA
   - NASA
2. Peer-reviewed papers and major review papers
3. Official government or multilateral datasets
4. Highly reputable NGO or research institute syntheses

Avoid weak marketing sources, unsourced blogs, or advocacy pages without methods.

## Extra Instructions

- Use the most recent available data, and always state the year of the data itself, not just the publication year.
- If "actual numbers" are not directly available for a clean 6-10 item ranking, build the best defensible proxy ranking and explain it.
- If there is a strong case for splitting one phenomenon into two alternate lenses, propose both and recommend one.
- Normalize terms so they are usable in a product UI.
- Keep notes concise and product-friendly.
- If a source uses incompatible units, convert them and show the original unit in the note.

## Final Deliverable

At the end, include a compact summary table:

| phenomenon | recommended lens type | recommended unit | strongest source base | confidence |
|---|---|---|---|---|
| ... | ... | ... | ... | high/medium/low |

Also include a final section:

## Best Immediate Replacements

Pick the 10 phenomena with the strongest available quantitative evidence and say:
- which ones are production-ready now
- which ones still need estimation or synthesis
- which ones are weakest and why

