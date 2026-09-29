import React, { useLayoutEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { openAnnouncements } from '../lib/announcements';
import { useAnnouncementNow } from '../lib/useAnnouncementNow';

const STORAGE_PREFIX = 'sampa-announce-dismissed:';

function storageKey(id) {
  return `${STORAGE_PREFIX}${id}`;
}

function readDismissed() {
  const ids = new Set();
  try {
    for (const item of openAnnouncements(new Date())) {
      if (sessionStorage.getItem(storageKey(item.id)) === '1') ids.add(item.id);
    }
  } catch {
    /* ignore */
  }
  return ids;
}

function clearAnnouncementOffset() {
  document.documentElement.removeAttribute('data-announcement');
  document.documentElement.style.removeProperty('--announcement-h');
}

export default function AnnouncementBanner() {
  const now = useAnnouncementNow();
  const [dismissed, setDismissed] = useState(readDismissed);
  const ref = useRef(null);
  const announcement = openAnnouncements(new Date(now)).find((item) => !dismissed.has(item.id)) ?? null;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!announcement || !el) {
      clearAnnouncementOffset();
      return undefined;
    }

    const apply = () => {
      document.documentElement.setAttribute('data-announcement', announcement.id);
      document.documentElement.style.setProperty('--announcement-h', `${el.offsetHeight}px`);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => {
      observer.disconnect();
      clearAnnouncementOffset();
    };
  }, [announcement]);

  if (!announcement) return null;

  function dismiss() {
    try {
      sessionStorage.setItem(storageKey(announcement.id), '1');
    } catch {
      /* ignore */
    }
    setDismissed((prev) => {
      const next = new Set(prev);
      next.add(announcement.id);
      return next;
    });
  }

  return (
    <div
      ref={ref}
      className="pointer-events-auto bg-[linear-gradient(105deg,#0E6B62_0%,#8B1FC0_100%)] text-white"
      role="region"
      aria-label="Site announcement"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className="basis-full md:basis-auto md:flex-1 min-w-0 flex items-start gap-2 text-sm font-semibold leading-snug md:text-base md:font-bold">
          <span aria-hidden="true" className="shrink-0 text-lg leading-none mt-0.5">🎁</span>
          <span>{announcement.message}</span>
        </p>
        <Link
          to={announcement.href}
          className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-bold text-[#8B1FC0] shadow-sm hover:bg-white/90 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
        >
          {announcement.linkLabel}
        </Link>
        <button
          type="button"
          onClick={dismiss}
          className="ml-auto md:ml-0 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2"
          aria-label="Dismiss announcement"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
