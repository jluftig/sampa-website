import React from 'react';
import { MEMBERSHIP_TIERS, durationLabel, durationsForTier, savingsPercent, tierByKey } from '../../lib/membership';
import { checkoutBlock, membershipBanner } from '../../lib/joinFlow';

export default function JoinMembershipStep({
  profile,
  tier,
  term,
  aapa,
  autoRenew,
  onTier,
  onTerm,
  onAapa,
  onAutoRenew,
  error,
}) {
  const block = checkoutBlock(profile);
  const banner = membershipBanner(profile);
  const showAapa = !tier || ['fellow', 'sustaining', 'legacy'].includes(tier);

  return (
    <div className="space-y-6">
      {banner && (
        <p className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold">{banner}</p>
      )}
      {block === 'active_autorenew' && (
        <p className="rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm">
          You’re all set. Auto-renew is on, so this flow will not start a second subscription. You can still confirm your profile. Billing changes happen in the portal at checkout.
        </p>
      )}
      {block === 'lifetime' && (
        <p className="rounded-2xl border border-primary/20 bg-white px-4 py-3 text-sm">
          You have a lifetime membership. There’s nothing to renew.
        </p>
      )}
      {showAapa && block !== 'lifetime' && (
        <fieldset className="rounded-3xl border border-primary/15 bg-white p-4 text-center">
          <legend className="px-2 text-sm font-semibold">Are you a current AAPA member?</legend>
          <p className="mb-3 text-sm text-text/60">Honor system. We do not verify this with AAPA. You can still pick a different card.</p>
          <div className="flex flex-wrap justify-center gap-2">
            <button type="button" className={`min-h-12 rounded-full border-2 px-5 text-sm font-semibold ${aapa === true ? 'border-primary-text bg-primary-text text-white' : 'border-primary-text text-primary-text'}`} onClick={() => onAapa(true)}>Yes</button>
            <button type="button" className={`min-h-12 rounded-full border-2 px-5 text-sm font-semibold ${aapa === false ? 'border-primary-text bg-primary-text text-white' : 'border-primary-text text-primary-text'}`} onClick={() => onAapa(false)}>No</button>
          </div>
        </fieldset>
      )}
      {error && <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {MEMBERSHIP_TIERS.map((item) => {
          const selected = tier === item.key;
          const dark = selected;
          return (
            <article key={item.key} className={`rounded-3xl border p-5 ${dark ? 'border-accent bg-text text-white ring-2 ring-accent' : 'border-primary/10 bg-white'}`}>
              <h3 className="text-lg font-bold">{item.name}</h3>
              <p className={`mt-1 text-sm ${dark ? 'text-white/70' : 'text-text/60'}`}>{item.desc}</p>
              <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={`${item.name} term`}>
                {durationsForTier(item).map((duration) => {
                  const active = selected && term === duration;
                  const pct = duration !== 'lifetime' ? savingsPercent(item, duration) : 0;
                  return (
                    <button
                      key={duration}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      className={`min-h-12 rounded-full border px-3 text-xs font-semibold ${active ? 'border-accent bg-accent text-white' : dark ? 'border-white/30 text-white' : 'border-primary/20'}`}
                      onClick={() => onTerm(item.key, duration)}
                    >
                      {durationLabel(duration)}{pct > 0 ? ` · −${pct}%` : ''}
                    </button>
                  );
                })}
              </div>
              <p className="mt-4 text-3xl font-bold">
                ${term === 'lifetime' && selected ? item.lifetime : item.prices[selected ? term : 1]}
                <span className="text-base font-normal">{selected && term === 'lifetime' ? ' once' : selected && term !== 1 ? ` / ${term} yrs` : '/yr'}</span>
              </p>
              <button type="button" className={`mt-4 min-h-12 w-full rounded-full font-bold ${dark ? 'bg-white text-text' : 'border-2 border-primary-text text-primary-text'}`} onClick={() => onTier(item.key)}>
                {selected ? 'Selected' : `Choose ${item.name}`}
              </button>
            </article>
          );
        })}
      </div>
      {tier && term !== 'lifetime' && !block && (
        <label className="flex min-h-12 items-start gap-3 rounded-2xl border border-primary/10 bg-white p-4 text-sm">
          <input type="checkbox" className="mt-1" checked={autoRenew} onChange={(e) => onAutoRenew(e.target.checked)} />
          <span>
            <strong>Auto-renew</strong>
            <span className="block text-text/60">On, your membership renews at the end of the term until you cancel. Off, this payment covers the term and then ends.</span>
          </span>
        </label>
      )}
      {tierByKey(tier) && term === 'lifetime' && (
        <p className="text-sm text-text/60">Lifetime is a one-time payment. It does not auto-renew.</p>
      )}
    </div>
  );
}
