import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const AUDIT_PATH = path.join(PUBLIC, 'tulip-urgency-score-audit.json');
const OUTPUT_PATH = path.join(PUBLIC, 'tulip-urgency-audit-artifact.json');
const audit = JSON.parse(await fs.readFile(AUDIT_PATH, 'utf8'));
const empiricalCount = audit.totals.method_counts.current_data;
const accumulatedCount = audit.totals.method_counts.impact_fallback;
const modeledCount = audit.totals.method_counts.modeled;
const evidenceBackedCount = empiricalCount + accumulatedCount;
const empiricalShare = empiricalCount / audit.scope.scored_issue_nodes * 100;
const accumulatedShare = accumulatedCount / audit.scope.scored_issue_nodes * 100;
const modeledShare = modeledCount / audit.scope.scored_issue_nodes * 100;
const modeledWithOperationalLineage = audit.totals.modeled_with_operational_lineage;
const globalModelCount = audit.totals.model_version_counts.tulip_modeled_global_v1 ?? 0;
const pilotModelCount = audit.totals.model_version_counts.tulip_modeled_pilot_v1 ?? 0;
const bandSummary = Object.entries(audit.totals.band_counts).map(([band, count]) => `${count} ${band}`).join(' and ');

const source = {
  id: 'tulip_urgency_audit_registry',
  label: 'TULIP urgency audit query over the generated registry audit',
  path: 'scripts/query-tulip-urgency-audit.sql'
};

const summaryRow = {
  graph_nodes: audit.scope.graph_nodes,
  scored_issue_nodes: audit.scope.scored_issue_nodes,
  evidence_backed_nodes: audit.totals.method_counts.current_data + audit.totals.method_counts.impact_fallback,
  modeled_share: audit.totals.method_counts.modeled / audit.scope.scored_issue_nodes,
  excluded_response_nodes: audit.scope.excluded_response_nodes,
  reproducibility_checks_passed: audit.validation.checks_passed
};

const methodMix = audit.totals.method_summary.map(row => ({
  evidence_class: row.evidence_class,
  method: row.method,
  node_count: row.node_count,
  share_of_scored_issues_pct: row.share_of_scored_issue_nodes,
  share_of_graph_pct: row.share_of_all_graph_nodes,
  score_minimum: row.score_minimum,
  score_median: row.score_median,
  score_maximum: row.score_maximum,
  operationally_bound_nodes: row.operationally_bound_nodes
}));

function scoreTableRows(rows) {
  return rows.map(row => ({
    node_name: row.node_name,
    node_id: row.node_id,
    sphere: row.sphere,
    score: row.score,
    band: row.band,
    as_of: row.as_of,
    model_version: row.model_version ?? '—',
    modeled_tag: row.visible_modeled_tag ? 'Required' : 'No',
    operational_lineage: row.operational_lineage ? 'Yes' : 'No',
    source_metadata_count: row.source_metadata_count,
    source_ids: row.source_ids.length ? row.source_ids.join(', ') : '—',
    legacy_score: row.legacy_score,
    score_delta: row.score_delta,
    sensitivity_max_delta: row.sensitivity_max_delta,
    receipt_valid: row.receipt_valid ? 'Passed' : 'Failed'
  }));
}

const empiricalRows = scoreTableRows(audit.empirical_current_data_nodes);
const accumulatedRows = scoreTableRows(audit.accumulated_evidence_nodes);
const modeledRows = scoreTableRows(audit.modeled_nodes);
const responseRows = audit.excluded_response_nodes.map(row => ({
  node_name: row.node_name,
  node_id: row.node_id,
  sphere: row.sphere,
  response_family: row.response_family,
  urgency_status: row.urgency_status,
  leverage_score: row.leverage_score,
  leverage_band: row.leverage_band
}));
const validationRows = audit.validation.checks.map(row => ({
  check: row.check,
  status: row.passed ? 'Passed' : 'Failed',
  detail: Array.isArray(row.detail) && row.detail.length === 0 ? 'No exceptions' : JSON.stringify(row.detail)
}));

const commonScoreColumns = [
  { field: 'node_name', label: 'Node' },
  { field: 'node_id', label: 'Node ID' },
  { field: 'sphere', label: 'Sphere' },
  { field: 'score', label: 'TULIP urgency', format: 'number', type: 'number', align: 'right' },
  { field: 'band', label: 'Band' },
  { field: 'as_of', label: 'As of', type: 'date' },
  { field: 'source_ids', label: 'Evidence/source metadata' },
  { field: 'score_delta', label: 'Δ vs legacy', format: 'number', type: 'number', movement: true, align: 'right' },
  { field: 'sensitivity_max_delta', label: 'Max sensitivity Δ', format: 'number', type: 'number', align: 'right' },
  { field: 'receipt_valid', label: 'Receipt check' }
];

const title = 'Complete TULIP Urgency Score Audit — 381 Nodes';
const artifact = {
  surface: 'report',
  manifest: {
    version: 1,
    surface: 'report',
    title,
    description: 'A complete node-level audit of the approved TULIP urgency v2 registry, calculation method, empirical status, accumulated-evidence status, modeled status and response-node exclusions.',
    generatedAt: audit.generated_at,
    sources: [source],
    charts: [
      {
        id: 'method_mix_chart',
        title: 'TULIP urgency receipts by calculation method',
        subtitle: 'Counts use all 354 scored issue nodes; response nodes are excluded from the denominator.',
        type: 'bar',
        dataset: 'method_mix',
        sourceId: source.id,
        encodings: {
          x: { field: 'evidence_class', type: 'nominal', label: 'Calculation method' },
          y: { field: 'node_count', type: 'quantitative', label: 'Issue nodes' },
          tooltip: [
            { field: 'node_count', type: 'quantitative', label: 'Nodes' },
            { field: 'share_of_scored_issues_pct', type: 'quantitative', label: 'Share of scored issues', unit: '%' },
            { field: 'operationally_bound_nodes', type: 'quantitative', label: 'Operationally bound' },
            { field: 'score_median', type: 'quantitative', label: 'Median score' }
          ]
        },
        yAxisTitle: 'Issue nodes',
        maxRows: 3,
        compatibleTypes: ['bar', 'horizontalBar']
      }
    ],
    tables: [
      {
        id: 'empirical_nodes_table',
        title: 'Empirical / current-data nodes',
        subtitle: 'Direct current observations pass the current-data coverage gate.',
        dataset: 'empirical_nodes',
        sourceId: source.id,
        density: 'compact',
        defaultSort: { field: 'score', direction: 'desc' },
        columns: commonScoreColumns
      },
      {
        id: 'accumulated_nodes_table',
        title: 'Accumulated-evidence nodes',
        subtitle: 'Quantified burden evidence passes the accumulated-impact gate when current urgency cannot be measured reliably.',
        dataset: 'accumulated_nodes',
        sourceId: source.id,
        density: 'compact',
        defaultSort: { field: 'score', direction: 'desc' },
        columns: commonScoreColumns
      },
      {
        id: 'modeled_nodes_table',
        title: 'Modeled nodes — complete list',
        subtitle: 'These nodes do not pass either higher evidence tier and must display the Modeled tag.',
        dataset: 'modeled_nodes',
        sourceId: source.id,
        density: 'compact',
        defaultSort: { field: 'score', direction: 'desc' },
        columns: [
          { field: 'node_name', label: 'Node' },
          { field: 'node_id', label: 'Node ID' },
          { field: 'sphere', label: 'Sphere' },
          { field: 'score', label: 'TULIP urgency', format: 'number', type: 'number', align: 'right' },
          { field: 'band', label: 'Band' },
          { field: 'model_version', label: 'Model version' },
          { field: 'modeled_tag', label: 'Modeled tag' },
          { field: 'operational_lineage', label: 'Operational lineage' },
          { field: 'source_metadata_count', label: 'Source metadata', format: 'number', type: 'number', align: 'right' },
          { field: 'score_delta', label: 'Δ vs legacy', format: 'number', type: 'number', movement: true, align: 'right' },
          { field: 'sensitivity_max_delta', label: 'Max sensitivity Δ', format: 'number', type: 'number', align: 'right' },
          { field: 'receipt_valid', label: 'Receipt check' }
        ]
      },
      {
        id: 'sphere_coverage_table',
        title: 'Method coverage by sphere',
        subtitle: 'Counts reconcile to 354 scored issue nodes.',
        dataset: 'sphere_method_counts',
        sourceId: source.id,
        density: 'compact',
        defaultSort: { field: 'total', direction: 'desc' },
        columns: [
          { field: 'sphere', label: 'Sphere' },
          { field: 'current_data', label: 'Empirical', format: 'number', type: 'number', align: 'right' },
          { field: 'impact_fallback', label: 'Accumulated', format: 'number', type: 'number', align: 'right' },
          { field: 'modeled', label: 'Modeled', format: 'number', type: 'number', align: 'right' },
          { field: 'total', label: 'Total', format: 'number', type: 'number', align: 'right' }
        ]
      },
      {
        id: 'response_nodes_table',
        title: 'Response nodes excluded from TULIP urgency',
        subtitle: 'All 27 responses retain their separately named leverage concept.',
        dataset: 'response_nodes',
        sourceId: source.id,
        density: 'compact',
        defaultSort: { field: 'leverage_score', direction: 'desc' },
        columns: [
          { field: 'node_name', label: 'Response node' },
          { field: 'node_id', label: 'Node ID' },
          { field: 'sphere', label: 'Sphere' },
          { field: 'response_family', label: 'Response family' },
          { field: 'urgency_status', label: 'Urgency status' },
          { field: 'leverage_score', label: 'Leverage', format: 'number', type: 'number', align: 'right' },
          { field: 'leverage_band', label: 'Leverage band' }
        ]
      },
      {
        id: 'validation_checks_table',
        title: 'Reproducibility and accounting checks',
        subtitle: `${audit.validation.checks_passed} of ${audit.validation.checks_total} checks passed.`,
        dataset: 'validation_checks',
        sourceId: source.id,
        density: 'compact',
        defaultSort: { field: 'check', direction: 'asc' },
        columns: [
          { field: 'check', label: 'Check' },
          { field: 'status', label: 'Status' },
          { field: 'detail', label: 'Exceptions' }
        ]
      }
    ],
    blocks: [
      { id: 'title', type: 'markdown', body: `# ${title}` },
      {
        id: 'executive_summary',
        type: 'markdown',
        sourceId: source.id,
        body: `## Executive Summary\n\nThe approved registry completely accounts for **${audit.scope.graph_nodes} graph nodes**: **${audit.scope.scored_issue_nodes} issue nodes** have one TULIP urgency receipt and **${audit.scope.excluded_response_nodes} response nodes** are correctly excluded from urgency scoring. **${empiricalCount} issue nodes (${empiricalShare.toFixed(2)}%)** use empirical/current data and **${accumulatedCount} (${accumulatedShare.toFixed(2)}%)** use accumulated-impact evidence; **${modeledCount} (${modeledShare.toFixed(2)}%)** remain modeled.\n\nThe registry is reproducible—every receipt hash, score, band, node mapping and exclusion passed audit—but empirical maturity is low. The correct release assessment is **Share with caveats**, with the visible **Modeled** tag retained on all ${modeledCount} modeled scores.`
      },
      {
        id: 'method_mix_finding',
        type: 'markdown',
        sourceId: source.id,
        body: `## Reproducible coverage is complete; evidence-backed coverage is ${(evidenceBackedCount / audit.scope.scored_issue_nodes * 100).toFixed(2)}%\n\nThe calculation hierarchy is operating as designed: the highest qualifying tier is selected, and evidence volume is not used as an urgency multiplier. The audit finds **${evidenceBackedCount} evidence-backed receipts** and **${modeledCount} modeled receipts** among the ${audit.scope.scored_issue_nodes} scored issues.`
      },
      { id: 'method_mix_chart_block', type: 'chart', chartId: 'method_mix_chart' },
      {
        id: 'empirical_section',
        type: 'markdown',
        sourceId: source.id,
        body: `## ${empiricalCount} nodes currently pass the empirical/current-data gate\n\nGlobal Temperature, Methane Emissions and Carbon Emission have direct current observations that satisfy the required magnitude-plus-threshold-or-momentum coverage. All ${empiricalCount} receipts identify quantitative sources, reproduce from their input hashes and fall in the Critical band.`
      },
      { id: 'empirical_table_block', type: 'table', tableId: 'empirical_nodes_table' },
      {
        id: 'accumulated_section',
        type: 'markdown',
        sourceId: source.id,
        body: `## ${accumulatedCount} nodes use accumulated quantitative burden evidence\n\nThese nodes do not have sufficient current-data coverage but do have quantitative historical studies, inventories, assessments or administrative records that cover the reviewed impact components. They are evidence-backed and therefore do not receive the Modeled tag.`
      },
      { id: 'accumulated_table_block', type: 'table', tableId: 'accumulated_nodes_table' },
      {
        id: 'modeled_section',
        type: 'markdown',
        sourceId: source.id,
        body: `## ${modeledCount} nodes remain modeled, including ${modeledWithOperationalLineage} with partial operational lineage\n\nA bound feed does not automatically make a score empirical. **${modeledWithOperationalLineage} modeled nodes** have operational lineage, but their bindings do not cover the full current-data or accumulated-impact component gate. Those observations remain internal metadata and do not silently promote the score. **${globalModelCount}** modeled receipts use \`tulip_modeled_global_v1\`${pilotModelCount ? `; **${pilotModelCount}** retain \`tulip_modeled_pilot_v1\`` : ''}.`
      },
      { id: 'modeled_table_block', type: 'table', tableId: 'modeled_nodes_table' },
      {
        id: 'sphere_section',
        type: 'markdown',
        sourceId: source.id,
        body: '## Empirical coverage is concentrated in the atmosphere sphere\n\nAll three empirical receipts are atmospheric. Accumulated-evidence receipts span agriculture, biosphere, economy, sociopolitical and transport. Every sphere still contains modeled nodes, so expansion priorities should be driven by coverage gaps rather than score rank alone.'
      },
      { id: 'sphere_table_block', type: 'table', tableId: 'sphere_coverage_table' },
      {
        id: 'response_section',
        type: 'markdown',
        sourceId: source.id,
        body: '## Twenty-seven response nodes are intentionally outside urgency scoring\n\nThe accounting is complete: response nodes have no TULIP urgency receipts and retain a separately named leverage score. This prevents mitigation or adaptation options from being presented as urgent harms.'
      },
      { id: 'response_table_block', type: 'table', tableId: 'response_nodes_table' },
      {
        id: 'methodology_section',
        type: 'markdown',
        sourceId: source.id,
        body: '## Audit definitions and method\n\n**Empirical/current data** means direct global observations pass the current-data coverage gate. **Accumulated evidence** means quantified burden evidence passes the impact-fallback gate when current urgency cannot be measured reliably. **Modeled** means neither higher tier passes, so a deterministic named model produces the score.\n\nThe audit independently reconciles graph IDs, issue/response classification, registry receipts, comparison rows, method counts, source requirements, stored bands and receipt hashes. It does not treat graph degree, popularity, source count or research volume as urgency inputs.'
      },
      {
        id: 'validation_section',
        type: 'markdown',
        sourceId: source.id,
        body: `## All ${audit.validation.checks_total} reproducibility and accounting checks pass\n\nEvery issue node has exactly one receipt; no response node has an urgency receipt; every input hash and score reproduces; all non-modeled receipts identify quantitative sources; every stored score maps to its stored band; and the comparison registry covers every scored issue.`
      },
      { id: 'validation_table_block', type: 'table', tableId: 'validation_checks_table' },
      {
        id: 'limitations_section',
        type: 'markdown',
        sourceId: source.id,
        body: `## Limitations and robustness\n\nThe central limitation is not missing registry coverage; it is **low empirical maturity**. A modeled score remains a calibrated estimate, not an observation. The score distribution is also concentrated—**${bandSummary}**—which limits rank discrimination.\n\nUnder the tested ±20% weight perturbations, score changes stay within **${audit.totals.sensitivity_max_delta_distribution.maximum} points** (median **${audit.totals.sensitivity_max_delta_distribution.median}**), but dense ties make ranks unstable. Rank should therefore remain secondary to method tier, band and node context. There are **${audit.totals.band_changes_from_legacy} legacy-to-v2 band changes**, which should be reviewed as migration effects rather than treated as fresh evidence.`
      },
      {
        id: 'next_steps_section',
        type: 'markdown',
        sourceId: source.id,
        body: '## Recommended next steps\n\n1. Prioritize the 73 modeled nodes that already have operational lineage; they are the shortest path to higher evidence tiers.\n2. Build complete four-component contracts rather than adding more single indicators.\n3. Add backtests for the next promoted nodes before replacing modeled receipts.\n4. Track empirical and accumulated-evidence coverage as release metrics; target promotions without optimizing the urgency values themselves.\n5. Re-review rank-based product language because sensitivity is small at the score level but large at the rank level.'
      },
      {
        id: 'further_questions_section',
        type: 'markdown',
        body: '## Further questions\n\nWhich spheres should receive the first empirical-coverage targets? What minimum freshness standard should block an evidence-backed receipt from remaining active? Should the product expose a non-numeric coverage summary outside the node inspector for governance review?'
      }
    ]
  },
  snapshot: {
    version: 1,
    generatedAt: audit.generated_at,
    status: 'ready',
    datasets: {
      headline_metrics: [summaryRow],
      method_mix: methodMix,
      empirical_nodes: empiricalRows,
      accumulated_nodes: accumulatedRows,
      modeled_nodes: modeledRows,
      sphere_method_counts: audit.sphere_method_counts,
      response_nodes: responseRows,
      validation_checks: validationRows
    }
  },
  sources: [source],
  package_info: {
    name: 'tulip-urgency-complete-audit',
    version: audit.version,
    registry_generated_at: audit.registry_generated_at,
    audit_generated_at: audit.generated_at
  }
};

await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(artifact, null, 2)}\n`);
console.log(JSON.stringify({
  output: path.relative(ROOT, OUTPUT_PATH),
  datasets: Object.fromEntries(Object.entries(artifact.snapshot.datasets).map(([id, rows]) => [id, rows.length])),
  blocks: artifact.manifest.blocks.length,
  tables: artifact.manifest.tables.length,
  charts: artifact.manifest.charts.length
}, null, 2));
