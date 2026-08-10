import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { markSvgString } from './heroMark';
import DonateLink from './DonateLink';

// Static wordmark hero (Ad Grants PageSpeed pass). Particle "Assembly" effect
// parked until after approval — see docs/STATUS.md.

export default function Hero() {
  const [reducedMotion] = useState(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const [cueReady, setCueReady] = useState(false);
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setCueReady(true), reducedMotion ? 300 : 800);
    const onScroll = () => setScrolledPast(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(t);
      window.removeEventListener('scroll', onScroll);
    };
  }, [reducedMotion]);

  function scrollToAbout() {
    const about = document.getElementById('about');
    if (about) about.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  return (
    <section
      className="relative min-h-screen overflow-hidden flex items-center justify-center px-4 pt-24 pb-16 bg-gradient-to-br from-[#FBFCFC] via-[#F0F7F5] to-[#F6F0F8]"
    >
      <div className="relative z-10 w-full flex flex-col items-center text-center">
        <div
          className="w-[min(90vw,1100px)] md:w-[min(74vw,1100px)] aspect-[711/183] mb-[4vh]"
          dangerouslySetInnerHTML={{ __html: markSvgString({ holeFill: '#F4F7F5' }) }}
        />

        <div className="font-data text-[11px] md:text-xs tracking-[0.22em] uppercase text-text/60 mb-2">
          Society of Addiction Medicine PAs
        </div>
        <p className="font-data text-[11px] md:text-xs tracking-wide text-text/50 mb-5">
          501(c)(3) nonprofit · EIN 42-2288772
        </p>

        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-text mb-6 [text-wrap:balance]">
          Care that <span className="font-drama font-semibold">reaches people</span>
        </h1>

        <p className="max-w-2xl mx-auto text-base md:text-xl text-text/70 leading-relaxed font-medium mb-8">
          The society for PAs in addiction medicine. We connect you with peers,
          keep your practice current, and speak up when policy gets between your
          patients and treatment.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/join"
            className="btn-magnetic bg-accent text-white px-8 py-3.5 rounded-full text-sm font-semibold shadow-md inline-block min-w-[10rem] text-center"
          >
            Join
          </Link>
          <DonateLink className="px-8 py-3.5 rounded-full border-2 border-primary-text text-primary-text text-sm font-semibold hover:bg-primary-text hover:text-white transition-colors inline-block min-w-[10rem] text-center">
            Donate
          </DonateLink>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToAbout}
        aria-label="Scroll to about SAMPA"
        className={`absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-10 rounded-full p-2 text-primary-text/70 hover:text-primary-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-text transition-opacity duration-700 [@media(max-height:560px)]:hidden ${
          cueReady && !scrolledPast ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <ChevronDown className="w-7 h-7 animate-cue-bounce" aria-hidden="true" />
      </button>
    </section>
  );
}
