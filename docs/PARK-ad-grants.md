# PARK — Google Ad Grants website compliance

**Status:** Mid-flight after PR #56 merged to `main` (2026-08-04). First Ad Grants website pass shipped; operator wants to keep adding org/program info before / while re-submitting.  
**Resume phrase:** `Resume SAMPA Ad Grants website`  
**Board:** [`STATUS.md`](STATUS.md)  
**Policy:** [Google Ad Grants website policy](https://support.google.com/grants/answer/1657899)  
**Shipped PR:** [#56](https://github.com/jluftig/sampa-website/pull/56)  
**Live:** https://www.addictionpas.org · **Repo:** `jluftig/sampa-website`

---

## Goal

Keep www.addictionpas.org clearly compliant with Ad Grants website policy while SAMPA is still early-stage: fast load, clear nav, substantial original content, **prominent 501(c)(3) + EIN**, clear mission + activities, working CTAs (Join / Donate / Contact). Add more accurate org info as Josh provides it — without empty “coming soon” landing pages.

---

## What already shipped (do not undo)

- Static homepage hero (particle “Assembly” effect **parked** until after Ad Grants approval) — [`src/components/Hero.jsx`](../src/components/Hero.jsx)
- Hero headline: **Advancing addiction medicine**; nonprofit line `501(c)(3) nonprofit · EIN 42-2288772`; Join + Donate CTAs
- Dedicated **`/about`** — [`src/pages/About.jsx`](../src/pages/About.jsx): who we are, mission, nonprofit status, live vs in-development programs, get involved
- Homepage order: Hero → mission band → Programs → News → Membership — [`src/pages/Home.jsx`](../src/pages/Home.jsx)
- Nav: About → `/about`; Programs → `/#programs` (not “CE & Resources”)
- **Live programs (honest):** daily news, member networking directory only
- **In development (named, no empty routes):** member email updates, practice resources, CME, job board
- EIN **42-2288772**; SAMPA, Inc. is 501(c)(3); donations on

---

## Locked decisions

1. **No empty landing pages** for CME / resources / jobs / email — describe on `/about` + Programs until real content exists (Google flags under-construction pages).
2. **Member email is not “live”** — Brevo campaigns are scaffolded, not sending yet ([`PARK-brevo-email.md`](PARK-brevo-email.md)). Dashboard `newsletter_opt_in` exists; do not claim members already receive weekly roundups.
3. **Particle hero stays off** until Ad Grants is approved (then optional restore).
4. **Terminology:** user-facing **physician associates** (never “physician assistants”); UI “keyword” vs DB `tag`.
5. Single product board = **STATUS** — update STATUS when state changes; keep this PARK thin.

---

## Why Google rejected (context)

Rejection themes: load speed + clear navigation; substantial up-to-date content + CTAs; **prominently display nonprofit status**; clear mission and activities. Mission already existed but was easy to miss; EIN was mostly footer/donate.

---

## Next (ordered)

1. Confirm **production deploy** of PR #56 on www.addictionpas.org (Vercel `main`).
2. Run **PageSpeed Insights** (mobile) on `/` and `/about`; fix only if scores/reg flags are still poor.
3. **Add more org/program copy** as Josh supplies facts (leadership, history, who we serve, impact framing, program detail) — prefer expanding `/about` and homepage bands over new thin pages.
4. When content feels solid, Josh **re-submits Ad Grants activation** in Google for Nonprofits.
5. After approval: optional restore particle hero; promote member email to “live” only when Brevo actually sends.

---

## Key files

| Area | Path |
|------|------|
| Hero | `src/components/Hero.jsx`, `src/components/heroMark.js` |
| Homepage mission band | `src/components/About.jsx` |
| Programs (live / building) | `src/components/ValueProps.jsx` |
| About page | `src/pages/About.jsx` |
| Nav / footer | `src/components/Navbar.jsx`, `src/components/Footer.jsx` |
| Routes | `src/App.jsx` |
| Donate / 501(c)(3) | `src/pages/Donate.jsx`, `src/lib/features.js` |

---

## Out of scope unless asked

Brevo send ops (use Brevo PARK), Stripe/RLS, mobile TestFlight, bup dosing tool, inventing a second roadmap outside STATUS.

---

## Clean session paste

> Resume SAMPA Ad Grants website. Read docs/PARK-ad-grants.md, docs/STATUS.md, and CLAUDE.md. PR #56 already merged: static hero, /about, Programs live vs in-development. Do not claim member email is live. No empty coming-soon routes. Help add more accurate org/program content for Ad Grants, then prepare for re-submit after prod deploy + PageSpeed check.
