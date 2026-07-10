# Instructions for AI agents

**Read [CLAUDE.md](CLAUDE.md) in full before changing anything.** It is the canonical
machine-oriented reference for this repo — architecture, data model, security
invariants (RLS), and a "Conventions & gotchas" section that will save you from
repeating past mistakes. This file exists only so that agents other than Claude
(Grok, Codex, Gemini, Cursor, …) find the same instructions; do not duplicate
content here.

Then check **[docs/STATUS.md](docs/STATUS.md)** for the current state of the project:
what's live, what's in flight, what's blocked, what's next, and the product backlog
(directory v2, avatars, CME, board tools, mobile, etc.). Do not invent a parallel
roadmap elsewhere.

When you finish significant work (feature merged, config milestone, decision made),
**update docs/STATUS.md** — it is the living status document both humans and agents
rely on across handoffs. If you change how operators use the site, update
**docs/HANDOFF.md** too.

Human-oriented operations guide: [docs/HANDOFF.md](docs/HANDOFF.md).

**DB migrations:** after writing/updating a file under `supabase/migrations/`, copy
it to the clipboard (`pbcopy < path`) and tell the user it is ready to paste into
the Supabase SQL Editor — see gotcha 10 in `CLAUDE.md`.
