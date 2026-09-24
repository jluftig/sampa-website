import { canViewMemberRoster } from './memberRoster.js';

export function canViewPolicyWork(profile) {
  if (!profile) return false;
  return canViewMemberRoster(profile) || !!profile.is_board;
}
