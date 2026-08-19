import React, { useState } from 'react';
import { Linkedin, MapPin } from 'lucide-react';
import {
  LEADERSHIP_GROUPS,
  LEADERSHIP_PAGE,
  formatLocation,
  initials,
  listLeadershipByGroup,
} from '../data/leadership';

const LONG_BIO_CHARS = 280;

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

function LeaderBio({ person }) {
  const short = person.bio || '';
  const long = person.bioLong || '';
  const needsToggle = Boolean(long) || short.length > LONG_BIO_CHARS;
  const [open, setOpen] = useState(false);

  if (!short && !long) return null;

  const collapsed = long ? short : short.slice(0, LONG_BIO_CHARS).trimEnd();
  const showCollapsed = needsToggle && !open;
  const text = showCollapsed
    ? `${collapsed}${long || short.length > LONG_BIO_CHARS ? '…' : ''}`
    : long || short;

  return (
    <div className="mt-5">
      <p className="text-text/80 leading-relaxed">{text}</p>
      {needsToggle && (
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-primary-text hover:underline"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
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
          <h3 className="text-2xl md:text-3xl font-drama font-bold leading-tight">
            {person.name}
          </h3>
          {person.credentials && (
            <p className="text-text/50 mt-1">{person.credentials}</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="px-2.5 py-0.5 rounded-full bg-primary-text/10 text-primary-text text-xs font-data font-semibold uppercase tracking-wider">
              {person.role}
            </span>
            {person.also?.map((role) => (
              <span
                key={role}
                className="px-2.5 py-0.5 rounded-full bg-primary/5 text-text/65 text-xs font-data font-semibold uppercase tracking-wider"
              >
                {role}
              </span>
            ))}
          </div>
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
      <LeaderBio person={person} />
    </article>
  );
}

export default function LeadershipRoster() {
  return (
    <section
      id="leadership"
      aria-labelledby="leadership-heading"
      className="mt-4 md:mt-6"
    >
      <header className="max-w-3xl mb-10 md:mb-12">
        <div className="text-primary-text font-bold font-data tracking-widest text-xs mb-4 uppercase">
          {LEADERSHIP_PAGE.eyebrow}
        </div>
        <h2
          id="leadership-heading"
          className="text-3xl md:text-5xl font-drama font-bold text-text mb-4"
        >
          {LEADERSHIP_PAGE.title}
        </h2>
        <p className="text-lg text-text/80 leading-relaxed">
          {LEADERSHIP_PAGE.oneLiner}
        </p>
      </header>

      {LEADERSHIP_GROUPS.map((group) => {
        const people = listLeadershipByGroup(group.id);
        if (people.length === 0) return null;
        return (
          <div key={group.id} className="mb-12 md:mb-16">
            <h3 className="text-xl font-bold text-text mb-2 tracking-tight">
              {group.title}
            </h3>
            {group.intro && (
              <p className="text-text/70 leading-relaxed mb-6 max-w-3xl">
                {group.intro}
              </p>
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {people.map((person) => (
                <LeaderCard key={person.id} person={person} />
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );
}
