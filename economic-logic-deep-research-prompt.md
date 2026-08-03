# LostPlanet Deep Research Prompt: Additive Economic Logic For Curated Footprint Nodes

## Objective

Produce deep research for the curated LostPlanet footprint nodes so the product can add new, non-duplicative information to the existing:

- `Impact on Humans`
- `Impact on Planet`
- `What Can Be Done`

This research is **additive only**. It is **not** meant to replace, restate, or paraphrase the platform's current human-impact and planet-impact copy.

The goal is to surface the missing economic/system logic around each node:

- what costs are hidden
- who actually absorbs those costs
- what physical limit or boundary is being hit
- what default driver keeps the system reproducing the problem
- what system levers can structurally change the baseline

## Critical Constraint: No Duplication

Do **not** repeat existing LostPlanet content in slightly different words.

Avoid repeating material that is already covered by:

- direct harms
- exposure summaries
- ecological consequences
- domain labels
- affected populations
- primary pathways

Instead, only add information that answers one of these **net-new** questions:

1. `Hidden Cost`
2. `Who Pays`
3. `Physical Limit`
4. `Default Driver`
5. `System Levers`

If a proposed line mainly restates an existing impact, drop it.

## Product Structure To Support

Your research should support this additive UI structure:

### Impact on Humans

Keep all current content. Add only:

- `Hidden Cost`
- `Who Pays`

### Impact on Planet

Keep all current content. Add only:

- `Physical Limit`

### What Can Be Done

Add:

- `Default Driver`
- `System Levers`

Important:

- `Default Driver` should describe the causal system condition that keeps recreating the problem.
- `System Levers` should describe structural interventions, not generic personal tips.

## Nodes To Research

Research the following curated footprint nodes used by the current product surface:

1. `food`
2. `industry_farming`
3. `methane`
4. `carbon_emission`
5. `electricity_generation`
6. `personal_conveyance`
7. `road_freight_logistics`
8. `food_waste`
9. `fertilizer_production`
10. `mining_critical_minerals`
11. `urban_sprawl_housing`
12. `building_operations`
13. `deforestation_land_use`
14. `plastics_petrochemicals`
15. `data_centers`
16. `ai_compute`
17. `aviation_shipping`
18. `cement_steel`
19. `air_conditioning_refrigerants`

## Source Quality Requirements

Use strong, primary, or institutional-quality sources wherever possible:

- intergovernmental bodies
- government agencies
- peer-reviewed papers
- major statistical agencies
- official technical reports
- high-quality institutional research groups

Prefer sources that can directly support claims about:

- subsidy structures
- underpriced externalities
- infrastructure lock-in
- market incentives
- exposure distribution
- depletion or tolerance thresholds
- policy and institutional levers

Avoid:

- advocacy copy without evidence
- think-piece style essays without data
- brand marketing
- vague “green economy” summaries
- generic sustainability blogs

## Research Lens

The research should follow this mental model:

- `Hidden Cost`: What real burden is omitted from the market price or from ordinary decision-making?
- `Who Pays`: Which groups, places, workers, households, ratepayers, ecosystems-adjacent communities, or future publics absorb the burden?
- `Physical Limit`: What boundary, sink, recharge rate, survivability threshold, capacity ceiling, or ecological tolerance is being exceeded?
- `Default Driver`: What policy, infrastructure, market design, subsidy, business model, procurement norm, convenience loop, or regulatory gap keeps the system locked in?
- `System Levers`: What structural interventions change the baseline at scale?

## Output Format

For each node, return the following structure:

### `[node_id]`

- `Node label:` human-readable product label
- `Research confidence:` `High`, `Medium`, or `Emerging`

- `Hidden Cost:`
  One short paragraph, maximum 2 sentences.

- `Why this is net-new versus current human-impact copy:`
  One sentence explaining why this is not duplicative.

- `Who Pays:`
  One short paragraph, maximum 2 sentences.

- `Why this is net-new versus current human-impact copy:`
  One sentence explaining why this is not duplicative.

- `Physical Limit:`
  One short paragraph, maximum 2 sentences.

- `Why this is net-new versus current planet-impact copy:`
  One sentence explaining why this is not duplicative.

- `Default Driver:`
  One short paragraph, maximum 2 sentences.

- `Why this belongs in What Can Be Done:`
  One sentence explaining why this is causal/actionable rather than just descriptive impact.

- `System Levers:`
  3 to 5 flat bullets.
  These must be structural, policy, regulatory, procurement, infrastructure, financing, or governance levers.

- `Key evidence:`
  3 to 6 bullets.
  Each bullet should include:
  - source name
  - date if available
  - one high-value factual takeaway
  - URL

## Anti-Duplication Rules

Before finalizing any node entry, check these failure modes:

- Does `Hidden Cost` merely restate visible harm? If yes, revise.
- Does `Who Pays` simply repeat the existing affected population list without explaining burden distribution? If yes, revise.
- Does `Physical Limit` merely say “nature is harmed” or “emissions are high”? If yes, revise.
- Does `Default Driver` merely restate the phenomenon itself? If yes, revise.
- Do `System Levers` drift into personal behavior tips? If yes, revise.

Good additive examples:

- not “people face heat stress”
- but “cooling poverty and labor loss are not carried in the price of energy-intensive urban form”

- not “water systems are pressured”
- but “withdrawals exceed recharge or operational load exceeds local grid interconnection capacity”

- not “transport emits carbon”
- but “road design, parking policy, fleet standards, and freight routing norms keep the system car- and diesel-dependent by default”

## Style Requirements

- Be concrete, not academic.
- Avoid abstract jargon unless it is necessary and clearly explained.
- Optimize for product copy that can later be shortened into UI text.
- Prefer mechanism over moral framing.
- Prefer distribution and constraint language over generic sustainability language.

## Final Deliverable Expectation

The finished research should be strong enough that it can be transformed into:

- additive node-inspector copy
- structured JSON data fields
- source-backed content review notes
- future action-layer integrations

The best output will make each node answer:

- what is not being counted
- who is carrying the burden
- what boundary is being pushed
- what system keeps reproducing the problem
- what structural levers can change it
