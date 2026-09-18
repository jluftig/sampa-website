// Who may open /editor/members (RequireMemberViewer). Site traffic uses this
// same check — one source of truth. Admins imply view-members; Board and
// Membership Committee do not (give them the View members checkbox).
export function canViewMemberRoster(profile) {
  return profile?.role === 'admin' || !!profile?.can_view_members;
}
