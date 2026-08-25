import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import {
  durationLabel,
  durationsForTier,
  invoiceTotalDollars,
  isPaPathTier,
  parseAapaParam,
  parseDurationParam,
  patronDollars,
  tierByKey,
} from '../lib/membership';
import { apiPost } from '../lib/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const DRAFT_KEY = 'sampa-invoice-draft';
const FIELD = 'w-full px-4 py-3 rounded-2xl border border-primary/20 bg-white text-sm focus:outline-none focus:border-primary';
const LABEL = 'block text-xs font-data font-semibold uppercase tracking-wider text-text/50 mb-2';

function readDraft() {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeDraft(fields) {
  try {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(fields));
  } catch {
    /* ignore quota / private mode */
  }
}

function orgNameFromProfile(profile) {
  const orgs = profile?.organizations;
  if (!Array.isArray(orgs) || !orgs[0]) return '';
  return orgs[0].name || profile?.organization || '';
}

export default function JoinInvoice() {
  const { user, loading, profile, isActiveMember } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const draft = useMemo(() => readDraft(), []);

  const tier = tierByKey(searchParams.get('tier'));
  const termFromQuery = parseDurationParam(searchParams.get('term'), tier) ?? 1;
  const patronFromQuery = searchParams.get('patron') === '1';
  const aapaFromQuery = parseAapaParam(searchParams.get('aapa'));

  const [memberName, setMemberName] = useState(draft.memberName || profile?.full_name || '');
  const [memberEmail, setMemberEmail] = useState(draft.memberEmail || user?.email || '');
  const [credentials, setCredentials] = useState(draft.credentials || profile?.credentials || '');
  const [employer, setEmployer] = useState(draft.employer || orgNameFromProfile(profile));
  const [apName, setApName] = useState(draft.apName || '');
  const [apEmail, setApEmail] = useState(draft.apEmail || '');
  const [billingAddress, setBillingAddress] = useState(draft.billingAddress || '');
  const [poNumber, setPoNumber] = useState(draft.poNumber || '');
  const [duration, setDuration] = useState(draft.duration ?? termFromQuery);
  const [wantPatron, setWantPatron] = useState(
    typeof draft.patron === 'boolean' ? draft.patron : patronFromQuery
  );
  const [aapaAnswer, setAapaAnswer] = useState(
    typeof draft.aapa === 'boolean'
      ? draft.aapa
      : aapaFromQuery ?? (typeof profile?.aapa_member === 'boolean' ? profile.aapa_member : null)
  );
  const [website, setWebsite] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const showAapa = Boolean(tier && isPaPathTier(tier.key));
  const total = tier ? invoiceTotalDollars(tier, duration, wantPatron) : null;
  const termOptions = tier ? durationsForTier(tier) : [];

  useEffect(() => {
    if (!profile && !user) return;
    setMemberName((current) => current || profile?.full_name || '');
    setMemberEmail((current) => current || user?.email || '');
    setCredentials((current) => current || profile?.credentials || '');
    setEmployer((current) => current || orgNameFromProfile(profile));
    if (aapaAnswer === null && typeof profile?.aapa_member === 'boolean') {
      setAapaAnswer(profile.aapa_member);
    }
  }, [profile, user]); // prefill once account data arrives after login

  const snapshot = () => ({
    memberName,
    memberEmail,
    credentials,
    employer,
    apName,
    apEmail,
    billingAddress,
    poNumber,
    duration,
    patron: wantPatron,
    aapa: aapaAnswer,
  });

  const submit = async (event) => {
    event.preventDefault();
    setError(null);
    if (!tier) {
      setError('Pick a membership level on Join first.');
      return;
    }
    if (showAapa && aapaAnswer === null) {
      setError('Please tell us whether you are a current AAPA member. We do not verify this with AAPA.');
      return;
    }
    writeDraft(snapshot());
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`);
      return;
    }
    setBusy(true);
    try {
      await apiPost('/api/create-invoice-request', {
        memberName,
        memberEmail,
        credentials,
        employer,
        apName,
        apEmail,
        billingAddress,
        poNumber,
        tier: tier.key,
        duration,
        patron: wantPatron,
        aapa: aapaAnswer,
        website,
      });
      try {
        sessionStorage.removeItem(DRAFT_KEY);
      } catch {
        /* ignore */
      }
      setDone(true);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-text">
      <div className="noise-overlay pointer-events-none"></div>
      <Navbar />

      <main className="max-w-xl mx-auto px-4 pt-32 pb-24">
        <p className="text-xs font-data uppercase tracking-wider text-text/40 mb-4">
          <Link to={tier ? `/join?tier=${tier.key}` : '/join'} className="hover:text-primary-text">
            ← Back to Join
          </Link>
        </p>

        {done ? (
          <div className="bg-white rounded-4xl border border-primary/10 shadow-sm p-8 md:p-10 text-center">
            <h1 className="text-3xl font-drama font-bold mb-4">Invoice requested</h1>
            <p className="text-text/70">
              We&apos;ll email the invoice. Membership starts when it&apos;s paid.
            </p>
            <p className="text-text/50 text-sm mt-4">
              Nothing was charged and no membership was activated. Card payers can still use{' '}
              <Link to="/join" className="underline hover:text-primary-text">
                Join
              </Link>
              .
            </p>
          </div>
        ) : (
          <>
            <header className="mb-8">
              <div className="inline-block px-4 py-1.5 rounded-full border border-accent/20 bg-accent/5 text-accent text-xs font-semibold mb-4 font-data uppercase tracking-wider">
                Employer invoice
              </div>
              <h1 className="text-3xl md:text-4xl font-drama font-bold mb-3">
                Request an invoice
              </h1>
              <p className="text-text/70">
                For academic and hospital PAs whose employer needs a pre-payment invoice.
                Submit does not charge a card and does not start membership.
              </p>
            </header>

            {!tier && (
              <div className="bg-white border border-primary/15 rounded-3xl p-6 mb-8 text-sm text-text/70">
                Pick a membership level on{' '}
                <Link to="/join" className="text-primary-text font-semibold hover:underline">
                  Join
                </Link>{' '}
                first, then use the invoice link under the cards.
              </div>
            )}

            {isActiveMember && (
              <div className="bg-primary/5 border border-primary/20 rounded-3xl p-5 mb-8 text-sm text-text/70">
                You already have an active membership. Manage billing from your{' '}
                <Link to="/dashboard" className="text-primary-text font-semibold hover:underline">
                  dashboard
                </Link>
                .
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-sm text-red-600">
                {error}
              </div>
            )}

            {tier && !isActiveMember && (
              <form onSubmit={submit} className="bg-white rounded-4xl border border-primary/10 shadow-sm p-6 md:p-8 space-y-5">
                <p className="text-sm text-text/60">
                  <strong className="text-text">{tier.name}</strong>
                  {total != null && (
                    <>
                      {' '}
                      · ${total}
                      {duration === 'lifetime' ? ' once' : duration === 1 ? ' / year' : ` / ${duration} years`}
                    </>
                  )}
                </p>

                <div>
                  <p className={LABEL}>Term</p>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Membership term">
                    {termOptions.map((d) => (
                      <button
                        key={d}
                        type="button"
                        role="radio"
                        aria-checked={duration === d}
                        onClick={() => setDuration(d)}
                        className={`px-3 py-1.5 rounded-full text-xs font-data font-semibold border ${
                          duration === d
                            ? 'bg-primary-text border-primary-text text-white'
                            : 'border-primary/20 text-text/60 hover:border-primary'
                        }`}
                      >
                        {durationLabel(d)}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-text/45 mt-2">
                    {duration === 'lifetime'
                      ? 'Lifetime is a one-time payment and does not auto-renew.'
                      : 'This term auto-renews until canceled — same as paying on Join.'}
                  </p>
                </div>

                {showAapa && (
                  <fieldset>
                    <legend className={LABEL}>Current AAPA member?</legend>
                    <p className="text-xs text-text/45 mb-2">Honor system — we do not verify with AAPA.</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setAapaAnswer(true)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                          aapaAnswer === true
                            ? 'bg-primary-text border-primary-text text-white'
                            : 'border-primary-text text-primary-text'
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => setAapaAnswer(false)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold border-2 ${
                          aapaAnswer === false
                            ? 'bg-primary-text border-primary-text text-white'
                            : 'border-primary-text text-primary-text'
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </fieldset>
                )}

                <label className="flex items-start gap-3 cursor-pointer text-sm text-text/80">
                  <input
                    type="checkbox"
                    checked={wantPatron}
                    onChange={(e) => setWantPatron(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-primary/30 accent-accent"
                  />
                  <span>
                    Patron add-on — same membership, no extra benefits.
                    <span className="block text-xs text-text/50 mt-1">
                      Adds ${patronDollars(duration)}
                      {duration === 'lifetime' ? ' once' : duration === 1 ? ' for this year' : ` for this ${duration}-year term`}.
                    </span>
                  </span>
                </label>

                <label>
                  <span className={LABEL}>Member name</span>
                  <input className={FIELD} required value={memberName} onChange={(e) => setMemberName(e.target.value)} />
                </label>
                <label>
                  <span className={LABEL}>Member email</span>
                  <input className={FIELD} type="email" required value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} />
                </label>
                <label>
                  <span className={LABEL}>Credentials (optional)</span>
                  <input className={FIELD} value={credentials} onChange={(e) => setCredentials(e.target.value)} placeholder="PA-C, CAQ-AM" />
                </label>
                <label>
                  <span className={LABEL}>Employer / institution</span>
                  <input className={FIELD} required value={employer} onChange={(e) => setEmployer(e.target.value)} />
                </label>
                <label>
                  <span className={LABEL}>AP / billing contact name</span>
                  <input className={FIELD} required value={apName} onChange={(e) => setApName(e.target.value)} />
                </label>
                <label>
                  <span className={LABEL}>AP / billing contact email</span>
                  <input className={FIELD} type="email" required value={apEmail} onChange={(e) => setApEmail(e.target.value)} />
                </label>
                <label>
                  <span className={LABEL}>Billing address</span>
                  <textarea
                    className={`${FIELD} min-h-24`}
                    required
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    rows={3}
                  />
                </label>
                <label>
                  <span className={LABEL}>PO number (optional)</span>
                  <input className={FIELD} value={poNumber} onChange={(e) => setPoNumber(e.target.value)} />
                </label>

                {/* Honeypot — bots fill it; humans never see it. */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Company website
                    <input name="website" tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
                  </label>
                </div>

                {!user && !loading && (
                  <p className="text-xs text-text/50">
                    You&apos;ll sign in next so this membership can attach to your account when the invoice is paid.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy || loading}
                  className="w-full py-3.5 rounded-full bg-primary-text text-white font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {busy ? 'Sending request…' : user ? 'Request invoice' : 'Sign in to request invoice'}
                </button>
                <p className="text-xs text-text/40 text-center">
                  By submitting you agree to our{' '}
                  <Link to="/privacy" className="underline hover:text-primary-text">Privacy Policy</Link>
                  {' '}and{' '}
                  <Link to="/terms" className="underline hover:text-primary-text">Terms of Service</Link>.
                </p>
              </form>
            )}
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
