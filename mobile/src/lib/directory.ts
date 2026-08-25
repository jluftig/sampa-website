// Member directory data layer.
//
// Both RPCs are SECURITY DEFINER and self-gating: they check is_active_member()
// server-side (active members + editors/admins), respect each member's
// directory_visible opt-out and per-field share_email/share_phone choices, and
// do search/state/settings filtering in SQL. The app can't leak anything the
// website wouldn't — UI gating here is purely for good UX. Same rule as the web:
// NEVER select peer rows from `profiles` directly.

import { supabase } from './supabaseClient';

export type DirectoryOrganization = {
  name?: string;
  role?: string;
  practice_setting?: string;
  practice_settings?: string[];
  practice_setting_other?: string | null;
  city?: string;
  state?: string;
  website?: string;
};

export type DirectoryMember = {
  id: string;
  full_name: string | null;
  credentials: string | null;
  organization: string | null;
  practice_setting: string | null;
  city: string | null;
  state: string | null;
  organizations: DirectoryOrganization[] | null;
  is_board: boolean;
  patron?: boolean; // optional until 2026-08-25-directory-patron.sql is applied
  email: string | null; // null unless that member shares it
  phone: string | null; // null unless that member shares it
};

/** Directory listing (active members only; empty for everyone else). */
export async function fetchMemberDirectory(
  search: string,
  stateFilter: string,
  settingsFilter: string[] = []
): Promise<DirectoryMember[]> {
  const { data, error } = await supabase.rpc('member_directory', {
    search: search.trim() || null,
    state_filter: stateFilter || null,
    settings_filter: settingsFilter.length ? settingsFilter : null,
  });
  if (error) throw error;
  return (data || []) as DirectoryMember[];
}

/** One member's directory card (same privacy rules). null = not found/not visible. */
export async function fetchMemberProfile(memberId: string): Promise<DirectoryMember | null> {
  const { data, error } = await supabase.rpc('member_directory_profile', {
    member_id: memberId,
  });
  if (error) throw error;
  return ((data || []) as DirectoryMember[])[0] ?? null;
}
