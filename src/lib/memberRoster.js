// Who may open /editor/members (RequireMemberViewer). Site traffic uses this
// same check — one source of truth. Admins imply view-members; Board and
// Membership Committee do not (give them the View members checkbox).
export function canViewMemberRoster(profile) {
  return profile?.role === 'admin' || !!profile?.can_view_members;
}

// Stripe cash totals. No treasurer flag exists. is_board is a directory badge
// and does not grant this.
export function canViewFinance(profile) {
  return profile?.role === 'admin';
}
