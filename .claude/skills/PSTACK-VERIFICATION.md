# Vendored verification skills from pstack

Source: [backnotprop/pstack](https://github.com/backnotprop/pstack) at commit `3a604672c46cd8187d2b19980eae0a34f9f91138` (2026-10-08). MIT License, Copyright (c) 2026 Lauren Tan. Full license text: [PSTACK-VERIFICATION-LICENSE](./PSTACK-VERIFICATION-LICENSE).

Lauren Tan ([@poteto](https://x.com/poteto)) recommended copying these two skills in [this post](https://x.com/poteto/status/2082874054483255805). The post links the Cursor plugins mirror:

- [create-verification-skill](https://github.com/cursor/plugins/blob/main/pstack/skills/create-verification-skill/SKILL.md)
- [maintain-verification-skill](https://github.com/cursor/plugins/blob/main/pstack/skills/maintain-verification-skill/SKILL.md)

That mirror still tells the agent to write only under `.cursor/skills/`. The upstream files also accept `.claude/skills/`, `.pi/skills/`, and `.agents/skills/` when the repo already keeps skills there. This copy is the upstream blobs, unchanged, including the feature-map example the create skill references.

| Skill | Upstream path |
|---|---|
| create-verification-skill | skills/create-verification-skill |
| maintain-verification-skill | skills/maintain-verification-skill |

## Local changes

None in the vendored files.

`verify-sampa-website` is not upstream. It is the project skill produced by running `/create-verification-skill` in this repo.
