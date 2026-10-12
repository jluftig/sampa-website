import { boardNavItem } from './boardNav.js';
import { isActiveMemberAccess, isActiveMemberProfile, isEditorProfile } from './memberHome.js';

export function showMySampa({ loading, user, profile } = {}) {
  return !loading && !!user && !!profile;
}

export function mySampaItems(viewer = {}) {
  if (!showMySampa(viewer)) return [];
  const profile = viewer.profile;
  const items = [{ id: 'account', label: 'My account', to: '/dashboard' }];
  if (isActiveMemberAccess(profile)) {
    items.push({ id: 'directory', label: 'Directory', to: '/members' });
  }
  const board = boardNavItem({ phase: 'signed-in', profile });
  if (board) items.push({ id: 'board', label: board.label, to: board.to });
  if (isEditorProfile(profile)) {
    items.push({ id: 'editor', label: 'Editor', to: '/editor' });
  }
  items.push({ id: 'sign-out', label: 'Sign out', action: 'sign-out' });
  return items;
}

export function joinCta(viewer = {}) {
  if (!showMySampa(viewer)) return { label: 'Join', to: '/join' };
  const profile = viewer.profile;
  if (isActiveMemberProfile(profile) || isEditorProfile(profile)) return null;
  if (profile.membership_status === 'past_due') return { label: 'Renew', to: '/dashboard' };
  if (profile.membership_status === 'canceled') return { label: 'Renew', to: '/join' };
  return { label: 'Join', to: '/join' };
}
