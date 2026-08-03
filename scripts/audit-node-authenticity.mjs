import fs from 'node:fs/promises';
import path from 'node:path';

import { NODES } from '../src/data.js';

const outputJsonPath = path.resolve('tmp-node-authenticity-audit.json');
const outputMarkdownPath = path.resolve('tmp-node-authenticity-audit.md');
const syntheticWordingPattern = /(outflows?|sinks?|sprawls?|degradations?|speeds?|scales?|footprints?|frontiers?|traps?|zones?|plumes?|bubbles?|hikes?|chains?|fallout|cave-ins?|scorched earth|slum|redlines?|freon)/i;

function auditNode(node) {
  const authenticity = node.authenticity || {};
  const sourceUrls = node.calibration?.source_urls || [];
  const anchorId = node.calibration?.anchor_id || authenticity.anchor_id || null;
  const reasons = [];

  if (node.terminology_review) {
    const review = node.terminology_review;
    const complete = review.canonical_name
      && review.disposition
      && review.canonical_class
      && review.rationale
      && review.reviewed_at
      && review.source_locators?.length >= 2;
    if (!complete) {
      return { action: 'block_from_release', priority: 'critical', reasons: ['Terminology review exists but is incomplete.'] };
    }
    return {
      action: review.disposition === 'retained_analytical_concept' ? 'retain_reviewed_analytical_concept' : 'retain_reviewed_term',
      priority: 'low',
      reasons: [review.rationale]
    };
  }

  if (!authenticity.status) reasons.push('Missing authenticity classification.');
  if (!sourceUrls.length) reasons.push('No official or primary source is attached.');
  if (node.calibration?.role === 'generated' && !anchorId) reasons.push('Generated label has no reviewed anchor.');

  if (reasons.length) {
    return { action: 'block_from_release', priority: 'critical', reasons };
  }

  if (authenticity.status === 'source_backed_concept_label') {
    const wordingRisk = syntheticWordingPattern.test(node.name || '');
    return {
      action: wordingRisk ? 'rename_or_exact_term_verify' : 'exact_term_verify',
      priority: wordingRisk ? 'high' : 'medium',
      reasons: [
        wordingRisk
          ? 'The underlying subject is sourced, but the display wording looks synthetic or colloquial.'
          : 'The underlying subject is sourced through a reviewed anchor, but the exact display term is not yet validated.'
      ]
    };
  }

  if (authenticity.status === 'source_backed_operational_concept') {
    return {
      action: 'retain_with_concept_label',
      priority: 'low',
      reasons: ['Node-specific evidence exists, but the UI must retain its operational-concept disclosure.']
    };
  }

  return {
    action: 'retain_reviewed',
    priority: 'low',
    reasons: ['Reviewed anchor with node-specific evidence and an explicit authenticity class.']
  };
}

const rows = NODES.map(node => ({
  id: node.id,
  name: node.name,
  sphere: node.sphere,
  role: node.calibration?.role || 'unknown',
  anchor_id: node.calibration?.anchor_id || null,
  source_count: node.calibration?.source_urls?.length || 0,
  authenticity_status: node.authenticity?.status || 'missing',
  authenticity_label: node.authenticity?.label || null,
  ...auditNode(node)
})).sort((a, b) => {
  const order = { critical: 4, high: 3, medium: 2, low: 1 };
  return order[b.priority] - order[a.priority] || a.name.localeCompare(b.name);
});

const countsByAction = rows.reduce((counts, row) => {
  counts[row.action] = (counts[row.action] || 0) + 1;
  return counts;
}, {});
const blockers = rows.filter(row => row.action === 'block_from_release');

const report = {
  generated_at: new Date().toISOString(),
  policy: {
    note: 'Authenticity concerns whether the displayed phenomenon name is reviewed and source-grounded. It is separate from relationship defensibility.',
    release_gate: 'No node may ship without sources, an authenticity class, and a reviewed anchor when generated.'
  },
  totals: {
    nodes: rows.length,
    blockers: blockers.length
  },
  counts_by_action: countsByAction,
  rows
};

const markdown = [
  '# Node Authenticity Audit',
  '',
  `Generated: ${report.generated_at}`,
  '',
  '## Release Gate',
  '',
  `- Nodes: ${rows.length}`,
  `- Release blockers: ${blockers.length}`,
  ...Object.entries(countsByAction).map(([action, count]) => `- ${action}: ${count}`),
  '',
  '## Interpretation',
  '',
  '- Reviewed phenomena and operational indicators have node-specific evidence.',
  '- Source-backed operational concepts are analytical labels and disclose that status in the inspector.',
  '- Source-backed concept labels inherit evidence from a reviewed anchor and remain queued for exact-term validation.',
  '- High-priority rows are real underlying subjects whose current wording looks synthetic, colloquial, or over-compressed.',
  '',
  '## Rename Or Verify First',
  '',
  '| Node | Sphere | Anchor | Action |',
  '| --- | --- | --- | --- |',
  ...rows.filter(row => ['critical', 'high'].includes(row.priority)).map(row => `| ${row.name} | ${row.sphere} | ${row.anchor_id || 'none'} | ${row.action} |`)
];

await fs.writeFile(outputJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
await fs.writeFile(outputMarkdownPath, `${markdown.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  json: outputJsonPath,
  markdown: outputMarkdownPath,
  totals: report.totals,
  counts_by_action: countsByAction
}, null, 2));

if (blockers.length) process.exitCode = 1;
