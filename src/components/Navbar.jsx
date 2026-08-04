import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../lib/AuthContext';
import DonateLink from './DonateLink';

export default function Navbar() {
  const navRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { canAccessMemberDirectory } = useAuth();

  useEffect(() => {
    gsap.fromTo(navRef.current,
      { y: -100, opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2 }
    );
  }, []);

  return (
    <nav ref={navRef} className="fixed top-6 left-0 right-0 z-50 px-4 md:px-8 flex flex-col items-center w-full max-w-7xl mx-auto">
      <div className="bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-primary/10 px-6 py-3 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Link to="/">
            <img src="/SAMPA_no_bg.svg" alt="SAMPA Logo" className="h-10 object-contain" />
          </Link>
        </div>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-6 font-medium text-sm text-text/80">
          <Link to="/news" className="hover:text-primary-text transition-colors">News</Link>
          <Link to="/about" className="hover:text-primary-text transition-colors">About</Link>
          <a href="/#programs" className="hover:text-primary-text transition-colors">Programs</a>
          <a href="/#membership" className="hover:text-primary-text transition-colors">Membership</a>
          <a href="https://sampastore.printful.me" target="_blank" rel="noopener noreferrer" className="hover:text-primary-text transition-colors">Store</a>
          <DonateLink className="hover:text-primary-text transition-colors">Donate</DonateLink>
          {canAccessMemberDirectory && (
            <Link to="/members" className="hover:text-primary-text transition-colors">Directory</Link>
          )}
        </div>

        {/* Desktop CTAs — Login secondary, Join primary */}
        <div className="hidden lg:flex items-center gap-2.5">
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-full border-2 border-primary-text text-primary-text text-sm font-semibold hover:bg-primary-text hover:text-white transition-colors"
          >
            Member Login
          </Link>
          <Link to="/join" className="btn-magnetic bg-accent text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md inline-block">
            <span>Join</span>
          </Link>
        </div>

        {/* Mobile/Tablet Hamburger Toggle */}
        <button
          className="lg:hidden p-2 text-primary-text focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile/Tablet Dropdown Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden w-full mt-2 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-primary/10 p-4 flex flex-col gap-4">
          <Link to="/news" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={() => setIsMobileMenuOpen(false)}>News</Link>
          <Link to="/about" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={() => setIsMobileMenuOpen(false)}>About</Link>
          <a href="/#programs" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={() => setIsMobileMenuOpen(false)}>Programs</a>
          <a href="/#membership" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={() => setIsMobileMenuOpen(false)}>Membership</a>
          <a href="https://sampastore.printful.me" target="_blank" rel="noopener noreferrer" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={() => setIsMobileMenuOpen(false)}>Store</a>
          <DonateLink className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={() => setIsMobileMenuOpen(false)}>Donate</DonateLink>
          {canAccessMemberDirectory && (
            <Link to="/members" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={() => setIsMobileMenuOpen(false)}>Directory</Link>
          )}
          <div className="mt-2 pt-4 border-t border-primary/10 flex flex-col gap-2.5">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-full border-2 border-primary-text text-primary-text text-sm font-semibold text-center hover:bg-primary-text hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Member Login
            </Link>
            <Link
              to="/join"
              className="bg-accent text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md inline-block text-center w-full"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Join
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
