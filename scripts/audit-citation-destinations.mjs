import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIVE = process.argv.includes('--live');
const CONCURRENCY = 16;
const TIMEOUT_MS = 12_000;
const MAX_HTML_BYTES = 96 * 1024;

const RAW_ENDPOINT_PATTERNS = [
  /^api\./i,
  /^developer\./i,
  /^developers\./i,
  /\/(?:api|swagger|openapi)(?:\/|$)/i,
  /\/docs\/(?:services\/)?api(?:\/|$)/i,
  /\/(?:register|login|map_key)(?:\/|$)/i,
  /(?:capabilities\.xml|collections\.json)$/i
];

function classifyUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const target = `${url.hostname}${url.pathname}`;
    const disallowedPattern = RAW_ENDPOINT_PATTERNS.find(pattern => pattern.test(target));
    return {
      valid: ['http:', 'https:'].includes(url.protocol),
      reason: disallowedPattern ? 'raw_api_or_developer_surface' : null
    };
  } catch {
    return { valid: false, reason: 'invalid_url' };
  }
}

function uniqueByUrl(records) {
  return [...new Map(records.map(record => [record.url, record])).values()];
}

async function collectCitationRecords() {
  const registryPath = path.join(ROOT, 'public', 'graph-reference-registry.json');
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf8'));
  const records = [];

  for (const edge of registry.edges || []) {
    for (const locator of edge?.evidence?.source_readback?.source_locators || []) {
      if (!locator?.url) continue;
      records.push({
        url: locator.url,
        section: locator.section || '',
        surface: 'relationship_citation',
        owner: edge.key
      });
    }
  }

  return uniqueByUrl(records);
}

async function collectLiteralUiLinks() {
  const files = [
    ['index.html', await fs.readFile(path.join(ROOT, 'index.html'), 'utf8')],
    ['src/main.js', await fs.readFile(path.join(ROOT, 'src', 'main.js'), 'utf8')]
  ];
  const records = [];
  const hrefPattern = /\bhref=(?:["'])(https?:\/\/[^"'${}]+)(?:["'])/g;

  for (const [file, source] of files) {
    for (const match of source.matchAll(hrefPattern)) {
      if (/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(match[1])) continue;
      records.push({
        url: match[1],
        section: 'Literal user-visible link',
        surface: 'ui_link',
        owner: file
      });
    }
  }

  return uniqueByUrl(records);
}

async function readHtmlPrefix(response) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let result = '';

  while (size < MAX_HTML_BYTES) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    result += decoder.decode(value, { stream: true });
  }
  await reader.cancel().catch(() => {});
  return result;
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return match?.[1]?.replace(/\s+/g, ' ').trim() || '';
}

async function checkLiveOnce(record) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(record.url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'TULIP-Citation-Audit/1.0',
        accept: 'text/html,application/pdf;q=0.9,*/*;q=0.2'
      }
    });
    const contentType = response.headers.get('content-type') || '';
    const html = contentType.includes('text/html') ? await readHtmlPrefix(response) : '';
    return {
      status: response.status,
      ok: response.ok,
      final_url: response.url,
      content_type: contentType,
      title: extractTitle(html),
      outcome: response.ok
        ? 'reachable'
        : [401, 403, 406, 429].includes(response.status)
          ? 'publisher_or_bot_restricted'
          : 'broken'
    };
  } catch (error) {
    return {
      status: null,
      ok: false,
      final_url: record.url,
      content_type: '',
      title: '',
      outcome: error?.name === 'AbortError' ? 'timeout' : 'network_error',
      error: error?.message || String(error)
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function checkLive(record) {
  const attempts = [];

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const result = await checkLiveOnce(record);
    attempts.push(result);
    if (!['network_error', 'timeout'].includes(result.outcome)) {
      return { ...result, attempts: attempt };
    }
  }

  return {
    ...attempts.at(-1),
    attempts: attempts.length
  };
}

async function mapConcurrent(items, mapper, concurrency) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
  return results;
}

const citationRecords = await collectCitationRecords();
const uiRecords = await collectLiteralUiLinks();
const records = uniqueByUrl([...citationRecords, ...uiRecords]).map(record => ({
  ...record,
  structural: classifyUrl(record.url)
}));

const structurallyInvalid = records.filter(record => (
  !record.structural.valid || record.structural.reason
));
const citationLocatorsWithoutSections = citationRecords.filter(record => !record.section.trim());
const liveResults = LIVE
  ? await mapConcurrent(records, async record => ({
      ...record,
      live: await checkLive(record)
    }), CONCURRENCY)
  : records;
const broken = LIVE
  ? liveResults.filter(record => ['broken', 'network_error', 'timeout'].includes(record.live.outcome))
  : [];

const report = {
  generated_at: new Date().toISOString(),
  live: LIVE,
  summary: {
    unique_relationship_citations: citationRecords.length,
    unique_literal_ui_links: uiRecords.length,
    unique_urls_checked: records.length,
    structurally_invalid: structurallyInvalid.length,
    citation_locators_without_sections: citationLocatorsWithoutSections.length,
    reachable: LIVE ? liveResults.filter(record => record.live.outcome === 'reachable').length : null,
    publisher_or_bot_restricted: LIVE ? liveResults.filter(record => record.live.outcome === 'publisher_or_bot_restricted').length : null,
    broken_or_unreachable: LIVE ? broken.length : null
  },
  structurally_invalid: structurallyInvalid,
  citation_locators_without_sections: citationLocatorsWithoutSections,
  broken_or_unreachable: broken,
  results: LIVE ? liveResults : undefined
};

await fs.writeFile(
  path.join(ROOT, 'tmp-citation-destination-audit.json'),
  `${JSON.stringify(report, null, 2)}\n`
);

console.log(JSON.stringify(report.summary, null, 2));

if (structurallyInvalid.length || citationLocatorsWithoutSections.length || broken.length) {
  process.exitCode = 1;
}
