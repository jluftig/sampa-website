import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { dailySitemapPaths } from '../src/lib/dailyNewsArchive.js';
import { collectRoundups } from '../src/lib/dailyNewsLoad.js';
import { collectFeatures, featureSitemapPaths } from '../src/lib/newsFeatures.js';

const dir = join(process.cwd(), 'content', 'daily-news');
const modules = {};
for (const name of readdirSync(dir)) {
  if (!name.endsWith('.json')) continue;
  modules[`/content/daily-news/${name}`] = JSON.parse(readFileSync(join(dir, name), 'utf8'));
}

const roundups = collectRoundups(modules, () => {});
const featureDir = join(process.cwd(), 'content', 'features');
const featureModules = {};
try {
  for (const name of readdirSync(featureDir)) {
    if (!name.endsWith('.json')) continue;
    featureModules[`/content/features/${name}`] = JSON.parse(readFileSync(join(featureDir, name), 'utf8'));
  }
} catch {
  /* no features directory yet */
}
const roundupsPaths = [
  ...dailySitemapPaths(roundups),
  ...featureSitemapPaths(collectFeatures(featureModules, () => {})),
];
const origin = 'https://www.addictionpas.org';
const body = roundupsPaths
  .map((path) => `  <url><loc>${origin}${path}</loc></url>`)
  .join('\n');
const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;

writeFileSync(join(process.cwd(), 'public', 'sitemap.xml'), xml);
console.log(`Wrote public/sitemap.xml (${roundups.length} dated roundups).`);
