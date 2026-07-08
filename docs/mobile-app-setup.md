# Mobile app — one-time setup (auth)

The Expo app lives in [`mobile/`](../mobile). The **code** for sign-in is done (Phase 1),
but sign-in won't actually complete until the Supabase / Google / Apple config below is in
place. None of this affects the website.

> **Important:** Google OAuth, Sign in with Apple, biometric unlock, and email-link deep
> links all require a **development build** of the app — they do **not** work in Expo Go.
> See "Running a dev build" at the bottom.

---

## 1. App environment variables

Create `mobile/.env.local` (gitignored) from `mobile/.env.example`:

```
EXPO_PUBLIC_SUPABASE_URL=https://xbzzawjnphpnexwfjtif.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...   # same anon/publishable key as the website
```

The anon key is safe to ship — Row-Level Security is the real boundary (same as the web app).

## 2. Supabase → Auth → URL Configuration → Redirect URLs

Add the app's deep-link callback so Supabase is allowed to redirect back into the app:

```
sampa://auth-callback
```

(For testing inside Expo Go's proxy you may also see an `exp://…` URL in the Metro logs —
add that too if you test that way, but the real flows need a dev build with the `sampa://`
scheme.)

## 3. Google — reuses the website's provider

The app signs in with Google through an **in-app browser** against Supabase's existing Google
provider, so **no new Google client is required** — just make sure step 2's redirect URL is
allowlisted. Note the Google consent screen is still in **Testing** mode (per the web repo's
CLAUDE.md), so only whitelisted test users can sign in until it's published.

## 4. Apple — enable the provider (required on iOS)

Apple requires Sign in with Apple once Google login is offered (App Store guideline 4.8), so
the app shows the Apple button on iOS. To make it work:

1. **Apple Developer** (needs the $99/yr account):
   - Enable the "Sign in with Apple" capability for App ID `org.addictionpas.app`.
   - Create a **Services ID** and a **Sign in with Apple key** (.p8).
2. **Supabase → Auth → Providers → Apple:** enable it and fill in the Services ID, Team ID,
   Key ID, and the .p8 key. Add `org.addictionpas.app` as an authorized client id.

Identities auto-link by verified email, and Apple "Hide My Email" relays are harmless because
the Stripe↔Supabase link is by user id, never email.

## 5. Email sign-in (6-digit code + link fallback)

The app asks users to **type a 6-digit code** from the email (more reliable on mobile than
tappable links, which corporate mail scanners often prefetch and invalidate). The emailed
link still works as a fallback on the same device (redirects to `sampa://auth-callback`
from step 2).

**Required template change:** Supabase → Auth → Emails → **Magic Link** template — make sure
the body includes the code placeholder, e.g. add a line like:

```
Your sign-in code: {{ .Token }}
```

(Keep the existing `{{ .ConfirmationURL }}` link too — that's the fallback.)

---

## Running a dev build (to actually test auth)

Expo Go can't do Apple sign-in, Face ID, or custom-scheme deep links. Build a dev client:

- **Local (needs Xcode):** `cd mobile && npx expo run:ios`
- **Cloud (no Xcode; needs the Apple account):** set up EAS and run `eas build --profile development --platform ios`, then install on the device.

Then `npx expo start` and open the dev build. Membership **purchase** stays on the website —
the app only reads status and links out (Apple's in-app-purchase rules).
