# SAMPA news article structure (body)

**Purpose:** Keep post bodies scannable for busy clinicians — and make the **PA practice section** deep enough to act on.  
**Reference posts:**  
- Structure: DEA 7-OH temporary scheduling (lede + H2s + Source)  
- **PA section gold *example* (scheduling / street product):** DEA tianeptine Schedule I NPRM (2026-07) — not the outline for maps, waivers, or handoffs  
- **PA closer gold *shape* (2026-08-14):** cocaine NMA — keep the visit; don’t invent a treatment; don’t stop the treatment you already have  
**Last updated:** 2026-08-15

---

## Default body pattern

1. **Lede (1–2 short `<p>`)** — what happened, who (agency/journal), when, why **PAs** in addiction medicine should care. No H2 yet.  
2. **Section blocks** — each starts with **`<h2>`**, then paragraphs and optional lists.  
3. **Source line** — final `<p>` starting with `Source:` (citation rules unchanged).

Use **Heading 2 only** for major sections (`<h2>`). Reserve `<h3>` for rare sub-breaks inside a long section. Do **not** dump the whole article as an unbroken stack of paragraphs.

---

## Audience language (PA abbreviation)

SAMPA is a **PA** organization. In news posts:

| Prefer | Avoid / rare |
|--------|----------------|
| **PA** / **PAs** | Spelling out “physician associate(s)” repeatedly |
| “Why this matters for **PAs**” | “Why this matters for addiction-medicine physician associates” |
| “Practice implications for **PAs**” | “Practice implications for physician associates” |

- **Never** “physician assistants.”  
- Spell out “physician associate(s)” only if essential. Default body, H2s, ledes, excerpts, and key points → **PA/PAs**.

---

## Substance language: **misuse**, not **abuse** (Josh 2026-08-12)

**Scope is substance/drug language only.** “Abuse” is somewhat stigmatizing when paired with drugs/substances; house style moves to **misuse** in that context.

In titles, ledes, body, excerpts, and key points:

| Prefer (SUD / drug context) | Avoid (unless direct quote) |
|-----------------------------|------------------------------|
| **opioid misuse**, **drug misuse**, **stimulant misuse** | opioid abuse, drug abuse, substance abuse |
| **substance use disorder** / **SUD** (when clinically accurate) | “substance abuse disorder” |
| Person-first / clinical framing | Moralizing “abuser” language about people who use drugs |

### Preserve **abuse** outside substance-use context

Do **not** rewrite ordinary or legal uses of the word, including:

- **child abuse** / child abuse or neglect / CAPTA  
- **elder abuse**  
- domestic, sexual, physical, or emotional **abuse**  
- other non-drug senses of abuse  

### Also keep **abuse** when

- It is a **direct quote**  
- It is an **immutable proper name or title** (e.g. Substance Abuse and Mental Health Services Administration, National Institute on Drug Abuse, journal titles that include “Abuse”)  

Paraphrase surrounding substance-use prose with **misuse** / **SUD**.

Generator cue: `Misuse not abuse for drugs/SUD only; keep child/elder abuse and proper names.`

---

## Agency / policy posts (preferred H2 set)

| Typical H2 | Job |
|------------|-----|
| **What [Agency] is targeting** / **What changed** | Scope of the action, substances, products, population |
| **What is not covered** / **Limits and carve-outs** | Explicit exclusions; *proposed vs final* |
| **Process, timing, and prior actions** | Comment periods, effective dates, prior enforcement |
| **Why this matters for PAs** | **Actionable clinical section** — see depth bar below |

---

## Clinical / study posts (preferred H2 set)

| Typical H2 | Job |
|------------|-----|
| **Key findings** | Main results (lists OK) |
| **Study design and limits** | Design, N, bias, generalizability |
| **Practice implications for PAs** | Same depth standard as “Why this matters for PAs” |

Skip a section if the source truly has nothing for it; don’t invent filler.

---

## “Why this matters for PAs” / practice implications (quality bar)

The last clinical H2 is the **payoff**. Keep the heading **Why this matters for PAs** (or **Practice implications for PAs** if that already fits). Do **not** end with “PAs should be aware / stay informed.”

### Thought first, template second (Josh 2026-08-13)

The section has become **formulaic**: Screening prompts → Counseling → MOUD on every post. That is a **toolbox**, not a required outline.

**Write a real paragraph (or two) that answers: why this specific story changes a PA’s next week.**  
Then add lists **only** if they earn their keep for *this* topic.

| Topic type | PA section should feel like |
|------------|-----------------------------|
| Agency scheduling | Legal/clinical trap (e.g. prescribed tramadol ≠ street O-DSMT); one test caveat if real |
| Dispensing / maps / access | Geography and the bottle, not another induction checklist |
| Residential / systems | Handoff and continuity after the stay — not generic MOUD start tips |
| Trial / epi | What to stop assuming; one practice change |
| Workforce / payment | Who can bill / who is written out — not screening stems |

Vary structure: paragraph-only is OK; one question is OK; a short checklist is OK **when the news is operational**. Do **not** force screening + counseling + MOUD if the news is a map, a waiver, or a handoff failure.

Cron/generator cue: `Thoughtful PA payoff — not the screening/counseling/MOUD stencil.`

### Depth (adapt; omit what does not fit)

1. **The judgment** — one specific implication, named  
2. Street / product reality — only if patients encounter a product  
3. A screening prompt — only if a *new* question is the point  
4. Counseling / legal status — when the news is a legal line  
5. Testing caveats — when assays actually miss the analyte  
6. Treatment continuity / MOUD / naloxone — when withholding care is the risk  
7. Systems / documentation — when the story is a metric or handoff  

**PA section:** typically **90–200 words**. Prefer one sharp idea over a complete clinic manual.

### Accuracy hard rules

- No invented stats, doses, product names, or legal status.  
- Distinguish **proposed** vs **final** law.  
- Street names OK when framed as patient-facing vernacular.  
- Clinical protocols stay **general** unless source gives numbers.

### Anti-patterns

| Weak | Strong |
|------|--------|
| “PAs should counsel patients and stay informed.” | A named change in what you do Monday |
| Same three bold labels on every post | Structure that matches *this* finding |
| One vague sentence under the H2 | A paragraph with a point of view |
| Full induction manual on a CDC map story | Pharmacy / fill reality |
| Only legal summary restated | Earlier H2s hold law; PA section = **clinic actions** |

### Gold-standard skeleton (tianeptine NPRM — *scheduling / product stories only*)

Do **not** copy this outline onto maps, waivers, NMAs, or handoff stories.

```html
<h2>Why this matters for PAs</h2>
<p>…street/product context…</p>
<p><strong>Screening prompts:</strong> …</p>
<p><strong>Key counseling points:</strong></p>
<ul><li>…</li></ul>
<p><strong>Induction / MOUD considerations:</strong> …</p>
<p><strong>Additional vigilance:</strong> …</p>
```

### One-shot + internal QC (Josh 2026-08-15)

No Dunk / `[v2 PA voice]` twins / cover critique-loop unless Josh explicitly asks.

**Write once.** Bake the PA bar into the first draft (judgment, patient-access, one Monday change). Then a **second pass against the primary source** — not a vibe reread:

1. **Claim support** — every number, date, N, CI, affiliation, access status, and causal verb is in the source. Cut or rewrite anything inferred. State COI / single-system / proposed-vs-final when the source has it.  
2. **Useful to a PA** — one named Monday change. Would this H2 still work on a different paper? If yes, rewrite.  
3. **Voice** — dead prose; **PA/PAs**; misuse not abuse (drugs/SUD only); writer-only safety lines stay out of the article; last H2 is **Why this matters for PAs**; **not** the Screening / Counseling / MOUD stencil.

One internal rewrite is allowed. Then insert `status=draft`. Do not narrate the checklist in Telegram.

**Covers:** generate A/B/C once; look at each image; regenerate **that code only** on hard fail (readable text, seals, accidental pills/crosses, unwanted people). No R1/R2 critic loop.

### Pipeline self-check before insert

- [ ] Closing H2 is **Why this matters for PAs** (or **Practice implications for PAs**)  
- [ ] One named Monday change — not only “be aware / stay informed”  
- [ ] Not the Screening / Counseling / MOUD stencil  
- [ ] Every number/date/N/CI/affiliation is in the primary  
- [ ] No invented doses or legal claims  

---

## HTML rules

Allowed: `p`, `h2`, `h3`, `strong`, `em`, `ul`, `ol`, `li`, `blockquote`, `a[href]`.  
Quotes in `<em>"…"</em>`. Academic Source: AMA + **DOI-only** link.

---

## Checklist before insert / paste

- [ ] Lede without a heading  
- [ ] Agency posts: aim **3–4** H2s; ≥2 H2s if body &gt; ~200 words  
- [ ] PA section meets **depth bar**  
- [ ] **PA/PAs** language; never “physician assistants”  
- [ ] **misuse** not **abuse** for **drugs/SUD only** (keep child/elder abuse; quotes; proper names)  
- [ ] Final Source paragraph  

---

## Related

- `.claude/skills/sampa-post/SKILL.md`  
- `docs/sampa-post-prompt.md`  
- `docs/news-prior-art-and-updates.md`  
- Agency covers: dual-talon for **scheduling/enforcement**-type posts only — not every federal headline (grants, stats, trials use other clinical editorial covers)  
