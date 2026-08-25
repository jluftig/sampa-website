-- ============================================================================
-- AAPA membership (honor system) (2026-08-25)
-- HOW TO RUN: Supabase Dashboard -> SQL Editor -> paste this whole file -> Run.
-- Additive + idempotent. Mirror of supabase/schema.sql.
-- Do NOT apply from CI / Vercel preview. Operator applies when ready.
--
-- Nullable boolean. Self-writable (not in guard_profile_role).
-- We do not verify with AAPA. Do NOT add aapa_member_id in this migration.
-- ============================================================================

alter table public.profiles
  add column if not exists aapa_member boolean;
