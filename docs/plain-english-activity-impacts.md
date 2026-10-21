# Plain-English Activity Impacts

Implemented locally on 22 September 2026. Scope: all 16 published Activity categories, 95 comparison rows and 144 Personal/Community/Policy actions. Category definitions, scale explanations, takeaways, action confidence, progress measures and desktop outcome explanations also use authored reader copy.

## Shared content and future additions

`src/reader-copy/activities.json` is the reader-copy authority. Records use the existing category, lens and action IDs. Comparison rows now have explicit stable IDs in `src/phenomenon-lens.js`; do not derive these IDs from rewritten labels or change them when copy changes.

`src/activity-reader-copy.js` overlays only reader fields. The same selectors/lens/action getters feed desktop web, the React mobile snapshot and the native iOS snapshot. Scientific source records remain intact. The native exporter retains its existing repair of one moved coffee-portion source URL.

New categories must declare matching authored lens and action copy. Missing/renamed comparison IDs, missing prose and action-count changes fail instead of supplying generic text. Update the scientific fixture only as part of an intentional, source-reviewed data change; it is not an automatically refreshed snapshot.

To update content:

1. Edit the authored reader record, preserving qualifiers, geography, dates and what a value counts.
2. Run the mobile snapshot generator and native exporter.
3. Run `npm run test:activity-reader-copy`, `node scripts/audit-activity-reader-copy.mjs`, the full test suite and relevant builds.
4. Review flagged text and inspect its rendered screens. Readability formulas are editorial prompts, not proof of a reading age.

## Presentation

Desktop comparison notes are readable paragraphs rather than hover-only tooltips. Existing mobile omissions of secondary metadata panels remain in place. Important qualifications are included in row notes, including the illustrative AI percentages and provisional farming/refrigerant figures.

Native iOS units and labels wrap in separate columns. The 2030 data-centre projection appears as a text row, with its bar hidden and its value excluded from the regional chart scale. At accessibility text sizes, Impact/Actions controls use their full labels and intrinsic height.

The original source value for the 2030 projection remains 945 TWh. Desktop formerly displayed an automatically invented ±15% range, while mobile displayed 945 and native omitted the row. Desktop now displays the same source value, identified in the note as a projection. No scientific value, axis setting, score, score band, footprint calculation, source URL or source metadata was recalibrated.

## Editorial and scientific review

All 16 category records were reviewed against the previous copy, including all 95 row notes and 144 actions. Technical shorthand such as enteric fermentation, LDAR, MRV, EPR and GWP is replaced with explanations of the actual process. Plastic abbreviations retain their recognised chart labels, with names and concrete product examples in the notes.

The audit reviewed 501 prose fields and flagged 167 for further editorial attention after revisions; none exceeds its 32-word sentence prompt. These are not publication failures or a claim that every reader aged 13 will understand every sentence. Short scientific labels inflate the formula. No testing with teenage readers has been performed.

Existing numerical limitations remain and were made explicit:

- Farming: the stored values do not yet form a verified source breakdown for the named rows. For example, [FAO’s 2019 accounting](https://www.fao.org/newsroom/detail/supply-chain-is-growing-source-of-agri-food-GHG-emissions/en) reports 7.2 billion tonnes within the farm gate, 3.5 from land-use change and 5.8 from supply-chain processes. That does not establish the app’s 9.4-billion-tonne cattle-only row. The copy calls it a working estimate rather than a measured cattle total; the number is unchanged pending a separate data review.
- Food waste: the existing allocation uses [UNEP’s waste-mass shares](https://www.unep.org/resources/publication/food-waste-index-report-2024) to divide a working disposal-emissions total. Equal emissions per unit of waste is an assumption, not a measured sector breakdown. The notes now say so.
- Carbon and AI percentages are tracked or illustrative comparisons, not verified global emissions inventories. AI combines different, overlapping resource pressures.
- Fertilizer includes an overall total plus two parts; adding all three would double-count. Transport mixes road CO2e estimates with direct aviation CO2 and excludes aviation’s other warming effects.
- Refrigerant totals remain weakly supported working estimates. Clear copy does not validate them.
- Mining compares refining shares, forest conversion is cumulative for 2001–2022, and data centres compare 2024 electricity use with a separate 2030 projection. None should be described as a common danger scale.

Everyday plastic examples were checked against [British Plastics Federation material guidance](https://www.bpf.co.uk/Sustainability/Plastics_Recycling.aspx?trk=public_post_comment-text) and its [building-product examples](https://www.bpf.co.uk/innovation/Construction.aspx). These examples do not change the emissions estimates.

## Validation

- Full `npm test`: passed, including current score/response exclusions and mobile data parity.
- `test:activity-reader-copy`: all 16 categories, 95 comparisons and 144 actions; exact source/method/value/unit/portion/projection preservation against the pre-edit fixture. Complete reader-text parity across web, React mobile and native snapshots.
- Desktop web and React mobile: exercised Impact and Actions in all 16 categories. All 95 notes and all nine actions per category present. No clipped note paragraphs; mobile labels and values do not overlap.
- Web and mobile production builds, protected mobile runtime check, native Debug simulator build: passed. Existing bundle-size warnings remain.
- iPhone 17e: reviewed long copy, vertical scrolling into Policy, category change after scrolling, and Impact/Actions at normal and accessibility-extra-large text sizes. Restored normal text size after inspection.
- iPhone 18 Pro Max: built and inspected the longer descriptions at normal text size. iPhone 17e: confirmed the 2030 projection and complete explanatory note are reachable above the dock.
- The TULIP assessment block remains absent. These changes are local previews, not a production release.

The pre-existing native design-system audit findings documented with the inspector update remain outside this copy update. No claim is made that the full native release audit is clean.
