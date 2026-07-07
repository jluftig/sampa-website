import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { tierByKey } from '../lib/membership';
import { formatDate } from '../lib/format';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const STATUS_FILTERS = [
  { key: 'all', label: 'All accounts' },
  { key: 'active', label: 'Active members' },
  { key: 'past_due', label: 'Past due' },
  { key: 'canceled', label: 'Canceled' },
  { key: 'none', label: 'No membership' },
];

const STATUS_BADGES = {
  active:   'bg-green-500/10 text-green-700',
  past_due: 'bg-amber-500/10 text-amber-700',
  canceled: 'bg-red-500/10 text-red-600',
};

// "Renews Jul 6, 2028" | "Ends Jul 6, 2028" | "Lifetime" | ""
function renewalLabel(p) {
  if (p.membership_status !== 'active') return p.renews_on ? formatDate(p.renews_on) : '';
  if (!p.renews_on) return 'Lifetime';
  return `${p.cancel_at_period_end ? 'Ends' : 'Renews'} ${formatDate(p.renews_on)}`;
}

const CSV_COLUMNS = [
  ['Name', (p) => p.full_name],
  ['Email', (p) => p.email],
  ['Role', (p) => p.role],
  ['Membership tier', (p) => tierByKey(p.membership_tier)?.name || p.membership_tier],
  ['Status', (p) => p.membership_status],
  ['Renews/ends', (p) => (p.renews_on ? p.renews_on.slice(0, 10) : p.membership_status === 'active' ? 'lifetime' : '')],
  ['Won\'t renew', (p) => (p.cancel_at_period_end ? 'yes' : '')],
  ['State', (p) => p.state],
  ['Credentials', (p) => p.credentials],
  ['Organization', (p) => p.organization],
  ['Practice setting', (p) => p.practice_setting],
  ['Phone', (p) => p.phone],
  ['Newsletter', (p) => (p.newsletter_opt_in ? 'yes' : 'no')],
  ['SMS updates', (p) => (p.sms_opt_in ? 'yes' : 'no')],
  ['Account created', (p) => (p.created_at ? p.created_at.slice(0, 10) : '')],
];

function toCsv(rows) {
  const esc = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    CSV_COLUMNS.map(([label]) => esc(label)).join(','),
    ...rows.map((p) => CSV_COLUMNS.map(([, value]) => esc(value(p))).join(',')),
  ].join('\n');
}

// Admin-only member roster: everyone who has ever signed in, with membership
// status, counts by tier/state, and a CSV export of the filtered view. Reads
// are allowed by the profiles RLS policy (admins see all rows).
export default function AdminMembers() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, credentials, organization, practice_setting, state, phone, newsletter_opt_in, sms_opt_in, membership_tier, membership_status, renews_on, cancel_at_period_end, created_at')
        .order('full_name', { ascending: true, nullsFirst: false });
      if (!active) return;
      if (error) setError(error.message);
      else setPeople(data || []);
      setLoading(false);
    })();
    return () => { active = false; };
  }, []);

  const counts = useMemo(() => {
    const byStatus = { active: 0, past_due: 0, canceled: 0, none: 0 };
    const byTier = {};
    const byState = {};
    for (const p of people) {
      byStatus[p.membership_status || 'none'] += 1;
      if (p.membership_status === 'active') {
        const tierName = tierByKey(p.membership_tier)?.name || p.membership_tier || 'Unknown';
        byTier[tierName] = (byTier[tierName] || 0) + 1;
        const state = p.state || 'Not provided';
        byState[state] = (byState[state] || 0) + 1;
      }
    }
    const sorted = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);
    return { byStatus, byTier: sorted(byTier), byState: sorted(byState) };
  }, [people]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return people.filter((p) => {
      if (statusFilter !== 'all' && (p.membership_status || 'none') !== statusFilter) return false;
      if (!q) return true;
      return [p.full_name, p.email, p.organization, p.state]
        .some((v) => v && v.toLowerCase().includes(q));
    });
  }, [people, statusFilter, search]);

  const downloadCsv = () => {
    const blob = new Blob([toCsv(filtered)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sampa-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-40 pb-24">
        <Link to="/editor" className="text-primary font-data text-sm font-semibold hover:underline">
          ← Dashboard
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4 mt-4 mb-8">
          <div>
            <h1 className="text-3xl font-drama font-bold mb-2">Members</h1>
            <p className="text-text/60">
              Everyone with an account. Membership status is kept in sync by
              Stripe — billing changes belong in the Stripe dashboard, not here.
            </p>
          </div>
          <button
            onClick={downloadCsv}
            disabled={loading || filtered.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download CSV ({filtered.length})
          </button>
        </div>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading && <p className="text-text/50 font-data">Loading…</p>}

        {!loading && !error && (
          <>
            {/* Status summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                ['Active members', counts.byStatus.active, 'text-green-700'],
                ['Past due', counts.byStatus.past_due, 'text-amber-700'],
                ['Canceled', counts.byStatus.canceled, 'text-red-600'],
                ['Accounts w/o membership', counts.byStatus.none, 'text-text/60'],
              ].map(([label, n, cls]) => (
                <div key={label} className="bg-white rounded-2xl border border-primary/10 p-5">
                  <div className={`text-3xl font-bold ${cls}`}>{n}</div>
                  <div className="text-text/50 text-xs font-data uppercase tracking-wider mt-1">{label}</div>
                </div>
              ))}
            </div>

            {/* Tier + state breakdowns (active members) */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {[
                ['Active members by tier', counts.byTier],
                ['Active members by state', counts.byState],
              ].map(([title, entries]) => (
                <div key={title} className="bg-white rounded-2xl border border-primary/10 p-5">
                  <h2 className="font-bold text-sm mb-3">{title}</h2>
                  {entries.length === 0 ? (
                    <p className="text-text/40 text-sm">No active members yet.</p>
                  ) : (
                    <ul className="space-y-1.5">
                      {entries.map(([name, n]) => (
                        <li key={name} className="flex justify-between text-sm">
                          <span className="text-text/70">{name}</span>
                          <span className="font-data font-semibold">{n}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>

            {/* Roster */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email, organization, state…"
                className="flex-1 min-w-[220px] px-4 py-2.5 rounded-full border border-primary/20 focus:outline-none focus:border-primary text-sm bg-white"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 rounded-full border border-primary/20 bg-white font-semibold text-sm focus:outline-none focus:border-primary"
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.key} value={f.key}>{f.label}</option>
                ))}
              </select>
            </div>

            <div className="bg-white rounded-2xl border border-primary/10 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-text/40 font-data text-xs uppercase tracking-wider border-b border-primary/10">
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Tier</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Renewal</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{p.full_name || '—'}</td>
                      <td className="px-4 py-3 text-text/60">{p.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{tierByKey(p.membership_tier)?.name || p.membership_tier || '—'}</td>
                      <td className="px-4 py-3">
                        {p.membership_status ? (
                          <span className={`text-xs font-data font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGES[p.membership_status] || 'bg-text/10 text-text/60'}`}>
                            {p.membership_status}
                          </span>
                        ) : (
                          <span className="text-text/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text/60 whitespace-nowrap">{renewalLabel(p)}</td>
                      <td className="px-4 py-3 text-text/60 whitespace-nowrap">{p.state || '—'}</td>
                      <td className="px-4 py-3 text-text/60">{p.role}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-text/40">
                        No accounts match this view.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-text/40 text-xs mt-4">
              The CSV export includes additional columns: credentials,
              organization, practice setting, phone, and newsletter/SMS
              preferences. Roles are managed on{' '}
              <Link to="/editor/people" className="underline hover:text-primary">Manage editors</Link>.
            </p>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
