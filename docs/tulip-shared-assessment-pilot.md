> Superseded for public scoring by the [catalogue-wide 2027–2036 harm migration](tulip-harm-scoring-migration.md). This document records the earlier pilot; its numerical urgency values are retained for audit only.

# Shared TULIP assessment pilot

Implemented locally on 22 September 2026. This is a controlled 20-topic pilot alongside the legacy urgency index, not a newly validated common harm scale.

Presentation update: the user requested removal of the TULIP assessment metadata block. It is now omitted from web, mobile and native inspectors and from node PDF exports. Shared assessment records, score parity and research findings remain in the data pipeline; the inspector retains its score, relationships, impacts and actions.

## What is shared

`src/tulip-assessment-pilot.json` contains the reviewed observation, period, unusualness, consequences, evidence quality, interpretation limits and next method needed for each pilot topic. The findings come from the frozen 21 September audit in `artifacts/tulip-score-pilot-20-2026-09-21/`. They describe historical evidence, not live conditions.

`scripts/export-tulip-assessments.mjs` combines these reviews with the published node catalog and the current legacy v3 registry. It emits one content-addressed assessment release as `public/tulip-assessments.json` and an identical JavaScript module for the website. Both mobile exporters consume this same release. Native SwiftUI and React render the supplied records rather than recalculate scores.

All 381 published topics have records. The 354 issue nodes retain the canonical legacy value, band and route. All 27 response topics have no danger score. The 50 modeled legacy records remain explicitly modeled and outside the scientific pilot; their presence is not model validation. The 20 pilot assessments keep criticality null. No source quality rating is multiplied into danger, and no missing input becomes zero risk.

This guarantees parity for the same assessment release. An already installed older iOS app still contains its older bundle; publishing the website does not update an installed app. Coordinated app/web releases remain necessary until a separately versioned remote-update mechanism is implemented.

## Meaning of the pilot

- **Unusualness:** how an observation compares with a declared historical reference, where a comparison is defensible. It does not establish damage or an event probability.
- **Consequences:** outcomes supported by the evidence, with their units and geographic and temporal limits. Missing impact models are stated explicitly.
- **Evidence quality:** what was checked and what remains uncertain. Arithmetic replay is distinguished from independent source reconstruction and scientific calibration.
- **Criticality:** not assigned until an appropriate consequence method and an explicit comparison rule have been established. Response effectiveness needs a separate counterfactual assessment.

The rank replay helper uses `100 × (less-adverse observations + half of ties) / reference count`. It rejects non-numeric inputs and references below the configured minimum (30 by default, a pilot admission rule, not a universal statistical guarantee). Values beyond the observed reference are flagged. The AMOC review explicitly identifies its 19-February comparison as exploratory. September sea-ice extent is identified as a related indicator, not a measurement of ice-season length. The earlier uncorroborated Cape Town duration/population calculation is withheld from the headline.

The first release is deliberately a reviewed snapshot. The rank helper supports audit replay; it is not an automatic cross-hazard scoring service. Each topic's fixed reference, interpretation and source-reported uncertainty remain visible in its reviewed assessment. No universal normal distribution, common physical damage unit or climate-attribution claim is assumed.

## Refresh and admission

Each pilot review pins its legacy receipt digest and relevant input-file SHA-256 values. Formatting and key order do not change the receipt digest. Changed or missing input files suppress the old pilot findings and produce `needs_review`; a build check detects exports that were not regenerated. This checks local snapshot integrity, not upstream source truth or expiry. Review dates and observation periods must still be considered when deciding whether an assessment is appropriate to publish.

To add a topic, first publish its stable catalog ID and declare whether it is an issue or a response. It receives `not_assessed` by default. A graph display seed never supplies a score. To admit it to an assessment release:

1. Define the exact indicator, units, direction, geography, time window and relevant baseline. Reject proxy substitutions that change the question.
2. Identify the consequence endpoint, source uncertainty and the evidence needed to connect the indicator to it. Keep interventions separate.
3. Review the source and snapshot, document the interpretation boundary, then add a versioned review contract with the digests of those reviewed inputs. Do not blindly refresh hashes to clear a failing check.
4. Expand the cohort and parity tests intentionally. The current 20-node count is a release gate, not a silent limit on future node support.
5. Regenerate and verify both clients. Introducing numeric common criticality requires a new method version, calibration evidence, meaningful real-case validation and sensitivity checks; changing `null` alone is not sufficient.

From the repository root:

```sh
npm run export:tulip-assessments
node 'Stitch Import/tulip-mobile/scripts/generate-mobile-data-snapshot.mjs'
node iOS/scripts/export-native-data.mjs
npm run test:mobile-data-parity
npm test
npm run build
```

The mobile build also checks protected runtime integrity and assessment freshness before generation. The iOS build runs that mobile pipeline and then exports native data. The full root test suite includes score, band, method, version and pilot-record parity for every node, response exclusions, new-node defaults, changed-input behavior, invalid receipts, baseline sensitivity and empirical-rank saturation.

## Verification after removal of the metadata block

The 381-node parity checks, experience contracts and v3 scoring checks pass. Web and iOS builds pass; the native build also verifies the mobile runtime and TypeScript. The refreshed web inspector and iPhone simulator omit the metadata block and retain the 7.3 Global Temperature score. Its native PDF contains the score, relationships, impacts and actions without the assessment section. No scoring records or calculation rules changed.

## Verification of the initial implementation, before removal of the metadata block

- Full root `npm test`: passed after updating the legacy explanation and canonical modeled-route assertions, plus the stale navigation test to the existing graph capture/restore API.
- Web production build: passed; Vite reports its large-chunk advisory.
- Mobile runtime integrity (28 protected files), TypeScript and production build: passed as part of the native build.
- iOS simulator build and launch: passed on iPhone 18 Pro / iOS 27.
- Runtime inspections: Global Temperature shows legacy 7.3 / Concerning and separate assessment fields; Clean Electricity shows Response with no danger score. Web also shows the unreviewed modeled-node state.
- Native PDF exports: Global Temperature includes all assessment fields; Clean Electricity contains no former 9.4 danger score. The new assessment page was rendered and inspected.
- Web PDF exports: Global Temperature and Clean Electricity include the shared assessment and preserve the response exclusion. Exported pages were inspected; paragraph pagination now reserves the full first answer before drawing its heading.
- Monitoring evidence renders the canonical legacy score from a display copy, preserving the read-only source record. Fresh browser logs are clear of runtime errors.

No production deployment, Git push or App Store release was performed.
