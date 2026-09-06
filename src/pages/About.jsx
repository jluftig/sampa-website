import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DonateLink from '../components/DonateLink';
import LeadershipRoster from '../components/LeadershipRoster';

// About's job: who we are + who leads. Programs, CAQ, news, join, donate,
// and the no-wrong-doors pitch already have homes. Keep 501(c)(3) + EIN
// and the official-domain statement findable for Ad Grants / Workspace.

export default function AboutPage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return undefined;
    const id = hash.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      const t = requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return () => cancelAnimationFrame(t);
    }
    return undefined;
  }, [hash]);

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-24">
        <header className="max-w-3xl mb-10 md:mb-12 scroll-mt-32" id="who-we-are">
          <div className="text-primary-text font-bold font-data tracking-widest text-xs mb-4 uppercase">
            About SAMPA
          </div>
          <h1 className="text-3xl md:text-5xl font-drama font-bold leading-tight mb-6">
            Society of Addiction Medicine Physician Associates
          </h1>
          <p className="text-lg md:text-xl text-text/70 leading-relaxed font-medium mb-5">
            SAMPA is the national society for physician associates who practice
            — or are preparing to practice — addiction medicine in all settings,
            from OTPs to emergency departments to street medicine to FQHCs and
            everything in between. Enter any door in the house of medicine and
            PAs are there ready to help.
          </p>
          <p
            id="nonprofit-status"
            className="text-sm font-semibold text-primary-text font-data tracking-wide mb-3"
          >
            SAMPA, Inc. is a 501(c)(3) nonprofit organization · EIN 42-2288772
          </p>
          <p
            id="official-domain"
            className="text-sm text-text/70 leading-relaxed mb-6"
          >
            SAMPA, Inc. (EIN 42-2288772), Society of Addiction Medicine
            Physician Associates, operates{' '}
            <a
              href="https://www.addictionpas.org"
              className="text-primary-text hover:underline"
            >
              https://www.addictionpas.org
            </a>{' '}
            as its official website and @addictionpas.org email domain. The
            shorter domain sampa.org was unavailable, so addictionpas.org is
            used; the legal name has not changed.
          </p>
        </header>

        <LeadershipRoster />

        <div className="max-w-3xl mt-16 md:mt-20 space-y-12 text-lg text-text/80 leading-relaxed">
          <section id="programs" aria-labelledby="elsewhere-heading" className="scroll-mt-32">
            <h2
              id="elsewhere-heading"
              className="text-2xl md:text-3xl font-drama font-bold text-text mb-4"
            >
              Elsewhere on the site
            </h2>
            <p className="mb-6">
              This page is who we are and who leads. Daily news,
              the program catalog, the Addiction Medicine CAQ, policy comments,
              membership, and giving each have their own home.
            </p>
            <ul className="flex flex-col sm:flex-wrap sm:flex-row gap-x-6 gap-y-3 text-base font-semibold">
              <li>
                <Link to="/#programs" className="text-primary-text hover:underline">
                  What we do
                </Link>
              </li>
              <li>
                <Link to="/news" className="text-primary-text hover:underline">
                  News
                </Link>
              </li>
              <li>
                <Link to="/caq" className="text-primary-text hover:underline">
                  Addiction Medicine CAQ
                </Link>
              </li>
              <li>
                <Link to="/policy" className="text-primary-text hover:underline">
                  Policy hub
                </Link>
              </li>
              <li>
                <Link to="/join" className="text-primary-text hover:underline">
                  Membership
                </Link>
              </li>
              <li>
                <DonateLink className="text-primary-text hover:underline">
                  Donate
                </DonateLink>
              </li>
            </ul>
          </section>

          <section id="get-involved" aria-labelledby="get-involved-heading" className="scroll-mt-32">
            <h2
              id="get-involved-heading"
              className="text-2xl md:text-3xl font-drama font-bold text-text mb-4"
            >
              Join the work
            </h2>
            <p className="mb-8">
              Membership opens the peer directory. A gift keeps the work going.
              Both serve the same end: patients reaching care.
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-3">
              <Link
                to="/join"
                className="btn-magnetic bg-accent text-white px-7 py-3.5 rounded-full text-sm font-semibold shadow-md inline-block text-center"
              >
                Become a member
              </Link>
              <DonateLink className="px-7 py-3.5 rounded-full border-2 border-primary-text text-primary-text text-sm font-semibold hover:bg-primary-text hover:text-white transition-colors inline-block text-center">
                Donate
              </DonateLink>
              <a
                href="https://forms.gle/YqYYRVE9z2nCYdNz5"
                target="_blank"
                rel="noopener noreferrer"
                className="px-7 py-3.5 rounded-full border border-primary/20 text-text text-sm font-semibold hover:bg-primary/5 transition-colors inline-block text-center"
              >
                Contact us
              </a>
            </div>
            <p className="mt-8 text-sm text-text/60 leading-relaxed">
              SAMPA, Inc. is recognized by the IRS as tax-exempt under Section
              501(c)(3) of the Internal Revenue Code. EIN 42-2288772.
              Contributions are tax-deductible to the extent allowed by law.
            </p>
            <p className="mt-3 text-sm text-text/60 leading-relaxed">
              Official website:{' '}
              <a
                href="https://www.addictionpas.org"
                className="text-primary-text hover:underline"
              >
                https://www.addictionpas.org
              </a>
              {' '}· @addictionpas.org email
            </p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
