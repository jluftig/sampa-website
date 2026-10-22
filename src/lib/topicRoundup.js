import { isRealIsoDate, formatRoundupDate } from './dailyNewsLoad.js';

function payloadOf(mod) {
  if (mod && typeof mod === 'object' && mod.default && typeof mod.default === 'object') {
    return mod.default;
  }
  return mod;
}

function stemOf(path) {
  const base = String(path).split('/').pop() || '';
  return base.replace(/\.json$/i, '');
}

function trimmed(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function httpsUrl(value) {
  const url = trimmed(value);
  return url.startsWith('https://') ? url : '';
}

function yearText(year) {
  if (typeof year === 'number' && Number.isInteger(year) && year >= 1000 && year <= 9999) {
    return String(year);
  }
  if (typeof year === 'string' && /^\d{4}$/.test(year)) return year;
  return '';
}

function stringList(value) {
  if (!Array.isArray(value)) return null;
  const lines = [];
  for (const entry of value) {
    const line = trimmed(entry);
    if (!line) return null;
    lines.push(line);
  }
  return lines;
}

function readingLead(author, title, year) {
  const name = author.endsWith('.') ? author : `${author}.`;
  return `${name} ${title} (${year}). `;
}

function skip(reason) {
  return { ok: false, reason };
}

function parseFile(path, mod) {
  const stem = stemOf(path);
  if (!isRealIsoDate(stem)) return skip('filename is not a real ISO date');

  const data = payloadOf(mod);
  if (!data || typeof data !== 'object' || Array.isArray(data)) return skip('file is not an object');
  if (data.date !== stem) return skip('date does not match filename');

  const title = trimmed(data.title);
  if (!title) return skip('title is empty');

  if (!Array.isArray(data.items) || data.items.length !== 5) {
    return skip('items is not an array of length 5');
  }

  const items = [];
  for (const item of data.items) {
    const headline = trimmed(item?.headline);
    const outlet = trimmed(item?.outlet);
    const date = trimmed(item?.date);
    const summary = trimmed(item?.summary);
    const url = httpsUrl(item?.url);
    if (!headline || !outlet || !date || !summary || !url) {
      return skip('an item lacks trimmed headline, outlet, date, summary, or an https URL');
    }
    items.push({ headline, outlet, date, summary, url });
  }

  if (!Array.isArray(data.furtherReading)) return skip('furtherReading is not an array');

  const furtherReading = [];
  for (const entry of data.furtherReading) {
    const author = trimmed(entry?.author);
    const entryTitle = trimmed(entry?.title);
    const doi = trimmed(entry?.doi);
    const href = httpsUrl(entry?.url);
    const year = yearText(entry?.year);
    if (!author || !entryTitle || !doi || !href || !year || /\s/.test(doi) || doi.startsWith('http')) {
      return skip('a furtherReading entry lacks trimmed author, title, doi, or an https URL, or year is not a number or a 4-digit string');
    }
    furtherReading.push({
      lead: readingLead(author, entryTitle, year),
      doi,
      href,
    });
  }

  const consideredSkipped = stringList(data.consideredSkipped);
  if (!consideredSkipped) return skip('consideredSkipped is not an array of non-empty strings');

  const notes = stringList(data.notes);
  if (!notes) return skip('notes is not an array of non-empty strings');

  if ('draft' in data && data.draft !== true && data.draft !== false) {
    return skip('draft is not true or false');
  }

  return {
    ok: true,
    issue: {
      date: stem,
      title,
      weekday: formatRoundupDate(stem),
      banner: data.draft === true ? 'Draft - pending clinical review' : null,
      path: `/news/topic/${stem}`,
      items,
      furtherReading,
      consideredSkipped,
      notes,
    },
  };
}

export function topicPage(date, modules, warn = console.warn) {
  const issues = [];
  for (const [path, mod] of Object.entries(modules || {})) {
    const parsed = parseFile(path, mod);
    if (!parsed.ok) {
      warn(`topic-roundup: skipping ${path}: ${parsed.reason}`);
      continue;
    }
    issues.push(parsed.issue);
  }
  issues.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  if (date == null || date === '') {
    if (issues.length === 0) return { status: 'empty' };
    return { status: 'issue', issue: { ...issues[0], isLatest: true } };
  }
  if (typeof date !== 'string' || !isRealIsoDate(date)) return { status: 'not-found' };

  const issue = issues.find((row) => row.date === date);
  if (!issue) return { status: 'not-found' };
  return {
    status: 'issue',
    issue: { ...issue, isLatest: issue.date === issues[0].date },
  };
}
