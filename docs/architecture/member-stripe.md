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

## Surfaces

| Path | Job |
|------|-----|
| `/join` | Honor-system AAPA yes/no (PA-path) → pick a tier and term → optional Patron → Stripe Checkout |
| `/join/invoice` | Quiet employer-invoice side door (T38). Not a catalog, not Step 1. Sign-in required to submit so the pay link carries `supabase_user_id`. Does not charge or activate. |
| `/dashboard` | Status, portal, profile, directory privacy, saved articles |
| `/donate` | Public gifts (one-time/monthly) — separate `donations` ledger |
| `/members` | Peer directory (active members / staff), not staff roster |
| `/editor/members` | Staff roster / pledges (member-viewer+) |

## Donations

- Dynamic Checkout via `create-donation-session` (`price_data`), not a fixed Donation Product.
- `metadata.type=donation` → `donations` table only.
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

- Copy: “Patron — adds a Patron badge on your directory listing. No extra
  membership benefits beyond the badge.” Visible reward is the `/members`
  directory badge (`profiles.patron`). Not a membership benefit beyond that.
- Amount: **+$25 × term years** (1yr +$25, 2yr +$50, 3yr +$75). Legacy lifetime **+$25 once**.
  Fellow $50 + Patron $25 = $75.
- Checkout body: `{ tier, duration, patron: true }`. Server adds a matching-term
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

Do not revive PR #73 (`/membership` Step 1).
