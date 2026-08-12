import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import DonateLink from '../components/DonateLink';

// Public About Us page — mission, nonprofit status, programs (live + in development).
// Written for Ad Grants reviewers and new visitors who need substantial HTML content.

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

      <main className="max-w-3xl mx-auto px-4 pt-32 pb-24">
        <header className="mb-14">
          <div className="text-primary-text font-bold font-data tracking-widest text-xs mb-4 uppercase">
            About SAMPA
          </div>
          <h1 className="text-3xl md:text-5xl font-drama font-bold leading-tight mb-6">
            Society of Addiction Medicine Physician Associates
          </h1>
          <p className="text-lg md:text-xl text-text/70 leading-relaxed font-medium">
            SAMPA, Inc. is a 501(c)(3) nonprofit organization (EIN 42-2288772).
            We strengthen the physician associates who deliver addiction
            medicine—so high-quality care reaches more people and communities,
            especially where treatment is hardest to find.
          </p>
        </header>

        <div className="space-y-14 text-lg text-text/80 leading-relaxed">
          <section aria-labelledby="who-we-are">
            <h2 id="who-we-are" className="text-2xl md:text-3xl font-drama font-bold text-text mb-4">
              Who we are
            </h2>
            <p className="mb-4">
              SAMPA is the professional society for physician associates (PAs)
              who practice—or are preparing to practice—in addiction medicine.
              We exist because people with substance use disorders deserve care
              that is current, compassionate, and grounded in evidence, and
              because the PAs who deliver that care need a national home for
              education, peer connection, and professional growth.
            </p>
            <p>
              Our members deliver evidence-based care for substance use
              disorders and co-occurring mental health conditions across
              emergency departments, hospitals, primary care, and community
              settings, including Federally Qualified Health Centers (FQHCs)
              and other safety-net clinics. Through that work we serve the
              patients, families, and communities affected by substance use.
              Our membership includes practicing PAs, students, and pre-PA
              learners who share a commitment to this field.
            </p>
          </section>

          <section aria-labelledby="mission">
            <h2 id="mission" className="text-2xl md:text-3xl font-drama font-bold text-text mb-4">
              Our mission
            </h2>
            <p className="mb-4">
              SAMPA is dedicated to improving public health outcomes in
              addiction medicine by advancing the education, training, clinical
              practice, and professional development of physician
              associates—so they may deliver high-quality, accessible,
              patient-centered, and evidence-based care to individuals and
              communities impacted by substance use disorders.
            </p>
            <p>
              Everything we build is measured against that outcome: better care
              for people who need it. News, networking, and the education and
              practice tools we are developing are means to that end—not ends
              in themselves.
            </p>
          </section>

          <section
            aria-labelledby="nonprofit-status"
            className="rounded-3xl border border-primary/15 bg-primary/5 p-8 md:p-10"
          >
            <h2 id="nonprofit-status" className="text-2xl md:text-3xl font-drama font-bold text-text mb-4">
              Nonprofit status
            </h2>
            <p className="mb-4">
              <strong className="text-text">SAMPA, Inc.</strong> is recognized
              by the Internal Revenue Service as a tax-exempt organization under
              Section <strong className="text-text">501(c)(3)</strong> of the
              Internal Revenue Code. Our Employer Identification Number (EIN)
              is <strong className="text-text">42-2288772</strong>.
            </p>
            <p className="mb-6">
              Contributions to SAMPA are tax-deductible to the extent allowed by
              law. Donations sustain daily provider news, member networking,
              and the education, email, and practice resources we are building.
            </p>
            <DonateLink className="inline-block bg-gradient-to-r from-primary-text to-accent text-white px-7 py-3 rounded-full text-sm font-semibold shadow-md">
              Make a tax-deductible donation
            </DonateLink>
          </section>

          <section id="programs" aria-labelledby="programs-heading">
            <h2 id="programs-heading" className="text-2xl md:text-3xl font-drama font-bold text-text mb-4">
              What we do
            </h2>
            <p className="mb-8">
              SAMPA is a young organization. Almost everything we offer today is
              newly launched—and we are actively building the next layer of
              practice support. Below is an honest account of what is live now
              and what is in development.
            </p>

            <h3 className="text-xl font-bold text-text mb-3 tracking-tight">
              Live programs
            </h3>
            <ul className="list-disc pl-6 space-y-4 mb-10">
              <li>
                <strong className="text-text">Daily news and Key Points</strong>
                <span className="ml-2 align-middle text-xs font-data uppercase tracking-wider text-accent font-semibold">
                  New
                </span>
                <span className="text-text/80">. </span>
                We publish original coverage of research, policy, and practice
                developments in addiction medicine so you can stay on top of
                critical, breaking information—and better support your patients
                and communities. Browse the{' '}
                <Link to="/news" className="text-primary-text font-semibold underline-offset-2 hover:underline">
                  news archive
                </Link>
                .
              </li>
              <li>
                <strong className="text-text">Member email updates</strong>
                <span className="ml-2 align-middle text-xs font-data uppercase tracking-wider text-accent font-semibold">
                  New
                </span>
                <span className="text-text/80">. </span>
                Society announcements and a weekly roundup of the news we
                publish for physician associates.
              </li>
              <li>
                <strong className="text-text">Member networking directory</strong>
                <span className="ml-2 align-middle text-xs font-data uppercase tracking-wider text-accent font-semibold">
                  New
                </span>
                <span className="text-text/80">. </span>
                Active members can use a private peer directory to find
                colleagues, collaborate on mission-related projects, and reduce
                professional isolation in addiction medicine. Members control
                listing and contact preferences. Membership starts on our{' '}
                <Link to="/join" className="text-primary-text font-semibold underline-offset-2 hover:underline">
                  join page
                </Link>
                .
              </li>
              <li>
                <strong className="text-text">Policy hub</strong>
                <span className="ml-2 align-middle text-xs font-data uppercase tracking-wider text-accent font-semibold">
                  New
                </span>
                <span className="text-text/80">. </span>
                Where SAMPA will publish its public voice for expanding access to
                medications for addiction treatment—including buprenorphine and
                other MOUD. We are starting with federal public comments and
                intend to grow into positions and statements across federal and
                state policy, payment, and everyday practice—not partisan
                politics.
                Explore the{' '}
                <Link to="/policy" className="text-primary-text font-semibold underline-offset-2 hover:underline">
                  policy hub
                </Link>
                .
              </li>
            </ul>

            <h3 className="text-xl font-bold text-text mb-3 tracking-tight">
              Programs in development
            </h3>
            <p className="mb-4">
              The following initiatives are planned and in progress. They are
              described here so visitors understand our roadmap; dedicated
              program pages will launch when each offering is ready.
            </p>
            <ul className="list-disc pl-6 space-y-4">
              <li>
                <strong className="text-text">Practice resources</strong>
                <span className="ml-2 align-middle text-xs font-data uppercase tracking-wider text-text/50 font-semibold">
                  Coming soon
                </span>
                <span className="text-text/80">. </span>
                Curated clinical guidance so you can bring current best
                practices and up-to-date treatments to your patients.
              </li>
              <li>
                <strong className="text-text">CME (continuing medical education)</strong>
                <span className="ml-2 align-middle text-xs font-data uppercase tracking-wider text-text/50 font-semibold">
                  Coming soon
                </span>
                <span className="text-text/80">. </span>
                Education activities tailored to addiction medicine, built to
                keep your clinical skills sharp across a career.
              </li>
              <li>
                <strong className="text-text">Job board</strong>
                <span className="ml-2 align-middle text-xs font-data uppercase tracking-wider text-text/50 font-semibold">
                  Coming soon
                </span>
                <span className="text-text/80">. </span>
                A mission-aligned board for addiction medicine roles—find a
                position where your work serves individuals and communities
                affected by substance use.
              </li>
            </ul>
          </section>

          <section aria-labelledby="get-involved">
            <h2 id="get-involved" className="text-2xl md:text-3xl font-drama font-bold text-text mb-4">
              How to get involved
            </h2>
            <p className="mb-8">
              Whether addiction medicine is your specialty, one patient a
              shift, or a field you&rsquo;re preparing to enter, you can
              strengthen this work by reading our{' '}
              <Link to="/news" className="text-primary-text font-semibold underline-offset-2 hover:underline">
                news
              </Link>
              , becoming a member for the peer directory, supporting our
              nonprofit mission with a gift, or reaching out to our team.
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
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
