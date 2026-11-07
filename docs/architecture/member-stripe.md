# Member area & Stripe

Built 2026-07-06+. One-time dashboard config: `docs/member-area-setup.md`.  
Live / blocked state: `docs/STATUS.md` (e.g. donations on/off).

## Non-negotiable (do not regress)

1. **Sign-in-first membership checkout** — `/join` only when signed in; Supabase user id in
   `client_reference_id` + subscription metadata. **Never** link Stripe↔Supabase by email.
2. Stripe collects **payment only** (card, name-on-card, billing address). Identity from
   OAuth/magic link; professional details from dashboard. No Stripe custom fields.
3. Join / renew / cancel only on **Stripe-hosted** Checkout + Customer Portal. No card UI
   or card storage on SAMPA.
4. `/join` blocks a second checkout while membership is already active — tier changes via
   Customer Portal.
5. Webhook is the **sole** writer of membership columns on `profiles`.
6. **Browser session survives navigation and Stripe return.** Membership webhook
   can still activate a profile when the tab’s session dies; the member must
   remain signed in to start a follow-on `/donate` or another checkout without
   a new magic link. Guest donate stays public (no JWT required).

## Surfaces

| Path | Job |
|------|-----|
| `/join` | Honor-system AAPA yes/no (PA-path) → pick a tier and term → optional Patron → Stripe Checkout |
| `/join/invoice` | Quiet employer-invoice side door (T38). Not a catalog, not Step 1. Sign-in required to submit so the pay link carries `supabase_user_id`. Does not charge or activate. |
| `/dashboard` | Status, portal, profile, directory privacy, saved articles. Header **My SAMPA → My account** lands here for every signed-in profile. Staff also get **Editor** → `/editor`. A stale/held session without a profiles row is treated as signed-out (`/login`), not as “no membership yet.” Join upsell only when **this** live profile has no `membership_status`. |
| `/donate` | Public gifts (one-time/monthly) — separate `donations` ledger |
| `/members` | Peer directory (active members / staff), not staff roster |
| `/editor/members` | Staff roster / pledges (member-viewer+) |

## Donations

- Dynamic Checkout via `create-donation-session` (`price_data`), not a fixed Donation Product.
- `metadata.type=donation` → `donations` table only, then `profiles.donated_at`
  when the gift is succeeded and the amount is above zero. Match order is the
  checkout user id, then a unique `stripe_customer_id`, then a unique email.
  Two profiles on the same customer or email get no stamp. This email match is
  only for the Donor badge. Membership checkout still never links by email.
  Patron add-on payments are not donations and do not set `donated_at`.
  Directory RPCs expose `donor` for the last 12 months, not the timestamp.
  A full refund (`charge.refunded` with the whole amount refunded) and
  `charge.dispute.created` mark that gift and set `donated_at` from gifts that
  still match the profile by account id, Stripe customer, or donor email and
  are still succeeded inside 12 months. A partial refund leaves the gift
  counted. `charge.dispute.closed` with status `won` restores it only when the
  fetched charge is not fully refunded (`amount_refunded` is still below
  `amount`). A lost dispute leaves the gift off. Monthly rows
  store the PaymentIntent and charge id. Lookup does not use `charge.invoice`.
  If the refund arrives before the gift row, recording the gift checks the
  charge and stores it as refunded. A membership charge has no `donations`
  row, so it does not change the badge. Subscribe the webhook to
  `charge.refunded`, `charge.dispute.created`, and `charge.dispute.closed`.
- **Ops kill-switch:** `DONATIONS_ENABLED` in `src/lib/features.js` **and**
  `api/create-donation-session.js` (keep in sync). Currently **on** (501(c)(3)
  granted 2026-07-21; EIN 42-2288772). See STATUS if flipped off.

## Tier keys (three-way sync)

1. `src/lib/membership.js` — UI prices  
2. `api/_lib/tiers.js` — authorizes checkouts / durations  
3. `STRIPE_PRICE_<TIER>_<TERM>` Vercel env vars  

Student/Pre-PA cap at 2-year; Legacy lifetime = active + `renews_on` null.

Public display name for key `sustaining` is **Certified PA (not AAPA)**.
Quiet secondary label **Sustaining rate** maps to the board doc. Do not present
this card as extra support — Associate and Donate are the support paths.
Fellow card leads with eligibility: AAPA members start here / NCCPA + AAPA,
plus a short line that optional Patron puts a Patron badge on the directory listing.
Stripe product / env keys stay `sustaining`.

## Patron add-on (not a tier)

Optional extra support on `/join` after a real tier is selected. Default **off**.
Not a seventh card, not Platinum, not Associate, not `/donate`.

- Copy: extra support + badge flex + gratitude (same sentence on Join, `/join/invoice`, dashboard Add Patron, and Stripe Checkout `price_data` description). Directory badge is `profiles.patron`.
- Amount: **+$25 × term years** (1yr +$25, 2yr +$50, 3yr +$75). Legacy lifetime **+$25 once**.
  Fellow $50 + Patron $25 = $75.
- Checkout body: `{ tier, duration, patron: true, auto_renew: true }`. `auto_renew`
  defaults true. `false` uses the same Stripe Price and stamps
  `auto_renew=false` on the subscription metadata. Checkout
  `subscription_data` in this Stripe SDK does not accept
  `cancel_at_period_end`. The webhook calls `subscriptions.update` with that
  flag, then copies `willCancel` onto `profiles.cancel_at_period_end`. Active auto-renew and lifetime members get
  409 instead of a second subscription. Success returns to
  `/join?step=checkout&checkout=success&session_id={CHECKOUT_SESSION_ID}`.
  The page confirms payment only after `GET /api/create-checkout-session`
  shows that session is paid and belongs to the signed-in user. The Ads
  value is the membership line's `amount_total` after discounts. Patron and
  donation lines are excluded. A Patron bundle with no line items is not
  priced from the session total.   `active` is a renewal. `past_due` and `canceled` are renewals only when a
  paid membership invoice exists for that Stripe customer. An incomplete first
  payment is stored as `past_due` and has no paid membership invoice, so a
  later checkout is still a new membership. If that invoice list errors or is
  truncated before a paid membership invoice is seen, the session is not
  stamped and is not reported as a new membership. The click id cookie is
  written only after the browser allows the report and Global Privacy Control
  is off. The conversion label env var is required. Preview hosts do not load
  the tag.
  Server adds a matching-term
  Stripe `price_data` line item (recurring with the membership interval; lifetime
  is one-time) — no new `STRIPE_PRICE_*` env required for preview.
- Session / subscription metadata may include `patron=true`. **Never** set
  `type=donation` on this session (that would skip the membership write).
- Webhook writes `metadata.tier` to `membership_tier` and `metadata.patron` to
  `profiles.patron` on **new** checkouts. Patron is never a `membership_tier`.
- Existing members add Patron later from **`/dashboard` only** (quiet “Add
  Patron” under Membership). Hidden if `patron` is already true or membership
  is not active. `POST /api/add-patron` starts a **payment-mode** Checkout for
  the current-term amount; webhook `addon=patron_upgrade` writes `patron` and
  attaches the recurring Patron item to the existing subscription (`proration
  none`) so renewals keep it. Does not send welcome. Not a campaign or banner.
- Existing Sustaining accident cleanup is parked as STATUS **T36** — not this track.

## Employer invoice (T38 — quiet side door)

Academic / hospital PAs sometimes need a pre-payment invoice for employer
reimbursement. This is **not** a `/membership` catalog and **not** a Step 1 in
front of `/join`. Card payers never see a form unless they click the quiet
“Need an invoice for your employer?” link after picking a real tier.

1. `/join/invoice?tier=&term=` collects member, employer, AP, address, optional PO,
   term, honor-system AAPA, Patron yes/no.
2. `POST /api/create-invoice-request` (JWT required) stores
   `membership_invoice_requests`, creates a Stripe **Payment Link** for the same
   Price ids as `/join` checkout (+ Patron via lookup-key prices), and emails
   **josh@** + **admin@** only (PDF + .docx attached). Do **not** email the
   member or AP from this API.
3. PDF is a real `%PDF` (pdf-lib Helvetica, no SVG, no webfonts). UK could not
   open an SVG-based invoice in Aug 2026.
4. When the link is paid, `checkout.session.completed` fires with
   `metadata.supabase_user_id` / `tier` / `duration` / `patron` — the existing
   webhook activates the profile. No second membership path.
5. That payment is not an Ads conversion. The return URL is
   `/dashboard?checkout=success` and does not carry a Checkout Session id.
   This code does not invent a receipt for it.

## Session continuity (web)

Reported 2026-09-06 (Vic Holmes): mobile re-login on each screen change; laptop
logged out after a 3-year membership Checkout before a separate $75 donate.

- **Storage:** `src/lib/authStorage.js` — localStorage first; chunked `SameSite=Lax`
  cookie mirror so Safari/ITP or an in-memory SDK fallback still has a session
  after a full load. Production cookies use `Domain=.addictionpas.org` so apex
  and www are not two logins.
- **Refresh:** `src/lib/authSession.js` + `AuthContext` keep the last session
  across a null `TOKEN_REFRESHED` / unexpected `SIGNED_OUT` and retry
  `refreshSession` before the route guards treat the user as signed out.
  Intentional `signOut()` is not retried. `?checkout=success` / `?status=success`
  holds `loading` until recovery settles.
- **Canonical origin:** `src/lib/siteUrl.js` (`requestSiteOrigin` in
  `api/_lib/siteUrl.js`). OAuth, magic-link, Stripe success/cancel, portal
  return, and invoice pay-link redirect use `https://www.addictionpas.org` when
  the request is apex or www. Preview and localhost keep their own origin.
  `vercel.json` 308s `addictionpas.org` → www. Client also replaces apex → www
  before mount.
- **Guest donate** is unchanged: `create-donation-session` does not call
  `requireUser`; a JWT is attached only when one exists.

Automated: `npm run test:session`. Still needs a human pass on **iOS Safari**
(magic link → a few in-app navigations → `/join` 3-year Checkout → return
`/dashboard?checkout=success` still signed in → `/donate` without a new link).

Do not revive PR #73 (`/membership` Step 1).
