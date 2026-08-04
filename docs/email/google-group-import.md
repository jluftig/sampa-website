# Google Group → Brevo import (Landing A)

**Goal:** Move ~130 legacy interest contacts into Brevo **without** silent multi-list spam and **without** creating Supabase auth users.

## Principles

1. **Brevo** = marketing contact home.  
2. **Supabase** = people who actually create a site account.  
3. **Landing A:** import + **confirm preferences** before treating them as fully opted into topic lists.  
4. Tag everything: `SOURCE=google_group_legacy`, `LEGACY_MEMBER=true`.

## Steps

### 1. Export

From Google Group (or Admin export): CSV with at least **email**, preferably **name**.

### 2. Clean (local)

- Lowercase emails; trim  
- Drop role accounts if unwanted (`noreply@`, etc.)  
- Dedupe by email  
- Flag obvious typos for manual fix  
- Do **not** commit the CSV to git — keep under `docs/email/imports/` **only if** gitignored, or outside the repo (`~/Desktop/sampa-email-imports/`)

Suggested gitignore entry (if storing locally in repo tree):

```
docs/email/imports/*.csv
docs/email/imports/*.xlsx
```

### 3. Import to Brevo

**Option A — Brevo UI import (fine for one-shot):**  
Contacts → Import → map email/name → add attributes → **do not** attach all five topic lists yet.

**Option B — API:** use `scripts/run-brevo.sh contact-upsert` in a loop later; for v1 UI import is OK.

Recommended first placement:

| Approach | Lists on import |
|----------|-----------------|
| **Holding** | Optional single list `SAMPA Legacy interest (pending confirm)` **or** no list, attributes only |
| **Avoid** | Auto-add to Policy / Jobs / CME |
| **Avoid** | Creating Supabase profiles |

### 4. Confirm-prefs + site/membership campaign

Send (after Test):

1. We’re moving off Google Group to addictionpas.org email.  
2. Link to **preference center** (pick Announcements / Weekly News / Policy / Jobs / CME).  
3. CTA: new site + **join membership**.  
4. One-click unsubscribe still present.

Until they engage prefs, do not assume full multi-list consent. After they save prefs, Brevo lists are source of truth.

### 5. When they join the site

Match on email:

- Supabase profile becomes membership truth  
- Sync job (when built): `newsletter_opt_in` → Announcements + Weekly News  
- Update Brevo contact `MEMBER_STATUS=active` (attribute)  
- Prefer **update** existing Brevo contact (`updateEnabled`), never duplicate

## Decision log

| Date | Choice |
|------|--------|
| 2026-08-03 | Landing **A** (confirm prefs) locked with Josh |

## Related

- First campaign template: `templates/site-membership-launch.json`  
- Architecture: `../architecture/email-brevo.md`  
