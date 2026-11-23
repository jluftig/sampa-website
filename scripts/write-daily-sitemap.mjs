import { readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dailySitemapPaths } from '../src/lib/dailyNewsArchive.js';
import { collectRoundups } from '../src/lib/dailyNewsLoad.js';
import { listsFeatures } from '../src/lib/routeManifest.js';
import { collectFeatures, featureSitemapPaths } from '../src/lib/newsFeatures.js';

function loadJsonDir(dir, prefix) {
  const modules = {};
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return modules;
  }
  for (const name of names) {
    if (!name.endsWith('.json')) continue;
    modules[`${prefix}${name}`] = JSON.parse(readFileSync(join(dir, name), 'utf8'));
  }
  return modules;
}

export function buildSitemapXml() {
  const roundups = collectRoundups(
    loadJsonDir(join(process.cwd(), 'content', 'daily-news'), '/content/daily-news/'),
    () => {},
  );
  const paths = [...dailySitemapPaths(roundups)];
  if (listsFeatures()) {
    const features = collectFeatures(
      loadJsonDir(join(process.cwd(), 'content', 'features'), '/content/features/'),
      () => {},
    );
    paths.push(...featureSitemapPaths(features));
  }
  const origin = 'https://www.addictionpas.org';
  const body = paths.map((path) => `  <url><loc>${origin}${path}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

function runningThisFile() {
  if (!process.argv[1]) return false;
  return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url));
}

if (runningThisFile()) {
  const xml = buildSitemapXml();
  writeFileSync(join(process.cwd(), 'public', 'sitemap.xml'), xml);
  const dated = (xml.match(/\/news\/daily\/\d{4}-\d{2}-\d{2}/g) || []).length;
  console.log(`Wrote public/sitemap.xml (${dated} dated roundups).`);
}
