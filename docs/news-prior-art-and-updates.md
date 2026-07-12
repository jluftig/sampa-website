# Prior posts: new vs update vs duplicate

**Purpose:** Before drafting or inserting a SAMPA news post, compare the candidate to **existing posts** (published and draft). Classify the relationship and wire **links** correctly.  
**Used by:** Hermes `sampa-news-pipeline`, manual `/sampa-post` runs.  
**Last updated:** 2026-07-12

---

## Why this matters

- Avoid two near-identical news items on the same agency action.  
- When a story **moves** (FDA letter → DEA notice → temporary order), readers need a **thread**, not a reset.  
- The site already shows **Related news** via keyword overlap (`related_posts` RPC on `/news/:slug`). Pipeline must still (a) de-dupe and (b) add **explicit “Prior SAMPA coverage” links** in the body for true updates.

---

## 1. Prior-art search (required every pipeline run)

Query Supabase (secret key) and/or list recent posts. Cast a wide net:

| Signal | How |
|--------|-----|
| Same or similar **title** keywords | `title.ilike.%…%` |
| Same **source_url** / DOI | exact match on `source_url` |
| Same **agency + substance/topic** | e.g. DEA + 7-OH, FDA + kratom |
| Same **slug stem** | e.g. `dea-schedule-7-oh` |
| Shared **tags** after draft | buprenorphine, 7-oh, dea, … |

Also check **drafts** (status = `draft`) so we don’t stack two unreviewed duplicates.

**Minimum query pattern:**

```text
Search posts where title/excerpt/source_url overlap with:
  - primary agency name
  - drug / bill / program acronym
  - distinctive phrase from the candidate
```

Record for each hit: `id`, `title`, `slug`, `status`, `source_url`, `published_at`.

---

## 2. Classification (pick one)

| Class | Meaning | Pipeline action |
|-------|---------|-----------------|
| **new** | No prior SAMPA post on this event/thread | Draft full post as usual |
| **update** | Same ongoing story; **new facts** (new notice, date, threshold, effective date, expanded list of substances, final order vs intent, etc.) | Draft as **update**; must link prior post(s) in body; consider softer title (“…: Notices filed” / “Update: …”) |
| **duplicate** | Same core facts already covered; candidate adds no material clinical/policy delta | **Do not insert** (or insert only if Josh overrides). Flag in notify: `duplicate_of: <slug>` |
| **related_but_distinct** | Same topic family, different study/event | Treat as **new**, but add optional “See also” links if helpful |

### Update vs duplicate (rule of thumb)

- **Update** if a clinician would change what they tell a patient/colleague (new legal status, new effective date, new carve-out, new product class).  
- **Duplicate** if it’s the same DEA action rewritten by another outlet, or a rehash of a post from the last few days with no new primary document.

When unsure → classify **update**, link the prior post, and note uncertainty in editor notes / Telegram notify.

---

## 3. How to link related SAMPA articles

### A. In-body hyperlinks (required for **update**)

In `body_html`, include a short explicit section early (after the lede) or before the Source line:

```html
<p><strong>Prior SAMPA coverage:</strong>
<a href="https://www.addictionpas.org/news/PRIOR-SLUG">Title of earlier post</a>.</p>
```

Multiple priors:

```html
<p><strong>Prior SAMPA coverage:</strong></p>
<ul>
  <li><a href="https://www.addictionpas.org/news/slug-a">Title A</a> (date if known)</li>
  <li><a href="https://www.addictionpas.org/news/slug-b">Title B</a></li>
</ul>
```

Rules:

- Use **site paths** `/news/<slug>` (production host `https://www.addictionpas.org`).  
- Link **published** posts only in public-facing sentences (if prior is still draft, say “related draft in editor” in notify, don’t publish a dead public link).  
- Prefer 1–3 links; don’t dump the whole archive.  
- Wording: “Prior SAMPA coverage” or “Related SAMPA news” — neutral, not SEO spam.

### B. Automatic “Related news” (already on the site)

`PostView` calls `related_posts` and shows a **Related news** block from **shared keywords**.  

- Still assign correct `tag_slugs` on Key Points so related rails fire.  
- **Does not replace** in-body prior links for true updates (related rail is algorithmic and can miss the exact predecessor).

### C. Optional later (not required now)

| Idea | Pros | Cons |
|------|------|------|
| `related_post_ids uuid[]` column | Explicit graph | Schema + editor UI |
| Same “story thread” slug series | Clear series | Brittle |
| Edit **old** post with an “Update” box | One URL | Loses chronological news feed |

**Recommendation for v1:** classification + **in-body Prior SAMPA coverage** + good tags (related rail). No schema change yet.

---

## 4. Pipeline JSON / notify extras

When writing draft JSON or Telegram notify, include:

```json
{
  "prior_art": {
    "classification": "new | update | duplicate | related_but_distinct",
    "related_posts": [
      { "slug": "dea-schedule-7-oh-kratom-2026", "title": "…", "status": "published", "role": "predecessor" }
    ],
    "rationale": "One sentence"
  }
}
```

(If not stored in DB, keep this in the notify message and/or drafts/*.json sidecar.)

**Duplicate:** skip insert; notify only.  
**Update:** body_html must contain at least one `<a href="https://www.addictionpas.org/news/...">` to a predecessor.

---

## 5. Worked example (7-OH / DEA, 2026-07)

| Post | Role |
|------|------|
| Published: `dea-schedule-7-oh-kratom-2026` — “DEA Moves to Schedule Concentrated and Synthetic 7-OH…” | **Predecessor** |
| Draft: `dea-temporary-schedule-7-oh-kratom-alkaloids-2026-07` | Should be **update** (or merge into prior), not a silent parallel story |

Correct update behavior: open body with new procedural detail (e.g. notices of intent dates, substance list, leaf carve-out) + **Prior SAMPA coverage** link to the published slug.

---

## 6. Agent checklist

- [ ] Searched existing posts (published + draft) for agency + topic + URL  
- [ ] Assigned classification  
- [ ] If **duplicate** → no insert (unless override)  
- [ ] If **update** → in-body link(s) to prior `/news/<slug>`  
- [ ] Tags assigned so Related news can surface siblings  
- [ ] Notify includes classification + predecessor slugs  

---

## Related docs

- Scout: `docs/sampa-news-scout-prompt.md`  
- Pipeline park: `docs/PARK-news-pipeline.md`  
- Agency covers: `docs/cover-style-agency-announcements.md`  
