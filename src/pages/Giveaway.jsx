import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { GIVEAWAY_ID, announcementById, isAnnouncementOpen } from '../lib/announcements';
import { useAnnouncementNow } from '../lib/useAnnouncementNow';

const SAMPA_INSTAGRAM = 'https://www.instagram.com/societyofaddictionmedicinepas/';
const MINDSET_INSTAGRAM = 'https://www.instagram.com/pa_mindsetmatters/';

const FLYER_SRC = '/giveaway/psych-congress-pa-institute.webp';
const FLYER_WIDTH = 1000;
const FLYER_HEIGHT = 1095;

export default function Giveaway() {
  const now = useAnnouncementNow();
  const giveaway = announcementById(GIVEAWAY_ID);
  const open = isAnnouncementOpen(giveaway, new Date(now));

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        {open ? <GiveawayOpen /> : <GiveawayEnded />}
      </main>

      <Footer />
    </div>
  );
}

function GiveawayEnded() {
  return (
    <header className="scroll-clear-header max-w-xl">
      <h1 className="text-3xl md:text-5xl font-drama font-bold leading-tight mb-4">
        This giveaway has ended
      </h1>
      <p className="text-lg text-text/70 leading-relaxed mb-8">
        The Psych Congress PA Institute giveaway closed on October 1, 2026.
      </p>
      <Link to="/" className="text-primary-text font-semibold hover:underline">
        Back to the homepage
      </Link>
    </header>
  );
}

function GiveawayOpen() {
  return (
    <>
      <header className="scroll-clear-header mb-8">
        <div className="text-primary-text font-bold font-data tracking-widest text-xs mb-4 uppercase">
          The Podcast Mindset Matters × SAMPA
        </div>
        <h1 className="text-3xl md:text-5xl font-drama font-bold leading-tight mb-4">
          Win a free Psych Congress PA Institute registration
        </h1>
        <p className="text-lg text-text/70 leading-relaxed">
          Orlando, FL · December 4–6, 2026. Enter on Instagram by October 1.
          This page explains the rules. It does not submit an entry.
        </p>
      </header>

      <a
        href="https://www.instagram.com/reel/DdwVzwmABiw/"
        target="_blank"
        rel="noopener noreferrer"
        className="scroll-clear-header mb-10 flex items-center gap-4 rounded-3xl border border-[#8B1FC0]/25 bg-white p-5 shadow-md hover:border-[#8B1FC0]/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#8B1FC0] focus-visible:ring-offset-2"
      >
        <span
          aria-hidden="true"
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#0E6B62,#8B1FC0)] text-white"
        >
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5.14v13.72L19.5 12 8 5.14z" />
          </svg>
        </span>
        <span className="min-w-0">
          <span className="block text-base md:text-lg font-bold text-text leading-snug">
            Watch the giveaway reel & enter on Instagram
          </span>
          <span className="mt-1 block text-sm text-text/70 leading-relaxed">
            Mindset Matters × SAMPA giveaway reel · @pa_mindsetmatters
          </span>
        </span>
      </a>

      <img
        id="giveaway-flyer"
        src={FLYER_SRC}
        width={FLYER_WIDTH}
        height={FLYER_HEIGHT}
        alt="Psych Congress PA Institute Giveaway flyer from The Podcast Mindset Matters and SAMPA. Win a free conference registration in Orlando, December 4–6, 2026. Follow, like, tag, and comment on Instagram to enter. Giveaway ends October 1. Registration only; travel and lodging not included."
        className="scroll-clear-header w-full max-w-md mx-auto rounded-3xl border border-primary/10 shadow-sm mb-10"
      />

      <section
        aria-labelledby="how-to-enter"
        className="scroll-clear-header bg-white rounded-4xl border border-primary/10 shadow-sm p-8 md:p-10"
      >
        <h2 id="how-to-enter" className="text-2xl md:text-3xl font-drama font-bold mb-6">
          How to enter
        </h2>
        <ol className="space-y-5">
          <li className="flex gap-4">
            <StepNumber>1</StepNumber>
            <p className="text-text/80 leading-relaxed pt-1">
              Follow{' '}
              <InstagramLink href={MINDSET_INSTAGRAM}>@PA_mindsetmatters</InstagramLink>
              {' '}and{' '}
              <InstagramLink href={SAMPA_INSTAGRAM}>@Societyofaddictionmedicinepas</InstagramLink>
              .
            </p>
          </li>
          <li className="flex gap-4">
            <StepNumber>2</StepNumber>
            <p className="text-text/80 leading-relaxed pt-1">Like and save the post.</p>
          </li>
          <li className="flex gap-4">
            <StepNumber>3</StepNumber>
            <p className="text-text/80 leading-relaxed pt-1">Tag a PA or PA student.</p>
          </li>
          <li className="flex gap-4">
            <StepNumber>4</StepNumber>
            <p className="text-text/80 leading-relaxed pt-1">
              Comment: Why does addiction medicine education matter in your practice?
            </p>
          </li>
        </ol>
        <p className="mt-6 rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary-text font-medium leading-relaxed">
          Bonus entry: share to your story and tag us.
        </p>
        <p className="mt-6 text-sm text-text/50 leading-relaxed">
          Giveaway ends October 1, 2026. Registration only. Travel and lodging not included.
        </p>
      </section>
    </>
  );
}

function StepNumber({ children }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary-text text-sm font-semibold">
      {children}
    </span>
  );
}

function InstagramLink({ href, children }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary-text font-semibold hover:underline"
    >
      {children}
    </a>
  );
}
