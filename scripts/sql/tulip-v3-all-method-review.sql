-- Reproducible shape of the all-method TULIP v3 review audit.
-- The production artifact is assembled from versioned JSON registries; this query
-- documents the equivalent relational checks for a warehouse implementation.
WITH receipt_reviews AS (
  SELECT
    receipt.node_id,
    receipt.method,
    receipt.score,
    receipt.band,
    review.status,
    review.reviewer_type,
    review.reviewed_content_hash = receipt.content_hash AS hash_bound,
    review.next_review_at > CURRENT_TIMESTAMP AS inside_review_period,
    review.measurement_suitability = 'pass' AS measurement_suitability,
    review.anchor_provenance = 'pass' AS anchor_provenance,
    review.transformation_correctness = 'pass' AS transformation_correctness,
    review.method_eligibility = 'pass' AS method_eligibility,
    review.source_entailment = 'pass' AS source_entailment,
    review.source_currency = 'pass' AS source_currency
  FROM tulip_v3_receipts AS receipt
  JOIN tulip_scientific_reviews AS review USING (node_id)
  WHERE receipt.node_type = 'issue'
)
SELECT
  method,
  COUNT(*) AS receipts,
  COUNT(*) FILTER (
    WHERE status = 'approved'
      AND hash_bound
      AND inside_review_period
      AND measurement_suitability
      AND anchor_provenance
      AND transformation_correctness
      AND method_eligibility
      AND source_entailment
      AND source_currency
  ) AS approved_current,
  COUNT(*) FILTER (WHERE reviewer_type = 'ai_assisted') AS ai_assisted_reviews
FROM receipt_reviews
GROUP BY method
ORDER BY method;
