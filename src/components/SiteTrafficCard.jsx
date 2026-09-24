import React, { useEffect, useState } from 'react';
import { Activity, Mail } from 'lucide-react';
import { apiGet } from '../lib/api';
import { shouldRequestTraffic, TRACKING_STARTED_NOTE, TRAFFIC_RANGES } from '../lib/siteTraffic';
import MiniLineChart from './MiniLineChart';

function formatCount(n) {
  return Number(n || 0).toLocaleString('en-US');
}

function formatRate(rate) {
  if (rate == null || Number.isNaN(Number(rate))) return '—';
  return `${Number(rate).toFixed(1)}%`;
}

function formatWhen(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function shortDay(isoDate) {
  const [, month, day] = String(isoDate).split('-');
  if (!month || !day) return isoDate;
  return `${Number(month)}/${Number(day)}`;
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

export function SiteTrafficPanel({ range, onRangeChange, loading, error, stats }) {
  const notConfigured = error?.code === 'not_configured' || error?.status === 503;
  const series = stats?.series || [];
  const hasSeries = series.some((point) => point.visitors || point.pageviews);

  return (
    <section className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-text" aria-hidden="true" />
            Site traffic
          </h2>
          <p className="text-text/50 text-xs mt-1 max-w-xl">
            Aggregate visitors and pageviews for addictionpas.org. Same access
            as the member roster — no individual visitors.
          </p>
        </div>
        <div
          role="group"
          aria-label="Date range"
          className="flex rounded-full border border-primary/20 p-0.5"
        >
          {TRAFFIC_RANGES.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => onRangeChange?.(days)}
              className={`px-3 py-1 rounded-full text-xs font-data font-semibold uppercase tracking-wider transition-colors ${
                range === days
                  ? 'bg-primary-text text-white'
                  : 'text-text/60 hover:text-text'
              }`}
            >
              Last {days} days
            </button>
          ))}
        </div>
      </div>
      <p className="text-text/45 text-xs mb-6 max-w-xl">
        {TRACKING_STARTED_NOTE}
      </p>

      {loading && <p className="text-text/50 font-data text-sm">Loading…</p>}

      {!loading && notConfigured && (
        <p className="text-text/60 text-sm">
          Site traffic isn&apos;t configured yet. A SAMPA admin needs to add
          the Vercel Web Analytics token on Production — numbers appear after
          the next deploy.
        </p>
      )}

      {!loading && error && !notConfigured && (
        <p className="text-text/60 text-sm">
          Couldn&apos;t load site traffic right now. Try again in a minute.
        </p>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Stat label="Visitors" value={formatCount(stats.visitors)} />
            <Stat label="Pageviews" value={formatCount(stats.pageviews)} />
          </div>

          {hasSeries && (
            <div className="mb-6 text-text">
              <h3 className="text-sm font-bold mb-2">Visitors over time</h3>
              <MiniLineChart
                ariaLabel="Daily visitors and pageviews since tracking started"
                categories={series.map((point) => shortDay(point.date))}
                lines={[
                  { name: 'Visitors', color: '#0F766E', values: series.map((point) => point.visitors) },
                  { name: 'Pageviews', color: '#26A69A', values: series.map((point) => point.pageviews) },
                ]}
              />
            </div>
          )}

          {stats.empty ? (
            <p className="text-text/50 text-sm">
              No pageviews in this window yet.
            </p>
          ) : (
            <>
              <h3 className="text-sm font-bold mb-3">Top pages</h3>
              {stats.paths?.length ? (
                <ul className="divide-y divide-primary/10">
                  {stats.paths.map((row) => (
                    <li key={row.path} className="py-2.5 flex items-center justify-between gap-4 text-sm">
                      <span className="font-data text-text/80 truncate">{row.path}</span>
                      <span className="text-text/50 font-data shrink-0">
                        {formatCount(row.pageviews)} views
                        {row.visitors ? ` · ${formatCount(row.visitors)} visitors` : ''}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-text/50 text-sm">
                  Totals are in, but no path breakdown yet.
                </p>
              )}
            </>
          )}
        </>
      )}
    </section>
  );
}

export function NewsletterPanel({ loading, error, stats }) {
  const notConfigured = error?.code === 'not_configured' || error?.status === 503;
  const issues = stats?.issues || [];
  const chronological = [...issues].reverse();
  const latest = stats?.latest;

  return (
    <section className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 mb-8">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <Mail className="w-5 h-5 text-primary-text" aria-hidden="true" />
        Newsletter
      </h2>
      <p className="text-text/50 text-xs mt-1 mb-6 max-w-xl">
        SAMPA Weekly on the SAMPA Updates list. Test sends and small catch-up
        blasts are left out. Same access as the member roster.
      </p>

      {loading && <p className="text-text/50 font-data text-sm">Loading…</p>}

      {!loading && notConfigured && (
        <p className="text-text/60 text-sm">Newsletter stats not configured.</p>
      )}

      {!loading && error && !notConfigured && (
        <p className="text-text/60 text-sm">
          Couldn&apos;t load newsletter stats right now. Try again in a minute.
        </p>
      )}

      {!loading && !error && stats && (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Stat label="List size" value={formatCount(stats.subscribers)} />
            <Stat label="Latest open rate" value={formatRate(latest?.openRate)} />
          </div>

          {latest ? (
            <div className="mb-6">
              <h3 className="text-sm font-bold">{latest.name}</h3>
              <p className="text-text/50 text-xs mt-1 mb-4">
                {formatWhen(latest.sentAt)}
                {stats.listName ? ` · ${stats.listName}` : ''}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <Stat label="Recipients" value={formatCount(latest.recipients)} />
                <Stat label="Delivered" value={formatCount(latest.delivered)} />
                <Stat label="Unique opens" value={formatCount(latest.uniqueOpens)} />
                <Stat label="Open rate" value={formatRate(latest.openRate)} />
                <Stat label="Unique clicks" value={formatCount(latest.uniqueClicks)} />
                <Stat label="Click rate" value={formatRate(latest.clickRate)} />
              </div>
            </div>
          ) : (
            <p className="text-text/50 text-sm mb-6">No weekly issues yet.</p>
          )}

          {chronological.length > 0 && (
            <div className="mb-6 text-text">
              <h3 className="text-sm font-bold mb-2">Open rate by issue</h3>
              <MiniLineChart
                ariaLabel="Open rate for each weekly issue"
                yMax={100}
                formatY={(value) => `${Math.round(value)}%`}
                categories={chronological.map((issue) => shortDay(String(issue.sentAt || '').slice(0, 10)))}
                lines={[{
                  name: 'Open rate',
                  color: '#0F766E',
                  values: chronological.map((issue) => issue.openRate || 0),
                }]}
              />
              <h3 className="text-sm font-bold mt-4 mb-2">Recipients by issue</h3>
              <p className="text-text/45 text-xs mb-2 max-w-xl">
                Sent count at each blast. Current list size is the subscriber number above.
              </p>
              <MiniLineChart
                ariaLabel="Recipients for each weekly issue"
                categories={chronological.map((issue) => shortDay(String(issue.sentAt || '').slice(0, 10)))}
                lines={[{
                  name: 'Recipients',
                  color: '#1E2A38',
                  values: chronological.map((issue) => issue.recipients || 0),
                }]}
              />
            </div>
          )}

          {issues.length > 0 && (
            <>
              <h3 className="text-sm font-bold mb-3">Recent issues</h3>
              <ul className="divide-y divide-primary/10">
                {issues.map((issue) => (
                  <li key={issue.id} className="py-3">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="font-semibold text-sm">{issue.name}</span>
                      <span className="text-text/50 text-xs font-data">{formatWhen(issue.sentAt)}</span>
                    </div>
                    <p className="text-text/60 text-xs mt-1 font-data">
                      {formatCount(issue.recipients)} recipients
                      {' · '}
                      {formatCount(issue.delivered)} delivered
                      {' · '}
                      {formatCount(issue.uniqueOpens)} opens ({formatRate(issue.openRate)})
                      {' · '}
                      {formatCount(issue.uniqueClicks)} clicks ({formatRate(issue.clickRate)})
                    </p>
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

export default function SiteTrafficCard() {
  const [range, setRange] = useState(7);
  const [cache, setCache] = useState({});
  const [failedRange, setFailedRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newsletter, setNewsletter] = useState(null);
  const [newsletterLoading, setNewsletterLoading] = useState(true);
  const [newsletterError, setNewsletterError] = useState(null);
  const stats = cache[range] || null;

  useEffect(() => {
    if (!shouldRequestTraffic({ stats, range, failedRange })) {
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await apiGet(`/api/site-traffic?range=${range}`);
        if (!active) return;
        setCache((prev) => ({ ...prev, [range]: data }));
        setFailedRange(null);
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setFailedRange(range);
        setError(err);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [range, stats, failedRange]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await apiGet('/api/newsletter-stats');
        if (!active) return;
        setNewsletter(data);
        setNewsletterLoading(false);
      } catch (err) {
        if (!active) return;
        setNewsletterError(err);
        setNewsletterLoading(false);
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <>
      <SiteTrafficPanel
        range={range}
        onRangeChange={setRange}
        loading={loading}
        error={error}
        stats={stats}
      />
      <NewsletterPanel
        loading={newsletterLoading}
        error={newsletterError}
        stats={newsletter}
      />
    </>
  );
}
