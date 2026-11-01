// Join / renew is one state machine. The URL is the step. Checkout has its
// own Review → Payment → Confirmation track. Query params from the homepage
// (?tier=&aapa=&patron=&checkout=canceled) still land on the right step.

import {
  durationLabel,
  invoiceTotalDollars,
  isPaPathTier,
  parseAapaParam,
  parseDurationParam,
  patronDollars,
  tierAmountDollars,
  tierByKey,
} from './membership.js';
import { deriveCareerStage, suggestedTierForCareer } from './joinProfile.js';

export const JOIN_STEPS = [
  { id: 'profile', label: 'Profile' },
  { id: 'membership', label: 'Membership' },
  { id: 'support', label: 'Support' },
  { id: 'checkout', label: 'Checkout' },
];

export const CHECKOUT_PHASES = [
  { id: 'review', label: 'Review' },
  { id: 'payment', label: 'Payment' },
  { id: 'confirmation', label: 'Confirmation' },
];

const STEP_IDS = JOIN_STEPS.map((s) => s.id);

export const JOIN_DRAFT_KEY = 'sampa_join_draft';

export function stepIndex(stepId) {
  const i = STEP_IDS.indexOf(stepId);
  return i === -1 ? 0 : i;
}

export function parseJoinQuery(search, { pathname = '/join' } = {}) {
  const params = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const checkoutRaw = params.get('checkout');
  let step = params.get('step');
  if (!STEP_IDS.includes(step)) {
    if (checkoutRaw === 'success' || checkoutRaw === 'canceled' || checkoutRaw === 'payment' || checkoutRaw === 'review') {
      step = 'checkout';
    } else if (params.get('tier') || params.get('aapa') != null && params.get('aapa') !== '' || params.get('patron')) {
      step = 'membership';
    } else {
      step = 'profile';
    }
  }

  const tier = tierByKey(params.get('tier'))?.key || null;
  const term = parseDurationParam(params.get('term'), tierByKey(tier)) || 1;
  const aapa = parseAapaParam(params.get('aapa'));
  const patron = params.get('patron') === '1';
  const autoRenew = params.get('auto') === '0' ? false : true;
  const mode = pathname === '/renew' ? 'renew' : 'join';

  let phase = 'review';
  if (checkoutRaw === 'payment') phase = 'payment';
  else if (checkoutRaw === 'success') phase = 'confirmation';

  return {
    mode,
    step,
    phase,
    canceled: checkoutRaw === 'canceled',
    tier,
    term: tier ? term : 1,
    aapa,
    patron,
    autoRenew,
  };
}

const JOIN_QUERY_KEYS = ['step', 'tier', 'term', 'aapa', 'patron', 'auto', 'checkout'];

export function joinSearchParams(state, current = '') {
  const params = new URLSearchParams(typeof current === 'string' ? current.replace(/^\?/, '') : current);
  for (const key of JOIN_QUERY_KEYS) params.delete(key);
  if (state.step) params.set('step', state.step);
  if (state.tier) params.set('tier', state.tier);
  if (state.term && state.term !== 1) params.set('term', String(state.term));
  if (state.aapa === true) params.set('aapa', '1');
  if (state.aapa === false) params.set('aapa', '0');
  if (state.patron) params.set('patron', '1');
  if (state.autoRenew === false) params.set('auto', '0');
  if (state.canceled) params.set('checkout', 'canceled');
  else if (state.phase === 'payment') params.set('checkout', 'payment');
  else if (state.phase === 'confirmation') params.set('checkout', 'success');
  return params;
}

export function canOpenStep(targetId, currentId) {
  return stepIndex(targetId) <= stepIndex(currentId);
}

// Active auto-renew and lifetime members must not start a second subscription.
// A member who already turned auto-renew off can check out for the next term.
export function checkoutBlock(profile) {
  if (!profile || profile.membership_status !== 'active') return null;
  if (!profile.renews_on) return 'lifetime';
  if (!profile.cancel_at_period_end) return 'active_autorenew';
  return null;
}

export function membershipBanner(profile) {
  if (!profile?.membership_status) return null;
  const tier = tierByKey(profile.membership_tier);
  const name = tier?.name || profile.membership_tier || 'Member';
  const status = profile.membership_status.replace('_', ' ');
  let when = '';
  if (profile.membership_status === 'active' && !profile.renews_on) when = 'lifetime';
  else if (profile.renews_on) {
    const day = String(profile.renews_on).slice(0, 10);
    when = `${profile.cancel_at_period_end ? 'ends' : 'renews'} ${day}`;
  }
  const renew = profile.membership_status === 'active' && profile.renews_on
    ? (profile.cancel_at_period_end ? 'auto-renew off' : 'auto-renew on')
    : '';
  return ['Current:', name, '·', status, when && '·', when, renew && `(${renew})`]
    .filter(Boolean)
    .join(' ')
    .replace(' · · ', ' · ');
}

// Confirming a filled-in renewal skips Membership when the dues tier is already known.
// Support is still one Skip tap. A new joiner, or a renewal with no tier, stops on Membership.
export function nextStepAfterProfile({ mode, profile, form }) {
  const renewing = mode === 'renew' || Boolean(profile?.membership_status);
  const aapa = typeof form?.aapa_member === 'boolean' ? form.aapa_member : profile?.aapa_member;
  const tier = preselectedTier(profile, {
    aapa,
    careerStage: form?.career_stage || deriveCareerStage(profile),
  });
  if (renewing && tier) return { step: 'support', tier, aapa };
  return { step: 'membership', ...(tier ? { tier } : {}) };
}

// Taps from the Profile step to Checkout. Support is always one Skip.
export function tapsToCheckout({ mode, profile }) {
  const dest = nextStepAfterProfile({
    mode,
    profile,
    form: {
      career_stage: deriveCareerStage(profile),
      aapa_member: profile?.aapa_member,
    },
  });
  const taps = ['confirm-profile'];
  if (dest.step === 'membership') taps.push('continue-membership');
  taps.push('skip-support');
  return taps;
}

export function preselectedTier(profile, { aapa, careerStage } = {}) {
  if (profile?.membership_tier && tierByKey(profile.membership_tier)) return profile.membership_tier;
  return suggestedTierForCareer(careerStage, aapa) || (aapa === true ? 'fellow' : aapa === false ? 'sustaining' : null);
}

export function joinCart({ tier, term, patron, autoRenew }) {
  const tierObj = tierByKey(tier);
  const dues = tierAmountDollars(tierObj, term);
  const patronAmount = patron ? patronDollars(term) : 0;
  const total = invoiceTotalDollars(tierObj, term, patron);
  const lifetime = term === 'lifetime';
  return {
    tierKey: tierObj?.key || null,
    tierName: tierObj?.name || null,
    term,
    termLabel: tierObj ? durationLabel(term) : '',
    autoRenew: lifetime ? false : autoRenew !== false,
    lifetime,
    patron: Boolean(patron),
    dues,
    patronAmount: patron ? patronAmount : 0,
    total,
    needsAapa: Boolean(tierObj && isPaPathTier(tierObj.key)),
  };
}
