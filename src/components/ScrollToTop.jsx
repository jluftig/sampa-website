import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Reset scroll to the top whenever the route path changes (but leave in-page
// hash links like /#about alone so they can scroll to their section).
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
}
