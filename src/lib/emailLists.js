export const EMAIL_LIST_DEFS = [
  {
    key: 'updates',
    name: 'SAMPA Updates',
    description: 'Society announcements and a weekly roundup of SAMPA news.',
    env: 'BREVO_LIST_UPDATES',
    fallback: 3,
    profileFlag: 'newsletter_opt_in',
  },
  {
    key: 'daily',
    name: 'Daily Roundup',
    description: 'Five short items, each weekday.',
    env: 'BREVO_LIST_DAILY_NEWS',
    fallback: 15,
  },
  {
    key: 'weekly_topic',
    name: 'Weekly Topic Roundup',
    description: 'One topic a week, in its own email.',
    env: 'BREVO_LIST_WEEKLY_TOPIC',
    fallback: null,
  },
];

function positiveId(value) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function resolveEmailLists(env = {}) {
  return EMAIL_LIST_DEFS.map((def) => {
    const fromEnv = positiveId(env[def.env]);
    const listId = fromEnv || positiveId(def.fallback);
    return {
      key: def.key,
      name: def.name,
      description: def.description,
      profileFlag: def.profileFlag || null,
      listId,
      configured: Boolean(listId),
    };
  });
}

export function shapeEmailPreferences({ lists, listIds = [], emailBlacklisted = false }) {
  const ids = new Set((Array.isArray(listIds) ? listIds : []).map(Number));
  const blocked = Boolean(emailBlacklisted);
  return {
    emailBlacklisted: blocked,
    lists: lists.map((list) => ({
      key: list.key,
      name: list.name,
      description: list.description,
      configured: list.configured,
      subscribed: Boolean(list.configured && !blocked && ids.has(list.listId)),
    })),
  };
}
