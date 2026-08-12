# Patient-access north star (Messaging V3)

**Status:** Locked 2026-08-10 (Josh, via copy-deck review) — supersedes V2 (2026-08-09).  
**V1 emails:** Snapshotted under `docs/email/templates/v1/`.  
**Why V3:** V2 had the right strategy but pasted the same two sentences onto every
surface (hero couplet appeared verbatim 4×, north-star sentence 5×; homepage read
"nonpartisan" 5× in one scroll). V3 keeps the strategy and replaces locked
sentences with **writing rules**. Do not re-paste a "locked" paragraph across
surfaces — that is the failure mode this doc exists to prevent.

## North star (the idea, not a paste-string)

Better care for people with substance use disorders — especially where treatment
is hardest to reach. PAs are the how; patients are the why.

## Writing rules (apply to every public surface and email)

1. **Written to PAs; patients are the why.** Use second person where natural
   ("your patients," "the care you deliver"). Never describe PAs in grant-application
   third person. The homepage's primary job is a PA deciding to join.
2. **One home per theme, per surface.** Each signature phrase appears at most once
   per page or email, in the spot where it is most concrete. Everywhere else the
   idea carries in fresh words. See placement map.
3. **Concrete nouns over category lists.** "Daily news, the member directory,
   federal comments" — never the abstract triplet "education, peer community, and
   nonpartisan policy" (retired; it appeared 5× in V2).
4. **Emails thank first.** Mission is woven into an existing sentence, never
   stacked as its own paragraph above the thanks. Internal vocabulary ("north
   star," "messaging," "spine") never reaches a member.
5. **The drama/italic display font emphasizes care or mission words** — never
   "substance use disorders."

## Placement map (homepage)

| Theme | Its one home | Nowhere else on the page |
|-------|--------------|--------------------------|
| North-star sentence | About mission paragraph | hero, cards, chip |
| "rural and underserved" | About mission paragraph | hero, cards |
| "nonpartisan" | Policy card | hero, About, chip |
| "evidence-based treatment" | Policy card | (plain "treatment" elsewhere) |
| "…patients lose" causal line | Policy card | — |
| "No wrong doors" + settings list | No-wrong-doors band | hero, About band, cards |
| Prevalence stats | No-wrong-doors band (one echo on /donate) | everywhere else |

Policy hub page (`/policy`) owns the **full** thesis at depth: patient-problem
lead, "nonpartisan," "rural and underserved," drug specifics, HHS comment. Plain
language there too — say where access is decided (federal and state policy,
payment systems, workforce rules, everyday practice), not "levers" (Josh 2026-08-10).

## Locked V3 copy (as shipped; edit via PR + preview only)

- **Hero H1:** Care that *reaches people* (drama span on "reaches people")
- **Hero sub:** The society for PAs treating addiction wherever patients walk
  in. We connect you with peers, keep your practice current, and speak up when
  policy gets between your patients and treatment. (Widened 2026-08-12 — the
  idea only; the settings list lives in the No-wrong-doors band.)
- **No-wrong-doors band (homepage, 2026-08-12):** H2 "No wrong doors." + the
  settings list (ED / hospitals / primary care / community incl. FQHCs and
  safety-net clinics, with co-occurring mental health named) + prevalence
  stats + "If you see patients, you see addiction." TAM hook "whether it's
  your specialty or one patient a shift" also lives on membership surfaces
  (fresh words each place).
- **About H3:** Built for the people addiction medicine serves.
- **Policy card:** "Policy for patient access" — When rules and payment systems
  limit access to evidence-based treatment, patients lose. (Best line in the
  system; it lives on this card only.)
- **SAMPA Updates** is described the same way at every funnel step (chip, DOI
  email, confirmed page): **a weekly email** — practice news, society notes,
  policy changes that affect your patients. "Weekly," not "low-volume" or
  "occasional" (Josh 2026-08-10).

## Decisions (carried from V2 + new)

- **Every-PA audience (Josh 2026-08-12):** the addressable membership is every
  PA — never frame SAMPA as OTP/specialty-only. Settings list at most once per
  surface (homepage = doors band; /about = Who-we-are anchor sentence, Josh's
  wording). Emails carry the identity clause only, no stats.
- **Prevalence stats (2026-08-12):** 44.6M with SUD · 1 in 6 treated · 73% in
  recovery — SAMHSA **2025 NSDUH** (released 2026-07-27). Overdose decline in
  words only (CDC provisional counts revise monthly — no exact death figure in
  copy). Name sources on-page. Refresh when the next NSDUH lands (~July 2027).
- **"policy hub" is lowercase in running copy** (Josh 2026-08-12) — capitalize
  only as the first word of a sentence, heading, or standalone link label. The
  nav item stays **Policy**.
- **Email program copy = content + cadence only** (Josh 2026-08-12). No topic
  lists or preference controls — and don't advertise their absence ("one email
  for everyone" stays internal). No unsubscribe mentions in signup or marketing
  copy either; the footer of every email already carries the link. Privacy page
  and email footers keep theirs (legal/functional).
- No AAPA name-check or "not our lane" contrast in public copy
- PA advocacy within addiction medicine is fine when tied to patient access
- V3 voice ships in Weekly #01 before first mass send
- Lifecycle / workshop tests: `luftig@gmail.com` only unless Josh expands
- Public site voice changes = **PR + preview first**; Josh merges

## Don't

- Partisan / candidate language
- Lead with profession-only framing without patient link
- Paste any sentence from this doc onto more than one surface
- "Levers," "low-volume," "north star," or other internal/wonk vocabulary in
  member- or public-facing copy
