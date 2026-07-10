import React from 'react';
import { Link } from 'react-router-dom';
import { Check, Star, Heart } from 'lucide-react';
import { MEMBERSHIP_TIERS } from '../lib/membership';

export default function Membership() {
  const membershipTiers = MEMBERSHIP_TIERS;

  const donationTiers = [
    { name: 'Community Supporter', price: 'Free', desc: 'Newsletter access only' },
    { name: 'Bronze', price: '$25', desc: 'Supporter', color: 'text-orange-700', bg: 'bg-orange-700/5', border: 'border-orange-700/20' },
    { name: 'Silver', price: '$75', desc: 'Supporter', highlight: true },
    { name: 'Gold', price: '$150', desc: 'Supporter', color: 'text-yellow-500', bg: 'bg-yellow-500/5', border: 'border-yellow-500/30' },
    { name: 'Platinum', price: '$300', desc: 'Supporter', color: 'text-slate-800', bg: 'bg-slate-800/5', border: 'border-slate-800/20' },
    { name: 'Patron', price: '$600+', desc: 'Supporter' },
    { name: 'Organizational', price: '$1,500+', desc: 'Supporter' },
  ];

  return (
    <section id="membership" className="py-24 px-4 max-w-7xl mx-auto">

      {/* MEMBERSHIP SECTION */}
      <div className="text-center mb-16">
        <div className="inline-block px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold mb-6 font-data uppercase tracking-wider">
          Membership Structure
        </div>
        <h2 className="text-4xl md:text-5xl font-drama font-bold text-text mb-6">
          Join SAMPA today.
        </h2>
        <p className="text-lg text-text/70 max-w-2xl mx-auto">
          Help shape the future of PA addiction medicine. Choose the membership level that best fits your career stage.
        </p>
      </div>

      {/* Multi-Year Discount Alert */}
      <div className="max-w-4xl mx-auto bg-primary/5 border border-primary/20 rounded-3xl p-6 md:p-8 mb-16 flex flex-col md:flex-row items-center gap-6 shadow-sm">
        <div className="bg-white p-4 rounded-full text-primary shrink-0 shadow-sm">
          <Star className="w-8 h-8 fill-primary/10" />
        </div>
        <div>
          <h3 className="font-bold text-xl text-primary-text mb-2">Multi-Year Discounts Available!</h3>
          <p className="text-text/80 text-sm md:text-base leading-relaxed">
            Commit to the future of SAMPA and save: get <strong>~10% off for 2 years</strong>, or <strong>up to ~20% off for 3 years</strong> — pick your term at checkout.
            <span className="block mt-1 text-xs opacity-70 italic">(Student and Pre-PA memberships: up to 2 years. Legacy members can choose a $125 lifetime membership.)</span>
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
              Select Tier
            </Link>
          </div>
        ))}
      </div>


      {/* DONATION SECTION */}
      <div className="max-w-6xl mx-auto border-t border-text/10 pt-24">
        <div className="text-center mb-16">
          <div className="inline-block px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-primary-text text-xs font-semibold mb-6 font-data uppercase tracking-wider flex items-center gap-2 mx-auto w-fit">
            <Heart className="w-4 h-4" /> Support Our Mission
          </div>
          <h2 className="text-3xl md:text-5xl font-drama font-bold text-text mb-6">
            Make a Donation
          </h2>
          <p className="text-lg text-text/70 max-w-2xl mx-auto">
            SAMPA is pending 501(c)(3) nonprofit status. Your generous contributions help us advocate, educate, and build our national network.
          </p>
        </div>

        {/* Donation Frequency Alert */}
        <div className="max-w-3xl mx-auto bg-text/5 border border-text/10 rounded-2xl p-6 mb-12 text-center shadow-sm">
          <p className="text-text/80 text-sm md:text-base">
            <strong>Pledge your ongoing support:</strong> Choose a One-time gift, Annual recurring, or setup a <strong>2-Year Pledge (10% savings)</strong> or <strong>3-Year Pledge (15% savings)</strong>.
          </p>
        </div>

        {/* Donation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
          {donationTiers.map((tier, idx) => (
            <div key={idx} className={`${tier.highlight ? 'bg-text text-white border-accent shadow-xl transform md:-translate-y-1 relative overflow-hidden' : `bg-white ${tier.bg || ''} ${tier.border || 'border-text/10'} text-text`} p-6 rounded-3xl border ${idx === donationTiers.length - 1 ? 'col-span-2 md:col-span-4 lg:col-span-2' : ''} shadow-sm flex flex-col items-center text-center hover:shadow-md transition-all`}>
              {tier.highlight && (
                <div className="absolute top-5 -right-12 w-40 text-center bg-accent rotate-45 py-1 text-[10px] font-bold font-data tracking-wider uppercase shadow-sm text-white">Featured</div>
              )}
              <div className={`text-2xl font-bold mb-1 relative z-10 ${tier.highlight ? 'text-white' : 'text-text'}`}>{tier.price}</div>
              <div className={`font-semibold text-sm mb-2 relative z-10 ${tier.highlight ? 'text-accent' : (tier.color || 'text-primary-text')}`}>{tier.name}</div>
              <div className={`text-xs relative z-10 ${tier.highlight ? 'text-white/60' : 'text-text/50'}`}>{tier.desc}</div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <a href="https://forms.gle/vfSJS9LTPwT9TMT59" target="_blank" rel="noopener noreferrer" className="btn-magnetic bg-gradient-to-r from-primary-text to-accent text-white text-lg px-10 py-4 rounded-full shadow-xl font-bold flex items-center justify-center hover:shadow-2xl transition-all">
            Donate Now
          </a>
        </div>
      </div>

    </section>
  );
}
