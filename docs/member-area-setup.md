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

### Migration 4 — cancel-at-period-end flag (added 2026-07-06, post-test)

Run before deploying the matching webhook code (or just after — Stripe retries
failed webhook deliveries, so nothing is lost):

```sql
alter table public.profiles add column if not exists cancel_at_period_end boolean not null default false;

create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() and (
       new.role               is distinct from old.role
    or new.membership_status  is distinct from old.membership_status
    or new.membership_tier    is distinct from old.membership_tier
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.renews_on          is distinct from old.renews_on
    or new.cancel_at_period_end is distinct from old.cancel_at_period_end
  ) then
    raise exception 'Only admins can change role or membership fields';
  end if;
  return new;
end; $$;
```

Why: Stripe's portal cancellation is "cancel at period end" — the member stays
active until the term they paid for runs out. Without this flag the dashboard
would say "renews <date>" after a cancellation; with it, it says "member
benefits end <date>".

### Migration 6 — checkbox permissions (added 2026-07-07)

Replaces the single-role ladder with independent capabilities: **publish news**
(`can_edit_news`, the old editor role), **view members** (`can_view_members` —
READ-ONLY roster + pledge tracker, for the membership committee/treasurer/
board), and **admin** (everything). People can hold any combination. Run
before deploying the matching code:

```sql
alter table public.profiles add column if not exists can_edit_news    boolean not null default false;
alter table public.profiles add column if not exists can_view_members boolean not null default false;

update public.profiles set can_edit_news = true where role = 'editor' and not can_edit_news;

create or replace function public.is_editor()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role in ('editor','admin') or can_edit_news
       from public.profiles where id = auth.uid()),
    false);
$$;

create or replace function public.is_member_viewer()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select role = 'admin' or can_view_members
       from public.profiles where id = auth.uid()),
    false);
$$;

create or replace function public.guard_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_admin() and (
       new.role               is distinct from old.role
    or new.membership_status  is distinct from old.membership_status
    or new.membership_tier    is distinct from old.membership_tier
    or new.stripe_customer_id is distinct from old.stripe_customer_id
    or new.renews_on          is distinct from old.renews_on
    or new.cancel_at_period_end is distinct from old.cancel_at_period_end
    or new.can_edit_news      is distinct from old.can_edit_news
    or new.can_view_members   is distinct from old.can_view_members
  ) then
    raise exception 'Only admins can change role or membership fields';
  end if;
  return new;
end; $$;

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using ( auth.uid() = id or public.is_admin() or public.is_member_viewer() );

drop policy if exists member_import_select on public.member_import;
create policy member_import_select on public.member_import
  for select using ( public.is_admin() or public.is_member_viewer() );

select 'migration 6 applied ✓' as status;
```

Note for the treasurer/accountant: financial reporting lives in Stripe, which
has its own team roles — invite them at Stripe → Settings → Team with a
view-only/Analyst role instead of building anything here.

### Migration 5 — admin pledge tracking (added 2026-07-07)

Lets admins see pledge-conversion status on `/editor/members` (who hasn't
signed in, who signed in but hasn't paid, who's paid). Read-only, admins only;
the table still can't be written through the site.

```sql
drop policy if exists member_import_select on public.member_import;
create policy member_import_select on public.member_import
  for select using ( public.is_admin() );
```

### Migration 3 — importing the Google Form sign-ups (added 2026-07-06)

The 2026 Google Form sign-ups are **unpaid pledges** (the form predates the
payment system), so importing them grants NO memberships. They load into a
staging table (`member_import`); at each person's first login,
`claim_member_import()` matches their email and pre-fills the profile (name,
state, credentials, phone, SMS preference). They then pay through `/join` like
everyone else, and membership starts the day they pay. The pledged tier/term
stays queryable in `member_import` — useful for the "dues are live" invitation
email. The only exception: for a payment confirmed outside Stripe (check,
comp), set that row's `activate = true` *before* their first login and the
claim will grant the pledged term dated from their sign-up; such members have
no `stripe_customer_id`, so the dashboard hides "Manage billing" until they
renew online.

**This repo is PUBLIC — the INSERT statements with real member data must NEVER
be committed.** The structure lives in `supabase/schema.sql`; the data-bearing
SQL is generated locally from the form-responses CSV and pasted straight into
the Supabase SQL editor (regenerate from the CSV if lost; `.gitignore` blocks
`*member-import*` and `*Responses*.csv` as a safety net).
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
   branch). Payoff: the Google sign-in screen stops saying "to continue to
   xbzzawjnphpnexwfjtif.supabase.co" and shows the app name ("SAMPA") instead.
   For the full white-label (your domain in fine print AND in magic-link email
   URLs), the later upgrade is a Supabase custom domain (Pro plan + add-on,
   ~$35/mo total): auth moves to e.g. api.addictionpas.org, with matching
   updates to the Google OAuth redirect URI and VITE_SUPABASE_URL.

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
   - `invoice.paid` *(needed for recurring **donations** — records each monthly
     gift cycle. One-time gifts arrive via `checkout.session.completed`, which is
     already in the list.)*
   Copy the **signing secret** (`whsec_...`).
3. **Customer Portal**: Settings → Billing → Customer portal → enable, and
   allow: update payment method, cancel subscription, switch plans (add the six
   membership prices as switchable products so members can change tiers there).
4. **SMS-discount promo code (board-approved 2026-07-06):** the bootstrap
   script also creates coupon "SMS updates dues discount (5%)" behind
   promotion code **`SAMPATEXT5`** (duration `once`: 5% off the whole first
   term at checkout; auto-renewals bill full price). Members who opt into text
   updates see the code on `/join`; checkout has a promo-code field.
   - **Retire it:** Stripe dashboard → Products → Coupons → deactivate the
     promotion code (existing memberships are unaffected).
   - **Change the %:** coupons are immutable — deactivate `SAMPATEXT5`, create
     a new coupon + code in the dashboard, and update the code shown in
     `src/pages/Join.jsx` (and in `scripts/stripe-bootstrap.mjs` for reruns).
5. Do all of the above in **Test mode** first; repeat in Live mode when ready.

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

**After testing, before go-live:** any account used for test-mode checkouts now
holds TEST billing data in the shared DB — including a test `stripe_customer_id`
that live-mode checkout would try (and fail) to reuse. Reset each tester:

```sql
update public.profiles
   set stripe_customer_id = null, membership_tier = null,
       membership_status = null, renews_on = null, cancel_at_period_end = false
 where email = 'tester@example.com';  -- one per test account
```

## Support runbook — member signed in with the wrong email

Identity is keyed by email, so someone with multiple Google accounts can land
in a fresh, empty account. The dashboard and `/join` show "you're signed in
as X" hints for self-service; when someone writes in anyway, it's one of three
cases:

**Case A — pledger (old form sign-up) whose profile didn't pre-fill.**
Their `member_import` row is unclaimed because they signed in with a different
address. Re-point the row, then re-run the claim (SQL editor):

```sql
update public.member_import
   set email = lower('actual@email.com')
 where email = 'form@email.com' and claimed_at is null;

select public.claim_member_import(p.id, p.email)
from public.profiles p
join public.member_import m on m.email = lower(p.email)
where m.claimed_at is null;
```

**Case B — paid member who accidentally signed in on a second account.**
Nothing to move — tell them to sign out and sign back in with the email they
joined under. The stray empty profile is harmless (optionally delete it:
Supabase → Authentication → Users).

**Case C — member PAID on the "wrong" account and wants their membership on
another one.** Move the membership, then re-point Stripe:

```sql
-- 1. Copy membership/billing onto the account they want to keep
update public.profiles dst
   set stripe_customer_id   = src.stripe_customer_id,
       membership_tier      = src.membership_tier,
       membership_status    = src.membership_status,
       renews_on            = src.renews_on,
       cancel_at_period_end = src.cancel_at_period_end
  from public.profiles src
 where src.email = 'wrong@email.com'
   and dst.email = 'right@email.com';

-- 2. Clear it off the old account
update public.profiles
   set stripe_customer_id = null, membership_tier = null,
       membership_status = null, renews_on = null, cancel_at_period_end = false
 where email = 'wrong@email.com';

-- 3. Note the surviving profile's id (needed for step 4)
select id, email from public.profiles where email = 'right@email.com';
```

4. **Stripe (Live mode)** → Customers → open their subscription → **Edit
   metadata** → set `supabase_user_id` to the id from step 3. Without this,
   future renewal/cancellation webhooks would update the old, now-empty
   profile.
5. Optional — move saved articles too:

```sql
insert into public.favorites (user_id, post_id, created_at)
select (select id from public.profiles where email = 'right@email.com'),
       post_id, created_at
  from public.favorites
 where user_id = (select id from public.profiles where email = 'wrong@email.com')
on conflict do nothing;

delete from public.favorites
 where user_id = (select id from public.profiles where email = 'wrong@email.com');
```

**Prevention:** the pledger invitation email tells each person exactly which
email to sign in with. If wrong-email support requests become frequent at
scale, the next step up is Supabase identity linking (members add a second
email to one account) — not worth building until then.

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
