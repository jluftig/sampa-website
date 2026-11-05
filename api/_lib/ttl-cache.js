function isPlainRecord(value) {
  if (value == null || typeof value !== 'object') return false;
  if (typeof value.then === 'function') return false;
  if (Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

export function plainCached(cache, key) {
  if (!cache || typeof cache.get !== 'function') return null;
  const value = cache.get(key);
  if (value != null && typeof value.then === 'function') {
    Promise.resolve(value).then(() => {}, () => {});
    return null;
  }
  if (!isPlainRecord(value)) return null;
  return value;
}

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
