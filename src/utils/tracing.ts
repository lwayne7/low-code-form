export type TraceEvent = {
  name: string;
  durationMs: number;
  timestamp: number;
  meta?: Record<string, unknown>;
};

const MAX_TRACE_EVENTS = 200;
let traceEvents: TraceEvent[] = [];
const listeners = new Set<() => void>();

function nowMs(): number {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function emit() {
  listeners.forEach((listener) => listener());
}

export function recordTrace(name: string, durationMs: number, meta?: Record<string, unknown>) {
  traceEvents = [
    ...traceEvents,
    {
      name,
      durationMs,
      timestamp: Date.now(),
      meta,
    },
  ].slice(-MAX_TRACE_EVENTS);
  emit();
}

export function startTrace(name: string, meta?: Record<string, unknown>) {
  const start = nowMs();
  return (extraMeta?: Record<string, unknown>) => {
    const durationMs = Math.max(0, nowMs() - start);
    recordTrace(name, durationMs, { ...meta, ...extraMeta });
  };
}

export function getTraceSnapshot(): TraceEvent[] {
  return traceEvents.slice();
}

export function subscribeTrace(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function clearTraces() {
  traceEvents = [];
  emit();
}
