# Mobile app (`mobile/`)

Standalone Expo (React Native) iOS/Android — **not** a webview.  
Separate build from Vite/Vercel; **same** Supabase project.  
Before editing app code: `mobile/AGENTS.md`.  
One-time config: `docs/mobile-app-setup.md`.  
Rollout checklist: `docs/STATUS.md`.

## Status (code)

Phases 0–4 device-verified: tabs + brand, auth (Apple / Google / email code via Brevo,
Face ID, encrypted sessions), news/Key Points/keywords/search/saved, member area +
account deletion, member directory, push (publish → phones). Sentry dormant until
`EXPO_PUBLIC_SENTRY_DSN`. Public App Store still open (org/D-U-N-S, board TestFlight).

## Hard rules

- **No in-app membership sales** (Apple IAP). App reads `membership_status`; join/renew
  opens the website in the system browser.
- **Sign in with Apple** required on iOS with Google (guideline 4.8) — built.
- Stripe↔Supabase still by **user id**; Hide My Email is fine.
- Deep link `sampa://` allowlisted in Supabase; PKCE auth.
- Public reads must filter `status='published'` explicitly (`mobile/src/lib/content.ts`).
- Account deletion: `api/delete-account.js` (cancel Stripe first, then delete user).
- Directory: call `member_directory*` RPCs only — never select peer `profiles` rows.

## Shared JS (`sampa-shared`)

App depends on `file:../src/lib` (`src/lib/package.json`). Metro symlink +
`unstable_enableSymlinks` + repo-root watchFolder.  
**Do not** copy modules into the app; **do not** put `window` / `import.meta.env` in
shared lib files.
