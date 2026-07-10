import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, Mail, MapPin, Phone, Stethoscope } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function MemberProfile() {
  const { id } = useParams();
  const [person, setPerson] = useState(undefined); // undefined loading, null not found
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setPerson(undefined);
      setError(null);
      const { data, error: rpcError } = await supabase.rpc('member_directory_profile', {
        member_id: id,
      });
      if (!active) return;
      if (rpcError) {
        setError(
          rpcError.message?.includes('function') || rpcError.code === 'PGRST202'
            ? 'The member directory is not available yet. Please try again later.'
            : rpcError.message
        );
        setPerson(null);
        return;
      }
      // RPC returns a table (array); empty when opted out / inactive / missing.
      setPerson(data?.[0] || null);
    })();
    return () => { active = false; };
  }, [id]);

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-2xl mx-auto px-4 pt-32 pb-24">
        <Link
          to="/members"
          className="inline-flex items-center gap-1.5 text-primary-text font-data text-sm font-semibold hover:underline mb-8"
        >
          <ArrowLeft className="w-4 h-4" /> Member directory
        </Link>

        {person === undefined && (
          <p className="text-text/50 font-data text-sm">Loading…</p>
        )}

        {error && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-sm text-amber-900">
            {error}
          </div>
        )}

        {person === null && !error && (
          <div className="bg-white rounded-4xl border border-primary/10 p-8 text-center">
            <h1 className="text-2xl font-drama font-bold mb-3">Member not listed</h1>
            <p className="text-text/60 text-sm mb-6">
              This person is not in the member directory. They may have opted out,
              or their membership is not currently active.
            </p>
            <Link
              to="/members"
              className="text-primary-text font-semibold text-sm hover:underline"
            >
              Back to directory
            </Link>
          </div>
        )}

        {person && (
          <article className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 md:p-10">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
              <div>
                <h1 className="text-3xl font-drama font-bold">
                  {person.full_name || 'SAMPA member'}
                </h1>
                {person.credentials && (
                  <p className="text-text/50 mt-1">{person.credentials}</p>
                )}
              </div>
              {person.is_board && (
                <span className="px-3 py-1 rounded-full bg-primary-text/10 text-primary-text text-xs font-data font-semibold uppercase tracking-wider">
                  Board
                </span>
              )}
            </div>

            <dl className="space-y-4 mb-8">
              {person.organization && (
                <div className="flex gap-3">
                  <Building2 className="w-5 h-5 text-primary-text shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs font-data font-semibold uppercase tracking-wider text-text/40 mb-0.5">
                      Organization
                    </dt>
                    <dd className="text-text/80">{person.organization}</dd>
                  </div>
                </div>
              )}
              {person.practice_setting && (
                <div className="flex gap-3">
                  <Stethoscope className="w-5 h-5 text-primary-text shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs font-data font-semibold uppercase tracking-wider text-text/40 mb-0.5">
                      Practice setting
                    </dt>
                    <dd className="text-text/80">{person.practice_setting}</dd>
                  </div>
                </div>
              )}
              {person.state && (
                <div className="flex gap-3">
                  <MapPin className="w-5 h-5 text-primary-text shrink-0 mt-0.5" />
                  <div>
                    <dt className="text-xs font-data font-semibold uppercase tracking-wider text-text/40 mb-0.5">
                      State
                    </dt>
                    <dd className="text-text/80">{person.state}</dd>
                  </div>
                </div>
              )}
            </dl>

            {(person.email || person.phone) ? (
              <div className="border-t border-primary/10 pt-6">
                <h2 className="text-sm font-bold mb-4">Contact for networking</h2>
                <div className="flex flex-wrap gap-3">
                  {person.email && (
                    <a
                      href={`mailto:${person.email}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-text text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Mail className="w-4 h-4" />
                      {person.email}
                    </a>
                  )}
                  {person.phone && (
                    <a
                      href={`tel:${person.phone.replace(/[^\d+]/g, '')}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2 border-primary-text text-primary-text text-sm font-bold hover:bg-primary-text/5 transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {person.phone}
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="border-t border-primary/10 pt-6 text-sm text-text/50">
                This member has not shared contact details. Professional
                information above is still visible for networking context.
              </div>
            )}

            <p className="text-text/35 text-xs mt-8">
              Shared only with active SAMPA members. Use contact information
              for professional networking only.
            </p>
          </article>
        )}
      </main>

      <Footer />
    </div>
  );
}
