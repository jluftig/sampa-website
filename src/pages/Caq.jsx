import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Public Addiction Medicine CAQ page.
// Source of truth for facts: NCCPA announcement
// https://www.nccpa.net/news/new-nccpa-caqs-in-addiction-medicine-and-oncology-approved/
// State only what NCCPA published. Do not invent exam dates, eligibility
// hours, fees, application windows, or imply the exam is open. NCCPA issues
// the CAQ — SAMPA proposed it and does not award it.

const NCCPA_ANNOUNCEMENT =
  'https://www.nccpa.net/news/new-nccpa-caqs-in-addiction-medicine-and-oncology-approved/';

export default function Caq() {
  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none" />
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <header className="mb-14">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="text-primary-text font-bold font-data tracking-widest text-xs uppercase">
              Certificate of Added Qualifications
            </div>
            <span className="text-xs font-data uppercase tracking-wider text-accent font-semibold">
              In development
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-drama font-bold leading-tight mb-6">
            A credential that helps{' '}
            <span className="text-primary-text">patients find you</span>
          </h1>
          <p className="text-lg md:text-xl text-text/70 leading-relaxed font-medium">
            NCCPA approved <strong className="text-text font-semibold">development</strong> of
            a Certificate of Added Qualifications (CAQ) in Addiction Medicine
            after a proposal from SAMPA. The exam is not open. This page tracks
            what NCCPA has published so far — and what you can do while they
            build it.
          </p>
        </header>

        <div className="space-y-8">
          <section
            aria-labelledby="whats-official"
            className="bg-white rounded-4xl border border-primary/10 shadow-sm p-8 md:p-10"
          >
            <h2 id="whats-official" className="text-2xl md:text-3xl font-drama font-bold text-text mb-4">
              What NCCPA approved
            </h2>
            <p className="text-lg text-text/80 leading-relaxed mb-4">
              NCCPA&rsquo;s Board of Directors approved development of CAQs in
              Addiction Medicine and Oncology. Board members considered a
              proposal from the Society of Addiction Medicine Physician
              Associates (SAMPA), along with proposals from oncology PA
              societies for that specialty, and then approved development of
              the two certificates.
            </p>
            <p className="text-lg text-text/80 leading-relaxed mb-4">
              <strong className="text-text">NCCPA issues the CAQ.</strong> SAMPA
              proposed the Addiction Medicine certificate and will keep this
              page current. We do not award the credential, set the exam, or
              decide who is eligible.
            </p>
          </section>

          <section
            aria-labelledby="why-it-matters"
            className="bg-white rounded-4xl border border-primary/10 shadow-sm p-8 md:p-10"
          >
            <h2 id="why-it-matters" className="text-2xl md:text-3xl font-drama font-bold text-text mb-4">
              Why this matters for your patients
            </h2>
            <p className="text-lg text-text/80 leading-relaxed mb-4">
              You already deliver addiction care — in the hospital, clinic,
              street, or wherever someone in front of you needs it. A national
              certificate makes that work visible. When employers, health
              systems, and patients can see a shared standard, more people can
              get to treatment, especially in communities where it is scarce.
            </p>
            <p className="text-lg text-text/80 leading-relaxed">
              The CAQ is for PAs. The reason it exists is the patient who still
              cannot find someone prepared to treat substance use and related
              conditions.
            </p>
          </section>

          <section
            aria-labelledby="not-announced"
            className="bg-white rounded-4xl border border-primary/10 shadow-sm p-8 md:p-10"
          >
            <h2 id="not-announced" className="text-2xl md:text-3xl font-drama font-bold text-text mb-4">
              What is not announced
            </h2>
            <p className="text-lg text-text/80 leading-relaxed mb-4">
              Exam dates, eligibility hours, fees, and application windows have
              not been published. Nobody can sit this exam yet. Do not plan a
              test date or collect hours against a requirement NCCPA has not
              released.
            </p>
            <p className="text-lg text-text/80 leading-relaxed">
              We will update this page when NCCPA publishes those details.
              Until then, treat{' '}
              <a
                href={NCCPA_ANNOUNCEMENT}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-text font-semibold underline-offset-2 hover:underline"
              >
                NCCPA&rsquo;s announcement
              </a>
              {' '}as the source of truth.
            </p>
          </section>

          <section aria-labelledby="what-you-can-do">
            <h2 id="what-you-can-do" className="text-2xl md:text-3xl font-drama font-bold text-text mb-4">
              What you can do now
            </h2>
            <p className="text-lg text-text/80 leading-relaxed mb-8">
              This page explains a credential in development. It is not a CME
              program — SAMPA&rsquo;s continuing education is still coming soon.
              While NCCPA builds the CAQ, you can stay close to the work:
            </p>
            <ul className="grid grid-cols-1 gap-4">
              <li className="bg-white rounded-4xl border border-primary/10 shadow-sm p-8">
                <h3 className="text-xl font-bold text-text mb-2 tracking-tight">
                  Join SAMPA
                </h3>
                <p className="text-text/70 leading-relaxed mb-4">
                  Membership is how you find peers who already practice this
                  work, and how we keep members in the loop as the CAQ takes
                  shape.
                </p>
                <Link
                  to="/join"
                  className="font-semibold text-primary-text underline-offset-2 hover:underline"
                >
                  Become a member
                </Link>
              </li>
              <li className="bg-white rounded-4xl border border-primary/10 shadow-sm p-8">
                <h3 className="text-xl font-bold text-text mb-2 tracking-tight">
                  Read the news
                </h3>
                <p className="text-text/70 leading-relaxed mb-4">
                  Daily coverage of research, practice, and policy so the care
                  you give stays current while the certificate is still being
                  built.
                </p>
                <Link
                  to="/news"
                  className="font-semibold text-primary-text underline-offset-2 hover:underline"
                >
                  Browse the news
                </Link>
              </li>
              <li className="bg-white rounded-4xl border border-primary/10 shadow-sm p-8">
                <h3 className="text-xl font-bold text-text mb-2 tracking-tight">
                  Follow the policy hub
                </h3>
                <p className="text-text/70 leading-relaxed mb-4">
                  SAMPA&rsquo;s public voice for access to medications for
                  addiction treatment. Workforce recognition — including this
                  CAQ — sits in that work.
                </p>
                <Link
                  to="/policy"
                  className="font-semibold text-primary-text underline-offset-2 hover:underline"
                >
                  Open the policy hub
                </Link>
              </li>
            </ul>
          </section>

          <p className="pt-4 text-sm text-text/45 leading-relaxed">
            Source:{' '}
            <a
              href={NCCPA_ANNOUNCEMENT}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-text/55 hover:text-primary-text transition-colors"
            >
              New NCCPA CAQs in Addiction Medicine and Oncology Approved
              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            . NCCPA, nccpa.net. SAMPA will update this page when NCCPA
            publishes exam, eligibility, or fee information.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
