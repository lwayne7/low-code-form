export type TelemetryEvent = {
  name: string;
  timestamp: number;
  payload?: Record<string, unknown>;
};

const TELEMETRY_ENDPOINT = '/api/telemetry';

function isProd() {
  return typeof import.meta !== 'undefined' && Boolean(import.meta.env?.PROD);
}

export function trackEvent(name: string, payload?: Record<string, unknown>) {
  const event: TelemetryEvent = {
    name,
    timestamp: Date.now(),
    payload,
  };

  if (!isProd()) {
    console.debug('[telemetry]', event);
    return;
  }

  try {
    const body = JSON.stringify(event);
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
      return;
    }
  } catch {
    // ignore
  }

  // Fallback: best-effort fetch (avoid blocking unload)
  try {
    void fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
      keepalive: true,
    });
  } catch {
    // ignore
  }
}
