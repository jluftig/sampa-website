# Instructions for AI agents

**Read [CLAUDE.md](CLAUDE.md) in full before changing anything.** It is the canonical
machine-oriented reference for this repo — architecture, data model, security
invariants (RLS), and a "Conventions & gotchas" section that will save you from
repeating past mistakes. This file exists only so that agents other than Claude
(Grok, Codex, Gemini, Cursor, …) find the same instructions; do not duplicate
content here.

Then check **[docs/STATUS.md](docs/STATUS.md)** for the current state of the project:
what's live, what's in flight on branches, what's blocked, what's next.

When you finish significant work (feature merged, config milestone, decision made),
**update docs/STATUS.md** — it is the living status document both humans and agents
rely on across handoffs.

Human-oriented operations guide: [docs/HANDOFF.md](docs/HANDOFF.md).
