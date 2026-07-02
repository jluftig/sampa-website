import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';
import { formatDate } from '../lib/format';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const ROLES = ['member', 'editor', 'admin'];

// Admin-only page to view everyone who has signed in and set their role.
// People only appear here after their first Google login (which creates their
// profile as a 'member').
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
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: true });
    if (error) setError(error.message);
    else setPeople(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function changeRole(person, role) {
    setBusyId(person.id);
    setError(null);
    const { error } = await supabase.from('profiles').update({ role }).eq('id', person.id);
    if (error) setError(error.message);
    else setPeople((prev) => prev.map((p) => (p.id === person.id ? { ...p, role } : p)));
    setBusyId(null);
  }

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-40 pb-24">
        <Link to="/editor" className="text-primary font-data text-sm font-semibold hover:underline">
          ← Dashboard
        </Link>
        <h1 className="text-3xl font-drama font-bold mt-4 mb-2">Manage editors</h1>
        <p className="text-text/60 mb-8">
          People appear here after they sign in once with Google. Set someone to <strong>editor</strong> to
          let them write and publish, or <strong>admin</strong> to also manage keywords and roles.
          New sign-ins must first be added as a Google test user.
        </p>

        {error && <p className="text-red-500 mb-4">{error}</p>}
        {loading && <p className="text-text/50 font-data">Loading…</p>}

        {!loading && (
          <div className="bg-white rounded-2xl border border-primary/10 divide-y divide-primary/10">
            {people.map((person) => {
              const isSelf = person.id === user?.id;
              return (
                <div key={person.id} className="flex flex-wrap items-center gap-4 p-4">
                  <div className="flex-1 min-w-[200px]">
                    <div className="font-semibold">
                      {person.full_name || '—'}
                      {isSelf && <span className="text-text/40 font-normal text-sm"> (you)</span>}
                    </div>
                    <div className="text-text/50 text-sm">{person.email}</div>
                    <div className="text-text/30 text-xs font-data mt-0.5">joined {formatDate(person.created_at)}</div>
                  </div>

                  <select
                    value={person.role}
                    disabled={isSelf || busyId === person.id}
                    onChange={(e) => changeRole(person, e.target.value)}
                    title={isSelf ? "You can't change your own role" : 'Set role'}
                    className="px-3 py-2 rounded-xl border border-primary/20 bg-white font-semibold text-sm focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-text/40 text-xs mt-4">
          You can't change your own role here (a safety measure against locking yourself out). If you
          ever need to, an admin can do it, or use the Supabase SQL editor.
        </p>
      </main>

      <Footer />
    </div>
  );
}
