import React from 'react';
import { Link } from 'react-router-dom';
import { Linkedin, MapPin } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import {
  LEADERSHIP_PAGE,
  formatLocation,
  initials,
  listLeadership,
} from '../data/leadership';

function Headshot({ person }) {
  const label = initials(person.name);
  if (person.photo) {
    return (
      <img
        src={person.photo}
        alt=""
        className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover border border-primary/10 shrink-0"
      />
    );
  }
  return (
    <div
      className="w-24 h-24 md:w-28 md:h-28 rounded-full shrink-0 bg-gradient-to-tr from-primary/15 to-accent/15 border border-primary/10 flex items-center justify-center"
      aria-hidden="true"
    >
      <span className="font-drama font-bold text-2xl text-primary-text">{label}</span>
    </div>
  );
}

function LeaderCard({ person }) {
  const location = formatLocation(person);
  return (
    <article
      id={person.id}
      className="bg-white rounded-4xl shadow-sm border border-primary/10 p-6 md:p-8"
    >
      <div className="flex flex-col sm:flex-row gap-5 md:gap-6">
        <Headshot person={person} />
        <div className="min-w-0 flex-1">
          <h2 className="text-2xl md:text-3xl font-drama font-bold leading-tight">
            {person.name}
          </h2>
          {person.credentials && (
            <p className="text-text/50 mt-1">{person.credentials}</p>
          )}
          {person.roles?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {person.roles.map((role) => (
                <span
                  key={role}
                  className="px-2.5 py-0.5 rounded-full bg-primary-text/10 text-primary-text text-xs font-data font-semibold uppercase tracking-wider"
                >
                  {role}
                </span>
              ))}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-text/55">
            {location && (
              <p className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary-text shrink-0" />
                {location}
              </p>
            )}
            {person.linkedin && (
              <a
                href={person.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-primary-text font-semibold hover:underline"
              >
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </a>
            )}
          </div>
        </div>
      </div>
      <p className="mt-5 text-text/80 leading-relaxed">{person.bio}</p>
    </article>
  );
}

export default function Leadership() {
  const people = listLeadership();

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 pt-32 pb-24">
        <header className="mb-10 md:mb-14">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="text-primary-text font-bold font-data tracking-widest text-xs md:text-sm uppercase">
              {LEADERSHIP_PAGE.eyebrow}
            </div>
            <span className="text-xs font-data uppercase tracking-wider text-accent font-semibold">
              Preview
            </span>
          </div>
          <h1 className="text-4xl md:text-6xl font-drama font-bold mb-6">
            {LEADERSHIP_PAGE.title}
          </h1>
          <p className="text-xl text-text/70 leading-relaxed">
            {LEADERSHIP_PAGE.oneLiner}
          </p>
        </header>

        <div className="rounded-3xl border border-primary/15 bg-primary/5 p-5 md:p-6 mb-10 md:mb-12">
          <p className="text-text/80 leading-relaxed">{LEADERSHIP_PAGE.previewNote}</p>
        </div>

        <div className="space-y-6">
          {people.map((person) => (
            <LeaderCard key={person.id} person={person} />
          ))}
        </div>

        <p className="mt-12 text-sm text-text/55">
          Mission, nonprofit status, and programs live on the{' '}
          <Link to="/about" className="text-primary-text font-semibold hover:underline">
            About
          </Link>{' '}
          page.
        </p>
      </main>

      <Footer />
    </div>
  );
}
