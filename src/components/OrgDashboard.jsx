import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Briefcase, Landmark, Scale, Users } from 'lucide-react';
import { apiGet } from '../lib/api';
import { supabase } from '../lib/supabaseClient';
import { listPolicyDocuments } from '../data/policyDocuments';
import { JOBS_PLACEHOLDER, shapeDatedOutput } from '../lib/educationImpact';
import { shapePolicyImpact } from '../lib/policyImpact';
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

function formatFiled(iso, yearOnly) {
  if (!iso) return 'Date not recorded';
  if (yearOnly) return `${iso.slice(0, 4)} (counted in January)`;
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day)).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function useEducationOutputs() {
  const [news, setNews] = useState({ state: 'loading' });
  const [weekly, setWeekly] = useState({ state: 'loading' });

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('posts')
        .select('id, published_at')
        .eq('status', 'published');
      if (!active) return;
      if (error) {
        setNews({ state: 'error' });
        return;
      }
      setNews({
        state: 'ready',
        series: shapeDatedOutput((data || []).map((row) => row.published_at)),
      });
    })();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiGet('/api/newsletter-stats');
        if (!active) return;
        if (!Array.isArray(data?.issues)) {
          setWeekly({ state: 'error' });
          return;
        }
        const sentAt = data.issues.map((issue) => issue.sentAt);
        setWeekly({ state: 'ready', series: shapeDatedOutput(sentAt) });
      } catch (err) {
        if (!active) return;
        setWeekly(err?.code === 'not_configured' ? { state: 'unconfigured' } : { state: 'error' });
      }
    })();
    return () => { active = false; };
  }, []);

  return { news, weekly };
}

function OutputCharts({ loading, slot, monthlyLabel, cumulativeLabel, emptyLabel, monthlyAria, cumulativeAria }) {
  if (loading || slot?.state === 'loading') {
    return <p className="text-text/50 font-data text-sm mb-6">Loading…</p>;
  }
  if (slot?.state === 'unconfigured') {
    return <p className="text-text/60 text-sm mb-6">Newsletter stats not configured.</p>;
  }
  if (slot?.state === 'error' || !slot?.series) {
    return <p className="text-text/60 text-sm mb-6">Unavailable</p>;
  }
  const series = slot.series;
  return (
    <div className="mb-6">
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Stat label="Total" value={formatCount(series.total)} />
        <Stat label="Latest month" value={formatCount(series.monthly[series.monthly.length - 1]?.count)} />
      </div>
      {series.chartsReady ? (
        <div className="text-text space-y-4">
          <div>
            <h4 className="text-sm font-bold mb-2">{monthlyLabel}</h4>
            <MiniLineChart
              ariaLabel={monthlyAria}
              categories={series.monthly.map((point) => shortMonth(point.month))}
              lines={[{ name: 'Count', color: '#0F766E', values: series.monthly.map((point) => point.count) }]}
            />
          </div>
          <div>
            <h4 className="text-sm font-bold mb-2">{cumulativeLabel}</h4>
            <MiniLineChart
              ariaLabel={cumulativeAria}
              categories={series.cumulative.map((point) => shortMonth(point.month))}
              lines={[{ name: 'Cumulative', color: '#1E2A38', values: series.cumulative.map((point) => point.total) }]}
            />
          </div>
        </div>
      ) : (
        <p className="text-text/50 text-sm">{emptyLabel}</p>
      )}
    </div>
  );
}

function PlaceholderCard({ icon: Icon, title, note }) {
  return (
    <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/[0.02] p-5">
      <h4 className="text-sm font-bold flex items-center gap-2">
        <Icon className="w-4 h-4 text-primary-text" aria-hidden="true" />
        {title}
      </h4>
      <p className="text-text/50 text-sm mt-2">{note}</p>
    </div>
  );
}

export function ImpactPanel({ stats, education }) {
  const monthly = stats?.monthly || [];
  const cumulative = stats?.cumulative || [];

  return (
    <section className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 mb-8">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Scale className="w-5 h-5 text-primary-text" aria-hidden="true" />
        Impact
      </h2>
      <p className="text-text/50 text-xs mt-1 mb-6 max-w-xl">
        What SAMPA put into the world: filings, published articles, and issues
        sent. Opens, clicks, and pageviews stay in Reach.
      </p>

      <div>
        <h3 className="text-lg font-bold mb-1">Policy</h3>
        <p className="text-text/50 text-xs mt-1 mb-6 max-w-xl">
          Filings on the public policy hub. Each item uses its submission date.
          This is the same list as /policy.
          {stats?.yearOnly
            ? ' A filing dated only by year is counted on January 1 of that year.'
            : ''}
        </p>

        {stats && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Stat label="Filed items" value={formatCount(stats.total)} />
              <Stat label="Latest month" value={formatCount(monthly[monthly.length - 1]?.count)} />
            </div>

            {stats.chartsReady ? (
              <div className="mb-6 text-text space-y-4">
                <div>
                  <h4 className="text-sm font-bold mb-2">Monthly filings</h4>
                  <MiniLineChart
                    ariaLabel="Policy items filed each month"
                    categories={monthly.map((point) => shortMonth(point.month))}
                    lines={[{
                      name: 'Filed',
                      color: '#0F766E',
                      values: monthly.map((point) => point.count),
                    }]}
                  />
                </div>
                <div>
                  <h4 className="text-sm font-bold mb-2">Cumulative filings</h4>
                  <MiniLineChart
                    ariaLabel="Running total of policy items filed"
                    categories={cumulative.map((point) => shortMonth(point.month))}
                    lines={[{
                      name: 'Cumulative',
                      color: '#1E2A38',
                      values: cumulative.map((point) => point.total),
                    }]}
                  />
                </div>
              </div>
            ) : (
              <p className="text-text/50 text-sm mb-6">
                Charts start once two dated filings are on the policy hub.
              </p>
            )}

            <h4 className="text-sm font-bold mb-3">Recent filings</h4>
            {stats.recent?.length ? (
              <ul className="divide-y divide-primary/10">
                {stats.recent.map((item) => (
                  <li key={item.slug || item.title} className="py-3">
                    <Link to={item.href} className="font-semibold text-sm text-primary-text hover:underline">
                      {item.title}
                    </Link>
                    <p className="text-text/50 text-xs mt-1 font-data">
                      {formatFiled(item.date, item.yearOnly)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text/50 text-sm">No policy filings yet.</p>
            )}
          </>
        )}
      </div>

      <div className="mt-8 pt-8 border-t border-primary/10">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary-text" aria-hidden="true" />
          Education
        </h3>
        <p className="text-text/50 text-xs mt-1 mb-6 max-w-xl">
          Published news and SAMPA Weekly issues that were sent on list 3.
          This is a count of outputs, not open rate.
        </p>
        <h4 className="text-sm font-bold mb-3">News articles published</h4>
        <OutputCharts
          slot={education?.news}
          monthlyLabel="Articles by month"
          cumulativeLabel="Cumulative articles"
          emptyLabel="Charts start once two dated articles are published."
          monthlyAria="News articles published each month"
          cumulativeAria="Running total of published news articles"
        />
        <h4 className="text-sm font-bold mb-3">Weekly issues sent</h4>
        <OutputCharts
          slot={education?.weekly}
          monthlyLabel="Issues sent by month"
          cumulativeLabel="Cumulative issues sent"
          emptyLabel="Charts start once two weekly issues have been sent."
          monthlyAria="Weekly issues sent each month"
          cumulativeAria="Running total of weekly issues sent"
        />
        <PlaceholderCard
          icon={BookOpen}
          title="CME / webinars"
          note="Coming when CME product is live"
        />
      </div>

      <div className="mt-8 pt-8 border-t border-primary/10">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary-text" aria-hidden="true" />
          Workforce
        </h3>
        <p className="text-text/50 text-xs mt-1 mb-6 max-w-xl">
          Jobs posted for clinicians. Nothing is counted here yet.
        </p>
        <PlaceholderCard
          icon={Briefcase}
          title={JOBS_PLACEHOLDER.label}
          note={JOBS_PLACEHOLDER.note}
        />
      </div>
    </section>
  );
}

function ImpactSection() {
  const stats = useMemo(() => shapePolicyImpact(listPolicyDocuments()), []);
  const education = useEducationOutputs();
  return <ImpactPanel stats={stats} education={education} />;
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
      <FinanceSection />
      <SiteTrafficCard />
      <ImpactSection />
    </div>
  );
}
