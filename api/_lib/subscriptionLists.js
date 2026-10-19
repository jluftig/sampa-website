// The only registry of public subscription lists. Ids and template ids
// stay in Vercel env. Do not put numeric Brevo ids in this file.

export const subscriptionLists = [
  {
    key: 'daily',
    listEnv: 'BREVO_LIST_DAILY_NEWS',
    templateEnv: 'BREVO_DOI_TEMPLATE_ID_DAILY',
    templateOptional: false,
    redirectQuery: 'list=daily',
    source: 'manage_daily',
  },
  {
    key: 'weekly',
    listEnv: 'BREVO_LIST_UPDATES',
    templateEnv: 'BREVO_DOI_TEMPLATE_ID',
    templateOptional: false,
    redirectQuery: null,
    source: 'manage_weekly',
  },
  {
    key: 'topic',
    listEnv: 'BREVO_LIST_TOPIC',
    templateEnv: 'BREVO_DOI_TEMPLATE_TOPIC',
    templateOptional: true,
    redirectQuery: 'list=topic',
    source: 'manage_topic',
  },
];
