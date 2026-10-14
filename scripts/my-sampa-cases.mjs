const user = { id: 'viewer' };

const account = { id: 'account', label: 'My account', to: '/dashboard' };
const directory = { id: 'directory', label: 'Directory', to: '/members' };
const meetings = { id: 'board', label: 'Board', to: '/board' };
const dashboard = { id: 'board', label: 'Board', to: '/board/dashboard' };
const editor = { id: 'editor', label: 'Editor', to: '/editor' };
const signOut = { id: 'sign-out', label: 'Sign out', action: 'sign-out' };

const join = { label: 'Join', to: '/join' };
const renewBilling = { label: 'Renew', to: '/dashboard' };
const renewCheckout = { label: 'Renew', to: '/join' };

export const MY_SAMPA_CASES = [
  {
    name: 'signed out',
    viewer: { loading: false, user: null, profile: null },
    items: [],
    cta: join,
    mySampa: false,
  },
  {
    name: 'loading',
    viewer: {
      loading: true,
      user,
      profile: { role: 'member', membership_status: 'active' },
    },
    items: [],
    cta: join,
    mySampa: false,
  },
  {
    name: 'half-hydrated',
    viewer: { loading: false, user, profile: null },
    items: [],
    cta: join,
    mySampa: false,
  },
  {
    name: 'no-membership',
    viewer: {
      loading: false,
      user,
      profile: { role: 'member', membership_status: null },
    },
    items: [account, signOut],
    cta: join,
    mySampa: true,
  },
  {
    name: 'active',
    viewer: {
      loading: false,
      user,
      profile: { role: 'member', membership_status: 'active' },
    },
    items: [account, directory, meetings, signOut],
    cta: null,
    mySampa: true,
  },
  {
    name: 'past_due',
    viewer: {
      loading: false,
      user,
      profile: { role: 'member', membership_status: 'past_due' },
    },
    items: [account, signOut],
    cta: renewBilling,
    mySampa: true,
  },
  {
    name: 'canceled',
    viewer: {
      loading: false,
      user,
      profile: { role: 'member', membership_status: 'canceled' },
    },
    items: [account, signOut],
    cta: renewCheckout,
    mySampa: true,
  },
  {
    name: 'editor',
    viewer: {
      loading: false,
      user,
      profile: { role: 'editor', membership_status: 'canceled' },
    },
    items: [account, directory, meetings, editor, signOut],
    cta: null,
    mySampa: true,
  },
  {
    name: 'admin',
    viewer: {
      loading: false,
      user,
      profile: { role: 'admin' },
    },
    items: [account, directory, meetings, editor, signOut],
    cta: null,
    mySampa: true,
  },
  {
    name: 'board-only',
    viewer: {
      loading: false,
      user,
      profile: { role: 'member', membership_status: 'canceled', is_board: true },
    },
    items: [account, dashboard, signOut],
    cta: renewCheckout,
    mySampa: true,
  },
  {
    name: 'chair-only',
    viewer: {
      loading: false,
      user,
      profile: { role: 'member', membership_status: null, is_committee_chair: true },
    },
    items: [account, dashboard, signOut],
    cta: join,
    mySampa: true,
  },
];
