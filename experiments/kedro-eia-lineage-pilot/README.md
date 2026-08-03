# TULIP Kedro EIA lineage pilot

This is an isolated evaluation of Kedro and Kedro-Viz. It does not replace
TULIP's Node ingestion jobs or write to the production snapshot.

The pilot reads the existing `public/eia-hourly-grid-snapshot.json`, validates
the same required record fields used by TULIP's ingestion audit, summarizes the
bounded balancing-authority panel, and writes an evaluation artifact under
`data/05_model_output/`.

## Run

From this directory:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -e .
.venv/bin/kedro run
.venv/bin/kedro viz build
```

The verified run processes seven retained EIA-930 balancing authorities through
three nodes, passes the required-field contract, and writes
`data/05_model_output/eia-kedro-pilot-result.json`. The Kedro-Viz build succeeds
and emits its disposable static bundle under `build/`.

## Decision gate

The pilot is worth expanding only if it improves all of the following without
weakening the existing evidence contracts:

- source-to-output lineage clarity;
- reproducible backfills and file versioning;
- failure visibility;
- maintainer experience;
- output parity with TULIP's current snapshot and audit;
- operational cost relative to the existing Node scripts.

The public TULIP causal graph remains a separate product surface. Kedro-Viz
shows data-pipeline lineage, not ecological causality.
