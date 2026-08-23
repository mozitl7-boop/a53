const stores: Map<string, number[]> = new Map();

export function isAllowed(key: string, limit = 5, windowMs = 60 * 1000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  const arr = stores.get(key) || [];
  // keep only recent timestamps
  const recent = arr.filter((t) => t > windowStart);
  if (recent.length >= limit) {
    return false;
  }
  recent.push(now);
  stores.set(key, recent);
  return true;
}

export function resetKey(key: string) {
  stores.delete(key);
}

export default { isAllowed, resetKey };