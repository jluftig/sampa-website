import { json } from './clients.js';
import { brevoGet } from './brevo-readonly.js';
import { brevoConfigFromEnv } from '../../src/lib/newsletterStats.js';
import { buildSnapshotRows, upsertSubscriberSnapshots } from './subscriberSnapshots.js';

function snapshotJson(body, status = 200) {
  return json(body, status, { 'cache-control': 'private, no-store' });
}

async function readList(get, apiKey, listId) {
  const payload = await get(apiKey, `/contacts/lists/${listId}`);
  return { listId, payload };
}

export function cronAuthorized(request, env) {
  const secret = env?.CRON_SECRET || '';
  if (!secret) return 'missing';
  const header = request.headers.get('authorization') || '';
  return header === `Bearer ${secret}` ? 'ok' : 'rejected';
}

export async function handleSubscriberSnapshot(request, deps = {}) {
  const env = deps.env || process.env;
  const auth = cronAuthorized(request, env);
  if (auth === 'missing') {
    return snapshotJson({
      error: 'not_configured',
      message: 'CRON_SECRET is not set.',
    }, 503);
  }
  if (auth !== 'ok') return snapshotJson({ error: 'Not authorized' }, 401);

  const cfg = brevoConfigFromEnv(env);
  if (!cfg.configured) {
    return snapshotJson({
      error: 'not_configured',
      message: 'Newsletter stats not configured.',
    }, 503);
  }

  const get = deps.brevoGet || brevoGet;
  const now = deps.now || new Date();
  const upsert = deps.upsertSnapshots || upsertSubscriberSnapshots;

  try {
    const lists = await Promise.all([
      readList(get, cfg.apiKey, cfg.listId),
      readList(get, cfg.apiKey, cfg.dailyListId),
    ]);
    const rows = buildSnapshotRows(now, lists);
    await upsert(rows);
    return snapshotJson({
      ok: true,
      date: rows[0]?.snapshot_date || null,
      snapshots: rows,
    });
  } catch (err) {
    console.error('subscriber-snapshot:', err?.status || err?.message || err);
    return snapshotJson({
      error: 'snapshot_error',
      message: 'Could not save subscriber snapshots right now.',
    }, 502);
  }
}
