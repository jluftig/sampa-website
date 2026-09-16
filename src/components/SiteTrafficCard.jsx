import React, { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { apiGet } from '../lib/api';
import { TRACKING_STARTED_NOTE, TRAFFIC_RANGES } from '../lib/siteTraffic';

function formatCount(n) {
  return Number(n || 0).toLocaleString('en-US');
}

export function SiteTrafficPanel({ range, onRangeChange, loading, error, stats }) {
  const notConfigured = error?.code === 'not_configured' || error?.status === 503;

  return (
    <section className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 mb-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-2">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-text" aria-hidden="true" />
            Site traffic
          </h2>
          <p className="text-text/50 text-xs mt-1 max-w-xl">
            Aggregate visitors and pageviews for addictionpas.org. Board and
            Membership Committee only — no individual visitors.
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
            <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-5">
              <div className="text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-1">
                Visitors
              </div>
              <div className="text-3xl font-drama font-bold">{formatCount(stats.visitors)}</div>
            </div>
            <div className="rounded-2xl border border-primary/10 bg-primary/[0.03] p-5">
              <div className="text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-1">
                Pageviews
              </div>
              <div className="text-3xl font-drama font-bold">{formatCount(stats.pageviews)}</div>
            </div>
          </div>

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

export default function SiteTrafficCard() {
  const [range, setRange] = useState(7);
  const [cache, setCache] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const stats = cache[range] || null;

  useEffect(() => {
    if (stats) {
      setLoading(false);
      setError(null);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const data = await apiGet(`/api/site-traffic?range=${range}`);
        if (!active) return;
        setCache((prev) => ({ ...prev, [range]: data }));
        setLoading(false);
      } catch (err) {
        if (!active) return;
        setError(err);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [range, stats]);

  return (
    <SiteTrafficPanel
      range={range}
      onRangeChange={setRange}
      loading={loading}
      error={error}
      stats={stats}
    />
  );
}
