import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

async function readJson(relativePath) {
  return JSON.parse(await fs.readFile(path.join(ROOT, relativePath), 'utf8'));
}

const hunt = await readJson('public/tulip-evidence-hunt-registry.json');
const candidates = hunt.target_candidates.filter(candidate => candidate.operational_bindings.length && !candidate.promoted);

const DATE_FIELDS = [
  'observation_date', 'observation_period', 'observation_month', 'observation_year',
  'year', 'time', 'date', 'period', 'reporting_year', 'month', 'timestamp'
];
const GLOBAL_VALUES = new Set(['world', 'global', 'all countries', 'global total']);
const GEOGRAPHY_FIELDS = [
  'geography_name', 'geography', 'area', 'country_name', 'country_code', 'region',
  'who_region', 'location', 'monitoring_location_id', 'latitude', 'longitude'
];
const NON_MEASURE_PATTERNS = /(^|_)(id|code|year|month|day|latitude|longitude|rank|index_number|record_count|source_count|category_count)$/i;

function unique(values) {
  return [...new Set(values.filter(value => value !== null && value !== undefined && value !== ''))];
}

function normalizeYear(value) {
  if (Number.isInteger(value) && value >= 1800 && value <= 2200) return value;
  const match = String(value ?? '').match(/(?:18|19|20|21)\d{2}/);
  return match ? Number(match[0]) : null;
}

function normalizeMonth(value) {
  const text = String(value ?? '');
  const match = text.match(/((?:18|19|20|21)\d{2})[-/]?(0[1-9]|1[0-2])/);
  return match ? `${match[1]}-${match[2]}` : null;
}

function candidateDirection(metricName, unit) {
  const text = `${metricName ?? ''} ${unit ?? ''}`.toLowerCase();
  if (/oscillation|index units|standardized index|phase|anomal(?:y|ies)/.test(text)) {
    return { status: 'ambiguous', direction: null, reason: 'Index sign or anomaly magnitude is not inherently equivalent to urgency.' };
  }
  if (/coverage|intactness|storage|reliability|sustainability|remaining|availability/.test(text)) {
    return { status: 'review_required', direction: 'lower_may_be_worse', reason: 'The metric may be reverse-direction, but the evidence contract must confirm the interpretation.' };
  }
  if (/death|mortality|emission|loss|burden|exposure|stress|shortfall|deficit|depletion|pollution|concentration|price|displacement|insecurity|risk|flood|drought|heat|intensification|acidification|hypoxia|decline|collapse/.test(text)) {
    return { status: 'review_required', direction: 'higher_may_be_worse', reason: 'The metric wording suggests a direction, but the evidence contract must document it before promotion.' };
  }
  return { status: 'ambiguous', direction: null, reason: 'No defensible direction can be inferred from the metric contract text.' };
}

function recordsForBinding(snapshot, candidate, binding) {
  const records = Array.isArray(snapshot.records) ? snapshot.records : [];
  const metricIds = unique([
    binding.metric_contract_id,
    candidate.metric_contract.metric_id,
    ...(snapshot.contract_bindings ?? [])
      .filter(item => item.node_id === candidate.node_id)
      .map(item => item.metric_id ?? item.metric_contract_id)
  ]);
  const direct = records.filter(record => (
    record.node_id === candidate.node_id
    || metricIds.includes(record.metric_id)
    || metricIds.includes(record.metric_contract_id)
  ));
  const snapshotBindingCount = (snapshot.contract_bindings ?? []).length;
  return direct.length ? direct : snapshotBindingCount <= 1 ? records : [];
}

function profileRows(rows) {
  const dateValues = [];
  for (const row of rows) {
    for (const field of DATE_FIELDS) if (row[field] !== undefined) dateValues.push(row[field]);
  }
  const years = unique(dateValues.map(normalizeYear));
  const months = unique(dateValues.map(normalizeMonth));
  const numericDensity = new Map();
  for (const row of rows) {
    for (const [field, value] of Object.entries(row)) {
      if (!Number.isFinite(value) || NON_MEASURE_PATTERNS.test(field)) continue;
      numericDensity.set(field, (numericDensity.get(field) ?? 0) + 1);
    }
  }
  const numericFields = [...numericDensity]
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .map(([field, populated_rows]) => ({ field, populated_rows, coverage: rows.length ? populated_rows / rows.length : 0 }));
  const globalRows = rows.filter(row => Object.entries(row).some(([field, value]) => (
    GEOGRAPHY_FIELDS.includes(field) && GLOBAL_VALUES.has(String(value).toLowerCase())
  )));
  const countryValues = unique(rows.flatMap(row => [row.country_code, row.country_name]).filter(Boolean));
  const stationValues = unique(rows.map(row => row.monitoring_location_id).filter(Boolean));
  const hasCoordinates = rows.some(row => Number.isFinite(row.latitude) && Number.isFinite(row.longitude));
  return {
    matched_records: rows.length,
    distinct_years: years.length,
    first_year: years.length ? Math.min(...years) : null,
    last_year: years.length ? Math.max(...years) : null,
    distinct_months: months.length,
    global_record_count: globalRows.length,
    country_or_area_value_count: countryValues.length,
    station_count: stationValues.length,
    has_coordinates: hasCoordinates,
    numeric_fields: numericFields.slice(0, 12),
    has_numeric_measure: numericFields.length > 0
  };
}

const results = [];
for (const candidate of candidates) {
  const direction = candidateDirection(candidate.metric_contract.metric_name, candidate.metric_contract.unit);
  const bindingProfiles = [];
  for (const binding of candidate.operational_bindings) {
    let snapshot;
    try {
      snapshot = await readJson(binding.snapshot_path);
    } catch (error) {
      bindingProfiles.push({ ...binding, load_status: 'failed', error: error.message });
      continue;
    }
    const rows = recordsForBinding(snapshot, candidate, binding);
    bindingProfiles.push({
      ...binding,
      load_status: 'loaded',
      source_id: snapshot.source?.id ?? binding.source_id,
      snapshot_version: snapshot.version ?? null,
      snapshot_updated_at: snapshot.updated_at ?? snapshot.captured_at ?? null,
      snapshot_uncertainty: snapshot.uncertainty ?? null,
      snapshot_failure_behavior: snapshot.failure_behavior ?? null,
      profile: profileRows(rows)
    });
  }
  const profiles = bindingProfiles.filter(binding => binding.profile).map(binding => binding.profile);
  const historicalGate = profiles.some(profile => profile.distinct_years >= 20 || profile.distinct_months >= 60);
  const globalSignal = profiles.some(profile => profile.global_record_count > 0 || profile.country_or_area_value_count >= 100);
  const numericSignal = profiles.some(profile => profile.has_numeric_measure);
  const currentDataReadiness = !numericSignal ? 'blocked_no_numeric_measure'
    : !historicalGate ? 'blocked_history_gate'
      : !globalSignal ? 'blocked_global_aggregation'
        : direction.status === 'ambiguous' ? 'blocked_direction_ambiguous'
          : 'candidate_requires_reviewed_anchors';
  results.push({
    node_id: candidate.node_id,
    node_name: candidate.node_name,
    sphere: candidate.sphere,
    target_rank: candidate.target_rank,
    metric_contract: candidate.metric_contract,
    direction,
    binding_profiles: bindingProfiles,
    readiness: {
      numeric_signal: numericSignal,
      historical_distribution_gate: historicalGate,
      global_aggregation_signal: globalSignal,
      current_data_readiness: currentDataReadiness,
      next_action: currentDataReadiness === 'candidate_requires_reviewed_anchors'
        ? 'Review measure field, direction, latest value, global aggregation, percentile anchors and momentum window; then create a current-data receipt.'
        : currentDataReadiness === 'blocked_history_gate'
          ? 'Use a recognized threshold, extend the snapshot history, or build a four-component accumulated-impact dossier.'
          : currentDataReadiness === 'blocked_global_aggregation'
            ? 'Add a defensible global aggregate or global companion source; do not promote from regional observations alone.'
            : currentDataReadiness === 'blocked_direction_ambiguous'
              ? 'Define a source-backed urgency direction or retain modeled status.'
              : 'Repair the ingestion so a quantitative measure is retained.'
    }
  });
}

const countBy = (rows, selector) => Object.fromEntries([...rows.reduce((counts, row) => {
  const value = selector(row);
  counts.set(value, (counts.get(value) ?? 0) + 1);
  return counts;
}, new Map())].sort(([left], [right]) => String(left).localeCompare(String(right))));

const output = {
  version: '1.0.0',
  generated_at: new Date().toISOString(),
  cohort: 'operationally_bound nodes in the 206-node evidence-hunt target',
  node_count: results.length,
  summary: {
    current_data_readiness: countBy(results, row => row.readiness.current_data_readiness),
    historical_gate_pass: results.filter(row => row.readiness.historical_distribution_gate).length,
    global_aggregation_signal: results.filter(row => row.readiness.global_aggregation_signal).length,
    numeric_signal: results.filter(row => row.readiness.numeric_signal).length,
    direction_ambiguous: results.filter(row => row.direction.status === 'ambiguous').length
  },
  limitations: [
    'This profiler tests snapshot grain and candidate fields; it does not approve a score or infer normalization anchors.',
    'A high row count does not pass the historical gate unless the node-specific global series has enough distinct annual or monthly observations.',
    'Geographic breadth is a screening signal, not a completed global aggregation.',
    'Metric direction must be reviewed against the source and cannot be inferred solely from a node label.'
  ],
  nodes: results
};

await fs.writeFile(path.join(ROOT, 'public/tulip-operational-promotion-readiness.json'), `${JSON.stringify(output, null, 2)}\n`);
console.log(JSON.stringify({
  output: 'public/tulip-operational-promotion-readiness.json',
  node_count: output.node_count,
  summary: output.summary
}, null, 2));
