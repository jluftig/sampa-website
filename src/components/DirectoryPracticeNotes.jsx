import { FOCUS_AREAS } from '../lib/joinProfile';
import { formatPracticeSettingLabel } from '../lib/practiceSettings';

export default function DirectoryPracticeNotes({ person }) {
  if (!person) return null;
  const setting = person.primary_practice_setting
    ? formatPracticeSettingLabel(person.primary_practice_setting)
    : '';
  const focus = (Array.isArray(person.focus_areas) ? person.focus_areas : [])
    .map((id) => FOCUS_AREAS.find((area) => area.id === id)?.label)
    .filter(Boolean);
  if (!setting && focus.length === 0 && !person.mentor_open) return null;
  return (
    <div className="mt-3 space-y-1 text-sm text-text/70">
      {setting && <p>Primary setting: {setting}</p>}
      {focus.length > 0 && <p>{focus.join(', ')}</p>}
      {person.mentor_open ? <p>Open to mentoring</p> : null}
    </div>
  );
}
