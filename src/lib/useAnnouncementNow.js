import { useEffect, useState } from 'react';

// Re-read the clock so a tab left open past the deadline drops the banner
// without a reload. Visibility covers a laptop that slept across it.
export function useAnnouncementNow() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id = window.setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
    };
  }, []);

  return now;
}
