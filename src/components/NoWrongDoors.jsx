import React from 'react';
import { Link } from 'react-router-dom';

// Homepage "No wrong doors" band — the one home for the phrase, the
// practice-settings list, and the prevalence stats (see
// docs/messaging/patient-access-north-star.md). Figures: SAMHSA 2025 NSDUH
// (released 2026-07-27) + CDC provisional overdose data; refresh when the
// next NSDUH lands (~July 2027).

const SETTINGS = [
  'Emergency departments',
  'Hospitals',
  'Primary care',
  'Street medicine',
  'Telehealth',
  'Bridge clinics',
  'Opioid treatment programs',
  'FQHCs & safety-net clinics',
];

const STATS = [
  { value: '44.6M', label: 'Americans had a substance use disorder in the past year' },
  { value: '1 in 6', label: 'of people needing substance use treatment received any' },
  { value: '73%', label: 'of adults who ever had a substance problem say they’re in recovery or recovered' },
];

export default function NoWrongDoors() {
  return (
    <section aria-labelledby="doors-heading" className="px-4 md:px-8 max-w-7xl mx-auto">
      <div className="bg-primary-text text-white rounded-5xl p-10 md:p-16 lg:p-20 shadow-xl shadow-primary-text/15">
        <div className="max-w-3xl">
          <div className="text-sm font-bold tracking-widest uppercase text-white/60 font-data mb-4">
            Why it matters
          </div>
          <h2 id="doors-heading" className="text-3xl md:text-5xl font-drama leading-tight mb-6">
            No wrong doors.
          </h2>
          <p className="text-lg md:text-xl text-white/85 leading-relaxed">
            Addiction shows up in every corner of medicine — so every door a
            patient walks through should lead to treatment that works. Our
            members are already behind those doors:
          </p>
          <ul className="flex flex-wrap gap-2 mt-6" aria-label="Practice settings where SAMPA members work">
            {SETTINGS.map((s) => (
              <li
                key={s}
                className="rounded-full bg-white/10 border border-white/15 px-4 py-1.5 text-sm text-white/90"
              >
                {s}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 my-10 md:my-14">
          {STATS.map((s) => (
            <div key={s.value}>
              <div className="text-4xl md:text-5xl font-bold font-sans mb-2">{s.value}</div>
              <div className="text-sm md:text-base text-white/70 leading-snug">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="max-w-3xl">
          <p className="text-lg text-white/85 leading-relaxed mb-8">
            And the tide can turn — US overdose deaths have fallen for three
            straight years. If you see patients, you see addiction. Whether
            it&rsquo;s your specialty or one patient a shift, there&rsquo;s a
            place for you here.
          </p>
          <Link
            to="/join"
            className="inline-block bg-white text-primary-text px-8 py-3.5 rounded-full text-sm font-bold hover:bg-white/90 transition-colors"
          >
            Join SAMPA
          </Link>
          <p className="text-xs text-white/45 leading-relaxed mt-8">
            Sources:{' '}
            <a
              href="https://www.samhsa.gov/data/data-we-collect/nsduh-national-survey-drug-use-and-health/national-releases/2025"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white/70"
            >
              SAMHSA, 2025 National Survey on Drug Use and Health
            </a>
            {' '}·{' '}
            <a
              href="https://www.cdc.gov/nchs/nvss/vsrr/drug-overdose-data.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-white/70"
            >
              CDC provisional overdose data, 2026
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
