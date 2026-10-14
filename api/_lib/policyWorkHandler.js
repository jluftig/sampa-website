import { requireUser, json } from './clients.js';
import { loadBoardDashboardProfile } from './boardDashboardAccess.js';
import { canViewPolicyWork } from '../../src/lib/policyWorkAccess.js';
import { listPolicyWorkInternal } from './policyWorkInternal.js';

function policyJson(body, status = 200) {
  return json(body, status, { 'cache-control': 'private, no-store' });
}

export async function handlePolicyWork(request, deps = {}) {
  const requireViewer = deps.requireUser || requireUser;
  const loadProfile = deps.loadViewerProfile || loadBoardDashboardProfile;
  try {
    const user = await requireViewer(request);
    if (!user) return policyJson({ error: 'Sign in required' }, 401);

    const profile = await loadProfile(user.id);
    if (!canViewPolicyWork(profile)) return policyJson({ error: 'Not authorized' }, 403);

    return policyJson({ items: listPolicyWorkInternal() });
  } catch (err) {
    console.error('policy-work:', err?.message || err);
    return policyJson({
      error: 'policy_work_error',
      message: 'Could not load policy work right now.',
    }, 502);
  }
}
