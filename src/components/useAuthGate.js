import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import {
  AUTH_NULL_HOLD_MS,
  guardLoginPath,
  shouldLeaveForLogin,
} from '../lib/authRedirect';

export function useAuthGate() {
  const { loading, sessionUsable, user, intentionalSignOut } = useAuth();
  const location = useLocation();
  const hadSessionRef = useRef(false);
  const [holdExpired, setHoldExpired] = useState(false);
  if (user) hadSessionRef.current = true;

  useEffect(() => {
    if (user || intentionalSignOut || !hadSessionRef.current) {
      setHoldExpired(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setHoldExpired(true), AUTH_NULL_HOLD_MS);
    return () => window.clearTimeout(timer);
  }, [user, intentionalSignOut]);

  const leave = shouldLeaveForLogin({
    sessionUsable,
    user,
    hadSession: hadSessionRef.current,
    intentionalSignOut,
    holdExpired,
  });
  const loginTo = !loading && leave
    ? guardLoginPath({ pathname: location.pathname, search: location.search })
    : null;
  const checking = loading || (!sessionUsable && !loginTo);

  return { checking, loginTo };
}
