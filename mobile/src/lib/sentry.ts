// Crash reporting (Sentry) — armed only when EXPO_PUBLIC_SENTRY_DSN is set.
// Without a DSN this module is a no-op, so the app builds and runs fine before
// the Sentry account exists (setup steps: docs/mobile-app-setup.md). Once the
// DSN is in the build env, field crashes and JS errors become visible instead
// of silent — essential for an app maintained without a dev team.

import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Keep defaults conservative: crashes + errors, no performance tracing
    // (can be raised later); no PII beyond what Sentry collects by default.
    tracesSampleRate: 0,
    sendDefaultPii: false,
  });
}

export const sentryEnabled = !!dsn;
