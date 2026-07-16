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

## 2. Supabase → Auth → URL Configuration → Redirect URLs — ✅ CONFIGURED 2026-07-10

Add the app's deep-link callback so Supabase is allowed to redirect back into the app:

```
sampa://auth-callback
```

(For testing inside Expo Go's proxy you may also see an `exp://…` URL in the Metro logs —
add that too if you test that way, but the real flows need a dev build with the `sampa://`
scheme.)

## 3. Google — reuses the website's provider — ✅ WORKING (device-verified 2026-07-11; consent screen published 2026-07-12)

The app signs in with Google through an **in-app browser** against Supabase's existing Google
provider, so **no new Google client is required** — just make sure step 2's redirect URL is
allowlisted. Note the Google consent screen is still in **Testing** mode (per the web repo's
CLAUDE.md), so only whitelisted test users can sign in until it's published.

## 4. Apple — enable the provider (required on iOS) — ✅ CONFIGURED (native flow, device-verified 2026-07-11)

Apple requires Sign in with Apple once Google login is offered (App Store guideline 4.8), so
the app shows the Apple button on iOS. To make it work:

1. **Apple Developer** (needs the $99/yr account):
   - Enable the "Sign in with Apple" capability for App ID `org.addictionpas.app`.
   - Create a **Services ID** and a **Sign in with Apple key** (.p8).
2. **Supabase → Auth → Providers → Apple:** enable it and fill in the Services ID, Team ID,
   Key ID, and the .p8 key. Add `org.addictionpas.app` as an authorized client id.

Identities auto-link by verified email, and Apple "Hide My Email" relays are harmless because
the Stripe↔Supabase link is by user id, never email.

## 5. Email sign-in (numeric code + link fallback) — ✅ CONFIGURED 2026-07-09

The app asks users to **type the numeric code** from the email (more reliable on mobile than
tappable links, which corporate mail scanners often prefetch and invalidate). This project's
Supabase email-OTP length is **8 digits** (the app accepts 6–10). The emailed link still works
as a fallback on the same device (redirects to `sampa://auth-callback` from step 2).

This is live and end-to-end verified (simulator, real account). How it was configured:

- **Supabase templates require custom SMTP** (the built-in email service is default-templates
  only and rate-limited to a few emails/hour — development only).
- SMTP rides **Brevo** (SAMPA's likely member-email platform): domain `addictionpas.org`
  authenticated in Brevo (DKIM CNAMEs `brevo1/brevo2._domainkey`, `brevo-code` TXT, and
  `_dmarc` TXT — all at Porkbun DNS). Sender: **no-reply@addictionpas.org / SAMPA**.
- Supabase → Auth → Emails → SMTP: host `smtp-relay.brevo.com`, port 587, username = the
  Brevo SMTP login, password = a Brevo SMTP key named `supabase-auth` (no expiry).
- The **Magic Link** template body includes: `<p>Your sign-in code: <strong>{{ .Token }}</strong></p>`
  plus the original `{{ .ConfirmationURL }}` link as fallback.

⚠️ **Gotcha to remember:** Brevo revokes SMTP keys after **90 days of inactivity** regardless
of expiry. If sign-in emails ever mysteriously stop, first move: generate a new SMTP key in
Brevo and paste it into the Supabase SMTP settings. Custom SMTP raised the auth-email rate
limit to 30/hour (Supabase → Auth → Rate Limits to raise further at launch).

---

## Running a dev build (to actually test auth)

Expo Go can't do Apple sign-in, Face ID, or custom-scheme deep links. Build a dev client:

- **Local (needs Xcode):** `cd mobile && npx expo run:ios`
- **Cloud (no Xcode; needs the Apple account):** set up EAS and run `eas build --profile development --platform ios`, then install on the device.

Then `npx expo start` and open the dev build. Membership **purchase** stays on the website —
the app only reads status and links out (Apple's in-app-purchase rules).

---

## 6. Push notifications (app Phase 4) — ✅ CONFIGURED 2026-07-15 (steps below are the record)

The app registers device tokens; `api/send-push.js` fans out "new article"
notifications when a post becomes published. Three config steps:

1. **Database migration** — run the device_tokens/push_opt_in snippet (the
   `Mobile push notifications` section at the bottom of `supabase/schema.sql`)
   in the Supabase SQL editor. Apply BEFORE deploying/using app builds that
   include the notifications toggle.
2. **Vercel env var** — add `PUSH_WEBHOOK_SECRET` = a long random string
   (Production + Preview). Without it the endpoint answers 503 and does nothing.
3. **Supabase Database Webhook** — Dashboard → Database → Webhooks → Create:
   - Table: `posts` · Events: INSERT + UPDATE
   - Type: HTTP request → POST `https://www.addictionpas.org/api/send-push`
   - HTTP header: `x-push-secret` = the same secret
   The endpoint ignores everything except a post BECOMING published, so edits
   to already-published posts never re-notify.

Manual test/re-send (careful — notifies every opted-in device):
`POST /api/send-push` with header `x-push-secret` and body `{"slug":"<post-slug>"}`.

**EAS push credentials:** the first build after adding expo-notifications will
ask about push notification credentials — answer yes and EAS manages the APNs
key. Push only works on real devices (never simulators).

## 7. Crash reporting (Sentry — optional but recommended before launch) — ⬜ NOT YET (no account/DSN)

`src/lib/sentry.ts` arms itself only when `EXPO_PUBLIC_SENTRY_DSN` is set:
create a free account at sentry.io → new project (React Native) → copy the DSN
→ add `EXPO_PUBLIC_SENTRY_DSN` to `mobile/.env.local` AND to the EAS build
environment (eas.json env or EAS dashboard secrets) so production builds carry
it. No DSN = no-op.
