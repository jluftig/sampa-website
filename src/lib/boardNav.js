import { isActiveMemberAccess } from './memberHome.js';
import { canViewBoardDashboard } from './memberRoster.js';

const MEETINGS = { id: 'meetings', label: 'Meetings & records', to: '/board' };
const DASHBOARD = { id: 'dashboard', label: 'Dashboard', to: '/board/dashboard' };

export function visibleBoardTabs(profile) {
  const tabs = [];
  if (isActiveMemberAccess(profile)) tabs.push(MEETINGS);
  if (canViewBoardDashboard(profile)) tabs.push(DASHBOARD);
  return tabs.length > 1 ? tabs : [];
}

export function boardNavItem({ phase, profile } = {}) {
  if (phase === 'signed-out') return { label: 'Board', to: '/board' };
  if (phase !== 'signed-in') return null;
  if (isActiveMemberAccess(profile)) return { label: 'Board', to: '/board' };
  if (canViewBoardDashboard(profile)) return { label: 'Board', to: '/board/dashboard' };
  return null;
}

export function boardNavPhase({ loading, user, profile } = {}) {
  if (loading) return 'loading';
  if (user && profile) return 'signed-in';
  return 'signed-out';
}
