# Tier-D and Entailment Rehabilitation

## Node Audit Correction

The earlier defensibility audit incorrectly treated `curated_local_reference`,
`family_reference`, and `family_peer_reference` as unknown topology. The corrected
rubric gives relationship-specific local evidence less weight than direct evidence
and gives explicitly non-causal family context less weight than either. It does not
promote family context into causality.

After correction, the 522-node graph contains no Tier-D nodes. Tier-C nodes remain
sourced discovery concepts with shallow explanatory neighborhoods; they are not
presented as equivalent to Tier-A or Tier-B mechanisms.

## Expansion Cleanup

- Thirty-six residual generated claims were removed because they skipped necessary mechanisms.
- Three residual claims were promoted with relationship evidence and bounded wording.
- Promoted edges are normalized to `curated_base`; no `expansion_*` topology remains.
- A fishery-collapse to protein-dependence pathway replaces removed generic food-system jumps and preserves the minimum degree floor.

## Entailment Policy

- Uncited anchor inferences are retained only as `anchor_context_reference` hypotheses with low confidence.
- Hypotheses remain discoverable but are not counted as curated relationships.
- Curated-local claims require relationship URLs, claim-specific notes, bounded relationship types, and explicit confidence.
- Metadata readiness is not treated as source-text certification.
- `npm run audit:source-entailment` records demotions, metadata-ready claims, manual-readback items, and claims whose authoritative source text was checked directly.
