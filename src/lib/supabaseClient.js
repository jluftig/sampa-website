import { createClient } from '@supabase/supabase-js'

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
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
