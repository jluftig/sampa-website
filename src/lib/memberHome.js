import { stripAuthCallbackParams } from './authSession.js';
import { canViewMemberRoster } from './memberRoster.js';

// Where a signed-in person should land after "Member Login" (header/footer)
// or after /login with no explicit next. Membership is keyed to the profile
// row for THIS auth user id — never email. Editors/admins (and anyone with
// can_edit_news) go to the editor dashboard; everyone else goes to /dashboard,
// which shows the join upsell only when that profile has no membership_status.

export function isEditorProfile(profile) {
  if (!profile) return false;
  return profile.role === 'editor' || profile.role === 'admin' || !!profile.can_edit_news;
}

export function isActiveMemberProfile(profile) {
  return profile?.membership_status === 'active';
}

export function signedInHomePath(profile) {
  return isEditorProfile(profile) ? '/editor' : '/dashboard';
}

function pathOnly(raw) {
  return String(raw || '').split('?')[0].split('#')[0];
}

export function isMemberRosterPath(path) {
  const p = pathOnly(path);
  return p === '/editor/members' || p.startsWith('/editor/members/');
}

export function isEditorAppPath(path) {
  const p = pathOnly(path);
  if (isMemberRosterPath(p)) return false;
  return p === '/editor' || p.startsWith('/editor/');
}

// Only follow in-app paths — never an absolute URL from the query string.
// Drop PKCE/magic-link params so a guard bounce cannot replay ?code= and
// never treat /login as a return-to (that is how next nests into a loop).
export function safeNext(raw) {
  if (!raw || typeof raw !== 'string') return null;
  if (!raw.startsWith('/') || raw.startsWith('//')) return null;
  const stripped = stripAuthCallbackParams(`https://www.addictionpas.org${raw}`);
  const cleaned = stripped || raw;
  if (pathOnly(cleaned) === '/login') return null;
  return cleaned;
}

// Honor an explicit next only when this profile can actually stay there.
// /editor/members is roster-gated (admin or can_view_members) — sending a
// signed-in president/editor without that flag back to the roster is how
// Login ↔ RequireMemberViewer can bounce forever if sessionUsable flickers.
export function postAuthPath(profile, rawNext) {
  const requested = safeNext(rawNext);
  if (requested) {
    if (isMemberRosterPath(requested) && !canViewMemberRoster(profile)) {
      return signedInHomePath(profile);
    }
    if (isEditorAppPath(requested) && !isEditorProfile(profile)) {
      return signedInHomePath(profile);
    }
    return requested;
  }
  return signedInHomePath(profile);
}

// OAuth / magic-link must return to a URL that can resolve the profile.
// Explicit destinations (join, a news post) go there directly; Member Login
// returns to /login so we can send editors to /editor after the profile loads.
export function oauthReturnPath(rawNext) {
  const requested = safeNext(rawNext);
  if (requested) return requested;
  return '/login';
}

// Half-hydrated: React still has user.email from a held/expired session but
// no profiles row. Treat as signed-out so Member Login goes to /login
// instead of the no-membership upsell.
export function memberLoginHref({ user, profile, loading } = {}) {
  if (loading || !user || !profile) return '/login';
  return signedInHomePath(profile);
}

export function memberLoginLabel({ user, profile, loading } = {}) {
  if (loading || !user || !profile) return 'Member Login';
  if (isEditorProfile(profile)) return 'Editor';
  return 'Dashboard';
}
