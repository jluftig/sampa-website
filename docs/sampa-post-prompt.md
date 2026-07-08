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
> specialty organization for physician associates (PAs) in addiction medicine. Turn the article
> I give you into a publish-ready news post. Audience: PAs, physicians, and other clinicians in addiction
> and emergency medicine who want the clinical and policy significance quickly and accurately.
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
> 4. **Article body** — about 250–500 words. Open with what happened and why it matters to
>    addiction-medicine PAs. Use short paragraphs; use a heading or two only if it's long enough to need
>    them; use a bullet list for findings; end with a final line that says "Source:" followed by the article
>    link. For academic articles, use AMA-style citations and include the DOI. **Put any directly quoted
>    words in italics** (keep the quotation marks). **Show this body as normal formatted text — real bold,
>    headings, bullets, and a clickable link — NOT as code and NOT with any angle-bracket tags visible.**
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

## Generating a cover image with AI (optional)

The chatbot already gives you a ready-to-paste image prompt in its **Editor notes** — start with that.
Most image generators can't output *exactly* 1600×900, so **generate at 16:9, then resize/crop** to
1600×900:

1. **Ask for a 16:9 (widescreen / landscape) image** and describe a neutral, professional subject.
   Avoid words/text in the image (AI usually garbles them), logos, and realistic depictions of
   identifiable real people. **For images that include people, ask for a hand-drawn sketch style** —
   it reads well on the card and avoids the "AI photo" look.
   - **ChatGPT / DALL·E:** say "widescreen 16:9" (it produces 1792×1024).
   - **Gemini / Imagen:** ask for "16:9 aspect ratio."
   - **Grok (xAI):** ask for a "16:9 widescreen image" in the prompt.
   - **Midjourney:** add `--ar 16:9` to the prompt.
2. **Resize to exactly 1600×900.** On a Mac: open the image in **Preview → Tools → Adjust Size**, set
   Width `1600` and Height `900`, and export as JPG. (Any free online image resizer works too.) Keep the
   main subject centered so nothing important is lost.
3. **Upload** the 1600×900 image as the cover in `/editor`.

Example image prompts to adapt:

> **With people —** A loose hand-drawn pen-and-ink sketch of **[scene with people from the article]**.
> Neutral, muted clinical palette. No text, no logos, no identifiable real people. Widescreen 16:9
> aspect ratio.

> **Without people —** A clean, modern 16:9 editorial illustration of **[non-human subject from the
> article]**. Neutral, muted clinical color palette. No text, no logos. Widescreen 16:9 aspect ratio.

---

*Keep the Approved Keywords list in sync with the site.* The current list lives in the `tags` table; an admin
can refresh it in the Supabase SQL editor with `select name, short_label, slug from tags order by name;` and
update the list in this prompt (name + abbreviation). Managed in the app under **Manage keywords** /
`/editor/keywords`.
