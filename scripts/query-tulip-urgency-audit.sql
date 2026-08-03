-- DuckDB source view for the TULIP urgency audit report.
-- Regenerate the authoritative audit JSON first:
--   npm run audit:tulip-urgency-registry

CREATE OR REPLACE VIEW tulip_urgency_audit AS
SELECT *
FROM read_json_auto('public/tulip-urgency-score-audit.json');

-- Headline accounting.
SELECT
  scope.graph_nodes AS graph_nodes,
  scope.scored_issue_nodes AS scored_issue_nodes,
  totals.method_counts.current_data + totals.method_counts.impact_fallback AS evidence_backed_nodes,
  totals.method_counts.modeled::DOUBLE / scope.scored_issue_nodes AS modeled_share,
  scope.excluded_response_nodes AS excluded_response_nodes,
  validation.checks_passed AS reproducibility_checks_passed
FROM tulip_urgency_audit;

-- Calculation-method mix.
SELECT method_row.*
FROM tulip_urgency_audit AS audit,
UNNEST(audit.totals.method_summary) AS method(method_row);

-- Complete scored-node classifications.
SELECT node_row.*
FROM tulip_urgency_audit AS audit,
UNNEST(audit.scored_issue_nodes) AS node(node_row);

-- Empirical/current-data nodes.
SELECT node_row.*
FROM tulip_urgency_audit AS audit,
UNNEST(audit.empirical_current_data_nodes) AS node(node_row);

-- Accumulated-evidence nodes.
SELECT node_row.*
FROM tulip_urgency_audit AS audit,
UNNEST(audit.accumulated_evidence_nodes) AS node(node_row);

-- Modeled nodes.
SELECT node_row.*
FROM tulip_urgency_audit AS audit,
UNNEST(audit.modeled_nodes) AS node(node_row);

-- Method coverage by sphere.
SELECT sphere_row.*
FROM tulip_urgency_audit AS audit,
UNNEST(audit.sphere_method_counts) AS sphere(sphere_row);

-- Response-node exclusions and leverage values.
SELECT response_row.*
FROM tulip_urgency_audit AS audit,
UNNEST(audit.excluded_response_nodes) AS response(response_row);

-- Reproducibility and accounting checks.
SELECT check_row.*
FROM tulip_urgency_audit AS audit,
UNNEST(audit.validation.checks) AS validation_check(check_row);
