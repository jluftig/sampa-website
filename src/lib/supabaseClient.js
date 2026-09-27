import { createClient } from '@supabase/supabase-js'
import { createAuthStorage } from './authStorage.js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Copy .env.example to .env.local and fill in your values.'
  )
}

// Single shared Supabase client for the whole app (database, auth, storage).
// The anon/publishable key is safe in the browser — access is governed by
// Row-Level Security in the database.
//
// Auth: persist to localStorage + first-party cookie backup (see authStorage)
// so a Safari/ITP or in-memory fallback does not drop the session on the next
// navigation or Stripe return. Do not change storageKey — existing members
// already have sb-<ref>-auth-token in their browsers.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: createAuthStorage(),
  },
})
