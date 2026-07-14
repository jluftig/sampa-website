import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// Press-and-hold (or keyboard toggle) peek for optional clinical support content.
// Experts who already know the material release and the popover is gone — no
// sticky modal to dismiss every run. First-timers hold while reading.
// Keyboard: Space/Enter toggles sticky open; Escape closes (hold is awkward
// with a keyboard).
export default function HoldPeekChip({ label, title, children }) {
  const chipId = useId();
  const panelId = `${chipId}-panel`;
  const chipRef = useRef(null);
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false); // keyboard / sticky mode
  const [coords, setCoords] = useState(null);
  const pointerActive = useRef(false);

  const placePanel = useCallback(() => {
    const el = chipRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.min(360, window.innerWidth - 24);
    let left = r.left;
    if (left + width > window.innerWidth - 12) left = window.innerWidth - 12 - width;
    if (left < 12) left = 12;
    // Prefer below the chip; flip above if near bottom of viewport.
    const spaceBelow = window.innerHeight - r.bottom;
    const preferBelow = spaceBelow > 220 || spaceBelow >= r.top;
    setCoords({
      top: preferBelow ? r.bottom + 8 : undefined,
      bottom: preferBelow ? undefined : window.innerHeight - r.top + 8,
      left,
      width,
      maxHeight: Math.min(320, (preferBelow ? spaceBelow : r.top) - 24),
    });
  }, []);

  const openHold = useCallback(() => {
    placePanel();
    setPinned(false);
    setOpen(true);
  }, [placePanel]);

  const closeHold = useCallback(() => {
    if (pinned) return;
    setOpen(false);
  }, [pinned]);

  const togglePin = useCallback(() => {
    setPinned((p) => {
      const next = !p;
      if (next) {
        placePanel();
        setOpen(true);
      } else {
        setOpen(false);
      }
      return next;
    });
  }, [placePanel]);

  useEffect(() => {
    if (!open) return undefined;
    const onScrollOrResize = () => placePanel();
    window.addEventListener('resize', onScrollOrResize);
    // Capture scroll from any scrollable ancestor (protocol page).
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, placePanel]);

  useEffect(() => {
    if (!open || !pinned) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setPinned(false);
        setOpen(false);
      }
    };
    const onPointerDown = (e) => {
      if (chipRef.current?.contains(e.target)) return;
      if (panelRef.current?.contains(e.target)) return;
      setPinned(false);
      setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, pinned]);

  return (
    <>
      <button
        ref={chipRef}
        type="button"
        id={chipId}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="dialog"
        onPointerDown={(e) => {
          // Left button / touch / pen only; let keyboard use onKeyDown.
          if (e.pointerType === 'mouse' && e.button !== 0) return;
          pointerActive.current = true;
          e.currentTarget.setPointerCapture?.(e.pointerId);
          openHold();
        }}
        onPointerUp={() => {
          pointerActive.current = false;
          closeHold();
        }}
        onPointerCancel={() => {
          pointerActive.current = false;
          closeHold();
        }}
        onPointerLeave={() => {
          if (pointerActive.current) closeHold();
        }}
        onLostPointerCapture={() => {
          pointerActive.current = false;
          closeHold();
        }}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            togglePin();
          }
        }}
        className="inline-flex items-center gap-1.5 rounded-full border-2 border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs font-semibold text-primary hover:border-primary/60 hover:bg-primary/10 transition-colors select-none touch-manipulation print:hidden"
      >
        {label}
        <span className="font-data text-[10px] uppercase tracking-wider text-primary/60 font-normal">
          hold
        </span>
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
            {pinned && (
              <p className="mt-3 text-[11px] text-text/45 font-data">
                Esc or tap outside to close
              </p>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
