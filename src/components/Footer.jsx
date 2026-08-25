import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Instagram, Facebook } from 'lucide-react';
import DonateLink from './DonateLink';
import NewsletterSignup from './NewsletterSignup';

export default function Footer() {
  const { pathname } = useLocation();
  const showSignup = pathname !== '/newsletter-confirmed';

  return (
    <>
      {showSignup && <NewsletterSignup variant="banner" />}

      <footer className="bg-text text-white py-16 px-4 border-t border-text/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">

          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white p-2 rounded-xl">
                <img src="/SAMPA_no_bg.svg" alt="SAMPA Logo" className="h-8 object-contain" />
              </div>
            </div>
            <p className="text-white/60 max-w-sm text-sm">
              The national society for PAs in addiction medicine — working toward
              better addiction care for the people and communities who need it.
            </p>
            <p className="text-white/50 max-w-sm text-xs font-data tracking-wide">
              501(c)(3) nonprofit · EIN 42-2288772
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://www.instagram.com/societyofaddictionmedicinepas/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SAMPA on Instagram"
                className="p-2 -m-2 text-white/60 hover:text-white transition-colors"
              >
                <Instagram className="h-5 w-5" aria-hidden="true" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61587232361195"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="SAMPA on Facebook"
                className="p-2 -m-2 text-white/60 hover:text-white transition-colors"
              >
                <Facebook className="h-5 w-5" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div className="flex flex-wrap justify-center md:justify-end items-center gap-x-8 gap-y-3 text-sm font-medium text-white/60">
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
            <Link to="/news" className="hover:text-white transition-colors">News</Link>
            <Link to="/policy" className="hover:text-white transition-colors">Policy</Link>
            <Link to="/caq" className="hover:text-white transition-colors">CAQ</Link>
            <a href="/#programs" className="hover:text-white transition-colors">Programs</a>
            <Link to="/join" className="hover:text-white transition-colors">Membership</Link>
            <a href="https://sampastore.printful.me" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Store</a>
            <DonateLink className="hover:text-white transition-colors">Donate</DonateLink>
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
            <a href="https://forms.gle/YqYYRVE9z2nCYdNz5" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contact Us</a>
            <Link
              to="/dashboard"
              className="px-4 py-2 rounded-full border border-white/40 text-white font-semibold hover:bg-white hover:text-text transition-colors"
            >
              Member Login
            </Link>
          </div>

        </div>

        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-xs text-white/40">
          <p className="font-data tracking-wide uppercase mb-2">
            Legal & Tax Status
          </p>
          <p>
            SAMPA, Inc. is a 501(c)(3) nonprofit organization. EIN: 42-2288772.
            © {new Date().getFullYear()} SAMPA, Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
