// Member discussion helpers shared by web + mobile (sampa-shared/comments).
// Keep reaction keys in sync with the post_reactions_emoji_check constraint.

export const MAX_COMMENT_LENGTH = 500;

/** @typedef {'thumbs_up' | 'celebrate' | 'insight' | 'heart' | 'clap'} ReactionKey */

/** @type {{ key: ReactionKey, glyph: string, label: string }[]} */
export const REACTIONS = [
  { key: 'thumbs_up', glyph: '👍', label: 'Thumbs up' },
  { key: 'celebrate', glyph: '🎉', label: 'Celebrate' },
  { key: 'insight', glyph: '‼️', label: 'Important' },
  { key: 'heart', glyph: '❤️', label: 'Appreciate' },
  { key: 'clap', glyph: '👏', label: 'Well said' },
];

const REACTION_KEYS = new Set(REACTIONS.map((r) => r.key));

/** @param {string} key */
export function isReactionKey(key) {
  return REACTION_KEYS.has(key);
}

/** @param {string} key */
export function reactionGlyph(key) {
  return REACTIONS.find((r) => r.key === key)?.glyph ?? '';
}

/** @param {string} key */
export function reactionLabel(key) {
  return REACTIONS.find((r) => r.key === key)?.label ?? '';
}

/**
 * Aggregate reaction rows into counts + the current user's pick.
 * @param {{ user_id: string, emoji: string }[]} rows
 * @param {string | null | undefined} userId
 */
export function summarizeReactions(rows, userId) {
  /** @type {Record<string, number>} */
  const counts = {};
  for (const r of REACTIONS) counts[r.key] = 0;
  let mine = null;
  for (const row of rows || []) {
    if (!isReactionKey(row.emoji)) continue;
    counts[row.emoji] = (counts[row.emoji] || 0) + 1;
    if (userId && row.user_id === userId) mine = row.emoji;
  }
  return { counts, mine };
}

/** Trim + validate a comment body. Returns { ok, body, error }. */
export function normalizeCommentBody(raw) {
  const body = String(raw ?? '').trim().replace(/\s+/g, ' ');
  if (!body) return { ok: false, body: '', error: 'Write a brief comment first.' };
  if (body.length > MAX_COMMENT_LENGTH) {
    return {
      ok: false,
      body,
      error: `Keep it under ${MAX_COMMENT_LENGTH} characters.`,
    };
  }
  return { ok: true, body, error: null };
}
