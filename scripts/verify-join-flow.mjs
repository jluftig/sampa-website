import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import { profileCancelAtPeriodEnd, stripeShouldForceCancelAtPeriodEnd } from '../api/_lib/autoRenew.js';
import {
  cancelAtPeriodEndFromStripe,
  subscriptionEventApplies,
  subscriptionUpdateSource,
} from '../api/_lib/subscriptionEvent.js';
import { buildCheckoutSessionParams, duplicateMembershipBlock } from '../api/_lib/checkoutSession.js';
import {
  ANNUAL_SURVEY,
  pacificCalendarYear,
  sanitizeSurveyAnswers,
  surveyIsOpen,
  surveyQuestions,
} from '../src/lib/annualSurvey.js';
import {
  checkoutBlock,
  joinCart,
  joinSearchParams,
  membershipBanner,
  membershipAapaAnswer,
  nextStepAfterProfile,
  parseJoinQuery,
  preselectedTier,
  selectedPatron,
  skipSupport,
  tapsToCheckout,
} from '../src/lib/joinFlow.js';
import {
  applyConditionalClears,
  careerStageFromTier,
  deriveCareerStage,
  emptyProfileForm,
  isValidNpi,
  profileCardsStartCollapsed,
  profileWritePatch,
  sanitizeProfileForm,
  suggestedTierForCareer,
  validateProfile,
} from '../src/lib/joinProfile.js';
import JoinStepper from '../src/components/join/JoinStepper.jsx';

process.env.STRIPE_PRICE_FELLOW_1Y = 'price_fellow_1y';
process.env.STRIPE_PRICE_FELLOW_2Y = 'price_fellow_2y';
process.env.STRIPE_PRICE_LEGACY_LIFETIME = 'price_legacy_life';

const PRIVATE_DIRECTORY_COLUMNS = [
  'home_city',
  'licensed_states',
  'addiction_pct_bucket',
  'practice_model',
  'prescribes_moud',
  'prescribes_other',
  'telehealth_states',
  'nccpa_id',
  'years_as_pa',
  'years_addiction',
  'telehealth_addiction',
  'career_stage',
];

function directoryFunctionBodies(sql) {
  const bodies = [];
  const re = /create or replace function public\.(member_directory|member_directory_profile)\b[\s\S]*?\$\$;/g;
  let match = re.exec(sql);
  while (match) {
    bodies.push(match[0]);
    match = re.exec(sql);
  }
  return bodies;
}

describe('join URL', () => {
  it('opens a bare /join on Profile', () => {
    assert.equal(parseJoinQuery('').step, 'profile');
  });

  it('keeps homepage tier, AAPA, and patron links on Membership', () => {
    const state = parseJoinQuery('?tier=fellow&aapa=1&patron=1');
    assert.equal(state.step, 'membership');
    assert.equal(state.tier, 'fellow');
    assert.equal(state.aapa, true);
    assert.equal(state.patron, true);
  });

  it('sends a canceled checkout back to Review with the no-charge flag', () => {
    const state = parseJoinQuery('?checkout=canceled&tier=sustaining');
    assert.equal(state.step, 'checkout');
    assert.equal(state.phase, 'review');
    assert.equal(state.canceled, true);
    assert.equal(state.tier, 'sustaining');
  });

  it('round-trips the step in the query string', () => {
    const state = parseJoinQuery('?step=support&tier=student&term=2&auto=0');
    assert.equal(state.step, 'support');
    assert.equal(state.term, 2);
    assert.equal(state.autoRenew, false);
    const again = parseJoinQuery(`?${joinSearchParams(state).toString()}`);
    assert.equal(again.step, 'support');
    assert.equal(again.tier, 'student');
    assert.equal(again.term, 2);
    assert.equal(again.autoRenew, false);
  });

  it('treats /renew as the same flow in renewing mode', () => {
    assert.equal(parseJoinQuery('?step=profile', { pathname: '/renew' }).mode, 'renew');
  });
});

describe('profile step', () => {
  it('suggests a tier from the role chip', () => {
    assert.equal(suggestedTierForCareer('student'), 'student');
    assert.equal(suggestedTierForCareer('pre_pa'), 'prepa');
    assert.equal(suggestedTierForCareer('other'), 'associate');
    assert.equal(suggestedTierForCareer('retired'), 'legacy');
    assert.equal(suggestedTierForCareer('practicing', true), 'fellow');
    assert.equal(suggestedTierForCareer('practicing', false), 'sustaining');
  });

  it('accepts the 10-digit NPI 1234567893 and rejects a bad check digit', () => {
    assert.equal(isValidNpi('1234567893'), true);
    assert.equal(isValidNpi('1234567890'), false);
    assert.equal(isValidNpi('123456789'), false);
  });

  it('does not block a renew confirm when career_stage was never collected', () => {
    const existing = {
      full_name: 'Ada PA',
      state: 'California',
      membership_tier: 'fellow',
      membership_status: 'active',
      aapa_member: true,
    };
    assert.equal(careerStageFromTier('fellow'), 'practicing');
    assert.equal(careerStageFromTier('prepa'), 'pre_pa');
    assert.equal(careerStageFromTier('legacy'), 'retired');
    assert.equal(careerStageFromTier(null), null);
    assert.equal(deriveCareerStage(existing), 'practicing');
    const form = emptyProfileForm(existing, 'ada@example.org');
    assert.equal(form.career_stage, 'practicing');
    const unanswered = validateProfile(
      { ...emptyProfileForm({ full_name: 'Ada PA', state: 'California' }, 'ada@example.org'), career_stage: '' },
      { renewConfirm: true },
    );
    assert.equal(unanswered.career_stage, undefined);
    assert.ok(validateProfile(
      { ...emptyProfileForm({ full_name: 'Ada PA', state: 'California' }, 'ada@example.org'), career_stage: '' },
    ).career_stage);
  });

  it('requires name, home state, and role, and AAPA only on the PA path', () => {
    const missing = validateProfile(emptyProfileForm(null, 'a@b.co'));
    assert.ok(missing.full_name);
    assert.ok(missing.state);
    assert.ok(missing.career_stage);
    const student = validateProfile({
      ...emptyProfileForm(null, 'a@b.co'),
      full_name: 'Ada Student',
      state: 'California',
      career_stage: 'student',
    });
    assert.equal(student.aapa_member, undefined);
    const pa = validateProfile({
      ...emptyProfileForm(null, 'a@b.co'),
      full_name: 'Ada PA',
      state: 'California',
      career_stage: 'practicing',
    });
    assert.ok(pa.aapa_member);
  });

  it('clears the follow-up prescribing and telehealth-state answers when the parent flips', () => {
    const cleared = applyConditionalClears({
      prescribes_moud: 'no',
      prescribes_other: ['aud'],
      telehealth_addiction: false,
      telehealth_states: ['California'],
    });
    assert.deepEqual(cleared.prescribes_other, []);
    assert.deepEqual(cleared.telehealth_states, []);
  });

  it('writes only the columns that changed, and always stamps profile_confirmed_at', () => {
    const existing = sanitizeProfileForm({
      ...emptyProfileForm({
        full_name: 'Ada PA',
        state: 'California',
        career_stage: 'practicing',
        aapa_member: true,
        phone: '4155550100',
        organizations: [],
      }, 'ada@example.org'),
      organizations: [],
    });
    const next = sanitizeProfileForm({
      ...emptyProfileForm({
        full_name: 'Ada PA',
        state: 'California',
        career_stage: 'practicing',
        aapa_member: true,
        phone: '4155550199',
        organizations: [],
      }, 'ada@example.org'),
      organizations: [],
    });
    const patch = profileWritePatch(existing, next, '2026-11-01T12:00:00.000Z');
    assert.deepEqual(Object.keys(patch).sort(), ['phone', 'profile_confirmed_at']);
    assert.equal(patch.phone, '4155550199');
    assert.equal(patch.profile_confirmed_at, '2026-11-01T12:00:00.000Z');
    assert.equal(patch.organization, undefined);
  });

  it('keeps organizations[0] denormalized onto the roster columns', () => {
    const saved = sanitizeProfileForm({
      ...emptyProfileForm(null, 'ada@example.org'),
      organizations: [{
        name: 'Bridge Clinic',
        role: 'Clinician',
        city: 'Oakland',
        state: 'California',
        practice_settings: ['bridge'],
        website: 'bridgetotreatment.org',
      }],
    });
    assert.equal(saved.organization, 'Bridge Clinic');
    assert.equal(saved.city, 'Oakland');
    assert.equal(saved.practice_setting, 'Bridge clinic');
    assert.equal(saved.organizations[0].website, 'https://bridgetotreatment.org');
    assert.equal(saved.state, null);
  });

  it('collapses a renewing member who already has a name and state', () => {
    assert.equal(profileCardsStartCollapsed({
      mode: 'renew',
      profile: { full_name: 'Ada PA', state: 'California', membership_status: 'active' },
    }), true);
    assert.equal(profileCardsStartCollapsed({
      mode: 'join',
      profile: { full_name: '', state: '' },
    }), false);
  });
});

describe('membership and checkout math', () => {
  it('itemizes Fellow for one year plus Patron as $75', () => {
    const cart = joinCart({ tier: 'fellow', term: 1, patron: true, autoRenew: true });
    assert.equal(cart.dues, 50);
    assert.equal(cart.patronAmount, 25);
    assert.equal(cart.total, 75);
    assert.equal(cart.autoRenew, true);
  });

  it('drops auto-renew on a lifetime term', () => {
    const cart = joinCart({ tier: 'legacy', term: 'lifetime', patron: false, autoRenew: true });
    assert.equal(cart.dues, 125);
    assert.equal(cart.total, 125);
    assert.equal(cart.autoRenew, false);
    assert.equal(cart.lifetime, true);
  });

  it('reaches checkout in three taps or fewer when the renewing member already has a tier', () => {
    const profile = {
      full_name: 'Ada PA',
      state: 'California',
      membership_tier: 'fellow',
      membership_status: 'active',
      aapa_member: true,
    };
    const taps = tapsToCheckout({ mode: 'renew', profile });
    assert.deepEqual(taps, ['confirm-profile', 'skip-support']);
    assert.ok(taps.length <= 3);
    const dest = nextStepAfterProfile({
      mode: 'renew',
      profile,
      form: emptyProfileForm(profile, 'ada@example.org'),
    });
    assert.equal(dest.step, 'support');
    assert.equal(dest.tier, 'fellow');
    const inferred = nextStepAfterProfile({
      mode: 'renew',
      profile: {
        full_name: 'Ada Student',
        state: 'California',
        membership_status: 'canceled',
        career_stage: 'student',
      },
      form: { career_stage: 'student', aapa_member: null },
      patron: null,
    });
    assert.equal(inferred.step, 'membership');
    assert.equal(inferred.tier, 'student');
    const noTier = tapsToCheckout({
      mode: 'renew',
      profile: { full_name: 'Ada PA', state: 'California', membership_status: 'canceled' },
    });
    assert.deepEqual(noTier, ['confirm-profile', 'continue-membership', 'skip-support']);
    assert.equal(noTier.length, 3);
    const joinSrc = readFileSync('src/pages/Join.jsx', 'utf8');
    assert.match(joinSrc, /Confirm and continue/);
    assert.doesNotMatch(joinSrc, /Looks right/);
  });

  it('keeps Patron when a Fellow+Patron member taps Confirm and continue then Skip', () => {
    const profile = {
      full_name: 'Ada PA',
      state: 'California',
      membership_tier: 'fellow',
      membership_status: 'active',
      patron: true,
      aapa_member: true,
    };
    assert.equal(parseJoinQuery('?step=profile', { pathname: '/renew' }).patron, null);
    assert.equal(selectedPatron(profile, null), true);
    const afterConfirm = nextStepAfterProfile({
      mode: 'renew',
      profile,
      form: emptyProfileForm(profile, 'ada@example.org'),
      patron: null,
    });
    assert.equal(afterConfirm.step, 'support');
    assert.equal(afterConfirm.tier, 'fellow');
    assert.equal(afterConfirm.patron, true);
    const afterSkip = skipSupport(afterConfirm);
    assert.equal(afterSkip.step, 'checkout');
    assert.equal(afterSkip.phase, 'review');
    assert.equal(afterSkip.patron, true);
    const url = joinSearchParams(afterSkip).toString();
    assert.match(url, /step=checkout/);
    assert.match(url, /tier=fellow/);
    assert.match(url, /patron=1/);
    const cart = joinCart({ tier: 'fellow', term: 1, patron: afterSkip.patron, autoRenew: true });
    assert.equal(cart.patronAmount, 25);
    assert.equal(cart.total, 75);
    const optedOut = skipSupport({ ...afterConfirm, patron: false });
    assert.equal(optedOut.patron, false);
    assert.match(joinSearchParams(optedOut).toString(), /patron=0/);
  });

  it('accepts a saved AAPA answer when the URL has a tier and no aapa param', () => {
    assert.equal(membershipAapaAnswer({
      queryAapa: null,
      formAapa: true,
      profileAapa: true,
    }), true);
    assert.equal(membershipAapaAnswer({ queryAapa: null, formAapa: null, profileAapa: null }), null);
    assert.equal(membershipAapaAnswer({ queryAapa: false, formAapa: true }), false);
  });

  it('preselects the member’s current tier', () => {
    assert.equal(preselectedTier({ membership_tier: 'fellow' }, { careerStage: 'student' }), 'fellow');
  });

  it('describes an active auto-renewing Fellow', () => {
    const text = membershipBanner({
      membership_tier: 'fellow',
      membership_status: 'active',
      renews_on: '2027-03-03T00:00:00.000Z',
      cancel_at_period_end: false,
    });
    assert.match(text, /Current: Fellow/);
    assert.match(text, /active/);
    assert.match(text, /renews 2027-03-03/);
    assert.match(text, /auto-renew on/);
  });

  it('blocks a second subscription for an active auto-renew member and allows a canceled-at-period-end renewal', () => {
    const active = {
      membership_status: 'active',
      renews_on: '2027-03-03',
      cancel_at_period_end: false,
    };
    assert.equal(checkoutBlock(active), 'active_autorenew');
    assert.equal(duplicateMembershipBlock(active), 'active_autorenew');
    assert.equal(checkoutBlock({ ...active, cancel_at_period_end: true }), null);
    assert.equal(checkoutBlock({ membership_status: 'canceled', renews_on: '2026-01-01' }), null);
    assert.equal(checkoutBlock({
      membership_status: 'active',
      renews_on: null,
      cancel_at_period_end: false,
    }), 'lifetime');
  });
});

describe('Stripe checkout session', () => {
  const base = {
    userId: 'user-1',
    email: 'ada@example.org',
    customerId: null,
    tier: 'fellow',
    duration: 1,
    origin: 'https://www.addictionpas.org',
  };

  it('leaves auto-renew on when the client omits the flag', () => {
    const { params } = buildCheckoutSessionParams({ ...base, wantPatron: true });
    assert.equal(params.mode, 'subscription');
    assert.equal(params.metadata.auto_renew, 'true');
    assert.equal(params.metadata.patron, 'true');
    assert.equal(params.subscription_data.cancel_at_period_end, undefined);
    assert.equal(params.line_items[0].price, 'price_fellow_1y');
    assert.equal(params.line_items[1].price_data.unit_amount, 2500);
    assert.equal(params.line_items[1].price_data.product_data.name, 'Patron add-on');
    assert.equal(params.success_url, 'https://www.addictionpas.org/join?step=checkout&checkout=success&session_id={CHECKOUT_SESSION_ID}');
    assert.match(params.cancel_url, /checkout=canceled/);
    assert.match(params.cancel_url, /patron=1/);
  });

  it('puts an explicit patron=0 on the cancel URL so an opt-out survives the return', () => {
    const { params } = buildCheckoutSessionParams({ ...base, wantPatron: false });
    const returned = parseJoinQuery(new URL(params.cancel_url).search);
    assert.equal(returned.patron, false);
    assert.equal(selectedPatron({ patron: true, membership_tier: 'fellow' }, returned.patron), false);
  });

  it('marks auto-renew off on the same Price and leaves cancel to the webhook', () => {
    const { params } = buildCheckoutSessionParams({ ...base, autoRenew: false, duration: 2 });
    assert.equal(params.line_items[0].price, 'price_fellow_2y');
    assert.equal(params.subscription_data.cancel_at_period_end, undefined);
    assert.equal(params.metadata.auto_renew, 'false');
    assert.equal(params.subscription_data.metadata.auto_renew, 'false');
    assert.equal(params.metadata.patron, undefined);
    assert.equal(profileCancelAtPeriodEnd({
      mode: 'subscription',
      metadata: params.metadata,
      subscriptionWillCancel: false,
    }), true);
    assert.equal(stripeShouldForceCancelAtPeriodEnd({
      mode: 'subscription',
      metadata: params.metadata,
      subscriptionWillCancel: false,
    }), true);
  });

  it('does not force-cancel a normal auto-renew subscription', () => {
    assert.equal(profileCancelAtPeriodEnd({
      mode: 'subscription',
      metadata: { auto_renew: 'true' },
      subscriptionWillCancel: false,
    }), false);
    assert.equal(stripeShouldForceCancelAtPeriodEnd({
      mode: 'subscription',
      metadata: { auto_renew: 'true' },
      subscriptionWillCancel: false,
    }), false);
  });
});

describe('annual survey', () => {
  it('stays open through the last evening of the year in Pacific time', () => {
    assert.equal(pacificCalendarYear(new Date('2027-01-01T07:30:00.000Z')), 2026);
    assert.equal(surveyIsOpen(2026, new Date('2027-01-01T07:30:00.000Z')), true);
    assert.equal(surveyIsOpen(2026, new Date('2027-01-01T08:30:00.000Z')), false);
  });

  it('keeps one answer object and drops unknown keys', () => {
    const clean = sanitizeSurveyAnswers({
      top_benefits: ['Member directory', 'Member directory', 'Not a real benefit', 'Advocacy for patient access and MOUD'],
      feedback: '  hello  ',
      confident_at_top_of_license: 'yes',
      funding_notes: 'grant',
    });
    assert.deepEqual(clean.top_benefits, [
      'Member directory',
      'Advocacy for patient access and MOUD',
    ]);
    assert.equal(clean.feedback, 'hello');
    assert.equal(clean.confident_at_top_of_license, undefined);
    assert.equal(clean.funding_notes, undefined);
  });

  it('does not ask the dropped culture-pulse or funding questions', () => {
    const blob = JSON.stringify(ANNUAL_SURVEY);
    assert.equal(surveyQuestions().some((q) => /top of license|respected as a PA|funding/i.test(q.label)), false);
    assert.doesNotMatch(blob, /top of license/i);
    assert.doesNotMatch(blob, /funding note/i);
    assert.equal(ANNUAL_SURVEY.year, 2026);
  });
});

describe('overlapping subscriptions', () => {
  it('ignores a leftover subscription once a newer membership exists', () => {
    const oldSub = { id: 'sub_old', created: 100, metadata: {}, status: 'canceled' };
    const newSub = { id: 'sub_new', created: 200, metadata: { tier: 'fellow' }, status: 'active' };
    assert.equal(subscriptionEventApplies(oldSub, [newSub]), false);
    assert.equal(subscriptionEventApplies(newSub, [oldSub]), true);
    assert.equal(subscriptionEventApplies({ id: 'sub_only', created: 1, metadata: {} }, []), true);
    assert.equal(subscriptionEventApplies({ id: 'sub_gift', created: 9, metadata: { type: 'donation' } }, []), false);
    const pastDue = { id: 'sub_new', created: 200, status: 'past_due', metadata: {} };
    assert.equal(subscriptionEventApplies(oldSub, [pastDue]), false);
    assert.equal(subscriptionEventApplies(oldSub, [], { listOk: false }), false);
    const webhook = readFileSync('api/stripe-webhook.js', 'utf8');
    assert.match(webhook, /status: 'all'/);
    assert.doesNotMatch(webhook, /list subscriptions failed/);
    assert.match(webhook, /subscription list was truncated/);
  });

  it('uses the live subscription when a stale snapshot still says auto-renew is on', () => {
    const source = subscriptionUpdateSource({
      eventSubscription: { id: 'sub_new', created: 200, cancel_at_period_end: false },
      freshSubscription: { id: 'sub_new', created: 200, cancel_at_period_end: true },
    });
    assert.equal(cancelAtPeriodEndFromStripe(source), true);
    const resumed = subscriptionUpdateSource({
      eventSubscription: { id: 'sub_new', created: 200, cancel_at_period_end: true, metadata: { auto_renew: 'false' } },
      freshSubscription: { id: 'sub_new', created: 200, cancel_at_period_end: false, metadata: { auto_renew: 'false' } },
    });
    assert.equal(cancelAtPeriodEndFromStripe(resumed), false);
  });
});

describe('directory privacy in SQL', () => {
  const sql = readFileSync('supabase/schema.sql', 'utf8');
  const migration = readFileSync('supabase/migrations/2026-11-01-join-flow-profile.sql', 'utf8');

  it('keeps private Tier A columns out of both directory RPCs', () => {
    const bodies = directoryFunctionBodies(sql);
    assert.equal(bodies.length, 2);
    for (const body of bodies) {
      for (const column of PRIVATE_DIRECTORY_COLUMNS) {
        assert.equal(body.includes(column), false, column);
      }
      assert.match(body, /primary_practice_setting/);
      assert.match(body, /focus_areas/);
      assert.match(body, /mentor_visible/);
    }
  });

  it('backfills career_stage from the dues tier and leaves unknown rows null', () => {
    for (const source of [sql, migration]) {
      assert.match(source, /when 'fellow' then 'practicing'/);
      assert.match(source, /when 'prepa' then 'pre_pa'/);
      assert.match(source, /where career_stage is null/);
    }
  });

  it('ships the same directory allowlist in the migration Josh pastes', () => {
    const bodies = directoryFunctionBodies(migration);
    assert.equal(bodies.length, 2);
    for (const column of PRIVATE_DIRECTORY_COLUMNS) {
      assert.equal(bodies.some((body) => body.includes(column)), false, column);
    }
  });
});

describe('join stepper', () => {
  it('marks the current step and leaves upcoming steps untappable', () => {
    const html = renderToStaticMarkup(createElement(JoinStepper, {
      stepId: 'membership',
      onStep: () => {},
    }));
    assert.match(html, /aria-current="step"/);
    assert.match(html, /aria-label="Profile"/);
    assert.match(html, /aria-label="Membership"/);
    assert.equal((html.match(/<button/g) || []).length, 2);
    assert.match(html, /Support/);
  });
});
