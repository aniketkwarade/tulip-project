# Shared inspector reader copy

These four authored JSON files are the reader-facing source of truth for all published topics. Use stable node IDs, and `source->target` relationship IDs. Do not key copy by a display name.

- `definitions.json`: standalone opening explanations.
- `profiles.json`: human and planetary impacts, costs, who pays, limits, drivers and actions.
- `measurements.json`: plain-language method, uncertainty and limits on interpretation.
- `relationships.json`: the explanation of each connection, with causal qualifications intact.

Write for someone aged 13 or older who has not studied the subject. Explain the idea before using a technical term. Never define a term by repeating it. Use short sentences, familiar words and concrete examples. Longer explanations are welcome when they help. There is no publication word-count cap.

Preserve place, time, units, uncertainty, comparison periods and the distinction between association and causation. A proxy is not a direct observation. A regional result is not a global rule. Missing evidence is not evidence of no harm. Keep source quotations, technical evidence, measurement contracts and score inputs in their existing scientific records; this directory does not replace them.

`assertPublishedReaderCopy` runs when the published catalogue is constructed. A new published node requires all three node records. A new published edge requires its own explanation. Missing records throw a publication error rather than silently substituting generated prose. Empty consequence arrays are allowed where the evidence does not justify a separate claim; the summary must explain that boundary.

After editing, regenerate and verify:

```sh
node 'Stitch Import/tulip-mobile/scripts/generate-mobile-data-snapshot.mjs'
node iOS/scripts/export-native-data.mjs
npm run export:runtime-graph
npm run test:reader-copy
node scripts/audit-reader-copy.mjs
npm run audit:node-inspector-profiles
npm run audit:relationship-descriptions
```

The readability report flags passages for editorial attention. It is an approximate syllable-based screen, not a reading-age certificate or a reason to remove scientific qualifications. Review the actual passage and its source. Update the explicit catalogue-count assertions when deliberately publishing more nodes or relationships.

The native snapshots, React preview and runtime detail projection consume the same records. Both PDF exporters use that display copy. Do not hand-edit generated snapshots. Keep scores, score bands and response-node exclusions unchanged during copy-only work.

Activity Impacts has its own authored collection in `activities.json`: all 16 category descriptions, comparison notes and action guidance. It uses stable category and comparison-row IDs, shared getters and strict coverage checks. See `docs/plain-english-activity-impacts.md` for the source limitations and validation record. Preserve the scientific fixture unless a separate source-reviewed data change is intended.
