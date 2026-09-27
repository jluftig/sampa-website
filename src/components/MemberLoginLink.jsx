import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { memberLoginHref, memberLoginLabel } from '../lib/memberHome';

export default function MemberLoginLink({ className, onClick }) {
  const { user, profile, loading } = useAuth();
  return (
    <Link
      to={memberLoginHref({ user, profile, loading })}
      className={className}
      onClick={onClick}
    >
      {memberLoginLabel({ user, profile, loading })}
    </Link>
  );
}
