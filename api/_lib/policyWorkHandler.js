import { requireUser, json } from './clients.js';
import { loadBoardDashboardProfile } from './boardDashboardAccess.js';
import { canViewPolicyWork } from '../../src/lib/policyWorkAccess.js';

function policyJson(body, status = 200) {
  return json(body, status, { 'cache-control': 'private, no-store' });
}

export function readPolicyWorkInternal(raw) {
  if (typeof raw !== 'string' || !raw.trim()) return { ok: false, items: [] };
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, items: [] };
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return { ok: false, items: [] };
  const items = [];
  for (const [id, row] of Object.entries(data)) {
    if (!id || !row || typeof row !== 'object' || Array.isArray(row)) continue;
    const notes = {};
    if (row.notes && typeof row.notes === 'object' && !Array.isArray(row.notes)) {
      for (const [noteId, text] of Object.entries(row.notes)) {
        if (typeof text === 'string') notes[noteId] = text;
      }
    }
    items.push({
      id,
      owner: typeof row.owner === 'string' ? row.owner : '',
      submittedTo: typeof row.submittedTo === 'string' ? row.submittedTo : '',
      packetUrl: typeof row.packetUrl === 'string' && row.packetUrl ? row.packetUrl : null,
      notes,
    });
  }
  return { ok: true, items };
}

export function itemsFromPolicyWorkInternal(raw) {
  return readPolicyWorkInternal(raw).items;
}

export async function handlePolicyWork(request, deps = {}) {
  const requireViewer = deps.requireUser || requireUser;
  const loadProfile = deps.loadViewerProfile || loadBoardDashboardProfile;
  const env = deps.env || process.env;
  try {
    const user = await requireViewer(request);
    if (!user) return policyJson({ error: 'Sign in required' }, 401);

    const profile = await loadProfile(user.id);
    if (!canViewPolicyWork(profile)) return policyJson({ error: 'Not authorized' }, 403);

    const parsed = readPolicyWorkInternal(env.POLICY_WORK_INTERNAL);
    if (!parsed.ok) {
      console.warn('policy-work: POLICY_WORK_INTERNAL is missing or invalid');
      return policyJson({ items: [], internalDetailsUnavailable: true });
    }

    return policyJson({ items: parsed.items });
  } catch (err) {
    console.error('policy-work:', err?.message || err);
    return policyJson({
      error: 'policy_work_error',
      message: 'Could not load policy work right now.',
    }, 502);
  }
}
