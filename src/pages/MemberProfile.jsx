import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Briefcase, Building2, ExternalLink, Globe, Mail, MapPin, Phone, Stethoscope } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import {
  displayOrganizations,
  formatOrgLocation,
  formatWebsiteLabel,
  normalizeWebsite,
} from '../lib/organizations';
import { sanitizePracticeSettingSlugs } from '../lib/practiceSettings';
import {
  PersonPracticeSettings,
  PracticeSettingChips,
} from '../components/PracticeSettingChips';
import { DirectoryBadges } from '../components/DirectoryBadges';
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
                {person.state && (
                  <p className="flex items-center gap-1.5 text-sm text-text/55 mt-2">
                    <MapPin className="w-4 h-4 text-primary-text shrink-0" />
                    {person.state}
                  </p>
                )}
              </div>
              <DirectoryBadges person={person} size="md" />
            </div>

            <PersonPracticeSettings person={person} className="mb-6" />

            {(() => {
              const orgs = displayOrganizations(person);
              if (orgs.length === 0) return null;
              return (
                <div className="mb-8">
                  <h2 className="text-xs font-data font-semibold uppercase tracking-wider text-text/40 mb-3">
                    {orgs.length === 1 ? 'Organization' : 'Organizations'}
                  </h2>
                  <ul className="space-y-4">
                    {orgs.map((org, i) => {
                      const location = formatOrgLocation(org);
                      const websiteHref = normalizeWebsite(org.website);
                      const settings = sanitizePracticeSettingSlugs(org.practice_settings);
                      return (
                        <li
                          key={i}
                          className="rounded-2xl border border-primary/10 bg-primary/[0.02] p-4"
                        >
                          <div className="flex gap-3">
                            <Building2 className="w-5 h-5 text-primary-text shrink-0 mt-0.5" />
                            <div className="min-w-0 space-y-2">
                              {org.name && (
                                <div className="font-semibold text-text/90">{org.name}</div>
                              )}
                              {org.role && (
                                <div className="flex items-start gap-2 text-sm text-text/70">
                                  <Briefcase className="w-4 h-4 text-primary-text shrink-0 mt-0.5" />
                                  <span>{org.role}</span>
                                </div>
                              )}
                              {settings.length > 0 ? (
                                <div className="flex items-start gap-2 text-sm text-text/70">
                                  <Stethoscope className="w-4 h-4 text-primary-text shrink-0 mt-0.5" />
                                  <div className="min-w-0 space-y-1.5">
                                    <PracticeSettingChips slugs={settings} />
                                    {settings.includes('other') && org.practice_setting_other && (
                                      <p className="text-text/50 text-xs">
                                        {org.practice_setting_other}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ) : org.practice_setting ? (
                                <div className="flex items-start gap-2 text-sm text-text/70">
                                  <Stethoscope className="w-4 h-4 text-primary-text shrink-0 mt-0.5" />
                                  <span>{org.practice_setting}</span>
                                </div>
                              ) : null}
                              {location && (
                                <div className="flex items-start gap-2 text-sm text-text/70">
                                  <MapPin className="w-4 h-4 text-primary-text shrink-0 mt-0.5" />
                                  <span>{location}</span>
                                </div>
                              )}
                              {websiteHref && (
                                <div className="flex items-start gap-2 text-sm">
                                  <Globe className="w-4 h-4 text-primary-text shrink-0 mt-0.5" />
                                  <a
                                    href={websiteHref}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary-text font-semibold hover:underline inline-flex items-center gap-1 break-all"
                                  >
                                    {formatWebsiteLabel(websiteHref)}
                                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })()}

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
