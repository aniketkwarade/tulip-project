# Plain-English inspectors — local implementation and review

Implemented September 22, 2026 for 381 published nodes and 1,290 relationships. Existing TULIP urgency values and bands remain in place. Replacement scoring is separate. All 27 response nodes remain excluded from danger scores. The removed TULIP assessment block has not been restored.

## Shared content

`src/reader-copy/` contains the authored definitions, impact/cost/action profiles, measurement explanations and relationship explanations. The web runtime, React mobile preview and native iOS snapshots consume these records. Both PDF exporters consume the same reader text. Canonical scientific profiles, score inputs, measurement contracts, technical relationship evidence and source quotations remain separate.

Every published node has all required reader fields; every published relationship has an explanation. Publication fails for missing records. The test also removes each kind of copy in turn to check that failures are enforced for future additions. Runtime graph records include the short definition immediately; heavier content loads separately. Web PDF export waits for that content before creating the report.

## Editorial review

Definitions were rewritten as explanations rather than name-based templates. All relationship copy was reviewed against the existing technical claims. Impact pathways retain the original supporting graph relationships. Where the record does not establish a separate direct effect on nature, the copy says so. Common costs and actions are deliberately conditional; they do not invent a local bill, probability or benefit estimate.

The review covered the supplied coastal flooding, long-lived gas forcing and day/night heat examples; response nodes; emissions accounting; indirect service dependencies; natural climate patterns; biological effects; and measurement/proxy boundaries. It removed unexplained abbreviations, split long sentences, replaced dense terms with everyday explanations, and retained essential numbers and periods where those form part of the evidence.

Specific corrections included distinguishing Gulf Stream transport from the whole Atlantic circulation, distinguishing association from causation, retaining local limits on flood depth, not treating a single heat threshold as safe for everyone, not treating an air-quality guideline as a harmless/harmful boundary, and not claiming that every microplastic exposure has a known health outcome. Source checks used the existing references and these primary summaries:

- [IPCC ocean, cryosphere and sea-level assessment](https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-9/).
- [IPCC regional climate-impact drivers](https://www.ipcc.ch/report/ar6/wg1/chapter/chapter-12/).
- [IPCC synthesis summary](https://www.ipcc.ch/report/ar6/syr/summary-for-policymakers/).
- [Penn State research on human heat limits](https://www.psu.edu/news/research/story/humans-cant-endure-temperatures-and-humidities-high-previously-thought).
- [WHO air-quality guideline explanation](https://www.who.int/news-room/questions-and-answers/item/who-global-air-quality-guidelines).
- [UNEP microplastics in wastewater](https://www.unep.org/news-and-stories/story/microplastics-wastewater-towards-solutions).

The final heuristic report screens 7,060 prose fields and retains 3,150 flags (approximate grade above 10 or a sentence above 32 words). Repeated shared text counts repeatedly. These are editorial signals, not 3,150 demonstrated comprehension failures. Short passages containing words such as electricity, uncertainty, exposure, and agency names can receive high estimates. High-scoring common passages and definitions received a second simplification pass. Scientific qualifications and technical measurement labels were not removed to force a score. No study with teenage readers has been performed, so this is an editorial assessment rather than a validated reading-age claim.

## Layout and interaction

Titles retain their base size and wrap without line limits, ellipsis or shrink-to-fit. The date follows the whole title. The score stays beside it. Normal-size collapsed sheets measure the header and leave dock clearance. At accessibility sizes, the entire native header scrolls so an extremely long name remains reachable even when taller than the screen; its font still respects Dynamic Type. The collapsed accessibility sheet retains a visible connection overview.

Pill insets sit inside each horizontal scroller. A selected pill turns white with dark text, moves first, and scrolls to the initial alignment. Other pills retain their order. Re-selecting the same pill keeps it selected; choosing the other row replaces it; changing nodes resets both rows. Web focus is preserved while moving the selected button. The React preview handle now defers pointer capture until a real drag so ordinary taps also open it.

## Validation record

- Complete reader-copy coverage and exact web/mobile/native reader parity passed, including all 1,290 relationship explanations.
- Comparison with the pre-change catalogue passed for all score values/bands, canonical profiles, measurement contracts, source URLs and technical relationship evidence.
- Node inspector profile and relationship description audits passed with no failures.
- The complete JavaScript test suite passed. Its launch-readiness check caught a 10px web label during development; that label was corrected to 12px before the final passing run. Build/test logs are recorded alongside the artifacts.
- Web and React mobile TypeScript/Vite builds passed. Existing large-bundle warnings remain.
- Native iOS Debug build/run passed on iPhone 17e and iPhone 18 Pro Max simulators.
- Visual checks covered all three supplied examples, the longest refinery title, the long convective-energy title, and the cable landing-site title. Checks included collapsed/expanded headers, scrolling, small/large screens, accessibility-large, and the maximum accessibility setting on the small phone. The maximum setting revealed the fixed-header overflow that the scrolling accessibility header fixes.
- Native and web selection checks covered horizontal scrolling, selecting an offscreen pill, selected-first ordering, repeated selection, changing rows and changing nodes. React preview checks confirmed matching descriptions and single active selection.
- Native four-page temperature PDF and web reports were rendered and inspected. The web longest-title report spans three pages, keeps the title size, and includes limits and measurement explanations. Long body paragraphs can continue on another page in both exporters. A five-page synthetic flow check preserved all 180 one-word lines, with no empty pages or body overflow.

The native design-system shell audit still fails on existing hard-coded animation timings in `TULIPApp.swift` and `TULIPWebAppView.swift`. These files were not changed for this inspector work. It also contains pre-existing numeric spacing that a later stage of the audit would reject. This does not prevent the Debug build, but it remains an outstanding repository audit issue. No production release was attempted.

Artifacts are in `artifacts/plain-english-inspectors-2026-09-22/`. Local previews use ports 5181 (website) and 5182 (mobile preview). Generated `dist/` remains a verification artifact.
