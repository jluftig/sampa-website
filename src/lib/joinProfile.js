// Tier A member profile. Join, renew, and the staff roster share this shape.
// Billing columns stay out of here. The webhook is the only membership writer.
//
// Private (never a directory RPC column): home_city, licensed_states,
// addiction_pct_bucket, practice_model, prescribes_moud, prescribes_other,
// telehealth_states. Directory may show primary_practice_setting, focus_areas,
// and mentor_open when mentor_visible is true.

import { US_STATES } from './usStates.js';
import {
  emptyOrganization,
  organizationsFromProfile,
  primaryOrgFields,
  sanitizeOrganizations,
} from './organizations.js';
import { sanitizePracticeSettingSlugs } from './practiceSettings.js';

export const CAREER_STAGES = [
  { id: 'practicing', label: 'Practicing PA' },
  { id: 'student', label: 'PA student' },
  { id: 'pre_pa', label: 'Pre-PA' },
  { id: 'retired', label: 'Retired or inactive PA' },
  { id: 'other', label: 'Other clinician or supporter' },
];

export const ADDICTION_PCT_BUCKETS = [
  { id: '0', label: '0%' },
  { id: '1-25', label: '1–25%' },
  { id: '26-50', label: '26–50%' },
  { id: '51-75', label: '51–75%' },
  { id: '76-100', label: '76–100%' },
];

export const PRACTICE_MODELS = [
  { id: 'collaborative', label: 'Collaborative' },
  { id: 'supervisory', label: 'Supervisory' },
  { id: 'independent', label: 'Independent' },
  { id: 'not_sure', label: 'Not sure' },
  { id: 'other', label: 'Other' },
];

export const MOUD_ANSWERS = [
  { id: 'yes', label: 'Yes' },
  { id: 'no', label: 'No' },
  { id: 'na', label: 'N/A' },
];

export const PRESCRIBES_OTHER = [
  { id: 'aud', label: 'AUD meds' },
  { id: 'stimulant', label: 'Stimulant (contingency management or meds)' },
  { id: 'neither', label: 'Neither' },
];

export const FOCUS_AREAS = [
  { id: 'opioids', label: 'Opioids' },
  { id: 'alcohol', label: 'Alcohol' },
  { id: 'stimulants', label: 'Stimulants' },
  { id: 'cannabis', label: 'Cannabis' },
  { id: 'tobacco', label: 'Tobacco/nicotine' },
  { id: 'pregnant', label: 'Pregnant/postpartum' },
  { id: 'adolescents', label: 'Adolescents' },
  { id: 'justice', label: 'Justice-involved' },
  { id: 'unhoused', label: 'Unhoused' },
  { id: 'cooccurring', label: 'Co-occurring mental health' },
  { id: 'other', label: 'Other' },
];

export const PROFILE_GROUPS = [
  { id: 'you', title: 'You' },
  { id: 'practice', title: 'Practice' },
  { id: 'where', title: 'Where you work' },
  { id: 'addiction', title: 'Addiction practice' },
];

const CAREER_IDS = new Set(CAREER_STAGES.map((s) => s.id));
const PCT_IDS = new Set(ADDICTION_PCT_BUCKETS.map((s) => s.id));
const MODEL_IDS = new Set(PRACTICE_MODELS.map((s) => s.id));
const MOUD_IDS = new Set(MOUD_ANSWERS.map((s) => s.id));
const OTHER_RX_IDS = PRESCRIBES_OTHER.map((s) => s.id);
const FOCUS_IDS = FOCUS_AREAS.map((s) => s.id);
const STATE_SET = new Set(US_STATES);

export function careerStageLabel(id) {
  return CAREER_STAGES.find((s) => s.id === id)?.label || '';
}

// Existing members have a tier and no career_stage until they confirm.
// The column stays nullable. This only fills a suggestion from dues already on the row.
export function careerStageFromTier(tier) {
  if (tier === 'student') return 'student';
  if (tier === 'prepa') return 'pre_pa';
  if (tier === 'legacy') return 'retired';
  if (tier === 'associate') return 'other';
  if (tier === 'fellow' || tier === 'sustaining') return 'practicing';
  return null;
}

export function deriveCareerStage(profile) {
  return oneOf(profile?.career_stage, CAREER_IDS) || careerStageFromTier(profile?.membership_tier);
}

export function isLicensedPaStage(stage) {
  return stage === 'practicing' || stage === 'retired';
}

// Role chip on the profile step suggests a dues card. Practicing PAs still
// need the honor-system AAPA answer before a card is chosen.
export function suggestedTierForCareer(stage, aapaMember) {
  if (stage === 'student') return 'student';
  if (stage === 'pre_pa') return 'prepa';
  if (stage === 'other') return 'associate';
  if (stage === 'retired') return 'legacy';
  if (stage === 'practicing') {
    if (aapaMember === true) return 'fellow';
    if (aapaMember === false) return 'sustaining';
  }
  return null;
}

export function isValidNpi(value) {
  if (!/^\d{10}$/.test(value || '')) return false;
  const digits = `80840${value}`.split('').map(Number);
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = digits[i];
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

function oneOf(value, set) {
  return set.has(value) ? value : null;
}

function subset(raw, allowed) {
  if (!Array.isArray(raw)) return [];
  const allowedSet = new Set(allowed);
  const out = [];
  for (const item of raw) {
    if (allowedSet.has(item) && !out.includes(item)) out.push(item);
  }
  return out;
}

function stateList(raw) {
  return subset(raw, US_STATES);
}

function yearCount(raw) {
  if (raw === '' || raw == null) return null;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 60) return null;
  return n;
}

export function emptyProfileForm(profile, email) {
  const orgs = organizationsFromProfile(profile || {});
  return {
    full_name: profile?.full_name || '',
    email: email || profile?.email || '',
    phone: profile?.phone || '',
    sms_opt_in: profile?.sms_opt_in ?? false,
    newsletter_opt_in: profile?.newsletter_opt_in ?? true,
    career_stage: deriveCareerStage(profile) || '',
    credentials: profile?.credentials || '',
    npi: profile?.npi || '',
    nccpa_id: profile?.nccpa_id || '',
    aapa_member: typeof profile?.aapa_member === 'boolean' ? profile.aapa_member : null,
    home_city: profile?.home_city || '',
    state: profile?.state && STATE_SET.has(profile.state) ? profile.state : (profile?.state || ''),
    licensed_states: stateList(profile?.licensed_states),
    organizations: orgs.length ? orgs : [emptyOrganization()],
    primary_practice_setting: sanitizePracticeSettingSlugs(
      profile?.primary_practice_setting ? [profile.primary_practice_setting] : []
    )[0] || '',
    years_as_pa: profile?.years_as_pa ?? '',
    years_addiction: profile?.years_addiction ?? '',
    addiction_pct_bucket: oneOf(profile?.addiction_pct_bucket, PCT_IDS) || '',
    practice_model: oneOf(profile?.practice_model, MODEL_IDS) || '',
    prescribes_moud: oneOf(profile?.prescribes_moud, MOUD_IDS) || '',
    prescribes_other: subset(profile?.prescribes_other, OTHER_RX_IDS),
    telehealth_addiction: typeof profile?.telehealth_addiction === 'boolean'
      ? profile.telehealth_addiction
      : null,
    telehealth_states: stateList(profile?.telehealth_states),
    focus_areas: subset(profile?.focus_areas, FOCUS_IDS),
    mentor_open: typeof profile?.mentor_open === 'boolean' ? profile.mentor_open : null,
    mentor_visible: profile?.mentor_visible === true,
    directory_visible: profile?.directory_visible ?? true,
    directory_use_account_contact: profile?.directory_use_account_contact ?? true,
    directory_email: profile?.directory_email || '',
    directory_phone: profile?.directory_phone || '',
    share_email: profile?.share_email ?? true,
    share_phone: profile?.share_phone ?? false,
  };
}

// Hide-and-clear for the two conditional questions. Other hidden fields keep
// a stored answer so a mis-tap does not wipe NPI or license states.
export function applyConditionalClears(form) {
  const next = { ...form };
  if (next.prescribes_moud !== 'yes') next.prescribes_other = [];
  if (next.telehealth_addiction !== true) next.telehealth_states = [];
  return next;
}

export function sanitizeProfileForm(form) {
  const cleared = applyConditionalClears(form);
  const organizations = sanitizeOrganizations(cleared.organizations);
  const npi = (cleared.npi || '').replace(/\D/g, '');
  return {
    full_name: (cleared.full_name || '').trim(),
    phone: (cleared.phone || '').trim() || null,
    sms_opt_in: Boolean(cleared.sms_opt_in),
    newsletter_opt_in: Boolean(cleared.newsletter_opt_in),
    career_stage: oneOf(cleared.career_stage, CAREER_IDS),
    credentials: (cleared.credentials || '').trim() || null,
    npi: npi || null,
    nccpa_id: (cleared.nccpa_id || '').trim() || null,
    aapa_member: typeof cleared.aapa_member === 'boolean' ? cleared.aapa_member : null,
    home_city: (cleared.home_city || '').trim() || null,
    state: (cleared.state || '').trim() || null,
    licensed_states: stateList(cleared.licensed_states),
    organizations,
    ...primaryOrgFields(organizations),
    primary_practice_setting: sanitizePracticeSettingSlugs(
      cleared.primary_practice_setting ? [cleared.primary_practice_setting] : []
    )[0] || null,
    years_as_pa: yearCount(cleared.years_as_pa),
    years_addiction: yearCount(cleared.years_addiction),
    addiction_pct_bucket: oneOf(cleared.addiction_pct_bucket, PCT_IDS),
    practice_model: oneOf(cleared.practice_model, MODEL_IDS),
    prescribes_moud: oneOf(cleared.prescribes_moud, MOUD_IDS),
    prescribes_other: cleared.prescribes_moud === 'yes'
      ? subset(cleared.prescribes_other, OTHER_RX_IDS)
      : [],
    telehealth_addiction: typeof cleared.telehealth_addiction === 'boolean'
      ? cleared.telehealth_addiction
      : null,
    telehealth_states: cleared.telehealth_addiction === true
      ? stateList(cleared.telehealth_states)
      : [],
    focus_areas: subset(cleared.focus_areas, FOCUS_IDS),
    mentor_open: typeof cleared.mentor_open === 'boolean' ? cleared.mentor_open : null,
    mentor_visible: cleared.mentor_visible === true,
    directory_visible: cleared.directory_visible !== false,
    directory_use_account_contact: cleared.directory_use_account_contact !== false,
    directory_email: (cleared.directory_email || '').trim() || null,
    directory_phone: (cleared.directory_phone || '').trim() || null,
    share_email: cleared.share_email !== false,
    share_phone: cleared.share_phone === true,
  };
}

export function validateProfile(form, { renewConfirm = false } = {}) {
  const errors = {};
  if (!(form.full_name || '').trim()) errors.full_name = 'Enter your full name.';
  if (!(form.state || '').trim()) errors.state = 'Choose your home state.';
  else if (!STATE_SET.has(form.state)) errors.state = 'Choose a state from the list.';
  // Renew confirm does not stop on a missing role. The collapsed card asks inline.
  // New joiners still have to choose one before they leave Profile.
  if (!renewConfirm && !CAREER_IDS.has(form.career_stage)) {
    errors.career_stage = 'Choose the role that fits you.';
  }
  if (!renewConfirm && isLicensedPaStage(form.career_stage) && typeof form.aapa_member !== 'boolean') {
    errors.aapa_member = 'Tell us whether you are a current AAPA member. We do not verify this with AAPA.';
  }
  const npi = (form.npi || '').replace(/\D/g, '');
  if (npi && !isValidNpi(npi)) errors.npi = 'NPI must be 10 digits and pass the check digit.';
  if (form.sms_opt_in && !(form.phone || '').trim()) {
    errors.phone = 'Add a mobile number to receive texts.';
  }
  const yearsAsPa = form.years_as_pa;
  if (yearsAsPa !== '' && yearsAsPa != null && yearCount(yearsAsPa) == null) {
    errors.years_as_pa = 'Enter a whole number from 0 to 60.';
  }
  const yearsAdd = form.years_addiction;
  if (yearsAdd !== '' && yearsAdd != null && yearCount(yearsAdd) == null) {
    errors.years_addiction = 'Enter a whole number from 0 to 60.';
  }
  if (
    form.directory_visible
    && form.share_email
    && form.directory_use_account_contact === false
    && !(form.directory_email || '').trim()
  ) {
    errors.directory_email = 'Add the email peers should use, or share your sign-in email.';
  }
  return errors;
}

function sameValue(a, b) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

const PATCH_KEYS = [
  'full_name', 'phone', 'sms_opt_in', 'newsletter_opt_in', 'career_stage',
  'credentials', 'npi', 'nccpa_id', 'aapa_member', 'home_city', 'state',
  'licensed_states', 'organizations', 'organization', 'city', 'practice_setting',
  'primary_practice_setting', 'years_as_pa', 'years_addiction', 'addiction_pct_bucket',
  'practice_model', 'prescribes_moud', 'prescribes_other', 'telehealth_addiction',
  'telehealth_states', 'focus_areas', 'mentor_open', 'mentor_visible',
  'directory_visible', 'directory_use_account_contact', 'directory_email',
  'directory_phone', 'share_email', 'share_phone',
];

// Only columns whose stored value changed, plus the confirmation timestamp.
export function profileWritePatch(existing, sanitized, confirmedAt) {
  const patch = {};
  for (const key of PATCH_KEYS) {
    if (!sameValue(existing?.[key] ?? null, sanitized[key] ?? null)) {
      patch[key] = sanitized[key];
    }
  }
  patch.profile_confirmed_at = confirmedAt;
  return patch;
}

export function profileGroupSummary(groupId, form) {
  const name = (form.full_name || '').trim();
  if (groupId === 'you') {
    const role = careerStageLabel(form.career_stage);
    return [name, role, form.state].filter(Boolean).join(' · ') || 'Name, role, and home state';
  }
  if (groupId === 'practice') {
    const creds = (form.credentials || '').trim();
    return [creds, form.npi ? `NPI ${form.npi}` : ''].filter(Boolean).join(' · ') || 'Credentials and identifiers';
  }
  if (groupId === 'where') {
    const org = form.organizations?.[0];
    const place = [org?.name, org?.city].filter(Boolean).join(', ');
    return place || 'Employer';
  }
  const focus = (form.focus_areas || [])
    .map((id) => FOCUS_AREAS.find((f) => f.id === id)?.label)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
  return focus || 'Addiction practice';
}

export function profileCardsStartCollapsed({ mode, profile }) {
  if (mode === 'renew') return Boolean(profile?.full_name && profile?.state);
  return Boolean(profile?.membership_status && profile?.full_name && profile?.state);
}

export const ROSTER_PROFILE_COLUMNS = [
  ['Career stage', (p) => careerStageLabel(p.career_stage) || p.career_stage || ''],
  ['Home city', (p) => p.home_city || ''],
  ['NCCPA ID', (p) => p.nccpa_id || ''],
  ['States licensed', (p) => (Array.isArray(p.licensed_states) ? p.licensed_states.join('; ') : '')],
  ['Primary practice setting', (p) => p.primary_practice_setting || ''],
  ['Years as a PA', (p) => (p.years_as_pa == null ? '' : p.years_as_pa)],
  ['Years in addiction medicine', (p) => (p.years_addiction == null ? '' : p.years_addiction)],
  ['Addiction clinical time', (p) => p.addiction_pct_bucket || ''],
  ['Practice model', (p) => p.practice_model || ''],
  ['Prescribes MOUD', (p) => p.prescribes_moud || ''],
  ['Also prescribes', (p) => (Array.isArray(p.prescribes_other) ? p.prescribes_other.join('; ') : '')],
  ['Telehealth for addiction', (p) => (p.telehealth_addiction == null ? '' : p.telehealth_addiction ? 'yes' : 'no')],
  ['Telehealth states', (p) => (Array.isArray(p.telehealth_states) ? p.telehealth_states.join('; ') : '')],
  ['Focus areas', (p) => (Array.isArray(p.focus_areas) ? p.focus_areas.join('; ') : '')],
  ['Open to mentoring', (p) => (p.mentor_open == null ? '' : p.mentor_open ? 'yes' : 'no')],
  ['Mentor on directory', (p) => (p.mentor_visible ? 'yes' : '')],
  ['Profile confirmed', (p) => (p.profile_confirmed_at ? String(p.profile_confirmed_at).slice(0, 10) : '')],
];
