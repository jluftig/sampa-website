import React from 'react';
import { Link } from 'react-router-dom';
import { DONATIONS_ENABLED } from '../lib/features';

/**
 * Donate entry control. When DONATIONS_ENABLED is false, still looks like a
 * Donate control but navigation and checkout are disconnected (no-op click).
 * Keep in sync with api/create-donation-session.js.
 */
export default function DonateLink({ children, className = '', onClick, ...rest }) {
  if (!DONATIONS_ENABLED) {
    return (
      <span
        role="link"
        aria-disabled="true"
        title="Donations temporarily unavailable"
        className={className}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClick?.(e);
        }}
        {...rest}
      >
        {children}
      </span>
    );
  }

  return (
    <Link to="/donate" className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
