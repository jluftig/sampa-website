# Member Area & Stripe Setup — one-time configuration checklist

The code for member accounts (dashboard, saved articles, profile onboarding,
Stripe membership payments) ships in the `feature/member-accounts` branch. It
needs the one-time configuration below before it works end-to-end. Do these in
order; steps 1–2 before merging the code to `main` (DB before code, always).

---

## 1. Database migration (Supabase → SQL Editor)

`supabase/schema.sql` remains the source of truth (do NOT re-run the whole
file — its tag seed would overwrite customized keyword labels). Run exactly
this snippet:

```sql
-- Professional profile fields (filled in by members on the dashboard).
alter table public.profiles add column if not exists credentials       text;
alter table public.profiles add column if not exists npi               text;
alter table public.profiles add column if not exists organization      text;
alter table public.profiles add column if not exists practice_setting  text;
alter table public.profiles add column if not exists newsletter_opt_in boolean not null default true;
alter table public.profiles add column if not exists onboarded_at      timestamptz;

-- Saved/favorite news posts.
create table if not exists public.favorites (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  post_id    uuid not null references public.posts(id)    on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.favorites enable row level security;

drop policy if exists favorites_select on public.favorites;
create policy favorites_select on public.favorites
  for select using ( auth.uid() = user_id );

drop policy if exists favorites_insert on public.favorites;
create policy favorites_insert on public.favorites
  for insert with check (
    auth.uid() = user_id
    and exists (select 1 from public.posts p where p.id = post_id and p.status = 'published')
  );

drop policy if exists favorites_delete on public.favorites;
create policy favorites_delete on public.favorites
  for delete using ( auth.uid() = user_id );

-- Paid-up member (or staff) — for gating future member-only content (CME).
create or replace function public.is_active_member()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select membership_status = 'active' or role in ('editor','admin')
       from public.profiles where id = auth.uid()),
    false);
$$;
```

### Migration 2 (added 2026-07-06, after the sign-up-form gap analysis)

If you already ran the snippet above, run just this delta:

```sql
alter table public.profiles add column if not exists state      text;
alter table public.profiles add column if not exists sms_opt_in boolean not null default false;
```

(`state` = US state dropdown from the old sign-up form; `sms_opt_in` = text-message
updates consent, collected with the required "msg rates / reply STOP" language.)

### Migration 3 — grandfathering pre-Stripe members (added 2026-07-06)

Members who signed up via the old Google Form are imported through a staging
table (`member_import`): at their first login, `claim_member_import()` matches
their email, pre-fills the profile (name, state, credentials, phone, SMS
preference), and — if `activate` is true and they have no membership yet —
sets their membership to active with a renewal date of *form sign-up date +
purchased term*. Imported members have no `stripe_customer_id`, so the
dashboard hides "Manage billing" until they renew online.

**This repo is PUBLIC — the INSERT statements with real member data must NEVER
be committed.** The structure lives in `supabase/schema.sql`; the data-bearing
SQL is generated locally from the form-responses CSV and pasted straight into
the Supabase SQL editor (regenerate from the CSV if lost; `.gitignore` blocks
`*member-import*` and `*Responses*.csv` as a safety net). To mark someone who
never actually paid, before their first login:
`update public.member_import set activate = false where email = '...';`
If a member signs in with a different email than the one on their form
response, their row stays unclaimed — fix by updating that row's `email` to
match, then re-running the backfill `select` from the import script.

**Note on the old form's "save 5% on my dues" SMS incentive:** the v2 pricing
doc dropped it and the new checkout doesn't implement it. If the board wants
to keep honoring it, the clean mechanism is a Stripe promotion code (checkout
already has promo codes enabled) rather than more price variants.

## 2. Supabase Auth configuration

1. **Publish the Google consent screen** (Google Cloud Console → APIs & Services
   → OAuth consent screen → Publish). Until this is done, only whitelisted test
   users can sign in — it blocks all member logins.
2. **Email (magic link) provider**: Supabase → Authentication → Providers →
   Email — confirm it's enabled (it is by default). The login page now offers
   "Email me a sign-in link" alongside Google.
3. **Redirect allowlist**: Supabase → Authentication → URL Configuration →
   Redirect URLs. Sign-in can now land on `/dashboard`, `/join`, `/editor`, or
   a news article, so add wildcards:
   - `https://www.addictionpas.org/**`
   - `https://*.vercel.app/**` (previews)
   - `http://localhost:5173/**` and `http://localhost:5174/**` (local dev)
4. **Optional — logo / brand verification** (Google Auth Platform → Branding).
   Uploading a logo triggers Google's brand-verification review; until it
   passes, the logo simply isn't shown (sign-in works fine — do NOT block
   launch on this). To pass verification: app published (step 1), authorized
   domain `addictionpas.org` verified in Google Search Console, and the
   Branding page filled in with home page `https://www.addictionpas.org`,
   privacy policy `https://www.addictionpas.org/privacy`, and terms
   `https://www.addictionpas.org/terms` (these pages ship with the member-area
   branch). Note: the consent screen says "to continue to
   xbzzawjnphpnexwfjtif.supabase.co" either way — changing that needs a custom
   Supabase auth domain (separate, later project).

## 3. Stripe setup (dashboard.stripe.com)

1. Create a **Product** per membership tier, each with one **Price per term**
   below (pricing per the board's "SAMPA Membership & Donor Tiers 2026" doc).
   - 1-year: recurring, billing period **Yearly**.
   - 2-/3-year: recurring, billing period **Custom → every 2 (or 3) years** —
     one charge up front, auto-renews at the end of the term.
   - Lifetime (Legacy only): **One-off** price.

   | Tier key | Product | 1-yr | 2-yr | 3-yr | Lifetime |
   |---|---|---|---|---|---|
   | `fellow` | SAMPA Fellow Membership | $50 | $90 | $125 | — |
   | `sustaining` | SAMPA Sustaining Membership | $75 | $135 | $185 | — |
   | `associate` | SAMPA Associate Membership | $40 | $70 | $100 | — |
   | `legacy` | SAMPA Legacy Membership | $25 | $45 | $60 | $125 |
   | `student` | SAMPA Student Membership | $10 | $18 | — | — |
   | `prepa` | SAMPA Pre-PA Membership | $5 | $9 | — | — |

   Copy each **Price id** (`price_...`) for step 5 — 17 prices total.
2. **Webhook endpoint**: Developers → Webhooks → Add endpoint →
   `https://www.addictionpas.org/api/stripe-webhook`, subscribed to:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   Copy the **signing secret** (`whsec_...`).
3. **Customer Portal**: Settings → Billing → Customer portal → enable, and
   allow: update payment method, cancel subscription, switch plans (add the six
   membership prices as switchable products so members can change tiers there).
4. Do all of the above in **Test mode** first; repeat in Live mode when ready.

## 4. Vercel environment variables (server-side — no VITE_ prefix)

Settings → Environment Variables, for **Production** (and Preview, pointing at
Stripe *test* keys ideally):

| Name | Value |
|---|---|
| `STRIPE_SECRET_KEY` | `sk_live_...` (or `sk_test_...` on Preview) |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` from step 3.2 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role |
| `STRIPE_PRICE_<TIER>_<TERM>` | the 17 Price ids from step 3.1 |

Price env names: `STRIPE_PRICE_FELLOW_1Y`, `STRIPE_PRICE_FELLOW_2Y`,
`STRIPE_PRICE_FELLOW_3Y`, same `_1Y/_2Y/_3Y` pattern for `SUSTAINING`,
`ASSOCIATE`, and `LEGACY`, plus `STRIPE_PRICE_LEGACY_LIFETIME`, and `_1Y/_2Y`
only for `STUDENT` and `PREPA`. A missing env var simply disables that
tier/term combination (the API rejects it).

(`SUPABASE_URL` is optional — the functions fall back to `VITE_SUPABASE_URL`.)

**Never** expose `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or
`SUPABASE_SERVICE_ROLE_KEY` in a `VITE_` variable or client code.

## 5. Test plan (Stripe test mode, preview deployment)

1. Sign in at `/login` with a Google account → confirm you land on `/dashboard`
   and a profile row exists with your name.
2. Save an article from `/news/...` → appears under "Saved articles".
3. Fill in the profile form → Save → reload → values persist.
4. `/join` → pick a tier and a term (try a 2-year to confirm the discount
   price and a renewal date two years out; also test Legacy → Lifetime, which
   should show **Active** with "lifetime, no renewal needed") → pay with test
   card `4242 4242 4242 4242` → land on `/dashboard?checkout=success` → within
   seconds status shows **Active** with tier + renewal date.
5. "Manage billing" opens the Stripe portal; cancel the test subscription →
   dashboard shows **Canceled** after the webhook fires.
6. Sign out; confirm `/dashboard` bounces to `/login` and news pages still load.

## Phase 2 — Donations (NOT yet built; deliberately deferred)

**Plan (decided 2026-07-06): donations will run through Fiscal Sponsorship
Allies (https://fiscalsponsorshipallies.org), NOT our own Stripe.** The fiscal
sponsor's 501(c)(3) makes gifts tax-deductible while SAMPA's own status is
pending, and they handle receipts/IRS acknowledgment compliance. Expected
integration: point the homepage "Donate Now" button (and optionally each donor
tier card) at the FSA-hosted donation page once SAMPA's FSA account exists —
no backend work; the membership webhook already ignores non-membership
payments. Until then the donation section keeps linking to the old Google
Form. When FSA goes live, also revisit the donation-section copy ("pending
501(c)(3)") with sponsor-approved tax-deductibility language.

The approved donor tiers ("SAMPA Membership & Donor Tiers 2026"), for whenever
that build happens:

| Tier | Annual | 2-yr (−10%) | 3-yr (−15%) | Tax note |
|---|---|---|---|---|
| Community Supporter | Free | — | — | — |
| Bronze | $25 | $45 | $64 | fully deductible (≤$75 IRS threshold) |
| Silver | $75 | $135 | $191 | fully deductible (≤$75 IRS threshold) |
| Gold | $150 | $270 | $383 | partially deductible |
| Platinum | $300 | $540 | $765 | partially deductible |
| Patron/Benefactor | $600+ | — | — | partially deductible |
| Organizational | $1,500–$5,000+ | — | — | partially deductible |

Also from the old form, to include in the build: custom amounts, one-time vs.
recurring frequency, and an "keep my gift anonymous" (donor recognition)
checkbox. Per the 501(c)(3) compliance note, tiers above $75 need written
acknowledgment of the tax-deductible portion (fair-market-value of benefits
documented annually). The webhook already ignores non-membership one-time
payments, so donation checkouts won't disturb membership status.

## Notes for the future mobile apps (iOS/Android)

- **Keep membership purchases on the website.** Apple takes 30% and forces
  In-App Purchase for digital memberships sold *inside* the app. Reading
  membership status that was purchased on the web ("multiplatform services")
  is allowed. The app should read `profiles.membership_status` from Supabase
  and, for joining/renewing, direct people to the website.
- **Sign in with Apple will be required** in the iOS app because we offer
  Google sign-in (App Store guideline 4.8). Supabase has an Apple provider;
  enable it when the app ships. Users are matched by verified email
  automatically — and our Stripe link uses the user id, not email, so Apple's
  "Hide My Email" relay addresses cause no billing problems.
- The `/api/*` endpoints authenticate with a Supabase JWT in the
  `Authorization` header (not cookies), so the mobile apps can call them as-is.
