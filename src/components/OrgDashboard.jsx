import React, { useEffect, useState } from 'react';
import { Landmark, Users } from 'lucide-react';
import { apiGet } from '../lib/api';
import SiteTrafficCard from './SiteTrafficCard';
import MiniLineChart from './MiniLineChart';

function formatCount(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function formatMoney(cents) {
  const dollars = (Number(cents) || 0) / 100;
  return dollars.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}

function shortMonth(key) {
  const [year, month] = String(key).split('-');
  if (!year || !month) return key;
  return `${Number(month)}/${year.slice(2)}`;
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-5">
      <div className="text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-1">
        {label}
      </div>
      <div className="text-3xl font-drama font-bold">{value}</div>
    </div>
  );
}

function useRosterGet(path) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiGet(path);
        if (!active) return;
        setStats(data);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [path]);

  return { stats, loading, error };
}

export function MembershipPanel({ loading, error, stats }) {
  const series = stats?.series || [];
  const hasSeries = series.some((point) => point.active);

  return (
    <section className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 mb-8">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Users className="w-5 h-5 text-primary-text" aria-hidden="true" />
        Membership
      </h2>
      <p className="text-text/50 text-xs mt-1 mb-6 max-w-xl">
        Active headcount from each member&apos;s current term
        (renews on, minus term length). Lifetime members and active members
        with no term length are included in the latest month only. Canceled
        profiles are left out. This is not a stored monthly snapshot, and
        join, renewal, and lapse dates are not stored.
      </p>

      {loading && <p className="text-text/50 font-data text-sm">Loading…</p>}

      {!loading && error && (
        <p className="text-text/60 text-sm">
          Couldn&apos;t load membership stats right now. Try again in a minute.
        </p>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Stat label="Active now" value={formatCount(stats.activeNow)} />
            <Stat label="Latest month" value={formatCount(series[series.length - 1]?.active)} />
          </div>

          {hasSeries ? (
            <div className="mb-6 text-text">
              <h3 className="text-sm font-bold mb-2">Active members by month</h3>
              <MiniLineChart
                ariaLabel="Active members by month, derived from the current term"
                categories={series.map((point) => shortMonth(point.month))}
                lines={[{
                  name: 'Active',
                  color: '#0F766E',
                  values: series.map((point) => point.active),
                }]}
              />
            </div>
          ) : (
            <p className="text-text/50 text-sm mb-6">No active members in this window.</p>
          )}

          {stats.tiers?.length > 0 && (
            <>
              <h3 className="text-sm font-bold mb-3">Current tiers</h3>
              <ul className="divide-y divide-primary/10">
                {stats.tiers.map((row) => (
                  <li key={row.tier} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                    <span className="font-data text-text/80">{row.tier}</span>
                    <span className="text-text/50 font-data">{formatCount(row.count)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </section>
  );
}

export function FinancePanel({ loading, error, stats }) {
  const notConfigured = error?.code === 'not_configured' || error?.status === 503;
  const restricted = error?.code === 'finance_restricted';
  const series = stats?.series || [];

  return (
    <section className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 mb-8">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Landmark className="w-5 h-5 text-primary-text" aria-hidden="true" />
        Finances
      </h2>
      <p className="text-text/50 text-xs mt-1 mb-6 max-w-xl">
        Stripe cash activity for the last 12 months, including dues and
        donations that settled in Stripe. Payouts to the bank are excluded.
        Spend is not connected. There is no bookkeeping source, so bills paid
        outside Stripe are not here. Stripe fees are processing costs.
        Administrators only.
      </p>

      {loading && <p className="text-text/50 font-data text-sm">Loading…</p>}

      {!loading && restricted && (
        <p className="text-text/60 text-sm">Finance totals are limited to administrators.</p>
      )}

      {!loading && notConfigured && (
        <p className="text-text/60 text-sm">
          Finances not configured. Add STRIPE_SECRET_KEY on this Vercel
          environment (Preview and Production).
        </p>
      )}

      {!loading && error && !notConfigured && !restricted && (
        <p className="text-text/60 text-sm">
          Couldn&apos;t load finance stats right now. Try again in a minute.
        </p>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <Stat label="Revenue" value={formatMoney(stats.revenueCents)} />
            <Stat label="Stripe fees" value={formatMoney(stats.feeCents)} />
            <Stat label="Refunds" value={formatMoney(stats.refundCents)} />
            <Stat label="Net" value={formatMoney(stats.netCents)} />
          </div>
          <p className="text-text/50 text-xs mb-4">
            Spend is not connected. Add a bookkeeping integration later if org
            expenses should appear here. STRIPE_SECRET_KEY is the revenue source.
          </p>
          {stats.empty ? (
            <p className="text-text/50 text-sm">No Stripe charges in the last 12 months.</p>
          ) : (
            <div className="text-text">
              <h3 className="text-sm font-bold mb-2">Revenue by month</h3>
              <MiniLineChart
                ariaLabel="Stripe revenue by month"
                formatY={(value) => `$${Math.round(value)}`}
                categories={series.map((point) => shortMonth(point.month))}
                lines={[{
                  name: 'Revenue',
                  color: '#0F766E',
                  values: series.map((point) => (point.revenueCents || 0) / 100),
                }]}
              />
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MembershipSection() {
  const { stats, loading, error } = useRosterGet('/api/newsletter-stats?section=membership');
  return <MembershipPanel loading={loading} error={error} stats={stats} />;
}

function FinanceSection() {
  const { stats, loading, error } = useRosterGet('/api/newsletter-stats?section=finance');
  return <FinancePanel loading={loading} error={error} stats={stats} />;
}

export default function OrgDashboard() {
  return (
    <div>
      <p className="text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-4">
        Organization
      </p>
      <MembershipSection />
      <SiteTrafficCard />
      <FinanceSection />
    </div>
  );
}
