import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { PUBLISHED_NODES } from '../src/data.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const outDir = resolve(root, 'artifacts/tulip-calibration-2026-09-22');
const catalogue = JSON.parse(await readFile(resolve(outDir, 'internal-reviewed-catalogue-candidates.json'), 'utf8'));
const axes = ['severity', 'reach', 'persistence'];
const nodesById = new Map(PUBLISHED_NODES.map(node => [node.id, node]));
const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');

function ecosystemBasis(candidate) {
  // blindAxisBasis is only a rejected comparison for retained pilot records;
  // counting it would overstate the evidence supporting the actual candidate.
  return candidate.decisionTrace?.axisBasis?.ecosystem ?? null;
}

function sourceTrack(sphere) {
  if (['biosphere', 'agriculture'].includes(sphere)) return 'terrestrial_extent_condition_and_species';
  if (sphere === 'oceans') return 'marine_habitat_condition_and_species';
  if (sphere === 'freshwater') return 'freshwater_extent_connectivity_and_species';
  if (sphere === 'cryosphere') return 'cryosphere_extent_and_ecological_response';
  if (['atmosphere', 'energy', 'transport'].includes(sphere)) return 'pressure_to_receptor_endpoint_linkage';
  return 'direct_footprint_and_terminal_ecosystem_consequence';
}

const rows = catalogue.issues.filter(row => row.candidate.applicableDomains.includes('ecosystem')).map(row => {
  const basis = ecosystemBasis(row.candidate);
  const anchored = Object.fromEntries(axes.map(axis => [axis, basis?.[axis]?.sourceAnchored === true]));
  const missingAxes = axes.filter(axis => !anchored[axis]);
  const node = nodesById.get(row.nodeId);
  return {
    nodeId: row.nodeId,
    name: row.name,
    sphere: node?.sphere ?? 'unknown',
    grade: row.result.grade.letter,
    value: row.result.value,
    confidence: row.result.confidence,
    reviewMethod: row.candidate.decisionTrace?.method ?? null,
    axisBasisStatus: basis ? 'authoritative_trace_recorded' : 'authoritative_trace_not_recorded',
    sourceTrack: sourceTrack(node?.sphere),
    anchored,
    missingAxes,
    missingCount: missingAxes.length,
    currentBasis: Object.fromEntries(axes.map(axis => [axis, basis?.[axis]?.basis ?? null])),
    nextEvidenceNeeded: {
      severity: anchored.severity ? null : 'A measured loss or condition change with a denominator tied to the affected ecosystem, habitat or population.',
      reach: anchored.reach ? null : 'The affected share of the relevant ecosystem, habitat or population, with matching geography and time.',
      persistence: anchored.persistence ? null : 'A measured recovery time, consequence duration or irreversible outcome; dataset length does not qualify.',
    },
  };
}).sort((left, right) => right.missingCount - left.missingCount
  || ['D', 'C', 'B', 'A'].indexOf(left.confidence) - ['D', 'C', 'B', 'A'].indexOf(right.confidence)
  || left.nodeId.localeCompare(right.nodeId));

const countBy = (values, key) => values.reduce((counts, value) => {
  const item = typeof key === 'function' ? key(value) : value[key];
  counts[item] = (counts[item] ?? 0) + 1;
  return counts;
}, {});

const exactAxisLevelCounts = Object.fromEntries(axes.map(axis => [axis, rows.filter(row => row.anchored[axis]).length]));
const boundedAxisCounts = Object.fromEntries(axes.map(axis => [axis, rows.filter(row => !row.anchored[axis]).length]));
const bySphere = Object.entries(countBy(rows, 'sphere')).sort((a, b) => a[0].localeCompare(b[0])).map(([sphere, nodes]) => ({
  sphere,
  nodes,
  missingSeverity: rows.filter(row => row.sphere === sphere && !row.anchored.severity).length,
  missingReach: rows.filter(row => row.sphere === sphere && !row.anchored.reach).length,
  missingPersistence: rows.filter(row => row.sphere === sphere && !row.anchored.persistence).length,
}));

const researchSources = [{
  id: 'geo_bon_essential_biodiversity_variables',
  role: 'schema_standard',
  url: 'https://geobon.org/downloads/governance-documents/Essential_Biodiversity_Variable_Strategy_v2.pdf',
  use: 'Standardize extent, fragmentation, composition, species distribution and population-abundance fields before ingesting measurements.',
  limitation: 'A measurement framework, not a node-level data source.',
}, {
  id: 'esa_worldcover_2021',
  role: 'terrestrial_extent_baseline',
  url: 'https://developers.google.com/earth-engine/datasets/catalog/ESA_WorldCover_v200',
  licence: 'CC BY 4.0',
  use: 'Global 10 m land-cover baseline, including mangroves, wetlands, tree cover, grassland, permanent water, snow and ice.',
  limitation: 'One annual map cannot establish degradation, harm, attribution or recovery time.',
}, {
  id: 'dynamic_world',
  role: 'terrestrial_extent_time_series_candidate',
  url: 'https://developers.google.com/earth-engine/datasets/catalog/GOOGLE_DYNAMICWORLD_V1',
  licence: 'CC BY 4.0',
  use: 'Global 10 m class probabilities from 2015 onward for a consistent land-cover change screen.',
  limitation: 'Class change is not automatically ecological harm; validation and a node-specific reference state are required.',
}, {
  id: 'iucn_red_list_v4',
  role: 'species_distribution_population_and_recovery_candidate',
  url: 'https://api.iucnredlist.org/',
  licence: 'Restricted API terms; commercial use prohibited without a separate licence.',
  use: 'Assessment date, scope, population trend, mature individuals, area of occupancy, extent of occurrence and mapped distribution where available.',
  limitation: 'Do not ingest into a public or commercial product until licensing is resolved; coverage is incomplete and assessment effort changes over time.',
}, {
  id: 'gbif_occurrence_api',
  role: 'species_occurrence_candidate',
  url: 'https://techdocs.gbif.org/en/openapi/v1/occurrence',
  licence: 'Per-record licence and attribution requirements.',
  use: 'Occurrence records and reproducible downloads for distribution checks.',
  limitation: 'Record density is not population abundance, loss, harm or recovery; sampling effort and record licences must be retained.',
}, {
  id: 'ipbes_global_assessment',
  role: 'calibration_and_context',
  url: 'https://doi.org/10.5281/zenodo.3831673',
  use: 'Cross-check global biodiversity and ecosystem-service definitions, direction of change and system-level interpretation.',
  limitation: 'Global synthesis values cannot replace node-specific severity, reach or persistence denominators.',
}];

const inventory = {
  version: 'tulip_internal_ecosystem_endpoint_inventory_2026_09_23_v3',
  generatedOn: '2026-09-23',
  status: 'research_inventory_not_public_rating_data',
  productionRatingsEnabled: 0,
  methodGuard: [
    'Historical record length is not consequence persistence.',
    'Mapped extent or occurrence density is not severity.',
    'A pressure such as temperature, pollution or land-cover change is not a terminal ecosystem consequence without a receptor link.',
    'Global synthesis statistics cannot be copied into every related node.',
    'Missing evidence widens the recorded axis bounds; it does not remove the numerical candidate or become zero.',
  ],
  summary: {
    ecosystemActiveNodes: rows.length,
    confidence: countBy(rows, 'confidence'),
    exactAxisLevelCounts,
    boundedAxisCounts,
    detailedEvidenceReviewedNodes: rows.filter(row => row.reviewMethod === 'detailed_evidence_review').length,
    retainedPilotNodesWithoutAuthoritativeAxisTrace: rows.filter(row => row.reviewMethod === 'pilot_evidence_adjudication' && row.axisBasisStatus === 'authoritative_trace_not_recorded').length,
    nodesWithNoExactAxis: rows.filter(row => row.missingCount === 3).length,
    nodesWithOneExactAxis: rows.filter(row => row.missingCount === 2).length,
    nodesWithTwoExactAxes: rows.filter(row => row.missingCount === 1).length,
    nodesWithAllThreeExactAxes: rows.filter(row => row.missingCount === 0).length,
    nodesWithAtLeastOneGap: rows.filter(row => row.missingCount > 0).length,
  },
  bySphere,
  ingestionOrder: [{
    wave: 1,
    axis: 'reach',
    nodes: boundedAxisCounts.reach,
    reason: 'This is the largest gap. A reusable, denominator-compatible spatial layer can tighten many nodes without changing the scoring method.',
  }, {
    wave: 2,
    axis: 'severity',
    nodes: boundedAxisCounts.severity,
    reason: 'Add measured condition or population loss only after the relevant ecosystem denominator and reference state are defined.',
  }, {
    wave: 3,
    axis: 'persistence',
    nodes: boundedAxisCounts.persistence,
    reason: 'Ingest recovery or lasting-consequence studies; never substitute the length of a monitoring record.',
  }],
  researchSources,
  nodes: rows,
};
inventory.inventoryDigest = digest({ summary: inventory.summary, bySphere, ingestionOrder: inventory.ingestionOrder, researchSources, nodes: rows });

const report = `# TULIP ecosystem endpoint inventory\n\nThis is an internal research map. It does not enable or change public ratings.\n\n## What the inventory found\n\n- Ecosystem-active issue nodes: **${inventory.summary.ecosystemActiveNodes}**.\n- Nodes with at least one ecosystem axis mapped to a bounded range rather than one exact TULIP level: **${inventory.summary.nodesWithAtLeastOneGap}**.\n- Exact severity-axis mappings: **${exactAxisLevelCounts.severity}**; bounded mappings: **${boundedAxisCounts.severity}**.\n- Exact reach-axis mappings: **${exactAxisLevelCounts.reach}**; bounded mappings: **${boundedAxisCounts.reach}**.\n- Exact persistence-axis mappings: **${exactAxisLevelCounts.persistence}**; bounded mappings: **${boundedAxisCounts.persistence}**.\n- Nodes with all three ecosystem axes mapped to one exact level: **${inventory.summary.nodesWithAllThreeExactAxes}**.\n- Ecosystem nodes already given a source-specific detailed review: **${inventory.summary.detailedEvidenceReviewedNodes}**.\n\nAn axis being bounded does not mean it has no evidence. It means the available measurement, denominator or conversion supports a range of plausible TULIP levels rather than one exact level.\n\n## Why more sources alone will not fix this\n\nThe missing item is usually a specific denominator or endpoint: what share of the relevant ecosystem is affected, how much condition or population was lost, or how long the consequence lasts or takes to recover. A paper showing that a pressure exists does not answer those questions.\n\n## Ingestion order\n\n${inventory.ingestionOrder.map(item => `${item.wave}. **${item.axis}** — ${item.nodes} nodes. ${item.reason}`).join('\n')}\n\n## Reusable source candidates\n\n${researchSources.map(source => `- **${source.id}** — ${source.use} ${source.limitation}${source.licence ? ` Licence: ${source.licence}` : ''}`).join('\n')}\n\n## Scope by sphere\n\n| Sphere | Nodes | Bounded severity | Bounded reach | Bounded persistence |\n|---|---:|---:|---:|---:|\n${bySphere.map(row => `| ${row.sphere} | ${row.nodes} | ${row.missingSeverity} | ${row.missingReach} | ${row.missingPersistence} |`).join('\n')}\n\n## Non-negotiable checks\n\n${inventory.methodGuard.map(rule => `- ${rule}`).join('\n')}\n`;
const completeReport = report.replace(
  '\n\nAn axis being bounded does not mean it has no evidence.',
  `\n- Retained pilot ecosystem nodes without an authoritative per-axis trace: **${inventory.summary.retainedPilotNodesWithoutAuthoritativeAxisTrace}**. Their rejected blind comparison is kept for audit, but is not counted as evidence for the retained rating.\n\nAn axis being bounded does not mean it has no evidence.`,
);

const csv = [
  ['Node ID', 'Node', 'Sphere', 'Grade', 'Value', 'Confidence', 'Source track', 'Severity exact level', 'Reach exact level', 'Persistence exact level', 'Bounded axes'],
  ...rows.map(row => [row.nodeId, row.name, row.sphere, row.grade, row.value, row.confidence, row.sourceTrack, row.anchored.severity, row.anchored.reach, row.anchored.persistence, row.missingAxes.join('; ')]),
].map(columns => columns.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n') + '\n';

await Promise.all([
  writeFile(resolve(outDir, 'internal-ecosystem-endpoint-inventory.json'), JSON.stringify(inventory, null, 2) + '\n'),
  writeFile(resolve(outDir, 'internal-ecosystem-endpoint-inventory.csv'), csv),
  writeFile(resolve(outDir, 'internal-ecosystem-endpoint-inventory-report.md'), completeReport),
]);

console.log(JSON.stringify({ summary: inventory.summary, bySphere, inventoryDigest: inventory.inventoryDigest }, null, 2));
