export function createTtlCache() {
  const store = new Map();
  return {
    get(key) {
      const hit = store.get(key);
      if (!hit) return null;
      if (hit.expires <= Date.now()) {
        store.delete(key);
        return null;
      }
      return hit.value;
    },
    set(key, value, ttlMs) {
      store.set(key, { value, expires: Date.now() + ttlMs });
    },
  };
}
