import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { NODES } from '../src/data.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const DOCS = path.join(ROOT, 'docs');
const TARGET_SHARE = 1;

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(ROOT, relativePath), 'utf8'));
}

const [urgencyRegistry, sourceRegistry, lineageRegistry, evidenceBaseline] = await Promise.all([
  readJson('public/tulip-urgency-scores.json'),
  readJson('public/tulip-source-registry.json'),
  readJson('public/pipeline-lineage-registry.json'),
  readJson('public/tulip-evidence-hunt-baseline.json')
]);

const baselineIds = new Set(evidenceBaseline.modeled_node_ids);
const baselineNodes = NODES.filter(node => baselineIds.has(node.id));
const nodeById = new Map(NODES.map(node => [node.id, node]));
const receiptById = new Map(urgencyRegistry.receipts.map(receipt => [receipt.node_id, receipt]));
const sourceById = new Map(sourceRegistry.sources.map(source => [source.id, source]));
const activePullBySourceId = new Map(sourceRegistry.platform_pull_inventory.map(item => [item.source_id, item]));

const pipelineBindingsByNodeId = new Map();
for (const pipeline of lineageRegistry.pipelines ?? []) {
  for (const binding of pipeline.bindings ?? []) {
    if (!baselineIds.has(binding.canonical_node_id)) continue;
    const bindings = pipelineBindingsByNodeId.get(binding.canonical_node_id) ?? [];
    bindings.push({
      pipeline_id: pipeline.pipeline_id,
      source_id: pipeline.source?.id ?? null,
      metric_contract_id: binding.metric_contract_id ?? null,
      measurement_role: binding.measurement_role ?? null,
      snapshot_path: pipeline.snapshot?.path ?? null,
      snapshot_record_count: pipeline.snapshot?.record_count ?? null,
      snapshot_observed_at: pipeline.snapshot?.observed_at ?? null,
      snapshot_sha256: pipeline.snapshot?.sha256 ?? null
    });
    pipelineBindingsByNodeId.set(binding.canonical_node_id, bindings);
  }
}

const SOURCE_CAPABILITY_RULES = Object.freeze({
  edgar_global_emissions_database: {
    official_scope: 'Global anthropogenic greenhouse-gas and air-pollutant emissions by gas, country, sector and grid; annual histories extend from 1970 for current products.',
    official_url: 'https://edgar.jrc.ec.europa.eu/emissions_data_and_maps',
    allow_metric: /emission|co2|carbon dioxide|methane|nitrous oxide|sulfur dioxide|carbon monoxide|particulate|black carbon|volatile organic|air pollut/i,
    block_reason: 'EDGAR does not measure soil compaction, ecological condition, spill risk, sewer overflow or other non-emissions burdens.'
  },
  usgs_water_data_ogc_api: {
    official_scope: 'United States monitoring locations, continuous sensors, daily values, discrete field measurements and time-series metadata.',
    official_url: 'https://api.waterdata.usgs.gov/docs/ogcapi',
    allow_metric: /streamflow|discharge|river flow|water level|groundwater|stage|water quality|water temperature/i,
    block_reason: 'The OGC feed is U.S.-only and cannot establish a global urgency score by itself; it also does not measure non-water hazards or infrastructure inventories.'
  }
});

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function contractCompleteness(contract) {
  const required = ['metric_id', 'metric_name', 'unit', 'geography', 'cadence', 'observation_time_field', 'source_id', 'transformation', 'uncertainty', 'threshold_provenance', 'failure_behavior'];
  const populated = required.filter(field => typeof contract?.[field] === 'string' && contract[field].trim());
  return { populated: populated.length, required: required.length, ratio: populated.length / required.length };
}

function sourceEntitlement(node) {
  const contract = node.metric_contract ?? {};
  const rule = SOURCE_CAPABILITY_RULES[contract.source_id];
  if (!rule) return {
    status: 'requires_source_review',
    reason: 'No explicit capability rule has yet been reviewed for this source family.',
    official_scope: null,
    official_url: sourceById.get(contract.source_id)?.url ?? null
  };
  const metricText = `${contract.metric_id ?? ''} ${contract.metric_name ?? ''} ${contract.unit ?? ''}`;
  if (rule.allow_metric.test(metricText)) return {
    status: contract.source_id === 'usgs_water_data_ogc_api' ? 'regional_only' : 'source_scope_match',
    reason: contract.source_id === 'usgs_water_data_ogc_api'
      ? 'Metric fits the feed, but the U.S.-only coverage cannot serve as the global aggregation without a global companion source.'
      : 'Metric semantics fall inside the reviewed official source capability.',
    official_scope: rule.official_scope,
    official_url: rule.official_url
  };
  return {
    status: 'source_scope_mismatch',
    reason: rule.block_reason,
    official_scope: rule.official_scope,
    official_url: rule.official_url
  };
}

function scoreCandidate({ bindings, activePull, source, completeness, entitlement, sourceUrls, currentCalibration }) {
  let score = 0;
  if (bindings.length) score += 35;
  if (bindings.some(binding => Number(binding.snapshot_record_count) >= 60)) score += 15;
  else if (bindings.some(binding => Number(binding.snapshot_record_count) >= 20)) score += 10;
  else if (bindings.length) score += 5;
  if (activePull) score += 15;
  if (source?.operational_open) score += 10;
  if (source?.integration_bucket === 'operational_open') score += 8;
  if (source?.integration_bucket === 'evidence_only') score += 4;
  score += Math.round(completeness.ratio * 8);
  score += Math.min(5, sourceUrls.length);
  if (currentCalibration) score += 8;
  if (entitlement.status === 'source_scope_match') score += 12;
  if (entitlement.status === 'regional_only') score -= 8;
  if (entitlement.status === 'source_scope_mismatch') score -= 30;
  return score;
}

function promotionTrack({ bindings, activePull, entitlement }) {
  const maxRecords = Math.max(0, ...bindings.map(binding => Number(binding.snapshot_record_count) || 0));
  if (entitlement.status === 'source_scope_mismatch') return 'repair_source_contract_first';
  if (entitlement.status === 'regional_only') return 'add_global_companion_source';
  if (bindings.length && maxRecords >= 60) return 'current_data_calibration_candidate';
  if (bindings.length) return 'impact_fallback_dossier_candidate';
  if (activePull) return 'bind_existing_snapshot_or_report';
  return 'new_ingestion_or_report_snapshot';
}

const candidates = baselineNodes.map(node => {
  const receipt = receiptById.get(node.id);
  const contract = node.metric_contract ?? {};
  const source = sourceById.get(contract.source_id) ?? null;
  const activePull = activePullBySourceId.get(contract.source_id) ?? null;
  const bindings = pipelineBindingsByNodeId.get(node.id) ?? [];
  const sourceUrls = unique([...(node.source_urls ?? []), ...(node.calibration?.source_urls ?? [])]);
  const completeness = contractCompleteness(contract);
  const entitlement = sourceEntitlement(node);
  const currentCalibration = Number.isFinite(node.calibration?.metric?.current_value);
  const candidateScore = scoreCandidate({ bindings, activePull, source, completeness, entitlement, sourceUrls, currentCalibration });
  return {
    node_id: node.id,
    node_name: node.name,
    sphere: node.sphere,
    current_score: receipt.value,
    current_band: receipt.band,
    baseline_method: 'modeled',
    current_method: receipt.method,
    promoted: receipt.method !== 'modeled',
    target_method: 'current_data_or_impact_fallback',
    priority_score: candidateScore,
    promotion_track: receipt.method !== 'modeled' ? `promoted_${receipt.method}` : promotionTrack({ bindings, activePull, entitlement }),
    metric_contract: {
      metric_id: contract.metric_id ?? null,
      metric_name: contract.metric_name ?? null,
      unit: contract.unit ?? null,
      geography: contract.geography ?? null,
      cadence: contract.cadence ?? null,
      observation_time_field: contract.observation_time_field ?? null,
      source_id: contract.source_id ?? null,
      completeness
    },
    source: source ? {
      id: source.id,
      name: source.name,
      url: source.url,
      access_classification: source.access_classification,
      integration_bucket: source.integration_bucket,
      operational_open: source.operational_open,
      ingestion_mode: source.ingestion_mode,
      platform_integration: source.platform_integration ?? null
    } : null,
    source_entitlement: entitlement,
    source_urls: sourceUrls,
    active_platform_pull: activePull,
    operational_bindings: bindings,
    current_calibration_available: currentCalibration,
    evidence_requirements: {
      current_data: [
        'Current magnitude against a documented baseline',
        'Recognized threshold position or source-consistent recent momentum',
        'Global extent or a defensible global aggregation',
        'At least 60% component weight including magnitude plus threshold or momentum',
        'At least 20 complete annual or 60 monthly observations when historical percentiles replace recognized thresholds'
      ],
      impact_fallback: [
        'Quantified accumulated biophysical burden',
        'Quantified accumulated human or economic burden',
        'Quantified persistence, duration or irreversibility evidence',
        'Quantified global extent',
        'Source-backed normalization anchors and explicit missing-data behavior'
      ]
    }
  };
});

candidates.sort((left, right) => Number(right.promoted) - Number(left.promoted) || right.priority_score - left.priority_score || left.node_id.localeCompare(right.node_id));
const targetCount = Math.ceil(evidenceBaseline.modeled_node_count * TARGET_SHARE);
const targetIds = new Set(candidates.slice(0, targetCount).map(candidate => candidate.node_id));
candidates.forEach((candidate, index) => {
  candidate.target_cohort = targetIds.has(candidate.node_id);
  candidate.target_rank = candidate.target_cohort ? index + 1 : null;
  candidate.campaign_wave = !candidate.target_cohort ? 'reserve'
    : candidate.promoted ? 'complete_evidence_backed'
    : candidate.promotion_track === 'current_data_calibration_candidate' ? 'wave_1_operational_history'
      : candidate.promotion_track === 'impact_fallback_dossier_candidate' ? 'wave_2_operational_impact'
        : candidate.promotion_track === 'bind_existing_snapshot_or_report' ? 'wave_3_existing_platform_source'
          : candidate.promotion_track === 'repair_source_contract_first' || candidate.promotion_track === 'add_global_companion_source' ? 'wave_4_source_repair'
            : 'wave_5_new_ingestion';
});

const campaigns = [...candidates.filter(candidate => candidate.target_cohort).reduce((groups, candidate) => {
  const sourceId = candidate.metric_contract.source_id ?? 'source_unassigned';
  const group = groups.get(sourceId) ?? {
    source_id: sourceId,
    source_name: candidate.source?.name ?? sourceId,
    source_url: candidate.source?.url ?? candidate.source_entitlement.official_url,
    integration_bucket: candidate.source?.integration_bucket ?? 'unclassified',
    active_platform_pull: Boolean(candidate.active_platform_pull),
    target_node_count: 0,
    promoted_node_count: 0,
    operationally_bound_node_count: 0,
    current_data_candidates: 0,
    impact_candidates: 0,
    source_repair_candidates: 0,
    node_ids: []
  };
  group.target_node_count += 1;
  group.promoted_node_count += Number(candidate.promoted);
  group.operationally_bound_node_count += Number(candidate.operational_bindings.length > 0);
  group.current_data_candidates += Number(candidate.promotion_track === 'current_data_calibration_candidate');
  group.impact_candidates += Number(candidate.promotion_track === 'impact_fallback_dossier_candidate');
  group.source_repair_candidates += Number(['repair_source_contract_first', 'add_global_companion_source'].includes(candidate.promotion_track));
  group.node_ids.push(candidate.node_id);
  groups.set(sourceId, group);
  return groups;
}, new Map()).values()].sort((left, right) => right.target_node_count - left.target_node_count || left.source_id.localeCompare(right.source_id));

const countBy = (rows, field) => Object.fromEntries([...rows.reduce((counts, row) => {
  const value = row[field];
  counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}, new Map())].sort(([left], [right]) => String(left).localeCompare(String(right))));

const targetCandidates = candidates.filter(candidate => candidate.target_cohort);
const registry = {
  version: '1.0.0',
  generated_at: new Date().toISOString(),
  method_version: urgencyRegistry.method_version,
  objective: {
    modeled_nodes_at_baseline: evidenceBaseline.modeled_node_count,
    minimum_promotion_share: TARGET_SHARE,
    minimum_promotion_count: targetCount,
    target_end_state: `${targetCount} or more baseline-modeled nodes qualify for current_data or impact_fallback without weakening the v2 gates.`
  },
  baseline: {
    graph_nodes: NODES.length,
    scored_issue_nodes: urgencyRegistry.issue_node_count,
    current_data: urgencyRegistry.method_counts.current_data,
    impact_fallback: urgencyRegistry.method_counts.impact_fallback,
    modeled: urgencyRegistry.method_counts.modeled,
    baseline_nodes_promoted: candidates.filter(candidate => candidate.promoted).length,
    promotions_remaining_to_target: Math.max(0, targetCount - candidates.filter(candidate => candidate.promoted).length),
    modeled_with_operational_bindings: candidates.filter(candidate => candidate.operational_bindings.length).length,
    modeled_with_active_platform_source: candidates.filter(candidate => candidate.active_platform_pull).length,
    modeled_with_complete_metric_contract: candidates.filter(candidate => candidate.metric_contract.completeness.ratio === 1).length
  },
  target_cohort_summary: {
    target_nodes: targetCandidates.length,
    promoted_nodes: targetCandidates.filter(candidate => candidate.promoted).length,
    promotions_remaining: Math.max(0, targetCount - targetCandidates.filter(candidate => candidate.promoted).length),
    by_wave: countBy(targetCandidates, 'campaign_wave'),
    by_track: countBy(targetCandidates, 'promotion_track'),
    by_sphere: countBy(targetCandidates, 'sphere'),
    source_campaigns: campaigns.length,
    operationally_bound: targetCandidates.filter(candidate => candidate.operational_bindings.length).length,
    active_platform_source: targetCandidates.filter(candidate => candidate.active_platform_pull).length,
    source_scope_mismatch: targetCandidates.filter(candidate => candidate.source_entitlement.status === 'source_scope_mismatch').length,
    regional_only: targetCandidates.filter(candidate => candidate.source_entitlement.status === 'regional_only').length
  },
  reviewed_source_capabilities: SOURCE_CAPABILITY_RULES,
  campaigns,
  target_candidates: targetCandidates,
  reserve_candidates: candidates.filter(candidate => !candidate.target_cohort)
};

const md = [];
md.push('# TULIP Evidence Hunt — Full 343-Node Promotion Target');
md.push('');
md.push(`Generated ${registry.generated_at}. The baseline contains ${candidates.length} modeled nodes; the hard target is at least ${targetCount} promotions to current data or accumulated impact.`);
md.push('');
md.push('## Baseline and target');
md.push('');
md.push('| Measure | Count |');
md.push('|---|---:|');
md.push(`| Modeled baseline | ${candidates.length} |`);
md.push(`| Minimum promotions | ${targetCount} |`);
md.push(`| Modeled with operational bindings | ${registry.baseline.modeled_with_operational_bindings} |`);
md.push(`| Modeled with an active platform source | ${registry.baseline.modeled_with_active_platform_source} |`);
md.push(`| Complete metric contracts | ${registry.baseline.modeled_with_complete_metric_contract} |`);
md.push('');
md.push('## Promotion waves');
md.push('');
md.push('| Wave | Nodes | Purpose |');
md.push('|---|---:|---|');
for (const [wave, count] of Object.entries(registry.target_cohort_summary.by_wave)) {
  md.push(`| ${wave} | ${count} | ${wave.replaceAll('_', ' ')} |`);
}
md.push('');
md.push(`## Largest source campaigns in the ${targetCount}-node cohort`);
md.push('');
md.push('| Source | Target nodes | Promoted | Bound | Current candidates | Impact candidates | Source repair |');
md.push('|---|---:|---:|---:|---:|---:|---:|');
for (const campaign of campaigns.slice(0, 30)) {
  md.push(`| ${campaign.source_id} | ${campaign.target_node_count} | ${campaign.promoted_node_count} | ${campaign.operationally_bound_node_count} | ${campaign.current_data_candidates} | ${campaign.impact_candidates} | ${campaign.source_repair_candidates} |`);
}
md.push('');
md.push('## Evidence-quality guardrails');
md.push('');
md.push('- A source link, source count, metric contract, or operational binding is not a promotion by itself.');
md.push('- Current-data promotion still requires magnitude plus threshold or momentum and at least 60% component weight.');
md.push('- Historical-percentile normalization still requires 20 complete annual or 60 monthly observations.');
md.push('- Accumulated-impact promotion still requires quantitative biophysical burden, human/economic burden, persistence, and extent.');
md.push('- U.S.-only observations cannot silently become a global score.');
md.push('- Source-family mismatches must be repaired before evidence is used.');
md.push('');
md.push('## Reviewed source boundaries');
md.push('');
md.push('- EDGAR: global emissions by gas, country, sector, and grid. It is valid for emissions metrics, not unrelated soil, ecological, spill, or infrastructure metrics.');
md.push('- USGS Water Data OGC API: U.S. monitoring locations and water observations. It needs a global companion source for a global TULIP score.');
md.push('');
md.push('The complete 206-node target cohort, evidence requirements, source campaigns, source-entitlement flags, pipeline bindings, and reserve list are in `public/tulip-evidence-hunt-registry.json`.');

await Promise.all([
  fs.writeFile(path.join(PUBLIC, 'tulip-evidence-hunt-registry.json'), `${JSON.stringify(registry, null, 2)}\n`),
  fs.writeFile(path.join(DOCS, 'tulip-evidence-hunt-plan.md'), `${md.join('\n')}\n`)
]);

console.log(JSON.stringify({
  modeled_baseline: candidates.length,
  target_count: targetCount,
  target_share: targetCount / candidates.length,
  target_summary: registry.target_cohort_summary,
  outputs: ['public/tulip-evidence-hunt-registry.json', 'docs/tulip-evidence-hunt-plan.md']
}, null, 2));
