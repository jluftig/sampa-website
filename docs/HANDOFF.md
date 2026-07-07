# SAMPA Website — Human Hand-off Guide

_A plain-English guide to how the SAMPA website and its News/blog system are built,
who runs what, how to do everyday tasks, and where it's all heading. If you're taking
this over cold, start here._

_Last updated: 2026-07-06_

---

## 1. What this is, in one paragraph

The SAMPA website is a React web app hosted on **Vercel**, live at
**www.addictionpas.org**. Most of it is a normal marketing site (home, about,
membership, events). The part that's "alive" is the **News blog**: approved editors
log in with their Google account and publish addiction-medicine news posts. Each post
has a normal article plus a set of tagged **Key Points** — and readers can browse
those points by **keyword** across every post, like a searchable clinical database.
The login, database, and file storage are all handled by a service called **Supabase**.

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

## 3. Who can do what (roles)

Everyone who signs in gets a **role**. Roles are the heart of the permission system:

- **member** — the default for anyone who signs in. Can't publish anything. (This is the
  placeholder for future paying members.)
- **editor** — can create, edit, publish, and delete news posts and their Key Points.
- **admin** — everything an editor can do, **plus** manage the keyword list and change
  other people's roles.

The public (people who never log in) can only **read published** posts. They cannot see
drafts and cannot change anything.

---

## 4. Everyday tasks

### Publish a news post
1. Go to **www.addictionpas.org**, click **Member Login** (navbar or footer) →
   **Continue with Google**. There is one login for everyone; what you can do
   is determined by your role (member / editor / admin).
2. On your member dashboard, click **Editor dashboard** (only editors and
   admins see this link), then click **+ New Post**.
3. Fill in the title, a short summary (excerpt), optionally upload a cover image (and a
   caption/citation if it's a figure), and write the article.
4. Add **Key Points** — each one a standalone takeaway — and click keyword chips to tag each point.
5. Click **Publish**. It's live immediately; no technical steps needed.
6. You can **Unpublish**, **Edit**, or **Delete** any post from the dashboard later.

### Add a new editor or admin
Two gates must both be satisfied — one on Google's side, one in our app:
1. **Google side (so they can sign in at all):** Google Cloud Console → APIs & Services →
   OAuth consent screen → **Test users** → **Add users** → enter their Google email.
2. **They sign in once** via Member Login (while Google sign-in is in "testing
   mode" they'll see a "Google hasn't verified this app" screen → **Advanced →
   continue** — that's normal until the consent screen is published).
3. **You set their role:** on the dashboard click **Manage editors**, find them in the
   list, and choose **editor** or **admin** from the dropdown.

> You can't change your own role in the UI (a safety measure). If you ever must, another
> admin can, or it can be done directly in Supabase.

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

- **profiles** — one row per person who has ever signed in: their name, email, phone,
  their role, their professional details (credentials, NPI, organization, practice
  setting — filled in by the member on their dashboard), and their membership info
  (tier, status, renewal date — written automatically by Stripe).
- **favorites** — which news articles each member has saved ("Saved articles" on the
  dashboard).
- **posts** — the news articles (title, summary, article text, cover image + caption,
  draft/published status, publish date).
- **tags** — the keyword vocabulary (full name + short label). ("Tag" is the internal
  name; the website calls them "keywords.")
- **items** — the individual **Key Points**. Each belongs to a post.
- **item_tags** — the links connecting each Key Point to its keywords.

---

## 8. If something looks broken

| Symptom | Most likely cause | Fix |
|---|---|---|
| Whole site is a blank white page | The Supabase environment variables are missing/renamed in Vercel | Re-check `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` in Vercel, then redeploy |
| A direct link like `/news/…` shows a Vercel 404 | The `vercel.json` "SPA rewrite" file is missing | Ensure `vercel.json` is present (it tells Vercel to serve the app for all routes) |
| An editor can't sign in | They're not on the Google **Test users** list | Add their email in Google Cloud Console |
| Someone signed in but can't publish | They're still a **member** | Set them to **editor** in Manage editors |
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
   Form), and their saved news articles.
5. Card updates, tier changes, receipts, and cancellation all happen in **Stripe's own
   hosted billing portal** ("Manage billing" button) — we build no payment screens.

Because the payment is tagged with the member's account ID (not matched by email),
someone paying with a work card/email still gets the right membership on the right login.

### The big picture
```
Stripe (payments)  ──webhook──►  Supabase profiles  ◄── /dashboard reads status
Member (dashboard form)  ──►     Supabase profiles  (professional details)
Members (save button)    ──►     Supabase favorites ◄── /dashboard "Saved articles"
Editors                  ──►     Supabase posts/keywords ──► Public News + keyword search
```
Everything converges on the single Supabase database, keyed to each person's account.

### Still ahead
- **CME content** for members — gate it with the `is_active_member()` database rule that
  already exists.
- **Multi-year discount pricing** in checkout (extra Stripe prices billed every 2–3 years).
- **iPhone/Android apps** — they'll read the same database and call the same `/api`
  endpoints. Two rules already baked in: memberships stay purchased on the website (Apple
  would otherwise take 30% via In-App Purchase), and "Sign in with Apple" gets enabled in
  Supabase when the iOS app ships (Apple requires it alongside Google sign-in).

---

## 11. Key contacts & accounts to secure

Make sure a trusted second person has access to (or knows how to recover):
- The **GitHub** repository (`jluftig/sampa-website`)
- The **Vercel** account/project
- The **Supabase** project (and the database password saved at creation)
- The **Google Cloud** project for OAuth
- The domain registrar for **addictionpas.org**

Losing access to these is the main "bus factor" risk — everything else is documented in
code (`supabase/schema.sql`) and in the companion AI guide (`CLAUDE.md`).
