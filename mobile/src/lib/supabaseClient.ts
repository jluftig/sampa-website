// Single shared Supabase client for the mobile app (database, auth, storage).
//
// Web parity note: the web app reads Vite's `import.meta.env.VITE_SUPABASE_*`;
// on native we read Expo's `process.env.EXPO_PUBLIC_SUPABASE_*` (same values —
// the anon/publishable key is RLS-safe to ship).
//
// Native-specific choices:
// - Sessions persist through LargeSecureStore (AES key in the Keychain,
//   encrypted payload in AsyncStorage) — never plaintext on disk. The bonus web
//   target falls back to AsyncStorage (→ localStorage).
// - flowType 'pkce', explicitly: the supabase-js default is the implicit flow;
//   PKCE is the correct grant for native apps (auth.ts exchanges the returned
//   `code` for a session).
// - detectSessionInUrl off: that's a web-only OAuth-callback mechanism; native
//   handles deep links itself (auth.ts / AuthContext).

import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { LargeSecureStore } from './secure-session-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Warn loudly rather than hard-crash, so the app still boots during setup.
  console.warn(
    '[supabase] Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copy .env.example to .env.local and fill in the values.'
  );
}

const storage = Platform.OS === 'web' ? AsyncStorage : new LargeSecureStore();

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    storage,
    flowType: 'pkce',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Refresh the auth token while the app is foregrounded; pause it in the
// background (Supabase's recommended React Native pattern).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});
