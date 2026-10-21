# TULIP scores: existing method versus the 20-node pilot

Comparison prepared 22 September 2026 from the local v3 scoring rules and the implemented pilot. This describes the local candidate, not a new check of the live website or installed iOS apps. The underlying observations come from different years.

**The existing method gives people a quick ranking. The pilot gives them a clearer account of what the evidence supports. The pilot has not yet produced a replacement score that measures comparable harm across climate topics.**

The pilot is one assessment approach tested on 20 nodes. Its records sit alongside the existing numbers in the shared data pipeline. At the user's request, its metadata block has been removed from inspectors and PDF exports. This comparison describes the approaches, including the tradeoffs of presenting pilot findings. The 18 issue-node numbers have not been replaced and remain labeled “legacy urgency.” The two response nodes receive no danger score.

## How each works, in simple terms

**Existing method:** turn different measurements into points, combine the points using fixed weights, and display a score from 1 to 10.

- Its current-data recipe gives 30% weight to magnitude, 30% to threshold proximity, 25% to momentum and 15% to extent.
- Its impact recipe gives 35% to physical/ecological burden, 30% to human/economic burden, 20% to persistence and 15% to extent.
- Its modeled recipe uses a supplied estimate. This route was not included in the 20-node scientific pilot.
- For these recipes, a combined result of 0 becomes 1/10 and a result of 1 becomes 10/10. Version 3 retains the version 2 numerical calculation and applies the v3 labels.

These are the intended meanings of the ingredients. The pilot found cases where the available measurement did not actually measure the ingredient's stated meaning.

**Pilot:** answer three questions separately: “How unusual is this?”, “What consequences does the evidence establish?” and “How strong or limited is the evidence?” Keep the original measurement, location and observation period visible. Where the evidence cannot support a common criticality score, say so.

A historical rank is used only where a suitable comparison can be made. It describes unusualness within that reference; it is not a damage score. The implemented pilot is a reviewed snapshot, not an automatic scoring service for every new observation.

## Advantages and disadvantages

| Question | Existing scoring method | 20-node pilot |
|---|---|---|
| Is it easy to understand at a glance? | **Advantage:** one number and one label are easy to scan. | **Disadvantage:** several findings take more reading. Showing both legacy and pilot information can also confuse users unless the labels are clear. |
| Can users sort every issue from worst to best? | **Advantage:** scores support sorting across all 354 current issue nodes. **Limitation:** that order has not been shown to be an order of actual harm. | **Disadvantage:** there is no new common criticality ranking. Its observations and consequences use different units. |
| Does the same number have the same meaning everywhere? | **Disadvantage:** different recipes and ingredients produce the same scale. An 8 for one topic has not been shown to mean the same harm as an 8 for another. | **Advantage:** it makes these differences explicit and withholds an unsupported common number. **Limitation:** it has not solved the underlying comparability problem. |
| Can someone check how the result was reached? | **Advantage:** stored inputs and deterministic calculations make the arithmetic reproducible. All 18 applicable pilot scores were reproduced. | **Advantage:** adds checks on what the measurement actually represents, its scope and its interpretation. Some original source datasets were not independently reconstructed. |
| How does it handle uncertain or incomplete evidence? | **Disadvantage:** the final point score does not generally carry a calculated uncertainty range; some ingredients use observation coverage as if it were severity. | **Advantage:** uncertainty and missing evidence remain visible. **Disadvantage:** a user may mistake “not assessed” for “not serious” unless the interface explains it. |
| What happens when new nodes are added? | **Advantage:** established recipes and fallback estimates make broad numerical coverage easier. **Disadvantage:** a poorly matched indicator can still produce a plausible-looking score. | **Advantage:** every node can receive an assessment record. **Disadvantage:** trustworthy new measurements or criticality results may need a new method and human review. |
| How much work does it take to maintain? | **Advantage:** the existing calculation pipeline is already established. **Disadvantage:** choosing and maintaining defensible ingredients and thresholds still takes research. | **Disadvantage:** more source review, baseline decisions and consequence methods. **Advantage:** changed reviewed inputs cause the old pilot findings to be withheld pending review. |
| Has it been scientifically validated? | Reproducible arithmetic is established; a universal interpretation of its scores as comparable harm is not. | Failure modes and useful evidence have been identified; predictive accuracy and common criticality have not been validated. |

## What changed for each of the 20 nodes

The numbers below are the local legacy v3 registry values, not new scores or endorsements. For all 18 issue nodes, the pilot's common criticality number remains unassigned. The last column summarizes findings from the pilot, not newly collected observations.

| Node | Existing score / 10 | What the pilot adds or exposes |
|---|---:|---|
| Global Temperature | 7.3 | The same annual temperature observation earns points twice. Keep the warming measurement, but assess its consequences separately. |
| Methane Emissions | 7.6 | The input measures methane already in the atmosphere, not how much is emitted per year. The indicator must match the node's name. |
| Carbon Emission | 7.6 | The input measures atmospheric CO₂ concentration rather than emissions. It can therefore give the wrong impression about emissions progress. |
| Ocean Acidification | 10.0 | The pH observation is outside the tested historical range. A rank at its maximum cannot show how much further conditions worsen or quantify biological damage. |
| Marine Heatwaves | 3.5 | Measured ocean area changes substantially with the treatment of long-term warming. Area alone does not establish event duration or ecosystem loss. |
| Coral Bleaching | 8.5 | The source measures reef area exposed to bleaching-level heat stress. That percentage must not be described as the percentage of coral that died. |
| Sea Ice Season Loss | 3.4 | September ice area is being used to describe ice-season length. The tested historical rank also changes by 20 points when the reference period changes. |
| Sea-Level Rise | 7.4 | A partial year was compared with a full year. The comparison needs matching periods, and coastal damage needs local information. |
| Wet-Bulb Heat | 5.6 | Measurements from selected locations do not establish the number of people harmed. Duration and human exposure need separate evidence. |
| Drought Persistence | 8.6 | Local dry-month runs can be described, but global burden totals do not measure the duration or consequences of those local droughts. |
| Extreme Precipitation Intensity | 5.4 | Averaging selected locations hides large local differences. A rainfall observation does not establish flood losses. |
| AMOC Slowdown | 8.0 | A low circulation reading in one month does not establish sustained slowdown or a probability of collapse. The seasonal comparison is small. |
| Permafrost Thaw | 8.8 | Ground warming does not directly measure thawed volume, carbon release or infrastructure loss. Those outcomes need their own evidence. |
| Deforestation | 7.7 | Forest-loss rates remain useful. The consequences of losing equal areas depend on the forest, habitat, carbon and communities involved. |
| Industry Farming | 8.2 | A selected agricultural-soil emissions estimate cannot describe the whole farming sector. Split this broad node into clearer pressures and outcomes. |
| Air Pollution Health Burden | 9.1 | A source-backed estimate of attributable deaths is a usable consequence measure. It still needs uncertainty and must not be relabeled as deaths attributable to climate change. |
| Groundwater Depletion | 7.8 | The proportion of studied aquifers with falling water tables does not establish the volume of water lost or the number of people affected. |
| Urban Water Rationing | 8.6 | The old arithmetic can give a higher danger score when water conservation improves. Assess actual water access and hardship separately from conservation success. |
| Clean Electricity | Excluded | Assess benefits, costs and tradeoffs against what would happen without a specific intervention. A generic response has no hazard score. |
| Ecosystem Restoration | Excluded | Assess ecological improvement and how long it lasts against what would happen without the project. A generic restoration label has no hazard score. |

The legacy v3 registry already excluded the two response nodes. Before the shared-data change, the local iOS profiles nevertheless contained 9.4 for Clean Electricity and 8.2 for Ecosystem Restoration. Removing those inconsistent display values is a platform-data fix, not evidence of a newly validated scoring formula.

## What the pilot proves—and what it does not

The sample contains 12 current-data nodes, six impact-fallback nodes and two responses. It was deliberately varied, not randomly selected, and includes none of the 50 modeled-route nodes. Its results do not establish how well every future node will work.

The strongest gain is identifying misleading interpretations before publishing a new number. The strongest drawback is that users still cannot reliably compare the total harm of every climate topic on one scale. The pilot also does not automatically solve old data, incomplete source verification, statistical uncertainty, local differences or the choice of how to value different kinds of harm.

Making web and iOS use one shared assessment source is a separate improvement. Either method could use that architecture. It ensures consistency for the same release; older installed iOS builds still need an update.

## Product direction

Use the shared pilot framework as the foundation. During the transition, keep any retained legacy number clearly labeled and make the evidence easier to understand. Develop and validate consequence methods for comparable groups of nodes before introducing new common criticality scores. If one overall priority ranking is eventually required, explicitly define the judgments used to trade off different harms and test how sensitive the ranking is to those choices.

## Local sources

- [Implemented pilot records](/Users/aniketwarade/Work/LostPlanet/src/tulip-assessment-pilot.json)
- [Legacy v3 score registry](/Users/aniketwarade/Work/LostPlanet/public/tulip-urgency-v3-scores.json)
- [Existing numerical calculation](/Users/aniketwarade/Work/LostPlanet/src/tulip-urgency-v2.js)
- [V3 bands and calculation version](/Users/aniketwarade/Work/LostPlanet/src/tulip-urgency-v3.js)
- [Original 20-node audit](/Users/aniketwarade/Work/LostPlanet/artifacts/tulip-score-pilot-20-2026-09-21/REPORT.md)
- [Original local platform comparison](/Users/aniketwarade/Work/LostPlanet/artifacts/tulip-score-pilot-20-2026-09-21/platform-field-comparison.csv)
- [Shared implementation and its limits](/Users/aniketwarade/Work/LostPlanet/docs/tulip-shared-assessment-pilot.md)

Where the original audit's water-rationing headline used an uncorroborated duration or population estimate, this comparison follows the narrower implemented pilot finding instead.
