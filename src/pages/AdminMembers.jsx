import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { tierByKey } from '../lib/membership';
import { formatDate } from '../lib/format';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import PrivilegedAccessAgreement from '../components/PrivilegedAccessAgreement';

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

// "Fellow, 3 yr" | "Legacy Member, lifetime" | "Fellow" (term unknown) — same
// format as the pledge table. Term is unknown only for memberships that
// predate term tracking; their next Stripe event fills it in.
function tierLabel(p) {
  const name = tierByKey(p.membership_tier)?.name || p.membership_tier;
  if (!name) return '—';
  if (p.membership_years) return `${name}, ${p.membership_years} yr`;
  if (p.membership_status === 'active' && !p.renews_on) return `${name}, lifetime`;
  return name;
}

// Active: "Renews <date>" | "Ends <date>" (canceled at period end) | "Lifetime".
// Past due: the date the failed renewal was due. Canceled/none: no date — the
// stored period-end is history, and printing it would read like a renewal.
function renewalLabel(p) {
  if (p.membership_status === 'active') {
    if (!p.renews_on) return 'Lifetime';
    return `${p.cancel_at_period_end ? 'Ends' : 'Renews'} ${formatDate(p.renews_on)}`;
  }
  if (p.membership_status === 'past_due' && p.renews_on) return `Due ${formatDate(p.renews_on)}`;
  return '';
}

const CSV_COLUMNS = [
  ['Name', (p) => p.full_name],
  ['Email', (p) => p.email],
  ['Role', (p) => p.role],
  ['Membership tier', (p) => tierByKey(p.membership_tier)?.name || p.membership_tier],
  ['Term (years)', (p) => p.membership_years || (p.membership_status === 'active' && !p.renews_on ? 'lifetime' : '')],
  ['Status', (p) => p.membership_status],
  ['Renews/ends', (p) => (p.renews_on ? p.renews_on.slice(0, 10) : p.membership_status === 'active' ? 'lifetime' : '')],
  ['Won\'t renew', (p) => (p.cancel_at_period_end ? 'yes' : '')],
  ['Donor', (p) => (p._isDonor ? 'yes' : 'no')],
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
  const { user, profile } = useAuth();
  // Confidentiality agreement gate: no member data is fetched or rendered
  // until this person has click-accepted (timestamp on their profile).
  const accepted = !!profile?.privileged_terms_accepted_at;

  const [people, setPeople] = useState([]);
  const [pledges, setPledges] = useState([]);
  const [donorKeys, setDonorKeys] = useState(() => new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    if (!accepted) return;
    (async () => {
      const [profilesRes, pledgesRes, donationsRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, role, credentials, organization, practice_setting, state, phone, newsletter_opt_in, sms_opt_in, membership_tier, membership_years, membership_status, renews_on, cancel_at_period_end, created_at')
          .order('full_name', { ascending: true, nullsFirst: false }),
        // Pre-Stripe sign-up-form pledges (admin-readable via RLS). Rows stay
        // after claiming, so this doubles as the invitation-conversion tracker.
        supabase
          .from('member_import')
          .select('email, first_name, last_name, membership_tier, membership_years, member_since, claimed_at')
          .order('member_since', { ascending: true }),
        // Successful gifts, to flag donors in the roster. Admin/member-viewer can
        // read donations via RLS; degrades to "no donors" if the query errors.
        supabase
          .from('donations')
          .select('user_id, donor_email')
          .eq('status', 'succeeded'),
      ]);
      if (!active) return;
      if (profilesRes.error) setError(profilesRes.error.message);
      else setPeople(profilesRes.data || []);
      setPledges(pledgesRes.data || []); // empty if the admin-read policy migration hasn't run
      // Donor lookup keyed by account id AND the email Stripe collected, so a
      // guest gift made with a member's email still flags that member.
      const keys = new Set();
      for (const d of donationsRes.data || []) {
        if (d.user_id) keys.add(d.user_id);
        if (d.donor_email) keys.add(d.donor_email.toLowerCase());
      }
      setDonorKeys(keys);
      setLoading(false);
    })();
    return () => { active = false; };
  }, [accepted]);

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

  // Pledge conversion: match pledges to accounts by email, then bucket them.
  // Sorted action-first: not signed in, then signed-in-unpaid, then paid.
  const pledgeRows = useMemo(() => {
    const byEmail = new Map(people.map((p) => [(p.email || '').toLowerCase(), p]));
    const order = { invited: 0, signed_in: 1, paid: 2 };
    return pledges
      .map((m) => {
        const prof = byEmail.get(m.email);
        const status = prof?.membership_status === 'active'
          ? 'paid'
          : (m.claimed_at || prof)
            ? 'signed_in'
            : 'invited';
        return { ...m, status };
      })
      .sort((a, b) => order[a.status] - order[b.status]);
  }, [pledges, people]);

  const pledgeCounts = useMemo(() => ({
    paid: pledgeRows.filter((r) => r.status === 'paid').length,
    signed_in: pledgeRows.filter((r) => r.status === 'signed_in').length,
    invited: pledgeRows.filter((r) => r.status === 'invited').length,
  }), [pledgeRows]);

  // A member counts as a donor if a successful gift matches their account id or
  // the email Stripe collected on the gift.
  const isDonor = (p) =>
    donorKeys.has(p.id) || (!!p.email && donorKeys.has(p.email.toLowerCase()));

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
    const rows = filtered.map((p) => ({ ...p, _isDonor: isDonor(p) }));
    const blob = new Blob([toCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sampa-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    // Governance: exports are logged (fire-and-forget; visible to admins).
    supabase.from('audit_log').insert({
      actor_id: user.id,
      actor_email: profile?.email || user.email,
      action: 'member_csv_export',
      detail: { rows: filtered.length, filter: statusFilter, search: search.trim() || null },
    }).then(() => {});
  };

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-40 pb-24">
        <Link to="/editor" className="text-primary-text font-data text-sm font-semibold hover:underline">
          ← Dashboard
        </Link>

        {!accepted ? (
          <div className="mt-8">
            <PrivilegedAccessAgreement />
          </div>
        ) : (
        <>
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
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-text text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
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

            {/* Pledge conversion (pre-Stripe sign-up form) */}
            <div className="bg-white rounded-2xl border border-primary/10 p-5 mb-8">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="font-bold text-sm">Pledges from the sign-up form</h2>
                {pledgeRows.length > 0 && (
                  <div className="flex flex-wrap gap-2 text-xs font-data font-semibold">
                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-700">{pledgeCounts.paid} paid</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700">{pledgeCounts.signed_in} signed in, not paid</span>
                    <span className="px-2 py-0.5 rounded-full bg-text/10 text-text/60">{pledgeCounts.invited} not signed in yet</span>
                  </div>
                )}
              </div>

              {pledgeRows.length === 0 ? (
                <p className="text-text/40 text-sm">
                  No pledge data visible. If pledges were imported, run the
                  admin-read policy migration (docs/member-area-setup.md,
                  Migration 5).
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-text/40 font-data text-xs uppercase tracking-wider border-b border-primary/10">
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Pledged</th>
                        <th className="px-3 py-2">Pledge date</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary/10">
                      {pledgeRows.map((m) => (
                        <tr key={m.email}>
                          <td className="px-3 py-2 font-semibold whitespace-nowrap">
                            {`${m.first_name || ''} ${m.last_name || ''}`.trim() || '—'}
                          </td>
                          <td className="px-3 py-2 text-text/60">{m.email}</td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {tierByKey(m.membership_tier)?.name || m.membership_tier || '—'}
                            {m.membership_years ? `, ${m.membership_years} yr` : ''}
                          </td>
                          <td className="px-3 py-2 text-text/60 whitespace-nowrap">
                            {m.member_since ? formatDate(m.member_since) : '—'}
                          </td>
                          <td className="px-3 py-2 whitespace-nowrap">
                            {m.status === 'paid' && (
                              <span className="text-xs font-data font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-700">Paid ✓</span>
                            )}
                            {m.status === 'signed_in' && (
                              <span className="text-xs font-data font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700">Signed in — not paid</span>
                            )}
                            {m.status === 'invited' && (
                              <span className="text-xs font-data font-semibold px-2 py-0.5 rounded-full bg-text/10 text-text/60">Hasn't signed in</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
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
                    <th className="px-4 py-3">Donor</th>
                    <th className="px-4 py-3">State</th>
                    <th className="px-4 py-3">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary/10">
                  {filtered.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 font-semibold whitespace-nowrap">{p.full_name || '—'}</td>
                      <td className="px-4 py-3 text-text/60">{p.email}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{tierLabel(p)}</td>
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
                      <td className="px-4 py-3">
                        {isDonor(p) ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-data font-semibold px-2 py-0.5 rounded-full bg-green-500/10 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Yes
                          </span>
                        ) : (
                          <span className="text-text/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-text/60 whitespace-nowrap">{p.state || '—'}</td>
                      <td className="px-4 py-3 text-text/60">{p.role}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-text/40">
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
              preferences. Permissions are managed by administrators on{' '}
              <Link to="/editor/people" className="underline hover:text-primary-text">People & permissions</Link>.
            </p>
          </>
        )}
        </>
        )}
      </main>

      <Footer />
    </div>
  );
}
