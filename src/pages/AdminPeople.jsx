import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { formatDate } from '../lib/format';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Admin-only page: everyone who has signed in, with checkbox permissions.
// Capabilities are independent (people wear multiple hats):
//   Publish news  -> can_edit_news (news posts; the old 'editor' role)
//   View members  -> can_view_members (READ-ONLY roster + pledge tracker)
//   Administrator -> role 'admin' (everything, incl. this page)
// Saving normalizes the legacy 'editor' role value into the flag.
export default function AdminPeople() {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, can_edit_news, can_view_members, created_at')
      .order('created_at', { ascending: true });
    if (error) setError(error.message);
    else setPeople(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  // Effective (displayed) permissions; legacy role 'editor' counts as news.
  const perms = (p) => ({
    news: p.can_edit_news || p.role === 'editor',
    view: p.can_view_members,
    admin: p.role === 'admin',
  });

  async function apply(person, next) {
    setBusyId(person.id);
    setError(null);
    const patch = {
      role: next.admin ? 'admin' : 'member', // legacy 'editor' normalizes to member + flag
      can_edit_news: next.news,
      can_view_members: next.view,
    };
    const { error } = await supabase.from('profiles').update(patch).eq('id', person.id);
    if (error) setError(error.message);
    else setPeople((prev) => prev.map((p) => (p.id === person.id ? { ...p, ...patch } : p)));
    setBusyId(null);
  }

  const checkboxCls =
    'w-4 h-4 accent-primary disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-40 pb-24">
        <Link to="/editor" className="text-primary font-data text-sm font-semibold hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-drama font-bold mt-4 mb-2">People & permissions</h1>
        <p className="text-text/60 mb-8">
          People appear here after their first sign-in. Permissions are
          independent checkboxes — check as many as someone's hats require.
          <strong> Publish news</strong> lets them write and publish posts;
          <strong> view members</strong> gives read-only access to the member
          roster and pledge tracker (for the membership committee, treasurer,
          and board); <strong>administrators</strong> have everything, including
          this page and editing member records.
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading && <p className="text-text/50 font-data">Loading…</p>}

        {!loading && (
          <div className="bg-white rounded-2xl border border-primary/10 divide-y divide-primary/10">
            {people.map((person) => {
              const isSelf = person.id === user?.id;
              const p = perms(person);
              const disabled = isSelf || busyId === person.id;
              return (
                <div key={person.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 p-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-semibold">
                      {person.full_name || '—'}
                      {isSelf && <span className="text-text/40 font-normal text-sm"> (you)</span>}
                    </div>
                    <div className="text-text/50 text-sm">{person.email}</div>
                    <div className="text-text/30 text-xs font-data mt-0.5">joined {formatDate(person.created_at)}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                    {p.admin ? (
                      <span className="text-primary font-semibold text-xs font-data uppercase tracking-wider">
                        All permissions
                      </span>
                    ) : (
                      <>
                        <label className={`flex items-center gap-2 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={p.news}
                            disabled={disabled}
                            onChange={() => apply(person, { ...p, news: !p.news, admin: false })}
                            className={checkboxCls}
                          />
                          Publish news
                        </label>
                        <label className={`flex items-center gap-2 ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
                          <input
                            type="checkbox"
                            checked={p.view}
                            disabled={disabled}
                            onChange={() => apply(person, { ...p, view: !p.view, admin: false })}
                            className={checkboxCls}
                          />
                          View members
                        </label>
                      </>
                    )}
                    <label className={`flex items-center gap-2 font-semibold ${disabled ? 'opacity-60' : 'cursor-pointer'}`}>
                      <input
                        type="checkbox"
                        checked={p.admin}
                        disabled={disabled}
                        title={isSelf ? "You can't change your own permissions" : 'Administrator'}
                        onChange={() => apply(person, { ...p, admin: !p.admin })}
                        className={checkboxCls}
                      />
                      Admin
                    </label>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-text/40 text-xs mt-4">
          You can't change your own permissions (a safety measure against
          locking yourself out) — another admin can, or use the Supabase SQL
          editor. "View members" is read-only by design: the database refuses
          member-record writes from non-admins regardless of what the browser
          asks for.
        </p>
      </main>

      <Footer />
    </div>
  );
}
