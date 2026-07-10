import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function NotFound() {
  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-40 pb-24 text-center">
        <div className="text-primary-text font-bold font-data tracking-widest text-sm mb-4 uppercase">404</div>
        <h1 className="text-4xl md:text-5xl font-drama font-bold mb-4">Page not found</h1>
        <p className="text-text/60 mb-8">The page you're looking for doesn't exist or may have moved.</p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link to="/" className="bg-accent text-white px-6 py-3 rounded-full font-semibold shadow-md hover:opacity-90 transition-opacity">
            Go home
          </Link>
          <Link to="/news" className="px-6 py-3 rounded-full border border-primary/20 font-semibold hover:bg-primary-text hover:text-white transition-colors">
            Read the news
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
