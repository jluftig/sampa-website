// Controlled vocabulary for the weekday roundup. Matching is exact
// keyword/synonym rules (see dailyNewsArchive.js). Slugs are stable URL ids.
// Josh's short form in copy is "bup". The chip label stays the full word.

export const DAILY_VOCABULARY = [
  {
    slug: 'buprenorphine',
    label: 'buprenorphine',
    patterns: ['buprenorphine', 'suboxone', 'sublocade', 'brixadi', 'bup'],
  },
  {
    slug: 'methadone',
    label: 'methadone',
    patterns: ['methadone'],
  },
  {
    slug: 'fentanyl',
    label: 'fentanyl',
    patterns: ['fentanyl', 'carfentanil', 'carfentanyl'],
  },
  {
    slug: 'naloxone',
    label: 'naloxone',
    patterns: ['naloxone', 'narcan', 'nalmefene'],
  },
  {
    slug: 'kratom',
    label: 'kratom / 7-OH',
    patterns: ['kratom', '7-oh', '7-hydroxymitragynine'],
  },
  {
    slug: 'alcohol',
    label: 'alcohol',
    patterns: ['alcohol', 'ethanol'],
  },
  {
    slug: 'stimulants',
    label: 'stimulants',
    patterns: ['stimulant', 'stimulants', 'methamphetamine', 'cocaine', 'amphetamine'],
  },
  {
    slug: 'policy',
    label: 'policy',
    patterns: ['policy', 'medicaid', 'medicare', 'osha', 'hrsa', 'samhsa', 'regulation', 'regulations', 'cdc'],
  },
  {
    slug: 'harm-reduction',
    label: 'harm reduction',
    patterns: ['harm reduction', 'syringe service', 'overdose prevention'],
  },
  {
    slug: 'treatment-access',
    label: 'treatment access',
    patterns: ['treatment access', 'access gap', 'rural'],
  },
  {
    slug: 'research',
    label: 'research',
    patterns: ['randomized', 'clinical trial', 'meta-analysis', 'systematic review'],
  },
];
