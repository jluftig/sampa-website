# SAMPA news article structure (body)

**Purpose:** Keep post bodies scannable for busy clinicians — and make the **PA practice section** deep enough to act on.  
**Reference posts:**  
- Structure: DEA 7-OH temporary scheduling (lede + H2s + Source)  
- **PA section gold standard:** DEA tianeptine Schedule I NPRM (2026-07) — screening prompts, counseling, MOUD/induction, UDT pitfalls  
**Last updated:** 2026-08-12

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

**Do not** end with a vague “PAs should be aware” paragraph. The last clinical H2 is the **payoff** for busy addiction and primary-care PAs.

### Required depth (when the story is clinical/regulatory for practice)

Aim for **most** of these (adapt; omit only if not applicable):

1. **Street / product reality** — how patients encounter it (names, gas station, online, etc.)  
2. **When to think of it** — concrete **screening prompts** tied to presentations  
3. **Key counseling points** — legal/FDA status, risks; from source or carefully framed norms  
4. **Testing caveats** — e.g. immunoassay cross-reactivity when relevant  
5. **Treatment continuity** — MOUD, naloxone, don’t abandon evidence-based care  
6. **Induction / acute management** — only if supportable; **never invent doses**  
7. **Documentation / polysubstance** — continuity and fentanyl co-use when relevant  

Use lists or bold lead-ins (`<strong>Screening prompts:</strong>`) so the section is skimmable.

### Length

- Simple stories: ~250–500 words overall still OK.  
- Complex agency rules: longer allowed.  
- **PA section alone:** typically **120–250 words** for high-impact substance/regulatory stories (not a 2-sentence stub).  
- Prefer depth over filler.

### Accuracy hard rules

- No invented stats, doses, product names, or legal status.  
- Distinguish **proposed** vs **final** law.  
- Street names OK when framed as patient-facing vernacular.  
- Clinical protocols stay **general** (COWS-guided induction, naloxone, continue MOUD) unless source gives numbers.

### Anti-patterns

| Weak | Strong |
|------|--------|
| “PAs should counsel patients and stay informed.” | Specific screening questions + counseling bullets |
| “This may affect practice.” | How (UDT, induction, retail products) |
| One vague sentence under the H2 | Structured prompts + lists |
| Only legal summary restated | Earlier H2s hold law; PA section = **clinic actions** |

### Gold-standard skeleton (tianeptine NPRM)

```html
<h2>Why this matters for PAs</h2>
<p>…street/product context…</p>
<p><strong>Screening prompts:</strong> …</p>
<p><strong>Key counseling points:</strong></p>
<ul><li>…</li></ul>
<p><strong>Induction / MOUD considerations:</strong> …</p>
<p><strong>Additional vigilance:</strong> …</p>
```

### Pipeline self-check before insert

- [ ] Closing H2 is **Why this matters for PAs** (or **Practice implications for PAs**)  
- [ ] Section has **≥2** concrete practice elements (e.g. screening + counseling, or findings + Monday-morning change)  
- [ ] Not only “be aware / stay informed”  
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
