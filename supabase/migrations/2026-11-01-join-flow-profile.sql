-- Join / renew Tier A profile columns and the 2026 annual survey.
-- Paste into the Supabase SQL editor. Idempotent.
-- Directory RPCs gain primary_practice_setting, focus_areas, and mentor_open
-- (only when mentor_visible). Private Tier A columns stay off those RPCs.

alter table public.profiles add column if not exists career_stage text;
alter table public.profiles add column if not exists nccpa_id text;
alter table public.profiles add column if not exists home_city text;
alter table public.profiles add column if not exists licensed_states text[] default '{}';
alter table public.profiles add column if not exists primary_practice_setting text;
alter table public.profiles add column if not exists years_as_pa int;
alter table public.profiles add column if not exists years_addiction int;
alter table public.profiles add column if not exists addiction_pct_bucket text;
alter table public.profiles add column if not exists practice_model text;
alter table public.profiles add column if not exists prescribes_moud text;
alter table public.profiles add column if not exists prescribes_other text[] default '{}';
alter table public.profiles add column if not exists telehealth_addiction boolean;
alter table public.profiles add column if not exists telehealth_states text[] default '{}';
alter table public.profiles add column if not exists focus_areas text[] default '{}';
alter table public.profiles add column if not exists mentor_open boolean;
alter table public.profiles add column if not exists mentor_visible boolean default false;
alter table public.profiles add column if not exists profile_confirmed_at timestamptz;

alter table public.profiles drop constraint if exists profiles_career_stage_check;
alter table public.profiles add constraint profiles_career_stage_check
  check (career_stage is null or career_stage in ('practicing', 'student', 'pre_pa', 'retired', 'other'));

-- Existing members never had this column. Fill it from the dues tier when we can.
-- Rows with no tier stay null. The renew screen asks inline and does not block.
update public.profiles
set career_stage = case membership_tier
  when 'student' then 'student'
  when 'prepa' then 'pre_pa'
  when 'legacy' then 'retired'
  when 'associate' then 'other'
  when 'fellow' then 'practicing'
  when 'sustaining' then 'practicing'
  else career_stage
end
where career_stage is null
  and membership_tier in ('student', 'prepa', 'legacy', 'associate', 'fellow', 'sustaining');

alter table public.profiles drop constraint if exists profiles_nccpa_id_check;
alter table public.profiles add constraint profiles_nccpa_id_check
  check (nccpa_id is null or char_length(nccpa_id) <= 32);

alter table public.profiles drop constraint if exists profiles_years_as_pa_check;
alter table public.profiles add constraint profiles_years_as_pa_check
  check (years_as_pa is null or years_as_pa between 0 and 60);

alter table public.profiles drop constraint if exists profiles_years_addiction_check;
alter table public.profiles add constraint profiles_years_addiction_check
  check (years_addiction is null or years_addiction between 0 and 60);

alter table public.profiles drop constraint if exists profiles_addiction_pct_check;
alter table public.profiles add constraint profiles_addiction_pct_check
  check (addiction_pct_bucket is null or addiction_pct_bucket in ('0', '1-25', '26-50', '51-75', '76-100'));

alter table public.profiles drop constraint if exists profiles_practice_model_check;
alter table public.profiles add constraint profiles_practice_model_check
  check (practice_model is null or practice_model in ('collaborative', 'supervisory', 'independent', 'not_sure', 'other'));

alter table public.profiles drop constraint if exists profiles_prescribes_moud_check;
alter table public.profiles add constraint profiles_prescribes_moud_check
  check (prescribes_moud is null or prescribes_moud in ('yes', 'no', 'na'));

alter table public.profiles drop constraint if exists profiles_primary_practice_setting_check;
alter table public.profiles add constraint profiles_primary_practice_setting_check
  check (
    primary_practice_setting is null
    or primary_practice_setting in (
      'ed', 'bridge', 'community_clinic', 'fqhc', 'otp', 'street_medicine',
      'mobile_integrated_health', 'telehealth', 'hospital', 'private_practice',
      'residential', 'corrections', 'academic', 'urban', 'rural', 'va', 'other'
    )
  );

alter table public.profiles drop constraint if exists profiles_prescribes_other_check;
alter table public.profiles add constraint profiles_prescribes_other_check
  check (prescribes_other is null or prescribes_other <@ array['aud', 'stimulant', 'neither']::text[]);

alter table public.profiles drop constraint if exists profiles_focus_areas_check;
alter table public.profiles add constraint profiles_focus_areas_check
  check (
    focus_areas is null
    or focus_areas <@ array[
      'opioids', 'alcohol', 'stimulants', 'cannabis', 'tobacco', 'pregnant',
      'adolescents', 'justice', 'unhoused', 'cooccurring', 'other'
    ]::text[]
  );

alter table public.profiles drop constraint if exists profiles_licensed_states_check;
alter table public.profiles add constraint profiles_licensed_states_check
  check (
    licensed_states is null
    or licensed_states <@ array[
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
      'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
      'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
      'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
      'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
      'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
      'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
      'Washington', 'Washington, D.C.', 'West Virginia', 'Wisconsin', 'Wyoming',
      'U.S. Territory / Other'
    ]::text[]
  );

alter table public.profiles drop constraint if exists profiles_telehealth_states_check;
alter table public.profiles add constraint profiles_telehealth_states_check
  check (
    telehealth_states is null
    or telehealth_states <@ array[
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
      'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
      'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine',
      'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
      'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
      'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
      'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
      'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia',
      'Washington', 'Washington, D.C.', 'West Virginia', 'Wisconsin', 'Wyoming',
      'U.S. Territory / Other'
    ]::text[]
  );

create table if not exists public.member_survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  survey_year int not null check (survey_year between 2020 and 2100),
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  unique (user_id, survey_year)
);

alter table public.member_survey_responses enable row level security;

drop policy if exists survey_responses_select on public.member_survey_responses;
create policy survey_responses_select on public.member_survey_responses
  for select using (
    auth.uid() = user_id
    or public.is_admin()
    or public.is_member_viewer()
  );

drop policy if exists survey_responses_insert on public.member_survey_responses;
create policy survey_responses_insert on public.member_survey_responses
  for insert with check (
    auth.uid() = user_id
    and survey_year = extract(year from (now() at time zone 'America/Los_Angeles'))::int
  );

drop policy if exists survey_responses_update on public.member_survey_responses;
create policy survey_responses_update on public.member_survey_responses
  for update using (
    auth.uid() = user_id
    and survey_year = extract(year from (now() at time zone 'America/Los_Angeles'))::int
  )
  with check (
    auth.uid() = user_id
    and survey_year = extract(year from (now() at time zone 'America/Los_Angeles'))::int
  );

drop function if exists public.member_directory(text, text);
drop function if exists public.member_directory(text, text, text[]);
drop function if exists public.member_directory_profile(uuid);

create or replace function public.member_directory(
  search text default null,
  state_filter text default null,
  settings_filter text[] default null
)
returns table (
  id uuid,
  full_name text,
  credentials text,
  organization text,
  practice_setting text,
  city text,
  state text,
  organizations jsonb,
  is_board boolean,
  patron boolean,
  email text,
  phone text,
  primary_practice_setting text,
  focus_areas text[],
  mentor_open boolean
)
language plpgsql stable security definer set search_path = public as $$
declare
  q text := nullif(btrim(coalesce(search, '')), '');
  st text := nullif(btrim(coalesce(state_filter, '')), '');
  sf text[] := nullif(settings_filter, '{}'::text[]);
begin
  if not public.is_active_member() then
    return;
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.credentials,
    p.organization,
    p.practice_setting,
    p.city,
    p.state,
    p.organizations,
    p.is_board,
    p.patron,
    case
      when not p.share_email then null
      when coalesce(p.directory_use_account_contact, true) then p.email
      else nullif(btrim(p.directory_email), '')
    end,
    case
      when not p.share_phone then null
      when coalesce(p.directory_use_account_contact, true) then p.phone
      else nullif(btrim(p.directory_phone), '')
    end,
    p.primary_practice_setting,
    p.focus_areas,
    case when p.mentor_visible then p.mentor_open else null end
  from public.profiles p
  where p.directory_visible
    and p.membership_status = 'active'
    and (
      q is null
      or p.full_name ilike '%' || q || '%'
      or p.organization ilike '%' || q || '%'
      or p.credentials ilike '%' || q || '%'
      or p.city ilike '%' || q || '%'
      or p.state ilike '%' || q || '%'
      or p.practice_setting ilike '%' || q || '%'
      or exists (
        select 1
        from jsonb_array_elements(coalesce(p.organizations, '[]'::jsonb)) o
        where o->>'name' ilike '%' || q || '%'
           or o->>'role' ilike '%' || q || '%'
           or o->>'city' ilike '%' || q || '%'
           or o->>'state' ilike '%' || q || '%'
           or o->>'practice_setting' ilike '%' || q || '%'
           or o->>'practice_setting_other' ilike '%' || q || '%'
           or o->>'website' ilike '%' || q || '%'
           or exists (
             select 1
             from jsonb_array_elements_text(coalesce(o->'practice_settings', '[]'::jsonb)) s(slug)
             where s.slug ilike '%' || q || '%'
           )
      )
      or (
        p.share_email
        and (
          case
            when coalesce(p.directory_use_account_contact, true) then p.email
            else nullif(btrim(p.directory_email), '')
          end
        ) ilike '%' || q || '%'
      )
    )
    and (
      st is null
      or p.state = st
      or exists (
        select 1
        from jsonb_array_elements(coalesce(p.organizations, '[]'::jsonb)) o
        where o->>'state' = st
      )
    )
    and (
      sf is null
      or exists (
        select 1
        from jsonb_array_elements(coalesce(p.organizations, '[]'::jsonb)) o
        cross join lateral jsonb_array_elements_text(
          coalesce(o->'practice_settings', '[]'::jsonb)
        ) s(slug)
        where s.slug = any(sf)
      )
    )
  order by p.full_name nulls last, p.email nulls last;
end;
$$;

create or replace function public.member_directory_profile(member_id uuid)
returns table (
  id uuid,
  full_name text,
  credentials text,
  organization text,
  practice_setting text,
  city text,
  state text,
  organizations jsonb,
  is_board boolean,
  patron boolean,
  email text,
  phone text,
  primary_practice_setting text,
  focus_areas text[],
  mentor_open boolean
)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_active_member() then
    return;
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.credentials,
    p.organization,
    p.practice_setting,
    p.city,
    p.state,
    p.organizations,
    p.is_board,
    p.patron,
    case
      when not p.share_email then null
      when coalesce(p.directory_use_account_contact, true) then p.email
      else nullif(btrim(p.directory_email), '')
    end,
    case
      when not p.share_phone then null
      when coalesce(p.directory_use_account_contact, true) then p.phone
      else nullif(btrim(p.directory_phone), '')
    end,
    p.primary_practice_setting,
    p.focus_areas,
    case when p.mentor_visible then p.mentor_open else null end
  from public.profiles p
  where p.id = member_id
    and p.directory_visible
    and p.membership_status = 'active';
end;
$$;

