import React from 'react';
import { Link } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Landing page after Brevo DOI confirmation click (redirectionUrl).
export default function NewsletterConfirmed() {
  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-xl mx-auto px-4 pt-32 pb-24 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-6">
          <MailCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl md:text-4xl font-drama font-bold mb-4">
          You’re subscribed
        </h1>
        <p className="text-text/70 mb-8 leading-relaxed">
          Thanks for confirming. You’ll receive SAMPA Updates — a weekly email
          with practice news, society notes, and the policy changes that affect
          your patients’ access to care. No membership required.
        </p>
        <div className="flex flex-wrap justify-center gap-4 text-sm font-semibold">
          <Link
            to="/news"
            className="px-5 py-2.5 rounded-full bg-primary text-white hover:opacity-90 transition-opacity"
          >
            Read the news
          </Link>
          <Link
            to="/join"
            className="px-5 py-2.5 rounded-full border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
          >
            Explore membership
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
