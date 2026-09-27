import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone, Search, Users, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { US_STATES } from '../lib/usStates';
import { displayOrganizations, formatOrgLocation } from '../lib/organizations';
import { PRACTICE_SETTINGS } from '../lib/practiceSettings';
import { PersonPracticeSettings } from '../components/PracticeSettingChips';
import { DirectoryBadges } from '../components/DirectoryBadges';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function MemberCard({ person }) {
  const name = person.full_name || 'SAMPA member';
  const orgs = displayOrganizations(person);
  const primary = orgs[0];
  const extraCount = Math.max(0, orgs.length - 1);
  const orgLocation = primary ? formatOrgLocation(primary) : '';
  // Prefer employer location on the card; fall back to personal/home state.
  const location = orgLocation || person.state || '';

  return (
    <Link
      to={`/members/${person.id}`}
      className="block bg-white rounded-2xl border border-primary/10 p-5 hover:border-primary/30 hover:shadow-md transition-all"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <h2 className="text-lg font-bold text-text group-hover:text-primary-text">
          {name}
          {person.credentials && (
            <span className="font-normal text-text/50 text-sm ml-2">{person.credentials}</span>
          )}
        </h2>
        <DirectoryBadges person={person} />
      </div>
      <div className="space-y-1 text-sm text-text/60">
        {primary?.name && (
          <div>
            {primary.name}
            {extraCount > 0 && (
              <span className="text-text/40">
                {' '}· +{extraCount} more
              </span>
            )}
          </div>
        )}
        {primary?.role && (
          <div className="text-text/55">{primary.role}</div>
        )}
        {location && (
          <div className="flex items-center gap-1.5 text-text/50 pt-1">
            <MapPin className="w-3.5 h-3.5" />
            {location}
          </div>
        )}
      </div>
      <PersonPracticeSettings person={person} className="mt-3" />
      {(person.email || person.phone) && (
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-primary/5 text-xs text-text/45">
          {person.email && (
            <span className="flex items-center gap-1">
              <Mail className="w-3.5 h-3.5" /> Email shared
            </span>
          )}
          {person.phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> Phone shared
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export default function MemberDirectory() {
  const [people, setPeople] = useState(null); // null = loading
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [settingsFilter, setSettingsFilter] = useState([]);
  const [query, setQuery] = useState({ search: '', state: '', settings: [] });

  useEffect(() => {
    let active = true;
    (async () => {
      setPeople(null);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('member_directory', {
        search: query.search || null,
        state_filter: query.state || null,
        settings_filter: query.settings?.length ? query.settings : null,
      });
      if (!active) return;
      if (rpcError) {
        // Gotcha 14: degrade if migration not applied yet.
        setError(
          rpcError.message?.includes('function') || rpcError.code === 'PGRST202'
            ? 'The member directory is not available yet. Please try again later.'
            : rpcError.message
        );
        setPeople([]);
        return;
      }
      setPeople(data || []);
    })();
    return () => { active = false; };
  }, [query]);

  const applySearch = (e) => {
    e.preventDefault();
    setQuery({
      search: search.trim(),
      state: stateFilter,
      settings: settingsFilter,
    });
  };

  const toggleSettingFilter = (slug) => {
    setSettingsFilter((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const clearSettingsFilter = () => setSettingsFilter([]);

  const statesInDirectory = useMemo(() => {
    // Prefer full US list for the filter so users can search before results load.
    return US_STATES;
  }, []);

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-24">
        <header className="mb-8">
          <div className="text-primary-text font-bold font-data tracking-widest text-xs mb-3 uppercase">
            Member area
          </div>
          <h1 className="text-3xl md:text-5xl font-drama font-bold mb-3 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary-text hidden sm:block" />
            Member directory
          </h1>
          <p className="text-text/60 max-w-2xl text-sm md:text-base">
            Connect with other active SAMPA members. For professional networking
            only — no commercial solicitation. Control what you share from your{' '}
            <Link to="/dashboard" className="text-primary-text font-semibold hover:underline">
              dashboard
            </Link>
            .
          </p>
        </header>

        <form
          onSubmit={applySearch}
          className="bg-white rounded-2xl border border-primary/10 p-4 mb-8 space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text/30" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, organization, credentials…"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-primary/20 focus:outline-none focus:border-primary text-sm"
              />
            </div>
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-primary/20 focus:outline-none focus:border-primary text-sm bg-white sm:w-48"
              aria-label="Filter by state"
            >
              <option value="">All states</option>
              {statesInDirectory.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-full bg-primary-text text-white text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Search
            </button>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-data font-semibold uppercase tracking-wider text-text/40">
                Practice settings
              </span>
              {settingsFilter.length > 0 && (
                <button
                  type="button"
                  onClick={clearSettingsFilter}
                  className="inline-flex items-center gap-1 text-xs text-primary-text font-semibold hover:underline"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by practice setting">
              {PRACTICE_SETTINGS.map((s) => {
                const on = settingsFilter.includes(s.slug);
                return (
                  <button
                    key={s.slug}
                    type="button"
                    onClick={() => toggleSettingFilter(s.slug)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-data font-semibold transition-colors ${
                      on
                        ? 'bg-primary-text text-white'
                        : `${s.chipClass} hover:opacity-80`
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
            <p className="text-text/35 text-xs mt-2">
              Match any selected setting. Click Search to apply.
            </p>
          </div>
        </form>

        {error && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 text-sm text-amber-900">
            {error}
          </div>
        )}

        {people === null && (
          <p className="text-text/50 font-data text-sm">Loading members…</p>
        )}

        {people?.length === 0 && !error && (
          <div className="bg-white rounded-2xl border border-primary/10 p-8 text-center text-text/60 text-sm">
            No members match your search
            {query.state ? ` in ${query.state}` : ''}
            {query.settings?.length
              ? ` with selected practice setting${query.settings.length === 1 ? '' : 's'}`
              : ''}
            . Try a broader query, or check back as more members join.
          </div>
        )}

        {people?.length > 0 && (
          <>
            <p className="text-text/40 text-xs font-data mb-4">
              {people.length} member{people.length === 1 ? '' : 's'}
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {people.map((p) => (
                <MemberCard key={p.id} person={p} />
              ))}
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
