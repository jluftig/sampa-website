import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import ValueProps from '../components/ValueProps';
import Membership from '../components/Membership';
import EventsTeaser from '../components/EventsTeaser';
import Footer from '../components/Footer';

export default function Home() {
  const containerRef = useRef(null);

  useEffect(() => {
    // Basic GSAP fade in for the whole app
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1, ease: "power2.out" }
    );
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-background text-text overflow-hidden">
      {/* Global CSS noise overlay */}
      <div className="noise-overlay pointer-events-none"></div>

      <Navbar />

      <main className="w-full">
        <Hero />
        <About />
        <ValueProps />
        <Membership />
        <EventsTeaser />
      </main>

      <Footer />
    </div>
  );
}
