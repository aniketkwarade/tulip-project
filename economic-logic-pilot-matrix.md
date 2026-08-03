# Economic Logic Pilot Matrix

This note defines a first research-grade pass for adding node-level economic logic to LostPlanet.

The goal is not to turn every node into an economics explainer. The goal is to make each selected node answer four concrete questions:

1. What cost is being hidden?
2. What keeps the system going?
3. Who absorbs the damage or risk?
4. What kind of lever changes the baseline?

This first pass focuses on six curated footprint nodes that already have strong UI surfaces in `PHENOMENON_SELECTOR_ITEMS` and enough source grounding to support concrete user-facing copy.

## Proposed Inspector Object

For each node, the user should see a compact block directly under the main node explanation:

- `Economic Logic`
- `Hidden Cost:` one sentence
- `What Keeps It Going:` one sentence
- `Who Pays:` one sentence
- `What Changes It:` one sentence
- `Confidence:` `High`, `Medium`, or `Emerging`

For hazard-heavy nodes such as `wet_bulb_heat`, the label can shift from `Economic Logic` to `Economic Exposure`, but the four-line structure should stay the same.

## Pilot Nodes

### 1. `carbon_emission`

Research type: incentive-driven

Research basis:

- NOAA tracks atmospheric CO2 as a cumulative climate-pressure signal, with Mauna Loa at `431.44 ppm` in June 2026 and updated July 5, 2026.
- IEA says fossil-fuel subsidies distort markets, send the wrong price signals, and discourage cleaner energy adoption.
- IEA reports fossil-fuel consumption subsidies reached `more than $1 trillion` in 2022 and remained elevated at `$620 billion` in 2023.

Primary sources:

- [NOAA CO2 Trends](https://gml.noaa.gov/ccgg/trends/)
- [IEA Fossil Fuel Subsidies](https://www.iea.org/topics/fossil-fuel-subsidies)

Research object:

- `hidden_cost`: Long-lived climate damage and health burdens are not fully carried in the price of fossil combustion.
- `default_driver`: Cheap fossil energy is reinforced by subsidy regimes, legacy infrastructure, and market rules that still favor incumbent fuels.
- `who_pays`: Heat-exposed households, food systems, coastal communities, and future publics absorb the downstream cost.
- `physical_limit`: Atmospheric carbon loading keeps rising even when the immediate market transaction looks cheap.
- `system_lever`: Carbon pricing, green tax reform, fossil subsidy phaseout, clean-power standards, and electrification.
- `confidence`: High

Draft user-visible copy:

- `Hidden Cost:` The price of fossil energy still leaves much of the climate and health damage off the balance sheet.
- `What Keeps It Going:` Subsidies, legacy assets, and market rules still make incumbent fuels look cheaper than they really are.
- `Who Pays:` People pay later through heat, crop losses, insurance stress, air pollution, and infrastructure damage.
- `What Changes It:` Change the default with carbon pricing, subsidy removal, clean-power rules, and electrified end uses.

### 2. `fast_fashion`

Research type: incentive-driven

Research basis:

- UNEP says the fashion industry produces `2 to 8 per cent` of global carbon emissions.
- UNEP says textile dyeing is the `second largest polluter of water globally`.
- UNEP says one garbage truck equivalent of textiles is landfilled or burned every second.
- UNEP says textiles account for `approximately 9%` of annual microplastic losses to the ocean.
- The repo already treats fast fashion as a high-turnover system with strong waste, water, and emissions externalities.

Primary sources:

- [UNEP: Putting the brakes on fast fashion](https://www.unep.org/news-and-stories/story/putting-brakes-fast-fashion)
- [Fast fashion calibration note in data model](./src/data.js)

Research object:

- `hidden_cost`: Water pollution, waste disposal, microfiber loss, freight churn, and labor harm are externalized out of the sticker price.
- `default_driver`: Revenue depends on faster turnover, more collections, and lower durability.
- `who_pays`: Garment workers, communities near dyeing and waste sites, water-stressed producing regions, and downstream ecosystems.
- `physical_limit`: Fiber, water, waste, and carbon throughput rise faster than systems can absorb or regenerate.
- `system_lever`: Durability standards, EPR, wastewater controls, reuse markets, and procurement rules that slow turnover.
- `confidence`: High

Draft user-visible copy:

- `Hidden Cost:` Cheap clothing hides wastewater, waste burning, microfiber loss, freight emissions, and labor exploitation.
- `What Keeps It Going:` The business model rewards speed, novelty, and high volume, not long use.
- `Who Pays:` Factory communities, waste-picking communities, water-stressed regions, and low-wage workers absorb the damage.
- `What Changes It:` Shift the baseline with durability rules, EPR, disclosure, repair and reuse markets, and slower procurement cycles.

### 3. `data_centers`

Research type: incentive-driven

Research basis:

- IEA says there is no AI without electricity for data centres.
- IEA says a typical AI-focused data centre uses as much electricity as `100,000 households`, and the largest ones under construction can use `20 times` as much.
- IEA says data centres used `415 TWh` in 2024, or around `1.5%` of global electricity consumption.
- IEA says data-centre electricity demand is projected to more than double to around `945 TWh` by 2030.
- IEA says local impacts are more pronounced than the global share because facilities are geographically concentrated and can strain local grids.

Primary sources:

- [IEA: Energy and AI](https://www.iea.org/reports/energy-and-ai)
- [Data center calibration note in data model](./src/data.js)

Research object:

- `hidden_cost`: Grid congestion, peak demand stress, water competition, backup generation, and slower local decarbonization are often hidden behind cloud-service abstraction.
- `default_driver`: Compute demand, uptime expectations, cluster economics, and utility structures reward concentrated buildout.
- `who_pays`: Ratepayers, water-stressed communities, nearby residents, and constrained grids absorb the local burden first.
- `physical_limit`: Grid capacity, cooling water, and local land-use tolerance are finite even if digital demand appears elastic.
- `system_lever`: Siting rules, interconnection discipline, transparency, clean hourly power, efficiency, and flexibility requirements.
- `confidence`: High

Draft user-visible copy:

- `Hidden Cost:` Digital convenience hides real electricity demand, cooling water use, local grid strain, and fossil fallback risk.
- `What Keeps It Going:` Compute growth and uptime incentives reward concentrated buildout faster than grids can adapt.
- `Who Pays:` Local ratepayers and water-stressed communities feel the pressure before the rest of the system does.
- `What Changes It:` Better siting, cleaner power procurement, efficiency rules, and grid-aware operating standards change the baseline.

### 4. `resource_depletion`

Research type: incentive-driven

Research basis:

- GRACE-FO tracks underground water storage, lakes, rivers, glaciers, and other water-mass changes globally.
- NASA says several regions are seeing marked declines in water availability and that dry areas are increasing by about twice the size of California each year.
- The repo already calibrates this node around groundwater and land-capital exhaustion dynamics.

Primary sources:

- [NASA JPL: GRACE-FO](https://gracefo.jpl.nasa.gov/)
- [NASA JPL: Dry spots are getting drier](https://gracefo.jpl.nasa.gov/news/288/us-german-water-satellites-show-continental-dry-spots-are-getting-drier/)
- [Resource depletion calibration note in data model](./src/data.js)

Research object:

- `hidden_cost`: Extraction and throughput often ignore depletion, recharge time, habitat loss, and restoration cost.
- `default_driver`: Growth systems reward more throughput now while treating soil, groundwater, biomass, and minerals as cheap inputs.
- `who_pays`: Farmers, basin communities, low-income households, and ecosystems pay when depleted systems fail or become unaffordable.
- `physical_limit`: Recharge and regeneration rates set hard limits that GDP-style growth accounting does not respect.
- `system_lever`: Extraction caps, depletion pricing, watershed rules, circularity where real, and regeneration investment.
- `confidence`: Medium

Draft user-visible copy:

- `Hidden Cost:` The price of extraction usually ignores recharge time, ecological repair, and long-tail water or land damage.
- `What Keeps It Going:` Throughput-heavy growth treats water, soils, forests, and minerals as cheap inputs instead of limited stocks.
- `Who Pays:` Rural communities, food systems, and ecosystems pay when depletion becomes scarcity, conflict, or price shock.
- `What Changes It:` Use limits, depletion pricing, restoration obligations, and real demand reduction keep use inside recharge boundaries.

### 5. `insurance_retreat`

Research type: exposure-driven

Research basis:

- FEMA says Risk Rating 2.0 is designed to make rates better reflect a property’s flood risk.
- FEMA says the older approach omitted many flood variables and did not account for rebuilding cost.
- FEMA says the new method incorporates flood frequency, multiple flood types, distance to water, elevation, and rebuild cost.
- The repo already models insurance retreat as a signal that physical risk is crossing into market uninsurability and forced economic retreat.

Primary sources:

- [FEMA: NFIP pricing approach](https://www.fema.gov/flood-insurance/risk-rating)
- [Insurance retreat calibration note in data model](./src/data.js)

Research object:

- `hidden_cost`: Repeated physical risk was historically underpriced, which delayed adaptation and made later repricing more abrupt.
- `default_driver`: Property markets and local development patterns continue to place people and assets in repeat-loss zones.
- `who_pays`: Homeowners, renters, local tax bases, and small businesses absorb the shock when coverage rises, shrinks, or exits.
- `physical_limit`: Insurance cannot outrun worsening physical risk indefinitely.
- `system_lever`: Land-use reform, retrofit, managed retreat, resilience investment, and social protection before coverage fails.
- `confidence`: Medium-high

Draft user-visible copy:

- `Hidden Cost:` Insurance prices can stay artificially calm until repeated losses force a harsher repricing of real risk.
- `What Keeps It Going:` Development, mortgage, and rebuilding systems still keep assets in places where losses keep compounding.
- `Who Pays:` Households and local communities pay first when premiums spike, coverage shrinks, or recovery lags.
- `What Changes It:` Lower the physical risk early with land-use reform, retrofit, resilience spending, and protection for exposed households.

### 6. `wet_bulb_heat`

Research type: exposure-driven

Research basis:

- NWS says the heat index shows how hot it feels once humidity is combined with temperature.
- NWS says full sunshine can add up to `15°F` to heat-index conditions.
- NWS says WBGT uses temperature, humidity, wind, solar radiation, and other parameters and is particularly effective for outdoor workers and athletes.
- NWS says HeatRisk also considers overnight heat, duration, and CDC heat-health thresholds.
- The repo already treats wet-bulb heat as a survivability and infrastructure stress metric with maximum societal fallout.

Primary sources:

- [NWS Heat Forecast Tools](https://www.weather.gov/safety/heat-index)
- [Wet-bulb heat calibration note in data model](./src/data.js)

Research object:

- `hidden_cost`: Labor loss, hospital stress, cooling poverty, and survivability limits are usually not priced into hot-weather exposure patterns.
- `default_driver`: Warming loads the baseline upward while housing, work schedules, urban form, and cooling inequality lock in vulnerability.
- `who_pays`: Outdoor workers, older adults, people without cooling, and hot-city residents face the first and worst exposure.
- `physical_limit`: Human tolerance and grid-backed cooling capacity are hard limits, not soft inconveniences.
- `system_lever`: Worker protections, cooling access, urban shade, resilient buildings, and stronger heat-warning response systems.
- `confidence`: High

Draft user-visible copy:

- `Hidden Cost:` Extreme humid heat carries labor, health, and cooling burdens that markets rarely price before the emergency arrives.
- `What Keeps It Going:` Warming raises the baseline while poor housing, hot urban form, and unequal cooling keep exposure high.
- `Who Pays:` Outdoor workers, older adults, and households without reliable cooling are hit first.
- `What Changes It:` Protect people with cooling access, heat-safe work rules, shaded urban design, and stronger response systems.

## What The User Will Actually Notice

If we implement this well, the user should not feel like they opened an economics tab.

They should feel that each node now answers:

- why this problem still looks cheap
- why the system keeps reproducing it
- who gets hit before everyone else
- what kind of intervention is structurally meaningful

That is the product value of this layer.

## Implementation Notes

- Best placement is directly below `#console-node-meaning` and before the Human Impact / Planet Impact cards.
- Keep the visible copy to four short lines plus a confidence badge.
- Store the research object separately from display copy so we can audit, update, and source it later.
- For this pilot, do not try to cover every generated node in the graph. Start with the curated footprint nodes only.
