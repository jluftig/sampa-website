// Who may open /editor/members (RequireMemberViewer). Admins imply
// view-members. Board, Membership Committee, and committee chair do not.
export function canViewMemberRoster(profile) {
  return profile?.role === 'admin' || !!profile?.can_view_members;
}

// Org dashboard at /board/dashboard, including finances. Any director may
// see the financial records. Committee chairs share that gate.
export function canViewBoardDashboard(profile) {
  return profile?.role === 'admin'
    || !!profile?.is_board
    || !!profile?.is_committee_chair;
}

export function canViewFinance(profile) {
  return canViewBoardDashboard(profile);
}
