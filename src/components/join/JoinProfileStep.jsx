import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PRACTICE_SETTINGS } from '../../lib/practiceSettings';
import { US_STATES } from '../../lib/usStates';
import {
  ADDICTION_PCT_BUCKETS,
  CAREER_STAGES,
  FOCUS_AREAS,
  MOUD_ANSWERS,
  PRACTICE_MODELS,
  PRESCRIBES_OTHER,
  PROFILE_GROUPS,
  applyConditionalClears,
  isLicensedPaStage,
  profileGroupSummary,
} from '../../lib/joinProfile';
import { emptyOrganization } from '../../lib/organizations';

function FieldError({ id, message }) {
  if (!message) return null;
  return <p id={id} className="mt-1 text-sm text-red-600">{message}</p>;
}

function TextField({ id, label, value, onChange, onBlur, error, ...rest }) {
  return (
    <label className="block text-sm font-semibold" htmlFor={id}>
      {label}
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="mt-1 min-h-12 w-full rounded-2xl border border-primary/20 px-3 text-base font-normal"
        {...rest}
      />
      <FieldError id={`${id}-error`} message={error} />
    </label>
  );
}

function Chip({ pressed, onClick, children }) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onClick}
      className={`min-h-12 rounded-full border px-3 text-sm font-semibold ${
        pressed ? 'border-primary-text bg-primary-text text-white' : 'border-primary/20 bg-white text-text'
      }`}
    >
      {children}
    </button>
  );
}

function StateChecks({ id, label, values, onChange }) {
  return (
    <fieldset>
      <legend className="text-sm font-semibold">{label}</legend>
      <div className="mt-2 max-h-40 space-y-1 overflow-y-auto rounded-2xl border border-primary/15 p-2">
        {US_STATES.map((state) => (
          <label key={state} className="flex min-h-12 items-center gap-3 px-2 text-sm">
            <input
              type="checkbox"
              checked={values.includes(state)}
              onChange={() => {
                onChange(values.includes(state) ? values.filter((item) => item !== state) : [...values, state]);
              }}
            />
            {state}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function YesNo({ name, value, onChange, error }) {
  return (
    <div role="radiogroup" aria-label={name} className="mt-2 flex flex-wrap gap-2">
      {[[true, 'Yes'], [false, 'No']].map(([answer, label]) => (
        <Chip key={label} pressed={value === answer} onClick={() => onChange(answer)}>
          {label}
        </Chip>
      ))}
      {error && <FieldError id={`${name}-error`} message={error} />}
    </div>
  );
}

export default function JoinProfileStep({
  form,
  setForm,
  errors,
  collapsed,
  onEditGroup,
  showErrors,
}) {
  const [open, setOpen] = useState(() => (
    Object.fromEntries(PROFILE_GROUPS.map((group) => [group.id, !collapsed]))
  ));
  const update = (key, value) => {
    setForm((prev) => applyConditionalClears({ ...prev, [key]: value }));
  };
  const pa = isLicensedPaStage(form.career_stage);

  const body = {
    you: (
      <div className="space-y-4">
        <TextField id="full_name" label="Full name" autoComplete="name" required value={form.full_name} onChange={(v) => update('full_name', v)} error={showErrors && errors.full_name} />
        <TextField id="email" label="Email (sign-in)" type="email" autoComplete="email" value={form.email} onChange={() => {}} readOnly />
        <TextField id="phone" label="Mobile phone" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(v) => update('phone', v)} error={showErrors && errors.phone} />
        <label className="flex min-h-12 items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1" checked={form.sms_opt_in} onChange={(e) => update('sms_opt_in', e.target.checked)} />
          <span>Text me SAMPA updates, including time-sensitive Board and advocacy asks.</span>
        </label>
        <label className="flex min-h-12 items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1" checked={form.newsletter_opt_in} onChange={(e) => update('newsletter_opt_in', e.target.checked)} />
          <span>Newsletter</span>
        </label>
        <fieldset>
          <legend className="text-sm font-semibold">I am a…</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CAREER_STAGES.map((stage) => (
              <Chip key={stage.id} pressed={form.career_stage === stage.id} onClick={() => update('career_stage', stage.id)}>
                {stage.label}
              </Chip>
            ))}
          </div>
          <FieldError id="career-error" message={showErrors && errors.career_stage} />
        </fieldset>
      </div>
    ),
    practice: (
      <div className="space-y-4">
        <TextField id="credentials" label="Credentials" placeholder="PA-C, MPAS" value={form.credentials} onChange={(v) => update('credentials', v)} />
        {pa && (
          <>
            <TextField id="npi" label="NPI" inputMode="numeric" autoComplete="off" placeholder="10 digits" value={form.npi} onChange={(v) => update('npi', v)} error={showErrors && errors.npi} />
            <TextField id="nccpa_id" label="NCCPA ID" autoComplete="off" value={form.nccpa_id} onChange={(v) => update('nccpa_id', v)} />
          </>
        )}
        {pa && (
          <fieldset>
            <legend className="text-sm font-semibold">AAPA member?</legend>
            <p className="text-xs text-text/55">Honor system. We do not verify this with AAPA.</p>
            <YesNo name="AAPA member" value={form.aapa_member} onChange={(v) => update('aapa_member', v)} error={showErrors && errors.aapa_member} />
          </fieldset>
        )}
        <TextField id="home_city" label="Home city" autoComplete="address-level2" value={form.home_city} onChange={(v) => update('home_city', v)} />
        <label className="block text-sm font-semibold" htmlFor="home_state">
          Home state
          <select id="home_state" autoComplete="address-level1" required value={form.state} onChange={(e) => update('state', e.target.value)} className="mt-1 min-h-12 w-full rounded-2xl border border-primary/20 px-3 text-base font-normal">
            <option value="">Choose a state</option>
            {US_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
          </select>
          <FieldError id="state-error" message={showErrors && errors.state} />
        </label>
        {pa && (
          <StateChecks id="licensed_states" label="State(s) licensed" values={form.licensed_states} onChange={(v) => update('licensed_states', v)} />
        )}
      </div>
    ),
    where: (
      <div className="space-y-4">
        <p className="text-sm text-text/60">Add the place you work. The first one is your primary practice. City and state here are the workplace, not your home.</p>
        {form.organizations.map((org, index) => (
          <div key={index} className="space-y-3 rounded-2xl border border-primary/10 p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{index === 0 ? 'Primary employer' : `Employer ${index + 1}`}</p>
              {form.organizations.length > 1 && (
                <button type="button" className="inline-flex min-h-12 items-center gap-1 text-sm" onClick={() => update('organizations', form.organizations.filter((_, i) => i !== index))}>
                  <Trash2 className="h-4 w-4" aria-hidden="true" /> Remove
                </button>
              )}
            </div>
            <TextField id={`org-name-${index}`} label="Employer name" value={org.name} onChange={(v) => update('organizations', form.organizations.map((item, i) => i === index ? { ...item, name: v } : item))} />
            <TextField id={`org-role-${index}`} label="Job title" value={org.role || ''} onChange={(v) => update('organizations', form.organizations.map((item, i) => i === index ? { ...item, role: v } : item))} />
            <TextField id={`org-city-${index}`} label="City" autoComplete="address-level2" value={org.city || ''} onChange={(v) => update('organizations', form.organizations.map((item, i) => i === index ? { ...item, city: v } : item))} />
            <label className="block text-sm font-semibold" htmlFor={`org-state-${index}`}>
              State
              <select id={`org-state-${index}`} value={org.state || ''} onChange={(e) => update('organizations', form.organizations.map((item, i) => i === index ? { ...item, state: e.target.value } : item))} className="mt-1 min-h-12 w-full rounded-2xl border border-primary/20 px-3 font-normal">
                <option value="">Choose a state</option>
                {US_STATES.map((state) => <option key={state} value={state}>{state}</option>)}
              </select>
            </label>
            <fieldset>
              <legend className="text-sm font-semibold">Practice settings</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {PRACTICE_SETTINGS.map((setting) => {
                  const selected = (org.practice_settings || []).includes(setting.slug);
                  return (
                    <Chip
                      key={setting.slug}
                      pressed={selected}
                      onClick={() => {
                        const practice_settings = selected
                          ? org.practice_settings.filter((slug) => slug !== setting.slug)
                          : [...(org.practice_settings || []), setting.slug];
                        update('organizations', form.organizations.map((item, i) => i === index ? { ...item, practice_settings } : item));
                      }}
                    >
                      {setting.label}
                    </Chip>
                  );
                })}
              </div>
            </fieldset>
            <TextField id={`org-web-${index}`} label="Website" inputMode="url" placeholder="https://" value={org.website || ''} onChange={(v) => update('organizations', form.organizations.map((item, i) => i === index ? { ...item, website: v } : item))} />
          </div>
        ))}
        <button type="button" className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-primary-text" onClick={() => update('organizations', [...form.organizations, emptyOrganization()])}>
          <Plus className="h-4 w-4" aria-hidden="true" /> Add another employer
        </button>
      </div>
    ),
    addiction: (
      <div className="space-y-4">
        <fieldset>
          <legend className="text-sm font-semibold">Primary practice setting</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRACTICE_SETTINGS.map((setting) => (
              <Chip key={setting.slug} pressed={form.primary_practice_setting === setting.slug} onClick={() => update('primary_practice_setting', form.primary_practice_setting === setting.slug ? '' : setting.slug)}>
                {setting.label}
              </Chip>
            ))}
          </div>
        </fieldset>
        <TextField id="years_as_pa" label="Years practicing as a PA" inputMode="numeric" value={form.years_as_pa} onChange={(v) => update('years_as_pa', v)} error={showErrors && errors.years_as_pa} />
        <TextField id="years_addiction" label="Years in addiction medicine" inputMode="numeric" value={form.years_addiction} onChange={(v) => update('years_addiction', v)} error={showErrors && errors.years_addiction} />
        <fieldset>
          <legend className="text-sm font-semibold">% of clinical time in addiction medicine</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {ADDICTION_PCT_BUCKETS.map((bucket) => (
              <Chip key={bucket.id} pressed={form.addiction_pct_bucket === bucket.id} onClick={() => update('addiction_pct_bucket', bucket.id)}>
                {bucket.label}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">Practice model</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {PRACTICE_MODELS.map((model) => (
              <Chip key={model.id} pressed={form.practice_model === model.id} onClick={() => update('practice_model', model.id)}>
                {model.label}
              </Chip>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="text-sm font-semibold">Do you prescribe MOUD?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOUD_ANSWERS.map((answer) => (
              <Chip key={answer.id} pressed={form.prescribes_moud === answer.id} onClick={() => update('prescribes_moud', answer.id)}>
                {answer.label}
              </Chip>
            ))}
          </div>
        </fieldset>
        {form.prescribes_moud === 'yes' && (
          <fieldset>
            <legend className="text-sm font-semibold">Also prescribe for alcohol or stimulant use disorder?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {PRESCRIBES_OTHER.map((answer) => {
                const selected = form.prescribes_other.includes(answer.id);
                return (
                  <Chip
                    key={answer.id}
                    pressed={selected}
                    onClick={() => update('prescribes_other', selected
                      ? form.prescribes_other.filter((id) => id !== answer.id)
                      : [...form.prescribes_other, answer.id])}
                  >
                    {answer.label}
                  </Chip>
                );
              })}
            </div>
          </fieldset>
        )}
        <fieldset>
          <legend className="text-sm font-semibold">Telehealth for addiction care?</legend>
          <YesNo name="Telehealth for addiction care" value={form.telehealth_addiction} onChange={(v) => update('telehealth_addiction', v)} />
        </fieldset>
        {form.telehealth_addiction === true && (
          <StateChecks id="telehealth_states" label="Telehealth states" values={form.telehealth_states} onChange={(v) => update('telehealth_states', v)} />
        )}
        <fieldset>
          <legend className="text-sm font-semibold">Substances and populations you mainly treat</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {FOCUS_AREAS.map((area) => {
              const selected = form.focus_areas.includes(area.id);
              return (
                <Chip
                  key={area.id}
                  pressed={selected}
                  onClick={() => update('focus_areas', selected
                    ? form.focus_areas.filter((id) => id !== area.id)
                    : [...form.focus_areas, area.id])}
                >
                  {area.label}
                </Chip>
              );
            })}
          </div>
        </fieldset>
        {pa && (
          <fieldset>
            <legend className="text-sm font-semibold">Open to mentoring or precepting students?</legend>
            <YesNo name="Open to mentoring" value={form.mentor_open} onChange={(v) => update('mentor_open', v)} />
            {form.mentor_open === true && (
              <label className="mt-2 flex min-h-12 items-center gap-3 text-sm">
                <input type="checkbox" checked={form.mentor_visible} onChange={(e) => update('mentor_visible', e.target.checked)} />
                Show this on my directory card
              </label>
            )}
          </fieldset>
        )}
        <fieldset>
          <legend className="text-sm font-semibold">Directory</legend>
          <label className="mt-2 flex min-h-12 items-center gap-3 text-sm">
            <input type="checkbox" checked={form.directory_visible} onChange={(e) => update('directory_visible', e.target.checked)} />
            Show me in the member directory
          </label>
          <label className="flex min-h-12 items-center gap-3 text-sm">
            <input type="checkbox" checked={form.share_email} onChange={(e) => update('share_email', e.target.checked)} />
            Share email with members
          </label>
          <label className="flex min-h-12 items-center gap-3 text-sm">
            <input type="checkbox" checked={form.share_phone} onChange={(e) => update('share_phone', e.target.checked)} />
            Share phone with members
          </label>
          <label className="flex min-h-12 items-center gap-3 text-sm">
            <input type="checkbox" checked={form.directory_use_account_contact} onChange={(e) => update('directory_use_account_contact', e.target.checked)} />
            Use my sign-in email and phone
          </label>
          {form.directory_use_account_contact === false && (
            <>
              <TextField id="directory_email" label="Directory email" type="email" autoComplete="email" value={form.directory_email} onChange={(v) => update('directory_email', v)} error={showErrors && errors.directory_email} />
              <TextField id="directory_phone" label="Directory phone" type="tel" autoComplete="tel" value={form.directory_phone} onChange={(v) => update('directory_phone', v)} />
            </>
          )}
        </fieldset>
        <p className="text-xs text-text/50">Home city, license states, clinical time, practice model, prescribing, and telehealth states stay off the directory. Staff can see them on the roster.</p>
      </div>
    ),
  };

  return (
    <div className="space-y-3">
      {PROFILE_GROUPS.map((group) => {
        const isOpen = open[group.id];
        return (
          <section key={group.id} className="rounded-3xl border border-primary/10 bg-white">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <h2 className="font-semibold">{group.title}</h2>
                {!isOpen && <p className="truncate text-sm text-text/60">{profileGroupSummary(group.id, form)}</p>}
              </div>
              <button
                type="button"
                className="min-h-12 shrink-0 px-2 text-sm font-semibold text-primary-text"
                aria-expanded={isOpen}
                onClick={() => {
                  setOpen((prev) => ({ ...prev, [group.id]: !prev[group.id] }));
                  if (!isOpen) onEditGroup?.(group.id);
                }}
              >
                {isOpen ? 'Hide' : 'Edit'}
              </button>
            </div>
            {isOpen && <div className="border-t border-primary/10 px-4 py-4">{body[group.id]}</div>}
          </section>
        );
      })}
    </div>
  );
}
