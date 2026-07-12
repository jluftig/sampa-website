# Security & architecture health check (pre-membership recruitment)

**Date:** 2026-07-12  
**Scope:** Code + schema review of `jluftig/sampa-website` (privacy/terms pages, API routes, RLS, client, hosting model).  
**Not:** A penetration test, formal legal opinion, or SOC 2 audit.  
**Verdict in one line:** **Solid foundation for a small nonprofit membership site** — better than average SPA of this size; a few **ops and product-risk** items to close before broad recruitment, not a “do not launch” architecture.

---

## Overall structure (is this a good design?)

```
Browser (Vite/React SPA)
  ├── anon/publishable Supabase key + RLS
  ├── Auth: Google OAuth + magic link (no app passwords)
  └── Payments UI → Stripe Checkout / Customer Portal (hosted by Stripe)

Vercel serverless (api/)
  ├── JWT-gated: checkout, billing portal
  ├── Public: donations (amount-capped), OG share for bots
  └── Stripe webhook (signature-verified) → service role writes membership only

Supabase Postgres
  ├── RLS on all member/content tables
  ├── guard_profile_role() blocks self-escalation of role/billing
  ├── member_directory* SECURITY DEFINER RPCs (allowlisted columns)
  └── Stripe webhook is sole writer of membership billing columns
```

**Assessment:** Appropriate for SAMPA’s stage. You avoid running a custom payment stack, avoid storing cards, put authorization in the database (RLS), and keep elevated keys server-side. That is the right shape for a professional membership org site.

---

## Scorecard

| Area | Grade | Notes |
|------|-------|--------|
| Architecture / stack fit | **A−** | Modern, small surface, Stripe-hosted payments |
| Database authorization (RLS) | **A** | Strong; directory not open profiles SELECT |
| Payment / webhook design | **A** | Signature verify; user id link not email; donations segregated |
| XSS / content rendering | **A−** | DOMPurify on post HTML; editor-only writers |
| Secrets hygiene (repo) | **A** | No live secrets in git; `.env` gitignored |
| API abuse resistance | **B−** | No app-level rate limits on public donate |
| Auth / identity at scale | **B** | Passwordless good; Google OAuth still **Testing**; no app MFA |
| Legal docs (privacy/terms) | **B+** | Clear, membership/directory aware; not counsel-reviewed |
| Operational security | **B** | Depends on Vercel/Supabase/Google admin hygiene |
| Directory product risk | **B** | Opt-out listing + scrape risk residual (terms forbid; technical rate limits light) |

---

## What’s working well (keep doing this)

1. **RLS is the real boundary** — profiles not world-readable; peer data via allowlisted RPCs only for active members.  
2. **`guard_profile_role`** — members cannot self-grant admin or set membership status.  
3. **Stripe Checkout / Portal** — card data never on SAMPA servers.  
4. **Webhook** — `constructEvent` signature check; membership vs donation metadata separation; lifetime protection against subscription downgrade.  
5. **Checkout identity** — `client_reference_id` / metadata `supabase_user_id`, not email matching.  
6. **Post body XSS** — `DOMPurify.sanitize` before `dangerouslySetInnerHTML`.  
7. **Storage** — `post-images` public read (covers), write requires `is_editor()`.  
8. **Share API** — anon key + `status=eq.published` + HTML escape for OG tags.  
9. **Privacy/Terms** — no PHI claim, directory controls, Stripe/Google disclosed, educational-not-advice, acceptable use vs scrape/spam.  
10. **Privileged roster** — click-accept agreement + audit log for permission/export (governance layer).

---

## Gaps / risks before recruiting members

### P0 — do before “open membership” marketing

| # | Issue | Risk | Recommendation |
|---|--------|------|----------------|
| 1 | **Google OAuth consent still Testing** | Only allowlisted users can Google-sign-in; scale-up fails or confuses recruits | Publish OAuth consent when ready (`docs/member-area-setup.md`); keep magic-link as backup |
| 2 | **Confirm Vercel env keys** | Wrong/missing `STRIPE_WEBHOOK_SECRET` / service role breaks billing or opens misconfig | Checklist: Production + Preview have Stripe live/test keys, webhook secret, Supabase URL + **secret/service_role** server-side only, no `VITE_` for elevated keys |
| 3 | **Supabase secret key migration** | Docs/API still name `SUPABASE_SERVICE_ROLE_KEY`; new projects prefer `sb_secret_…` | Ensure Vercel holds the elevated key that works today; plan rename to secret key when migrating |

### P1 — should schedule soon after open

| # | Issue | Risk | Recommendation |
|---|--------|------|----------------|
| 4 | **Public donation endpoint, no rate limit** | Card-testing / spam Checkout sessions (Stripe costs/friction) | Stripe Radar, CAPTCHA later, or edge rate limit on `/api/create-donation-session` |
| 5 | **Directory default listed + email share on** | Surprising exposure for privacy-sensitive clinicians; harvest by any active member | Already disclosed in privacy; consider double-confirm at first directory view or default email share **off** if board prefers |
| 6 | **Directory scrape** | Malicious member script-harvests contacts | Terms forbid; consider rate limits on RPCs, logging, temporary ban; export only via staff roster with audit |
| 7 | **No automated test suite** | Regressions on RLS/auth | Add a few critical RLS tests or manual script before big campaigns |
| 8 | **Legal: counsel optional** | Wyoming corp, pending 501(c)(3), limitation of liability — adequacy unknown | Board decision: formal review of Privacy/Terms when budget allows; document that current text is self-published |

### P2 — hygiene / polish

| # | Issue | Recommendation |
|---|--------|----------------|
| 9 | Client `localStorage` for auth session + editor drafts | Expected for SPA; educate users on shared computers |
| 10 | OG share rewrite depends on bot UA list | Fine; refresh list if previews fail |
| 11 | Hermes Studio holds Supabase secret for news pipeline | Keep out of git; restrict who can use Studio; rotate if leaked |
| 12 | Google 2FA for privileged staff | Enforced by agreement, not by app code — periodic access review (already in HANDOFF) |

---

## Legal documents (privacy & terms) — non-lawyer read

**Strengths**

- Plain language “short version”  
- Clear: no PHI, no ads, no sale of data  
- Directory model explained (not public; defaults; staff roster separate)  
- Stripe never sees card on SAMPA side stated correctly  
- Terms: educational not medical advice; membership billing; directory acceptable use; anti-scrape; Wyoming law  
- Effective date July 11, 2026  

**Gaps for recruitment readiness (product/legal process, not code bugs)**

- Marked informally as self-published / pending counsel in STATUS — OK if board accepts residual risk  
- Contact is Google Form (third party) — fine, note it processes contact submissions  
- Retention/deletion is manual via form — define SLA for yourselves (e.g. 30 days)  
- No explicit CCPA/GDPR-style “sale” definition section — low priority if US-only clinician audience; revisit if EU users matter  
- Donations “not tax-deductible yet” lives on donate page (good) — keep until determination letter  

**Not a substitute for attorney review** if you want formal legal clearance.

---

## Backend attack surface (could we get hacked / data leaked?)

| Vector | Mitigation | Residual |
|--------|------------|----------|
| Steal all profiles via anon key | RLS blocks | Compromised **service role** (Vercel env, Studio, Supabase admin) = full DB — protect those |
| Self-admin via profile update | `guard_profile_role` | — |
| Fake membership | Webhook signature + Stripe as source of truth | Stripe account takeover = billing fraud |
| XSS via news post | DOMPurify + editor-only writers | Malicious editor account |
| Webhook forgery | Stripe signature | Keep webhook secret private |
| IDOR on other users’ billing | Portal session requires JWT + own customer | — |
| Directory harvest | Active member only + terms | Malicious member still possible |
| Supply chain (npm) | Normal risk | `npm audit` periodically; pin majors |

**Bottom line:** A random internet stranger with the publishable key should **not** read the member roster or directory. A stolen **elevated** Supabase or Stripe secret is the catastrophic case — treat like a root password.

---

## Pre-recruitment checklist (actionable)

- [ ] Publish Google OAuth consent (or document magic-link-only launch)  
- [ ] Verify Vercel Production env: Stripe **live**, webhook endpoint live + secret, Supabase elevated key server-only  
- [ ] Stripe webhook events match code (checkout.session.completed, subscription updated/deleted, invoice.paid)  
- [ ] Test: new user → join → webhook → `membership_status=active` → directory access  
- [ ] Test: non-member cannot open `/members`  
- [ ] Test: member cannot update own `role` / `membership_status` via API  
- [ ] Confirm Privacy/Terms linked from login/join/footer (already intended)  
- [ ] Privileged staff: Google 2FA on, agreement accepted, annual access review on calendar  
- [ ] Optional: rate-limit donate API; default directory email share off if board wants  
- [ ] Optional: counsel skim of Privacy/Terms  

---

## Conclusion

| Question | Answer |
|----------|--------|
| Is the architecture sound? | **Yes** — SPA + Supabase RLS + Stripe + thin serverless is appropriate. |
| Major “we’ll get pwned tomorrow” bug found in review? | **No smoking gun** in the reviewed code paths. |
| Ready for *broad* membership recruitment? | **Technically close**, blocked mainly by **OAuth Testing mode** and **ops verification** of live Stripe/webhook/env — not by a redesign. |
| Legal docs good enough? | **Good plain-language coverage** of directory + payments; formal counsel still optional/board call. |

**Resume phrase for this track:** `Resume SAMPA security review`  
**News pipeline:** parked; cron still runs daily 6am PT.
