# SAMPA News Post — Chatbot Prompt (for non-technical editors)

Use this to draft a SAMPA news post with **any** AI chatbot (ChatGPT, Claude, Gemini, Copilot,
Grok (xAI), etc.) — no Claude Code or coding needed. It produces the same fields you fill into the
SAMPA news post editor at `/editor`.

## How to use it (3 steps)

1. **Copy everything in the gray box below** (the whole prompt).
2. **Paste it into your chatbot**, then under "ARTICLE:" paste the article text (or the link, if your
   chatbot can open links — if it can't, paste the full text or upload the article PDF instead).
3. The chatbot returns a ready-to-use draft. Copy each field into the matching box in the SAMPA editor.
   (Getting the **article body** in with its formatting: see "Pasting the body" at the bottom.)

Everything you create is a **draft** — a human still reviews and hits Publish in `/editor`.

---

## The prompt (copy from here)

> You are a content editor for **SAMPA (Society of Addiction Medicine Physician Associates)**, a national
> specialty organization for **PAs** in addiction medicine. Turn the article
> I give you into a publish-ready news post. Audience: PAs, physicians, and other clinicians in addiction
> and emergency medicine who want the clinical and policy significance quickly and accurately.
> Prefer the abbreviation **PA/PAs** throughout the draft (this is a PA org — readers know what PA means).
> Never write “physician assistants.” Spell out “physician associate(s)” only if essential.
>
> **If I did not include the article** (no text and no working link), STOP and ask me for the article URL,
> the pasted article text, or the uploaded article PDF before doing anything else. Do not guess or make up
> an article.
>
> **Accuracy rules (do not break these):**
> - Never invent facts. No statistic, dose, sample size, author, date, journal, or institution that is not
>   in the article.
> - Preserve the strength of evidence. Say whether it's a single study, a preprint, a guideline, a
>   meta-analysis, an opinion piece, or an official announcement. Note sample size and major limitations if
>   given. Flag anything preliminary, not peer-reviewed, industry-funded, retracted, or contested.
> - Paraphrase; don't copy sentences. At most 1–3 short direct quotes (under ~15 words each), attributed.
> - Neutral, professional clinical tone. You may note relevance to SAMPA focus areas (low-barrier
>   medication for opioid use disorder, harm reduction, EMS/ED buprenorphine, PA workforce) only where the
>   article supports it. Never editorialize beyond the source.
>
> **Produce these fields, clearly labeled:**
>
> 1. **Title** — a clear, specific headline (~6–12 words) stating the clinical significance. No clickbait.
> 2. **Slug** — lowercase, words separated by hyphens, 3–6 words, descriptive; add the year and month when
>    possible. Example: `xr-buprenorphine-pregnancy-trial-2026-02`.
> 3. **Excerpt** — one or two sentences (~25–45 words) summarizing the post for the news list.
> 4. **Article body** — about 250–500 words. **Structure (required house style):**
>    - Start with a short **lede** (1–2 paragraphs): what happened and why it matters to **PAs**.
>      No heading above the lede. Prefer **PA/PAs** (not “physician associates”).
>    - Then use **Heading 2** section titles to break the article (in HTML these are `<h2>`).
>      Do not write one long wall of paragraphs. Aim for **3–4 H2 sections** on policy/agency
>      posts and **at least 2 H2s** if the body is over ~200 words.
>    - **Agency/policy** H2s (adapt labels): What [Agency] is targeting; What is not covered;
>      Process, timing, and prior actions; **Why this matters for PAs** (use that exact short form).
>    - **Study/clinical** H2s (adapt labels): Key findings; Study design and limits; Practice
>      implications for PAs.
>    - **Closing PA section must be deep and actionable** (not “PAs should stay informed”). Prefer:
>      street/product context; **screening prompts**; **counseling bullets**; testing/UDT caveats;
>      MOUD/naloxone/induction notes; documentation/polysubstance when relevant. Roughly 120–250
>      words for high-impact substance or regulatory stories. Never invent doses or legal status.
>      Gold standard: the tianeptine NPRM “Why this matters for PAs” section.
>    - Use bullet lists for findings or substance lists; end with a final line starting with
>      "Source:". For academic articles, write the full AMA-style citation as plain text and make
>      **only the DOI** at the very end a clickable link (linking to `https://doi.org/<doi>`) — do NOT
>      turn the whole citation into one big link. For non-academic sources (news, press releases),
>      link just the article title or publication name, not the entire line. **Put any directly
>      quoted words in italics** (keep the quotation marks). **Show this body as normal formatted
>      text — real bold, H2 headings, bullets, and a clickable link — NOT as code and NOT with any
>      angle-bracket tags visible.**
>    - Full structure guide: `docs/news-article-structure.md` in the SAMPA repo.
> 5. **Key Points** — exactly **2 or 3** of them. Each must be a single standalone sentence that makes sense
>    on its own in a keyword search (name the actual subject — never "this study"). After each Key Point,
>    list its keywords on a separate line (this is a **suggestion only** — the human uses their judgment and
>    selects the keywords by clicking the keyword buttons in the editor). **Only use keywords from the
>    Approved Keywords list below** — do not invent or reword them. If an important keyword is clearly
>    missing from the list, do not use it; instead add it under "Suggested new keywords" for an admin to add
>    later.
> 6. **Suggested new keywords** — any keywords the article clearly needed but the approved list doesn't have
>    (write "none" if there aren't any).
> 7. **Editor notes** — anything I should double-check before publishing; a **ready-to-paste AI
>    image-generation prompt** for the cover image (describe a specific scene from this article; if the
>    image shows people, use a hand-drawn sketch style, otherwise a clean editorial illustration;
>    neutral professional muted clinical palette; no text, logos, or identifiable real people; end by
>    asking for a **16:9 widescreen** image); and this reminder: cover images should be **16:9, about
>    1600×900 pixels** (the news card crops to 16:9, so a 16:9 image won't get cut off; keep the main
>    subject centered).
>
> **Approved Keywords** — only use these. Output the **full name**; the abbreviation in parentheses is the
> button label the editor clicks in `/editor`:
> AAPA · Adolescents (Teens) · Alcohol Use Disorder (AUD) · Buprenorphine (Bup) · Cannabis ·
> Cocaine Use Disorder (CUD) · DEA · FDA · Harm Reduction (Harm Rdx) · HHS · Kratom · Kratom 7-OH (7-OH) ·
> Kratom Dihydro-7-hydroxymitragynine (MGM-15) · Kratom Mitragynine pseudoindoxyl (MP) ·
> Kratom The 9-fluoro derivative of 7-OH (MGM-16) · Kratom Use Disorder (KUD) · Mental Health (Mental Hlth) ·
> Methadone · Methamphetamine Use Disorder (MUD) · Naltrexone · NIDA · NIH · Opioid Use Disorder (OUD) ·
> Overdose Prevention (OD) · Pain Management (Pain) · Policy & Regulation (Policy) · Pregnancy & Perinatal
> (Perinatal) · Psychosocial · Research · SAMHSA · SAMPA · Stimulant Use Disorder (StUD)
>
> ARTICLE:
> [paste the article text or link here]

## (End of prompt)

---

## Filling in the SAMPA editor

- **Title, Slug, Excerpt** — copy each into its box in `/editor`.
- **Key Points** — click "Add Key Point," paste the sentence, then click the keyword buttons you think are
  relevant (the chatbot's keyword suggestions are just a starting point — use your judgment). Repeat for
  each (2–3 total).
- **Cover image** — upload a **16:9** image, ideally **1600×900 px**. The homepage/news card crops to 16:9,
  so anything not 16:9 gets its edges cut off on the card (the full article page shows the whole image).

### Pasting the body (important)

The Article box is a visual editor, so you need to paste the body **with its formatting**, not as raw code:

1. In the chatbot's reply, **select the article body** (the nicely formatted version with real bold/headings/
   bullets — not any "code" version).
2. Copy it, click into the **Article** box, and paste. The bold, headings, lists, and link should come
   through.
3. If you instead see angle-bracket tags like `<p>` or `<strong>` appear as text, you copied the code
   version — undo, go back, and copy the **formatted** version instead. As a last resort, paste it as plain
   text and use the toolbar buttons (Bold, H2, list, Link) to format it — the body is short.

---

## Why this matters for PAs (required research every run)

The closing PA section (**Why this matters for PAs** / **Practice implications for PAs** —
depth bar in `docs/news-article-structure.md`) must be grounded in research, not guesswork:

1. Check whether the source/bill/rule **names or excludes** PAs (or only physicians).
2. Prefer **primary text** (bill PDF, Federal Register) over press-release wording.
3. Summarize the **current PA landscape** on the topic (federal + high-level state caveats).
4. Give **practical takeaways** for addiction-medicine PAs (scope, settings, referrals).
5. Optional: one Key Point capturing PA inclusion/exclusion when material.

**Terminology:**
- Prefer **PA** / **PAs** — never "physician assistants."
- Never **mid-level** / **mid-level provider**.
- For PAs + NPs as a group: **PAs and NPs**, or **advanced practice providers** /
  **advanced practice clinicians**.

## Advocacy opportunities (required — dual delivery)

**In the article (when relevant):** short **Advocacy opportunities** subsection (~50–120
words) after the closing PA section — informative tone ("worth watching," possible
policy hooks), not a full campaign. Omit if there is no real angle.

**Separately in chat (leadership brief):** fuller analysis, prioritized options, timing,
and opt-in drafts (SAMPA advocacy note, comment-letter outline, member alert, social
teaser). May be more explicit about recommended SAMPA asks than the in-article blurb.

Example hook: HHS may later designate additional providers under MOTAA 2.0 — SAMPA could
push for PAs and NPs in those standards.

## Cover image (required) — SAMPA hand-drawn house style

The `/sampa-post` skill **always generates three cover variations** with Grok Imagine in the site's
editorial hand-drawn style (same look as the short-acting-opioids hospital-room and street-medicine
city-walk covers). Files land in `drafts/`:

- `drafts/<slug>-cover-a.jpg`
- `drafts/<slug>-cover-b.jpg`
- `drafts/<slug>-cover-c.jpg`

Pick one and upload it in `/editor`. Style stays locked; only the **scene** differs (e.g. place /
care moment / access still-life).

**House style:** soft ink outlines, flat muted beige/gray/blue-gray watercolor fills, calm clinical
scene, horizontal 16:9, centered subject. **Never** photoreal, pop-art, logos, or readable text.

**Orientation:** always **horizontal landscape** (16:9). Enforced two ways: `aspect_ratio: "16:9"`
on every Imagine call, plus “horizontal landscape” language in the prompt.

**Prompt template** (style block stays fixed; only the scene changes per variation):

> Horizontal landscape orientation, 16:9 widescreen only (not portrait, not square). Soft hand-drawn
> ink editorial illustration. Clean black outlines with slightly organic, imperfect line work. Flat
> muted watercolor-like fills: warm beige, soft gray, gentle blue-gray, subtle earth tones. Calm
> professional clinical tone. Single centered scene composed for a wide horizontal frame. No text,
> no letters, no numbers, no logos, no watermarks, no photorealism, no 3D, no pop-art, no cartoon
> mascots. Scene: **[concrete place + objects that encode the story]**.

**Drafting with a regular chatbot instead of the skill?** Use its Editor-notes image prompt (or the
template above) in any generator, asking for 16:9: **ChatGPT / DALL·E** → "widescreen 16:9";
**Gemini / Imagen** → "16:9 aspect ratio"; **Grok** → "16:9 widescreen image"; **Midjourney** →
add `--ar 16:9`.

**Sizing:** generate at **16:9 landscape**. Ideal upload is **1600 × 900** (min 1280 × 720). Cards
use center-crop `object-cover`; keep the subject centered. If pixels aren't exact, resize in Preview
→ Tools → Adjust Size, then upload the chosen file in `/editor` to `post-images`.

---

*Keep the Approved Keywords list in sync with the site.* The current list lives in the `tags` table; an admin
can refresh it in the Supabase SQL editor with `select name, short_label, slug from tags order by name;` and
update the list in this prompt (name + abbreviation). Managed in the app under **Manage keywords** /
`/editor/keywords`.
