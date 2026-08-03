import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUTPUT_DIR = path.join(ROOT, 'output', 'reports');
const generatedAt = '2026-08-02T16:00:00.000Z';

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(ROOT, relativePath), 'utf8'));
}

const reviewQuery = await fs.readFile(path.join(ROOT, 'scripts/sql/tulip-v3-all-method-review.sql'), 'utf8');

const [reviewRegistry, publicRegistry, comparison, modeledAssurance, audit] = await Promise.all([
  readJson('public/tulip-urgency-scientific-review-registry.json'),
  readJson('public/tulip-urgency-v3-scores.json'),
  readJson('public/tulip-urgency-v3-shadow-comparison.json'),
  readJson('public/tulip-urgency-modeled-method-assurance.json'),
  readJson('public/tulip-urgency-v3-shadow-audit.json')
]);

const receiptById = new Map(publicRegistry.receipts.map(receipt => [receipt.node_id, receipt]));
const comparisonById = new Map(comparison.comparison.map(row => [row.node_id, row]));
const reviewRows = reviewRegistry.reviews.map(review => {
  const receipt = receiptById.get(review.node_id);
  const row = comparisonById.get(review.node_id);
  return {
    node: row?.node_name ?? review.node_id,
    node_id: review.node_id,
    sphere: row?.sphere ?? 'unknown',
    method: receipt?.method ?? 'unknown',
    score: row?.score ?? receipt?.score ?? null,
    band: receipt?.band ?? null,
    status: review.status,
    checks_passed: Object.values(review.checks).filter(value => value === 'pass').length,
    sources: review.review_evidence?.source_assertion_count ?? 0,
    transformations: review.review_evidence?.transformation_review_count ?? 0,
    reviewer_type: review.reviewer_type ?? 'ai_assisted',
    next_review: review.next_review_at?.slice(0, 10) ?? null
  };
});

const methodLabels = {
  current_data: 'Current data',
  impact_fallback: 'Impact fallback',
  modeled: 'Modeled fallback'
};
const methodOrder = ['current_data', 'impact_fallback', 'modeled'];
const methodSummary = methodOrder.map(method => {
  const cohort = reviewRows.filter(row => row.method === method);
  return {
    method: methodLabels[method],
    receipts: cohort.length,
    approved: cohort.filter(row => row.status === 'approved').length,
    checks_passed: cohort.reduce((sum, row) => sum + row.checks_passed, 0),
    checks_required: cohort.length * 6,
    share_approved: cohort.filter(row => row.status === 'approved').length / cohort.length
  };
});

const checkLabels = {
  measurement_suitability: 'Measurement suitability',
  anchor_provenance: 'Anchor provenance',
  transformation_correctness: 'Transformation correctness',
  method_eligibility: 'Method eligibility',
  source_entailment: 'Source entailment',
  source_currency: 'Source currency'
};
const checkSummary = Object.entries(checkLabels).map(([check, label]) => ({
  check: label,
  passed: reviewRegistry.reviews.filter(review => review.checks[check] === 'pass').length,
  required: reviewRegistry.reviews.length,
  share: reviewRegistry.reviews.filter(review => review.checks[check] === 'pass').length / reviewRegistry.reviews.length
}));
const approved = reviewRows.filter(row => row.status === 'approved').length;
const checksPassed = reviewRows.reduce((sum, row) => sum + row.checks_passed, 0);
const summary = [{
  receipts: reviewRows.length,
  reviews_current: approved,
  current_data: methodSummary[0].approved,
  impact_fallback: methodSummary[1].approved,
  modeled: methodSummary[2].approved,
  checks_passed: checksPassed,
  checks_total: reviewRows.length * 6,
  rollout_checks_passed: audit.validation.checks_passed,
  rollout_checks_total: audit.validation.checks_total,
  numerical_scores_changed: 0
}];
const modeledSummary = [{
  receipts: modeledAssurance.validation_summary.receipts,
  passed: modeledAssurance.validation_summary.passed,
  peer_count_minimum: modeledAssurance.validation_summary.peer_count_minimum,
  peer_count_maximum: modeledAssurance.validation_summary.peer_count_maximum,
  max_weight_perturbation_delta: modeledAssurance.validation_summary.maximum_weight_perturbation_score_delta,
  max_leave_one_peer_out_delta: modeledAssurance.validation_summary.maximum_leave_one_peer_out_score_delta,
  externally_validated_predictive_model: 'No'
}];

const sources = [
  {
    id: 'review_query',
    label: 'TULIP all-method review audit query',
    path: 'scripts/sql/tulip-v3-all-method-review.sql',
    query: {
      sql: reviewQuery,
      description: 'Joins the public issue receipts to their scientific reviews and aggregates hash-bound, in-period, six-check approvals by method.',
      tables_used: ['tulip_v3_receipts', 'tulip_scientific_reviews'],
      filters: ["receipt.node_type = 'issue'"],
      metric_definitions: ['approved_current requires approved status, matching content hash, current review period, and all six checks']
    }
  },
  {
    id: 'review_registry',
    label: 'TULIP scientific-review registry',
    path: 'public/tulip-urgency-scientific-review-registry.json',
    query: {
      sql: reviewQuery,
      description: 'Relational audit equivalent of the versioned JSON receipt-review registry used to build this report.',
      tables_used: ['tulip_v3_receipts', 'tulip_scientific_reviews'],
      filters: ["receipt.node_type = 'issue'"]
    }
  },
  { id: 'public_v3_registry', label: 'Public TULIP urgency v3 registry', path: 'public/tulip-urgency-v3-scores.json' },
  {
    id: 'modeled_assurance',
    label: 'Modeled-method assurance record',
    path: 'public/tulip-urgency-modeled-method-assurance.json',
    query: {
      sql: "SELECT COUNT(*) AS receipts, SUM(CASE WHEN passed THEN 1 ELSE 0 END) AS passed, MIN(peer_count) AS peer_count_minimum, MAX(peer_count) AS peer_count_maximum, MAX(weight_perturbation_max_absolute_delta) AS max_weight_perturbation_delta, MAX(leave_one_peer_out_max_absolute_delta) AS max_leave_one_peer_out_delta FROM tulip_modeled_receipt_validations;",
      description: 'Aggregates deterministic reproduction and sensitivity results for the modeled fallback cohort.',
      tables_used: ['tulip_modeled_receipt_validations']
    }
  },
  {
    id: 'rollout_audit',
    label: 'V3 shadow assurance audit',
    path: 'public/tulip-urgency-v3-shadow-audit.json',
    query: {
      sql: 'SELECT SUM(CASE WHEN passed THEN 1 ELSE 0 END) AS checks_passed, COUNT(*) AS checks_total FROM tulip_v3_rollout_checks;',
      description: 'Counts the passed registry, exclusion, integrity, disclosure, and review-wave rollout checks.',
      tables_used: ['tulip_v3_rollout_checks']
    }
  }
];

const artifact = {
  surface: 'report',
  manifest: {
    version: 1,
    surface: 'report',
    title: 'TULIP v3 All-Method Scientific Review',
    description: 'Technical assurance record for all 354 public v3 issue receipts across current-data, impact-fallback, and modeled routes.',
    generatedAt,
    sources,
    cards: [
      {
        id: 'reviews_current',
        description: 'Receipts with approved reviews bound to their current SHA-256 content hash and inside their review period.',
        dataset: 'summary',
        sourceId: 'review_registry',
        metrics: [{ label: 'Reviews current', field: 'reviews_current', format: 'number' }]
      },
      {
        id: 'checks_passed',
        description: 'Passed checks across the six-item review rubric.',
        dataset: 'summary',
        sourceId: 'review_registry',
        metrics: [
          { label: 'Checks passed', field: 'checks_passed', format: 'number' },
          { label: 'Checks required', field: 'checks_total', format: 'number' }
        ]
      },
      {
        id: 'rollout_checks',
        description: 'Passed registry, exclusion, integrity, disclosure, and review-wave rollout checks.',
        dataset: 'summary',
        sourceId: 'rollout_audit',
        metrics: [
          { label: 'Rollout checks', field: 'rollout_checks_passed', format: 'number' },
          { label: 'Required', field: 'rollout_checks_total', format: 'number' }
        ]
      }
    ],
    charts: [
      {
        id: 'method_completion',
        title: 'Approved receipts by scoring route',
        subtitle: 'All 354 reviews are current; route volume differs substantially.',
        type: 'bar',
        dataset: 'method_summary',
        sourceId: 'review_registry',
        encodings: {
          x: { field: 'method', type: 'nominal', label: 'Scoring route' },
          y: { field: 'approved', type: 'quantitative', label: 'Approved receipts', format: 'number' }
        },
        yAxisTitle: 'Approved receipts',
        valueFormat: 'number',
        layout: 'full'
      },
      {
        id: 'check_completion',
        title: 'Six-check review coverage',
        subtitle: 'Each declared check passed for all 354 receipts.',
        type: 'bar',
        dataset: 'check_summary',
        sourceId: 'review_registry',
        encodings: {
          x: { field: 'check', type: 'nominal', label: 'Review check' },
          y: { field: 'passed', type: 'quantitative', label: 'Receipts passed', format: 'number' }
        },
        yAxisTitle: 'Receipts passed',
        valueFormat: 'number',
        layout: 'full'
      }
    ],
    tables: [
      {
        id: 'method_summary',
        title: 'Method-level completion',
        dataset: 'method_summary',
        sourceId: 'review_registry',
        layout: 'full',
        columns: [
          { field: 'method', label: 'Scoring route', type: 'text' },
          { field: 'receipts', label: 'Receipts', format: 'number' },
          { field: 'approved', label: 'Approved/current', format: 'number' },
          { field: 'checks_passed', label: 'Checks passed', format: 'number' },
          { field: 'checks_required', label: 'Checks required', format: 'number' }
        ]
      },
      {
        id: 'modeled_summary',
        title: 'Modeled-route robustness checks',
        subtitle: 'Deterministic reproduction and local sensitivity; not predictive validation.',
        dataset: 'modeled_summary',
        sourceId: 'modeled_assurance',
        layout: 'full',
        columns: [
          { field: 'receipts', label: 'Receipts', format: 'number' },
          { field: 'passed', label: 'Passed', format: 'number' },
          { field: 'peer_count_minimum', label: 'Min peers', format: 'number' },
          { field: 'peer_count_maximum', label: 'Max peers', format: 'number' },
          { field: 'max_weight_perturbation_delta', label: 'Max ±20% weight score delta', format: 'number' },
          { field: 'max_leave_one_peer_out_delta', label: 'Max leave-one-peer-out delta', format: 'number' },
          { field: 'externally_validated_predictive_model', label: 'Externally validated', type: 'text' }
        ]
      },
      {
        id: 'receipt_reviews',
        title: 'Receipt-level review results',
        subtitle: 'All 354 issue receipts; response nodes remain excluded.',
        dataset: 'review_rows',
        sourceId: 'review_registry',
        defaultSort: { field: 'score', direction: 'desc' },
        density: 'dense',
        layout: 'full',
        columns: [
          { field: 'node', label: 'Node', type: 'text' },
          { field: 'sphere', label: 'Sphere', type: 'text' },
          { field: 'method', label: 'Method', type: 'text' },
          { field: 'score', label: 'Score', format: 'number' },
          { field: 'band', label: 'Band', type: 'text' },
          { field: 'status', label: 'Status', type: 'text' },
          { field: 'checks_passed', label: 'Checks', format: 'number' },
          { field: 'reviewer_type', label: 'Reviewer type', type: 'text' },
          { field: 'next_review', label: 'Next review', type: 'text' }
        ]
      }
    ],
    sources,
    blocks: [
      { id: 'title', type: 'markdown', body: '# TULIP v3 All-Method Scientific Review' },
      {
        id: 'technical_summary',
        type: 'markdown',
        sourceId: 'review_registry',
        body: '## All 354 public issue receipts passed their declared review gate\n\nCoverage is **96 current-data**, **208 impact-fallback**, and **50 modeled** receipts. All **2,124 of 2,124** six-rubric checks passed, and the rollout audit passed **15 of 15** checks. Scores remain numerically identical to v2.'
      },
      { id: 'headline_metrics', type: 'metric-strip', cardIds: ['reviews_current', 'checks_passed', 'rollout_checks'] },
      { id: 'method_chart', type: 'chart', chartId: 'method_completion', layout: 'full' },
      { id: 'method_table', type: 'table', tableId: 'method_summary', layout: 'full' },
      {
        id: 'route_findings',
        type: 'markdown',
        sourceId: 'modeled_assurance',
        body: '## Route-specific findings\n\nCurrent-data reviews bind observations, anchors, transformations, method gates, sources, and fixtures. Impact-fallback reviews verify four accumulated-impact components and explicitly distinguish source measurements from TULIP normalization. Modeled reviews reproduce the legacy, peer, contract, calibration, composite, and displayed-score chain, then test ±20% weight perturbation and leave-one-peer-out sensitivity.'
      },
      { id: 'check_chart', type: 'chart', chartId: 'check_completion', layout: 'full' },
      { id: 'modeled_table', type: 'table', tableId: 'modeled_summary', layout: 'full' },
      { id: 'review_table', type: 'table', tableId: 'receipt_reviews', layout: 'full' },
      {
        id: 'methodology',
        type: 'markdown',
        sourceId: 'review_registry',
        body: '## Reproducible methodology\n\nEvery approval is bound to the receipt SHA-256 content hash and expires at `next_review_at`. A content change or elapsed review period makes the review stale. The six checks cover measurement suitability, anchor provenance, transformation correctness, method eligibility, source entailment, and source currency.'
      },
      {
        id: 'limitations',
        type: 'markdown',
        sourceId: 'modeled_assurance',
        body: '## Assurance boundary\n\nThis is an **AI-assisted reproducible review, not human expert sign-off**; human entailment review was not performed. Passing status means the declared method and evidence satisfy the recorded rubric. It does not prove an original measurement, modeled estimate, or scientific claim true. Impact normalization is checked against declared contracts and fixtures where no verified raw-unit inverse exists. The modeled route is deterministic but is not an independently trained or externally validated predictive model; legacy judgments retain 60% weight, peer sets can be sparse, and external sources provide context rather than score validation.'
      },
      {
        id: 'next_steps',
        type: 'markdown',
        body: '## Ongoing governance\n\nThe queue is complete, but review is not permanent. Monitor source refreshes, content-hash changes, and `next_review_at`; obtain independent domain-expert sign-off for the highest-consequence anchors and replace semantic normalization contracts with executable raw-unit transformations when available.'
      }
    ]
  },
  snapshot: {
    version: 1,
    generatedAt,
    status: 'ready',
    datasets: { summary, method_summary: methodSummary, check_summary: checkSummary, modeled_summary: modeledSummary, review_rows: reviewRows }
  },
  sources,
  package_info: {
    root: 'LostPlanet',
    manifestPath: 'output/reports/tulip-v3-all-method-scientific-review-artifact.json',
    snapshotPath: 'output/reports/tulip-v3-all-method-scientific-review-artifact.json'
  }
};

await fs.mkdir(OUTPUT_DIR, { recursive: true });
const output = path.join(OUTPUT_DIR, 'tulip-v3-all-method-scientific-review-artifact.json');
await fs.writeFile(output, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(output);
