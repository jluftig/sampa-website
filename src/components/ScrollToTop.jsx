import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Reset scroll to the top whenever the route path changes. When a hash is
// present (e.g. /#programs, /about#programs), scroll to that element after paint.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) {
      window.scrollTo(0, 0);
      return undefined;
    }
    const id = hash.replace('#', '');
    const t = window.setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => window.clearTimeout(t);
  }, [pathname, hash]);
  return null;
}
