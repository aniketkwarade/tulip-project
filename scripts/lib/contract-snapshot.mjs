import fs from 'node:fs/promises';
import path from 'node:path';

export async function readMetricContracts(rootDir) {
  const file = path.join(rootDir, 'public', 'node-metric-contracts.json');
  const parsed = JSON.parse(await fs.readFile(file, 'utf8'));
  return parsed.contracts || {};
}

export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'User-Agent': 'LostPlanet-Northstar/1.0 (+contract-bound snapshot ingestion)',
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${url}\n${body.slice(0, 500)}`);
  }
  return response.json();
}

export async function fetchText(url, options = {}) {
  const response = await fetch(url, { ...options, headers: { Accept: 'text/csv,text/plain;q=0.9,*/*;q=0.5', 'User-Agent': 'LostPlanet-Northstar/1.0 (+contract-bound snapshot ingestion)', ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`);
  return response.text();
}

export function parseCsv(text) {
  const rows = [];
  let row = [], field = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"' && quoted && text[index + 1] === '"') { field += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(field); field = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field); field = '';
      if (row.some(value => value !== '')) rows.push(row);
      row = [];
    } else field += char;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  const [headers = [], ...values] = rows;
  return values.map(items => Object.fromEntries(headers.map((header, index) => [header, items[index] ?? ''])));
}

export function snapshotEnvelope({
  jobId,
  source,
  request,
  contractIds,
  records,
  sourceSummary,
  caveats = []
  , contractBindings = [], cadence = null, provenance = null, uncertainty = null, failureBehavior = null,
  additional = {}
}) {
  const capturedAt = new Date().toISOString();
  return {
    version: capturedAt,
    updated_at: capturedAt.slice(0, 10),
    captured_at: capturedAt,
    snapshot_family: 'northstar_contract_bound_ingestion',
    ingestion_job_id: jobId || null,
    source,
    request,
    metric_contract_ids: contractIds,
    contract_bindings: contractBindings,
    cadence,
    provenance,
    uncertainty,
    source_summary: sourceSummary,
    ...additional,
    record_count: records.length,
    records,
    caveats,
    failure_behavior: failureBehavior || 'If refresh fails, retain the last reviewed snapshot, mark it stale, and never convert missing records to zero.'
  };
}

export async function writeSnapshot(rootDir, filename, snapshot) {
  const output = path.join(rootDir, 'public', filename);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  return output;
}
