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

Public display name for key `sustaining` is **PA Member** (non-AAPA PA path).
Never show the word Sustaining on home cards or `/join`. Stripe product / env
keys stay `sustaining`.

## Patron add-on (not a tier)

Optional extra support on `/join` after a real tier is selected. Default **off**.
Not a seventh card, not Platinum, not Associate, not `/donate`.

- Copy: “Patron — same membership, no extra benefits. Just more support for SAMPA.”
- Amount: **+$25 × term years** (1yr +$25, 2yr +$50, 3yr +$75). Legacy lifetime **+$25 once**.
  Fellow $50 + Patron $25 = $75.
- Checkout body: `{ tier, duration, patron: true }`. Server adds a matching-term
  Stripe `price_data` line item (recurring with the membership interval; lifetime
  is one-time) — no new `STRIPE_PRICE_*` env required for preview.
- Session / subscription metadata may include `patron=true`. **Never** set
  `type=donation` on this session (that would skip the membership write).
- Webhook writes `metadata.tier` to `membership_tier` and `metadata.patron` to
  `profiles.patron` on **new** checkouts. Patron is never a `membership_tier`.
- Existing Sustaining accident cleanup is parked as STATUS **T36** — not this track.
