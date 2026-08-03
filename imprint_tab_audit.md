# Imprint Tab Audit

## Scope

This audit documents the current `Imprint` tab implementation in LostPlanet, with focus on:

- product context and current UI surface
- question inventory and answer structure
- scoring logic and weighting model
- metrics shown to users
- strengths, weaknesses, and research gaps
- expansion path toward a 10-question consumer-friendly questionnaire

Primary implementation source: `src/main.js`, with UI structure in `index.html` and visual treatment in `src/style.css`.

## Current Product Context

The `Imprint` tab is positioned as a personal lifestyle footprint calculator adjacent to the `Footprint` tab. It currently presents:

- a sticky top summary area
- a live metric strip
- a scrollable list of multiple-choice questions
- a category breakdown section
- a biggest-drivers section
- a short explanation of how scoring works

The intent is to give users a quick estimate of annual carbon and resource pressure based on broad lifestyle proxies rather than high-precision measurement.

## Current Question Set

The current implementation has 9 questions total:

1. `region_profile`
2. `diet`
3. `transport`
4. `flights`
5. `home_energy`
6. `household_size`
7. `clothing`
8. `shopping`
9. `food_waste`

### Question Roles

Two questions act as context multipliers rather than direct footprint sources:

- `region_profile`
- `household_size`

The remaining 7 questions contribute direct proxy values for:

- `co2`
- `land`
- `water`
- `material`

## Current Question Inventory

### 1. Regional Baseline

Purpose:
Adjust home-energy, transport, and flight assumptions by geography.

Options:

- Lower Carbon Grid
- Average OECD
- High Carbon / Extreme Climate

Mechanics:

- applies `homeEnergyMultiplier`
- applies `transportMultiplier`
- applies `flightsMultiplier`

### 2. Diet

Purpose:
Estimate food-related climate and resource load.

Options:

- Vegan
- Vegetarian
- Pescatarian
- Mixed
- Meat Heavy

### 3. Transport

Purpose:
Estimate everyday personal mobility burden.

Options:

- Walk / Transit
- Mixed
- Small Car
- Car Dependent
- Large Vehicle

### 4. Flights

Purpose:
Estimate aviation burden.

Options:

- Rarely
- 1-2 Trips
- Several Trips
- Frequent Flyer

### 5. Home Energy

Purpose:
Estimate home energy use from size, HVAC demand, and appliance intensity.

Options:

- Efficient
- Average
- High
- Very High

### 6. Household Size

Purpose:
Adjust per-person home-energy share.

Options:

- 1 Person
- 2 People
- 3-4 People
- 5+ People

Mechanics:

- applies `homeMultiplier`
- does not directly add `co2`, `land`, `water`, or `material`

### 7. Clothing

Purpose:
Estimate fashion and apparel consumption burden.

Options:

- Minimal
- Average
- Frequent
- Heavy

### 8. Shopping

Purpose:
Estimate goods, deliveries, and general household consumption.

Options:

- Low
- Average
- Frequent
- Heavy

### 9. Food Waste

Purpose:
Estimate household food-disposal burden.

Options:

- Very Low
- Some
- Regular
- High

## Current Scoring Model

## Inputs

Each direct-behavior answer may contribute four proxy dimensions:

- `co2`
- `land`
- `water`
- `material`

Two context answers modify those values:

- `region_profile`
- `household_size`

## Baseline-Fill Behavior

Unanswered questions do not remain empty in the scoring model once the user starts answering.

Instead, the implementation fills unanswered questions with a baseline profile:

- `region_profile`: `average_oecd`
- `diet`: `mixed`
- `transport`: `mixed`
- `flights`: `annual`
- `home_energy`: `average`
- `household_size`: `two`
- `clothing`: `average`
- `shopping`: `average`
- `food_waste`: `some`

This was introduced to keep the score anchored instead of shifting because the denominator changes as more questions are answered.

## Direct Calculation Flow

For each non-context question:

1. Resolve the current answer.
2. Resolve a fallback baseline answer if the user has not chosen one.
3. Apply the relevant multiplier:
   - `home_energy` uses `household_size * region_profile.homeEnergyMultiplier`
   - `transport` uses `region_profile.transportMultiplier`
   - `flights` uses `region_profile.flightsMultiplier`
   - all other categories use `1`
4. Accumulate:
   - total `co2`
   - total `land`
   - total `water`
   - total `material`
5. Compute normalized indexes against a modeled maximum profile.

## Normalized Metrics

The system derives:

- `carbonTotal` in `tCO2e/yr`
- `carbonIndex` from 0-100
- `landIndex` from 0-100
- `waterIndex` from 0-100
- `materialIndex` from 0-100
- `resourcePressure` from 0-100
- `overallScore` from 0-100

## Weighting

Current resource-pressure weights:

- Land: `34%`
- Water: `33%`
- Material: `33%`

Current overall-score weights:

- Carbon: `50%`
- Resource pressure: `50%`

Current driver-ranking weights:

- Carbon: `40%`
- Land: `20%`
- Water: `20%`
- Material: `20%`

## Current User-Facing Metrics

The top sticky metric strip currently shows:

- Carbon
- Resource Pressure
- Land
- Water
- Material

The lower sections show:

- category-level breakdown with `tCO2e/yr`, land, water, and material
- top 3 drivers
- trend arrows showing whether a recent choice increased or decreased the visible metric relative to the previous state

## What The Current Model Does Well

- It is fast and lightweight.
- The question set is short enough for casual completion.
- It covers several major lifestyle categories:
  - diet
  - mobility
  - home energy
  - shopping
  - clothing
  - food waste
- It exposes both carbon and non-carbon resource dimensions.
- The anchored-baseline logic avoids a visibly unstable score while the questionnaire is still incomplete.

## Main Audit Findings

### 1. The question set is still more proxy-like than consumer-natural

Many current questions are understandable, but several still feel model-shaped rather than user-shaped:

- `What best matches your regional baseline?`
- `What best matches your home energy use?`
- `How much new stuff do you buy?`

These require interpretation, self-estimation, or abstract framing that many users may answer with low confidence.

### 2. Region is doing heavy hidden work

`region_profile` affects multiple downstream categories through multipliers, but the user only sees a coarse label. That makes the score feel partly opaque.

### 3. Some categories overlap conceptually

There is partial overlap across:

- `shopping`
- `clothing`
- `home_energy`
- `household_size`

This is not necessarily wrong, but it increases the chance of double-counting perceived lifestyle intensity in ways users may not intuitively understand.

### 4. The 50/50 overall-score split is product-simple, not research-justified

The current model treats:

- carbon burden
- non-carbon resource burden

as equally important in the final score by design simplicity. That may or may not be the right consumer product choice after deeper review.

### 5. The normalized maximum-profile approach is internally convenient but not externally explainable

The index values are derived from the user profile relative to a modeled maximum possible answer set. This is useful for bounded scoring, but it can be difficult to explain clearly to users:

- what a `63/100` resource pressure score really means
- whether `60/100` is good, average, or high
- whether scores are population-relative, absolute, or system-relative

### 6. Trend arrows improve responsiveness but not interpretability

The up/down indicators make the UI feel live, but they do not solve the deeper problem of whether users understand why a change mattered.

### 7. The current question count is still a bit too small for nuanced consumer segmentation

Nine total questions, with two serving mostly as context, means the scoring model relies heavily on a small number of broad assumptions.

## Consumer-Friendliness Audit

For a consumer-facing experience, questions should feel:

- concrete
- non-technical
- answerable from memory
- low-anxiety
- mutually exclusive
- comparable across households

The current questionnaire partially satisfies those goals, but several questions should be rewritten into more everyday language.

### Examples of Consumer-Friendlier Framing

Current:

- `What best matches your regional baseline?`

Better direction:

- `Which of these best describes where you live?`
- `Which option feels closest to your area’s energy and transportation setup?`

Current:

- `What best matches your home energy use?`

Better direction:

- `Which best describes your home and how much heating or cooling it usually needs?`

Current:

- `How much new stuff do you buy?`

Better direction:

- `How often do you buy new household items, gadgets, or online orders?`

## Expansion Opportunity: Move To 10 Questions

A 10-question model would give the product more nuance without becoming overwhelming.

Strong candidate directions for expansion:

1. Add one missing high-signal consumer question.
2. Split one vague composite category into two clearer questions.
3. Replace one abstract contextual input with a more legible consumer prompt.

### Candidate New Question Areas

- commuting distance or weekly driving intensity
- home size / dwelling type
- heating fuel or electricity mix
- food origin / convenience intensity
- package delivery frequency
- laundry / clothing replacement cycle
- appliance intensity / AC usage

## Recommended Research Questions

The deep research should determine:

1. Which 10 consumer-friendly questions best explain household footprint differences without overwhelming the user?
2. Which questions should act as direct contributors versus contextual modifiers?
3. Which current questions are too abstract, overlapping, or weakly predictive?
4. Whether carbon and resource pressure should stay in a 50/50 blend.
5. Whether land/water/material should remain 34/33/33 or be recalibrated.
6. Whether score normalization should be:
   - max-profile relative
   - benchmark relative
   - percentile-based
   - category-threshold based
7. How to make the final score more interpretable to a consumer.

## Proposed Deliverables For The Research Pass

The next research phase should ideally produce:

- a revised 10-question questionnaire
- consumer-friendly wording for each question and answer
- rationale for every included metric
- direct-vs-context question classification
- a revised weighting framework
- a revised final-score formula
- guidance on what should appear in the sticky top metrics
- guidance on what score ranges mean in plain language

## Bottom Line

The current Imprint tab is a strong prototype:

- good as a reactive, broad lifestyle estimator
- not yet strong enough as a deeply defensible consumer scoring product

The main gaps are not just visual or content gaps. They are model-design gaps:

- question framing
- metric transparency
- weighting justification
- score interpretability
- overlap control

The next step should be a deep research pass that redesigns the questionnaire and scoring model together, not independently.
