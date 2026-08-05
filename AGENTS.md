# Instructions for AI agents

**Read [CLAUDE.md](CLAUDE.md) before changing anything.** It is the canonical
machine-oriented entry point — invariants, gotchas, and pointers into
`docs/architecture/`. This file exists so non-Claude agents find the same path;
do not duplicate architecture here.

## Single board — do not invent a second roadmap

| Doc | Role | Update when… |
|-----|------|----------------|
| **[docs/STATUS.md](docs/STATUS.md)** | **Only product board** | State changes |
| **[CLAUDE.md](CLAUDE.md)** + **[docs/architecture/](docs/architecture/)** | How the system works / must not break | Code or security model changes |
| **[docs/HANDOFF.md](docs/HANDOFF.md)** | Thin human front door + bus-factor accounts | Account list or “start here” path changes — **not** a second manual |
| **docs/PARK-\*.md** | Mid-flight stickies | Track still active; delete when shipped |
| Setup / news prompts | One-time ops or production recipes | That subsystem’s procedure changes |
| **docs/archive/** | Historical only | Almost never |

**Write path:** STATUS first → CLAUDE/architecture if design/security changed → slim PARK if mid-flight → HANDOFF only for bus-factor/front-door edits.

**Don’t** copy STATUS backlog into HANDOFF or PARK.  
**Do** load the relevant `docs/architecture/*.md` file when editing that area (don’t require the whole monologue in context).

### Multi-agent claim (Egg Studio ↔ Cursor laptop)

Work is coordinated **only** via **`docs/STATUS.md` → section `## Tasks`** (Todo / In Progress / Done).  
No third file. **Pull → claim (Owner + move to In Progress) → commit+push STATUS → do work → complete/push.**  
Owners: `egg` · `cursor` · `josh` · `either`. Full workflow is in STATUS under **Task workflow**.

**DB migrations:** after writing/updating `supabase/migrations/`, `pbcopy < path` and tell the user it’s ready for the Supabase SQL Editor — gotcha 10 in `CLAUDE.md`.
