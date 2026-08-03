# Deep Research Prompt: Re-evaluate Imprint Questions, Logic, Scoring, and Metrics

## Objective

Audit and redesign the `Imprint` tab questionnaire and scoring model for LostPlanet so it becomes a consumer-friendly, confidence-inspiring personal footprint experience with 10 questions.

The redesign should preserve product simplicity while making the logic more explainable, more defensible, and more useful for consumers.

## Current Product Context

The current Imprint tab is a lightweight lifestyle footprint calculator. It estimates:

- annual carbon burden (`tCO2e/yr`)
- land pressure
- water pressure
- material pressure
- resource pressure
- an overall score from 0-100

It currently uses 9 questions:

1. region profile
2. diet
3. transport
4. flights
5. home energy
6. household size
7. clothing
8. shopping
9. food waste

Two questions act mainly as context modifiers:

- region profile
- household size

The rest contribute direct proxy values for:

- carbon
- land
- water
- material

## Current Scoring Logic

The current implementation:

- assigns fixed proxy values per answer
- uses region and household multipliers for some categories
- fills unanswered questions with baseline defaults to keep the score anchored
- computes normalized 0-100 indexes by comparing totals to a modeled maximum profile
- derives `resource pressure` from:
  - 34% land
  - 33% water
  - 33% material
- derives `overall score` from:
  - 50% carbon
  - 50% resource pressure

## Research Goals

Please deeply re-evaluate:

1. the question set
2. the wording of each question
3. the answer options
4. the scoring methodology
5. the weighting logic
6. the metrics shown to users
7. the definition of the final score

## Critical Requirements

The redesigned questionnaire must:

- expand to 10 questions
- be consumer friendly
- be easy for non-experts to answer with confidence
- avoid technical or abstract language where possible
- minimize overlap and double counting
- balance speed with meaningful signal
- preserve a strong, understandable relationship between answers and visible score changes

## Key Questions To Answer

### Questionnaire Design

1. Which 10 questions are the strongest predictors of a consumer household footprint in a lightweight product experience?
2. Which current questions should stay, be split, be merged, or be removed?
3. Which questions are currently too abstract or hard for users to answer confidently?
4. Which lifestyle categories are missing?
5. Which questions should be framed as:
   - direct contributors
   - context modifiers
   - optional future refinements

### Consumer Language

6. Rewrite the questions so they sound natural, plain-language, and confidence-friendly.
7. Rewrite answer choices so they feel intuitive and mutually exclusive.
8. Recommend wording that reduces ambiguity, guilt, and confusion.

### Metrics and Logic

9. Should the product continue using:
   - carbon
   - land
   - water
   - material
   as the four core dimensions?
10. If not, what metric framework would be better for a consumer-facing footprint tool?
11. Should `resource pressure` remain an aggregate metric, or should it be replaced or renamed?
12. Should the final score remain a 0-100 score?
13. What should that final score actually represent:
   - relative lifestyle impact
   - benchmark distance
   - percentile-like standing
   - normalized burden score
   - some other construct

### Weighting and Formula

14. Should the final score still be a 50/50 blend of carbon and resource pressure?
15. Should land, water, and material keep equal-ish weights, or should they be rebalanced?
16. Is the current max-profile normalization appropriate, or should the scoring be benchmarked differently?
17. What scoring formula would be most defensible while still feeling intuitive to consumers?

### Product Interpretation

18. How should the product explain what a score means?
19. What should users see in the sticky top summary:
   - only carbon + overall
   - carbon + resource metrics
   - category deltas
   - other outputs
20. How should the product display changes so users understand what went up or down and why?

## Desired Output Format

Please produce the research output in the following structure:

### 1. Executive Summary

- brief assessment of the current model
- key flaws
- high-level redesign recommendation

### 2. Audit of Current 9-Question Model

- strengths
- weaknesses
- overlap risks
- user-confidence risks
- scoring risks

### 3. Recommended 10-Question Questionnaire

For each question provide:

- question title
- plain-language wording
- answer options
- why it belongs
- whether it is direct or contextual

### 4. Recommended Metric Model

- which underlying dimensions to use
- which user-facing metrics to show
- which metrics should remain internal only

### 5. Recommended Scoring Model

Provide:

- the proposed formula
- weighting logic
- normalization approach
- rationale

### 6. Consumer Interpretation Layer

Recommend:

- how the score should be explained
- how category metrics should be explained
- how changes should be signaled in the UI

### 7. Implementation Guidance

Provide:

- suggested data structure for the 10 questions
- suggested scoring architecture
- guidance for maintaining transparency and consistency over time

## Constraints

Please optimize for:

- consumer comprehension
- answer confidence
- product clarity
- low friction
- visible cause-and-effect between answers and scores
- future extensibility

Please avoid solutions that require:

- precise utility bills
- precise mileage logs
- highly technical knowledge
- long-form survey effort
- data consumers typically do not know from memory

## Evaluation Standard

The redesigned system should feel like:

- a trusted consumer product
- not an internal proxy model exposed to end users

It should help users answer quickly and feel:

- “I understand this”
- “I know how to answer this”
- “I understand why my score changed”
- “This seems fair and believable”
