import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Click-to-toggle peek for optional clinical support content (adjuncts, dosing
// tips). Open → read / scroll → click the chip again (or outside / Esc) to
// close. Hold-to-peek was dropped because scrolling the panel while holding
// is awkward on both phone and desktop.
export default function HoldPeekChip({ label, title, children }) {
  const chipId = useId();
  const panelId = `${chipId}-panel`;
  const chipRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState(null);

  const placePanel = useCallback(() => {
    const el = chipRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);
    let left = r.left;
    if (left + width > window.innerWidth - 12) left = window.innerWidth - 12 - width;
    if (left < 12) left = 12;
    const spaceBelow = window.innerHeight - r.bottom;
    const preferBelow = spaceBelow > 220 || spaceBelow >= r.top;
    setCoords({
      top: preferBelow ? r.bottom + 8 : undefined,
      bottom: preferBelow ? undefined : window.innerHeight - r.top + 8,
      left,
      width,
      maxHeight: Math.min(360, (preferBelow ? spaceBelow : r.top) - 24),
    });
  }, []);

  const toggle = useCallback(() => {
    setOpen((wasOpen) => {
      if (wasOpen) return false;
      placePanel();
      return true;
    });
  }, [placePanel]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return undefined;
    const onScrollOrResize = () => placePanel();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, placePanel]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    const onPointerDown = (e) => {
      if (chipRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      close();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, close]);

  return (
    <>
      <button
        ref={chipRef}
        type="button"
        id={chipId}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onClick={toggle}
        className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3.5 py-1.5 text-xs font-semibold transition-colors select-none touch-manipulation print:hidden ${
          open
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-primary/30 bg-primary/5 text-primary hover:border-primary/60 hover:bg-primary/10'
        }`}
      >
        {label}
      </button>

      {open &&
        coords &&
        createPortal(
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-labelledby={`${panelId}-title`}
            aria-modal={false}
            style={{
              position: 'fixed',
              top: coords.top,
              bottom: coords.bottom,
              left: coords.left,
              width: coords.width,
              maxHeight: coords.maxHeight,
            }}
            className="z-[60] overflow-y-auto rounded-2xl border-2 border-primary/25 bg-white p-4 shadow-xl print:hidden"
          >
            <p
              id={`${panelId}-title`}
              className="font-data text-xs uppercase tracking-wider text-primary font-semibold mb-2"
            >
              {title || label}
            </p>
            <div className="text-sm text-text/80 space-y-2">{children}</div>
            <p className="mt-3 text-[11px] text-text/45 font-data">
              Tap button again, outside, or Esc to close
            </p>
          </div>,
          document.body
        )}
    </>
  );
}
