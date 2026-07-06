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

1. Create a **Product** per membership tier, each with a **recurring yearly
   Price** (these are the current site prices):
   | Tier key | Product | Price |
   |---|---|---|
   | `fellow` | SAMPA Fellow Membership | $50/yr |
   | `sustaining` | SAMPA Sustaining Membership | $75/yr |
   | `associate` | SAMPA Associate Membership | $40/yr |
   | `legacy` | SAMPA Legacy Membership | $25/yr |
   | `student` | SAMPA Student Membership | $10/yr |
   | `prepa` | SAMPA Pre-PA Membership | $5/yr |
   Copy each **Price id** (`price_...`) for step 5.
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
| `STRIPE_PRICE_FELLOW` … `STRIPE_PRICE_PREPA` | the six Price ids from step 3.1 |

(`SUPABASE_URL` is optional — the functions fall back to `VITE_SUPABASE_URL`.)

**Never** expose `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, or
`SUPABASE_SERVICE_ROLE_KEY` in a `VITE_` variable or client code.

## 5. Test plan (Stripe test mode, preview deployment)

1. Sign in at `/login` with a Google account → confirm you land on `/dashboard`
   and a profile row exists with your name.
2. Save an article from `/news/...` → appears under "Saved articles".
3. Fill in the profile form → Save → reload → values persist.
4. `/join` → pick a tier → pay with test card `4242 4242 4242 4242` → land on
   `/dashboard?checkout=success` → within seconds status shows **Active** with
   tier + renewal date.
5. "Manage billing" opens the Stripe portal; cancel the test subscription →
   dashboard shows **Canceled** after the webhook fires.
6. Sign out; confirm `/dashboard` bounces to `/login` and news pages still load.

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
