import { register } from 'node:module';

globalThis.__SAMPA_IMPORT_META_ENV = {
  VITE_SUPABASE_URL: 'https://example.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'sb_publishable_test',
  DEV: false,
  PROD: true,
  MODE: 'test',
};

register('./jsx-hooks.mjs', import.meta.url);
