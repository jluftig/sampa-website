import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api';
import { useAuth } from '../lib/AuthContext';
import { listPolicyDocuments } from '../data/policyDocuments';
import { shapePolicyImpact } from '../lib/policyImpact';

function formatCount(value) {
  if (value == null) return '—';
  return Number(value).toLocaleString('en-US');
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-primary/10 bg-white px-4 py-3">
      <div className="text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-1">
        {label}
      </div>
      <div className="text-3xl font-drama font-bold leading-none">{value}</div>
    </div>
  );
}

export default function BoardNumbers({ stats: providedStats, showDashboardLink } = {}) {
  const { canViewBoardDashboard } = useAuth();
  const linkToDashboard = showDashboardLink ?? canViewBoardDashboard;
  const [stats, setStats] = useState(providedStats || null);
  const [error, setError] = useState(null);
  const policyComments = useMemo(
    () => shapePolicyImpact(listPolicyDocuments()).total,
    [],
  );

  useEffect(() => {
    if (providedStats) return undefined;
    let active = true;
    apiGet('/api/newsletter-stats?section=board-numbers')
      .then((data) => {
        if (active) setStats(data);
      })
      .catch((err) => {
        if (active) setError(err);
      });
    return () => {
      active = false;
    };
  }, [providedStats]);

  return (
    <section className="mb-10 max-w-4xl" aria-label="SAMPA by the numbers">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
        <h2 className="text-xl font-drama font-bold">SAMPA by the numbers</h2>
        {linkToDashboard && (
          <Link to="/board/dashboard" className="text-primary-text font-data text-sm font-semibold hover:underline">
            Board dashboard
          </Link>
        )}
      </div>
      {error && (
        <p className="text-text/60 text-sm">Couldn&apos;t load member numbers right now.</p>
      )}
      {!error && !stats && (
        <p className="text-text/50 font-data text-sm">Loading…</p>
      )}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Active members" value={formatCount(stats.activeMembers)} />
          <Stat label="Weekly subscribers" value={formatCount(stats.weekly?.subscribers)} />
          <Stat label="Daily subscribers" value={formatCount(stats.daily?.subscribers)} />
          <Stat label="Policy comments filed" value={formatCount(policyComments)} />
        </div>
      )}
    </section>
  );
}
