import crypto from 'node:crypto';
import http from 'node:http';
import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { watchFile, existsSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const PORT = Number(process.env.TULIP_BACKEND_PORT || 8787);
const HOST = process.env.TULIP_BACKEND_HOST || '127.0.0.1';
const CONTACT_EMAIL = process.env.TULIP_CONTACT_EMAIL || '';
const SERVER_SALT = crypto.randomBytes(24).toString('hex');
const telemetryCounts = new Map();
const contactAttempts = new Map();
const TELEMETRY_EVENTS = new Set([
  'view_opened',
  'node_selected',
  'splash_enter',
  'footprint_started',
  'footprint_completed',
  'contact_submit_success',
  'contact_submit_failure',
  'client_error'
]);

// Map of endpoints to files in the public directory
const FILE_MAP = {
  '/api/data-centers/summary': 'data-center-platform-summary.json',
  '/api/data-centers/operational': 'data-center-operational-snapshots.json',
  '/api/data-centers/electricitymaps': 'data-center-electricitymaps-us-zones.json',
  '/api/data-centers/disclosures': 'data-center-disclosures.json',
  '/api/data-centers/sources': 'data-center-sources.json',
  '/api/data-centers/facilities': 'data-center-facilities-osm.json',
  '/api/data-centers/context': 'data-center-environment-context.json',
  '/api/eia/grid-snapshot': 'eia-hourly-grid-snapshot.json',
  '/api/noaa/climate-indices': 'noaa-climate-indices-snapshot.json',
  '/api/noaa/ratpac': 'noaa-ratpac-snapshot.json',
  '/api/ghsl/snapshot': 'ghsl-country-urbanization-snapshot.json',
  '/api/climate-signals': 'climate-signal-registry.json',
  '/api/temperature/benchmarks': 'temperature-benchmarks.json',
  '/api/gcb/snapshot': 'gcb-snapshot.json',
  '/api/edgar/snapshot': 'edgar-snapshot.json',
  '/api/owid/clean-electricity': 'owid-clean-electricity-snapshot.json',
  '/api/aqueduct/snapshot': 'aqueduct-snapshot.json',
  '/api/gfw/snapshot': 'gfw-snapshot.json',
  '/api/fra/snapshot': 'fra-snapshot.json',
  '/api/soilgrids/snapshot': 'soilgrids-snapshot.json',
  '/api/edgar-food/snapshot': 'edgar-food-snapshot.json',
  '/api/water-footprint/snapshot': 'water-footprint-snapshot.json',
  '/api/exiobase/snapshot': 'exiobase-snapshot.json',
  '/api/gtnp/snapshot': 'gtnp-snapshot.json',
  '/api/grace-freshwater/snapshot': 'grace-freshwater-snapshot.json',
  '/api/freshwater/sources': 'freshwater-sources.json',
  '/api/disaster-displacement/snapshot': 'disaster-displacement-snapshot.json',
  '/api/openfema/ihp-geographic-gap': 'openfema-ihp-geographic-gap-snapshot.json',
  '/api/atcems/response-compliance': 'atcems-response-compliance-snapshot.json',
  '/api/acaps/humanitarian-access': 'acaps-humanitarian-access-snapshot.json',
  '/api/ocha/humanitarian-funding-shortfall': 'ocha-humanitarian-funding-shortfall-snapshot.json',
  '/api/undrr/mhews-status': 'undrr-mhews-status-snapshot.json',
  '/api/unep/adaptation-finance-gap': 'unep-adaptation-finance-gap-snapshot.json',
  '/api/sabin/climate-litigation-counts': 'sabin-climate-litigation-counts-snapshot.json',
  '/api/heat-health/snapshot': 'heat-health-snapshot.json',
  '/api/health/sources': 'health-sources.json',
  '/api/food-security/snapshot': 'food-security-snapshot.json',
  '/api/faostat/agriculture-snapshot': 'faostat-agriculture-snapshot.json',
  '/api/fao/fish-stock-sustainability': 'fao-fish-stock-sustainability-snapshot.json',
  '/api/eurostat/fish-landings': 'eurostat-fish-landings-snapshot.json',
  '/api/power/heat-hazards': 'power-heat-hazard-snapshot.json',
  '/api/power/monsoon-rainfall': 'power-monsoon-snapshot.json',
  '/api/unsd/material-pressure': 'unsd-material-pressure-snapshot.json',
  '/api/noaa-coops/high-tide-floods': 'noaa-coops-high-tide-flood-snapshot.json',
  '/api/who/air-pollution-burden': 'who-air-pollution-burden-snapshot.json',
  '/api/noaa/coastal-hypoxia': 'noaa-coastal-hypoxia-snapshot.json',
  '/api/world-bank/fertilizer-prices': 'world-bank-fertilizer-price-snapshot.json',
  '/api/copernicus/drought-persistence': 'copernicus-drought-persistence-snapshot.json',
  '/api/gwis/wildfire-regime': 'gwis-wildfire-regime-snapshot.json',
  '/api/epa/nrsa/freshwater-condition': 'epa-nrsa-freshwater-condition-snapshot.json',
  '/api/eia/oe417-disruptions': 'eia-oe417-disruption-snapshot.json',
  '/api/nutrient-pollution/snapshot': 'nutrient-pollution-snapshot.json',
  '/api/seagrass/snapshot': 'seagrass-support-snapshot.json',
  '/api/urban-heat-island/snapshot': 'urban-heat-island-snapshot.json',
  '/api/finance-governance/snapshot': 'finance-governance-snapshot.json',
  '/api/marine-heatwaves/snapshot': 'noaa-marine-heatwave-snapshot.json',
  '/api/ocads/catalog': 'ocads-catalog.json',
  '/api/ocads/acidification-snapshot': 'ocads-acidification-snapshot.json',
  '/api/argo/snapshot': 'argo-snapshot.json',
  '/api/coral-reef-watch/snapshot': 'coral-reef-watch-snapshot.json',
  '/api/wod/snapshot': 'wod-snapshot.json',
  '/api/noaa-gml/benchmarks': 'noaa-gml-benchmarks.json',
  '/api/noaa-gml/n2o': 'noaa-n2o-benchmarks.json',
  '/api/nsidc/sea-ice': 'nsidc-sea-ice-snapshot.json',
  '/api/firms/snapshot': 'firms-catalog.json',
  '/api/gbif/snapshot': 'gbif-occurrence-snapshot.json',
  '/api/obis/snapshot': 'obis-occurrence-snapshot.json',
  '/api/usgs-water/snapshot': 'usgs-water-snapshot.json',
  '/api/northstar/contracts': 'graph-contract-registry.json',
  '/api/northstar/metric-contracts': 'node-metric-contracts.json',
  '/api/northstar/phenomenon-candidates': 'phenomenon-promotion-registry.json',
  '/api/northstar/promoted-phenomenon-dossiers': 'promoted-phenomenon-edge-dossiers.json',
  '/api/northstar/ingestion-jobs': 'ingestion-job-registry.json',
  '/api/northstar/pipeline-lineage': 'pipeline-lineage-registry.json',
  '/api/northstar/graph-governance': 'graph-governance-registry.json',
  '/api/northstar/research-backlog': 'research-backlog.json',
  '/api/northstar/ontology-review': 'ontology-review-queue.json',
  '/api/northstar/relationship-descriptions': 'relationship-descriptions.json',
  '/api/firms/catalog': 'firms-catalog.json',
  '/api/enso/snapshot': 'enso-monitoring-snapshot.json',
  '/api/imbie/snapshot': 'imbie-snapshot.json',
  '/api/noaa/ocean-heat-content': 'noaa-ocean-heat-content-snapshot.json',
  '/api/noaa/global-mean-sea-level': 'noaa-global-mean-sea-level-snapshot.json',
  '/api/noaa/ibtracs-rapid-intensification': 'noaa-ibtracs-rapid-intensification-snapshot.json',
  '/api/socat/catalog': 'socat-catalog.json',
  '/api/mangrove-watch/snapshot': 'mangrove-watch-snapshot.json',
  '/api/source-attachments': 'node-source-attachments.json',
  '/api/tulip/sources': 'tulip-source-registry.json',
  '/api/tulip/sources/operational': 'tulip-operational-sources.json',
  '/api/tulip/urgency-scores': 'tulip-urgency-v3-scores.json',
  '/api/tulip/urgency-v2-scores': 'tulip-urgency-scores.json',
  '/api/tulip/urgency-v3-shadow-scores': 'tulip-urgency-v3-shadow-scores.json',
  '/api/tulip/urgency-v3-review-queue': 'tulip-urgency-v3-review-queue.json',
  '/api/tulip/urgency-v3-shadow-audit': 'tulip-urgency-v3-shadow-audit.json',
  '/api/earthdata/catalog': 'earthdata-catalog.json',
  '/api/grace/catalog': 'grace-catalog.json',
  '/api/power/catalog': 'power-catalog.json',
  '/api/owid/catalog': 'owid-catalog.json',
  '/api/owid/global-co2': 'owid-global-co2.json',
  '/api/api-keys': 'api-key-registry.json'
};

// In-memory cache for validated JSON payloads and response metadata.
const cache = new Map();
const watchedFilenames = new Set(Object.values(FILE_MAP));

function createStrongEtag(value) {
  return `"${crypto.createHash('sha1').update(value).digest('hex')}"`;
}

// Helper to read, validate, and cache a JSON file.
async function loadAndCacheFile(filename) {
  const filePath = path.join(PUBLIC_DIR, filename);
  try {
    const contents = await readFile(filePath, 'utf8');
    JSON.parse(contents);
    const fileStats = await stat(filePath);
    const body = Buffer.from(contents);
    const entry = {
      body,
      etag: createStrongEtag(body),
      lastModified: fileStats.mtime.toUTCString(),
      size: body.byteLength
    };
    cache.set(filename, entry);
    console.log(`[tulip-backend] Cached ${filename} (${entry.size} bytes cached)`);
    return entry;
  } catch (error) {
    console.error(`[tulip-backend] Error loading or parsing ${filename}:`, error.message);
    throw error;
  }
}

// Get the cached response entry or fallback to loading it.
async function getResponseString(filename) {
  const cached = cache.get(filename);
  if (cached !== undefined) {
    return cached;
  }
  return await loadAndCacheFile(filename);
}

// Eagerly prime the cache for all registered files
async function primeCache() {
  console.log('[tulip-backend] Priming JSON cache...');
  const filenames = [...watchedFilenames];
  const results = await Promise.allSettled(
    filenames.map(filename => loadAndCacheFile(filename))
  );
  
  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    console.warn(`[tulip-backend] Warning: ${failed.length} cache priming task(s) failed.`);
  } else {
    console.log('[tulip-backend] JSON cache primed successfully.');
  }
}

// Send standard JSON response (primarily for fallback errors and health check)
function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store'
  });
  res.end(JSON.stringify(payload, null, 2));
}

// Set up file watcher to automatically invalidate and refresh cache
const activeTimeouts = new Map();
try {
  for (const filename of watchedFilenames) {
    const filePath = path.join(PUBLIC_DIR, filename);
    watchFile(filePath, { interval: 500 }, (curr, prev) => {
      if (curr.mtimeMs === prev.mtimeMs) {
        return;
      }

      if (activeTimeouts.has(filename)) {
        clearTimeout(activeTimeouts.get(filename));
      }

      const timeout = setTimeout(async () => {
        activeTimeouts.delete(filename);
        console.log(`[tulip-backend] Public file update detected: ${filename}. Hot-reloading cache...`);
        try {
          await loadAndCacheFile(filename);
        } catch (err) {
          console.error(`[tulip-backend] Hot-reload failed for ${filename}:`, err.message);
        }
      }, 100);

      activeTimeouts.set(filename, timeout);
    });
  }
  console.log(`[tulip-backend] File watchers active for ${watchedFilenames.size} cached snapshot files`);
} catch (err) {
  console.error(`[tulip-backend] Failed to initialize file watcher:`, err.message);
}

function readBody(req, maxBytes = 16_384) {
  return new Promise((resolve, reject) => {
    let body = '';
    let receivedBytes = 0;
    req.on('data', chunk => {
      receivedBytes += chunk.length;
      if (receivedBytes > maxBytes) {
        reject(new Error('Request body too large'));
        req.destroy();
        return;
      }
      body += chunk;
    });
    req.on('end', () => resolve(body));
    req.on('error', err => reject(err));
  });
}

function requestFingerprint(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  const address = forwarded || req.socket.remoteAddress || 'unknown';
  return crypto.createHash('sha256').update(`${SERVER_SALT}:${address}`).digest('hex');
}

function contactRateLimited(req) {
  const key = requestFingerprint(req);
  const cutoff = Date.now() - 10 * 60 * 1000;
  const recent = (contactAttempts.get(key) || []).filter(timestamp => timestamp > cutoff);
  recent.push(Date.now());
  contactAttempts.set(key, recent);
  return recent.length > 3;
}

function cleanContactText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

async function forwardContactMessage(payload) {
  const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(CONTACT_EMAIL)}`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      organization: payload.organization,
      topic: payload.topic,
      message: payload.message,
      _subject: `TULIP contact · ${payload.topic}`,
      _template: 'table',
      _captcha: 'true'
    })
  });
  if (!response.ok) throw new Error(`Contact relay returned ${response.status}`);
}

function sendCachedJson(req, res, entry) {
  const requestEtag = req.headers['if-none-match'];
  const requestIfModifiedSince = req.headers['if-modified-since'];

  if (
    requestEtag === entry.etag ||
    (requestIfModifiedSince && requestIfModifiedSince === entry.lastModified)
  ) {
    res.writeHead(304, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=0, must-revalidate',
      'ETag': entry.etag,
      'Last-Modified': entry.lastModified,
      'Vary': 'Origin'
    });
    res.end();
    return;
  }

  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': entry.size,
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'ETag': entry.etag,
    'Last-Modified': entry.lastModified,
    'Vary': 'Origin'
  });
  res.end(entry.body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  // Handle CORS preflight options requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400'
    });
    return res.end();
  }

  try {
    if (url.pathname === '/api/health') {
      return sendJson(res, 200, {
        ok: true,
        service: 'tulip-data-center-backend',
        port: PORT
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/telemetry') {
      const body = JSON.parse(await readBody(req, 4096));
      if (!TELEMETRY_EVENTS.has(body?.event)) {
        return sendJson(res, 400, { error: 'Unsupported event' });
      }
      telemetryCounts.set(body.event, (telemetryCounts.get(body.event) || 0) + 1);
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      });
      return res.end();
    }

    if (req.method === 'GET' && url.pathname === '/api/telemetry/summary') {
      return sendJson(res, 200, {
        events: Object.fromEntries(telemetryCounts),
        note: 'Aggregate in-memory counts only; no persistent visitor identifiers.'
      });
    }

    if (req.method === 'POST' && url.pathname === '/api/contact') {
      if (contactRateLimited(req)) {
        return sendJson(res, 429, { error: 'Too many messages. Please try again later.' });
      }
      if (!CONTACT_EMAIL) {
        return sendJson(res, 503, { error: 'Contact delivery is not configured.' });
      }
      const body = JSON.parse(await readBody(req, 12_000));
      if (cleanContactText(body._honey, 10)) {
        return sendJson(res, 200, { ok: true });
      }
      const payload = {
        name: cleanContactText(body.name, 100),
        email: cleanContactText(body.email, 160),
        organization: cleanContactText(body.organization, 140),
        topic: cleanContactText(body.topic, 80),
        message: cleanContactText(body.message, 4000)
      };
      if (
        !payload.name ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) ||
        !payload.topic ||
        payload.message.length < 10
      ) {
        return sendJson(res, 400, { error: 'Please complete all required fields.' });
      }
      await forwardContactMessage(payload);
      return sendJson(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/save-snapshot') {
      if (process.env.TULIP_ENABLE_SNAPSHOT_WRITES !== 'true') {
        return sendJson(res, 403, { error: 'Snapshot writes are disabled.' });
      }
      const bodyText = await readBody(req, 8 * 1024 * 1024);
      const { image, filepath } = JSON.parse(bodyText);
      const resolvedFilepath = path.resolve(String(filepath || ''));
      if (!resolvedFilepath.startsWith(`${ROOT}${path.sep}`)) {
        return sendJson(res, 400, { error: 'Snapshot path must stay inside the project.' });
      }
      
      const base64Data = image.replace(/^data:image\/png;base64,/, "");
      const buffer = Buffer.from(base64Data, 'base64');
      
      const dir = path.dirname(resolvedFilepath);
      if (!existsSync(dir)) {
        await mkdir(dir, { recursive: true });
      }
      
      await writeFile(resolvedFilepath, buffer);
      console.log(`[tulip-backend] Snapshot saved successfully to ${resolvedFilepath}`);
      
      res.writeHead(200, {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(JSON.stringify({ success: true, filepath: resolvedFilepath }));
    }

    const filename = FILE_MAP[url.pathname];
    if (filename) {
      const response = await getResponseString(filename);
      sendCachedJson(req, res, response);
      return;
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    return sendJson(res, 500, {
      error: 'Backend request failed',
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

// Prime cache before listening
(async () => {
  await primeCache();
  server.listen(PORT, HOST, () => {
    console.log(`[tulip-backend] listening on http://${HOST}:${PORT}`);
  });
})();
