# TULIP relationship-explanation content audit

Date: 2026-08-12

## Scope

This audit covers all 1,290 relationship descriptions in `public/relationship-descriptions.json`, the mobile snapshot generated from those descriptions, and the relationship-answer card in the Analyse inspector.

The user goal is simple: after selecting a relationship, understand what causes what and why without needing scientific or inventory expertise.

## Evidence

1. User-provided iPhone capture: `Industry Farming -> Nitrous Oxide`.
2. Current local Analyse flow capture: `/tmp/tulip-relationship-audit-2026-08-12-accepted.png`.
3. Source-data inspection of all 1,290 published relationship descriptions.
4. Inspection of `scripts/audit-relationship-descriptions.mjs` and the mobile snapshot generator.

## Initial verdict

The relationship feature works structurally, but its copy quality is inconsistent. Some answers are clear and conversational. Others expose technical evidence language, inventory notation, uncertainty ranges, caveats, and duplicated clauses in the primary explanation. The current validation gate cannot detect these failures.

## Implemented outcome

- All 1,290 relationships now expose four distinct layers: `plain_language`, `technical_detail`, `confidence`, and `sources`.
- The four layers are derived from the already-reviewed desktop evidence records, so the app does not maintain a second set of scientific claims.
- The visible desktop and mobile relationship cards use `plain_language`; technical detail, confidence, and citations are collapsed disclosures.
- Repeated emissions-inventory templates, unexplained scientific notation, dense climate-index shorthand, and malformed replacement phrases are now covered by automated validation.
- The supplied `Industry Farming -> Nitrous Oxide` relationship now uses the primary and technical versions shown below.
- Desktop build, mobile build, the complete root test suite, all 19 mobile interaction tests, data parity, relationship semantics, and the native iOS build pass.

## Dataset findings

- 1,290 of 1,290 relationships have a description.
- Median length: 31 words.
- 90th percentile: 49 words.
- 297 descriptions (23%) exceed 40 words.
- 10 descriptions exceed 60 words.
- 265 descriptions (21%) contain at least one term from a focused scientific-jargon list.
- 155 descriptions contain acronyms or capitalized technical notation.
- 183 descriptions use semicolons, often to attach a source caveat or measurement detail to the answer.
- 19 two-sentence descriptions substantially repeat the same idea.
- The supplied `Industry Farming -> Nitrous Oxide` answer is the most jargon-dense relationship in the dataset under this audit's focused vocabulary.

These numbers are directional, not a formal reading-level assessment. A short answer can still be unclear, and a longer answer can be understandable when well structured.

## Highest-impact problems

### 1. The primary answer mixes explanation and evidence notes

The visible card currently tries to perform four jobs at once:

- explain the relationship;
- state the scientific mechanism;
- disclose the quantitative evidence;
- preserve methodological caveats.

On a phone, the first job should come first. Quantitative evidence, uncertainty, and methodology should move into a separate expandable detail layer.

### 2. Technical terms appear without translation

Examples include `anthropogenic`, `N2O-N`, `nitrification`, `denitrification`, `radiative forcing`, `EF1`, and `Tier 1`. These terms can remain in technical detail, but the main answer must explain them in ordinary language.

### 3. Several answers begin with lists instead of a causal explanation

The supplied answer starts with four farming practices, then introduces several mechanisms and an emissions factor. A user must reconstruct the causal chain themselves.

### 4. Caveats sometimes obscure the answer

Qualifiers about geography, accounting boundaries, confidence, time horizons, and source conditions are important, but stacking them into the main sentence makes the answer feel evasive or incomprehensible.

### 5. Some two-sentence answers repeat rather than deepen

Examples such as `Steel -> Carbon Emission` and `Telecom Backbone -> Carbon Emission` restate nearly the same mechanism twice. The second sentence should add a consequence, condition, or useful qualification.

### 6. Non-causal context needs a different presentation

Relationships that only share evidence context should never use the same causal question pattern as direct or indirect effects. They need an explicit label such as `Why are these topics shown together?` and a short statement that one is not being claimed to cause the other.

### 7. The current automated audit checks structure, not comprehension

`scripts/audit-relationship-descriptions.mjs` verifies presence, minimum length, sentence count, duplication, and a small set of prohibited maintenance phrases. It has no limits or flags for:

- plain-language readability;
- unexplained acronyms;
- jargon density;
- numerical or unit density;
- excessive word count;
- repeated clauses;
- whether the answer clearly expresses cause, mechanism, and effect.

## Recommended content contract

Every relationship should contain separate fields for separate user needs:

1. `plain_language`: one or two sentences, normally 18-35 words.
2. `technical_detail`: methodology, quantities, units, uncertainty, and scientific terminology.
3. `confidence`: level, relationship type, and a short explanation.
4. `sources`: citations with optional section labels and source types.

The visible card should show `plain_language`. Technical detail, confidence, and sources should be progressive disclosure below it.

### Plain-language template

`[Source] changes [mechanism]. This causes or increases [target/effect].`

The wording should not mechanically repeat the node names when a natural pronoun or concrete noun is clearer.

## Example repair

### Current

> Manure management, organic amendments, residue burning, and other nitrogen-intensive farm practices create additional microbial and combustion pathways beyond synthetic field application. Included anthropogenic nitrogen inputs to managed mineral soils increase direct N2O-N emissions through nitrification and denitrification; the IPCC aggregated Tier 1 EF1 is 0.01 kg N2O-N per kg N input with a corrected 0.002-0.018 uncertainty range.

### Primary answer

> Industrial farming can release nitrous oxide when manure and crop residues add nitrogen to soil or are burned. Soil microbes convert some of that nitrogen into this powerful greenhouse gas.

### Technical detail

> The IPCC default estimate is 0.01 kg of N2O-N emitted per kg of nitrogen input, with an uncertainty range of 0.002-0.018.

## Acceptance criteria

- A reader can identify the cause and effect after one read.
- The first visible answer contains no unexplained acronym or specialist notation.
- Numbers, units, uncertainty ranges, and methodological labels are placed in technical detail unless essential to the causal explanation.
- The main answer normally stays below 35 words and never exceeds 45 without editorial review.
- Direct, indirect, conditional, and non-causal-context relationships use distinct question and answer patterns.
- The desktop and app consume the same approved content fields.
- A new content audit flags length, jargon, acronyms, numerical density, repeated clauses, and missing causal structure before snapshots are generated.

## Evidence limits

This audit assesses copy structure, source flow, and visible presentation. It does not independently verify all 1,290 scientific claims or certify a formal reading grade. Scientific review remains necessary when rewriting technical claims.
