#!/usr/bin/env node
// Insert a SAMPA news post as status=draft only (never published).
// For Hermes / Egg news pipeline. Secrets from environment — never commit keys.
//
// Required env:
//   SUPABASE_URL or VITE_SUPABASE_URL or SAMPA_SUPABASE_URL
//   Elevated server key (new name preferred):
//     SAMPA_SUPABASE_SECRET_KEY or SUPABASE_SECRET_KEY  (sb_secret_...)
//   Legacy still accepted if your project has not migrated:
//     SAMPA_SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SERVICE_ROLE_KEY  (JWT service_role)
//   SAMPA_AUTHOR_USER_ID   — profiles.id / auth.users id (Josh)
// Optional:
//   SAMPA_AUTHOR_NAME      — denormalized author_name (default: "Josh Luftig")
//
// Supabase key model (2025+): publishable (sb_publishable_...) replaces anon;
// secret (sb_secret_...) replaces service_role. Both elevated keys bypass RLS.
// Use secret keys for this script — never the publishable/anon key.
//
// Usage:
//   node scripts/insert-sampa-draft.mjs path/to/draft.json
//   node scripts/insert-sampa-draft.mjs --stdin < draft.json
//   node scripts/insert-sampa-draft.mjs --validate-only path/to/draft.json
//
// draft.json shape:
// {
//   "title": "...",
//   "slug": "kebab-case-2026-07",
//   "excerpt": "...",
//   "body_html": "<p>...</p>",
//   "source_name": "JAMA",
//   "source_url": "https://doi.org/...",
//   "source_published_at": "2026-07-01",   // YYYY-MM-DD or null
//   "cover_image_url": null,
//   "cover_image_caption": null,
//   "key_points": [
//     { "content": "Standalone sentence...", "tag_slugs": ["buprenorphine", "opioid-use-disorder"] }
//   ]
// }
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const args = process.argv.slice(2);
const validateOnly = args.includes('--validate-only');
const useStdin = args.includes('--stdin');
const pathArg = args.find((a) => !a.startsWith('--'));

function die(msg, code = 1) {
  console.error(msg);
  process.exit(code);
}

function loadPayload() {
  if (useStdin) {
    const text = readFileSync(0, 'utf8');
    if (!text.trim()) die('No JSON on stdin.');
    return JSON.parse(text);
  }
  if (!pathArg) {
    die(`Usage:
  node scripts/insert-sampa-draft.mjs <draft.json>
  node scripts/insert-sampa-draft.mjs --stdin < draft.json
  node scripts/insert-sampa-draft.mjs --validate-only <draft.json>`);
  }
  return JSON.parse(readFileSync(pathArg, 'utf8'));
}

function requireEnv() {
  const url =
    process.env.SAMPA_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL;
  // Prefer new secret keys (sb_secret_...); fall back to legacy service_role JWT.
  const serviceKey =
    process.env.SAMPA_SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SAMPA_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorId = process.env.SAMPA_AUTHOR_USER_ID;
  const authorName = process.env.SAMPA_AUTHOR_NAME || 'Josh Luftig';

  const missing = [];
  if (!url) missing.push('SUPABASE_URL (or VITE_SUPABASE_URL / SAMPA_SUPABASE_URL)');
  if (!serviceKey) {
    missing.push(
      'SUPABASE_SECRET_KEY / SAMPA_SUPABASE_SECRET_KEY (sb_secret_… preferred; or legacy SERVICE_ROLE_KEY)'
    );
  }
  if (!authorId) missing.push('SAMPA_AUTHOR_USER_ID');
  if (missing.length) {
    die(
      `Missing env:\n  - ${missing.join('\n  - ')}\n\nAdd to ~/.hermes/profiles/egg/.env (never commit).\nSupabase → Project Settings → API Keys: use a Secret key (sb_secret_…), not Publishable.`
    );
  }
  // Reject low-privilege client keys.
  if (
    serviceKey.startsWith('sb_publishable_') ||
    serviceKey.includes('anon') ||
    /"role"\s*:\s*"anon"/.test(Buffer.from(serviceKey.split('.')[1] || '', 'base64url').toString('utf8') || '')
  ) {
    die('Refusing to run: that looks like a publishable/anon key. Use a Secret key (sb_secret_…).');
  }
  return { url, serviceKey, authorId, authorName };
}

function validatePayload(p) {
  const errors = [];
  if (!p || typeof p !== 'object') errors.push('payload must be a JSON object');
  if (!p.title?.trim()) errors.push('title required');
  if (!p.slug?.trim()) errors.push('slug required');
  if (p.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.slug.trim())) {
    errors.push('slug must be lowercase kebab-case (a-z, 0-9, hyphens)');
  }
  if (!p.body_html?.trim()) errors.push('body_html required');
  if (p.source_url && !/^https?:\/\//i.test(p.source_url.trim())) {
    errors.push('source_url must start with http:// or https://');
  }
  if (p.source_published_at && !/^\d{4}-\d{2}-\d{2}$/.test(p.source_published_at)) {
    errors.push('source_published_at must be YYYY-MM-DD or omitted');
  }
  if (p.status && p.status !== 'draft') {
    errors.push('status must be omitted or "draft" — publishing is human-only');
  }
  if (p.published_at) {
    errors.push('published_at must not be set by this script');
  }
  const kps = p.key_points;
  if (!Array.isArray(kps) || kps.length < 1 || kps.length > 5) {
    errors.push('key_points must be an array of 1–5 items (prefer 2–3)');
  } else {
    kps.forEach((kp, i) => {
      if (!kp?.content?.trim()) errors.push(`key_points[${i}].content required`);
      if (kp.tag_slugs && !Array.isArray(kp.tag_slugs)) {
        errors.push(`key_points[${i}].tag_slugs must be an array of slugs`);
      }
    });
  }
  return errors;
}

const payload = loadPayload();
const errors = validatePayload(payload);
if (errors.length) die(`Invalid draft:\n  - ${errors.join('\n  - ')}`);

if (validateOnly) {
  console.log('OK: draft JSON validates (no DB write).');
  process.exit(0);
}

const { url, serviceKey, authorId, authorName } = requireEnv();
const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const slug = payload.slug.trim();
const { data: existing, error: existErr } = await supabase
  .from('posts')
  .select('id, status, title')
  .eq('slug', slug)
  .maybeSingle();
if (existErr) die(`Slug check failed: ${existErr.message}`);
if (existing) {
  die(`Slug already used: "${slug}" → post ${existing.id} (${existing.status}: ${existing.title})`);
}

// Resolve tag slugs → ids (do not create tags).
const allSlugs = [
  ...new Set(
    (payload.key_points || []).flatMap((kp) => (kp.tag_slugs || []).map((s) => String(s).trim()).filter(Boolean))
  ),
];
const slugToId = new Map();
const unmatched = [];
if (allSlugs.length) {
  const { data: tags, error: tagErr } = await supabase
    .from('tags')
    .select('id, slug, name')
    .in('slug', allSlugs);
  if (tagErr) die(`Tag lookup failed: ${tagErr.message}`);
  for (const t of tags || []) slugToId.set(t.slug, t.id);
  for (const s of allSlugs) {
    if (!slugToId.has(s)) unmatched.push(s);
  }
}

const postRow = {
  title: payload.title.trim(),
  slug,
  excerpt: payload.excerpt?.trim() || null,
  body_html: payload.body_html.trim(),
  cover_image_url: payload.cover_image_url || null,
  cover_image_caption: payload.cover_image_caption?.trim() || null,
  source_name: payload.source_name?.trim() || null,
  source_url: payload.source_url?.trim() || null,
  source_published_at: payload.source_published_at || null,
  author_id: authorId,
  author_name: authorName,
  status: 'draft', // HARD RULE — never published via this script
  published_at: null,
};

const { data: post, error: postErr } = await supabase
  .from('posts')
  .insert(postRow)
  .select('id, slug, status, title')
  .single();
if (postErr) die(`Post insert failed: ${postErr.message}`);

const itemIds = [];
let order = 0;
for (const kp of payload.key_points) {
  if (!kp.content?.trim()) continue;
  const { data: item, error: itemErr } = await supabase
    .from('items')
    .insert({
      post_id: post.id,
      content: kp.content.trim(),
      sort_order: order++,
    })
    .select('id')
    .single();
  if (itemErr) die(`Key point insert failed (post ${post.id} left in DB): ${itemErr.message}`);
  itemIds.push({ id: item.id, tag_slugs: kp.tag_slugs || [] });
}

for (const { id: itemId, tag_slugs } of itemIds) {
  const tagIds = [...new Set((tag_slugs || []).map((s) => slugToId.get(String(s).trim())).filter(Boolean))];
  if (!tagIds.length) continue;
  const rows = tagIds.map((tag_id) => ({ item_id: itemId, tag_id }));
  const { error: itErr } = await supabase.from('item_tags').insert(rows);
  if (itErr) die(`item_tags insert failed (post ${post.id}): ${itErr.message}`);
}

const editorPath = `/editor/${post.id}`;
console.log(JSON.stringify({
  ok: true,
  post_id: post.id,
  slug: post.slug,
  status: post.status,
  title: post.title,
  key_points: itemIds.length,
  unmatched_tag_slugs: unmatched,
  editor_path: editorPath,
  editor_url_prod: `https://www.addictionpas.org${editorPath}`,
}, null, 2));

if (unmatched.length) {
  console.error(`Note: unmatched tag slugs (not linked; add in /editor/keywords if needed): ${unmatched.join(', ')}`);
}
