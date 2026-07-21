# SAMPA Website — Human Hand-off Guide

_A plain-English guide to how the SAMPA website and its News/blog system are built,
who runs what, how to do everyday tasks, and where it's all heading. If you're taking
this over cold, start here._

**Current priorities and what's in flight:** see [STATUS.md](STATUS.md) — living project
status (live / blocked / next / backlog). This guide explains *how* the system works;
STATUS tracks *where things stand right now* and suggested future features.

_Last updated: 2026-07-21_ (OAuth published; donations temp-off flag; STATUS is board of record)

---

## 1. What this is, in one paragraph

The SAMPA website is a React web app hosted on **Vercel**, live at
**www.addictionpas.org**. It is a marketing site (home, about, membership, events,
donate, merch) **plus** a **News blog** with a research-style **Key Points** database,
a **member area** (join via Stripe, dashboard, saved articles), and a **member
networking directory** so active members can find each other. Approved editors publish
news; admins manage keywords and permissions. Login, database, and image storage are
handled by **Supabase**; payments by **Stripe**.

---

## 2. The three services that make it work

Think of it as three parts that plug together:

| Service | Plain-English job | Where you log in |
|---|---|---|
| **Vercel** | Hosts the website and puts new versions online automatically | vercel.com (owner's account) |
| **Supabase** | The "back office": the database (posts, keywords, users), the login system, and image storage | supabase.com → project `sampa-website` |
| **Google Cloud** | Powers the "Sign in with Google" button that editors use | console.cloud.google.com → project `SAMPA` |

**How they connect:** The website (Vercel) talks directly to Supabase. When an editor
clicks "Sign in with Google," Google confirms who they are and hands them back to
Supabase, which creates their account. There is no separate server we maintain — the
website talks to Supabase directly, and Supabase's built-in security rules decide who
can see or change what.

```
   Reader / Editor
        │
        ▼
   Website on Vercel  ──►  Supabase  (database + login + image storage)
                               ▲
                               │  "Sign in with Google"
                            Google Cloud
```

---

## 3. Who can do what (permissions)

Everyone who signs in gets a **member** account row. On top of that, admins grant
**independent checkbox permissions** — people can hold several at once:

- **Publish news** — create, edit, publish, and delete news posts and Key Points.
- **View members** — **read-only** access to the **staff roster** at
  `/editor/members` (counts, pledge tracker, CSV export) for the membership
  committee, treasurer, etc. They cannot change anyone's record — the database
  enforces this, not just the UI. This is **not** the same as the peer networking
  directory (see §10a).
- **Board** — marks someone as a SAMPA board member. Today: a badge on the member
  directory. Future board-only tools are not built yet. **Board is independent of
  Admin** — check both if someone needs both hats.
- **Admin** — operational access (keywords, People & permissions, full roster
  access, etc.). Does **not** automatically mean “Board” unless Board is checked.

**Active paid members** (membership status = active) can use member benefits such as
the **networking directory**. Editors/admins can browse it too (staff). Non-paying
signed-in users see the dashboard but not the directory.

The public (people who never log in) can only **read published** posts — never the
member directory or staff roster.

Note for the **treasurer/accountant**: financial reports live in Stripe, which
has its own team roles — invite them at Stripe → Settings → Team (view-only or
Analyst) rather than granting anything here.

### Member-data governance

- **Confidentiality agreement:** the first time anyone opens the Members page,
  they must click-accept the Confidentiality & Acceptable Use Agreement (use
  only for SAMPA business, keep it confidential, handle exports carefully,
  Google 2-Step Verification required, access ends with the role, sanctions
  for misuse). The click is recorded with a timestamp — that's the signature.
  The agreement is a careful draft pending counsel review; the board should
  formally adopt it.
- **Audit trail:** every permission change and every roster CSV export is
  logged. Admins can review it in the Supabase SQL editor:
  `select * from audit_log order by at desc;`
- **Annual access review (put it on the calendar):** once a year, open
  People & permissions and confirm every checked box still matches a current
  role. Uncheck anyone whose service ended.
- **Offboarding (do immediately):** when someone leaves a role — uncheck their
  boxes in People & permissions, remove them from the Stripe team if they had
  it, and remind them to delete any exported member data (they agreed to).

---

## 4. Everyday tasks

### Publish a news post
1. Go to **www.addictionpas.org**, click **Member Login** (navbar or footer) →
   **Continue with Google**. There is one login for everyone; what you can do
   is determined by your role (member / editor / admin).
2. On your member dashboard, click **Editor dashboard** (only people with the
   news permission see this link), then click **+ New Post**.
3. Fill in the title, a short summary (excerpt), optionally upload a cover image (and a
   caption/citation if it's a figure), and write the article.
4. Fill in the **Original source** box (publication name, link — for studies use the DOI
   link — and the original publication date). This is what readers get when they copy a
   citation from a Key Point, so it's worth the 30 seconds; leave it blank only for
   original SAMPA content.
5. Add **Key Points** — each one a standalone takeaway — and click keyword chips to tag each point.
6. Click **Publish**. It's live immediately; no technical steps needed.
7. You can **Unpublish**, **Edit**, or **Delete** any post from the dashboard later.

> **Readers can share and cite.** Every article has a Share button, and every Key Point
> has **Copy citation** / **Copy link** — the link goes straight to that highlighted
> point. That's also why editing a published post keeps its web address: changing the
> slug (or deleting a post) breaks links people have already shared.

### Find material for a talk or slide deck
- **Search** (`/search`, or the search box on the News page) looks inside every article
  AND every Key Point — try a drug name, policy, or study topic.
- **Keywords** (`/keywords`) browse by topic; on a keyword page, use the **Refine** chips
  to narrow to points that carry BOTH keywords (e.g. Buprenorphine + Pregnancy & Perinatal).
- On any Key Point, **Copy citation** gives you the claim, the original source with its
  date and link, and the SAMPA link — ready to paste into slides or notes.

### Grant someone permissions (news, roster, board, admin)
1. **They sign in once** via Member Login (Google or email link) — that creates
   their account.
2. **You check their boxes:** on the editor dashboard click **People &
   permissions**, find them, and check **Publish news**, **View members**,
   **Board**, and/or **Admin** as their hats require.

> You can't change your own permissions in the UI (a safety measure). If you
> ever must, another admin can, or it can be done directly in Supabase.

### Browse the member networking directory
1. Sign in as an **active member** (or as staff).
2. Open **Directory** in the navbar (or from the dashboard).
3. Search or filter by state; open a person to see professional details and any
   contact info they chose to share.
4. Control your own listing under **Dashboard → Your profile → Member directory**
   (show/hide listing; share email; share phone). Listing is **on by default**
   (opt-out); phone sharing is **off by default**.

> The directory is only for professional networking among members — not public,
> not for commercial solicitation. It is **not** the staff roster used for
> pledges and membership ops.

### Manage the keyword list (admins)
Dashboard → **Manage keywords**. You can add keywords, rename them, tweak the short
label (the compact chip like "OUD"), or delete them. The web address part of a keyword
(its "slug") is fixed once created so existing links keep working.

---

## 5. Where the important settings and keys live

- **Website environment variables** (the address + public key it uses to reach Supabase)
  live in **Vercel → Project → Settings → Environment Variables**. They're named
  `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. The same two values live locally in a
  file called `.env.local` (which is deliberately **not** stored in the code repository).
- **The Supabase publishable key is safe to be public** — the security rules in the
  database protect everything. **There is also a `service_role` / secret key in Supabase —
  that one must NEVER be put on the website or shared.** It bypasses all security.
- **Google login credentials** (Client ID/Secret) live inside **Supabase → Authentication →
  Providers → Google**. They never appear in our code.
- **The database structure** is defined in the file `supabase/schema.sql` in the code.
  That file is the master blueprint — if you ever had to rebuild the database from scratch,
  you'd run it.
- **Sign-in emails** (the 8-digit codes) are sent through **Brevo** using SMTP credentials
  stored in **Supabase → Authentication → Emails → SMTP settings**. The Brevo SMTP key is
  named `supabase-auth`. ⚠️ Brevo deletes SMTP keys unused for 90 days — if sign-in emails
  ever stop, generate a new key in Brevo and paste it into that Supabase screen.
- **Mobile push notifications** are authenticated by a shared secret that lives in TWO
  places that must match: **Vercel → Environment Variables → `PUSH_WEBHOOK_SECRET`** and
  the `x-push-secret` header on the **Supabase → Database → Webhooks → `push-on-publish`**
  webhook. The app-store signing keys (certificates, push key) are managed automatically
  by **Expo's EAS service** under the Expo account — you never handle those files.

---

## 6. How new versions go live

- The code lives on GitHub (`jluftig/sampa-website`).
- Anything merged into the **`main`** branch is **automatically deployed to production**
  (www.addictionpas.org) by Vercel within a minute or two.
- Work-in-progress happens on **separate branches**, each of which Vercel gives its own
  private **preview link** to test before it goes live. Nothing reaches the public until
  it's merged into `main`.

---

## 7. What's stored in the database

In plain terms, Supabase holds these tables:

- **profiles** — one row per person who has ever signed in: name, email, phone, role,
  capability flags (publish news, view staff roster, board), professional details
  (credentials, NPI, organization, practice setting — filled in on the dashboard),
  **directory privacy** (listed or not; share email/phone), and membership/billing
  (tier, status, renewal — written by Stripe). Members cannot change their own role
  or billing fields.
- **favorites** — which news articles each member has saved ("Saved articles" on the
  dashboard).
- **posts** — the news articles (title, summary, article text, cover image + caption,
  draft/published status, publish date).
- **tags** — the keyword vocabulary (full name + short label). ("Tag" is the internal
  name; the website calls them "keywords.")
- **items** — the individual **Key Points**. Each belongs to a post.
- **item_tags** — the links connecting each Key Point to its keywords.
- **donations** — one row per gift (kept separate from membership dues): amount, whether
  it's one-time or monthly, the donor's email/name, and a link to the signed-in member if
  they had an account. Written automatically by Stripe; nobody edits it by hand.
- **audit_log** — permission changes and staff-roster CSV exports (governance trail).

---

## 8. If something looks broken

| Symptom | Most likely cause | Fix |
|---|---|---|
| Whole site is a blank white page | The Supabase environment variables are missing/renamed in Vercel | Re-check `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in Vercel, then redeploy |
| A direct link like `/news/…` shows a Vercel 404 | The `vercel.json` "SPA rewrite" file is missing | Ensure `vercel.json` is present (it tells Vercel to serve the app for all routes) |
| An editor can't sign in | OAuth/config issue, wrong account, or browser blocking | Confirm Google provider enabled in Supabase; try magic link; check they’re using the intended Google account. Consent screen is **published** (not limited to test users) |
| Someone signed in but can't publish | They don't have the news permission | Check **Publish news** for them in People & permissions |
| Member directory says “not available yet” or is empty for everyone | Directory SQL migration not applied | Run `supabase/migrations/2026-07-10-member-directory.sql` in Supabase SQL Editor |
| Active member can't open Directory | Membership not `active` on their profile | Check dashboard / Stripe; staff (editor/admin) can still browse |
| A new post won't save | A database column is missing (rare, only after code changes) | Check the latest migration notes; the master schema is `supabase/schema.sql` |

---

## 9. Rollback & recovery — how to undo a bad change

**First, a reassurance:** deleting old merged branches never loses anything. Once a branch is
merged, its changes live permanently in `main`'s history; a branch name is just a pointer.
Any past state can be restored, and any branch can be recreated from any commit. So cleaning
up merged branches is safe and does **not** make reverting harder.

There are two ways to roll back, plus one caveat about the database.

### Fastest — Vercel Instant Rollback (use this first in an emergency)
Vercel keeps every past deployment, so you can restore the site without touching code:
- Vercel → project → **Deployments** → find the last good deployment → **⋯ → Promote to Production**.
- The site is restored in **seconds**, with no code or database changes — this buys you time to
  diagnose calmly. The last known-good deployment from *before* the News blog is commit `7887071`.

### Proper git undo — `git revert`
This adds a new "undo" commit and is the safe way to undo history on a live branch (never
force-push/rewrite `main`):
```bash
git revert -m 1 <merge-commit-sha>   # undoes everything a merged PR introduced
git push origin main                  # Vercel auto-deploys the reverted state
```
Undo several by reverting newest-first. To bring a reverted feature back later, "revert the
revert" (`git revert <the-revert-commit>`) — re-merging the old branch won't work, but nothing
is ever lost.

### ⚠️ The database rolls back separately from the code
Reverting code does **not** change the Supabase database. They're independent:
- Our migrations are **additive and idempotent**, so rolling code *back* is safe — an unused
  column just sits there ignored.
- The risky direction is deploying code that *expects* a DB change that hasn't been applied — so
  always run DB migrations **before** the code that needs them.
- Undoing a **destructive** DB change (dropped column, deleted data) needs a compensating SQL
  migration or a **Supabase backup restore** — `git revert` can't do it.

**Emergency sequence:** (1) Vercel Instant Rollback → (2) reproduce/diagnose on a branch's
preview URL → (3) fix forward with a small PR, or `git revert` the bad merge → (4) touch the
database only if the problem was a schema/data change.

## 10. The member area — how it works (built July 2026)

The pieces that used to live in this section as "roadmap" are now **built**: Stripe
membership payments, the member dashboard, in-app profile onboarding (replacing the
Google Form), saved articles, and passwordless email login. What remains is one-time
**configuration** — creating the Stripe products, the webhook, environment variables, and
publishing the Google sign-in screen. The exact click-by-click checklist and test plan:
**`docs/member-area-setup.md`**.

### How joining works (the "account-first" flow)
1. A visitor clicks **Join** → signs in with Google (one click, no password — we get
   their name and email automatically) or requests an email sign-in link.
2. They pick a membership tier on **/join** → we hand them to **Stripe Checkout**, which
   collects **only payment details**. Their account ID rides along with the payment.
3. Stripe notifies our webhook, which stamps their **profiles** row: customer ID, tier,
   status (active / past-due / canceled), renewal date. **Stripe stores the card — we
   never do.** The website only ever reads from Supabase.
4. They land on **/dashboard**: membership status, a short professional-profile form
   (name, credentials, NPI, organization, practice setting — this replaces the Google
   Form), **member directory privacy** (whether other members can see them and which
   contact fields are shared), and their saved news articles.
5. Card updates, tier changes, receipts, and cancellation all happen in **Stripe's own
   hosted billing portal** ("Manage billing" button) — we build no payment screens.
6. Active members can open **/members** (Directory) to network with peers who have not
   opted out of the listing.

Because the payment is tagged with the member's account ID (not matched by email),
someone paying with a work card/email still gets the right membership on the right login.

### The big picture
```
Stripe (payments)  ──webhook──►  Supabase profiles  ◄── /dashboard reads status
Member (dashboard form)  ──►     Supabase profiles  (professional details + directory privacy)
Members (save button)    ──►     Supabase favorites ◄── /dashboard "Saved articles"
Active members           ──►     member_directory RPCs  ──► /members (peer networking)
Staff (view members)     ──►     profiles (full roster) ──► /editor/members + agreement
Editors                  ──►     Supabase posts/keywords ──► Public News + keyword search
```
Everything converges on the single Supabase database, keyed to each person's account.

### 10a. Member networking directory vs staff roster

| | **Member directory** (`/members`) | **Staff roster** (`/editor/members`) |
|---|---|---|
| Who can open it | Active paid members (+ staff) | Admins + “View members” permission |
| Purpose | Peer networking | Membership ops, pledges, CSV |
| Data shown | Name, credentials, org, practice, state; email/phone only if shared | Full profile + billing/status + donor flag |
| Extra gate | None beyond active membership | Confidentiality agreement click-accept |
| How data is loaded | Special database functions (safe column list) | Direct profile read (privileged) |

Members control their directory presence on the dashboard (opt-out of listing; share
email; share phone). Defaults: listed **on**, email shared **on**, phone shared **off**.

### Donations — separate from membership dues

There's also a public **Donate** page (`/donate`) where **anyone** can give — no account
or sign-in required. Donors choose one-time or monthly and pick any amount. It's handled
by Stripe just like membership, but kept completely separate from dues.

**"Why don't I see a Donation product in Stripe?"** You won't, and that's correct. Unlike
membership tiers (which are fixed Stripe **Products** with set prices), a donation can be
any dollar amount, so there's nothing fixed to pre-create. The website builds each gift on
the spot when someone donates. Stripe quietly makes a throwaway "Donation to SAMPA" line
for that one payment, but it will **not** show up in Stripe's **Products** list — don't go
looking for it there.

**Where donations actually show up:**
- In **Stripe**: one-time gifts appear under **Payments**; monthly gifts appear under
  **Subscriptions**; every donor gets a **Customer** record (so they get receipts). To
  tell a donation apart from membership dues in Stripe, open the payment and look at its
  **metadata** — donations are tagged `type = donation`.
- In **Supabase**: the authoritative list of all gifts is the **donations** table
  (see section 7). That — not Stripe's Products page — is the real donation ledger, and it
  keeps gifts cleanly separated from membership payments.

**Not tax-deductible yet.** SAMPA's 501(c)(3) status is pending, so the Donate page carries
a disclosure saying gifts aren't deductible until the IRS approves it (with the expectation
they'll be retroactively deductible once approved). Keep that disclosure until the
determination letter arrives.

> **Heads-up when checking Stripe:** the top-right **Test mode** toggle matters. If you
> tested a donation in Test mode, it won't appear in Live mode, and vice-versa. Seeing "no
> donations" is usually just the wrong mode selected.

### Still ahead (summary — full backlog in STATUS.md)

**Ops / blocked**
- Google OAuth consent screen **already published** (2026-07-12).
- Donations Stripe checkout is **temporarily off** via `DONATIONS_ENABLED` in
  `src/lib/features.js` and `api/create-donation-session.js` — flip both to `true` +
  redeploy to restore.
- 501(c)(3) letter → update donate disclosure; Google for Nonprofits; email platform
  campaigns (Brevo auth SMTP already live; board campaign side pending).
- Remaining pre-membership security P0 (Vercel/Stripe/webhook E2E) — see STATUS.
- Counsel review of privacy/terms and directory sharing defaults (optional).

**Product ideas already planned or suggested**
- Directory v2: **avatars/photos**, short bio, LinkedIn/website, richer filters.
- **Board-only tools** (beyond the Board badge).
- **CME content** for members (gate with existing `is_active_member()` rule).
- **Mobile app** is built on main and in TestFlight path — public App Store still open
  (D-U-N-S / org account, board testing). Memberships stay on the website (no Apple IAP).
- Clinical **buprenorphine dosing / COWS** tool (built on `feature/bup-dosing-tool`; launch hold).

Multi-year membership terms in checkout are **already built** (1/2/3-year prices per
tier; Legacy lifetime where configured).

Living checklist and priorities: **[STATUS.md](STATUS.md)**.

---

## 11. Key contacts & accounts to secure

Make sure a trusted second person has access to (or knows how to recover):
- The **GitHub** repository (`jluftig/sampa-website`)
- The **Vercel** account/project
- The **Supabase** project (and the database password saved at creation)
- The **Google Cloud** project for OAuth
- The domain registrar for **addictionpas.org** (Porkbun — also hosts the DNS records
  that make sign-in emails deliverable)
- The **Apple Developer** account (currently Josh's individual account,
  joshluftig@hotmail.com; plan is to convert it to a SAMPA organization account once
  SAMPA has a D-U-N-S number — before public App Store launch)
- The **Expo (EAS)** account (username `jluftig`) — builds and signing for the mobile app
- The **Brevo** account — sign-in emails today, member newsletters per the board plan

Losing access to these is the main "bus factor" risk — everything else is documented in
code (`supabase/schema.sql`) and in the companion AI guide (`CLAUDE.md`).

---

## 12. The mobile app (iPhone / Android) — built July 2026

- **What it is:** a native app (in the `mobile/` folder of the same repository) sharing
  the website's database — same accounts, same membership, same articles. Members read
  news and Key Points, search, save articles (synced with the website), browse the
  member directory, edit their profile, and get a push notification when SAMPA
  publishes an article. Signing in works with Apple, Google, or an emailed code, with
  optional Face ID lock. **Memberships are never sold inside the app** (Apple would
  take up to 30%) — the app links to the website to join or renew.
- **How testers/members get it (today):** Apple **TestFlight**. Testers install the free
  TestFlight app and open our invite link; updates then arrive automatically. Managed at
  **appstoreconnect.apple.com** → SAMPA → TestFlight (tester group: "SAMPA Board").
- **How a new version ships:** one Terminal command (an AI session provides and guides
  it — see `docs/mobile-app-setup.md`), which builds in Expo's cloud and uploads to
  Apple automatically. There is no manual Xcode work.
- **How push notifications flow:** publishing a post on the website → a Supabase
  webhook calls the site's `/api/send-push` → Expo/Apple deliver to every member who
  has "New article alerts" on. Nobody has to "send" anything — publishing is the send.
- **If push stops working:** check the two matching secrets described in section 5,
  and confirm the `push-on-publish` webhook is enabled in Supabase.
- **Status & roadmap** live in `docs/STATUS.md`; technical setup history in
  `docs/mobile-app-setup.md`.
