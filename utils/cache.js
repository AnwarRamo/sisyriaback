import NodeCache from "node-cache";

// Create a new cache instance with a default TTL of 5 minutes
const cache = new NodeCache({ stdTTL: 300 });

export const getCache = (key) => {
  return cache.get(key);
};

export const setCache = (key, value, ttl) => {
  return cache.set(key, value, ttl);
};

export const clearCache = (key) => {
  if (key) {
    return cache.del(key);
  } else {
    return cache.flushAll();
  }
};

export default cache;
