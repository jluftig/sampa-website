# Instructions for AI agents

**Read [CLAUDE.md](CLAUDE.md) in full before changing anything.** It is the canonical
machine-oriented reference for this repo — architecture, data model, security
invariants (RLS), and a "Conventions & gotchas" section that will save you from
repeating past mistakes. This file exists only so that agents other than Claude
(Grok, Codex, Gemini, Cursor, …) find the same instructions; do not duplicate
content here.

## Single board — do not invent a second roadmap

| Doc | Role | Update when… |
|-----|------|----------------|
| **[docs/STATUS.md](docs/STATUS.md)** | **Only product board** — live / in flight / blocked / next / backlog | State changes (shipped, blocked, reprioritized, track parked) |
| **[docs/HANDOFF.md](docs/HANDOFF.md)** | Human **how-to** (day-to-day ops) | *How* operators run the site changes — not a second backlog |
| **docs/PARK-\*.md** | Thin **agent sticky note** for one track (resume phrase + next 1–4 steps + links) | Mid-flight session handoff; **must point at STATUS**, never duplicate the full backlog |
| Specs / review docs (e.g. security review, scout prompt) | **How a subsystem works** or a dated findings report | Design/findings change — not daily “what’s open” |
| **CLAUDE.md** (this stack) | Architecture + RLS invariants | Code/security model changes |

**Write path for any state change:**

1. **STATUS first** (board of record).  
2. **HANDOFF** only if a human procedure or “if something looks broken” row changed.  
3. **PARK-\*** only if that track is still mid-flight — slim next steps, not a roadmap.  
4. Specs / SECURITY-REVIEW / CLAUDE only if architecture or findings changed.

**Don’t:** maintain the same “what’s next” list in STATUS + PARK + HANDOFF + a review doc.  
**Do:** if PARK grows into a backlog, fold into STATUS and re-slim PARK. Delete PARK files when the track ships or is abandoned (git history remembers).

**DB migrations:** after writing/updating a file under `supabase/migrations/`, copy
it to the clipboard (`pbcopy < path`) and tell the user it is ready to paste into
the Supabase SQL Editor — see gotcha 10 in `CLAUDE.md`.
