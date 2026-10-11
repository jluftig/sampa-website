# Vendored workflow skills from mattpocock/skills

Source: https://github.com/mattpocock/skills at tag **v1.3.1** (MIT License, Copyright (c) 2026 Matt Pocock). Full license text: [POCOCK-SKILLS-LICENSE](./POCOCK-SKILLS-LICENSE). The `pr` skill also carries upstream credit to Dex Horthy / HumanLayer in [pr/CREDITS.md](./pr/CREDITS.md).

Copied unchanged unless listed under "Local changes".

| Skill | Upstream path | Use |
|---|---|---|
| grilling | skills/productivity/grilling | Interview Josh in rounds until the plan is settled |
| grill-me | skills/productivity/grill-me | One-line wrapper: runs `grilling` |
| grill-with-docs | skills/engineering/grill-with-docs | `grilling` + `domain-modeling` (updates GLOSSARY.md / ADRs as you go) |
| domain-modeling | skills/engineering/domain-modeling | Needed by grill-with-docs |
| wait-what | skills/productivity/wait-what | "That didn't land, re-pitch it plainly" |
| to-spec | skills/engineering/to-spec | Turn the settled conversation into a spec (GitHub issue) |
| to-tickets | skills/engineering/to-tickets | Split a spec into blocking-ordered tickets |
| implement | skills/engineering/implement | Build from a spec or tickets |
| implement-spec | skills/engineering/implement-spec | Build a whole spec on one integration branch |
| tdd | skills/engineering/tdd | Needed by implement / implement-spec |
| code-review | skills/engineering/code-review | Needed by implement / implement-spec |
| pr | skills/engineering/pr | PR body template (summary, evidence, merge danger) |
| retro | skills/engineering/retro | Retrospective on an agent session |
| writing-for-agents | skills/productivity/writing-for-agents | Needed by retro |

Not vendored: `setup-matt-pocock-skills` (its output is already written in `docs/agents/`), `triage`, `wayfinder`, and the rest.

## Local changes

- **grilling**: every question must carry a recommended answer **and a one-line why**, in plain language, phrased so "yes" accepts it, with a `1 yes, 2 yes, 3 no` reply line. Josh has decision fatigue.
- **SAMPA ship rules override any upstream step** that merges, marks ready, or closes work on its own: see [docs/agents/sampa-pipeline.md](../../docs/agents/sampa-pipeline.md).

To update: diff against a newer upstream tag, re-apply the local changes, bump the tag above.
