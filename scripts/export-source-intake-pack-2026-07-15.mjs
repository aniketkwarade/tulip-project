import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const inputPath = path.join(ROOT, 'docs', 'source-intake-assessment-2026-07-15.md');
const outputJsonPath = path.join(ROOT, 'docs', 'source-intake-pack-2026-07-15.json');
const outputCsvPath = path.join(ROOT, 'docs', 'source-intake-pack-2026-07-15.csv');

function parseMarkdownTable(sectionText) {
  const lines = sectionText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => line.startsWith('|'));

  if (lines.length < 3) return [];

  const headers = lines[0]
    .split('|')
    .slice(1, -1)
    .map(header => header.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_'));

  return lines.slice(2).map(line => {
    const values = line
      .split('|')
      .slice(1, -1)
      .map(value => value.trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));
  });
}

function sectionBetween(text, startMarker, endMarker) {
  const start = text.indexOf(startMarker);
  if (start === -1) return '';
  const startIndex = start + startMarker.length;
  const end = endMarker ? text.indexOf(endMarker, startIndex) : -1;
  return text.slice(startIndex, end === -1 ? undefined : end);
}

function parseIdList(value) {
  return value
    .split(',')
    .map(part => Number(part.trim()))
    .filter(Number.isFinite);
}

function csvEscape(value) {
  const normalized = String(value ?? '');
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
}

const markdown = await fs.readFile(inputPath, 'utf8');

const immediateTable = parseMarkdownTable(
  sectionBetween(
    markdown,
    '## Best Immediate Ingestion Targets',
    '## Operational But Gated Or Auth-Mediated'
  )
);

const gatedTable = parseMarkdownTable(
  sectionBetween(
    markdown,
    '## Operational But Gated Or Auth-Mediated',
    '## Strong Anchor / Edge Reasoning Sources'
  )
);

const reasoningFamilies = parseMarkdownTable(
  sectionBetween(
    markdown,
    '## Strong Anchor / Edge Reasoning Sources',
    '## Context / Guidance Only'
  )
);

const contextTable = parseMarkdownTable(
  sectionBetween(
    markdown,
    '## Context / Guidance Only',
    '## Per-Source Intake Notes'
  )
);

const sourceDispositionTable = parseMarkdownTable(
  sectionBetween(
    markdown,
    '## Per-Source Intake Notes',
    '## Verified Access Notes'
  )
);

const immediateById = new Map(
  immediateTable.map(row => [Number(row.id), row])
);

const gatedById = new Map(
  gatedTable.map(row => [Number(row.id), row])
);

const contextById = new Map(
  contextTable.map(row => [Number(row.id), row])
);

const reasoningById = new Map();
for (const family of reasoningFamilies) {
  for (const id of parseIdList(family.ids)) {
    const bucket = reasoningById.get(id) || [];
    bucket.push({
      source_family: family.source_family,
      best_tulip_use: family.best_tulip_use
    });
    reasoningById.set(id, bucket);
  }
}

const entries = sourceDispositionTable.map(row => {
  const id = Number(row.id);
  const immediate = immediateById.get(id) || null;
  const gated = gatedById.get(id) || null;
  const context = contextById.get(id) || null;
  const reasoning = reasoningById.get(id) || [];

  return {
    id,
    source: row.source,
    intake_disposition: row.intake_disposition.replace(/`/g, ''),
    priority_group: immediate
      ? 'best_immediate_ingestion_target'
      : gated
        ? 'operational_gated_or_manual'
        : reasoning.length
          ? 'anchor_or_edge_reasoning'
          : context
            ? 'context_only'
            : 'unclassified',
    usable_surface: immediate?.usable_surface || null,
    access_notes: immediate?.access_notes || gated?.why_gated_manual || null,
    best_tulip_use: immediate?.best_tulip_use || null,
    reasoning_families: reasoning,
    context_note: context?.why_lower_priority || null,
    notes: gated?.notes || null
  };
});

const registry = {
  generated_at: new Date().toISOString(),
  generated_from: path.relative(ROOT, inputPath),
  summary: {
    total_sources: entries.length,
    operational_open: entries.filter(entry => entry.intake_disposition === 'operational_open').length,
    operational_gated: entries.filter(entry => entry.intake_disposition === 'operational_gated').length,
    operational_gated_or_manual: entries.filter(entry => entry.intake_disposition === 'operational_gated_or_manual').length,
    anchor_reasoning: entries.filter(entry => entry.intake_disposition === 'anchor_reasoning').length,
    context_only: entries.filter(entry => entry.intake_disposition === 'context_only').length
  },
  entries
};

await fs.writeFile(outputJsonPath, `${JSON.stringify(registry, null, 2)}\n`, 'utf8');

const csvHeaders = [
  'id',
  'source',
  'intake_disposition',
  'priority_group',
  'usable_surface',
  'access_notes',
  'best_tulip_use',
  'reasoning_families',
  'context_note',
  'notes'
];

const csvRows = [
  csvHeaders.join(','),
  ...entries.map(entry => csvHeaders
    .map(header => {
      const value = header === 'reasoning_families'
        ? entry.reasoning_families.map(item => `${item.source_family}: ${item.best_tulip_use}`).join(' || ')
        : entry[header];
      return csvEscape(value);
    })
    .join(','))
];

await fs.writeFile(outputCsvPath, `${csvRows.join('\n')}\n`, 'utf8');

console.log(JSON.stringify({
  json: path.relative(ROOT, outputJsonPath),
  csv: path.relative(ROOT, outputCsvPath),
  total_sources: registry.summary.total_sources
}, null, 2));
