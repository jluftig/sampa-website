# SAMPA Patient-Advocacy Messaging V2

> **For Hermes:** Messaging + copy framework first; implement only after Josh approves. Preserve all current (V1) email/site content as baseline; ship V2 as additive revisions, not a rewrite-from-zero.

**Goal:** One consistent, 501(c)(3)-safe message across landing, Policy hub, newsletter DOI, join, welcome, renewal, and donation: **patients and communities affected by substance use disorders are the north star** — especially where access is hardest (rural and underserved settings where PAs often practice). Policy work exists to protect **patient access to care**, not to run partisan politics or to be a second AAPA.

**Architecture:** Codify a short **Message House** (north star → pillars → say/don’t-say → surface snippets). Keep **V1 templates frozen** under versioned paths or comments; apply **V2** as controlled edits to live templates + key UI strings. No mass-send changes without Josh gate.

**Tech stack / surfaces:**
- Site: `src/components/ValueProps.jsx`, Hero/Home, `Policy.jsx` / Policy hub, `Join.jsx`, `NewsletterSignup.jsx`, About
- Emails V1 (preserve): `api/_lib/email-templates/*`, `docs/email/templates/*`, weekly launch template
- Docs: new `docs/messaging/patient-access-north-star.md` (source of truth after approval)

---

## 1. Current state (what already works)

V1 is already strong and mostly aligned:
- Mission language: better outcomes for people/communities impacted by SUD
- Policy card: access to MOUD/MAT; **explicitly not partisan politics**
- Welcome/renewal/donation: high quality, board sign-off, programs list

**Gap vs your intent:**
- **Rural / underserved** and “PAs on the vanguard there” are under-voiced
- **Patient-primary vs profession-primary** is sometimes inverted (leads with “advancing PAs” then patients)
- **AAPA lane** (profession advocacy) not named as *not* SAMPA’s primary job
- **Policy** is framed well as nonpartisan but can lean “our public voice” without always re-anchoring *why* (patient access)
- Consistency across **newsletter DOI** vs **join** vs **renewal** is uneven (depth OK to vary; spine should not)

---

## 2. Legal / 501(c)(3) guardrails (messaging, not legal advice)

Keep counsel in the loop for formal lobbying program design. For **public messaging**:

| Allowed / preferred framing | Avoid / escalate |
|-----------------------------|------------------|
| Nonpartisan **issue education** on access to evidence-based SUD care | Support/oppose **candidates** or parties |
| “Policies that expand or restrict **patient access** to care” | “Elect X” / scorecards that function as campaign intervention |
| Comments on **rules and legislation** as education + limited lobbying (org must stay within IRS limits; track if you do 501(h)) | Implying SAMPA is primarily a **lobby shop** or PAC |
| Nonpartisan analysis, research, clinical/public-health education | Pure **professional-scope** fights with no patient-access link (that’s closer to AAPA’s lane) |
| “Nonpartisan” (already house language) | “Not political” if you mean “we never engage policy” — be precise: **nonpartisan**, not **apolitical** |

**North-star test for any line:**  
*If we removed every PA from the sentence, would the public-health patient/community benefit still be clear?*  
Profession can appear as **how** care reaches people — not as the **why**.

---

## 3. Message House (approved spine — draft for Josh)

### North star (one sentence)
**SAMPA exists so people and communities affected by substance use disorders get better care — especially where access is hardest.**

### Who we are (one breath)
A 501(c)(3) society of **physician associates in addiction medicine** who organize education, community, and **nonpartisan policy engagement** so patients can reach evidence-based treatment.

### Primary vs secondary
| Primary (always lead) | Secondary (support, never lead) |
|----------------------|----------------------------------|
| Patient & community outcomes in SUD | PA skill, community, and practice conditions **as means to access/quality** |
| Access to MOUD/MAT and continuity of care | Reducing isolation among addiction-medicine PAs |
| Rural & underserved access | Pipeline/CME/jobs that put clinicians where patients need them |
| Nonpartisan policy for access | PA advocacy **within addiction medicine** when it protects patient access |

**Decisions (Josh 2026-08-09):**
- Do **not** highlight AAPA / “not our lane” contrast in public copy.
- No AAPA name-check on site or email.
- PA advocacy inside the addiction-medicine world is fine when tied to patient access.
- Bake messaging into Weekly #01 **before** first mass send.
- Workshop hero/boldness with test sends → **luftig@gmail.com only** (not Test list).

### Three pillars (use everywhere; vary depth)
1. **Care that reaches people** — evidence-based treatment, continuity, reduced barriers.  
2. **Clinicians where patients are** — PAs often practice at the front line of rural and underserved care; strengthen that capacity.  
3. **Nonpartisan policy for access** — when rules and payment systems quietly block care, we educate and engage so patients don’t lose access.

### Proof points (short, reusable)
- Daily news so practice stays current → better care now  
- Member directory → collaboration, less isolation, stronger local capacity  
- Policy hub → federal comments & positions aimed at **access and quality**, not parties  
- Coming: practice resources, CME, mission-aligned jobs  

### Signature contrast (use sparingly, clearly)
- **We advocate for patients.** Strengthening PA practice is how access expands.  
- **AAPA leads the profession.** SAMPA leads **addiction-medicine public health** with PAs as the clinical community.

### Tone
- Plain, clinician-respectful, nonprofit-confident (same as V1 emails)  
- Hopeful without hype; specific over slogans  
- PA / PAs (house rule); spell out physician associate when essential  

---

## 4. Say / Don’t say

### Prefer
- “Access to care for people with substance use disorders”  
- “Rural and underserved communities”  
- “Evidence-based treatment (including MOUD/MAT)”  
- “Nonpartisan policy engagement” / “public health mission”  
- “PAs often serve where access is limited — that capacity matters for patients”  
- “We weigh in when policy would curb patients’ ability to get care”

### Avoid
- Leading with “fight for PA rights” / “advance the profession” without patient link  
- Party, candidate, or election language  
- “Lobbying powerhouse” energy in public hero copy  
- Implying SAMPA replaces AAPA  
- Stigma language (“addicts,” moralizing SUD)  
- Over-claiming (“we rewrite federal law”) — use “comment,” “educate,” “engage,” “publish positions”

---

## 5. Depth by surface (same spine, different length)

| Surface | Depth | Must include |
|---------|-------|--------------|
| **Homepage hero** | 1–2 lines | North star + who (PAs in addiction medicine) |
| **Value props / What we do** | Short para + policy card | Patient lead; rural/underserved once; policy = access |
| **Policy hub** | Full | Patient access thesis; rural/underserved; nonpartisan; what kinds of policy; not AAPA; how to engage |
| **Join / membership** | Medium | Membership funds patient-mission work; profession community as means |
| **Newsletter DOI** | Short | Updates on care, practice, and policy that affect **patient access**; no membership required |
| **Welcome email V2** | Medium | Keep V1 structure; add 1 short “why it matters” (patients, rural/underserved, policy as access) |
| **Renewal email V2** | Light | Thank you + one line continuity of patient mission; optional policy link |
| **Donation thanks V2** | Light–medium | Gift → patient/community impact; optional access line |
| **Weekly newsletter** | Variable | Footer or intro blurb can carry spine; stories stay news-led |

---

## 6. Draft V2 copy blocks (for approval — not live yet)

### A. North-star lockup (site + About)
**SAMPA advances addiction medicine so people and communities affected by substance use disorders get better care.**  
Physician associates often practice at the front lines of rural and underserved care. We strengthen that work through education, peer community, and nonpartisan policy engagement focused on **patient access** — not partisan politics. Professional advocacy for PAs broadly remains the lane of organizations like **AAPA**.

### B. Homepage “What we do” intro (replace lead inversion)
**V1-ish:** “Programs that advance physician associates… so individuals and communities…”  
**V2:** “Programs that improve care for people and communities impacted by substance use disorders — by supporting the PAs who deliver that care, including in rural and underserved settings.”

### C. Policy value card
**V2 title:** Policy for patient access  
**V2 desc:** When rules and payment systems limit access to evidence-based treatment, patients lose. SAMPA’s Policy hub is our nonpartisan public voice for **quality care and access** (starting with federal comments, growing into positions across federal, state, payment, and practice) — not party politics.

### D. Newsletter DOI (body + optional subject)
**Subject options:**  
- Confirm your SAMPA Updates subscription  
- Confirm: news and policy that affect patient access  

**Body add (1 sentence):**  
“You’ll get low-volume updates on addiction-medicine practice, society news, and nonpartisan policy work aimed at protecting patient access to care — especially where access is already hard.”

### E. Welcome email V2 — additive paragraph (after thank-you mission para)
“One reason this society exists: people with substance use disorders still face avoidable barriers to care. PAs are often the clinicians who show up in rural and underserved communities. Your membership supports education, a national peer community, and nonpartisan policy engagement so **access and quality** stay at the center — with patients as the measure of success.”

*(Keep all V1 “live for members” cards; only retune Policy card title/desc to match C.)*

### F. Renewal email V2 — light touch
After thanks:  
“Your renewal helps sustain a public-health mission: better care for people and communities affected by substance use disorders, including through nonpartisan work on policies that affect access.”

### G. Donation V2 — one line in gratitude block
“Gifts like yours support education, community, and nonpartisan policy engagement so patients can reach evidence-based addiction care.”

---

## 7. Implementation plan (after Josh approves Message House)

### Task 0: Approve spine
**Objective:** Josh signs off on §3–6 (or mark edits).  
**Output:** Comments in this plan or verbal “approved with X.”

### Task 1: Canonical messaging doc
**Files:** Create `docs/messaging/patient-access-north-star.md` (copy Message House + say/don’t-say + surface matrix).  
**Link from:** `docs/STATUS.md` (new task or T note), `docs/architecture/email-brevo.md` (pointer), About if needed.

### Task 2: Freeze V1 email snapshots
**Files:**  
- Copy current templates to `docs/email/templates/v1/` (welcome, renewal, donation, doi-confirm, site-membership-launch)  
- Note in each V2 file header: `<!-- V2 patient-access messaging; V1 snapshot in docs/email/templates/v1/ -->`

### Task 3: Site string pass (no layout redesign)
**Modify:**  
- `src/components/ValueProps.jsx` — intro + policy card  
- Hero / Home mission line if present  
- `src/pages/Policy.jsx` (+ any hub chrome) — patient-access thesis + rural/underserved + AAPA contrast once  
- `src/components/NewsletterSignup.jsx` — chip blurb  
- `src/pages/Join.jsx` — one membership mission paragraph  
- `src/pages/NewsletterConfirmed.jsx` — optional one-liner  

**Verify:** Visual QA on `/`, `/policy`, `/join`, footer chip.

### Task 4: Email V2 templates
**Modify (keep structure/CSS):**  
- `api/_lib/email-templates/member-welcome.html`  
- `api/_lib/email-templates/member-renewal.html`  
- `api/_lib/email-templates/donation-thanks.html`  
- DOI HTML + Brevo template 13 content (API update or dashboard)  
- Mirror under `docs/email/templates/`  

**Verify:**  
```bash
scripts/run-brevo.sh member-email-test --kind welcome --email luftig@gmail.com --fname Josh
scripts/run-brevo.sh member-email-test --kind renewal --email luftig@gmail.com --fname Josh
scripts/run-brevo.sh member-email-test --kind donation --email luftig@gmail.com --fname Josh --amount-cents 5000
# DOI: footer signup with +alias after Brevo template HTML update
```

### Task 5: Weekly #01 / campaign template (optional same sprint)
**Modify:** `docs/email/templates/site-membership-launch.html` (+ json) — soft mission line only; do not dilute news content.  
**Gate:** Still no production send without Josh.

### Task 6: STATUS
Add or complete task e.g. **T17 Messaging V2 patient-access north star** — owner egg/cursor after claim.  
Update PARK-brevo if email copy changes mid-flight.

### Task 7: Regression
- No partisan or candidate language  
- PA terminology house rules  
- 501(c)(3) / EIN footers unchanged  
- Lifecycle emails still send with `BREVO_API_KEY`  
- DOI still `doiTemplate: true` on template 13  

---

## 8. Risks & tradeoffs

| Risk | Mitigation |
|------|------------|
| Sounding like a lobbying org | Lead education + access; use “engage/comment/educate”; keep “nonpartisan” |
| Offending profession-first members | Always honor PA community; frame as **means**; name AAPA with respect |
| Diluting V1 quality | Additive paragraphs + retunes; freeze V1 snapshots |
| Rural line feels token | One clear sentence on hub + welcome; don’t spam every bullet |
| Legal overclaim | This plan is messaging; formal lobbying compliance is separate ops |

---

## 9. Open questions for Josh

1. **AAPA name-check:** OK once on Policy + About, or only About?  
2. **Rural/underserved:** Always pair, or allow “communities with the least access” as alternate?  
3. **Weekly #01:** Apply V2 spine before first mass send, or ship V1 campaign then V2 later?  
4. **Join page:** Any membership pricing/benefits copy that must stay untouched?  
5. **Stronger patient language** (e.g. “we exist for patients first”) vs softer current tone — how bold on hero?

---

## 10. Success criteria

- [ ] Josh approves Message House (§3) with optional edits  
- [ ] V1 templates snapshotted  
- [ ] Site + emails V2 use same spine; depth matches matrix  
- [ ] No partisan/candidate language; patient-primary on every primary surface  
- [ ] Test sends + DOI still work  
- [ ] STATUS reflects T17 (or equivalent) done  

---

## 11. Recommended next step

**Do not implement yet.** Reply with:
- Approvals / edits on §3 Message House and §6 draft blocks  
- Answers to §9  

Then implement Tasks 1–7 in a claimed STATUS task.
