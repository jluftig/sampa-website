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
No third file. **Pull (if not current) → create Todo if missing (next `T##`) or claim → Owner + In Progress → commit+push STATUS → do work → complete/push.**  
Owners: `egg` · `cursor` · `josh` · `either`. Full workflow is in STATUS under **Task workflow**. Cursor always-on: `.cursor/rules/status-claim-workflow.mdc`.

Session handoffs (when Egg/Cursor need full context transfer): `docs/HANDOFF-cursor-*.md` — one-shot, not a standing board. Latest: [`docs/HANDOFF-cursor-2026-08-05-session.md`](docs/HANDOFF-cursor-2026-08-05-session.md).

**DB migrations:** after writing/updating `supabase/migrations/`, `pbcopy < path` and tell the user it’s ready for the Supabase SQL Editor — gotcha 10 in `CLAUDE.md`.

## Reviewing files and localhost pages with human-review

After writing an HTML or Markdown file the user will read, open it for them with
`npx -y human-review <file.html>`. For a locally running web page, open the real
route with `npx -y human-review http://localhost:3000/path` instead of recreating
it as a static file. Then block on
`npx -y human-review poll <target> --timeout 600` until they send feedback.
If it prints `{"status":"timeout"}`, no feedback arrived yet — run the same
poll command again to keep waiting. When a `{"status":"feedback"}` batch
arrives, apply it, then poll again with `--ack`.

Keep the poll command in the foreground and do not end the turn while it waits.
If the shell returns a process or session handle, keep waiting on that handle until
the command exits. `npx -y human-review status <target>` reports instantly
whether feedback is already waiting, without blocking.

The batch groups feedback by page under `pages`, so fix every page listed. Items
under `edits` are changes the user already made: `after` is their exact wording,
so carry it across verbatim and never revert it — and if the HTML was generated
from MDX or Markdown, apply it to the source too. Markdown files open rendered
and are never written by human-review: apply their comments and edits to the
Markdown source, keeping its syntax. There is no reply channel; the user sees
your work when the page reloads. For a localhost page, direct edits and deletions
arrive with `kind: "url"`; find and update the matching MDX, TSX, template, or
component source. Never write the rendered HTTP response over project source.

Skill details: [`.claude/skills/human-review/SKILL.md`](.claude/skills/human-review/SKILL.md) (from [petergyang/human-review](https://github.com/petergyang/human-review)).
