# Relationship Semantics Audit

Generated: 2026-08-02T00:58:54.395Z
Status: **PASS**

## Dataset and grain

1290 final directed relationships across 381 nodes; one source-to-target claim per edge key.

## Semantic roles

| Role | Count |
| --- | ---: |
| increases | 1165 |
| enables | 41 |
| context | 3 |
| constrains | 2 |
| reduces | 79 |

## Findings

| Severity | Finding | Evidence | Status |
| --- | --- | --- | --- |
| high | signed_relationship_presentation | 81 negative relationships across 41 target nodes | resolved |
| high | context_in_causal_graph | 3 context-only relationships | resolved |
| medium | missing_detailed_relationship_type | 155 relationships required bounded semantic fallback types | resolved |
| medium | authored_to_final_lineage | 623 authored inputs; 340 suppression rules; 30 redirects; 1290 final edges | resolved |

## Unresolved failures

None.

## Assumptions

- Response nodes remain beneficial interventions rather than being inverted into deficit nodes.
- Numeric influence remains a display/salience weight and is not presented as a scientific effect estimate.
- Evidence validity remains governed by the existing source-entailment audit.

