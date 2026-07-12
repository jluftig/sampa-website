# SAMPA news article structure (body)

**Purpose:** Keep post bodies scannable for busy clinicians.  
**Reference post:** DEA 7-OH temporary scheduling draft (2026-07) — lede + **H2 sections** + Source.  
**Last updated:** 2026-07-12

---

## Default body pattern

1. **Lede (1–2 short `<p>`)** — what happened, who (agency/journal), when, why addiction-medicine **physician associates** should care. No H2 yet.  
2. **Section blocks** — each starts with **`<h2>`**, then paragraphs and optional lists.  
3. **Source line** — final `<p>` starting with `Source:` (citation rules unchanged).

Use **Heading 2 only** for major sections (`<h2>`). Reserve `<h3>` for rare sub-breaks inside a long section. Do **not** dump the whole article as an unbroken stack of paragraphs.

---

## Agency / policy posts (preferred H2 set)

Adapt labels to the story; keep the **jobs** of each section:

| Typical H2 | Job |
|------------|-----|
| **What [Agency] is targeting** / **What changed** | Scope of the action, substances, products, population |
| **What is not covered** / **Limits and carve-outs** | Explicit exclusions (e.g. leaf vs concentrate) |
| **Process, timing, and prior actions** | Comment periods, effective dates, prior warning letters/enforcement |
| **Why this matters for addiction-medicine PAs** | Clinical/history-taking, counseling, practice workflow |

Example (7-OH post):

- What DEA is targeting  
- What is not covered  
- Process, timing, and prior FDA actions  
- Why this matters for addiction-medicine PAs  

---

## Clinical / study posts (preferred H2 set)

| Typical H2 | Job |
|------------|-----|
| **Key findings** | Main results (lists OK) |
| **Study design and limits** | Design, N, bias, generalizability |
| **Practice implications for PAs** | What to do Monday morning |

Skip a section if the source truly has nothing for it; don’t invent filler.

---

## HTML rules (unchanged stack)

Allowed: `p`, `h2`, `h3`, `strong`, `em`, `ul`, `ol`, `li`, `blockquote`, `a[href]`.  
Quotes in `<em>"…"</em>`.  
Academic Source: AMA text + link **DOI only**.  
Length: still ~250–500 words unless complexity requires a bit more.

---

## Checklist before insert / paste

- [ ] Lede without a heading  
- [ ] At least **2** `<h2>` sections for any post longer than ~200 words (agency posts: aim for **3–4**)  
- [ ] H2 titles are plain language, not clever clickbait  
- [ ] Final Source paragraph  
- [ ] “physician associates” not “physician assistants”  

---

## Related

- Full drafting rules: `.claude/skills/sampa-post/SKILL.md`  
- Chatbot prompt: `docs/sampa-post-prompt.md`  
- Prior art / updates: `docs/news-prior-art-and-updates.md`  
- Agency covers: `docs/cover-style-agency-announcements.md`  
