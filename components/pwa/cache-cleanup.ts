export async function purgePwaCaches(): Promise<void> {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const cacheNames = await window.caches.keys();
  await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
}
