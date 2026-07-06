import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-text text-white py-16 px-4 border-t border-text/10">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">

        <div className="flex flex-col items-center md:items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl">
              <img src="/SAMPA_no_bg.svg" alt="SAMPA Logo" className="h-8 object-contain" />
            </div>
          </div>
          <p className="text-white/60 max-w-sm text-sm">
            Advancing addiction medicine nationally for Physician Associates.
          </p>
        </div>

        <div className="flex gap-8 text-sm font-medium text-white/60">
          <a href="/#about" className="hover:text-white transition-colors">About</a>
          <a href="/#membership" className="hover:text-white transition-colors">Membership</a>
          <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
          <a href="https://forms.gle/YqYYRVE9z2nCYdNz5" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Contact Us</a>
          <Link to="/dashboard" className="hover:text-white transition-colors">Member Area</Link>
          <Link to="/login?next=%2Feditor" className="hover:text-white transition-colors">Editor Login</Link>
        </div>

      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-center text-xs text-white/40">
        <p className="font-data tracking-wide uppercase mb-2">
          Legal & Tax Status
        </p>
        <p>
          SAMPA is pending 501(c)(3) nonprofit status.
          © {new Date().getFullYear()} SAMPA, Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
