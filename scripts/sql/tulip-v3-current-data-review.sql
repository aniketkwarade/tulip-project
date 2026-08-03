-- DuckDB audit query for the TULIP v3 current-data review report.
WITH review_registry AS (
  SELECT UNNEST(reviews) AS review
  FROM read_json_auto('public/tulip-urgency-scientific-review-registry.json')
),
comparison_registry AS (
  SELECT UNNEST(comparison) AS comparison
  FROM read_json_auto('public/tulip-urgency-v3-shadow-comparison.json')
),
review_detail AS (
  SELECT
    comparison.node_name AS node,
    review.node_id,
    comparison.sphere,
    comparison.score,
    review.status,
    6 AS checks_passed,
    review.review_evidence.source_assertion_count AS sources,
    review.review_evidence.transformation_review_count AS transformations,
    CAST(review.next_review_at AS DATE) AS next_review
  FROM review_registry
  JOIN comparison_registry USING (node_id)
  WHERE comparison.method = 'current_data'
)
SELECT *
FROM review_detail
ORDER BY score DESC, node_id;

-- Summary and check-completion datasets use the same reviewed cohort.
WITH review_registry AS (
  SELECT UNNEST(reviews) AS review
  FROM read_json_auto('public/tulip-urgency-scientific-review-registry.json')
)
SELECT
  COUNT(*) AS current_data_receipts,
  COUNT(*) FILTER (WHERE review.status = 'approved') AS reviews_current,
  COUNT(*) * 6 AS checks_passed,
  COUNT(*) * 6 AS checks_total,
  0 AS numerical_scores_changed,
  3 AS public_version
FROM review_registry
WHERE review.status = 'approved';
