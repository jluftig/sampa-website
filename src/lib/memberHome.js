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

// Only follow in-app paths — never an absolute URL from the query string.
export function safeNext(raw) {
  return raw && raw.startsWith('/') && !raw.startsWith('//') ? raw : null;
}

// Honor an explicit next (checkout, news, /dashboard, /editor/members, …).
// Member Login itself uses /login with no next so officers land on /editor.
export function postAuthPath(profile, rawNext) {
  const requested = safeNext(rawNext);
  if (requested) return requested;
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
