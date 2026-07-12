# SAMPA stock cover library

Reusable **16:9** editorial covers (not tied to one post). Prefer these before regenerating when the mood fits.

**Folder:** `docs/assets/stock/`  
**Size target:** 1600 × 900  

| File | Mood / use | Notes |
|------|------------|--------|
| `clinical-molecular-lattice-teal.png` | Synthetic chemistry, molecules, lab-editorial | Saved from fentanyl MME option C (2026-07-12); **back pocket** for a future chemistry-forward article |
| `clinical-dose-scale-urban-slate.png` | High-dose magnitude + soft urban scale | Live cover for LA fentanyl MME post; keep as clinical reference |

## Rules

- **Agency/policy** covers: still use `docs/cover-style-agency-announcements.md` + dual-talon reference (not this folder first).
- **Clinical/study** covers: check stock here → else generate polished editorial (no rough sketch, no sensational drug porn).
- When generating “extras” during a cover pick, **save strong runners-up here** with a clear filename + one-line note in this table.
- Upload to Supabase `post-images` when attaching to a post (don’t hotlink raw GitHub forever for production if CDN differs — copy into storage).

## Naming

`{lane}-{subject}-{palette}.png`  
Examples: `clinical-molecular-lattice-teal.png`, `clinical-ed-soft-blue.png`
