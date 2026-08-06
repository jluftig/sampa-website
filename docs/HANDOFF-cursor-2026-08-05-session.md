# Handoff → Cursor (laptop) — session 2026-08-05

**From:** Egg (Hermes) on Mac Studio  
**To:** Cursor on laptop  
**Date:** 2026-08-05  
**Josh role:** Director — you execute claimed STATUS tasks; don’t invent a second board.

**First actions (mandatory):**

```bash
cd <sampa-website> && git pull --ff-only
# read this file + STATUS Tasks section
```

Then follow **STATUS → Tasks** workflow for any work you pick up.

---

## 1. How we coordinate (non-negotiable)

### Single board

| Doc | Role |
|-----|------|
| **`docs/STATUS.md`** | **Only product board** + **Tasks claim tables** |
| `CLAUDE.md` + `docs/architecture/*` | How the system works |
| `docs/PARK-*.md` | Thin mid-flight stickies |
| `docs/HANDOFF.md` | Human front door only — not a second backlog |
| **This file** | One-shot agent handoff (session context) — not a standing board |

**No `TASKS.md`.** No parallel kanban SaaS. Claims live only in STATUS.

### Task workflow (copy from STATUS — do this every time)

1. **`git pull`**
2. **Claim:** Todo row → Owner `cursor` → move to **In Progress** + Started `YYYY-MM-DD` → **commit + push STATUS immediately**
3. **Work** that task only (unless Josh says parallel OK)
4. **Update** notes on the In Progress row if blocked → push
5. **Complete:** move to **Done** + date; keep Done ≤ **5** rows; push
6. **Release:** back to Todo with Owner `either` if you stop mid-flight → push
7. **Conflict:** first push to `origin/main` wins; other pulls and yields

**Owners:** `egg` · `cursor` · `josh` · `either`

### Egg ↔ Cursor “communication”

There is **no live DM** between agents. Protocol:

- STATUS Tasks = claims  
- PARK / this handoff = context transfer  
- PRs = code review room  
- Josh one-liners when needed  

---

## 2. What shipped this session (Studio / Egg)

### A. STATUS Tasks claim board (SAMPA repo) — **done earlier same arc, on main**

- Commit path: `docs: Tasks claim board…` (`e043f3e` lineage; pull to see current)
- Wired in: `docs/STATUS.md`, `AGENTS.md`, `CLAUDE.md`
- Hermes skill `sampa-website` v1.9+ documents Egg↔Cursor claim

**Seeded Todo (still open unless you claim):** T1–T8 (SQL, security P0, Brevo, footer socials, newsletter signup, news covers=`egg`, mobile Sentry, D-U-N-S=`josh`)

**Done already:**  
| T9 | `/human-review` skill in **this repo** | **cursor** | 2026-08-05 | PR #61 · `.claude/skills/human-review/` + AGENTS.md |

### B. Peter Yang `/human-review` — dual install (not a conflict)

| Where | Who | Notes |
|-------|-----|--------|
| **sampa-website** `.claude/skills/human-review/` | **Cursor (you)** | T9 done — repo-local for CC/Cursor |
| **Hermes egg** `productivity/human-review` | Egg | Telegram/Studio `npx -y human-review` |

Same upstream: https://github.com/petergyang/human-review  
Do **not** re-install into the repo unless upgrading; Egg will not re-do T9.

### C. Matt Pocock skills pack (**v1.2.2** / main)

**Upstream:** https://github.com/mattpocock/skills · version **1.2.2**

**Egg / Hermes:** curated install under `~/.hermes/profiles/egg/skills/` (Studio only).  
**Not** bulk-committed into sampa-website (avoids double-write with you).

| Installed on Egg (enabled) | Skipped on Egg |
|----------------------------|----------------|
| grill-me, grilling, grill-with-docs, handoff, wait-what, to-questionnaire | `writing-for-agents` — Hermes security blocked |
| tdd, implement, to-spec, to-tickets, prototype, code-review, diagnosing-bugs | `setup-matt-pocock-skills` — blocked (agent_config_mod) |
| domain-modeling, improve-codebase-architecture, resolving-merge-conflicts | Full dump of misc/TS toys |
| wayfinder, research, wizard | |

**Wayfinder:** installed on Egg; user-invoked. Charts **decision tickets** (not build slices) on a tracker map. Needs `/setup-matt-pocock-skills` **or** local-markdown tracker for full power. **Don’t** use for every small STATUS todo — only multi-session fog.

**Josh’s agent mix (decision):**

- **Primary coding:** Cursor  
- **Experiment:** Claude Code (less and less), Grok Build  
- **Daily ops / Telegram / cron:** Egg (Hermes)

**How Cursor should get Matt pack (Josh decision):**

```bash
# laptop — skills.sh ONLY (do NOT also install Claude Code plugin for same pack)
npx skills@latest add mattpocock/skills
# Select agent: Cursor (add Claude Code only if easy same pass)
# Include setup-matt-pocock-skills + promoted set
# Then once in sampa-website:
#   /setup-matt-pocock-skills
```

If CC stays rare: **Cursor-only** install is enough. Plugin path is optional alternative for CC alone — never plugin + skills.sh together.

### D. Ops-board (mission lock-in dashboard) — **new private repo**

| | |
|--|--|
| **Repo** | https://github.com/jluftig/ops-board (**private**) |
| **Role** | Read-only **lens** over STATUS/PARK/CoS — **not** a second SoR |
| **Studio** | `~/Projects/ops-board` |
| **Run** | `./bin/ops` or `python3 scripts/generate.py --open` |

**Multi-machine (2026-08-05):**

- Auto-detects `~/Projects` and `~/joshluftig/Projects`
- Optional `config.local.yaml` (gitignored) — see `config.example.yaml`
- `OPS_BOARD_PROJECTS` env override
- `--print-roots` to debug
- `out/` gitignored — regenerate after pulls

**Laptop clone:**

```bash
git clone https://github.com/jluftig/ops-board.git ~/joshluftig/Projects/ops-board
# or ~/Projects/ops-board
cd …/ops-board && chmod +x bin/ops
# if needed: cp config.example.yaml config.local.yaml
./bin/ops
```

Daily: pull sampa-website (+ JoshVault if CoS on that machine) → pull ops-board if tool changed → `./bin/ops`.

### E. Memory hygiene (Hermes) — context for Egg, not Cursor

- Always-on memory slimmed; full SAMPA 2026–27 leadership → JoshVault `CoS-prototype/PEOPLE.md`
- Josh = SAMPA **President Elect**
- Rosters/cron IDs do **not** belong in Hermes memory

### F. Other decisions this arc (still true)

- **Email platform:** keep Supabase/Stripe SoR; **Brevo** for email; no full AMS now; NP discounts researched (Brevo ~20%, etc.)
- **Brevo free seat:** org mailbox (`admin@` / `ops@`) + 1Password shared vault — not personal Gmail as owner long-term
- **AI-CoS:** foundations live; goal v1 active; not full default-week yet — separate from SAMPA STATUS
- **Agent comms:** STATUS + handoff + PR; no Egg↔Cursor live channel planned

---

## 3. Suggested STATUS work for Cursor next

Promoted onto the claim board (see STATUS after this commit). Pick **one**, claim, push, then work:

| ID | Task | Why |
|----|------|-----|
| **T11** | Install Matt Pocock skills for **Cursor** via `npx skills@latest add mattpocock/skills` | Match Studio capability on laptop coding agent |
| **T12** | Clone **ops-board** on laptop + `./bin/ops` (+ config.local if needed) | Director dashboard on the machine you sit at |
| **T13** | (Optional) `/setup-matt-pocock-skills` in sampa-website | Only if you want wayfinder/triage GitHub Issues wiring — **claim first**; don’t fight STATUS |
| T1–T5, T7 | Existing product/ops todos | Normal SAMPA execution |
| T6 | News covers | Owned by **egg** unless Josh reassigns |
| T8 | D-U-N-S | **josh** |

**Do not** re-open T9 human-review repo install unless upgrading the skill.

---

## 4. Resume phrases (Josh / Egg)

| Want | Say / do |
|------|----------|
| SAMPA product | STATUS + claim task |
| News pipeline | `Resume SAMPA news pipeline` |
| Brevo email | `Resume SAMPA Brevo email` |
| Security review | `Resume SAMPA security review` |
| CoS | `Resume CoS` (separate board: vault OPEN-LOOPS) |
| Ops dashboard | `Resume ops board` · repo `jluftig/ops-board` |
| This handoff | Open `docs/HANDOFF-cursor-2026-08-05-session.md` |

---

## 5. Pitfalls

- Installing Matt skills **and** Claude plugin → duplicate skills  
- Editing STATUS without pull/push → claim races  
- Treating ops-board HTML as source of truth  
- Merging CoS OPEN-LOOPS into SAMPA STATUS  
- Wayfinder for tiny tasks (use STATUS Todo instead)  
- Re-doing human-review in-repo (T9 done by you already)

---

## 6. File index

| Path | What |
|------|------|
| `docs/STATUS.md` → **Tasks** | Claim board |
| `docs/HANDOFF-cursor-2026-08-05-session.md` | **This handoff** |
| `AGENTS.md` / `CLAUDE.md` | Multi-agent claim + human-review pointer |
| `.claude/skills/human-review/` | Repo skill (your T9) |
| https://github.com/jluftig/ops-board | Mission dashboard generator |
| JoshVault `00-Inbox/AI/CoS-prototype/` | CoS living pack (Bridge) — not SAMPA product board |

---

## 7. One-screen “you’re up to date”

1. Pull `sampa-website`.  
2. STATUS has **Tasks**; workflow = pull → claim → push → work → Done → push.  
3. You already shipped **human-review** in-repo (T9).  
4. Egg shipped **ops-board** multi-machine + Matt skills on Hermes + this handoff.  
5. Your next useful claims: **T11** Matt on Cursor, **T12** ops-board on laptop.  
6. Primary IDE = Cursor; CC/Grok Build = light experiment; Egg = ops/Telegram.  

— End handoff —
