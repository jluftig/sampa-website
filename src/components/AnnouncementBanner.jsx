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
      className="pointer-events-auto bg-primary-text text-white"
      role="region"
      aria-label="Site announcement"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-start gap-3">
        <p className="flex-1 min-w-0 text-sm leading-snug">
          {announcement.message}{' '}
          <Link
            to={announcement.href}
            className="font-semibold underline underline-offset-2 whitespace-nowrap hover:text-white/80"
          >
            {announcement.linkLabel}
          </Link>
        </p>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 -mr-1 p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Dismiss announcement"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
