import React from 'react';
import { Link } from 'react-router-dom';
import { Mail, Newspaper, ScrollText, Users } from 'lucide-react';
import { MEMBERSHIP_TIERS } from '../lib/membership';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const BENEFITS = [
  {
    icon: Newspaper,
    title: 'Daily news and Key Points',
    body: 'Original coverage of research, policy, and practice — so the care you deliver stays current.',
    to: '/news',
    cta: 'Read the news',
  },
  {
    icon: Mail,
    title: 'Member email',
    body: 'Society notes and a weekly roundup of the news we publish for PAs.',
    to: '/#updates-signup',
    cta: 'Get SAMPA Updates',
  },
  {
    icon: Users,
    title: 'Peer directory',
    body: 'A private national directory for active members. You control whether you are listed and what peers can see.',
    to: '/join',
    cta: 'Join to connect',
  },
  {
    icon: ScrollText,
    title: 'Policy work',
    body: 'SAMPA’s public comments and growing voice for access to medications for addiction treatment — including MOUD and MAT.',
    to: '/policy',
    cta: 'See the policy hub',
  },
];

export default function MembershipPage() {
  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-6xl mx-auto px-4 pt-32 pb-24">
        <header className="text-center mb-14">
          <div className="inline-block px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold mb-4 font-data uppercase tracking-wider">
            Step 1 · Membership
          </div>
          <h1 className="text-4xl md:text-5xl font-drama font-bold mb-6">
            Membership for PAs in addiction medicine
          </h1>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            Join a national home for the PAs who treat substance use disorders —
            whether that is your specialty or one patient a shift. Dues keep the
            news, directory, and policy work going so more of your patients reach
            treatment.
          </p>
        </header>

        <section aria-labelledby="benefits" className="mb-16">
          <h2 id="benefits" className="text-2xl md:text-3xl font-drama font-bold text-center mb-8">
            What members have today
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {BENEFITS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-3xl border border-primary/10 p-6 shadow-sm"
                >
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" aria-hidden="true" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-text/70 leading-relaxed mb-4">{item.body}</p>
                  <Link to={item.to} className="text-sm font-semibold text-primary-text hover:underline">
                    {item.cta}
                  </Link>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-text/50 text-center mt-6 max-w-2xl mx-auto leading-relaxed">
            Practice resources, CME, and a job board are in development. They
            are not live yet, so this page does not send you to empty listings.
          </p>
        </section>

        <section aria-labelledby="eligibility" className="mb-16">
          <h2 id="eligibility" className="text-2xl md:text-3xl font-drama font-bold text-center mb-3">
            Who can join
          </h2>
          <p className="text-text/65 text-center max-w-2xl mx-auto mb-8">
            Choose the level that matches your certification and career stage.
            Annual published dues are shown; the next step is where you pick a
            term and pay — or request an employer invoice.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {MEMBERSHIP_TIERS.map((tier) => (
              <div
                key={tier.key}
                className={`${
                  tier.highlight
                    ? 'bg-text text-white border-accent shadow-xl'
                    : 'bg-white border-primary/10 text-text'
                } p-7 rounded-4xl border shadow-sm flex flex-col justify-between`}
              >
                <div>
                  <h3 className="text-xl font-bold mb-2">{tier.name}</h3>
                  <p className={`${tier.highlight ? 'text-white/70' : 'text-text/60'} text-sm mb-5`}>
                    {tier.desc}
                  </p>
                  <div className={`text-3xl font-bold mb-6 ${tier.highlight ? 'text-white' : 'text-primary-text'}`}>
                    ${tier.prices[1]}
                    <span className={`text-base font-normal ${tier.highlight ? 'text-white/50' : 'text-text/50'}`}>
                      /yr
                    </span>
                  </div>
                </div>
                <Link
                  to={`/join?tier=${tier.key}`}
                  className={`block text-center w-full py-3 rounded-full font-bold ${
                    tier.highlight
                      ? 'bg-gradient-to-r from-primary-text to-accent text-white'
                      : 'border-2 border-primary-text text-primary-text hover:bg-primary-text/5'
                  }`}
                >
                  Continue to checkout
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="how-to-pay" className="mb-16">
          <h2 id="how-to-pay" className="text-2xl md:text-3xl font-drama font-bold text-center mb-3">
            How you can pay
          </h2>
          <p className="text-text/65 text-center max-w-2xl mx-auto mb-8">
            You can pay for a single year, or set membership to auto-renew until
            cancelled. Neither is preferred — pick what you or your employer need.
          </p>
          <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
            <div className="bg-white rounded-3xl border border-primary/15 p-6">
              <h3 className="font-bold mb-2">Pay for a single year</h3>
              <p className="text-sm text-text/65 leading-relaxed">
                One payment covering a year of membership. Ask for this on an
                employer invoice if your institution cannot set up a recurring
                payment.
              </p>
            </div>
            <div className="bg-white rounded-3xl border border-primary/15 p-6">
              <h3 className="font-bold mb-2">Auto-renew until cancelled</h3>
              <p className="text-sm text-text/65 leading-relaxed">
                Membership continues at the end of the term until you cancel.
                Card checkout on the next step works this way; an invoice can
                too.
              </p>
            </div>
          </div>
          <p className="text-xs text-text/45 text-center mt-5 max-w-xl mx-auto">
            Two- and three-year terms are available on most levels at checkout.
            Student and Pre-PA cap at two years. Legacy members may choose a
            lifetime option.
          </p>
        </section>

        <section
          aria-labelledby="next-step"
          className="grid md:grid-cols-2 gap-5 max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-3xl border border-primary/15 p-7 text-center shadow-sm">
            <h2 id="next-step" className="text-xl font-bold mb-2">Continue to checkout</h2>
            <p className="text-sm text-text/65 leading-relaxed mb-5">
              Sign in, confirm your level and term, and pay by card on Stripe.
              You will get a receipt after the charge.
            </p>
            <Link
              to="/join"
              className="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-primary-text to-accent text-white font-bold text-sm shadow-md hover:shadow-lg transition-all"
            >
              Go to checkout
            </Link>
          </div>
          <div className="bg-white rounded-3xl border border-primary/15 p-7 text-center shadow-sm">
            <h2 className="text-xl font-bold mb-2">Need an invoice for your employer?</h2>
            <p className="text-sm text-text/65 leading-relaxed mb-5">
              If your hospital, university, or practice needs a SAMPA invoice
              before it can reimburse dues, request one here. You will not be
              charged on that form.
            </p>
            <Link
              to="/join/invoice"
              className="inline-block px-6 py-3 rounded-full border-2 border-primary-text text-primary-text font-bold text-sm hover:bg-primary-text/5 transition-colors"
            >
              Request an employer invoice
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
