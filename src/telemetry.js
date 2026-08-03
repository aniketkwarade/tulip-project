const ALLOWED_EVENTS = new Set([
  'view_opened',
  'node_selected',
  'splash_enter',
  'footprint_started',
  'footprint_completed',
  'contact_submit_success',
  'contact_submit_failure',
  'client_error'
]);

function cleanValue(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return undefined;
  return value
    .replace(/https?:\/\/\S+/gi, '[url]')
    .replace(/[?#].*$/g, '')
    .slice(0, 160);
}

function cleanProperties(properties = {}) {
  return Object.fromEntries(
    Object.entries(properties)
      .slice(0, 12)
      .map(([key, value]) => [String(key).slice(0, 40), cleanValue(value)])
      .filter(([, value]) => value !== undefined)
  );
}

export function trackEvent(event, properties = {}) {
  if (!ALLOWED_EVENTS.has(event)) return;
  const payload = JSON.stringify({
    event,
    properties: cleanProperties(properties),
    occurredAt: new Date().toISOString()
  });

  try {
    if (navigator.sendBeacon) {
      const accepted = navigator.sendBeacon(
        '/api/telemetry',
        new Blob([payload], { type: 'application/json' })
      );
      if (accepted) return;
    }
    void fetch('/api/telemetry', {
      method: 'POST',
      credentials: 'omit',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    });
  } catch {
    // Telemetry must never interfere with the experience.
  }
}

export function initTelemetry() {
  if (window.__tulipTelemetryInitialized) return;
  window.__tulipTelemetryInitialized = true;

  window.addEventListener('error', event => {
    trackEvent('client_error', {
      kind: 'error',
      message: event?.message || 'Unknown client error'
    });
  });

  window.addEventListener('unhandledrejection', event => {
    trackEvent('client_error', {
      kind: 'unhandledrejection',
      message: event?.reason?.message || String(event?.reason || 'Unknown rejected promise')
    });
  });
}
