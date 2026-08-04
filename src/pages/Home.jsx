import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import About from '../components/About';
import ValueProps from '../components/ValueProps';
import Membership from '../components/Membership';
import NewsTeaser from '../components/NewsTeaser';
import Footer from '../components/Footer';

export default function Home() {
  const containerRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(containerRef.current,
      { opacity: 0 },
      { opacity: 1, duration: 1, ease: "power2.out" }
    );
  }, []);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-background text-text overflow-hidden">
      <div className="noise-overlay pointer-events-none"></div>

      <Navbar />

      <main className="w-full">
        <Hero />
        <About />
        <ValueProps />
        <NewsTeaser />
        <Membership />
      </main>

      <Footer />
    </div>
  );
}
