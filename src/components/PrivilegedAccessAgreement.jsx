import React, { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../lib/AuthContext';

// Click-accept gate shown before any privileged access to member data (the
// /editor/members page refuses to render until accepted). Acceptance writes
// privileged_terms_accepted_at on the user's own profile — that timestamp is
// the signature record. Drafted 2026-07-07; pending counsel review and formal
// board adoption, like the public legal pages.
export default function PrivilegedAccessAgreement() {
  const { user, refreshProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const accept = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from('profiles')
      .update({ privileged_terms_accepted_at: new Date().toISOString() })
      .eq('id', user.id);
    if (error) {
      setError(error.message);
      setBusy(false);
      return;
    }
    await refreshProfile(); // gate re-evaluates and the roster renders
  };

  return (
    <div className="bg-white rounded-4xl shadow-sm border border-primary/10 p-8 md:p-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-2">
        <ShieldCheck className="w-6 h-6 text-primary" />
        <div className="text-primary font-bold font-data tracking-widest text-xs uppercase">
          Before you continue
        </div>
      </div>
      <h1 className="text-2xl md:text-3xl font-drama font-bold mb-6">
        Confidentiality &amp; Acceptable Use Agreement
        <span className="block text-lg font-sans font-semibold text-text/60 mt-1">
          Privileged access to member information
        </span>
      </h1>

      <div className="prose prose-sm max-w-none prose-headings:font-bold prose-p:text-text/80 prose-li:text-text/80 mb-8">
        <p>
          You've been granted access to SAMPA member and donor information —
          names, contact details, professional information, membership status,
          and pledge records. This access is an <strong>operational tool for
          your SAMPA role, not a privilege of rank</strong>. By continuing, you
          agree to the following:
        </p>

        <h3>1. Use only for authorized SAMPA business</h3>
        <p>
          Access member and donor information only when your SAMPA duties
          require it, and use it only for those duties. No personal, commercial,
          political, or research use; no contacting members outside authorized
          SAMPA communications.
        </p>

        <h3>2. Keep it confidential</h3>
        <p>
          Don't share member or donor information with anyone outside the group
          of people authorized to see it — including other SAMPA members,
          employers, vendors, or on any public or private forum. It is never
          sold, traded, or provided to third parties.
        </p>

        <h3>3. Handle exports with care</h3>
        <p>
          Downloaded rosters and reports (CSV exports are logged) may be used
          only for the task at hand: store them securely, don't forward them,
          don't upload them to personal accounts or third-party tools that
          SAMPA hasn't approved, and delete them when the task is done.
        </p>

        <h3>4. Protect your account</h3>
        <p>
          Privileged users must sign in with a Google account that has
          2-Step Verification enabled, and must never share their SAMPA login.
          If you suspect your account or any member data has been exposed,
          report it to a SAMPA administrator immediately.
        </p>

        <h3>5. Access ends with the role</h3>
        <p>
          When your role or committee service ends, your access will be
          removed, and you agree to delete any member data still in your
          possession.
        </p>

        <h3>6. Consequences of misuse</h3>
        <p>
          Violations may result in removal of access, board action, membership
          discipline under SAMPA's governing documents, and — where warranted —
          legal remedies.
        </p>
      </div>

      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

      <button
        onClick={accept}
        disabled={busy}
        className="px-6 py-3 rounded-full bg-primary text-white font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {busy ? 'Recording…' : 'I agree — continue to member data'}
      </button>
      <p className="text-text/40 text-xs mt-4">
        Your acceptance is recorded with a timestamp on your account. Questions
        about this agreement go to the SAMPA board.
      </p>
    </div>
  );
}
