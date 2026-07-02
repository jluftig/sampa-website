-- ============================================================================
-- OPTIONAL demo post — lets you preview how an article + tagged Key Points look
-- before the editor is built. Run it in the SQL Editor, view /news, then remove
-- it anytime with the DELETE at the bottom. Safe to ignore entirely.
-- ============================================================================
with new_post as (
  insert into public.posts (title, slug, excerpt, body_html, author_name, status, published_at)
  values (
    'Sample: Buprenorphine Access Expands in 2026',
    'sample-buprenorphine-access-2026',
    'A preview post showing how articles and tagged Key Points appear on the SAMPA news page.',
    '<p>This is a <strong>sample article</strong> to preview formatting. Replace or delete it once real posts are published.</p><h2>Why it matters</h2><p>Editors write the narrative here, then add tagged Key Points below — those points are what power tag search across all issues.</p><ul><li>Readable article body</li><li>Structured, searchable Key Points</li></ul>',
    'SAMPA Editorial',
    'published',
    now()
  )
  returning id
),
new_items as (
  insert into public.items (post_id, content, sort_order)
  select np.id, t.content, t.ord
  from new_post np,
    (values
      ('FDA finalized removal of prescriber caps for buprenorphine, broadening access for OUD treatment.', 0),
      ('Early data suggest higher induction doses improve 6-month retention.', 1),
      ('State Medicaid programs expanded coverage of extended-release formulations.', 2)
    ) as t(content, ord)
  returning id, sort_order
)
insert into public.item_tags (item_id, tag_id)
select i.id, tg.id
from new_items i
join (values
  (0, 'opioid-use-disorder'), (0, 'buprenorphine'),
  (1, 'buprenorphine'),       (1, 'research'),
  (2, 'policy-regulation'),   (2, 'buprenorphine')
) as m(ord, slug) on m.ord = i.sort_order
join public.tags tg on tg.slug = m.slug;

-- To remove the demo post later (Key Points + tag links are cleaned up automatically):
--   delete from public.posts where slug = 'sample-buprenorphine-access-2026';
