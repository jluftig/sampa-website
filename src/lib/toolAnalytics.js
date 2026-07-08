// Anonymous, fire-and-forget usage analytics for the clinical tools
// (tool_events table). Deliberately kept OUT of src/lib/bup/ so the clinical
// modules stay pure and Supabase-free.
//
// Privacy by design: no user id, no PII — session_id is a random per-visit
// uuid so pathways can be grouped, nothing more. Logging must NEVER break the
// tool: every call is wrapped, never awaited by callers, and a missing table
// (migration not applied yet) just means dropped events.
import { supabase } from './supabaseClient';
import { TOOL } from './bup/meta';

const SESSION_KEY = 'sampa:toolSession';
let inMemorySessionId = null;

function sessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    if (!inMemorySessionId) {
      try {
        inMemorySessionId = crypto.randomUUID();
      } catch {
        return null;
      }
    }
    return inMemorySessionId;
  }
}

function environment() {
  if (import.meta.env.MODE !== 'production') return 'development';
  const host = window.location.hostname;
  return host === 'www.addictionpas.org' || host === 'addictionpas.org' ? 'production' : 'preview';
}

// Events already sent this page load (belt to the sessionStorage suspenders
// for outcome_reached dedupe).
const sent = new Set();

export function logToolEvent({ event, outcomeKey = null, answers = null, oncePerSession = false }) {
  try {
    const sid = sessionId();
    if (!sid) return;

    if (oncePerSession) {
      const dedupeKey = `${event}:${outcomeKey ?? ''}`;
      if (sent.has(dedupeKey)) return;
      try {
        const storageKey = `sampa:toolEvent:${dedupeKey}`;
        if (sessionStorage.getItem(storageKey)) return;
        sessionStorage.setItem(storageKey, '1');
      } catch {
        /* fall back to the in-memory set alone */
      }
      sent.add(dedupeKey);
    }

    supabase
      .from('tool_events')
      .insert({
        tool: TOOL.key,
        tool_version: TOOL.version,
        session_id: sid,
        event,
        outcome_key: outcomeKey,
        answers,
        environment: environment(),
      })
      .then(
        () => {},
        () => {}
      );
  } catch {
    /* analytics must never break the tool */
  }
}
