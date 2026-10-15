export function canViewPolicyWork(profile) {
  if (!profile) return false;
  return profile.role === 'admin' || !!profile.is_board;
}
