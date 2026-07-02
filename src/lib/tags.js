// Collect the unique set of tags used across all of a post's Key Points.
// Expects a post fetched with nested items(item_tags(tags(...))).
export function collectPostTags(post) {
  const bySlug = new Map();
  (post.items || []).forEach((item) => {
    (item.item_tags || []).forEach((link) => {
      const tag = link.tags;
      if (tag && !bySlug.has(tag.slug)) bySlug.set(tag.slug, tag);
    });
  });
  return Array.from(bySlug.values());
}
