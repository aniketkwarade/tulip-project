# Redesigning the Imprint Experience for The Tulip Project

## Executive Summary

The current Imprint tab has a good product instinct: it stays short, asks lifestyle questions ordinary people can answer from memory, and tries to cover more than carbon alone. That broad shape is directionally right. Across major consumer and policy-facing footprint tools, the most consistent behavioral domains are home, travel, food, and purchased goods, often adjusted by location and household context. EPA’s household calculator focuses on home energy, transportation, and waste; WWF’s consumer tool uses Food, Travel, Home, and Stuff; the JRC Consumer Footprint framework uses food, housing, mobility, household goods, and appliances; and CoolClimate uses location and household size to set smart defaults and comparisons. citeturn1view0turn11view0turn11view1turn1view1turn1view3

The main problems are not that the current model is too simple. The problems are that parts of it are hard to answer confidently, some questions overlap, one major housing signal is missing, and the score architecture is doing too much hidden work. In particular, “transport,” “home energy,” and “shopping” are likely too abstract unless they are anchored in everyday situations. The current use of a modeled maximum profile also makes the score depend heavily on an arbitrary ceiling rather than on a realistic benchmark. And the current 50/50 blend of carbon and a composite “resource pressure” is hard to defend to consumers because it hides how the score is actually being made. The JRC’s work is especially relevant here: it explicitly warns that resource-use indicators alone can be misleading proxies for overall environmental impact, even when they are useful components in a broader life-cycle model. citeturn6view0turn6view1turn2view3turn2view4

The best redesign is to keep the product lightweight but restructure it around **four lifestyle drivers** and **four internal impact dimensions**. The lifestyle drivers should be **Home, Travel, Food, and Stuff**, because that is how consumers think. The internal dimensions should be **Carbon, Nature, Water, and Materials**, because that is the most defensible way to preserve the product’s multi-impact ambition without forcing users to reason in technical environmental categories. I recommend replacing **land pressure** with **nature pressure** for user-facing language, keeping **resource pressure** as an optional secondary or internal composite rather than a main metric, expanding the questionnaire to **10 questions** by splitting housing into **home type/size** and **home energy setup**, and changing normalization from an arbitrary maximum-profile model to a **region-adjusted benchmark model** anchored to average and realistic high- and low-impact reference lifestyles. citeturn1view3turn11view1turn11view2turn7view1

I was not able to locate an accessible file named `imprint_tab_audit` in the available file library during this session, so this assessment is grounded in the product context you provided plus external evidence and benchmark tools.

## Audit of the Current Model

The current 9-question model has three real strengths. First, it is short enough to finish without fatigue, which matters because respondent burden reduces response quality and completion. Second, it already includes the right high-level domains: food, travel, home, and goods are the main recurring hotspots across footprint frameworks. Third, it uses region and household size as context, which is methodologically sound because location changes electricity and heating emissions, and per-person household impact changes with household size due to shared energy and shared space. citeturn6view1turn1view0turn11view0turn1view3turn9search0turn1view1

Its weaknesses are mostly about answer confidence and attribution clarity. “Transport” is too broad unless it is translated into a typical week pattern. “Home energy” can become technical if users are asked about fuels, bills, or systems they do not fully know. “Shopping” is too vague because consumers do not carry a clean mental model of what counts as shopping, and it overlaps with clothing unless the boundaries are explicit. “Food waste” is useful, but the word “waste” can feel moralizing; consumers usually answer better when the wording focuses on what “goes uneaten” rather than what they “waste.” Survey design guidance consistently recommends minimizing burden, using respondent-centered language, and testing question comprehension and confidence through cognitive methods. citeturn6view1turn6view0

The biggest structural gap is housing. The current model asks about home energy but not the **size/type of home**, even though housing burden depends not just on what powers the home but also on how much space is being heated, cooled, and maintained. That omission makes household size do too much correcting work after the fact. Buildings are a major energy domain globally, and in advanced economies most household energy use is still tied to space and water heating. That is why a lightweight footprint experience usually needs one question about the **home itself** and a separate question about the **energy setup**. citeturn7view1turn1view0

The current score logic also has avoidable trust risks. Silently filling unanswered questions with baseline defaults keeps the score stable, but it also makes the result feel more precise than it is. A stronger pattern is to treat “I’m not sure” as an explicit answer, map it to a contextual median, and show a separate **confidence** signal. CDC guidance is directly relevant here: question quality depends not just on comprehension and recall, but also on judgment, including how sure respondents are about their answers. citeturn6view0

A concise redesign of the current question set looks like this:

| Current question | Recommendation | Reason |
|---|---|---|
| Region profile | Keep | Strong contextual modifier for comparisons and regional factors |
| Diet | Keep | High signal and easy to answer |
| Transport | Keep but rewrite | Needs a “typical week” framing |
| Flights | Keep | Distinct, high-variance travel signal |
| Home energy | Split | Separate home type/size from energy setup |
| Household size | Keep | Better as contextual than direct |
| Clothing | Keep but sharpen | Good material signal if bounded clearly |
| Shopping | Keep but narrow | Should exclude clothes and groceries |
| Food waste | Keep but soften wording | Useful, but current framing likely feels guilty/abstract |

The overlap risks are concentrated in **clothing + shopping** and **household size + home energy**. The clean fix is not to remove these topics entirely, but to give them sharper scopes. Clothing should mean apparel and shoes. Shopping should mean non-clothing goods for self or home, such as electronics, furniture, décor, hobby gear, and replacement items. Household size should not directly “score” consumption choices; it should mainly reallocate shared-home burdens and shared-goods burdens across people. That improves explainability and reduces the sense that the model is making hidden moral judgments about family structure. citeturn11view2turn9search0

## Recommended Questionnaire

The strongest lightweight predictors for a consumer household experience are the same domains that recur across footprint tools and consumption-footprint research: **Food, Housing, Mobility, Household Goods, and Appliances**, with location and household size used as context. The JRC’s Consumption Footprint work shows food, housing, and mobility as the leading impact areas, with household goods and appliances still meaningful. WWF’s consumer calculator uses Food, Travel, Home, and Stuff. EPA and CoolClimate similarly organize around home and travel, with context from location and household size. That makes a 10-question design around **Home, Travel, Food, and Stuff**, plus **two context questions**, the most defensible product choice. citeturn1view3turn11view1turn11view0turn1view0turn1view1

The redesigned questionnaire should be presented as **“Choose the answer that feels closest”**, not as a test of perfect recall. Every direct question should offer an **“I’m not sure”** fallback that maps to a contextual median and lowers confidence rather than silently locking in a hidden default. That preserves speed while making the estimate feel fairer and more honest. citeturn6view0turn6view1

| Question title | Plain-language wording | Answer options | Why it belongs | Role |
|---|---|---|---|---|
| Where your household is based | **Where is your household based most of the year?** | Region or country list used in product | Sets regional baselines and energy context | Contextual |
| People in your home | **How many people share your home and its energy use?** | 1, 2, 3, 4, 5+ | Adjusts shared housing and shared-goods burdens | Contextual |
| Your home | **Which home feels most like yours?** | Small apartment or shared room; Average apartment or condo; Small townhome or house; Average detached house; Large detached house | Captures home size and dwelling pattern without asking for square footage | Direct |
| Home energy setup | **How is your home mostly heated and powered?** | Mostly electric with a cleaner power plan or low-carbon setup; Mostly electric; Mix of electricity and gas; Mostly gas or oil heating; I’m not sure | Captures the energy source signal consumers can usually answer from memory | Direct |
| Everyday travel | **In a typical week, how do you mostly get around?** | Mostly walk, bike, or transit; Mix of transit and occasional car use; Mostly drive a smaller car, hybrid, or EV; Mostly drive a regular gas car; Multiple cars or long daily drives | Turns “transport” into a concrete weekly behavior | Direct |
| Flying | **About how much flying do you do in a year?** | Rarely or never; 1–2 shorter trips; About 1 long-haul trip or 3–4 shorter trips; 2+ long-haul trips or 5–8 shorter trips; Very frequent flyer | Keeps flights separate because they are unusually high variance | Direct |
| How you usually eat | **Which option best matches how you usually eat?** | Vegan; Vegetarian; Mostly plant-forward with occasional meat; Mixed diet with meat a few times a week; Meat with most meals | High-signal diet proxy with familiar language | Direct |
| Food that goes uneaten | **How much food from your home usually goes uneaten?** | Very little; Some leftovers now and then; About average; Quite a bit most weeks; I’m not sure | Keeps the food waste signal while reducing guilt in the wording | Direct |
| New clothes and shoes | **How often do you buy new clothes or shoes?** | Rarely, mostly keep, repair, or buy secondhand; Small refresh a few times a year; New items most months; Frequent refreshes or trend-led shopping | Retains an easy material and water signal for apparel | Direct |
| Other new stuff | **How often do you buy new things for yourself or your home, like electronics, décor, furniture, hobby gear, or replacement items?** | Rarely; A few times a year; Every month or two; Most months; Large or frequent purchases year-round | Replaces vague “shopping” with a bounded goods question | Direct |

This new set answers the “keep, split, merge, remove” question clearly. **Keep** region, household size, diet, flights, and food waste. **Split** home into home type/size and home energy setup. **Rewrite** transport as weekly travel behavior. **Keep but sharpen** clothing. **Keep but narrow** shopping into non-clothing stuff. What drops out is not a topic but an ambiguity: you no longer ask consumers to interpret “shopping” and “transport” for themselves. That is a major gain in confidence and perceived fairness. citeturn6view0turn6view1

For future refinement, I would not add more required questions yet. The best **optional** fields later are car type, renewable electricity enrollment, home insulation/age, secondhand share of purchases, and major appliance replacement rate. Those can improve accuracy, but they should only appear as advanced refinements after the core 10-question experience is stable.

## Recommended Metric Model

The current four dimensions are close, but not quite right for a consumer product. I recommend keeping **carbon, water, and materials**, but replacing **land pressure** with **nature pressure** in the user-facing layer. Internally, nature pressure can still be calculated from land-use and habitat-related life-cycle burdens, especially in food and fiber categories. The reason for the change is practical: “land pressure” sounds technical and narrow, while “nature pressure” better communicates what users intuitively care about, such as habitat demand, agricultural land burden, and ecosystem stress. The JRC framework is useful here because it already evaluates multiple environmental impact categories and then aggregates them, rather than asking consumers to interpret a single raw land metric on its own. citeturn11view1turn2view4

I would also change the product architecture so the experience distinguishes between **what you do** and **what it affects**. Consumers think in lifestyle categories, not in life-cycle assessment categories. So the app should use **Home, Travel, Food, and Stuff** as the main explanatory buckets, while the model underneath calculates **Carbon, Nature, Water, and Materials**. This separation is one of the clearest ways to preserve simplicity while making the logic more explainable. It also matches how major tools and research frameworks organize personal and household impacts. citeturn11view0turn11view1turn1view0turn1view3

Here is the recommended metric stack:

| Layer | Recommendation | Why |
|---|---|---|
| Underlying dimensions | Carbon, Nature, Water, Materials | Preserves multi-impact logic without overloading users |
| Primary user-facing metrics | Overall Footprint Score, Annual Carbon Estimate, Top Drivers by Home/Travel/Food/Stuff, Estimate Confidence | Best balance of clarity and credibility |
| Secondary user-facing metrics | Nature pressure, Water pressure, Material pressure as indexes or bands | Useful for exploration, but less intuitive than carbon |
| Internal-only metrics | Raw land-use values, scarcity-weighted water values, material intensity factors, region multipliers, household scaling factors, resource composite | Necessary for defensibility, but too technical for headline display |

The product should continue showing **annual carbon burden in tCO2e/year**, because carbon is the dimension the public most readily recognizes and many consumer calculators already express results that way. But I would **not** show raw absolute units for water, land, or materials unless the model is dramatically more granular than the current proxy setup. Those categories should be displayed as **pressure indexes** or **Low / Medium / High** bands, because life-cycle estimates for those dimensions involve more uncertainty, depend on trade and supply chains, and vary in methodological robustness. The JRC explicitly reports different robustness levels across impact categories and cautions against treating resource-use indicators alone as complete proxies for environmental impact. citeturn12view0turn1view3turn2view3turn2view4

On **resource pressure**, my recommendation is simple: **keep it only if you need it internally or as a secondary summary, not as a main user-facing headline.** The current approach of building resource pressure from roughly equal shares of land, water, and material is easy to compute, but it is hard to explain. Those burdens are not interchangeable, and equal-ish weights create a false impression of scientific precision. The JRC’s warning about resource footprints as stand-alone proxies is the strongest reason to stop using resource pressure as the main bridge between the four dimensions and the final score. citeturn2view3

## Recommended Scoring Model

The final score should **not** remain a 50/50 blend of carbon and resource pressure. That architecture creates two layers of opacity. First, it hides the relative influence of nature, water, and materials inside a composite. Second, it gives carbon an awkward relationship to the rest of the score, because many consumer actions affect both carbon and non-carbon dimensions at the same time. A more defensible system scores the four core dimensions directly, then combines them with explicit weights. citeturn2view3turn11view1

The model should work in three steps. First, each answer maps to an **annual proxy burden vector** across the four impact dimensions. Second, region and household size adjust only the categories they should realistically affect. Third, each dimension is normalized against a **region-adjusted benchmark range**, not an arbitrary modeled maximum.

A defensible version looks like this:

\[
B_d = \sum_i \left(v_{i,a_i,d} \times M_{region,i,d} \times M_{household,i,d}\right)
\]

Where:

- \(B_d\) is the annual burden for dimension \(d\)
- \(v_{i,a_i,d}\) is the burden contribution of answer \(a_i\) to question \(i\)
- \(M_{region,i,d}\) is the region adjustment for that question and dimension
- \(M_{household,i,d}\) is the household-size adjustment where relevant

Then normalize each dimension with three anchors for that region:

- \(L_d\): practical low-impact reference
- \(A_d\): region-adjusted average reference
- \(H_d\): high-impact but realistic reference

Use a log-shaped mapping so heavy-tailed activities like flights do not distort the range:

\[
P_d =
\begin{cases}
50 \times \frac{\ln(B_d/L_d)}{\ln(A_d/L_d)} & \text{if } B_d \le A_d \\
50 + 50 \times \frac{\ln(B_d/A_d)}{\ln(H_d/A_d)} & \text{if } B_d > A_d
\end{cases}
\]

Then clamp \(P_d\) to 0–100 and convert to a positive score:

\[
S_d = 100 - P_d
\]

This makes the interpretation intuitive:

- a score around **50** means “about average for similar households in your region”
- a score above **50** means “lower impact than average”
- a score below **50** means “higher impact than average”

That benchmark logic is more defensible than a modeled maximum because it compares the user to realistic profiles rather than to a theoretical worst case. It also mirrors how other consumer tools use national or regional averages as a reference point. Global Footprint Network’s calculator explicitly starts from national average profiles and adjusts them up or down from user answers; the JRC calculator compares users to the average EU citizen and to planetary-boundary framing; and CoolClimate uses location and household size to populate comparisons and defaults. citeturn11view2turn11view1turn1view1

For the final weighting, I recommend:

\[
\text{Overall Score} = 100 - (0.45P_{carbon} + 0.25P_{nature} + 0.15P_{water} + 0.15P_{materials})
\]

That is the weighting I would ship first. The logic is straightforward. **Carbon** gets the largest weight because it is the most mature, most legible, and already expected by consumers. **Nature** comes next because food and land-linked ecosystem pressures are large and are not captured well enough by carbon alone. **Water** and **materials** remain meaningful but should be somewhat lighter because they are more sensitive to proxy quality and supply-chain assumptions. Food and housing are recurrent high-impact areas in the JRC work; buildings remain a major energy domain; and textiles and goods clearly matter but are not usually the top household driver by themselves. citeturn1view3turn7view1turn7view2turn7view3

If you still want a **resource pressure** number for continuity, compute it as a secondary metric rather than as the main bridge to the final score:

\[
\text{Resource Pressure} = 0.40P_{nature} + 0.30P_{water} + 0.30P_{materials}
\]

That weighting is better than the current one because it reflects the outsized role that land-and-ecosystem demand often plays in non-carbon household impacts, especially in food. But again, I would not use this composite to drive the headline score. citeturn1view3turn2view4

One more change is essential: do not silently fill blank answers with hidden baselines. Instead:

- if the user chooses **“I’m not sure,”** use a contextual median
- attach a lower certainty weight to that answer
- show an **Estimate Confidence** level in the UI

That preserves score continuity without pretending the estimate is more precise than it is. citeturn6view0

## Consumer Interpretation Layer

The score should be explained in one sentence, not in methodological terms. The cleanest interpretation is:

**“Your Footprint Score shows how your lifestyle compares with similar households in your region. Higher means lighter overall impact.”**

That wording does three things at once. It avoids pretending to measure a person’s total life impact with scientific exactness. It signals that the score is comparative, not absolute. And it makes the direction intuitive. Using an average-based comparison is consistent with how major consumer footprint tools frame results and comparisons. citeturn11view2turn12view0turn1view1

The sticky top summary should show only the most decision-useful information. I recommend:

| Sticky summary element | Recommendation |
|---|---|
| Main number | **Footprint Score: 0–100** |
| Short label | **Lower than average / Around average / Higher than average** |
| Carbon line | **Estimated carbon: X.X tCO2e/year** |
| Biggest drivers | **Top 2 or 3 drivers from Home, Travel, Food, Stuff** |
| Confidence | **High / Medium / Low estimate confidence** |

A sample could read:

**72**  
**Lower than average for similar households in your region**  
**Estimated carbon: 6.8 tCO2e/year**  
**Biggest drivers: driving, home heating**  
**Confidence: high**

That gives consumers something they can understand instantly: where they stand, what matters most, and how much trust to place in the estimate.

The category metrics should use plain-language summaries:

- **Carbon**: climate impact from energy, travel, food, and things you buy
- **Nature**: land and habitat demand linked to food and materials
- **Water**: freshwater demand behind your lifestyle
- **Materials**: amount of raw stuff needed to make and replace what you use

For non-carbon categories, the UI should lean on relative phrasing like **Low / Moderate / High** or indexed bars, not pseudo-precise units. That better matches the uncertainty profile of proxy-based life-cycle estimates. citeturn2view3turn2view4

When answers change, the user should always see three things: **what changed, which metric moved, and why**. The best pattern is not a generic animation but a small, explicit delta explanation. Examples:

- **Score +4** because **you changed flights from frequent to occasional**
- **Carbon down 0.9 t/year** mostly from **less flying**
- **Nature pressure down** because **your diet answer shifted toward more plant-forward meals**
- **Material pressure up** because **you moved from occasional to frequent new purchases**

Only the affected cards should animate. The explanation should use the user’s own answer language, not model language. That preserves cause and effect.

One more recommendation matters a lot for trust: avoid moralized language. Use **neutral state descriptions**, not virtue signaling. “Very little goes uneaten” is better than “I don’t waste food.” “Mostly plant-forward with occasional meat” is better than “low meat.” “Choose the closest fit” is better than implying exact precision. Consumer confidence rises when the product does not sound like it is trying to judge them. Survey design guidance and cognitive interviewing practice support exactly this focus on comprehension, judgment confidence, and respondent-centered language. citeturn6view0turn6view1

## Implementation Guidance

The data model should separate **question design**, **burden logic**, **normalization**, and **explanation output**. A clean structure would look like this:

```json
{
  "question_id": "everyday_travel",
  "title": "Everyday travel",
  "prompt": "In a typical week, how do you mostly get around?",
  "role": "direct",
  "module": "travel",
  "allows_unsure": true,
  "options": [
    {
      "option_id": "walk_bike_transit",
      "label": "Mostly walk, bike, or transit",
      "proxy": {
        "carbon": 0.8,
        "nature": 0.2,
        "water": 0.05,
        "materials": 0.2
      },
      "explanation_tags": ["less driving", "shared transport"],
      "certainty_default": 1.0
    }
  ]
}
```

Then maintain separate benchmark objects:

```json
{
  "region": "US_Northeast",
  "dimension": "carbon",
  "anchors": {
    "low": 3.5,
    "average": 8.2,
    "high": 22.0
  },
  "version": "2026.1"
}
```

And separate context modifiers:

```json
{
  "question_id": "people_in_home",
  "applies_to": ["home", "stuff_shared"],
  "scaling_curve": {
    "1": 1.00,
    "2": 0.67,
    "3": 0.52,
    "4": 0.44,
    "5_plus": 0.38
  }
}
```

The scoring architecture should be modular:

| Layer | What it does |
|---|---|
| Answer capture | Stores selected option and certainty |
| Context adjustment | Applies region and household-size modifiers only where appropriate |
| Burden aggregation | Builds annual Carbon, Nature, Water, and Materials burdens |
| Normalization | Maps burdens to 0–100 pressure scores using regional anchors |
| Final scoring | Produces dimension scores, overall score, and optional resource pressure |
| Explanation engine | Generates “what changed and why” copy from answer deltas |
| Confidence layer | Tracks how much of the estimate uses explicit vs median answers |

For long-term transparency and consistency, three product rules matter most.

First, **version the model**. Every answer set should store the methodology version, benchmark version, and region profile version used to calculate the score. That prevents silent score drift when proxies are updated.

Second, **publish a short methodology note inside the product**. It does not need to be academic. A strong version would say that the estimate is based on 10 lifestyle questions, region-adjusted reference data, and life-cycle proxies for carbon, water, materials, and nature impacts, and that non-carbon metrics are shown as pressure indexes rather than precise physical quantities.

Third, **test the questionnaire with cognitive interviews before shipping**. CDC notes that cognitive interviewing is used to understand how people interpret and answer survey questions, including recall, judgment, and answer choice selection, and that these studies are often done with small purposive samples. The UK Government questionnaire guidance similarly recommends qualitative testing, burden reduction, and respondent-centered design. For Tulip, that means testing with 20 to 30 people who vary by age, home type, diet, and travel pattern before release, then revising the wording based on where people hesitate or say “I’m not sure.” citeturn6view0turn6view1

If I were making the product decision today, I would ship this redesign with the following principles locked in:

- keep the experience at **10 questions**
- center the story on **Home, Travel, Food, and Stuff**
- compute **Carbon, Nature, Water, and Materials** underneath
- score against **regional average and realistic benchmarks**, not a theoretical maximum
- make **confidence visible**
- make **every score change explainable in plain language**

That would make the Imprint tab feel much more like a trusted consumer product and much less like an internal proxy model that happens to be exposed to end users.