import React from 'react';
import { Link } from 'react-router-dom';
import { canViewMemberRoster } from '../lib/memberRoster.js';

export default function MemberRosterLink({ profile }) {
  if (!canViewMemberRoster(profile)) return null;
  return (
    <p className="mt-3">
      <Link to="/editor/members" className="text-sm font-semibold text-primary-text hover:underline">
        Open member roster →
      </Link>
    </p>
  );
}
