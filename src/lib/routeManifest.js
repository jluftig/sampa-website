// Ordered route table. First match wins. App, the sitemap, share rewrites,
// and the /news/daily/archive redirect all read this list.
// npm run test:routes fails when vercel.json, the sitemap, or an in-app link drifts.

export const CRAWLER_USER_AGENT =
  '.*(facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|Slack-ImgProxy|TelegramBot|WhatsApp|Discordbot|Pinterestbot|redditbot|SkypeUriPreview|vkShare).*';

const BOARD_DENIED =
  'Board meeting agendas and minutes are a benefit of active SAMPA membership. Join to read this year’s Board meeting schedule, agendas, and approved minutes.';

function crawlerRewrite(source, destination) {
  return {
    source,
    destination,
    crawlerOnly: true,
  };
}

export const routes = [
  { path: '/', page: 'Home', sitemap: true },
  { path: '/news', page: 'News', sitemap: true },
  { path: '/news/daily', page: 'DailyRoundup', sitemap: true },
  { path: '/news/daily/archive', redirect: '/news/daily', permanent: true },
  { path: '/news/daily/tag/:slug', page: 'DailyTagView' },
  {
    path: '/news/daily/:date',
    page: 'DailyRoundup',
    sitemap: 'daily-dates',
    share: crawlerRewrite(
      '/news/daily/:date(\\d{4}-\\d{2}-\\d{2})',
      '/api/share?slug=daily&date=:date',
    ),
  },
  { path: '/news/topic', page: 'TopicRoundup' },
  {
    path: '/news/topic/:date',
    page: 'TopicRoundup',
    share: crawlerRewrite(
      '/news/topic/:date(\\d{4}-\\d{2}-\\d{2})',
      '/api/share?slug=topic&date=:date',
    ),
  },
  {
    path: '/news/features/:slug',
    page: 'FeatureArticle',
    sitemap: 'features',
    share: {
      destination: '/api/share?slug=feature&feature=:slug',
      crawlerOnly: false,
    },
  },
  { path: '/__preview/suggested-tags', page: 'SuggestedDailyTags', devOnly: true },
  { path: '/__preview/email-choices', page: 'EmailChoicesPreview', devOnly: true },
  { path: '/__preview/join', page: 'JoinPreview', devOnly: true },
  { path: '/__preview/directory-badges', page: 'DirectoryBadgePreview', devOnly: true },
  { path: '/__preview/survey', page: 'AnnualSurvey', devOnly: true },
  {
    path: '/news/:slug',
    page: 'PostView',
    share: crawlerRewrite('/news/:slug', '/api/share?slug=:slug'),
  },
  { path: '/policy', page: 'Policy' },
  { path: '/policy/:slug', page: 'PolicyView' },
  { path: '/keywords', page: 'Tags' },
  { path: '/keywords/:slug', page: 'TagView' },
  { path: '/search', page: 'Search' },
  { path: '/login', page: 'Login' },
  { path: '/join', page: 'Join' },
  { path: '/renew', page: 'Join' },
  { path: '/join/invoice', page: 'JoinInvoice' },
  { path: '/survey/:year', page: 'AnnualSurvey', gate: 'RequireAuth' },
  { path: '/donate', page: 'Donate' },
  { path: '/giveaway', page: 'Giveaway' },
  { path: '/about', page: 'About' },
  { path: '/resources', page: 'Resources' },
  { path: '/caq', page: 'Caq' },
  { path: '/privacy', page: 'Privacy' },
  { path: '/newsletter-confirmed', page: 'NewsletterConfirmed' },
  { path: '/subscriptions', page: 'Subscriptions' },
  { path: '/terms', page: 'Terms' },
  { path: '/dashboard', page: 'Dashboard', gate: 'RequireAuth' },
  { path: '/dashboard/emails', page: 'EmailChoices', gate: 'RequireAuth' },
  { path: '/members', page: 'MemberDirectory', gate: 'RequireActiveMember' },
  { path: '/members/:id', page: 'MemberProfile', gate: 'RequireActiveMember' },
  {
    path: '/board',
    page: 'BoardMeetings',
    gate: 'RequireActiveMember',
    gateProps: { deniedCopy: BOARD_DENIED },
  },
  { path: '/board/dashboard', page: 'BoardDashboard', gate: 'RequireBoardDashboard' },
  {
    path: '/board/:slug',
    page: 'BoardMeetingView',
    gate: 'RequireActiveMember',
    gateProps: { deniedCopy: BOARD_DENIED },
  },
  { path: '/editor', page: 'EditorDashboard', gate: 'RequireEditor' },
  { path: '/editor/new', page: 'PostEditor', gate: 'RequireEditor' },
  { path: '/editor/keywords', page: 'AdminTags', gate: 'RequireEditor', gateProps: { adminOnly: true } },
  {
    path: '/editor/daily-tags',
    page: 'SuggestedDailyTags',
    gate: 'RequireEditor',
    gateProps: { adminOnly: true, adminDenied: 'Suggested tags are limited to administrators.' },
  },
  { path: '/editor/people', page: 'AdminPeople', gate: 'RequireEditor', gateProps: { adminOnly: true } },
  {
    path: '/editor/records',
    page: 'AdminRecords',
    gate: 'RequireEditor',
    gateProps: { adminOnly: true, adminDenied: 'Board records and the Relay balance are limited to administrators.' },
  },
  { path: '/editor/members', page: 'AdminMembers', gate: 'RequireMemberViewer' },
  { path: '/editor/policy', page: 'PolicyWorkHub', gate: 'RequirePolicyWork' },
  { path: '/editor/:id', page: 'PostEditor', gate: 'RequireEditor' },
  { path: '*', page: 'NotFound' },
];

export function staticSitemapPaths() {
  return routes.filter((route) => route.sitemap === true).map((route) => route.path);
}

export function listsDailyDates() {
  return routes.some((route) => route.sitemap === 'daily-dates');
}

export function listsFeatures() {
  return routes.some((route) => route.sitemap === 'features');
}

function crawlerHas() {
  return [{ type: 'header', key: 'user-agent', value: CRAWLER_USER_AGENT }];
}

export function shareRewrites() {
  return routes.filter((route) => route.share).map((route) => {
    const rule = { source: route.share.source || route.path };
    if (route.share.crawlerOnly) rule.has = crawlerHas();
    rule.destination = route.share.destination;
    return rule;
  });
}

export function expectedRewrites() {
  return [
    {
      source: '/api/board-meetings',
      destination: '/api/newsletter-stats?section=board',
    },
    ...shareRewrites(),
    {
      source: '/((?!api/|.*\\.[a-zA-Z0-9]+$).*)',
      destination: '/index.html',
    },
  ];
}

export function routeRedirects() {
  return routes.filter((route) => route.redirect).map((route) => ({
    source: route.path,
    destination: route.redirect,
    permanent: route.permanent !== false,
  }));
}

export function pathMatches(pattern, pathname) {
  if (pattern === pathname) return true;
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  if (patternParts.length !== pathParts.length) return false;
  return patternParts.every((part, index) => part.startsWith(':') || part === pathParts[index]);
}

export function matchRoute(pathname) {
  return routes.find((route) => route.path !== '*' && pathMatches(route.path, pathname)) || null;
}
