import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { useAuth } from '../lib/authState';
import { boardNavItem, boardNavPhase } from '../lib/boardNav';
import { joinCta, mySampaItems, showMySampa } from '../lib/mySampa';
import AnnouncementBanner from './AnnouncementBanner';
import DonateLink from './DonateLink';
import MemberLoginLink from './MemberLoginLink';

function BoardNavLink({ className, onClick }) {
  const { loading, user, profile } = useAuth();
  const item = boardNavItem({ phase: boardNavPhase({ loading, user, profile }), profile });
  if (!item) return null;
  return (
    <Link to={item.to} className={className} onClick={onClick}>
      {item.label}
    </Link>
  );
}

function MySampaEntries({ items, onNavigate, itemClass, menu = false }) {
  const { signOut } = useAuth();
  const [signOutError, setSignOutError] = useState('');

  async function onSignOut() {
    setSignOutError('');
    try {
      const result = await signOut();
      if (result?.error) throw result.error;
      onNavigate?.();
    } catch (error) {
      console.error('Sign out failed', error);
      setSignOutError('Could not sign out. Try again.');
    }
  }

  return (
    <>
      {items.map((item) => {
        const itemRole = menu ? 'menuitem' : undefined;
        if (item.action === 'sign-out') {
          return (
            <button
              key={item.id}
              type="button"
              role={itemRole}
              className={itemClass}
              onClick={() => { void onSignOut(); }}
            >
              {item.label}
            </button>
          );
        }
        return (
          <Link
            key={item.id}
            to={item.to}
            role={itemRole}
            className={itemClass}
            onClick={onNavigate}
          >
            {item.label}
          </Link>
        );
      })}
      {signOutError ? (
        <p role="alert" className="px-4 py-2 text-xs text-red-600">{signOutError}</p>
      ) : null}
    </>
  );
}

function MySampaMenu({ items }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      setOpen(false);
      triggerRef.current?.focus({ focusVisible: true });
    };
    const onFocusIn = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    document.addEventListener('focusin', onFocusIn);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusin', onFocusIn);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    menuRef.current?.querySelector('[role="menuitem"]')?.focus({ focusVisible: true });
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        className={desktopLoginClass}
        onClick={() => setOpen((value) => !value)}
      >
        My SAMPA
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          className="absolute right-0 top-full mt-3 min-w-[12.5rem] rounded-2xl bg-white shadow-lg border border-primary/10 py-2 text-left z-20"
        >
          <MySampaEntries
            menu
            items={items}
            itemClass="block w-full text-left px-4 py-2 text-sm font-medium text-text hover:text-primary-text hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text"
            onNavigate={() => setOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

function HeaderCta({ cta, className, onClick }) {
  if (!cta) return null;
  return (
    <Link to={cta.to} className={className} onClick={onClick}>
      <span>{cta.label}</span>
    </Link>
  );
}

const desktopCtaClass = 'btn-magnetic bg-accent text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md inline-block';
const mobileCtaClass = 'bg-accent text-white px-5 py-2.5 rounded-full text-sm font-semibold shadow-md inline-block text-center w-full';
const desktopLoginClass = 'px-5 py-2.5 rounded-full border-2 border-primary-text text-primary-text text-sm font-semibold hover:bg-primary-text hover:text-white transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-text';
const mobileLoginClass = 'px-5 py-2.5 rounded-full border-2 border-primary-text text-primary-text text-sm font-semibold text-center hover:bg-primary-text hover:text-white transition-colors';
const mobileItemClass = 'font-medium text-text hover:text-primary-text px-2 py-1 text-left';

export default function Navbar() {
  const navRef = useRef(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { loading, user, profile } = useAuth();
  const viewer = { loading, user, profile };
  const signedIn = showMySampa(viewer);
  const items = mySampaItems(viewer);
  const cta = joinCta(viewer);
  const closeMobile = () => setIsMobileMenuOpen(false);

  useEffect(() => {
    gsap.fromTo(navRef.current,
      { y: '-100%', opacity: 0 },
      { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.2 }
    );
  }, []);

  return (
    <div ref={navRef} className="fixed top-0 inset-x-0 z-[60] flex flex-col pointer-events-none">
      <AnnouncementBanner />
      <div className="px-4 md:px-8 pt-6 flex flex-col items-center w-full max-w-7xl mx-auto">
      <nav className="pointer-events-auto bg-white/90 backdrop-blur-md rounded-full shadow-lg border border-primary/10 px-6 py-3 flex items-center justify-between w-full">
        <div className="flex items-center gap-3">
          <Link to="/">
            <img src="/SAMPA_no_bg.svg" alt="SAMPA Logo" className="h-10 object-contain" />
          </Link>
        </div>

        <div className="hidden lg:flex items-center gap-6 font-medium text-sm text-text/80">
          <Link to="/news" className="hover:text-primary-text transition-colors">
            News
          </Link>
          <Link to="/policy" className="hover:text-primary-text transition-colors">
            Policy
            <span className="ml-1 text-[10px] font-data uppercase tracking-wider text-accent font-semibold">New</span>
          </Link>
          <Link to="/caq" className="hover:text-primary-text transition-colors">
            CAQ
            <span className="ml-1 text-[10px] font-data uppercase tracking-wider text-accent font-semibold">New</span>
          </Link>
          <Link to="/about" className="hover:text-primary-text transition-colors">
            About
            <span className="ml-1 text-[10px] font-data uppercase tracking-wider text-accent font-semibold">New</span>
          </Link>
          <a href="/#programs" className="hover:text-primary-text transition-colors">Programs</a>
          <Link to="/join" className="hover:text-primary-text transition-colors">Membership</Link>
          <a href="https://sampastore.printful.me" target="_blank" rel="noopener noreferrer" className="hover:text-primary-text transition-colors">Store</a>
          <DonateLink className="hover:text-primary-text transition-colors">Donate</DonateLink>
          {!signedIn && (
            <BoardNavLink className="hover:text-primary-text transition-colors" />
          )}
        </div>

        <div className="hidden lg:flex items-center gap-2.5">
          {signedIn ? (
            <MySampaMenu items={items} />
          ) : (
            <MemberLoginLink className={desktopLoginClass} />
          )}
          <HeaderCta cta={cta} className={desktopCtaClass} />
        </div>

        <button
          className="lg:hidden p-2 text-primary-text focus:outline-none"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-expanded={isMobileMenuOpen}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </nav>

      {isMobileMenuOpen && (
        <div className="pointer-events-auto lg:hidden w-full mt-2 max-h-[calc(100dvh-6.5rem)] overflow-y-auto bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-primary/10 p-4 flex flex-col gap-4">
          <Link to="/news" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={closeMobile}>
            News
          </Link>
          <Link to="/policy" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={closeMobile}>
            Policy
            <span className="ml-1.5 text-[10px] font-data uppercase tracking-wider text-accent font-semibold">New</span>
          </Link>
          <Link to="/caq" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={closeMobile}>
            CAQ
            <span className="ml-1.5 text-[10px] font-data uppercase tracking-wider text-accent font-semibold">New</span>
          </Link>
          <Link to="/about" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={closeMobile}>
            About
            <span className="ml-1.5 text-[10px] font-data uppercase tracking-wider text-accent font-semibold">New</span>
          </Link>
          <a href="/#programs" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={closeMobile}>Programs</a>
          <Link to="/join" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={closeMobile}>Membership</Link>
          <a href="https://sampastore.printful.me" target="_blank" rel="noopener noreferrer" className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={closeMobile}>Store</a>
          <DonateLink className="font-medium text-text hover:text-primary-text px-2 py-1" onClick={closeMobile}>Donate</DonateLink>
          {!signedIn && (
            <BoardNavLink
              className="font-medium text-text hover:text-primary-text px-2 py-1"
              onClick={closeMobile}
            />
          )}
          <div className="mt-2 pt-4 border-t border-primary/10 flex flex-col gap-2.5">
            {signedIn ? (
              <>
                <p className="px-2 text-xs font-data uppercase tracking-wider text-text/50">My SAMPA</p>
                <MySampaEntries
                  items={items}
                  itemClass={mobileItemClass}
                  onNavigate={closeMobile}
                />
              </>
            ) : (
              <MemberLoginLink className={mobileLoginClass} onClick={closeMobile} />
            )}
            <HeaderCta cta={cta} className={mobileCtaClass} onClick={closeMobile} />
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
