# Recent Major Events refresh

TULIP uses one reader-facing contract for every node: **Recent Major Events**, three article-backed records, one verification-status tag, a 40–50 word specific description, and direct links to reputed reporting.

## Weekly update path

The `Weekly recent major events` GitHub Actions workflow runs every Monday at 06:43 UTC. It:

1. Searches the previous three years of relevance-ranked English-language coverage for every published TULIP node, then keeps the three newest approved articles. GDELT DOC 2.0 is the primary discovery index; an automatic startup health check switches the run to Bing News RSS when GDELT is unavailable. This wider window prevents rare hazards from being padded with unrelated stories; newer qualifying events automatically displace older records.
2. Keeps only direct HTTPS articles from the publisher allowlist in `scripts/refresh-recent-major-events.mjs`.
3. Extracts a short factual passage from article metadata, structured article data, or body text. The generated 40–50-word description attributes the publisher and date, quotes no more than 18 source words, and rejects sparse or boilerplate pages.
4. Rejects government pages, dataset pages, duplicate headlines, articles outside the rolling three-year window, summaries outside 40–50 words, obsolete relationship/scale tags, and nodes with fewer than three events.
5. Writes a frozen snapshot to `src/recent-major-events.generated.json`; the browser never queries GDELT directly.
6. Runs the recent-events test and production build.
7. Opens or updates one automation pull request and enables squash auto-merge. Normal GitHub and Vercel checks remain the production gate.

If any node cannot produce three approved records, the job fails before writing or publishing a partial snapshot. The last reviewed snapshot remains live.

## Manual refresh

Run:

```bash
npm run refresh:recent-major-events
npm run test:recent-occurrences
npm run build
```

For a provider smoke test, limit the run without weakening production validation:

```bash
RECENT_EVENTS_MAX_NODES=5 npm run refresh:recent-major-events
```

Use `RECENT_EVENTS_NODE_OFFSET` with the limit to test a later catalog slice, and `RECENT_EVENTS_QUERY_CONCURRENCY` (1–4, default 2) to reproduce or reduce provider load:

```bash
RECENT_EVENTS_NODE_OFFSET=20 RECENT_EVENTS_MAX_NODES=40 RECENT_EVENTS_QUERY_CONCURRENCY=2 npm run refresh:recent-major-events
```

To target known difficult topics during source-policy review, use a comma-separated node list:

```bash
RECENT_EVENTS_NODE_IDS=deforestation,industry_farming npm run refresh:recent-major-events
```

The production workflow probes GDELT over HTTPS and automatically falls back to Bing News RSS if that provider is unavailable. Set `RECENT_EVENTS_DISCOVERY=bing` to exercise the fallback deliberately. If a local network blocks only GDELT's TLS endpoint, `GDELT_API_BASE=http://api.gdeltproject.org/api/v2/doc/doc` may be used for candidate discovery during a local smoke test. Regardless of discovery provider, final records are accepted only after the allowlisted publisher article is fetched directly over HTTPS; the article page supplies the summary and preferred publication date.

The publisher allowlist is intentionally explicit. Add a publisher only after confirming it produces reported articles with accessible factual text, stable HTTPS destinations, and editorial standards appropriate for TULIP. The refresh intentionally has no model-service dependency or private API key, so scheduled runs remain reproducible and do not silently change behavior when an external model is retired.

For narrowly named hazards that news indexes consistently misclassify, `CURATED_EVENT_SEEDS` supplies a small article-level discovery safety net. Seeds do not bypass any checks: the refresh still fetches the final HTTPS article, verifies its publisher and topic vocabulary, extracts its publication date and factual text, and applies the same 40–50-word and obsolete-field validation. Newly discovered relevant coverage can supersede older seeds by date.
