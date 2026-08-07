import React from 'react';
import {
  PRACTICE_SETTINGS,
  collectPracticeSettings,
  formatPracticeSettingLabel,
  practiceSettingChipClass,
} from '../lib/practiceSettings';
import { legacyPracticeSettingText } from '../lib/organizations';

const CHIP_SHELL =
  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-data font-semibold';

/** Read-only practice-setting chips (news keyword shell + soft semantic tints). */
export function PracticeSettingChips({ slugs, className = '' }) {
  if (!slugs?.length) return null;
  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`.trim()}>
      {slugs.map((slug) => (
        <span
          key={slug}
          title={formatPracticeSettingLabel(slug)}
          className={`${CHIP_SHELL} ${practiceSettingChipClass(slug)}`}
        >
          {formatPracticeSettingLabel(slug)}
        </span>
      ))}
    </div>
  );
}

/** Union chips for a directory person, or legacy muted text if none structured. */
export function PersonPracticeSettings({ person, className = '' }) {
  const slugs = collectPracticeSettings(person);
  if (slugs.length) {
    return <PracticeSettingChips slugs={slugs} className={className} />;
  }
  const legacy = legacyPracticeSettingText(person);
  if (!legacy) return null;
  return <div className={`text-text/45 text-sm ${className}`.trim()}>{legacy}</div>;
}

/** Multi-select toggle row for Dashboard org editors. */
export function PracticeSettingPicker({ selected, onChange, otherNote, onOtherNoteChange }) {
  const selectedSet = new Set(selected || []);

  function toggle(slug) {
    const next = selectedSet.has(slug)
      ? (selected || []).filter((s) => s !== slug)
      : [...(selected || []), slug];
    onChange(next);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {PRACTICE_SETTINGS.map((s) => {
          const isOn = selectedSet.has(s.slug);
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() => toggle(s.slug)}
              title={s.label}
              className={`${CHIP_SHELL} transition-colors ${
                isOn
                  ? 'bg-primary-text text-white'
                  : `${s.chipClass} hover:opacity-80`
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
      {selectedSet.has('other') && (
        <input
          type="text"
          value={otherNote || ''}
          onChange={(e) => onOtherNoteChange?.(e.target.value)}
          placeholder="Describe other setting (optional)"
          className="mt-2 w-full px-3 py-2 rounded-xl border border-primary/20 focus:outline-none focus:border-primary text-sm"
          maxLength={120}
        />
      )}
    </div>
  );
}
