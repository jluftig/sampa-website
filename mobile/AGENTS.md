# SAMPA mobile app — agent notes

Expo (React Native) iOS/Android app for SAMPA. Standalone native app sharing the website's
Supabase backend — NOT a webview. The website lives at the repo root; its conventions are in
the root `CLAUDE.md` and `docs/architecture/mobile.md`.

**Expo APIs change fast.** This app is on SDK 57 — verify APIs against
https://docs.expo.dev/versions/v57.0.0/ before writing code; don't trust memory. Stay pinned
to SDK 57 / RN 0.86 / React 19.2; don't bump SDKs mid-feature.

## Commands

- `npm run start` — Metro dev server (Expo Go can browse content; auth/Face ID need a dev build).
- `npm test` — vitest (pure-TS units, e.g. the HTML parser). `npm run typecheck` — tsc.
- Bundle checks without a device: `npx expo export --platform ios` / `--platform web`.
- Env: copy `.env.example` → `.env.local` (same Supabase values as the website's `VITE_*`).

## Architecture / conventions (violating these breaks things)

1. **Shared code via `sampa-shared`** — the web app's pure-JS `src/lib` modules (membership,
   tags, slug, format, usStates) are imported as `sampa-shared/<module>`, a `file:../src/lib`
   npm dependency materialized as a symlink (metro.config.js enables symlinks + watches the
   repo root; ambient types in `src/types/shared-modules.d.ts`). Never copy those modules in
   here; never delete `<repo>/src/lib/package.json`. A plain Metro alias to a folder outside
   the project does NOT work — the node_modules-package shape is what makes Metro resolve it.
2. **Public reads filter `status='published'` explicitly** (`src/lib/content.ts`) — never
   rely on RLS alone; editors can read drafts. Same invariant as the website.
3. **No membership purchases in-app** (Apple IAP rules) — read-only status + link out to the
   website in the system browser.
4. **Auth** (`src/lib/auth.ts`, `AuthContext.tsx`): PKCE flow; Google via in-app browser
   session; Sign in with Apple via native identity token; email = 6-digit OTP code (the
   Supabase Magic Link template must include `{{ .Token }}`) with the `sampa://auth-callback`
   deep link as fallback. Sessions persist through `LargeSecureStore` (AES key in Keychain,
   encrypted payload in AsyncStorage) — don't downgrade to plain AsyncStorage.
5. **Server state = TanStack Query** (`src/lib/query.ts`: client + AsyncStorage persistence +
   AppState focus wiring). New screens use `useQuery` + pull-to-refresh, not hand-rolled
   `useEffect` fetching. Favorites are a shared provider (`src/lib/favorites.tsx`), one store
   for the whole app.
6. **Article HTML** renders through the in-house parser `src/lib/html.ts` (unit-tested) +
   `components/article-body.tsx` — NOT react-native-render-html (unmaintained; breaks on
   React 19). If the website's TipTap editor gains new marks/nodes, extend parser + renderer
   + tests together.
7. **Styling** = StyleSheet + the brand theme in `src/constants/theme.ts` (mirrors the
   website's tailwind.config.js tokens; Inter / Playfair Display / IBM Plex Mono via
   expo-font). No NativeWind (deliberately deferred — uncertain support on this stack).
8. `typedRoutes` stays OFF (it needs the dev server to generate types → breaks offline tsc).
   Web target stays `output: "single"` (native auth modules crash the static prerender).
9. App identity: scheme `sampa`, bundle id `org.addictionpas.app`. One-time dashboard config
   and dev-build instructions: `../docs/mobile-app-setup.md`.
