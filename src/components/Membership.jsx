import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Heart } from 'lucide-react';
import { MEMBERSHIP_TIERS } from '../lib/membership';
import DonateLink from './DonateLink';

export default function Membership() {
  const membershipTiers = MEMBERSHIP_TIERS;

  return (
    <section id="membership" className="scroll-mt-32 py-24 px-4 max-w-7xl mx-auto">

      {/* MEMBERSHIP SECTION */}
      <div className="text-center mb-16">
        <div className="inline-block px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold mb-6 font-data uppercase tracking-wider">
          Membership Structure
        </div>
        <h2 className="text-4xl md:text-5xl font-drama font-bold text-text mb-6">
          Join SAMPA today.
        </h2>
        <p className="text-lg text-text/70 max-w-2xl mx-auto">
          Join a national community of physician associates improving care for people and communities impacted by substance use disorders — whether you practice addiction medicine every day or meet it one patient at a time.
          Members get newly launched benefits: a daily news feed, member email updates (announcements and a weekly news roundup), a private peer networking directory (you control listing and contact details),
          and support for SAMPA’s policy hub—where we will grow a public voice for access to MOUD and MAT in federal and state policy, payment, and everyday practice (starting with federal comments).
          Members stay in the loop as the{' '}
          <Link to="/caq" className="text-primary-text font-semibold hover:underline">
            Addiction Medicine CAQ
          </Link>
          {' '}takes shape.
          Choose the level that fits your career stage. On Join, pick a term and pay.
        </p>
      </div>

      {/* Multi-year teaser — full term picker lives on /join */}
      <div className="max-w-4xl mx-auto bg-primary/5 border border-primary/20 rounded-3xl p-6 md:p-8 mb-16 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="bg-white p-4 rounded-full text-primary shrink-0 shadow-sm">
          <Star className="w-8 h-8 fill-primary/10" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-primary-text mb-2">Multi-year savings when you join</h3>
          <p className="text-text/80 text-sm md:text-base leading-relaxed">
            Annual prices shown below. On Join you can choose a longer term and save{' '}
            <strong>10–13% for 2 years</strong> or <strong>17–20% for 3 years</strong>.
            <span className="block mt-1 text-xs opacity-70 italic">
              (Student and Pre-PA: up to 2 years. Legacy: optional $125 lifetime.)
            </span>
          </p>
        </div>
      </div>

      {/* Membership Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-24">
        {membershipTiers.map((tier) => (
          <div key={tier.key} className={`${tier.highlight ? 'bg-text text-white border-accent shadow-2xl transform md:-translate-y-2' : 'bg-white border-primary/10 text-text'} p-8 rounded-4xl border shadow-sm flex flex-col justify-between hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden`}>
            {tier.highlight && (
              <div className="absolute top-6 -right-10 w-40 text-center bg-accent rotate-45 py-1 text-xs font-bold font-data tracking-wider uppercase shadow-md text-white">Featured</div>
            )}
            <div className="relative z-10">
              <h3 className="text-xl tracking-tight font-bold mb-2">{tier.name}</h3>
              <p className={`${tier.highlight ? 'text-white/70' : 'text-text/60'} text-sm mb-6 h-10`}>{tier.desc}</p>
              <div className={`text-4xl font-bold font-sans mb-8 ${tier.highlight ? 'text-white' : 'text-primary-text'}`}>
                ${tier.prices[1]}<span className={`text-lg font-normal ${tier.highlight ? 'text-white/50' : 'text-text/50'}`}>/yr</span>
              </div>
            </div>
            <Link to={`/join?tier=${tier.key}`} className={`block text-center w-full py-3.5 rounded-full font-bold transition-colors relative z-10 ${tier.highlight ? 'bg-gradient-to-r from-primary-text to-accent text-white hover:shadow-lg hover:scale-[1.02]' : 'border-2 border-primary-text text-primary-text hover:bg-primary-text/5'}`}>
              Join as {tier.name}
            </Link>
          </div>
        ))}
      </div>


      {/* DONATION SECTION */}
      <div className="max-w-6xl mx-auto border-t border-text/10 pt-24">
        <div className="text-center mb-12">
          <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary-text text-xs font-semibold mb-6 font-data uppercase tracking-wider flex items-center gap-2 mx-auto w-fit">
            <Heart className="w-4 h-4" /> Support Our Mission
          </div>
          <h2 className="text-3xl md:text-5xl font-drama font-bold text-text mb-6">
            Make a Donation
          </h2>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            SAMPA, Inc. is a 501(c)(3) nonprofit. Your tax-deductible gift keeps the news publishing daily, the directory growing, and the policy work moving—and helps build the education, email, and practice resources coming next—so more patients reach high-quality addiction care.
          </p>
        </div>

        <div className="flex justify-center">
          <DonateLink className="btn-magnetic bg-gradient-to-r from-primary-text to-accent text-white text-lg px-10 py-4 rounded-full shadow-xl font-bold flex items-center justify-center hover:shadow-2xl transition-all">
            Donate Now
          </DonateLink>
        </div>
      </div>

    </section>
  );
}
