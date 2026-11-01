import React from 'react';
import { Link } from 'react-router-dom';
import { PATRON_ADDON_BLURB, patronDollars } from '../../lib/membership';

export default function JoinSupportStep({ patron, term, onPatron }) {
  const dollars = patronDollars(term);
  return (
    <div className="space-y-4">
      <section className="rounded-3xl border border-primary/10 bg-white p-5">
        <h2 className="text-lg font-bold">Patron</h2>
        <label className="mt-3 flex min-h-12 items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1" checked={patron} onChange={(e) => onPatron(e.target.checked)} />
          <span>
            Patron — {PATRON_ADDON_BLURB}
            <span className="mt-1 block text-text/55">Adds ${dollars}{term === 'lifetime' ? ' once' : term === 1 ? ' for this year' : ` for this ${term}-year term`}.</span>
          </span>
        </label>
      </section>
      <p className="text-sm text-text/60">
        <Link to="/donate" className="font-semibold text-primary-text underline">Make a separate donation</Link>
        {' '}after checkout. A donation is not added to this payment.
      </p>
    </div>
  );
}
