import { supabaseAdmin } from './clients.js';

const WITH_CHAIR = 'role, is_board, is_committee_chair';
const WITHOUT_CHAIR = 'role, is_board';

export async function loadBoardDashboardProfile(userId, deps = {}) {
  const query = deps.queryProfiles || (async (columns) => {
    const admin = deps.admin || supabaseAdmin();
    return admin.from('profiles').select(columns).eq('id', userId).maybeSingle();
  });
  const first = await query(WITH_CHAIR);
  if (!first?.error) return first?.data || null;
  const message = `${first.error.message || ''} ${first.error.details || ''}`;
  if (!/is_committee_chair/i.test(message)) throw first.error;
  const second = await query(WITHOUT_CHAIR);
  if (second?.error) throw second.error;
  return second?.data || null;
}
