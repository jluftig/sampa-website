import { requireUser, supabaseAdmin, json } from './clients.js';
import { isActiveMemberAccess } from '../../src/lib/memberHome.js';
import {
  meetingFromRow,
  memberMeeting,
  publicMeeting,
  withEffectiveStatus,
} from './boardMeetings.js';

const NO_STORE = { 'cache-control': 'private, no-store' };

export function boardAccessStatus(user, profile) {
  if (!user) return 401;
  if (!isActiveMemberAccess(profile)) return 403;
  return 200;
}

async function loadBoardProfile(userId, admin = supabaseAdmin()) {
  const { data } = await admin
    .from('profiles')
    .select('membership_status, role')
    .eq('id', userId)
    .maybeSingle();
  return data;
}

async function loadBoardMeetingsFromDb() {
  const { data, error } = await supabaseAdmin()
    .from('board_meetings')
    .select('*')
    .order('sort_index', { ascending: true });
  if (error) throw error;
  return (data || []).map(meetingFromRow);
}

export async function handleBoardMeetings(request, deps = {}) {
  const requireViewer = deps.requireUser || requireUser;
  const loadProfile = deps.loadProfile || loadBoardProfile;
  const loadMeetings = deps.loadMeetings || loadBoardMeetingsFromDb;
  const today = deps.today || new Date();
  try {
    const user = await requireViewer(request);
    const profile = user ? await loadProfile(user.id) : null;
    const access = boardAccessStatus(user, profile);
    if (access === 401) return json({ error: 'Sign in required' }, 401, NO_STORE);
    if (access === 403) return json({ error: 'Active membership required' }, 403, NO_STORE);

    const meetings = withEffectiveStatus(await loadMeetings(), today);
    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    if (slug) {
      const meeting = meetings.find((item) => item.slug === slug) || null;
      if (!meeting) return json({ error: 'Not found' }, 404, NO_STORE);
      return json({ meeting: memberMeeting(meeting, today) }, 200, NO_STORE);
    }
    return json({
      meetings: meetings.map((meeting) => publicMeeting(meeting, today)),
    }, 200, NO_STORE);
  } catch (err) {
    console.error('board-meetings:', err?.message || err);
    return json({ error: 'Could not load board meetings' }, 500, NO_STORE);
  }
}
